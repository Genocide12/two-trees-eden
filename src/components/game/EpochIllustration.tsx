'use client';

import { motion } from 'framer-motion';
import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';

interface Props {
  epochId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function EpochIllustration({ epochId, size = 'md', className = '' }: Props) {
  const lang = useGame((s) => s.lang);
  const sizeClass = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-48 h-48 md:w-64 md:h-64' : 'w-24 h-24 md:w-32 md:h-32';

  return (
    <motion.div
      key={epochId}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`relative ${sizeClass} ${className} shrink-0`}
    >
      <div className="absolute inset-0 rounded-lg overflow-hidden border-2 border-[#c9a85a]/30 vignette">
        <img
          src={`/epochs/${epochId}.png`}
          alt={tr(`epoch.${epochId}.name`, lang)}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Hide if image not yet generated
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Gold frame glow */}
        <div className="absolute inset-0 pointer-events-none rounded-lg" style={{
          boxShadow: 'inset 0 0 20px rgba(201, 168, 90, 0.15)',
        }} />
      </div>
    </motion.div>
  );
}
