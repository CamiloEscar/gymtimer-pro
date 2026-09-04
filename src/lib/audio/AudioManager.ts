interface AudioManagerOptions {
  enabled?: boolean;
  voiceEnabled?: boolean;
}

type ToneSpec = { frequency: number; durationMs: number };

export class AudioManager {
  private enabled: boolean;
  private voiceEnabled: boolean;
  private ctx: AudioContext | null = null;

  constructor(options: AudioManagerOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.voiceEnabled = options.voiceEnabled ?? false;
  }

  /** Must be called from a user gesture (e.g. the first START tap) to satisfy
   * browser autoplay policies (prompt Sección 13). */
  unlock(): void {
    if (!this.enabled) return;
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
  }

  playStart(): void {
    this.playTone({ frequency: 880, durationMs: 150 });
  }

  playCountdownBeep(): void {
    this.playTone({ frequency: 660, durationMs: 100 });
  }

  playRoundChange(): void {
    this.playTone({ frequency: 520, durationMs: 120 });
  }

  playWorkToRest(): void {
    this.playTone({ frequency: 400, durationMs: 200 });
  }

  playRestToWork(): void {
    this.playTone({ frequency: 700, durationMs: 200 });
  }

  playFinish(): void {
    this.playTone({ frequency: 1000, durationMs: 400 });
  }

  speak(text: string): void {
    if (!this.enabled || !this.voiceEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  private playTone({ frequency, durationMs }: ToneSpec): void {
    if (!this.enabled) return;
    this.ctx ??= new AudioContext();
    const ctx = this.ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);
    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  }
}
