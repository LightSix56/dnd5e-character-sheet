import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// ── Configuration & Mappings ──

const CACHE_DIR = path.resolve(process.cwd(), '.dndsu-cache');
const SPELLS_CACHE_DIR = path.join(CACHE_DIR, 'spells');
const CATALOG_CACHE_FILE = path.join(CACHE_DIR, 'spells-catalog.json');
const OUTPUT_FILE = path.join(CACHE_DIR, 'all-official-spells.json');

export const DND_CLASS_ID_MAP: Record<number, string> = {
  21: 'волшебник',
  12: 'бард',
  22: 'друид',
  13: 'жрец',
  23: 'изобретатель',
  20: 'колдун',
  16: 'паладин',
  17: 'следопыт',
  19: 'чародей',
};

export const DND_SCHOOL_ID_MAP: Record<number, { ru: string; en: string }> = {
  1: { ru: 'воплощение', en: 'Evocation' },
  2: { ru: 'вызов', en: 'Conjuration' },
  3: { ru: 'иллюзия', en: 'Illusion' },
  4: { ru: 'некромантия', en: 'Necromancy' },
  5: { ru: 'ограждение', en: 'Abjuration' },
  6: { ru: 'очарование', en: 'Enchantment' },
  7: { ru: 'преобразование', en: 'Transmutation' },
  8: { ru: 'прорицание', en: 'Divination' },
};

export const DND_SOURCE_ID_MAP: Record<number, { code: string; name: string; isOfficial: boolean }> = {
  102: { code: 'PH14', name: "Player's Handbook", isOfficial: true },
  107: { code: 'PotA', name: 'Princes of the Apocalypse', isOfficial: true },
  108: { code: 'SCAG', name: "Sword Coast Adventurer's Guide", isOfficial: true },
  109: { code: 'XGE', name: "Xanathar's Guide to Everything", isOfficial: true },
  112: { code: 'GGtR', name: "Guildmasters' Guide to Ravnica", isOfficial: true },
  115: { code: 'AI', name: 'Acquisitions Incorporated', isOfficial: true },
  116: { code: 'EGtW', name: "Explorer's Guide to Wildemount", isOfficial: true },
  117: { code: 'TCE', name: "Tasha's Cauldron of Everything", isOfficial: true },
  120: { code: 'IDRotF', name: 'Icewind Dale: Rime of the Frostmaiden', isOfficial: true },
  152: { code: 'FTD', name: "Fizban's Treasury of Dragons", isOfficial: true },
  153: { code: 'LLoK', name: 'Lost Laboratory of Kwalish', isOfficial: true },
  155: { code: 'SCC', name: 'Strixhaven: A Curriculum of Chaos', isOfficial: true },
  160: { code: 'SAiS', name: 'Spelljammer: Adventures in Space', isOfficial: true },
  205: { code: 'PAM', name: 'Planescape: Adventures in the Multiverse', isOfficial: true },
  207: { code: 'BMT', name: 'The Book of Many Things', isOfficial: true },
  // Homebrew sources to explicitly ignore
  156: { code: 'MHH', name: 'Midgard Heroes Handbook', isOfficial: false },
  179: { code: 'LL', name: 'laserllama', isOfficial: false },
  190: { code: 'VSoS', name: "Valda's Spire of Secrets", isOfficial: false },
  210: { code: 'RGYR', name: "Ryoko's Guide to the Yokai Realms", isOfficial: false },
  310: { code: 'SoA', name: 'Spark of Alastas', isOfficial: false },
};

// ── Types ──

export interface DndSpellComponents {
  v: boolean;
  s: boolean;
  m?: string;
  raw: string;
  costly?: boolean;
  consumed?: boolean;
}

export interface DndSpellSubclass {
  name: string;
  class: string;
  raw: string;
}

export interface DndSpellSource {
  code: string;
  name: string;
}

export interface ParsedSpell {
  id: string;
  name: string;
  nameEn: string;
  level: number;
  school: string;
  schoolEn?: string;
  castingTime: string;
  range: string;
  components: DndSpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  classes: string[];
  optionalClasses: string[];
  subclasses: DndSpellSubclass[];
  sources: DndSpellSource[];
  sourceBook: string;
  description: string;
  higherLevels?: string;
  dndsuUrl: string;
  damage?: string;
  damageType?: string;
  save?: string;
}

export interface CatalogCard {
  title: string;
  title_en: string;
  link: string;
  level: string;
  school: string;
  item_prefix: number;
  item_tags: Record<string, { tag_value: string; tag_title: string }> | any[];
  filter_level: number[];
  filter_class: number[];
  filter_class_tce: number[];
  filter_archetype: number[];
  filter_source: number[];
  filter_school: number[];
  filter_concentration: string[];
  filter_ritual: string[];
  filter_casttime: string[];
  filter_damtype: number[];
}

// ── Helper Functions ──

function ensureDirs() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (!fs.existsSync(SPELLS_CACHE_DIR)) fs.mkdirSync(SPELLS_CACHE_DIR, { recursive: true });
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

// ── Fetch Catalog ──

export async function fetchSpellCatalog(): Promise<CatalogCard[]> {
  ensureDirs();

  if (fs.existsSync(CATALOG_CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CATALOG_CACHE_FILE, 'utf-8'));
      if (Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch {
      // ignore cache read error and refetch
    }
  }

  console.log('Fetching catalog index from https://dnd.su/piece/spells/index-list/ ...');
  const res = await fetch('https://dnd.su/piece/spells/index-list/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch spells index-list: HTTP ${res.status}`);
  }

  const text = await res.text();
  const match = text.match(/window\.LIST\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i);
  if (!match) {
    throw new Error('Failed to parse window.LIST from dnd.su piece response');
  }

  const data = JSON.parse(match[1]);
  const allCards: CatalogCard[] = data.cards || [];

  // Filter for official spells (exclude third-party / homebrew)
  const officialCards = allCards.filter(card => {
    const sources = card.filter_source || [];
    const hasUnofficial = sources.some(sId => {
      const srcInfo = DND_SOURCE_ID_MAP[sId];
      return srcInfo && !srcInfo.isOfficial;
    });
    return !hasUnofficial;
  });

  fs.writeFileSync(CATALOG_CACHE_FILE, JSON.stringify(officialCards, null, 2), 'utf-8');
  console.log(`Catalog saved: ${officialCards.length} official spells found.`);
  return officialCards;
}

// ── Fetch Single Spell HTML ──

export async function fetchSpellHtml(link: string): Promise<string> {
  ensureDirs();
  const slug = link.replace(/^\/spells\//, '').replace(/\/$/, '');
  const cachePath = path.join(SPELLS_CACHE_DIR, `${slug}.html`);

  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf-8');
  }

  const url = `https://dnd.su${link}`;
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      fs.writeFileSync(cachePath, html, 'utf-8');
      return html;
    } catch (err: any) {
      lastError = err;
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 400 * attempt));
      }
    }
  }

  throw new Error(`Failed to fetch spell page ${url} after 3 attempts: ${lastError?.message}`);
}

// ── Parse Single Spell ──

export function parseSpellPage(html: string, link: string, catalogEntry?: CatalogCard): ParsedSpell {
  const $ = cheerio.load(html);
  const slug = link.replace(/^\/spells\//, '').replace(/\/$/, '');

  // 1. Name & English Name
  let nameRu = '';
  let nameEn = '';
  const copySpan = $('h2.card-title span[data-copy]').first();
  if (copySpan.length > 0) {
    const copyText = copySpan.attr('data-copy') || '';
    const m = copyText.match(/^(.*?)\s*\[(.*?)\]$/);
    if (m) {
      nameRu = cleanText(m[1]);
      nameEn = cleanText(m[2]);
    } else {
      nameRu = cleanText(copyText);
    }
  }

  if (!nameRu && catalogEntry) {
    nameRu = catalogEntry.title;
    nameEn = catalogEntry.title_en;
  }

  if (!nameRu) {
    const titleEl = $('h2.card-title').first().clone();
    titleEl.find('.source-plaque, .badge, .card-menu').remove();
    const raw = cleanText(titleEl.text());
    const m = raw.match(/^(.*?)\s*\[(.*?)\]/);
    if (m) {
      nameRu = cleanText(m[1]);
      nameEn = cleanText(m[2]);
    } else {
      nameRu = raw;
    }
  }

  // 2. Sources
  const sources: DndSpellSource[] = [];
  $('h2.card-title .source-plaque').each((_, el) => {
    const title = $(el).attr('title') || '';
    const code = $(el).text().trim();
    if (code && !sources.some(s => s.code === code)) {
      sources.push({ code, name: title || code });
    }
  });

  if (sources.length === 0 && catalogEntry?.filter_source) {
    for (const sId of catalogEntry.filter_source) {
      const srcInfo = DND_SOURCE_ID_MAP[sId];
      if (srcInfo) {
        sources.push({ code: srcInfo.code, name: srcInfo.name });
      }
    }
  }

  const primarySource = sources[0]?.name || (catalogEntry?.filter_source?.[0] ? DND_SOURCE_ID_MAP[catalogEntry.filter_source[0]]?.name : "Player's Handbook");

  // 3. Level & School
  const subtitle = cleanText($('.size-type-alignment').first().text());
  let level = 0;
  let school = '';
  let schoolEn = '';
  let isRitual = subtitle.toLowerCase().includes('ритуал');

  if (catalogEntry) {
    level = catalogEntry.item_prefix ?? (catalogEntry.level === 'Заговор' ? 0 : parseInt(catalogEntry.level, 10));
    if (Array.isArray(catalogEntry.filter_ritual) && catalogEntry.filter_ritual.includes('2')) {
      isRitual = true;
    }
  }

  if (subtitle.toLowerCase().includes('заговор')) {
    level = 0;
    const parts = subtitle.replace(/\(ритуал\)/gi, '').split(',');
    school = cleanText(parts[1] || parts[0]);
  } else {
    const m = subtitle.match(/(\d+)\s+уровень/i);
    if (m) level = parseInt(m[1], 10);
    school = subtitle
      .replace(/(\d+)\s+уровень/i, '')
      .replace(/\(ритуал\)/gi, '')
      .replace(/,/g, '')
      .trim();
  }

  // Match English school name and clean base school name
  if (catalogEntry?.filter_school?.[0]) {
    const sInfo = DND_SCHOOL_ID_MAP[catalogEntry.filter_school[0]];
    if (sInfo) {
      school = sInfo.ru;
      schoolEn = sInfo.en;
    }
  } else {
    school = school.split('(')[0].trim().toLowerCase();
  }

  // 4. Params parsing
  let castingTime = '';
  let range = '';
  let componentsRaw = '';
  let duration = '';
  const rawClasses: string[] = [];
  const optionalClasses: string[] = [];
  const rawSubclasses: string[] = [];

  $('ul.params li').each((_, el) => {
    const li = $(el);
    const text = cleanText(li.text());

    if (text.startsWith('Время накладывания:')) {
      castingTime = cleanText(text.replace('Время накладывания:', ''));
    } else if (text.startsWith('Дистанция:')) {
      range = cleanText(text.replace('Дистанция:', ''));
    } else if (text.startsWith('Компоненты:')) {
      componentsRaw = cleanText(text.replace('Компоненты:', ''));
    } else if (text.startsWith('Длительность:')) {
      duration = cleanText(text.replace('Длительность:', ''));
    } else if (text.startsWith('Классы:')) {
      // Check for TCE or other optional classes marked via <sup>
      li.find('sup').each((_, sup) => {
        const supText = $(sup).text().trim();
        const prevNode = $(sup)[0]?.prev;
        const prevData = prevNode && (prevNode as any).data ? (prevNode as any).data : '';
        if (prevData && (supText === 'TCE' || supText.includes('TCE'))) {
          const parts = prevData.split(',');
          const lastPart = cleanText(parts[parts.length - 1] || '').toLowerCase();
          if (lastPart && !optionalClasses.includes(lastPart)) {
            optionalClasses.push(lastPart);
          }
        }
      });

      // Remove sup elements to cleanly extract base classes
      const clonedLi = li.clone();
      clonedLi.find('sup').remove();
      const rawClsText = cleanText(clonedLi.text().replace('Классы:', ''));
      rawClsText.split(',').forEach(c => {
        const cl = cleanText(c).toLowerCase();
        if (cl && !rawClasses.includes(cl)) {
          rawClasses.push(cl);
        }
      });
    } else if (text.startsWith('Подклассы:')) {
      const rawSubText = cleanText(text.replace('Подклассы:', ''));
      rawSubText.split(',').forEach(s => {
        const sc = cleanText(s);
        if (sc && !rawSubclasses.includes(sc)) {
          rawSubclasses.push(sc);
        }
      });
    }
  });

  // Fallback / enrich classes from catalogEntry if available
  if (catalogEntry) {
    if (catalogEntry.filter_class && catalogEntry.filter_class.length > 0) {
      for (const cId of catalogEntry.filter_class) {
        const cName = DND_CLASS_ID_MAP[cId];
        if (cName && !rawClasses.includes(cName)) {
          rawClasses.push(cName);
        }
      }
    }
    if (catalogEntry.filter_class_tce && catalogEntry.filter_class_tce.length > 0) {
      for (const cId of catalogEntry.filter_class_tce) {
        const cName = DND_CLASS_ID_MAP[cId];
        if (cName && !optionalClasses.includes(cName)) {
          optionalClasses.push(cName);
        }
      }
    }
  }

  // 5. Subclasses structured parsing
  const subclasses: DndSpellSubclass[] = [];
  for (const rawSub of rawSubclasses) {
    const m = rawSub.match(/^(.*?)\s*\((.*?)\)$/);
    if (m) {
      subclasses.push({
        name: cleanText(m[1]),
        class: cleanText(m[2]).toLowerCase(),
        raw: rawSub,
      });
    } else {
      subclasses.push({
        name: rawSub,
        class: '',
        raw: rawSub,
      });
    }
  }

  // 6. Components structured breakdown
  const v = componentsRaw.includes('В') || componentsRaw.includes('V');
  const s = componentsRaw.includes('С') || componentsRaw.includes('S');
  let m = '';
  const mMatch = componentsRaw.match(/\(([^)]+)\)/);
  if (mMatch) {
    m = cleanText(mMatch[1]);
  } else if (componentsRaw.includes('М') || componentsRaw.includes('M')) {
    m = 'материальный компонент';
  }

  const concentration = duration.toLowerCase().includes('концентрация') ||
    (Array.isArray(catalogEntry?.filter_concentration) && catalogEntry?.filter_concentration.includes('2'));

  const isConsumed = m.toLowerCase().includes('расходуем') || m.toLowerCase().includes('тратит');
  const hasCost = /(?:\d[\d\s]*)\s*(?:зм|мм|см|эм|sp|gp|cp|ep|pp)(?![а-яё])/i.test(m);

  // 7. Description & Higher levels
  const descEl = $('[itemprop="description"]');
  let higherLevels = '';
  const paragraphs: string[] = [];

  descEl.children().each((_, child) => {
    const text = cleanText($(child).text());
    if (!text) return;

    if (text.startsWith('На больших уровнях') || text.startsWith('На более высоких уровнях')) {
      higherLevels = cleanText(text.replace(/^На (?:больших|более высоких) уровнях[:.]?\s*/i, ''));
    } else {
      paragraphs.push(text);
    }
  });

  let fullDescription = paragraphs.join('\n\n');
  if (!fullDescription) {
    fullDescription = cleanText(descEl.text());
  }

  return {
    id: slug,
    name: nameRu,
    nameEn,
    level,
    school,
    schoolEn: schoolEn || undefined,
    castingTime,
    range,
    components: {
      v,
      s,
      m: m || undefined,
      raw: componentsRaw,
      costly: hasCost ? true : undefined,
      consumed: isConsumed ? true : undefined,
    },
    duration,
    concentration,
    ritual: isRitual,
    classes: rawClasses.filter(c => !optionalClasses.includes(c)),
    optionalClasses,
    subclasses,
    sources,
    sourceBook: primarySource,
    description: fullDescription,
    higherLevels: higherLevels || undefined,
    dndsuUrl: `https://dnd.su${link}`,
  };
}

// ── Crawl All Spells ──

export async function crawlAllSpells(limit?: number): Promise<ParsedSpell[]> {
  const catalog = await fetchSpellCatalog();
  const toProcess = limit ? catalog.slice(0, limit) : catalog;
  console.log(`Starting processing of ${toProcess.length} official spells...`);

  const results: ParsedSpell[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const card = toProcess[i];
    try {
      const html = await fetchSpellHtml(card.link);
      const parsed = parseSpellPage(html, card.link, card);
      results.push(parsed);

      if (i % 25 === 0 || i === toProcess.length - 1) {
        console.log(`[${i + 1}/${toProcess.length}] Parsed: ${parsed.name} (${parsed.nameEn}) - Level ${parsed.level}`);
      }

      // Gentle rate-limiting for non-cached network requests
      const slug = card.link.replace(/^\/spells\//, '').replace(/\/$/, '');
      const cachePath = path.join(SPELLS_CACHE_DIR, `${slug}.html`);
      if (!fs.existsSync(cachePath)) {
        await new Promise(r => setTimeout(r, 120));
      }
    } catch (err: any) {
      console.error(`Error parsing spell ${card.link}:`, err.message);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✅ Completed! Successfully processed ${results.length} spells. Saved to ${OUTPUT_FILE}`);
  return results;
}

// ── CLI Runner ──

async function main() {
  const args = process.argv.slice(2);
  const testFlag = args.includes('--test');
  const crawlFlag = args.includes('--crawl');
  const singleArgIdx = args.indexOf('--single');

  if (testFlag) {
    console.log('🧪 Running Test Suite on 6 Diverse Spells...');
    const testLinks = [
      '/spells/268-eldritch-blast/',      // Cantrip (Warlock staple)
      '/spells/70-shield/',               // Level 1 Reaction with 4 subclasses
      '/spells/49-detect-magic/',         // Level 1 Ritual
      '/spells/170-feather-fall/',         // Level 3 with TCE expanded classes
      '/spells/13-fireball/',             // Level 3 Evocation with Upcasting
      '/spells/56-revivify/',             // Level 3 Necromancy with 300 gp costly consumed diamond
    ];

    for (const link of testLinks) {
      console.log(`\n==================================================`);
      const html = await fetchSpellHtml(link);
      const spell = parseSpellPage(html, link);
      console.log(`🔮 ${spell.name} [${spell.nameEn}]`);
      console.log(`Уровень: ${spell.level === 0 ? 'Заговор' : spell.level + ' ур.'} | Школа: ${spell.school} | Ритуал: ${spell.ritual}`);
      console.log(`Время: ${spell.castingTime} | Дистанция: ${spell.range}`);
      console.log(`Компоненты: ${spell.components.raw} ${spell.components.costly ? '💰 [Дорогой]' : ''} ${spell.components.consumed ? '🔥 [Расходуется]' : ''}`);
      console.log(`Длительность: ${spell.duration} ${spell.concentration ? '🧠 [Концентрация]' : ''}`);
      console.log(`Классы: ${spell.classes.join(', ')}`);
      if (spell.optionalClasses.length > 0) {
        console.log(`Опциональные классы (TCE): ${spell.optionalClasses.join(', ')}`);
      }
      if (spell.subclasses.length > 0) {
        console.log(`Подклассы: ${spell.subclasses.map(s => `${s.name} (${s.class})`).join(', ')}`);
      }
      console.log(`Источник: ${spell.sourceBook} (${spell.sources.map(s => s.code).join(', ')})`);
      if (spell.higherLevels) {
        console.log(`На больших уровнях: ${spell.higherLevels.substring(0, 120)}...`);
      }
      console.log(`Описание: ${spell.description.substring(0, 120)}...`);
    }
  } else if (singleArgIdx !== -1 && args[singleArgIdx + 1]) {
    const query = args[singleArgIdx + 1];
    const catalog = await fetchSpellCatalog();
    const found = catalog.find(c => c.link.includes(query) || c.title.toLowerCase().includes(query.toLowerCase()) || c.title_en.toLowerCase().includes(query.toLowerCase()));
    if (!found) {
      console.error(`Spell not found for query: ${query}`);
      return;
    }
    const html = await fetchSpellHtml(found.link);
    const spell = parseSpellPage(html, found.link, found);
    console.log(JSON.stringify(spell, null, 2));
  } else if (crawlFlag) {
    await crawlAllSpells();
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/parse-dndsu-spells.ts --test          # Test on 6 diverse spells');
    console.log('  npx tsx scripts/parse-dndsu-spells.ts --single <name> # Parse single spell');
    console.log('  npx tsx scripts/parse-dndsu-spells.ts --crawl         # Crawl and cache all official spells');
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
