import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter, applyClassTemplate } from '../src/lib/dnd-types.js';
import {
  equipItem,
  getActiveCharacterAttacks,
  type EquippedItem,
} from '../src/lib/equipment-types.js';

test('Dual-Wield Engine: Generates Main Hand, Off-Hand (no style), and Dual Strike attacks', () => {
  let char = createDefaultCharacter();
  char.abilityScores['ЛОВ'] = 16; // +3 DEX
  char.level = 1; // +2 Prof

  // Equip two shortswords (1d6 piercing, finesse, light)
  const mainSword: EquippedItem = {
    id: 'sw-1',
    name: 'Короткий меч',
    slot: 'mainHand',
  };
  const offSword: EquippedItem = {
    id: 'sw-2',
    name: 'Короткий меч',
    slot: 'offHand',
  };

  char = equipItem(char, 'mainHand', mainSword);
  char = equipItem(char, 'offHand', offSword);

  const attacks = getActiveCharacterAttacks(char);

  // 1. Main Hand Attack: +5 to hit (+2 prof +3 dex), 1d6+3 piercing
  const mainAtk = attacks.find(a => a.source === 'mainHand');
  assert.ok(mainAtk, 'Main hand attack should exist');
  assert.equal(mainAtk.attackBonus, '+5');
  assert.equal(mainAtk.damageAndType, '1d6+3 колющий');
  assert.equal(mainAtk.actionType, 'action');

  // 2. Off-Hand Attack without fighting style: +5 to hit, 1d6 piercing (NO ability modifier to damage!)
  const offAtk = attacks.find(a => a.source === 'offHand');
  assert.ok(offAtk, 'Off hand attack should exist');
  assert.equal(offAtk.attackBonus, '+5');
  assert.equal(offAtk.damageAndType, '1d6 колющий');
  assert.equal(offAtk.actionType, 'bonus');

  // 3. Dual Strike: combined action + bonus
  const dualAtk = attacks.find(a => a.source === 'dual');
  assert.ok(dualAtk, 'Dual strike attack should exist');
  assert.equal(dualAtk.actionType, 'dualAction');
  assert.ok(dualAtk.dualDetails);
  assert.equal(dualAtk.dualDetails.mainDmg, '1d6+3 колющий');
  assert.equal(dualAtk.dualDetails.offDmg, '1d6 колющий');
});

test('Dual-Wield Engine: Adds modifier to off-hand damage when character has Two-Weapon Fighting style', () => {
  let char = createDefaultCharacter();
  char.abilityScores['ЛОВ'] = 16; // +3 DEX
  char.featuresTraits = 'Боевой стиль: Сражение двумя оружиями\nВторое дыхание';

  const mainSword: EquippedItem = { id: 'sw-1', name: 'Короткий меч', slot: 'mainHand' };
  const offSword: EquippedItem = { id: 'sw-2', name: 'Короткий меч', slot: 'offHand' };

  char = equipItem(char, 'mainHand', mainSword);
  char = equipItem(char, 'offHand', offSword);

  const attacks = getActiveCharacterAttacks(char);
  const offAtk = attacks.find(a => a.source === 'offHand');
  assert.ok(offAtk);
  // With style, +3 DEX is added to off-hand damage
  assert.equal(offAtk.damageAndType, '1d6+3 колющий');

  const dualAtk = attacks.find(a => a.source === 'dual');
  assert.equal(dualAtk?.dualDetails?.offDmg, '1d6+3 колющий');
});

test('Dual-Wield Engine: Thrown weapons in inventory are always available even if not held in hands', () => {
  let char = createDefaultCharacter();
  char.abilityScores['ЛОВ'] = 14; // +2 DEX
  char.abilityScores['СИЛ'] = 16; // +3 STR
  // Character holds a two-handed greatsword
  const greatsword: EquippedItem = { id: 'gs-1', name: 'Двуручный меч', slot: 'mainHand', twoHanded: true };
  char = equipItem(char, 'mainHand', greatsword);

  // Backpack has daggers and javelins
  char.equipment = 'Кинжал (3 шт.), Дротик (4 шт.), Рационы';

  const attacks = getActiveCharacterAttacks(char);

  // Greatsword attack is present
  const mainAtk = attacks.find(a => a.source === 'mainHand');
  assert.equal(mainAtk?.weaponName, 'Двуручный меч');

  // Thrown dagger and dart are present
  const daggerThrown = attacks.find(a => a.source === 'thrown' && a.weaponName.toLowerCase().includes('кинжал'));
  assert.ok(daggerThrown, 'Dagger should be available as thrown weapon');
  assert.equal(daggerThrown.attackBonus, '+5'); // STR +3, Prof +2
  assert.ok(daggerThrown.damageAndType.includes('1d4'));

  const dartThrown = attacks.find(a => a.source === 'thrown' && a.weaponName.toLowerCase().includes('дротик'));
  assert.ok(dartThrown, 'Dart should be available as thrown weapon');
});

test('Dual-Wield Engine: Unarmed strike is always available', () => {
  const char = createDefaultCharacter();
  char.abilityScores['СИЛ'] = 14; // +2 STR
  const attacks = getActiveCharacterAttacks(char);
  const unarmed = attacks.find(a => a.source === 'unarmed');
  assert.ok(unarmed);
  assert.equal(unarmed.attackBonus, '+4'); // 2 prof + 2 STR
  assert.equal(unarmed.damageAndType, '3 дроб.'); // 1 + 2 STR
});

test('Dual-Wield Engine: Starting class templates auto-equip weapons, armor, and shields into equippedSlots', () => {
  // 1. Ranger template starts with 2 shortswords -> auto-equipped for dual wielding
  const ranger = applyClassTemplate('ranger');
  assert.equal(ranger.equippedSlots?.armor?.name, 'Чешуйчатый доспех');
  assert.equal(ranger.equippedSlots?.mainHand?.name, 'Короткий меч');
  assert.equal(ranger.equippedSlots?.offHand?.name, 'Короткий меч');

  const rangerAttacks = getActiveCharacterAttacks(ranger);
  assert.ok(rangerAttacks.some(a => a.source === 'mainHand'));
  assert.ok(rangerAttacks.some(a => a.source === 'offHand'));
  assert.ok(rangerAttacks.some(a => a.source === 'dual'));

  // 2. Fighter template starts with longsword and shield
  const fighter = applyClassTemplate('fighter');
  assert.equal(fighter.equippedSlots?.armor?.name, 'Кольчуга');
  assert.equal(fighter.equippedSlots?.mainHand?.name, 'Длинный меч');
  assert.equal(fighter.equippedSlots?.offHand?.isShield, true);

  const fighterAttacks = getActiveCharacterAttacks(fighter);
  assert.ok(fighterAttacks.some(a => a.source === 'mainHand'));
  assert.ok(!fighterAttacks.some(a => a.source === 'offHand'));
  assert.ok(!fighterAttacks.some(a => a.source === 'dual'));

  // 3. Barbarian template starts with two-handed Greataxe
  const barbarian = applyClassTemplate('barbarian');
  assert.equal(barbarian.equippedSlots?.mainHand?.name, 'Секира');
  assert.equal(barbarian.equippedSlots?.mainHand?.twoHanded, true);
  assert.equal(barbarian.equippedSlots?.offHand, undefined);
});
