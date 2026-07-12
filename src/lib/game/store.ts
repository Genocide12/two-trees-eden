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
  /** Manually trigger AI if it's the AI's turn — used as a safety net. */
  runAiIfNeeded: () => void;
}

const AI_DELAY_MS = 700;

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      // Internal helper: schedule the AI move after a delay if it's the AI's turn.
      function scheduleAiIfNeeded() {
        const s = get().state;
        if (s.phase !== 'playing') return;
        if (isPlayerTurn(s)) return; // player's turn, no AI needed
        if (get().aiThinking) return; // already scheduled

        set({ aiThinking: true });
        setTimeout(() => {
          const current = get().state;
          if (current.phase !== 'playing') {
            set({ aiThinking: false });
            return;
          }
          // Safety: if it's somehow player's turn now, bail out
          if (isPlayerTurn(current)) {
            set({ aiThinking: false });
            return;
          }
          const aiAction = chooseAiAction(current);
          const afterAi = performAiTurn(current, aiAction);
          set({ state: afterAi, aiThinking: false });
          // After AI acts, an event might trigger or epoch might advance.
          // If AI's action triggered an event that needs resolution, we stop
          // (player will resolve it). If phase is still 'playing' and it's
          // somehow STILL AI's turn (shouldn't happen, but just in case),
          // schedule again.
          if (afterAi.phase === 'playing' && !isPlayerTurn(afterAi)) {
            scheduleAiIfNeeded();
          }
        }, AI_DELAY_MS);
      }

      return {
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
          // Player goes first, so no AI scheduling needed
        },
        playerAct: (actionId) => {
          const s = get().state;
          if (s.phase !== 'playing') return;
          if (!isPlayerTurn(s)) return;
          const after = performPlayerAction(s, actionId);
          set({ state: after });
          // Whether the player's action triggered an event, advanced an epoch,
          // or just passed the turn to the AI — scheduleAiIfNeeded will handle it.
          // If phase is 'event', the AI will wait until the player resolves it
          // (resolvePendingEvent calls scheduleAiIfNeeded again).
          scheduleAiIfNeeded();
        },
        resolvePendingEvent: (optionId) => {
          const s = get().state;
          if (s.phase !== 'event' || !s.pendingEvent) return;
          const after = resolveEvent(s, optionId);
          set({ state: after });
          // After resolving the event, it might be the AI's turn (or the player's).
          // Schedule AI if needed.
          scheduleAiIfNeeded();
        },
        newGame: () => {
          const lang = get().lang;
          const fresh = createInitialState(lang);
          set({ state: fresh, aiThinking: false });
        },
        resetToSideSelect: () => {
          const lang = get().lang;
          const fresh = createInitialState(lang);
          set({ state: fresh, aiThinking: false });
        },
        runAiIfNeeded: () => {
          scheduleAiIfNeeded();
        },
      };
    },
    {
      name: 'two-trees-eden',
      // Persist the full game state so refresh doesn't lose progress.
      // The store rehydrates `state`, `lang`, and `aiThinking` (always false on load).
      partialize: (s) => ({
        state: s.state,
        lang: s.lang,
        // Don't persist aiThinking — always reset to false on rehydrate
      }),
      // On rehydrate, ensure aiThinking is false (in case it was true when saved)
      merge: (persisted, current) => {
        const p = (persisted as Partial<GameStore>) || {};
        return {
          ...current,
          ...p,
          aiThinking: false, // always reset on load
          state: p.state
            ? { ...p.state, phase: p.state.phase === 'event' ? 'playing' : p.state.phase, pendingEvent: null }
            : current.state,
        };
      },
    },
  ),
);
