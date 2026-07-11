// Two Trees: Eden — Random world events
import type { GameEvent } from './types';

export const EVENTS: GameEvent[] = [
  // ---------- Eden ----------
  {
    id: 'evt.eden.fruit',
    epoch: 'eden',
    promptKey: 'evt.eden.fruit.prompt',
    options: [
      {
        id: 'forbid',
        labelKey: 'evt.eden.fruit.opt.forbid',
        effects: { righteousness: 4, knowledge: -2 },
        resourceGain: { faith: 1 },
        outcomeKey: 'evt.eden.fruit.out.forbid',
      },
      {
        id: 'allow',
        labelKey: 'evt.eden.fruit.opt.allow',
        effects: { knowledge: 5, corruption: 3 },
        resourceGain: { doubt: 1 },
        outcomeKey: 'evt.eden.fruit.out.allow',
      },
    ],
  },
  {
    id: 'evt.eden.serpent',
    epoch: 'eden',
    promptKey: 'evt.eden.serpent.prompt',
    options: [
      {
        id: 'silence',
        labelKey: 'evt.eden.serpent.opt.silence',
        effects: { corruption: 2, righteousness: -2 },
        resourceGain: { temptation: 1 },
        outcomeKey: 'evt.eden.serpent.out.silence',
        forSide: 'light',
      },
      {
        id: 'speak',
        labelKey: 'evt.eden.serpent.opt.speak',
        effects: { corruption: 4, knowledge: 2 },
        resourceGain: { doubt: 1 },
        outcomeKey: 'evt.eden.serpent.out.speak',
        forSide: 'dark',
      },
    ],
  },
  // ---------- Antiquity ----------
  {
    id: 'evt.ant.tower',
    epoch: 'antiquity',
    promptKey: 'evt.ant.tower.prompt',
    options: [
      {
        id: 'scatter',
        labelKey: 'evt.ant.tower.opt.scatter',
        effects: { righteousness: 3, knowledge: -3 },
        resourceGain: { faith: 1 },
        outcomeKey: 'evt.ant.tower.out.scatter',
      },
      {
        id: 'watch',
        labelKey: 'evt.ant.tower.opt.watch',
        effects: { knowledge: 5, corruption: 2 },
        resourceGain: { doubt: 1 },
        outcomeKey: 'evt.ant.tower.out.watch',
      },
    ],
  },
  // ---------- Prophets ----------
  {
    id: 'evt.proph.stone',
    epoch: 'prophets',
    promptKey: 'evt.proph.stone.prompt',
    options: [
      {
        id: 'carve',
        labelKey: 'evt.proph.stone.opt.carve',
        effects: { righteousness: 6, knowledge: 3 },
        resourceGain: { faith: 2, grace: 1 },
        outcomeKey: 'evt.proph.stone.out.carve',
      },
      {
        id: 'break',
        labelKey: 'evt.proph.stone.opt.break',
        effects: { corruption: 5, righteousness: -3 },
        resourceGain: { wrath: 2 },
        outcomeKey: 'evt.proph.stone.out.break',
      },
    ],
  },
  // ---------- Empires ----------
  {
    id: 'evt.emp.king',
    epoch: 'empires',
    promptKey: 'evt.emp.king.prompt',
    options: [
      {
        id: 'anoint',
        labelKey: 'evt.emp.king.opt.anoint',
        effects: { population: 3, righteousness: 3, corruption: 2 },
        resourceGain: { faith: 1 },
        outcomeKey: 'evt.emp.king.out.anoint',
      },
      {
        id: 'usurp',
        labelKey: 'evt.emp.king.opt.usurp',
        effects: { corruption: 6, population: -2 },
        resourceGain: { wrath: 1, temptation: 1 },
        outcomeKey: 'evt.emp.king.out.usurp',
      },
    ],
  },
  // ---------- Schism ----------
  {
    id: 'evt.sch.split',
    epoch: 'schism',
    promptKey: 'evt.sch.split.prompt',
    options: [
      {
        id: 'unite',
        labelKey: 'evt.sch.split.opt.unite',
        effects: { righteousness: 4, knowledge: -2 },
        resourceGain: { mercy: 2 },
        outcomeKey: 'evt.sch.split.out.unite',
      },
      {
        id: 'divide',
        labelKey: 'evt.sch.split.opt.divide',
        effects: { corruption: 4, knowledge: 4 },
        resourceGain: { doubt: 2 },
        outcomeKey: 'evt.sch.split.out.divide',
      },
    ],
  },
  // ---------- Apocalypse ----------
  {
    id: 'evt.apoc.beast',
    epoch: 'apocalypse',
    promptKey: 'evt.apoc.beast.prompt',
    options: [
      {
        id: 'slay',
        labelKey: 'evt.apoc.beast.opt.slay',
        effects: { righteousness: 6, corruption: -3, population: -3 },
        resourceGain: { grace: 2, wrath: 1 },
        outcomeKey: 'evt.apoc.beast.out.slay',
      },
      {
        id: 'worship',
        labelKey: 'evt.apoc.beast.opt.worship',
        effects: { corruption: 8, population: -2 },
        resourceGain: { temptation: 2 },
        outcomeKey: 'evt.apoc.beast.out.worship',
      },
    ],
  },
];

// Append event texts to i18n by extending the registry at runtime
import { T } from './i18n';

T['evt.eden.fruit.prompt'] = {
  ru: 'Древо познания плодоносит. Народ смотрит на плод.',
  en: 'The Tree of Knowledge bears fruit. The people gaze upon it.',
};
T['evt.eden.fruit.opt.forbid'] = { ru: 'Запретить вкусить', en: 'Forbid the fruit' };
T['evt.eden.fruit.out.forbid'] = {
  ru: 'Народ послушался. Но в глазах его осталась тень вопроса.',
  en: 'The people obeyed. But the shadow of a question remained in their eyes.',
};
T['evt.eden.fruit.opt.allow'] = { ru: 'Позволь вкусить', en: 'Allow the fruit' };
T['evt.eden.fruit.out.allow'] = {
  ru: 'Знание вошло в кровь. Невинность ушла навсегда.',
  en: 'Knowledge entered the blood. Innocence departed forever.',
};
T['evt.eden.serpent.prompt'] = {
  ru: 'Змей у врат Эдема. Чьим голосом он заговорит?',
  en: 'A serpent at Eden\'s gate. Whose voice shall it speak with?',
};
T['evt.eden.serpent.opt.silence'] = { ru: 'Укротить его', en: 'Silence it' };
T['evt.eden.serpent.out.silence'] = {
  ru: 'Змей умолк. Но его тень осталась в траве.',
  en: 'The serpent fell silent. But its shadow stayed in the grass.',
};
T['evt.eden.serpent.opt.speak'] = { ru: 'Дать ему слово', en: 'Let it speak' };
T['evt.eden.serpent.out.speak'] = {
  ru: 'Змей сказал первое слово. Народ запомнил его на века.',
  en: 'The serpent spoke the first word. The people remembered it for ages.',
};
T['evt.ant.tower.prompt'] = {
  ru: 'Народ строит башню до неба. Гордость или жажда?',
  en: 'The people build a tower to the sky. Pride or thirst?',
};
T['evt.ant.tower.opt.scatter'] = { ru: 'Рассеять их', en: 'Scatter them' };
T['evt.ant.tower.out.scatter'] = {
  ru: 'Языки разделились. Башня осталась безымянной.',
  en: 'Tongues divided. The tower remained nameless.',
};
T['evt.ant.tower.opt.watch'] = { ru: 'Дать достроить', en: 'Let it rise' };
T['evt.ant.tower.out.watch'] = {
  ru: 'Башня достигла неба. И небо посмотрело вниз.',
  en: 'The tower reached the sky. And the sky looked down.',
};
T['evt.proph.stone.prompt'] = {
  ru: 'Пророк спустился с горы. В руках — каменные скрижали.',
  en: 'A prophet descended the mountain. In his hands — stone tablets.',
};
T['evt.proph.stone.opt.carve'] = { ru: 'Высечь закон', en: 'Carve the law' };
T['evt.proph.stone.out.carve'] = {
  ru: 'Слова легли в камень. Народ понёс их через пустыни.',
  en: 'Words settled into stone. The people carried them through deserts.',
};
T['evt.proph.stone.opt.break'] = { ru: 'Разбить скрижали', en: 'Break the tablets' };
T['evt.proph.stone.out.break'] = {
  ru: 'Камень рассыпался. В осколках — столько же законов, сколько рук.',
  en: 'Stone shattered. In the shards — as many laws as hands.',
};
T['evt.emp.king.prompt'] = {
  ru: 'Народ просит царя. «Дабы он судил нас, как прочие народы».',
  en: 'The people ask for a king. "That he may judge us, like other nations."',
};
T['evt.emp.king.opt.anoint'] = { ru: 'Помазать царя', en: 'Anoint a king' };
T['evt.emp.king.out.anoint'] = {
  ru: 'Царь сел на престол. Корона стала тяжелее, чем он думал.',
  en: 'The king took his throne. The crown was heavier than he imagined.',
};
T['evt.emp.king.opt.usurp'] = { ru: 'Посеять узурпатора', en: 'Raise a usurper' };
T['evt.emp.king.out.usurp'] = {
  ru: 'Узурпатор пришёл с тьмой в глазах. Трон окрасился кровью.',
  en: 'The usurper came with darkness in his eyes. The throne grew red.',
};
T['evt.sch.split.prompt'] = {
  ru: 'Единая вера раскололась надвое. Где истина?',
  en: 'The one faith has split in two. Where is truth?',
};
T['evt.sch.split.opt.unite'] = { ru: 'Свести их снова', en: 'Reunite them' };
T['evt.sch.split.out.unite'] = {
  ru: 'Они сошлись, но каждый нёс свою правду. Союза не вышло.',
  en: 'They met, but each carried his own truth. No union came.',
};
T['evt.sch.split.opt.divide'] = { ru: 'Углубить раскол', en: 'Deepen the rift' };
T['evt.sch.split.out.divide'] = {
  ru: 'Каждая сторона назвала другую ересью. Так родились догмы.',
  en: 'Each side named the other heresy. Thus dogmas were born.',
};
T['evt.apoc.beast.prompt'] = {
  ru: 'Из моря восстал зверь. Народ смотрит на него с трепетом.',
  en: 'A beast rose from the sea. The people gaze with trembling.',
};
T['evt.apoc.beast.opt.slay'] = { ru: 'Сразить его', en: 'Slay it' };
T['evt.apoc.beast.out.slay'] = {
  ru: 'Зверь пал. Но его тень осталась в каждом сердце.',
  en: 'The beast fell. But its shadow stayed in every heart.',
};
T['evt.apoc.beast.opt.worship'] = { ru: 'Поклониться ему', en: 'Worship it' };
T['evt.apoc.beast.out.worship'] = {
  ru: 'Народ преклонил колена. Зверь улыбнулся — впервые.',
  en: 'The people knelt. The beast smiled — for the first time.',
};

export function eventsForEpoch(epoch: string): GameEvent[] {
  return EVENTS.filter((e) => e.epoch === epoch);
}
