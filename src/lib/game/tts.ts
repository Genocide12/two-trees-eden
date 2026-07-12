// Two Trees: Eden — Text-to-Speech engine (Web Speech API)
// Voices important game events in Russian or English.

'use client';

type Lang = 'ru' | 'en';

class TtsEngine {
  private voices: SpeechSynthesisVoice[] = [];
  private _enabled = true;
  private _initialized = false;
  private _pendingUtterance: { text: string; lang: Lang } | null = null;

  init() {
    if (this._initialized) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this._initialized = true;
    this.loadVoices();
    // Voices often load asynchronously
    window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.voices = window.speechSynthesis.getVoices();
    // If we have a pending utterance, flush it now that voices are loaded
    if (this._pendingUtterance) {
      const p = this._pendingUtterance;
      this._pendingUtterance = null;
      this.speak(p.text, p.lang);
    }
  }

  get enabled() { return this._enabled; }
  setEnabled(v: boolean) {
    this._enabled = v;
    if (!v) this.stop();
  }

  get available() {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  /** Pick the best matching voice for the language. */
  private pickVoice(lang: Lang): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null;
    const target = lang === 'ru' ? 'ru-RU' : 'en-US';
    // 1. Exact match
    let v = this.voices.find((v) => v.lang === target);
    if (v) return v;
    // 2. Starts with lang code
    v = this.voices.find((v) => v.lang.toLowerCase().startsWith(lang));
    if (v) return v;
    // 3. Any voice of the language family
    v = this.voices.find((v) => v.lang.toLowerCase().includes(lang === 'ru' ? 'ru' : 'en'));
    if (v) return v;
    // 4. Fallback to default
    return this.voices[0] ?? null;
  }

  speak(text: string, lang: Lang, opts?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this._enabled || !this.available) return;
    this.init();
    // Note: even if voices list is empty (e.g. headless browser), we still
    // call speechSynthesis.speak() — the browser will use its default voice.
    // The voice picking is best-effort, not required.
    if (this.voices.length === 0) {
      // Try one more time to load voices
      this.loadVoices();
    }
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
    u.rate = opts?.rate ?? 0.95;
    u.pitch = opts?.pitch ?? 1.0;
    u.volume = opts?.volume ?? 0.95;
    const voice = this.pickVoice(lang);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  /** Speak a sequence of texts, one after another. */
  speakSequence(texts: string[], lang: Lang, gap = 250) {
    if (!this._enabled || !this.available || texts.length === 0) return;
    let i = 0;
    const next = () => {
      if (i >= texts.length) return;
      const text = texts[i++];
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
      u.rate = 0.95;
      u.volume = 0.95;
      const voice = this.pickVoice(lang);
      if (voice) u.voice = voice;
      u.onend = () => setTimeout(next, gap);
      window.speechSynthesis.speak(u);
    };
    this.stop();
    next();
  }

  stop() {
    if (this.available) {
      window.speechSynthesis.cancel();
    }
  }
}

export const tts = new TtsEngine();
