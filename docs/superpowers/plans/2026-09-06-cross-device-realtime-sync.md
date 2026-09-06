# Cross-Device Realtime Sync (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Task 0 is interactive and cannot be run by an unattended background agent — it requires the project owner's own Supabase login.**

**Goal:** Replace `BroadcastChannel` with Supabase Realtime (Broadcast + Presence) in `SessionChannel` so the Trainer and Display can run on physically separate devices, per `docs/superpowers/specs/2026-09-06-cross-device-realtime-sync-design.md`.

**Architecture:** `SessionChannel`'s public interface (`constructor(code, role)`, `sendState`, `onState`, `onConnectionStatusChange`, `getConnectionStatus`, `destroy`) stays identical — only its internals swap from `BroadcastChannel` to a Supabase Realtime channel. No other file that consumes `SessionChannel` (`src/app/app/workouts/[id]/run/page.tsx`, `src/app/display/[code]/page.tsx`) changes at all.

**Tech Stack:** `@supabase/supabase-js` (new dependency), Supabase Realtime Broadcast + Presence, Next.js `NEXT_PUBLIC_*` client env vars, Vitest with a mocked Supabase client.

## Global Constraints

- No fallback to `BroadcastChannel` — it is deleted entirely, not kept behind a flag.
- No database table, no schema, no RLS policy — the Realtime channel is not marked `private`, so no Postgres/Authorization setup exists in this plan.
- Connection status is derived **only** from Presence (`channel.presenceState()`), never from message-recency timers. There must be no `setTimeout`/`disconnectTimer` anywhere in the new `SessionChannel`.
- Env vars are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the `NEXT_PUBLIC_` prefix is required by Next.js for a var to reach client-side browser code — this app has no server component in the sync path, everything runs in the browser).
- `.env.example` and `.env.local` are sandbox-protected files this plan's tooling cannot read or edit directly (confirmed during planning — both `Read` and `Bash cat` were denied by the environment's permission settings). Task 0 below documents their required contents as plain text for the user to add by hand in their own editor; no task in this plan attempts to script-edit them.
- Conventional commits, no AI attribution, stage specific files (never `git add -A`), never push to remote — same repo-wide rules as every prior plan here.

---

### Task 0: Create the Supabase project and obtain credentials (interactive — do this WITH the user, not via a background agent)

**Files:** None — this is a one-time manual setup step, no repo files change.

**Interfaces:**
- Produces: two secret values the user will hold (not commit): a Supabase project URL and an anon/public API key. Task 1 onward assume these exist in the user's local shell/`.env.local`, but no task reads their actual values — they're only ever referenced by env var name.

- [ ] **Step 1: Create the Supabase project**

Either path works — let the user pick:
- Via Vercel: run the `vercel:marketplace` skill/`vercel integration add supabase` flow from the Vercel CLI, which provisions a Supabase project and automatically writes `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or Supabase's own default var names, which may need aliasing — check what the integration actually names them) into the linked Vercel project's environment variables.
- Directly: go to https://supabase.com, sign in, "New Project", pick an org/name/region/password (the DB password isn't used by this plan at all, since there's no table, but Supabase still requires setting one).

- [ ] **Step 2: Get the URL and anon key**

In the Supabase dashboard: Project Settings → API. Copy the "Project URL" and the "anon public" key (NOT the `service_role` key — that one must never be used in client-side code, since it bypasses all access control and this is a browser bundle).

- [ ] **Step 3: Add them to local dev**

If provisioned via Vercel integration, run `vercel env pull .env.local` to pull the values down (this repo's `vercel.json`/project must already be linked via `vercel link` for this to work — run that first if not yet linked). Otherwise, open `.env.local` in the project root directly (create it if it doesn't exist — it's already gitignored, standard Next.js behavior) and add:

```
NEXT_PUBLIC_SUPABASE_URL=<project-url-from-step-2>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-step-2>
```

- [ ] **Step 4: Add them to Vercel production**

If not already set by the Marketplace integration, run:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

(and repeat for `preview`/`development` targets if this project deploys preview builds you want working too).

- [ ] **Step 5: Update `.env.example` by hand**

This repo's `.env.example` cannot be edited by the tooling used for this plan (sandbox-denied). Open it in your own editor and add these two lines (with placeholder values, never real secrets):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

No commit step here — commit this together with Task 3's README changes once both are done, since they're both plain documentation about the same env vars.

---

### Task 1: Install supabase-js and add the shared client

**Files:**
- Modify: `package.json` (via `npm install`, not a hand-edit)
- Create: `src/lib/session/supabaseClient.ts`
- Create: `src/lib/session/__tests__/supabaseClient.test.ts`

**Interfaces:**
- Produces: `export const supabaseClient: SupabaseClient` from `src/lib/session/supabaseClient.ts` — Task 2's `SessionChannel` imports this exact named export.

- [ ] **Step 1: Install the dependency**

```bash
npm install @supabase/supabase-js
```

Expected: `package.json`'s `dependencies` gets a new `@supabase/supabase-js` entry (npm picks the current version — don't hand-edit the version number).

- [ ] **Step 2: Write the failing test**

Create `src/lib/session/__tests__/supabaseClient.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("supabaseClient", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("throws if NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    await expect(import("../supabaseClient")).rejects.toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_URL"
    );
  });

  it("throws if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    await expect(import("../supabaseClient")).rejects.toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  });

  it("creates a client when both env vars are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const { supabaseClient } = await import("../supabaseClient");
    expect(supabaseClient).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- supabaseClient`
Expected: FAIL — `src/lib/session/supabaseClient.ts` doesn't exist yet, so the dynamic `import("../supabaseClient")` errors with a module-not-found error, not the assertions above.

- [ ] **Step 4: Write minimal implementation**

Create `src/lib/session/supabaseClient.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. See README.md for Supabase setup."
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. See README.md for Supabase setup."
  );
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- supabaseClient`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/session/supabaseClient.ts src/lib/session/__tests__/supabaseClient.test.ts
git commit -m "feat: add Supabase client for realtime session sync"
```

---

### Task 2: Rewrite SessionChannel on Supabase Realtime Broadcast + Presence

**Files:**
- Modify: `src/lib/session/SessionChannel.ts` (full rewrite)
- Modify: `src/lib/session/__tests__/SessionChannel.test.ts` (full rewrite)

**Interfaces:**
- Consumes: `supabaseClient` from `src/lib/session/supabaseClient.ts` (Task 1).
- Produces (unchanged from before this plan): `class SessionChannel { constructor(code: string, role: "trainer" | "display"); sendState(state: SessionState): void; onState(listener: (state: SessionState) => void): () => void; onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void; getConnectionStatus(): ConnectionStatus; destroy(): void }`. This exact signature is relied on by `src/app/app/workouts/[id]/run/page.tsx` and `src/app/display/[code]/page.tsx` — neither of those files changes in this task.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `src/lib/session/__tests__/SessionChannel.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SessionState } from "@/types";

type BroadcastCallback = (msg: { event: string; payload: unknown }) => void;
type PresenceCallback = (arg: { key: string; newPresences?: unknown[]; leftPresences?: unknown[] }) => void;

class FakeChannel {
  private broadcastListeners: Array<{ event: string; callback: BroadcastCallback }> = [];
  private presenceListeners: { sync: Array<() => void>; join: PresenceCallback[]; leave: PresenceCallback[] } = {
    sync: [],
    join: [],
    leave: [],
  };
  private presence: Record<string, unknown[]> = {};

  constructor(private readonly room: Room) {
    room.channels.push(this);
  }

  on(type: "broadcast" | "presence", filter: { event: string }, callback: BroadcastCallback | PresenceCallback) {
    if (type === "broadcast") {
      this.broadcastListeners.push({ event: filter.event, callback: callback as BroadcastCallback });
    } else if (filter.event === "sync") {
      this.presenceListeners.sync.push(callback as () => void);
    } else if (filter.event === "join") {
      this.presenceListeners.join.push(callback as PresenceCallback);
    } else if (filter.event === "leave") {
      this.presenceListeners.leave.push(callback as PresenceCallback);
    }
    return this;
  }

  subscribe(callback: (status: string) => void) {
    queueMicrotask(() => callback("SUBSCRIBED"));
    return this;
  }

  async track(meta: { role: string }) {
    const isNew = !(meta.role in this.presence);
    this.presence[meta.role] = [meta];
    this.room.recomputePresence();
    if (isNew) this.room.notifyJoin(meta.role, [meta]);
  }

  send(msg: { type: string; event: string; payload: unknown }) {
    this.room.deliverBroadcast(this, msg);
  }

  presenceState() {
    return this.presence;
  }

  async unsubscribe() {
    const leavingRoles = Object.keys(this.presence);
    this.room.channels = this.room.channels.filter((c) => c !== this);
    leavingRoles.forEach((role) => this.room.notifyLeave(role));
    return "ok";
  }

  _receiveBroadcast(msg: { event: string; payload: unknown }) {
    this.broadcastListeners.filter((l) => l.event === msg.event).forEach((l) => l.callback(msg));
  }

  _setPresence(presence: Record<string, unknown[]>) {
    this.presence = presence;
  }

  _notifySync() {
    this.presenceListeners.sync.forEach((l) => l());
  }

  _notifyJoin(key: string, newPresences: unknown[]) {
    this.presenceListeners.join.forEach((l) => l({ key, newPresences }));
  }

  _notifyLeave(key: string) {
    this.presenceListeners.leave.forEach((l) => l({ key, leftPresences: [] }));
  }
}

class Room {
  channels: FakeChannel[] = [];

  deliverBroadcast(sender: FakeChannel, msg: { event: string; payload: unknown }) {
    this.channels.filter((c) => c !== sender).forEach((c) => c._receiveBroadcast(msg));
  }

  recomputePresence() {
    const merged: Record<string, unknown[]> = {};
    this.channels.forEach((c) => Object.assign(merged, c.presenceState()));
    this.channels.forEach((c) => {
      c._setPresence(merged);
      c._notifySync();
    });
  }

  notifyJoin(role: string, newPresences: unknown[]) {
    this.channels.forEach((c) => c._notifyJoin(role, newPresences));
  }

  notifyLeave(role: string) {
    this.channels.forEach((c) => c._notifyLeave(role));
  }
}

const rooms = new Map<string, Room>();

function getRoom(name: string): Room {
  let room = rooms.get(name);
  if (!room) {
    room = new Room();
    rooms.set(name, room);
  }
  return room;
}

vi.mock("../supabaseClient", () => ({
  supabaseClient: {
    channel: (name: string) => new FakeChannel(getRoom(name)),
  },
}));

const { SessionChannel } = await import("../SessionChannel");

const sampleState: SessionState = {
  code: "ABC123",
  workout: {
    id: "w1",
    name: "AMRAP 10",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [],
  },
  status: "running",
  currentBlockIndex: 0,
  currentRound: 1,
  totalRounds: 1,
  currentPhase: "work",
  currentExerciseIndex: 0,
  timer: {
    mode: "countdown",
    status: "running",
    durationMs: 10_000,
    elapsedMs: 0,
    remainingMs: 10_000,
  },
};

describe("SessionChannel", () => {
  beforeEach(() => {
    rooms.clear();
  });

  it("delivers state sent by the trainer to a display on the same code", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    const received: SessionState[] = [];
    const delivered = new Promise<void>((resolve) => {
      display.onState((state) => {
        received.push(state);
        resolve();
      });
    });

    await Promise.resolve();
    trainer.sendState(sampleState);
    await delivered;

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(sampleState);

    trainer.destroy();
    display.destroy();
  });

  it("does not deliver state across different codes", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ZZZ999", "display");
    const received: SessionState[] = [];
    display.onState((state) => received.push(state));

    await Promise.resolve();
    trainer.sendState(sampleState);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(received).toHaveLength(0);

    trainer.destroy();
    display.destroy();
  });

  it("reports 'connected' once the other side's presence is tracked, and 'disconnected' after it unsubscribes", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    const statuses: string[] = [];
    const connected = new Promise<void>((resolve) => {
      display.onConnectionStatusChange((status) => {
        statuses.push(status);
        if (status === "connected") resolve();
      });
    });

    await connected;
    expect(display.getConnectionStatus()).toBe("connected");

    await trainer.destroy();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(display.getConnectionStatus()).toBe("disconnected");
    expect(statuses).toContain("disconnected");
  });

  it("resends the trainer's last state as soon as a display joins, without waiting for the next tick", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    await Promise.resolve();
    trainer.sendState(sampleState);

    const display = new SessionChannel("ABC123", "display");
    const received: SessionState[] = [];
    const delivered = new Promise<void>((resolve) => {
      display.onState((state) => {
        received.push(state);
        resolve();
      });
    });

    await delivered;
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(sampleState);

    trainer.destroy();
    display.destroy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- SessionChannel`
Expected: FAIL — the current `SessionChannel.ts` still imports nothing from `../supabaseClient` and uses the real `BroadcastChannel`, so `vi.mock("../supabaseClient", ...)` mocks a module the source never touches. The 4th test (resend-on-join) must fail (the old implementation has no such behavior, so `display.onState` never fires and the test times out/fails). If the 1st/2nd/3rd tests happen to pass against the old code by coincidence, that's fine — the 4th test failing is sufficient proof the new behavior doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

Replace the full contents of `src/lib/session/SessionChannel.ts`:

```ts
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseClient } from "./supabaseClient";
import type { ConnectionStatus, SessionState } from "@/types";

type Listener = (state: SessionState) => void;
type StatusListener = (status: ConnectionStatus) => void;
type Role = "trainer" | "display";

export class SessionChannel {
  private channel: RealtimeChannel;
  private stateListeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private status: ConnectionStatus = "waiting";
  private lastState: SessionState | null = null;
  private readonly role: Role;
  private readonly otherRole: Role;

  constructor(code: string, role: Role) {
    this.role = role;
    this.otherRole = role === "trainer" ? "display" : "trainer";
    this.channel = supabaseClient.channel(`gymtimer:session:${code}`, {
      config: {
        broadcast: { self: false },
        presence: { key: role },
      },
    });

    this.channel.on("broadcast", { event: "state" }, ({ payload }) => {
      this.stateListeners.forEach((listener) => listener(payload as SessionState));
    });

    this.channel.on("presence", { event: "sync" }, () => this.syncConnectionStatus());
    this.channel.on("presence", { event: "join" }, ({ key }) => {
      this.syncConnectionStatus();
      if (this.role === "trainer" && key === "display" && this.lastState) {
        this.sendState(this.lastState);
      }
    });
    this.channel.on("presence", { event: "leave" }, () => this.syncConnectionStatus());

    this.channel.subscribe(async (subscribeStatus) => {
      if (subscribeStatus === "SUBSCRIBED") {
        await this.channel.track({ role });
      }
    });
  }

  sendState(state: SessionState): void {
    this.lastState = state;
    this.channel.send({ type: "broadcast", event: "state", payload: state });
  }

  onState(listener: Listener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onConnectionStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  async destroy(): Promise<void> {
    await this.channel.unsubscribe();
    this.stateListeners.clear();
    this.statusListeners.clear();
  }

  private syncConnectionStatus(): void {
    const presentRoles = Object.keys(this.channel.presenceState());
    this.setStatus(presentRoles.includes(this.otherRole) ? "connected" : "disconnected");
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}
```

Note: `destroy()` changes from `void` to `Promise<void>` (it now awaits an async unsubscribe). Both call sites (`run/page.tsx`'s effect cleanup, `display/[code]/page.tsx`'s effect cleanup) call `channel.destroy()` without awaiting the result already, and a React effect cleanup function ignoring a returned promise is harmless (fire-and-forget) — no call site needs to change, but if `tsc --noEmit` flags an unused-promise lint rule, wrap those two call sites in `void channel.destroy();` instead of a bare call.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- SessionChannel`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full suite and the build**

```bash
npm run test
npm run build
```

Expected: all tests pass (including the two call sites in `run/page.tsx` and `display/[code]/page.tsx`, which aren't unit-tested directly but must still type-check against `destroy()`'s new `Promise<void>` return type), and the build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/session/SessionChannel.ts src/lib/session/__tests__/SessionChannel.test.ts
git commit -m "feat: sync Trainer and Display over Supabase Realtime instead of BroadcastChannel"
```

---

### Task 3: Update documentation

**Files:**
- Modify: `README.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Update the Phase 1 scope bullet about sync**

Find this bullet in the `## Phase 1 (MVP) scope` section:

```md
- Trainer↔Display sync via the BroadcastChannel API — **same browser/device only**
  in this phase (e.g. two tabs, or a laptop mirrored to a TV). Cross-device sync
  (phone controlling a separate physical TV) is Phase 2 and requires a small
  realtime backend (see `docs/superpowers/specs/`).
```

Replace it with:

```md
- Trainer↔Display sync via Supabase Realtime (Broadcast + Presence) —
  works across physically separate devices (e.g. a phone running the
  Trainer panel and a TV/PC on a completely different network path
  showing the Display). Requires `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` — see "Environment variables" below.
```

- [ ] **Step 2: Update the Tech stack line**

Find:

```md
Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest.
```

Replace with:

```md
Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest, Supabase Realtime.
```

- [ ] **Step 3: Update the Environment variables section**

Find:

```md
## Environment variables

See `.env.example`. Phase 1 requires none.
```

Replace with:

```md
## Environment variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project's URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase project's anon/public API key (never the `service_role` key — this app runs entirely in the browser).

Both are read by `src/lib/session/supabaseClient.ts`, which throws a clear
error at startup if either is missing.
```

- [ ] **Step 4: Remove the two now-resolved Known limitations bullets**

Find, in `## Known limitations (Phase 1)`:

```md
- The Trainer↔Display connection relies on the BroadcastChannel API, which
  only works between tabs/windows of the **same browser on the same
  device**. It cannot yet drive a physically separate TV from a phone —
  that is Phase 2.
- The Display's connection-status indicator can briefly flicker to
  "Disconnected" around reconnect events since there is no heartbeat/grace
  period yet; the underlying session state is unaffected.
```

Delete both bullets — the first is resolved by this plan (Supabase Realtime replaces BroadcastChannel), and the second is resolved by Presence-based connection status (no more heartbeat timers). If the "Known limitations" section becomes empty after this and the QR-name-display gap removed in the earlier redesign work, delete the now-empty `## Known limitations (Phase 1)` heading too — check the file's current state before deciding, since another prior change may have already left or removed content there.

- [ ] **Step 5: Update the Roadmap line**

Find:

```md
Phase 1 (this repo) → Phase 2 (cross-device realtime sync) → Phase 3 (accounts
and gyms) → Phase 4 (athletes and results) → Phase 5 (SaaS/billing) → Phase 6
(per-gym branding). Full detail in `GYMTIMER-PRO-PROMPT.md` Section 90.
```

Replace with:

```md
Phase 1 (this repo) → **Phase 2 (cross-device realtime sync, done)** → Phase 3
(accounts and gyms) → Phase 4 (athletes and results) → Phase 5
(SaaS/billing) → Phase 6 (per-gym branding). Full detail in
`GYMTIMER-PRO-PROMPT.md` Section 90.
```

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: document Phase 2 Supabase Realtime sync and required env vars"
```

Note: this commit does NOT include `.env.example` (Task 0, Step 5) since that file is sandbox-protected from this plan's tooling — the user commits that one by hand, or folds it into this same commit manually if their own `git add` has access to it.

---

## Final check

```bash
npm run build
npm run test
```

Both must pass. Additionally, do one real cross-device manual check if at all possible: open the Trainer run panel on one device/browser profile and `/display/[code]` on a genuinely different one (e.g. your phone's browser and your laptop's browser, both pointed at a deployed Vercel preview URL, not `localhost` — `localhost` on two different physical devices won't resolve to the same server). Confirm the Display shows the running timer live and the connection badge reads `[ CONECTADO ]`. This is the entire point of Phase 2 — a green `npm run test` alone doesn't prove two different physical devices can actually see each other.
