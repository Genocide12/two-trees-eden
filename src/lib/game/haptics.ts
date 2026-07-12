// Two Trees: Eden — Haptic feedback engine
// Combines Web Vibration API + Telegram WebApp HapticFeedback (when available).

'use client';

type Style = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotifType = 'error' | 'success' | 'warning';

// Telegram WebApp typings (subset)
interface TGWebApp {
  HapticFeedback?: {
    impactOccurred: (style: Style) => void;
    notificationOccurred: (type: NotifType) => void;
    selectionChanged: () => void;
  };
}

function getTG(): TGWebApp | null {
  if (typeof window === 'undefined') return null;
  const tg = (window as any).Telegram?.WebApp;
  return tg ?? null;
}

class Haptics {
  private _enabled = true;
  get enabled() { return this._enabled; }
  setEnabled(v: boolean) { this._enabled = v; }

  /** Light tap — selection changed, hover, light action. */
  tick() {
    if (!this._enabled) return;
    const tg = getTG();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  }

  /** Impact — action confirmation. */
  impact(style: Style = 'medium') {
    if (!this._enabled) return;
    const tg = getTG();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Map TG styles to vibration patterns
      const map: Record<Style, number> = {
        light: 10,
        medium: 20,
        heavy: 35,
        rigid: 30,
        soft: 15,
      };
      navigator.vibrate(map[style]);
    }
  }

  /** Notification — success/warning/error. */
  notify(type: NotifType) {
    if (!this._enabled) return;
    const tg = getTG();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred(type);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const map: Record<NotifType, number[]> = {
        success: [15, 30, 30],
        warning: [30, 30, 30],
        error: [60, 30, 60],
      };
      navigator.vibrate(map[type]);
    }
  }

  /** Long rumble — epoch advance, dramatic event. */
  rumble(ms = 80) {
    if (!this._enabled) return;
    const tg = getTG();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('heavy');
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }
}

export const haptics = new Haptics();
