import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPromptBanner } from "./InstallPromptBanner";

class FakeBeforeInstallPromptEvent extends Event {
  readonly platforms = ["web"];
  userChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });
  prompt = vi.fn().mockResolvedValue(undefined);
}

beforeEach(() => {
  window.localStorage.clear();
  // Default: not standalone. Tests override when needed.
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("InstallPromptBanner", () => {
  it("does not render before install criteria are met", () => {
    render(<InstallPromptBanner />);
    expect(screen.queryByTestId("install-prompt-banner")).not.toBeInTheDocument();
  });

  it("renders once beforeinstallprompt fires", async () => {
    render(<InstallPromptBanner />);
    const event = new FakeBeforeInstallPromptEvent("beforeinstallprompt");
    window.dispatchEvent(event);
    await waitFor(() => {
      expect(screen.getByTestId("install-prompt-banner")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("dialog", { name: /instalar gymtimer/i })
    ).toBeInTheDocument();
  });

  it("hides once dismissed and persists the dismissal", async () => {
    const user = userEvent.setup();
    render(<InstallPromptBanner />);
    window.dispatchEvent(new FakeBeforeInstallPromptEvent("beforeinstallprompt"));
    await waitFor(() => screen.getByTestId("install-prompt-banner"));

    await user.click(screen.getByRole("button", { name: /cerrar sugerencia/i }));

    expect(window.localStorage.getItem("gymtimer.pwa.installDismissed")).toBe("1");
    expect(screen.queryByTestId("install-prompt-banner")).not.toBeInTheDocument();
  });

  it("does not render when already in standalone mode", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    render(<InstallPromptBanner />);
    window.dispatchEvent(new FakeBeforeInstallPromptEvent("beforeinstallprompt"));
    // Even with an event captured, standalone = no banner.
    expect(screen.queryByTestId("install-prompt-banner")).not.toBeInTheDocument();
  });

  it("Installar triggers prompt() and dismisses", async () => {
    const user = userEvent.setup();
    render(<InstallPromptBanner />);
    const event = new FakeBeforeInstallPromptEvent("beforeinstallprompt");
    window.dispatchEvent(event);
    await waitFor(() => screen.getByTestId("install-prompt-banner"));

    await user.click(screen.getByRole("button", { name: /^instalar$/i }));

    await waitFor(() => {
      expect((event as unknown as { prompt: { mock: { calls: unknown[][] } } }).prompt.mock.calls.length).toBe(1);
    });
    await waitFor(() => {
      expect(window.localStorage.getItem("gymtimer.pwa.installDismissed")).toBe("1");
    });
  });
});
