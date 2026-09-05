"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFullscreen } from "@/hooks/useFullscreen";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { generateCode } from "@/lib/session/generateCode";
import { AudioManager } from "@/lib/audio/AudioManager";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { TimerControls } from "@/components/timer/TimerControls";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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

  if (workout === undefined) return <p className="p-4 text-white">Cargando…</p>;
  if (workout === null) return <p className="p-4 text-white">Entrenamiento no encontrado.</p>;

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
  const { toggle: toggleFullscreen } = useFullscreen();
  const [resetPending, setResetPending] = useState(false);
  const [copied, setCopied] = useState(false);

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
    onReset: () => setResetPending(true),
    onNext: () => session.nextRound(),
    onPrevious: () => session.previousRound(),
    onFullscreen: toggleFullscreen,
  });

  function handleStart() {
    audio.unlock();
    audio.playStart();
    session.start();
  }

  function confirmReset() {
    session.reset();
    setResetPending(false);
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-gray-400 flex items-center gap-2">
        Código de pantalla: <span className="font-mono text-white">{code}</span>
        <Button size="md" variant="secondary" onClick={handleCopyCode} aria-label="Copiar código">
          {copied ? "Copiado ✓" : "Copiar código"}
        </Button>
        <Link href={`/display/${code}`} className="text-brand-500 underline">
          abrir pantalla
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
        onReset={() => setResetPending(true)}
        onNext={session.nextRound}
        onPrevious={session.previousRound}
        onAddTime={() => session.addTime(10_000)}
        onSubtractTime={() => session.subtractTime(10_000)}
      />
      <Modal
        open={resetPending}
        onClose={() => setResetPending(false)}
        title="¿Reiniciar el entrenamiento?"
      >
        <p className="text-gray-400 mb-4">Se perderá el progreso de la sesión actual.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResetPending(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmReset}>
            Reiniciar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
