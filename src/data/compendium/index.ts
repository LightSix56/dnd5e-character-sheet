export * from './races';
export * from './classes';
export * from './spells';
export * from './items';
export * from './feats';
export * from './class-progression';

import { DND_COMPENDIUM_SPELLS } from './spells';
import { DND_COMPENDIUM_ITEMS } from './items';
import { DND_COMPENDIUM_FEATS } from './feats';
import { DND_COMPENDIUM_RACES } from './races';
import { DND_COMPENDIUM_CLASSES } from './classes';
import type { AutocompleteItem } from '@/components/compendium/AutocompleteInput';

/**
 * Returns unified autocomplete suggestions across all compendium entities:
 * Spells, Weapons, Armors, Items, Feats, Traits, Races, Subclasses
 */
export function getCompendiumAutocompleteItems(query: string = ''): AutocompleteItem[] {
  const q = query.trim().toLowerCase();
  const results: AutocompleteItem[] = [];

  // Spells
  for (const s of DND_COMPENDIUM_SPELLS) {
    if (!q || s.name.toLowerCase().includes(q) || (s.nameEn && s.nameEn.toLowerCase().includes(q))) {
      results.push({
        name: s.name,
        badge: s.level === 0 ? 'Заговор' : `${s.level} круг`,
        secondary: s.nameEn ? `${s.nameEn} • ${s.school}` : s.school,
        data: { type: 'spell', item: s }
      });
    }
  }

  // Items / Weapons / Armor
  for (const it of DND_COMPENDIUM_ITEMS) {
    if (!q || it.name.toLowerCase().includes(q) || (it.nameEn && it.nameEn.toLowerCase().includes(q))) {
      results.push({
        name: it.name,
        badge: it.subcategory || it.category,
        secondary: it.nameEn ? `${it.nameEn} • ${it.cost || ''}` : it.cost,
        data: { type: 'item', item: it }
      });
    }
  }

  // Feats & Traits
  for (const f of DND_COMPENDIUM_FEATS) {
    if (!q || f.name.toLowerCase().includes(q) || (f.nameEn && f.nameEn.toLowerCase().includes(q))) {
      results.push({
        name: f.name,
        badge: f.category,
        secondary: f.nameEn || f.source,
        data: { type: 'feat', item: f }
      });
    }
  }

  // Races
  for (const r of DND_COMPENDIUM_RACES) {
    if (!q || r.name.toLowerCase().includes(q) || r.nameEn.toLowerCase().includes(q)) {
      results.push({
        name: r.name,
        badge: 'Раса',
        secondary: `${r.nameEn} • Скорость ${r.speed} фт`,
        data: { type: 'race', item: r }
      });
    }
    for (const sr of r.subraces) {
      if (!q || sr.name.toLowerCase().includes(q) || sr.nameEn.toLowerCase().includes(q)) {
        results.push({
          name: sr.name,
          badge: 'Подраса',
          secondary: `${r.name} (${sr.nameEn})`,
          data: { type: 'subrace', item: sr, parentRace: r }
        });
      }
    }
  }

  // Classes & Subclasses
  for (const c of DND_COMPENDIUM_CLASSES) {
    if (!q || c.name.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)) {
      results.push({
        name: c.name,
        badge: 'Класс',
        secondary: `${c.nameEn} • Кость хитов d${c.hitDieSize}`,
        data: { type: 'class', item: c }
      });
    }
    for (const sc of c.subclasses) {
      if (!q || sc.name.toLowerCase().includes(q) || sc.nameEn.toLowerCase().includes(q)) {
        results.push({
          name: sc.name,
          badge: 'Подкласс',
          secondary: `${c.name} • ${sc.nameEn}`,
          data: { type: 'subclass', item: sc, parentClass: c }
        });
      }
    }
  }

  return results;
}
