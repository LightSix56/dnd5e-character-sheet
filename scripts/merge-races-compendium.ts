import * as fs from 'fs';
import * as path from 'path';
import { CompendiumRace, CompendiumSubrace, RaceChoicesConfig } from '../src/data/compendium/races/types';

interface ParsedTrait {
  name: string;
  description: string;
}

interface ParsedSubrace {
  id: string;
  nameRu: string;
  nameEn: string;
  description: string;
  abilityBonuses?: Record<string, number>;
  traits?: ParsedTrait[];
  speed?: number;
}

interface ParsedRace {
  id: string;
  nameRu: string;
  nameEn: string;
  source: string;
  sourceUrl?: string;
  isOfficial?: boolean;
  description: string;
  abilityBonuses?: Record<string, number>;
  speed: number;
  size: string;
  darkvision: number;
  languages: string[];
  traits: ParsedTrait[];
  subraces?: ParsedSubrace[];
}

const STAT_MAP: Record<string, 'СИЛ' | 'ЛОВ' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'> = {
  'str': 'СИЛ', 'сил': 'СИЛ', 'сила': 'СИЛ',
  'dex': 'ЛОВ', 'лов': 'ЛОВ', 'ловкость': 'ЛОВ',
  'con': 'ТЕЛ', 'тел': 'ТЕЛ', 'телосложение': 'ТЕЛ',
  'int': 'ИНТ', 'инт': 'ИНТ', 'интеллект': 'ИНТ',
  'wis': 'МДР', 'мдр': 'МДР', 'мудрость': 'МДР',
  'cha': 'ХАР', 'хар': 'ХАР', 'харизма': 'ХАР'
};

export function normalizeAbilityBonuses(raw: Record<string, number> | undefined): Partial<Record<'СИЛ' | 'ЛОВ' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР', number>> {
  if (!raw) return {};
  const res: Partial<Record<'СИЛ' | 'ЛОВ' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР', number>> = {};
  for (const [key, val] of Object.entries(raw)) {
    const k = key.toLowerCase();
    const mapped = STAT_MAP[k];
    if (mapped && typeof val === 'number') {
      res[mapped] = val;
    }
  }
  return res;
}

export function detectChoices(p: ParsedRace, isMpmm: boolean): RaceChoicesConfig | undefined {
  const choices: RaceChoicesConfig = {};
  let hasAnyChoice = false;

  const allText = (p.description + ' ' + (p.traits || []).map(t => t.name + ' ' + t.description).join(' ')).toLowerCase();
  const sizeText = (p.size || '').toLowerCase();

  // 1. Flexible ASI
  if (isMpmm || p.source.toLowerCase().includes('multiverse') || allText.includes('увеличьте значение одной характеристики на 2, а другой на 1')) {
    choices.isFlexibleASI = true;
    hasAnyChoice = true;
  }

  // 2. Size Choice
  if (sizeText.includes('или') || allText.includes('средний или маленький') || allText.includes('маленький или средний')) {
    choices.sizeChoice = ['Средний', 'Маленький'];
    hasAnyChoice = true;
  }

  // 3. Cantrip Choice
  if (p.id === 'kobold' && isMpmm) {
    choices.cantripChoice = {
      class: 'sorcerer',
      abilityChoice: ['ИНТ', 'МДР', 'ХАР']
    };
    hasAnyChoice = true;
  } else if (p.id === 'astral-elf') {
    choices.cantripChoice = {
      spellOptions: ['Свет', 'Священное пламя', 'Пляшущие огоньки'],
      abilityChoice: ['ИНТ', 'МДР', 'ХАР']
    };
    hasAnyChoice = true;
  } else if (allText.includes('заговор из списка заклинаний волшебника') || allText.includes('один заговор волшебника')) {
    choices.cantripChoice = 'wizard';
    hasAnyChoice = true;
  } else if (allText.includes('заговор из списка заклинаний друида')) {
    choices.cantripChoice = 'druid';
    hasAnyChoice = true;
  } else if (allText.includes('заговор из списка заклинаний жреца')) {
    choices.cantripChoice = 'cleric';
    hasAnyChoice = true;
  }

  // 4. Tool Choice
  if (p.id === 'autognome') {
    choices.toolChoice = {
      category: 'artisan',
      count: 2
    };
    hasAnyChoice = true;
  } else if (p.id === 'dwarf') {
    choices.toolChoice = 'dwarf_tools';
    hasAnyChoice = true;
  } else if (allText.includes('владение одними ремесленными инструментами на ваш выбор') || allText.includes('одними ремесленными инструментами на выбор')) {
    choices.toolChoice = 'artisan';
    hasAnyChoice = true;
  }

  // 5. Skill Choices
  if (p.id === 'kenku' && isMpmm) {
    choices.extraSkillsCount = 2;
    hasAnyChoice = true;
  } else if (p.id === 'changeling') {
    choices.extraSkillsCount = 2;
    choices.skillChoiceOptions = ['Запугивание', 'Обман', 'Проницательность', 'Убеждение'];
    hasAnyChoice = true;
  } else if (p.id === 'lizardfolk' && isMpmm) {
    choices.extraSkillsCount = 2;
    choices.skillChoiceOptions = ['Анималистика', 'Выживание', 'Внимательность', 'Скрытность', 'Природа'];
    hasAnyChoice = true;
  } else if (p.id === 'leonin') {
    choices.extraSkillsCount = 1;
    choices.skillChoiceOptions = ['Атлетика', 'Запугивание', 'Выживание', 'Восприятие'];
    hasAnyChoice = true;
  }

  // 6. Feat Choice
  if (p.id === 'custom-lineage' || allText.includes('получаете 1 черту на ваш выбор') || allText.includes('одну черту на ваш выбор')) {
    choices.hasFeat = true;
    hasAnyChoice = true;
  }

  // 7. Extra Languages Count
  if (allText.includes('один дополнительный язык на выбор') || allText.includes('один язык на ваш выбор')) {
    choices.extraLanguagesCount = 1;
    hasAnyChoice = true;
  }

  // 8. Custom Feature Choice (Simic Hybrid)
  if (p.id === 'simic-hybrid') {
    choices.customFeatureChoice = {
      featureName: 'Животное усиление (1 уровень)',
      options: [
        { id: 'manta-glide', name: 'Манта-плавники', description: 'Замедление падения: при падении вы можете перемещаться на 2 фута по горизонтали за каждый 1 фут падения и не получаете урон от падения.' },
        { id: 'nimble-climber', name: 'Ловкий скалолаз', description: 'Скорость лазания равна вашей базовой скорости ходьбы.' },
        { id: 'underwater-adaptation', name: 'Подводная адаптация', description: 'Вы можете дышать воздухом и водой, а ваша скорость плавания равна скорости ходьбы.' }
      ]
    };
    hasAnyChoice = true;
  }

  // 9. Gith Mage Hand with MPMM spellcasting ability
  if ((p.id === 'githyanki' || p.id === 'githzerai') && isMpmm) {
    choices.cantripChoice = {
      spellOptions: ['Волшебная рука'],
      abilityChoice: ['ИНТ', 'МДР', 'ХАР']
    };
    hasAnyChoice = true;
  }

  return hasAnyChoice ? choices : undefined;
}

export function parseSubraces(rawSubraces: ParsedSubrace[] | undefined): CompendiumSubrace[] {
  if (!rawSubraces || rawSubraces.length === 0) return [];
  return rawSubraces.map(sub => ({
    id: sub.id,
    name: sub.nameRu,
    nameEn: sub.nameEn,
    description: sub.description || '',
    abilityBonuses: normalizeAbilityBonuses(sub.abilityBonuses),
    traits: (sub.traits || []).map(t => ({ name: t.name, description: t.description })),
    speed: sub.speed
  }));
}

export function convertParsedToCompendium(p: ParsedRace, category: CompendiumRace['category'], overrideId?: string, overrideName?: string): CompendiumRace {
  const isMpmm = p.source.toLowerCase().includes('multiverse');
  const sizeVal = p.size && p.size.toLowerCase().includes('маленький') && !p.size.toLowerCase().includes('средний') ? 'Маленький' : 'Средний';

  let traits = (p.traits || []).map(t => ({ name: t.name, description: t.description }));
  if (traits.length === 0 && (p as any).loreSections && (p as any).loreSections.length > 0) {
    for (const section of (p as any).loreSections) {
      const paragraphs = (section.text || '').split(/\n\n+/);
      for (const para of paragraphs) {
        const dotIdx = para.indexOf('. ');
        if (dotIdx > 0 && dotIdx < 50) {
          const title = para.substring(0, dotIdx).trim();
          const desc = para.substring(dotIdx + 2).trim();
          const ignoreTitles = ['Увеличение характеристик', 'Возраст', 'Скорость', 'Вид существа', 'Размер', 'Языки'];
          if (!ignoreTitles.includes(title) && desc.length > 0) {
            traits.push({ name: title, description: desc });
          }
        }
      }
    }
  }

  return {
    id: overrideId || p.id,
    name: overrideName || p.nameRu,
    nameEn: p.nameEn,
    source: isMpmm ? 'MPMM' : p.source,
    category,
    description: p.description,
    abilityBonuses: isMpmm ? {} : normalizeAbilityBonuses(p.abilityBonuses),
    speed: p.speed || 30,
    size: sizeVal,
    darkvision: p.darkvision || 0,
    languages: p.languages && p.languages.length > 0 ? p.languages : ['Общий'],
    traits,
    subraces: parseSubraces(p.subraces),
    choices: detectChoices(p, isMpmm)
  };
}

// Batch Definitions
export const BATCH_DEFINITIONS: Record<string, { desc: string; targetFile: 'multiverse' | 'supplements'; raceKeys: { id: string; sourceMatch: string; overrideId?: string; overrideName?: string }[] }> = {
  batch1: {
    desc: 'MPMM Ревизии классических рас (Аасимар, Багбир, Гоблин, Голиаф, Кенку)',
    targetFile: 'multiverse',
    raceKeys: [
      { id: 'aasimar', sourceMatch: 'Multiverse', overrideId: 'aasimar-mpmm', overrideName: 'Аасимар (MPMM)' },
      { id: 'bugbear', sourceMatch: 'Multiverse', overrideId: 'bugbear-mpmm', overrideName: 'Багбир (MPMM)' },
      { id: 'goblin', sourceMatch: 'Multiverse', overrideId: 'goblin-mpmm', overrideName: 'Гоблин (MPMM)' },
      { id: 'goliath', sourceMatch: 'Multiverse', overrideId: 'goliath-mpmm', overrideName: 'Голиаф (MPMM)' },
      { id: 'kenku', sourceMatch: 'Multiverse', overrideId: 'kenku-mpmm', overrideName: 'Кенку (MPMM)' }
    ]
  },
  batch2: {
    desc: 'MPMM Экзотические ревизии (Кобольд, Людоящер, Минотавр, Орк, Сатир)',
    targetFile: 'multiverse',
    raceKeys: [
      { id: 'kobold', sourceMatch: 'Multiverse', overrideId: 'kobold-mpmm', overrideName: 'Кобольд (MPMM)' },
      { id: 'lizardfolk', sourceMatch: 'Multiverse', overrideId: 'lizardfolk-mpmm', overrideName: 'Людоящер (MPMM)' },
      { id: 'minotaur', sourceMatch: 'Multiverse', overrideId: 'minotaur-mpmm', overrideName: 'Минотавр (MPMM)' },
      { id: 'orc', sourceMatch: 'Multiverse', overrideId: 'orc-mpmm', overrideName: 'Орк (MPMM)' },
      { id: 'satyr', sourceMatch: 'Multiverse', overrideId: 'satyr-mpmm', overrideName: 'Сатир (MPMM)' }
    ]
  },
  batch3: {
    desc: 'MPMM Природные и планарные ревизии (Табакси, Тритон, Фирболг, Хобгоблин, Чейнджлинг, Шифтер)',
    targetFile: 'multiverse',
    raceKeys: [
      { id: 'tabaxi', sourceMatch: 'Multiverse', overrideId: 'tabaxi-mpmm', overrideName: 'Табакси (MPMM)' },
      { id: 'triton', sourceMatch: 'Multiverse', overrideId: 'triton-mpmm', overrideName: 'Тритон (MPMM)' },
      { id: 'firbolg', sourceMatch: 'Multiverse', overrideId: 'firbolg-mpmm', overrideName: 'Фирболг (MPMM)' },
      { id: 'hobgoblin', sourceMatch: 'Multiverse', overrideId: 'hobgoblin-mpmm', overrideName: 'Хобгоблин (MPMM)' },
      { id: 'changeling', sourceMatch: 'Multiverse', overrideId: 'changeling-mpmm', overrideName: 'Чейнджлинг (MPMM)' },
      { id: 'shifter', sourceMatch: 'Multiverse', overrideId: 'shifter-mpmm', overrideName: 'Шифтер (MPMM)' }
    ]
  },
  batch4: {
    desc: 'MPMM Новые астральные и подземные расы (Гитъянки, Гитцерай, Глубинный гном, Дуэргар, Эладрин)',
    targetFile: 'multiverse',
    raceKeys: [
      { id: 'githyanki', sourceMatch: 'Multiverse', overrideId: 'githyanki-mpmm', overrideName: 'Гитъянки (MPMM)' },
      { id: 'githzerai', sourceMatch: 'Multiverse', overrideId: 'githzerai-mpmm', overrideName: 'Гитцерай (MPMM)' },
      { id: 'deep-gnome', sourceMatch: 'Multiverse', overrideId: 'deep-gnome-mpmm', overrideName: 'Глубинный гном (MPMM)' },
      { id: 'duergar', sourceMatch: 'Multiverse', overrideId: 'duergar-mpmm', overrideName: 'Дуэргар (MPMM)' },
      { id: 'eladrin', sourceMatch: 'Multiverse', overrideId: 'eladrin-mpmm', overrideName: 'Эладрин (MPMM)' }
    ]
  },
  batch5: {
    desc: 'MPMM Фэйри, морские и звериные расы (Зайцегон, Фэйри, Морской эльф, Шадар-кай, Кентавр)',
    targetFile: 'multiverse',
    raceKeys: [
      { id: 'harengon', sourceMatch: 'Multiverse', overrideId: 'harengon-mpmm', overrideName: 'Зайцегон (MPMM)' },
      { id: 'fairy', sourceMatch: 'Multiverse', overrideId: 'fairy-mpmm', overrideName: 'Фэйри (MPMM)' },
      { id: 'sea-elf', sourceMatch: 'Multiverse', overrideId: 'sea-elf-mpmm', overrideName: 'Морской эльф (MPMM)' },
      { id: 'shadar-kai', sourceMatch: 'Multiverse', overrideId: 'shadar-kai-mpmm', overrideName: 'Шадар-кай (MPMM)' },
      { id: 'centaur', sourceMatch: 'Multiverse', overrideId: 'centaur-mpmm', overrideName: 'Кентавр (MPMM)' }
    ]
  },
  batch6: {
    desc: 'Сеттинги Spelljammer, Dragonlance и Strixhaven (Кендер, Астральный эльф, Автогном, Хадози, Гифф, Три-крин, Совлин)',
    targetFile: 'supplements',
    raceKeys: [
      { id: 'kender', sourceMatch: 'Dragonlance', overrideId: 'kender', overrideName: 'Кендер' },
      { id: 'astral-elf', sourceMatch: 'Spelljammer', overrideId: 'astral-elf', overrideName: 'Астральный эльф' },
      { id: 'autognome', sourceMatch: 'Spelljammer', overrideId: 'autognome', overrideName: 'Автогном' },
      { id: 'hadozee', sourceMatch: 'Spelljammer', overrideId: 'hadozee', overrideName: 'Хадози' },
      { id: 'giff', sourceMatch: 'Spelljammer', overrideId: 'giff', overrideName: 'Гифф' },
      { id: 'thri-kreen', sourceMatch: 'Spelljammer', overrideId: 'thri-kreen', overrideName: 'Три-крин' },
      { id: 'owlin', sourceMatch: 'Strixhaven', overrideId: 'owlin', overrideName: 'Совлин' }
    ]
  },
  batch7: {
    desc: 'Сеттинги Ravnica, Theros, Eberron и Ravenloft (Симик, Ведалкен, Локсодон, Леонинец, Калаштар, Кованый, Дампир, Хексблад, Возрожденный)',
    targetFile: 'supplements',
    raceKeys: [
      { id: 'simic-hybrid', sourceMatch: 'Ravnica', overrideId: 'simic-hybrid', overrideName: 'Симикский гибрид' },
      { id: 'vedalken', sourceMatch: 'Ravnica', overrideId: 'vedalken', overrideName: 'Ведалкен' },
      { id: 'loxodon', sourceMatch: 'Ravnica', overrideId: 'loxodon', overrideName: 'Локсодон' },
      { id: 'leonin', sourceMatch: 'Theros', overrideId: 'leonin', overrideName: 'Леонин' },
      { id: 'kalashtar', sourceMatch: 'Eberron', overrideId: 'kalashtar', overrideName: 'Калаштар' },
      { id: 'warforged', sourceMatch: 'Eberron', overrideId: 'warforged', overrideName: 'Кованый' },
      { id: 'dhampir', sourceMatch: 'Ravenloft', overrideId: 'dhampir', overrideName: 'Дампир' },
      { id: 'hexblood', sourceMatch: 'Ravenloft', overrideId: 'hexblood', overrideName: 'Ведьмовская кровь' },
      { id: 'reborn', sourceMatch: 'Ravenloft', overrideId: 'reborn', overrideName: 'Возрождённый' }
    ]
  }
};

// Main Runner
function run() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const batchArgIdx = args.indexOf('--batch');
  const targetBatch = batchArgIdx !== -1 ? args[batchArgIdx + 1] : null;

  const rawRaces: ParsedRace[] = JSON.parse(fs.readFileSync('.dndsu-cache/all-official-races.json', 'utf8'));

  console.log(`=== D&D 5e Race Compendium Merge Runner ===`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (No files written)' : 'LIVE MERGE'}`);
  console.log(`Target Batch: ${targetBatch || 'ALL'}\n`);

  const batchesToRun = targetBatch ? [targetBatch] : Object.keys(BATCH_DEFINITIONS);

  for (const bName of batchesToRun) {
    const def = BATCH_DEFINITIONS[bName];
    if (!def) {
      console.error(`Unknown batch: ${bName}`);
      continue;
    }

    console.log(`----------------------------------------`);
    console.log(`▶ [${bName.toUpperCase()}] ${def.desc}`);
    console.log(`  Target file: src/data/compendium/races/${def.targetFile}.ts`);

    const processedRaces: CompendiumRace[] = [];

    for (const keyDef of def.raceKeys) {
      const match = rawRaces.find(r => r.id === keyDef.id && r.source.toLowerCase().includes(keyDef.sourceMatch.toLowerCase()));
      if (!match) {
        console.warn(`  ⚠️ Could not find parsed race for id="${keyDef.id}", source match="${keyDef.sourceMatch}"`);
        continue;
      }

      const category = def.targetFile === 'multiverse' ? 'multiverse' : 'setting';
      const converted = convertParsedToCompendium(match, category, keyDef.overrideId, keyDef.overrideName);
      processedRaces.push(converted);

      console.log(`  ✔ [${converted.id}] ${converted.name} (${converted.source})`);
      console.log(`    Speed: ${converted.speed}, Size: ${converted.size}, Darkvision: ${converted.darkvision}`);
      console.log(`    Choices: ${converted.choices ? JSON.stringify(converted.choices) : 'none'}`);
      console.log(`    Traits: ${converted.traits.length}, Subraces: ${converted.subraces.length}`);
    }

    if (!isDryRun && processedRaces.length > 0) {
      const filePath = path.join('src/data/compendium/races', `${def.targetFile}.ts`);
      let existingList: CompendiumRace[] = [];
      if (fs.existsSync(filePath)) {
        // Read file contents and extract existing array
        const content = fs.readFileSync(filePath, 'utf8');
        const jsonStart = content.indexOf('[');
        const jsonEnd = content.lastIndexOf(']');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          existingList = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
        }
      }

      // Merge: replace existing with same ID or append
      for (const nr of processedRaces) {
        const existingIdx = existingList.findIndex(r => r.id === nr.id);
        if (existingIdx !== -1) {
          existingList[existingIdx] = nr;
        } else {
          existingList.push(nr);
        }
      }

      const varName = def.targetFile === 'multiverse' ? 'MULTIVERSE_RACES' : 'SUPPLEMENT_RACES';
      const comment = def.targetFile === 'multiverse'
        ? 'Mordenkainen Presents: Monsters of the Multiverse (MPMM) Races'
        : 'Setting and Supplement Races (Eberron, Ravnica, Theros, Spelljammer, Ravenloft)';

      const newContent = `// ${comment}\nimport { CompendiumRace } from './types';\n\nexport const ${varName}: CompendiumRace[] = ${JSON.stringify(existingList, null, 2)};\n`;
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  💾 Updated ${filePath} (Total: ${existingList.length} races)`);
    }
  }

  console.log(`\n=== Merge Runner Finished ===`);
}

if (require.main === module) {
  run();
}
