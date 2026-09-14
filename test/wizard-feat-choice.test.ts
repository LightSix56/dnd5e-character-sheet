import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeatAbilityBonus, getFeatAbilityBonusFromFeat } from '../src/lib/feat-bonus-engine.js';
import { DND_COMPENDIUM_FEATS } from '../src/data/compendium/feats.js';
import { type AbilityName, createDefaultCharacter, getTotalScore } from '../src/lib/dnd-types.js';

test('Wizard Feat Choice: Half-feat bonus applies cleanly to racialBonuses map', () => {
  // Variant Human picks 2 stats: STR and CON
  const customRacialBonuses: AbilityName[] = ['СИЛ', 'ТЕЛ'];
  const bonusAmount = 1;
  const needsFeat = true;

  // Selected feat: Athlete (+1 STR or DEX), user selects DEX
  const athlete = DND_COMPENDIUM_FEATS.find(f => f.id === 'athlete')!;
  const config = getFeatAbilityBonusFromFeat(athlete);
  assert.ok(config);
  assert.equal(config.isChoice, true);
  assert.deepEqual(config.options, ['СИЛ', 'ЛОВ']);

  const selectedRacialFeatAbilityBonus: AbilityName = 'ЛОВ';

  // Simulate racialBonuses calculation in Wizard
  const racialBonuses: Record<AbilityName, number> = {
    'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0
  };
  for (const ab of customRacialBonuses) {
    racialBonuses[ab] = (racialBonuses[ab] || 0) + bonusAmount;
  }
  if (needsFeat && selectedRacialFeatAbilityBonus) {
    racialBonuses[selectedRacialFeatAbilityBonus] = (racialBonuses[selectedRacialFeatAbilityBonus] || 0) + 1;
  }

  assert.equal(racialBonuses['СИЛ'], 1, 'STR gets +1 from racial bonus');
  assert.equal(racialBonuses['ТЕЛ'], 1, 'CON gets +1 from racial bonus');
  assert.equal(racialBonuses['ЛОВ'], 1, 'DEX gets +1 from feat bonus');
  assert.equal(racialBonuses['ИНТ'], 0);
  assert.equal(racialBonuses['МДР'], 0);
  assert.equal(racialBonuses['ХАР'], 0);
});

test('Wizard Feat Choice: Athlete bonus stacks with racial bonus if same stat chosen', () => {
  const customRacialBonuses: AbilityName[] = ['СИЛ', 'ТЕЛ'];
  const bonusAmount = 1;
  const needsFeat = true;
  const selectedRacialFeatAbilityBonus: AbilityName = 'СИЛ';

  const racialBonuses: Record<AbilityName, number> = {
    'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0
  };
  for (const ab of customRacialBonuses) {
    racialBonuses[ab] = (racialBonuses[ab] || 0) + bonusAmount;
  }
  if (needsFeat && selectedRacialFeatAbilityBonus) {
    racialBonuses[selectedRacialFeatAbilityBonus] = (racialBonuses[selectedRacialFeatAbilityBonus] || 0) + 1;
  }

  assert.equal(racialBonuses['СИЛ'], 2, 'STR should be +2 (1 racial + 1 feat)');
  assert.equal(racialBonuses['ТЕЛ'], 1);
  assert.equal(racialBonuses['ЛОВ'], 0);
});

test('Wizard Feat Choice: Non-choice feat auto-defaults without forcing manual selection', () => {
  const ham = DND_COMPENDIUM_FEATS.find(f => f.id === 'heavy-armor-master')!;
  const config = getFeatAbilityBonusFromFeat(ham);
  assert.ok(config);
  assert.equal(config.isChoice, false);
  assert.equal(config.options[0], 'СИЛ');

  const defaultBonus = config.options[0];
  const racialBonuses: Record<AbilityName, number> = {
    'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0
  };
  racialBonuses[defaultBonus] += 1;
  assert.equal(racialBonuses['СИЛ'], 1);
});

test('Wizard Feat Choice: Character creation trait title includes bonus annotation', () => {
  const athlete = DND_COMPENDIUM_FEATS.find(f => f.id === 'athlete')!;
  const config = getFeatAbilityBonusFromFeat(athlete);
  const selectedBonus: AbilityName = 'ЛОВ';
  const bonusSuffix = config && selectedBonus ? ` (+1 ${selectedBonus})` : '';
  const traitName = `Черта: ${athlete.name}${bonusSuffix}`;

  assert.equal(traitName, 'Черта: Атлетичный (+1 ЛОВ)');
});
