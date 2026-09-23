import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface ScrapedPotionData {
  id: string;
  name: string;
  nameEn: string;
  rarity: 'обычное' | 'необычное' | 'редкое' | 'очень редкое' | 'легендарное' | 'артефакт';
  potionType: 'heal' | 'buff' | 'utility';
  formula?: string;
  effectSummary: string;
  description: string;
  cost: string;
  weight: number;
  source: string;
}

export const DND_SU_POTION_SLUGS: { slug: string; nameRu: string; nameEn: string; type: 'heal' | 'buff' | 'utility'; formula?: string }[] = [
  { slug: 'potion-of-healing', nameRu: 'Зелье лечения', nameEn: 'Potion of Healing', type: 'heal', formula: '2d4+2' },
  { slug: 'potion-of-greater-healing', nameRu: 'Зелье большего лечения', nameEn: 'Potion of Greater Healing', type: 'heal', formula: '4d4+4' },
  { slug: 'potion-of-superior-healing', nameRu: 'Зелье отличного лечения', nameEn: 'Potion of Superior Healing', type: 'heal', formula: '8d4+8' },
  { slug: 'potion-of-supreme-healing', nameRu: 'Зелье превосходного лечения', nameEn: 'Potion of Supreme Healing', type: 'heal', formula: '10d4+20' },
  { slug: 'potion-of-heroism', nameRu: 'Зелье героизма', nameEn: 'Potion of Heroism', type: 'buff' },
  { slug: 'potion-of-speed', nameRu: 'Зелье скорости', nameEn: 'Potion of Speed', type: 'buff' },
  { slug: 'potion-of-invulnerability', nameRu: 'Зелье неуязвимости', nameEn: 'Potion of Invulnerability', type: 'buff' },
  { slug: 'potion-of-fire-breath', nameRu: 'Зелье огненного дыхания', nameEn: 'Potion of Fire Breath', type: 'buff' },
  { slug: 'potion-of-hill-giant-strength', nameRu: 'Зелье силы холмового великана', nameEn: 'Potion of Hill Giant Strength', type: 'buff' },
  { slug: 'potion-of-frost-giant-strength', nameRu: 'Зелье силы морозного великана', nameEn: 'Potion of Frost Giant Strength', type: 'buff' },
  { slug: 'potion-of-stone-giant-strength', nameRu: 'Зелье силы каменного великана', nameEn: 'Potion of Stone Giant Strength', type: 'buff' },
  { slug: 'potion-of-fire-giant-strength', nameRu: 'Зелье силы огненного великана', nameEn: 'Potion of Fire Giant Strength', type: 'buff' },
  { slug: 'potion-of-cloud-giant-strength', nameRu: 'Зелье силы облачного великана', nameEn: 'Potion of Cloud Giant Strength', type: 'buff' },
  { slug: 'potion-of-storm-giant-strength', nameRu: 'Зелье силы штормового великана', nameEn: 'Potion of Storm Giant Strength', type: 'buff' },
  { slug: 'potion-of-invisibility', nameRu: 'Зелье невидимости', nameEn: 'Potion of Invisibility', type: 'buff' },
  { slug: 'potion-of-resistance', nameRu: 'Зелье сопротивления', nameEn: 'Potion of Resistance', type: 'buff' },
  { slug: 'potion-of-growth', nameRu: 'Зелье роста', nameEn: 'Potion of Growth', type: 'buff' },
  { slug: 'potion-of-diminution', nameRu: 'Зелье уменьшения', nameEn: 'Potion of Diminution', type: 'utility' },
  { slug: 'potion-of-flying', nameRu: 'Зелье полёта', nameEn: 'Potion of Flying', type: 'buff' },
  { slug: 'potion-of-climbing', nameRu: 'Зелье лазания', nameEn: 'Potion of Climbing', type: 'buff' },
  { slug: 'potion-of-water-breathing', nameRu: 'Зелье водного дыхания', nameEn: 'Potion of Water Breathing', type: 'utility' },
  { slug: 'potion-of-vitality', nameRu: 'Зелье живучести', nameEn: 'Potion of Vitality', type: 'heal' },
  { slug: 'elixir-of-health', nameRu: 'Эликсир здоровья', nameEn: 'Elixir of Health', type: 'heal' },
  { slug: 'antitoxin', nameRu: 'Противоядие', nameEn: 'Antitoxin', type: 'buff' },
  { slug: 'potion-of-advantage', nameRu: 'Зелье преимущества', nameEn: 'Potion of Advantage', type: 'buff' },
  { slug: 'potion-of-watchful-rest', nameRu: 'Зелье бдительного отдыха', nameEn: 'Potion of Watchful Rest', type: 'utility' },
  { slug: 'potion-of-mind-reading', nameRu: 'Зелье чтения мыслей', nameEn: 'Potion of Mind Reading', type: 'utility' },
  { slug: 'potion-of-clairvoyance', nameRu: 'Зелье ясновидения', nameEn: 'Potion of Clairvoyance', type: 'utility' },
  { slug: 'potion-of-animal-friendship', nameRu: 'Зелье дружбы с животными', nameEn: 'Potion of Animal Friendship', type: 'utility' },
  { slug: 'potion-of-gaseous-form', nameRu: 'Зелье газообразности', nameEn: 'Potion of Gaseous Form', type: 'utility' },
  { slug: 'potion-of-longevity', nameRu: 'Зелье долголетия', nameEn: 'Potion of Longevity', type: 'utility' },
  { slug: 'oil-of-slipperiness', nameRu: 'Масло скользкости', nameEn: 'Oil of Slipperiness', type: 'buff' },
  { slug: 'philter-of-love', nameRu: 'Любовное зелье', nameEn: 'Philter of Love', type: 'utility' },
];

export function parseRarityFromText(text: string): ScrapedPotionData['rarity'] {
  const lower = text.toLowerCase();
  if (lower.includes('артефакт')) return 'артефакт';
  if (lower.includes('легендарн')) return 'легендарное';
  if (lower.includes('очень редк')) return 'очень редкое';
  if (lower.includes('редк')) return 'редкое';
  if (lower.includes('необычн')) return 'необычное';
  return 'обычное';
}

export function parseFormulaFromText(text: string): string | undefined {
  // Looks for e.g. 2к4+2 or 2d4+2 or 4к4 + 4
  const match = text.match(/(\d+)\s*[кd](\d+)\s*([+-]\s*\d+)?/i);
  if (match) {
    const count = match[1];
    const sides = match[2];
    const mod = match[3] ? match[3].replace(/\s+/g, '') : '';
    return `${count}d${sides}${mod}`;
  }
  return undefined;
}

export function parsePotionHtml(html: string, fallback: { nameRu: string; nameEn: string; type: 'heal' | 'buff' | 'utility'; formula?: string; slug?: string }): ScrapedPotionData {
  const $ = cheerio.load(html);
  const title = $('.card-title, h1.header_title, .item-header h1').first().text().trim() || fallback.nameRu;
  const nameEn = $('.card-title small, .header_title small, .item-header span.english').first().text().replace(/[()]/g, '').trim() || fallback.nameEn;
  const content = $('.card-body, .item-description, .desc').text().trim();
  const rarity = parseRarityFromText($('.item-type, .rarity, .card-subtitle').text() || content);
  const formula = fallback.formula || parseFormulaFromText(content);

  return {
    id: `potion-${fallback.slug || fallback.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: title,
    nameEn: nameEn || fallback.nameEn,
    rarity,
    potionType: fallback.type,
    formula,
    effectSummary: content.slice(0, 120).trim() || `${title} (${rarity})`,
    description: content || `${title} - официальное зелье D&D 5e.`,
    cost: '',
    weight: 0.5,
    source: 'PHB / DMG',
  };
}

export async function fetchPotionFromDndSu(slug: string): Promise<string | null> {
  const url = `https://dnd.su/items/magic/${slug}/`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) {
      console.warn(`[fetchPotion] Failed fetching ${url}: HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err: any) {
    console.warn(`[fetchPotion] Network error fetching ${url}: ${err.message}`);
    return null;
  }
}

export async function auditCompendiumPotions(): Promise<void> {
  console.log(`Checking ${DND_SU_POTION_SLUGS.length} official D&D 5e potions against compendium...`);
  const results: ScrapedPotionData[] = [];

  for (const item of DND_SU_POTION_SLUGS) {
    const html = await fetchPotionFromDndSu(item.slug);
    if (html) {
      const parsed = parsePotionHtml(html, { ...item, slug: item.slug });
      results.push(parsed);
      console.log(`✓ Fetched: ${parsed.name} (${parsed.nameEn}) [${parsed.rarity}]`);
    } else {
      console.log(`- Offline fallback: ${item.nameRu} (${item.nameEn}) [${item.type}]`);
    }
  }

  const outPath = path.resolve(process.cwd(), 'src/data/compendium/potions-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Audit report written to: ${outPath} (${results.length} verified items)`);
}

// Allow CLI invocation
if (process.argv[1] && process.argv[1].includes('fetch-dndsu-potions')) {
  auditCompendiumPotions().catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
}
