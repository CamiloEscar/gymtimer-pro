"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Workout, UserExerciseOverride } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import { DisplaySettingsRepository } from "@/lib/storage/DisplaySettingsRepository";
import type { DisplaySettings } from "@/lib/storage/DisplaySettingsRepository";
import { resolveExerciseVideos } from "@/lib/workout/resolveExerciseVideos";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFullscreen } from "@/hooks/useFullscreen";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { generateCode } from "@/lib/session/generateCode";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { AudioManager } from "@/lib/audio/AudioManager";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { TimerControls } from "@/components/timer/TimerControls";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function RunWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);
  const audio = useMemo(() => new AudioManager({ enabled: true, voiceEnabled: false }), []);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage is the source of truth, intentional reload-on-mount */
  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.get(params.id);
    setWorkout(result.ok ? result.value : null);
  }, [params.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (workout === undefined) return <p className="p-4 text-phosphor">Cargando…</p>;
  if (workout === null) return <p className="p-4 text-phosphor">Entrenamiento no encontrado.</p>;

  return (
    <Suspense fallback={<p className="p-4 text-phosphor">Cargando…</p>}>
      <RunWorkoutContent workout={workout} audio={audio} />
    </Suspense>
  );
}

function RunWorkoutContent({
  workout,
  audio,
}: {
  workout: Workout;
  audio: AudioManager;
}) {
  const searchParams = useSearchParams();
  const [code] = useState(() => searchParams.get("code") ?? generateCode());
  const session = useWorkoutSession(workout, audio);
  const channelRef = useRef<SessionChannel | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const { toggle: toggleFullscreen } = useFullscreen();
  const [resetPending, setResetPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [overrides, setOverrides] = useState<UserExerciseOverride[]>([]);
  const [settings, setSettings] = useState<DisplaySettings>({ showVideoOnDisplay: false });

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage is the source of truth, intentional reload-on-mount */
  useEffect(() => {
    const overridesResult = new UserExerciseOverrideRepository().list();
    setOverrides(overridesResult.ok ? overridesResult.value : []);
    const settingsResult = new DisplaySettingsRepository().get();
    setSettings(settingsResult.ok ? settingsResult.value : { showVideoOnDisplay: false });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    channelRef.current?.sendState({
      ...session.state,
      code,
      ...(settings.showVideoOnDisplay
        ? { videoByExerciseId: resolveExerciseVideos(workout, overrides) }
        : {}),
    });
    if (session.state.status === "finished") {
      audio.playFinish();
      if (!hasRecordedRef.current && sessionStartedAtRef.current !== null) {
        hasRecordedRef.current = true;
        // Capture the last finished block's rep tally if it was RM. With a
        // multi-block workout only the last block's reps land in history
        // (schema is intentionally flat — if more blocks start carrying
        // rep-like counts, extend to `Record<blockId, summary>` rather than
        // overloading this field).
        const lastBlock = workout.blocks[session.state.currentBlockIndex];
        const reps = lastBlock?.type === "rm" ? (session.state.accumulatedReps ?? 0) : undefined;
        new WorkoutHistoryRepository().record({
          workoutId: workout.id,
          workoutName: workout.name,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - sessionStartedAtRef.current,
          ...(reps !== undefined ? { reps } : {}),
        });
      }
    }
  }, [session.state, code, audio, workout.id, workout.name, workout.blocks, settings, overrides]);

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
    if (sessionStartedAtRef.current === null) sessionStartedAtRef.current = Date.now();
    session.start();
  }

  function confirmReset() {
    session.reset();
    setResetPending(false);
    sessionStartedAtRef.current = null;
    hasRecordedRef.current = false;
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentBlock = workout.blocks[session.state.currentBlockIndex];
  const isRmBlock = currentBlock?.type === "rm";
  const accumulatedReps = session.state.accumulatedReps ?? 0;

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-phosphor-dim flex items-center gap-2">
        Código de pantalla: <span className="font-mono text-phosphor">{code}</span>
        <Button size="md" variant="secondary" onClick={handleCopyCode} aria-label="Copiar código">
          {copied ? (
            <>
              <Icon name="check" />
              Copiado
            </>
          ) : (
            "Copiar código"
          )}
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
      {isRmBlock && (
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <p className="font-tactical text-3xl md:text-5xl uppercase tracking-widest text-brand-500 text-center">
            [ {accumulatedReps} REPS ]
          </p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              size="lg"
              variant="secondary"
              onClick={session.removeRep}
              disabled={accumulatedReps <= 0}
              aria-label="Restar una rep"
            >
              <Icon name="minus" />
              -1
            </Button>
            <Button size="lg" onClick={session.addRep} aria-label="Sumar una rep">
              <Icon name="plus" />
              +1 REP
            </Button>
          </div>
        </div>
      )}
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
        <p className="text-phosphor-dim mb-4">Se perderá el progreso de la sesión actual.</p>
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
