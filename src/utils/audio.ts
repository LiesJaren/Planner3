// Web Audio API synthesizer for playful, instantaneous audio feedback
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTap(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {}
  }

  playStarChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [783.99, 987.77, 1174.66, 1567.98]; // G5, B5, D6, G6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.41);
      });
    } catch {}
  }

  playVictoryFanfare(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Fanfare: C5, E5, G5, high C6 chord
      const chords = [
        { time: 0, notes: [523.25, 659.25], dur: 0.12 },
        { time: 0.14, notes: [523.25, 659.25], dur: 0.12 },
        { time: 0.28, notes: [523.25, 659.25], dur: 0.12 },
        { time: 0.45, notes: [523.25, 659.25, 783.99, 1046.5], dur: 0.6 },
      ];

      chords.forEach(({ time, notes, dur }) => {
        const chordStart = ctx.currentTime + time;
        notes.forEach((f) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, chordStart);

          gain.gain.setValueAtTime(0.15, chordStart);
          gain.gain.exponentialRampToValueAtTime(0.001, chordStart + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(chordStart);
          osc.stop(chordStart + dur);
        });
      });
    } catch {}
  }

  playFanfare(): void {
    this.playVictoryFanfare();
  }
}

export const soundEffects = new SoundSynthesizer();

/**
 * Spreekt een Nederlands bericht uit met Web Speech Synthesis API
 */
export function spreekBericht(tekst: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(tekst);
    utterance.lang = 'nl-NL';
    utterance.rate = 0.95; // Friendly, slightly deliberate pacing for 6yo child
    utterance.pitch = 1.05;

    // Try finding a Dutch voice
    const voices = window.speechSynthesis.getVoices();
    const nlVoice = voices.find((v) => v.lang.startsWith('nl') || v.lang.includes('NL'));
    if (nlVoice) {
      utterance.voice = nlVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
  }
}
