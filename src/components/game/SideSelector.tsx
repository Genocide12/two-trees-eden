'use client';

import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import type { Side } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SideSelector() {
  const lang = useGame((s) => s.lang);
  const chooseSide = useGame((s) => s.chooseSide);
  const initAudio = useGame((s) => s.initAudio);

  const handlePick = (side: Side) => {
    // First user gesture — init audio so background music can play
    initAudio();
    chooseSide(side);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-10"
      >
        <p className="text-mystic text-4xl md:text-6xl font-serif tracking-wide mb-3">
          {tr('app.title', lang)}
        </p>
        <p className="text-muted-foreground italic text-sm md:text-base mb-2">
          {tr('app.subtitle', lang)}
        </p>
        <p className="text-muted-foreground/70 text-xs md:text-sm max-w-md mx-auto">
          {tr('app.tagline', lang)}
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* LIGHT */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Card className="p-6 md:p-8 border-2 hover:border-[#c9a85a]/60 transition-all duration-500 group h-full flex flex-col bg-gradient-to-b from-[#1a1408] to-[#0f0c17]">
            <div className="flex items-center gap-3 mb-4">
              <Sun className="w-8 h-8 text-[#c9a85a] animate-flicker" />
              <h2 className="text-2xl font-serif text-[#c9a85a]">
                {tr('side.light.name', lang)}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
              {tr('side.light.desc', lang)}
            </p>
            <p className="italic text-[#c9a85a]/70 text-sm mb-6 border-l-2 border-[#c9a85a]/30 pl-4">
              {tr('side.light.quote', lang)}
            </p>
            <Button
              onClick={() => handlePick('light')}
              className="bg-[#c9a85a] hover:bg-[#d4ba6a] text-[#07060c] font-serif tracking-wide w-full"
            >
              {tr('side.choose', lang)}
            </Button>
          </Card>
        </motion.div>

        {/* DARK */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Card className="p-6 md:p-8 border-2 hover:border-[#8b2424]/60 transition-all duration-500 group h-full flex flex-col bg-gradient-to-b from-[#1a0a0a] to-[#0f0c17]">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-8 h-8 text-[#8b2424] animate-flicker" />
              <h2 className="text-2xl font-serif text-[#c45656]">
                {tr('side.dark.name', lang)}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
              {tr('side.dark.desc', lang)}
            </p>
            <p className="italic text-[#c45656]/70 text-sm mb-6 border-l-2 border-[#8b2424]/30 pl-4">
              {tr('side.dark.quote', lang)}
            </p>
            <Button
              onClick={() => handlePick('dark')}
              className="bg-[#8b2424] hover:bg-[#a33333] text-[#d6cbb8] font-serif tracking-wide w-full"
            >
              {tr('side.choose', lang)}
            </Button>
          </Card>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="text-muted-foreground/60 text-xs mt-10 text-center max-w-md italic"
      >
        {tr('side.subtitle', lang)}
      </motion.p>
    </div>
  );
}
