import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRacialBonusConfig,
  getRacialChoicesConfig,
  getBackgroundLanguageChoiceConfig
} from '../src/components/wizard/wizard-helpers';
import { DND_COMPENDIUM_RACES } from '../src/data/compendium/races';
import { DND_COMPENDIUM_BACKGROUNDS } from '../src/data/compendium/backgrounds';

test('TDD: Dhampir, Hexblood, and Reborn must be detected with flexible ASI (+2/+1 or +1/+1/+1)', () => {
  const dhampir = DND_COMPENDIUM_RACES.find(r => r.id === 'dhampir');
  assert.ok(dhampir, 'Dhampir race must exist in compendium');

  const config = getRacialBonusConfig(dhampir!);
  assert.equal(config.hasCustomBonus, true, 'Dhampir must have hasCustomBonus = true');
  assert.equal(config.isFlexibleASI, true, 'Dhampir must have isFlexibleASI = true');
  assert.equal(config.availableAbilities.length, 6, 'All 6 abilities must be available for choice');
  assert.equal(config.choiceCount, 2, 'Default choice count is 2 (for +2/+1 mode)');

  const hexblood = DND_COMPENDIUM_RACES.find(r => r.id === 'hexblood');
  if (hexblood) {
    const hbConfig = getRacialBonusConfig(hexblood);
    assert.equal(hbConfig.hasCustomBonus, true);
    assert.equal(hbConfig.isFlexibleASI, true);
  }

  const reborn = DND_COMPENDIUM_RACES.find(r => r.id === 'reborn');
  if (reborn) {
    const rbConfig = getRacialBonusConfig(reborn);
    assert.equal(rbConfig.hasCustomBonus, true);
    assert.equal(rbConfig.isFlexibleASI, true);
  }
});

test('TDD: Dhampir and races with extra language traits must grant extraLanguageCount >= 1', () => {
  const dhampir = DND_COMPENDIUM_RACES.find(r => r.id === 'dhampir');
  assert.ok(dhampir, 'Dhampir race must exist in compendium');

  const choices = getRacialChoicesConfig(dhampir!);
  assert.equal(choices.extraLanguageCount, 1, 'Dhampir must grant 1 extra language choice beyond Common');

  const hexblood = DND_COMPENDIUM_RACES.find(r => r.id === 'hexblood');
  if (hexblood) {
    const hbChoices = getRacialChoicesConfig(hexblood);
    assert.equal(hbChoices.extraLanguageCount, 1, 'Hexblood must grant 1 extra language choice');
  }
});

test('TDD: getBackgroundLanguageChoiceConfig accurately identifies backgrounds with languages to choose', () => {
  assert.equal(typeof getBackgroundLanguageChoiceConfig, 'function', 'getBackgroundLanguageChoiceConfig must be exported');

  const acolyte = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'acolyte');
  assert.ok(acolyte, 'Acolyte background must exist');
  const acolyteLang = getBackgroundLanguageChoiceConfig(acolyte!);
  assert.equal(acolyteLang.needsChoice, true, 'Acolyte grants languages on choice');
  assert.equal(acolyteLang.choiceCount, 2, 'Acolyte grants 2 languages on choice');
  assert.deepEqual(acolyteLang.fixedLanguages, [], 'Acolyte has no pre-fixed languages');

  const noble = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'noble');
  assert.ok(noble, 'Noble background must exist');
  const nobleLang = getBackgroundLanguageChoiceConfig(noble!);
  assert.equal(nobleLang.needsChoice, true, 'Noble grants 1 language on choice');
  assert.equal(nobleLang.choiceCount, 1, 'Noble grants 1 language on choice');

  const soldier = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'soldier');
  assert.ok(soldier, 'Soldier background must exist');
  const soldierLang = getBackgroundLanguageChoiceConfig(soldier!);
  assert.equal(soldierLang.needsChoice, false, 'Soldier grants no languages');
  assert.equal(soldierLang.choiceCount, 0);
});

test('TDD: Flexible ASI calculation resolves +2/+1 and +1/+1/+1 properly', () => {
  // Simulate logic used by wizard modal racialBonuses memo
  function resolveFlexibleBonuses(
    mode: 'two_plus_one' | 'three_plus_one',
    plus2: string | null,
    plus1: string | null,
    three: string[]
  ): Record<string, number> {
    const map: Record<string, number> = { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
    if (mode === 'two_plus_one') {
      if (plus2) map[plus2] = (map[plus2] || 0) + 2;
      if (plus1) map[plus1] = (map[plus1] || 0) + 1;
    } else {
      for (const ab of three) {
        map[ab] = (map[ab] || 0) + 1;
      }
    }
    return map;
  }

  const res21 = resolveFlexibleBonuses('two_plus_one', 'ТЕЛ', 'ЛОВ', []);
  assert.equal(res21['ТЕЛ'], 2);
  assert.equal(res21['ЛОВ'], 1);
  assert.equal(res21['СИЛ'], 0);

  const res111 = resolveFlexibleBonuses('three_plus_one', null, null, ['СИЛ', 'ТЕЛ', 'ХАР']);
  assert.equal(res111['СИЛ'], 1);
  assert.equal(res111['ТЕЛ'], 1);
  assert.equal(res111['ХАР'], 1);
  assert.equal(res111['ЛОВ'], 0);
});

test('TDD: Final sheet language aggregation includes chosen background languages and excludes placeholder strings', () => {
  const baseRaceLanguages = ['Общий'];
  const selectedExtraLanguages = ['Эльфийский'];
  const acolyte = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'acolyte')!;
  const langConfig = getBackgroundLanguageChoiceConfig(acolyte);
  const selectedBackgroundLanguages = ['Драконий', 'Дварфийский'];

  const bgLangs = langConfig.needsChoice
    ? [...langConfig.fixedLanguages, ...selectedBackgroundLanguages]
    : (acolyte.languages || []).filter(l => !l.toLowerCase().includes('выбор'));

  const finalLanguages = Array.from(new Set([
    ...baseRaceLanguages,
    ...selectedExtraLanguages,
    ...bgLangs
  ]));

  assert.deepEqual(finalLanguages, ['Общий', 'Эльфийский', 'Драконий', 'Дварфийский']);
  assert.ok(!finalLanguages.some(l => l.toLowerCase().includes('выбор')), 'Placeholder strings must never appear in final languages');
});

