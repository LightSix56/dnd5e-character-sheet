# План реализации: Интерактивное повышение уровня (Level-Up) и автоматизация заклинаний D&D 5e

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать 100% официальных правил D&D 5e при повышении уровня: интерактивный выбор боевых стилей, компетентности, метамагии и воззваний; удаление всех мусорных ручных строк (атаки, снаряжение, спасброски, 18 навыков); добавление Божественной кары и заклинаний кар; автоматическое начисление заклинаний священных клятв, доменов, кругов и расовой магии для всех классов, подклассов и рас.

**Architecture:** Модульная архитектура: выделение движка авто-заклинаний `auto-spells-engine.ts`, движка интерактивных выборов `level-up-choices.ts`, чистого компонента `LevelUpModal.tsx` в `src/components/levelup/`, сериализация в `handleLevelUp` в `src/app/page.tsx`, с двухфакторным тестированием субагентами (Implementer ➔ Reviewer) и сквозными E2E-тестами в Playwright.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, node:test + node:assert, Playwright with Microsoft Edge.

**Spec:** `docs/superpowers/specs/2026-09-07-level-up-mechanics-and-spells-design.md`

## Global Constraints
- Строгое соблюдение Parchment Medieval Theme (`AGENTS.md` Rule 1): никаких белых фонов `#FFFFFF`, векторные иконки из `@/components/dnd-icons`, теплые пергаментные цвета.
- 0 ошибок компиляции `npx tsc --noEmit`.
- 0 ошибок линтера `npx eslint`.
- 100% прохождение adversarial test suite `npm run test:adversarial`.
- Каждую задачу реализует Implementer subagent, проверяет Reviewer subagent.

---

### Task 1: Compendium Smite Spells & Auto-Spells Engine

**Files:**
- Modify: `src/data/compendium/spells.ts`
- Create: `src/data/compendium/auto-spells-engine.ts`
- Test: `test/auto-spells-engine.test.ts`

**Interfaces:**
- Produces:
  - `AutoGrantedSpell`: `{ name: string; level: number; prepared: boolean; source: string; isRacial?: boolean }`
  - `getAutoGrantedSpellsForLevel(char: CharacterData, newLevel: number, subclassOverride?: string): AutoGrantedSpell[]`
  - 7 missing Smite spells added to `DND_COMPENDIUM_SPELLS` in `spells.ts`.

- [ ] **Step 1: Write failing tests in `test/auto-spells-engine.test.ts`**
- [ ] **Step 2: Run test to verify it fails (`npm run test:adversarial`)**
- [ ] **Step 3: Add Smite spells in `src/data/compendium/spells.ts`**
- [ ] **Step 4: Implement `src/data/compendium/auto-spells-engine.ts`**
- [ ] **Step 5: Run tests and verify all pass**
- [ ] **Step 6: Reviewer subagent gate and commit**

---

### Task 2: Level-Up Interactive Choices Engine

**Files:**
- Create: `src/components/levelup/level-up-choices.ts`
- Test: `test/level-up-choices.test.ts`

**Interfaces:**
- Produces:
  - `LevelUpChoicesConfig`: `{ needsFightingStyle?: boolean; fightingStyleOptions?: FightingStyleOption[]; needsExpertise?: boolean; expertiseCount?: number; eligibleSkills?: string[]; needsMetamagic?: boolean; metamagicCount?: number; metamagicOptions?: any[]; needsInvocations?: boolean; invocationsCount?: number; invocationsOptions?: any[]; needsArchetypeChoice?: boolean; archetypeChoiceTitle?: string; archetypeOptions?: any[]; }`
  - `getLevelUpChoicesConfig(char: CharacterData, newLevel: number, subclassOverride?: string): LevelUpChoicesConfig`

- [ ] **Step 1: Write failing tests in `test/level-up-choices.test.ts`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `src/components/levelup/level-up-choices.ts`**
- [ ] **Step 4: Run tests and verify all pass**
- [ ] **Step 5: Reviewer subagent gate and commit**

---

### Task 3: Refactor and Create `src/components/levelup/LevelUpModal.tsx`

**Files:**
- Create: `src/components/levelup/LevelUpModal.tsx`

**Interfaces:**
- Consumes:
  - `getAutoGrantedSpellsForLevel` from `src/data/compendium/auto-spells-engine`
  - `getLevelUpChoicesConfig` from `src/components/levelup/level-up-choices`
- Produces:
  - Clean, clutter-free `LevelUpModal` component
  - Removes manual attack rows, equipment textarea, arbitrary saving throws, arbitrary 18 skills
  - Adds interactive sections for Fighting Style, Expertise, Metamagic, Invocations
  - Adds auto-granted spells block and clean spell learning for spellcasters

- [ ] **Step 1: Create `src/components/levelup/LevelUpModal.tsx`**
- [ ] **Step 2: Verify zero TypeScript errors with `npx tsc --noEmit`**
- [ ] **Step 3: Reviewer subagent gate and commit**

---

### Task 4: Connect `LevelUpModal` in `src/app/page.tsx` & Update `handleLevelUp`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/lib/dnd-types.ts` (if needed for `LevelUpEntry`)

**Interfaces:**
- Connects new `LevelUpModal`
- Updates `handleLevelUp` to handle Fighting Style AC calculation, Expertise double proficiencies, auto-granted spells with `prepared: true`, and traits.

- [ ] **Step 1: Update `src/app/page.tsx` to use the new `LevelUpModal`**
- [ ] **Step 2: Update `handleLevelUp` to apply Defense AC and all choice traits**
- [ ] **Step 3: Verify TypeScript compiler and adversarial tests pass**
- [ ] **Step 4: Reviewer subagent gate and commit**

---

### Task 5: End-to-End Verification with Playwright (Microsoft Edge)

**Files:**
- Create: `scratch/verify-level-up.mjs`

- [ ] **Step 1: Create automated Playwright script testing:**
  - Paladin level 1 ➔ 2: Fighting Style selection, Divine Smite & Smite spells auto-added, clutter absent.
  - Paladin level 2 ➔ 3: Oath of Devotion selection, Oath spells auto-added.
  - Bard level 2 ➔ 3: Expertise in 2 skills selection, proficiency doubling.
  - Tiefling level 2 ➔ 3: Hellish Rebuke auto-added without spell slots.
- [ ] **Step 2: Run verification script and save screenshots**
- [ ] **Step 3: Verify zero errors and capture UI evidence**

---

### Task 6: Final Quality Gate, Graphify Sync & Remote Push

**Files:**
- Update `walkthrough.md`
- Run `graphify update .`

- [ ] **Step 1: Run `npx tsc --noEmit`**
- [ ] **Step 2: Run `npm run test:adversarial`**
- [ ] **Step 3: Run `npx eslint .`**
- [ ] **Step 4: Run `graphify update .`**
- [ ] **Step 5: Git push origin main**
- [ ] **Step 6: Present walkthrough and completion report**
