import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter } from '../src/lib/dnd-types.js';
import { findWeaponByName } from '../src/data/dnd-weapons.js';
import {
  canToggleWeaponGrip,
  getWeaponDamageDiceForGrip,
  isOffHandBlocked,
  getActiveCharacterAttacks,
  equipItem,
  type EquippedItem,
} from '../src/lib/equipment-types.js';

test('Weapon Grip Engine: canToggleWeaponGrip dynamically identifies versatile weapons and lance without hardcoded names', () => {
  // Versatile weapons from dnd.su must allow grip toggle
  const longsword = findWeaponByName('Длинный меч');
  const battleaxe = findWeaponByName('Боевой топор');
  const warhammer = findWeaponByName('Боевой молот');
  const quarterstaff = findWeaponByName('Боевой посох');
  const spear = findWeaponByName('Копьё');
  const trident = findWeaponByName('Трезубец');

  assert.ok(longsword && canToggleWeaponGrip(longsword), 'Longsword must allow grip toggle');
  assert.ok(battleaxe && canToggleWeaponGrip(battleaxe), 'Battleaxe must allow grip toggle');
  assert.ok(warhammer && canToggleWeaponGrip(warhammer), 'Warhammer must allow grip toggle');
  assert.ok(quarterstaff && canToggleWeaponGrip(quarterstaff), 'Quarterstaff must allow grip toggle');
  assert.ok(spear && canToggleWeaponGrip(spear), 'Spear must allow grip toggle');
  assert.ok(trident && canToggleWeaponGrip(trident), 'Trident must allow grip toggle');

  // Lance has special 1H (mounted) vs 2H (on foot) rule
  const lance = findWeaponByName('Длинное копьё');
  assert.ok(lance && canToggleWeaponGrip(lance), 'Lance must allow grip toggle');

  // Strictly two-handed weapons CANNOT toggle (always 2H)
  const greatsword = findWeaponByName('Двуручный меч');
  const greataxe = findWeaponByName('Секира');
  const maul = findWeaponByName('Молот');
  const pike = findWeaponByName('Пика');
  const longbow = findWeaponByName('Длинный лук');

  assert.ok(greatsword && !canToggleWeaponGrip(greatsword), 'Greatsword cannot toggle grip');
  assert.ok(greataxe && !canToggleWeaponGrip(greataxe), 'Greataxe cannot toggle grip');
  assert.ok(maul && !canToggleWeaponGrip(maul), 'Maul cannot toggle grip');
  assert.ok(pike && !canToggleWeaponGrip(pike), 'Pike cannot toggle grip');
  assert.ok(longbow && !canToggleWeaponGrip(longbow), 'Longbow cannot toggle grip');

  // Strictly one-handed weapons without versatile property cannot toggle grip
  const dagger = findWeaponByName('Кинжал');
  const shortsword = findWeaponByName('Короткий меч');
  const rapier = findWeaponByName('Рапира');
  const mace = findWeaponByName('Булава');

  assert.ok(dagger && !canToggleWeaponGrip(dagger), 'Dagger cannot toggle grip');
  assert.ok(shortsword && !canToggleWeaponGrip(shortsword), 'Shortsword cannot toggle grip');
  assert.ok(rapier && !canToggleWeaponGrip(rapier), 'Rapier cannot toggle grip');
  assert.ok(mace && !canToggleWeaponGrip(mace), 'Mace cannot toggle grip');
});

test('Weapon Grip Engine: getWeaponDamageDiceForGrip calculates versatile damage correctly', () => {
  const longsword = findWeaponByName('Длинный меч');
  assert.equal(getWeaponDamageDiceForGrip(longsword, false), '1d8', 'Longsword 1H is 1d8');
  assert.equal(getWeaponDamageDiceForGrip(longsword, true), '1d10', 'Longsword 2H is 1d10');

  const spear = findWeaponByName('Копьё');
  assert.equal(getWeaponDamageDiceForGrip(spear, false), '1d6', 'Spear 1H is 1d6');
  assert.equal(getWeaponDamageDiceForGrip(spear, true), '1d8', 'Spear 2H is 1d8');

  const lance = findWeaponByName('Длинное копьё');
  assert.equal(getWeaponDamageDiceForGrip(lance, false), '1d12', 'Lance 1H is 1d12');
  assert.equal(getWeaponDamageDiceForGrip(lance, true), '1d12', 'Lance 2H is 1d12');

  const dagger = findWeaponByName('Кинжал');
  assert.equal(getWeaponDamageDiceForGrip(dagger, false), '1d4');
  assert.equal(getWeaponDamageDiceForGrip(dagger, true), '1d4');
});

test('Weapon Grip Engine: isOffHandBlocked dynamically blocks offHand when 2H grip is active', () => {
  let char = createDefaultCharacter();
  char.abilityScores['СИЛ'] = 16;

  const longswordItem: EquippedItem = {
    id: 'w-1',
    name: 'Длинный меч',
    slot: 'mainHand',
    twoHandGrip: false,
  };

  char = equipItem(char, 'mainHand', longswordItem);
  assert.equal(isOffHandBlocked(char), false, '1H Longsword should not block off-hand');

  // Switch grip to 2H
  const longswordItem2H: EquippedItem = {
    ...longswordItem,
    twoHandGrip: true,
  };
  char = equipItem(char, 'mainHand', longswordItem2H);
  assert.equal(isOffHandBlocked(char), true, '2H Longsword MUST block off-hand');

  // Lance in 2H grip (on foot) blocks off-hand
  const lanceItem2H: EquippedItem = {
    id: 'w-lance',
    name: 'Длинное копьё',
    slot: 'mainHand',
    twoHandGrip: true,
  };
  char = equipItem(char, 'mainHand', lanceItem2H);
  assert.equal(isOffHandBlocked(char), true, '2H Lance (on foot) MUST block off-hand');

  // Lance in 1H grip (mounted) does NOT block off-hand
  const lanceItem1H: EquippedItem = {
    id: 'w-lance-1h',
    name: 'Длинное копьё',
    slot: 'mainHand',
    twoHandGrip: false,
  };
  char = equipItem(char, 'mainHand', lanceItem1H);
  assert.equal(isOffHandBlocked(char), false, '1H Lance (mounted) should not block off-hand');
});

test('Weapon Grip Engine: getActiveCharacterAttacks reflects grip damage and labels in attacks table', () => {
  let char = createDefaultCharacter();
  char.abilityScores['СИЛ'] = 16; // +3 modifier

  // 1H Longsword
  const longsword1H: EquippedItem = {
    id: 'w-ls-1h',
    name: 'Длинный меч',
    slot: 'mainHand',
    twoHandGrip: false,
  };
  char = equipItem(char, 'mainHand', longsword1H);
  let attacks = getActiveCharacterAttacks(char);
  let mainAtk = attacks.find(a => a.source === 'mainHand');
  assert.ok(mainAtk);
  assert.equal(mainAtk.damageAndType, '1d8+3 рубящий');
  assert.ok(!mainAtk.grip || mainAtk.grip === '1H');

  // 2H Longsword
  const longsword2H: EquippedItem = {
    id: 'w-ls-2h',
    name: 'Длинный меч',
    slot: 'mainHand',
    twoHandGrip: true,
  };
  char = equipItem(char, 'mainHand', longsword2H);
  attacks = getActiveCharacterAttacks(char);
  mainAtk = attacks.find(a => a.source === 'mainHand');
  assert.ok(mainAtk);
  assert.equal(mainAtk.damageAndType, '1d10+3 рубящий', '2H Longsword attack damage must be 1d10+3');
  assert.equal(mainAtk.grip, '2H');
});
