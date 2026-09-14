import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter } from '../src/lib/dnd-types.js';
import {
  EQUIPMENT_SLOTS,
  type EquipmentSlotId,
  type EquippedItem,
  equipItem,
  unequipItem,
  isOffHandBlocked,
  getOffHandBlockedReason,
  calculateEquipmentBonuses,
} from '../src/lib/equipment-types.js';

test('Equipment Engine: Defines all 13 standard equipment slots', () => {
  assert.equal(EQUIPMENT_SLOTS.length, 13);
  const slotIds = EQUIPMENT_SLOTS.map(s => s.id);
  assert.deepEqual(slotIds, [
    'head',
    'neck',
    'armor',
    'mainHand',
    'offHand',
    'belt',
    'ring1',
    'cloak',
    'quiver',
    'gloves',
    'ring2',
    'pouch',
    'boots',
  ].filter(s => s !== undefined));
});

test('Equipment Engine: Equips item into slot and calculates AC/speed bonuses', () => {
  let char = createDefaultCharacter();

  const cloak: EquippedItem = {
    id: 'cloak-1',
    name: 'Плащ защиты',
    slot: 'cloak',
    bonusAC: 1,
    description: '+1 к КД и спасброскам',
  };

  const ring: EquippedItem = {
    id: 'ring-1',
    name: 'Кольцо защиты',
    slot: 'ring1',
    bonusAC: 1,
  };

  const boots: EquippedItem = {
    id: 'boots-1',
    name: 'Сапоги скороходов',
    slot: 'boots',
    bonusSpeed: 10,
  };

  char = equipItem(char, 'cloak', cloak);
  char = equipItem(char, 'ring1', ring);
  char = equipItem(char, 'boots', boots);

  assert.equal(char.equippedSlots?.cloak?.name, 'Плащ защиты');
  assert.equal(char.equippedSlots?.ring1?.name, 'Кольцо защиты');
  assert.equal(char.equippedSlots?.boots?.name, 'Сапоги скороходов');

  const bonuses = calculateEquipmentBonuses(char);
  assert.equal(bonuses.acBonus, 2); // 1 from cloak + 1 from ring
  assert.equal(bonuses.speedBonus, 10); // 10 from boots
});

test('Equipment Engine: Two-handed weapon in Main Hand locks Off-Hand slot', () => {
  let char = createDefaultCharacter();

  // 1. Equip shield in Off-Hand
  const shield: EquippedItem = {
    id: 'shield-1',
    name: 'Щит',
    slot: 'offHand',
    isShield: true,
    bonusAC: 2,
  };
  char = equipItem(char, 'offHand', shield);
  assert.equal(char.equippedSlots?.offHand?.name, 'Щит');
  assert.equal(char.equippedShield, true);
  assert.equal(isOffHandBlocked(char), false);

  // 2. Equip Two-Handed Greatsword in Main Hand
  const greatsword: EquippedItem = {
    id: 'weapon-2h',
    name: 'Двуручный меч',
    slot: 'mainHand',
    twoHanded: true,
    description: '2d6 рубящий, двуручное, тяжёлое',
  };
  char = equipItem(char, 'mainHand', greatsword);

  // Greatsword should be equipped in main hand
  assert.equal(char.equippedSlots?.mainHand?.name, 'Двуручный меч');

  // Off-hand should be automatically unequipped/cleared because two-handed takes both hands!
  assert.equal(isOffHandBlocked(char), true);
  assert.equal(getOffHandBlockedReason(char), 'Занято двуручным хватом');
  assert.equal(char.equippedSlots?.offHand, undefined);
  assert.equal(char.equippedShield, false);

  // 3. Unequip greatsword restores Off-Hand availability
  char = unequipItem(char, 'mainHand');
  assert.equal(isOffHandBlocked(char), false);
});

test('Equipment Engine: Equipping in Off-Hand while Two-Handed weapon is in Main Hand automatically switches to 1H', () => {
  let char = createDefaultCharacter();

  const greatsword: EquippedItem = {
    id: 'weapon-2h',
    name: 'Двуручный меч',
    slot: 'mainHand',
    twoHanded: true,
  };
  char = equipItem(char, 'mainHand', greatsword);
  assert.equal(isOffHandBlocked(char), true);

  // Equip shield into off-hand: should unequip conflicting 2H weapon from mainHand
  const shield: EquippedItem = {
    id: 'shield-1',
    name: 'Щит',
    slot: 'offHand',
    isShield: true,
  };
  char = equipItem(char, 'offHand', shield);

  assert.equal(char.equippedSlots?.offHand?.name, 'Щит');
  assert.equal(char.equippedShield, true);
  // Main hand was 2H, so it must be unequipped to allow shield
  assert.equal(char.equippedSlots?.mainHand, undefined);
  assert.equal(isOffHandBlocked(char), false);
});

test('Equipment Engine: Equipping armor synchronizes equippedArmor in character', () => {
  let char = createDefaultCharacter();

  const armor: EquippedItem = {
    id: 'armor-1',
    name: 'Кольчуга',
    slot: 'armor',
    bonusAC: 16,
  };
  char = equipItem(char, 'armor', armor);

  assert.equal(char.equippedSlots?.armor?.name, 'Кольчуга');
  assert.equal(char.equippedArmor, 'Кольчуга');

  char = unequipItem(char, 'armor');
  assert.equal(char.equippedSlots?.armor, undefined);
  assert.equal(char.equippedArmor, '');
});

test('Equipment Engine: Live AC and Speed integration with getCalculatedAC, getAC and getEffectiveSpeed', () => {
  let char = createDefaultCharacter();
  char.abilityScores['ЛОВ'] = 14; // +2 DEX
  // Base unarmored AC: 10 + 2 = 12
  const { getCalculatedAC, getAC, getEffectiveSpeed } = require('../src/lib/dnd-types.js');
  assert.equal(getCalculatedAC(char), 12);
  assert.equal(getEffectiveSpeed(char), 30);

  // Equip Ring of Protection (+1 AC)
  const ring: EquippedItem = {
    id: 'ring-prot',
    name: 'Кольцо защиты',
    slot: 'ring1',
    bonusAC: 1,
  };
  char = equipItem(char, 'ring1', ring);
  assert.equal(getCalculatedAC(char), 13);
  assert.equal(getAC(char), 13);

  // Equip Cloak of Protection (+1 AC)
  const cloak: EquippedItem = {
    id: 'cloak-prot',
    name: 'Плащ защиты',
    slot: 'cloak',
    bonusAC: 1,
  };
  char = equipItem(char, 'cloak', cloak);
  assert.equal(getCalculatedAC(char), 14);
  assert.equal(getAC(char), 14);

  // Equip Boots of Speed (+10 Speed)
  const boots: EquippedItem = {
    id: 'boots-speed',
    name: 'Сапоги скороходов',
    slot: 'boots',
    bonusSpeed: 10,
  };
  char = equipItem(char, 'boots', boots);
  assert.equal(getEffectiveSpeed(char), 40);

  // Equip Chain Shirt (Кольчужная рубаха: base 13 + max 2 DEX = 15)
  const armor: EquippedItem = {
    id: 'chain-shirt',
    name: 'Кольчужная рубаха',
    slot: 'armor',
  };
  char = equipItem(char, 'armor', armor);
  // Total AC: 15 (armor) + 1 (ring) + 1 (cloak) = 17
  assert.equal(getCalculatedAC(char), 17);
  assert.equal(getAC(char), 17);

  // Equip Shield in Off-Hand (+2 AC)
  const shield: EquippedItem = {
    id: 'shield',
    name: 'Щит',
    slot: 'offHand',
    isShield: true,
  };
  char = equipItem(char, 'offHand', shield);
  // Total AC: 15 + 2 (shield) + 1 (ring) + 1 (cloak) = 19
  assert.equal(getCalculatedAC(char), 19);
  assert.equal(getAC(char), 19);
});

test('Equipment Engine: Full 13-slot loadout and unequip lifecycle', () => {
  let char = createDefaultCharacter();

  const fullLoadout: Record<EquipmentSlotId, EquippedItem> = {
    head: { id: 'h1', name: 'Латный шлем', slot: 'head' },
    neck: { id: 'n1', name: 'Амулет здоровья', slot: 'neck' },
    armor: { id: 'a1', name: 'Латы', slot: 'armor' },
    mainHand: { id: 'm1', name: 'Длинный меч', slot: 'mainHand' },
    offHand: { id: 'o1', name: 'Щит', slot: 'offHand', isShield: true },
    belt: { id: 'be1', name: 'Пояс силы великана', slot: 'belt' },
    ring1: { id: 'r1', name: 'Кольцо защиты', slot: 'ring1', bonusAC: 1 },
    cloak: { id: 'c1', name: 'Плащ защиты', slot: 'cloak', bonusAC: 1 },
    quiver: { id: 'q1', name: 'Колчан (20 стрел)', slot: 'quiver' },
    gloves: { id: 'g1', name: 'Рукавицы силы огра', slot: 'gloves' },
    ring2: { id: 'r2', name: 'Кольцо регенерации', slot: 'ring2' },
    pouch: { id: 'p1', name: 'Зелье великого лечения', slot: 'pouch' },
    boots: { id: 'b1', name: 'Сапоги скороходов', slot: 'boots', bonusSpeed: 10 },
  };

  for (const [slotId, item] of Object.entries(fullLoadout) as [EquipmentSlotId, EquippedItem][]) {
    char = equipItem(char, slotId, item);
  }

  // All 13 slots must be populated
  for (const slotId of Object.keys(fullLoadout) as EquipmentSlotId[]) {
    assert.equal(char.equippedSlots?.[slotId]?.name, fullLoadout[slotId].name);
  }

  // Латы (18) + Щит (2) + Кольцо защиты (1) + Плащ защиты (1) = 22 AC
  const { getCalculatedAC, getEffectiveSpeed } = require('../src/lib/dnd-types.js');
  assert.equal(getCalculatedAC(char), 22);
  assert.equal(getEffectiveSpeed(char), 40);

  // Unequip all slots
  for (const slotId of Object.keys(fullLoadout) as EquipmentSlotId[]) {
    char = unequipItem(char, slotId);
  }

  assert.equal(Object.keys(char.equippedSlots || {}).length, 0);
  assert.equal(getEffectiveSpeed(char), 30);
});

test('EquipmentSlotModal Contract: Does not contain raw inventory parsing or "Из инвентаря персонажа"', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const modalPath = path.resolve('src/components/equipment/EquipmentSlotModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');

  assert.ok(
    !content.includes('backpackItems'),
    'EquipmentSlotModal must not parse or retain backpackItems'
  );
  assert.ok(
    !content.includes('Из инвентаря персонажа'),
    'EquipmentSlotModal must not render "Из инвентаря персонажа" suggestions'
  );
});

test('Equipment Paper Doll Layout: Defines 6 left, 6 right and 1 center-bottom slots with accurate anatomy', async () => {
  const {
    LEFT_EQUIPMENT_SLOTS,
    RIGHT_EQUIPMENT_SLOTS,
    CENTER_EQUIPMENT_SLOTS,
    MANNEQUIN_ANCHORS,
    EQUIPMENT_SLOTS,
  } = await import('../src/lib/equipment-types.js');

  // Must total all 13 standard slots without omission or duplicates
  assert.equal(LEFT_EQUIPMENT_SLOTS.length, 6);
  assert.equal(RIGHT_EQUIPMENT_SLOTS.length, 6);
  assert.equal(CENTER_EQUIPMENT_SLOTS.length, 1);
  const combined = [...LEFT_EQUIPMENT_SLOTS, ...RIGHT_EQUIPMENT_SLOTS, ...CENTER_EQUIPMENT_SLOTS];
  assert.equal(combined.length, 13);
  assert.equal(new Set(combined).size, 13);

  // All 13 slots must exist in EQUIPMENT_SLOTS
  for (const s of combined) {
    assert.ok(EQUIPMENT_SLOTS.some(slot => slot.id === s), `Slot ${s} must exist in EQUIPMENT_SLOTS`);
  }

  // Anatomical correctness:
  // 1. Head and Neck must be at top (y < 0.15)
  assert.ok(MANNEQUIN_ANCHORS.head.y < 0.15, 'Head must be at top');
  assert.ok(MANNEQUIN_ANCHORS.neck.y < 0.18, 'Neck must be near top');

  // 2. Gloves (forearm) must be above the hand (offHand)
  assert.ok(
    MANNEQUIN_ANCHORS.gloves.y < MANNEQUIN_ANCHORS.offHand.y,
    'Gloves (forearm) anchor must be higher than offHand (hand) anchor'
  );

  // 3. Rings must be on the fingers (outermost x, y around hand level)
  assert.ok(MANNEQUIN_ANCHORS.ring1.x < MANNEQUIN_ANCHORS.mainHand.x, 'Ring 1 must be at the left fingertips');
  assert.ok(MANNEQUIN_ANCHORS.ring2.x > MANNEQUIN_ANCHORS.offHand.x, 'Ring 2 must be at the right fingertips');

  // 4. Belt and Pouch must be at waist level (y ~ 0.40 - 0.46)
  assert.ok(MANNEQUIN_ANCHORS.belt.y >= 0.40 && MANNEQUIN_ANCHORS.belt.y <= 0.46, 'Belt must be at waist level');
  assert.ok(MANNEQUIN_ANCHORS.pouch.y >= 0.40 && MANNEQUIN_ANCHORS.pouch.y <= 0.46, 'Pouch must be at waist level');

  // 5. Boots must be at the feet (y > 0.90) and centered (x ~ 0.50)
  assert.ok(MANNEQUIN_ANCHORS.boots.y > 0.90, 'Boots must be at the feet (bottom of mannequin)');
  assert.ok(Math.abs(MANNEQUIN_ANCHORS.boots.x - 0.50) < 0.05, 'Boots must be centered between the feet');

  // 6. Main Hand (left side of viewer) and Off Hand (right side of viewer)
  assert.ok(MANNEQUIN_ANCHORS.mainHand.x < 0.35, 'Main Hand anchor must be on viewer left arm');
  assert.ok(MANNEQUIN_ANCHORS.offHand.x > 0.65, 'Off Hand anchor must be on viewer right arm');
});


