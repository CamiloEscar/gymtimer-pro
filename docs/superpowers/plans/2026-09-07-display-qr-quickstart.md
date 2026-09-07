# Display QR Quickstart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Display generate its own session code and show a QR that jumps straight to the workout list on the trainer's phone, pre-linked to that code, so saving/starting a workout there flips the Display straight from "waiting" to the running session — with no code ever typed by hand, while the existing manual-code-entry flow keeps working unchanged for trainers who already started a session on their own device.

**Architecture:** No new sync primitives. `SessionChannel` already broadcasts state the instant `run/page.tsx` mounts, so any Display listening on the matching code flips over automatically — that mechanism is untouched. The only new work is threading a `?code=` query param through five existing files so both sides of an already-working sync end up listening on the same code, plus a small QR-target change and a choice screen on `/display`.

**Tech Stack:** Next.js 16 App Router (Server Components + Client Components), React, TypeScript, Vitest + Testing Library, Tailwind.

## Global Constraints

- Query param name is `code` everywhere (`?code=XYZ123`), matching the six-character format already produced by `generateCode()` (`src/lib/session/generateCode.ts`).
- Both connection paths — QR/auto-generated code, and manual code entry — must keep working; this plan only adds to the manual flow's entry screen, never removes it.
- No changes to `SessionChannel`, `pusherClient`, `WorkoutEngine`, `SessionState`, or the Pusher auth route — the state-broadcast-on-mount behavior in `run/page.tsx:68` already does everything needed once both sides share a code.
- No cross-device workout library sync — `LocalWorkoutRepository` stays `localStorage`-only. Explicitly out of scope (confirmed with user in the design spec).
- Server Components in this Next.js version receive `searchParams` as `Promise<{[key: string]: string | string[] | undefined}>` — must `await` it. Confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` in this repo (this is a version-specific breaking change from Next 14 — do not assume synchronous `searchParams`).
- Client Components needing `useSearchParams()` must sit behind a `<Suspense>` boundary per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`, to avoid deopting the whole route to client-side rendering. Prefer passing `searchParams` down as a prop from a Server Component parent instead of calling the hook, wherever the component tree allows it (Tasks 3 and 4 do this; Task 5 can't, because `RunWorkoutPage` is itself a Client Component page, so it uses the hook + `Suspense`).
- All new UI copy is in Spanish, matching existing strings exactly in tone (e.g. `[ CONECTADO ]`-style bracketed status text already used in `DisplayScreen.tsx` and `DisplayConnection.tsx`).
- Follow existing test conventions: Vitest + `@testing-library/react`, `vi.mock("next/navigation", ...)` per test file (no global mock exists), tests colocated in `__tests__/` next to the file under test.

---

### Task 1: `/display` entry screen — choice between generating and typing a code

**Files:**
- Modify: `src/app/display/page.tsx` (currently 27 lines, full file shown below)
- Test: `src/app/display/__tests__/page.test.tsx` (new file)

**Interfaces:**
- Consumes: `generateCode()` from `@/lib/session/generateCode` (existing, no signature change — returns a `string`).
- Produces: nothing consumed by other tasks — this is a leaf page.

- [ ] **Step 1: Write the failing test**

Create `src/app/display/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DisplayEntryPage from "../page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/session/generateCode", () => ({
  generateCode: () => "NEWCOD",
}));

describe("DisplayEntryPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("shows a choice between generating a new code and entering an existing one", () => {
    render(<DisplayEntryPage />);
    expect(screen.getByRole("button", { name: "Generar código nuevo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya tengo un código" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Código de conexión")).not.toBeInTheDocument();
  });

  it("navigates to a freshly generated code when choosing to generate one", () => {
    render(<DisplayEntryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generar código nuevo" }));
    expect(pushMock).toHaveBeenCalledWith("/display/NEWCOD");
  });

  it("reveals the manual code input when choosing 'Ya tengo un código'", () => {
    render(<DisplayEntryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Ya tengo un código" }));
    expect(screen.getByLabelText("Código de conexión")).toBeInTheDocument();
  });

  it("navigates to the typed code once it reaches 6 characters", () => {
    render(<DisplayEntryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Ya tengo un código" }));
    fireEvent.change(screen.getByLabelText("Código de conexión"), { target: { value: "abc123" } });
    fireEvent.click(screen.getByRole("button", { name: "Conectar" }));
    expect(pushMock).toHaveBeenCalledWith("/display/ABC123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/display/__tests__/page.test.tsx`
Expected: FAIL — the current page renders only the manual-entry UI, so "Generar código nuevo" / "Ya tengo un código" buttons don't exist.

- [ ] **Step 3: Write the implementation**

Replace `src/app/display/page.tsx` entirely with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCode } from "@/lib/session/generateCode";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Mode = "choice" | "manual";

export default function DisplayEntryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choice");
  const [code, setCode] = useState("");

  if (mode === "choice") {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold text-white">Abrir una pantalla</h1>
        <Button size="lg" onClick={() => router.push(`/display/${generateCode()}`)}>
          Generar código nuevo
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setMode("manual")}>
          Ya tengo un código
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold text-white">Abrir una pantalla</h1>
      <Input
        aria-label="Código de conexión"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        className="max-w-xs text-center text-2xl font-mono"
      />
      <Button size="lg" onClick={() => router.push(`/display/${code}`)} disabled={code.length !== 6}>
        Conectar
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/display/__tests__/page.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/display/page.tsx src/app/display/__tests__/page.test.tsx
git commit -m "feat: add code-generation choice to Display entry screen"
```

---

### Task 2: QR on `/display/[code]` points at the workout list, not itself

**Files:**
- Modify: `src/components/display/DisplayConnection.tsx:20`
- Test: `src/components/display/__tests__/DisplayConnection.test.tsx` (new file)

**Interfaces:**
- Consumes: nothing new — `code` prop already exists on `DisplayConnectionProps`.
- Produces: nothing consumed by other tasks — this component only reads the `code` prop passed to it by `src/app/display/[code]/page.tsx`, which is unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/components/display/__tests__/DisplayConnection.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DisplayConnection } from "../DisplayConnection";

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code" data-value={value} />,
}));

describe("DisplayConnection", () => {
  it("points the QR code at the workout-list quickstart URL, not at itself", async () => {
    render(<DisplayConnection code="ABC123" status="waiting" />);
    await waitFor(() => {
      expect(screen.getByTestId("qr-code")).toHaveAttribute(
        "data-value",
        `${window.location.origin}/app/workouts?code=ABC123`
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/display/__tests__/DisplayConnection.test.tsx`
Expected: FAIL — current `value` is `${origin}/display/ABC123`, not `${origin}/app/workouts?code=ABC123`.

- [ ] **Step 3: Write the implementation**

In `src/components/display/DisplayConnection.tsx`, change line 20:

```tsx
    setUrl(`${window.location.origin}/display/${code}`);
```

to:

```tsx
    setUrl(`${window.location.origin}/app/workouts?code=${code}`);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/display/__tests__/DisplayConnection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/display/DisplayConnection.tsx src/components/display/__tests__/DisplayConnection.test.tsx
git commit -m "feat: point Display QR at the workout list instead of itself"
```

---

### Task 3: `/app/workouts` propagates `?code=` to "Iniciar" and "+ Nuevo entrenamiento"

**Files:**
- Modify: `src/app/app/workouts/page.tsx` (full file, 17 lines)
- Modify: `src/components/workout/WorkoutList.tsx` (full file, 65 lines)
- Modify: `src/components/workout/WorkoutCard.tsx` (full file, 42 lines)
- Test: `src/app/app/workouts/__tests__/page.test.tsx` (new file)

**Interfaces:**
- Consumes: `LocalWorkoutRepository` (existing, unchanged) — `.save()` returns `Result<Workout, StorageError>` with `.value.id`.
- Produces: `WorkoutList` now takes an optional `code?: string` prop. `WorkoutCard` now takes an optional `code?: string` prop. Later tasks don't consume these directly (Task 4 and 5 are independent downstream pages reached via the links these components render), but keep the prop names `code` consistent — Task 4 and 5 also name their code variables `code`.

- [ ] **Step 1: Write the failing test**

Create `src/app/app/workouts/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkoutsPage from "../page";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import type { Workout } from "@/types";

function seedWorkout(): Workout {
  const workout: Workout = {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [{ id: "b1", type: "amrap", durationSeconds: 600, exercises: [{ id: "e1", name: "Pull-up", reps: 10 }] }],
  };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

describe("WorkoutsPage code propagation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows no connecting banner and plain links without a code", async () => {
    seedWorkout();
    const ui = await WorkoutsPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.queryByText(/CONECTANDO A PANTALLA/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "▶ Iniciar" })).toHaveAttribute(
      "href",
      "/app/workouts/w1/run"
    );
    expect(screen.getByRole("link", { name: "+ Nuevo entrenamiento" })).toHaveAttribute(
      "href",
      "/app/workouts/new"
    );
  });

  it("shows a connecting banner and propagates the code to run and new-workout links", async () => {
    seedWorkout();
    const ui = await WorkoutsPage({ searchParams: Promise.resolve({ code: "ABC123" }) });
    render(ui);
    expect(screen.getByText(/CONECTANDO A PANTALLA: ABC123/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "▶ Iniciar" })).toHaveAttribute(
      "href",
      "/app/workouts/w1/run?code=ABC123"
    );
    expect(screen.getByRole("link", { name: "+ Nuevo entrenamiento" })).toHaveAttribute(
      "href",
      "/app/workouts/new?code=ABC123"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/app/workouts/__tests__/page.test.tsx`
Expected: FAIL — `WorkoutsPage` doesn't accept `searchParams` yet, and links don't carry `?code=`.

- [ ] **Step 3: Write the implementation**

Replace `src/app/app/workouts/page.tsx` entirely with:

```tsx
import Link from "next/link";
import { WorkoutList } from "@/components/workout/WorkoutList";
import { Button } from "@/components/ui/Button";

interface WorkoutsPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
  const { code } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-white">Entrenamientos</h1>
        <Link href={code ? `/app/workouts/new?code=${code}` : "/app/workouts/new"}>
          <Button>+ Nuevo entrenamiento</Button>
        </Link>
      </div>
      {code && (
        <p className="px-4 pb-2 text-xs uppercase tracking-widest text-brand-500">
          [ CONECTANDO A PANTALLA: {code} ]
        </p>
      )}
      <WorkoutList code={code} />
    </div>
  );
}
```

Replace `src/components/workout/WorkoutList.tsx` entirely with:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WorkoutCard } from "./WorkoutCard";

interface WorkoutListProps {
  code?: string;
}

export function WorkoutList({ code }: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  const repo = new LocalWorkoutRepository();

  function reload() {
    const result = repo.list();
    setWorkouts(result.ok ? result.value : []);
  }

  useEffect(() => {
    reload();
  }, []);

  function confirmDelete() {
    if (!pendingDelete) return;
    repo.delete(pendingDelete.id);
    setPendingDelete(null);
    reload();
  }

  if (workouts.length === 0) {
    return <p className="text-gray-400 p-4">Todavía no hay entrenamientos. Creá el primero.</p>;
  }

  return (
    <div className="space-y-3 p-4">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          code={code}
          onDuplicate={(id) => {
            repo.duplicate(id);
            reload();
          }}
          onDelete={() => setPendingDelete(workout)}
        />
      ))}
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={`¿Eliminar '${pendingDelete?.name ?? ""}'?`}
      >
        <p className="text-gray-400 mb-4">Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```

Replace `src/components/workout/WorkoutCard.tsx` entirely with:

```tsx
"use client";

import Link from "next/link";
import type { Workout } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WorkoutCardProps {
  workout: Workout;
  code?: string;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkoutCard({ workout, code, onDuplicate, onDelete }: WorkoutCardProps) {
  const n = workout.blocks.length;
  const runHref = code
    ? `/app/workouts/${workout.id}/run?code=${code}`
    : `/app/workouts/${workout.id}/run`;

  return (
    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-white font-semibold">{workout.name}</p>
        <p className="text-sm text-gray-400">
          {n} bloque{n === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={runHref}>
          <Button size="md">▶ Iniciar</Button>
        </Link>
        <Link href={`/app/workouts/${workout.id}`}>
          <Button size="md" variant="secondary">
            ✏ Editar
          </Button>
        </Link>
        <Button size="md" variant="secondary" onClick={() => onDuplicate(workout.id)} aria-label="Duplicar entrenamiento">
          📋
        </Button>
        <Button size="md" variant="danger" onClick={() => onDelete(workout.id)} aria-label="Eliminar entrenamiento">
          🗑
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/app/workouts/__tests__/page.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full suite to catch regressions in existing WorkoutCard/WorkoutList usages**

Run: `npx vitest run`
Expected: PASS, same or higher total than before this task (no existing test named these components, but `WorkoutBuilder`/other integration paths may render `WorkoutList`/`WorkoutCard` indirectly)

- [ ] **Step 6: Commit**

```bash
git add src/app/app/workouts/page.tsx src/components/workout/WorkoutList.tsx src/components/workout/WorkoutCard.tsx src/app/app/workouts/__tests__/page.test.tsx
git commit -m "feat: propagate Display session code through the workouts list"
```

---

### Task 4: Saving a workout with a code redirects straight to `run?code=`

**Files:**
- Modify: `src/components/workout/WorkoutBuilder.tsx:17-48` (props + `handleSave`)
- Modify: `src/app/app/workouts/new/page.tsx` (full file, 5 lines)
- Test: `src/components/workout/__tests__/WorkoutBuilder.test.tsx` (new file)

**Interfaces:**
- Consumes: `LocalWorkoutRepository.save()` (existing, unchanged) returns `Result<Workout, StorageError>`.
- Produces: `WorkoutBuilder` now takes an optional `code?: string` prop alongside the existing `initialWorkout?: Workout`. `src/app/app/workouts/[id]/page.tsx` (the edit page) is NOT modified — it keeps calling `<WorkoutBuilder initialWorkout={workout} />` without `code`, so editing an existing workout is unaffected.

- [ ] **Step 1: Write the failing test**

Create `src/components/workout/__tests__/WorkoutBuilder.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutBuilder } from "../WorkoutBuilder";
import type { Workout } from "@/types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function validWorkout(): Workout {
  return {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        exercises: [{ id: "e1", name: "Pull-up", reps: 10 }],
      },
    ],
  };
}

describe("WorkoutBuilder save redirect", () => {
  beforeEach(() => {
    pushMock.mockClear();
    window.localStorage.clear();
  });

  it("redirects to the workouts list when saved without a code", () => {
    render(<WorkoutBuilder initialWorkout={validWorkout()} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar entrenamiento" }));
    expect(pushMock).toHaveBeenCalledWith("/app/workouts");
  });

  it("redirects straight to the run page with the code when saved with a code", () => {
    render(<WorkoutBuilder initialWorkout={validWorkout()} code="ABC123" />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar entrenamiento" }));
    expect(pushMock).toHaveBeenCalledWith("/app/workouts/w1/run?code=ABC123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/workout/__tests__/WorkoutBuilder.test.tsx`
Expected: FAIL — second test fails, `pushMock` was called with `"/app/workouts"` regardless of a `code` prop (which doesn't exist yet).

- [ ] **Step 3: Write the implementation**

In `src/components/workout/WorkoutBuilder.tsx`, change lines 17-21:

```tsx
interface WorkoutBuilderProps {
  initialWorkout?: Workout;
}

export function WorkoutBuilder({ initialWorkout }: WorkoutBuilderProps) {
```

to:

```tsx
interface WorkoutBuilderProps {
  initialWorkout?: Workout;
  code?: string;
}

export function WorkoutBuilder({ initialWorkout, code }: WorkoutBuilderProps) {
```

Then change `handleSave` (lines 36-48):

```tsx
  function handleSave() {
    const validationErrors = validateWorkout(workout);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const repo = new LocalWorkoutRepository();
    const result = repo.save(workout);
    if (!result.ok) {
      setErrors([{ message: result.error.message }]);
      return;
    }
    router.push("/app/workouts");
  }
```

to:

```tsx
  function handleSave() {
    const validationErrors = validateWorkout(workout);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const repo = new LocalWorkoutRepository();
    const result = repo.save(workout);
    if (!result.ok) {
      setErrors([{ message: result.error.message }]);
      return;
    }
    if (code) {
      router.push(`/app/workouts/${result.value.id}/run?code=${code}`);
      return;
    }
    router.push("/app/workouts");
  }
```

Replace `src/app/app/workouts/new/page.tsx` entirely with:

```tsx
import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";

interface NewWorkoutPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function NewWorkoutPage({ searchParams }: NewWorkoutPageProps) {
  const { code } = await searchParams;
  return <WorkoutBuilder code={code} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/workout/__tests__/WorkoutBuilder.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/workout/WorkoutBuilder.tsx src/app/app/workouts/new/page.tsx src/components/workout/__tests__/WorkoutBuilder.test.tsx
git commit -m "feat: redirect straight to the run page when saving a workout with a Display code"
```

---

### Task 5: `run` page uses the code from the URL when present

**Files:**
- Modify: `src/app/app/workouts/[id]/run/page.tsx` (full file, 144 lines — restructured, see below)
- Test: `src/app/app/workouts/[id]/run/__tests__/page.test.tsx` (new file)

**Interfaces:**
- Consumes: `generateCode()` from `@/lib/session/generateCode` (existing). `SessionChannel` from `@/lib/session/SessionChannel` (existing, constructor signature `new SessionChannel(code: string, role: "trainer" | "display")` unchanged).
- Produces: nothing consumed by other tasks — this is the last stop in the chain.

- [ ] **Step 1: Write the failing test**

Create `src/app/app/workouts/[id]/run/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RunWorkoutPage from "../page";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { SessionChannel } from "@/lib/session/SessionChannel";
import type { Workout } from "@/types";

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "w1" }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/session/SessionChannel", () => ({
  SessionChannel: vi.fn().mockImplementation(() => ({
    sendState: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("@/lib/session/generateCode", () => ({
  generateCode: () => "NEWCOD",
}));

function seedWorkout(): Workout {
  const workout: Workout = {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [
      {
        id: "b1",
        type: "amrap",
        durationSeconds: 600,
        exercises: [{ id: "e1", name: "Pull-up", reps: 10 }],
      },
    ],
  };
  new LocalWorkoutRepository().save(workout);
  return workout;
}

describe("RunWorkoutPage session code", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams = new URLSearchParams();
    vi.mocked(SessionChannel).mockClear();
  });

  it("uses the code from the URL when present", async () => {
    seedWorkout();
    mockSearchParams = new URLSearchParams({ code: "ABC123" });
    render(<RunWorkoutPage />);
    await screen.findByText(/ABC123/);
    expect(SessionChannel).toHaveBeenCalledWith("ABC123", "trainer");
  });

  it("generates a new code when the URL has none", async () => {
    seedWorkout();
    render(<RunWorkoutPage />);
    await screen.findByText(/NEWCOD/);
    expect(SessionChannel).toHaveBeenCalledWith("NEWCOD", "trainer");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "src/app/app/workouts/[id]/run/__tests__/page.test.tsx"`
Expected: FAIL — `useSearchParams` isn't imported/used yet, code is always freshly generated via the top-level `useState(() => generateCode())`, so the "uses the code from the URL" test fails (page shows `NEWCOD` regardless of the mocked search params).

- [ ] **Step 3: Write the implementation**

Replace `src/app/app/workouts/[id]/run/page.tsx` entirely with:

```tsx
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Workout } from "@/types";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFullscreen } from "@/hooks/useFullscreen";
import { SessionChannel } from "@/lib/session/SessionChannel";
import { generateCode } from "@/lib/session/generateCode";
import { AudioManager } from "@/lib/audio/AudioManager";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PhaseIndicator } from "@/components/timer/PhaseIndicator";
import { RoundIndicator } from "@/components/timer/RoundIndicator";
import { TimerControls } from "@/components/timer/TimerControls";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export default function RunWorkoutPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);
  const audio = useMemo(() => new AudioManager({ enabled: true, voiceEnabled: false }), []);

  useEffect(() => {
    const repo = new LocalWorkoutRepository();
    const result = repo.get(params.id);
    setWorkout(result.ok ? result.value : null);
  }, [params.id]);

  if (workout === undefined) return <p className="p-4 text-white">Cargando…</p>;
  if (workout === null) return <p className="p-4 text-white">Entrenamiento no encontrado.</p>;

  return (
    <Suspense fallback={<p className="p-4 text-white">Cargando…</p>}>
      <RunWorkoutContent workout={workout} audio={audio} />
    </Suspense>
  );
}

function RunWorkoutContent({
  workout,
  audio,
}: {
  workout: Workout;
  audio: AudioManager;
}) {
  const searchParams = useSearchParams();
  const [code] = useState(() => searchParams.get("code") ?? generateCode());
  const session = useWorkoutSession(workout);
  const channelRef = useRef<SessionChannel | null>(null);
  const { toggle: toggleFullscreen } = useFullscreen();
  const [resetPending, setResetPending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Created and destroyed in the same effect (rather than via useMemo + a
  // separate cleanup effect) so React Strict Mode's dev-only double-invoke
  // of effects always pairs a channel's creation with its own destroy call,
  // instead of destroying a memoized channel that a later effect still holds.
  useEffect(() => {
    const channel = new SessionChannel(code, "trainer");
    channelRef.current = channel;
    return () => {
      channel.destroy();
      channelRef.current = null;
    };
  }, [code]);

  useEffect(() => {
    channelRef.current?.sendState({ ...session.state, code });
    if (session.state.status === "finished") audio.playFinish();
  }, [session.state, code, audio]);

  useKeyboardShortcuts({
    onPauseResume: () => (session.state.status === "running" ? session.pause() : session.resume()),
    onReset: () => setResetPending(true),
    onNext: () => session.nextRound(),
    onPrevious: () => session.previousRound(),
    onFullscreen: toggleFullscreen,
  });

  function handleStart() {
    audio.unlock();
    audio.playStart();
    session.start();
  }

  function confirmReset() {
    session.reset();
    setResetPending(false);
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-gray-400 flex items-center gap-2">
        Código de pantalla: <span className="font-mono text-white">{code}</span>
        <Button size="md" variant="secondary" onClick={handleCopyCode} aria-label="Copiar código">
          {copied ? "Copiado ✓" : "Copiar código"}
        </Button>
        <Link href={`/display/${code}`} className="text-brand-500 underline">
          abrir pantalla
        </Link>
      </p>
      <PhaseIndicator phase={session.state.currentPhase} />
      <TimerDisplay
        remainingMs={session.state.timer.remainingMs}
        elapsedMs={session.state.timer.elapsedMs}
        mode={session.state.timer.mode}
      />
      <RoundIndicator round={session.state.currentRound} totalRounds={session.state.totalRounds} />
      <TimerControls
        status={session.state.status}
        onStart={handleStart}
        onPause={session.pause}
        onResume={session.resume}
        onReset={() => setResetPending(true)}
        onNext={session.nextRound}
        onPrevious={session.previousRound}
        onAddTime={() => session.addTime(10_000)}
        onSubtractTime={() => session.subtractTime(10_000)}
      />
      <Modal
        open={resetPending}
        onClose={() => setResetPending(false)}
        title="¿Reiniciar el entrenamiento?"
      >
        <p className="text-gray-400 mb-4">Se perderá el progreso de la sesión actual.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResetPending(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmReset}>
            Reiniciar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```

The only behavioral change from the current file: `code` used to always be `useState(() => generateCode())` at the top of `RunWorkoutPage`; it's now derived inside `RunWorkoutContent` (behind `Suspense`, so `useSearchParams` is safe) as `searchParams.get("code") ?? generateCode()`. Every other line — `SessionChannel` wiring, keyboard shortcuts, controls, modal — is byte-for-byte the same, just moved from one component split point to the same split point (the file already had `RunWorkoutPage` / `RunWorkoutContent` as two components; only the `code` state's location and the `Suspense` wrapper are new).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "src/app/app/workouts/[id]/run/__tests__/page.test.tsx"`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS, all tests including the 4 new files from Tasks 1-5

- [ ] **Step 6: Commit**

```bash
git add "src/app/app/workouts/[id]/run/page.tsx" "src/app/app/workouts/[id]/run/__tests__/page.test.tsx"
git commit -m "feat: use the Display's session code on the run page when present"
```

---

## Manual verification (after all 5 tasks)

Automated tests cover the branching logic in isolation. Before calling this done, drive the real flow end-to-end in a browser (dev server + Pusher env vars already confirmed working from the previous cycle):

1. Open `/display` → choose "Generar código nuevo" → lands on `/display/{code}` showing the QR and code.
2. Scan (or manually copy) the QR URL, open it in a second tab: `/app/workouts?code={code}` → confirm the `[ CONECTANDO A PANTALLA: ... ]` banner shows and `+ Nuevo entrenamiento` link carries `?code=`.
3. Build and save a new workout from that tab → confirm it lands directly on `/app/workouts/{id}/run?code={code}` (not the list).
4. Confirm the Display tab (still on the waiting screen from step 1) flips automatically to the running session view, with no manual code entry anywhere.
5. Separately, confirm the old manual flow still works: `/display` → "Ya tengo un código" → type a code from an independently-started `run` page (no `?code=` in its URL) → confirms.
