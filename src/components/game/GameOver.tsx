'use client';

import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import { getEndingText } from '@/lib/game/engine';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function GameOver() {
  const lang = useGame((s) => s.lang);
  const endingId = useGame((s) => s.state.endingId);
  const newGame = useGame((s) => s.newGame);

  if (!endingId) return null;
  const { title, text } = getEndingText(endingId, lang);

  const accent =
    endingId === 'saints'
      ? 'text-[#c9a85a]'
      : endingId === 'eternal_night'
      ? 'text-[#c45656]'
      : 'text-foreground/80';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
    >
      <Card className="p-8 md:p-12 max-w-xl w-full border-2 border-border bg-gradient-to-b from-[#0f0c17] to-[#07060c] animate-smoke-in text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-4">
          {tr('ui.game_over', lang)}
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className={`text-2xl md:text-3xl font-serif mb-6 ${accent}`}
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-foreground/80 text-sm md:text-base leading-relaxed italic mb-8"
        >
          {text}
        </motion.p>
        <Button
          onClick={newGame}
          className="bg-[#c9a85a] hover:bg-[#d4ba6a] text-[#07060c] font-serif tracking-wide"
        >
          {tr('ui.play_again', lang)}
        </Button>
      </Card>
    </motion.div>
  );
}
