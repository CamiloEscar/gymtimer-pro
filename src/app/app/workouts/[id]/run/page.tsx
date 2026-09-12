"use client";

import { Suspense, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Workout, UserExerciseOverride, ConnectionStatus } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import { DisplaySettingsRepository } from "@/lib/storage/DisplaySettingsRepository";
import type { DisplaySettings } from "@/lib/storage/DisplaySettingsRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { resolveExerciseVideos } from "@/lib/workout/resolveExerciseVideos";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useAudioManager } from "@/hooks/useAudioManager";
import type { AudioManager } from "@/lib/audio/AudioManager";
import { useLocalStorageSnapshot } from "@/hooks/useLocalStorageSnapshot";
import { useGymProfile } from "@/hooks/useGymProfile";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFullscreen } from "@/hooks/useFullscreen";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { generateCode } from "@/lib/session/generateCode";
import { WorkoutHistoryRepository } from "@/lib/storage/WorkoutHistoryRepository";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerProgressBar } from "@/components/timer/TimerProgressBar";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { TimerControls } from "@/components/timer/TimerControls";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import { BlockEditor } from "@/components/workout/BlockEditor";
import { emptyBlock } from "@/components/workout/WorkoutBuilder";

export default function RunWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);
  const audio = useAudioManager();

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

// True iff `draft` changes any field that affects session timing relative
// to `current`. Comparing only the timing fields (not name/exercises/etc.)
// means cosmetic edits don't force a display reset — the engine rebuilds
// either way, but we only prompt the user when the change would visibly
// restart a running TV.
function hasTimingChanges(current: Workout, draft: Workout): boolean {
  if (current.blocks.length !== draft.blocks.length) return true;
  for (let i = 0; i < current.blocks.length; i++) {
    const a = current.blocks[i];
    const b = draft.blocks[i];
    if (a.id !== b.id) return true;
    if (a.type !== b.type) return true;
    if (a.durationSeconds !== b.durationSeconds) return true;
    if ((a.workSeconds ?? 0) !== (b.workSeconds ?? 0)) return true;
    if ((a.restSeconds ?? 0) !== (b.restSeconds ?? 0)) return true;
    if ((a.rounds ?? 0) !== (b.rounds ?? 0)) return true;
    if ((a.intervalSeconds ?? 0) !== (b.intervalSeconds ?? 0)) return true;
    if ((a.roundRestSeconds ?? 0) !== (b.roundRestSeconds ?? 0)) return true;
    if ((a.stationSeconds ?? 0) !== (b.stationSeconds ?? 0)) return true;
  }
  return false;
}

// Strip stale `rounds` off any rest block in `workout`. Older drafts (pre
// auto-cleanup) may have left rounds on rest blocks; the engine ignores
// them but carrying the dead field is a footgun for future comparisons
// (hasTimingChanges would flag them as changes).
function sanitizeDraft(workout: Workout): Workout {
  return {
    ...workout,
    blocks: workout.blocks.map((b) =>
      b.type === "rest" ? { ...b, rounds: undefined } : b,
    ),
  };
}

function readConfiguredLinkCode(): string | null {
  const result = new GymProfileRepository().get();
  if (!result.ok) return null;
  return result.value.linkCode ?? null;
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
  // Live snapshot of the gym profile so changes in /app/settings take effect
  // without a page reload (e.g. trainer sets linkCode mid-session, the run
  // page picks it up on the next state change).
  const gymProfile = useGymProfile();
  const [code, setCode] = useState(() => {
    // Priority: explicit ?code=... param wins, then a configured fixed
    // linkCode, then the last-used session code for this workout, then a
    // fresh random code.
    const fromUrl = searchParams.get("code");
    if (fromUrl) return fromUrl.toUpperCase();
    const fixed = readConfiguredLinkCode();
    if (fixed) return fixed;
    const active = loadActiveCode();
    if (active?.workoutId === workout.id) return active.code;
    return generateCode();
  });
  // If a linkCode gets configured (or changed) AFTER the page first renders
  // and we still have a random code, swap to it so the trainer's view and
  // the TV display agree on the pairing without manual entry. Same rationale
  // as the other intentional setState-in-effect sites in this file:
  // external localStorage source-of-truth that React needs to mirror.
  const fixedFromProfile = gymProfile?.linkCode ?? null;
  useEffect(() => {
    if (!fixedFromProfile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: mirror configured linkCode into local state
    setCode((current) => (current === fixedFromProfile ? current : fixedFromProfile));
  }, [fixedFromProfile]);
  const session = useWorkoutSession(workout, audio);
  const channelRef = useRef<SessionChannel | null>(null);
  const [displayStatus, setDisplayStatus] = useState<ConnectionStatus>("waiting");
  const sessionStartedAtRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const { toggle: toggleFullscreen } = useFullscreen();
  const [resetPending, setResetPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [codeDraft, setCodeDraft] = useState(code);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Workout | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
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
      return result.ok ? result.value : { showVideoOnDisplay: true };
    },
    { showVideoOnDisplay: true }
  );
  const allWorkouts = useLocalStorageSnapshot<Workout[]>(
    "gymtimer.workouts",
    () => {
      const result = new LocalWorkoutRepository().list();
      return result.ok ? result.value : [];
    },
    []
  );

  // Created and destroyed in the same effect (rather than via useMemo + a
  // separate cleanup effect) so React Strict Mode's dev-only double-invoke
  // of effects always pairs a channel's creation with its own destroy call,
  // instead of destroying a memoized channel that a later effect still holds.
  // Effect deps are intentionally just `code` — switching the active workout
  // (e.g. trainer picks a different routine mid-session) keeps the same
  // Pusher channel so the TV display never disconnects.
  useEffect(() => {
    saveActiveCode(workout.id, code);
    const channel = new SessionChannel(code, "trainer");
    channelRef.current = channel;
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: seed local state from the channel's current connection status, same pattern as the code-state mirror effect above */
    setDisplayStatus(channel.getConnectionStatus());
    const unsubscribeStatus = channel.onConnectionStatusChange(setDisplayStatus);
    return () => {
      unsubscribeStatus();
      channel.destroy();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: channel lifetime is tied to the session code, not the workout
  }, [code]);

  useEffect(() => {
    saveActiveCode(workout.id, code);
  }, [workout.id, code]);

  useEffect(() => {
    new LocalWorkoutRepository().save(workout);
  }, [workout]);

  // Switching routines mid-session must reset the run-scoped refs that the
  // mirror-effect below reads; otherwise the previous session's
  // sessionStartedAt would be reused for duration math and hasRecorded would
  // skip re-recording the new run. Engine itself rebuilds from the new
  // workout prop (see useWorkoutSession), so timer state already resets.
  useEffect(() => {
    sessionStartedAtRef.current = null;
    hasRecordedRef.current = false;
  }, [workout.id]);

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
    // The 3-2-1 countdown and "GO!" tone are emitted from inside the engine
    // (getReady phase + beginWorkBlock). Just kick off the session here.
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

  async function handleShareDisplay() {
    // Use the Web Share API on mobile so the trainer can AirDrop/WhatsApp/etc.
    // the URL straight to the TV. Fall back to clipboard on desktop / older
    // browsers so the CTA still does something useful.
    const url = `${window.location.origin}/display/${code}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: workout.name, url });
        return;
      } catch {
        // User cancelled or share API not actually wired — fall through.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Last-ditch: do nothing. The status dot already tells the trainer
      // the display state, and the open-in-new-tab link still works.
    }
  }

  const currentBlock = workout.blocks[session.state.currentBlockIndex];
  const isRmBlock = currentBlock?.type === "rm";
  const accumulatedReps = session.state.accumulatedReps ?? 0;

  return (
    <div className="bg-surface-950 flex flex-col items-center sm:min-h-dvh sm:justify-center gap-3 sm:gap-6 p-3 sm:p-4">
      <div className="w-full max-w-2xl text-center space-y-1">
        <p className="font-tactical text-[10px] uppercase tracking-widest text-phosphor-muted">
          EN VIVO
        </p>
        <h1 className="font-industrial text-xl md:text-3xl uppercase tracking-tight text-phosphor leading-none">
          {workout.name || "(sin nombre)"}
        </h1>
      </div>
      <div className="w-full max-w-2xl space-y-2">
        <div className="flex items-center gap-2">
          <Select
            aria-label="Cambiar de rutina en vivo"
            value={workout.id}
            onChange={(e) => {
              const next = allWorkouts.find((w) => w.id === e.target.value);
              if (next) setWorkout(next);
            }}
            className="flex-1 font-industrial uppercase tracking-wide"
          >
            {allWorkouts.length === 0 ? (
              <option value={workout.id}>{workout.name || "(sin nombre)"}</option>
            ) : (
              allWorkouts
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name || "(sin nombre)"}
                  </option>
                ))
            )}
          </Select>
          {session.state.status === "ready" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDraft(sanitizeDraft(workout));
                setEditOpen(true);
              }}
              aria-label="Editar rutina"
              className="shrink-0 whitespace-nowrap"
            >
              <Icon name="pencil" />
              <span>Editar</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
              placeholder="CÓDIGO"
              className="w-full pr-10 font-mono uppercase"
            />
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label={copied ? "Código copiado" : "Copiar código"}
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-10 rounded-md text-phosphor-dim hover:text-brand-500 active:scale-95 transition-colors cursor-pointer"
            >
              <Icon name={copied ? "check" : "copy"} className="size-4" />
            </button>
          </div>
          <Link
            href={`/display/${code}`}
            className="inline-flex items-center justify-center gap-1.5 size-11 shrink-0 rounded-lg border border-surface-700 text-phosphor hover:text-brand-500 hover:border-brand-500 active:scale-95 transition-colors"
            aria-label="Abrir display del gimnasio en una pestaña nueva"
          >
            <Icon name="display" className="size-4" />
          </Link>
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <p
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-phosphor-muted"
            aria-live="polite"
          >
            <span
              aria-hidden
              className={`inline-block size-1.5 rounded-full ${
                displayStatus === "connected" ? "bg-brand-500" : "bg-phosphor-muted"
              }`}
            />
            {displayStatus === "connected"
              ? "Display conectado"
              : displayStatus === "waiting"
                ? "Esperando display…"
                : "Display desconectado"}
          </p>
          <button
            type="button"
            onClick={handleShareDisplay}
            className="text-[10px] uppercase tracking-widest text-phosphor-muted hover:text-brand-500 active:scale-95 transition-colors cursor-pointer"
            aria-label={shared ? "Link del display copiado" : "Compartir link del display"}
          >
            {shared ? "¡Copiado!" : "Compartir link"}
          </button>
        </div>
      </div>
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
                  // Display connection + timing change is the only combo that
                  // visibly disrupts the TV; everything else (cosmetic edits,
                  // exercise text, etc.) applies silently.
                  const displayLive =
                    channelRef.current?.getConnectionStatus() === "connected";
                  if (displayLive && draft && hasTimingChanges(workout, draft)) {
                    setConfirmResetOpen(true);
                  } else if (draft) {
                    setWorkout(draft);
                    setEditOpen(false);
                  }
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <PhaseIndicator
        phase={session.state.currentPhase}
        {...(session.state.currentPhase === "getReady"
          ? { remainingMs: session.state.timer.remainingMs }
          : {})}
      />
      <TimerDisplay
        remainingMs={session.state.timer.remainingMs}
        elapsedMs={session.state.timer.elapsedMs}
        mode={session.state.timer.mode}
      />
      <TimerProgressBar
        mode={session.state.timer.mode}
        elapsedMs={session.state.timer.elapsedMs}
        durationMs={session.state.timer.durationMs}
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
      <Modal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="¿Aplicar cambios y reiniciar el display?"
      >
        <p className="text-phosphor-dim mb-4">
          Hay un display conectado mostrando esta rutina. Aplicar los cambios de
          tiempo reiniciará el temporizador del TV también.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmResetOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!draft) return;
              setWorkout(draft);
              setEditOpen(false);
              setConfirmResetOpen(false);
            }}
          >
            Sí, reiniciar
          </Button>
        </div>
      </Modal>
      <Link
        href={`/display/${code}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir display del gimnasio"
        className="sm:hidden fixed top-12 right-3 z-50 inline-flex items-center justify-center size-11 rounded-full bg-brand-500 hover:bg-brand-600 text-black shadow-lg shadow-black/40 active:scale-95 transition-opacity"
      >
        <Icon name="display" className="size-5" />
      </Link>
    </div>
  );
}
