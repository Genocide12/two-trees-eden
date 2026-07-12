'use client';

import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import { ACTIONS, ACTION_IDS_BY_SIDE, canAfford } from '@/lib/game/actions';
import type { ActionId } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { isPlayerTurn } from '@/lib/game/engine';
import { Sparkles, Skull } from 'lucide-react';

export default function ActionPanel() {
  const lang = useGame((s) => s.lang);
  const state = useGame((s) => s.state);
  const playerAct = useGame((s) => s.playerAct);
  const aiThinking = useGame((s) => s.aiThinking);

  const playerSide = state.playerSide;
  const actions = ACTION_IDS_BY_SIDE[playerSide];
  const isLight = playerSide === 'light';
  const myTurn = isPlayerTurn(state) && !aiThinking && state.phase === 'playing';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-serif">
          {tr('ui.actions', lang)}
        </p>
        {aiThinking && (
          <span className="text-[10px] text-muted-foreground/70 italic animate-pulse">
            {tr('ui.ai_thinking', lang)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((id: ActionId, i) => {
          const def = ACTIONS[id];
          const isMeditate = id === 'meditate';
          // Meditate is always affordable (no cost); other actions check resources
          const affordable = isMeditate ? true : canAfford(state.resources, def.cost);
          const enabled = myTurn && affordable;
          const costEntries = Object.entries(def.cost) as [keyof typeof def.cost, number][];

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={isMeditate ? 'col-span-2' : ''}
            >
              <Card
                className={`p-3 h-full transition-all duration-300 ${
                  enabled
                    ? isMeditate
                      ? 'border-foreground/30 hover:border-foreground/60 hover:bg-foreground/5 cursor-pointer'
                      : isLight
                      ? 'border-[#c9a85a]/40 hover:border-[#c9a85a] hover:bg-[#c9a85a]/5 cursor-pointer'
                      : 'border-[#8b2424]/40 hover:border-[#c45656] hover:bg-[#8b2424]/5 cursor-pointer'
                    : 'border-border/40 opacity-50'
                }`}
                onClick={() => enabled && playerAct(id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isMeditate ? (
                    <span className="text-base">🕉️</span>
                  ) : isLight ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#c9a85a]" />
                  ) : (
                    <Skull className="w-3.5 h-3.5 text-[#c45656]" />
                  )}
                  <p className={`text-sm font-serif ${
                    isMeditate
                      ? 'text-foreground/80'
                      : isLight
                      ? 'text-[#c9a85a]'
                      : 'text-[#c45656]'
                  }`}>
                    {tr(def.nameKey, lang)}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2 leading-snug">
                  {tr(def.descKey, lang)}
                </p>
                {!isMeditate && costEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {costEntries.map(([k, v]) => (
                      <span
                        key={k}
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${
                          affordable
                            ? 'border-border bg-muted/40 text-foreground/70'
                            : 'border-red-900/50 bg-red-950/30 text-red-400/80'
                        }`}
                      >
                        −{v} {tr(`res.${k}`, lang)}
                      </span>
                    ))}
                  </div>
                )}
                {isMeditate && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-foreground/20 bg-foreground/5 text-foreground/70">
                      +2 {isLight ? '☀️' : '🌑'}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/60 italic mt-2 leading-snug">
                  {tr(def.flavorKey, lang)}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {!myTurn && state.phase === 'playing' && (
        <p className="text-[11px] text-muted-foreground/60 text-center italic mt-1">
          {aiThinking ? tr('ui.ai_thinking', lang) : '…'}
        </p>
      )}
    </div>
  );
}
