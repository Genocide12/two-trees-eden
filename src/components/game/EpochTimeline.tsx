'use client';

import { useGame } from '@/lib/game/store';
import { tr, EPOCH_ORDER } from '@/lib/game/i18n';
import type { EpochId } from '@/lib/game/types';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function EpochTimeline() {
  const lang = useGame((s) => s.lang);
  const epoch = useGame((s) => s.state.epoch);
  const currentIdx = EPOCH_ORDER.indexOf(epoch);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center gap-1 min-w-max">
        {EPOCH_ORDER.map((eid, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          return (
            <div key={eid} className="flex items-center">
              <motion.div
                initial={false}
                animate={{ opacity: isFuture ? 0.35 : 1 }}
                className={`flex flex-col items-center px-3 py-1 rounded ${
                  isCurrent
                    ? 'bg-[#c9a85a]/10 border border-[#c9a85a]/40'
                    : isPast
                    ? 'border border-transparent'
                    : 'border border-transparent'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mb-1 ${
                    isCurrent
                      ? 'bg-[#c9a85a] animate-divine-pulse'
                      : isPast
                      ? 'bg-[#8b6c2a]'
                      : 'bg-muted-foreground/40'
                  }`}
                />
                <span
                  className={`text-[10px] md:text-xs whitespace-nowrap font-serif ${
                    isCurrent ? 'text-[#c9a85a]' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`}
                >
                  {tr(`epoch.${eid}.name`, lang)}
                </span>
              </motion.div>
              {i < EPOCH_ORDER.length - 1 && (
                <div
                  className={`w-4 md:w-6 h-px ${
                    i < currentIdx ? 'bg-[#8b6c2a]/60' : 'bg-muted-foreground/20'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
