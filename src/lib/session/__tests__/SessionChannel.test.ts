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
