import { buildChord, buildScale, applyVoicing, ChordType, ScaleType, VoicingId } from "./theory";

type PlayMode = "harmonic" | "melodic";

// Salamander Grand Piano — hosted on the Tone.js CDN, no bundled files needed
const SALAMANDER_BASE = "https://tonejs.github.io/audio/salamander/";
const SALAMANDER_URLS: Record<string, string> = {
  A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
  A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
  A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
  A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
  A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
  A5: "A5.mp3", C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
  A6: "A6.mp3", C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
  A7: "A7.mp3", C8: "C8.mp3",
};

class AudioEngine {
  private synth: any = null;
  private Tone: any = null;
  private initPromise: Promise<void> | null = null;
  private pendingTimeouts: number[] = [];

  private init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this._doInit();
      // Reset on failure so the next play() call can retry
      this.initPromise.catch(() => { this.initPromise = null; });
    }
    return this.initPromise;
  }

  private async _doInit() {
    // Dynamic import keeps Tone.js out of the server bundle
    const Tone = await import("tone");
    await Tone.start();
    this.Tone = Tone;

    // iOS 16.4+: tell Safari this is media playback so it ignores the ring/silent
    // switch (Web Audio otherwise respects it, unlike <audio>/<video> elements).
    // No effect (and no error) on browsers that don't support this API.
    if ("audioSession" in navigator) {
      (navigator as unknown as { audioSession: { type: string } }).audioSession.type = "playback";
    }

    // sampler.loaded is a boolean getter, not a Promise — use onload/onerror instead
    await new Promise<void>((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls: SALAMANDER_URLS,
        baseUrl: SALAMANDER_BASE,
        release: 1,
        onload: resolve,
        onerror: reject,
      }).toDestination();
      this.synth = sampler;
    });
  }

  // Cancel all future-scheduled note callbacks so stop() truly silences everything
  private _cancelPending() {
    if (this.Tone) {
      const ctx = this.Tone.getContext();
      this.pendingTimeouts.forEach(id => {
        try { ctx.clearTimeout(id); } catch {}
      });
    }
    this.pendingTimeouts = [];
  }

  async playNote(note: string, duration = "2n") {
    await this.init();
    this.synth.triggerAttackRelease(note, duration);
  }

  async playInterval(noteA: string, noteB: string, mode: PlayMode = "harmonic") {
    await this.init();
    if (mode === "harmonic") {
      this.synth.triggerAttackRelease([noteA, noteB], "2n");
    } else {
      this._cancelPending();
      const startTime = this.Tone.now() + 0.1;
      this.synth.triggerAttackRelease(noteA, "2n", startTime);
      const id = this.Tone.getContext().setTimeout(() => {
        if (this.synth) try { this.synth.triggerAttackRelease(noteB, "2n", startTime + 0.7); } catch {}
      }, 0.7) as unknown as number;
      this.pendingTimeouts.push(id);
    }
  }

  async playNotes(notes: string[]) {
    await this.init();
    this.synth.triggerAttackRelease(notes, "2n");
  }

  async playChord(root: string, type: ChordType, voicing: VoicingId = "close") {
    await this.init();
    const notes = applyVoicing(buildChord(root, type), voicing);
    this.synth.triggerAttackRelease(notes, "2n");
  }

  async playProgression(chords: string[][], tempo = 80, tempoMult = 1) {
    await this.init();
    this._cancelPending();
    const beatDuration = 60 / (tempo * tempoMult);
    const ctx = this.Tone.getContext();
    const startTime = this.Tone.now() + 0.1;
    chords.forEach((chord, i) => {
      const chordTime = startTime + i * beatDuration * 2;
      const id = ctx.setTimeout(() => {
        if (this.synth) try { this.synth.triggerAttackRelease(chord, "2n", chordTime); } catch {}
      }, i * beatDuration * 2) as unknown as number;
      this.pendingTimeouts.push(id);
    });
  }

  async playScale(root: string, type: ScaleType, noteGap = 0.25) {
    await this.init();
    this._cancelPending();
    const notes = buildScale(root, type);
    const ctx = this.Tone.getContext();
    const startTime = this.Tone.now() + 0.1;
    notes.forEach((note, i) => {
      const noteTime = startTime + i * noteGap;
      const id = ctx.setTimeout(() => {
        if (this.synth) try { this.synth.triggerAttackRelease(note, noteGap * 0.9, noteTime); } catch {}
      }, i * noteGap) as unknown as number;
      this.pendingTimeouts.push(id);
    });
  }

  stop() {
    this._cancelPending();
    if (this.synth) {
      try {
        this.synth.releaseAll();
      } catch {
        // ignore
      }
    }
  }
}

// Singleton — one instance per browser tab
export const audioEngine = typeof window !== "undefined" ? new AudioEngine() : null;
