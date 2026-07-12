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
import { audio } from './audio';
import { haptics } from './haptics';

interface GameStore {
  state: GameState;
  lang: Lang;
  aiThinking: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  init: (lang?: Lang) => void;
  setLang: (lang: Lang) => void;
  chooseSide: (side: Side) => void;
  playerAct: (actionId: ActionId) => void;
  resolvePendingEvent: (optionId: string) => void;
  newGame: () => void;
  resetToSideSelect: () => void;
  runAiIfNeeded: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  /** Initialize audio — must be called from a user-gesture handler. */
  initAudio: () => void;
}

const AI_DELAY_MS = 700;

// Map action IDs to SFX IDs (1:1 for our game)
function sfxForAction(actionId: ActionId, side: Side) {
  // Common action
  if (actionId === 'meditate') return 'meditate' as const;
  // Side-specific
  return actionId as 'miracle' | 'prophet' | 'heal' | 'covenant' | 'tempt' | 'heresy' | 'plague' | 'deceit';
}

// Map ending IDs to SFX
function sfxForEnding(endingId: string, playerSide: Side) {
  if (endingId === 'saints') return 'gameover_light' as const;
  if (endingId === 'eternal_night') return 'gameover_dark' as const;
  return 'gameover_neutral' as const;
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      function detectEpochAdvance(before: GameState, after: GameState) {
        if (before.epoch !== after.epoch) {
          audio.playSfx('epoch_advance');
          haptics.rumble(120);
          // Switch music tempo/feel — though we keep the same side's pad
          audio.switchMusic(after.playerSide);
        }
      }

      function detectPhaseChange(before: GameState, after: GameState) {
        if (before.phase !== after.phase) {
          if (after.phase === 'event') {
            audio.playSfx('event');
            haptics.impact('heavy');
          } else if (after.phase === 'gameover') {
            audio.playSfx(sfxForEnding(after.endingId ?? '', after.playerSide));
            haptics.notify('warning');
            audio.stopMusic();
          }
        }
      }

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
          if (isPlayerTurn(current)) {
            set({ aiThinking: false });
            return;
          }
          const aiAction = chooseAiAction(current);
          const before = current;
          const afterAi = performAiTurn(current, aiAction);
          set({ state: afterAi, aiThinking: false });

          // AI sound feedback (lighter than player's)
          if (aiAction) {
            audio.playSfx(sfxForAction(aiAction, before.aiSide));
            haptics.impact('light');
          }

          detectEpochAdvance(before, afterAi);
          detectPhaseChange(before, afterAi);

          if (afterAi.phase === 'playing' && !isPlayerTurn(afterAi)) {
            scheduleAiIfNeeded();
          }
        }, AI_DELAY_MS);
      }

      return {
        state: createInitialState('ru'),
        lang: 'ru',
        aiThinking: false,
        soundEnabled: true,
        musicEnabled: true,
        init: (lang = 'ru') => {
          set({ state: createInitialState(lang), lang, aiThinking: false });
        },
        setLang: (lang) => {
          set({ lang, state: { ...get().state, lang } });
        },
        initAudio: () => {
          audio.init();
          audio.setEnabled(get().soundEnabled);
          audio.setMusicEnabled(get().musicEnabled);
          // If we're already in a game, start the music for the current side
          const s = get().state;
          if (s.phase === 'playing' || s.phase === 'event') {
            audio.startMusic(s.playerSide);
          }
        },
        toggleSound: () => {
          const v = !get().soundEnabled;
          set({ soundEnabled: v });
          audio.init();
          audio.setEnabled(v);
          if (v) {
            haptics.tick();
          }
        },
        toggleMusic: () => {
          const v = !get().musicEnabled;
          set({ musicEnabled: v });
          audio.init();
          audio.setMusicEnabled(v);
          if (v) {
            const s = get().state;
            if (s.phase === 'playing' || s.phase === 'event') {
              audio.startMusic(s.playerSide);
            }
          }
        },
        chooseSide: (side) => {
          audio.init();
          audio.playSfx('side_pick');
          haptics.impact('medium');
          const next = setSide(get().state, side);
          set({ state: next, lang: next.lang });
          // Start background music for the chosen side
          audio.startMusic(side);
        },
        playerAct: (actionId) => {
          const s = get().state;
          if (s.phase !== 'playing') return;
          if (!isPlayerTurn(s)) return;
          const before = s;
          const after = performPlayerAction(s, actionId);
          set({ state: after });

          // Player action sound + haptics
          audio.playSfx(sfxForAction(actionId, before.playerSide));
          haptics.impact(actionId === 'meditate' ? 'soft' : 'medium');

          detectEpochAdvance(before, after);
          detectPhaseChange(before, after);

          scheduleAiIfNeeded();
        },
        resolvePendingEvent: (optionId) => {
          const s = get().state;
          if (s.phase !== 'event' || !s.pendingEvent) return;
          const before = s;
          const after = resolveEvent(s, optionId);
          set({ state: after });
          haptics.impact('light');
          scheduleAiIfNeeded();
        },
        newGame: () => {
          const lang = get().lang;
          const fresh = createInitialState(lang);
          audio.stopMusic();
          set({ state: fresh, aiThinking: false });
        },
        resetToSideSelect: () => {
          const lang = get().lang;
          const fresh = createInitialState(lang);
          audio.stopMusic();
          set({ state: fresh, aiThinking: false });
        },
        runAiIfNeeded: () => {
          scheduleAiIfNeeded();
        },
      };
    },
    {
      name: 'two-trees-eden',
      partialize: (s) => ({
        state: s.state,
        lang: s.lang,
        soundEnabled: s.soundEnabled,
        musicEnabled: s.musicEnabled,
      }),
      merge: (persisted, current) => {
        const p = (persisted as Partial<GameStore>) || {};
        return {
          ...current,
          ...p,
          aiThinking: false,
          state: p.state
            ? { ...p.state, phase: p.state.phase === 'event' ? 'playing' : p.state.phase, pendingEvent: null }
            : current.state,
        };
      },
    },
  ),
);
