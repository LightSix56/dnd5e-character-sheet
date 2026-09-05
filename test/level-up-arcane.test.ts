import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DND_CLASS_PROGRESSION,
  FULL_CASTER_SPELL_SLOTS,
  ARTIFICER_SPELL_SLOTS,
  WARLOCK_PACT_SPELL_SLOTS,
  getClassFeaturesForLevel,
  getClassSubclassLevel,
  getNewSpellLevelUnlocked,
  getSpellSlotsForClassLevel,
  isClassASILevel,
  isClassSubclassMilestone,
  normalizeClassName
} from '../src/data/compendium/class-progression';

import {
  DND_COMPENDIUM_CLASSES,
  getSubclassesForClass
} from '../src/data/compendium/classes';

import {
  CLASS_TEMPLATES,
  applyClassTemplate,
  createDefaultCharacter,
  getHitDieSize,
  getHitDieAverage,
  getHitDiceNotation,
  isStandardASILevel,
  calcProficiencyBonus,
  calcModifier,
  getTotalScore,
  type CharacterData,
  type LevelUpEntry,
  type AbilityName,
  type TraitItem
} from '../src/lib/dnd-types';

import {
  getMaxAvailableSpellSlotLevel,
  isSpellLevelAllowedForCharacter,
  isSpellAllowedForCharacter
} from '../src/data/compendium/class-spells';

import {
  calcPreparedSpellsLimit,
  getClassSpellcastingLimits
} from '../src/components/wizard/wizard-helpers';

// ── Reducer Helpers from src/app/page.tsx ──

function applyLevelUp(prev: CharacterData, entry: LevelUpEntry): CharacterData {
  const newHP = (prev.hpMax || 0) + entry.hpGained;
  const newAsi = { ...prev.asiBonuses };
  if (entry.asiAbilities) {
    newAsi[entry.asiAbilities[0]] = (newAsi[entry.asiAbilities[0]] || 0) + 1;
    newAsi[entry.asiAbilities[1]] = (newAsi[entry.asiAbilities[1]] || 0) + 1;
  }
  let newHitDice = prev.hitDice;
  if (newHitDice) {
    const dieSize = getHitDieSize(newHitDice);
    const notation = getHitDiceNotation(newHitDice);
    newHitDice = `${prev.level + 1}${notation}${dieSize}`;
  }

  let updatedTraits = [...(prev.traitsList || [])];
  if (entry.addedTraits && entry.addedTraits.length > 0) {
    updatedTraits = [...updatedTraits, ...entry.addedTraits];
  }

  let updatedSubclass = prev.subclass;
  if (entry.newSubclass) {
    updatedSubclass = entry.newSubclass;
  }

  let updatedSpellSlots = { ...prev.spellSlots };
  if (entry.spellSlotsGained) {
    for (const [lvlStr, count] of Object.entries(entry.spellSlotsGained)) {
      const l = Number(lvlStr);
      updatedSpellSlots[l] = {
        totalSlots: count,
        expendedSlots: prev.spellSlots?.[l]?.expendedSlots || 0,
      };
    }
  }

  let newFeatures = prev.featuresTraits;
  if (entry.notes) {
    newFeatures = newFeatures ? newFeatures + '\n' + entry.notes : entry.notes;
  }
  if (entry.selectedFeat) {
    const featNote = `[Черта ${entry.level} ур.]: ${entry.selectedFeat}`;
    newFeatures = newFeatures ? newFeatures + '\n' + featNote : featNote;
  }

  const addCantrips = entry.newCantrips.filter(c => c.trim());
  const updatedCantrips = [...prev.cantrips, ...addCantrips];
  const updatedSpells = { ...prev.spellsByLevel };
  for (const spell of entry.newSpells) {
    if (!spell.name.trim()) continue;
    const lvl = spell.level;
    updatedSpells[lvl] = [...(updatedSpells[lvl] || []), { name: spell.name, prepared: spell.prepared }];
  }
  const updatedSaveProfs = { ...prev.savingThrowProficiencies };
  for (const ability of entry.newSavingThrowProfs) {
    updatedSaveProfs[ability] = true;
  }
  const updatedSkillProfs = { ...prev.skillProficiencies };
  for (const skill of entry.newSkillProfs) {
    updatedSkillProfs[skill] = true;
  }
  const updatedSkillExpertise = { ...prev.skillExpertise };
  for (const skill of entry.newSkillExpertise) {
    updatedSkillExpertise[skill] = true;
  }
  const addAttacks = entry.newAttacks.filter(a => a.name.trim());
  const updatedAttacks = [...prev.attacks, ...addAttacks];
  let updatedProfText = prev.otherProficienciesLanguages;
  if (entry.newProficienciesText) {
    updatedProfText = updatedProfText ? updatedProfText + '\n' + entry.newProficienciesText : entry.newProficienciesText;
  }
  let updatedEquipText = prev.equipment;
  if (entry.newEquipmentText) {
    updatedEquipText = updatedEquipText ? updatedEquipText + '\n' + entry.newEquipmentText : entry.newEquipmentText;
  }
  return {
    ...prev,
    level: entry.level,
    hpMax: newHP,
    hpCurrent: newHP,
    hitDice: newHitDice,
    subclass: updatedSubclass,
    asiBonuses: newAsi,
    traitsList: updatedTraits,
    spellSlots: updatedSpellSlots,
    featuresTraits: newFeatures,
    cantrips: updatedCantrips,
    spellsByLevel: updatedSpells,
    savingThrowProficiencies: updatedSaveProfs,
    skillProficiencies: updatedSkillProfs,
    skillExpertise: updatedSkillExpertise,
    attacks: updatedAttacks,
    otherProficienciesLanguages: updatedProfText,
    equipment: updatedEquipText,
    levelHistory: [...(Array.isArray(prev.levelHistory) ? prev.levelHistory : []), entry],
  };
}

function applyLevelDown(prev: CharacterData): CharacterData {
  const newLevel = Math.max(1, prev.level - 1);
  const history = Array.isArray(prev.levelHistory) ? prev.levelHistory : [];
  const last = history[history.length - 1];
  let newHP = prev.hpMax || 0;
  if (last) {
    newHP = Math.max(1, newHP - last.hpGained);
  } else {
    const avg = (prev.hitDice ? getHitDieAverage(prev.hitDice) : 5) + calcModifier(prev.abilityScores['ТЕЛ'] || 10);
    newHP = Math.max(1, newHP - Math.max(1, avg));
  }
  const newAsi = { ...prev.asiBonuses };
  if (last?.asiAbilities && last.asiAbilities.length > 0) {
    newAsi[last.asiAbilities[0]] = Math.max(0, (newAsi[last.asiAbilities[0]] || 0) - 1);
    if (last.asiAbilities[1]) {
      newAsi[last.asiAbilities[1]] = Math.max(0, (newAsi[last.asiAbilities[1]] || 0) - 1);
    }
  }
  let newHitDice = prev.hitDice;
  if (newHitDice) {
    const dieSize = getHitDieSize(newHitDice);
    const notation = getHitDiceNotation(newHitDice);
    newHitDice = `${newLevel}${notation}${dieSize}`;
  }

  let updatedTraits = [...(prev.traitsList || [])];
  if (last?.addedTraits && last.addedTraits.length > 0) {
    const addedIds = new Set(last.addedTraits.map(t => t.id));
    const addedNames = new Set(last.addedTraits.map(t => t.name.toLowerCase()));
    updatedTraits = updatedTraits.filter(t => !addedIds.has(t.id) && !addedNames.has(t.name.toLowerCase()));
  }

  let updatedSubclass = prev.subclass;
  if (last?.newSubclass && prev.subclass === last.newSubclass) {
    updatedSubclass = '';
  }

  const prevSlots = getSpellSlotsForClassLevel(prev.className, newLevel);
  let updatedSpellSlots = { ...prev.spellSlots };
  if (prevSlots) {
    for (let l = 1; l <= 9; l++) {
      if (prevSlots[l]) {
        updatedSpellSlots[l] = {
          totalSlots: prevSlots[l],
          expendedSlots: Math.min(prevSlots[l], prev.spellSlots?.[l]?.expendedSlots || 0),
        };
      } else {
        delete updatedSpellSlots[l];
      }
    }
  }

  let newFeatures = prev.featuresTraits;
  if (last?.notes) {
    newFeatures = newFeatures.replace(last.notes, '').replace(/\n{2,}/g, '\n').trim();
  }
  if (last?.selectedFeat) {
    const featNote = `[Черта ${prev.level} ур.]: ${last.selectedFeat}`;
    newFeatures = newFeatures.replace(featNote, '').replace(/\n{2,}/g, '\n').trim();
  }

  let updatedCantrips = [...prev.cantrips];
  if (last?.newCantrips) {
    const removeSet = new Set(last.newCantrips);
    updatedCantrips = updatedCantrips.filter(c => !removeSet.has(c));
  }
  const updatedSpells = { ...prev.spellsByLevel };
  if (last?.newSpells) {
    for (const spell of last.newSpells) {
      const lvl = spell.level;
      if (updatedSpells[lvl]) {
        updatedSpells[lvl] = updatedSpells[lvl].filter(s => s.name !== spell.name);
      }
    }
  }
  const updatedSaveProfs = { ...prev.savingThrowProficiencies };
  if (last?.newSavingThrowProfs) {
    for (const ability of last.newSavingThrowProfs) {
      updatedSaveProfs[ability] = false;
    }
  }
  const updatedSkillProf = { ...prev.skillProficiencies };
  if (last?.newSkillProfs) {
    for (const skill of last.newSkillProfs) {
      updatedSkillProf[skill] = false;
    }
  }
  const updatedSkillExpertise = { ...prev.skillExpertise };
  if (last?.newSkillExpertise) {
    for (const skill of last.newSkillExpertise) {
      updatedSkillExpertise[skill] = false;
    }
  }
  let updatedAttacks = [...prev.attacks];
  if (last?.newAttacks) {
    const removeNames = new Set(last.newAttacks.map(a => a.name));
    updatedAttacks = updatedAttacks.filter(a => !removeNames.has(a.name));
  }
  let updatedProfText = prev.otherProficienciesLanguages;
  if (last?.newProficienciesText) {
    updatedProfText = updatedProfText.replace(last.newProficienciesText, '').replace(/\n{2,}/g, '\n').trim();
  }
  let updatedEquipText = prev.equipment;
  if (last?.newEquipmentText) {
    updatedEquipText = updatedEquipText.replace(last.newEquipmentText, '').replace(/\n{2,}/g, '\n').trim();
  }
  return {
    ...prev,
    level: newLevel,
    hpMax: newHP,
    hpCurrent: Math.min(prev.hpCurrent, newHP),
    hitDice: newHitDice,
    subclass: updatedSubclass,
    asiBonuses: newAsi,
    traitsList: updatedTraits,
    spellSlots: updatedSpellSlots,
    featuresTraits: newFeatures,
    cantrips: updatedCantrips,
    spellsByLevel: updatedSpells,
    savingThrowProficiencies: updatedSaveProfs,
    skillProficiencies: updatedSkillProf,
    skillExpertise: updatedSkillExpertise,
    attacks: updatedAttacks,
    otherProficienciesLanguages: updatedProfText,
    equipment: updatedEquipText,
    levelHistory: history.slice(0, -1),
  };
}

// ══════════════════════════════════════════════════════════════
// 1. HIT DICE & HP PROGRESSION AUDIT (SRD 5.1 / dnd.su)
// ══════════════════════════════════════════════════════════════

test('Arcane Casters Hit Dice: Wizard & Sorcerer d6, Warlock, Bard, Artificer d8', () => {
  const expectedDice: Record<string, number> = {
    'Волшебник': 6,
    'Чародей': 6,
    'Колдун': 8,
    'Бард': 8,
    'Изобретатель': 8,
  };

  for (const [cls, size] of Object.entries(expectedDice)) {
    const prog = DND_CLASS_PROGRESSION[cls];
    assert.ok(prog, `Class ${cls} must exist in DND_CLASS_PROGRESSION`);
    assert.equal(prog.hitDie, size, `${cls} hitDie in progression must be d${size}`);

    const compClass = DND_COMPENDIUM_CLASSES.find(c => c.name === cls);
    assert.ok(compClass, `Class ${cls} must exist in DND_COMPENDIUM_CLASSES`);
    assert.equal(compClass.hitDieSize, size, `${cls} hitDieSize in compendium must be d${size}`);

    const template = CLASS_TEMPLATES.find(t => t.name === cls);
    assert.ok(template, `Class ${cls} must exist in CLASS_TEMPLATES`);
    assert.equal(template.hitDieSize, size, `${cls} hitDieSize in template must be d${size}`);
  }
});

test('Hit Dice Helper: getHitDieSize & getHitDieAverage compute correctly for d6 and d8', () => {
  // English notation
  assert.equal(getHitDieSize('1d6'), 6);
  assert.equal(getHitDieSize('20d6'), 6);
  assert.equal(getHitDieAverage('1d6'), 4, 'd6 average must be ceil(7/2) = 4');

  assert.equal(getHitDieSize('1d8'), 8);
  assert.equal(getHitDieSize('20d8'), 8);
  assert.equal(getHitDieAverage('1d8'), 5, 'd8 average must be ceil(9/2) = 5');

  // Russian notation (1к6, 1к8)
  assert.equal(getHitDieSize('1к6'), 6);
  assert.equal(getHitDieAverage('1к6'), 4);
  assert.equal(getHitDiceNotation('1к6'), 'к');

  assert.equal(getHitDieSize('1к8'), 8);
  assert.equal(getHitDieAverage('1к8'), 5);
  assert.equal(getHitDiceNotation('1к8'), 'к');
});

// ══════════════════════════════════════════════════════════════
// 2. SUBCLASS UNLOCK LEVELS & ARCHETYPE MILESTONES AUDIT
// ══════════════════════════════════════════════════════════════

test('Subclass Selection Levels: Sorcerer & Warlock at 1, Wizard at 2, Bard & Artificer at 3', () => {
  assert.equal(getClassSubclassLevel('Чародей'), 1, 'Чародей must choose origin at Level 1');
  assert.equal(getClassSubclassLevel('Колдун'), 1, 'Колдун must choose patron at Level 1');
  assert.equal(getClassSubclassLevel('Волшебник'), 2, 'Волшебник must choose arcane tradition at Level 2');
  assert.equal(getClassSubclassLevel('Бард'), 3, 'Бард must choose college at Level 3');
  assert.equal(getClassSubclassLevel('Изобретатель'), 3, 'Изобретатель must choose specialization at Level 3');
});

test('Subclass Archetype Feature Milestones: accurate to 5e rules', () => {
  // Wizard: 2, 6, 10, 14
  assert.deepEqual(DND_CLASS_PROGRESSION['Волшебник'].subclassFeatureLevels, [2, 6, 10, 14]);
  assert.ok(isClassSubclassMilestone('Волшебник', 2));
  assert.ok(isClassSubclassMilestone('Волшебник', 6));
  assert.ok(isClassSubclassMilestone('Волшебник', 10));
  assert.ok(isClassSubclassMilestone('Волшебник', 14));
  assert.ok(!isClassSubclassMilestone('Волшебник', 3));

  // Sorcerer: 1, 6, 14, 18
  assert.deepEqual(DND_CLASS_PROGRESSION['Чародей'].subclassFeatureLevels, [1, 6, 14, 18]);
  assert.ok(isClassSubclassMilestone('Чародей', 1));
  assert.ok(isClassSubclassMilestone('Чародей', 6));
  assert.ok(isClassSubclassMilestone('Чародей', 14));
  assert.ok(isClassSubclassMilestone('Чародей', 18));
  assert.ok(!isClassSubclassMilestone('Чародей', 3));

  // Warlock: 1, 6, 10, 14
  assert.deepEqual(DND_CLASS_PROGRESSION['Колдун'].subclassFeatureLevels, [1, 6, 10, 14]);
  assert.ok(isClassSubclassMilestone('Колдун', 1));
  assert.ok(isClassSubclassMilestone('Колдун', 6));
  assert.ok(isClassSubclassMilestone('Колдун', 10));
  assert.ok(isClassSubclassMilestone('Колдун', 14));

  // Bard: 3, 6, 14
  assert.deepEqual(DND_CLASS_PROGRESSION['Бард'].subclassFeatureLevels, [3, 6, 14]);
  assert.ok(isClassSubclassMilestone('Бард', 3));
  assert.ok(isClassSubclassMilestone('Бард', 6));
  assert.ok(isClassSubclassMilestone('Бард', 14));

  // Artificer: 3, 5, 9, 15 (TCE rules)
  assert.deepEqual(DND_CLASS_PROGRESSION['Изобретатель'].subclassFeatureLevels, [3, 5, 9, 15]);
  assert.ok(isClassSubclassMilestone('Изобретатель', 3));
  assert.ok(isClassSubclassMilestone('Изобретатель', 5));
  assert.ok(isClassSubclassMilestone('Изобретатель', 9));
  assert.ok(isClassSubclassMilestone('Изобретатель', 15));
});

test('Audit Stress: Sorcerer and Warlock Level 1 creation template subclass state', () => {
  const sorc = applyClassTemplate('sorcerer');
  const warlock = applyClassTemplate('warlock');

  // In official 5e rules, Sorcerer MUST have an origin (e.g. Draconic Bloodline or Wild Magic) at Level 1,
  // and Warlock MUST have an Otherworldly Patron at Level 1.
  assert.equal(sorc.className, 'Чародей');
  assert.equal(warlock.className, 'Колдун');
  // Notice: applyClassTemplate initializes subclass as undefined/empty string!
  assert.ok(!sorc.subclass, 'FLAW AUDIT: Sorcerer Level 1 template currently has empty subclass!');
  assert.ok(!warlock.subclass, 'FLAW AUDIT: Warlock Level 1 template currently has empty subclass!');
});

// ══════════════════════════════════════════════════════════════
// 3. SPELLCASTING SPECIFICS AUDIT (FULL CASTER, PACT MAGIC, HALF CASTER)
// ══════════════════════════════════════════════════════════════

test('Full Casters Spell Slots: Wizard, Sorcerer, Bard follow standard 1-20 table', () => {
  const fullCasterClasses = ['Волшебник', 'Чародей', 'Бард'];

  for (const cls of fullCasterClasses) {
    // Level 1: 2 1st-level slots
    assert.deepEqual(getSpellSlotsForClassLevel(cls, 1), { 1: 2 });
    // Level 3: 4 1st, 2 2nd
    assert.deepEqual(getSpellSlotsForClassLevel(cls, 3), { 1: 4, 2: 2 });
    // Level 5: 4 1st, 3 2nd, 2 3rd
    assert.deepEqual(getSpellSlotsForClassLevel(cls, 5), { 1: 4, 2: 3, 3: 2 });
    // Level 9: 4 1st, 3 2nd, 3 3rd, 3 4th, 1 5th
    assert.deepEqual(getSpellSlotsForClassLevel(cls, 9), { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 });
    // Level 17: 9th circle unlocked
    const l17 = getSpellSlotsForClassLevel(cls, 17);
    assert.ok(l17 && l17[9] === 1, `${cls} at level 17 must unlock 1 9th-level slot`);
    // Level 20: 4, 3, 3, 3, 3, 2, 2, 1, 1
    assert.deepEqual(getSpellSlotsForClassLevel(cls, 20), {
      1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1
    });
  }
});

test('Spell Circle Unlocks: getNewSpellLevelUnlocked accurately detects new circles', () => {
  // Wizard/Sorcerer/Bard: unlocks at 1, 3, 5, 7, 9, 11, 13, 15, 17
  const expectedUnlocks: Record<number, number> = {
    1: 1, 3: 2, 5: 3, 7: 4, 9: 5, 11: 6, 13: 7, 15: 8, 17: 9
  };

  for (let lvl = 1; lvl <= 20; lvl++) {
    const unlocked = getNewSpellLevelUnlocked('Волшебник', lvl);
    if (expectedUnlocks[lvl]) {
      assert.equal(unlocked, expectedUnlocks[lvl], `Level ${lvl} must unlock circle ${expectedUnlocks[lvl]}`);
    } else {
      assert.equal(unlocked, null, `Level ${lvl} should not unlock a new circle`);
    }
  }
});

test('Artificer Spell Slots: Half-caster that gains 1st-level slots at Level 1 (TCE)', () => {
  // Level 1: 2 1st-level slots (Unlike Paladin/Ranger who get 0 at Level 1)
  const l1 = getSpellSlotsForClassLevel('Изобретатель', 1);
  assert.deepEqual(l1, { 1: 2 }, 'Artificer must have 2 1st-level slots at Level 1');

  // Level 5: 4 1st, 2 2nd
  assert.deepEqual(getSpellSlotsForClassLevel('Изобретатель', 5), { 1: 4, 2: 2 });
  // Level 9: 4 1st, 3 2nd, 2 3rd
  assert.deepEqual(getSpellSlotsForClassLevel('Изобретатель', 9), { 1: 4, 2: 3, 3: 2 });
  // Level 13: 4 1st, 3 2nd, 3 3rd, 1 4th
  assert.deepEqual(getSpellSlotsForClassLevel('Изобретатель', 13), { 1: 4, 2: 3, 3: 3, 4: 1 });
  // Level 17: 5th circle unlocked
  assert.deepEqual(getSpellSlotsForClassLevel('Изобретатель', 17), { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 });
  // Level 20: max slots
  assert.deepEqual(getSpellSlotsForClassLevel('Изобретатель', 20), { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 });

  // Prepared spells formula: max(1, INT mod + floor(level / 2))
  assert.equal(calcPreparedSpellsLimit('Изобретатель', 1, 3), 3, 'L1 with INT +3 -> 3');
  assert.equal(calcPreparedSpellsLimit('Изобретатель', 2, 3), 4, 'L2 with INT +3 -> 4');
  assert.equal(calcPreparedSpellsLimit('Изобретатель', 20, 5), 15, 'L20 with INT +5 -> 15');
});

test('Warlock Pact Magic Slots: Uniform highest-circle slots up to circle 5', () => {
  // L1: 1 slot of 1st circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 1), { 1: 1 });
  // L2: 2 slots of 1st circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 2), { 1: 2 });
  // L3-4: 2 slots of 2nd circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 3), { 2: 2 });
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 4), { 2: 2 });
  // L5-6: 2 slots of 3rd circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 5), { 3: 2 });
  // L7-8: 2 slots of 4th circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 7), { 4: 2 });
  // L9-10: 2 slots of 5th circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 9), { 5: 2 });
  // L11-16: 3 slots of 5th circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 11), { 5: 3 });
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 16), { 5: 3 });
  // L17-20: 4 slots of 5th circle
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 17), { 5: 4 });
  assert.deepEqual(getSpellSlotsForClassLevel('Колдун', 20), { 5: 4 });
});

test('Warlock Mystic Arcanum 6-9 circles supported by getMaxAvailableSpellSlotLevel', () => {
  const warlockL11: CharacterData = {
    ...createDefaultCharacter(),
    className: 'Колдун',
    level: 11,
    spellSlots: { 5: { totalSlots: 3, expendedSlots: 0 } }
  };

  const maxSlot = getMaxAvailableSpellSlotLevel(warlockL11);
  assert.equal(maxSlot, 6, 'Warlock level 11 unlocks 6th level Mystic Arcanum');

  // In D&D 5e rules, at level 11 Warlocks gain Mystic Arcanum (6th level spell).
  const checkSpell6 = isSpellLevelAllowedForCharacter(warlockL11, 6);
  assert.equal(
    checkSpell6.allowed,
    true,
    '6th-level Mystic Arcanum spell must be allowed for Warlock L11!'
  );

  // Levels 13, 15, 17 unlock 7, 8, 9
  assert.equal(getMaxAvailableSpellSlotLevel({ ...warlockL11, level: 13 }), 7);
  assert.equal(getMaxAvailableSpellSlotLevel({ ...warlockL11, level: 15 }), 8);
  assert.equal(getMaxAvailableSpellSlotLevel({ ...warlockL11, level: 17 }), 9);
});

// ══════════════════════════════════════════════════════════════
// 4. ASI (ABILITY SCORE IMPROVEMENT) AUDIT
// ══════════════════════════════════════════════════════════════

test('ASI Levels: Strictly 4, 8, 12, 16, 19 for all 5 arcane classes', () => {
  const arcaneClasses = ['Волшебник', 'Чародей', 'Колдун', 'Бард', 'Изобретатель'];
  const expectedASI = [4, 8, 12, 16, 19];

  for (const cls of arcaneClasses) {
    const prog = DND_CLASS_PROGRESSION[cls];
    assert.deepEqual(prog.asiLevels, expectedASI, `${cls} asiLevels must be [4, 8, 12, 16, 19]`);

    for (let lvl = 1; lvl <= 20; lvl++) {
      const isASI = isClassASILevel(cls, lvl);
      const isStandard = isStandardASILevel(lvl, cls);
      if (expectedASI.includes(lvl)) {
        assert.ok(isASI, `${cls} level ${lvl} must be ASI`);
        assert.ok(isStandard, `${cls} level ${lvl} must be standard ASI`);
      } else {
        assert.ok(!isASI, `${cls} level ${lvl} must NOT be ASI`);
        assert.ok(!isStandard, `${cls} level ${lvl} must NOT be standard ASI`);
      }
    }
  }
});

// ══════════════════════════════════════════════════════════════
// 5. CLASS FEATURES COMPLETENESS ON EVERY LEVEL (1-20)
// ══════════════════════════════════════════════════════════════

test('Features Completeness: Every level 1-20 has defined features for all 5 arcane classes', () => {
  const arcaneClasses = ['Волшебник', 'Чародей', 'Колдун', 'Бард', 'Изобретатель'];

  for (const cls of arcaneClasses) {
    const prog = DND_CLASS_PROGRESSION[cls];
    assert.ok(prog, `${cls} progression must exist`);

    for (let lvl = 1; lvl <= 20; lvl++) {
      const feats = getClassFeaturesForLevel(cls, lvl);
      assert.ok(feats.length > 0, `${cls} must have at least 1 feature at Level ${lvl}`);
      for (const f of feats) {
        assert.ok(f.name && f.name.trim().length > 0, `${cls} L${lvl} feature must have a name`);
        assert.ok(f.description && f.description.trim().length > 0, `${cls} L${lvl} feature must have a description`);
      }
    }
  }
});

test('Proficiency Bonus Progression (Levels 1-20)', () => {
  for (let l = 1; l <= 4; l++) assert.equal(calcProficiencyBonus(l), 2);
  for (let l = 5; l <= 8; l++) assert.equal(calcProficiencyBonus(l), 3);
  for (let l = 9; l <= 12; l++) assert.equal(calcProficiencyBonus(l), 4);
  for (let l = 13; l <= 16; l++) assert.equal(calcProficiencyBonus(l), 5);
  for (let l = 17; l <= 20; l++) assert.equal(calcProficiencyBonus(l), 6);
});

// ══════════════════════════════════════════════════════════════
// 6. FULL 1 -> 20 LEVEL UP & COMPLETE ROLLBACK TO LEVEL 1
// ══════════════════════════════════════════════════════════════

test('Full Stress Cycle: Wizard 1 -> 20 -> 1 level-up and rollback', () => {
  let char = applyClassTemplate('wizard');
  const initialHP = char.hpMax || 8; // 6 + CON mod (14 CON -> +2 -> 8)
  assert.equal(char.level, 1);
  assert.equal(char.hitDice, '1d6');

  // Level up 1 -> 20
  for (let targetLevel = 2; targetLevel <= 20; targetLevel++) {
    const avgHP = 4 + calcModifier(char.abilityScores['ТЕЛ']); // 4 + 2 = 6
    const isASI = isClassASILevel(char.className, targetLevel);
    const slots = getSpellSlotsForClassLevel(char.className, targetLevel);

    const entry: LevelUpEntry = {
      level: targetLevel,
      hpGained: avgHP,
      asiAbilities: isASI ? ['ИНТ', 'ИНТ'] : null,
      notes: `Уровень ${targetLevel}`,
      newSubclass: targetLevel === 2 ? 'Школа Воплощения' : undefined,
      addedTraits: [{
        id: `feat-${targetLevel}`,
        name: `Умение ${targetLevel}`,
        description: `Описание ${targetLevel}`
      }],
      spellSlotsGained: slots || undefined,
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
    assert.equal(char.level, targetLevel);
    assert.equal(char.hitDice, `${targetLevel}d6`);
  }

  // Level 20 Assertions
  assert.equal(char.level, 20);
  assert.equal(char.hitDice, '20d6');
  assert.equal(char.subclass, 'Школа Воплощения');
  assert.equal(char.asiBonuses['ИНТ'], 10, '5 ASIs * +2 = +10 to INT');
  assert.equal(char.spellSlots[9]?.totalSlots, 1);
  assert.equal(char.levelHistory?.length, 19);

  // Full Rollback 20 -> 1
  for (let targetLevel = 19; targetLevel >= 1; targetLevel--) {
    char = applyLevelDown(char);
    assert.equal(char.level, targetLevel);
    assert.equal(char.hitDice, `${targetLevel}d6`);
  }

  // Reverted to Level 1 state
  assert.equal(char.level, 1);
  assert.equal(char.hpMax, initialHP);
  assert.equal(char.subclass, '', 'Subclass must be reverted when rolling back past subclassLevel');
  assert.equal(char.asiBonuses['ИНТ'], 0, 'All ASI bonuses must be reverted to 0');
  assert.equal(char.levelHistory?.length, 0, 'Level history must be completely empty');
  assert.equal(char.hitDice, '1d6');
  assert.equal(char.spellSlots[1]?.totalSlots, 2);
  assert.equal(char.spellSlots[2], undefined, 'Higher level spell slots must be removed');
});

test('Full Stress Cycle: Sorcerer 1 -> 20 -> 1 level-up and rollback', () => {
  let char = applyClassTemplate('sorcerer');
  const initialHP = char.hpMax || 8; // 6 + 2 = 8
  assert.equal(char.level, 1);
  assert.equal(char.hitDice, '1d6');

  // Level up 1 -> 20
  for (let targetLevel = 2; targetLevel <= 20; targetLevel++) {
    const avgHP = 4 + calcModifier(char.abilityScores['ТЕЛ']);
    const isASI = isClassASILevel(char.className, targetLevel);
    const slots = getSpellSlotsForClassLevel(char.className, targetLevel);

    const entry: LevelUpEntry = {
      level: targetLevel,
      hpGained: avgHP,
      asiAbilities: isASI ? ['ХАР', 'ХАР'] : null,
      notes: `Уровень ${targetLevel}`,
      newSubclass: targetLevel === 2 ? 'Драконья кровь' : undefined,
      addedTraits: [{
        id: `feat-${targetLevel}`,
        name: `Умение ${targetLevel}`,
        description: `Описание ${targetLevel}`
      }],
      spellSlotsGained: slots || undefined,
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
  }

  assert.equal(char.level, 20);
  assert.equal(char.asiBonuses['ХАР'], 10);
  assert.equal(char.spellSlots[9]?.totalSlots, 1);

  // Full Rollback
  for (let targetLevel = 19; targetLevel >= 1; targetLevel--) {
    char = applyLevelDown(char);
  }

  assert.equal(char.level, 1);
  assert.equal(char.hpMax, initialHP);
  assert.equal(char.asiBonuses['ХАР'], 0);
  assert.equal(char.levelHistory?.length, 0);
  assert.equal(char.hitDice, '1d6');
});

test('Full Stress Cycle: Warlock 1 -> 20 -> 1 pact slot transformation and rollback', () => {
  let char = applyClassTemplate('warlock');
  const initialHP = char.hpMax || 9; // 8 + 1 = 9 (13 CON -> +1)
  assert.equal(char.level, 1);
  assert.equal(char.hitDice, '1d8');
  assert.deepEqual(char.spellSlots[1], { totalSlots: 1, expendedSlots: 0 });

  // Level up 1 -> 20
  for (let targetLevel = 2; targetLevel <= 20; targetLevel++) {
    const avgHP = 5 + calcModifier(char.abilityScores['ТЕЛ']);
    const isASI = isClassASILevel(char.className, targetLevel);
    const slots = getSpellSlotsForClassLevel(char.className, targetLevel);

    const entry: LevelUpEntry = {
      level: targetLevel,
      hpGained: avgHP,
      asiAbilities: isASI ? ['ХАР', 'ХАР'] : null,
      notes: `Уровень ${targetLevel}`,
      newSubclass: targetLevel === 2 ? 'Исчадие' : undefined,
      addedTraits: [{
        id: `feat-${targetLevel}`,
        name: `Воззвание ${targetLevel}`,
        description: `Описание ${targetLevel}`
      }],
      spellSlotsGained: slots || undefined,
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
  }

  assert.equal(char.level, 20);
  assert.equal(char.hitDice, '20d8');
  // At Level 20, Warlock has 4 5th-level pact slots
  assert.equal(char.spellSlots[5]?.totalSlots, 4);
  assert.equal(char.asiBonuses['ХАР'], 10);

  // Full Rollback
  for (let targetLevel = 19; targetLevel >= 1; targetLevel--) {
    char = applyLevelDown(char);
    assert.equal(char.level, targetLevel);
  }

  assert.equal(char.level, 1);
  assert.equal(char.hpMax, initialHP);
  assert.equal(char.hitDice, '1d8');
  assert.equal(char.spellSlots[1]?.totalSlots, 1);
  assert.equal(char.spellSlots[5], undefined, '5th circle pact slots must be completely removed on rollback to L1');
  assert.equal(char.levelHistory?.length, 0);
});

test('Full Stress Cycle: Bard 1 -> 20 -> 1 level-up and rollback', () => {
  let char = applyClassTemplate('bard');
  const initialHP = char.hpMax || 9; // 8 + 1 = 9
  assert.equal(char.level, 1);
  assert.equal(char.hitDice, '1d8');

  // Level up 1 -> 20
  for (let targetLevel = 2; targetLevel <= 20; targetLevel++) {
    const avgHP = 5 + calcModifier(char.abilityScores['ТЕЛ']);
    const isASI = isClassASILevel(char.className, targetLevel);
    const slots = getSpellSlotsForClassLevel(char.className, targetLevel);

    const entry: LevelUpEntry = {
      level: targetLevel,
      hpGained: avgHP,
      asiAbilities: isASI ? ['ХАР', 'ЛОВ'] : null,
      notes: `Уровень ${targetLevel}`,
      newSubclass: targetLevel === 3 ? 'Коллегия знаний' : undefined,
      addedTraits: [{
        id: `feat-${targetLevel}`,
        name: `Бардовское умение ${targetLevel}`,
        description: `Описание ${targetLevel}`
      }],
      spellSlotsGained: slots || undefined,
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
  }

  assert.equal(char.level, 20);
  assert.equal(char.subclass, 'Коллегия знаний');
  assert.equal(char.asiBonuses['ХАР'], 5);
  assert.equal(char.asiBonuses['ЛОВ'], 5);

  // Full Rollback
  for (let targetLevel = 19; targetLevel >= 1; targetLevel--) {
    char = applyLevelDown(char);
  }

  assert.equal(char.level, 1);
  assert.equal(char.hpMax, initialHP);
  assert.equal(char.subclass, '');
  assert.equal(char.asiBonuses['ХАР'], 0);
  assert.equal(char.asiBonuses['ЛОВ'], 0);
  assert.equal(char.levelHistory?.length, 0);
});

test('Full Stress Cycle: Artificer 1 -> 20 -> 1 level-up and rollback', () => {
  let char = applyClassTemplate('artificer');
  const initialHP = char.hpMax || 10; // 8 + 2 = 10
  assert.equal(char.level, 1);
  assert.equal(char.hitDice, '1d8');
  assert.equal(char.spellSlots[1]?.totalSlots, 2, 'Artificer has 2 slots at L1');

  // Level up 1 -> 20
  for (let targetLevel = 2; targetLevel <= 20; targetLevel++) {
    const avgHP = 5 + calcModifier(char.abilityScores['ТЕЛ']);
    const isASI = isClassASILevel(char.className, targetLevel);
    const slots = getSpellSlotsForClassLevel(char.className, targetLevel);

    const entry: LevelUpEntry = {
      level: targetLevel,
      hpGained: avgHP,
      asiAbilities: isASI ? ['ИНТ', 'ИНТ'] : null,
      notes: `Уровень ${targetLevel}`,
      newSubclass: targetLevel === 3 ? 'Бронник' : undefined,
      addedTraits: [{
        id: `feat-${targetLevel}`,
        name: `Изобретение ${targetLevel}`,
        description: `Описание ${targetLevel}`
      }],
      spellSlotsGained: slots || undefined,
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
  }

  assert.equal(char.level, 20);
  assert.equal(char.subclass, 'Бронник');
  assert.equal(char.asiBonuses['ИНТ'], 10);
  assert.equal(char.spellSlots[5]?.totalSlots, 2);
  assert.equal(char.spellSlots[6], undefined, 'Artificer must not have 6th level spell slots');

  // Full Rollback
  for (let targetLevel = 19; targetLevel >= 1; targetLevel--) {
    char = applyLevelDown(char);
  }

  assert.equal(char.level, 1);
  assert.equal(char.hpMax, initialHP);
  assert.equal(char.subclass, '');
  assert.equal(char.asiBonuses['ИНТ'], 0);
  assert.equal(char.levelHistory?.length, 0);
  assert.equal(char.spellSlots[1]?.totalSlots, 2);
  assert.equal(char.spellSlots[5], undefined);
});
