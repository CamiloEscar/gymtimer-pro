"use client";

import type { ConnectionStatus, SessionState } from "@/types";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ExerciseListDisplay } from "./ExerciseListDisplay";
import { VideoPlayer } from "@/components/ui/VideoPlayer";

const ROUND_BACKGROUNDS = [
  "bg-surface-950",
  "bg-round-1",
  "bg-round-2",
  "bg-round-3",
  "bg-round-4",
];

interface DisplayScreenProps {
  state: SessionState;
  connectionStatus: ConnectionStatus;
  onFullscreenToggle: () => void;
}

export function DisplayScreen({ state, connectionStatus, onFullscreenToggle }: DisplayScreenProps) {
  const currentBlock = state.workout.blocks[state.currentBlockIndex];
  const currentExercise =
    currentBlock?.exercises[state.currentExerciseIndex] ?? currentBlock?.exercises[0];
  const currentVideo = currentExercise
    ? state.videoByExerciseId?.[currentExercise.id]
    : undefined;
  const showWorkoutVideo =
    state.currentPhase === "work" &&
    !!currentBlock &&
    currentBlock.exercises.length > 0 &&
    currentVideo?.videoUrl != null;
  const blockProgress =
    state.timer.durationMs > 0
      ? Math.min(1, Math.max(0, state.timer.elapsedMs / state.timer.durationMs))
      : 0;
  const background =
    state.totalRounds > 1
      ? ROUND_BACKGROUNDS[(state.currentRound - 1) % ROUND_BACKGROUNDS.length]
      : ROUND_BACKGROUNDS[0];

  return (
    <div className={`min-h-[100dvh] ${background} grid grid-rows-[auto_1fr_auto] gap-4 p-4 font-tactical overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-surface-800 pb-2">
        <p className="text-sm uppercase tracking-widest text-phosphor-dim truncate min-w-0">
          {state.workout.name}
        </p>
        {connectionStatus === "connected" ? (
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-500 shrink-0 ml-4">
            <span
              className="inline-block h-2 w-2 rounded-full bg-brand-500"
              style={{ animation: "pulse-live 2s ease-in-out infinite" }}
            />
            [ EN VIVO ]
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-phosphor-muted shrink-0 ml-4">
            <span className="inline-block h-2 w-2 rounded-full bg-danger-500" />
            [ DESCONECTADO ]
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-6 min-h-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-6 overflow-y-auto min-h-0">
          <PhaseIndicator phase={state.currentPhase} />
        <TimerDisplay
          remainingMs={state.timer.remainingMs}
          elapsedMs={state.timer.elapsedMs}
          mode={state.timer.mode}
        />
        {currentBlock && currentBlock.type === "fightGoneBad" && state.currentPhase !== "finished" && (
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-2xl md:text-4xl uppercase tracking-tight leading-tight">
              <span className="font-tactical text-phosphor-muted">
                [ ESTACIÓN {state.currentExerciseIndex + 1} / {currentBlock.exercises.length} —
              </span>
              <span className="font-industrial text-phosphor-dim">
                {" "}
                {currentBlock.exercises[state.currentExerciseIndex]?.name ?? "—"} ]
              </span>
            </p>
            {state.currentPhase === "rest" && (
              <p className="font-tactical text-sm md:text-base uppercase tracking-widest text-danger-500">
                DESCANSO ENTRE RONDAS
              </p>
            )}
          </div>
        )}
        {currentBlock && currentBlock.type === "rm" && state.currentPhase !== "finished" && (
          <p
            data-testid="rm-reps-display"
            className="font-tactical text-3xl md:text-5xl uppercase tracking-widest text-brand-500 text-center"
          >
            [ {state.accumulatedReps ?? 0} REPS ]
          </p>
        )}
        {state.timer.mode === "countdown" && (
          <div className="w-full max-w-md h-1 bg-surface-800">
            <div
              data-testid="block-progress-bar"
              className="h-full bg-phosphor"
              style={{ width: `${blockProgress * 100}%` }}
            />
          </div>
        )}
        {currentBlock && currentBlock.type === "rest" ? (
          <div className="flex flex-col items-center gap-2 border-t border-surface-800 pt-6 w-full max-w-md">
            <p className="font-industrial text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-none text-danger-500 text-center">
              DESCANSO
            </p>
            <p className="font-tactical text-sm md:text-base uppercase tracking-widest text-phosphor-muted text-center">
              RECUPERÁ
            </p>
          </div>
        ) : currentBlock && currentBlock.type !== "fightGoneBad" && currentBlock.type !== "rm" ? (
          <ExerciseListDisplay block={currentBlock} phase={state.currentPhase} />
        ) : null}
        {state.currentPhase === "finished" && (
          <p className="font-industrial text-4xl uppercase text-phosphor">
            ENTRENAMIENTO COMPLETADO
          </p>
        )}
        </div>
        {showWorkoutVideo && currentExercise && currentVideo && (
          <div className="w-[420px] max-w-[32vw]">
            <VideoPlayer
              src={currentVideo.videoUrl}
              thumbnailSrc={currentVideo.thumbnailUrl}
              alt={currentExercise.name}
              rounded
            />
          </div>
        )}
      </div>

      <div className="border-t border-surface-800 pt-2 flex items-center justify-center gap-4">
        <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
        {state.workout.blocks.length > 1 && (
          <p className="font-tactical text-sm md:text-base uppercase tracking-widest text-phosphor-dim text-center">
            [ BLOQUE {state.currentBlockIndex + 1}/{state.workout.blocks.length} ]
          </p>
        )}
        <Button
          variant="ghost"
          size="md"
          onClick={onFullscreenToggle}
          aria-label="Pantalla completa"
          className="ml-auto"
        >
          <Icon name="maximize" />
          Pantalla completa
        </Button>
      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
