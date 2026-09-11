const fs = require('fs');
const path = require('path');

const srcFile = fs.readFileSync('src/data/compendium/races.ts', 'utf8');

// 1. Extract types
const startTypes = srcFile.indexOf('export type RaceCategory');
const endTypes = srcFile.indexOf('export const DND_COMPENDIUM_RACES');
const typesContent = '// D&D 5e Race Compendium Type Definitions\n\n' + srcFile.substring(startTypes, endTypes).trim() + '\n';

fs.mkdirSync('src/data/compendium/races', { recursive: true });
fs.writeFileSync('src/data/compendium/races/types.ts', typesContent, 'utf8');
console.log('Written src/data/compendium/races/types.ts');

// 2. Load existing races
const { DND_COMPENDIUM_RACES } = require('../src/data/compendium/races.ts');

const coreRaces = DND_COMPENDIUM_RACES.filter(r => r.category === 'core' || r.id === 'custom-lineage');
const multiverseRaces = DND_COMPENDIUM_RACES.filter(r => r.category === 'multiverse');
const supplementRaces = DND_COMPENDIUM_RACES.filter(r => r.category !== 'core' && r.id !== 'custom-lineage' && r.category !== 'multiverse');

function serializeRaces(races, varName, comment) {
  return `// ${comment}\nimport { CompendiumRace } from './types';\n\nexport const ${varName}: CompendiumRace[] = ${JSON.stringify(races, null, 2)};\n`;
}

fs.writeFileSync('src/data/compendium/races/core.ts', serializeRaces(coreRaces, 'CORE_RACES', 'Core PHB and TCoE Custom Lineage Races'), 'utf8');
console.log('Written src/data/compendium/races/core.ts:', coreRaces.length, 'races');

fs.writeFileSync('src/data/compendium/races/multiverse.ts', serializeRaces(multiverseRaces, 'MULTIVERSE_RACES', 'Mordenkainen Presents: Monsters of the Multiverse (MPMM) Races'), 'utf8');
console.log('Written src/data/compendium/races/multiverse.ts:', multiverseRaces.length, 'races');

fs.writeFileSync('src/data/compendium/races/supplements.ts', serializeRaces(supplementRaces, 'SUPPLEMENT_RACES', 'Setting and Supplement Races (Eberron, Ravnica, Theros, Spelljammer, Ravenloft)'), 'utf8');
console.log('Written src/data/compendium/races/supplements.ts:', supplementRaces.length, 'races');

// 3. Create index.ts
const indexContent = `import { CompendiumRace } from './types';
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
`;

fs.writeFileSync('src/data/compendium/races/index.ts', indexContent, 'utf8');
console.log('Written src/data/compendium/races/index.ts');

// 4. Update root races.ts facade
const facadeContent = `// Re-export all races, subraces, types, and helpers from modular directory
export * from './races/index';
`;
fs.writeFileSync('src/data/compendium/races.ts', facadeContent, 'utf8');
console.log('Updated src/data/compendium/races.ts facade');
