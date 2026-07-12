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
import { tts } from './tts';
import { tr } from './i18n';
import { ENDINGS_BY_ID } from './i18n';

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

// AI delay increased to give TTS time to finish narrating the player's action.
const AI_DELAY_MS = 1800;

function sfxForEnding(endingId: string) {
  if (endingId === 'saints') return 'gameover_light' as const;
  if (endingId === 'eternal_night') return 'gameover_dark' as const;
  return 'gameover_neutral' as const;
}

function lastLogText(state: GameState, lang: Lang): string | null {
  if (state.log.length === 0) return null;
  const last = state.log[state.log.length - 1];
  if (last.textKey === 'log.epoch_advance') return null;
  if (last.textKey === 'log.ai_pass') return null;
  if (last.textKey.startsWith('log.side.')) return null;
  if (last.textKey.startsWith('end.')) return null;
  return tr(last.textKey, lang, last.textParams);
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      function detectEpochAdvance(before: GameState, after: GameState) {
        if (before.epoch !== after.epoch) {
          audio.playSfx('epoch_advance');
          haptics.rumble(120);
          audio.switchMusic(after.playerSide);
          // Epoch transition — spoken by player's side voice
          const lang = get().lang;
          const epochName = tr(`epoch.${after.epoch}.name`, lang);
          const tmpl = lang === 'ru'
            ? `Эпоха сменяется. Грядёт: ${epochName}.`
            : `An epoch passes. Now comes: ${epochName}.`;
          tts.speak(tmpl, lang, { side: after.playerSide });
        }
      }

      function detectPhaseChange(before: GameState, after: GameState) {
        if (before.phase !== after.phase) {
          if (after.phase === 'event') {
            audio.playSfx('event');
            haptics.impact('heavy');
            // Event prompt — spoken by player's side voice
            const lang = get().lang;
            if (after.pendingEvent) {
              const prompt = tr(after.pendingEvent.promptKey, lang);
              tts.speak(prompt, lang, { side: after.playerSide });
            }
          } else if (after.phase === 'gameover') {
            audio.playSfx(sfxForEnding(after.endingId ?? ''));
            haptics.notify('warning');
            audio.stopMusic();
            // Game over — voice depends on ending side
            const lang = get().lang;
            if (after.endingId) {
              const e = ENDINGS_BY_ID[after.endingId];
              if (e) {
                const title = tr(e.titleKey, lang);
                const text = tr(e.textKey, lang);
                // saints → light (Svetlana), eternal_night → dark (Dmitry),
                // others → player's side
                const endingSide: Side =
                  after.endingId === 'saints' ? 'light' :
                  after.endingId === 'eternal_night' ? 'dark' :
                  after.playerSide;
                tts.speakSequence([title, text], lang, endingSide, 400);
              }
            }
          }
        }
      }

      function scheduleAiIfNeeded() {
        const s = get().state;
        if (s.phase !== 'playing') return;
        if (isPlayerTurn(s)) return;
        if (get().aiThinking) return;

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

          // AI narration — spoken by AI's side voice
          if (aiAction) {
            haptics.impact('light');
            const lang = get().lang;
            const narrText = lastLogText(afterAi, lang);
            if (narrText) {
              const prefix = tr(`ai.prefix.${before.aiSide}`, lang);
              tts.speak(prefix + narrText, lang, { side: before.aiSide, rate: 0.92 });
            }
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
          tts.setEnabled(get().soundEnabled);
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
          tts.setEnabled(v);
          if (!v) tts.stop();
          if (v) haptics.tick();
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
          tts.setEnabled(get().soundEnabled);
          const next = setSide(get().state, side);
          set({ state: next, lang: next.lang });
          audio.startMusic(side);
          // Announce chosen side with that side's voice
          const lang = get().lang;
          const sideName = tr(`side.${side}.name`, lang);
          const tmpl = lang === 'ru'
            ? `Ты избрал ${sideName}. Да свершится воля твоя.`
            : `You have chosen ${sideName}. Thy will be done.`;
          tts.speak(tmpl, lang, { side });
        },
        playerAct: (actionId) => {
          const s = get().state;
          if (s.phase !== 'playing') return;
          if (!isPlayerTurn(s)) return;
          const before = s;
          const after = performPlayerAction(s, actionId);
          set({ state: after });

          haptics.impact(actionId === 'meditate' ? 'soft' : 'medium');

          // Player narration — spoken by player's side voice
          const lang = get().lang;
          const narrText = lastLogText(after, lang);
          if (narrText) {
            tts.speak(narrText, lang, { side: before.playerSide });
          }

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

          // Event outcome — spoken by player's side voice
          const lang = get().lang;
          const outcomeText = lastLogText(after, lang);
          if (outcomeText) {
            tts.speak(outcomeText, lang, { side: before.playerSide });
          }

          scheduleAiIfNeeded();
        },
        newGame: () => {
          const lang = get().lang;
          const fresh = createInitialState(lang);
          audio.stopMusic();
          tts.stop();
          set({ state: fresh, aiThinking: false });
        },
        resetToSideSelect: () => {
          const lang = get().lang;
          const fresh = createInitialState(lang);
          audio.stopMusic();
          tts.stop();
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
