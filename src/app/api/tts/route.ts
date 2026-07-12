// Two Trees: Eden — Server-side TTS proxy
// Uses Google Translate TTS (free, no API key) for natural Russian voices.
// Falls back to nothing if the upstream fails — client will use Web Speech API.

import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = 'https://translate.google.com/translate_tts';
const MAX_LEN = 1000;

// In-memory LRU cache for generated audio (key = text+lang)
const cache = new Map<string, { buf: Buffer; ts: number }>();
const CACHE_MAX = 200;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const text = url.searchParams.get('text') ?? '';
  const lang = (url.searchParams.get('lang') ?? 'ru') as 'ru' | 'en';
  const tl = lang === 'ru' ? 'ru' : 'en';

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: `text too long (max ${MAX_LEN} chars)` }, { status: 413 });
  }

  // Cache lookup
  const cacheKey = `${lang}:${text}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new NextResponse(cached.buf, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': cached.buf.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  try {
    const upstreamUrl = new URL(UPSTREAM);
    upstreamUrl.searchParams.set('ie', 'UTF-8');
    upstreamUrl.searchParams.set('q', text);
    upstreamUrl.searchParams.set('tl', tl);
    upstreamUrl.searchParams.set('client', 'tw-ob');

    const resp = await fetch(upstreamUrl, {
      headers: {
        // Google blocks requests without a browser-like User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/mpeg, audio/*;q=0.9',
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `upstream ${resp.status}` },
        { status: 502 },
      );
    }

    const buf = Buffer.from(await resp.arrayBuffer());

    // Cache for future requests
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
    console.error('TTS proxy error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
