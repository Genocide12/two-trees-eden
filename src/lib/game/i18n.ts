// Two Trees: Eden — Stoic bilingual text registry
import type { Lang, Side, EpochId, EndingId } from './types';

type Dict = Record<string, { ru: string; en: string }>;

export const T: Dict = {
  // ---- Meta ----
  'app.title': {
    ru: 'Два древа: Эдем',
    en: 'Two Trees: Eden',
  },
  'app.subtitle': {
    ru: 'Бог и Зло. Воля и судьба. Семь эпох.',
    en: 'God and Evil. Will and fate. Seven epochs.',
  },
  'app.tagline': {
    ru: 'Творец не торопится. Время — лишь тень вечности.',
    en: 'The Creator is unhurried. Time is but the shadow of eternity.',
  },

  // ---- Side select ----
  'side.title': {
    ru: 'Выбери сторону',
    en: 'Choose your side',
  },
  'side.subtitle': {
    ru: 'Каждая сторона — лишь инструмент провидения. Итог не предрешён.',
    en: 'Each side is but an instrument of providence. The outcome is unwritten.',
  },
  'side.light.name': { ru: 'Свет', en: 'Light' },
  'side.dark.name': { ru: 'Тьма', en: 'Darkness' },
  'side.light.desc': {
    ru: 'Бог-творец. Действуешь через чудеса, пророков и заветы. Сила — в вере, милости и благодати.',
    en: 'God the Creator. You act through miracles, prophets and covenants. Your strength is faith, mercy and grace.',
  },
  'side.dark.desc': {
    ru: 'Падший дух. Действуешь через искушения, ереси и ложь. Сила — в сомнении, гневе и искусительности.',
    en: 'The Fallen Spirit. You act through temptation, heresy and deceit. Your strength is doubt, wrath and temptation.',
  },
  'side.choose': { ru: 'Избрать', en: 'Embrace' },
  'side.light.quote': {
    ru: '«Да будет свет.»',
    en: '"Let there be light."',
  },
  'side.dark.quote': {
    ru: '«Не всё, что падает, разбивается.»',
    en: '"Not all that falls is broken."',
  },

  // ---- Epochs ----
  'epoch.eden.name': { ru: 'Эдем', en: 'Eden' },
  'epoch.eden.desc': {
    ru: 'Невинность, ещё не познавшая выбора.',
    en: 'Innocence that has not yet learned choice.',
  },
  'epoch.antiquity.name': { ru: 'Древность', en: 'Antiquity' },
  'epoch.antiquity.desc': {
    ru: 'Первые города, первые жертвенники, первые сомнения.',
    en: 'The first cities, the first altars, the first doubts.',
  },
  'epoch.prophets.name': { ru: 'Пророки', en: 'Prophets' },
  'epoch.prophets.desc': {
    ru: 'Голос свыше рассекает тишину. Слова становятся законами.',
    en: 'A voice from above cleaves the silence. Words become laws.',
  },
  'epoch.empires.name': { ru: 'Империи', en: 'Empires' },
  'epoch.empires.desc': {
    ru: 'Власть собирается в кулак. Кто владеет ею — владеет толпой.',
    en: 'Power gathers into a fist. Who holds it, holds the crowd.',
  },
  'epoch.schism.name': { ru: 'Раскол', en: 'Schism' },
  'epoch.schism.desc': {
    ru: 'Единое раскалывается надвое. Истина дробится на догмы.',
    en: 'The one splits in two. Truth shatters into dogmas.',
  },
  'epoch.apocalypse.name': { ru: 'Апокалипсис', en: 'Apocalypse' },
  'epoch.apocalypse.desc': {
    ru: 'Небо медленно гаснет. Каждый шаг теперь — последний.',
    en: 'The sky slowly dims. Each step now is the last.',
  },
  'epoch.judgment.name': { ru: 'Суд', en: 'Judgment' },
  'epoch.judgment.desc': {
    ru: 'Чаша весов опускается. Молчание становится приговором.',
    en: 'The scales descend. Silence becomes the verdict.',
  },

  // ---- Resources ----
  'res.faith': { ru: 'Вера', en: 'Faith' },
  'res.mercy': { ru: 'Милость', en: 'Mercy' },
  'res.grace': { ru: 'Благодать', en: 'Grace' },
  'res.doubt': { ru: 'Сомнение', en: 'Doubt' },
  'res.wrath': { ru: 'Гнев', en: 'Wrath' },
  'res.temptation': { ru: 'Искушение', en: 'Temptation' },

  // ---- Humanity ----
  'hum.population': { ru: 'Население', en: 'Population' },
  'hum.righteousness': { ru: 'Праведность', en: 'Righteousness' },
  'hum.corruption': { ru: 'Порочность', en: 'Corruption' },
  'hum.knowledge': { ru: 'Знание', en: 'Knowledge' },

  // ---- Actions: Light ----
  'act.miracle.name': { ru: 'Чудо', en: 'Miracle' },
  'act.miracle.desc': {
    ru: 'Явить знамение, чтобы народ вспомнил о Творце.',
    en: 'Show a sign, so the people remember their Maker.',
  },
  'act.miracle.flavor': {
    ru: 'Чудо не убеждает — оно лишь будит спящее сердце.',
    en: 'A miracle does not convince — it only wakes a sleeping heart.',
  },
  'act.prophet.name': { ru: 'Пророк', en: 'Prophet' },
  'act.prophet.desc': {
    ru: 'Послать голос, говорящий истину среди молчания.',
    en: 'Send a voice speaking truth through the silence.',
  },
  'act.prophet.flavor': {
    ru: 'Пророка редко слышат при жизни. Его слушают потом.',
    en: 'A prophet is rarely heard in his life. He is heard after.',
  },
  'act.heal.name': { ru: 'Исцеление', en: 'Heal' },
  'act.heal.desc': {
    ru: 'Утолить боль, вернуть надежду слабым.',
    en: 'Ease pain, return hope to the weak.',
  },
  'act.heal.flavor': {
    ru: 'Тело исцеляется быстро. Душа — медленнее.',
    en: 'The body heals quickly. The soul — slower.',
  },
  'act.covenant.name': { ru: 'Завет', en: 'Covenant' },
  'act.covenant.desc': {
    ru: 'Связать судьбу народа обетом, который переживёт века.',
    en: 'Bind the fate of the people with a vow that outlasts ages.',
  },
  'act.covenant.flavor': {
    ru: 'Завет держится не страхом, а памятью.',
    en: 'A covenant is held not by fear, but by memory.',
  },

  // ---- Actions: Dark ----
  'act.tempt.name': { ru: 'Искушение', en: 'Tempt' },
  'act.tempt.desc': {
    ru: 'Прошептать желание, которое сильнее воли.',
    en: 'Whisper a desire stronger than will.',
  },
  'act.tempt.flavor': {
    ru: 'Искуситель не лжёт. Он лишь показывает, чего ты хочешь.',
    en: 'The tempter does not lie. He merely shows what you want.',
  },
  'act.heresy.name': { ru: 'Ересь', en: 'Heresy' },
  'act.heresy.desc': {
    ru: 'Посеять сомнение в писании и обряде.',
    en: 'Sow doubt in scripture and rite.',
  },
  'act.heresy.flavor': {
    ru: 'Ересь — это истина, которую назвали слишком рано.',
    en: 'Heresy is truth named too early.',
  },
  'act.plague.name': { ru: 'Чума', en: 'Plague' },
  'act.plague.desc': {
    ru: 'Ниспослать мор, чтобы народ возроптал на небо.',
    en: 'Send a pestilence, so the people curse the heavens.',
  },
  'act.plague.flavor': {
    ru: 'Чума не разбирает праведных и грешных. В этом её урок.',
    en: 'Plague does not sort the righteous from the wicked. That is its lesson.',
  },
  'act.deceit.name': { ru: 'Ложь', en: 'Deceit' },
  'act.deceit.desc': {
    ru: 'Подменить истину правдоподобным, чтобы народ заблудился.',
    en: 'Replace truth with the plausible, so the people lose their way.',
  },
  'act.deceit.flavor': {
    ru: 'Самая крепкая ложь — та, в которую веришь от усталости.',
    en: 'The strongest lie is the one believed out of weariness.',
  },

  // ---- Action: Meditate (common to both sides) ----
  'act.meditate.name': { ru: 'Созерцать', en: 'Meditate' },
  'act.meditate.desc': {
    ru: 'Безмолвно собраться с силами. Восстанавливает +2 к каждому ресурсу твоей стороны.',
    en: 'Gather strength in silence. Restores +2 to each resource of your side.',
  },
  'act.meditate.flavor': {
    ru: 'Молчание — тоже слово. Иногда — самое веское.',
    en: 'Silence is also a word. Sometimes — the weightiest.',
  },

  // ---- Endings ----
  'end.saints.title': { ru: 'Эпоха Святых', en: 'Epoch of Saints' },
  'end.saints.text': {
    ru: 'Свет восторжествовал без остатка. Народ забыл слова «страх» и «голод». Но без тени свет слепит. Так начался мир без вопросов — и без ответов.',
    en: 'Light triumphed without remainder. The people forgot the words "fear" and "hunger". But without shadow, light blinds. Thus began a world without questions — and without answers.',
  },
  'end.eternal_night.title': { ru: 'Вечная Ночь', en: 'Eternal Night' },
  'end.eternal_night.text': {
    ru: 'Тьма поглотила последний огонь. Народ научился любить свою цепь. То, что назвали свободой, оказалось лишь другим именем небытия.',
    en: 'Darkness swallowed the last fire. The people learned to love their chains. What was called freedom turned out to be only another name for non-being.',
  },
  'end.silence.title': { ru: 'Молчание Бога', en: 'The Silence of God' },
  'end.silence.text': {
    ru: 'Чаши весов замерли ровно. Ни свет, ни тьма не взяли верх. Бог промолчал — и в этом молчании народ нашёл свою взрослость. Так стоит мир: на одной ноге — у бездны.',
    en: 'The scales stood even. Neither light nor darkness prevailed. God was silent — and in that silence the people found their adulthood. So stands the world: on one leg — at the abyss.',
  },
  'end.great_stillness.title': { ru: 'Великая Тишина', en: 'The Great Stillness' },
  'end.great_stillness.text': {
    ru: 'Обе чаши опустели. Свет и тьма истощили друг друга. Остался только ветер над пустым полем. И в нём — то, чему нет имени.',
    en: 'Both cups ran dry. Light and darkness spent each other. Only wind remained over an empty field. And in it — that which has no name.',
  },

  // ---- UI ----
  'ui.turn': { ru: 'Ход', en: 'Turn' },
  'ui.epoch': { ru: 'Эпоха', en: 'Epoch' },
  'ui.your_side': { ru: 'Твоя сторона', en: 'Your side' },
  'ui.enemy_side': { ru: 'Противник', en: 'Adversary' },
  'ui.resources': { ru: 'Ресурсы', en: 'Resources' },
  'ui.humanity': { ru: 'Человечество', en: 'Humanity' },
  'ui.log': { ru: 'Летопись', en: 'Chronicle' },
  'ui.actions': { ru: 'Действия', en: 'Actions' },
  'ui.choose_action': { ru: 'Избери деяние', en: 'Choose an action' },
  'ui.event_prompt': { ru: 'Слово провидения', en: 'A word from providence' },
  'ui.resolve_event': { ru: 'Разреши событие', en: 'Resolve event' },
  'ui.new_game': { ru: 'Новая игра', en: 'New game' },
  'ui.change_side': { ru: 'Сменить сторону', en: 'Change side' },
  'ui.lang': { ru: 'Язык', en: 'Language' },
  'ui.not_enough': { ru: 'Недостаточно ресурса', en: 'Not enough resource' },
  'ui.ai_thinking': { ru: 'Противник безмолвствует…', en: 'Adversary is silent…' },
  'ui.ai_acted': { ru: 'Противник действует', en: 'Adversary acts' },
  'ui.you_acted': { ru: 'Ты действуешь', en: 'You act' },
  'ui.world_acted': { ru: 'Мир отзывается', en: 'The world answers' },
  'ui.epoch_advanced': { ru: 'Эпоха сменяется', en: 'An epoch passes' },
  'ui.game_over': { ru: 'Итог свершён', en: 'The verdict is given' },
  'ui.play_again': { ru: 'Начать заново', en: 'Begin anew' },
  'ui.resources_low': { ru: 'Ресурсы на исходе', en: 'Resources are thin' },
  'ui.how_to_play': { ru: 'Как играть', en: 'How to play' },
  'ui.how_to_play_body': {
    ru: 'Каждый ход ты избираешь деяние — оно тратит ресурсы и сдвигает чаши человечества. Затем отвечает противник. После нескольких ходов эпоха сменяется. После седьмой эпохи — Суд.',
    en: 'Each turn you choose a deed — it spends resources and shifts the cups of humanity. Then the adversary answers. After several turns, the epoch changes. After the seventh — comes Judgment.',
  },
  'ui.telegram_hint': {
    ru: 'Это веб-приложение также доступно внутри Telegram-бота.',
    en: 'This web app is also available inside a Telegram bot.',
  },
};

export function tr(key: string, lang: Lang, params?: Record<string, string | number>): string {
  const entry = T[key];
  if (!entry) return key;
  let s: string = entry[lang] || entry.en;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

export const EPOCH_ORDER: EpochId[] = [
  'eden', 'antiquity', 'prophets', 'empires', 'schism', 'apocalypse', 'judgment',
];

export const ENDINGS_BY_ID: Record<EndingId, { id: EndingId; titleKey: string; textKey: string }> = {
  saints: { id: 'saints', titleKey: 'end.saints.title', textKey: 'end.saints.text' },
  eternal_night: { id: 'eternal_night', titleKey: 'end.eternal_night.title', textKey: 'end.eternal_night.text' },
  silence: { id: 'silence', titleKey: 'end.silence.title', textKey: 'end.silence.text' },
  great_stillness: { id: 'great_stillness', titleKey: 'end.great_stillness.title', textKey: 'end.great_stillness.text' },
};
