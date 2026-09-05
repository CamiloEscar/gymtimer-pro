"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { generateCode } from "@/lib/session/generateCode";
import { AudioManager } from "@/lib/audio/AudioManager";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { TimerControls } from "@/components/timer/TimerControls";

export default function RunWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);
  const [code] = useState(() => generateCode());
  const audio = useMemo(() => new AudioManager({ enabled: true, voiceEnabled: false }), []);

  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.get(params.id);
    setWorkout(result.ok ? result.value : null);
  }, [params.id]);

  if (workout === undefined) return <p className="p-4 text-white">Loading…</p>;
  if (workout === null) return <p className="p-4 text-white">Workout not found.</p>;

  return <RunWorkoutContent workout={workout} code={code} audio={audio} />;
}

function RunWorkoutContent({
  workout,
  code,
  audio,
}: {
  workout: Workout;
  code: string;
  audio: AudioManager;
}) {
  const session = useWorkoutSession(workout);
  const channelRef = useRef<SessionChannel | null>(null);

  // Created and destroyed in the same effect (rather than via useMemo + a
  // separate cleanup effect) so React Strict Mode's dev-only double-invoke
  // of effects always pairs a channel's creation with its own destroy call,
  // instead of destroying a memoized channel that a later effect still holds.
  useEffect(() => {
    const channel = new SessionChannel(code, "trainer");
    channelRef.current = channel;
    return () => {
      channel.destroy();
      channelRef.current = null;
    };
  }, [code]);

  useEffect(() => {
    channelRef.current?.sendState({ ...session.state, code });
    if (session.state.status === "finished") audio.playFinish();
  }, [session.state, code, audio]);

  useKeyboardShortcuts({
    onPauseResume: () => (session.state.status === "running" ? session.pause() : session.resume()),
    onReset: () => session.reset(),
    onNext: () => session.nextRound(),
    onPrevious: () => session.previousRound(),
    onFullscreen: () => document.documentElement.requestFullscreen?.(),
  });

  function handleStart() {
    audio.unlock();
    audio.playStart();
    session.start();
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-gray-400">
        Display code: <span className="font-mono text-white">{code}</span> —{" "}
        <Link href={`/display/${code}`} className="text-brand-500 underline">
          open display
        </Link>
      </p>
      <PhaseIndicator phase={session.state.currentPhase} />
      <TimerDisplay
        remainingMs={session.state.timer.remainingMs}
        elapsedMs={session.state.timer.elapsedMs}
        mode={session.state.timer.mode}
      />
      <RoundIndicator round={session.state.currentRound} totalRounds={session.state.totalRounds} />
      <TimerControls
        status={session.state.status}
        onStart={handleStart}
        onPause={session.pause}
        onResume={session.resume}
        onReset={session.reset}
        onNext={session.nextRound}
        onPrevious={session.previousRound}
        onAddTime={() => session.addTime(10_000)}
        onSubtractTime={() => session.subtractTime(10_000)}
      />
    </div>
  );
}
