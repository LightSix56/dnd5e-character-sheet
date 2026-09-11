import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedWeapon {
  name: string;
  category: 'Простое рукопашное' | 'Простое дальнобойное' | 'Воинское рукопашное' | 'Воинское дальнобойное';
  cost: string;
  damage: string;
  damageDice: string;
  damageType: string;
  weight: string;
  properties: string[];
  finesse?: boolean;
}

export interface WeaponCategoryPlaceholder {
  needed: boolean;
  category?: 'Простое рукопашное' | 'Простое дальнобойное' | 'Воинское рукопашное' | 'Воинское дальнобойное' | 'Простое' | 'Воинское' | 'Любое';
  hasShield?: boolean;
  count?: number;
}

export function detectWeaponCategoryPlaceholder(text: string): WeaponCategoryPlaceholder {
  const clean = text.toLowerCase().trim();
  const hasShield = clean.includes('щит');

  // "воинское рукопашное"
  if (clean.includes('воинск') && clean.includes('рукопашн')) {
    return { needed: true, category: 'Воинское рукопашное', hasShield, count: 1 };
  }
  // "простое рукопашное"
  if (clean.includes('прост') && clean.includes('рукопашн')) {
    return { needed: true, category: 'Простое рукопашное', hasShield, count: 1 };
  }
  // "воинское дальнобойное"
  if (clean.includes('воинск') && clean.includes('дальнобойн')) {
    return { needed: true, category: 'Воинское дальнобойное', hasShield, count: 1 };
  }
  // "простое дальнобойное"
  if (clean.includes('прост') && clean.includes('дальнобойн')) {
    return { needed: true, category: 'Простое дальнобойное', hasShield, count: 1 };
  }
  // "воинское оружие" / "два воинских оружия" / "любое воинское"
  if (clean.includes('воинск') && (clean.includes('оружи') || clean.includes('любое'))) {
    const isTwo = clean.includes('два') || clean.includes('двух');
    return { needed: true, category: 'Воинское', hasShield, count: isTwo ? 2 : 1 };
  }
  // "простое оружие" / "два простых оружия" / "любое простое"
  if (clean.includes('прост') && (clean.includes('оружи') || clean.includes('любое'))) {
    const isTwo = clean.includes('два') || clean.includes('двух');
    return { needed: true, category: 'Простое', hasShield, count: isTwo ? 2 : 1 };
  }

  return { needed: false };
}

export function parseWeaponsTableHtml(html: string): ParsedWeapon[] {
  const $ = cheerio.load(html);
  let currentCategory: ParsedWeapon['category'] = 'Простое рукопашное';
  const weapons: ParsedWeapon[] = [];

  $('table').first().find('tr').each((_, tr) => {
    const text = $(tr).text().trim();
    if (text.includes('Простое рукопашное оружие')) {
      currentCategory = 'Простое рукопашное';
      return;
    }
    if (text.includes('Простое дальнобойное оружие')) {
      currentCategory = 'Простое дальнобойное';
      return;
    }
    if (text.includes('Воинское рукопашное оружие')) {
      currentCategory = 'Воинское рукопашное';
      return;
    }
    if (text.includes('Воинское дальнобойное оружие')) {
      currentCategory = 'Воинское дальнобойное';
      return;
    }

    const tds = $(tr).find('td');
    if (tds.length >= 4) {
      const name = $(tds[0]).text().trim();
      const cost = $(tds[1]).text().trim();
      const rawDamage = $(tds[2]).text().trim();
      const weight = $(tds[3]).text().trim();
      const props = tds.length >= 5 ? $(tds[4]).text().trim() : '';

      if (name && name !== 'Название' && !name.includes('оружие')) {
        const properties = props.split(',').map(p => p.trim()).filter(p => p && p !== '-');
        const finesse = properties.some(p => p.toLowerCase().includes('фехтовальн'));

        // Normalize dice: "1к8" -> "1d8", "2к6" -> "2d6"
        const diceMatch = rawDamage.replace(/к/gi, 'd').match(/(\d+d\d+)/);
        const damageDice = diceMatch ? diceMatch[1] : (rawDamage === '-' ? '-' : '1');
        const typeMatch = rawDamage.match(/(рубящий|колющий|дробящий)/i);
        const damageType = typeMatch ? typeMatch[1].toLowerCase() : '';

        weapons.push({
          name,
          category: currentCategory,
          cost,
          damage: rawDamage,
          damageDice,
          damageType,
          weight,
          properties,
          finesse: finesse ? true : undefined
        });
      }
    }
  });

  return weapons;
}

export async function fetchHtml(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  return await resp.text();
}

export async function fetchAndCacheWeapons(): Promise<ParsedWeapon[]> {
  console.log('Fetching weapons catalog from https://dnd.su/articles/inventory/96-arms/...');
  const html = await fetchHtml('https://dnd.su/articles/inventory/96-arms/');
  const weapons = parseWeaponsTableHtml(html);

  const cacheDir = path.join(process.cwd(), '.dndsu-cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const outPath = path.join(cacheDir, 'weapons.json');
  fs.writeFileSync(outPath, JSON.stringify(weapons, null, 2), 'utf-8');
  console.log(`Saved ${weapons.length} weapons to ${outPath}`);

  return weapons;
}

async function main() {
  await fetchAndCacheWeapons();
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
