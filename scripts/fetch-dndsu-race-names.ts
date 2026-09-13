import * as fs from 'fs';
import * as path from 'path';

export interface ParsedRacialNames {
  raceId: string;
  nameRu: string;
  nameEn: string;
  source: string;
  sourceUrl?: string;
  hasOfficialNames: boolean;
  namingTradition?: string;
  maleNames: string[];
  femaleNames: string[];
  surnames: string[];
  unisexNames: string[];
  clanNames: string[];
  childNames: string[];
  virtueNames: string[];
  cultures?: {
    id: string;
    name: string;
    maleNames: string[];
    femaleNames: string[];
    surnames: string[];
  }[];
  subraces?: {
    id: string;
    name: string;
    maleNames: string[];
    femaleNames: string[];
    surnames: string[];
  }[];
}

export function cleanNameList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .replace(/^[:\s—-]+/, '')
    .split(/[,;\n]/)
    .map(s => s.trim().replace(/[.]*$/, ''))
    .filter(s => s.length > 0 && !s.toLowerCase().startsWith('мужские') && !s.toLowerCase().startsWith('женские'));
}

/**
 * Extracts names from text supporting all dnd.su and WotC naming formats.
 */
export function extractNamesFromText(text: string): {
  maleNames: string[];
  femaleNames: string[];
  surnames: string[];
  unisexNames: string[];
  clanNames: string[];
  childNames: string[];
  virtueNames: string[];
  traditionText?: string;
} {
  const maleNames: string[] = [];
  const femaleNames: string[] = [];
  const surnames: string[] = [];
  const unisexNames: string[] = [];
  const clanNames: string[] = [];
  const childNames: string[] = [];
  const virtueNames: string[] = [];
  const traditionParts: string[] = [];

  const lines = text.split(/\n+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: Human ethnicity format: "(Мужские) А, Б; (женские) В, Г; (фамилии) Д, Е"
    if (/\(Мужские\)/i.test(trimmed) || /\(Женские\)/i.test(trimmed)) {
      const malePart = trimmed.match(/\((?:Мужские|мужские)\)\s*([^;]+)/iu);
      if (malePart) maleNames.push(...cleanNameList(malePart[1]));

      const femalePart = trimmed.match(/\((?:Женские|женские)\)\s*([^;]+)/iu);
      if (femalePart) femaleNames.push(...cleanNameList(femalePart[1]));

      const surnamePart = trimmed.match(/\((?:Фамилии|фамилии)\)\s*([^;]+)/iu);
      if (surnamePart) surnames.push(...cleanNameList(surnamePart[1]));
      continue;
    }

    // Pattern 2: Male names (e.g. "Мужские имена:", "Мужские взрослые имена:", "Мужские орочьи имена:", "Мужские инфернальные имена:")
    const maleMatch = trimmed.match(/Мужские[^\n:]*имена:\s*([^\n]+)/iu);
    if (maleMatch) {
      maleNames.push(...cleanNameList(maleMatch[1]));
    }

    // Pattern 3: Female names (e.g. "Женские имена:", "Женские взрослые имена:", "Женские орочьи имена:", "Женские инфернальные имена:")
    const femaleMatch = trimmed.match(/Женские[^\n:]*имена:\s*([^\n]+)/iu);
    if (femaleMatch) {
      femaleNames.push(...cleanNameList(femaleMatch[1]));
    }

    // Pattern 4: Clan names
    const clanMatch = trimmed.match(/(?:Названия кланов|Имена кланов|Кланы|Клановые имена):\s*([^\n]+)/iu);
    if (clanMatch) {
      clanNames.push(...cleanNameList(clanMatch[1]));
    }

    // Surnames
    const surnameMatch = trimmed.match(/(?:Фамилии[^\n:]*|Семейные имена):\s*([^\n]+)/iu);
    if (surnameMatch) {
      surnames.push(...cleanNameList(surnameMatch[1]));
    }

    // Pattern 5: Child names
    const childMatch = trimmed.match(/Детские[^\n:]*имена:\s*([^\n]+)/iu);
    if (childMatch) {
      childNames.push(...cleanNameList(childMatch[1]));
    }

    // Pattern 6: Virtue / Idea names
    const virtueMatch = trimmed.match(/(?:Имена-добродетели|Имена добродетелей|«Идейные» имена|Добродетели):\s*([^\n]+)/iu);
    if (virtueMatch) {
      virtueNames.push(...cleanNameList(virtueMatch[1]));
    }

    // Pattern 7: General race names line: "Имена кованых: ...", "Имена юань–ти: ...", "Имена калаштаров: ..."
    if (!maleMatch && !femaleMatch && !clanMatch && !surnameMatch && !childMatch && !virtueMatch) {
      const generalRaceNamesMatch = trimmed.match(/Имена\s+[а-яё–\-]+:\s*([^\n]+)/iu);
      if (generalRaceNamesMatch && !trimmed.toLowerCase().includes('детские') && !trimmed.toLowerCase().includes('мужские') && !trimmed.toLowerCase().includes('женские')) {
        unisexNames.push(...cleanNameList(generalRaceNamesMatch[1]));
      }
    }

    // Tradition lore description
    if (
      !trimmed.includes(':') &&
      (trimmed.includes('им') || trimmed.includes('называ') || trimmed.includes('традиц') || trimmed.includes('клан') || trimmed.includes('носят'))
    ) {
      traditionParts.push(trimmed);
    }
  }

  return {
    maleNames: Array.from(new Set(maleNames)),
    femaleNames: Array.from(new Set(femaleNames)),
    surnames: Array.from(new Set(surnames)),
    unisexNames: Array.from(new Set(unisexNames)),
    clanNames: Array.from(new Set(clanNames)),
    childNames: Array.from(new Set(childNames)),
    virtueNames: Array.from(new Set(virtueNames)),
    traditionText: traditionParts.slice(0, 2).join(' ') || undefined
  };
}

export function parseAllRacesFromCache(cacheDir: string): Record<string, ParsedRacialNames> {
  const result: Record<string, ParsedRacialNames> = {};

  if (!fs.existsSync(cacheDir)) {
    console.error(`Cache directory not found: ${cacheDir}`);
    return result;
  }

  const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const fullPath = path.join(cacheDir, file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const data = JSON.parse(raw);

      const raceId = data.id || file.replace('.json', '');
      const nameRu = data.nameRu || raceId;
      const nameEn = data.nameEn || '';
      const source = data.source || '';
      const sourceUrl = data.sourceUrl || '';

      const loreSections: { title: string; text: string }[] = data.loreSections || [];

      // Human special handling: has multiple ethnic culture sections
      const cultures: any[] = [];
      if (raceId === 'human') {
        for (const sec of loreSections) {
          const names = extractNamesFromText(sec.text);
          if (names.maleNames.length > 0 || names.femaleNames.length > 0) {
            cultures.push({
              id: sec.title.toLowerCase(),
              name: sec.title,
              maleNames: names.maleNames,
              femaleNames: names.femaleNames,
              surnames: names.surnames
            });
          }
        }
      }

      // Find all sections that talk about names
      const nameSections = loreSections.filter(s => {
        const tLower = (s.title || '').toLowerCase();
        const bLower = (s.text || '').toLowerCase();
        return (
          tLower.includes('имен') ||
          tLower.includes('этнос') ||
          bLower.includes('мужские') ||
          bLower.includes('женские') ||
          bLower.includes('(мужские)')
        );
      });

      const aggregated = {
        maleNames: [] as string[],
        femaleNames: [] as string[],
        surnames: [] as string[],
        unisexNames: [] as string[],
        clanNames: [] as string[],
        childNames: [] as string[],
        virtueNames: [] as string[],
        traditions: [] as string[],
        subraces: [] as any[]
      };

      for (const sec of nameSections) {
        const extracted = extractNamesFromText(sec.text);
        aggregated.maleNames.push(...extracted.maleNames);
        aggregated.femaleNames.push(...extracted.femaleNames);
        aggregated.surnames.push(...extracted.surnames);
        aggregated.unisexNames.push(...extracted.unisexNames);
        aggregated.clanNames.push(...extracted.clanNames);
        aggregated.childNames.push(...extracted.childNames);
        aggregated.virtueNames.push(...extracted.virtueNames);

        if (extracted.traditionText) {
          aggregated.traditions.push(extracted.traditionText);
        }

        const titleLower = sec.title.toLowerCase();
        if (titleLower.includes('глубин') || titleLower.includes('дроу') || titleLower.includes('дуэргар')) {
          aggregated.subraces.push({
            id: raceId + '-sub',
            name: sec.title,
            maleNames: extracted.maleNames,
            femaleNames: extracted.femaleNames,
            surnames: extracted.surnames.concat(extracted.clanNames)
          });
        }
      }

      // Include culture names if human
      if (cultures.length > 0) {
        for (const c of cultures) {
          aggregated.maleNames.push(...c.maleNames);
          aggregated.femaleNames.push(...c.femaleNames);
          aggregated.surnames.push(...c.surnames);
        }
      }

      const totalNames =
        aggregated.maleNames.length +
        aggregated.femaleNames.length +
        aggregated.unisexNames.length +
        aggregated.virtueNames.length;

      result[raceId] = {
        raceId,
        nameRu,
        nameEn,
        source,
        sourceUrl,
        hasOfficialNames: totalNames > 0,
        namingTradition: aggregated.traditions.join(' ') || (totalNames > 0 ? `Официальная традиция имён ${nameRu} по D&D 5e (dnd.su)` : undefined),
        maleNames: Array.from(new Set(aggregated.maleNames)),
        femaleNames: Array.from(new Set(aggregated.femaleNames)),
        surnames: Array.from(new Set([...aggregated.surnames, ...aggregated.clanNames])),
        unisexNames: Array.from(new Set(aggregated.unisexNames)),
        clanNames: Array.from(new Set(aggregated.clanNames)),
        childNames: Array.from(new Set(aggregated.childNames)),
        virtueNames: Array.from(new Set(aggregated.virtueNames)),
        cultures: cultures.length > 0 ? cultures : undefined,
        subraces: aggregated.subraces.length > 0 ? aggregated.subraces : undefined
      };
    } catch (err: any) {
      console.warn(`Error parsing cached race file ${file}:`, err.message);
    }
  }

  return result;
}

async function main() {
  console.log('🔍 Запуск парсера расовых имён dnd.su...');
  const cacheDir = path.resolve(process.cwd(), '.dndsu-cache', 'races');
  const parsed = parseAllRacesFromCache(cacheDir);

  const withNames: ParsedRacialNames[] = [];
  const withoutNames: ParsedRacialNames[] = [];

  for (const info of Object.values(parsed)) {
    if (info.hasOfficialNames) {
      withNames.push(info);
    } else {
      withoutNames.push(info);
    }
  }

  console.log(`\n✅ РЕЗУЛЬТАТЫ РАБОТЫ ПАРСЕРА:`);
  console.log(`📊 Всего обработано рас в базе dnd.su: ${Object.keys(parsed).length}`);
  console.log(`🌟 Найдено рас с собственными именами: ${withNames.length}`);
  console.log(`ℹ️ Рас без собственных имён в источнике: ${withoutNames.length}\n`);

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📌 РАСЫ С ОФИЦИАЛЬНЫМИ ИМЕНАМИ НА DND.SU:');
  console.log('═══════════════════════════════════════════════════════════════════════');
  for (const r of withNames) {
    const counts = [
      r.maleNames.length ? `♂ ${r.maleNames.length} муж.` : null,
      r.femaleNames.length ? `♀ ${r.femaleNames.length} жен.` : null,
      r.surnames.length ? `🏛️ ${r.surnames.length} кланов/фамилий` : null,
      r.virtueNames.length ? `✨ ${r.virtueNames.length} добродетелей` : null,
      r.unisexNames.length ? `⚧ ${r.unisexNames.length} унисекс` : null,
      r.cultures?.length ? `🌍 ${r.cultures.length} этносов` : null
    ].filter(Boolean).join(', ');

    console.log(`• ${r.nameRu} (${r.nameEn || r.raceId}): [${counts}]`);
    if (r.maleNames.length) {
      console.log(`    ♂ Имена: ${r.maleNames.slice(0, 5).join(', ')}...`);
    }
    if (r.femaleNames.length) {
      console.log(`    ♀ Имена: ${r.femaleNames.slice(0, 5).join(', ')}...`);
    }
    if (r.surnames.length) {
      console.log(`    🏛️ Фамилии/Кланы: ${r.surnames.slice(0, 4).join(', ')}...`);
    }
    if (r.virtueNames.length) {
      console.log(`    ✨ Добродетели: ${r.virtueNames.slice(0, 4).join(', ')}...`);
    }
    if (r.unisexNames.length) {
      console.log(`    ⚧ Имена: ${r.unisexNames.slice(0, 5).join(', ')}...`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('⚠️ РАСЫ БЕЗ СОБСТВЕННЫХ ИМЁН НА DND.SU (БУДУТ ПОЛУЧАТЬ ПРЕДУПРЕЖДЕНИЕ):');
  console.log('═══════════════════════════════════════════════════════════════════════');
  for (const r of withoutNames) {
    console.log(`• ${r.nameRu} (${r.nameEn || r.raceId}) — ${r.source}`);
  }

  // Save parsed data
  const outDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, 'race-names-parsed.json'),
    JSON.stringify(parsed, null, 2),
    'utf8'
  );
  console.log(`\n💾 Структурированные данные сохранены в scratch/race-names-parsed.json`);
}

if (require.main === module || process.argv[1]?.includes('fetch-dndsu-race-names')) {
  main().catch(err => {
    console.error('Parser error:', err);
    process.exit(1);
  });
}
