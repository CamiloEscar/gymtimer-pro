"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Workout, UserExerciseOverride } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import { DisplaySettingsRepository } from "@/lib/storage/DisplaySettingsRepository";
import type { DisplaySettings } from "@/lib/storage/DisplaySettingsRepository";
import { resolveExerciseVideos } from "@/lib/workout/resolveExerciseVideos";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useLocalStorageSnapshot } from "@/hooks/useLocalStorageSnapshot";
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
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { BlockEditor } from "@/components/workout/BlockEditor";
import { emptyBlock } from "@/components/workout/WorkoutBuilder";

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
      <RunWorkoutContent workout={workout} setWorkout={setWorkout} audio={audio} />
    </Suspense>
  );
}

const ACTIVE_SESSION_KEY = "gymtimer.activeSession";

function loadActiveCode(): { workoutId: string; code: string } | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveActiveCode(workoutId: string, code: string) {
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ workoutId, code }));
}

function RunWorkoutContent({
  workout,
  setWorkout,
  audio,
}: {
  workout: Workout;
  setWorkout: Dispatch<SetStateAction<Workout | null | undefined>>;
  audio: AudioManager;
}) {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => {
    const active = loadActiveCode();
    if (active?.workoutId === workout.id) return active.code;
    return searchParams.get("code") ?? generateCode();
  });
  const session = useWorkoutSession(workout, audio);
  const channelRef = useRef<SessionChannel | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const { toggle: toggleFullscreen } = useFullscreen();
  const [resetPending, setResetPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeDraft, setCodeDraft] = useState(code);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Workout | null>(null);
  const overrides = useLocalStorageSnapshot<UserExerciseOverride[]>(
    "gymtimer.exerciseOverrides",
    () => {
      const result = new UserExerciseOverrideRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );
  const settings = useLocalStorageSnapshot<DisplaySettings>(
    "gymtimer.displaySettings",
    () => {
      const result = new DisplaySettingsRepository().get();
      return result.ok ? result.value : { showVideoOnDisplay: false };
    },
    { showVideoOnDisplay: false }
  );

  // Created and destroyed in the same effect (rather than via useMemo + a
  // separate cleanup effect) so React Strict Mode's dev-only double-invoke
  // of effects always pairs a channel's creation with its own destroy call,
  // instead of destroying a memoized channel that a later effect still holds.
  useEffect(() => {
    saveActiveCode(workout.id, code);
    const channel = new SessionChannel(code, "trainer");
    channelRef.current = channel;
    return () => {
      channel.destroy();
      channelRef.current = null;
    };
  }, [code, workout.id]);

  useEffect(() => {
    new LocalWorkoutRepository().save(workout);
  }, [workout]);

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
  /* eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: this effect mirrors session state to the display channel; reading `workout` here would re-send on every workout ref change without semantic benefit */
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
    await navigator.clipboard.writeText(codeDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentBlock = workout.blocks[session.state.currentBlockIndex];
  const isRmBlock = currentBlock?.type === "rm";
  const accumulatedReps = session.state.accumulatedReps ?? 0;

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-phosphor-dim flex items-center gap-2 flex-wrap justify-center">
        <span className="shrink-0">Código de pantalla:</span>
        <Input
          value={codeDraft}
          onChange={(e) => setCodeDraft(e.target.value.toUpperCase())}
          onBlur={() => {
            if (codeDraft.trim()) setCode(codeDraft.trim().toUpperCase());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          aria-label="Editar código de pantalla"
          className="w-40 font-mono uppercase"
        />
        <Button
          size="md"
          variant="secondary"
          onClick={handleCopyCode}
          aria-label="Copiar código"
        >
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
      {session.state.status === "ready" && (
        <Button
          size="md"
          variant="secondary"
          onClick={() => {
            setDraft({ ...workout });
            setEditOpen(true);
          }}
          aria-label="Editar rutina"
        >
          <Icon name="pencil" />
          Editar rutina
        </Button>
      )}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar rutina"
      >
        {draft && (
          <div className="space-y-3">
            <Input
              aria-label="Nombre del entrenamiento"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Nombre del entrenamiento"
            />
            {draft.blocks.map((block, index) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={index + 1}
                onChange={(updated) =>
                  setDraft({
                    ...draft,
                    blocks: draft.blocks.map((b) => (b.id === block.id ? updated : b)),
                  })
                }
                onRemove={() =>
                  setDraft({ ...draft, blocks: draft.blocks.filter((b) => b.id !== block.id) })
                }
                overrides={overrides}
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDraft({ ...draft, blocks: [...draft.blocks, emptyBlock()] })}
            >
              + Agregar bloque
            </Button>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setWorkout(draft);
                  setEditOpen(false);
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>
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
