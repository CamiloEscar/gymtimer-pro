"use client";

import type { ConnectionStatus, SessionState } from "@/types";
import { isChipper } from "@/lib/workout/repScheme";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerProgressBar } from "@/components/timer/TimerProgressBar";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { ExerciseBanner } from "@/components/timer/ExerciseBanner";

// The trainer-side echo of a live session, rendered from a mirrored
// SessionState (same Pusher feed that drives the TV). Used by the mini
// display (Document PiP) so the floating window looks like the /run screen —
// not the industrial TV display — while staying read-only and engine-free.
export function RunMirrorScreen({
  state,
  connectionStatus,
}: {
  state: SessionState;
  connectionStatus: ConnectionStatus;
}) {
  const block = state.workout.blocks[state.currentBlockIndex];
  const stationSweep =
    block &&
    (block.type === "fightGoneBad" || isChipper(block)) &&
    state.currentPhase !== "finished";

  return (
    <div className="min-h-[100dvh] bg-surface-950 grid grid-rows-[auto_1fr_auto] gap-4 p-4 font-tactical overflow-hidden">
      <div className="flex items-center justify-between border-b border-surface-800 pb-2">
        <p className="text-sm uppercase tracking-widest text-phosphor truncate min-w-0">
          {state.workout.name}
        </p>
        {connectionStatus === "connected" ? (
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-500 shrink-0 ml-4">
            <span
              className="inline-block h-2 w-2 rounded-full bg-brand-500"
              style={{ animation: "pulse-live 2s ease-in-out infinite" }}
            />
            [ EN VIVO · {state.code} ]
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-phosphor-muted shrink-0 ml-4">
            <span className="inline-block h-2 w-2 rounded-full bg-danger-500" />
            [ DESCONECTADO ]
          </span>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 min-h-0">
        <PhaseIndicator
          phase={state.currentPhase}
          {...(state.currentPhase === "getReady" && state.status !== "ready"
            ? { remainingMs: state.timer.remainingMs }
            : {})}
        />
        <TimerDisplay
          remainingMs={state.timer.remainingMs}
          elapsedMs={state.timer.elapsedMs}
          mode={state.timer.mode}
          status={state.status}
          phase={state.currentPhase}
        />
        <ExerciseBanner
          block={block}
          currentRound={state.currentRound}
          currentExerciseIndex={state.currentExerciseIndex}
          status={state.status}
          phase={state.currentPhase}
        />
        {stationSweep && (
          <p className="font-tactical text-sm uppercase tracking-tight leading-tight text-phosphor-muted text-center">
            [ ESTACIÓN {state.currentExerciseIndex + 1} / {block.exercises.length} ]
          </p>
        )}
        {state.timer.mode === "countdown" && (
          <TimerProgressBar
            mode={state.timer.mode}
            elapsedMs={state.timer.elapsedMs}
            durationMs={state.timer.durationMs}
          />
        )}
        {state.currentPhase === "finished" && (
          <p className="font-industrial text-2xl text-phosphor">ENTRENAMIENTO COMPLETADO</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-surface-800 pt-2">
        <RoundIndicator round={state.currentRound} totalRounds={state.totalRounds} />
        {state.workout.blocks.length > 1 && (
          <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim text-center">
            [ BLOQUE {state.currentBlockIndex + 1}/{state.workout.blocks.length} ]
          </p>
        )}
        <p className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim text-center">
          {state.status.toUpperCase()}
        </p>
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