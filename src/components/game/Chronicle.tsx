'use client';

import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Chronicle() {
  const lang = useGame((s) => s.lang);
  const log = useGame((s) => s.state.log);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="space-y-2 h-full flex flex-col">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-serif shrink-0">
        {tr('ui.log', lang)}
      </p>
      <ScrollArea className="flex-1 max-h-64 md:max-h-80 pr-3">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {log.map((entry) => {
              const isLight = entry.side === 'light';
              const isSystem = entry.actor === 'system';
              const isWorld = entry.actor === 'world';
              const icon = isWorld
                ? <Globe className="w-3 h-3 text-muted-foreground" />
                : isLight
                ? <Sun className="w-3 h-3 text-[#c9a85a]" />
                : <Moon className="w-3 h-3 text-[#c45656]" />;
              const prefix = isSystem
                ? entry.textKey.startsWith('log.side')
                  ? ''
                  : '· '
                : isWorld
                ? ''
                : '';
              // Translate epoch ids inside textParams (e.g. {epoch: 'antiquity'} → localized name)
              const translatedParams: Record<string, string | number> | undefined = entry.textParams
                ? Object.fromEntries(
                    Object.entries(entry.textParams).map(([k, v]) => [
                      k,
                      typeof v === 'string' && v.startsWith('epoch.')
                        ? tr(`epoch.${v.slice(6)}.name`, lang)
                        : v,
                    ]),
                  )
                : undefined;
              // Special case: log.epoch_advance passes raw epoch id, translate it
              if (entry.textParams?.epoch && typeof entry.textParams.epoch === 'string') {
                const ep = entry.textParams.epoch;
                if (!ep.startsWith('epoch.')) {
                  (translatedParams as Record<string, string>).epoch = tr(`epoch.${ep}.name`, lang);
                }
              }
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-2 text-xs leading-relaxed"
                >
                  <span className="mt-0.5 shrink-0">{icon}</span>
                  <p className="text-foreground/80">
                    <span className="text-muted-foreground/50 mr-1">
                      [{tr(`epoch.${entry.epoch}.name`, lang)} · {entry.turn}]
                    </span>
                    {prefix}{tr(entry.textKey, lang, translatedParams)}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
