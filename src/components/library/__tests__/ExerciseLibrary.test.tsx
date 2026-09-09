import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseLibrary } from "../ExerciseLibrary";

describe("ExerciseLibrary", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders every seeded exercise as a link", async () => {
    render(<ExerciseLibrary />);
    const links = await screen.findAllByRole("link");
    expect(links).toHaveLength(95);
    const sentadilla = links.find((l) => l.getAttribute("href") === "/app/exercises/leg-01");
    expect(sentadilla?.textContent).toContain("Sentadilla");
    const backSquat = links.find((l) => l.getAttribute("href") === "/app/exercises/cf-wl-01");
    expect(backSquat?.textContent).toContain("Back Squat");
  });

  it("filters by name", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "sentadilla");
    expect(screen.getAllByRole("link", { name: /Sentadilla/ })).toHaveLength(3);
    expect(screen.queryByRole("link", { name: /Back Squat/ })).not.toBeInTheDocument();
  });

  it("shows the override name when an exercise is renamed", async () => {
    window.localStorage.setItem(
      "gymtimer.exerciseOverrides",
      JSON.stringify([{ exerciseId: "leg-01", name: "Sentadilla Búlgara" }])
    );
    render(<ExerciseLibrary />);
    expect(
      await screen.findByRole("link", { name: /Sentadilla Búlgara/ })
    ).toHaveAttribute("href", "/app/exercises/leg-01");
  });

  it("shows Sin resultados when nothing matches", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "zzzz");
    expect(screen.getByText("Sin resultados.")).toBeInTheDocument();
  });
});