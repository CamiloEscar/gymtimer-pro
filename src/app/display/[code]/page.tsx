"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { ConnectionStatus, SessionState, Workout } from "@/types";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { WorkoutEngine } from "@/lib/workout/WorkoutEngine";
import { DisplayConnection } from "@/components/display/DisplayConnection";
import { DisplayScreen } from "@/components/display/DisplayScreen";
import { RunMirrorScreen } from "@/components/display/RunMirrorScreen";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function DisplayCodePage() {
  // useSearchParams must read inside a Suspense boundary or the route fails
  // at build/render time.
  return (
    <Suspense fallback={null}>
      <DisplayCodeContent />
    </Suspense>
  );
}

function DisplayCodeContent() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const searchParams = useSearchParams();
  const runView = searchParams.get("view") === "run";
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
  // Signature of the workout the current mirror engine was built for.
  // Compares against each broadcast's workout so an edit applied on the
  // trainer side triggers a mirror rebuild — hydrate() restores timing and
  // position only, never the block definitions, so without this the TV keeps
  // showing the PREVIOUS routine while the trainer moves to the new one.
  // JSON.stringify (not object identity) because the channel serializes every
  // broadcast and a fresh object arrives each time.
  const workoutSigRef = useRef<string | null>(null);

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

    // (Re)build the mirror engine for a workout structure. Called on the
    // first broadcast and whenever the trainer's state carries a DIFFERENT
    // workout (an edit applied mid-session).
    const attachMirror = (workout: Workout) => {
      unsubscribeMirror?.();
      mirrorRef.current?.destroy();
      workoutSigRef.current = JSON.stringify(workout);
      const mirror = new WorkoutEngine(workout);
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
    };

    const unsubscribeState = channel.onState((remote) => {
      const receivedAt = Date.now();
      remoteRef.current = remote;
      if (!mirrorRef.current || JSON.stringify(remote.workout) !== workoutSigRef.current) {
        attachMirror(remote.workout);
      }
      const mirror = mirrorRef.current;
      if (!mirror) return;
      // Anchor on the sender's capture instant when the trainer stamps it
      // (see SessionState.capturedAt); using our own receive time makes
      // staleMs zero and rewinds the timer by the network+processing lag
      // on every broadcast — a slow/mobile display visibly counts backwards.
      try {
        mirror.hydrate(remote, remote.capturedAt ?? receivedAt);
      } catch {
        // The trainer rebuilt the workout mid-session and the broadcast
        // position no longer exists in the new structure (e.g. blocks were
        // removed). Throw the half-hydrated mirror away and show the new
        // routine from its top instead of freezing on a stale position.
        attachMirror(remote.workout);
        const fresh = mirrorRef.current;
        if (!fresh) return;
        setState({
          ...fresh.getState(),
          code: remote.code,
          showVideoOnDisplay: remote.showVideoOnDisplay,
          videoByExerciseId: remote.videoByExerciseId,
        });
      }
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

  if (runView) {
    // The mini display (Document PiP) shows the trainer-side echo instead of
    // the industrial TV screen — same live mirror, different framing.
    return <RunMirrorScreen state={state} connectionStatus={connectionStatus} />;
  }

  return <DisplayScreen state={state} connectionStatus={connectionStatus} onFullscreenToggle={toggle} />;
}