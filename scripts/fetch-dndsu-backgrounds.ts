import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// List of official WotC sources in Russian / English as seen on dnd.su
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
  'Curse of Strahd',
  'CoS',
  'Ravnica',
  'GGtR',
  'Theros',
  'MOoT',
  'Eberron',
  'ERftLW',
  'Acquisition',
  'Acquisitions Incorporated',
  'Spelljammer',
  'Planescape',
  'Strixhaven',
  'Dragonlance',
  'Tomb of Annihilation',
  'ToA',
  'Storm King',
  'SKT',
  'Waterdeep',
  'WDH',
  'WDMM',
  'Avernus',
  "Baldur's Gate",
  'Ghosts of Saltmarsh',
  'GoS',
  'Icewind Dale',
  'IDRotF',
  'Witchlight',
  'Wild Beyond the Witchlight',
  'WBtW',
  'Wildemount',
  "Explorer's Guide to Wildemount",
  'EGW',
  'Netherdeep',
  'Call of the Netherdeep',
  'CotN',
  'Book of Many Things',
  'Basic Rules',
  'SRD',
];

// Unofficial/Homebrew indicators
export const UNOFFICIAL_SOURCES = [
  'Homebrew',
  'Хоумбрю',
  'Grim Hollow',
  'Kobold Press',
  'Steinhardt',
  'Dungeon Dudes',
  'MCDM',
  'Critical Role',
  'DMs Guild',
  'Third Party',
  'Сторонний',
];

export function isOfficialBackgroundSource(src: string): boolean {
  if (!src) return false;
  const normalized = src.toLowerCase().replace(/[’'`]/g, "'");
  if (UNOFFICIAL_SOURCES.some(u => normalized.includes(u.toLowerCase()))) {
    return false;
  }
  return OFFICIAL_WOTC_SOURCES.some(w => normalized.includes(w.toLowerCase().replace(/[’'`]/g, "'")));
}

export interface ParsedBackgroundFeature {
  name: string;
  description: string;
}

export interface ParsedSuggestedCharacteristics {
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

export interface ParsedBackgroundData {
  id: string;
  nameRu: string;
  nameEn: string;
  source: string;
  isOfficial: boolean;
  sourceUrl: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];
  equipment: string;
  startingGold: number;
  specialty?: {
    name: string;
    options: { roll: string; text: string }[];
  };
  feature: ParsedBackgroundFeature;
  alternativeFeatures?: ParsedBackgroundFeature[];
  suggestedCharacteristics?: ParsedSuggestedCharacteristics;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cleanText(str: string): string {
  return str
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/ /g, ' ')
    .trim();
}

export function parseBackgroundHtml(html: string, sourceUrl: string): ParsedBackgroundData {
  const $ = cheerio.load(html);

  // 1. Extract titles
  let titleRaw = $('[data-copy]').first().attr('data-copy') || $('[data-copy]').first().text().trim();
  if (!titleRaw) {
    titleRaw = $('h2.card__title, .card__title').first().text().trim();
  }
  if (!titleRaw) {
    const candidateH2 = $('h2').filter((_, el) => $(el).text().includes('[')).first().text().trim();
    if (candidateH2) titleRaw = candidateH2;
  }
  if (!titleRaw) {
    titleRaw = $('h1').first().text().trim();
  }
  if (!titleRaw) {
    titleRaw = $('title').text().replace(/—.*$/, '').replace(/-.*$/, '').trim();
  }

  let nameRu = titleRaw;
  let nameEn = '';

  const bracketMatch = titleRaw.match(/^(.+?)\s*\[([A-Za-z0-9\s'-]+)\]/);
  if (bracketMatch) {
    nameRu = cleanText(bracketMatch[1]);
    nameEn = cleanText(bracketMatch[2]);
  } else {
    const subTitle = $('.card__subtitle, .subtitle').first().text().trim();
    if (subTitle && /^[A-Za-z\s'-]+$/.test(subTitle)) {
      nameEn = cleanText(subTitle);
    }
  }

  // Clean nameRu if title had page suffix like "— Предыстории"
  nameRu = nameRu.replace(/\s*—\s*Предыстории.*$/i, '').trim();

  // If nameEn still empty, try extracting from URL slug
  if (!nameEn) {
    const slugMatch = sourceUrl.match(/\/(\d+-)?([a-z-]+)\/?$/i);
    if (slugMatch && slugMatch[2]) {
      nameEn = slugMatch[2]
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  // 2. Extract Source
  const sourcePlaques: string[] = [];
  $('.source-plaque').each((_, el) => {
    const t = $(el).attr('title') || $(el).text().trim();
    if (t && !sourcePlaques.includes(t)) {
      sourcePlaques.push(t);
    }
  });

  let sourceText = sourcePlaques.join(', ');
  if (!sourceText) {
    sourceText = $('.card__source, .source, .article__source').first().text().trim();
  }
  if (!sourceText) {
    $('p, div').each((_, el) => {
      const t = $(el).text().trim();
      if (!sourceText && (t.startsWith('Источник:') || t.startsWith('Источник :'))) {
        sourceText = t;
      }
    });
  }
  sourceText = sourceText.replace(/^Источник:\s*/i, '').replace(/[«»"]/g, '').trim();

  // If still empty, default to Player's Handbook (PHB core)
  if (!sourceText) {
    sourceText = "Player's Handbook";
  }

  const isOfficial = isOfficialBackgroundSource(sourceText);

  // 3. Extract parameter lists (skills, tools, languages, equipment)
  const skills: string[] = [];
  const tools: string[] = [];
  const languages: string[] = [];
  let equipment = '';
  let startingGold = 0;

  // Search in list items or paragraphs
  $('li, p').each((_, el) => {
    const text = cleanText($(el).text());
    if (/^Владение навыками:\s*/i.test(text)) {
      const val = text.replace(/^Владение навыками:\s*/i, '').replace(/\.$/, '');
      val.split(/,\s*/).map(cleanText).filter(s => s && s.toLowerCase() !== 'нет').forEach(s => skills.push(s));
    } else if (/^Владение инструментами:\s*/i.test(text)) {
      const val = text.replace(/^Владение инструментами:\s*/i, '').replace(/\.$/, '');
      val.split(/,\s*/).map(cleanText).filter(s => s && s.toLowerCase() !== 'нет').forEach(s => tools.push(s));
    } else if (/^Языки:\s*/i.test(text)) {
      const val = text.replace(/^Языки:\s*/i, '').replace(/\.$/, '');
      val.split(/,\s*/).map(cleanText).filter(s => s && s.toLowerCase() !== 'нет').forEach(s => languages.push(s));
    } else if (/^Снаряжение:\s*/i.test(text)) {
      equipment = cleanText(text.replace(/^Снаряжение:\s*/i, ''));
      // Extract starting gold (e.g. 15 зм, 10 зм, 25 зм)
      const goldMatch = equipment.match(/(\d+)\s*зм/i);
      if (goldMatch) {
        startingGold = parseInt(goldMatch[1], 10);
      }
    }
  });

  // 4. Extract description paragraphs
  const descParagraphs: string[] = [];
  $('p').each((_, el) => {
    const p = cleanText($(el).text());
    if (!p) return;
    if (
      p.startsWith('Владение навыками:') ||
      p.startsWith('Владение инструментами:') ||
      p.startsWith('Языки:') ||
      p.startsWith('Снаряжение:') ||
      p.startsWith('Источник:') ||
      p.startsWith('УМЕНИЕ:') ||
      p.startsWith('ПЕРСОНАЛИЗАЦИЯ') ||
      p.startsWith('СПЕЦИАЛИЗАЦИЯ')
    ) {
      return;
    }
    // Only paragraphs before the first feature or table
    const prevHeaders = $(el).prevAll('h2, h3, h4, table').length;
    if (prevHeaders === 0 && descParagraphs.length < 3) {
      descParagraphs.push(p);
    }
  });
  const description = descParagraphs.join('\n\n');

  // 5. Extract Feature(s)
  let featureName = '';
  const featureDescLines: string[] = [];
  const altFeatures: ParsedBackgroundFeature[] = [];

  $('h3, h4, strong, b').each((_, el) => {
    const t = cleanText($(el).text());
    if (/^УМЕНИЕ:\s*/i.test(t)) {
      featureName = t.replace(/^УМЕНИЕ:\s*/i, '').trim();
      // Capitalize
      featureName = featureName.charAt(0).toUpperCase() + featureName.slice(1).toLowerCase();
      // Grab following sibling paragraphs until next heading
      let next = $(el).parent().is('h3, h4') ? $(el).parent().next() : $(el).next();
      while (next.length && !next.is('h2, h3, h4, table') && !next.text().includes('ПЕРСОНАЛИЗАЦИЯ')) {
        const line = cleanText(next.text());
        if (line) featureDescLines.push(line);
        next = next.next();
      }
    } else if (/^АЛЬТЕРНАТИВНОЕ УМЕНИЕ:\s*/i.test(t) || /^ВАРИАНТ УМЕНИЯ:\s*/i.test(t)) {
      const altName = cleanText(t.replace(/^(АЛЬТЕРНАТИВНОЕ УМЕНИЕ|ВАРИАНТ УМЕНИЯ):\s*/i, ''));
      const altLines: string[] = [];
      let next = $(el).parent().is('h3, h4') ? $(el).parent().next() : $(el).next();
      while (next.length && !next.is('h2, h3, h4, table') && !next.text().includes('ПЕРСОНАЛИЗАЦИЯ')) {
        const line = cleanText(next.text());
        if (line) altLines.push(line);
        next = next.next();
      }
      if (altName && altLines.length) {
        altFeatures.push({
          name: altName.charAt(0).toUpperCase() + altName.slice(1).toLowerCase(),
          description: altLines.join('\n\n'),
        });
      }
    }
  });

  // Fallback for feature name if not found via heading
  if (!featureName) {
    $('p').each((_, el) => {
      const text = cleanText($(el).text());
      const m = text.match(/УМЕНИЕ:\s*([^\.]+?)(?:\.|$)/i);
      if (m && !featureName) {
        featureName = cleanText(m[1]);
        featureDescLines.push(text.slice(m[0].length).trim());
      }
    });
  }

  // 6. Extract Tables (Specialty, Personality Traits, Ideals, Bonds, Flaws)
  const personalityTraits: string[] = [];
  const ideals: string[] = [];
  const bonds: string[] = [];
  const flaws: string[] = [];

  $('table').each((_, tableEl) => {
    let caption = $(tableEl).find('caption').text().trim();
    if (!caption) {
      // Check previous heading or paragraph
      caption = $(tableEl).prev('h3, h4, p, strong').text().trim();
    }
    const capLower = caption.toLowerCase();

    $(tableEl).find('tr').each((_, trEl) => {
      const tds = $(trEl).find('td');
      if (tds.length >= 2) {
        const val = cleanText($(tds[1]).text());
        if (!val) return;

        if (capLower.includes('черта характера') || capLower.includes('черты характера')) {
          personalityTraits.push(val);
        } else if (capLower.includes('идеал')) {
          ideals.push(val);
        } else if (capLower.includes('привязанност') || capLower.includes('привязка')) {
          bonds.push(val);
        } else if (capLower.includes('слабост') || capLower.includes('изъян')) {
          flaws.push(val);
        }
      }
    });
  });

  // Id derivation: slugify English name or Russian name
  const id = slugify(nameEn || nameRu);

  return {
    id,
    nameRu,
    nameEn: nameEn || nameRu,
    source: sourceText || "Player's Handbook",
    isOfficial,
    sourceUrl,
    description: description || `Предыстория ${nameRu}.`,
    skillProficiencies: skills,
    toolProficiencies: tools,
    languages,
    equipment,
    startingGold,
    feature: {
      name: featureName || 'Особенность предыстории',
      description: featureDescLines.join('\n\n') || 'Описание умения отсутствует.',
    },
    alternativeFeatures: altFeatures.length > 0 ? altFeatures : undefined,
    suggestedCharacteristics: (personalityTraits.length || ideals.length || bonds.length || flaws.length) ? {
      personalityTraits,
      ideals,
      bonds,
      flaws,
    } : undefined,
  };
}

export function formatBackgroundMarkdown(bg: ParsedBackgroundData): string {
  const parts: string[] = [];

  parts.push(`# 📜 ${bg.nameRu} [${bg.nameEn}]`);
  parts.push(`**Источник:** *${bg.source}* (${bg.isOfficial ? 'Официальный контент WotC' : 'Сторонний контент / Homebrew'})`);
  parts.push(`**Ссылка на dnd.su:** [${bg.nameRu}](${bg.sourceUrl})\n`);

  parts.push(`### 📖 Описание`);
  parts.push(bg.description || '*Нет описания.*');
  parts.push('');

  parts.push(`### 🛠️ Владения и параметры`);
  parts.push(`- **Владение навыками:** ${bg.skillProficiencies.length > 0 ? bg.skillProficiencies.join(', ') : 'Нет'}`);
  parts.push(`- **Владение инструментами:** ${bg.toolProficiencies.length > 0 ? bg.toolProficiencies.join(', ') : 'Нет'}`);
  parts.push(`- **Языки:** ${bg.languages.length > 0 ? bg.languages.join(', ') : 'Нет'}`);
  parts.push(`- **Снаряжение:** ${bg.equipment || 'Стандартный набор'}`);
  parts.push(`- **Стартовое золото:** ${bg.startingGold} зм`);
  parts.push('');

  parts.push(`### 🛡️ Умение: ${bg.feature.name}`);
  parts.push(bg.feature.description);
  parts.push('');

  if (bg.alternativeFeatures && bg.alternativeFeatures.length > 0) {
    for (const alt of bg.alternativeFeatures) {
      parts.push(`### 🔄 Альтернативное умение: ${alt.name}`);
      parts.push(alt.description);
      parts.push('');
    }
  }

  if (bg.suggestedCharacteristics) {
    parts.push(`### 🎭 Персонализация`);
    const sc = bg.suggestedCharacteristics;
    if (sc.personalityTraits.length > 0) {
      parts.push(`#### 🎲 Черты характера`);
      sc.personalityTraits.forEach((t, i) => parts.push(`${i + 1}. ${t}`));
      parts.push('');
    }
    if (sc.ideals.length > 0) {
      parts.push(`#### ⚖️ Идеалы`);
      sc.ideals.forEach((t, i) => parts.push(`${i + 1}. ${t}`));
      parts.push('');
    }
    if (sc.bonds.length > 0) {
      parts.push(`#### 🔗 Привязанности`);
      sc.bonds.forEach((t, i) => parts.push(`${i + 1}. ${t}`));
      parts.push('');
    }
    if (sc.flaws.length > 0) {
      parts.push(`#### ⚠️ Слабости`);
      sc.flaws.forEach((t, i) => parts.push(`${i + 1}. ${t}`));
      parts.push('');
    }
  }

  return parts.join('\n');
}

export async function fetchBackgroundList(): Promise<{ href: string; title: string }[]> {
  console.log('📡 Запрос каталога предысторий: https://dnd.su/backgrounds/ ...');
  const res = await fetch('https://dnd.su/backgrounds/');
  if (!res.ok) {
    throw new Error(`Failed to fetch https://dnd.su/backgrounds/ (status ${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const map = new Map<string, string>();
  $('a[href*="/backgrounds/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = cleanText($(el).text());
    if (
      href &&
      href !== '/backgrounds/' &&
      href !== 'https://dnd.su/backgrounds/' &&
      !href.includes('/homebrew/') &&
      !href.includes('next.dnd.su') &&
      !text.toLowerCase().startsWith('адаптация предысторий') &&
      text
    ) {
      const cleanHref = href.startsWith('http') ? href : `https://dnd.su${href}`;
      if (!map.has(cleanHref)) {
        map.set(cleanHref, text);
      }
    }
  });

  return Array.from(map.entries()).map(([href, title]) => ({ href, title }));
}

export async function fetchAndParseBackground(urlOrQuery: string): Promise<ParsedBackgroundData> {
  let targetUrl = urlOrQuery.trim();
  if (!targetUrl.startsWith('http')) {
    const list = await fetchBackgroundList();
    const query = urlOrQuery.toLowerCase().trim();
    const match = list.find(item => item.title.toLowerCase().includes(query) || item.href.toLowerCase().includes(query));
    if (!match) {
      throw new Error(`Предыстория по запросу "${urlOrQuery}" не найдена в каталоге dnd.su`);
    }
    targetUrl = match.href;
  }

  console.log(`🌐 Скачивание: ${targetUrl} ...`);
  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${targetUrl} (status ${res.status})`);
  }
  const html = await res.text();
  return parseBackgroundHtml(html, targetUrl);
}

export async function fetchAllOfficialBackgrounds(options: { limit?: number } = {}): Promise<ParsedBackgroundData[]> {
  const list = await fetchBackgroundList();
  console.log(`🔎 Всего предысторий в каталоге: ${list.length}`);

  const targetList = options.limit ? list.slice(0, options.limit) : list;
  const officialBackgrounds: ParsedBackgroundData[] = [];

  const cacheDir = path.resolve('.dndsu-cache/backgrounds');
  fs.mkdirSync(cacheDir, { recursive: true });

  for (let i = 0; i < targetList.length; i++) {
    const item = targetList[i];
    try {
      console.log(`[${i + 1}/${targetList.length}] Загрузка: ${item.title} (${item.href})`);
      const res = await fetch(item.href);
      if (!res.ok) {
        console.warn(`⚠️ Ошибка загрузки ${item.href}: ${res.status}`);
        continue;
      }
      const html = await res.text();
      const parsed = parseBackgroundHtml(html, item.href);

      if (parsed.isOfficial) {
        officialBackgrounds.push(parsed);
        // Save individual markdown
        const md = formatBackgroundMarkdown(parsed);
        fs.writeFileSync(path.join(cacheDir, `${parsed.id}.md`), md, 'utf8');
        console.log(`  ✅ [ОФИЦИАЛЬНАЯ] ${parsed.nameRu} [${parsed.nameEn}] -> .dndsu-cache/backgrounds/${parsed.id}.md`);
      } else {
        console.log(`  ⏭️ [ПРОПУСК] ${parsed.nameRu} — сторонний источник: ${parsed.source}`);
      }

      // Polite latency delay between requests
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ Ошибка обработки ${item.href}:`, err);
    }
  }

  // Save full master files
  const masterJsonPath = path.resolve('.dndsu-cache/backgrounds.json');
  fs.writeFileSync(masterJsonPath, JSON.stringify(officialBackgrounds, null, 2), 'utf8');

  const masterMdPath = path.resolve('.dndsu-cache/backgrounds.md');
  const masterMd = [
    `# 📜 Каталог официальных предысторий D&D 5e (WotC / dnd.su)`,
    `*Всего извлечено официальных предысторий: ${officialBackgrounds.length}*`,
    `\n## 📑 Оглавление:`,
    ...officialBackgrounds.map((bg, idx) => `${idx + 1}. [${bg.nameRu} (${bg.nameEn})](#-${slugify(bg.nameRu)}-${slugify(bg.nameEn)}) — *${bg.source}*`),
    '\n---\n',
    ...officialBackgrounds.map(bg => formatBackgroundMarkdown(bg)),
  ].join('\n\n');
  fs.writeFileSync(masterMdPath, masterMd, 'utf8');

  console.log(`\n🎉 Сбор завершён! Сохранено ${officialBackgrounds.length} официальных предысторий.`);
  console.log(`📁 Индивидуальные файлы: .dndsu-cache/backgrounds/*.md`);
  console.log(`📄 Сводный Markdown: .dndsu-cache/backgrounds.md`);
  console.log(`📦 Сводный JSON: .dndsu-cache/backgrounds.json`);

  return officialBackgrounds;
}

// CLI Execution
const isDirectCli = typeof process !== 'undefined' && process.argv[1] && (
  process.argv[1].endsWith('fetch-dndsu-backgrounds.ts') || 
  process.argv[1].endsWith('fetch-dndsu-backgrounds.js')
);

if (isDirectCli) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
📜 D&D 5e Backgrounds Parser (dnd.su)

Использование:
  npx tsx scripts/fetch-dndsu-backgrounds.ts --all                 Скачать и распарсить ВСЕ официальные предыстории
  npx tsx scripts/fetch-dndsu-backgrounds.ts --all --limit 5      Тестовый прогон на первых 5 предысториях
  npx tsx scripts/fetch-dndsu-backgrounds.ts <запрос или URL>     Скачать одну конкретную предысторию

Примеры:
  npx tsx scripts/fetch-dndsu-backgrounds.ts солдат
  npx tsx scripts/fetch-dndsu-backgrounds.ts acolyte
  npx tsx scripts/fetch-dndsu-backgrounds.ts https://dnd.su/backgrounds/766-acolyte/
    `);
    process.exit(0);
  }

  if (args.includes('--all')) {
    const limitIdx = args.indexOf('--limit');
    const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;
    fetchAllOfficialBackgrounds({ limit }).catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
  } else {
    const query = args.join(' ');
    fetchAndParseBackground(query)
      .then(bg => {
        const md = formatBackgroundMarkdown(bg);
        const cacheDir = path.resolve('.dndsu-cache/backgrounds');
        fs.mkdirSync(cacheDir, { recursive: true });
        const filePath = path.join(cacheDir, `${bg.id}.md`);
        fs.writeFileSync(filePath, md, 'utf8');
        console.log(`\n✅ Предыстория успешно спарсена:\n`);
        console.log(md);
        console.log(`\n💾 Сохранено в: ${filePath}`);
      })
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  }
}
