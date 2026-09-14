import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutCard } from "../WorkoutCard";
import { GymProfileRepository } from "@/lib/storage/GymProfileRepository";
import { LocalWorkoutRepository } from "@/lib/storage/LocalWorkoutRepository";
import type { Workout } from "@/types";

function workout(): Workout {
  return {
    id: "w1",
    name: "Murph",
    createdAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    blocks: [],
  };
}

describe("WorkoutCard icon buttons", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders accessible buttons with aria-label and 44px touch targets", () => {
    render(
      <WorkoutCard
        workout={workout()}
        onDuplicate={() => {}}
        onDelete={() => {}}
      />
    );
    const dest = screen.getByRole("button", { name: /destacar como rutina/i });
    const dup = screen.getByRole("button", { name: /duplicar entrenamiento/i });
    const del = screen.getByRole("button", { name: /eliminar entrenamiento/i });
    for (const b of [dest, dup, del]) {
      expect(b.className).toMatch(/min-h-11/);
      expect(b.className).toMatch(/min-w-11/);
    }
  });

  it("renders visible labels in DOM for md+", () => {
    render(
      <WorkoutCard
        workout={workout()}
        onDuplicate={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByText("Destacar")).toBeInTheDocument();
    expect(screen.getByText("Duplicar")).toBeInTheDocument();
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });

  it("toggles 'Destacar' to 'Quitar' when pinned as WOD", () => {
    new GymProfileRepository().save({ name: "Box", wodWorkoutId: "w1" });
    render(
      <WorkoutCard
        workout={workout()}
        onDuplicate={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByText("Quitar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /quitar como destacada/i })).toBeInTheDocument();
  });

  it("calls onDuplicate when the duplicate button is clicked", () => {
    const onDuplicate = vi.fn();
    render(
      <WorkoutCard
        workout={workout()}
        onDuplicate={onDuplicate}
        onDelete={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /duplicar entrenamiento/i }));
    expect(onDuplicate).toHaveBeenCalledWith("w1");
  });

  it("calls onDelete when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <WorkoutCard
        workout={workout()}
        onDuplicate={() => {}}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /eliminar entrenamiento/i }));
    expect(onDelete).toHaveBeenCalledWith("w1");
  });

  it("toggles pinned state and persists to gym profile", () => {
    new LocalWorkoutRepository().save(workout());
    render(
      <WorkoutCard
        workout={workout()}
        onDuplicate={() => {}}
        onDelete={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /destacar como rutina/i }));
    const stored = JSON.parse(window.localStorage.getItem("gymtimer.gymProfile")!);
    expect(stored.wodWorkoutId).toBe("w1");
  });
});