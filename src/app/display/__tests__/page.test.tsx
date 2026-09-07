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
