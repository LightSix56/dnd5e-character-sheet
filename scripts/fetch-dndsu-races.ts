import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// ── Official WotC Sources Filter ──
export const OFFICIAL_WOTC_SOURCES = [
  "Player's Handbook",
  'PHB',
  'PH14',
  'PH24',
  "Dungeon Master's Guide",
  'DMG',
  'Sword Coast Adventurer',
  'SCAG',
  'Xanathar',
  'XGE',
  'Tasha',
  'TCE',
  'Fizban',
  'FTD',
  'Glory of the Giants',
  'Bigby Presents',
  'Ravenloft',
  'VRGtR',
  'Ravnica',
  'GGtR',
  'Theros',
  'MOoT',
  'Eberron',
  'ERftLW',
  'RLW',
  'Spelljammer',
  'Planescape',
  'Strixhaven',
  'Dragonlance',
  'Wildemount',
  'EGtW',
  'EGW',
  'Monsters of the Multiverse',
  'MPMM',
  'Mordenkainen',
  'MTF',
  'Volo',
  'VGM',
  'Basic Rules',
  'SRD',
  'Unearthed Arcana',
  'UA',
];

export const UNOFFICIAL_SOURCES = [
  'Homebrew',
  'Хоумбрю',
  'Grim Hollow',
  'Kobold Press',
  'Steinhardt',
  'Dungeon Dudes',
  'MCDM',
  'Third Party',
  'Сторонний',
];

export function isOfficialSource(src: string): boolean {
  if (!src) return true;
  const normalized = src.toLowerCase();
  if (UNOFFICIAL_SOURCES.some(u => normalized.includes(u.toLowerCase()))) {
    return false;
  }
  return OFFICIAL_WOTC_SOURCES.some(w => normalized.includes(w.toLowerCase()));
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cleanText(t: string): string {
  return t
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/ /g, ' ')
    .trim();
}

// ── Types ──

export interface ParsedTrait {
  name: string;
  description: string;
}

export interface ParsedSubrace {
  id: string;
  nameRu: string;
  nameEn: string;
  source: string;
  isOfficial: boolean;
  description: string;
  abilityBonuses: Record<string, number>;
  speed?: number;
  darkvision?: number;
  languages?: string[];
  traits: ParsedTrait[];
}

export interface ParsedTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ParsedRace {
  id: string;
  nameRu: string;
  nameEn: string;
  source: string;
  sourceUrl: string;
  isOfficial: boolean;
  description: string;
  loreSections: { title: string; text: string }[];
  abilityBonuses: Record<string, number>;
  speed: number;
  size: string;
  darkvision: number;
  age: string;
  alignment: string;
  languages: string[];
  traits: ParsedTrait[];
  subraces: ParsedSubrace[];
  tables: ParsedTable[];
}

// ── Ability Bonus Parser ──

export function parseAbilityBonus(text: string): Record<string, number> {
  const bonuses: Record<string, number> = {};
  const map: Record<string, string> = {
    'сил': 'СИЛ',
    'лов': 'ЛОВ',
    'тел': 'ТЕЛ',
    'инт': 'ИНТ',
    'муд': 'МДР',
    'мдр': 'МДР',
    'хар': 'ХАР',
  };

  const regex = /(Сил\w*|Ловк\w*|Телосложен\w*|Интеллект\w*|Мудрост\w*|Харизм\w*)[^\d+]*(\+?\d+)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const abRaw = match[1].toLowerCase().slice(0, 3);
    const key = map[abRaw];
    const val = parseInt(match[2].replace('+', ''), 10);
    if (key && !isNaN(val)) {
      bonuses[key] = val;
    }
  }
  return bonuses;
}

// ── Feature Paragraph Helper ──

function extractFeatureFromElement(pEl: cheerio.Cheerio<any>): { name: string; description: string } | null {
  const pText = cleanText(pEl.text());
  if (!pText) return null;

  const nameEl = pEl.find('.article-body__feature-name, strong').first();
  if (nameEl.length) {
    const name = cleanText(nameEl.text()).replace(/[.:]$/, '');
    const description = pText.slice(nameEl.text().length).replace(/^[.:]\s*/, '').trim();
    if (name.length > 0 && name.length < 60) {
      return { name, description };
    }
  }

  // Fallback pattern: "Увеличение характеристик. ..." or "Скорость. ..."
  const m = pText.match(/^([А-ЯЁ][а-яё\s–-]+?)[.:]\s+(.+)$/);
  if (m && m[1].length < 40 && !m[1].toLowerCase().includes('например') && !m[1].toLowerCase().includes('источник')) {
    return { name: m[1].trim(), description: m[2].trim() };
  }

  return null;
}

// ── Main Page Parser ──

export function parseRaceHtml(html: string, sourceUrl: string): ParsedRace {
  const $ = cheerio.load(html);

  // Remove junk
  $('script, style, header, footer, nav, #comments, .comments, .gallery, #gallery, .card__header-right').remove();

  // 1. Race Name and Title
  let titleRaw = cleanText($('.card-title a, h2.card-title, .card__title, [itemprop="name"]').first().text());
  if (!titleRaw) {
    titleRaw = cleanText($('h1').first().text().replace(/—.*$/, '').trim());
  }
  const nameMatch = titleRaw.match(/^([^[\]]+?)(?:\s*\[([^\]]+)\])?$/);
  const nameRu = nameMatch ? nameMatch[1].trim() : titleRaw;
  const nameEn = nameMatch && nameMatch[2] ? nameMatch[2].trim() : '';

  // 2. Sourcebook
  const sourceEl = $('.params.card__article-body, .card__article-footer, .source, [class*="source"]').first();
  const source = cleanText(sourceEl.text().replace(/Источник:\s*/i, '').replace(/[«»]/g, '')) || "Player's Handbook";
  const isOfficial = isOfficialSource(source);

  // Derive ID from English name or URL slug
  let id = slugify(nameEn || nameRu);
  const urlMatch = sourceUrl.match(/\/(\d+-[^/]+)/);
  if (urlMatch && !nameEn) {
    id = urlMatch[1].replace(/^\d+-/, '');
  }

  // 3. Article container
  let article = $('div.desc.card__article-body').first();
  if (!article.length) {
    article = $('.card__article-body, .card__body').first();
  }

  let baseDesc = '';
  const loreSections: { title: string; text: string }[] = [];
  const baseTraits: ParsedTrait[] = [];
  let abilityBonuses: Record<string, number> = {};
  let speed = 30;
  let size = 'Средний';
  let darkvision = 0;
  let age = '';
  let alignment = '';
  const languages: string[] = [];

  const subraces: ParsedSubrace[] = [];
  const tables: ParsedTable[] = [];

  // Check if article uses .multiforo tabs for subraces
  const multiforoElements = article.find('.multiforo');
  const hasMultiforo = multiforoElements.length > 0;

  if (hasMultiforo) {
    // Mode A: Multiforo tabbed subraces (like Dwarf, Gnome)
    let currentLoreHeading = '';

    article.children().each((_, el) => {
      const tagName = el.tagName?.toLowerCase();
      const text = cleanText($(el).text());
      if (!text) return;

      if ($(el).hasClass('multiforo-holder') || $(el).find('.multiforo').length > 0) {
        return;
      }

      if (tagName === 'h3' || tagName === 'h4' || tagName === 'h2') {
        if (/особенности/i.test(text)) {
          return;
        }
        currentLoreHeading = text;
        return;
      }

      if (tagName === 'p' || tagName === 'li' || tagName === 'blockquote') {
        if (currentLoreHeading) {
          const existing = loreSections.find(s => s.title === currentLoreHeading);
          if (existing) existing.text += '\n\n' + text;
          else loreSections.push({ title: currentLoreHeading, text });
        } else {
          baseDesc += (baseDesc ? '\n\n' : '') + text;
        }
      }
    });

    // Extract each multiforo tab as a subrace
    multiforoElements.each((i, el) => {
      const captionRaw = $(el).attr('caption') || '';
      const cap$ = cheerio.load(captionRaw);
      const subTitle = cleanText(cap$.text()) || `Подраса ${i + 1}`;
      const subId = cap$('span').attr('id') || `sub-${i + 1}`;

      let subSource = source;
      const srcMatch = subTitle.match(/^(.+?)\s*\(([^)]+)\)$/);
      let cleanSubName = subTitle;
      if (srcMatch) {
        cleanSubName = srcMatch[1].trim();
        subSource = srcMatch[2].trim();
      }

      let subAbilities: Record<string, number> = {};
      let subSpeed: number | undefined;
      let subDarkvision: number | undefined;
      const subTraits: ParsedTrait[] = [];
      let subDesc = '';

      $(el).find('p, li').each((_, p) => {
        const feat = extractFeatureFromElement($(p));
        if (feat) {
          const tName = feat.name;
          const tDesc = feat.description;

          if (/источник/i.test(tName)) {
            subSource = cleanText(tDesc || tName.replace(/источник:\s*/i, ''));
            return;
          }

          if (/увеличение характеристик/i.test(tName)) {
            subAbilities = parseAbilityBonus(tDesc);
          } else if (/скорость/i.test(tName)) {
            const spdMatch = tDesc.match(/(\d+)\s*фут/);
            if (spdMatch) subSpeed = parseInt(spdMatch[1], 10);
          } else if (/тёмное зрение/i.test(tName)) {
            const dvMatch = tDesc.match(/(\d+)\s*фут/);
            if (dvMatch) subDarkvision = parseInt(dvMatch[1], 10);
          }

          subTraits.push({ name: tName, description: tDesc });
        } else {
          const pText = cleanText($(p).text());
          if (pText) {
            subDesc += (subDesc ? '\n\n' : '') + pText;
          }
        }
      });

      if (i === 0) {
        abilityBonuses = subAbilities;
        if (subSpeed) speed = subSpeed;
        if (subDarkvision) darkvision = subDarkvision;
      }

      subraces.push({
        id: `${id}-${slugify(subId || cleanSubName)}`,
        nameRu: cleanSubName,
        nameEn: '',
        source: subSource,
        isOfficial: isOfficialSource(subSource),
        description: subDesc,
        abilityBonuses: subAbilities,
        speed: subSpeed,
        darkvision: subDarkvision,
        traits: subTraits,
      });
    });

  } else {
    // Mode B: Heading-based subraces (like Elf, Tiefling) or Standalone (like Goliath)
    type SectionType = 'lore' | 'base_traits' | 'subrace';
    let currentSection: SectionType = 'lore';
    let currentHeading = '';
    let currentSubrace: ParsedSubrace | null = null;

    function processParagraph(pEl: cheerio.Cheerio<any>) {
      const feat = extractFeatureFromElement(pEl);
      const text = cleanText(pEl.text());
      if (!text) return;

      if (currentSection === 'lore') {
        if (currentHeading) {
          const existing = loreSections.find(s => s.title === currentHeading);
          if (existing) existing.text += '\n\n' + text;
          else loreSections.push({ title: currentHeading, text });
        } else {
          baseDesc += (baseDesc ? '\n\n' : '') + text;
        }
      } else if (currentSection === 'base_traits') {
        if (feat) {
          const { name: strongText, description: traitDesc } = feat;
          if (/увеличение характеристик/i.test(strongText)) {
            abilityBonuses = parseAbilityBonus(traitDesc);
            baseTraits.push({ name: strongText, description: traitDesc });
          } else if (/скорость/i.test(strongText)) {
            const spdMatch = traitDesc.match(/(\d+)\s*фут/);
            if (spdMatch) speed = parseInt(spdMatch[1], 10);
            baseTraits.push({ name: strongText, description: traitDesc });
          } else if (/размер/i.test(strongText)) {
            if (/маленький/i.test(traitDesc)) size = 'Маленький';
            else if (/средний/i.test(traitDesc)) size = 'Средний';
            baseTraits.push({ name: strongText, description: traitDesc });
          } else if (/тёмное зрение/i.test(strongText)) {
            const dvMatch = traitDesc.match(/(\d+)\s*фут/);
            if (dvMatch) darkvision = parseInt(dvMatch[1], 10);
            baseTraits.push({ name: strongText, description: traitDesc });
          } else if (/возраст/i.test(strongText)) {
            age = traitDesc;
            baseTraits.push({ name: strongText, description: traitDesc });
          } else if (/мировоззрение/i.test(strongText)) {
            alignment = traitDesc;
            baseTraits.push({ name: strongText, description: traitDesc });
          } else if (/языки/i.test(strongText)) {
            if (/общ/i.test(traitDesc)) languages.push('Общий');
            if (/эльфийск/i.test(traitDesc)) languages.push('Эльфийский');
            if (/дворфийск/i.test(traitDesc)) languages.push('Дворфийский');
            baseTraits.push({ name: strongText, description: traitDesc });
          } else {
            baseTraits.push({ name: strongText, description: traitDesc });
          }
        }
      } else if (currentSection === 'subrace' && currentSubrace) {
        if (feat) {
          const { name: strongText, description: traitDesc } = feat;
          if (/источник/i.test(strongText)) {
            currentSubrace.source = cleanText(traitDesc || strongText.replace(/источник:\s*/i, ''));
            currentSubrace.isOfficial = isOfficialSource(currentSubrace.source);
          } else if (/увеличение характеристик/i.test(strongText)) {
            currentSubrace.abilityBonuses = parseAbilityBonus(traitDesc);
            currentSubrace.traits.push({ name: strongText, description: traitDesc });
          } else if (/скорость/i.test(strongText)) {
            const spdMatch = traitDesc.match(/(\d+)\s*фут/);
            if (spdMatch) currentSubrace.speed = parseInt(spdMatch[1], 10);
            currentSubrace.traits.push({ name: strongText, description: traitDesc });
          } else {
            currentSubrace.traits.push({ name: strongText, description: traitDesc });
          }
        } else {
          currentSubrace.description += (currentSubrace.description ? '\n\n' : '') + text;
        }
      }
    }

    article.children().each((_, el) => {
      const tagName = el.tagName?.toLowerCase();
      const text = cleanText($(el).text());
      if (!text && tagName !== 'table') return;

      if (tagName === 'h2' || tagName === 'h3') {
        if (/особенности/i.test(text)) {
          currentSection = 'base_traits';
          currentHeading = text;
          return;
        }
        if (/таблицы|комментарии|галерея|^homebrew$/i.test(text.trim())) {
          return;
        }
        if (/разновидности.*unearthed arcana/i.test(text)) {
          return;
        }

        if (currentSection === 'base_traits' || currentSection === 'subrace') {
          if (tagName === 'h2') {
            currentSection = 'subrace';
            let subNameRu = text;
            let subSource = source;
            const srcMatch = text.match(/^(.+?)\s*\(([^)]+)\)$/);
            if (srcMatch) {
              subNameRu = srcMatch[1].trim();
              subSource = srcMatch[2].trim();
            }

            currentSubrace = {
              id: `${id}-${slugify(subNameRu)}`,
              nameRu: subNameRu,
              nameEn: '',
              source: subSource,
              isOfficial: isOfficialSource(subSource),
              description: '',
              abilityBonuses: {},
              traits: [],
            };
            subraces.push(currentSubrace);
            return;
          }
        }

        if (currentSection === 'lore') {
          currentHeading = text;
          return;
        }
      }

      if (tagName === 'p' || tagName === 'li' || tagName === 'blockquote') {
        processParagraph($(el));
      } else if (tagName === 'div') {
        $(el).find('p, li, blockquote').each((_, p) => {
          processParagraph($(p));
        });
      }
    });
  }

  // 4. Tables
  article.find('table').each((_, tbl) => {
    const prevH = $(tbl).prevAll('h2, h3, h4').first();
    const tableTitle = cleanText(prevH.text()) || 'Таблица';
    const headers: string[] = [];
    $(tbl).find('th').each((_, th) => {
      headers.push(cleanText($(th).text()));
    });

    const rows: string[][] = [];
    $(tbl).find('tr').each((_, tr) => {
      const row: string[] = [];
      $(tr).find('td').each((_, td) => {
        row.push(cleanText($(td).text()));
      });
      if (row.length) rows.push(row);
    });

    if (rows.length) {
      tables.push({ title: tableTitle, headers, rows });
    }
  });

  return {
    id,
    nameRu: nameRu || 'Раса',
    nameEn: nameEn || '',
    source,
    sourceUrl,
    isOfficial,
    description: baseDesc,
    loreSections,
    abilityBonuses,
    speed,
    size,
    darkvision,
    age,
    alignment,
    languages: Array.from(new Set(languages)),
    traits: baseTraits,
    subraces,
    tables,
  };
}

// ── Markdown Formatter ──

export function formatRaceMarkdown(race: ParsedRace): string {
  const lines: string[] = [];

  const enTitle = race.nameEn ? ` [${race.nameEn}]` : '';
  lines.push(`# 👤 ${race.nameRu}${enTitle}`);
  lines.push(`**Источник:** *${race.source}* (${race.isOfficial ? 'Официальный контент WotC' : 'Сторонний контент / Homebrew'})`);
  lines.push(`**Ссылка на dnd.su:** [${race.nameRu}](${race.sourceUrl})\n`);

  lines.push(`### 📊 Базовые параметры`);
  const bonusStr = Object.entries(race.abilityBonuses).map(([k, v]) => `${k} +${v}`).join(', ') || 'Зависит от подрасы';
  lines.push(`- **Увеличение характеристик:** ${bonusStr}`);
  lines.push(`- **Скорость:** ${race.speed} футов`);
  lines.push(`- **Размер:** ${race.size}`);
  lines.push(`- **Тёмное зрение:** ${race.darkvision > 0 ? `${race.darkvision} футов` : 'Нет'}`);
  if (race.languages.length) {
    lines.push(`- **Языки:** ${race.languages.join(', ')}`);
  }
  if (race.age) {
    lines.push(`- **Возраст:** ${race.age}`);
  }
  if (race.alignment) {
    lines.push(`- **Мировоззрение:** ${race.alignment}`);
  }
  lines.push('');

  if (race.description) {
    lines.push(`### 📖 Описание`);
    lines.push(race.description);
    lines.push('');
  }

  if (race.traits.length > 0) {
    lines.push(`### ⚔️ Базовые особенности`);
    for (const t of race.traits) {
      lines.push(`#### 🛡️ ${t.name}`);
      lines.push(t.description);
      lines.push('');
    }
  }

  if (race.subraces.length > 0) {
    lines.push(`### 🌟 Подрасы и разновидности (${race.subraces.length})`);
    for (const s of race.subraces) {
      lines.push(`---\n`);
      lines.push(`#### 🧬 ${s.nameRu} [${s.source}]`);
      const sBonus = Object.entries(s.abilityBonuses).map(([k, v]) => `${k} +${v}`).join(', ') || 'нет';
      lines.push(`- **Бонусы характеристик:** ${sBonus}`);
      if (s.speed) lines.push(`- **Скорость:** ${s.speed} футов`);
      if (s.darkvision) lines.push(`- **Тёмное зрение:** ${s.darkvision} футов`);
      if (s.description) {
        lines.push(`\n*${s.description}*\n`);
      }
      if (s.traits.length > 0) {
        lines.push(`##### Особенности подрасы:`);
        for (const st of s.traits) {
          lines.push(`- **${st.name}**: ${st.description}`);
        }
      }
      lines.push('');
    }
  }

  if (race.loreSections.length > 0) {
    lines.push(`### 📜 Дополнительный лор и культура`);
    for (const lore of race.loreSections) {
      lines.push(`#### ${lore.title}`);
      lines.push(lore.text);
      lines.push('');
    }
  }

  if (race.tables.length > 0) {
    lines.push(`### 🎲 Таблицы расы (${race.tables.length})`);
    for (const tbl of race.tables) {
      lines.push(`#### ${tbl.title}`);
      if (tbl.headers.length) {
        lines.push(`| ${tbl.headers.join(' | ')} |`);
        lines.push(`| ${tbl.headers.map(() => '---').join(' | ')} |`);
      }
      for (const row of tbl.rows) {
        lines.push(`| ${row.join(' | ')} |`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ── Catalog Fetcher ──

export async function fetchRaceCatalogue(): Promise<{ href: string; name: string }[]> {
  console.log('📡 Запрос каталога рас: https://dnd.su/race/ ...');
  const res = await fetch('https://dnd.su/race/');
  if (!res.ok) {
    throw new Error(`Failed to fetch https://dnd.su/race/ (status ${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const links: { href: string; name: string }[] = [];
  $('a[href*="/race/"]').each((_, elem) => {
    const el = $(elem);
    const href = el.attr('href');
    if (!href || href.endsWith('/race/') || href.includes('#')) return;
    const name = cleanText(el.text());
    if (name && !links.some(l => l.href === href)) {
      links.push({ href, name });
    }
  });

  return links;
}

// ── Main Orchestrator ──

async function main() {
  const args = process.argv.slice(2);
  const cacheDir = path.resolve(process.cwd(), '.dndsu-cache', 'races');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const isAll = args.includes('--all') || args.includes('all');
  const isOfficialOnly = args.includes('--official') || args.includes('official') || isAll;
  const singleQuery = args.find(a => !a.startsWith('--') && a !== 'all' && a !== 'official');

  if (isAll || args.includes('--official') || args.includes('official')) {
    const onlyOfficial = !args.includes('--all');
    console.log(`🚀 Запуск парсинга ${onlyOfficial ? 'всех официальных WotC' : 'всех доступных'} рас с dnd.su...`);
    let catalog = await fetchRaceCatalogue();

    if (onlyOfficial) {
      catalog = catalog.filter(item => !item.href.includes('/homebrew/') && !item.name.includes('HB:'));
    }
    console.log(`📋 В каталоге для обработки: ${catalog.length} рас`);

    const allParsedRaces: ParsedRace[] = [];

    for (let i = 0; i < catalog.length; i++) {
      const item = catalog[i];
      const url = item.href.startsWith('http') ? item.href : `https://dnd.su${item.href}`;
      console.log(`[${i + 1}/${catalog.length}] 📥 Загрузка: ${item.name} (${url})...`);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`⚠️ Ошибка загрузки ${url} (status ${res.status})`);
          continue;
        }
        const html = await res.text();
        const parsed = parseRaceHtml(html, url);

        if (onlyOfficial && !parsed.isOfficial) {
          console.log(`   ⏭️ Пропуск неофициальной расы: ${parsed.nameRu} (${parsed.source})`);
          continue;
        }

        fs.writeFileSync(path.join(cacheDir, `${parsed.id}.json`), JSON.stringify(parsed, null, 2), 'utf-8');
        fs.writeFileSync(path.join(cacheDir, `${parsed.id}.md`), formatRaceMarkdown(parsed), 'utf-8');

        allParsedRaces.push(parsed);

        // Friendly rate-limit delay
        await new Promise(r => setTimeout(r, 150));
      } catch (err: any) {
        console.error(`❌ Ошибка парсинга ${item.name}:`, err.message);
      }
    }

    const outName = onlyOfficial ? 'all-official-races.json' : 'all-races.json';
    const compendiumPath = path.resolve(process.cwd(), '.dndsu-cache', outName);
    fs.writeFileSync(compendiumPath, JSON.stringify(allParsedRaces, null, 2), 'utf-8');
    console.log(`\n🎉 Парсинг завершён! Успешно обработано: ${allParsedRaces.length} рас.`);
    console.log(`📁 Сохранено в: ${cacheDir}`);
    console.log(`📦 Сводный файл: ${compendiumPath}`);
    return;
  }

  // Single race mode
  const query = singleQuery ? singleQuery.toLowerCase() : 'elf';
  let targetUrl = query;
  if (!query.startsWith('http')) {
    const catalog = await fetchRaceCatalogue();
    const cleanQuery = query.toLowerCase().trim();
    const matched =
      catalog.find(c => c.href.toLowerCase().match(new RegExp(`^/race/\\d+-${cleanQuery}/?$`))) ||
      catalog.find(c => {
        const words = c.name.toLowerCase().split(/[\s,–—-]+/);
        return words.includes(cleanQuery) || c.href.toLowerCase().endsWith(`/${cleanQuery}/`) || c.href.toLowerCase().includes(`-${cleanQuery}/`);
      }) ||
      catalog.find(c => {
        const lower = c.name.toLowerCase();
        const href = c.href.toLowerCase();
        return lower.includes(cleanQuery) || href.includes(cleanQuery);
      });

    if (!matched) {
      console.error(`❌ Раса по запросу "${query}" не найдена в каталоге!`);
      return;
    }
    targetUrl = matched.href.startsWith('http') ? matched.href : `https://dnd.su${matched.href}`;
    console.log(`🎯 Найдено совпадение: ${matched.name} -> ${targetUrl}`);
  }

  console.log(`📥 Загрузка: ${targetUrl}...`);
  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${targetUrl} (status ${res.status})`);
  }
  const html = await res.text();
  const parsed = parseRaceHtml(html, targetUrl);

  const jsonFile = path.join(cacheDir, `${parsed.id}.json`);
  const mdFile = path.join(cacheDir, `${parsed.id}.md`);

  fs.writeFileSync(jsonFile, JSON.stringify(parsed, null, 2), 'utf-8');
  fs.writeFileSync(mdFile, formatRaceMarkdown(parsed), 'utf-8');

  console.log(`\n✅ Успешно спарсено: ${parsed.nameRu} [${parsed.nameEn}]`);
  console.log(`📚 Источник: ${parsed.source} (${parsed.isOfficial ? 'Официальный WotC' : 'Homebrew'})`);
  console.log(`🏃 Скорость: ${parsed.speed} фт | Размер: ${parsed.size} | Зрение: ${parsed.darkvision} фт`);
  console.log(`💪 Бонусы:`, parsed.abilityBonuses);
  console.log(`🛡️ Базовых особенностей: ${parsed.traits.length}`);
  console.log(`🧬 Подрас: ${parsed.subraces.length}`);
  parsed.subraces.forEach(s => {
    console.log(`   - ${s.nameRu} (${s.source}): ${s.traits.length} умений, бонусы:`, s.abilityBonuses);
  });
  console.log(`🎲 Таблиц: ${parsed.tables.length}`);
  console.log(`💾 JSON: ${jsonFile}`);
  console.log(`📄 Markdown: ${mdFile}`);
}

if (require.main === module) {
  main().catch(console.error);
}
