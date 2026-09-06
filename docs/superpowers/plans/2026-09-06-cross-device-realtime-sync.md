# Cross-Device Realtime Sync (Phase 2, Pusher) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Task 0 is interactive and cannot be run by an unattended background agent — it requires the project owner's own Pusher signup.**

**Goal:** Replace `BroadcastChannel` with Pusher Channels (presence channel + client events) in `SessionChannel`, plus one small server auth route, so the Trainer and Display can run on physically separate devices, per `docs/superpowers/specs/2026-09-06-cross-device-realtime-sync-design.md`.

**Architecture:** `SessionChannel`'s public interface (`constructor(code, role)`, `sendState`, `onState`, `onConnectionStatusChange`, `getConnectionStatus`, `destroy`) stays identical — internals swap to a Pusher presence channel. A new `POST /api/pusher/auth` Route Handler authorizes subscriptions server-side (required by Pusher for any presence channel). `sendState()` gains a trailing-edge throttle (~200ms) since `TimerEngine` ticks every 100ms and Pusher client events are rate-limited to roughly 10/second per client.

**Tech Stack:** `pusher-js` (browser client), `pusher` (Node server SDK, used only inside the one Route Handler), Next.js Route Handlers, Vitest with a mocked `pusher-js`.

## Global Constraints

- No fallback to `BroadcastChannel` — deleted entirely.
- Channel name format: `presence-gymtimer-session-<code>` — the `presence-` prefix is mandatory for Pusher presence channels, not a style choice.
- `SessionChannel.sendState()` must throttle actual network sends to at most one per ~200ms window, always eventually sending the latest state (trailing edge), never silently dropping the final call in a burst.
- Connection status comes only from Pusher's `pusher:member_added`/`pusher:member_removed`/`pusher:subscription_succeeded` events — no timers, no message-recency guessing.
- Env vars: client-side `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`; server-only `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (server-only vars must NEVER get a `NEXT_PUBLIC_` prefix — that would ship the secret to every browser).
- `.env.example`/`.env.local` are sandbox-protected from this plan's tooling (confirmed during the earlier Supabase-era planning pass) — Task 0 documents their contents as plain text for the user to add by hand.
- Conventional commits, no AI attribution, stage specific files (never `git add -A`), never push to remote.

---

### Task 0: Create the Pusher app and obtain credentials (interactive — do this WITH the user)

**Files:** None.

**Interfaces:**
- Produces: `PUSHER_APP_ID`, `PUSHER_KEY` (also usable client-side, so also exposed as `NEXT_PUBLIC_PUSHER_KEY`), `PUSHER_SECRET`, `PUSHER_CLUSTER` (also exposed as `NEXT_PUBLIC_PUSHER_CLUSTER`). Task 1 onward reference these by name only.

- [ ] **Step 1: Create the Pusher app**

Go to https://dashboard.pusher.com, sign up/log in, "Create app" (or "Channels" → "Create app"). Pick a name (e.g. `gymtimer-pro`), a cluster close to your users (e.g. `us2`/`sa1` if available), and select "React" or "Node.js" as the frontend/backend hint (cosmetic only, doesn't restrict anything).

- [ ] **Step 2: Get the four values**

In the app's dashboard, go to "App Keys". Copy `app_id`, `key`, `secret`, `cluster`.

- [ ] **Step 3: Add them to local dev**

Create/open `.env.local` in the project root (gitignored already) and add:

```
NEXT_PUBLIC_PUSHER_KEY=<key-from-step-2>
NEXT_PUBLIC_PUSHER_CLUSTER=<cluster-from-step-2>
PUSHER_APP_ID=<app_id-from-step-2>
PUSHER_KEY=<key-from-step-2>
PUSHER_SECRET=<secret-from-step-2>
PUSHER_CLUSTER=<cluster-from-step-2>
```

Note `PUSHER_KEY` is duplicated (once plain, once `NEXT_PUBLIC_`-prefixed) because the server auth route and the browser client both need it, under different Next.js visibility rules. `PUSHER_SECRET` must appear ONLY in the non-prefixed form — never prefix it.

- [ ] **Step 4: Add them to Vercel**

```bash
vercel env add NEXT_PUBLIC_PUSHER_KEY production
vercel env add NEXT_PUBLIC_PUSHER_CLUSTER production
vercel env add PUSHER_APP_ID production
vercel env add PUSHER_KEY production
vercel env add PUSHER_SECRET production
vercel env add PUSHER_CLUSTER production
```

(repeat for `preview` if you deploy preview builds you want working)

- [ ] **Step 5: Update `.env.example` by hand**

Sandbox-protected from this plan's tooling — add these lines yourself with placeholder values:

```
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=us2
```

No commit here — fold into Task 3's README commit, or commit by hand.

---

### Task 1: Install Pusher packages, add the client factory and the auth route

**Files:**
- Modify: `package.json` (via `npm install`)
- Create: `src/lib/session/pusherClient.ts`
- Create: `src/lib/session/__tests__/pusherClient.test.ts`
- Create: `src/app/api/pusher/auth/route.ts`
- Create: `src/app/api/pusher/auth/__tests__/route.test.ts`

**Interfaces:**
- Produces: `export function createPusherClient(role: "trainer" | "display"): Pusher` from `pusherClient.ts` — Task 2's `SessionChannel` calls this exact function.
- Produces: `POST` handler at `/api/pusher/auth` — consumed only over HTTP by `pusher-js` itself (via the `channelAuthorization.endpoint` config set inside `createPusherClient`), no other file imports this route's code directly.

- [ ] **Step 1: Install the dependencies**

```bash
npm install pusher-js pusher
```

- [ ] **Step 2: Write the failing test for the client factory**

Create `src/lib/session/__tests__/pusherClient.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("createPusherClient", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("throws if NEXT_PUBLIC_PUSHER_KEY is missing", async () => {
    delete process.env.NEXT_PUBLIC_PUSHER_KEY;
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "us2";
    const { createPusherClient } = await import("../pusherClient");
    expect(() => createPusherClient("trainer")).toThrow("Missing NEXT_PUBLIC_PUSHER_KEY");
  });

  it("throws if NEXT_PUBLIC_PUSHER_CLUSTER is missing", async () => {
    process.env.NEXT_PUBLIC_PUSHER_KEY = "test-key";
    delete process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    const { createPusherClient } = await import("../pusherClient");
    expect(() => createPusherClient("trainer")).toThrow("Missing NEXT_PUBLIC_PUSHER_CLUSTER");
  });

  it("creates a client configured with the given role in auth params", async () => {
    process.env.NEXT_PUBLIC_PUSHER_KEY = "test-key";
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "us2";
    const { createPusherClient } = await import("../pusherClient");
    const client = createPusherClient("display");
    expect(client).toBeDefined();
    expect(client.config.auth?.params).toEqual({ role: "display" });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- pusherClient`
Expected: FAIL — `src/lib/session/pusherClient.ts` doesn't exist yet.

- [ ] **Step 4: Write minimal implementation**

Create `src/lib/session/pusherClient.ts`:

```ts
import Pusher from "pusher-js";

export function createPusherClient(role: "trainer" | "display"): Pusher {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_PUSHER_KEY environment variable. See README.md for Pusher setup."
    );
  }
  if (!cluster) {
    throw new Error(
      "Missing NEXT_PUBLIC_PUSHER_CLUSTER environment variable. See README.md for Pusher setup."
    );
  }

  return new Pusher(key, {
    cluster,
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
      params: { role },
    },
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- pusherClient`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the failing test for the auth route**

Create `src/app/api/pusher/auth/__tests__/route.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

function buildRequest(body: Record<string, string>): NextRequest {
  const form = new URLSearchParams(body);
  return new NextRequest("http://localhost/api/pusher/auth", {
    method: "POST",
    body: form.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

describe("POST /api/pusher/auth", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      PUSHER_APP_ID: "app-id",
      PUSHER_KEY: "key",
      PUSHER_SECRET: "secret",
      PUSHER_CLUSTER: "us2",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("authorizes a valid presence channel subscription", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      buildRequest({
        socket_id: "123.456",
        channel_name: "presence-gymtimer-session-ABC123",
        role: "trainer",
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.auth).toBeDefined();
    expect(body.channel_data).toBeDefined();
  });

  it("rejects a channel name that isn't a gymtimer session presence channel", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      buildRequest({
        socket_id: "123.456",
        channel_name: "presence-something-else",
        role: "trainer",
      })
    );
    expect(response.status).toBe(403);
  });

  it("returns 500 if server env vars are missing", async () => {
    delete process.env.PUSHER_SECRET;
    const { POST } = await import("../route");
    const response = await POST(
      buildRequest({
        socket_id: "123.456",
        channel_name: "presence-gymtimer-session-ABC123",
        role: "trainer",
      })
    );
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm run test -- route.test`
Expected: FAIL — `src/app/api/pusher/auth/route.ts` doesn't exist yet.

- [ ] **Step 8: Write minimal implementation**

Create `src/app/api/pusher/auth/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";

const CHANNEL_NAME_PATTERN = /^presence-gymtimer-session-[A-Za-z0-9]+$/;

function getPusherServer(): Pusher {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      "Missing one of PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER environment variables."
    );
  }

  return new Pusher({ appId, key, secret, cluster, useTLS: true });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const socketId = form.get("socket_id");
  const channelName = form.get("channel_name");
  const role = form.get("role");

  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  if (!CHANNEL_NAME_PATTERN.test(channelName)) {
    return NextResponse.json({ error: "Invalid channel name" }, { status: 403 });
  }

  if (role !== "trainer" && role !== "display") {
    return NextResponse.json({ error: "Missing or invalid role" }, { status: 400 });
  }

  let pusherServer: Pusher;
  try {
    pusherServer = getPusherServer();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: crypto.randomUUID(),
    user_info: { role },
  });

  return NextResponse.json(authResponse);
}
```

Note: `request.formData()` needs the test's request body to be sent with `Content-Type: application/x-www-form-urlencoded` (as built in Step 6) — `pusher-js`'s default `ajax` transport sends auth requests this way, so this matches real client behavior, not just the test.

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- route.test`
Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/lib/session/pusherClient.ts src/lib/session/__tests__/pusherClient.test.ts src/app/api/pusher/auth/route.ts src/app/api/pusher/auth/__tests__/route.test.ts
git commit -m "feat: add Pusher client factory and presence-channel auth route"
```

---

### Task 2: Rewrite SessionChannel on Pusher presence channels with throttled sends

**Files:**
- Modify: `src/lib/session/SessionChannel.ts` (full rewrite)
- Modify: `src/lib/session/__tests__/SessionChannel.test.ts` (full rewrite)

**Interfaces:**
- Consumes: `createPusherClient` from `src/lib/session/pusherClient.ts` (Task 1).
- Produces (unchanged from before this plan): `class SessionChannel { constructor(code: string, role: "trainer" | "display"); sendState(state: SessionState): void; onState(listener): () => void; onConnectionStatusChange(listener): () => void; getConnectionStatus(): ConnectionStatus; destroy(): void }` — relied on by `src/app/app/workouts/[id]/run/page.tsx` and `src/app/display/[code]/page.tsx`, neither of which changes in this task.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `src/lib/session/__tests__/SessionChannel.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { SessionState } from "@/types";

type EventCallback = (arg: unknown) => void;
type Role = "trainer" | "display";

class FakeChannel {
  private listeners = new Map<string, EventCallback[]>();
  members: { each: (fn: (member: { id: string; info: { role: Role } }) => void) => void };

  constructor(
    private readonly room: Room,
    public readonly role: Role
  ) {
    room.channels.push(this);
    this.members = {
      each: (fn) => {
        this.room.channels
          .filter((c) => c !== this)
          .forEach((c) => fn({ id: c.role, info: { role: c.role } }));
      },
    };
  }

  bind(event: string, callback: EventCallback) {
    const list = this.listeners.get(event) ?? [];
    list.push(callback);
    this.listeners.set(event, list);
    return this;
  }

  trigger(event: string, payload: unknown) {
    this.room.deliver(this, event, payload);
    return true;
  }

  _emit(event: string, payload: unknown) {
    (this.listeners.get(event) ?? []).forEach((cb) => cb(payload));
  }

  unsubscribe() {
    this.room.channels = this.room.channels.filter((c) => c !== this);
    this.room.channels.forEach((c) => c._emit("pusher:member_removed", { id: this.role, info: { role: this.role } }));
  }
}

class Room {
  channels: FakeChannel[] = [];

  deliver(sender: FakeChannel, event: string, payload: unknown) {
    this.channels.filter((c) => c !== sender).forEach((c) => c._emit(event, payload));
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

vi.mock("../pusherClient", () => ({
  createPusherClient: (role: Role) => ({
    subscribe: (name: string) => {
      const channel = new FakeChannel(getRoom(name), role);
      queueMicrotask(() => {
        channel._emit("pusher:subscription_succeeded", undefined);
        getRoom(name).channels.forEach((c) => {
          if (c !== channel) c._emit("pusher:member_added", { id: role, info: { role } });
        });
        channel._emit("pusher:member_added", { id: role, info: { role } });
      });
      return channel;
    },
  }),
}));

const { SessionChannel } = await import("../SessionChannel");

const sampleState: SessionState = {
  code: "ABC123",
  workout: { id: "w1", name: "AMRAP 10", createdAt: "2026-01-01T00:00:00.000Z", favorite: false, blocks: [] },
  status: "running",
  currentBlockIndex: 0,
  currentRound: 1,
  totalRounds: 1,
  currentPhase: "work",
  currentExerciseIndex: 0,
  timer: { mode: "countdown", status: "running", durationMs: 10_000, elapsedMs: 0, remainingMs: 10_000 },
};

describe("SessionChannel", () => {
  beforeEach(() => {
    rooms.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delivers state sent by the trainer to a display on the same code", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    await Promise.resolve();
    const display = new SessionChannel("ABC123", "display");
    await Promise.resolve();

    const received: SessionState[] = [];
    display.onState((state) => received.push(state));

    trainer.sendState(sampleState);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(sampleState);

    trainer.destroy();
    display.destroy();
  });

  it("does not deliver state across different codes", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ZZZ999", "display");
    await Promise.resolve();

    const received: SessionState[] = [];
    display.onState((state) => received.push(state));

    trainer.sendState(sampleState);

    expect(received).toHaveLength(0);

    trainer.destroy();
    display.destroy();
  });

  it("reports 'connected' once the other role's member is present, and 'disconnected' after it unsubscribes", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    await Promise.resolve();

    expect(display.getConnectionStatus()).toBe("connected");
    expect(trainer.getConnectionStatus()).toBe("connected");

    trainer.destroy();

    expect(display.getConnectionStatus()).toBe("disconnected");
  });

  it("resends the trainer's last state as soon as a display joins", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    await Promise.resolve();
    trainer.sendState(sampleState);

    const display = new SessionChannel("ABC123", "display");
    const received: SessionState[] = [];
    display.onState((state) => received.push(state));
    await Promise.resolve();

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(sampleState);

    trainer.destroy();
    display.destroy();
  });

  it("coalesces rapid sendState calls into one trigger per throttle window", async () => {
    const trainer = new SessionChannel("ABC123", "trainer");
    const display = new SessionChannel("ABC123", "display");
    await Promise.resolve();

    const received: SessionState[] = [];
    display.onState((state) => received.push(state));

    const first = { ...sampleState, timer: { ...sampleState.timer, remainingMs: 9000 } };
    const second = { ...sampleState, timer: { ...sampleState.timer, remainingMs: 8900 } };
    const third = { ...sampleState, timer: { ...sampleState.timer, remainingMs: 8800 } };

    trainer.sendState(first);
    trainer.sendState(second);
    trainer.sendState(third);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(first);

    await vi.advanceTimersByTimeAsync(250);

    expect(received).toHaveLength(2);
    expect(received[1]).toEqual(third);

    trainer.destroy();
    display.destroy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- SessionChannel`
Expected: FAIL — current `SessionChannel.ts` doesn't import `../pusherClient` at all, so mocking it has no effect; the old `BroadcastChannel`-based implementation has no throttling and no Pusher-shaped presence events, so at minimum the throttle test and the resend-on-join test fail.

- [ ] **Step 3: Write minimal implementation**

Replace the full contents of `src/lib/session/SessionChannel.ts`:

```ts
import type { Channel } from "pusher-js";
import { createPusherClient } from "./pusherClient";
import type { ConnectionStatus, SessionState } from "@/types";

type Listener = (state: SessionState) => void;
type StatusListener = (status: ConnectionStatus) => void;
type Role = "trainer" | "display";

const THROTTLE_MS = 200;

interface PresenceMember {
  id: string;
  info: { role: Role };
}

interface PresenceMembers {
  each: (callback: (member: PresenceMember) => void) => void;
}

export class SessionChannel {
  private channel: Channel & { members: PresenceMembers };
  private stateListeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private status: ConnectionStatus = "waiting";
  private lastState: SessionState | null = null;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;
  private readonly role: Role;
  private readonly otherRole: Role;

  constructor(code: string, role: Role) {
    this.role = role;
    this.otherRole = role === "trainer" ? "display" : "trainer";
    const pusher = createPusherClient(role);
    this.channel = pusher.subscribe(`presence-gymtimer-session-${code}`) as Channel & {
      members: PresenceMembers;
    };

    this.channel.bind("client-state", (state: SessionState) => {
      this.stateListeners.forEach((listener) => listener(state));
    });

    this.channel.bind("pusher:subscription_succeeded", () => this.syncConnectionStatus());
    this.channel.bind("pusher:member_added", (member: PresenceMember) => {
      this.syncConnectionStatus();
      if (this.role === "trainer" && member.info.role === "display" && this.lastState) {
        this.sendState(this.lastState);
      }
    });
    this.channel.bind("pusher:member_removed", () => this.syncConnectionStatus());
  }

  sendState(state: SessionState): void {
    this.lastState = state;
    if (this.throttleTimer !== null) {
      this.dirty = true;
      return;
    }
    this.transmit(state);
    this.throttleTimer = setTimeout(() => this.onThrottleWindowEnd(), THROTTLE_MS);
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

  destroy(): void {
    if (this.throttleTimer) clearTimeout(this.throttleTimer);
    this.channel.unsubscribe();
    this.stateListeners.clear();
    this.statusListeners.clear();
  }

  private onThrottleWindowEnd(): void {
    this.throttleTimer = null;
    if (this.dirty) {
      this.dirty = false;
      this.transmit(this.lastState!);
      this.throttleTimer = setTimeout(() => this.onThrottleWindowEnd(), THROTTLE_MS);
    }
  }

  private transmit(state: SessionState): void {
    this.channel.trigger("client-state", state);
  }

  private syncConnectionStatus(): void {
    let otherPresent = false;
    this.channel.members.each((member) => {
      if (member.info.role === this.otherRole) otherPresent = true;
    });
    this.setStatus(otherPresent ? "connected" : "disconnected");
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- SessionChannel`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full suite and the build**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds with no TypeScript errors. If `tsc`/`next build` complains about `pusher-js`'s `Channel`/`Members` types not matching the `PresenceMembers` shape used here, adjust the cast in the constructor (the `as Channel & { members: PresenceMembers }` line) to match whatever the installed `pusher-js` version's actual type definitions expose — don't fight the type system with `any`, find the real exported type name (likely `PresenceChannel` from `pusher-js`) and use that instead of the hand-rolled `PresenceMembers` interface if it exists.

- [ ] **Step 6: Commit**

```bash
git add src/lib/session/SessionChannel.ts src/lib/session/__tests__/SessionChannel.test.ts
git commit -m "feat: sync Trainer and Display over Pusher presence channels instead of BroadcastChannel"
```

---

### Task 3: Update documentation

**Files:**
- Modify: `README.md`

**Interfaces:** None.

- [ ] **Step 1: Update the Phase 1 scope bullet about sync**

Find:

```md
- Trainer↔Display sync via the BroadcastChannel API — **same browser/device only**
  in this phase (e.g. two tabs, or a laptop mirrored to a TV). Cross-device sync
  (phone controlling a separate physical TV) is Phase 2 and requires a small
  realtime backend (see `docs/superpowers/specs/`).
```

Replace with:

```md
- Trainer↔Display sync via Pusher Channels (presence channel + client
  events) — works across physically separate devices (e.g. a phone
  running the Trainer panel and a TV/PC on a completely different network
  path showing the Display). Requires a small serverless auth route
  (`src/app/api/pusher/auth`) and the env vars listed below.
```

- [ ] **Step 2: Update the Tech stack line**

Find:

```md
Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest.
```

Replace with:

```md
Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest, Pusher Channels.
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

- `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` — read by the
  browser client (`src/lib/session/pusherClient.ts`).
- `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` —
  server-only, read by `src/app/api/pusher/auth/route.ts`. Never prefix
  `PUSHER_SECRET` with `NEXT_PUBLIC_` — that would ship it to every
  browser.

All four Pusher app values come from the same dashboard app under "App
Keys" — see https://dashboard.pusher.com.
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

Delete both — the first is resolved by Pusher replacing `BroadcastChannel`, the second by Presence-based connection status. If the section becomes empty, delete the `## Known limitations (Phase 1)` heading too (check the file's current state first — other changes may have already altered this section).

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
git commit -m "docs: document Phase 2 Pusher realtime sync and required env vars"
```

---

## Final check

```bash
npm run build
npm run test
```

Both must pass. Then do a real cross-device manual check: deploy to a Vercel preview (`vercel` or push to a branch with a connected Git repo), open the Trainer run panel on one physical device and `/display/[code]` on a genuinely different one, both pointed at the deployed preview URL (not `localhost`). Confirm the Display shows the running timer live and the connection badge reads `[ CONECTADO ]`, and that closing the Trainer's tab flips the Display back to `[ DESCONECTADO ]` within a second or two (proving Presence-based detection actually works, not just the happy path).
