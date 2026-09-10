import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export const DND_SU_CLASSES: Record<string, { id: number; slug: string; nameRu: string; nameEn: string }> = {
  barbarian: { id: 87, slug: '87-barbarian', nameRu: 'Варвар', nameEn: 'Barbarian' },
  варвар: { id: 87, slug: '87-barbarian', nameRu: 'Варвар', nameEn: 'Barbarian' },
  bard: { id: 88, slug: '88-bard', nameRu: 'Бард', nameEn: 'Bard' },
  бард: { id: 88, slug: '88-bard', nameRu: 'Бард', nameEn: 'Bard' },
  cleric: { id: 89, slug: '89-cleric', nameRu: 'Жрец', nameEn: 'Cleric' },
  жрец: { id: 89, slug: '89-cleric', nameRu: 'Жрец', nameEn: 'Cleric' },
  druid: { id: 90, slug: '90-druid', nameRu: 'Друид', nameEn: 'Druid' },
  друид: { id: 90, slug: '90-druid', nameRu: 'Друид', nameEn: 'Druid' },
  fighter: { id: 91, slug: '91-fighter', nameRu: 'Воин', nameEn: 'Fighter' },
  воин: { id: 91, slug: '91-fighter', nameRu: 'Воин', nameEn: 'Fighter' },
  monk: { id: 93, slug: '93-monk', nameRu: 'Монах', nameEn: 'Monk' },
  монах: { id: 93, slug: '93-monk', nameRu: 'Монах', nameEn: 'Monk' },
  paladin: { id: 94, slug: '94-paladin', nameRu: 'Паладин', nameEn: 'Paladin' },
  паладин: { id: 94, slug: '94-paladin', nameRu: 'Паладин', nameEn: 'Paladin' },
  ranger: { id: 97, slug: '97-ranger', nameRu: 'Следопыт', nameEn: 'Ranger' },
  следопыт: { id: 97, slug: '97-ranger', nameRu: 'Следопыт', nameEn: 'Ranger' },
  rogue: { id: 99, slug: '99-rogue', nameRu: 'Плут', nameEn: 'Rogue' },
  плут: { id: 99, slug: '99-rogue', nameRu: 'Плут', nameEn: 'Rogue' },
  sorcerer: { id: 101, slug: '101-sorcerer', nameRu: 'Чародей', nameEn: 'Sorcerer' },
  чародей: { id: 101, slug: '101-sorcerer', nameRu: 'Чародей', nameEn: 'Sorcerer' },
  warlock: { id: 104, slug: '104-warlock', nameRu: 'Колдун', nameEn: 'Warlock' },
  колдун: { id: 104, slug: '104-warlock', nameRu: 'Колдун', nameEn: 'Warlock' },
  wizard: { id: 105, slug: '105-wizard', nameRu: 'Волшебник', nameEn: 'Wizard' },
  волшебник: { id: 105, slug: '105-wizard', nameRu: 'Волшебник', nameEn: 'Wizard' },
  artificer: { id: 137, slug: '137-artificer', nameRu: 'Изобретатель', nameEn: 'Artificer' },
  изобретатель: { id: 137, slug: '137-artificer', nameRu: 'Изобретатель', nameEn: 'Artificer' },
};

// Official WotC books for D&D 5e
export const OFFICIAL_WOTC_SOURCES = [
  "Player's Handbook",
  "Dungeon Master's Guide",
  'Sword Coast Adventurer',
  'Xanathar',
  'Tasha',
  'Fizban',
  'Glory of the Giants',
  'Ravenloft',
  'Ravnica',
  'Theros',
  'Eberron',
  'Acquisitions Incorporated',
  'Spelljammer',
  'Planescape',
  'Strixhaven',
];

export function isOfficialSource(src: string): boolean {
  if (!src) return true; // Default to official if no other source stated
  return OFFICIAL_WOTC_SOURCES.some(w => src.toLowerCase().includes(w.toLowerCase()));
}

export interface ParsedFeature {
  name: string;
  level?: number;
  levelText?: string;
  description: string;
}

export interface ParsedSubclass {
  name: string;
  source: string;
  isOfficial: boolean;
  features: ParsedFeature[];
}

export interface ParsedClassData {
  nameRu: string;
  nameEn: string;
  sourceUrl: string;
  hitDie: string;
  savingThrows: string[];
  armorProficiencies: string;
  weaponProficiencies: string;
  toolProficiencies: string;
  skillChoices: string;
  progressionTable: string[][];
  coreFeatures: ParsedFeature[];
  officialSubclasses: ParsedSubclass[];
  thirdPartySubclasses: ParsedSubclass[];
}

export async function fetchAndParseDndSuClass(input: string): Promise<{ data: ParsedClassData; markdown: string; rawSize: number; cleanSize: number }> {
  let targetUrl = '';
  const queryKey = input.trim().toLowerCase();

  if (input.trim().startsWith('http')) {
    targetUrl = input.trim();
  } else if (DND_SU_CLASSES[queryKey]) {
    targetUrl = `https://dnd.su/class/${DND_SU_CLASSES[queryKey].slug}/`;
  } else {
    const found = Object.entries(DND_SU_CLASSES).find(([k]) => queryKey.includes(k) || k.includes(queryKey));
    if (found) {
      targetUrl = `https://dnd.su/class/${found[1].slug}/`;
    } else {
      throw new Error(`Неизвестный класс «${input}». Доступные классы: ${Object.keys(DND_SU_CLASSES).filter(k => !k.match(/[a-z]/)).join(', ')}`);
    }
  }

  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru,en;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`Ошибка загрузки страницы ${targetUrl}: HTTP ${res.status} ${res.statusText}`);
  }

  const rawHtml = await res.text();
  const rawSize = Buffer.byteLength(rawHtml, 'utf8');
  const $ = cheerio.load(rawHtml);

  // 1. Title
  const titleEl = $('h2:contains("[")').first();
  const titleText = titleEl.length ? titleEl.text().trim() : $('title').text().trim();
  const ruMatch = titleText.match(/^([^\[\/]+)/);
  const enMatch = titleText.match(/\[([^\]]+)\]/);
  const nameRu = ruMatch ? ruMatch[1].trim() : input;
  const nameEn = enMatch ? enMatch[1].trim() : '';

  // 2. Base proficiencies & hit dice
  let hitDie = '';
  const savingThrows: string[] = [];
  let armorProficiencies = '';
  let weaponProficiencies = '';
  let toolProficiencies = '';
  let skillChoices = '';

  $('h4').each((_, el) => {
    const heading = $(el).text().trim().toUpperCase();
    if (heading.includes('ХИТЫ')) {
      let sib = $(el).next();
      while (sib.length && !sib[0].tagName.startsWith('h')) {
        const t = $(sib).text().trim().replace(/\s+/g, ' ');
        if (t.toLowerCase().includes('кость хитов:')) {
          hitDie = t.replace(/кость хитов:/i, '').trim();
        }
        sib = sib.next();
      }
    } else if (heading.includes('ВЛАДЕНИЕ')) {
      let sib = $(el).next();
      while (sib.length && !sib[0].tagName.startsWith('h')) {
        const t = $(sib).text().trim().replace(/\s+/g, ' ');
        if (t.toLowerCase().startsWith('доспехи:')) {
          armorProficiencies = t.replace(/доспехи:/i, '').trim();
        } else if (t.toLowerCase().startsWith('оружие:')) {
          weaponProficiencies = t.replace(/оружие:/i, '').trim();
        } else if (t.toLowerCase().startsWith('инструменты:')) {
          toolProficiencies = t.replace(/инструменты:/i, '').trim();
        } else if (t.toLowerCase().startsWith('спасброски:')) {
          const saves = t.replace(/спасброски:/i, '').trim().split(',').map(s => s.trim());
          savingThrows.push(...saves);
        } else if (t.toLowerCase().startsWith('навыки:')) {
          skillChoices = t.replace(/навыки:/i, '').trim();
        }
        sib = sib.next();
      }
    }
  });

  // 3. Progression table
  const progressionTable: string[][] = [];
  const table = $('table.class_table');
  if (table.length) {
    table.find('tr').each((_, tr) => {
      const row: string[] = [];
      $(tr).find('th, td').each((_, cell) => {
        row.push($(cell).text().trim().replace(/\s+/g, ' '));
      });
      if (row.length) progressionTable.push(row);
    });
  }

  // 4. Core Class Features (between <h2>Классовые умения and the next <h2>)
  const coreFeatures: ParsedFeature[] = [];
  const classFeaturesHeader = $('h2:contains("Классовые умения")').first();

  if (classFeaturesHeader.length) {
    let currentSib = classFeaturesHeader.next();
    let currentCore: ParsedFeature | null = null;

    while (currentSib.length && currentSib[0].tagName.toLowerCase() !== 'h2') {
      const tag = currentSib[0].tagName.toLowerCase();
      const text = currentSib.text().trim().replace(/\s+/g, ' ');

      if (tag === 'h3') {
        if (currentCore) {
          coreFeatures.push(currentCore);
        }
        currentCore = {
          name: text,
          description: '',
        };
      } else if (currentCore) {
        if (tag === 'p' || tag === 'ul' || tag === 'table' || tag === 'ol') {
          // Check for level specification (e.g. "1-й уровень, умение варвара")
          const lvlMatch = text.match(/^(\d+)[-–—]?й?\s*уровень/i);
          if (lvlMatch && !currentCore.level) {
            currentCore.level = parseInt(lvlMatch[1], 10);
            currentCore.levelText = text;
          } else {
            currentCore.description += (currentCore.description ? '\n\n' : '') + text;
          }
        }
      }

      currentSib = currentSib.next();
    }

    if (currentCore) {
      coreFeatures.push(currentCore);
    }
  }

  // 5. Subclasses / Archetypes
  const officialSubclasses: ParsedSubclass[] = [];
  const thirdPartySubclasses: ParsedSubclass[] = [];

  $('h2.hide-next-h2').each((_, h2) => {
    const subName = $(h2).text().trim().replace(/\s+/g, ' ');

    // Filter out lore / backgrounds (e.g. Углублённая предыстория)
    if (subName.toLowerCase().includes('предыстория') || subName.toLowerCase().includes('создание')) {
      return;
    }

    const wrapper = $(h2).next('.hide-wrapper');
    if (!wrapper.length) return;

    // Source book extraction
    let source = '';
    const srcEl = wrapper.find('.source, p:contains("Источник:"), em:contains("Источник:")').first();
    if (srcEl.length) {
      source = srcEl.text().trim().replace(/\s+/g, ' ');
    } else {
      source = "Player's Handbook";
    }

    const subFeatures: ParsedFeature[] = [];
    let currentSubFeature: ParsedFeature | null = null;

    wrapper.children().each((_, child) => {
      const tag = child.tagName.toLowerCase();
      const cText = $(child).text().trim().replace(/\s+/g, ' ');

      if (tag === 'h3') {
        if (currentSubFeature) {
          subFeatures.push(currentSubFeature);
        }
        currentSubFeature = {
          name: cText,
          description: '',
        };
      } else if (currentSubFeature && (tag === 'p' || tag === 'ul' || tag === 'table' || tag === 'ol')) {
        const pText = $(child).text().trim();
        if (pText) {
          const lvlMatch = pText.match(/(\d+)[-–—]?й?\s*уровень/i);
          if (lvlMatch && !currentSubFeature.level) {
            currentSubFeature.level = parseInt(lvlMatch[1], 10);
            currentSubFeature.levelText = pText;
          } else {
            currentSubFeature.description += (currentSubFeature.description ? '\n\n' : '') + pText;
          }
        }
      }
    });

    if (currentSubFeature) {
      subFeatures.push(currentSubFeature);
    }

    if (subName && subFeatures.length > 0) {
      const isOfficial = isOfficialSource(source);
      const subObj: ParsedSubclass = {
        name: subName,
        source,
        isOfficial,
        features: subFeatures,
      };

      if (isOfficial) {
        officialSubclasses.push(subObj);
      } else {
        thirdPartySubclasses.push(subObj);
      }
    }
  });

  const parsedData: ParsedClassData = {
    nameRu,
    nameEn,
    sourceUrl: targetUrl,
    hitDie,
    savingThrows,
    armorProficiencies,
    weaponProficiencies,
    toolProficiencies,
    skillChoices,
    progressionTable,
    coreFeatures,
    officialSubclasses,
    thirdPartySubclasses,
  };

  // Build Clean Markdown
  let md = `# 📜 ${parsedData.nameRu} [${parsedData.nameEn}]\n`;
  md += `> Официальный источник: [dnd.su](${parsedData.sourceUrl})\n\n`;

  md += `## 🛡️ Базовые параметры и владения\n`;
  md += `- **Кость хитов**: ${parsedData.hitDie || 'Не указана'}\n`;
  md += `- **Спасброски**: ${parsedData.savingThrows.join(', ') || 'Не указаны'}\n`;
  md += `- **Доспехи**: ${parsedData.armorProficiencies || 'Нет'}\n`;
  md += `- **Оружие**: ${parsedData.weaponProficiencies || 'Нет'}\n`;
  md += `- **Инструменты**: ${parsedData.toolProficiencies || 'Нет'}\n`;
  md += `- **Навыки**: ${parsedData.skillChoices || 'Нет'}\n\n`;

  if (parsedData.progressionTable.length > 0) {
    md += `## 📊 Таблица прогрессии (1–20 уровни)\n\n`;
    const headers = parsedData.progressionTable[0];
    md += `| ${headers.join(' | ')} |\n`;
    md += `| ${headers.map(() => '---').join(' | ')} |\n`;
    for (let i = 1; i < parsedData.progressionTable.length; i++) {
      md += `| ${parsedData.progressionTable[i].join(' | ')} |\n`;
    }
    md += `\n`;
  }

  if (parsedData.coreFeatures.length > 0) {
    md += `## ⚔️ Умения базового класса (${parsedData.coreFeatures.length})\n\n`;
    for (const feat of parsedData.coreFeatures) {
      md += `### ${feat.name}${feat.level ? ` (${feat.level} ур.)` : ''}\n`;
      if (feat.levelText) md += `*${feat.levelText}*\n\n`;
      md += `${feat.description}\n\n`;
    }
  }

  if (parsedData.officialSubclasses.length > 0) {
    md += `## 🌟 Официальные архетипы D&D 5e (${parsedData.officialSubclasses.length})\n\n`;
    for (const sub of parsedData.officialSubclasses) {
      md += `### 🔱 ${sub.name}\n`;
      if (sub.source) md += `*${sub.source}*\n\n`;
      for (const sf of sub.features) {
        md += `#### ${sf.name}${sf.level ? ` (${sf.level} ур.)` : ''}\n`;
        if (sf.levelText) md += `*${sf.levelText}*\n\n`;
        md += `${sf.description}\n\n`;
      }
      md += `---\n\n`;
    }
  }

  if (parsedData.thirdPartySubclasses.length > 0) {
    md += `## 📚 Сторонние и партнерские архетипы (${parsedData.thirdPartySubclasses.length})\n\n`;
    for (const sub of parsedData.thirdPartySubclasses) {
      md += `### 🏷️ ${sub.name}\n`;
      if (sub.source) md += `*${sub.source}*\n\n`;
      for (const sf of sub.features) {
        md += `#### ${sf.name}${sf.level ? ` (${sf.level} ур.)` : ''}\n`;
        if (sf.levelText) md += `*${sf.levelText}*\n\n`;
        md += `${sf.description}\n\n`;
      }
      md += `---\n\n`;
    }
  }

  const cleanSize = Buffer.byteLength(md, 'utf8');

  return {
    data: parsedData,
    markdown: md,
    rawSize,
    cleanSize,
  };
}

async function cli() {
  const target = process.argv[2] || 'варвар';
  console.log(`🔍 Загружаю и парсю «${target}» с dnd.su...`);

  const startTime = Date.now();
  const { data, markdown, rawSize, cleanSize } = await fetchAndParseDndSuClass(target);
  const elapsed = Date.now() - startTime;

  const outDir = path.join(process.cwd(), '.dndsu-cache');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const fileName = `${data.nameEn ? data.nameEn.toLowerCase() : 'class'}.md`;
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, markdown, 'utf8');

  console.log(`\n✅ Успешно обработан класс: ${data.nameRu} [${data.nameEn}] за ${elapsed} мс!`);
  console.log(`📊 Оптимизация размера: ${(rawSize / 1024).toFixed(1)} КБ (сырой HTML) ➔ ${(cleanSize / 1024).toFixed(1)} КБ (чистый Markdown)`);
  console.log(`📉 Сжатие мусора: -${((1 - cleanSize / rawSize) * 100).toFixed(1)}%`);
  console.log(`🛡️ Спасброски: ${data.savingThrows.join(', ')}`);
  console.log(`⚔️ Умений базового класса: ${data.coreFeatures.length}`);
  console.log(`🌟 Официальных подклассов WotC: ${data.officialSubclasses.length}`);
  for (const s of data.officialSubclasses) {
    console.log(`   • ${s.name} (${s.features.length} умений) [${s.source}]`);
  }
  if (data.thirdPartySubclasses.length > 0) {
    console.log(`📚 Сторонних/партнёрских подклассов: ${data.thirdPartySubclasses.length}`);
  }
  console.log(`\n📁 Результат сохранён в: ${filePath}`);
}

if (require.main === module) {
  cli().catch(err => {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  });
}
