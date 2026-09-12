"use client";

import Link from "next/link";
import { useLocalStorageSnapshot } from "@/hooks/useLocalStorageSnapshot";
import { Icon } from "@/components/ui/Icon";

interface ActiveSession {
  workoutId: string;
  code: string;
}

export function ActiveDisplayFloater() {
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

  if (!active?.code) return null;

  return (
    <Link
      href={`/display/${active.code}`}
      aria-label="Volver a la pantalla del display"
      title="Volver a la pantalla del display"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-brand-500/40 bg-surface-900/95 px-4 py-3 text-brand-500 shadow-xl shadow-black/40 backdrop-blur transition-colors hover:bg-surface-800 md:bottom-6"
    >
      <Icon name="display" className="size-5" />
      <span className="hidden sm:inline text-xs font-tactical uppercase tracking-widest">
        Display
      </span>
    </Link>
  );
}