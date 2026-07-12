// Two Trees: Eden — Text-to-Speech engine
// Primary: server-side TTS via /api/tts (Google Translate TTS, natural Russian voice)
// Fallback: Web Speech API (browser built-in voices)

'use client';

type Lang = 'ru' | 'en';

interface QueueItem {
  text: string;
  lang: Lang;
  opts?: { rate?: number; pitch?: number; volume?: number };
  interrupt?: boolean;
}

class TtsEngine {
  private webVoices: SpeechSynthesisVoice[] = [];
  private _enabled = true;
  private _initialized = false;
  private _queue: QueueItem[] = [];
  private _speaking = false;
  private _selectedWebVoiceRu: SpeechSynthesisVoice | null = null;
  private _selectedWebVoiceEn: SpeechSynthesisVoice | null = null;
  private _gapMs = 500;
  // Prefer server TTS (Edge Neural) for Russian — sounds much better
  // than the default browser Russian voice. For English, both are decent,
  // but we still prefer server for consistency.
  private _useServerTts = true;
  // Server voice key: 'svetlana' (female) or 'dmitry' (male)
  private _serverVoiceKey = 'svetlana';
  // Track active audio elements so we can stop them
  private _activeAudios: HTMLAudioElement[] = [];

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
    return typeof window !== 'undefined' && (!!window.speechSynthesis || true);
  }

  get useServerTts() { return this._useServerTts; }
  setUseServerTts(v: boolean) {
    this._useServerTts = v;
    if (!v) this.clearQueue();
  }

  get serverVoiceKey() { return this._serverVoiceKey; }
  setServerVoiceKey(v: string) {
    this._serverVoiceKey = v;
    if (!v) this.clearQueue();
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

  /** Enqueue a single utterance. */
  speak(text: string, lang: Lang, opts?: { rate?: number; pitch?: number; volume?: number }, interrupt = false) {
    if (!this._enabled) return;
    this.init();
    this._enqueue({ text, lang, opts, interrupt });
  }

  speakSequence(texts: string[], lang: Lang, gap = 500) {
    if (!this._enabled || texts.length === 0) return;
    this.init();
    const oldGap = this._gapMs;
    this._gapMs = gap;
    for (const t of texts) this._enqueue({ text: t, lang });
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
    // Stop web speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Stop server audio
    for (const a of this._activeAudios) {
      try { a.pause(); a.src = ''; a.load(); } catch {}
    }
    this._activeAudios = [];
  }

  private async _pump() {
    if (this._speaking) return;
    if (this._queue.length === 0) return;

    const item = this._queue.shift()!;

    // Try server TTS first for Russian (much better voice)
    if (this._useServerTts) {
      this._speaking = true;
      const ok = await this._playServerTts(item.text, item.lang, item.opts);
      if (ok) {
        // Schedule next item after gap
        setTimeout(() => {
          this._speaking = false;
          this._pump();
        }, this._gapMs);
        return;
      }
      // Fall through to web speech on failure
    }

    // Fallback: Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this._speaking = true;
      this._playWebSpeech(item.text, item.lang, item.opts, () => {
        setTimeout(() => {
          this._speaking = false;
          this._pump();
        }, this._gapMs);
      });
      return;
    }

    // No TTS available — skip
    this._speaking = false;
    setTimeout(() => this._pump(), 50);
  }

  private async _playServerTts(text: string, lang: Lang, opts?: { rate?: number; volume?: number }): Promise<boolean> {
    try {
      // Build URL with proper encoding
      const params = new URLSearchParams({
        text,
        lang,
        voice: this._serverVoiceKey,
      });
      const url = `/api/tts?${params.toString()}`;
      const audio = new Audio(url);
      audio.volume = Math.min(1, (opts?.volume ?? 0.95));
      audio.playbackRate = opts?.rate ?? 1.0;
      this._activeAudios.push(audio);

      return new Promise<boolean>((resolve) => {
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
        // Safety timeout: if audio doesn't start in 15s, give up
        setTimeout(() => finish(false), 15000);
        audio.play().catch(() => finish(false));
      });
    } catch {
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
