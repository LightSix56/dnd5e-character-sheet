import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// ── Configuration & Mappings ──

const CACHE_DIR = path.resolve(process.cwd(), '.dndsu-cache');
const FEATS_CACHE_DIR = path.join(CACHE_DIR, 'feats');
const OUTPUT_FILE = path.join(CACHE_DIR, 'all-official-feats.json');
const COMPENDIUM_FEATS_FILE = path.resolve(process.cwd(), 'src/data/compendium/feats.ts');

export interface CompendiumFeat {
  id: string;
  name: string;
  nameEn: string;
  category: 'Черта' | 'Классовое' | 'Расовое' | 'Прочее';
  source?: string;
  prerequisite?: string;
  abilityBonus?: string;
  summary: string;
  description: string;
  dndsuUrl?: string;
}

interface FeatCatalogItem {
  link: string;
  id: string;
  slug: string;
  name: string;
}

function ensureDirs() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (!fs.existsSync(FEATS_CACHE_DIR)) fs.mkdirSync(FEATS_CACHE_DIR, { recursive: true });
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

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

// ── Ability Bonus Detection ──

export function detectAbilityBonus(text: string): string | undefined {
  const t = text.toLowerCase();

  // Any stat choice
  if (t.includes('выбранной характеристики на 1')) {
    return '+1 к выбранной характеристике';
  }
  if (
    t.includes('характеристики по вашему выбору на 1') || 
    t.includes('одной характеристики на ваш выбор') ||
    t.includes('одной вашей характеристики')
  ) {
    return '+1 к любой характеристике';
  }

  // 4 stats
  if (t.includes('ловкости, интеллекта, мудрости или харизмы на 1')) {
    return '+1 ЛОВ, ИНТ, МДР или ХАР';
  }

  // 3 stats
  if (t.includes('интеллекта, мудрости или харизмы на 1')) {
    return '+1 ИНТ, МДР или ХАР';
  }
  if (t.includes('ловкости, телосложения или харизмы на 1')) {
    return '+1 ЛОВ, ТЕЛ или ХАР';
  }
  if (t.includes('силы, телосложения или харизмы на 1')) {
    return '+1 СИЛ, ТЕЛ или ХАР';
  }
  if (t.includes('силы, мудрости или харизмы на 1')) {
    return '+1 СИЛ, МДР или ХАР';
  }
  if (t.includes('силы, ловкости или телосложения на 1')) {
    return '+1 СИЛ, ЛОВ или ТЕЛ';
  }
  if (t.includes('силы, телосложения или мудрости на 1')) {
    return '+1 СИЛ, ТЕЛ или МДР';
  }
  if (t.includes('телосложения, мудрости или харизмы на 1')) {
    return '+1 ТЕЛ, МДР или ХАР';
  }

  // 2 stats
  if (t.includes('силы или ловкости на 1')) return '+1 СИЛ или ЛОВ';
  if (t.includes('силы или телосложения на 1')) return '+1 СИЛ или ТЕЛ';
  if (t.includes('ловкости или интеллекта на 1')) return '+1 ЛОВ или ИНТ';
  if (t.includes('ловкости или телосложения на 1')) return '+1 ЛОВ или ТЕЛ';
  if (t.includes('интеллекта или харизмы на 1')) return '+1 ИНТ или ХАР';
  if (t.includes('интеллекта или мудрости на 1')) return '+1 ИНТ или МДР';
  if (t.includes('телосложения или мудрости на 1')) return '+1 ТЕЛ или МДР';
  if (t.includes('мудрости или харизмы на 1')) return '+1 МДР или ХАР';

  // 1 stat
  if (t.includes('значение силы на 1') || t.includes('вашей силы на 1')) return '+1 СИЛ';
  if (t.includes('значение ловкости на 1') || t.includes('вашей ловкости на 1')) return '+1 ЛОВ';
  if (t.includes('значение телосложения на 1') || t.includes('вашего телосложения на 1')) return '+1 ТЕЛ';
  if (t.includes('значение интеллекта на 1') || t.includes('вашего интеллекта на 1')) return '+1 ИНТ';
  if (t.includes('значение мудрости на 1') || t.includes('вашей мудрости на 1')) return '+1 МДР';
  if (t.includes('значение харизмы на 1') || t.includes('вашей харизмы на 1')) return '+1 ХАР';

  return undefined;
}

// ── Catalog Fetcher ──

export async function fetchFeatsCatalog(): Promise<FeatCatalogItem[]> {
  ensureDirs();
  console.log('Fetching feats catalog from https://dnd.su/feats/ ...');

  const res = await fetch('https://dnd.su/feats/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch feats catalog: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const feats: FeatCatalogItem[] = [];
  const seen = new Set<string>();

  $('a[href^="/feats/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const m = href.match(/^\/feats\/(\d+)-([a-z0-9_-]+)\/$/);
    if (m && !seen.has(href)) {
      seen.add(href);
      const rawName = cleanText($(a).text());
      feats.push({
        link: href,
        id: m[2],
        slug: `${m[1]}-${m[2]}`,
        name: rawName,
      });
    }
  });

  console.log(`Found ${feats.length} official feats in catalog.`);
  return feats;
}

// ── Single Feat HTML Fetcher ──

export async function fetchFeatHtml(link: string, slug: string): Promise<string> {
  ensureDirs();
  const cachePath = path.join(FEATS_CACHE_DIR, `${slug}.html`);

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

  throw new Error(`Failed to fetch ${url} after 3 attempts: ${lastError?.message}`);
}

// ── Single Feat Page Parser ──

export function parseFeatPage(html: string, link: string, fallbackSlug: string): CompendiumFeat {
  const $ = cheerio.load(html);

  // 1. Name & English Name
  let nameRu = '';
  let nameEn = '';
  const titleEl = $('h2.card-title').first();
  const copySpan = titleEl.find('span[data-copy]').first();

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

  if (!nameRu) {
    const clone = titleEl.clone();
    clone.find('.source-plaque, .badge, .card-menu').remove();
    const raw = cleanText(clone.text());
    const m = raw.match(/^(.*?)\s*\[(.*?)\]/);
    if (m) {
      nameRu = cleanText(m[1]);
      nameEn = cleanText(m[2]);
    } else {
      nameRu = raw;
    }
  }

  nameEn = toTitleCaseEn(nameEn);

  // 2. Sources
  const sources: string[] = [];
  titleEl.find('.source-plaque').each((_, el) => {
    const title = $(el).attr('title') || '';
    const code = $(el).text().trim();
    if (title) {
      sources.push(`${title} (${code})`);
    } else if (code) {
      sources.push(code);
    }
  });
  const sourceText = sources.join(', ') || "Player's Handbook";

  // 3. Prerequisite
  let prerequisite = '';
  const subtitle = cleanText($('.size-type-alignment').first().text());
  if (subtitle.toLowerCase().includes('требован') || subtitle.toLowerCase().includes('необходим')) {
    prerequisite = subtitle.replace(/^требовани[ея]:?\s*/i, '').replace(/^необходимо:?\s*/i, '').trim();
  }

  // 4. Description & List parsing
  const descEl = $('[itemprop="description"]');
  const paragraphs: string[] = [];
  const listItems: string[] = [];

  descEl.children().each((_, child) => {
    const tag = child.tagName ? child.tagName.toLowerCase() : '';
    const text = cleanText($(child).text());
    if (!text) return;

    if (tag === 'ul' || tag === 'ol') {
      $(child).find('li').each((_, li) => {
        const liText = cleanText($(li).text());
        if (liText) listItems.push(`• ${liText}`);
      });
    } else if (tag === 'li') {
      listItems.push(`• ${text}`);
    } else {
      // Check if this paragraph is a prerequisite line
      if (!prerequisite && (text.toLowerCase().startsWith('требовани') || text.toLowerCase().startsWith('необходимо'))) {
        prerequisite = text.replace(/^требовани[ея]:?\s*/i, '').replace(/^необходимо:?\s*/i, '').trim();
      } else {
        paragraphs.push(text);
      }
    }
  });

  let fullDescription = '';
  if (paragraphs.length > 0 && listItems.length > 0) {
    fullDescription = `${paragraphs.join('\n\n')}\n\n${listItems.join('\n')}`;
  } else if (paragraphs.length > 0) {
    fullDescription = paragraphs.join('\n\n');
  } else if (listItems.length > 0) {
    fullDescription = listItems.join('\n');
  } else {
    fullDescription = cleanText(descEl.text());
  }

  // 5. Ability Bonus Detection
  const abilityBonus = detectAbilityBonus(fullDescription);

  // 6. Summary generation (first sentence or bullet points)
  let summary = '';
  if (listItems.length > 0) {
    // Combine first 2 bullet points
    summary = listItems.slice(0, 2).map(li => li.replace(/^•\s*/, '')).join('; ');
    if (summary.length > 140) summary = summary.substring(0, 137) + '...';
  } else if (paragraphs.length > 0) {
    // First paragraph / first sentence
    const firstP = paragraphs[0];
    const sentenceMatch = firstP.match(/^([^.!?]+[.!?])/);
    summary = sentenceMatch ? sentenceMatch[1] : firstP;
    if (summary.length > 140) summary = summary.substring(0, 137) + '...';
  } else {
    summary = nameRu;
  }

  // 7. Category: check racial requirements
  const racialKeywords = ['эльф', 'дварф', 'гном', 'полурослик', 'тифлинг', 'драконорожден', 'орк', 'гоблин', 'кобольд'];
  const isRacial = racialKeywords.some(rk => (prerequisite || '').toLowerCase().includes(rk));
  const category: 'Черта' | 'Расовое' = isRacial ? 'Расовое' : 'Черта';

  return {
    id: fallbackSlug,
    name: nameRu,
    nameEn,
    category,
    source: sourceText,
    prerequisite: prerequisite || undefined,
    abilityBonus,
    summary,
    description: fullDescription,
    dndsuUrl: `https://dnd.su${link}`,
  };
}

// ── Crawl All Feats ──

export async function crawlAllFeats(): Promise<CompendiumFeat[]> {
  const catalog = await fetchFeatsCatalog();
  console.log(`Starting processing of ${catalog.length} official feats...`);

  const results: CompendiumFeat[] = [];

  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    try {
      const html = await fetchFeatHtml(item.link, item.slug);
      const feat = parseFeatPage(html, item.link, item.id);
      results.push(feat);

      if ((i + 1) % 20 === 0 || i === catalog.length - 1) {
        console.log(`[${i + 1}/${catalog.length}] Parsed: ${feat.name} (${feat.nameEn})`);
      }

      // Gentle delay for non-cached network requests
      const cachePath = path.join(FEATS_CACHE_DIR, `${item.slug}.html`);
      if (!fs.existsSync(cachePath)) {
        await new Promise(r => setTimeout(r, 120));
      }
    } catch (err: any) {
      console.error(`Error parsing feat ${item.link}:`, err.message);
    }
  }

  // Sort alphabetically by Russian name
  results.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✅ Completed! Successfully processed ${results.length} feats. Saved to ${OUTPUT_FILE}`);
  return results;
}

// ── Update src/data/compendium/feats.ts ──

export function updateCompendiumFeats(feats: CompendiumFeat[]): void {
  // Retain existing class features from old feats.ts if any (category: 'Классовое')
  const existingContent = fs.existsSync(COMPENDIUM_FEATS_FILE) ? fs.readFileSync(COMPENDIUM_FEATS_FILE, 'utf-8') : '';
  const classTraits: CompendiumFeat[] = [
    {
      id: "rage",
      name: "Ярость",
      nameEn: "Rage",
      category: "Классовое",
      source: "Варвар 1 ур.",
      summary: "Преимущество на СИЛ, бонус к урону (+2..+4), сопротивление дробящему/колющему/рубящему.",
      description: "Бонусным действием вы впадаете в ярость на 1 минуту. Преимущество на проверки и спасброски Силы; бонус к урону атаки рукопашным оружием; сопротивление дробящему, колющему и рубящему урону. Нельзя творить заклинания и концентрироваться."
    },
    {
      id: "second-wind",
      name: "Второе дыхание",
      nameEn: "Second Wind",
      category: "Классовое",
      source: "Воин 1 ур.",
      summary: "Бонусным действием восстановите 1к10 + уровень воина хитов (1/отдых).",
      description: "В свой ход вы можете бонусным действием восстановить количество хитов, равное 1d10 + ваш уровень воина. Перезаряжается после короткого или длинного отдыха."
    },
    {
      id: "action-surge",
      name: "Всплеск действий",
      nameEn: "Action Surge",
      category: "Классовое",
      source: "Воин 2 ур.",
      summary: "Одно дополнительное действие в свой ход (1/отдых, с 17 ур. 2/отдых).",
      description: "В свой ход вы можете совершить одно дополнительное действие помимо обычного и бонусного действия. Перезаряжается после короткого или длинного отдыха."
    },
    {
      id: "sneak-attack",
      name: "Скрытая атака",
      nameEn: "Sneak Attack",
      category: "Классовое",
      source: "Плут 1 ур.",
      summary: "Дополнительный урон (от 1d6 до 10d6) при атаке фехтовальным/дальнобойным оружием с преимуществом.",
      description: "Один раз в ход вы можете нанести дополнительный урон 1d6 существу, по которому вы попали атакой, если у вас есть преимущество к броску атаки (или союзник цели находится в пределах 5 футов от нее)."
    },
    {
      id: "divine-smite",
      name: "Божественная кара",
      nameEn: "Divine Smite",
      category: "Классовое",
      source: "Паладин 2 ур.",
      summary: "Попадание оружием тратит ячейку заклинаний и наносит от 2d8 до 5d8 урона излучением (+1d8 по нежити/исчадиям).",
      description: "Когда вы попадаете по существу рукопашной атакой оружием, вы можете потратить одну ячейку заклинания паладина, чтобы нанести цели урон излучением в дополнение к урону оружия (2d8 за 1-й круг + 1d8 за каждый круг выше 1-го, макс. 5d8)."
    },
    {
      id: "cunning-action",
      name: "Хитрое действие",
      nameEn: "Cunning Action",
      category: "Классовое",
      source: "Плут 2 ур.",
      summary: "Рывок, Отход или Засада бонусным действием в каждый ход.",
      description: "Ваша скорость и проворство позволяют вам действовать молниеносно: вы можете в каждый свой ход совершать бонусное действие Рывок, Отход или Засада."
    },
    {
      id: "lay-on-hands",
      name: "Возложение рук",
      nameEn: "Lay on Hands",
      category: "Классовое",
      source: "Паладин 1 ур.",
      summary: "Целебный запас хитов (уровень × 5), трата 5 хитов излечивает отравление или болезнь.",
      description: "Ваше благословенное касание может исцелять раны. У вас есть запас целительной силы, равный вашему уровню паладина, умноженному на 5. Касанием восстанавливает хиты или нейтрализует яд/болезнь за 5 единиц."
    }
  ];

  const combinedFeats: CompendiumFeat[] = [...feats, ...classTraits];

  const fileContent = `// D&D 5e Full Feats and Traits Compendium
// 105 Official Feats parsed from dnd.su + Core Class Traits

export interface CompendiumFeat {
  id: string;
  name: string;
  nameEn: string;
  category: 'Черта' | 'Классовое' | 'Расовое' | 'Прочее';
  source?: string;
  prerequisite?: string;
  abilityBonus?: string;
  summary: string;
  description: string;
  dndsuUrl?: string;
}

export const DND_COMPENDIUM_FEATS: CompendiumFeat[] = ${JSON.stringify(combinedFeats, null, 2)};

export function findFeatByName(query: string): CompendiumFeat | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return DND_COMPENDIUM_FEATS.find(f => 
    f.name.toLowerCase() === q || 
    f.nameEn.toLowerCase() === q
  );
}

export function getFeats(): CompendiumFeat[] {
  return DND_COMPENDIUM_FEATS.filter(f => f.category === 'Черта' || f.category === 'Расовое');
}

export function getTraits(): CompendiumFeat[] {
  return DND_COMPENDIUM_FEATS.filter(f => f.category !== 'Черта' && f.category !== 'Расовое');
}
`;

  fs.writeFileSync(COMPENDIUM_FEATS_FILE, fileContent, 'utf-8');
  console.log(`✓ Updated ${COMPENDIUM_FEATS_FILE} with ${combinedFeats.length} total entries.`);
}

// ── CLI Runner ──

async function main() {
  const args = process.argv.slice(2);
  const testFlag = args.includes('--test');
  const crawlFlag = args.includes('--crawl');
  const updateCompendiumFlag = args.includes('--update-compendium');

  if (testFlag) {
    console.log('🧪 Running Feats Test Suite on 6 Diverse Feats...');
    const testItems = [
      { link: '/feats/104-war-caster/', slug: '104-war-caster', id: 'war-caster' },
      { link: '/feats/120-great-weapon-master/', slug: '120-great-weapon-master', id: 'great-weapon-master' },
      { link: '/feats/157-elven-accuracy/', slug: '157-elven-accuracy', id: 'elven-accuracy' },
      { link: '/feats/112-tavern-brawler/', slug: '112-tavern-brawler', id: 'tavern-brawler' },
      { link: '/feats/103-alert/', slug: '103-alert', id: 'alert' },
      { link: '/feats/140-fey-touched/', slug: '140-fey-touched', id: 'fey-touched' },
    ];

    for (const item of testItems) {
      console.log(`\n==================================================`);
      const html = await fetchFeatHtml(item.link, item.slug);
      const feat = parseFeatPage(html, item.link, item.id);
      console.log(`🌟 ${feat.name} [${feat.nameEn}] (${feat.category})`);
      if (feat.prerequisite) console.log(`📋 Требование: ${feat.prerequisite}`);
      if (feat.abilityBonus) console.log(`💪 Бонус характеристики: ${feat.abilityBonus}`);
      console.log(`📚 Источник: ${feat.source}`);
      console.log(`📝 Кратко: ${feat.summary}`);
      console.log(`📜 Описание: ${feat.description.substring(0, 150)}...`);
    }
  } else if (crawlFlag) {
    const feats = await crawlAllFeats();
    if (updateCompendiumFlag) {
      updateCompendiumFeats(feats);
    }
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/parse-dndsu-feats.ts --test');
    console.log('  npx tsx scripts/parse-dndsu-feats.ts --crawl');
    console.log('  npx tsx scripts/parse-dndsu-feats.ts --crawl --update-compendium');
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
