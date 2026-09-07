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

    this.channel.bind("pusher:subscription_succeeded", () => {
      this.syncConnectionStatus();
      // Resend our own last known state, if any: an earlier sendState()/
      // transmit() call may have raced ahead of our own subscription
      // handshake and been silently dropped by Pusher (client events no-op
      // before pusher:subscription_succeeded fires). This covers the case
      // where the OTHER side joined first and is already waiting.
      if (this.lastState) this.transmit(this.lastState);
    });
    this.channel.bind("pusher:member_added", (member: PresenceMember) => {
      this.syncConnectionStatus();
      if (this.role === "trainer" && member.info.role === "display" && this.lastState) {
        // Bypass the throttle here: this is a one-off "welcome" resend for a
        // newly joined display, not a tick from TimerEngine. Routing it
        // through sendState() would get silently swallowed into `dirty` if a
        // throttle window from a recent tick was still open, delaying the
        // newly joined display's first paint by up to THROTTLE_MS for no
        // reason.
        this.transmit(this.lastState);
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
