// Two Trees: Eden — Game Type Definitions

export type Side = 'light' | 'dark';

export type Lang = 'ru' | 'en';

export type EpochId =
  | 'eden'
  | 'antiquity'
  | 'prophets'
  | 'empires'
  | 'schism'
  | 'apocalypse'
  | 'judgment';

export type ActionId =
  // Light
  | 'miracle'
  | 'prophet'
  | 'heal'
  | 'covenant'
  // Dark
  | 'tempt'
  | 'heresy'
  | 'plague'
  | 'deceit';

export interface Resources {
  faith: number;       // Свет: Вера / Faith
  mercy: number;       // Свет: Милость / Mercy
  grace: number;       // Свет: Благодать / Grace
  doubt: number;       // Тьма: Сомнение / Doubt
  wrath: number;       // Тьма: Гнев / Wrath
  temptation: number;  // Тьма: Искушение / Temptation
}

export interface Humanity {
  population: number;      // 0-100  Население
  righteousness: number;   // 0-100  Праведность (Light)
  corruption: number;      // 0-100  Порочность (Dark)
  knowledge: number;       // 0-100  Знание
}

export interface LogEntry {
  id: string;
  epoch: EpochId;
  turn: number;
  actor: Side | 'world' | 'system';
  textKey: string;
  textParams?: Record<string, string | number>;
  side: Side;
}

export interface GameState {
  // Identity
  playerId: string;
  playerSide: Side;
  aiSide: Side;
  lang: Lang;
  // Progress
  epoch: EpochId;
  turn: number;            // 1..N per epoch
  totalTurns: number;
  // State
  resources: Resources;
  humanity: Humanity;
  log: LogEntry[];
  // Phase
  phase: 'side-select' | 'playing' | 'event' | 'gameover';
  pendingEvent?: GameEvent | null;
  endingId?: EndingId;
  createdAt: number;
  updatedAt: number;
}

export interface ActionDef {
  id: ActionId;
  side: Side;
  cost: Partial<Resources>;
  effects: Partial<Humanity>;
  descKey: string;
  nameKey: string;
  flavorKey: string;
}

export interface GameEvent {
  id: string;
  epoch: EpochId;
  promptKey: string;
  options: EventOption[];
}

export interface EventOption {
  id: string;
  labelKey: string;
  effects: Partial<Humanity>;
  resourceGain?: Partial<Resources>;
  outcomeKey: string;
  forSide?: Side; // optional: only show for a specific side
}

export type EndingId =
  | 'saints'         // Light total victory — Epoch of Saints
  | 'silence'        // Balance — Silence of God
  | 'eternal_night'  // Dark total victory — Eternal Night
  | 'great_stillness'; // Both exhausted — Great Stillness

export interface Ending {
  id: EndingId;
  titleKey: string;
  textKey: string;
  forSide?: Side; // which side "won" (undefined = neutral)
}
