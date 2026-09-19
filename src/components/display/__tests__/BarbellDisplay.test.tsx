import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BarbellDisplay } from "../BarbellDisplay";

describe("BarbellDisplay", () => {
  it("shows the loaded total and per-side breakdown", () => {
    render(<BarbellDisplay weightKg={100} />);
    expect(screen.getByTestId("barbell-weight")).toHaveTextContent("100 KG");
    expect(
      screen.getByText(/20 \+ 20 POR LADO · BARRA 20 KG/i)
    ).toBeInTheDocument();
  });

  it("treats up-to-bar weights as a bare bar", () => {
    render(<BarbellDisplay weightKg={20} />);
    expect(screen.getByTestId("barbell-weight")).toHaveTextContent("20 KG");
    expect(screen.getByText(/SOLO BARRA 20 KG/i)).toBeInTheDocument();
  });

  it("honors a custom bar weight in the breakdown", () => {
    render(<BarbellDisplay weightKg={45} barKg={15} />);
    expect(screen.getByTestId("barbell-weight")).toHaveTextContent("45 KG");
    expect(
      screen.getByRole("img", { name: /barra de 15 kg con 45 kg/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/10 \+ 5 POR LADO · BARRA 15 KG/i)
    ).toBeInTheDocument();
  });

  it("treats an up-to-bar weight as a bare bar regardless of bar kg", () => {
    render(<BarbellDisplay weightKg={15} barKg={15} />);
    expect(screen.getByTestId("barbell-weight")).toHaveTextContent("15 KG");
    expect(screen.getByText(/SOLO BARRA 15 KG/i)).toBeInTheDocument();
  });

  it("counts each plate twice — once per side — in the loaded total", () => {
    render(<BarbellDisplay weightKg={60} />);
    expect(screen.getByTestId("barbell-weight")).toHaveTextContent("60 KG");
  });

  it("shows the movement name above the bar", () => {
    render(<BarbellDisplay weightKg={60} exerciseName="Back Squat" />);
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });

  it("shows the round position only for multi-round sessions", () => {
    const { rerender } = render(
      <BarbellDisplay weightKg={60} round={2} totalRounds={1} />
    );
    expect(screen.queryByTestId("barbell-round")).not.toBeInTheDocument();

    rerender(<BarbellDisplay weightKg={60} round={2} totalRounds={3} />);
    expect(screen.getByTestId("barbell-round")).toHaveTextContent("RONDA 2/3");
  });

  it("draws the colored center stripe for known bar types and none for the men's bar", () => {
    const { rerender } = render(<BarbellDisplay weightKg={60} barKg={20} />);
    expect(screen.queryByTestId("barbell-stripe")).not.toBeInTheDocument();

    rerender(<BarbellDisplay weightKg={60} barKg={15} />);
    expect(screen.getByTestId("barbell-stripe")).toHaveAttribute("fill", "#ef4444");

    rerender(<BarbellDisplay weightKg={60} barKg={10} />);
    expect(screen.getByTestId("barbell-stripe")).toHaveAttribute("fill", "#3b82f6");
  });
});