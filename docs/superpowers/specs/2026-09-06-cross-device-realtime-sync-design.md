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

## Decisions made during brainstorming

- **Backend:** Supabase Realtime, installed via the Vercel Marketplace
  integration. Chosen over Pusher/Ably because Supabase is already the
  project's stated future direction for Phase 3/4 (accounts, athletes,
  results) — starting here avoids introducing a second backend vendor
  later just to add a database.
- **Transport primitive:** Supabase Realtime **Broadcast** (pub/sub over a
  named channel), not Postgres Changes / a database table. The workout
  timer state is inherently ephemeral (ticks every second); persisting it
  to Postgres would burn free-tier write quota for data nobody needs after
  the session ends. No table, no schema, no RLS policies — the channel is
  **not** marked `private`, so no Realtime Authorization setup is needed
  either. The session code (already a CSPRNG-generated 6-character code,
  per the existing `generateCode.ts` hardening) is the shared secret, the
  same trust model as a Zoom meeting link.
- **BroadcastChannel is removed, not kept as a fallback.** The user
  confirmed same-device sync has no value now that the real use case is
  cross-device — keeping two transports would be dead weight. This means
  the app now **requires** Supabase credentials to run at all, even in
  local dev; Phase 1's "zero env vars" property is intentionally given up.
- **Connection status via Presence, replacing the heartbeat/timeout hack.**
  Today's `SessionChannel` infers "connected" from "received a message in
  the last 5 seconds," which is why the indicator flickers during long
  pauses (no ticks are sent while paused). Supabase Realtime's Presence
  feature tracks actual channel membership — a side is "connected" exactly
  when the other side's presence key is in the channel's presence state, no
  timers, no guessing. This is a strict improvement, not just parity, and
  it removes code (the `disconnectTimer` logic) rather than adding it.
- **Late-join resync via Presence join events, not a database read.** When
  a Display joins a channel where a Trainer is already running a session,
  the Trainer's presence listener fires on the Display's `join` event and
  immediately calls `sendState()` with the current state — the Display
  doesn't have to wait for the next natural timer tick to see anything.

## Architecture

`SessionChannel`'s **public interface stays exactly as-is**:
`constructor(code, role)`, `sendState(state)`, `onState(listener)`,
`onConnectionStatusChange(listener)`, `getConnectionStatus()`,
`destroy()`. Only its internals change. This means `WorkoutEngine` and
every UI component that consumes `SessionChannel` (`DisplayScreen`,
`DisplayConnection`, the Trainer run panel) need **zero changes** — the
existing 48+ tests covering that consumption stay valid untouched. This is
the same reasoning the codebase already used for `WorkoutRepository`
(interface designed so a future Supabase-backed implementation could swap
in without touching call sites) — same pattern, this time for the
realtime transport.

Internally:
- A new `src/lib/session/supabaseClient.ts` creates one shared Supabase
  client from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  read via `process.env` (client-side env vars, `NEXT_PUBLIC_` prefix
  required by Next.js to reach the browser bundle). Throws a clear error
  immediately if either var is missing — fail loud, not silent, since
  there is no fallback transport anymore.
- `SessionChannel` opens `supabaseClient.channel('gymtimer:session:' +
  code, { config: { broadcast: { self: false }, presence: { key: role } }
  })`, registers a `broadcast` listener for a `"state"` event (replacing
  the old raw `BroadcastChannel` message listener), calls
  `.track({ role })` on successful subscribe (for Presence), and listens
  to `presence` `sync`/`join`/`leave` events to derive
  `ConnectionStatus` — connected if the *other* role's key is present in
  `channel.presenceState()`, disconnected otherwise. No timers anywhere in
  this class after the change.
- `sendState()` becomes `channel.send({ type: "broadcast", event: "state",
  payload: state })`.
- The Trainer-role instance additionally listens for `presence` `join`
  events matching the `"display"` role key and, on that event, immediately
  re-sends its last-known state (`SessionChannel` needs to retain the last
  state it sent, in a private field, to have something to resend).

## Data flow

1. Trainer opens the run panel → `new SessionChannel(code, "trainer")` →
   subscribes, tracks presence as `{ role: "trainer" }`.
2. Display opens `/display/[code]` → `new SessionChannel(code, "display")`
   → subscribes, tracks presence as `{ role: "display" }`.
3. Trainer's channel observes the Display's `join` presence event →
   immediately re-broadcasts the last state it holds.
4. From then on, every `WorkoutEngine` tick → `sendState()` → broadcast →
   Display's `onState` listeners fire, same as `BroadcastChannel` today.
5. Either side's presence `sync`/`leave` events update
   `ConnectionStatus` on both ends in real time.

## Error handling

- Missing/invalid env vars: `supabaseClient.ts` throws synchronously at
  import time with a message naming which var is missing — this fails the
  build/dev-server startup loudly rather than shipping a silently-broken
  app.
- Network drop / Supabase outage: Supabase's client auto-reconnects the
  underlying websocket; while disconnected, Presence naturally reports the
  other side as absent, so `ConnectionStatus` correctly shows
  "disconnected" without any custom retry logic needed in this codebase.
- Invalid/unknown session code: unchanged from today — the Display simply
  never sees a Trainer join that channel. No new validation is being added
  here (it wasn't needed with `BroadcastChannel` either, since a wrong code
  just meant an empty channel).

## Testing

`src/lib/session/__tests__/SessionChannel.test.ts` currently exercises two
real `SessionChannel` instances talking over jsdom's native
`BroadcastChannel`. Since a real websocket can't run in Vitest, this
suite is rewritten against a mocked `@supabase/supabase-js`: `vi.mock`
provides a fake `channel()` whose `.on()`/`.send()`/`.track()`/`.subscribe()`
are spies wired to actually invoke each other's registered callbacks (so
the test can still assert real message/presence flow between a "trainer"
instance and a "display" instance, just over the fake transport instead of
a real one). Cases to preserve: state broadcast reaches the other side;
connection status flips to "connected"/"disconnected". New case to add:
a Display "join" observed after a Trainer has already sent at least one
state triggers an automatic resend.

## Setup prerequisite (manual, not delegable to a background agent)

Creating the Supabase project requires an interactive OAuth/login step —
this happens once, with the user present, before any implementation task
can run (the implementation needs real `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` values to even write a working
`supabaseClient.ts`, let alone test it). This is Task 0 in the
implementation plan and is called out as requiring the user's direct
participation, unlike the rest of the plan.
