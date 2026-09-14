"use client";

import Link from "next/link";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "@/hooks/useLocalStorageSnapshot";
import { Icon } from "@/components/ui/Icon";
import type { GymProfile } from "@/lib/storage/GymProfileRepository";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";

const DISMISS_KEY = "gymtimer.onboarding.checklistDismissed";

export function FirstRunChecklist() {
  const profileRepo = new GymProfileRepository();
  const workoutsRepo = new LocalWorkoutRepository();

  const profile = useLocalStorageSnapshot<GymProfile>(
    "gymtimer.gymProfile",
    () => {
      const result = profileRepo.get();
      return result.ok ? result.value : { name: "" };
    },
    { name: "" }
  );
  const workouts = useLocalStorageSnapshot<Workout[]>(
    "gymtimer.workouts",
    () => {
      const result = workoutsRepo.list();
      return result.ok ? result.value : [];
    },
    []
  );
  const dismissed = useLocalStorageSnapshot(
    DISMISS_KEY,
    () => window.localStorage.getItem(DISMISS_KEY) === "1",
    false
  );

  const gymDone = profile.name.trim().length > 0;
  const routineDone = workouts.length > 0;
  if (gymDone && routineDone) return null;
  if (dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    notifyLocalStorageChange();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-500/40 bg-surface-900 p-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar checklist de primeros pasos"
        title="Cerrar"
        className="absolute right-3 top-3 inline-flex items-center justify-center size-10 rounded-md text-phosphor-dim hover:text-phosphor active:scale-95 transition-colors cursor-pointer"
      >
        <Icon name="close" className="size-4" />
      </button>
      <p className="font-tactical text-xs uppercase tracking-widest text-brand-500">
        Primeros pasos
      </p>
      <ol className="mt-3 space-y-1">
        <Item done={gymDone} href="/app/settings">
          Configurá tu gym
        </Item>
        <Item done={routineDone} href="/app/workouts/new">
          Creá tu primera rutina
        </Item>
      </ol>
    </div>
  );
}

function Item({
  done,
  href,
  children,
}: {
  done: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 text-xs text-phosphor">
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border font-tactical text-xs ${
          done
            ? "border-brand-500 bg-brand-500 text-black"
            : "border-brand-500/40 text-brand-500"
        }`}
      >
        {done ? <Icon name="check" className="size-3" /> : "·"}
      </span>
      {done ? (
        <span className="text-phosphor-dim line-through">{children}</span>
      ) : (
        <Link
          href={href}
          className="hover:text-brand-500 transition-colors underline-offset-4 hover:underline"
        >
          {children}
        </Link>
      )}
    </li>
  );
}