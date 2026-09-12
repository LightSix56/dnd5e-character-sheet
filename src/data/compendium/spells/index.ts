import type { DndSpell } from './types';
import { CANTRIPS } from './cantrips';
import { LEVEL_1_SPELLS } from './level-1';
import { LEVEL_2_SPELLS } from './level-2';
import { LEVEL_3_SPELLS } from './level-3';
import { LEVEL_4_SPELLS } from './level-4';
import { LEVEL_5_SPELLS } from './level-5';
import { LEVEL_6_SPELLS } from './level-6';
import { LEVEL_7_SPELLS } from './level-7';
import { LEVEL_8_SPELLS } from './level-8';
import { LEVEL_9_SPELLS } from './level-9';

export * from './types';
export * from './cantrips';
export * from './level-1';
export * from './level-2';
export * from './level-3';
export * from './level-4';
export * from './level-5';
export * from './level-6';
export * from './level-7';
export * from './level-8';
export * from './level-9';

/**
 * Unified Official D&D 5e Spells Compendium (524 spells from WotC Official Sources)
 */
export const DND_COMPENDIUM_SPELLS: DndSpell[] = [
  ...CANTRIPS,
  ...LEVEL_1_SPELLS,
  ...LEVEL_2_SPELLS,
  ...LEVEL_3_SPELLS,
  ...LEVEL_4_SPELLS,
  ...LEVEL_5_SPELLS,
  ...LEVEL_6_SPELLS,
  ...LEVEL_7_SPELLS,
  ...LEVEL_8_SPELLS,
  ...LEVEL_9_SPELLS,
];

// Historical / SRD synonyms mapping for maximum backward compatibility
const SPELL_ALIASES: Record<string, string> = {
  'защита от добра и зла': 'защита от зла и добра',
  'рассеивание магии': 'развеять магию',
  'развеять магию': 'рассеивание магии',
  'сигнал тревоги': 'тревога',
  'обнаружение мыслей': 'чтение мыслей',
  'чтение мыслей': 'обнаружение мыслей',
  'свобода перемещения': 'свобода передвижения',
  'свобода передвижения': 'свобода перемещения',
  'высшее восстановление': 'улучшенное восстановление',
  'улучшенное восстановление': 'высшее восстановление',
  'магическая стрела': 'волшебная стрела',
  'исцеление ран': 'лечение ран',
  'исцеляющее слово': 'лечащее слово',
  'массовое исцеляющее слово': 'множественное лечащее слово',
  'массовое исцеление ран': 'множественное лечение ран',
  'духовные защитники': 'духовные стражи',
  'контрзаклятье': 'контрзаклинание',
  'ледяной шторм': 'град',
  'гекс': 'сглаз',
  'добряника': 'ягодка',
  'жир': 'осаление',
  'горящие руки': 'огненные ладони',
  'громовая волна': 'волна грома',
  'медленное падение': 'падение пером',
  'полет': 'полёт',
  'дверь между измерениями': 'пространственная дверь',
  'палящая кара': 'обжигающая кара',
  'оглушающая кара': 'ошеломляющая кара',
  'магическое око': 'магический глаз',
  'невидимый слуга': 'невидимый слуга',
  'огненная стрела': 'огненный снаряд',
  'мистический выстрел': 'мистический заряд',
  'кислотные брызги': 'брызги кислоты',
  'жалость к умирающим': 'пощада умирающих',
  'танцующие огоньки': 'пляшущие огоньки',
  'floating disk': "диск тензера",
  'tiny hut': "хижина леомунда",
  'hideous laughter': "жуткий смех таши",
  'acid arrow': "кислотная стрела мельфа",
  'black tentacles': "чёрные щупальца эварда",
  'arcane hand': "рука бигби",
  'resilient sphere': "упругая сфера отилюка",
  'freezing sphere': "ледяная сфера отилюка",
  'faithful hound': "верный пес морденкайнена",
  'private sanctum': "личное убежище морденкайнена",
  'telepathic bond': "телепатическая связь рэри",
  'secret chest': "потайной сундук леомунда",
  'instant summons': "мгновенное призвание дромиджа",
  'irresistible dance': "неудержимая пляска отто",
};

/**
 * Searches for a spell by Russian name, English name, or common synonym.
 */
export function findSpellByName(query: string): DndSpell | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();

  // 1. Exact match by Russian or English name
  const direct = DND_COMPENDIUM_SPELLS.find(s =>
    s.name.toLowerCase() === q ||
    (s.nameEn && s.nameEn.toLowerCase() === q)
  );
  if (direct) return direct;

  // 2. Clean prefix like 'заклинание' / 'заговор'
  const cleanQ = q.replace(/^(?:заклинание|заговор)s+/i, '');
  if (cleanQ !== q) {
    const byClean = DND_COMPENDIUM_SPELLS.find(s =>
      s.name.toLowerCase() === cleanQ ||
      (s.nameEn && s.nameEn.toLowerCase() === cleanQ)
    );
    if (byClean) return byClean;
  }

  // 3. Synonym / Alias lookup
  const alias = SPELL_ALIASES[q] || SPELL_ALIASES[cleanQ];
  if (alias) {
    const byAlias = DND_COMPENDIUM_SPELLS.find(s =>
      s.name.toLowerCase() === alias ||
      (s.nameEn && s.nameEn.toLowerCase() === alias)
    );
    if (byAlias) return byAlias;
  }

  // 4. Substring fallback match
  return DND_COMPENDIUM_SPELLS.find(s =>
    s.name.toLowerCase().includes(q) ||
    (s.nameEn && s.nameEn.toLowerCase().includes(q))
  );
}
