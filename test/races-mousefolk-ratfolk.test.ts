import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_RACES, findRaceByName } from '../src/data/compendium/races/index.js';
import {
  createDefaultCharacter,
  applyRaceTemplate,
  getTotalScore,
  getModifier,
  formatAbilityBonus,
} from '../src/lib/dnd-types.js';
import { getRacialBonusConfig } from '../src/components/wizard/wizard-helpers.js';

test('Compendium: Mousefolk and Ratfolk are included in DND_COMPENDIUM_RACES', () => {
  const mousefolk = findRaceByName('Мышинец');
  const ratfolk = findRaceByName('Людокрыса');

  assert.ok(mousefolk, 'Mousefolk must be found by Russian name');
  assert.ok(ratfolk, 'Ratfolk must be found by Russian name');

  assert.equal(findRaceByName('Mousefolk')?.id, 'mousefolk');
  assert.equal(findRaceByName('Ratfolk')?.id, 'ratfolk');
  assert.equal(findRaceByName('Крысолюд')?.id, 'ratfolk', 'Ratfolk must be found by alias Крысолюд');
});

test('Compendium: Mousefolk has accurate D&D 5e / dnd.su stats and 3 subraces', () => {
  const mousefolk = findRaceByName('Мышинец');
  assert.ok(mousefolk);

  assert.equal(mousefolk.id, 'mousefolk');
  assert.equal(mousefolk.name, 'Мышинец');
  assert.equal(mousefolk.nameEn, 'Mousefolk');
  assert.equal(mousefolk.size, 'Крошечный');
  assert.equal(mousefolk.speed, 20);
  assert.equal(mousefolk.darkvision, 30);
  assert.deepEqual(mousefolk.abilityBonuses, { ЛОВ: 2 });
  assert.ok(mousefolk.languages.includes('Общий') && mousefolk.languages.includes('Мышиный'));

  // Base traits
  const traitNames = mousefolk.traits.map(t => t.name);
  assert.ok(traitNames.includes('Мышиная незаметность'));
  assert.ok(traitNames.includes('Владение инструментами'));
  assert.ok(traitNames.includes('Разговор с маленькими зверями'));
  assert.ok(traitNames.includes('Острый слух'));
  assert.ok(traitNames.includes('Побег'));

  // 3 Subraces: Полевая мышь, Городская мышь, Крыса
  assert.equal(mousefolk.subraces.length, 3);
  
  const fieldMouse = mousefolk.subraces.find(sr => sr.name === 'Полевая мышь');
  assert.ok(fieldMouse, 'Field Mouse subrace must exist');
  assert.deepEqual(fieldMouse.abilityBonuses, { ТЕЛ: 1 });
  assert.equal(fieldMouse.speed, 30);
  assert.ok(fieldMouse.traits.some(t => t.name === 'Быстроногие'));
  assert.ok(fieldMouse.traits.some(t => t.name === 'Скрытные'));

  const cityMouse = mousefolk.subraces.find(sr => sr.name === 'Городская мышь');
  assert.ok(cityMouse, 'City Mouse subrace must exist');
  assert.deepEqual(cityMouse.abilityBonuses, { ИНТ: 1 });
  assert.ok(cityMouse.traits.some(t => t.name === 'Цепкие лапы'));
  assert.ok(cityMouse.traits.some(t => t.name === 'Верный спутник'));

  const rat = mousefolk.subraces.find(sr => sr.name === 'Крыса');
  assert.ok(rat, 'Rat subrace must exist');
  assert.deepEqual(rat.abilityBonuses, { СИЛ: 1 });
  assert.ok(rat.traits.some(t => t.name === 'Отравители'));
  assert.ok(rat.traits.some(t => t.name === 'Мастерство крюк-мышки'));
});

test('Compendium: Ratfolk has accurate D&D 5e / dnd.su stats', () => {
  const ratfolk = findRaceByName('Людокрыса');
  assert.ok(ratfolk);

  assert.equal(ratfolk.id, 'ratfolk');
  assert.equal(ratfolk.name, 'Людокрыса');
  assert.equal(ratfolk.nameEn, 'Ratfolk');
  assert.equal(ratfolk.size, 'Маленький');
  assert.equal(ratfolk.speed, 25);
  assert.equal(ratfolk.darkvision, 60);
  assert.deepEqual(ratfolk.abilityBonuses, { ЛОВ: 2, ИНТ: 1, СИЛ: -2 });
  assert.ok(ratfolk.languages.includes('Общий'));

  const traitNames = ratfolk.traits.map(t => t.name);
  assert.ok(traitNames.includes('Пловцы'));
  assert.ok(traitNames.includes('Проворство'));
  assert.ok(traitNames.includes('Тактика стаи'));
  assert.ok(traitNames.includes('Сочувствие грызунам'));
});

test('applyRaceTemplate: Mousefolk with Field Mouse subrace applies stats and speed override', () => {
  const mousefolk = findRaceByName('Мышинец');
  assert.ok(mousefolk);
  const fieldMouse = mousefolk.subraces.find(sr => sr.name === 'Полевая мышь');
  assert.ok(fieldMouse);

  const char = createDefaultCharacter();
  const applied = applyRaceTemplate(char, mousefolk, fieldMouse);

  assert.equal(applied.race, 'Мышинец (Полевая мышь)');
  assert.equal(applied.subrace, 'Полевая мышь');
  assert.equal(applied.speed, 30, 'Field mouse subrace speed must override base speed');
  assert.equal(applied.abilityBonuses['ЛОВ'], 2);
  assert.equal(applied.abilityBonuses['ТЕЛ'], 1);
  assert.ok(applied.traitsList?.some(t => t.name === 'Побег'));
  assert.ok(applied.traitsList?.some(t => t.name === 'Быстроногие'));
});

test('applyRaceTemplate: Ratfolk applies negative and positive ability modifiers and traits', () => {
  const ratfolk = findRaceByName('Людокрыса');
  assert.ok(ratfolk);

  const char = createDefaultCharacter();
  const applied = applyRaceTemplate(char, ratfolk);

  assert.equal(applied.race, 'Людокрыса');
  assert.equal(applied.speed, 25);
  assert.equal(applied.abilityBonuses['ЛОВ'], 2);
  assert.equal(applied.abilityBonuses['ИНТ'], 1);
  assert.equal(applied.abilityBonuses['СИЛ'], -2);
  assert.ok(applied.traitsList?.some(t => t.name === 'Тактика стаи'));
  assert.ok(applied.traitsList?.some(t => t.name === 'Пловцы'));
});

test('Racial Bonuses: formatAbilityBonus formats positive, negative and zero bonuses accurately', () => {
  assert.equal(formatAbilityBonus(2), '+2');
  assert.equal(formatAbilityBonus(1), '+1');
  assert.equal(formatAbilityBonus(-2), '-2');
  assert.equal(formatAbilityBonus(-1), '-1');
  assert.equal(formatAbilityBonus(0), '0');
});

test('Racial Bonuses: getRacialBonusConfig properly formats negative modifiers without +- syntax', () => {
  const ratfolk = findRaceByName('Людокрыса');
  assert.ok(ratfolk);

  const cfg = getRacialBonusConfig(ratfolk);
  assert.equal(cfg.fixedBonuses['СИЛ'], -2);
  assert.equal(cfg.fixedBonuses['ЛОВ'], 2);
  assert.equal(cfg.fixedBonuses['ИНТ'], 1);

  // Must contain "СИЛ -2" and NOT "СИЛ +-2"
  assert.ok(cfg.description.includes('СИЛ -2'), `Expected "СИЛ -2" in description but got: "${cfg.description}"`);
  assert.ok(!cfg.description.includes('+-'), `Description should not contain "+-": "${cfg.description}"`);
});

test('Racial Bonuses: Ratfolk Strength penalty reduces total ability scores and modifiers correctly', () => {
  const ratfolk = findRaceByName('Людокрыса');
  assert.ok(ratfolk);

  const char = createDefaultCharacter();
  const applied = applyRaceTemplate(char, ratfolk);

  // Base score 10 + (-2) = 8 -> modifier -1
  applied.abilityScores['СИЛ'] = 10;
  assert.equal(getTotalScore(applied, 'СИЛ'), 8);
  assert.equal(getModifier(applied, 'СИЛ'), -1);

  // Point-buy minimum 8 + (-2) = 6 -> modifier -2
  applied.abilityScores['СИЛ'] = 8;
  assert.equal(getTotalScore(applied, 'СИЛ'), 6);
  assert.equal(getModifier(applied, 'СИЛ'), -2);

  // Point-buy maximum 15 + (-2) = 13 -> modifier +1
  applied.abilityScores['СИЛ'] = 15;
  assert.equal(getTotalScore(applied, 'СИЛ'), 13);
  assert.equal(getModifier(applied, 'СИЛ'), 1);

  // Standard array high 14 + (-2) = 12 -> modifier +1
  applied.abilityScores['СИЛ'] = 14;
  assert.equal(getTotalScore(applied, 'СИЛ'), 12);
  assert.equal(getModifier(applied, 'СИЛ'), 1);
});

