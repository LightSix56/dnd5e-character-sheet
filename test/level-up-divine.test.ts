import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DND_CLASS_PROGRESSION,
  FULL_CASTER_SPELL_SLOTS,
  HALF_CASTER_SPELL_SLOTS,
  getClassFeaturesForLevel,
  getClassSubclassLevel,
  getNewSpellLevelUnlocked,
  getSpellSlotsForClassLevel,
  isClassASILevel,
  isClassSubclassMilestone,
  normalizeClassName,
} from '../src/data/compendium/class-progression';

import {
  DND_COMPENDIUM_CLASSES,
  type CompendiumClass,
} from '../src/data/compendium/classes';

import {
  CLASS_TEMPLATES,
  applyClassTemplate,
  getHitDieSize,
  getHitDieAverage,
  getHitDiceNotation,
  isStandardASILevel,
  type CharacterData,
  type LevelUpEntry,
  type AbilityName,
} from '../src/lib/dnd-types';

// Helper to simulate page.tsx handleLevelUp
function applyLevelUp(char: CharacterData, entry: LevelUpEntry): CharacterData {
  const newHP = (char.hpMax || 0) + entry.hpGained;
  const newAsi = { ...char.asiBonuses };
  if (entry.asiAbilities) {
    newAsi[entry.asiAbilities[0]] = (newAsi[entry.asiAbilities[0]] || 0) + 1;
    newAsi[entry.asiAbilities[1]] = (newAsi[entry.asiAbilities[1]] || 0) + 1;
  }
  let newHitDice = char.hitDice;
  if (newHitDice) {
    const dieSize = getHitDieSize(newHitDice);
    const notation = getHitDiceNotation(newHitDice);
    newHitDice = `${entry.level}${notation}${dieSize}`;
  }
  let updatedTraits = [...(char.traitsList || [])];
  if (entry.addedTraits && entry.addedTraits.length > 0) {
    updatedTraits = [...updatedTraits, ...entry.addedTraits];
  }
  let updatedSubclass = char.subclass;
  if (entry.newSubclass) {
    updatedSubclass = entry.newSubclass;
  }
  let updatedSpellSlots = { ...char.spellSlots };
  if (entry.spellSlotsGained) {
    for (const [lvlStr, count] of Object.entries(entry.spellSlotsGained)) {
      const l = Number(lvlStr);
      updatedSpellSlots[l] = {
        totalSlots: count,
        expendedSlots: char.spellSlots?.[l]?.expendedSlots || 0,
      };
    }
  }
  return {
    ...char,
    level: entry.level,
    hpMax: newHP,
    hpCurrent: newHP,
    hitDice: newHitDice,
    subclass: updatedSubclass,
    asiBonuses: newAsi,
    traitsList: updatedTraits,
    spellSlots: updatedSpellSlots,
    levelHistory: [...(Array.isArray(char.levelHistory) ? char.levelHistory : []), entry],
  };
}

// Helper to simulate page.tsx handleLevelDown
function applyLevelDown(char: CharacterData): CharacterData {
  const newLevel = Math.max(1, char.level - 1);
  const history = Array.isArray(char.levelHistory) ? char.levelHistory : [];
  const last = history[history.length - 1];
  let newHP = char.hpMax || 0;
  if (last) {
    newHP = Math.max(1, newHP - last.hpGained);
  } else {
    const avg = (char.hitDice ? getHitDieAverage(char.hitDice) : 5);
    newHP = Math.max(1, newHP - Math.max(1, avg));
  }
  const newAsi = { ...char.asiBonuses };
  if (last?.asiAbilities && last.asiAbilities.length > 0) {
    newAsi[last.asiAbilities[0]] = Math.max(0, (newAsi[last.asiAbilities[0]] || 0) - 1);
    if (last.asiAbilities[1]) {
      newAsi[last.asiAbilities[1]] = Math.max(0, (newAsi[last.asiAbilities[1]] || 0) - 1);
    }
  }
  let newHitDice = char.hitDice;
  if (newHitDice) {
    const dieSize = getHitDieSize(newHitDice);
    const notation = getHitDiceNotation(newHitDice);
    newHitDice = `${newLevel}${notation}${dieSize}`;
  }
  let updatedTraits = [...(char.traitsList || [])];
  if (last?.addedTraits && last.addedTraits.length > 0) {
    const addedIds = new Set(last.addedTraits.map(t => t.id));
    const addedNames = new Set(last.addedTraits.map(t => t.name.toLowerCase()));
    updatedTraits = updatedTraits.filter(t => !addedIds.has(t.id) && !addedNames.has(t.name.toLowerCase()));
  }
  let updatedSubclass = char.subclass;
  if (last?.newSubclass && char.subclass === last.newSubclass) {
    updatedSubclass = '';
  }
  const prevSlots = getSpellSlotsForClassLevel(char.className, newLevel);
  let updatedSpellSlots = { ...char.spellSlots };
  if (prevSlots) {
    for (let l = 1; l <= 9; l++) {
      if (prevSlots[l]) {
        updatedSpellSlots[l] = {
          totalSlots: prevSlots[l],
          expendedSlots: Math.min(prevSlots[l], char.spellSlots?.[l]?.expendedSlots || 0),
        };
      } else {
        delete updatedSpellSlots[l];
      }
    }
  }
  return {
    ...char,
    level: newLevel,
    hpMax: newHP,
    hpCurrent: Math.min(char.hpCurrent, newHP),
    hitDice: newHitDice,
    subclass: updatedSubclass,
    asiBonuses: newAsi,
    traitsList: updatedTraits,
    spellSlots: updatedSpellSlots,
    levelHistory: history.slice(0, -1),
  };
}

// ═════════════════════════════════════════════════════════════════════
// 1. HIT DICE AUDIT (Кость хитов: Жрец d8, Друид d8, Паладин d10, Следопыт d10)
// ═════════════════════════════════════════════════════════════════════

test('1.1. Hit Die configuration in class progression database', () => {
  assert.equal(DND_CLASS_PROGRESSION['Жрец']?.hitDie, 8, 'Жрец must have d8 hit die');
  assert.equal(DND_CLASS_PROGRESSION['Друид']?.hitDie, 8, 'Друид must have d8 hit die');
  assert.equal(DND_CLASS_PROGRESSION['Паладин']?.hitDie, 10, 'Паладин must have d10 hit die');
  assert.equal(DND_CLASS_PROGRESSION['Следопыт']?.hitDie, 10, 'Следопыт must have d10 hit die');
});

test('1.2. Hit Die size & average HP calculation in dnd-types', () => {
  assert.equal(getHitDieSize('1d8'), 8);
  assert.equal(getHitDieAverage('1d8'), 5, 'd8 average HP is ceil((1+8)/2) = 5');
  assert.equal(getHitDieSize('1к8'), 8);
  assert.equal(getHitDieAverage('1к8'), 5);

  assert.equal(getHitDieSize('1d10'), 10);
  assert.equal(getHitDieAverage('1d10'), 6, 'd10 average HP is ceil((1+10)/2) = 6');
  assert.equal(getHitDieSize('1к10'), 10);
  assert.equal(getHitDieAverage('1к10'), 6);
});

test('1.3. CLASS_TEMPLATES hitDieSize matches SRD 5.1 rules', () => {
  const clericTpl = CLASS_TEMPLATES.find(t => t.id === 'cleric');
  const druidTpl = CLASS_TEMPLATES.find(t => t.id === 'druid');
  const paladinTpl = CLASS_TEMPLATES.find(t => t.id === 'paladin');
  const rangerTpl = CLASS_TEMPLATES.find(t => t.id === 'ranger');

  assert.ok(clericTpl && clericTpl.hitDieSize === 8, 'Cleric template hitDieSize must be 8');
  assert.ok(druidTpl && druidTpl.hitDieSize === 8, 'Druid template hitDieSize must be 8');
  assert.ok(paladinTpl && paladinTpl.hitDieSize === 10, 'Paladin template hitDieSize must be 10');
  assert.ok(rangerTpl && rangerTpl.hitDieSize === 10, 'Ranger template hitDieSize must be 10');
});

// ═════════════════════════════════════════════════════════════════════
// 2. SUBCLASS SELECTION LEVELS AUDIT
//    Жрец: 1 ур. (Божественный домен)
//    Друид: 2 ур. (Круг друидов)
//    Паладин: 3 ур. (Священная клятва)
//    Следопыт: 3 ур. (Архетип следопыта)
// ═════════════════════════════════════════════════════════════════════

test('2.1. Subclass unlocking levels in class-progression', () => {
  assert.equal(getClassSubclassLevel('Жрец'), 1, 'Жрец chooses subclass strictly at level 1');
  assert.equal(getClassSubclassLevel('cleric'), 1, 'Cleric (en) chooses subclass strictly at level 1');
  assert.equal(getClassSubclassLevel('Друид'), 2, 'Друид chooses subclass at level 2');
  assert.equal(getClassSubclassLevel('druid'), 2, 'Druid (en) chooses subclass at level 2');
  assert.equal(getClassSubclassLevel('Паладин'), 3, 'Паладин chooses subclass at level 3');
  assert.equal(getClassSubclassLevel('paladin'), 3, 'Paladin (en) chooses subclass at level 3');
  assert.equal(getClassSubclassLevel('Следопыт'), 3, 'Следопыт chooses subclass at level 3');
  assert.equal(getClassSubclassLevel('ranger'), 3, 'Ranger (en) chooses subclass at level 3');
});

test('2.2. Subclass levels in DND_COMPENDIUM_CLASSES compendium catalog', () => {
  const getCompCls = (name: string): CompendiumClass => {
    const found = DND_COMPENDIUM_CLASSES.find(c => c.name === name);
    assert.ok(found, `Class ${name} must exist in compendium`);
    return found;
  };

  const cleric = getCompCls('Жрец');
  assert.equal(cleric.subclassLevel, 1, 'Cleric compendium subclassLevel must be 1');
  assert.equal(cleric.subclassTitle, 'Божественный домен');
  assert.ok(cleric.subclasses && cleric.subclasses.length >= 7, 'Cleric must have multiple domains');

  const druid = getCompCls('Друид');
  assert.equal(druid.subclassLevel, 2, 'Druid compendium subclassLevel must be 2');
  assert.equal(druid.subclassTitle, 'Круг друидов');
  assert.ok(druid.subclasses && druid.subclasses.length >= 5, 'Druid must have multiple circles');

  const paladin = getCompCls('Паладин');
  assert.equal(paladin.subclassLevel, 3, 'Paladin compendium subclassLevel must be 3');
  assert.equal(paladin.subclassTitle, 'Священная клятва');
  assert.ok(paladin.subclasses && paladin.subclasses.length >= 5, 'Paladin must have multiple oaths');

  const ranger = getCompCls('Следопыт');
  assert.equal(ranger.subclassLevel, 3, 'Ranger compendium subclassLevel must be 3');
  assert.equal(ranger.subclassTitle, 'Архетип следопыта');
  assert.ok(ranger.subclasses && ranger.subclasses.length >= 5, 'Ranger must have multiple archetypes');
});

test('2.3. Subclass milestone feature levels validation', () => {
  // Cleric: 1, 2, 6, 8, 17
  assert.deepEqual(DND_CLASS_PROGRESSION['Жрец'].subclassFeatureLevels, [1, 2, 6, 8, 17]);
  assert.equal(isClassSubclassMilestone('Жрец', 1), true);
  assert.equal(isClassSubclassMilestone('Жрец', 2), true);
  assert.equal(isClassSubclassMilestone('Жрец', 6), true);
  assert.equal(isClassSubclassMilestone('Жрец', 8), true);
  assert.equal(isClassSubclassMilestone('Жрец', 17), true);
  assert.equal(isClassSubclassMilestone('Жрец', 3), false);

  // Druid: 2, 6, 10, 14
  assert.deepEqual(DND_CLASS_PROGRESSION['Друид'].subclassFeatureLevels, [2, 6, 10, 14]);
  assert.equal(isClassSubclassMilestone('Друид', 2), true);
  assert.equal(isClassSubclassMilestone('Друид', 6), true);
  assert.equal(isClassSubclassMilestone('Друид', 10), true);
  assert.equal(isClassSubclassMilestone('Друид', 14), true);
  assert.equal(isClassSubclassMilestone('Друид', 3), false);

  // Paladin: 3, 7, 15, 20
  assert.deepEqual(DND_CLASS_PROGRESSION['Паладин'].subclassFeatureLevels, [3, 7, 15, 20]);
  assert.equal(isClassSubclassMilestone('Паладин', 3), true);
  assert.equal(isClassSubclassMilestone('Паладин', 7), true);
  assert.equal(isClassSubclassMilestone('Паладин', 15), true);
  assert.equal(isClassSubclassMilestone('Паладин', 20), true);
  assert.equal(isClassSubclassMilestone('Паладин', 5), false);

  // Ranger: 3, 7, 11, 15
  assert.deepEqual(DND_CLASS_PROGRESSION['Следопыт'].subclassFeatureLevels, [3, 7, 11, 15]);
  assert.equal(isClassSubclassMilestone('Следопыт', 3), true);
  assert.equal(isClassSubclassMilestone('Следопыт', 7), true);
  assert.equal(isClassSubclassMilestone('Следопыт', 11), true);
  assert.equal(isClassSubclassMilestone('Следопыт', 15), true);
  assert.equal(isClassSubclassMilestone('Следопыт', 5), false);
});

// ═════════════════════════════════════════════════════════════════════
// 3. SPELL SLOTS AUDIT (1-20 LEVELS)
//    Full casters (Cleric, Druid): 1st circle at 1, 2nd at 3, ..., 9th at 17
//    Half casters (Paladin, Ranger): no slots at 1, 1st circle at 2, 2nd at 5, 3rd at 9, 4th at 13, 5th at 17
// ═════════════════════════════════════════════════════════════════════

test('3.1. Full Caster spell slots table (Cleric & Druid) matches SRD 5.1 exactly', () => {
  // Level 1: 2 x 1st
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[1], { 1: 2 });
  // Level 2: 3 x 1st
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[2], { 1: 3 });
  // Level 3: 4 x 1st, 2 x 2nd
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[3], { 1: 4, 2: 2 });
  // Level 5: 4 x 1st, 3 x 2nd, 2 x 3rd
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[5], { 1: 4, 2: 3, 3: 2 });
  // Level 7: 4, 3, 3, 1
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[7], { 1: 4, 2: 3, 3: 3, 4: 1 });
  // Level 9: 4, 3, 3, 3, 1
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[9], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 });
  // Level 11: 4, 3, 3, 3, 2, 1
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[11], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 });
  // Level 13: 4, 3, 3, 3, 2, 1, 1
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[13], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 });
  // Level 15: 4, 3, 3, 3, 2, 1, 1, 1
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[15], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 });
  // Level 17: 4, 3, 3, 3, 2, 1, 1, 1, 1 (9th level spell unlocked!)
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[17], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 });
  // Level 18: 5th slot increases to 3
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[18], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 });
  // Level 19: 6th slot increases to 2
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[19], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 });
  // Level 20: 7th slot increases to 2
  assert.deepEqual(FULL_CASTER_SPELL_SLOTS[20], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 });

  // Verify getSpellSlotsForClassLevel returns matching objects for Cleric and Druid across all 20 levels
  for (let lvl = 1; lvl <= 20; lvl++) {
    assert.deepEqual(getSpellSlotsForClassLevel('Жрец', lvl), FULL_CASTER_SPELL_SLOTS[lvl]);
    assert.deepEqual(getSpellSlotsForClassLevel('Друид', lvl), FULL_CASTER_SPELL_SLOTS[lvl]);
  }
});

test('3.2. Half Caster spell slots table (Paladin & Ranger) matches SRD 5.1 exactly', () => {
  // Level 1: strictly NO spell slots!
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[1], {}, 'Half-caster has no spell slots at level 1');
  assert.deepEqual(getSpellSlotsForClassLevel('Паладин', 1), {});
  assert.deepEqual(getSpellSlotsForClassLevel('Следопыт', 1), {});

  // Level 2: magic begins! 2 x 1st
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[2], { 1: 2 });
  // Level 3: 3 x 1st
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[3], { 1: 3 });
  // Level 4: 3 x 1st
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[4], { 1: 3 });
  // Level 5: 4 x 1st, 2 x 2nd (2nd circle unlocked!)
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[5], { 1: 4, 2: 2 });
  // Level 7: 4 x 1st, 3 x 2nd
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[7], { 1: 4, 2: 3 });
  // Level 9: 4 x 1st, 3 x 2nd, 2 x 3rd (3rd circle unlocked!)
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[9], { 1: 4, 2: 3, 3: 2 });
  // Level 11: 4 x 1st, 3 x 2nd, 3 x 3rd
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[11], { 1: 4, 2: 3, 3: 3 });
  // Level 13: 4 x 1st, 3 x 2nd, 3 x 3rd, 1 x 4th (4th circle unlocked!)
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[13], { 1: 4, 2: 3, 3: 3, 4: 1 });
  // Level 15: 4 x 1st, 3 x 2nd, 3 x 3rd, 2 x 4th
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[15], { 1: 4, 2: 3, 3: 3, 4: 2 });
  // Level 17: 4 x 1st, 3 x 2nd, 3 x 3rd, 3 x 4th, 1 x 5th (5th circle unlocked!)
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[17], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 });
  // Level 19: 4 x 1st, 3 x 2nd, 3 x 3rd, 3 x 4th, 2 x 5th
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[19], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 });
  // Level 20: 4 x 1st, 3 x 2nd, 3 x 3rd, 3 x 4th, 2 x 5th (no 6th+ spell slots for half-casters)
  assert.deepEqual(HALF_CASTER_SPELL_SLOTS[20], { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 });

  // Verify getSpellSlotsForClassLevel returns matching objects for Paladin and Ranger across all 20 levels
  for (let lvl = 1; lvl <= 20; lvl++) {
    assert.deepEqual(getSpellSlotsForClassLevel('Паладин', lvl), HALF_CASTER_SPELL_SLOTS[lvl]);
    assert.deepEqual(getSpellSlotsForClassLevel('Следопыт', lvl), HALF_CASTER_SPELL_SLOTS[lvl]);
  }
});

test('3.3. getNewSpellLevelUnlocked accurately detects circle milestones', () => {
  // Full Casters: unlocks circles 1..9 at levels 1, 3, 5, 7, 9, 11, 13, 15, 17
  const fullCasterMilestones: Record<number, number> = {
    1: 1, 3: 2, 5: 3, 7: 4, 9: 5, 11: 6, 13: 7, 15: 8, 17: 9,
  };
  for (let lvl = 1; lvl <= 20; lvl++) {
    const expected = fullCasterMilestones[lvl] || null;
    assert.equal(getNewSpellLevelUnlocked('Жрец', lvl), expected, `Cleric unlocked circle at lvl ${lvl}`);
    assert.equal(getNewSpellLevelUnlocked('Друид', lvl), expected, `Druid unlocked circle at lvl ${lvl}`);
  }

  // Half Casters: unlocks circles 1..5 at levels 2, 5, 9, 13, 17 (NO magic at level 1!)
  const halfCasterMilestones: Record<number, number> = {
    2: 1, 5: 2, 9: 3, 13: 4, 17: 5,
  };
  for (let lvl = 1; lvl <= 20; lvl++) {
    const expected = halfCasterMilestones[lvl] || null;
    assert.equal(getNewSpellLevelUnlocked('Паладин', lvl), expected, `Paladin unlocked circle at lvl ${lvl}`);
    assert.equal(getNewSpellLevelUnlocked('Следопыт', lvl), expected, `Ranger unlocked circle at lvl ${lvl}`);
  }
});

// ═════════════════════════════════════════════════════════════════════
// 4. ASI (ABILITY SCORE IMPROVEMENT) AUDIT
//    All 4 classes: levels 4, 8, 12, 16, 19
// ═════════════════════════════════════════════════════════════════════

test('4.1. ASI levels configuration in class-progression and dnd-types', () => {
  const standardASI = [4, 8, 12, 16, 19];
  for (const cls of ['Жрец', 'Друид', 'Паладин', 'Следопыт']) {
    assert.deepEqual(DND_CLASS_PROGRESSION[cls]?.asiLevels, standardASI, `${cls} asiLevels must be [4, 8, 12, 16, 19]`);
    for (let lvl = 1; lvl <= 20; lvl++) {
      const expected = standardASI.includes(lvl);
      assert.equal(isClassASILevel(cls, lvl), expected, `${cls} ASI check at level ${lvl}`);
      assert.equal(isStandardASILevel(lvl, cls), expected, `${cls} standard ASI check at level ${lvl}`);
    }
  }
});

// ═════════════════════════════════════════════════════════════════════
// 5. CLASS FEATURES AUDIT (1-20) & RULE DISCREPANCIES IDENTIFICATION
// ═════════════════════════════════════════════════════════════════════

test('5.1. Every level from 1 to 20 has features defined for all 4 classes', () => {
  for (const cls of ['Жрец', 'Друид', 'Паладин', 'Следопыт']) {
    for (let lvl = 1; lvl <= 20; lvl++) {
      const fts = getClassFeaturesForLevel(cls, lvl);
      assert.ok(fts && fts.length > 0, `${cls} must have at least one feature at level ${lvl}`);
    }
  }
});

test('5.2. Cleric (Жрец) signature features verification', () => {
  const f1 = getClassFeaturesForLevel('Жрец', 1);
  assert.ok(f1.some(f => f.name.includes('Божественный домен')), 'Cleric lvl 1 must have Divine Domain');

  const f2 = getClassFeaturesForLevel('Жрец', 2);
  assert.ok(f2.some(f => f.name.includes('Божественный канал')), 'Cleric lvl 2 must have Channel Divinity');

  const f10 = getClassFeaturesForLevel('Жрец', 10);
  assert.ok(f10.some(f => f.name.includes('Божественное вмешательство')), 'Cleric lvl 10 must have Divine Intervention');

  const f20 = getClassFeaturesForLevel('Жрец', 20);
  assert.ok(f20.some(f => f.name.includes('Гарантированное божественное вмешательство')), 'Cleric lvl 20 must have guaranteed Divine Intervention');
});

test('5.3. Druid (Друид) signature features verification', () => {
  const f1 = getClassFeaturesForLevel('Друид', 1);
  assert.ok(f1.some(f => f.name.includes('Друидический язык')), 'Druid lvl 1 must have Druidic');
  assert.ok(f1.some(f => f.name.includes('Сотворение заклинаний')), 'Druid lvl 1 must have Spellcasting');

  const f2 = getClassFeaturesForLevel('Друид', 2);
  assert.ok(f2.some(f => f.name.includes('Дикий облик')), 'Druid lvl 2 must have Wild Shape');
  assert.ok(f2.some(f => f.name.includes('Круг друидов')), 'Druid lvl 2 must have Druid Circle');

  const f18 = getClassFeaturesForLevel('Друид', 18);
  assert.ok(f18.some(f => f.name.includes('Вне времени')), 'Druid lvl 18 must have Timeless Body');
  assert.ok(f18.some(f => f.name.includes('Заклинания дикого облика')), 'Druid lvl 18 must have Beast Spells');

  const f20 = getClassFeaturesForLevel('Друид', 20);
  assert.ok(f20.some(f => f.name.includes('Архидруид')), 'Druid lvl 20 must have Archdruid');
});

test('5.4. Paladin (Паладин) signature features verification', () => {
  const f1 = getClassFeaturesForLevel('Паладин', 1);
  assert.ok(f1.some(f => f.name.includes('Божественное чувство')), 'Paladin lvl 1 must have Divine Sense');
  assert.ok(f1.some(f => f.name.includes('Возложение рук')), 'Paladin lvl 1 must have Lay on Hands');

  const f2 = getClassFeaturesForLevel('Паладин', 2);
  assert.ok(f2.some(f => f.name.includes('Боевой стиль')), 'Paladin lvl 2 must have Fighting Style');
  assert.ok(f2.some(f => f.name.includes('Божественная кара')), 'Paladin lvl 2 must have Divine Smite');
  assert.ok(f2.some(f => f.name.includes('Сотворение заклинаний')), 'Paladin lvl 2 must have Spellcasting');

  const f3 = getClassFeaturesForLevel('Паладин', 3);
  assert.ok(f3.some(f => f.name.includes('Священная клятва')), 'Paladin lvl 3 must have Sacred Oath');
  assert.ok(f3.some(f => f.name.includes('Божественное здоровье')), 'Paladin lvl 3 must have Divine Health');

  const f6 = getClassFeaturesForLevel('Паладин', 6);
  assert.ok(f6.some(f => f.name.includes('Аура защиты')), 'Paladin lvl 6 must have Aura of Protection');

  const f11 = getClassFeaturesForLevel('Паладин', 11);
  assert.ok(f11.some(f => f.name.includes('Улучшенная божественная кара')), 'Paladin lvl 11 must have Improved Divine Smite');

  const f20 = getClassFeaturesForLevel('Паладин', 20);
  assert.ok(f20.some(f => f.name.includes('Аватар клятвы')), 'Paladin lvl 20 must have Oath Avatar capstone');
});

test('5.5. Ranger (Следопыт) feature audit & Rule Discrepancies detection', () => {
  const f1 = getClassFeaturesForLevel('Следопыт', 1);
  assert.ok(f1.some(f => f.name.includes('Избранный враг')), 'Ranger lvl 1 must have Favored Enemy');
  assert.ok(f1.some(f => f.name.includes('Исследователь природы')), 'Ranger lvl 1 must have Natural Explorer');

  const f2 = getClassFeaturesForLevel('Следопыт', 2);
  assert.ok(f2.some(f => f.name.includes('Боевой стиль')), 'Ranger lvl 2 must have Fighting Style');
  assert.ok(f2.some(f => f.name.includes('Сотворение заклинаний')), 'Ranger lvl 2 must have Spellcasting');

  const f3 = getClassFeaturesForLevel('Следопыт', 3);
  assert.ok(f3.some(f => f.name.includes('Архетип следопыта')), 'Ranger lvl 3 must have Archetype');
  assert.ok(f3.some(f => f.name.includes('Первобытная информированность')), 'Ranger lvl 3 must have Primeval Awareness');

  // DISCREPANCY AUDIT: Check naming vs description in levels 8, 10, 14
  const f8 = getClassFeaturesForLevel('Следопыт', 8);
  const f10 = getClassFeaturesForLevel('Следопыт', 10);
  const f14 = getClassFeaturesForLevel('Следопыт', 14);

  // In PHB/SRD 5e:
  // Lvl 8 is "Land's Stride" (Перемещение по местности/Быстроногий)
  // Lvl 10 is "Hide in Plain Sight" (Маскировка на виду)
  // Lvl 14 is "Vanish" (Исчезновение)
  const f8Feature = f8.find(f => f.name.includes('Перемещение по местности') || f.name.includes('Land\'s Stride'));
  const f10Feature = f10.find(f => f.name.includes('Маскировка на виду') || f.name.includes('Hide in Plain Sight'));
  const f14Feature = f14.find(f => f.name.includes('Исчезновение') || f.name.includes('Vanish'));

  assert.ok(f8Feature, 'Level 8 must be Перемещение по местности (Land\'s Stride)');
  assert.ok(f10Feature, 'Level 10 must be Маскировка на виду (Hide in Plain Sight)');
  assert.ok(f14Feature, 'Level 14 must be Исчезновение (Vanish)');
});

// ═════════════════════════════════════════════════════════════════════
// 6. STRESS-TEST: FULL LEVEL-UP (1 -> 20) & LEVEL ROLLBACK (20 -> 1)
// ═════════════════════════════════════════════════════════════════════

interface ClassProgressionScenario {
  templateId: 'cleric' | 'druid' | 'paladin' | 'ranger';
  className: string;
  expectedHitDieSize: number;
  expectedAvgHPPerLevel: number;
  subclassMilestoneLevel: number;
  subclassName: string;
}

const SCENARIOS: ClassProgressionScenario[] = [
  {
    templateId: 'cleric',
    className: 'Жрец',
    expectedHitDieSize: 8,
    expectedAvgHPPerLevel: 5,
    subclassMilestoneLevel: 1,
    subclassName: 'Домен Жизни',
  },
  {
    templateId: 'druid',
    className: 'Друид',
    expectedHitDieSize: 8,
    expectedAvgHPPerLevel: 5,
    subclassMilestoneLevel: 2,
    subclassName: 'Круг Луны',
  },
  {
    templateId: 'paladin',
    className: 'Паладин',
    expectedHitDieSize: 10,
    expectedAvgHPPerLevel: 6,
    subclassMilestoneLevel: 3,
    subclassName: 'Клятва преданности',
  },
  {
    templateId: 'ranger',
    className: 'Следопыт',
    expectedHitDieSize: 10,
    expectedAvgHPPerLevel: 6,
    subclassMilestoneLevel: 3,
    subclassName: 'Охотник',
  },
];

for (const sc of SCENARIOS) {
  test(`6. Stress Test: ${sc.className} 1 -> 20 Level-Up and 20 -> 1 Rollback`, () => {
    // 1. Initialize character from template
    let char = applyClassTemplate(sc.templateId);
    assert.equal(char.level, 1, 'Initial level must be 1');
    assert.equal(char.hitDice, `1d${sc.expectedHitDieSize}`);

    // If Cleric, set initial subclass at level 1 as required by SRD 5.1
    if (sc.subclassMilestoneLevel === 1) {
      char.subclass = sc.subclassName;
    }

    const initialHP = char.hpMax || 0;
    const initialHitDice = char.hitDice;
    const initialSlots = JSON.stringify(char.spellSlots);
    const initialSubclass = char.subclass;

    // 2. Perform 19 level-ups from level 2 to 20
    let totalHPGained = 0;

    for (let targetLevel = 2; targetLevel <= 20; targetLevel++) {
      const isAsi = isClassASILevel(sc.className, targetLevel);

      const hpGain = sc.expectedAvgHPPerLevel;
      totalHPGained += hpGain;

      const slotsGained = getSpellSlotsForClassLevel(sc.className, targetLevel);
      const isSubclassChoiceLevel = targetLevel === sc.subclassMilestoneLevel;

      const entry: LevelUpEntry = {
        level: targetLevel,
        hpGained: hpGain,
        asiAbilities: isAsi ? ['МДР', 'ТЕЛ'] : null,
        newSubclass: isSubclassChoiceLevel ? sc.subclassName : undefined,
        addedTraits: [
          {
            id: `feat-${targetLevel}`,
            name: `Feature Lvl ${targetLevel}`,
            source: `${sc.className} (${targetLevel} ур.)`,
            summary: `Feature ${targetLevel}`,
            description: `Auto-added feature at level ${targetLevel}`,
          },
        ],
        spellSlotsGained: slotsGained || undefined,
        notes: `Level ${targetLevel} reached`,
        newCantrips: [],
        newSpells: [],
        newSavingThrowProfs: [],
        newSkillProfs: [],
        newSkillExpertise: [],
        newAttacks: [],
        newProficienciesText: '',
        newEquipmentText: '',
      };

      char = applyLevelUp(char, entry);

      // Verify level-up invariant at each step
      assert.equal(char.level, targetLevel, `Character level must be ${targetLevel}`);
      assert.equal(char.hitDice, `${targetLevel}d${sc.expectedHitDieSize}`);
      assert.equal(char.levelHistory.length, targetLevel - 1);

      // Verify spell slots at this level
      if (slotsGained) {
        for (const [sLvl, count] of Object.entries(slotsGained)) {
          assert.equal(
            char.spellSlots[Number(sLvl)]?.totalSlots,
            count,
            `${sc.className} level ${targetLevel} must have ${count} slots of level ${sLvl}`
          );
        }
      }
    }

    // Check level 20 state
    assert.equal(char.level, 20);
    assert.equal(char.hpMax, initialHP + totalHPGained);
    assert.equal(char.hitDice, `20d${sc.expectedHitDieSize}`);
    assert.equal(char.asiBonuses['МДР'], 5, 'Wisdom ASI should have received 5 increments (+1 on lvls 4,8,12,16,19)');
    assert.equal(char.asiBonuses['ТЕЛ'], 5, 'Constitution ASI should have received 5 increments');
    assert.equal(char.levelHistory.length, 19);

    if (sc.templateId === 'paladin' || sc.templateId === 'ranger') {
      // Half-casters at lvl 20: 5th level spell slots = 2, no 6th+ slots
      assert.equal(char.spellSlots[5]?.totalSlots, 2);
      assert.equal(char.spellSlots[6], undefined);
    } else {
      // Full-casters at lvl 20: 9th level spell slots = 1, 7th level = 2
      assert.equal(char.spellSlots[9]?.totalSlots, 1);
      assert.equal(char.spellSlots[7]?.totalSlots, 2);
    }

    // 3. Perform 19 level-downs from level 20 back to 1
    for (let currentLvl = 20; currentLvl >= 2; currentLvl--) {
      char = applyLevelDown(char);
      assert.equal(char.level, currentLvl - 1, `After rollback from ${currentLvl}, level must be ${currentLvl - 1}`);
      assert.equal(char.hitDice, `${currentLvl - 1}d${sc.expectedHitDieSize}`);
      assert.equal(char.levelHistory.length, currentLvl - 2);
    }

    // 4. Verify that character returns PRECISELY to baseline level 1 state
    assert.equal(char.level, 1, 'Level must be reverted to 1');
    assert.equal(char.hpMax, initialHP, `HP must be reverted to initial HP ${initialHP}`);
    assert.equal(char.hpCurrent, initialHP, 'Current HP must equal initial HP');
    assert.equal(char.hitDice, initialHitDice, `Hit dice notation must be ${initialHitDice}`);
    assert.equal(char.asiBonuses['МДР'] || 0, 0, 'ASI bonus for МДР must be completely reverted to 0');
    assert.equal(char.asiBonuses['ТЕЛ'] || 0, 0, 'ASI bonus for ТЕЛ must be completely reverted to 0');
    assert.equal(char.levelHistory.length, 0, 'levelHistory must be empty after full rollback');

    // Subclass reversion check:
    // If subclass was picked at lvl 2 (Druid) or lvl 3 (Paladin/Ranger), it must be reverted to ''
    // If subclass was picked at lvl 1 (Cleric), it must be preserved!
    if (sc.subclassMilestoneLevel > 1) {
      assert.equal(char.subclass, '', `${sc.className} subclass must be reverted to empty string at level 1`);
    } else {
      assert.equal(char.subclass, initialSubclass, `${sc.className} subclass selected at level 1 must be preserved`);
    }

    // Spell slots reversion check:
    if (sc.templateId === 'paladin' || sc.templateId === 'ranger') {
      // At level 1, half-casters have NO spell slots!
      assert.deepEqual(char.spellSlots, {}, `${sc.className} must have 0 spell slots at level 1 after rollback`);
    } else {
      // At level 1, full-casters have 2 x 1st level slots
      assert.equal(char.spellSlots[1]?.totalSlots, 2, `${sc.className} must have 2 first-level spell slots at level 1`);
      assert.equal(char.spellSlots[2], undefined, `${sc.className} must have no 2nd-level spell slots at level 1`);
    }

    // 5. Test boundary: cannot level down below level 1
    const clampedChar = applyLevelDown(char);
    assert.equal(clampedChar.level, 1, 'Level down at level 1 must clamp at 1');
  });
}
