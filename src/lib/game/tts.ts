// Two Trees: Eden — Text-to-Speech engine
// Server-only TTS via /api/tts (Microsoft Edge Neural voices).
// Voice is fixed per side: Light → Svetlana (female), Dark → Dmitry (male).
// No browser voices, no picker — kept minimal.

'use client';

type Lang = 'ru' | 'en';
type Side = 'light' | 'dark' | null;

interface QueueItem {
  text: string;
  lang: Lang;
  side: Side;
  opts?: { rate?: number; volume?: number };
  interrupt?: boolean;
}

// Voice mapping per side:
//   Light → Svetlana (female, warm)
//   Dark  → Dmitry   (male, deeper)
//   null  → Svetlana (default, for system messages)
const SIDE_VOICE_KEY: Record<'light' | 'dark', 'svetlana' | 'dmitry'> = {
  light: 'svetlana',
  dark: 'dmitry',
};

class TtsEngine {
  private _enabled = true;
  private _queue: QueueItem[] = [];
  private _speaking = false;
  private _gapMs = 500;
  private _activeAudios: HTMLAudioElement[] = [];

  get enabled() { return this._enabled; }
  setEnabled(v: boolean) {
    this._enabled = v;
    if (!v) this.clearQueue();
  }

  get available() {
    return typeof window !== 'undefined';
  }

  private voiceKeyForSide(side: Side): 'svetlana' | 'dmitry' {
    if (side === 'light') return SIDE_VOICE_KEY.light;
    if (side === 'dark') return SIDE_VOICE_KEY.dark;
    return 'svetlana';
  }

  /** Enqueue a single utterance. `side` controls voice (Light=female, Dark=male). */
  speak(text: string, lang: Lang, opts?: { rate?: number; volume?: number; side?: Side }, interrupt = false) {
    if (!this._enabled) return;
    this._enqueue({
      text,
      lang,
      side: opts?.side ?? null,
      opts: opts ? { rate: opts.rate, volume: opts.volume } : undefined,
      interrupt,
    });
  }

  speakSequence(texts: string[], lang: Lang, side: Side = null, gap = 500) {
    if (!this._enabled || texts.length === 0) return;
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
    for (const a of this._activeAudios) {
      try { a.pause(); a.src = ''; a.load(); } catch {}
    }
    this._activeAudios = [];
  }

  private async _pump() {
    if (this._speaking) return;
    if (this._queue.length === 0) return;

    const item = this._queue.shift()!;
    this._speaking = true;

    const ok = await this._playServerTts(item.text, item.lang, item.side, item.opts);
    if (ok) {
      setTimeout(() => {
        this._speaking = false;
        this._pump();
      }, this._gapMs);
      return;
    }

    // Server failed — just skip (don't fall back to bad browser voice)
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
        setTimeout(() => finish(false), 15000);
        audio.play().catch(() => finish(false));
      });
    } catch {
      return false;
    }
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
