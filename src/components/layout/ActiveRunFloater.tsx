"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalStorageSnapshot } from "@/hooks/useLocalStorageSnapshot";
import { Icon } from "@/components/ui/Icon";

interface ActiveSession {
  workoutId: string;
  code: string;
}

export function ActiveRunFloater() {
  const pathname = usePathname();
  const active = useLocalStorageSnapshot<ActiveSession | null>(
    "gymtimer.activeSession",
    () => {
      try {
        const raw = localStorage.getItem("gymtimer.activeSession");
        return raw ? (JSON.parse(raw) as ActiveSession) : null;
      } catch {
        return null;
      }
    },
    null
  );

  if (!active?.workoutId) return null;
  if (pathname === `/app/workouts/${active.workoutId}/run`) return null;

  return (
    <Link
      href={`/app/workouts/${active.workoutId}/run`}
      aria-label="Entrenamiento activo"
      title="Entrenamiento activo"
      className="fixed bottom-36 right-4 z-40 flex items-center gap-2 rounded-full border border-brand-500/40 bg-surface-900/95 px-4 py-3 text-brand-500 shadow-xl shadow-black/40 backdrop-blur transition-colors hover:bg-surface-800 md:bottom-6"
    >
      <Icon name="play" className="size-5" />
      <span className="hidden sm:inline text-xs font-tactical uppercase tracking-widest">
        Entrenamiento activo
      </span>
    </Link>
  );
}