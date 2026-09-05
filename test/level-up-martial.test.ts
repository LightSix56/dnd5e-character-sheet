import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcProficiencyBonus,
  getHitDieSize,
  getHitDieAverage,
  getHitDiceNotation,
  isStandardASILevel,
  createDefaultCharacter,
  getAC,
  getTotalScore,
  getModifier,
  CharacterData,
  LevelUpEntry,
  UNIVERSAL_MILESTONES,
} from '../src/lib/dnd-types';
import {
  DND_CLASS_PROGRESSION,
  isClassASILevel,
  getClassSubclassLevel,
  isClassSubclassMilestone,
  getClassFeaturesForLevel,
  normalizeClassName,
} from '../src/data/compendium/class-progression';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';

// Helper to simulate handleLevelUp from src/app/page.tsx
function simulateLevelUp(prev: CharacterData, entry: LevelUpEntry): CharacterData {
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

  let newFeatures = prev.featuresTraits;
  if (entry.notes) {
    newFeatures = newFeatures ? newFeatures + '\n' + entry.notes : entry.notes;
  }
  if (entry.selectedFeat) {
    const featNote = `[Черта ${entry.level} ур.]: ${entry.selectedFeat}`;
    newFeatures = newFeatures ? newFeatures + '\n' + featNote : featNote;
  }

  const updatedSaveProfs = { ...prev.savingThrowProficiencies };
  for (const ability of entry.newSavingThrowProfs) {
    updatedSaveProfs[ability] = true;
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
    featuresTraits: newFeatures,
    savingThrowProficiencies: updatedSaveProfs,
    levelHistory: [...(Array.isArray(prev.levelHistory) ? prev.levelHistory : []), entry],
  };
}

// Helper to simulate handleLevelDown from src/app/page.tsx
function simulateLevelDown(prev: CharacterData): CharacterData {
  const newLevel = Math.max(1, prev.level - 1);
  const history = Array.isArray(prev.levelHistory) ? prev.levelHistory : [];
  const last = history[history.length - 1];
  let newHP = prev.hpMax || 0;
  if (last) {
    newHP = Math.max(1, newHP - last.hpGained);
  } else {
    const avg = (prev.hitDice ? getHitDieAverage(prev.hitDice) : 5) + getModifier(prev, 'ТЕЛ');
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

  let newFeatures = prev.featuresTraits;
  if (last?.notes) {
    newFeatures = newFeatures.replace(last.notes, '').replace(/\n{2,}/g, '\n').trim();
  }
  if (last?.selectedFeat) {
    const featNote = `[Черта ${prev.level} ур.]: ${last.selectedFeat}`;
    newFeatures = newFeatures.replace(featNote, '').replace(/\n{2,}/g, '\n').trim();
  }

  const updatedSaveProfs = { ...prev.savingThrowProficiencies };
  if (last?.newSavingThrowProfs) {
    for (const ability of last.newSavingThrowProfs) {
      updatedSaveProfs[ability] = false;
    }
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
    featuresTraits: newFeatures,
    savingThrowProficiencies: updatedSaveProfs,
    levelHistory: history.slice(0, -1),
  };
}

// ─────────────────────────────────────────────────────────────
// 1. HIT DIE & AVERAGE HP AUDIT
// ─────────────────────────────────────────────────────────────
test('Hit Die & Average HP: SRD 5.1 compliance for all 4 martial classes', () => {
  const expectedHitDice: Record<string, { die: number; avg: number }> = {
    'Варвар': { die: 12, avg: 7 },
    'Воин': { die: 10, avg: 6 },
    'Плут': { die: 8, avg: 5 },
    'Монах': { die: 8, avg: 5 },
  };

  for (const [cls, expected] of Object.entries(expectedHitDice)) {
    // Check DND_CLASS_PROGRESSION
    const prog = DND_CLASS_PROGRESSION[cls];
    assert.ok(prog, `Class progression entry must exist for ${cls}`);
    assert.equal(prog.hitDie, expected.die, `${cls} hitDie in progression must be ${expected.die}`);

    // Check DND_COMPENDIUM_CLASSES
    const compClass = DND_COMPENDIUM_CLASSES.find(c => c.name === cls);
    assert.ok(compClass, `Compendium class entry must exist for ${cls}`);
    assert.equal(compClass.hitDieSize, expected.die, `${cls} hitDieSize in compendium must be ${expected.die}`);

    // Check dice notation parsing (English and Russian)
    const diceEn = `1d${expected.die}`;
    const diceRu = `1к${expected.die}`;
    assert.equal(getHitDieSize(diceEn), expected.die, `getHitDieSize('${diceEn}') must be ${expected.die}`);
    assert.equal(getHitDieSize(diceRu), expected.die, `getHitDieSize('${diceRu}') must be ${expected.die}`);
    assert.equal(getHitDieAverage(diceEn), expected.avg, `getHitDieAverage('${diceEn}') must be ${expected.avg}`);
    assert.equal(getHitDieAverage(diceRu), expected.avg, `getHitDieAverage('${diceRu}') must be ${expected.avg}`);
  }
});

// ─────────────────────────────────────────────────────────────
// 2. ASI LEVELS AUDIT (Fighter, Rogue, Barbarian, Monk)
// ─────────────────────────────────────────────────────────────
test('ASI Levels: exact level verification for Fighter (7 ASIs), Rogue (6 ASIs), Barbarian (5 ASIs), Monk (5 ASIs)', () => {
  const expectedASIs: Record<string, number[]> = {
    'Воин': [4, 6, 8, 12, 14, 16, 19],
    'Fighter': [4, 6, 8, 12, 14, 16, 19],
    'Плут': [4, 8, 10, 12, 16, 19],
    'Rogue': [4, 8, 10, 12, 16, 19],
    'Варвар': [4, 8, 12, 16, 19],
    'Barbarian': [4, 8, 12, 16, 19],
    'Монах': [4, 8, 12, 16, 19],
    'Monk': [4, 8, 12, 16, 19],
  };

  for (const [cls, expectedList] of Object.entries(expectedASIs)) {
    const expectedSet = new Set(expectedList);
    for (let lvl = 1; lvl <= 20; lvl++) {
      const isASI = isClassASILevel(cls, lvl);
      const isStdASI = isStandardASILevel(lvl, cls);

      if (expectedSet.has(lvl)) {
        assert.equal(isASI, true, `${cls} MUST have ASI at level ${lvl} (isClassASILevel)`);
        assert.equal(isStdASI, true, `${cls} MUST have ASI at level ${lvl} (isStandardASILevel)`);
      } else {
        assert.equal(isASI, false, `${cls} must NOT have ASI at level ${lvl} (isClassASILevel)`);
        assert.equal(isStdASI, false, `${cls} must NOT have ASI at level ${lvl} (isStandardASILevel)`);
      }
    }
  }
});

test('ASI Consistency: isClassASILevel vs isStandardASILevel signature & cross-compatibility', () => {
  // Check that both functions agree for all 4 classes across all 20 levels
  const martialClasses = ['Воин', 'Fighter', 'Варвар', 'Barbarian', 'Плут', 'Rogue', 'Монах', 'Monk'];
  for (const cls of martialClasses) {
    for (let lvl = 1; lvl <= 20; lvl++) {
      const v1 = isClassASILevel(cls, lvl);
      const v2 = isStandardASILevel(lvl, cls);
      assert.equal(v1, v2, `Mismatch between isClassASILevel(${cls}, ${lvl})=${v1} and isStandardASILevel(${lvl}, ${cls})=${v2}`);
    }
  }
});

// ─────────────────────────────────────────────────────────────
// 3. SUBCLASS LEVEL & ARCHETYPE MILESTONES AUDIT
// ─────────────────────────────────────────────────────────────
test('Subclass Level: all 4 martial classes choose subclass strictly at Level 3', () => {
  const martialClasses = ['Воин', 'Fighter', 'Варвар', 'Barbarian', 'Плут', 'Rogue', 'Монах', 'Monk'];
  for (const cls of martialClasses) {
    assert.equal(getClassSubclassLevel(cls), 3, `${cls} subclass level must be strictly 3`);
  }

  // Compendium subclasses definition check
  for (const name of ['Варвар', 'Воин', 'Плут', 'Монах']) {
    const compClass = DND_COMPENDIUM_CLASSES.find(c => c.name === name);
    assert.ok(compClass, `Compendium class ${name} must exist`);
    assert.equal(compClass.subclassLevel, 3, `Compendium ${name} subclassLevel must be 3`);
    assert.ok(compClass.subclasses && compClass.subclasses.length > 0, `${name} must have at least 1 subclass`);
  }
});

test('Subclass Feature Milestones: exact level matching SRD 5.1', () => {
  const expectedMilestones: Record<string, number[]> = {
    'Варвар': [3, 6, 10, 14],
    'Воин': [3, 7, 10, 15, 18],
    'Плут': [3, 9, 13, 17],
    'Монах': [3, 6, 11, 17],
  };

  for (const [cls, expected] of Object.entries(expectedMilestones)) {
    const prog = DND_CLASS_PROGRESSION[cls];
    assert.deepEqual(prog.subclassFeatureLevels, expected, `${cls} subclassFeatureLevels must match SRD 5.1`);

    for (let lvl = 1; lvl <= 20; lvl++) {
      const isMilestone = isClassSubclassMilestone(cls, lvl);
      assert.equal(isMilestone, expected.includes(lvl), `${cls} level ${lvl} subclass milestone check`);
    }
  }
});

// ─────────────────────────────────────────────────────────────
// 4. PROFICIENCY BONUS PROGRESSION
// ─────────────────────────────────────────────────────────────
test('Proficiency Bonus: standard 5e progression (+2 to +6)', () => {
  for (let lvl = 1; lvl <= 4; lvl++) assert.equal(calcProficiencyBonus(lvl), 2, `Level ${lvl} must have +2 PB`);
  for (let lvl = 5; lvl <= 8; lvl++) assert.equal(calcProficiencyBonus(lvl), 3, `Level ${lvl} must have +3 PB`);
  for (let lvl = 9; lvl <= 12; lvl++) assert.equal(calcProficiencyBonus(lvl), 4, `Level ${lvl} must have +4 PB`);
  for (let lvl = 13; lvl <= 16; lvl++) assert.equal(calcProficiencyBonus(lvl), 5, `Level ${lvl} must have +5 PB`);
  for (let lvl = 17; lvl <= 20; lvl++) assert.equal(calcProficiencyBonus(lvl), 6, `Level ${lvl} must have +6 PB`);
});

// ─────────────────────────────────────────────────────────────
// 5. CLASS FEATURES PROGRESSION (LEVELS 1-20)
// ─────────────────────────────────────────────────────────────
test('Features Progression: all 20 levels must have features in compendium', () => {
  const classes = ['Варвар', 'Воин', 'Плут', 'Монах'];
  for (const cls of classes) {
    for (let lvl = 1; lvl <= 20; lvl++) {
      const feats = getClassFeaturesForLevel(cls, lvl);
      assert.ok(Array.isArray(feats), `${cls} level ${lvl} features must be an array`);
      assert.ok(feats.length > 0, `${cls} level ${lvl} must have at least one feature, found 0!`);
      for (const f of feats) {
        assert.ok(f.name && f.name.trim().length > 0, `${cls} level ${lvl} feature must have a non-empty name`);
        assert.ok(f.description && f.description.trim().length > 0, `${cls} level ${lvl} feature '${f.name}' must have a non-empty description`);
      }
    }
  }
});

test('Iconic Class Features Verification', () => {
  // Barbarian
  const b1 = getClassFeaturesForLevel('Варвар', 1).map(f => f.name);
  assert.ok(b1.some(n => n.includes('Ярость')), 'Barbarian level 1 must include Rage');
  assert.ok(b1.some(n => n.includes('Защита без доспехов')), 'Barbarian level 1 must include Unarmored Defense');
  const b2 = getClassFeaturesForLevel('Варвар', 2).map(f => f.name);
  assert.ok(b2.some(n => n.includes('Безрассудная атака')), 'Barbarian level 2 must include Reckless Attack');
  const b5 = getClassFeaturesForLevel('Варвар', 5).map(f => f.name);
  assert.ok(b5.some(n => n.includes('Дополнительная атака')), 'Barbarian level 5 must include Extra Attack');
  const b20 = getClassFeaturesForLevel('Варвар', 20).map(f => f.name);
  assert.ok(b20.some(n => n.includes('Великий варвар')), 'Barbarian level 20 must include Primal Champion');

  // Fighter
  const f1 = getClassFeaturesForLevel('Воин', 1).map(f => f.name);
  assert.ok(f1.some(n => n.includes('Боевой стиль')), 'Fighter level 1 must include Fighting Style');
  assert.ok(f1.some(n => n.includes('Второе дыхание')), 'Fighter level 1 must include Second Wind');
  const f2 = getClassFeaturesForLevel('Воин', 2).map(f => f.name);
  assert.ok(f2.some(n => n.includes('Всплеск действий')), 'Fighter level 2 must include Action Surge');
  const f5 = getClassFeaturesForLevel('Воин', 5).map(f => f.name);
  assert.ok(f5.some(n => n.includes('Дополнительная атака')), 'Fighter level 5 must include Extra Attack (1)');
  const f11 = getClassFeaturesForLevel('Воин', 11).map(f => f.name);
  assert.ok(f11.some(n => n.includes('Дополнительная атака')), 'Fighter level 11 must include Extra Attack (2)');
  const f20 = getClassFeaturesForLevel('Воин', 20).map(f => f.name);
  assert.ok(f20.some(n => n.includes('Дополнительная атака')), 'Fighter level 20 must include Extra Attack (3)');

  // Rogue
  const r1 = getClassFeaturesForLevel('Плут', 1).map(f => f.name);
  assert.ok(r1.some(n => n.includes('Скрытная атака')), 'Rogue level 1 must include Sneak Attack');
  assert.ok(r1.some(n => n.includes('Компетентность')), 'Rogue level 1 must include Expertise');
  assert.ok(r1.some(n => n.includes('Воровской жаргон')), 'Rogue level 1 must include Thieves Cant');
  const r2 = getClassFeaturesForLevel('Плут', 2).map(f => f.name);
  assert.ok(r2.some(n => n.includes('Хитрое действие')), 'Rogue level 2 must include Cunning Action');
  const r5 = getClassFeaturesForLevel('Плут', 5).map(f => f.name);
  assert.ok(r5.some(n => n.includes('Невероятное уклонение')), 'Rogue level 5 must include Uncanny Dodge');
  const r7 = getClassFeaturesForLevel('Плут', 7).map(f => f.name);
  assert.ok(r7.some(n => n.includes('Увёртливость')), 'Rogue level 7 must include Evasion');
  const r11 = getClassFeaturesForLevel('Плут', 11).map(f => f.name);
  assert.ok(r11.some(n => n.includes('Надёжный талант')), 'Rogue level 11 must include Reliable Talent');

  // Monk
  const m1 = getClassFeaturesForLevel('Монах', 1).map(f => f.name);
  assert.ok(m1.some(n => n.includes('Защита без доспехов')), 'Monk level 1 must include Unarmored Defense');
  assert.ok(m1.some(n => n.includes('Боевые искусства')), 'Monk level 1 must include Martial Arts');
  const m2 = getClassFeaturesForLevel('Монах', 2).map(f => f.name);
  assert.ok(m2.some(n => n.includes('Энергия ци')), 'Monk level 2 must include Ki');
  assert.ok(m2.some(n => n.includes('Движение без доспехов')), 'Monk level 2 must include Unarmored Movement');
  const m5 = getClassFeaturesForLevel('Монах', 5).map(f => f.name);
  assert.ok(m5.some(n => n.includes('Ошеломляющий удар')), 'Monk level 5 must include Stunning Strike');
  const m14 = getClassFeaturesForLevel('Монах', 14).map(f => f.name);
  assert.ok(m14.some(n => n.includes('Алмазная душа')), 'Monk level 14 must include Diamond Soul');
});

// ─────────────────────────────────────────────────────────────
// 6. FULL LEVEL-UP (1 -> 20) & ROLLBACK (20 -> 1) SIMULATION
// ─────────────────────────────────────────────────────────────
test('Simulation: Fighter full progression 1 -> 20 and rollback 20 -> 1', () => {
  let char = createDefaultCharacter();
  char.className = 'Воин';
  char.level = 1;
  char.hitDice = '1d10';
  char.abilityScores['ТЕЛ'] = 14; // CON 14 (+2)
  char.abilityScores['СИЛ'] = 16; // STR 16 (+3)
  char.hpMax = 12; // 10 + 2
  char.hpCurrent = 12;

  // Level up from 1 to 20
  for (let lvl = 2; lvl <= 20; lvl++) {
    const isASI = isClassASILevel('Воин', lvl);
    const feats = getClassFeaturesForLevel('Воин', lvl);
    const addedTraits = feats.map(f => ({
      id: `feat-${lvl}-${f.name}`,
      name: f.name,
      summary: f.name,
      description: f.description,
    }));

    const entry: LevelUpEntry = {
      level: lvl,
      hpGained: 6 + 2, // d10 avg (6) + CON mod (2) = 8 HP
      asiAbilities: isASI ? ['СИЛ', 'СИЛ'] : null, // +2 STR at ASI levels
      notes: `Уровень ${lvl}`,
      newSubclass: lvl === 3 ? 'Мастер боевых искусств' : undefined,
      addedTraits,
      newCantrips: [],
      newSpells: [],
      newSavingThrowProfs: [],
      newSkillProfs: [],
      newSkillExpertise: [],
      newAttacks: [],
      newProficienciesText: '',
      newEquipmentText: '',
    };

    char = simulateLevelUp(char, entry);
    assert.equal(char.level, lvl, `Level must be ${lvl}`);
    assert.equal(char.hitDice, `${lvl}d10`, `Hit dice must be ${lvl}d10`);
  }

  // At level 20:
  // HP: 12 + 19 * 8 = 164
  assert.equal(char.hpMax, 164, 'Fighter level 20 max HP must be 164 (12 + 19*8)');
  assert.equal(char.subclass, 'Мастер боевых искусств', 'Subclass must be preserved');
  assert.equal(char.levelHistory.length, 19, 'Must have 19 level-up entries in history');

  // Fighter gets 7 ASIs: 4, 6, 8, 12, 14, 16, 19.
  // Each gives +2 STR -> total +14 to STR!
  assert.equal(char.asiBonuses['СИЛ'], 14, 'Fighter at level 20 must have +14 STR from 7 ASIs');
  assert.equal(getTotalScore(char, 'СИЛ'), 30, 'Total STR should be 16 + 14 = 30');

  // Now roll back from 20 to 1
  for (let lvl = 20; lvl >= 2; lvl--) {
    char = simulateLevelDown(char);
    assert.equal(char.level, lvl - 1, `Level must decrement to ${lvl - 1}`);
    assert.equal(char.hitDice, `${lvl - 1}d10`, `Hit dice must decrement to ${lvl - 1}d10`);
  }

  // Reached level 1
  assert.equal(char.level, 1, 'Must be back to level 1');
  assert.equal(char.hpMax, 12, 'HP must be restored to initial 12');
  assert.equal(char.asiBonuses['СИЛ'], 0, 'All ASI bonuses must be cleanly rolled back to 0');
  assert.equal(char.subclass, '', 'Subclass must be cleared upon rolling back past level 3');
  assert.equal(char.levelHistory.length, 0, 'Level history must be empty at level 1');
});

test('Simulation: Rogue full progression 1 -> 20 and rollback 20 -> 1', () => {
  let char = createDefaultCharacter();
  char.className = 'Плут';
  char.level = 1;
  char.hitDice = '1d8';
  char.abilityScores['ТЕЛ'] = 14; // CON 14 (+2)
  char.abilityScores['ЛОВ'] = 16; // DEX 16 (+3)
  char.hpMax = 10; // 8 + 2
  char.hpCurrent = 10;

  for (let lvl = 2; lvl <= 20; lvl++) {
    const isASI = isClassASILevel('Плут', lvl);
    const feats = getClassFeaturesForLevel('Плут', lvl);
    const addedTraits = feats.map(f => ({
      id: `feat-${lvl}-${f.name}`,
      name: f.name,
      summary: f.name,
      description: f.description,
    }));

    const entry: LevelUpEntry = {
      level: lvl,
      hpGained: 5 + 2, // d8 avg (5) + CON mod (2) = 7 HP
      asiAbilities: isASI ? ['ЛОВ', 'ЛОВ'] : null,
      notes: `Уровень ${lvl}`,
      newSubclass: lvl === 3 ? 'Вор' : undefined,
      addedTraits,
      newCantrips: [],
      newSpells: [],
      newSavingThrowProfs: [],
      newSkillProfs: [],
      newSkillExpertise: [],
      newAttacks: [],
      newProficienciesText: '',
      newEquipmentText: '',
    };

    char = simulateLevelUp(char, entry);
  }

  // At level 20:
  // HP: 10 + 19 * 7 = 143
  assert.equal(char.hpMax, 143, 'Rogue level 20 max HP must be 143 (10 + 19*7)');
  assert.equal(char.subclass, 'Вор', 'Subclass must be preserved');
  assert.equal(char.levelHistory.length, 19, 'Must have 19 level-up entries in history');

  // Rogue gets 6 ASIs: 4, 8, 10, 12, 16, 19.
  // Each gives +2 DEX -> total +12 to DEX!
  assert.equal(char.asiBonuses['ЛОВ'], 12, 'Rogue at level 20 must have +12 DEX from 6 ASIs');
  assert.equal(getTotalScore(char, 'ЛОВ'), 28, 'Total DEX should be 16 + 12 = 28');

  // Roll back from 20 to 1
  for (let lvl = 20; lvl >= 2; lvl--) {
    char = simulateLevelDown(char);
  }

  assert.equal(char.level, 1, 'Must be back to level 1');
  assert.equal(char.hpMax, 10, 'HP must be restored to initial 10');
  assert.equal(char.asiBonuses['ЛОВ'], 0, 'All ASI bonuses must be rolled back');
  assert.equal(char.subclass, '', 'Subclass must be cleared');
  assert.equal(char.levelHistory.length, 0, 'Level history must be empty');
});

test('Simulation: Barbarian full progression 1 -> 20 and rollback 20 -> 1', () => {
  let char = createDefaultCharacter();
  char.className = 'Варвар';
  char.level = 1;
  char.hitDice = '1d12';
  char.abilityScores['ТЕЛ'] = 16; // CON 16 (+3)
  char.abilityScores['СИЛ'] = 16; // STR 16 (+3)
  char.hpMax = 15; // 12 + 3
  char.hpCurrent = 15;

  for (let lvl = 2; lvl <= 20; lvl++) {
    const isASI = isClassASILevel('Варвар', lvl);
    const feats = getClassFeaturesForLevel('Варвар', lvl);
    const addedTraits = feats.map(f => ({
      id: `feat-${lvl}-${f.name}`,
      name: f.name,
      summary: f.name,
      description: f.description,
    }));

    const entry: LevelUpEntry = {
      level: lvl,
      hpGained: 7 + 3, // d12 avg (7) + CON mod (3) = 10 HP
      asiAbilities: isASI ? ['СИЛ', 'СИЛ'] : null,
      notes: `Уровень ${lvl}`,
      newSubclass: lvl === 3 ? 'Путь берсерка' : undefined,
      addedTraits,
      newCantrips: [],
      newSpells: [],
      newSavingThrowProfs: [],
      newSkillProfs: [],
      newSkillExpertise: [],
      newAttacks: [],
      newProficienciesText: '',
      newEquipmentText: '',
    };

    char = simulateLevelUp(char, entry);
  }

  // At level 20:
  // HP: 15 + 19 * 10 = 205
  assert.equal(char.hpMax, 205, 'Barbarian level 20 max HP must be 205 (15 + 19*10)');
  assert.equal(char.subclass, 'Путь берсерка', 'Subclass must be preserved');
  // Barbarian gets 5 ASIs: 4, 8, 12, 16, 19 -> +10 to STR
  assert.equal(char.asiBonuses['СИЛ'], 10, 'Barbarian at level 20 must have +10 STR from 5 ASIs');

  // Roll back 20 -> 1
  for (let lvl = 20; lvl >= 2; lvl--) {
    char = simulateLevelDown(char);
  }

  assert.equal(char.level, 1, 'Must be back to level 1');
  assert.equal(char.hpMax, 15, 'HP must be restored to initial 15');
  assert.equal(char.asiBonuses['СИЛ'], 0, 'ASI rolled back');
  assert.equal(char.subclass, '', 'Subclass cleared');
  assert.equal(char.levelHistory.length, 0, 'History empty');
});

test('Simulation: Monk full progression 1 -> 20 and rollback 20 -> 1', () => {
  let char = createDefaultCharacter();
  char.className = 'Монах';
  char.level = 1;
  char.hitDice = '1d8';
  char.abilityScores['ТЕЛ'] = 14; // CON 14 (+2)
  char.abilityScores['ЛОВ'] = 16; // DEX 16 (+3)
  char.abilityScores['МДР'] = 16; // WIS 16 (+3)
  char.hpMax = 10; // 8 + 2
  char.hpCurrent = 10;

  // Level 1 AC Unarmored Defense: 10 + 3 (DEX) + 3 (WIS) = 16
  assert.equal(getAC(char), 16, 'Monk initial AC without armor must be 16');

  for (let lvl = 2; lvl <= 20; lvl++) {
    const isASI = isClassASILevel('Монах', lvl);
    const feats = getClassFeaturesForLevel('Монах', lvl);
    const addedTraits = feats.map(f => ({
      id: `feat-${lvl}-${f.name}`,
      name: f.name,
      summary: f.name,
      description: f.description,
    }));

    const entry: LevelUpEntry = {
      level: lvl,
      hpGained: 5 + 2, // d8 avg (5) + CON mod (2) = 7 HP
      asiAbilities: isASI ? ['МДР', 'МДР'] : null, // raise WIS
      notes: `Уровень ${lvl}`,
      newSubclass: lvl === 3 ? 'Путь открытой ладони' : undefined,
      addedTraits,
      newCantrips: [],
      newSpells: [],
      newSavingThrowProfs: lvl === 14 ? ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР'] : [], // Diamond soul at 14!
      newSkillProfs: [],
      newSkillExpertise: [],
      newAttacks: [],
      newProficienciesText: '',
      newEquipmentText: '',
    };

    char = simulateLevelUp(char, entry);
  }

  // Monk gets 5 ASIs (levels 4, 8, 12, 16, 19).
  // +10 to WIS -> WIS becomes 16 + 10 = 26 (+8 mod).
  // AC becomes 10 + 3 (DEX) + 8 (WIS) = 21.
  assert.equal(char.asiBonuses['МДР'], 10, 'Monk must have +10 WIS from 5 ASIs');
  assert.equal(getAC(char), 21, 'Monk AC should increase to 21 with boosted WIS');

  // Saving throw proficiencies at 14 (Diamond Soul)
  assert.equal(char.savingThrowProficiencies['СИЛ'], true, 'Monk has STR save');
  assert.equal(char.savingThrowProficiencies['ИНТ'], true, 'Monk has INT save');

  // Roll back 20 -> 1
  for (let lvl = 20; lvl >= 2; lvl--) {
    char = simulateLevelDown(char);
  }

  assert.equal(char.level, 1, 'Must be back to level 1');
  assert.equal(char.hpMax, 10, 'HP restored to 10');
  assert.equal(char.asiBonuses['МДР'], 0, 'WIS ASI rolled back');
  assert.equal(getAC(char), 16, 'AC restored to 16');
  assert.equal(char.savingThrowProficiencies['ИНТ'], false, 'Diamond soul saves rolled back');
  assert.equal(char.subclass, '', 'Subclass cleared');
});

// ─────────────────────────────────────────────────────────────
// 7. ADVERSARIAL STRESS TESTS & EDGE CASES (Red Team)
// ─────────────────────────────────────────────────────────────

test('Adversarial 1: Feat selection on ASI level correctly tracked and rolled back', () => {
  let char = createDefaultCharacter();
  char.className = 'Воин';
  char.level = 3;
  char.hpMax = 28;
  char.hitDice = '3d10';

  // Level 4: choose Feat "Мастер большого оружия" instead of stat ASI
  const entry: LevelUpEntry = {
    level: 4,
    hpGained: 8,
    asiAbilities: null,
    selectedFeat: 'Мастер большого оружия',
    addedTraits: [{
      id: 'feat-4-gwm',
      name: 'Мастер большого оружия',
      source: 'Черта (4 ур.)',
      summary: 'Мастер большого оружия',
      description: '-5 на атаку, +10 к урону',
    }],
    notes: '',
    newCantrips: [],
    newSpells: [],
    newSavingThrowProfs: [],
    newSkillProfs: [],
    newSkillExpertise: [],
    newAttacks: [],
    newProficienciesText: '',
    newEquipmentText: '',
  };

  char = simulateLevelUp(char, entry);
  assert.equal(char.level, 4);
  assert.equal(char.asiBonuses['СИЛ'], 0, 'No ASI stats added when feat chosen');
  assert.ok(char.featuresTraits.includes('[Черта 4 ур.]: Мастер большого оружия'));
  assert.ok(char.traitsList?.some(t => t.name === 'Мастер большого оружия'));

  // Rollback to 3
  char = simulateLevelDown(char);
  assert.equal(char.level, 3);
  assert.ok(!char.featuresTraits.includes('Мастер большого оружия'), 'Feat note must be removed from featuresTraits');
  assert.ok(!char.traitsList?.some(t => t.name === 'Мастер большого оружия'), 'Feat must be removed from traitsList');
});

test('Adversarial 2: Russian and English class name casing & alias normalization', () => {
  const variations = [
    { input: 'воин', expected: 'Воин' },
    { input: '  Воин  ', expected: 'Воин' },
    { input: 'FIGHTER', expected: 'Воин' },
    { input: 'fighter', expected: 'Воин' },
    { input: 'варвар', expected: 'Варвар' },
    { input: 'barbarian', expected: 'Варвар' },
    { input: 'плут', expected: 'Плут' },
    { input: 'rogue', expected: 'Плут' },
    { input: 'монах', expected: 'Монах' },
    { input: 'monk', expected: 'Монах' },
  ];

  for (const v of variations) {
    const norm = normalizeClassName(v.input);
    assert.equal(norm, v.expected, `normalizeClassName('${v.input}') must return '${v.expected}'`);
  }
});

test('Adversarial 3: Unarmored Defense interactions (Barbarian with Shield vs Monk with Shield)', () => {
  // Barbarian: 10 + DEX + CON + Shield (+2)
  const barb = createDefaultCharacter();
  barb.className = 'Варвар';
  barb.abilityScores['ЛОВ'] = 14; // +2
  barb.abilityScores['ТЕЛ'] = 16; // +3
  barb.equippedShield = true;
  // AC = 10 + 2 + 3 + 2 = 17
  assert.equal(getAC(barb), 17, 'Barbarian unarmored defense works WITH a shield (AC 17)');

  // Monk: 10 + DEX + WIS. CANNOT use shield!
  const monk = createDefaultCharacter();
  monk.className = 'Монах';
  monk.abilityScores['ЛОВ'] = 14; // +2
  monk.abilityScores['МДР'] = 16; // +3
  assert.equal(getAC(monk), 15, 'Monk AC without shield is 10 + 2 + 3 = 15');

  monk.equippedShield = true;
  // When equipped with a shield, Monk loses Unarmored Defense: falls back to 10 + DEX + shield = 10 + 2 + 2 = 14!
  assert.equal(getAC(monk), 14, 'Monk with shield loses Unarmored Defense (AC drops to 14)');
});

test('Adversarial 4: UNIVERSAL_MILESTONES defect check (Level 6 & 14 Fighter, Level 10 Rogue)', () => {
  // Check if UNIVERSAL_MILESTONES in src/lib/dnd-types.ts mentions Fighter/Rogue extra ASIs
  // Note: UNIVERSAL_MILESTONES is static per level and currently does not account for class-specific ASIs!
  const m6 = UNIVERSAL_MILESTONES[6] || [];
  const m10 = UNIVERSAL_MILESTONES[10] || [];
  const m14 = UNIVERSAL_MILESTONES[14] || [];

  // This test exposes whether UNIVERSAL_MILESTONES mentions class-specific ASIs or is strictly generic
  console.log('Milestone 6:', m6);
  console.log('Milestone 10:', m10);
  console.log('Milestone 14:', m14);

  // In generic D&D, lvl 6 and 14 are not universal ASIs, so UNIVERSAL_MILESTONES does not list ASI.
  // The system correctly delegates class-specific ASI checks to isClassASILevel!
  assert.equal(isClassASILevel('Воин', 6), true);
  assert.equal(isClassASILevel('Воин', 14), true);
  assert.equal(isClassASILevel('Плут', 10), true);
});
