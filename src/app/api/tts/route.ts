// Two Trees: Eden — Server-side TTS via Microsoft Edge Neural voices
// Uses node-edge-tts (no API key, free, premium quality).
// Voices: ru-RU-SvetlanaNeural (female), ru-RU-DmitryNeural (male),
//         en-US-AriaNeural (female), en-US-GuyNeural (male), etc.

import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

// In-memory cache: text+voice → Buffer
const cache = new Map<string, { buf: Buffer; ts: number }>();
const CACHE_MAX = 200;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const VOICE_MAP: Record<string, { ru: string; en: string }> = {
  svetlana: { ru: 'ru-RU-SvetlanaNeural', en: 'en-US-AriaNeural' },
  dmitry:   { ru: 'ru-RU-DmitryNeural',   en: 'en-US-GuyNeural' },
  // 'auto' uses svetlana for ru, aria for en
};
const DEFAULT_VOICE_KEY = 'svetlana';
const LANG_VOICE_FALLBACK: Record<'ru' | 'en', string> = {
  ru: 'ru-RU-SvetlanaNeural',
  en: 'en-US-AriaNeural',
};

const MAX_LEN = 1000;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const text = url.searchParams.get('text') ?? '';
  const lang = (url.searchParams.get('lang') ?? 'ru') as 'ru' | 'en';
  const voiceKey = (url.searchParams.get('voice') ?? DEFAULT_VOICE_KEY) as string;

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: `text too long (max ${MAX_LEN} chars)` }, { status: 413 });
  }

  // Resolve voice
  const mapEntry = VOICE_MAP[voiceKey];
  const voice = mapEntry
    ? mapEntry[lang]
    : LANG_VOICE_FALLBACK[lang];

  // Cache lookup
  const cacheKey = `${voice}:${text}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new NextResponse(cached.buf, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': cached.buf.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Generate via Edge TTS — writes to temp file, then we read it back.
  const tmpDir = path.join(os.tmpdir(), 'eden-tts');
  if (!existsSync(tmpDir)) {
    try { await mkdir(tmpDir, { recursive: true }); } catch {}
  }
  const tmpFile = path.join(tmpDir, `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`);

  try {
    const tts = new EdgeTTS({
      voice,
      lang: lang === 'ru' ? 'ru-RU' : 'en-US',
      rate: 'default',
      pitch: 'default',
      volume: 'default',
      timeout: 15000,
    });
    await tts.ttsPromise(text, tmpFile);

    if (!existsSync(tmpFile)) {
      return NextResponse.json({ error: 'TTS produced no output' }, { status: 500 });
    }
    const buf = await readFile(tmpFile);
    if (buf.length === 0) {
      return NextResponse.json({ error: 'TTS produced empty output' }, { status: 500 });
    }

    // Cache
    cache.set(cacheKey, { buf, ts: Date.now() });
    if (cache.size > CACHE_MAX) {
      const oldest = Array.from(cache.entries()).sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) cache.delete(oldest[0]);
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buf.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    console.error('Edge TTS error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown TTS error' },
      { status: 500 },
    );
  } finally {
    // Clean up temp file
    try { await unlink(tmpFile); } catch {}
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
