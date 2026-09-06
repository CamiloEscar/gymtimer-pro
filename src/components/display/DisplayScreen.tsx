"use client";

import type { ConnectionStatus, SessionState } from "@/types";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { ExerciseListDisplay } from "./ExerciseListDisplay";

interface DisplayScreenProps {
  state: SessionState;
  connectionStatus: ConnectionStatus;
  onFullscreenToggle: () => void;
}

export function DisplayScreen({ state, connectionStatus, onFullscreenToggle }: DisplayScreenProps) {
  const currentBlock = state.workout.blocks[state.currentBlockIndex];

  return (
    <div className="min-h-screen bg-surface-950 grid grid-rows-[auto_1fr_auto] gap-4 p-4 font-tactical">
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
        {currentBlock && <ExerciseListDisplay block={currentBlock} />}
        {state.currentPhase === "finished" && (
          <p className="font-industrial text-4xl uppercase text-phosphor">
            ENTRENAMIENTO COMPLETADO
          </p>
        )}
      </div>

      <div className="border-t border-surface-700 pt-2 flex justify-center">
        <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
      </div>
    </div>
  );
}
