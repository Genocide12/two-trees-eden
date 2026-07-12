// Two Trees: Eden — Adversary AI with minimax + alpha-beta pruning
//
// The AI looks ahead 2-3 plies (its move + player's response + its next move)
// and picks the action that maximizes its side's outcome assuming the player
// plays optimally against it.
//
// Evaluation function:
//   - For Light AI: righteousness - corruption + 0.3*population + 0.2*knowledge
//   - For Dark AI:  corruption - righteousness + 0.4*knowledge
//   - + small bonus for unused resources (so AI doesn't burn them pointlessly)
//   - + large bonus/penalty for endings
//
// Minimax depth: 3 (AI → Player → AI). Deeper would be too slow synchronously.

import type { GameState, ActionId, Side, Resources, Humanity } from './types';
import { ACTIONS, ACTION_IDS_BY_SIDE, canAfford, MEDITATE_GAIN } from './actions';

const MAX_DEPTH = 3;
const AI_LIGHT_EVAL_WEIGHTS = {
  righteousness: 1.2,
  corruption: -0.8,
  population: 0.4,
  knowledge: 0.2,
};
const AI_DARK_EVAL_WEIGHTS = {
  righteousness: -0.8,
  corruption: 1.2,
  population: 0.0,
  knowledge: 0.4,
};

function evaluate(state: GameState, aiSide: Side): number {
  // Endings
  if (state.phase === 'gameover') {
    if (state.endingId === 'saints') return aiSide === 'light' ? 10000 : -10000;
    if (state.endingId === 'eternal_night') return aiSide === 'dark' ? 10000 : -10000;
    return 0; // neutral endings
  }
  if (state.humanity.population <= 5) return -5000; // mutual destruction

  const h = state.humanity;
  const w = aiSide === 'light' ? AI_LIGHT_EVAL_WEIGHTS : AI_DARK_EVAL_WEIGHTS;
  let score = 0;
  score += h.righteousness * w.righteousness;
  score += h.corruption * w.corruption;
  score += h.population * w.population;
  score += h.knowledge * w.knowledge;

  // Resource bonus (only for AI's side resources)
  const r = state.resources;
  if (aiSide === 'light') {
    score += (r.faith + r.mercy + r.grace) * 0.15;
  } else {
    score += (r.doubt + r.wrath + r.temptation) * 0.15;
  }

  return score;
}

// Clone state and apply an action (without triggering random events, since
// minimax can't reason about randomness). Returns null if action not affordable.
function applyAction(state: GameState, actionId: ActionId, bySide: Side): GameState | null {
  const def = ACTIONS[actionId];
  if (actionId !== 'meditate') {
    if (def.side !== bySide) return null;
    if (!canAfford(state.resources, def.cost)) return null;
  }

  const newResources: Resources = { ...state.resources };
  // Apply cost
  for (const [k, v] of Object.entries(def.cost)) {
    newResources[k as keyof Resources] = Math.max(0, (newResources[k as keyof Resources] ?? 0) - (v ?? 0));
  }

  let newHumanity: Humanity = state.humanity;
  if (actionId === 'meditate') {
    const gain = MEDITATE_GAIN[bySide];
    for (const [k, v] of Object.entries(gain)) {
      newResources[k as keyof Resources] = (newResources[k as keyof Resources] ?? 0) + (v ?? 0);
    }
  } else {
    newHumanity = {
      population: clamp(newHumanity.population + (def.effects.population ?? 0)),
      righteousness: clamp(newHumanity.righteousness + (def.effects.righteousness ?? 0)),
      corruption: clamp(newHumanity.corruption + (def.effects.corruption ?? 0)),
      knowledge: clamp(newHumanity.knowledge + (def.effects.knowledge ?? 0)),
    };
  }

  const newTotalTurns = state.totalTurns + 1;
  let next: GameState = {
    ...state,
    resources: newResources,
    humanity: newHumanity,
    totalTurns: newTotalTurns,
    turn: Math.ceil(newTotalTurns / 2),
    // Don't trigger events in minimax (no randomness)
    phase: 'playing',
    pendingEvent: null,
  };

  // Check endings (simplified — no epoch advance in minimax for speed)
  if (next.humanity.population <= 5) {
    next.phase = 'gameover';
    next.endingId = 'great_stillness';
  }

  return next;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function getValidActions(state: GameState, side: Side): ActionId[] {
  const ids = ACTION_IDS_BY_SIDE[side];
  return ids.filter((id) => {
    if (id === 'meditate') return true;
    const def = ACTIONS[id];
    return def.side === side && canAfford(state.resources, def.cost);
  });
}

function isPlayerTurn(state: GameState): boolean {
  return state.totalTurns % 2 === 1;
}

// Minimax with alpha-beta pruning.
// Returns { score, action } where action is the best move for the side to move.
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  aiSide: Side,
): { score: number; action: ActionId | null } {
  if (depth === 0 || state.phase === 'gameover') {
    return { score: evaluate(state, aiSide), action: null };
  }

  const sideToMove: Side = isPlayerTurn(state) ? state.playerSide : state.aiSide;
  const isMaximizing = sideToMove === aiSide;
  const validActions = getValidActions(state, sideToMove);

  if (validActions.length === 0) {
    // No valid action — meditate (always available)
    const nextState = applyAction(state, 'meditate', sideToMove);
    if (!nextState) return { score: evaluate(state, aiSide), action: null };
    const result = minimax(nextState, depth - 1, alpha, beta, aiSide);
    return { score: result.score, action: 'meditate' };
  }

  let bestAction: ActionId | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const action of validActions) {
    const nextState = applyAction(state, action, sideToMove);
    if (!nextState) continue;

    const result = minimax(nextState, depth - 1, alpha, beta, aiSide);

    if (isMaximizing) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestAction = action;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestAction = action;
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) break; // prune
  }

  return { score: bestScore, action: bestAction };
}

export function chooseAiAction(state: GameState): ActionId | null {
  const validActions = getValidActions(state, state.aiSide);
  if (validActions.length === 0) return 'meditate';

  // Run minimax
  const result = minimax(state, MAX_DEPTH, -Infinity, Infinity, state.aiSide);

  // If minimax didn't pick anything (shouldn't happen), fall back to first valid
  if (!result.action) return validActions[0];

  // Add 15% randomization to make the game less predictable — pick a random
  // action from the top-2 scored moves
  if (Math.random() < 0.15 && validActions.length > 1) {
    return validActions[Math.floor(Math.random() * Math.min(2, validActions.length))];
  }

  return result.action;
}
