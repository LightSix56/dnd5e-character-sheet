# Warlock (Колдун) 1–20 Level-Up & Subclasses Deepening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full, deep Level-Up and Character Creation mechanics for Warlock (Колдун) across all 20 levels and all 9 official subclasses according to `dnd.su`, including all 47+ Eldritch Invocations with prerequisite enforcement and swapping, 4 Pact Boons (Tome with 3 cross-class cantrips, Blade, Chain with 4 special forms, Talisman), Mystic Arcanum (6th–9th circle), and subclass-specific interactive choices (Genie kinds, Fiend resilience, Celestial bonus cantrips, etc.).

**Architecture:** 
- Modular data catalog `src/data/compendium/warlock-choices.ts` for invocations, pact boons, genie kinds, and mystic arcanum spells with availability validation.
- Subclass features expansion in `src/data/compendium/classes.ts` and `src/data/compendium/class-progression.ts` for all 9 subclasses at levels 1, 6, 10, and 14.
- State-machine and rule calculation expansion in `src/components/levelup/level-up-choices.ts` and `src/data/compendium/auto-spells-engine.ts`.
- Interactive UI components in `CharacterCreationWizardModal.tsx` and `LevelUpModal.tsx` following the Parchment Medieval Theme (`AGENTS.md`).

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Node native test runner (`node:test`, `node:assert/strict`), Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-09-10-warlock-level-up-deepening-design.md`

## Global Constraints
- Strictly follow rules and descriptions from `dnd.su`.
- Strict Parchment Medieval Theme (`AGENTS.md`): no pure white backgrounds (`#FFFFFF`), no browser blue outlines, vector icons from `@/components/dnd-icons`.
- Zero compilation errors (`npx tsc --noEmit`) and 100% green tests (`npm run test:adversarial`).
- 0 ESLint errors (`npx eslint .`).

---

### Task 1: Comprehensive Warlock Choices Database (`src/data/compendium/warlock-choices.ts`)

**Files:**
- Create: `src/data/compendium/warlock-choices.ts`
- Test: `test/warlock-choices.test.ts`

**Interfaces:**
- Produces:
  - `WARLOCK_INVOCATIONS: InvocationDefinition[]`
  - `WARLOCK_PACT_BOONS: Record<string, PactBoonDefinition>`
  - `GENIE_KINDS: Record<string, GenieKindDefinition>`
  - `WARLOCK_MYSTIC_ARCANUM_SPELLS: Record<number, string[]>`
  - `isInvocationAvailable(inv: InvocationDefinition, level: number, pactBoon?: string, knownCantrips?: string[]): boolean`

- [ ] **Step 1: Write failing test for warlock-choices database**

Create `test/warlock-choices.test.ts`:
```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WARLOCK_INVOCATIONS,
  WARLOCK_PACT_BOONS,
  GENIE_KINDS,
  WARLOCK_MYSTIC_ARCANUM_SPELLS,
  isInvocationAvailable,
} from '../src/data/compendium/warlock-choices.ts';

test('Warlock database contains 40+ official invocations from dnd.su', () => {
  assert.ok(WARLOCK_INVOCATIONS.length >= 40);
  const agonizing = WARLOCK_INVOCATIONS.find(i => i.id === 'agonizing-blast');
  assert.ok(agonizing);
  assert.strictEqual(agonizing?.cantripReq, 'Мистический заряд');
});

test('Invocations prerequisite checks work correctly', () => {
  const thirsting = WARLOCK_INVOCATIONS.find(i => i.id === 'thirsting-blade');
  assert.ok(thirsting);
  // Level 3 with Blade -> false (needs level 5)
  assert.strictEqual(isInvocationAvailable(thirsting!, 3, 'blade', ['Мистический заряд']), false);
  // Level 5 without Blade -> false
  assert.strictEqual(isInvocationAvailable(thirsting!, 5, 'tome', ['Мистический заряд']), false);
  // Level 5 with Blade -> true
  assert.strictEqual(isInvocationAvailable(thirsting!, 5, 'blade', ['Мистический заряд']), true);

  const agonizing = WARLOCK_INVOCATIONS.find(i => i.id === 'agonizing-blast');
  // Without Eldritch Blast -> false
  assert.strictEqual(isInvocationAvailable(agonizing!, 2, undefined, ['Престидижитация']), false);
  // With Eldritch Blast -> true
  assert.strictEqual(isInvocationAvailable(agonizing!, 2, undefined, ['Мистический заряд']), true);
});

test('Genie kinds contain all 4 elemental types', () => {
  assert.ok(GENIE_KINDS['dao']);
  assert.ok(GENIE_KINDS['djinni']);
  assert.ok(GENIE_KINDS['efreeti']);
  assert.ok(GENIE_KINDS['marid']);
  assert.strictEqual(GENIE_KINDS['dao'].damageType, 'дробящий');
  assert.strictEqual(GENIE_KINDS['efreeti'].damageType, 'огонь');
});

test('Pact boons contain 4 official boons', () => {
  assert.ok(WARLOCK_PACT_BOONS['tome']);
  assert.ok(WARLOCK_PACT_BOONS['blade']);
  assert.ok(WARLOCK_PACT_BOONS['chain']);
  assert.ok(WARLOCK_PACT_BOONS['talisman']);
});

test('Mystic Arcanum spell catalogs exist for circles 6, 7, 8, 9', () => {
  assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[6]?.length > 0);
  assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[7]?.length > 0);
  assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[8]?.length > 0);
  assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[9]?.length > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx/esm --test test/warlock-choices.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/data/compendium/warlock-choices.ts`**

Write all official invocations, pact boons, genie kinds, arcanums, and `isInvocationAvailable`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx/esm --test test/warlock-choices.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/compendium/warlock-choices.ts test/warlock-choices.test.ts
git commit -m "feat(warlock): add comprehensive warlock invocations, pact boons, and arcanum database"
```

---

### Task 2: Full 9 Subclasses Expansion in `classes.ts` & `class-progression.ts`

**Files:**
- Modify: `src/data/compendium/classes.ts`
- Modify: `src/data/compendium/class-progression.ts`
- Test: `test/warlock-subclasses.test.ts`

**Interfaces:**
- Produces:
  - Warlock subclasses in `classes.ts` with complete features for levels 1, 6, 10, 14.
  - Subclass `undying` (Бессмертный) added.
  - Progression pact slot counts in `class-progression.ts`: 1 (lvl 1), 2 (lvl 2–10), 3 (lvl 11–16), 4 (lvl 17–20).

- [ ] **Step 1: Write failing test for 9 subclasses features**

Create `test/warlock-subclasses.test.ts`:
```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes.ts';
import { CLASS_PROGRESSION_DATA } from '../src/data/compendium/class-progression.ts';

test('Warlock class has all 9 official subclasses with features at levels 1, 6, 10, 14', () => {
  const warlock = DND_COMPENDIUM_CLASSES.find(c => c.id === 'warlock');
  assert.ok(warlock);
  assert.strictEqual(warlock?.subclasses?.length, 9);

  const expectedIds = ['fiend', 'hexblade', 'archfey', 'great-old-one', 'celestial', 'fathomless', 'genie', 'undead', 'undying'];
  for (const id of expectedIds) {
    const sub = warlock?.subclasses?.find(s => s.id === id);
    assert.ok(sub, `Subclass ${id} should exist`);
    const levels = sub?.features.map(f => f.level) || [];
    assert.ok(levels.includes(1), `${id} must have level 1 feature`);
    assert.ok(levels.includes(6), `${id} must have level 6 feature`);
    assert.ok(levels.includes(10), `${id} must have level 10 feature`);
    assert.ok(levels.includes(14), `${id} must have level 14 feature`);
  }
});

test('Warlock progression has accurate pact slots progression', () => {
  const warlockProg = CLASS_PROGRESSION_DATA['Колдун'];
  assert.ok(warlockProg);
  assert.deepStrictEqual(warlockProg.subclassFeatureLevels, [1, 6, 10, 14]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx/esm --test test/warlock-subclasses.test.ts`
Expected: FAIL (missing features or undying subclass)

- [ ] **Step 3: Update `classes.ts` and `class-progression.ts`**

Add all 1, 6, 10, 14 features for all 9 subclasses using dnd.su descriptions, and ensure `undying` is added.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx/esm --test test/warlock-subclasses.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/compendium/classes.ts src/data/compendium/class-progression.ts test/warlock-subclasses.test.ts
git commit -m "feat(warlock): expand all 9 official subclasses with 1, 6, 10, 14 level features"
```

---

### Task 3: Interactive Choices Engine Expansion (`level-up-choices.ts` & `auto-spells-engine.ts`)

**Files:**
- Modify: `src/components/levelup/level-up-choices.ts`
- Modify: `src/data/compendium/auto-spells-engine.ts`
- Test: `test/level-up-warlock-choices.test.ts`

**Interfaces:**
- Consumes: `WARLOCK_INVOCATIONS`, `WARLOCK_PACT_BOONS`, `GENIE_KINDS`, `WARLOCK_MYSTIC_ARCANUM_SPELLS`
- Produces:
  - `getLevelUpChoicesConfig` returning Warlock interactive choices:
    - `needsWarlockPatron` on level 1 or if no subclass
    - `needsGenieKind` if Genie patron
    - `needsPactBoon` on level 3
    - `needsTomeCantrips` on level 3 if Tome chosen
    - `needsInvocations`, `invocationsCount`, `eligibleInvocations` on levels 2, 5, 7, 9, 12, 15, 18
    - `canSwapInvocation` on level >= 3
    - `needsMysticArcanum`, `arcanumCircle`, `arcanumOptions` on levels 11, 13, 15, 17
    - `needsFiendResilience` on level 10 for Fiend
  - `getAutoGrantedSpellsForLevel` auto-granting Celestial and Undying bonus cantrips and patron spells.

- [ ] **Step 1: Write failing test for level-up warlock choices engine**

Create `test/level-up-warlock-choices.test.ts`:
```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelUpChoicesConfig } from '../src/components/levelup/level-up-choices.ts';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine.ts';
import { CharacterData } from '../src/lib/dnd-types.ts';

const baseChar: CharacterData = {
  id: 'test-warlock',
  name: 'Колдун Тест',
  race: 'Человек',
  className: 'Колдун',
  level: 1,
  subclass: 'Исчадие',
  spellsByLevel: { 0: [{ name: 'Мистический заряд', prepared: true }], 1: [] },
  traitsList: [],
  spellSlots: { 1: { total: 1, current: 1 } },
  stats: { СИЛ: 10, ЛОВ: 14, ТЕЛ: 14, ИНТ: 10, МДР: 12, ХАР: 16 },
} as unknown as CharacterData;

test('Warlock level 2 grants 2 invocations with Eldritch Blast filtered', () => {
  const config = getLevelUpChoicesConfig(baseChar, 2);
  assert.strictEqual(config.needsInvocations, true);
  assert.strictEqual(config.invocationsCount, 2);
  assert.ok(config.eligibleInvocations?.some(i => i.id === 'agonizing-blast'));
});

test('Warlock level 3 grants Pact Boon choice', () => {
  const config = getLevelUpChoicesConfig(baseChar, 3);
  assert.strictEqual(config.needsPactBoon, true);
});

test('Warlock level 11 grants Mystic Arcanum 6th circle and 3 pact slots', () => {
  const config = getLevelUpChoicesConfig(baseChar, 11);
  assert.strictEqual(config.needsMysticArcanum, true);
  assert.strictEqual(config.arcanumCircle, 6);
  assert.ok(config.arcanumOptions && config.arcanumOptions.length > 0);
});

test('Celestial warlock gets bonus cantrips at level 1', () => {
  const char = { ...baseChar, subclass: 'Небожитель' };
  const auto = getAutoGrantedSpellsForLevel(char, 1, 'Небожитель');
  assert.ok(auto.some(s => s.name === 'Священное пламя'));
  assert.ok(auto.some(s => s.name === 'Свет'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx/esm --test test/level-up-warlock-choices.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement choices engine updates**

Update `level-up-choices.ts` and `auto-spells-engine.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx/esm --test test/level-up-warlock-choices.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/levelup/level-up-choices.ts src/data/compendium/auto-spells-engine.ts test/level-up-warlock-choices.test.ts
git commit -m "feat(warlock): add warlock interactive choices and auto-spells logic"
```

---

### Task 4: Character Creation Wizard Support (`CharacterCreationWizardModal.tsx`)

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`
- Modify: `src/components/wizard/wizard-helpers.ts`

**Interfaces:**
- Consumes: `GENIE_KINDS`, `DND_COMPENDIUM_CLASSES`
- Produces:
  - Interactive Patron selection in Step 2 for Warlock (all 9 subclasses).
  - Genie Kind selection if Genie patron is chosen.
  - Auto-granted bonus cantrips (Celestial -> Sacred Flame, Light; Undying -> Spare the Dying).
  - Step 2 validation preventing progression until patron (and genie kind) are chosen.

- [ ] **Step 1: Update `wizard-helpers.ts` with warlock creation helpers**

Add `needsWarlockPatron` and `needsGenieKind` to `getClassLevel1ChoicesConfig`.

- [ ] **Step 2: Add UI & validation in `CharacterCreationWizardModal.tsx`**

Render parchment cards for Patron and Genie Kind, add state, validation, and auto-add cantrips.

- [ ] **Step 3: Verify with TypeScript and adversarial tests**

Run: `npx tsc --noEmit && npm run test:adversarial`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/wizard/CharacterCreationWizardModal.tsx src/components/wizard/wizard-helpers.ts
git commit -m "feat(wizard): add full interactive warlock patron and genie kind selection at level 1"
```

---

### Task 5: Level-Up Modal Interactive UI & Serialization (`LevelUpModal.tsx`)

**Files:**
- Modify: `src/components/levelup/LevelUpModal.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getLevelUpChoicesConfig`, `WARLOCK_PACT_BOONS`, `WARLOCK_INVOCATIONS`, `GENIE_KINDS`, `WARLOCK_MYSTIC_ARCANUM_SPELLS`
- Produces:
  - Interactive UI blocks in LevelUpModal:
    - Patron selector (if not chosen)
    - Genie Kind selector (if Genie patron)
    - Pact Boon selector (Level 3) with 4 cards + Tome 3 cross-class cantrips selector
    - Eldritch Invocations selector with requirement filtering and selection counter
    - Optional Invocation Swapping selector
    - Mystic Arcanum selector (Levels 11, 13, 15, 17)
    - Fiendish Resilience resistance selector (Level 10)
  - Full serialization into `LevelUpEntry`:
    - Invocations stored in `traitsList`
    - Pact Boon stored in `traitsList`
    - Tome cantrips and Mystic Arcanums added to `newSpells`
    - Pact slots count (1 at L1, 2 at L2-10, 3 at L11-16, 4 at L17-20) updated in `spellSlots`.

- [ ] **Step 1: Add state variables and handlers in `LevelUpModal.tsx`**

Add state for `selectedPactBoon`, `selectedTomeCantrips`, `selectedArcanum`, `selectedFiendResilience`, `selectedGenieKind`, and `swappedOutInvocation`.

- [ ] **Step 2: Render interactive UI sections in `LevelUpModal.tsx`**

Follow strict Parchment Medieval Theme (`AGENTS.md`).

- [ ] **Step 3: Update `validate()` and `buildEntry()`**

Ensure button is disabled if required choices are incomplete and all selections serialize cleanly.

- [ ] **Step 4: Update `handleLevelUp` in `src/app/page.tsx`**

Ensure pact slot count scaling (3 slots at 11, 4 slots at 17) and Mystic Arcanum registration.

- [ ] **Step 5: Verify compilation & tests**

Run: `npx tsc --noEmit && npm run test:adversarial`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/levelup/LevelUpModal.tsx src/app/page.tsx
git commit -m "feat(levelup): implement comprehensive warlock level-up choices and serialization"
```

---

### Task 6: Comprehensive Verification & E2E Testing

**Files:**
- Create: `test/e2e-warlock-flow.test.ts`
- Run Playwright E2E tests

- [ ] **Step 1: Write and run automated unit & adversarial tests**

Run: `npm run test:adversarial`

- [ ] **Step 2: Run Playwright automated E2E tests**

Run: `npx playwright test`

- [ ] **Step 3: Run TypeScript compiler and ESLint checks**

Run: `npx tsc --noEmit && npx eslint .`

- [ ] **Step 4: Update Knowledge Graph**

Run: `graphify update .`

- [ ] **Step 5: Commit and push**

```bash
git push origin main
```
