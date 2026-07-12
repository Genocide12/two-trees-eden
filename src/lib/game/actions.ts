// Two Trees: Eden — Action definitions
import type { ActionDef, ActionId } from './types';

export const ACTIONS: Record<ActionId, ActionDef> = {
  // ---------- Light ----------
  miracle: {
    id: 'miracle',
    side: 'light',
    cost: { faith: 2, grace: 1 },
    effects: { righteousness: 8, corruption: -4, population: 2 },
    nameKey: 'act.miracle.name',
    descKey: 'act.miracle.desc',
    flavorKey: 'act.miracle.flavor',
  },
  prophet: {
    id: 'prophet',
    side: 'light',
    cost: { faith: 1, mercy: 2 },
    effects: { righteousness: 6, knowledge: 3, corruption: -2 },
    nameKey: 'act.prophet.name',
    descKey: 'act.prophet.desc',
    flavorKey: 'act.prophet.flavor',
  },
  heal: {
    id: 'heal',
    side: 'light',
    cost: { mercy: 2, grace: 1 },
    effects: { population: 6, righteousness: 3 },
    nameKey: 'act.heal.name',
    descKey: 'act.heal.desc',
    flavorKey: 'act.heal.flavor',
  },
  covenant: {
    id: 'covenant',
    side: 'light',
    cost: { faith: 2, mercy: 2, grace: 2 },
    effects: { righteousness: 10, knowledge: 4, population: 2, corruption: -6 },
    nameKey: 'act.covenant.name',
    descKey: 'act.covenant.desc',
    flavorKey: 'act.covenant.flavor',
  },
  // ---------- Dark ----------
  tempt: {
    id: 'tempt',
    side: 'dark',
    cost: { temptation: 2, doubt: 1 },
    effects: { corruption: 7, righteousness: -4 },
    nameKey: 'act.tempt.name',
    descKey: 'act.tempt.desc',
    flavorKey: 'act.tempt.flavor',
  },
  heresy: {
    id: 'heresy',
    side: 'dark',
    cost: { doubt: 2, temptation: 1 },
    effects: { corruption: 6, knowledge: 4, righteousness: -3 },
    nameKey: 'act.heresy.name',
    descKey: 'act.heresy.desc',
    flavorKey: 'act.heresy.flavor',
  },
  plague: {
    id: 'plague',
    side: 'dark',
    cost: { wrath: 2, doubt: 1 },
    effects: { population: -8, corruption: 5, righteousness: -2 },
    nameKey: 'act.plague.name',
    descKey: 'act.plague.desc',
    flavorKey: 'act.plague.flavor',
  },
  deceit: {
    id: 'deceit',
    side: 'dark',
    cost: { temptation: 2, wrath: 1, doubt: 1 },
    effects: { corruption: 9, knowledge: -2, righteousness: -5, population: -2 },
    nameKey: 'act.deceit.name',
    descKey: 'act.deceit.desc',
    flavorKey: 'act.deceit.flavor',
  },
  meditate: {
    id: 'meditate',
    // side is set dynamically — see getMeditateAction(side)
    side: 'light',
    cost: {},
    effects: {},
    nameKey: 'act.meditate.name',
    descKey: 'act.meditate.desc',
    flavorKey: 'act.meditate.flavor',
  },
};

export const ACTION_IDS_BY_SIDE: Record<'light' | 'dark', ActionId[]> = {
  light: ['miracle', 'prophet', 'heal', 'covenant', 'meditate'],
  dark: ['tempt', 'heresy', 'plague', 'deceit', 'meditate'],
};

// Resources recovered by meditating, per side
export const MEDITATE_GAIN: Record<'light' | 'dark', Partial<Record<keyof import('./types').Resources, number>>> = {
  light: { faith: 2, mercy: 2, grace: 2 },
  dark: { doubt: 2, wrath: 2, temptation: 2 },
};

export function canAfford(
  resources: { faith: number; mercy: number; grace: number; doubt: number; wrath: number; temptation: number },
  cost: Partial<typeof resources>,
): boolean {
  for (const [k, v] of Object.entries(cost)) {
    if ((resources[k as keyof typeof resources] ?? 0) < (v ?? 0)) return false;
  }
  return true;
}
