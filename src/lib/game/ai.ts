// Two Trees: Eden — Adversary AI
import type { GameState, ActionId, Side } from './types';
import { ACTIONS, ACTION_IDS_BY_SIDE, canAfford, MEDITATE_GAIN } from './actions';

// AI picks an action that maximizes the score for its side.
// Heuristic: it prefers the action that, given current state, yields the largest
// expected swing in its dominant humanity metric (righteousness for Light, corruption for Dark),
// while staying affordable. If no action is affordable, it meditates to recover resources.
export function chooseAiAction(state: GameState): ActionId | null {
  const side: Side = state.aiSide;
  const ids = ACTION_IDS_BY_SIDE[side].filter((id) => id !== 'meditate');
  const candidates = ids.filter((id) => canAfford(state.resources, ACTIONS[id].cost));
  if (candidates.length === 0) {
    // No affordable action — meditate instead of passing
    return 'meditate';
  }

  const scored = candidates.map((id) => {
    const def = ACTIONS[id];
    const e = def.effects;
    let score = 0;
    if (side === 'light') {
      score += (e.righteousness ?? 0) * 1.2;
      score -= (e.corruption ?? 0) * 0.8;
      score += (e.population ?? 0) * 0.5;
      score += (e.knowledge ?? 0) * 0.3;
    } else {
      score += (e.corruption ?? 0) * 1.2;
      score -= (e.righteousness ?? 0) * 0.8;
      score += (e.knowledge ?? 0) * 0.4;
    }
    // Slight variety bonus
    score += Math.random() * 0.6;
    return { id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].id;
}
