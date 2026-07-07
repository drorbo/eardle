import { buildChord, buildScale, applyVoicing, ChordType, ScaleType, VoicingId } from "./theory";

type PlayMode = "harmonic" | "melodic";
export type InstrumentId = "piano" | "synth";

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
  private pianoSynth: any = null;
  private synthVoice: any = null;
  private Tone: any = null;
  private samplesPromise: Promise<void> | null = null;
  private samplesReady = false;
  private started = false;
  private instrument: InstrumentId = "piano";
  private pendingTimeouts: number[] = [];

  private get activeSynth(): any {
    return this.instrument === "synth" ? this.synthVoice : this.pianoSynth;
  }

  setInstrument(id: InstrumentId) {
    this.instrument = id;
  }

  getInstrument(): InstrumentId {
    return this.instrument;
  }

  // Whether the CURRENTLY selected instrument can play instantly right now.
  isReady(): boolean {
    return this.instrument === "synth" ? true : this.samplesReady;
  }

  // Safe to call before any user gesture (e.g. on page mount) — only fetches
  // and decodes audio buffers. Tone.js lazily creates its own AudioContext
  // (in "suspended" state pre-gesture) the moment any Tone.js object is
  // constructed; decoding doesn't require the context to be running, only
  // actual sound *output* does. Idempotent — safe to call repeatedly.
  loadSamples(): Promise<void> {
    if (!this.samplesPromise) {
      this.samplesPromise = this._doLoadSamples();
      // Reset on failure so a later call can retry
      this.samplesPromise.catch(() => { this.samplesPromise = null; });
    }
    return this.samplesPromise;
  }

  private async _doLoadSamples() {
    const Tone = await import("tone");
    this.Tone = Tone;
    await new Promise<void>((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls: SALAMANDER_URLS,
        baseUrl: SALAMANDER_BASE,
        release: 1,
        onload: resolve,
        onerror: reject,
      }).toDestination();
      this.pianoSynth = sampler;
    });
    this.samplesReady = true;
  }

  // Fire-and-forget warm-up for external callers (e.g. on exercise page
  // mount) — starts the piano fetch well before the user clicks Play.
  warm() {
    this.loadSamples().catch(() => {});
  }

  // Gesture-gated: must only run from inside a real play*() call, which is
  // always triggered by a user click/keyboard shortcut.
  private async ensureStarted() {
    if (this.started) return;
    if (!this.Tone) {
      this.Tone = await import("tone");
    }
    await this.Tone.start();
    this.started = true;

    // iOS 16.4+: tell Safari this is media playback so it ignores the ring/silent
    // switch (Web Audio otherwise respects it, unlike <audio>/<video> elements).
    // No effect (and no error) on browsers that don't support this API.
    if ("audioSession" in navigator) {
      (navigator as unknown as { audioSession: { type: string } }).audioSession.type = "playback";
    }

    if (!this.synthVoice) {
      this.synthVoice = new this.Tone.PolySynth(this.Tone.Synth).toDestination();
      // The default synth voice is noticeably louder/harsher than the piano
      // samples' natural decay — quiet it down to a comparable level.
      this.synthVoice.volume.value = -12;
    }
  }

  private async init() {
    await this.ensureStarted();
    if (this.instrument === "piano") {
      await this.loadSamples();
    }
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
    this.activeSynth.triggerAttackRelease(note, duration);
  }

  async playInterval(noteA: string, noteB: string, mode: PlayMode = "harmonic") {
    await this.init();
    if (mode === "harmonic") {
      this.activeSynth.triggerAttackRelease([noteA, noteB], "2n");
    } else {
      this._cancelPending();
      const startTime = this.Tone.now() + 0.1;
      this.activeSynth.triggerAttackRelease(noteA, "2n", startTime);
      const id = this.Tone.getContext().setTimeout(() => {
        if (this.activeSynth) try { this.activeSynth.triggerAttackRelease(noteB, "2n", startTime + 0.7); } catch {}
      }, 0.7) as unknown as number;
      this.pendingTimeouts.push(id);
    }
  }

  async playNotes(notes: string[]) {
    await this.init();
    this.activeSynth.triggerAttackRelease(notes, "2n");
  }

  async playChord(root: string, type: ChordType, voicing: VoicingId = "close") {
    await this.init();
    const notes = applyVoicing(buildChord(root, type), voicing);
    this.activeSynth.triggerAttackRelease(notes, "2n");
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
        if (this.activeSynth) try { this.activeSynth.triggerAttackRelease(chord, "2n", chordTime); } catch {}
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
        if (this.activeSynth) try { this.activeSynth.triggerAttackRelease(note, noteGap * 0.9, noteTime); } catch {}
      }, i * noteGap) as unknown as number;
      this.pendingTimeouts.push(id);
    });
  }

  stop() {
    this._cancelPending();
    if (this.activeSynth) {
      try {
        this.activeSynth.releaseAll();
      } catch {
        // ignore
      }
    }
  }
}

// Singleton — one instance per browser tab
export const audioEngine = typeof window !== "undefined" ? new AudioEngine() : null;
