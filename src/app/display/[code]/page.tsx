"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { ConnectionStatus, SessionState } from "@/types";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
import { DisplayConnection } from "@/components/display/DisplayConnection";
import { DisplayScreen } from "@/components/display/DisplayScreen";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function DisplayCodePage() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const channelRef = useRef<SessionChannel | null>(null);
  // The trainer's phone can get locked/backgrounded mid-timer, which
  // throttles its setInterval and stops the "client-state" broadcasts this
  // page used to render directly — freezing the display until the phone is
  // unlocked. Instead, this mirror WorkoutEngine is re-hydrated from each
  // received snapshot and then keeps ticking (and advancing phases/rounds)
  // fully locally, so the display stays live regardless of the sender's tab
  // state. See TimerEngine.hydrate() / WorkoutEngine.hydrate().
  const mirrorRef = useRef<WorkoutEngine | null>(null);
  const [state, setState] = useState<SessionState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("waiting");
  const { toggle } = useFullscreen();

  // Created and destroyed in the same effect (rather than via useMemo + a
  // separate cleanup effect) so React Strict Mode's dev-only double-invoke
  // of effects always pairs a channel's creation with its own destroy call,
  // instead of destroying a memoized channel that a later effect still holds.
  // The mirror engine's getState() doesn't carry the trainer-side fields
  // (code, showVideoOnDisplay, videoByExerciseId) — they live only in the
  // remote broadcast. Hold onto the latest remote in a ref so the mirror's
  // subscriber can fold them into the React state, otherwise DisplayScreen
  // never sees e.g. the "Video oculto" affordance.
  const remoteRef = useRef<SessionState | null>(null);

  useEffect(() => {
    const channel = new SessionChannel(code, "display");
    channelRef.current = channel;
    let unsubscribeMirror: (() => void) | null = null;
    const unsubscribeState = channel.onState((remote) => {
      const receivedAt = Date.now();
      remoteRef.current = remote;
      if (!mirrorRef.current) {
        const mirror = new WorkoutEngine(remote.workout);
        mirrorRef.current = mirror;
        unsubscribeMirror = mirror.subscribe(() => {
          const mirrorState = mirror.getState();
          if (!remoteRef.current) return;
          setState({
            ...mirrorState,
            code: remoteRef.current.code,
            showVideoOnDisplay: remoteRef.current.showVideoOnDisplay,
            videoByExerciseId: remoteRef.current.videoByExerciseId,
          });
        });
      }
      // Anchor on the sender's capture instant when the trainer stamps it
      // (see SessionState.capturedAt); using our own receive time makes
      // staleMs zero and rewinds the timer by the network+processing lag
      // on every broadcast — a slow/mobile display visibly counts backwards.
      mirrorRef.current.hydrate(remote, remote.capturedAt ?? receivedAt);
    });
    const unsubscribeStatus = channel.onConnectionStatusChange(setConnectionStatus);
    return () => {
      unsubscribeState();
      unsubscribeStatus();
      unsubscribeMirror?.();
      mirrorRef.current?.destroy();
      mirrorRef.current = null;
      remoteRef.current = null;
      channel.destroy();
      channelRef.current = null;
    };
  }, [code]);

  if (!state) {
    return <DisplayConnection code={code} status={connectionStatus} />;
  }

  return <DisplayScreen state={state} connectionStatus={connectionStatus} onFullscreenToggle={toggle} />;
}
