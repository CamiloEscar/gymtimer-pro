"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { ConnectionStatus, SessionState } from "@/types";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { DisplayConnection } from "@/components/display/DisplayConnection";
import { DisplayScreen } from "@/components/display/DisplayScreen";

export default function DisplayCodePage() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const channelRef = useRef<SessionChannel | null>(null);
  const [state, setState] = useState<SessionState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");

  // Created and destroyed in the same effect (rather than via useMemo + a
  // separate cleanup effect) so React Strict Mode's dev-only double-invoke
  // of effects always pairs a channel's creation with its own destroy call,
  // instead of destroying a memoized channel that a later effect still holds.
  useEffect(() => {
    const channel = new SessionChannel(code, "display");
    channelRef.current = channel;
    const unsubscribeState = channel.onState(setState);
    const unsubscribeStatus = channel.onConnectionStatusChange(setConnectionStatus);
    return () => {
      unsubscribeState();
      unsubscribeStatus();
      channel.destroy();
      channelRef.current = null;
    };
  }, [code]);

  if (!state) {
    return <DisplayConnection code={code} status={connectionStatus} />;
  }

  return <DisplayScreen state={state} connectionStatus={connectionStatus} />;
}
