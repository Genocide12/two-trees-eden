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
  voiceRu: string | null;
  voiceEn: string | null;
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
  setVoice: (lang: Lang, voiceName: string) => void;
  /** Initialize audio — must be called from a user-gesture handler. */
  initAudio: () => void;
}

// AI delay increased to give TTS time to finish narrating the player's action.
// Without this, the AI's narration interrupts the player's narration.
const AI_DELAY_MS = 1800;

// Map ending IDs to SFX
function sfxForEnding(endingId: string) {
  if (endingId === 'saints') return 'gameover_light' as const;
  if (endingId === 'eternal_night') return 'gameover_dark' as const;
  return 'gameover_neutral' as const;
}

// Get the narrative text of the most recent log entry (for TTS)
function lastLogText(state: GameState, lang: Lang): string | null {
  if (state.log.length === 0) return null;
  const last = state.log[state.log.length - 1];
  // Skip system log entries that aren't action narratives
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
          // TTS: announce epoch transition
          const lang = get().lang;
          const epochName = tr(`epoch.${after.epoch}.name`, lang);
          const tmpl = lang === 'ru'
            ? `Эпоха сменяется. Грядёт: ${epochName}.`
            : `An epoch passes. Now comes: ${epochName}.`;
          tts.speak(tmpl, lang);
        }
      }

      function detectPhaseChange(before: GameState, after: GameState) {
        if (before.phase !== after.phase) {
          if (after.phase === 'event') {
            audio.playSfx('event');
            haptics.impact('heavy');
            // TTS: read the event prompt
            const lang = get().lang;
            if (after.pendingEvent) {
              const prompt = tr(after.pendingEvent.promptKey, lang);
              tts.speak(prompt, lang);
            }
          } else if (after.phase === 'gameover') {
            audio.playSfx(sfxForEnding(after.endingId ?? ''));
            haptics.notify('warning');
            audio.stopMusic();
            // TTS: speak ending title + text
            const lang = get().lang;
            if (after.endingId) {
              const e = ENDINGS_BY_ID[after.endingId];
              if (e) {
                const title = tr(e.titleKey, lang);
                const text = tr(e.textKey, lang);
                tts.speakSequence([title, text], lang, 400);
              }
            }
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

          // AI: haptic only, no SFX on button-press sounds.
          // But TTS speaks the AI's narrative so the player hears what adversary did.
          if (aiAction) {
            haptics.impact('light');
            const lang = get().lang;
            const narrText = lastLogText(afterAi, lang);
            if (narrText) {
              // Slightly lower pitch for the adversary's voice
              const prefix = tr(`ai.prefix.${before.aiSide}`, lang);
              tts.speak(prefix + narrText, lang, { pitch: 0.85, rate: 0.92 });
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
        voiceRu: null,
        voiceEn: null,
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
          tts.init();
          tts.setEnabled(get().soundEnabled);
          // Restore previously chosen voices (from persistence)
          const { voiceRu, voiceEn } = get();
          if (voiceRu) tts.setVoice('ru', voiceRu);
          if (voiceEn) tts.setVoice('en', voiceEn);
          const s = get().state;
          if (s.phase === 'playing' || s.phase === 'event') {
            audio.startMusic(s.playerSide);
          }
        },
        setVoice: (lang, voiceName) => {
          tts.init();
          tts.setVoice(lang, voiceName);
          if (lang === 'ru') set({ voiceRu: voiceName });
          else set({ voiceEn: voiceName });
        },
        toggleSound: () => {
          const v = !get().soundEnabled;
          set({ soundEnabled: v });
          audio.init();
          audio.setEnabled(v);
          tts.init();
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
          // Init TTS too — this is the first user gesture
          tts.init();
          tts.setEnabled(get().soundEnabled);
          const next = setSide(get().state, side);
          set({ state: next, lang: next.lang });
          audio.startMusic(side);
          // TTS: announce the chosen side
          const lang = get().lang;
          const sideName = tr(`side.${side}.name`, lang);
          const tmpl = lang === 'ru'
            ? `Ты избрал ${sideName}. Да свершится воля твоя.`
            : `You have chosen ${sideName}. Thy will be done.`;
          tts.speak(tmpl, lang);
        },
        playerAct: (actionId) => {
          const s = get().state;
          if (s.phase !== 'playing') return;
          if (!isPlayerTurn(s)) return;
          const before = s;
          const after = performPlayerAction(s, actionId);
          set({ state: after });

          // NO SFX for action button presses — haptics only (per user request).
          haptics.impact(actionId === 'meditate' ? 'soft' : 'medium');

          // TTS: speak the action's narrative description (the last log entry)
          const lang = get().lang;
          const narrText = lastLogText(after, lang);
          if (narrText) {
            tts.speak(narrText, lang);
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

          // TTS: speak the event's outcome text (the last log entry)
          const lang = get().lang;
          const outcomeText = lastLogText(after, lang);
          if (outcomeText) {
            tts.speak(outcomeText, lang);
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
        voiceRu: s.voiceRu,
        voiceEn: s.voiceEn,
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
