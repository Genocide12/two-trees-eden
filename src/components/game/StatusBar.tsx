'use client';

import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import { motion } from 'framer-motion';
import {
  Users, Heart, Skull, BookOpen,
  Sun, HandHeart, Sparkles, HelpCircle, Flame, Candy, Info
} from 'lucide-react';
import TouchTooltip from './TouchTooltip';

function Bar({ value, label, desc, icon, color }: { value: number; label: string; desc: string; icon: React.ReactNode; color: string }) {
  return (
    <TouchTooltip
      side="right"
      className="cursor-help"
      content={
        <>
          <p className="font-serif text-[#c9a85a] mb-1">{label}</p>
          <p className="text-foreground/80">{desc}</p>
        </>
      }
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] md:text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className={color}>{icon}</span>
            <span>{label}</span>
          </div>
          <span className="text-foreground/80 tabular-nums">{value}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
            initial={false}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    </TouchTooltip>
  );
}

function ResourcePill({ value, label, desc, icon, color }: { value: number; label: string; desc: string; icon: React.ReactNode; color: string }) {
  return (
    <TouchTooltip
      side="top"
      className="cursor-help"
      content={
        <>
          <p className="font-serif text-[#c9a85a] mb-1">{label}</p>
          <p className="text-foreground/80">{desc}</p>
        </>
      }
    >
      <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-muted/40">
        <span className={`${color} shrink-0`}>{icon}</span>
        <div className="flex flex-col leading-tight">
          <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
          <span className="text-xs md:text-sm font-mono tabular-nums">{value}</span>
        </div>
      </div>
    </TouchTooltip>
  );
}

function SectionHeader({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <TouchTooltip
      side="right"
      className="inline-block cursor-help"
      content={<p className="text-foreground/80">{desc}</p>}
    >
      <p className={`text-xs uppercase tracking-widest font-serif ${color} inline-flex items-center gap-1`}>
        {title}
        <Info className="w-3 h-3 opacity-50" />
      </p>
    </TouchTooltip>
  );
}

export default function StatusBar() {
  const lang = useGame((s) => s.lang);
  const state = useGame((s) => s.state);
  const playerSide = state.playerSide;

  const isLight = playerSide === 'light';
  const playerColor = isLight ? 'text-[#c9a85a]' : 'text-[#c45656]';
  const enemyColor = isLight ? 'text-[#c45656]' : 'text-[#c9a85a]';

  return (
    <div className="space-y-4">
      {/* Humanity */}
      <div className="space-y-2">
        <SectionHeader
          title={tr('ui.humanity', lang)}
          desc={tr('ui.humanity.desc', lang)}
          color="text-muted-foreground"
        />
        <Bar value={state.humanity.population} label={tr('hum.population', lang)} desc={tr('hum.population.desc', lang)} icon={<Users className="w-3.5 h-3.5" />} color="text-foreground/70" />
        <Bar value={state.humanity.righteousness} label={tr('hum.righteousness', lang)} desc={tr('hum.righteousness.desc', lang)} icon={<Heart className="w-3.5 h-3.5" />} color="text-[#c9a85a]" />
        <Bar value={state.humanity.corruption} label={tr('hum.corruption', lang)} desc={tr('hum.corruption.desc', lang)} icon={<Skull className="w-3.5 h-3.5" />} color="text-[#c45656]" />
        <Bar value={state.humanity.knowledge} label={tr('hum.knowledge', lang)} desc={tr('hum.knowledge.desc', lang)} icon={<BookOpen className="w-3.5 h-3.5" />} color="text-foreground/60" />
      </div>

      {/* Player resources */}
      <div className="space-y-2">
        <SectionHeader
          title={`${tr('ui.your_side', lang)}: ${tr(`side.${playerSide}.name`, lang)}`}
          desc={tr('ui.your_side.desc', lang)}
          color={playerColor}
        />
        <div className="grid grid-cols-3 gap-1.5">
          {isLight ? (
            <>
              <ResourcePill value={state.resources.faith} label={tr('res.faith', lang)} desc={tr('res.faith.desc', lang)} icon={<Sun className="w-3.5 h-3.5" />} color="text-[#c9a85a]" />
              <ResourcePill value={state.resources.mercy} label={tr('res.mercy', lang)} desc={tr('res.mercy.desc', lang)} icon={<HandHeart className="w-3.5 h-3.5" />} color="text-[#c9a85a]" />
              <ResourcePill value={state.resources.grace} label={tr('res.grace', lang)} desc={tr('res.grace.desc', lang)} icon={<Sparkles className="w-3.5 h-3.5" />} color="text-[#c9a85a]" />
            </>
          ) : (
            <>
              <ResourcePill value={state.resources.doubt} label={tr('res.doubt', lang)} desc={tr('res.doubt.desc', lang)} icon={<HelpCircle className="w-3.5 h-3.5" />} color="text-[#c45656]" />
              <ResourcePill value={state.resources.wrath} label={tr('res.wrath', lang)} desc={tr('res.wrath.desc', lang)} icon={<Flame className="w-3.5 h-3.5" />} color="text-[#c45656]" />
              <ResourcePill value={state.resources.temptation} label={tr('res.temptation', lang)} desc={tr('res.temptation.desc', lang)} icon={<Candy className="w-3.5 h-3.5" />} color="text-[#c45656]" />
            </>
          )}
        </div>
      </div>

      {/* Enemy resources */}
      <div className="space-y-2 opacity-70">
        <SectionHeader
          title={`${tr('ui.enemy_side', lang)}: ${tr(`side.${state.aiSide}.name`, lang)}`}
          desc={tr('ui.enemy_side.desc', lang)}
          color={enemyColor}
        />
        <div className="grid grid-cols-3 gap-1.5">
          {state.aiSide === 'light' ? (
            <>
              <ResourcePill value={state.resources.faith} label={tr('res.faith', lang)} desc={tr('res.faith.desc', lang)} icon={<Sun className="w-3.5 h-3.5" />} color="text-[#c9a85a]" />
              <ResourcePill value={state.resources.mercy} label={tr('res.mercy', lang)} desc={tr('res.mercy.desc', lang)} icon={<HandHeart className="w-3.5 h-3.5" />} color="text-[#c9a85a]" />
              <ResourcePill value={state.resources.grace} label={tr('res.grace', lang)} desc={tr('res.grace.desc', lang)} icon={<Sparkles className="w-3.5 h-3.5" />} color="text-[#c9a85a]" />
            </>
          ) : (
            <>
              <ResourcePill value={state.resources.doubt} label={tr('res.doubt', lang)} desc={tr('res.doubt.desc', lang)} icon={<HelpCircle className="w-3.5 h-3.5" />} color="text-[#c45656]" />
              <ResourcePill value={state.resources.wrath} label={tr('res.wrath', lang)} desc={tr('res.wrath.desc', lang)} icon={<Flame className="w-3.5 h-3.5" />} color="text-[#c45656]" />
              <ResourcePill value={state.resources.temptation} label={tr('res.temptation', lang)} desc={tr('res.temptation.desc', lang)} icon={<Candy className="w-3.5 h-3.5" />} color="text-[#c45656]" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
