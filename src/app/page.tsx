'use client';

import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import SideSelector from '@/components/game/SideSelector';
import EpochTimeline from '@/components/game/EpochTimeline';
import StatusBar from '@/components/game/StatusBar';
import ActionPanel from '@/components/game/ActionPanel';
import Chronicle from '@/components/game/Chronicle';
import EventPrompt from '@/components/game/EventPrompt';
import GameOver from '@/components/game/GameOver';
import VoicePicker from '@/components/game/VoicePicker';
import InstallButton from '@/components/game/InstallButton';
import EpochIllustration from '@/components/game/EpochIllustration';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Globe2, Info, Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Page() {
  const lang = useGame((s) => s.lang);
  const setLang = useGame((s) => s.setLang);
  const state = useGame((s) => s.state);
  const init = useGame((s) => s.init);
  const resetToSideSelect = useGame((s) => s.resetToSideSelect);
  const runAiIfNeeded = useGame((s) => s.runAiIfNeeded);
  const aiThinking = useGame((s) => s.aiThinking);
  const soundEnabled = useGame((s) => s.soundEnabled);
  const musicEnabled = useGame((s) => s.musicEnabled);
  const toggleSound = useGame((s) => s.toggleSound);
  const toggleMusic = useGame((s) => s.toggleMusic);
  const initAudio = useGame((s) => s.initAudio);
  const [howToOpen, setHowToOpen] = useState(false);

  // Initialize on mount — only if no persisted state exists.
  // The Zustand persist middleware rehydrates asynchronously, so we check
  // on mount: if phase is still 'side-select' from the initial createInitialState
  // call AND we haven't rehydrated yet, we leave it alone (persist will restore).
  // We only call init() as a fallback if no persisted state exists.
  useEffect(() => {
    // Check if persisted state exists in localStorage
    const persisted = typeof window !== 'undefined'
      ? localStorage.getItem('two-trees-eden')
      : null;
    if (!persisted) {
      init(lang);
    }
    // one-shot init fallback
  }, []);

  // Safety-net: whenever we're in 'playing' phase and it's not the player's
  // turn and AI isn't already thinking, kick the AI. This catches edge cases
  // where the explicit scheduleAiIfNeeded() calls in the store didn't fire
  // (e.g. event was resolved, language toggled, etc.).
  useEffect(() => {
    if (state.phase === 'playing' && !aiThinking) {
      // Only run if it's actually AI's turn (engine tracks this)
      const totalTurns = state.totalTurns;
      const isPlayerTurn = totalTurns % 2 === 1;
      if (!isPlayerTurn) {
        runAiIfNeeded();
      }
    }
  }, [state.phase, state.totalTurns, aiThinking, runAiIfNeeded]);

  // Side-select phase
  if (state.phase === 'side-select') {
    return (
      <main className="relative">
        <div className="absolute top-4 right-4 z-10 flex gap-1">
          <VoicePicker />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { initAudio(); toggleSound(); }}
            className="text-muted-foreground hover:text-[#c9a85a] h-8 w-8 p-0"
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { initAudio(); toggleMusic(); }}
            className="text-muted-foreground hover:text-[#c9a85a] h-8 w-8 p-0"
            aria-label="Toggle music"
          >
            {musicEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            className="text-muted-foreground hover:text-[#c9a85a] h-8"
          >
            <Globe2 className="w-4 h-4 mr-1" />
            {lang === 'ru' ? 'EN' : 'RU'}
          </Button>
        </div>
        <SideSelector />
      </main>
    );
  }

  // Game over phase — render the playing layout beneath the overlay
  // (so the user sees the final state of the world)
  const isLight = state.playerSide === 'light';
  const accent = isLight ? '#c9a85a' : '#c45656';

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 px-4 py-3 backdrop-blur-sm bg-background/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-mystic font-serif text-base md:text-lg truncate">
              {tr('app.title', lang)}
            </span>
            <span className="text-muted-foreground/40 hidden md:inline">·</span>
            <span className="text-muted-foreground text-xs hidden md:inline italic">
              {tr(`epoch.${state.epoch}.name`, lang)} — {tr(`epoch.${state.epoch}.desc`, lang)}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHowToOpen(true)}
              className="text-muted-foreground hover:text-[#c9a85a] h-8"
            >
              <Info className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline text-xs">{tr('ui.how_to_play', lang)}</span>
            </Button>
            <InstallButton />
            <VoicePicker />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { initAudio(); toggleSound(); }}
              className="text-muted-foreground hover:text-[#c9a85a] h-8 w-8 p-0"
              aria-label="Toggle sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { initAudio(); toggleMusic(); }}
              className="text-muted-foreground hover:text-[#c9a85a] h-8 w-8 p-0"
              aria-label="Toggle music"
            >
              {musicEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
              className="text-muted-foreground hover:text-[#c9a85a] h-8"
            >
              <Globe2 className="w-4 h-4" />
              <span className="text-xs ml-1">{lang === 'ru' ? 'EN' : 'RU'}</span>
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-3">
          <EpochTimeline />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 grid lg:grid-cols-[1fr_1.2fr_1fr] gap-4">
        {/* Left column — status */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="order-2 lg:order-1"
        >
          <Card className="p-4 h-full bg-card/60 backdrop-blur-sm">
            <StatusBar />
          </Card>
        </motion.div>

        {/* Middle column — actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="order-1 lg:order-2"
        >
          <Card className="p-4 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs uppercase tracking-widest font-serif ${isLight ? 'text-[#c9a85a]' : 'text-[#c45656]'}`}>
                {tr(`epoch.${state.epoch}.name`, lang)} · {tr('ui.turn', lang)} {state.turn}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToSideSelect}
                className="text-[10px] text-muted-foreground/60 hover:text-foreground h-7"
              >
                {tr('ui.change_side', lang)}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground italic mb-3 leading-snug">
              {tr(`epoch.${state.epoch}.desc`, lang)}
            </p>
            {/* Epoch illustration — centered, fades in on epoch change */}
            <div className="flex justify-center mb-3">
              <EpochIllustration epochId={state.epoch} size="md" />
            </div>
            <ActionPanel />
          </Card>
        </motion.div>

        {/* Right column — chronicle */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="order-3"
        >
          <Card className="p-4 h-full bg-card/60 backdrop-blur-sm">
            <Chronicle />
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 px-4 py-3 text-center mt-auto">
        <p className="text-[10px] text-muted-foreground/50 italic">
          {tr('ui.telegram_hint', lang)}
        </p>
      </footer>

      {/* Event modal */}
      <EventPrompt />

      {/* Game over overlay */}
      {state.phase === 'gameover' && <GameOver />}

      {/* How to play modal */}
      <Dialog open={howToOpen} onOpenChange={setHowToOpen}>
        <DialogContent className="bg-card border-[#c9a85a]/30">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#c9a85a] flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {tr('ui.how_to_play', lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
            <p>{tr('ui.how_to_play_body', lang)}</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground ml-2">
              <li className="flex gap-2"><span className="text-[#c9a85a]">·</span> {tr('side.light.name', lang)}: {tr('side.light.desc', lang)}</li>
              <li className="flex gap-2"><span className="text-[#c45656]">·</span> {tr('side.dark.name', lang)}: {tr('side.dark.desc', lang)}</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
