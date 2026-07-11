// Two Trees: Eden — Client state store (Zustand)
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Side, ActionId, Lang } from '@/lib/game/types';
import {
  createInitialState,
  setSide,
  performPlayerAction,
  performAiTurn,
  resolveEvent,
  isPlayerTurn,
} from '@/lib/game/engine';
import { chooseAiAction } from '@/lib/game/ai';

interface GameStore {
  state: GameState;
  lang: Lang;
  aiThinking: boolean;
  init: (lang?: Lang) => void;
  setLang: (lang: Lang) => void;
  chooseSide: (side: Side) => void;
  playerAct: (actionId: ActionId) => void;
  resolvePendingEvent: (optionId: string) => void;
  newGame: () => void;
  resetToSideSelect: () => void;
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      state: createInitialState('ru'),
      lang: 'ru',
      aiThinking: false,
      init: (lang = 'ru') => {
        set({ state: createInitialState(lang), lang, aiThinking: false });
      },
      setLang: (lang) => {
        set({ lang, state: { ...get().state, lang } });
      },
      chooseSide: (side) => {
        const next = setSide(get().state, side);
        set({ state: next, lang: next.lang });
      },
      playerAct: (actionId) => {
        const s = get().state;
        if (s.phase !== 'playing') return;
        if (!isPlayerTurn(s)) return;
        const after = performPlayerAction(s, actionId);
        set({ state: after });
        // If now AI's turn and game still in playing phase, schedule AI move
        if (after.phase === 'playing' && !isPlayerTurn(after)) {
          set({ aiThinking: true });
          // Use timeout so UI updates first
          setTimeout(() => {
            const current = get().state;
            if (current.phase !== 'playing') {
              set({ aiThinking: false });
              return;
            }
            const aiAction = chooseAiAction(current);
            const afterAi = performAiTurn(current, aiAction);
            set({ state: afterAi, aiThinking: false });
          }, 700);
        }
      },
      resolvePendingEvent: (optionId) => {
        const after = resolveEvent(get().state, optionId);
        set({ state: after });
      },
      newGame: () => {
        const lang = get().lang;
        const fresh = createInitialState(lang);
        // Keep side selection phase but reset everything else
        set({ state: fresh, aiThinking: false });
      },
      resetToSideSelect: () => {
        const lang = get().lang;
        const fresh = createInitialState(lang);
        set({ state: fresh, aiThinking: false });
      },
    }),
    {
      name: 'two-trees-eden',
      // Only persist lang, not full game state (game can be reset on reload)
      partialize: (s) => ({ lang: s.lang }),
    },
  ),
);
