import type { ConnectionStatus, SessionMessage, SessionState } from "@/types";

const DISCONNECT_TIMEOUT_MS = 5000;

type StateListener = (state: SessionState) => void;
type StatusListener = (status: ConnectionStatus) => void;

export class SessionChannel {
  private channel: BroadcastChannel;
  private stateListeners = new Set<StateListener>();
  private statusListeners = new Set<StatusListener>();
  private status: ConnectionStatus = "waiting";
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly code: string,
    private readonly role: "trainer" | "display"
  ) {
    this.channel = new BroadcastChannel(`gymtimer:session:${code}`);
    this.channel.addEventListener("message", (event: MessageEvent<SessionMessage>) =>
      this.handleMessage(event.data)
    );
  }

  sendState(state: SessionState): void {
    const message: SessionMessage = { kind: "state", state, sentAt: Date.now() };
    this.channel.postMessage(message);
  }

  onState(listener: StateListener): () => void {
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
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.channel.close();
    this.stateListeners.clear();
    this.statusListeners.clear();
  }

  private handleMessage(message: SessionMessage): void {
    if (message.kind === "state" && message.state) {
      this.stateListeners.forEach((listener) => listener(message.state!));
    }
    this.markConnected();
  }

  private markConnected(): void {
    this.setStatus("connected");
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    this.disconnectTimer = setTimeout(() => {
      this.setStatus("disconnected");
    }, DISCONNECT_TIMEOUT_MS);
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}
