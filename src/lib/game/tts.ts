// Two Trees: Eden — Text-to-Speech engine (Web Speech API)
// Voices important game events in Russian or English.
// Uses a queue so consecutive events don't trample each other.

'use client';

type Lang = 'ru' | 'en';

// Preference order for Russian voices (best → worst).
// The default 'Russian' voice in Chrome is notoriously bad, so we prefer
// premium / neural / yandex / microsoft voices when available.
const RU_VOICE_PREFERENCES = [
  // Yandex (best free Russian TTS, often bundled in Yandex Browser)
  /yandex/i,
  /alice/i,
  // Microsoft neural / premium voices (Edge, Win11)
  /Microsoft.*Svetlana/i,
  /Microsoft.*Yuri/i,
  /Dmitri.*Neural/i,
  /Svetlana.*Neural/i,
  /Milana/i,
  // Google Russian (decent, but only in Chrome)
  /Google.*Russian/i,
  /Google.*ru/i,
  // Apple macOS voices
  /Yuri/i,
  /Milena/i,
  /Katya/i,
  // Other premium-sounding names
  / premium /i,
  / neural /i,
  / enhanced /i,
  // Fallback: anything that's NOT the default 'Russian' male voice
  // (which is the awful one)
];

const EN_VOICE_PREFERENCES = [
  /Google.*US/i,
  /Microsoft.*Aria/i,
  /Microsoft.*Jenny/i,
  /Samantha/i,
  /Daniel/i,
  / premium /i,
  / neural /i,
  / enhanced /i,
];

interface QueueItem {
  text: string;
  lang: Lang;
  opts?: { rate?: number; pitch?: number; volume?: number };
  // If true, this item flushes the queue before being added (interrupting
  // less important speech). Used for epoch advances, game over, etc.
  interrupt?: boolean;
}

class TtsEngine {
  private voices: SpeechSynthesisVoice[] = [];
  private _enabled = true;
  private _initialized = false;
  private _queue: QueueItem[] = [];
  private _speaking = false;
  private _selectedVoiceRu: SpeechSynthesisVoice | null = null;
  private _selectedVoiceEn: SpeechSynthesisVoice | null = null;
  // Pause between consecutive utterances (ms) — gives listener time to absorb.
  private _gapMs = 600;

  init() {
    if (this._initialized) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this._initialized = true;
    this.loadVoices();
    window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    // Some browsers need a kick after a delay
    setTimeout(() => this.loadVoices(), 500);
    setTimeout(() => this.loadVoices(), 1500);
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const newVoices = window.speechSynthesis.getVoices();
    if (newVoices.length === 0) return;
    this.voices = newVoices;
    this._selectedVoiceRu = this.pickBestVoice('ru');
    this._selectedVoiceEn = this.pickBestVoice('en');
  }

  get enabled() { return this._enabled; }
  setEnabled(v: boolean) {
    this._enabled = v;
    if (!v) this.clearQueue();
  }

  get available() {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  get availableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /** Pick the best matching voice for a language using preference lists. */
  private pickBestVoice(lang: Lang): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null;
    const prefs = lang === 'ru' ? RU_VOICE_PREFERENCES : EN_VOICE_PREFERENCES;
    const targetPrefix = lang === 'ru' ? 'ru' : 'en';

    // Filter voices by language family first
    const langVoices = this.voices.filter((v) =>
      v.lang.toLowerCase().startsWith(targetPrefix),
    );
    if (langVoices.length === 0) return null;

    // Try each preference regex in order
    for (const re of prefs) {
      const match = langVoices.find((v) => re.test(v.name));
      if (match) return match;
    }
    // Last resort: any voice of this language, prefer non-default-voice-name
    const nonDefault = langVoices.find((v) => v.name.toLowerCase() !== 'russian');
    return nonDefault ?? langVoices[0];
  }

  /** Get the currently selected voice for a language. */
  getVoice(lang: Lang): SpeechSynthesisVoice | null {
    return lang === 'ru' ? this._selectedVoiceRu : this._selectedVoiceEn;
  }

  /** Set a specific voice for a language (used by voice picker UI). */
  setVoice(lang: Lang, voiceName: string) {
    const v = this.voices.find((v) => v.name === voiceName);
    if (!v) return;
    if (lang === 'ru') this._selectedVoiceRu = v;
    else this._selectedVoiceEn = v;
  }

  /** Get all voices of a given language family, sorted by preference. */
  getVoicesForLang(lang: Lang): SpeechSynthesisVoice[] {
    const prefix = lang === 'ru' ? 'ru' : 'en';
    const matching = this.voices.filter((v) =>
      v.lang.toLowerCase().startsWith(prefix),
    );
    const prefs = lang === 'ru' ? RU_VOICE_PREFERENCES : EN_VOICE_PREFERENCES;
    const best = this.pickBestVoice(lang);
    return matching.sort((a, b) => {
      // Selected voice first
      if (best) {
        if (a.name === best.name) return -1;
        if (b.name === best.name) return 1;
      }
      // Then by preference order
      const aIdx = prefs.findIndex((re) => re.test(a.name));
      const bIdx = prefs.findIndex((re) => re.test(b.name));
      const aRank = aIdx === -1 ? 999 : aIdx;
      const bRank = bIdx === -1 ? 999 : bIdx;
      return aRank - bRank;
    });
  }

  /** Enqueue a single utterance. */
  speak(text: string, lang: Lang, opts?: { rate?: number; pitch?: number; volume?: number }, interrupt = false) {
    if (!this._enabled || !this.available) return;
    this.init();
    this._enqueue({ text, lang, opts, interrupt });
  }

  /** Enqueue a sequence of utterances with gaps between them. */
  speakSequence(texts: string[], lang: Lang, gap = 600) {
    if (!this._enabled || !this.available || texts.length === 0) return;
    this.init();
    // Set the gap for this sequence
    const oldGap = this._gapMs;
    this._gapMs = gap;
    for (const t of texts) {
      this._enqueue({ text: t, lang });
    }
    // Restore default gap after this sequence (best-effort)
    setTimeout(() => { this._gapMs = oldGap; }, (texts.length * 3000) + gap);
  }

  private _enqueue(item: QueueItem) {
    if (item.interrupt) {
      this._queue = [item];
      // Cancel current speech
      if (this.available) window.speechSynthesis.cancel();
      this._speaking = false;
    } else {
      this._queue.push(item);
    }
    this._pump();
  }

  private _pump() {
    if (this._speaking) return;
    if (this._queue.length === 0) return;
    if (!this.available) return;

    const item = this._queue.shift()!;
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    const u = new SpeechSynthesisUtterance(item.text);
    u.lang = item.lang === 'ru' ? 'ru-RU' : 'en-US';
    u.rate = item.opts?.rate ?? 0.92;
    u.pitch = item.opts?.pitch ?? 1.0;
    u.volume = item.opts?.volume ?? 0.95;
    const voice = item.lang === 'ru' ? this._selectedVoiceRu : this._selectedVoiceEn;
    if (voice) u.voice = voice;

    this._speaking = true;
    u.onend = () => {
      this._speaking = false;
      // Pause between utterances so listener can absorb
      setTimeout(() => this._pump(), this._gapMs);
    };
    u.onerror = () => {
      this._speaking = false;
      setTimeout(() => this._pump(), 100);
    };
    window.speechSynthesis.speak(u);
  }

  /** Clear all pending speech. */
  clearQueue() {
    this._queue = [];
    if (this.available) window.speechSynthesis.cancel();
    this._speaking = false;
  }

  stop() {
    this.clearQueue();
  }
}

export const tts = new TtsEngine();
