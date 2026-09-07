# Full Level 1 Race & Class Choices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 100% D&D 5e Level 1 player choices for all races and classes in the Character Creation Wizard, resolve background skill replacement select reset bug, lock name generator until race selection, and add interactive checkbox language selection.

**Architecture:** Extend `src/components/wizard/wizard-helpers.ts` with 5e rules engines for fighting styles, feats, languages, draconic ancestries, ranger terrains/enemies, and tools. Integrate reactive choice selectors into `CharacterCreationWizardModal.tsx` Steps 1, 2, and 3 with strict validation and seamless mapping to `CharacterData`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Node.js test runner (`tsx --test`), Playwright MCP & headless runner.

**Spec:** [docs/superpowers/specs/2026-09-07-character-creation-wizard-full-options-design.md](file:///c:/antig/dnd5e-character-sheet/docs/superpowers/specs/2026-09-07-character-creation-wizard-full-options-design.md)

---

### Task 1: Level 1 Dictionaries, Config Functions & Rule Tests

**Files:**
- Modify: `src/components/wizard/wizard-helpers.ts`
- Create / Update: `test/wizard-rules.test.ts`

- [ ] **Step 1: Write failing unit tests for Level 1 choices config**
  Create tests in `test/wizard-rules.test.ts` testing:
  - `FIGHTING_STYLES` contains all 6 core styles.
  - `DRAGON_ANCESTRIES` contains all 10 dragon types.
  - `getRacialChoicesConfig` correctly flags Variant Human (needsFeat, extraSkillCount: 1, extraLanguageCount: 1), High Elf (needsCantrip: true, extraLanguageCount: 1), Dwarf (needsTool: true), Dragonborn (needsDragonColor: true).
  - `getClassLevel1ChoicesConfig` correctly flags Fighter (needsFightingStyle: true), Rogue (needsExpertise: true, expertiseCount: 2), Ranger (needsFavoredEnemy: true, needsFavoredTerrain: true).
  - `DND_LANGUAGES` standard and exotic lists are complete.

- [ ] **Step 2: Run test to verify it fails**
  Run: `& 'C:\Program Files\nodejs\npm.cmd' run test:adversarial`
  Expected: FAIL due to missing exports in `wizard-helpers.ts`.

- [ ] **Step 3: Implement data dictionaries and helper functions**
  Implement in `src/components/wizard/wizard-helpers.ts`:
  - `FIGHTING_STYLES`, `DRAGON_ANCESTRIES`, `RANGER_FAVORED_ENEMIES`, `RANGER_FAVORED_TERRAINS`, `DWARF_TOOL_OPTIONS`.
  - `STANDARD_LANGUAGES`, `EXOTIC_LANGUAGES`, `ALL_DND_LANGUAGES`.
  - `getRacialChoicesConfig(race, subrace)` and `getClassLevel1ChoicesConfig(className, subclassId)`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `& 'C:\Program Files\nodejs\npm.cmd' run test:adversarial`
  Expected: PASS.

- [ ] **Step 5: Commit Task 1**
  `git add src/components/wizard/wizard-helpers.ts test/wizard-rules.test.ts; git commit -m "feat(wizard): add level 1 race and class choices config and tests"`

---

### Task 2: Fix Background Skill Replacement Bug & Lock Name Generator

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`

- [ ] **Step 1: Fix background skill replacement options filter**
  In Step 3 JSX:
  Calculate `otherReplacements = Object.entries(backgroundSkillReplacements).filter(([k]) => k !== bgSkill).map(([, v]) => v)`.
  Filter `ALL_SKILLS` checking `!otherReplacements.includes(s)`.
  Ensure currently selected `replacement` is retained in `<option>`.
  When `replacement` is chosen, display green status `✓ Заменён на «${replacement}»` instead of warning.

- [ ] **Step 2: Lock Name Input and 🎲 Button until Race is chosen**
  Initialize `selectedRaceId` to `''` (or gate with `!selectedRaceId`).
  In Step 1:
  When no race is selected, show disabled input with placeholder: "Сначала выберите расу персонажа ниже...", button 🎲 disabled.
  When user selects a race, unlock input and button.
  Update `handleGenerateName` to use chosen race's id.
  In `validateStep(1)`: ensure `selectedRaceId` is not empty.

- [ ] **Step 3: Verification & Commit**
  Run `& 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit`.
  Commit: `git add src/components/wizard/CharacterCreationWizardModal.tsx; git commit -m "fix(wizard): fix background skill select reset and gate name generator by race"`

---

### Task 3: Step 1 UI & Logic — Full Racial Choices (Feat, Cantrip, Tool, Dragon Ancestry, Languages)

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`

- [ ] **Step 1: Add state variables for racial choices**
  - `selectedRacialFeatId: string`
  - `selectedRacialCantrip: string`
  - `selectedRacialTool: string`
  - `selectedDragonColor: string`
  - `selectedExtraLanguages: string[]`

- [ ] **Step 2: Render interactive choice sections in Step 1**
  - For Variant Human / Custom Lineage: Feat selector with search, summary, description from `DND_COMPENDIUM_FEATS`.
  - For High Elf: Wizard cantrip selector from `DND_COMPENDIUM_SPELLS` (level 0 wizard spells).
  - For Dwarf: Artisan Tool selector (3 options).
  - For Dragonborn: Draconic Ancestry selector (10 options with damage type and breath weapon).
  - For Races with extra language: Checkbox list of standard/exotic languages with exact limit enforcement.

- [ ] **Step 3: Update `validateStep(1)`**
  Check that all required racial choices are completed before allowing user to proceed to Step 2.

- [ ] **Step 4: Verification & Commit**
  Run `& 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit`.
  Commit: `git add src/components/wizard/CharacterCreationWizardModal.tsx; git commit -m "feat(wizard): add full level 1 racial choices UI and validation"`

---

### Task 4: Step 2 UI & Logic — Full Class Choices (Fighting Style, Rogue Expertise, Ranger Favored Enemy/Terrain)

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`

- [ ] **Step 1: Add state variables for class choices**
  - `selectedFightingStyle: string`
  - `selectedExpertise: string[]`
  - `selectedFavoredEnemy: string`
  - `selectedFavoredTerrain: string`

- [ ] **Step 2: Render interactive choice sections in Step 2**
  - For Fighter: Fighting Style selection grid with description and bonuses.
  - For Rogue: Expertise selection (pick 2 from character's proficient skills) with ⭐ markers.
  - For Ranger: Favored Enemy and Favored Terrain selection cards.
  - For Sorcerer (Draconic): Draconic Ancestor selection.

- [ ] **Step 3: Update `validateStep(2)`**
  Check that required class options are completed before proceeding to Step 3.

- [ ] **Step 4: Verification & Commit**
  Run `& 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit`.
  Commit: `git add src/components/wizard/CharacterCreationWizardModal.tsx; git commit -m "feat(wizard): add full level 1 class choices UI and validation"`

---

### Task 5: Character Data Assembly & Serialization (`handleFinish`)

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`

- [ ] **Step 1: Map all choices into `CharacterData`**
  - Feats -> `traitsList` & `featuresTraits`.
  - Fighting Style -> `traitsList` & `featuresTraits` (and AC bonus if Defense is chosen).
  - Rogue Expertise -> `skillExpertise[skill] = true`.
  - Favored Enemy / Terrain -> `traitsList` & `featuresTraits`.
  - Draconic Ancestry -> `traitsList` & `featuresTraits` (damage resistance and breath weapon attack).
  - High Elf / Racial Cantrips -> added to `spells` list as cantrips.
  - Languages -> merged with race & background into `otherProficienciesLanguages`.
  - Tools -> merged into `otherProficienciesLanguages`.

- [ ] **Step 2: Run build & compiler checks**
  Run: `& 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit`.
  Run: `& 'C:\Program Files\nodejs\npm.cmd' run test:adversarial`.

- [ ] **Step 3: Commit Task 5**
  Commit: `git add src/components/wizard/CharacterCreationWizardModal.tsx; git commit -m "feat(wizard): serialize all level 1 race and class choices into character data"`

---

### Task 6: Playwright Headless / MCP End-to-End Verification Across All Flows

**Files:**
- Create: `scratch/verify-all-wizard-choices.mjs`

- [ ] **Step 1: Write comprehensive verification script**
  Automate browser sessions testing:
  1. Name input blocked initially -> race selected -> name input unlocked -> 🎲 generates racial name.
  2. Variant Human: select Feat (e.g. "Бдительный"), pick 1 skill, pick 2 stats, pick 1 language.
  3. Rogue: pick 4 skills, pick 2 expertise skills.
  4. Background: pick Criminal, test replacement dropdown with overlap, verify chosen replacement stays selected without resetting!
  5. Finalize character -> verify Character Sheet reflects all choices (Feat, Expertise, Languages, Stats, HP, AC).
  6. Fighter: verify Fighting Style selection.
  7. Dragonborn: verify Draconic Ancestry selection.
  8. High Elf: verify Cantrip selection.

- [ ] **Step 2: Run verification script**
  Run headless Edge/Chromium and inspect console output and screenshots.

- [ ] **Step 3: Full suite verification**
  Run:
  - `& 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit`
  - `& 'C:\Program Files\nodejs\npx.cmd' eslint .`
  - `& 'C:\Program Files\nodejs\npm.cmd' run test:adversarial`
  - `graphify update .`

- [ ] **Step 4: Push to main**
  `$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git push origin main`
