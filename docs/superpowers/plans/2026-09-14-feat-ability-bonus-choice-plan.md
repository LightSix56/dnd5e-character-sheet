# Feat Ability Bonus Dynamic Choice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable dynamic player choice of ability scores for half-feats with multiple options (e.g. Athlete: STR/DEX), auto-apply flat bonuses for single-option feats, and accurately update character stats and level progression without hardcoding feat names.

**Architecture:** A standalone parsing engine (`feat-bonus-engine.ts`) dynamically extracts valid abilities from `feat.abilityBonus`. `LevelUpModal` and `CharacterCreationWizardModal` render parchment pill selectors when choice is required and auto-apply flat bonuses when singular. `handleLevelUp` and `handleLevelDown` track and revert bonuses through `LevelUpEntry.featAbilityBonus`.

**Tech Stack:** TypeScript, Next.js, React, Node test runner (`node:test`, `node:assert/strict`).

**Spec:** `docs/superpowers/specs/2026-09-14-feat-ability-bonus-choice-design.md`

## Global Constraints
- No hardcoded feat names: all options must be parsed dynamically from `feat.abilityBonus`.
- Strict parchment theme: buttons and badges must use `.parchment-btn`, `.parchment-btn-secondary`, and `#5C341F` inks.
- 0 TypeScript compiler errors (`npx tsc --noEmit`).
- 0 ESLint errors (`npx eslint .`).
- All tests passing (`npm run test:adversarial`).
- Git commit and push with proxy cleared upon completion.

---

### Task 1: Feat Ability Bonus Engine & Unit Tests (TDD)

**Files:**
- Create: `src/lib/feat-bonus-engine.ts`
- Create: `test/feat-bonus-engine.test.ts`
- Modify: `src/lib/dnd-types.ts`

**Interfaces:**
- Produces: `parseFeatAbilityBonus(bonusText?: string): FeatAbilityBonusConfig | null`
- Produces: `getFeatAbilityBonusFromFeat(feat: { abilityBonus?: string; description?: string }): FeatAbilityBonusConfig | null`
- Produces: `interface FeatAbilityBonusConfig { options: AbilityName[]; amount: number; isChoice: boolean; rawBonusText: string; }`
- Modifies: `LevelUpEntry` with `featAbilityBonus?: AbilityName;`

- [ ] **Step 1: Write failing unit test for `feat-bonus-engine.test.ts`**
  Cover Athlete (`+1 СИЛ или ЛОВ`), Crusher (`+1 СИЛ или ТЕЛ`), Resilient (`+1 к любой характеристике`), Heavy Armor Master (`+1 СИЛ`), non-bonus feats, and parsing all compendium feats.
- [ ] **Step 2: Run test to verify failure**
  Run: `npx tsx --test test/feat-bonus-engine.test.ts`
  Expected: FAIL (module not found)
- [ ] **Step 3: Implement `src/lib/feat-bonus-engine.ts` and update `LevelUpEntry` in `src/lib/dnd-types.ts`**
  Implement dynamic regex & token matching against `ALL_ABILITIES`, handling "любой"/"выбранной" as 6 stats, comma/"или" separated stats as subsets, and single stats as flat bonus.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx tsx --test test/feat-bonus-engine.test.ts`
  Expected: PASS (all cases pass)
- [ ] **Step 5: Verify all compendium feats parse without throwing**
  Run test assertion confirming 0 parsing errors across all 51 half-feats.

---

### Task 2: LevelUpModal Feat Ability Choice Integration

**Files:**
- Modify: `src/components/levelup/LevelUpModal.tsx`
- Test: `test/level-up-feat-choice.test.ts`

**Interfaces:**
- Consumes: `parseFeatAbilityBonus`, `FeatAbilityBonusConfig` from `src/lib/feat-bonus-engine`
- Modifies: `LevelUpModal` state and Step 8 (ASI / Feat) JSX

- [ ] **Step 1: Write failing test in `test/level-up-feat-choice.test.ts`**
  Verify LevelUpModal exports and validates `featAbilityBonus` in returned `LevelUpEntry`.
- [ ] **Step 2: Run test to verify failure**
  Run: `npx tsx --test test/level-up-feat-choice.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement choice UI in `src/components/levelup/LevelUpModal.tsx`**
  Add state `selectedFeatAbilityBonus`. When `selectedFeat` is chosen, detect `parseFeatAbilityBonus(selectedFeat.abilityBonus)`.
  If `isChoice`: render parchment pill buttons with current score and `currentScore + 1`, highlighting selected stat.
  If `!isChoice` (single option): show informative card that `+1 к [Характеристике]` is automatically applied.
  In `onConfirm`: set `featAbilityBonus: selectedFeatAbilityBonus`, update trait name with bonus, e.g. `Атлетичный (+1 ЛОВ)`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx tsx --test test/level-up-feat-choice.test.ts`
  Expected: PASS

---

### Task 3: Character Sheet Level Up & Level Down Handlers (`page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`
- Test: `test/level-up-feat-choice.test.ts`

**Interfaces:**
- Consumes: `entry.featAbilityBonus` from `LevelUpEntry`
- Modifies: `handleLevelUp` and `handleLevelDown` in `src/app/page.tsx`

- [ ] **Step 1: Write test for stat bonus increment on LevelUp and decrement on LevelDown**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement in `src/app/page.tsx`**
  In `handleLevelUp`: `if (entry.featAbilityBonus) newAsi[entry.featAbilityBonus] = (newAsi[entry.featAbilityBonus] || 0) + 1;`
  In `handleLevelDown`: `if (last?.featAbilityBonus) newAsi[last.featAbilityBonus] = Math.max(0, (newAsi[last.featAbilityBonus] || 0) - 1);`
- [ ] **Step 4: Run test to verify it passes**

---

### Task 4: Character Creation Wizard Feat Choice Integration

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`
- Test: `test/wizard-feat-choice.test.ts`

**Interfaces:**
- Consumes: `parseFeatAbilityBonus` from `src/lib/feat-bonus-engine`
- Modifies: `CharacterCreationWizardModal.tsx`

- [ ] **Step 1: Write test for wizard feat ability bonus selection**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement in `CharacterCreationWizardModal.tsx`**
  Add `selectedRacialFeatAbilityBonus` state. Render choice selector under selected feat in Step 1 (Race). On wizard completion, apply `+1` to `abilityBonuses[selectedRacialFeatAbilityBonus]`.
- [ ] **Step 4: Run test to verify it passes**

---

### Task 5: Full Regression, Adversarial Verification & Git Push

**Files:**
- None (verification across entire repo)

- [ ] **Step 1: Run TypeScript compiler**
  `npx tsc --noEmit` -> 0 errors
- [ ] **Step 2: Run ESLint**
  `npx eslint .` -> 0 errors
- [ ] **Step 3: Run full adversarial suite**
  `npm run test:adversarial` -> all tests pass
- [ ] **Step 4: Update knowledge graph**
  `graphify update .`
- [ ] **Step 5: Git commit and push**
  `$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "feat(feats): dynamic ability score choice for half-feats in level-up and wizard"; git push origin main`
