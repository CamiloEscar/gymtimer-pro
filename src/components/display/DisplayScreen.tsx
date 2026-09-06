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
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4 relative">
      <button
        onClick={onFullscreenToggle}
        className="absolute top-4 left-4 text-gray-600 hover:text-white text-sm"
        aria-label="Pantalla completa"
      >
        ⛶
      </button>
      <span className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-400">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            connectionStatus === "connected" ? "bg-brand-500" : "bg-gray-600"
          }`}
        />
        {connectionStatus === "connected" ? "Conectado" : "Desconectado"}
      </span>
      <p className="text-3xl md:text-5xl text-gray-400 font-bold">{state.workout.name}</p>
      <PhaseIndicator phase={state.currentPhase} />
      <TimerDisplay
        remainingMs={state.timer.remainingMs}
        elapsedMs={state.timer.elapsedMs}
        mode={state.timer.mode}
      />
      <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
      {currentBlock && <ExerciseListDisplay block={currentBlock} />}
      {state.currentPhase === "finished" && (
        <p className="text-4xl font-black text-white">ENTRENAMIENTO COMPLETADO</p>
      )}
    </div>
  );
}
