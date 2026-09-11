import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioManager } from "../AudioManager";

function makeFakeAudioContext() {
  const oscillator = {
    type: "sine",
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  return {
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    destination: {},
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    state: "suspended",
  };
}

describe("AudioManager", () => {
  let fakeCtx: ReturnType<typeof makeFakeAudioContext>;

  beforeEach(() => {
    fakeCtx = makeFakeAudioContext();
    vi.stubGlobal(
      "AudioContext",
      // Deviation from brief: vitest 5.0.0's vi.fn() construct trap forwards
      // directly to the implementation, and arrow functions are not
      // constructible per spec ("X is not a constructor"). A `function`
      // expression is behaviorally identical and is constructible. See
      // task-4-report.md for the empirical repro.
      vi.fn(function () {
        return fakeCtx;
      })
    );
  });

  it("does not play any sound when disabled", () => {
    const manager = new AudioManager({ enabled: false });
    manager.playStart();
    expect(fakeCtx.createOscillator).not.toHaveBeenCalled();
  });

  it("plays a beep via the Web Audio API when enabled", () => {
    const manager = new AudioManager({ enabled: true });
    manager.unlock();
    manager.playStart();
    expect(fakeCtx.createOscillator).toHaveBeenCalled();
  });

  it("setEnabled(false) silences subsequent calls", () => {
    const manager = new AudioManager({ enabled: true });
    manager.unlock();
    manager.setEnabled(false);
    manager.playFinish();
    expect(fakeCtx.createOscillator).not.toHaveBeenCalled();
  });

  it("speak() is a no-op when voice is disabled", () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      // Deviation from brief: same arrow-function-is-not-a-constructor issue
      // as the AudioContext mock above.
      vi.fn().mockImplementation(function (text: string) {
        return { text };
      })
    );

    const manager = new AudioManager({ enabled: true, voiceEnabled: false });
    manager.speak("Get ready");
    expect(speak).not.toHaveBeenCalled();
  });

  it("speak() calls speechSynthesis when voice is enabled", () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      // Deviation from brief: same arrow-function-is-not-a-constructor issue
      // as the AudioContext mock above.
      vi.fn().mockImplementation(function (text: string) {
        return { text };
      })
    );

    const manager = new AudioManager({ enabled: true, voiceEnabled: true });
    manager.unlock();
    manager.speak("Get ready");
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("does not play any sound when enabled but unlock() was never called", () => {
    const manager = new AudioManager({ enabled: true });
    manager.playStart();
    expect(fakeCtx.createOscillator).not.toHaveBeenCalled();
  });

  it("uses the configured volume as the peak gain", () => {
    const manager = new AudioManager({ enabled: true, volume: 0.8 });
    manager.unlock();
    manager.playStart();
    // playTone ramps gain to volume(0.8) then back to 0.
    const gain = fakeCtx.createGain.mock.results[0].value;
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, expect.any(Number));
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
  });

  it("setVolume updates the peak for subsequent plays", () => {
    const manager = new AudioManager({ enabled: true, volume: 0.5 });
    manager.unlock();
    manager.setVolume(0.25);
    manager.playStart();
    const gain = fakeCtx.createGain.mock.results[0].value;
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.25, expect.any(Number));
  });
});
