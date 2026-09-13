import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseLibrary } from "../ExerciseLibrary";

function sentadillaCard() {
  return screen
    .getAllByRole("link")
    .find((l) => l.getAttribute("href") === "/app/exercises/leg-01");
}

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

  it("shows Todos by default and renders the 95 cards", async () => {
    render(<ExerciseLibrary />);
    const allButton = screen.getByRole("button", { name: "Todos" });
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findAllByRole("link")).toHaveLength(95);
  });

  it("filters to gym + both when Gimnasio is selected", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(screen.getByRole("button", { name: "Gimnasio" }));
    expect(screen.getByRole("button", { name: "Gimnasio" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("link")).toHaveLength(52);
    expect(screen.getAllByRole("link", { name: /Sentadilla/ }).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: /Back Squat/ })
    ).not.toBeInTheDocument();
  });

  it("filters to crossfit + both when CrossFit is selected", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(screen.getByRole("button", { name: "CrossFit" }));
    expect(screen.getByRole("button", { name: "CrossFit" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("link")).toHaveLength(47);
    expect(screen.getByRole("link", { name: /Back Squat/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Sentadilla/ })
    ).not.toBeInTheDocument();
  });

  it("combines search with the origin filter", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "press");
    await user.click(screen.getByRole("button", { name: "Gimnasio" }));
    expect(screen.getAllByRole("link")).toHaveLength(5);
    await user.click(screen.getByRole("button", { name: "CrossFit" }));
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows Sin resultados when a search matches nothing under any filter", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "zzzz");
    expect(screen.getByText("Sin resultados.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "CrossFit" }));
    expect(screen.getByText("Sin resultados.")).toBeInTheDocument();
  });

  it("shows a flat grid for any result count, without section headings", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(screen.getByRole("button", { name: "Gimnasio" }));
    expect(screen.getAllByRole("link")).toHaveLength(52);
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "sentadilla");
    expect(screen.getAllByRole("link", { name: /Sentadilla/ })).toHaveLength(3);
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  it("renders the play overlay as a button with a descriptive aria-label", async () => {
    render(<ExerciseLibrary />);
    const card = sentadillaCard();
    expect(card).toBeDefined();
    const play = within(card!).getByRole("button", {
      name: "Reproducir preview de Sentadilla",
    });
    expect(play).toBeInTheDocument();
  });

  it("opens the modal with the exercise video when the play button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    const card = sentadillaCard();
    await user.click(
      within(card!).getByRole("button", {
        name: "Reproducir preview de Sentadilla",
      })
    );
    const dialog = screen.getByRole("dialog", { name: /Sentadilla/ });
    expect(dialog).toBeInTheDocument();
    const video = dialog.querySelector("video") as HTMLVideoElement | null;
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "/exercises/leg-01.mp4");
    expect(video!.autoplay).toBe(true);
    expect(video!.muted).toBe(true);
    expect(video!.loop).toBe(true);
  });

  it("does not open the modal when clicking elsewhere on the card", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    const card = sentadillaCard();
    await user.click(within(card!).getByText("Sentadilla"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal via the close button", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(
      within(sentadillaCard()!).getByRole("button", {
        name: "Reproducir preview de Sentadilla",
      })
    );
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal via Escape", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(
      within(sentadillaCard()!).getByRole("button", {
        name: "Reproducir preview de Sentadilla",
      })
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal when clicking outside it", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(
      within(sentadillaCard()!).getByRole("button", {
        name: "Reproducir preview de Sentadilla",
      })
    );
    await user.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});