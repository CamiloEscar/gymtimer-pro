import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useLocalStorageSnapshot, notifyLocalStorageChange } from "../useLocalStorageSnapshot";

function Probe() {
  const value = useLocalStorageSnapshot<{ name: string }[]>(
    "gymtimer.test",
    () => {
      const raw = window.localStorage.getItem("gymtimer.test");
      return raw ? (JSON.parse(raw) as { name: string }[]) : [];
    },
    []
  );
  return (
    <ul>
      {value.map((item, i) => (
        <li key={i}>{item.name}</li>
      ))}
    </ul>
  );
}

describe("useLocalStorageSnapshot", () => {
  it("reads the stored value and renders it", () => {
    window.localStorage.setItem("gymtimer.test", JSON.stringify([{ name: "Squat" }]));
    render(<Probe />);
    expect(screen.getByText("Squat")).toBeInTheDocument();
  });

  it("re-reads after notifyLocalStorageChange for same-tab writes", () => {
    const { rerender } = render(<Probe />);
    window.localStorage.setItem("gymtimer.test", JSON.stringify([{ name: "Press" }]));
    act(() => notifyLocalStorageChange());
    rerender(<Probe />);
    expect(screen.getByText("Press")).toBeInTheDocument();
    expect(screen.queryByText("Squat")).not.toBeInTheDocument();
  });

  it("falls back when the key is missing", () => {
    window.localStorage.removeItem("gymtimer.test");
    render(<Probe />);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});