import * as fs from 'fs';
import * as path from 'path';

const CACHE_FILE = path.resolve(process.cwd(), '.dndsu-cache/all-official-spells.json');
const SPELLS_DIR = path.resolve(process.cwd(), 'src/data/compendium/spells');
const ROOT_SPELLS_FILE = path.resolve(process.cwd(), 'src/data/compendium/spells.ts');

interface RawSpell {
  id: string;
  name: string;
  nameEn: string;
  level: number;
  school: string;
  schoolEn?: string;
  castingTime: string;
  range: string;
  components: {
    v?: boolean;
    s?: boolean;
    m?: string;
    raw?: string;
    costly?: boolean;
    consumed?: boolean;
  };
  duration: string;
  concentration?: boolean;
  ritual?: boolean;
  classes?: string[];
  optionalClasses?: string[];
  subclasses?: { name: string; class: string; raw: string }[];
  sources?: { code: string; name: string }[];
  sourceBook?: string;
  description: string;
  higherLevels?: string;
  dndsuUrl?: string;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const KNOWN_COMBAT_METRICS: Record<string, { damage?: string; damageType?: string; save?: string; castingTime?: string; school?: string }> = {
  'божественная кара': { damage: '2d8', damageType: 'излучение', castingTime: '1 попадание', school: 'Воплощение' },
  'громовая кара': { damage: '2d6', damageType: 'звук', save: 'Сила', castingTime: '1 бонусное действие', school: 'Воплощение' },
  'гневная кара': { damage: '1d6', damageType: 'психическая энергия', save: 'Мудрость', castingTime: '1 бонусное действие', school: 'Воплощение' },
  'обжигающая кара': { damage: '1d6', damageType: 'огонь', save: 'Телосложение', castingTime: '1 бонусное действие', school: 'Воплощение' },
  'палящая кара': { damage: '1d6', damageType: 'огонь', save: 'Телосложение', castingTime: '1 бонусное действие', school: 'Воплощение' },
  'ослепляющая кара': { damage: '3d8', damageType: 'излучение', save: 'Телосложение', castingTime: '1 бонусное действие', school: 'Воплощение' },
  'ошеломляющая кара': { damage: '4d6', damageType: 'психическая энергия', save: 'Мудрость', castingTime: '1 бонусное действие', school: 'Очарование' },
  'оглушающая кара': { damage: '4d6', damageType: 'психическая энергия', save: 'Мудрость', castingTime: '1 бонусное действие', school: 'Очарование' },
  'изгоняющая кара': { damage: '5d10', damageType: 'силовое поле', castingTime: '1 бонусное действие', school: 'Ограждение' },
};

const EXTRA_PALADIN_SMITES: RawSpell[] = [
  {
    id: "divine-smite",
    name: "Божественная кара",
    nameEn: "Divine Smite",
    level: 1,
    school: "Воплощение",
    castingTime: "1 попадание",
    range: "На себя",
    components: { v: false, s: false, raw: "" },
    duration: "Мгновенная",
    concentration: false,
    ritual: false,
    classes: ["паладин"],
    sources: [{ code: "PH14", name: "Player's Handbook" }],
    sourceBook: "Player's Handbook",
    description: "Когда вы попадаете по существу атакой рукопашным оружием, вы можете потратить одну ячейку заклинаний паладина, чтобы нанести цели урон излучением в дополнение к урону оружия. Дополнительный урон составляет 2d8 за ячейку 1-го уровня плюс 1d8 за каждый уровень ячейки выше 1-го (максимум 5d8). Урон увеличивается на 1d8, если цель — исчадие или нежить (максимум 6d8).",
  }
];

function toTitleCaseEn(str: string): string {
  if (!str) return '';
  const minorWords = new Set(['of', 'and', 'the', 'to', 'in', 'with', 'from', 'at', 'by', 'for', 'or']);
  return str
    .split(' ')
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function formatSpell(s: RawSpell): any {
  let spellName = s.name;
  const enLower = (s.nameEn || '').trim().toLowerCase();
  if (enLower === 'searing smite') {
    spellName = 'Обжигающая кара';
  } else if (enLower === 'staggering smite') {
    spellName = 'Ошеломляющая кара';
  }

  const lowerName = spellName.trim().toLowerCase();
  const metrics = KNOWN_COMBAT_METRICS[lowerName] || {};

  return {
    id: s.id,
    name: spellName,
    nameEn: s.nameEn ? toTitleCaseEn(s.nameEn) : undefined,
    level: s.level,
    school: metrics.school || capitalize(s.school),
    schoolEn: s.schoolEn ? toTitleCaseEn(s.schoolEn) : undefined,
    castingTime: metrics.castingTime || s.castingTime,
    range: s.range,
    components: {
      v: s.components?.v ?? false,
      s: s.components?.s ?? false,
      m: s.components?.m || '',
      raw: s.components?.raw || undefined,
      costly: s.components?.costly || undefined,
      consumed: s.components?.consumed || undefined,
    },
    duration: s.duration,
    concentration: s.concentration ?? false,
    ritual: s.ritual ?? false,
    damage: metrics.damage || '',
    damageType: metrics.damageType || '',
    save: metrics.save || '',
    classes: (s.classes || []).map(capitalize),
    optionalClasses: (s.optionalClasses || []).map(capitalize),
    subclasses: (s.subclasses || []).map(sub => ({
      name: sub.name,
      class: capitalize(sub.class),
      raw: sub.raw,
    })),
    sources: s.sources || [],
    sourceBook: s.sourceBook || "Player's Handbook",
    description: s.description,
    higherLevels: s.higherLevels || '',
    dndsuUrl: s.dndsuUrl,
  };
}

function generateTypesFile(): string {
  return `// D&D 5e Full Spells Compendium Types
export interface SpellComponentInfo {
  v?: boolean;
  s?: boolean;
  m?: string;
  raw?: string;
  costly?: boolean;
  consumed?: boolean;
}

export interface SpellSubclassInfo {
  name: string;
  class: string;
  raw?: string;
}

export interface SpellSourceInfo {
  code: string;
  name: string;
}

export interface DndSpell {
  id?: string;
  name: string;
  nameEn?: string;
  level: number;
  school: string;
  schoolEn?: string;
  castingTime: string;
  range: string;
  components: SpellComponentInfo;
  duration: string;
  concentration?: boolean;
  ritual?: boolean;
  damage?: string;
  damageType?: string;
  save?: string;
  classes?: string[];
  optionalClasses?: string[];
  subclasses?: SpellSubclassInfo[];
  sources?: SpellSourceInfo[];
  sourceBook?: string;
  description: string;
  higherLevels?: string;
  dndsuUrl?: string;
}
`;
}

function generateLevelFile(constName: string, title: string, spells: any[]): string {
  const jsonContent = JSON.stringify(spells, null, 2);
  return `import type { DndSpell } from './types';

/**
 * ${title} (Total: ${spells.length})
 */
export const ${constName}: DndSpell[] = ${jsonContent};
`;
}

function generateIndexFile(): string {
  return `import type { DndSpell } from './types';
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
  const cleanQ = q.replace(/^(?:заклинание|заговор)\s+/i, '');
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
`;
}

function generateRootSpellsFile(): string {
  return `// Re-export modular compendium spells for 100% backward compatibility
export * from './spells/index';
`;
}

async function main() {
  console.log('Reading parsed spells from:', CACHE_FILE);
  if (!fs.existsSync(CACHE_FILE)) {
    throw new Error(`Cache file not found at ${CACHE_FILE}. Run parse-dndsu-spells.ts --crawl first.`);
  }

  const rawData: RawSpell[] = [
    ...JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')),
    ...EXTRA_PALADIN_SMITES,
  ];
  console.log(`Loaded ${rawData.length} spells.`);

  if (!fs.existsSync(SPELLS_DIR)) {
    fs.mkdirSync(SPELLS_DIR, { recursive: true });
  }

  // Group by level
  const byLevel: Record<number, any[]> = {};
  for (let i = 0; i <= 9; i++) {
    byLevel[i] = [];
  }

  for (const s of rawData) {
    const lvl = s.level ?? 0;
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(formatSpell(s));
  }

  // Sort each level alphabetically by Russian name
  for (let i = 0; i <= 9; i++) {
    byLevel[i].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  // 1. Write types.ts
  fs.writeFileSync(path.join(SPELLS_DIR, 'types.ts'), generateTypesFile(), 'utf-8');
  console.log('✓ Generated src/data/compendium/spells/types.ts');

  // 2. Write cantrips.ts
  fs.writeFileSync(
    path.join(SPELLS_DIR, 'cantrips.ts'),
    generateLevelFile('CANTRIPS', 'D&D 5e Cantrips (Level 0)', byLevel[0]),
    'utf-8'
  );
  console.log(`✓ Generated src/data/compendium/spells/cantrips.ts (${byLevel[0].length} cantrips)`);

  // 3. Write level-1 through level-9
  const levelNames = [
    'Cantrips',
    'Level 1 Spells',
    'Level 2 Spells',
    'Level 3 Spells',
    'Level 4 Spells',
    'Level 5 Spells',
    'Level 6 Spells',
    'Level 7 Spells',
    'Level 8 Spells',
    'Level 9 Spells',
  ];

  for (let lvl = 1; lvl <= 9; lvl++) {
    const fileName = `level-${lvl}.ts`;
    const constName = `LEVEL_${lvl}_SPELLS`;
    const title = `D&D 5e ${levelNames[lvl]}`;
    fs.writeFileSync(
      path.join(SPELLS_DIR, fileName),
      generateLevelFile(constName, title, byLevel[lvl]),
      'utf-8'
    );
    console.log(`✓ Generated src/data/compendium/spells/${fileName} (${byLevel[lvl].length} spells)`);
  }

  // 4. Write index.ts
  fs.writeFileSync(path.join(SPELLS_DIR, 'index.ts'), generateIndexFile(), 'utf-8');
  console.log('✓ Generated src/data/compendium/spells/index.ts');

  // 5. Update root spells.ts
  fs.writeFileSync(ROOT_SPELLS_FILE, generateRootSpellsFile(), 'utf-8');
  console.log('✓ Updated src/data/compendium/spells.ts (clean re-export)');

  console.log('\n🎉 Successfully modularized and populated D&D 5e spells compendium library!');
}

main().catch(err => {
  console.error('Error generating spells compendium:', err);
  process.exit(1);
});
