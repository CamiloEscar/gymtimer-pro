"use client";

import type { ConnectionStatus, SessionState } from "@/types";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { ExerciseListDisplay } from "./ExerciseListDisplay";

const ROUND_BACKGROUNDS = [
  "bg-surface-950",
  "bg-emerald-950",
  "bg-sky-950",
  "bg-amber-950",
  "bg-violet-950",
];

interface DisplayScreenProps {
  state: SessionState;
  connectionStatus: ConnectionStatus;
  onFullscreenToggle: () => void;
}

export function DisplayScreen({ state, connectionStatus, onFullscreenToggle }: DisplayScreenProps) {
  const currentBlock = state.workout.blocks[state.currentBlockIndex];
  const blockProgress =
    state.timer.durationMs > 0
      ? Math.min(1, Math.max(0, state.timer.elapsedMs / state.timer.durationMs))
      : 0;
  const background =
    state.totalRounds > 1
      ? ROUND_BACKGROUNDS[(state.currentRound - 1) % ROUND_BACKGROUNDS.length]
      : ROUND_BACKGROUNDS[0];

  return (
    <div className={`min-h-screen ${background} grid grid-rows-[auto_1fr_auto] gap-4 p-4 font-tactical`}>
      <div className="flex items-center justify-between border-b border-surface-700 pb-2">
        <button
          onClick={onFullscreenToggle}
          className="text-gray-500 hover:text-phosphor text-sm"
          aria-label="Pantalla completa"
        >
          ⛶
        </button>
        <p className="text-sm uppercase tracking-widest text-gray-400">{state.workout.name}</p>
        <span className="flex items-center gap-2 text-xs uppercase tracking-widest">
          <span
            className={`inline-block h-2 w-2 ${
              connectionStatus === "connected" ? "bg-brand-500" : "bg-danger-500"
            }`}
          />
          {connectionStatus === "connected" ? "[ CONECTADO ]" : "[ DESCONECTADO ]"}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        <PhaseIndicator phase={state.currentPhase} />
        <TimerDisplay
          remainingMs={state.timer.remainingMs}
          elapsedMs={state.timer.elapsedMs}
          mode={state.timer.mode}
        />
        {state.timer.mode === "countdown" && (
          <div className="w-full max-w-md h-1 bg-surface-700">
            <div
              data-testid="block-progress-bar"
              className="h-full bg-phosphor"
              style={{ width: `${blockProgress * 100}%` }}
            />
          </div>
        )}
        {currentBlock && <ExerciseListDisplay block={currentBlock} phase={state.currentPhase} />}
        {state.currentPhase === "finished" && (
          <p className="font-industrial text-4xl uppercase text-phosphor">
            ENTRENAMIENTO COMPLETADO
          </p>
        )}
      </div>

      <div className="border-t border-surface-700 pt-2 flex justify-center gap-4">
        <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
        {state.workout.blocks.length > 1 && (
          <p className="font-tactical text-sm md:text-base uppercase tracking-widest text-gray-400 text-center">
            [ BLOQUE {state.currentBlockIndex + 1}/{state.workout.blocks.length} ]
          </p>
        )}
      </div>
    </div>
  );
}
