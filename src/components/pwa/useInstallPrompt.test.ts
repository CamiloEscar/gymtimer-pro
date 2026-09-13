import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInstallPrompt } from "./useInstallPrompt";

class FakeBeforeInstallPromptEvent extends Event {
  readonly platforms = ["web"];
  userChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });
  prompt() {
    return Promise.resolve();
  }
}

describe("useInstallPrompt", () => {
  beforeEach(() => {
    // jsdom doesn't fire these events; tests trigger them manually below.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("captures beforeinstallprompt and exposes a trigger", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.promptEvent).toBeNull();

    const event = new FakeBeforeInstallPromptEvent("beforeinstallprompt");
    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.promptEvent).not.toBeNull();
  });

  it("clears the prompt event after a successful prompt", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = new FakeBeforeInstallPromptEvent("beforeinstallprompt");
    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.promptEvent).not.toBeNull();

    let outcome: string | null = "pending";
    await act(async () => {
      outcome = await result.current.prompt();
    });
    expect(outcome).toBe("accepted");
    expect(result.current.promptEvent).toBeNull();
  });

  it("marks installed after appinstalled and clears any pending prompt", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = new FakeBeforeInstallPromptEvent("beforeinstallprompt");
    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.promptEvent).not.toBeNull();

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(result.current.installed).toBe(true);
    expect(result.current.promptEvent).toBeNull();
  });

  it("prompt() returns null when no event is captured", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    let outcome: string | null = "pending";
    await act(async () => {
      outcome = await result.current.prompt();
    });
    expect(outcome).toBeNull();
  });
});
