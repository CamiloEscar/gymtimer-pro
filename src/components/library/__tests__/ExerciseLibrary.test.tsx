import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseLibrary } from "../ExerciseLibrary";

function cardLinks() {
  // Cards live under /app/exercises/<id>; the AppHeader / MobileTabBar
  // links point to /app/exercises (no id) so they don't match this regex.
  return screen
    .getAllByRole("link")
    .filter((l) => /^\/app\/exercises\/(?!$)/.test(l.getAttribute("href") ?? ""));
}

function sentadillaCard() {
  return cardLinks().find((l) => l.getAttribute("href") === "/app/exercises/leg-01");
}

describe("ExerciseLibrary", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders every seeded exercise as a link", async () => {
    render(<ExerciseLibrary />);
    const links = await cardLinks();
    expect(links).toHaveLength(123);
    const sentadilla = links.find((l) => l.getAttribute("href") === "/app/exercises/leg-01");
    expect(sentadilla?.textContent).toContain("Sentadilla");
    const backSquat = links.find((l) => l.getAttribute("href") === "/app/exercises/cf-wl-01");
    expect(backSquat?.textContent).toContain("Back Squat");
    const bench = links.find((l) => l.getAttribute("href") === "/app/exercises/wl-03");
    expect(bench?.textContent).toContain("Bench Press");
  });

  it("filters by name", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "sentadilla");
    expect(cardLinks().filter((l) => /Sentadilla/.test(l.textContent || ""))).toHaveLength(3);
    expect(
      cardLinks().find((l) => /Back Squat/.test(l.textContent || ""))
    ).toBeUndefined();
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

  it("shows Todos by default and renders the 123 cards", async () => {
    render(<ExerciseLibrary />);
    const allButton = screen.getByRole("button", { name: "Todos" });
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(await cardLinks()).toHaveLength(123);
  });

  it("filters to gym catalog when Gimnasio is selected", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(screen.getByRole("button", { name: "Gimnasio" }));
    expect(screen.getByRole("button", { name: "Gimnasio" })).toHaveAttribute("aria-pressed", "true");
    // 50 gym entries + 2 cf entries (Kettlebell Swing, Box Jump) that share
    // a name with the gym catalog get the gym tag too.
    expect(cardLinks()).toHaveLength(52);
    expect(cardLinks().filter((l) => /Sentadilla/.test(l.textContent || "")).length).toBeGreaterThan(0);
    expect(
      cardLinks().find((l) => /Back Squat/.test(l.textContent || ""))
    ).toBeUndefined();
  });

  it("filters to weightlifting when Weightlifting is selected", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(screen.getByRole("button", { name: "Weightlifting" }));
    expect(screen.getByRole("button", { name: "Weightlifting" })).toHaveAttribute("aria-pressed", "true");
    // 28 wl entries + 3 cf entries (Back Squat, Front Squat, Power Clean)
    // that share a name with the weightlifting catalog.
    expect(cardLinks()).toHaveLength(31);
    expect(
      cardLinks().find((l) => /Bench Press/.test(l.textContent || ""))
    ).toBeDefined();
    expect(
      cardLinks().find((l) => /Romanian Deadlift/.test(l.textContent || ""))
    ).toBeDefined();
    expect(
      cardLinks().find((l) => /Sentadilla/.test(l.textContent || ""))
    ).toBeUndefined();
  });

  it("filters to crossfit catalog when CrossFit is selected", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.click(screen.getByRole("button", { name: "CrossFit" }));
    expect(screen.getByRole("button", { name: "CrossFit" })).toHaveAttribute("aria-pressed", "true");
    // 45 cf entries + 2 gym entries (Kettlebell Swing, Box Jump) + 3 wl
    // entries (Back/Front Squat, Power Clean) that share a name with cf.
    expect(cardLinks()).toHaveLength(50);
    expect(
      cardLinks().find((l) => /Back Squat/.test(l.textContent || ""))
    ).toBeDefined();
    expect(
      cardLinks().find((l) => /Sentadilla/.test(l.textContent || ""))
    ).toBeUndefined();
  });

  it("shows origin badges telling gym, crossfit and lifting apart", async () => {
    render(<ExerciseLibrary />);
    const bench = cardLinks().find((l) => l.getAttribute("href") === "/app/exercises/wl-03");
    expect(within(bench!).getByText("Lifting")).toBeInTheDocument();
    expect(within(bench!).queryByText("Gimnasio")).not.toBeInTheDocument();

    const sentadilla = cardLinks().find(
      (l) => l.getAttribute("href") === "/app/exercises/leg-01"
    );
    expect(within(sentadilla!).getByText("Gimnasio")).toBeInTheDocument();
    expect(within(sentadilla!).queryByText("Lifting")).not.toBeInTheDocument();

    // Back Squat lives in both the CrossFit and the weightlifting catalog.
    const backSquat = cardLinks().find(
      (l) => l.getAttribute("href") === "/app/exercises/cf-wl-01"
    );
    expect(within(backSquat!).getByText("Crossfit")).toBeInTheDocument();
    expect(within(backSquat!).getByText("Lifting")).toBeInTheDocument();
    expect(within(backSquat!).queryByText("Gimnasio")).not.toBeInTheDocument();
  });

  it("combines search with the origin filter", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibrary />);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "press");
    // Gym catalog has Press banca, Press banca inclinado, Press con mancuernas,
    // Press militar, Press Arnold.
    await user.click(screen.getByRole("button", { name: "Gimnasio" }));
    expect(cardLinks()).toHaveLength(5);
    // CrossFit has no literal "press" lift — Push Press counts (1 match).
    await user.click(screen.getByRole("button", { name: "CrossFit" }));
    expect(cardLinks()).toHaveLength(1);
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
    expect(cardLinks()).toHaveLength(52);
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    await user.type(screen.getByLabelText("Buscar ejercicio"), "sentadilla");
    expect(cardLinks().filter((l) => /Sentadilla/.test(l.textContent || ""))).toHaveLength(3);
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