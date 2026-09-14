import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeatAbilityBonus, getFeatAbilityBonusFromFeat } from '../src/lib/feat-bonus-engine.js';
import { DND_COMPENDIUM_FEATS } from '../src/data/compendium/feats.js';

test('Feat Ability Engine: Choice between 2 stats (Athlete: STR or DEX)', () => {
  const athlete = DND_COMPENDIUM_FEATS.find(f => f.id === 'athlete');
  assert.ok(athlete, 'Athlete feat must exist in compendium');
  assert.equal(athlete.abilityBonus, '+1 СИЛ или ЛОВ');

  const config = getFeatAbilityBonusFromFeat(athlete);
  assert.ok(config, 'Must parse config for Athlete');
  assert.equal(config.isChoice, true, 'Must be a choice');
  assert.equal(config.amount, 1);
  assert.deepEqual(config.options, ['СИЛ', 'ЛОВ']);
});

test('Feat Ability Engine: Flat single stat bonus (Heavy Armor Master: STR)', () => {
  const heavy = DND_COMPENDIUM_FEATS.find(f => f.id === 'heavy-armor-master');
  assert.ok(heavy, 'Heavy armor master feat must exist');
  assert.equal(heavy.abilityBonus, '+1 СИЛ');

  const config = getFeatAbilityBonusFromFeat(heavy);
  assert.ok(config, 'Must parse config');
  assert.equal(config.isChoice, false, 'Single stat is NOT a choice');
  assert.equal(config.amount, 1);
  assert.deepEqual(config.options, ['СИЛ']);
});

test('Feat Ability Engine: Choice of 3 stats (Telekinetic / Observant: INT, WIS or CHA)', () => {
  const telekinetic = DND_COMPENDIUM_FEATS.find(f => f.id === 'telekinetic');
  assert.ok(telekinetic);

  const config = getFeatAbilityBonusFromFeat(telekinetic);
  assert.ok(config);
  assert.equal(config.isChoice, true);
  assert.deepEqual(config.options, ['ИНТ', 'МДР', 'ХАР']);
});

test('Feat Ability Engine: Choice of 4 stats (Elven Accuracy: DEX, INT, WIS or CHA)', () => {
  const elvenAccuracy = DND_COMPENDIUM_FEATS.find(f => f.id === 'elven-accuracy');
  assert.ok(elvenAccuracy);

  const config = getFeatAbilityBonusFromFeat(elvenAccuracy);
  assert.ok(config);
  assert.equal(config.isChoice, true);
  assert.deepEqual(config.options, ['ЛОВ', 'ИНТ', 'МДР', 'ХАР']);
});

test('Feat Ability Engine: Choice of all 6 stats (Resilient: any)', () => {
  const resilient = DND_COMPENDIUM_FEATS.find(f => f.id === 'resilient');
  assert.ok(resilient);

  const config = getFeatAbilityBonusFromFeat(resilient);
  assert.ok(config);
  assert.equal(config.isChoice, true);
  assert.deepEqual(config.options, ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР']);
});

test('Feat Ability Engine: Non-bonus feats return null', () => {
  const alert = DND_COMPENDIUM_FEATS.find(f => f.id === 'alert');
  assert.ok(alert);
  const config = getFeatAbilityBonusFromFeat(alert);
  assert.equal(config, null);

  assert.equal(parseFeatAbilityBonus(''), null);
  assert.equal(parseFeatAbilityBonus(undefined), null);
});

test('Feat Ability Engine: Validates and parses 100% of compendium feats with abilityBonus', () => {
  const withBonus = DND_COMPENDIUM_FEATS.filter(f => f.abilityBonus);
  assert.ok(withBonus.length >= 50, 'Must have at least 50 half-feats');

  for (const feat of withBonus) {
    const config = getFeatAbilityBonusFromFeat(feat);
    assert.ok(config, `Feat "${feat.name}" (${feat.id}) with abilityBonus "${feat.abilityBonus}" must parse`);
    assert.ok(config.options.length >= 1, `Feat "${feat.name}" must have at least 1 option`);
    assert.equal(config.isChoice, config.options.length > 1);
  }
});
