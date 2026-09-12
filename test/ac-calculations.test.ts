import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultCharacter,
  getAC,
  getCalculatedAC,
  getAvailableArmorModes,
  type CharacterData,
} from '../src/lib/dnd-types.js';

test('AC Engine: Real-time calculation and manual override', () => {
  const char = createDefaultCharacter();
  char.abilityScores['ЛОВ'] = 14; // DEX mod +2

  // By default, armorClass is null and calculated AC is 10 + 2 = 12
  assert.equal(char.armorClass, null);
  assert.equal(getCalculatedAC(char), 12);
  assert.equal(getAC(char), 12);

  // Changing DEX immediately changes AC in real time
  char.abilityScores['ЛОВ'] = 18; // DEX mod +4
  assert.equal(getCalculatedAC(char), 14);
  assert.equal(getAC(char), 14);

  // When manual override is provided, getAC returns override, but getCalculatedAC still returns live formula
  char.armorClass = 20;
  assert.equal(getAC(char), 20);
  assert.equal(getCalculatedAC(char), 14);

  // Resetting override to null restores live calculation in getAC
  char.armorClass = null;
  assert.equal(getAC(char), 14);
});

test('AC Engine: Class Unarmored Defenses', () => {
  // Barbarian: 10 + DEX + CON (allows shield)
  const barbarian = createDefaultCharacter();
  barbarian.className = 'Варвар';
  barbarian.abilityScores['ЛОВ'] = 14; // +2
  barbarian.abilityScores['ТЕЛ'] = 16; // +3

  assert.equal(getCalculatedAC(barbarian), 15); // 10 + 2 + 3

  barbarian.equippedShield = true;
  assert.equal(getCalculatedAC(barbarian), 17); // 15 + 2

  // Monk: 10 + DEX + WIS (NO shield)
  const monk = createDefaultCharacter();
  monk.className = 'Монах';
  monk.abilityScores['ЛОВ'] = 16; // +3
  monk.abilityScores['МДР'] = 14; // +2

  assert.equal(getCalculatedAC(monk), 15); // 10 + 3 + 2

  // If Monk equips shield, Monk Unarmored Defense is negated (falls back to standard 10 + DEX + Shield)
  monk.equippedShield = true;
  assert.equal(getCalculatedAC(monk), 15); // 10 + 3 + 2 (shield)
});

test('AC Engine: Racial Natural Armors', () => {
  // 1. Tortle (Тортл): Flat 17 base (ignores DEX, cannot use armor, allows shield)
  const tortle = createDefaultCharacter();
  tortle.race = 'Тортл';
  tortle.abilityScores['ЛОВ'] = 8; // -1 DEX, should NOT reduce Tortle AC

  assert.equal(getCalculatedAC(tortle), 17);
  tortle.equippedShield = true;
  assert.equal(getCalculatedAC(tortle), 19); // 17 + 2

  // 2. Thri-kreen (Трикрин): 13 + DEX (allows shield)
  const thrikreen = createDefaultCharacter();
  thrikreen.race = 'Трикрин';
  thrikreen.abilityScores['ЛОВ'] = 16; // +3
  assert.equal(getCalculatedAC(thrikreen), 16); // 13 + 3
  thrikreen.equippedShield = true;
  assert.equal(getCalculatedAC(thrikreen), 18);

  // 3. Lizardfolk (Людоящер): 13 + DEX (allows shield)
  const lizard = createDefaultCharacter();
  lizard.race = 'Людоящер';
  lizard.abilityScores['ЛОВ'] = 14; // +2
  assert.equal(getCalculatedAC(lizard), 15); // 13 + 2
  lizard.equippedShield = true;
  assert.equal(getCalculatedAC(lizard), 17);

  // 4. Loxodon (Локсодон): 12 + CON (ignores DEX, allows shield)
  const loxodon = createDefaultCharacter();
  loxodon.race = 'Локсодон';
  loxodon.abilityScores['ЛОВ'] = 8; // -1
  loxodon.abilityScores['ТЕЛ'] = 16; // +3
  assert.equal(getCalculatedAC(loxodon), 15); // 12 + 3 (ignores DEX)
  loxodon.equippedShield = true;
  assert.equal(getCalculatedAC(loxodon), 17);

  // 5. Autognome (Автогном): 13 + DEX (allows shield)
  const autognome = createDefaultCharacter();
  autognome.race = 'Автогном';
  autognome.abilityScores['ЛОВ'] = 16; // +3
  assert.equal(getCalculatedAC(autognome), 16); // 13 + 3
});

test('AC Engine: Draconic Sorcerer & Mage Armor', () => {
  const sorcerer = createDefaultCharacter();
  sorcerer.className = 'Чародей';
  sorcerer.subclass = 'Драконья кровь';
  sorcerer.abilityScores['ЛОВ'] = 16; // +3
  assert.equal(getCalculatedAC(sorcerer), 16); // 13 + 3

  // Any character selecting Mage Armor as equippedArmor mode: 'unarmored:mage_armor'
  const wizard = createDefaultCharacter();
  wizard.className = 'Волшебник';
  wizard.abilityScores['ЛОВ'] = 14; // +2
  wizard.equippedArmor = 'unarmored:mage_armor';
  assert.equal(getCalculatedAC(wizard), 15); // 13 + 2
});

test('AC Engine: Passive Stackable Modifiers (Warforged & Defense Fighting Style)', () => {
  // Warforged gets +1 AC always
  const warforged = createDefaultCharacter();
  warforged.race = 'Кованый';
  warforged.abilityScores['ЛОВ'] = 14; // +2
  // Unarmored: 10 + 2 + 1 (Warforged) = 13
  assert.equal(getCalculatedAC(warforged), 13);

  // In Leather Armor (11 + 2 + 1) = 14
  warforged.equippedArmor = 'Кожаный доспех';
  assert.equal(getCalculatedAC(warforged), 14);

  // With Shield (14 + 2) = 16
  warforged.equippedShield = true;
  assert.equal(getCalculatedAC(warforged), 16);

  // Fighting Style: Defense gives +1 ONLY when wearing armor
  warforged.traitsList = [{ id: '1', name: 'Боевой стиль: Оборона', source: 'Воин', summary: '+1 КД при ношении доспеха' }];
  assert.equal(getCalculatedAC(warforged), 17); // 11 + 2 + 1(warforged) + 2(shield) + 1(defense)

  // When armor is removed, Defense bonus is NOT applied, but Warforged bonus remains
  warforged.equippedArmor = '';
  assert.equal(getCalculatedAC(warforged), 15); // 10 + 2 + 1(warforged) + 2(shield)
});

test('AC Engine: getAvailableArmorModes returns relevant options for character', () => {
  const char = createDefaultCharacter();
  char.className = 'Варвар';
  char.race = 'Тортл';
  char.abilityScores['ЛОВ'] = 14; // +2
  char.abilityScores['ТЕЛ'] = 16; // +3

  const modes = getAvailableArmorModes(char);
  const modeKeys = modes.map(m => m.key);

  // Should include Tortle natural armor and Barbarian unarmored defense
  assert.ok(modeKeys.includes('unarmored:tortle'), 'Should include Tortle option');
  assert.ok(modeKeys.includes('unarmored:barbarian'), 'Should include Barbarian option');
  assert.ok(modeKeys.includes('unarmored:mage_armor'), 'Should include Mage Armor option');
  assert.ok(modeKeys.includes('unarmored:standard'), 'Should include standard unarmored');

  // Check calculated values in options
  const barbOption = modes.find(m => m.key === 'unarmored:barbarian');
  assert.equal(barbOption?.ac, 15); // 10 + 2 + 3

  const tortleOption = modes.find(m => m.key === 'unarmored:tortle');
  assert.equal(tortleOption?.ac, 17); // flat 17
});
