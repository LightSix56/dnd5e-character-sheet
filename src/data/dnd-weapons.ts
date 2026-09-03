export * from './compendium/items';
import { DND_COMPENDIUM_ITEMS, getWeaponItems, type CompendiumItem } from './compendium/items';

export interface DndWeapon {
  name: string;
  category: 'Простое рукопашное' | 'Простое дальнобойное' | 'Воинское рукопашное' | 'Воинское дальнобойное';
  damageDice: string;
  damageType: 'колющий' | 'рубящий' | 'дробящий';
  properties: string[];
  rangeNormal?: number;
  rangeLong?: number;
  finesse?: boolean;
  versatileDice?: string;
  weight?: string;
  cost?: string;
  description: string;
}

export const DND_WEAPONS: DndWeapon[] = getWeaponItems().map(it => {
  const w = it.weapon!;
  return {
    name: it.name,
    category: w.category,
    damageDice: w.damageDice,
    damageType: w.damageType,
    properties: w.properties,
    rangeNormal: w.rangeNormal,
    rangeLong: w.rangeLong,
    finesse: w.finesse,
    versatileDice: w.versatileDice,
    weight: it.weight,
    cost: it.cost,
    description: it.description
  };
});

export function findWeaponByName(name: string): DndWeapon | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return DND_WEAPONS.find(w => 
    w.name.toLowerCase() === clean || 
    clean.startsWith(w.name.toLowerCase()) || 
    w.name.toLowerCase().startsWith(clean)
  );
}
