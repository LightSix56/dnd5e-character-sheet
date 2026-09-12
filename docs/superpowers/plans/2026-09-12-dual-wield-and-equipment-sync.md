# Two-Weapon Fighting, Attack Auto-Generation & Equipment Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate character attacks based on equipped weapons and thrown items (including full Two-Weapon Fighting with main hand, off-hand bonus action with/without fighting style modifier, and dual strike), remove manual armor/attack selectors from the combat block in favor of the Equipment Paper Doll, and auto-equip starting class equipment in templates and wizard.

**Architecture:** 
- Pure engine function `getActiveCharacterAttacks(char: CharacterData)` in `src/lib/equipment-types.ts` dynamically evaluates equipped weapons and inventory items.
- Dual-wielding triggers 3 distinct attack options: Main Hand attack, Off-Hand attack (checking for Fighting Style: Two-Weapon Fighting before adding ability modifier to damage), and Dual Strike (simultaneous d20 rolls for each hand with combined damage).
- Thrown weapons from backpack (`char.equipment`) or pouches are always available as ranged throw attacks.
- Class templates and character wizard initialize `char.equippedSlots` directly.
- The sheet UI in `src/app/page.tsx` removes the old armor dropdown and manual attack adder, rendering the synchronized attacks and directing users to the Equipment Paper Doll for changes.

**Tech Stack:** TypeScript, React 19, Next.js 15, Node.js Test Runner (`node:test`, `node:assert/strict`).

---

## Global Constraints
- Strictly medieval parchment theme (`#F5E6C8`, `#C9A84C`, `#3D2012`).
- Never allow manual armor overrides to conflict with live equipment calculation without clear reset.
- Two-Weapon Fighting rules must strictly adhere to D&D 5e PHB p. 195: off-hand damage excludes ability modifier unless character has the Two-Weapon Fighting style.
- Thrown weapons (Dagger, Handaxe, Dart, Spear, Light Hammer, Trident) must remain available to throw even when other weapons are equipped in hands.
- All unit tests must pass with 0 errors via `tsx --test`.

---

### Task 1: Dual-Wield Engine, Thrown Items & Attack Generator

**Files:**
- Create: `test/dual-wield-attacks.test.ts`
- Modify: `src/lib/equipment-types.ts`
- Modify: `src/lib/dnd-types.ts`

**Interfaces:**
- Produces: `getActiveCharacterAttacks(char: CharacterData): ActiveAttackOption[]`
```ts
export interface ActiveAttackOption {
  id: string;
  name: string;
  weaponName: string;
  source: 'mainHand' | 'offHand' | 'dual' | 'thrown' | 'unarmed';
  actionType: 'action' | 'bonus' | 'dualAction' | 'free';
  attackBonus: string;
  attackBonusNum: number;
  damageAndType: string;
  damageDice: string;
  damageBonusNum: number;
  damageType: string;
  ability: 'СИЛ' | 'ЛОВ';
  isProficient: boolean;
  properties: string[];
  dualDetails?: {
    mainName: string;
    mainAtkBonus: string;
    mainDmg: string;
    offName: string;
    offAtkBonus: string;
    offDmg: string;
  };
}
```

- [ ] **Step 1: Write failing test suite in `test/dual-wield-attacks.test.ts`**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter } from '../src/lib/dnd-types.js';
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
  assert.ok(mainAtk);
  assert.equal(mainAtk.attackBonus, '+5');
  assert.equal(mainAtk.damageAndType, '1d6+3 колющий');
  assert.equal(mainAtk.actionType, 'action');

  // 2. Off-Hand Attack without fighting style: +5 to hit, 1d6 piercing (NO ability modifier to damage!)
  const offAtk = attacks.find(a => a.source === 'offHand');
  assert.ok(offAtk);
  assert.equal(offAtk.attackBonus, '+5');
  assert.equal(offAtk.damageAndType, '1d6 колющий');
  assert.equal(offAtk.actionType, 'bonus');

  // 3. Dual Strike: combined action + bonus
  const dualAtk = attacks.find(a => a.source === 'dual');
  assert.ok(dualAtk);
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
  char.equipment = 'Кинжал (3 шт.), Метательное копьё (2 шт.), Рационы';

  const attacks = getActiveCharacterAttacks(char);

  // Greatsword attack is present
  const mainAtk = attacks.find(a => a.source === 'mainHand');
  assert.equal(mainAtk?.weaponName, 'Двуручный меч');

  // Thrown dagger and javelin are present
  const daggerThrown = attacks.find(a => a.source === 'thrown' && a.weaponName.toLowerCase().includes('кинжал'));
  assert.ok(daggerThrown, 'Dagger should be available as thrown weapon');
  assert.equal(daggerThrown.attackBonus, '+5'); // STR +3, Prof +2 (or DEX +2, picks higher)
  assert.ok(daggerThrown.damageAndType.includes('1d4'));

  const javelinThrown = attacks.find(a => a.source === 'thrown' && a.weaponName.toLowerCase().includes('метательное копьё'));
  assert.ok(javelinThrown, 'Javelin should be available as thrown weapon');
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
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx --test test/dual-wield-attacks.test.ts`
Expected: FAIL (`getActiveCharacterAttacks is not a function`).

- [ ] **Step 3: Implement `getActiveCharacterAttacks` in `src/lib/equipment-types.ts`**
Implement the detection logic, weapon lookup from `dnd-weapons.ts`, calculation of finesse/ranged/monk modifiers, Two-Weapon Fighting style detection, dual strike synthesis, thrown weapon parsing from `char.equipment` and `char.equippedSlots`, and unarmed strike fallback.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx --test test/dual-wield-attacks.test.ts`
Expected: PASS (4/4 tests pass).

---

### Task 2: Class Starting Equipment Auto-Equip

**Files:**
- Modify: `src/lib/dnd-types.ts` (`applyClassTemplate`)
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx` (`handleFinish`)
- Test: `test/dual-wield-attacks.test.ts`

**Interfaces:**
- Produces: `applyClassTemplate(templateId: string): CharacterData` with populated `equippedSlots`.

- [ ] **Step 1: Write failing test in `test/dual-wield-attacks.test.ts`**
Test that `applyClassTemplate('fighter')` populates `char.equippedSlots.armor` with Chain Mail, `mainHand` with Longsword, `offHand` with Shield, and sets `armorClass = null` so calculated AC is 18 (16 chain mail + 2 shield).
Test that `applyClassTemplate('rogue')` populates Leather Armor in `armor`, Rapier in `mainHand`, Dagger in `offHand`, and produces 3 dual attacks.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx --test test/dual-wield-attacks.test.ts`
Expected: FAIL (`char.equippedSlots.armor is undefined`).

- [ ] **Step 3: Implement class template auto-equip in `src/lib/dnd-types.ts` and Wizard**
Add slot mapping for each class in `CLASS_TEMPLATES` or dynamically in `applyClassTemplate`, setting `char.equippedSlots` and `char.armorClass = null`.
Update `CharacterCreationWizardModal.tsx` to populate `newChar.equippedSlots` with selected armor, shield, and weapons upon character completion.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx --test test/dual-wield-attacks.test.ts`
Expected: PASS.

---

### Task 3: Character Sheet UI Integration: Armor & Attacks Cleanup, Dual Roll Popup

**Files:**
- Modify: `src/app/page.tsx`

**Features:**
- Remove old Armor & Shield select dropdown and checkbox from Combat block (`Боевые параметры`).
- In Combat block, keep live calculated AC, initiative, speed, and buttons for `Экипировка` and `Отдых`. Add a subtle badge showing currently equipped armor/shield (`🛡️ Кольчуга | Щит` or `🛡️ Защита без доспехов`).
- In Attacks block (`Атаки и оружие`):
  - Replace manual attacks loop with `getActiveCharacterAttacks(char)`.
  - Display badges: `[Основное действие]`, `[Бонусное действие]`, `[Парная атака]`, `[Метательное]`.
  - Remove "+ Добавить атаку" button and manual inputs; add top-action button "⚔️ Настроить оружие в Экипировке".
  - For Dual Attack, implement simultaneous 2-dice roll in `handleRoll` or dual roll popup:
    Rolls d20 #1 for Main Hand, d20 #2 for Off-Hand, rolls respective damage, and displays both strikes with total damage.

- [ ] **Step 1: Implement Combat block cleanup in `src/app/page.tsx`**
Remove lines 3731-3805 (old select element) and replace with clean display.

- [ ] **Step 2: Integrate `getActiveCharacterAttacks` into Attacks card in `src/app/page.tsx`**
Replace manual attacks mapping with reactive `getActiveCharacterAttacks(char)`.

- [ ] **Step 3: Implement Dual Strike roller**
Add handling for `dualAction` rolls, rolling both d20s and damages.

---

### Task 4: Verification, Lint, Tests, Graphify & Git Push

- [ ] **Step 1: Run TypeScript compiler**
Run: `npx tsc --noEmit` (Must be 0 errors).

- [ ] **Step 2: Run ESLint**
Run: `npx eslint` on modified files (Must be 0 errors).

- [ ] **Step 3: Run all unit tests**
Run: `npx tsx --test test/dual-wield-attacks.test.ts test/equipment-slots.test.ts test/ac-calculations.test.ts`

- [ ] **Step 4: Update Knowledge Graph**
Run: `graphify update .`

- [ ] **Step 5: Git commit and push**
Run: `$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "feat: implement dual-wielding attacks, thrown weapons and equipment auto-sync"; git push origin main`
