'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  /** Delay in ms before tooltip opens on long-press (mobile). */
  longPressMs?: number;
  /** How long the tooltip stays open after touch release (ms).
   *  Default 150ms — closes almost immediately after finger lifts. */
  touchCloseMs?: number;
}

/**
 * Tooltip that works on both desktop (hover) and mobile (long-press).
 *
 * Mobile behavior:
 *   - touchstart → start long-press timer (400ms)
 *   - if timer fires → open tooltip
 *   - touchend → close tooltip almost immediately (touchCloseMs, default 150ms)
 *   - touchmove (scroll) → cancel long-press, close tooltip
 *
 * Tooltip uses Radix collision detection so it stays in viewport.
 */
export default function TouchTooltip({
  children,
  content,
  side = 'top',
  className = '',
  longPressMs = 400,
  touchCloseMs = 150,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchActive = useRef(false);

  const clearAll = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchActive.current = true;
      clearAll();
      // Prevent text selection / callout menu on iOS long-press
      e.preventDefault();
      longPressTimer.current = setTimeout(() => {
        setOpen(true);
      }, longPressMs);
    };

    const onTouchEnd = () => {
      // Cancel long-press timer if still running
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      // Close almost immediately (150ms) so user sees the tooltip flicker
      // but it doesn't linger after they lift their finger.
      closeTimer.current = setTimeout(() => {
        setOpen(false);
        touchActive.current = false;
      }, touchCloseMs);
    };

    const onTouchMove = () => {
      // User is scrolling — cancel long-press and close
      clearAll();
      setOpen(false);
      touchActive.current = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('touchcancel', onTouchMove);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchcancel', onTouchMove);
    };
  }, [longPressMs, touchCloseMs, clearAll]);

  useEffect(() => () => clearAll(), [clearAll]);

  return (
    <Tooltip
      open={open}
      onOpenChange={(v) => {
        if (touchActive.current) return;
        setOpen(v);
      }}
      delayDuration={150}
    >
      <TooltipTrigger asChild>
        <div
          ref={triggerRef}
          className={className}
          style={{
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation',
          }}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align="center"
        // collisionPadding keeps tooltip inside viewport on small screens
        collisionPadding={16}
        // Avoid the tooltip closing on pointer leave (we manage state ourselves)
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-w-[240px] text-xs leading-relaxed bg-card border-[#c9a85a]/40 shadow-lg pointer-events-none z-50"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
