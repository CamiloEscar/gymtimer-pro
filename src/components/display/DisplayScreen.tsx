"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ConnectionStatus, SessionState } from "@/types";
import { useGymProfile } from "@/hooks/useGymProfile";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ExerciseListDisplay } from "./ExerciseListDisplay";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/ui/VideoPlayer";

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
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const gymProfile = useGymProfile();
  const currentBlock = state.workout.blocks[state.currentBlockIndex];
  const blockExerciseCount = currentBlock?.exercises.length ?? 0;
  const highlightIndex =
    blockExerciseCount > 0 ? (state.currentRound - 1) % blockExerciseCount : 0;
  const currentExercise =
    currentBlock?.exercises[highlightIndex] ?? currentBlock?.exercises[0];
  const currentVideo = currentExercise
    ? state.videoByExerciseId?.[currentExercise.id]
    : undefined;
  // Video element is mounted whenever the current exercise has a configured
  // video URL; pause/play is driven by the timer phase via the imperative
  // handle so the playback position survives the work→rest transition
  // (unmounting on rest would force a re-buffer + re-play from 0 each time).
  const hasWorkoutVideo =
    !!currentExercise &&
    !!currentBlock &&
    currentBlock.type !== "rest" &&
    state.currentPhase !== "finished" &&
    currentVideo?.videoUrl != null;
  const blockProgress =
    state.timer.durationMs > 0
      ? Math.min(1, Math.max(0, state.timer.elapsedMs / state.timer.durationMs))
      : 0;
  const background =
    state.totalRounds > 1
      ? ROUND_BACKGROUNDS[(state.currentRound - 1) % ROUND_BACKGROUNDS.length]
      : ROUND_BACKGROUNDS[0];

  useEffect(() => {
    if (state.currentPhase === "work") {
      videoPlayerRef.current?.play();
    } else {
      videoPlayerRef.current?.pause();
    }
  }, [state.currentPhase, currentExercise?.id, hasWorkoutVideo]);

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
        <div className="flex flex-col items-center justify-center gap-6 min-h-0">
          <PhaseIndicator phase={state.currentPhase} />
        <TimerDisplay
          remainingMs={state.timer.remainingMs}
          elapsedMs={state.timer.elapsedMs}
          mode={state.timer.mode}
        />
        {currentBlock && currentBlock.type === "fightGoneBad" && state.currentPhase !== "finished" && (
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-tactical text-2xl md:text-4xl uppercase tracking-tight leading-tight text-phosphor-muted">
              [ ESTACIÓN {state.currentExerciseIndex + 1} / {currentBlock.exercises.length} ]
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
        ) : null}
        {state.currentPhase === "finished" && (
          <p className="font-industrial text-4xl uppercase text-phosphor">
            ENTRENAMIENTO COMPLETADO
          </p>
        )}
        </div>
        {currentExercise && currentBlock && currentBlock.type !== "rest" && state.currentPhase !== "finished" && (
          <aside className="w-[420px] max-w-[32vw] flex flex-col gap-4 mr-32" data-testid="display-side-panel">
            {hasWorkoutVideo ? (
              <VideoPlayer
                ref={videoPlayerRef}
                src={currentVideo.videoUrl}
                thumbnailSrc={currentVideo.thumbnailUrl}
                alt={currentExercise.name}
                rounded
              />
            ) : gymProfile?.logoUrl ? (
              <div
                className="relative aspect-square max-h-[420px] bg-surface-900/60 rounded-lg border border-surface-800 flex items-center justify-center overflow-hidden"
                data-testid="display-gym-logo"
              >
                <Image
                  src={gymProfile.logoUrl}
                  alt={`Logo de ${gymProfile.name || "gimnasio"}`}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 32vw"
                  className="object-contain p-4"
                />
              </div>
            ) : (
              <div
                role="img"
                aria-label="Video no disponible"
                data-testid="display-video-placeholder"
                className="aspect-video bg-surface-900 rounded-lg flex items-center justify-center"
              >
                <Icon name="dumbbell" className="size-16 text-phosphor-muted" />
              </div>
            )}
            {currentBlock.type !== "rm" && (
              <ExerciseListDisplay
                block={currentBlock}
                phase={state.currentPhase}
                currentExerciseId={currentExercise?.id}
              />
            )}
          </aside>
        )}
      </div>

      <div className="border-t border-surface-800 pt-2 flex items-center justify-center gap-4">
        <Link
          href={`/app/workouts/${state.workout.id}`}
          aria-label="Editar rutina"
          className="fixed top-12 right-3 z-50 opacity-40 hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200"
        >
          <Button variant="ghost">
            <Icon name="pencil" />
            Editar rutina
          </Button>
        </Link>
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
