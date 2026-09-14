import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPromptBanner } from "./InstallPromptBanner";

class FakeBeforeInstallPromptEvent extends Event {
  readonly platforms = ["web"];
  userChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });
  prompt = vi.fn().mockResolvedValue(undefined);
}

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    get: () => ua,
  });
}

function setStandalone(standalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query === "(display-mode: standalone)" ? standalone : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  window.localStorage.clear();
  setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
  );
  setStandalone(false);
  Object.defineProperty(window.navigator, "standalone", {
    configurable: true,
    get: () => false,
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

  it("renders Chrome variant once beforeinstallprompt fires", async () => {
    render(<InstallPromptBanner />);
    const event = new FakeBeforeInstallPromptEvent("beforeinstallprompt");
    window.dispatchEvent(event);
    await waitFor(() => {
      expect(screen.getByTestId("install-prompt-banner")).toBeInTheDocument();
    });
    const dialog = screen.getByTestId("install-prompt-banner");
    expect(dialog.getAttribute("data-variant")).toBe("chrome");
    expect(
      screen.getByRole("dialog", { name: /instalar gymtimer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^instalar$/i })
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

  it("does not render Chrome variant when already in standalone mode", async () => {
    setStandalone(true);
    render(<InstallPromptBanner />);
    window.dispatchEvent(new FakeBeforeInstallPromptEvent("beforeinstallprompt"));
    await waitFor(() => {
      expect(screen.queryByTestId("install-prompt-banner")).not.toBeInTheDocument();
    });
  });

  it("Installar triggers prompt() and dismisses", async () => {
    const user = userEvent.setup();
    render(<InstallPromptBanner />);
    const event = new FakeBeforeInstallPromptEvent("beforeinstallprompt");
    window.dispatchEvent(event);
    await waitFor(() => screen.getByTestId("install-prompt-banner"));

    await user.click(screen.getByRole("button", { name: /^instalar$/i }));

    await waitFor(() => {
      expect(
        (event as unknown as { prompt: { mock: { calls: unknown[][] } } }).prompt.mock.calls.length
      ).toBe(1);
    });
    await waitFor(() => {
      expect(window.localStorage.getItem("gymtimer.pwa.installDismissed")).toBe("1");
    });
  });

  describe("iOS Safari variant", () => {
    it("renders iOS instructions when user agent is iPhone Safari", async () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      );
      render(<InstallPromptBanner />);
      await waitFor(() => {
        expect(screen.getByTestId("install-prompt-banner")).toBeInTheDocument();
      });
      const dialog = screen.getByTestId("install-prompt-banner");
      expect(dialog.getAttribute("data-variant")).toBe("ios");
      expect(
        screen.getByRole("dialog", { name: /instalar gymtimer en ios/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/agregar a pantalla de inicio/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^instalar$/i })
      ).not.toBeInTheDocument();
    });

    it("renders iOS instructions on iPad Safari", async () => {
      setUserAgent(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      );
      render(<InstallPromptBanner />);
      await waitFor(() => {
        expect(screen.getByTestId("install-prompt-banner")).toBeInTheDocument();
      });
      expect(
        screen.getByTestId("install-prompt-banner").getAttribute("data-variant")
      ).toBe("ios");
    });

    it("does NOT render iOS variant for Chrome on iOS", async () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1"
      );
      render(<InstallPromptBanner />);
      expect(screen.queryByTestId("install-prompt-banner")).not.toBeInTheDocument();
    });

    it("does NOT render iOS variant for Firefox on iOS", async () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/604.1"
      );
      render(<InstallPromptBanner />);
      expect(screen.queryByTestId("install-prompt-banner")).not.toBeInTheDocument();
    });

    it("dismisses iOS variant and persists dismissal", async () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      );
      const user = userEvent.setup();
      render(<InstallPromptBanner />);
      await waitFor(() => screen.getByTestId("install-prompt-banner"));

      await user.click(
        screen.getByRole("button", { name: /cerrar sugerencia/i })
      );

      expect(window.localStorage.getItem("gymtimer.pwa.installDismissed")).toBe("1");
      expect(
        screen.queryByTestId("install-prompt-banner")
      ).not.toBeInTheDocument();
    });

    it("does NOT render iOS variant when already installed (standalone)", async () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      );
      Object.defineProperty(window.navigator, "standalone", {
        configurable: true,
        get: () => true,
      });
      render(<InstallPromptBanner />);
      expect(
        screen.queryByTestId("install-prompt-banner")
      ).not.toBeInTheDocument();
    });

    it("Chrome variant wins over iOS variant when both could apply", async () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      );
      render(<InstallPromptBanner />);
      window.dispatchEvent(new FakeBeforeInstallPromptEvent("beforeinstallprompt"));
      await waitFor(() => screen.getByTestId("install-prompt-banner"));
      expect(
        screen.getByTestId("install-prompt-banner").getAttribute("data-variant")
      ).toBe("chrome");
    });
  });
});