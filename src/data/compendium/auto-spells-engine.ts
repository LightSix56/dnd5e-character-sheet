// D&D 5e Auto-Spells Level Progression Engine
// Automatically grants spells unlocked at specific level-ups:
// 1. Paladin Level 2 Divine Smite
// 2. Subclass expanded / domain / oath / circle / archetype spells
// 3. Innate racial scaling spells (for ALL classes)

import type { CharacterData } from '@/lib/dnd-types';
import { findSpellByName, DND_COMPENDIUM_SPELLS } from './spells';
import { SUBCLASS_EXPANDED_SPELLS } from './class-spells';
import { getRacialFeaturesForLevel } from './race-progression';

export interface AutoGrantedSpell {
  name: string;
  level: number;
  prepared: boolean;
  source: string;
  isRacial?: boolean;
}

/**
 * Returns spells automatically granted to the character upon reaching `newLevel`.
 */
export function getAutoGrantedSpellsForLevel(
  char: CharacterData,
  newLevel: number,
  subclassOverride?: string
): AutoGrantedSpell[] {
  const result: AutoGrantedSpell[] = [];
  const classNameLower = (char.className || '').trim().toLowerCase();

  // 1. Paladin level 2: Divine Smite
  if ((classNameLower === 'паладин' || classNameLower === 'paladin') && newLevel === 2) {
    result.push({
      name: 'Божественная кара',
      level: 1,
      prepared: true,
      source: 'Паладин: Божественная кара',
    });
  }

  // 2. Subclass expanded spells
  const effectiveSubclass = (subclassOverride || char.subclass || '').trim();
  if (effectiveSubclass) {
    const subLower = effectiveSubclass.toLowerCase();
    let matchedSubKey: string | undefined;
    let bonusSpells: string[] | undefined;

    for (const [key, spells] of Object.entries(SUBCLASS_EXPANDED_SPELLS)) {
      const k = key.toLowerCase();
      if (subLower === k || subLower.includes(k) || k.includes(subLower)) {
        matchedSubKey = key;
        bonusSpells = spells;
        break;
      }
    }

    if (bonusSpells && matchedSubKey) {
      let category: 'paladin' | 'cleric' | 'druid' | 'ranger' | 'artificer' | 'sorcerer' | null = null;
      if (classNameLower.includes('паладин') || classNameLower.includes('paladin')) {
        category = 'paladin';
      } else if (classNameLower.includes('жрец') || classNameLower.includes('cleric')) {
        category = 'cleric';
      } else if (classNameLower.includes('друид') || classNameLower.includes('druid')) {
        category = 'druid';
      } else if (classNameLower.includes('следопыт') || classNameLower.includes('ranger')) {
        category = 'ranger';
      } else if (classNameLower.includes('изобретатель') || classNameLower.includes('artificer')) {
        category = 'artificer';
      } else if (classNameLower.includes('чародей') || classNameLower.includes('sorcerer')) {
        category = 'sorcerer';
      } else {
        // Infer from subclass key
        if (matchedSubKey.startsWith('клятва') || matchedSubKey === 'клятвопреступник') {
          category = 'paladin';
        } else if (matchedSubKey.startsWith('домен')) {
          category = 'cleric';
        } else if (matchedSubKey.startsWith('круг')) {
          category = 'druid';
        } else if (['сумрачный охотник', 'странник горизонта', 'фейский странник'].includes(matchedSubKey)) {
          category = 'ranger';
        } else if (['алхимик', 'артиллерист', 'боевой кузнец'].includes(matchedSubKey)) {
          category = 'artificer';
        }
      }

      let targetCircle = 0;
      let spellNames: string[] = [];

      if (category === 'paladin') {
        if (newLevel === 3) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
        else if (newLevel === 5) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
        else if (newLevel === 9) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
        else if (newLevel === 13) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
        else if (newLevel === 17) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
      } else if (category === 'cleric') {
        if (newLevel === 1) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
        else if (newLevel === 3) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
        else if (newLevel === 5) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
        else if (newLevel === 7) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
        else if (newLevel === 9) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
      } else if (category === 'druid') {
        const isLand = matchedSubKey === 'круг земли';
        if (newLevel === 3) { targetCircle = 2; spellNames = isLand ? bonusSpells.slice(0, 2) : bonusSpells.slice(2, 4); }
        else if (newLevel === 5) { targetCircle = 3; spellNames = isLand ? bonusSpells.slice(4, 6) : bonusSpells.slice(4, 6); }
        else if (newLevel === 7) { targetCircle = 4; spellNames = isLand ? bonusSpells.slice(8, 10) : bonusSpells.slice(6, 8); }
        else if (newLevel === 9) { targetCircle = 5; spellNames = isLand ? bonusSpells.slice(12, 14) : (bonusSpells.length >= 10 ? bonusSpells.slice(8, 10) : bonusSpells.slice(6, 8)); }
      } else if (category === 'ranger') {
        if (newLevel === 3) { targetCircle = 1; spellNames = bonusSpells.slice(0, 1); }
        else if (newLevel === 5) { targetCircle = 2; spellNames = bonusSpells.slice(1, 2); }
        else if (newLevel === 9) { targetCircle = 3; spellNames = bonusSpells.slice(2, 3); }
        else if (newLevel === 13) { targetCircle = 4; spellNames = bonusSpells.slice(3, 4); }
        else if (newLevel === 17) { targetCircle = 5; spellNames = bonusSpells.slice(4, 5); }
      } else if (category === 'artificer') {
        if (newLevel === 3) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
        else if (newLevel === 5) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
        else if (newLevel === 9) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
        else if (newLevel === 13) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
        else if (newLevel === 17) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
      } else if (category === 'sorcerer') {
        if (newLevel === 1) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
        else if (newLevel === 3) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
        else if (newLevel === 5) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
        else if (newLevel === 7) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
        else if (newLevel === 9) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
      }

      for (const sName of spellNames) {
        const sp = findSpellByName(sName);
        result.push({
          name: sp ? sp.name : sName,
          level: sp ? sp.level : targetCircle,
          prepared: true,
          source: 'Архетип: ' + effectiveSubclass,
        });
      }
    }
  }

  // 3. Racial scaling spells (runs for ALL characters, including martial)
  if (char.race) {
    const racialFeatures = getRacialFeaturesForLevel(char.race, char.subrace, newLevel);
    for (const rf of racialFeatures) {
      if (rf.spell) {
        result.push({
          name: rf.spell.name,
          level: rf.spell.level,
          prepared: true,
          isRacial: true,
          source: 'Раса: ' + rf.name,
        });
      }
    }
  }

  return result;
}
