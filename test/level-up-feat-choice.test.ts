import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeatAbilityBonus, getFeatAbilityBonusFromFeat } from '../src/lib/feat-bonus-engine.js';
import { DND_COMPENDIUM_FEATS } from '../src/data/compendium/feats.js';
import { createDefaultCharacter, getTotalScore, type CharacterData, type LevelUpEntry } from '../src/lib/dnd-types.js';

test('Level Up Feat Choice: Athlete grants choice between STR and DEX', () => {
  const athlete = DND_COMPENDIUM_FEATS.find(f => f.id === 'athlete')!;
  const config = getFeatAbilityBonusFromFeat(athlete);
  assert.ok(config);
  assert.equal(config.isChoice, true);
  assert.deepEqual(config.options, ['СИЛ', 'ЛОВ']);
});

test('Level Up Feat Choice: Heavy Armor Master grants flat STR without choice', () => {
  const ham = DND_COMPENDIUM_FEATS.find(f => f.id === 'heavy-armor-master')!;
  const config = getFeatAbilityBonusFromFeat(ham);
  assert.ok(config);
  assert.equal(config.isChoice, false);
  assert.deepEqual(config.options, ['СИЛ']);
});

test('Level Up Feat Choice: Simulating handleLevelUp applies featAbilityBonus to asiBonuses', () => {
  const char: CharacterData = createDefaultCharacter();
  char.abilityScores['ЛОВ'] = 14;
  assert.equal(getTotalScore(char, 'ЛОВ'), 14);

  // Simulate applying LevelUpEntry with featAbilityBonus = 'ЛОВ'
  const entry: LevelUpEntry = {
    level: 4,
    hpGained: 6,
    asiAbilities: null,
    selectedFeat: 'Атлетичный',
    featAbilityBonus: 'ЛОВ',
    notes: '[Черта 4 ур.]: Атлетичный (+1 к Ловкости)',
    newCantrips: [],
    newSpells: [],
    newSavingThrowProfs: [],
    newSkillProfs: [],
    newSkillExpertise: [],
    newAttacks: [],
    newProficienciesText: '',
    newEquipmentText: '',
  };

  // The logic in page.tsx handleLevelUp
  const newAsi = { ...char.asiBonuses };
  if (entry.featAbilityBonus) {
    newAsi[entry.featAbilityBonus] = (newAsi[entry.featAbilityBonus] || 0) + 1;
  }
  const updatedChar = { ...char, asiBonuses: newAsi, level: 4, levelHistory: [entry] };

  assert.equal(updatedChar.asiBonuses['ЛОВ'], 1);
  assert.equal(getTotalScore(updatedChar, 'ЛОВ'), 15, 'Total DEX score should increase from 14 to 15');

  // Simulate handleLevelDown rollback
  const history = updatedChar.levelHistory || [];
  const last = history[history.length - 1];
  const rollbackAsi = { ...updatedChar.asiBonuses };
  if (last?.featAbilityBonus) {
    rollbackAsi[last.featAbilityBonus] = Math.max(0, (rollbackAsi[last.featAbilityBonus] || 0) - 1);
  }
  const rolledBackChar = { ...updatedChar, asiBonuses: rollbackAsi, level: 3 };

  assert.equal(rolledBackChar.asiBonuses['ЛОВ'], 0);
  assert.equal(getTotalScore(rolledBackChar, 'ЛОВ'), 14, 'Total DEX score should revert back to 14');
});
