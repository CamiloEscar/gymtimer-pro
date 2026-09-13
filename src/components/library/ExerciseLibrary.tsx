"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CatalogExercise } from "@/lib/workout/exerciseCatalog";
import { EXERCISE_CATALOG, getEffectiveCatalog } from "@/lib/workout/exerciseCatalog";
import { CROSSFIT_CATALOG } from "@/lib/workout/exerciseCatalogCrossfit";
import { WEIGHTLIFTING_CATALOG } from "@/lib/workout/exerciseCatalogWeightlifting";
import type { UserExerciseOverride } from "@/types";
import { UserExerciseOverrideRepository } from "@/lib/storage/UserExerciseOverrideRepository";
import { useLocalStorageSnapshot } from "@/hooks/useLocalStorageSnapshot";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

type OriginTag = "gym" | "crossfit" | "weightlifting";
type LibraryExercise = CatalogExercise & { tags: Set<OriginTag> };
type OriginFilter = "all" | OriginTag;

function tagsFor(name: string): Set<OriginTag> {
  const key = name.trim().toLowerCase();
  const tags = new Set<OriginTag>();
  if (GYM_NAMES.has(key)) tags.add("gym");
  if (CROSSFIT_NAMES.has(key)) tags.add("crossfit");
  if (WEIGHTLIFTING_NAMES.has(key)) tags.add("weightlifting");
  return tags;
}

const CROSSFIT_NAMES = new Set(
  CROSSFIT_CATALOG.map((e) => e.name.trim().toLowerCase()),
);
const GYM_NAMES = new Set(
  EXERCISE_CATALOG.map((e) => e.name.trim().toLowerCase()),
);
const WEIGHTLIFTING_NAMES = new Set(
  WEIGHTLIFTING_CATALOG.map((e) => e.name.trim().toLowerCase()),
);

function ThumbnailPreview({ src }: { src?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
    >
      {src && inView && !error ? (
        <video
          src={src}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          onError={() => setError(true)}
          className="size-full object-cover"
        />
      ) : (
        <Icon name="dumbbell" className="size-10 text-phosphor-muted" />
      )}
    </div>
  );
}

function ExerciseCard({
  exercise,
  onPreview,
}: {
  exercise: LibraryExercise;
  onPreview: () => void;
}) {
  return (
    <Link
      href={`/app/exercises/${exercise.id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Card className="p-4 h-full transition-colors hover:border-brand-500/60">
        <div className="relative -mx-4 -mt-4 mb-3 aspect-video overflow-hidden rounded-t-2xl bg-surface-900">
          <ThumbnailPreview src={exercise.videoUrl} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            aria-label={`Reproducir preview de ${exercise.name}`}
            className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-phosphor backdrop-blur-sm">
              <Icon name="play" className="size-4" />
            </span>
          </button>
        </div>
        <p className="text-base font-semibold leading-snug text-phosphor">
          {exercise.name}
        </p>
        <p className="mt-0.5 font-tactical text-xs uppercase tracking-widest text-brand-500">
          {exercise.category}
        </p>
      </Card>
    </Link>
  );
}

export function ExerciseLibrary() {
  const [query, setQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [preview, setPreview] = useState<CatalogExercise | null>(null);
  const overrides = useLocalStorageSnapshot<UserExerciseOverride[]>(
    "gymtimer.exerciseOverrides",
    () => {
      const result = new UserExerciseOverrideRepository().list();
      return result.ok ? result.value : [];
    },
    [],
  );

  const exercisesById = new Map<string, LibraryExercise>();
  function merge(ex: CatalogExercise) {
    const tags = tagsFor(ex.name);
    const existing = exercisesById.get(ex.id);
    if (existing) {
      const merged = new Set(existing.tags);
      tags.forEach((tag) => merged.add(tag));
      exercisesById.set(ex.id, { ...existing, tags: merged });
    } else {
      exercisesById.set(ex.id, { ...ex, tags });
    }
  }
  for (const ex of getEffectiveCatalog(EXERCISE_CATALOG, overrides)) merge(ex);
  for (const ex of getEffectiveCatalog(CROSSFIT_CATALOG, overrides)) merge(ex);
  for (const ex of getEffectiveCatalog(WEIGHTLIFTING_CATALOG, overrides)) merge(ex);
  const exercises: LibraryExercise[] = [...exercisesById.values()];

  const normalized = query.trim().toLowerCase();
  const filtered = exercises
    .filter((ex) => {
      if (originFilter === "all") return true;
      return ex.tags.has(originFilter);
    })
    .filter((ex) =>
      normalized ? ex.name.toLowerCase().includes(normalized) : true,
    );

  const FILTERS: { value: OriginFilter; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "gym", label: "Gimnasio" },
    { value: "crossfit", label: "CrossFit" },
    { value: "weightlifting", label: "Weightlifting" },
  ];

  return (
    <div>
      <div className="px-4 pb-4">
        <Input
          type="search"
          aria-label="Buscar ejercicio"
          placeholder="Buscar ejercicio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="px-4 pb-4 flex gap-2">
        {FILTERS.map(({ value, label }) => (
          <Button
            key={value}
            onClick={() => setOriginFilter(value)}
            variant={originFilter === value ? "primary" : "secondary"}
            size="sm"
            aria-pressed={originFilter === value}
          >
            {label}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="p-4 text-phosphor-dim">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 pb-4">
          {filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onPreview={() => setPreview(exercise)}
            />
          ))}
        </div>
      )}
      {preview && (
        <Modal open onClose={() => setPreview(null)} title={preview.name}>
          {preview.videoUrl ? (
            <video
              src={preview.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="aspect-video w-full rounded-lg bg-surface-950 object-cover"
            />
          ) : (
            <p className="text-phosphor-dim">Este ejercicio no tiene video.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
