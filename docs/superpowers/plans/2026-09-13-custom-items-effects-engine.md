# Custom Items and Dynamic Effects Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an extensible custom magic item builder with dynamic positive/negative effects, DM custom traits, persistent character item storage (`customItems`), and real-time character sheet modifier calculation.

**Architecture:** A pure reactive calculation engine (`calculateEquipmentBonuses`) aggregates all equipped item effects (AC, Speed, HP, Ability Scores, Attack/Damage, Spell DC, Saving Throws, and Item Traits). The Equipment Slot Modal is updated to replace static numeric fields with a dynamic effects row builder (`+ Добавить эффект`) and display saved custom items for that slot with 1-click equip and permanent delete actions.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, node:test & node:assert/strict.

**Spec:** [docs/superpowers/specs/2026-09-13-custom-items-effects-engine-design.md](file:///c:/antig/dnd5e-character-sheet/docs/superpowers/specs/2026-09-13-custom-items-effects-engine-design.md)

## Global Constraints
- Strictly maintain Parchment Medieval Theme (`.parchment-card`, `#F5E6C8`, `#C9A84C`, `#3D2012`). No raw white backgrounds or default blue focus rings.
- Reactivity: Derived calculations must not cause stale or ghost traits in persistent state upon unequip.
- Full backwards compatibility with existing compendium items and legacy character saves.
- Zero TypeScript (`npx tsc --noEmit`) and zero ESLint (`npx eslint .`) errors.
- 100% green adversarial tests (`npm run test:adversarial`).
- Update knowledge graph (`graphify update .`) and push to GitHub `origin main`.

---

### Task 1: Model, Data Types & Equipment Modifier Calculation Engine

**Files:**
- Modify: `src/lib/equipment-types.ts`
- Modify: `src/lib/dnd-types.ts`
- Create: `test/custom-items-effects.test.ts`

**Interfaces:**
- Consumes: `CharacterData`, `AbilityName`, `EquipmentSlotId` from `src/lib/dnd-types.ts`
- Produces:
  - `type ItemEffectType`
  - `interface ItemEffect`
  - `interface EquipmentBonusesSummary`
  - `calculateEquipmentBonuses(char: CharacterData): EquipmentBonusesSummary`
  - `deleteCustomItem(char: CharacterData, itemId: string): CharacterData`
  - Updated `equipItem` (saves to `customItems`) and `unequipItem`

- [ ] **Step 1: Write failing unit test suite for item effects & storage**

Create `test/custom-items-effects.test.ts`:
```typescript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter } from '../src/lib/dnd-types.js';
import {
  EquippedItem,
  calculateEquipmentBonuses,
  equipItem,
  unequipItem,
  deleteCustomItem,
} from '../src/lib/equipment-types.js';

describe('Custom Items and Dynamic Effects Engine', () => {
  test('calculates multiple positive and negative effects on equipped items', () => {
    const char = createDefaultCharacter();
    const cursedHelm: EquippedItem = {
      id: 'helm-1',
      name: 'Проклятый шлем мудрости',
      slot: 'head',
      effects: [
        { id: 'e-1', type: 'ac', value: 1, description: '+1 к КД' },
        { id: 'e-2', type: 'speed', value: -5, description: '-5 фт. к скорости' },
        { id: 'e-3', type: 'hpMax', value: 10, description: '+10 макс. ХП' },
        { id: 'e-4', type: 'ability', targetAbility: 'wis', value: 2, description: '+2 к Мудрости' },
        { id: 'e-5', type: 'customTrait', value: 'Шёпот духов', description: 'Слышит мысли нежити' },
      ],
    };

    const equippedChar = equipItem(char, 'head', cursedHelm);
    const bonuses = calculateEquipmentBonuses(equippedChar);

    assert.equal(bonuses.acBonus, 1);
    assert.equal(bonuses.speedBonus, -5);
    assert.equal(bonuses.hpMaxBonus, 10);
    assert.equal(bonuses.abilityBonuses.wis, 2);
    assert.equal(bonuses.abilityBonuses.str, 0);
    assert.equal(bonuses.itemTraits.length, 1);
    assert.equal(bonuses.itemTraits[0].name, 'Шёпот духов');
    assert.match(bonuses.itemTraits[0].source || '', /Проклятый шлем мудрости/);
  });

  test('preserves custom item in char.customItems when unequipped', () => {
    const char = createDefaultCharacter();
    const ring: EquippedItem = {
      id: 'ring-shield-1',
      name: 'Кольцо защиты',
      slot: 'ring1',
      effects: [{ id: 'e-ring-1', type: 'ac', value: 1 }],
    };

    const equippedChar = equipItem(char, 'ring1', ring);
    assert.ok(equippedChar.equippedSlots?.ring1);
    assert.ok(equippedChar.customItems?.some(i => i.id === 'ring-shield-1'));

    const unequippedChar = unequipItem(equippedChar, 'ring1');
    assert.equal(unequippedChar.equippedSlots?.ring1, undefined);
    assert.ok(unequippedChar.customItems?.some(i => i.id === 'ring-shield-1'), 'item must stay in customItems');

    const bonuses = calculateEquipmentBonuses(unequippedChar);
    assert.equal(bonuses.acBonus, 0);
  });

  test('deleting a custom item removes it from customItems and equippedSlots if worn', () => {
    const char = createDefaultCharacter();
    const boots: EquippedItem = {
      id: 'boots-speed-1',
      name: 'Сапоги скороходы',
      slot: 'boots',
      effects: [{ id: 'e-boots-1', type: 'speed', value: 10 }],
    };

    const equippedChar = equipItem(char, 'boots', boots);
    const cleanedChar = deleteCustomItem(equippedChar, 'boots-speed-1');

    assert.equal(cleanedChar.customItems?.some(i => i.id === 'boots-speed-1'), false);
    assert.equal(cleanedChar.equippedSlots?.boots, undefined);
    const bonuses = calculateEquipmentBonuses(cleanedChar);
    assert.equal(bonuses.speedBonus, 0);
  });

  test('backward compatibility with legacy bonusAC and bonusSpeed on compendium items', () => {
    const char = createDefaultCharacter();
    const cloak: EquippedItem = {
      id: 'cloak-elven',
      name: 'Плащ защиты',
      slot: 'cloak',
      bonusAC: 1,
      bonusSpeed: 5,
    };
    const equippedChar = equipItem(char, 'cloak', cloak);
    const bonuses = calculateEquipmentBonuses(equippedChar);
    assert.equal(bonuses.acBonus, 1);
    assert.equal(bonuses.speedBonus, 5);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test test/custom-items-effects.test.ts`
Expected: FAIL (missing types or properties)

- [ ] **Step 3: Implement data structures and modifier calculator in `equipment-types.ts` & `dnd-types.ts`**

In `src/lib/dnd-types.ts`:
Add `customItems?: EquippedItem[];` to `CharacterData`.

In `src/lib/equipment-types.ts`:
1. Define `ItemEffectType`, `ItemEffect`, `EquipmentBonusesSummary`.
2. Add `effects?: ItemEffect[]` to `EquippedItem`.
3. Implement `calculateEquipmentBonuses(char: CharacterData): EquipmentBonusesSummary`.
4. Update `equipItem`:
   - If item is a custom item, add/update in `char.customItems`.
   - Update `equippedSlots`.
5. Implement `deleteCustomItem(char: CharacterData, itemId: string): CharacterData`.

- [ ] **Step 4: Run test to verify pass**

Run: `npx tsx --test test/custom-items-effects.test.ts`
Expected: PASS (all 4 tests pass)

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/equipment-types.ts src/lib/dnd-types.ts test/custom-items-effects.test.ts
git commit -m "feat: add custom item effects model and reactive bonuses calculation engine"
```

---

### Task 2: Character Sheet Real-Time Metric Integration (AC, Speed, Stats, HP, Attacks, Traits)

**Files:**
- Modify: `src/lib/dnd-types.ts` (`getAC`, `getEffectiveSpeed`, `getTotalScore`)
- Modify: `src/lib/equipment-types.ts` (`getActiveCharacterAttacks`)
- Modify: `src/app/page.tsx` (`effectiveTraitsList`, `hpMax`)
- Create: `test/custom-items-integration.test.ts`

**Interfaces:**
- Consumes: `calculateEquipmentBonuses(char)` from `src/lib/equipment-types.ts`
- Produces: Live updated AC, Speed, Stats, Attacks, and Traits list reflecting equipped items

- [ ] **Step 1: Write integration unit tests**

Create `test/custom-items-integration.test.ts`:
```typescript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter, getAC, getEffectiveSpeed, getTotalScore } from '../src/lib/dnd-types.js';
import { equipItem, unequipItem, EquippedItem, getActiveCharacterAttacks } from '../src/lib/equipment-types.js';

describe('Real-Time Equipment Effects Integration', () => {
  test('getAC incorporates equipment item ac effects', () => {
    const char = createDefaultCharacter();
    const baseAC = getAC(char);

    const ring: EquippedItem = {
      id: 'ring-1',
      name: 'Кольцо защиты +1',
      slot: 'ring1',
      effects: [{ id: 'e-1', type: 'ac', value: 1 }],
    };
    const equipped = equipItem(char, 'ring1', ring);
    assert.equal(getAC(equipped), baseAC + 1);

    const unequipped = unequipItem(equipped, 'ring1');
    assert.equal(getAC(unequipped), baseAC);
  });

  test('getEffectiveSpeed incorporates equipment speed effects', () => {
    const char = createDefaultCharacter();
    char.speed = 30;

    const boots: EquippedItem = {
      id: 'boots-1',
      name: 'Сапоги скорости',
      slot: 'boots',
      effects: [{ id: 'e-spd', type: 'speed', value: 10 }],
    };
    const equipped = equipItem(char, 'boots', boots);
    assert.equal(getEffectiveSpeed(equipped), 40);
  });

  test('getTotalScore incorporates equipment ability effects', () => {
    const char = createDefaultCharacter();
    char.abilityScores.str = 14;

    const gauntlets: EquippedItem = {
      id: 'g-1',
      name: 'Рукавицы силы',
      slot: 'gloves',
      effects: [{ id: 'e-str', type: 'ability', targetAbility: 'str', value: 2 }],
    };
    const equipped = equipItem(char, 'gloves', gauntlets);
    assert.equal(getTotalScore(equipped, 'str'), 16);
  });

  test('getActiveCharacterAttacks incorporates weapon attackDamage effects', () => {
    const char = createDefaultCharacter();
    char.abilityScores.str = 10; // mod 0, prof +2 -> +2 base
    const magicSword: EquippedItem = {
      id: 'sword-1',
      name: 'Длинный меч +1',
      slot: 'mainHand',
      effects: [{ id: 'e-atk', type: 'attackDamage', value: 1 }],
    };
    const equipped = equipItem(char, 'mainHand', magicSword);
    const attacks = getActiveCharacterAttacks(equipped);
    const swordAtk = attacks.find(a => a.weaponName === 'Длинный меч +1');
    assert.ok(swordAtk);
    assert.equal(swordAtk.attackBonus, '+3'); // 0 (str) + 2 (prof) + 1 (effect)
    assert.match(swordAtk.damageAndType, /\+ 1/);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx tsx --test test/custom-items-integration.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `getAC`, `getEffectiveSpeed`, `getTotalScore`, `getActiveCharacterAttacks`, and `effectiveTraitsList`**

1. In `src/lib/dnd-types.ts`:
   - In `getAC(char)`: incorporate `calculateEquipmentBonuses(char).acBonus`.
   - In `getEffectiveSpeed(char)`: incorporate `calculateEquipmentBonuses(char).speedBonus`.
   - In `getTotalScore(char, ability)`: incorporate `calculateEquipmentBonuses(char).abilityBonuses[ability]`.
2. In `src/lib/equipment-types.ts`:
   - In `getActiveCharacterAttacks(char)`: extract `attackDamage` effects from `equippedSlots.mainHand` / `equippedSlots.offHand` and pass as `itemBonusAtk` / `itemBonusDmg` to `getWeaponStats`.
3. In `src/app/page.tsx`:
   - Update `effectiveTraitsList`: merge `calculateEquipmentBonuses(char).itemTraits` with `char.traitsList` so item traits appear dynamically.
   - Update `liveHpMax` calculation if item provides `hpMaxBonus`.

- [ ] **Step 4: Run test to verify pass**

Run: `npx tsx --test test/custom-items-integration.test.ts`
Expected: PASS (all 4 tests pass)

- [ ] **Step 5: Run full test suite to check regressions**

Run: `npx tsx --test test/*.test.ts`
Expected: PASS (all tests pass)

- [ ] **Step 6: Commit changes**

```bash
git add src/lib/dnd-types.ts src/lib/equipment-types.ts src/app/page.tsx test/custom-items-integration.test.ts
git commit -m "feat: integrate equipment effects into AC, speed, stats, attacks, and traits"
```

---

### Task 3: Equipment Slot Modal Custom Item Builder UI & Saved Custom Items List

**Files:**
- Modify: `src/components/equipment/EquipmentSlotModal.tsx`
- Create: `test/equipment-slot-modal-effects.test.ts`

**Interfaces:**
- Consumes: `EquipmentSlotModalProps`, `char.customItems`, `ItemEffect`, `ItemEffectType`
- Produces: Dynamic interactive form with `+ Добавить эффект`, typed effect row controls, and saved items section with 1-click equip and delete

- [ ] **Step 1: Write UI component tests or contract tests**

Create `test/equipment-slot-modal-effects.test.ts`:
Verify that custom items created with multiple effects conform to `EquippedItem` shape, and that `EquipmentSlotModal` source code includes effect selection options and saved custom items section.

- [ ] **Step 2: Update `EquipmentSlotModal.tsx`**

1. Remove static inputs: `customBonusAC`, `customBonusSpeed`.
2. Introduce dynamic `effects: ItemEffect[]` state:
   - `handleAddEffect`: adds a new row with default `{ id: Date.now().toString(), type: 'ac', value: 1 }`.
   - `handleUpdateEffect(index, field, val)`: updates type, value, description, targetAbility.
   - `handleRemoveEffect(index)`: removes row.
3. Render effect rows in Parchment style:
   - Type selector: КД, Скорость, ХП, Атака/урон, Сложность заклинаний, Спасброски, Характеристики (Сила/Ловкость/...), Свойство от Мастера.
   - Value input (number stepper for numeric, text for customTrait).
   - Description input (optional).
   - Remove button `✕`.
4. In Tab 1 (or at the top of items list):
   - Add section **«🎒 Мои созданные предметы»** showing items from `char.customItems` filtered by slot.
   - Display each item's name, rarity badge, effect badges.
   - Action buttons: `[Экипировать]` (or `Надето` badge) and `[🗑️]` to call `deleteCustomItem`.
5. On form submit (`handleCreateCustom`):
   - Build `EquippedItem` with `effects`.
   - Call `onEquip(slotId, newItem)`.
   - Reset form and close or switch tab.

- [ ] **Step 3: Run test suite**

Run: `npx tsx --test test/equipment-slot-modal-effects.test.ts`
Expected: PASS

- [ ] **Step 4: Commit changes**

```bash
git add src/components/equipment/EquipmentSlotModal.tsx test/equipment-slot-modal-effects.test.ts
git commit -m "feat: implement dynamic effects builder and saved custom items in EquipmentSlotModal"
```

---

### Task 4: Verification, Adversarial Testing, Graphify Update & GitHub Push

**Files:**
- Project-wide verification

- [ ] **Step 1: TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: ESLint check**

Run: `npx eslint .`
Expected: 0 errors

- [ ] **Step 3: Run all unit tests**

Run: `npx tsx --test test/*.test.ts`
Expected: All tests pass

- [ ] **Step 4: Run adversarial test suite**

Run: `npm run test:adversarial`
Expected: 100% pass

- [ ] **Step 5: Update Graphify knowledge graph**

Run: `graphify update .`

- [ ] **Step 6: Commit and Push to GitHub**

Run:
```powershell
$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "feat: complete custom magic items with dynamic effects and persistent storage"; git push origin main
```
