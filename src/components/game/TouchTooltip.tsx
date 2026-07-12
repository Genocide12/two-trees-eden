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
  /** How long the tooltip stays open after touch release (ms). */
  touchHoldMs?: number;
}

/**
 * Tooltip that works on both desktop (hover) and mobile (long-press).
 *
 * Implementation notes:
 * - We use a controlled Tooltip with our own `open` state.
 * - For desktop hover: Radix fires `onOpenChange` on pointerenter/leave,
 *   we honor it (only when no touch is active).
 * - For mobile touch: we attach NATIVE touchstart/touchend/touchmove
 *   listeners via useEffect + addEventListener (React's onTouchStart
 *   synthetic events don't always fire reliably on long-press).
 * - Long-press timer (default 400ms) opens the tooltip.
 * - On touchend, tooltip stays open for `touchHoldMs` (default 4000ms)
 *   so the user can read it.
 * - On touchmove (scrolling), we cancel the long-press.
 * - We also use CSS `touch-action: manipulation` to prevent double-tap zoom
 *   and `user-select: none` to prevent text selection on long-press.
 */
export default function TouchTooltip({
  children,
  content,
  side = 'top',
  className = '',
  longPressMs = 400,
  touchHoldMs = 5000,
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

  // Attach native touch listeners (more reliable than React's onTouchStart
  // for long-press scenarios).
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
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      // If tooltip opened by long-press, keep it open for reading
      // (will be closed by closeTimer or by tap elsewhere)
      closeTimer.current = setTimeout(() => {
        setOpen(false);
        touchActive.current = false;
      }, touchHoldMs);
    };

    const onTouchMove = () => {
      // User is scrolling — cancel long-press
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
  }, [longPressMs, touchHoldMs, clearAll]);

  // Cleanup on unmount
  useEffect(() => () => clearAll(), [clearAll]);

  return (
    <Tooltip
      open={open}
      onOpenChange={(v) => {
        // Ignore openChange from Radix while touch is active — we drive
        // open state ourselves for touch.
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
        className="max-w-[220px] text-xs leading-relaxed bg-card border-[#c9a85a]/30 pointer-events-none"
        // Avoid the tooltip closing on pointer leave (we manage state ourselves)
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
