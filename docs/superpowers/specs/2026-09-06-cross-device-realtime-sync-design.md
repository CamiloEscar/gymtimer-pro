# Cross-Device Realtime Sync (Phase 2) — Design

## Context

GymTimer Pro's Trainer↔Display sync currently runs on the browser's
`BroadcastChannel` API (`src/lib/session/SessionChannel.ts`), which only
communicates between tabs/windows of the **same browser on the same
device**. The user's actual use case — build/run a workout from a phone,
show the live timer on a separate TV or a PC/laptop connected to that TV —
requires messages to cross physical devices over the network, which
`BroadcastChannel` cannot do. This was already flagged as a known Phase 1
limitation and a Phase 2 roadmap item; this spec is that Phase 2.

## Revision note

This spec originally chose Supabase Realtime. That was abandoned mid-setup
when the user hit their Supabase account's free-tier project limit and
didn't want to manage/delete existing projects to make room. **Backend is
now Pusher Channels.** Everything below reflects Pusher; no Supabase code
was ever written (the pivot happened during account setup, before any
implementation task ran), so there is nothing to undo in the codebase.

## Decisions made during brainstorming

- **Backend:** Pusher Channels. Chosen over Ably (very similar
  proposition) mainly on the user's preference; both have workable free
  tiers and neither has the "N projects per account" ceiling that blocked
  Supabase.
- **Channel type: Presence channel (`presence-gymtimer-session-<code>`),
  not a public channel.** Pusher's client-to-client "client events" (the
  mechanism that lets the Trainer's browser publish directly to the
  Display's browser without round-tripping through our own server on
  every tick) are **only permitted on presence or private channels** —
  public channels can't receive client-published events at all. This
  forces the presence-channel choice; it isn't optional the way it was
  with Supabase's broadcast-on-any-channel model.
- **A minimal server-side auth endpoint is required.** Presence/private
  channels require each client's channel subscription to be authenticated
  by a signature computed with the app's secret key — that computation
  cannot safely happen in the browser (it would leak the secret). This
  means one new Next.js Route Handler, `POST /api/pusher/auth`, is added.
  This is the one place this design's "no backend" framing changes: it's
  a small serverless function (bundled with the site, deployed for free
  on Vercel's Hobby tier), not a persistent server, and it holds no
  business logic — it only verifies "this browser may join this specific
  channel" and returns a signed auth response. The user explicitly
  approved this trade-off over the alternative (public channel + a
  hand-rolled heartbeat protocol), because that alternative would have
  reintroduced the exact flicker bug Presence is meant to fix.
- **Client events must be throttled.** `TimerEngine` (`src/lib/timer/
  TimerEngine.ts:9`) ticks every 100ms — 10 times/second — and every tick
  currently propagates through `WorkoutEngine` to a `SessionChannel.
  sendState()` call. Pusher client events are capped at roughly 10/second
  per client, so sending on every tick sits right at that ceiling with no
  margin, and burns through the free tier's daily message quota fast (a
  single 30-minute session at 10/s is 18,000 messages against a ~200k/day
  budget). `SessionChannel.sendState()` gets a **trailing-edge throttle**:
  at most one actual `client-state` event goes out per ~200ms window: the
  first call in a window sends
  immediately, later calls within the same window are coalesced and the
  *last* one is sent when the window closes, so a rapid burst never gets
  silently dropped (critical for reaching phase-transition and "finished"
  states — those must never be lost, only delayed by at most one window).
  ~5 updates/second is still visually smooth for a countdown a human reads
  by eye.
- **Presence for connection status, same as the original design intent.**
  Pusher presence channels fire `pusher:member_added` /
  `pusher:member_removed` events with real channel-membership semantics
  (not a heartbeat/timeout guess) — this still fully replaces the current
  `disconnectTimer`/5-second-silence hack and fixes the pause-flicker bug,
  exactly as originally planned with Supabase, just via Pusher's own
  presence primitive instead.
- **Late-join resync**, same mechanism as before: when the Display's
  member-added event fires and is observed by the Trainer's channel
  instance, the Trainer immediately re-sends its last-known state (through
  the same throttle) rather than waiting for the next natural tick.

## Architecture

`SessionChannel`'s **public interface stays exactly as-is**:
`constructor(code, role)`, `sendState(state)`, `onState(listener)`,
`onConnectionStatusChange(listener)`, `getConnectionStatus()`,
`destroy()`. Only its internals change — `WorkoutEngine` and every UI
component that consumes `SessionChannel` need zero changes.

Internally:
- A new `src/lib/session/pusherClient.ts` creates one shared `Pusher`
  client (from the `pusher-js` package) using
  `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER`, configured
  with `channelAuthorization: { endpoint: "/api/pusher/auth", transport:
  "ajax" }`. Throws immediately if either var is missing, same fail-loud
  pattern as the Supabase version would have had.
- A new Route Handler at `src/app/api/pusher/auth/route.ts` uses the
  `pusher` (server) package with `PUSHER_APP_ID`, `PUSHER_KEY`,
  `PUSHER_SECRET`, `PUSHER_CLUSTER` (all server-only, no `NEXT_PUBLIC_`
  prefix) to authorize any subscription request for a
  `presence-gymtimer-session-*` channel — this app has no user accounts,
  so there is nothing to check beyond the channel name pattern; every
  request presenting a valid-shaped channel name is authorized, and the
  presence `user_id` is a random per-tab id (not tied to any real
  identity), since this system doesn't have one.
- `SessionChannel` subscribes to `presence-gymtimer-session-<code>` via
  `pusherClient.subscribe(...)`, binds `client-state` (the client event
  carrying `SessionState`) and the channel's built-in
  `pusher:subscription_succeeded` / `pusher:member_added` /
  `pusher:member_removed` events to derive `ConnectionStatus` — connected
  if the *other* role's member is present in `channel.members`,
  disconnected otherwise.
- `sendState()` becomes (through the throttle described above)
  `channel.trigger("client-state", state)`.
- The Trainer-role instance additionally reacts to `pusher:member_added`
  for a member whose `role` info (set via the auth endpoint's
  `presence.user_info`) is `"display"`, and on that event re-sends its
  last-known state.

## Data flow

1. Trainer opens the run panel → `new SessionChannel(code, "trainer")` →
   subscribes to `presence-gymtimer-session-<code>` (browser calls
   `/api/pusher/auth`, gets a signed auth response, completes the
   subscription).
2. Display opens `/display/[code]` → same subscription flow with
   `role: "display"`.
3. Pusher fires `pusher:member_added` for the Display on the Trainer's
   channel instance → Trainer re-triggers its last-known state
   immediately.
4. From then on, every throttled `WorkoutEngine` tick →
   `channel.trigger("client-state", state)` → Pusher relays it →
   Display's bound listener fires → `onState` listeners fire.
5. `pusher:member_added` / `pusher:member_removed` update
   `ConnectionStatus` on both ends in real time — including on an
   *ungraceful* disconnect (closed tab, lost wifi, killed browser),
   because Pusher's own server detects the dropped socket and fires
   `member_removed` without needing our code to detect anything.

## Error handling

- Missing/invalid client env vars: `pusherClient.ts` throws synchronously
  at import time, naming the missing var.
- Missing/invalid server env vars: `/api/pusher/auth` returns a 500 with a
  clear message if `PUSHER_APP_ID`/`PUSHER_KEY`/`PUSHER_SECRET`/
  `PUSHER_CLUSTER` aren't configured — this fails loudly in dev/preview
  rather than silently rejecting every subscription.
- Auth endpoint rejects malformed channel names (anything not matching
  `presence-gymtimer-session-<code>`) with a 403, so the endpoint can't be
  abused to authorize joining an arbitrary Pusher app-wide channel.
- Network drop: `pusher-js` auto-reconnects; while disconnected, the local
  side simply sees no `member_added`/keeps its last known
  `ConnectionStatus` until Pusher's own reconnect logic re-establishes
  membership.

## Testing

`src/lib/session/__tests__/SessionChannel.test.ts` is rewritten against a
mocked `pusher-js`: `vi.mock("pusher-js", ...)` provides a fake
`Pusher`/`Channel` whose `.subscribe()`, `.bind()`, `.trigger()`, and
`.members` are wired through a small in-memory "room" keyed by channel
name (same technique the Supabase-era draft used, adapted to Pusher's
event names: `client-state`, `pusher:subscription_succeeded`,
`pusher:member_added`, `pusher:member_removed`). Cases to cover: state
delivered trainer→display; no delivery across different codes; connection
status flips to connected/disconnected on member add/remove; a
mid-session display join triggers an automatic resend; **rapid
`sendState()` calls within one throttle window are coalesced to a single
trigger carrying the last state** (this is a new, Pusher-specific
behavior with no Supabase-era equivalent, and needs its own test using
`vi.useFakeTimers()`).

`src/app/api/pusher/auth/route.ts` gets its own test: valid channel name +
env vars present → 200 with an auth signature in the body; malformed
channel name → 403; missing server env vars → 500.

## Setup prerequisite (manual, not delegable to a background agent)

Creating the Pusher app requires an interactive signup — done once, with
the user present, before any implementation task can run (the
implementation needs real `PUSHER_APP_ID` / `NEXT_PUBLIC_PUSHER_KEY` /
`PUSHER_SECRET` / `NEXT_PUBLIC_PUSHER_CLUSTER` values to write a working
`pusherClient.ts` and auth route). This is Task 0 in the implementation
plan.
