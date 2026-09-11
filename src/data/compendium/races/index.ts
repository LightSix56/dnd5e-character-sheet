import { CompendiumRace } from './types';
import { CORE_RACES } from './core';
import { MULTIVERSE_RACES } from './multiverse';
import { SUPPLEMENT_RACES } from './supplements';

export * from './types';
export * from './core';
export * from './multiverse';
export * from './supplements';

export const DND_COMPENDIUM_RACES: CompendiumRace[] = [
  ...CORE_RACES,
  ...MULTIVERSE_RACES,
  ...SUPPLEMENT_RACES
];

export function findRaceByName(name: string): CompendiumRace | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return DND_COMPENDIUM_RACES.find(r => 
    r.name.toLowerCase() === n || 
    r.nameEn.toLowerCase() === n ||
    n.startsWith(r.name.toLowerCase()) ||
    n.startsWith(r.nameEn.toLowerCase())
  );
}
