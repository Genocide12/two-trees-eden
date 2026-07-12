// Two Trees: Eden — Procedural audio engine (Web Audio API)
// No external audio assets — everything synthesized at runtime.
// Light side: warm major chords, bell-like tones, airy pads.
// Dark side: minor/diminished chords, low drones, dissonant clusters.

'use client';

type Side = 'light' | 'dark';
type SfxId =
  | 'miracle' | 'prophet' | 'heal' | 'covenant'
  | 'tempt' | 'heresy' | 'plague' | 'deceit'
  | 'meditate' | 'event' | 'epoch_advance' | 'gameover_light' | 'gameover_dark' | 'gameover_neutral' | 'side_pick';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicNodes: AudioNode[] = [];
  private musicLfo: OscillatorNode | null = null;
  private musicPlaying: Side | null = null;
  private _enabled = true;
  private _musicEnabled = true;
  private _initialized = false;

  /** Must be called from a user-gesture handler (click/tap) to satisfy autoplay policies. */
  init() {
    if (this._initialized) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0; // fade in
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.masterGain);

      this._initialized = true;
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  get enabled() { return this._enabled; }
  setEnabled(v: boolean) {
    this._enabled = v;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v ? 0.55 : 0, this.ctx!.currentTime, 0.05);
    }
  }

  get musicEnabled() { return this._musicEnabled; }
  setMusicEnabled(v: boolean) {
    this._musicEnabled = v;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(v ? 0.18 : 0, this.ctx.currentTime, 0.4);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // SFX — short synthesized sounds
  // ─────────────────────────────────────────────────────────────────────

  private now() { return this.ctx?.currentTime ?? 0; }

  private env(
    gain: GainNode, t0: number, attack: number, hold: number, release: number, peak = 1,
  ) {
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + attack);
    gain.gain.setValueAtTime(peak, t0 + attack + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
  }

  /** A single sine bell-like tone with harmonic. */
  private bell(freq: number, t0: number, dur: number, peak = 0.4, side: Side = 'light') {
    if (!this.ctx || !this.sfxGain) return;
    const g = this.ctx.createGain();
    g.connect(this.sfxGain);
    this.env(g, t0, 0.005, dur * 0.2, dur * 0.8, peak);

    const o1 = this.ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = freq;
    o1.connect(g);
    o1.start(t0);
    o1.stop(t0 + dur + 0.1);

    // harmonic
    const o2 = this.ctx.createOscillator();
    o2.type = side === 'light' ? 'triangle' : 'sawtooth';
    o2.frequency.value = freq * 2;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.18;
    o2.connect(g2);
    g2.connect(g);
    o2.start(t0);
    o2.stop(t0 + dur + 0.1);
  }

  /** Soft pad chord. */
  private chord(freqs: number[], t0: number, dur: number, peak = 0.18, type: OscillatorType = 'sine') {
    if (!this.ctx || !this.sfxGain) return;
    const g = this.ctx.createGain();
    g.connect(this.sfxGain);
    this.env(g, t0, 0.06, dur * 0.3, dur * 0.7, peak);
    for (const f of freqs) {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const og = this.ctx.createGain();
      og.gain.value = 1 / freqs.length;
      o.connect(og);
      og.connect(g);
      o.start(t0);
      o.stop(t0 + dur + 0.1);
    }
  }

  /** Low rumble / drone burst (for plague, deceit). */
  private rumble(freq: number, t0: number, dur: number, peak = 0.35) {
    if (!this.ctx || !this.sfxGain) return;
    const g = this.ctx.createGain();
    g.connect(this.sfxGain);
    this.env(g, t0, 0.02, dur * 0.5, dur * 0.5, peak);

    // Noise source
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq * 4;
    noise.connect(filter);
    filter.connect(g);
    noise.start(t0);
    noise.stop(t0 + dur);

    // Sub-tone
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    o.start(t0);
    o.stop(t0 + dur);
  }

  /** Ascending arpeggio (light miracle). */
  private arpeggio(freqs: number[], t0: number, stepMs: number, dur: number, peak = 0.32, side: Side = 'light') {
    freqs.forEach((f, i) => {
      this.bell(f, t0 + (i * stepMs) / 1000, dur, peak, side);
    });
  }

  /** Descending dissonant cluster (dark action). */
  private cluster(freqs: number[], t0: number, dur: number, peak = 0.3) {
    if (!this.ctx || !this.sfxGain) return;
    const g = this.ctx.createGain();
    g.connect(this.sfxGain);
    this.env(g, t0, 0.01, dur * 0.4, dur * 0.6, peak);
    for (const f of freqs) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const og = this.ctx.createGain();
      og.gain.value = 0.25;
      // slight detune for dissonance
      o.detune.value = (Math.random() - 0.5) * 30;
      o.connect(og);
      og.connect(g);
      o.start(t0);
      o.stop(t0 + dur);
    }
  }

  // Note frequencies (Hz)
  private static N = {
    C3: 130.81, Eb3: 155.56, E3: 164.81, G3: 196.0, Bb3: 233.08, B3: 246.94,
    C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.0,
    A4: 440.0, Bb4: 466.16, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
    C6: 1046.5, E6: 1318.5, G6: 1567.98,
  };

  playSfx(id: SfxId) {
    if (!this._enabled || !this.ctx || !this._initialized) return;
    this.resume();
    const t = this.now() + 0.01;
    const N = AudioEngine.N;

    switch (id) {
      // ─── Light actions ───
      case 'miracle':
        this.arpeggio([N.C5, N.E5, N.G5, N.C6], t, 90, 0.8, 0.32, 'light');
        break;
      case 'prophet':
        this.chord([N.E3, N.G3, N.B3, N.E4], t, 1.2, 0.22, 'triangle');
        this.bell(N.G5, t + 0.15, 0.6, 0.25, 'light');
        break;
      case 'heal':
        this.bell(N.C5, t, 0.5, 0.32, 'light');
        this.bell(N.E5, t + 0.12, 0.6, 0.3, 'light');
        this.bell(N.G5, t + 0.24, 0.7, 0.28, 'light');
        break;
      case 'covenant':
        this.chord([N.C3, N.E3, N.G3, N.C4, N.E4], t, 1.8, 0.28, 'sine');
        this.arpeggio([N.C5, N.E5, N.G5, N.C6, N.E6], t + 0.2, 110, 1.0, 0.28, 'light');
        break;
      // ─── Dark actions ───
      case 'tempt':
        this.cluster([N.Eb4, N.G4, N.Bb4], t, 0.9, 0.3);
        this.bell(N.Eb3, t + 0.1, 0.7, 0.22, 'dark');
        break;
      case 'heresy':
        this.cluster([N.B3, N.D4, N.F4], t, 1.0, 0.32);
        this.rumble(N.B3 / 2, t + 0.1, 0.6, 0.2);
        break;
      case 'plague':
        this.rumble(N.C3, t, 1.2, 0.4);
        this.rumble(N.B2 = 123.47, t + 0.2, 1.0, 0.3);
        break;
      case 'deceit':
        this.cluster([N.Eb4, N.F4, N.G4, N.Bb4], t, 0.7, 0.3);
        this.bell(N.Eb3, t + 0.05, 0.4, 0.2, 'dark');
        break;
      // ─── Common ───
      case 'meditate':
        this.chord([N.C4, N.E4, N.G4], t, 1.5, 0.16, 'sine');
        this.chord([N.C4, N.E4, N.G4], t + 0.5, 1.5, 0.14, 'sine');
        break;
      case 'event':
        this.bell(N.G5, t, 0.8, 0.28, 'light');
        this.bell(N.E5, t + 0.15, 0.7, 0.22, 'light');
        this.bell(N.C5, t + 0.30, 0.6, 0.20, 'light');
        break;
      case 'epoch_advance':
        this.chord([N.C3, N.G3, N.E4, N.G4], t, 2.0, 0.22, 'sine');
        this.bell(N.C5, t + 0.3, 1.0, 0.28, 'light');
        this.bell(N.G5, t + 0.5, 1.2, 0.24, 'light');
        break;
      case 'side_pick':
        this.bell(N.C5, t, 0.4, 0.3, 'light');
        this.bell(N.E5, t + 0.08, 0.5, 0.28, 'light');
        break;
      case 'gameover_light':
        this.chord([N.C4, N.E4, N.G4, N.C5, N.E5], t, 3.0, 0.3, 'sine');
        break;
      case 'gameover_dark':
        this.rumble(N.C3, t, 3.0, 0.4);
        this.cluster([N.Eb3, N.G3, N.Bb3], t + 0.3, 2.5, 0.3);
        break;
      case 'gameover_neutral':
        this.chord([N.C4, N.Eb4, N.G4], t, 2.5, 0.22, 'sine');
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Background music — procedural ambient pad with melodic phrases
  // ─────────────────────────────────────────────────────────────────────

  private musicSchedulerId: ReturnType<typeof setInterval> | null = null;

  startMusic(side: Side) {
    if (!this.ctx || !this._initialized) return;
    if (this.musicPlaying === side && this.musicNodes.length > 0) return;
    this.stopMusic();
    this.musicPlaying = side;

    const t = this.now();
    const N = AudioEngine.N;

    // ── Pad: thick chord (sustained background) ──
    const padFreqs = side === 'light'
      ? [N.C3, N.E3, N.G3, N.B3, N.E4, N.G4]  // Cmaj7 — warm, open
      : [N.C3, N.Eb3, N.G3, N.Bb3, N.Eb4, N.G4];  // Cm7 — dark, tense

    for (const f of padFreqs) {
      const o = this.ctx!.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 12;

      const g = this.ctx!.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(0.12 / padFreqs.length, t + 0.1, 1.5);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = side === 'light' ? 1400 : 700;
      filter.Q.value = 0.5;

      o.connect(filter);
      filter.connect(g);
      g.connect(this.musicGain!);
      o.start(t);
      this.musicNodes.push(o, g, filter);
    }

    // ── Slow LFO for breathing effect ──
    this.musicLfo = this.ctx.createOscillator();
    this.musicLfo.type = 'sine';
    this.musicLfo.frequency.value = side === 'light' ? 0.08 : 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.06;
    this.musicLfo.connect(lfoGain);
    lfoGain.connect(this.musicGain!.gain);
    this.musicLfo.start(t);
    this.musicNodes.push(this.musicLfo, lfoGain);

    // ── Melodic phrases: schedule a new phrase every 8-12 seconds ──
    // Light: ascending major arpeggios, bell-like
    // Dark: descending minor clusters, low rumbles
    const lightPhrases: number[][] = [
      [N.C5, N.E5, N.G5, N.C6, N.G5, N.E5],
      [N.G4, N.B4, N.D5, N.G5, N.D5, N.B4],
      [N.E4, N.G4, N.C5, N.E5, N.C5, N.G4],
      [N.C5, N.G4, N.E5, N.C5, N.G5, N.E5],
    ];
    const darkPhrases: number[][] = [
      [N.C3, N.Eb3, N.G3, N.Bb3, N.G3, N.Eb3],
      [N.G3, N.Bb3, N.Db4, N.Eb4, N.Db4, N.Bb3],
      [N.C3, N.F3, N.Ab3, N.C4, N.Ab3, N.F3],
      [N.Eb3, N.G3, N.Bb3, N.Eb4, N.Bb3, N.G3],
    ];
    const phrases = side === 'light' ? lightPhrases : darkPhrases;
    let phraseIdx = 0;

    const schedulePhrase = () => {
      if (!this.ctx || !this._initialized || this.musicPlaying !== side) return;
      const pt = this.now() + 0.05;
      const phrase = phrases[phraseIdx % phrases.length];
      phraseIdx++;
      const stepMs = side === 'light' ? 600 : 800;
      phrase.forEach((f, i) => {
        if (side === 'light') {
          // Bell-like tones
          this.bell(f, pt + (i * stepMs) / 1000, 1.2, 0.10, 'light');
        } else {
          // Soft minor tones
          this.bell(f, pt + (i * stepMs) / 1000, 1.4, 0.08, 'dark');
        }
      });
    };

    // Schedule first phrase after 3s, then every 9-12s
    setTimeout(schedulePhrase, 3000);
    this.musicSchedulerId = setInterval(() => {
      schedulePhrase();
    }, side === 'light' ? 9000 : 11000);

    // Fade in
    this.musicGain!.gain.setTargetAtTime(this._musicEnabled ? 0.22 : 0, t, 1.2);
  }

  stopMusic() {
    if (!this.ctx || !this.musicGain) return;
    const t = this.now();
    this.musicGain.gain.setTargetAtTime(0, t, 0.8);
    if (this.musicSchedulerId) {
      clearInterval(this.musicSchedulerId);
      this.musicSchedulerId = null;
    }
    const nodesToStop = this.musicNodes;
    setTimeout(() => {
      for (const n of nodesToStop) {
        try { (n as OscillatorNode).stop?.(); } catch {}
        try { n.disconnect(); } catch {}
      }
    }, 1200);
    this.musicNodes = [];
    this.musicLfo = null;
    this.musicPlaying = null;
  }

  switchMusic(side: Side) {
    if (this.musicPlaying === side) return;
    this.startMusic(side);
  }
}

// Singleton — only one AudioContext per page
export const audio = new AudioEngine();
