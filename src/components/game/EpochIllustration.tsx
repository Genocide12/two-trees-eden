'use client';

import { motion } from 'framer-motion';
import { useGame } from '@/lib/game/store';
import { tr } from '@/lib/game/i18n';
import { useState } from 'react';

interface Props {
  epochId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function EpochIllustration({ epochId, size = 'md', className = '' }: Props) {
  const lang = useGame((s) => s.lang);
  const [imgOk, setImgOk] = useState(true);
  const sizeClass = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-48 h-48 md:w-64 md:h-64' : 'w-24 h-24 md:w-32 md:h-32';

  // Fallback to Eden illustration if specific epoch image not yet generated
  const imgSrc = imgOk ? `/epochs/${epochId}.png` : `/epochs/eden.png`;

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
          src={imgSrc}
          alt={tr(`epoch.${epochId}.name`, lang)}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgOk(false)}
        />
        <div className="absolute inset-0 pointer-events-none rounded-lg" style={{
          boxShadow: 'inset 0 0 20px rgba(201, 168, 90, 0.15)',
        }} />
      </div>
      {/* Subtle epoch name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 rounded-b-lg pointer-events-none">
        <p className="text-[9px] md:text-[10px] text-[#c9a85a] text-center font-serif tracking-widest uppercase truncate">
          {tr(`epoch.${epochId}.name`, lang)}
        </p>
      </div>
    </motion.div>
  );
}

