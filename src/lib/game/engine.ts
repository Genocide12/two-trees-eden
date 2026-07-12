// Two Trees: Eden — Core game engine
import type {
  GameState,
  Side,
  Lang,
  ActionId,
  EpochId,
  EndingId,
  Humanity,
  Resources,
  LogEntry,
  GameEvent,
} from './types';
import { ACTIONS, canAfford, MEDITATE_GAIN } from './actions';
import { EVENTS, eventsForEpoch } from './events';
import { EPOCH_ORDER, ENDINGS_BY_ID, tr } from './i18n';

const TURNS_PER_EPOCH: Record<EpochId, number> = {
  eden: 3,
  antiquity: 3,
  prophets: 3,
  empires: 3,
  schism: 3,
  apocalypse: 3,
  judgment: 3,
};

const STARTING_RESOURCES_LIGHT: Resources = {
  faith: 4, mercy: 4, grace: 3, doubt: 0, wrath: 0, temptation: 0,
};
const STARTING_RESOURCES_DARK: Resources = {
  faith: 0, mercy: 0, grace: 0, doubt: 4, wrath: 4, temptation: 3,
};
// Both sides start with their full resource pools — player and AI draw from
// their respective sides. The state.resources object holds all 6 fields.
const STARTING_RESOURCES_FULL: Resources = {
  faith: 4, mercy: 4, grace: 3,
  doubt: 4, wrath: 4, temptation: 3,
};

const STARTING_HUMANITY: Humanity = {
  population: 50,
  righteousness: 50,
  corruption: 50,
  knowledge: 30,
};

let _idCounter = 0;
function genId(): string {
  _idCounter += 1;
  return `${Date.now().toString(36)}-${_idCounter}`;
}

export function createInitialState(lang: Lang = 'ru'): GameState {
  return {
    playerId: genId(),
    playerSide: 'light',
    aiSide: 'dark',
    lang,
    epoch: 'eden',
    turn: 1,
    totalTurns: 1,
    resources: { ...STARTING_RESOURCES_LIGHT },
    humanity: { ...STARTING_HUMANITY },
    log: [],
    phase: 'side-select',
    pendingEvent: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function setSide(state: GameState, side: Side): GameState {
  const aiSide: Side = side === 'light' ? 'dark' : 'light';
  // Both sides start with their full resource pools so AI can actually act.
  const resources: Resources = { ...STARTING_RESOURCES_FULL };
  const next: GameState = {
    ...state,
    playerSide: side,
    aiSide,
    resources,
    phase: 'playing',
    turn: 1,
    totalTurns: 1,
    epoch: 'eden',
    humanity: { ...STARTING_HUMANITY },
    log: [{
      id: genId(),
      epoch: 'eden',
      turn: 1,
      actor: 'system',
      textKey: side === 'light'
        ? 'log.side.light'
        : 'log.side.dark',
      side,
    }],
    updatedAt: Date.now(),
  };
  return next;
}

// i18n keys for side selection log entries
import { T } from './i18n';
T['log.side.light'] = {
  ru: 'Ты избрал Свет. Творец взирает с безмолвным терпением.',
  en: 'You chose Light. The Creator watches with silent patience.',
};
T['log.side.dark'] = {
  ru: 'Ты избрал Тьму. Падший склоняется в насмешливом поклоне.',
  en: 'You chose Darkness. The Fallen bows in mock reverence.',
};

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function applyHumanity(h: Humanity, delta: Partial<Humanity>): Humanity {
  return {
    population: clamp(h.population + (delta.population ?? 0)),
    righteousness: clamp(h.righteousness + (delta.righteousness ?? 0)),
    corruption: clamp(h.corruption + (delta.corruption ?? 0)),
    knowledge: clamp(h.knowledge + (delta.knowledge ?? 0)),
  };
}

function applyCost(res: Resources, cost: Partial<Resources>, sign: 1 | -1 = -1): Resources {
  return {
    faith: Math.max(0, res.faith + sign * (cost.faith ?? 0)),
    mercy: Math.max(0, res.mercy + sign * (cost.mercy ?? 0)),
    grace: Math.max(0, res.grace + sign * (cost.grace ?? 0)),
    doubt: Math.max(0, res.doubt + sign * (cost.doubt ?? 0)),
    wrath: Math.max(0, res.wrath + sign * (cost.wrath ?? 0)),
    temptation: Math.max(0, res.temptation + sign * (cost.temptation ?? 0)),
  };
}

function logEntry(state: GameState, actor: LogEntry['actor'], side: Side, textKey: string, textParams?: Record<string, string | number>): LogEntry {
  return {
    id: genId(),
    epoch: state.epoch,
    turn: state.turn,
    actor,
    side,
    textKey,
    textParams,
  };
}

export function canPlayerAct(state: GameState, actionId: ActionId): boolean {
  const def = ACTIONS[actionId];
  if (!def) return false;
  // Meditate is always available (no cost, no side restriction)
  if (actionId === 'meditate') return true;
  if (def.side !== state.playerSide) return false;
  return canAfford(state.resources, def.cost);
}

// Pick a random narrative variant key for an action (1..3)
export function pickNarrativeKey(actionId: ActionId): string {
  const n = 1 + Math.floor(Math.random() * 3);
  return `act.${actionId}.narr.${n}`;
}

export function performPlayerAction(state: GameState, actionId: ActionId): GameState {
  if (state.phase !== 'playing') return state;
  if (!canPlayerAct(state, actionId)) return state;
  const def = ACTIONS[actionId];

  let newResources = applyCost(state.resources, def.cost, -1);
  let newHumanity = state.humanity;

  if (actionId === 'meditate') {
    // Restore +2 to each of the player's primary resources
    const gain = MEDITATE_GAIN[state.playerSide];
    (Object.keys(gain) as (keyof Resources)[]).forEach((k) => {
      newResources[k] = (newResources[k] ?? 0) + (gain[k] ?? 0);
    });
  } else {
    newHumanity = applyHumanity(state.humanity, def.effects);
  }

  // Use a random narrative variant instead of just the action name
  const narrKey = pickNarrativeKey(actionId);
  const entry = logEntry(state, 'system', state.playerSide, narrKey);
  const next: GameState = {
    ...state,
    resources: newResources,
    humanity: newHumanity,
    log: [...state.log, entry],
    updatedAt: Date.now(),
  };
  return resolveTurnEnd(next);
}

// AI takes its action. If it cannot afford anything, it meditates to recover.
export function performAiTurn(state: GameState, chosenAction: ActionId | null): GameState {
  if (state.phase !== 'playing') return state;
  // If AI has no chosen action, default to meditate (always available)
  const action: ActionId = chosenAction ?? 'meditate';
  const def = ACTIONS[action];

  let newResources = applyCost(state.resources, def.cost, -1);
  let newHumanity = state.humanity;

  if (action === 'meditate') {
    const gain = MEDITATE_GAIN[state.aiSide];
    (Object.keys(gain) as (keyof Resources)[]).forEach((k) => {
      newResources[k] = (newResources[k] ?? 0) + (gain[k] ?? 0);
    });
  } else {
    if (!canAfford(state.resources, def.cost)) {
      // Fallback: meditate
      return performAiTurn(state, 'meditate');
    }
    newHumanity = applyHumanity(state.humanity, def.effects);
  }

  // Use a random narrative variant for AI too
  const narrKey = pickNarrativeKey(action);
  return resolveTurnEnd({
    ...state,
    resources: newResources,
    humanity: newHumanity,
    log: [...state.log, logEntry(state, 'system', state.aiSide, narrKey)],
    updatedAt: Date.now(),
  });
}

T['log.ai_pass'] = {
  ru: 'Противник безмолвствует, копя силу.',
  en: 'The adversary is silent, gathering strength.',
};

function resolveTurnEnd(state: GameState): GameState {
  // Advance turn: turn 1 (player) → 2 (ai) → 3 (player) → next epoch…
  // We use a simple model: totalTurns increments each action (player or ai).
  // After totalTurns reaches TURNS_PER_EPOCH * 2, advance epoch.
  const newTotal = state.totalTurns + 1;
  // `turn` is the round number within the current epoch (1, 2, or 3).
  // Player and AI each act once per round, so turn = ceil(totalTurns / 2).
  const newTurn = Math.ceil(newTotal / 2);
  let next: GameState = {
    ...state,
    totalTurns: newTotal,
    turn: newTurn,
    updatedAt: Date.now(),
  };

  const limit = TURNS_PER_EPOCH[state.epoch] * 2;
  if (newTotal > limit) {
    next = advanceEpoch(next);
  }

  // Check ending
  const ending = computeEnding(next);
  if (ending) {
    return {
      ...next,
      phase: 'gameover',
      endingId: ending,
      log: [...next.log, logEntry(next, 'system', next.playerSide, ENDINGS_BY_ID[ending].titleKey)],
      updatedAt: Date.now(),
    };
  }

  // Random event triggers after every 2nd round (= 4 totalTurns).
  // Only trigger if it's the player's turn next (odd totalTurns after increment
  // means AI just acted → player's turn → player should see the event).
  // We check totalTurns % 4 === 0 so events are spread out.
  if (next.phase === 'playing' && next.totalTurns % 4 === 0) {
    const evt = pickRandomEventForEpoch(next.epoch);
    if (evt) {
      next = { ...next, phase: 'event', pendingEvent: evt };
    }
  }

  return next;
}

function advanceEpoch(state: GameState): GameState {
  const idx = EPOCH_ORDER.indexOf(state.epoch);
  if (idx >= EPOCH_ORDER.length - 1) {
    // Final epoch already — will be resolved by computeEnding
    return state;
  }
  const nextEpoch = EPOCH_ORDER[idx + 1];
  // Each epoch grants BOTH sides +1 to all their primary resources.
  // This keeps the AI competitive as the game progresses.
  const newRes: Resources = { ...state.resources };
  newRes.faith = (newRes.faith ?? 0) + 1;
  newRes.mercy = (newRes.mercy ?? 0) + 1;
  newRes.grace = (newRes.grace ?? 0) + 1;
  newRes.doubt = (newRes.doubt ?? 0) + 1;
  newRes.wrath = (newRes.wrath ?? 0) + 1;
  newRes.temptation = (newRes.temptation ?? 0) + 1;
  return {
    ...state,
    epoch: nextEpoch,
    turn: 1,
    totalTurns: 1,
    resources: newRes,
    log: [...state.log, logEntry(state, 'system', state.playerSide, 'log.epoch_advance', { epoch: nextEpoch })],
    updatedAt: Date.now(),
  };
}

T['log.epoch_advance'] = {
  ru: 'Эпоха сменяется: {epoch}.',
  en: 'An epoch passes: {epoch}.',
};

function pickRandomEventForEpoch(epoch: EpochId): GameEvent | null {
  const pool = eventsForEpoch(epoch);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function resolveEvent(state: GameState, optionId: string): GameState {
  if (state.phase !== 'event' || !state.pendingEvent) return state;
  const evt = state.pendingEvent;
  const opt = evt.options.find((o) => o.id === optionId);
  if (!opt) return state;
  const newHumanity = applyHumanity(state.humanity, opt.effects);
  const newRes: Resources = { ...state.resources };
  if (opt.resourceGain) {
    (Object.keys(opt.resourceGain) as (keyof Resources)[]).forEach((k) => {
      newRes[k] = (newRes[k] ?? 0) + (opt.resourceGain![k] ?? 0);
    });
  }
  return {
    ...state,
    humanity: newHumanity,
    resources: newRes,
    phase: 'playing',
    pendingEvent: null,
    log: [...state.log, logEntry(state, 'world', state.playerSide, opt.outcomeKey)],
    updatedAt: Date.now(),
  };
}

function computeEnding(state: GameState): EndingId | null {
  // Only at the final epoch
  if (state.epoch !== 'judgment') {
    // Mid-game annihilation conditions:
    if (state.humanity.population <= 5) return 'great_stillness';
    return null;
  }
  // Final epoch: resolve by humanity state
  const r = state.humanity.righteousness;
  const c = state.humanity.corruption;
  if (r >= 75 && c <= 30) return 'saints';
  if (c >= 75 && r <= 30) return 'eternal_night';
  if (Math.abs(r - c) <= 15) return 'silence';
  return 'great_stillness';
}

export function isPlayerTurn(state: GameState): boolean {
  // Player acts on odd totalTurns (1, 3, 5...), AI on even
  return state.totalTurns % 2 === 1;
}

export function shouldAiAct(state: GameState): boolean {
  return state.phase === 'playing' && !isPlayerTurn(state);
}

export function getEndingText(endingId: EndingId, lang: Lang): { title: string; text: string } {
  const e = ENDINGS_BY_ID[endingId];
  return { title: tr(e.titleKey, lang), text: tr(e.textKey, lang) };
}

// Re-export for convenience
export { ACTIONS, EPOCH_ORDER, ENDINGS_BY_ID };
