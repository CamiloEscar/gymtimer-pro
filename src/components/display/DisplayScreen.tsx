"use client";

import type { ConnectionStatus, SessionState } from "@/types";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";

interface DisplayScreenProps {
  state: SessionState;
  connectionStatus: ConnectionStatus;
}

export function DisplayScreen({ state, connectionStatus }: DisplayScreenProps) {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4 relative">
      <span
        className={`absolute top-4 right-4 text-sm ${
          connectionStatus === "connected" ? "text-brand-500" : "text-gray-600"
        }`}
      >
        ● {connectionStatus === "connected" ? "Connected" : "Disconnected"}
      </span>
      <p className="text-3xl md:text-5xl text-gray-400 font-bold">{state.workout.name}</p>
      <PhaseIndicator phase={state.currentPhase} />
      <TimerDisplay
        remainingMs={state.timer.remainingMs}
        elapsedMs={state.timer.elapsedMs}
        mode={state.timer.mode}
      />
      <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
      {state.currentPhase === "finished" && (
        <p className="text-4xl font-black text-white">WORKOUT COMPLETE</p>
      )}
    </div>
  );
}
