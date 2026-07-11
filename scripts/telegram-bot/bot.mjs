/**
 * Two Trees: Eden — Standalone Telegram Bot (text mode with inline buttons)
 *
 * This bot is fully independent from the Next.js app. It shares the same game
 * engine via a portable TS module (engine-bundle.ts) that you generate from the
 * Next.js source. To keep this file self-contained for deployment on Vercel
 * Functions, Render, Railway, fly.io, etc., we inline a minimal copy of the
 * game logic below.
 *
 * Deployment:
 *   1. Set env: BOT_TOKEN (from @BotFather), WEBAPP_URL (your Vercel app URL)
 *   2. Run: `node bot.mjs`  (long polling) OR set a webhook
 *   3. Optional: /setmenubutton via @BotFather to point at WEBAPP_URL
 *
 * Author: Two Trees: Eden
 */

import https from 'node:https';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — fill these in via env vars when deploying
// ─────────────────────────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN || 'PUT_YOUR_BOT_TOKEN_HERE';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-vercel-app.vercel.app';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─────────────────────────────────────────────────────────────────────────────
// INLINE GAME ENGINE — portable copy of the Next.js engine
// (kept in sync manually; for serious projects use a shared package)
// ─────────────────────────────────────────────────────────────────────────────

const EPOCH_ORDER = ['eden','antiquity','prophets','empires','schism','apocalypse','judgment'];
const TURNS_PER_EPOCH = 3;

const T = {
  'app.title': { ru: 'Два древа: Эдем', en: 'Two Trees: Eden' },
  'app.subtitle': { ru: 'Бог и Зло. Воля и судьба. Семь эпох.', en: 'God and Evil. Will and fate. Seven epochs.' },
  'side.title': { ru: 'Выбери сторону', en: 'Choose your side' },
  'side.light.name': { ru: 'Свет', en: 'Light' },
  'side.dark.name': { ru: 'Тьма', en: 'Darkness' },
  'side.light.desc': { ru: 'Бог-творец. Чудеса, пророки, заветы.', en: 'God the Creator. Miracles, prophets, covenants.' },
  'side.dark.desc': { ru: 'Падший дух. Искушения, ересь, ложь.', en: 'The Fallen. Temptation, heresy, deceit.' },
  'epoch.eden.name': { ru: 'Эдем', en: 'Eden' },
  'epoch.antiquity.name': { ru: 'Древность', en: 'Antiquity' },
  'epoch.prophets.name': { ru: 'Пророки', en: 'Prophets' },
  'epoch.empires.name': { ru: 'Империи', en: 'Empires' },
  'epoch.schism.name': { ru: 'Раскол', en: 'Schism' },
  'epoch.apocalypse.name': { ru: 'Апокалипсис', en: 'Apocalypse' },
  'epoch.judgment.name': { ru: 'Суд', en: 'Judgment' },
  'res.faith': { ru: 'Вера', en: 'Faith' },
  'res.mercy': { ru: 'Милость', en: 'Mercy' },
  'res.grace': { ru: 'Благодать', en: 'Grace' },
  'res.doubt': { ru: 'Сомнение', en: 'Doubt' },
  'res.wrath': { ru: 'Гнев', en: 'Wrath' },
  'res.temptation': { ru: 'Искушение', en: 'Temptation' },
  'hum.population': { ru: 'Население', en: 'Population' },
  'hum.righteousness': { ru: 'Праведность', en: 'Righteousness' },
  'hum.corruption': { ru: 'Порочность', en: 'Corruption' },
  'hum.knowledge': { ru: 'Знание', en: 'Knowledge' },
  'act.miracle.name': { ru: 'Чудо', en: 'Miracle' },
  'act.prophet.name': { ru: 'Пророк', en: 'Prophet' },
  'act.heal.name': { ru: 'Исцеление', en: 'Heal' },
  'act.covenant.name': { ru: 'Завет', en: 'Covenant' },
  'act.tempt.name': { ru: 'Искушение', en: 'Tempt' },
  'act.heresy.name': { ru: 'Ересь', en: 'Heresy' },
  'act.plague.name': { ru: 'Чума', en: 'Plague' },
  'act.deceit.name': { ru: 'Ложь', en: 'Deceit' },
  'ui.turn': { ru: 'Ход', en: 'Turn' },
  'ui.your_side': { ru: 'Твоя сторона', en: 'Your side' },
  'ui.enemy_side': { ru: 'Противник', en: 'Adversary' },
  'ui.actions': { ru: 'Действия', en: 'Actions' },
  'ui.game_over': { ru: 'Итог свершён', en: 'The verdict is given' },
  'ui.play_again': { ru: 'Начать заново', en: 'Begin anew' },
  'ui.open_webapp': { ru: 'Открыть веб-версию', en: 'Open web version' },
  'log.side.light': { ru: 'Ты избрал Свет.', en: 'You chose Light.' },
  'log.side.dark': { ru: 'Ты избрал Тьму.', en: 'You chose Darkness.' },
  'log.ai_pass': { ru: 'Противник безмолвствует, копя силу.', en: 'The adversary is silent, gathering strength.' },
  'log.epoch_advance': { ru: 'Эпоха сменяется: {epoch}.', en: 'An epoch passes: {epoch}.' },
  'end.saints.title': { ru: 'Эпоха Святых', en: 'Epoch of Saints' },
  'end.eternal_night.title': { ru: 'Вечная Ночь', en: 'Eternal Night' },
  'end.silence.title': { ru: 'Молчание Бога', en: 'The Silence of God' },
  'end.great_stillness.title': { ru: 'Великая Тишина', en: 'The Great Stillness' },
  'end.saints.text': { ru: 'Свет восторжествовал без остатка.', en: 'Light triumphed without remainder.' },
  'end.eternal_night.text': { ru: 'Тьма поглотила последний огонь.', en: 'Darkness swallowed the last fire.' },
  'end.silence.text': { ru: 'Чаши весов замерли ровно. Бог промолчал.', en: 'The scales stood even. God was silent.' },
  'end.great_stillness.text': { ru: 'Обе чаши опустели. Остался только ветер.', en: 'Both cups ran dry. Only wind remained.' },
};

function tr(key, lang, params) {
  const e = T[key];
  if (!e) return key;
  let s = e[lang] || e.en;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  return s;
}

const ACTIONS = {
  miracle:  { side: 'light', cost: { faith: 2, grace: 1 }, effects: { righteousness: 8, corruption: -4, population: 2 } },
  prophet:  { side: 'light', cost: { faith: 1, mercy: 2 }, effects: { righteousness: 6, knowledge: 3, corruption: -2 } },
  heal:     { side: 'light', cost: { mercy: 2, grace: 1 }, effects: { population: 6, righteousness: 3 } },
  covenant: { side: 'light', cost: { faith: 2, mercy: 2, grace: 2 }, effects: { righteousness: 10, knowledge: 4, population: 2, corruption: -6 } },
  tempt:    { side: 'dark', cost: { temptation: 2, doubt: 1 }, effects: { corruption: 7, righteousness: -4 } },
  heresy:   { side: 'dark', cost: { doubt: 2, temptation: 1 }, effects: { corruption: 6, knowledge: 4, righteousness: -3 } },
  plague:   { side: 'dark', cost: { wrath: 2, doubt: 1 }, effects: { population: -8, corruption: 5, righteousness: -2 } },
  deceit:   { side: 'dark', cost: { temptation: 2, wrath: 1, doubt: 1 }, effects: { corruption: 9, knowledge: -2, righteousness: -5, population: -2 } },
};

const ACTIONS_BY_SIDE = {
  light: ['miracle', 'prophet', 'heal', 'covenant'],
  dark: ['tempt', 'heresy', 'plague', 'deceit'],
};

function canAfford(res, cost) {
  for (const [k, v] of Object.entries(cost)) if ((res[k] || 0) < v) return false;
  return true;
}

function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }

function createInitialState(lang = 'ru') {
  return {
    lang,
    playerSide: 'light',
    aiSide: 'dark',
    epoch: 'eden',
    turn: 1,
    totalTurns: 1,
    resources: { faith: 4, mercy: 4, grace: 3, doubt: 0, wrath: 0, temptation: 0 },
    humanity: { population: 50, righteousness: 50, corruption: 50, knowledge: 10 },
    log: [],
    phase: 'side-select',
    pendingEvent: null,
    endingId: null,
  };
}

function setSide(state, side) {
  const aiSide = side === 'light' ? 'dark' : 'light';
  const resources = side === 'light'
    ? { faith: 4, mercy: 4, grace: 3, doubt: 0, wrath: 0, temptation: 0 }
    : { faith: 0, mercy: 0, grace: 0, doubt: 4, wrath: 4, temptation: 3 };
  return {
    ...state,
    playerSide: side,
    aiSide,
    resources,
    phase: 'playing',
    turn: 1,
    totalTurns: 1,
    epoch: 'eden',
    humanity: { population: 50, righteousness: 50, corruption: 50, knowledge: 10 },
    log: [{ id: '0', epoch: 'eden', turn: 1, actor: 'system', side, textKey: side === 'light' ? 'log.side.light' : 'log.side.dark' }],
  };
}

function applyCost(res, cost, sign = -1) {
  const out = { ...res };
  for (const [k, v] of Object.entries(cost)) out[k] = Math.max(0, out[k] + sign * v);
  return out;
}

function applyHumanity(h, d) {
  return {
    population: clamp(h.population + (d.population || 0)),
    righteousness: clamp(h.righteousness + (d.righteousness || 0)),
    corruption: clamp(h.corruption + (d.corruption || 0)),
    knowledge: clamp(h.knowledge + (d.knowledge || 0)),
  };
}

function chooseAiAction(state) {
  const ids = ACTIONS_BY_SIDE[state.aiSide].filter(id => canAfford(state.resources, ACTIONS[id].cost));
  if (ids.length === 0) return null;
  let best = null, bestScore = -Infinity;
  for (const id of ids) {
    const e = ACTIONS[id].effects;
    let s = 0;
    if (state.aiSide === 'light') {
      s += (e.righteousness || 0) * 1.2 - (e.corruption || 0) * 0.8 + (e.population || 0) * 0.5;
    } else {
      s += (e.corruption || 0) * 1.2 - (e.righteousness || 0) * 0.8;
    }
    s += Math.random() * 0.6;
    if (s > bestScore) { bestScore = s; best = id; }
  }
  return best;
}

function performAction(state, actionId, byPlayer) {
  const def = ACTIONS[actionId];
  if (!def) return state;
  if (!canAfford(state.resources, def.cost)) return state;
  const side = byPlayer ? state.playerSide : state.aiSide;
  const newResources = applyCost(state.resources, def.cost, -1);
  const newHumanity = applyHumanity(state.humanity, def.effects);
  let next = {
    ...state,
    resources: newResources,
    humanity: newHumanity,
    totalTurns: state.totalTurns + 1,
    log: [...state.log, { id: String(state.log.length), epoch: state.epoch, turn: state.turn, actor: 'system', side, textKey: `act.${actionId}.name` }],
  };
  const limit = TURNS_PER_EPOCH * 2;
  if (next.totalTurns > limit) {
    const idx = EPOCH_ORDER.indexOf(next.epoch);
    if (idx < EPOCH_ORDER.length - 1) {
      next.epoch = EPOCH_ORDER[idx + 1];
      next.turn = 1;
      next.totalTurns = 1;
      const gain = next.playerSide === 'light'
        ? { faith: 1, mercy: 1, grace: 1 }
        : { doubt: 1, wrath: 1, temptation: 1 };
      next.resources = { ...next.resources };
      for (const [k, v] of Object.entries(gain)) next.resources[k] = (next.resources[k] || 0) + v;
    }
  }
  // End conditions
  if (next.humanity.population <= 5) {
    next.phase = 'gameover';
    next.endingId = 'great_stillness';
    return next;
  }
  if (next.epoch === 'judgment' && next.totalTurns > TURNS_PER_EPOCH * 2) {
    const r = next.humanity.righteousness, c = next.humanity.corruption;
    next.phase = 'gameover';
    if (r >= 75 && c <= 30) next.endingId = 'saints';
    else if (c >= 75 && r <= 30) next.endingId = 'eternal_night';
    else if (Math.abs(r - c) <= 15) next.endingId = 'silence';
    else next.endingId = 'great_stillness';
  }
  return next;
}

function isPlayerTurn(state) { return state.totalTurns % 2 === 1; }

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — in-memory (use Redis/Postgres for production)
// ─────────────────────────────────────────────────────────────────────────────
const sessions = new Map(); // chatId -> { state, lang, lastMessageId }

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { state: createInitialState('ru'), lang: 'ru', lastMessageId: null });
  }
  return sessions.get(chatId);
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — turn game state into a Telegram message
// ─────────────────────────────────────────────────────────────────────────────
function renderState(session) {
  const { state, lang } = session;
  const tr2 = (k, p) => tr(k, lang, p);

  if (state.phase === 'side-select') {
    return {
      text: `*${tr2('app.title')}*\n\n_${tr2('app.subtitle')}_\n\n${tr2('side.title')}:`,
      buttons: [
        [
          { text: `☀️ ${tr2('side.light.name')}`, callback_data: 'side:light' },
          { text: `🌑 ${tr2('side.dark.name')}`, callback_data: 'side:dark' },
        ],
        [
          { text: lang === 'ru' ? 'EN' : 'RU', callback_data: 'lang:toggle' },
          { text: tr2('ui.open_webapp'), web_app: { url: WEBAPP_URL } },
        ],
      ],
    };
  }

  if (state.phase === 'gameover') {
    const titleKey = `end.${state.endingId}.title`;
    const textKey = `end.${state.endingId}.text`;
    return {
      text: `*${tr2('ui.game_over')}*\n\n*${tr2(titleKey)}*\n\n_${tr2(textKey)}_`,
      buttons: [
        [{ text: tr2('ui.play_again'), callback_data: 'reset' }],
        [{ text: tr2('ui.open_webapp'), web_app: { url: WEBAPP_URL } }],
      ],
    };
  }

  // Playing
  const r = state.resources;
  const h = state.humanity;
  const isLight = state.playerSide === 'light';

  const sideEmoji = isLight ? '☀️' : '🌑';
  const enemyEmoji = isLight ? '🌑' : '☀️';

  let text = `*${tr2(`epoch.${state.epoch}.name`)}* · ${tr2('ui.turn')} ${state.turn}\n\n`;
  text += `${sideEmoji} *${tr2('ui.your_side')}:* ${tr2(`side.${state.playerSide}.name`)}\n`;
  if (isLight) {
    text += `   ${tr2('res.faith')}: ${r.faith} · ${tr2('res.mercy')}: ${r.mercy} · ${tr2('res.grace')}: ${r.grace}\n`;
  } else {
    text += `   ${tr2('res.doubt')}: ${r.doubt} · ${tr2('res.wrath')}: ${r.wrath} · ${tr2('res.temptation')}: ${r.temptation}\n`;
  }
  text += `${enemyEmoji} *${tr2('ui.enemy_side')}:* ${tr2(`side.${state.aiSide}.name`)}\n\n`;
  text += `*${tr2('ui.humanity') || 'Humanity'}*\n`;
  text += `   ${tr2('hum.population')}: ${h.population}\n`;
  text += `   ${tr2('hum.righteousness')}: ${h.righteousness}\n`;
  text += `   ${tr2('hum.corruption')}: ${h.corruption}\n`;
  text += `   ${tr2('hum.knowledge')}: ${h.knowledge}\n`;

  // Last few log entries
  const lastLogs = state.log.slice(-3);
  if (lastLogs.length > 0) {
    text += `\n_Последние деяния:_\n`;
    for (const e of lastLogs) {
      const actor = e.side === 'light' ? '☀️' : '🌑';
      text += `${actor} ${tr(e.textKey, lang, e.textParams)}\n`;
    }
  }

  // Action buttons
  const myTurn = isPlayerTurn(state);
  const actionIds = ACTIONS_BY_SIDE[state.playerSide];
  const buttons = [];
  if (myTurn) {
    const row1 = [], row2 = [];
    for (let i = 0; i < actionIds.length; i++) {
      const id = actionIds[i];
      const def = ACTIONS[id];
      const ok = canAfford(state.resources, def.cost);
      const btn = {
        text: `${ok ? '' : '🚫 '}${tr(`act.${id}.name`, lang)}`,
        callback_data: `act:${id}`,
      };
      if (i < 2) row1.push(btn); else row2.push(btn);
    }
    buttons.push(row1, row2);
  } else {
    buttons.push([{ text: '…', callback_data: 'noop' }]);
  }
  buttons.push([
    { text: lang === 'ru' ? 'EN' : 'RU', callback_data: 'lang:toggle' },
    { text: tr2('ui.open_webapp'), web_app: { url: WEBAPP_URL } },
  ]);

  return { text, buttons };
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM API
// ─────────────────────────────────────────────────────────────────────────────
function tg(method, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      `${API}/${method}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => body += c);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { resolve(null); }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendOrEdit(chatId, session, payload) {
  // payload: { text, buttons }
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
// UPDATE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
async function handleCommand(chatId, cmd) {
  const session = getSession(chatId);
  if (cmd === '/start' || cmd === '/play' || cmd === '/new') {
    session.state = createInitialState(session.lang);
    session.lastMessageId = null;
    const p = renderState(session);
    await tg('sendMessage', {
      chat_id: chatId,
      text: `*${tr('app.title', session.lang)}*\n\n_${tr('app.subtitle', session.lang)}_`,
      parse_mode: 'Markdown',
    });
    await sendOrEdit(chatId, session, p);
  } else if (cmd === '/lang') {
    session.lang = session.lang === 'ru' ? 'en' : 'ru';
    session.state.lang = session.lang;
    const p = renderState(session);
    await sendOrEdit(chatId, session, p);
  } else if (cmd === '/help') {
    await tg('sendMessage', {
      chat_id: chatId,
      text: session.lang === 'ru'
        ? 'Игра «Два древа: Эдем».\n\n/start — новая игра\n/lang — сменить язык\nОткрой веб-версию кнопкой ниже для полного интерфейса.'
        : 'Game "Two Trees: Eden".\n\n/start — new game\n/lang — toggle language\nOpen the web version with the button below for the full interface.',
    });
  }
}

async function handleCallback(chatId, data) {
  const session = getSession(chatId);
  const state = session.state;

  if (data === 'reset') {
    session.state = createInitialState(session.lang);
    session.lastMessageId = null;
    const p = renderState(session);
    await sendOrEdit(chatId, session, p);
    return;
  }

  if (data === 'lang:toggle') {
    session.lang = session.lang === 'ru' ? 'en' : 'ru';
    session.state.lang = session.lang;
    const p = renderState(session);
    await sendOrEdit(chatId, session, p);
    return;
  }

  if (data === 'noop') return;

  if (data.startsWith('side:')) {
    const side = data.split(':')[1];
    session.state = setSide(state, side);
    const p = renderState(session);
    await sendOrEdit(chatId, session, p);
    return;
  }

  if (data.startsWith('act:')) {
    if (state.phase !== 'playing') return;
    if (!isPlayerTurn(state)) return;
    const actionId = data.split(':')[1];
    if (!canAfford(state.resources, ACTIONS[actionId].cost)) return;

    let next = performAction(state, actionId, true);
    session.state = next;

    // If game not over and now AI's turn, schedule AI move
    if (next.phase === 'playing' && !isPlayerTurn(next)) {
      const p1 = renderState(session);
      await sendOrEdit(chatId, session, p1);
      // AI move after delay
      setTimeout(async () => {
        const aiId = chooseAiAction(next);
        if (aiId) {
          session.state = performAction(next, aiId, false);
        } else {
          // pass: gain a primary resource
          const k = next.aiSide === 'light' ? 'faith' : 'doubt';
          session.state = { ...next, resources: { ...next.resources, [k]: (next.resources[k] || 0) + 1 } };
        }
        const p2 = renderState(session);
        await sendOrEdit(chatId, session, p2);
      }, 1200);
      return;
    }

    const p = renderState(session);
    await sendOrEdit(chatId, session, p);
    return;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LONG-POLLING LOOP
// ─────────────────────────────────────────────────────────────────────────────
let offset = 0;
async function poll() {
  while (true) {
    try {
      const r = await tg('getUpdates', { offset, timeout: 30 });
      if (!r || !r.ok) {
        console.error('Polling error:', r);
        await new Promise(res => setTimeout(res, 3000));
        continue;
      }
      for (const upd of r.result) {
        offset = upd.update_id + 1;
        try {
          if (upd.message) {
            const chatId = upd.message.chat.id;
            const text = upd.message.text || '';
            if (text.startsWith('/')) {
              await handleCommand(chatId, text.split(/\s+/)[0]);
            }
          } else if (upd.callback_query) {
            const cb = upd.callback_query;
            await tg('answerCallbackQuery', { callback_query_id: cb.id });
            await handleCallback(cb.message.chat.id, cb.data);
          }
        } catch (e) {
          console.error('Update handling error:', e);
        }
      }
    } catch (e) {
      console.error('Polling exception:', e);
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

async function main() {
  if (!BOT_TOKEN || BOT_TOKEN === 'PUT_YOUR_BOT_TOKEN_HERE') {
    console.error('ERROR: Set BOT_TOKEN env var (from @BotFather).');
    process.exit(1);
  }
  // Set bot menu button to open web app
  try {
    await tg('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Eden',
        web_app: { url: WEBAPP_URL },
      },
    });
    console.log('Menu button set to open', WEBAPP_URL);
  } catch (e) {
    console.warn('Could not set menu button:', e);
  }

  const me = await tg('getMe', {});
  if (me && me.ok) {
    console.log(`Bot @${me.result.username} is running. Long-polling…`);
  } else {
    console.error('getMe failed:', me);
    process.exit(1);
  }
  poll();
}

main();
