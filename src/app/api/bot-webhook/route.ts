// Two Trees: Eden — Telegram bot webhook handler
// Receives updates from Telegram, processes commands and callback queries,
// plays the full game inside the chat with inline keyboards.

import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://two-trees-eden.vercel.app';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─────────────────────────────────────────────────────────────────────────────
// INLINE GAME ENGINE (portable copy)
// ─────────────────────────────────────────────────────────────────────────────

const EPOCH_ORDER = ['eden','antiquity','prophets','empires','schism','apocalypse','judgment'] as const;
const EPOCH_NAMES: Record<string, { ru: string; en: string }> = {
  eden: { ru: 'Эдем', en: 'Eden' },
  antiquity: { ru: 'Древность', en: 'Antiquity' },
  prophets: { ru: 'Пророки', en: 'Prophets' },
  empires: { ru: 'Империи', en: 'Empires' },
  schism: { ru: 'Раскол', en: 'Schism' },
  apocalypse: { ru: 'Апокалипсис', en: 'Apocalypse' },
  judgment: { ru: 'Суд', en: 'Judgment' },
};
const TURNS_PER_EPOCH = 3;

const ACTIONS: Record<string, { side: 'light'|'dark', cost: Record<string, number>, effects: Record<string, number> }> = {
  miracle:  { side: 'light', cost: { faith: 2, grace: 1 }, effects: { righteousness: 6, corruption: -3, population: 4, knowledge: 2 } },
  prophet:  { side: 'light', cost: { faith: 1, mercy: 2 }, effects: { righteousness: 4, knowledge: 6, corruption: -2, population: 2 } },
  heal:     { side: 'light', cost: { mercy: 2, grace: 1 }, effects: { population: 8, righteousness: 3, knowledge: 1, corruption: -1 } },
  covenant: { side: 'light', cost: { faith: 2, mercy: 2, grace: 2 }, effects: { righteousness: 7, knowledge: 4, population: 3, corruption: -4 } },
  tempt:    { side: 'dark', cost: { temptation: 2, doubt: 1 }, effects: { corruption: 6, righteousness: -3, population: -2, knowledge: 1 } },
  heresy:   { side: 'dark', cost: { doubt: 2, temptation: 1 }, effects: { corruption: 5, knowledge: 6, righteousness: -2, population: -1 } },
  plague:   { side: 'dark', cost: { wrath: 2, doubt: 1 }, effects: { population: -10, corruption: 4, righteousness: -3, knowledge: 2 } },
  deceit:   { side: 'dark', cost: { temptation: 2, wrath: 1, doubt: 1 }, effects: { corruption: 7, righteousness: -4, knowledge: -1, population: -3 } },
  meditate: { side: 'light', cost: {}, effects: {} },
};

const ACTION_NAMES: Record<string, { ru: string; en: string }> = {
  miracle: { ru: 'Чудо', en: 'Miracle' },
  prophet: { ru: 'Пророк', en: 'Prophet' },
  heal: { ru: 'Исцеление', en: 'Heal' },
  covenant: { ru: 'Завет', en: 'Covenant' },
  tempt: { ru: 'Искушение', en: 'Tempt' },
  heresy: { ru: 'Ересь', en: 'Heresy' },
  plague: { ru: 'Чума', en: 'Plague' },
  deceit: { ru: 'Ложь', en: 'Deceit' },
  meditate: { ru: 'Созерцать', en: 'Meditate' },
};

const ACTIONS_BY_SIDE: Record<'light'|'dark', string[]> = {
  light: ['miracle', 'prophet', 'heal', 'covenant', 'meditate'],
  dark: ['tempt', 'heresy', 'plague', 'deceit', 'meditate'],
};

const MEDITATE_GAIN: Record<'light'|'dark', Record<string, number>> = {
  light: { faith: 2, mercy: 2, grace: 2 },
  dark: { doubt: 2, wrath: 2, temptation: 2 },
};

const RES_NAMES: Record<string, { ru: string; en: string }> = {
  faith: { ru: 'Вера', en: 'Faith' },
  mercy: { ru: 'Милость', en: 'Mercy' },
  grace: { ru: 'Благодать', en: 'Grace' },
  doubt: { ru: 'Сомнение', en: 'Doubt' },
  wrath: { ru: 'Гнев', en: 'Wrath' },
  temptation: { ru: 'Искушение', en: 'Temptation' },
};

const ENDINGS: Record<string, { title: { ru: string; en: string }; text: { ru: string; en: string } }> = {
  saints: {
    title: { ru: 'Эпоха Святых', en: 'Epoch of Saints' },
    text: { ru: 'Свет восторжествовал без остатка.', en: 'Light triumphed without remainder.' },
  },
  eternal_night: {
    title: { ru: 'Вечная Ночь', en: 'Eternal Night' },
    text: { ru: 'Тьма поглотила последний огонь.', en: 'Darkness swallowed the last fire.' },
  },
  silence: {
    title: { ru: 'Молчание Бога', en: 'The Silence of God' },
    text: { ru: 'Чаши весов замерли ровно. Бог промолчал.', en: 'The scales stood even. God was silent.' },
  },
  great_stillness: {
    title: { ru: 'Великая Тишина', en: 'The Great Stillness' },
    text: { ru: 'Обе чаши опустели. Остался только ветер.', en: 'Both cups ran dry. Only wind remained.' },
  },
};

interface GameState {
  lang: 'ru'|'en';
  playerSide: 'light'|'dark';
  aiSide: 'light'|'dark';
  epoch: string;
  turn: number;
  totalTurns: number;
  resources: Record<string, number>;
  humanity: { population: number; righteousness: number; corruption: number; knowledge: number };
  log: { text: string; side: 'light'|'dark' }[];
  phase: 'side-select'|'playing'|'gameover';
  endingId: string | null;
}

function tr(state: GameState, key: { ru: string; en: string }): string {
  return key[state.lang];
}

function createInitialState(lang: 'ru'|'en'): GameState {
  return {
    lang,
    playerSide: 'light',
    aiSide: 'dark',
    epoch: 'eden',
    turn: 1,
    totalTurns: 1,
    resources: { faith: 4, mercy: 4, grace: 3, doubt: 4, wrath: 4, temptation: 3 },
    humanity: { population: 50, righteousness: 50, corruption: 50, knowledge: 30 },
    log: [],
    phase: 'side-select',
    endingId: null,
  };
}

function setSide(state: GameState, side: 'light'|'dark'): GameState {
  return { ...state, playerSide: side, aiSide: side === 'light' ? 'dark' : 'light', phase: 'playing', epoch: 'eden', turn: 1, totalTurns: 1 };
}

function canAfford(res: Record<string, number>, cost: Record<string, number>): boolean {
  for (const [k, v] of Object.entries(cost)) if ((res[k] || 0) < v) return false;
  return true;
}

function clamp(v: number): number { return Math.max(0, Math.min(100, v)); }

function applyAction(state: GameState, actionId: string, bySide: 'light'|'dark'): GameState {
  const def = ACTIONS[actionId];
  const newRes = { ...state.resources };
  let newHum = { ...state.humanity };

  if (actionId === 'meditate') {
    const gain = MEDITATE_GAIN[bySide];
    for (const [k, v] of Object.entries(gain)) newRes[k] = (newRes[k] || 0) + v;
  } else {
    for (const [k, v] of Object.entries(def.cost)) newRes[k] = Math.max(0, (newRes[k] || 0) - v);
    newHum = {
      population: clamp(newHum.population + (def.effects.population || 0)),
      righteousness: clamp(newHum.righteousness + (def.effects.righteousness || 0)),
      corruption: clamp(newHum.corruption + (def.effects.corruption || 0)),
      knowledge: clamp(newHum.knowledge + (def.effects.knowledge || 0)),
    };
  }

  let next: GameState = {
    ...state,
    resources: newRes,
    humanity: newHum,
    totalTurns: state.totalTurns + 1,
    turn: Math.ceil((state.totalTurns + 1) / 2),
    log: [...state.log, { text: tr(state, ACTION_NAMES[actionId]), side: bySide }].slice(-8),
  };

  const limit = TURNS_PER_EPOCH * 2;
  if (next.totalTurns > limit) {
    const idx = EPOCH_ORDER.indexOf(next.epoch);
    if (idx < EPOCH_ORDER.length - 1) {
      next.epoch = EPOCH_ORDER[idx + 1];
      next.turn = 1;
      next.totalTurns = 1;
      for (const k of Object.keys(next.resources)) next.resources[k] = (next.resources[k] || 0) + 1;
    }
  }

  if (next.humanity.population <= 5) {
    next.phase = 'gameover';
    next.endingId = 'great_stillness';
  } else if (next.epoch === 'judgment' && next.totalTurns > TURNS_PER_EPOCH * 2) {
    const r = next.humanity.righteousness, c = next.humanity.corruption;
    next.phase = 'gameover';
    if (r >= 75 && c <= 30) next.endingId = 'saints';
    else if (c >= 75 && r <= 30) next.endingId = 'eternal_night';
    else if (Math.abs(r - c) <= 15) next.endingId = 'silence';
    else next.endingId = 'great_stillness';
  }

  return next;
}

function isPlayerTurn(state: GameState): boolean { return state.totalTurns % 2 === 1; }

function chooseAiAction(state: GameState): string {
  const ids = ACTIONS_BY_SIDE[state.aiSide].filter(id => id !== 'meditate');
  const candidates = ids.filter(id => canAfford(state.resources, ACTIONS[id].cost));
  if (candidates.length === 0) return 'meditate';

  let best = candidates[0], bestScore = -Infinity;
  for (const id of candidates) {
    const after = applyAction(state, id, state.aiSide);
    let score = state.aiSide === 'light'
      ? after.humanity.righteousness - after.humanity.corruption * 0.8 + after.humanity.population * 0.3
      : after.humanity.corruption - after.humanity.righteousness * 0.8 + after.humanity.knowledge * 0.3;
    score += Math.random() * 0.5;
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────────────────────

function renderState(state: GameState): { text: string; buttons: any[][] } {
  if (state.phase === 'side-select') {
    return {
      text: `*Two Trees: Eden*\n\nChoose your side:`,
      buttons: [
        [
          { text: '☀️ Light', callback_data: 'side:light' },
          { text: '🌑 Darkness', callback_data: 'side:dark' },
        ],
        [
          { text: state.lang === 'ru' ? 'EN' : 'RU', callback_data: 'lang:toggle' },
          { text: '🌐 Open web version', web_app: { url: WEBAPP_URL } },
        ],
      ],
    };
  }

  if (state.phase === 'gameover') {
    const e = ENDINGS[state.endingId || 'great_stillness'];
    return {
      text: `*${tr(state, { ru: 'Итог свершён', en: 'The verdict is given' })}*\n\n*${tr(state, e.title)}*\n\n_${tr(state, e.text)}_`,
      buttons: [
        [{ text: tr(state, { ru: 'Начать заново', en: 'Begin anew' }), callback_data: 'reset' }],
        [{ text: '🌐 Open web version', web_app: { url: WEBAPP_URL } }],
      ],
    };
  }

  const r = state.resources, h = state.humanity;
  const isLight = state.playerSide === 'light';
  const sideEmoji = isLight ? '☀️' : '🌑';
  const enemyEmoji = isLight ? '🌑' : '☀️';

  let text = `*${tr(state, EPOCH_NAMES[state.epoch])}* · ${tr(state, { ru: 'Ход', en: 'Turn' })} ${state.turn}\n\n`;
  text += `${sideEmoji} *${tr(state, { ru: 'Ты', en: 'You' })}:* ${tr(state, isLight ? { ru: 'Свет', en: 'Light' } : { ru: 'Тьма', en: 'Darkness' })}\n`;
  if (isLight) {
    text += `   ${tr(state, RES_NAMES.faith)}: ${r.faith} · ${tr(state, RES_NAMES.mercy)}: ${r.mercy} · ${tr(state, RES_NAMES.grace)}: ${r.grace}\n`;
  } else {
    text += `   ${tr(state, RES_NAMES.doubt)}: ${r.doubt} · ${tr(state, RES_NAMES.wrath)}: ${r.wrath} · ${tr(state, RES_NAMES.temptation)}: ${r.temptation}\n`;
  }
  text += `${enemyEmoji} *${tr(state, { ru: 'Противник', en: 'Adversary' })}:* ${tr(state, isLight ? { ru: 'Тьма', en: 'Darkness' } : { ru: 'Свет', en: 'Light' })}\n\n`;
  text += `*${tr(state, { ru: 'Человечество', en: 'Humanity' })}*\n`;
  text += `   ${tr(state, { ru: 'Население', en: 'Population' })}: ${h.population}\n`;
  text += `   ${tr(state, { ru: 'Праведность', en: 'Righteousness' })}: ${h.righteousness}\n`;
  text += `   ${tr(state, { ru: 'Порочность', en: 'Corruption' })}: ${h.corruption}\n`;
  text += `   ${tr(state, { ru: 'Знание', en: 'Knowledge' })}: ${h.knowledge}\n`;

  const lastLogs = state.log.slice(-3);
  if (lastLogs.length > 0) {
    text += `\n_${tr(state, { ru: 'Последние деяния', en: 'Last deeds' })}:_\n`;
    for (const e of lastLogs) {
      const actor = e.side === 'light' ? '☀️' : '🌑';
      text += `${actor} ${e.text}\n`;
    }
  }

  const myTurn = isPlayerTurn(state);
  const buttons: any[][] = [];
  if (myTurn) {
    const ids = ACTIONS_BY_SIDE[state.playerSide];
    const row1: any[] = [], row2: any[] = [];
    ids.forEach((id, i) => {
      const def = ACTIONS[id];
      const ok = id === 'meditate' ? true : canAfford(state.resources, def.cost);
      const btn = {
        text: `${ok ? '' : '🚫 '}${tr(state, ACTION_NAMES[id])}`,
        callback_data: `act:${id}`,
      };
      if (i < 3) row1.push(btn); else row2.push(btn);
    });
    if (row1.length) buttons.push(row1);
    if (row2.length) buttons.push(row2);
  } else {
    buttons.push([{ text: '…', callback_data: 'noop' }]);
  }
  buttons.push([
    { text: state.lang === 'ru' ? 'EN' : 'RU', callback_data: 'lang:toggle' },
    { text: '🌐 Web version', web_app: { url: WEBAPP_URL } },
  ]);

  return { text, buttons };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — in-memory (resets on cold start)
// ─────────────────────────────────────────────────────────────────────────────

const sessions = new Map<number, { state: GameState; lastMessageId: number | null }>();

function getSession(chatId: number) {
  if (!sessions.has(chatId)) sessions.set(chatId, { state: createInitialState('ru'), lastMessageId: null });
  return sessions.get(chatId)!;
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM API
// ─────────────────────────────────────────────────────────────────────────────

async function tg(method: string, payload: any): Promise<any> {
  if (!BOT_TOKEN) return null;
  try {
    const r = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch (e) {
    console.error('TG API error:', e);
    return null;
  }
}

async function sendOrEdit(chatId: number, session: any, payload: { text: string; buttons: any[][] }) {
  const keyboard = { inline_keyboard: payload.buttons };
  if (session.lastMessageId) {
    const r = await tg('editMessageText', {
      chat_id: chatId,
      message_id: session.lastMessageId,
      text: payload.text,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
    if (r && r.ok) return;
  }
  const r = await tg('sendMessage', {
    chat_id: chatId,
    text: payload.text,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
  if (r && r.ok) session.lastMessageId = r.result.message_id;
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

async function handleCommand(chatId: number, cmd: string) {
  const session = getSession(chatId);
  if (cmd === '/start' || cmd === '/play' || cmd === '/new') {
    session.state = createInitialState(session.state.lang);
    session.lastMessageId = null;
    await tg('sendMessage', {
      chat_id: chatId,
      text: `*Two Trees: Eden*\n\n_A stoic strategy game of God and Evil across seven epochs._`,
      parse_mode: 'Markdown',
    });
    await sendOrEdit(chatId, session, renderState(session.state));
  } else if (cmd === '/lang') {
    session.state.lang = session.state.lang === 'ru' ? 'en' : 'ru';
    await sendOrEdit(chatId, session, renderState(session.state));
  } else if (cmd === '/help') {
    await tg('sendMessage', {
      chat_id: chatId,
      text: session.state.lang === 'ru'
        ? 'Игра «Два древа: Эдем».\n\n/start — новая игра\n/lang — сменить язык\nОткрой веб-версию для полного интерфейса со звуком и музыкой.'
        : 'Game "Two Trees: Eden".\n\n/start — new game\n/lang — toggle language\nOpen the web version for the full experience with sound and music.',
    });
  }
}

async function handleCallback(chatId: number, data: string) {
  const session = getSession(chatId);
  const state = session.state;

  if (data === 'reset') {
    session.state = createInitialState(session.state.lang);
    session.lastMessageId = null;
    await sendOrEdit(chatId, session, renderState(session.state));
    return;
  }
  if (data === 'lang:toggle') {
    session.state.lang = session.state.lang === 'ru' ? 'en' : 'ru';
    await sendOrEdit(chatId, session, renderState(session.state));
    return;
  }
  if (data === 'noop') return;

  if (data.startsWith('side:')) {
    const side = data.split(':')[1] as 'light' | 'dark';
    session.state = setSide(state, side);
    await sendOrEdit(chatId, session, renderState(session.state));
    return;
  }

  if (data.startsWith('act:')) {
    if (state.phase !== 'playing') return;
    if (!isPlayerTurn(state)) return;
    const actionId = data.split(':')[1];
    const def = ACTIONS[actionId];
    if (actionId !== 'meditate' && !canAfford(state.resources, def.cost)) return;

    let next = applyAction(state, actionId, state.playerSide);
    session.state = next;

    if (next.phase === 'playing' && !isPlayerTurn(next)) {
      await sendOrEdit(chatId, session, renderState(session.state));
      // AI move
      const aiAction = chooseAiAction(next);
      session.state = applyAction(next, aiAction, next.aiSide);
      await sendOrEdit(chatId, session, renderState(session.state));
      return;
    }

    await sendOrEdit(chatId, session, renderState(session.state));
    return;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'BOT_TOKEN not set' }, { status: 500 });
  }
  let update: any;
  try { update = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  try {
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';
      if (text.startsWith('/')) {
        await handleCommand(chatId, text.split(/\s+/)[0]);
      }
    } else if (update.callback_query) {
      const cb = update.callback_query;
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      await handleCallback(cb.message.chat.id, cb.data);
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, name: 'Two Trees: Eden bot webhook' });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;
