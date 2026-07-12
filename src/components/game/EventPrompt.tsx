'use client';

import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function EventPrompt() {
  const lang = useGame((s) => s.lang);
  const state = useGame((s) => s.state);
  const resolve = useGame((s) => s.resolvePendingEvent);
  const initAudio = useGame((s) => s.initAudio);

  if (state.phase !== 'event' || !state.pendingEvent) return null;
  const evt = state.pendingEvent;
  const opts = evt.options.filter((o) => !o.forSide || o.forSide === state.playerSide);

  const handleResolve = (id: string) => {
    initAudio();
    resolve(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <Card className="p-6 md:p-8 max-w-lg w-full border-2 border-[#c9a85a]/40 bg-gradient-to-b from-[#1a1408] to-[#0f0c17] animate-smoke-in">
        <p className="text-xs text-[#c9a85a] uppercase tracking-widest mb-3 font-serif">
          {tr('ui.event_prompt', lang)}
        </p>
        <h3 className="text-lg md:text-xl text-foreground font-serif leading-snug mb-6 italic">
          {tr(evt.promptKey, lang)}
        </h3>
        <div className="space-y-2">
          {opts.map((opt) => (
            <Button
              key={opt.id}
              onClick={() => handleResolve(opt.id)}
              variant="outline"
              className="w-full justify-start text-left border-border hover:border-[#c9a85a]/60 hover:bg-[#c9a85a]/5 py-3 h-auto"
            >
              <span className="text-sm">{tr(opt.labelKey, lang)}</span>
            </Button>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
