import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface ClassEquipmentChoice {
  options: string[];
  defaultIndex?: number;
}

export interface ClassStartingEquipmentData {
  choices: ClassEquipmentChoice[];
  fixed: string[];
}

export const CLASS_SLUGS: { id: string; slug: string; nameRu: string }[] = [
  { id: 'barbarian', slug: '87-barbarian', nameRu: 'Варвар' },
  { id: 'bard', slug: '88-bard', nameRu: 'Бард' },
  { id: 'cleric', slug: '89-cleric', nameRu: 'Жрец' },
  { id: 'druid', slug: '90-druid', nameRu: 'Друид' },
  { id: 'fighter', slug: '91-fighter', nameRu: 'Воин' },
  { id: 'monk', slug: '93-monk', nameRu: 'Монах' },
  { id: 'paladin', slug: '94-paladin', nameRu: 'Паладин' },
  { id: 'ranger', slug: '97-ranger', nameRu: 'Следопыт' },
  { id: 'rogue', slug: '99-rogue', nameRu: 'Плут' },
  { id: 'sorcerer', slug: '101-sorcerer', nameRu: 'Чародей' },
  { id: 'warlock', slug: '104-warlock', nameRu: 'Колдун' },
  { id: 'wizard', slug: '105-wizard', nameRu: 'Волшебник' },
  { id: 'artificer', slug: '137-artificer', nameRu: 'Изобретатель' },
];

export function cleanEquipmentText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .trim();
}

export function parseEquipmentListItem(text: string): { isChoice: boolean; choice?: ClassEquipmentChoice; fixed?: string } {
  const cleaned = cleanEquipmentText(text);

  // Check if this item is a choice format: begins with a) or contains а) / б) / в)
  const hasChoiceMarker = /^[абвгдa-d]\)/i.test(cleaned) || /\b(?:или\s+)?[бвгдb-d]\)/i.test(cleaned);

  if (hasChoiceMarker) {
    // Split by markers like "а)", "б)", "в)", "или б)", ", б)"
    const rawParts = cleaned.split(/(?:^|[,\s]+)(?:или\s+)?([абвгдa-d])\)\s*/i);
    // rawParts alternates: [before, letter, content, letter, content...]
    const options: string[] = [];

    for (let i = 1; i < rawParts.length; i += 2) {
      const partContent = rawParts[i + 1];
      if (partContent) {
        // Clean trailing "или", commas, semicolons, dots
        let opt = partContent.trim();
        opt = opt.replace(/[;,.\s]+$/, '').replace(/\s+или$/, '').trim();
        if (opt.length > 0) {
          options.push(opt);
        }
      }
    }

    if (options.length >= 2) {
      return {
        isChoice: true,
        choice: {
          options,
          defaultIndex: 0,
        },
      };
    }
  }

  return {
    isChoice: false,
    fixed: cleaned.replace(/[;,.\s]+$/, '').trim(),
  };
}

export function parseEquipmentHtml(html: string): ClassStartingEquipmentData {
  const $ = cheerio.load(html);
  const choices: ClassEquipmentChoice[] = [];
  const fixed: string[] = [];

  // Locate the header matching "СНАРЯЖЕНИЕ"
  let equipmentHeader = $('h4.smallSectionTitle').filter((_, el) => {
    return $(el).text().trim().toUpperCase().startsWith('СНАРЯЖЕНИЕ');
  });

  if (!equipmentHeader.length) {
    // Fallback: search any header with "СНАРЯЖЕНИЕ"
    equipmentHeader = $('h3, h4, h5').filter((_, el) => {
      return $(el).text().trim().toUpperCase().includes('СНАРЯЖЕНИЕ');
    });
  }

  if (equipmentHeader.length) {
    // Find following ul or parent's following ul
    let ul = equipmentHeader.nextAll('ul').first();
    if (!ul.length) {
      ul = equipmentHeader.parent().find('ul').first();
    }
    if (!ul.length) {
      ul = equipmentHeader.parent().nextAll('ul').first();
    }

    if (ul.length) {
      ul.find('li').each((_, li) => {
        const rawItem = $(li).html() || $(li).text();
        const parsed = parseEquipmentListItem(rawItem);
        if (parsed.isChoice && parsed.choice) {
          choices.push(parsed.choice);
        } else if (parsed.fixed) {
          fixed.push(parsed.fixed);
        }
      });
    }
  }

  return { choices, fixed };
}

export async function fetchAllClassEquipment(): Promise<Record<string, ClassStartingEquipmentData>> {
  const results: Record<string, ClassStartingEquipmentData> = {};

  for (const cls of CLASS_SLUGS) {
    const url = `https://dnd.su/class/${cls.slug}/`;
    console.log(`Fetching starting equipment for ${cls.nameRu} (${url})...`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const html = await response.text();
      const equip = parseEquipmentHtml(html);
      results[cls.id] = equip;
      console.log(`  -> ${cls.nameRu}: ${equip.choices.length} choices, ${equip.fixed.length} fixed items`);
    } catch (err) {
      console.error(`  Failed to fetch ${cls.nameRu}:`, err);
    }
  }

  return results;
}

// CLI runner
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  (async () => {
    const data = await fetchAllClassEquipment();
    const cacheDir = path.resolve('.dndsu-cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const outputPath = path.join(cacheDir, 'class-equipment.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved class equipment data to ${outputPath}`);
  })();
}
