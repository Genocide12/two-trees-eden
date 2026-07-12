// Two Trees: Eden — Text-to-Speech engine
// Primary: server-side TTS via /api/tts (Microsoft Edge Neural voices)
// Fallback: Web Speech API (only if server fails 3 times — to avoid
//           unexpectedly switching to the bad default browser Russian voice)

'use client';

type Lang = 'ru' | 'en';
type Side = 'light' | 'dark' | null;

interface QueueItem {
  text: string;
  lang: Lang;
  side: Side;
  opts?: { rate?: number; pitch?: number; volume?: number };
  interrupt?: boolean;
}

// Voice mapping per side:
//   Light → Svetlana (female, warm)
//   Dark  → Dmitry   (male, deeper)
// For English the same mapping picks AriaNeural (female) and GuyNeural (male).
const SIDE_VOICE_KEY: Record<'light' | 'dark', 'svetlana' | 'dmitry'> = {
  light: 'svetlana',
  dark: 'dmitry',
};

class TtsEngine {
  private webVoices: SpeechSynthesisVoice[] = [];
  private _enabled = true;
  private _initialized = false;
  private _queue: QueueItem[] = [];
  private _speaking = false;
  private _selectedWebVoiceRu: SpeechSynthesisVoice | null = null;
  private _selectedWebVoiceEn: SpeechSynthesisVoice | null = null;
  private _gapMs = 500;
  private _useServerTts = true;
  // Default voice key (used when no side specified, e.g. UI sounds)
  private _defaultVoiceKey: 'svetlana' | 'dmitry' = 'svetlana';
  private _activeAudios: HTMLAudioElement[] = [];
  // Consecutive server TTS failures — if too many, fall back to web speech
  private _serverFailCount = 0;
  private static readonly SERVER_FAIL_THRESHOLD = 3;

  init() {
    if (this._initialized) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this._initialized = true;
    this.loadWebVoices();
    window.speechSynthesis.onvoiceschanged = () => this.loadWebVoices();
    setTimeout(() => this.loadWebVoices(), 500);
    setTimeout(() => this.loadWebVoices(), 1500);
  }

  private loadWebVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const v = window.speechSynthesis.getVoices();
    if (v.length === 0) return;
    this.webVoices = v;
    this._selectedWebVoiceRu = this.pickBestWebVoice('ru');
    this._selectedWebVoiceEn = this.pickBestWebVoice('en');
  }

  get enabled() { return this._enabled; }
  setEnabled(v: boolean) {
    this._enabled = v;
    if (!v) this.clearQueue();
  }

  get available() {
    return typeof window !== 'undefined';
  }

  get useServerTts() { return this._useServerTts; }
  setUseServerTts(v: boolean) {
    this._useServerTts = v;
    if (!v) this.clearQueue();
  }

  get defaultVoiceKey() { return this._defaultVoiceKey; }
  setDefaultVoiceKey(v: 'svetlana' | 'dmitry') {
    this._defaultVoiceKey = v;
  }

  get availableWebVoices(): SpeechSynthesisVoice[] {
    return this.webVoices;
  }

  private pickBestWebVoice(lang: Lang): SpeechSynthesisVoice | null {
    if (this.webVoices.length === 0) return null;
    const prefs = lang === 'ru'
      ? [/yandex/i, /Microsoft.*Svetlana/i, /Microsoft.*Yuri/i, /Google.*Russian/i, /Yuri/i, /Milena/i, /Katya/i]
      : [/Google.*US/i, /Microsoft.*Aria/i, /Samantha/i, /Daniel/i];
    const prefix = lang === 'ru' ? 'ru' : 'en';
    const langVoices = this.webVoices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    if (langVoices.length === 0) return null;
    for (const re of prefs) {
      const m = langVoices.find((v) => re.test(v.name));
      if (m) return m;
    }
    return langVoices[0];
  }

  getVoice(lang: Lang): SpeechSynthesisVoice | null {
    return lang === 'ru' ? this._selectedWebVoiceRu : this._selectedWebVoiceEn;
  }

  setVoice(lang: Lang, voiceName: string) {
    const v = this.webVoices.find((v) => v.name === voiceName);
    if (!v) return;
    if (lang === 'ru') this._selectedWebVoiceRu = v;
    else this._selectedWebVoiceEn = v;
  }

  getVoicesForLang(lang: Lang): SpeechSynthesisVoice[] {
    const prefix = lang === 'ru' ? 'ru' : 'en';
    return this.webVoices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  }

  /** Resolve which voice key to use for a given side. */
  private voiceKeyForSide(side: Side): 'svetlana' | 'dmitry' {
    if (side === 'light') return SIDE_VOICE_KEY.light;
    if (side === 'dark') return SIDE_VOICE_KEY.dark;
    return this._defaultVoiceKey;
  }

  /** Enqueue a single utterance. `side` controls voice (Light=female, Dark=male). */
  speak(text: string, lang: Lang, opts?: { rate?: number; pitch?: number; volume?: number; side?: Side }, interrupt = false) {
    if (!this._enabled) return;
    this.init();
    this._enqueue({
      text,
      lang,
      side: opts?.side ?? null,
      opts: opts ? { rate: opts.rate, pitch: opts.pitch, volume: opts.volume } : undefined,
      interrupt,
    });
  }

  speakSequence(texts: string[], lang: Lang, side: Side = null, gap = 500) {
    if (!this._enabled || texts.length === 0) return;
    this.init();
    const oldGap = this._gapMs;
    this._gapMs = gap;
    for (const t of texts) this._enqueue({ text: t, lang, side });
    setTimeout(() => { this._gapMs = oldGap; }, (texts.length * 3000) + gap);
  }

  private _enqueue(item: QueueItem) {
    if (item.interrupt) {
      this._queue = [item];
      this._stopAll();
      this._speaking = false;
    } else {
      this._queue.push(item);
    }
    this._pump();
  }

  private _stopAll() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    for (const a of this._activeAudios) {
      try { a.pause(); a.src = ''; a.load(); } catch {}
    }
    this._activeAudios = [];
  }

  private async _pump() {
    if (this._speaking) return;
    if (this._queue.length === 0) return;

    const item = this._queue.shift()!;

    // Try server TTS first (with retry on transient failures)
    if (this._useServerTts && this._serverFailCount < TtsEngine.SERVER_FAIL_THRESHOLD) {
      this._speaking = true;
      const ok = await this._playServerTts(item.text, item.lang, item.side, item.opts);
      if (ok) {
        this._serverFailCount = 0; // reset on success
        setTimeout(() => {
          this._speaking = false;
          this._pump();
        }, this._gapMs);
        return;
      }
      // Server failed — counter incremented in _playServerTts
    }

    // Fallback: Web Speech API (only used if server is unavailable or broken)
    if (typeof window !== 'undefined' && window.speechSynthesis && this.webVoices.length > 0) {
      this._speaking = true;
      this._playWebSpeech(item.text, item.lang, item.opts, () => {
        setTimeout(() => {
          this._speaking = false;
          this._pump();
        }, this._gapMs);
      });
      return;
    }

    // No TTS available — skip silently (don't fall back to bad voice)
    this._speaking = false;
    setTimeout(() => this._pump(), 50);
  }

  private async _playServerTts(text: string, lang: Lang, side: Side, opts?: { rate?: number; volume?: number }): Promise<boolean> {
    const voiceKey = this.voiceKeyForSide(side);
    try {
      const params = new URLSearchParams({ text, lang, voice: voiceKey });
      const url = `/api/tts?${params.toString()}`;
      const audio = new Audio(url);
      audio.volume = Math.min(1, (opts?.volume ?? 0.95));
      audio.playbackRate = opts?.rate ?? 1.0;
      this._activeAudios.push(audio);

      const ok = await new Promise<boolean>((resolve) => {
        let resolved = false;
        const finish = (ok: boolean) => {
          if (resolved) return;
          resolved = true;
          const idx = this._activeAudios.indexOf(audio);
          if (idx >= 0) this._activeAudios.splice(idx, 1);
          resolve(ok);
        };
        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);
        setTimeout(() => finish(false), 15000);
        audio.play().catch(() => finish(false));
      });

      if (!ok) {
        this._serverFailCount++;
      }
      return ok;
    } catch {
      this._serverFailCount++;
      return false;
    }
  }

  private _playWebSpeech(text: string, lang: Lang, opts: { rate?: number; pitch?: number; volume?: number } | undefined, onEnd: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd();
      return;
    }
    if (this.webVoices.length === 0) this.loadWebVoices();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
    u.rate = opts?.rate ?? 0.92;
    u.pitch = opts?.pitch ?? 1.0;
    u.volume = opts?.volume ?? 0.95;
    const voice = lang === 'ru' ? this._selectedWebVoiceRu : this._selectedWebVoiceEn;
    if (voice) u.voice = voice;
    u.onend = onEnd;
    u.onerror = onEnd;
    window.speechSynthesis.speak(u);
  }

  clearQueue() {
    this._queue = [];
    this._stopAll();
    this._speaking = false;
  }

  stop() {
    this.clearQueue();
  }
}

export const tts = new TtsEngine();
