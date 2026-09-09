# Graph Report - dnd5e-character-sheet  (2026-09-09)

## Corpus Check
- 100 files · ~229,621 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 756 nodes · 1540 edges · 57 communities (39 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `187ba065`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- dependencies
- LevelUpModal.tsx
- CharacterCreationWizardModal.tsx
- dnd-types.ts
- @supabase/ssr
- app/page.tsx
- compilerOptions
- dnd-icons.tsx
- CompendiumModals.tsx
- NameGeneratorModal.tsx
- ItemDetailModal.tsx
- react
- CharacterGridModal.tsx
- devDependencies
- SubclassSelectorModal.tsx
- scripts
- next
- Proposed Changes
- mobile-visual-audit.mjs
- utils.ts
- tailwind.config.ts
- build_full_compendium.py
- eslint.config.mjs
- postcss.config.mjs
- build_classes.py
- build_feats.py
- build_full_races.py
- build_progression.py
- build_race_progression.py
- build_races.py
- 🚀 4. Спецификация Новых Функций (Feature Roadmap)
- 📜 D&D 5e Character Sheet — Правила и Стандарты Кодовой Базы
- Global Constraints
- Blind Adversarial Breaker (Red Team)
- Blind Adversarial Fixer (Blue Team)
- Adversarial Red / Blue Team Orchestrator
- E2E Tests (Playwright)
- adversarial-breaker/agent.md
- adversarial-fixer/agent.md
- rules/graphify.md
- workflows/graphify.md
- @playwright/test
- Desktop and Laptop UI/UX Audit & Fixes Implementation Plan
- Full Level 1 Race & Class Choices Implementation Plan
- 2. Архитектура компонентов и данных
- compendium/index.ts
- 2. Архитектура и компонентные изменения
- 2. Архитектура решения
- Global Constraints
- Global Constraints
- useEscapeKey.ts
- css-ux-standards.test.mjs
- hit-targets.test.ts
- auth-form-and-images.test.ts
- ClassSelectorModal.tsx

## God Nodes (most connected - your core abstractions)
1. `DnDCharacterSheet()` - 34 edges
2. `useEscapeKey()` - 33 edges
3. `LevelUpModal` - 24 edges
4. `CharacterData` - 23 edges
5. `POST()` - 21 edges
6. `getModifier()` - 20 edges
7. `react` - 17 edges
8. `CharacterCreationWizardModal()` - 17 edges
9. `compilerOptions` - 17 edges
10. `AbilityName` - 16 edges

## Surprising Connections (you probably didn't know these)
- `applyLevelDown()` --calls--> `calcModifier()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/lib/dnd-types.ts
- `simulateLevelDown()` --calls--> `getModifier()`  [EXTRACTED]
  test/level-up-martial.test.ts → src/lib/dnd-types.ts
- `SpellModalProps` --references--> `DndSpell`  [EXTRACTED]
  src/components/compendium/CompendiumModals.tsx → src/data/compendium/spells.ts
- `SavedCharacter` --references--> `CharacterData`  [EXTRACTED]
  src/components/tools/CharacterGridModal.tsx → src/lib/dnd-types.ts
- `applyLevelDown()` --calls--> `getSpellSlotsForClassLevel()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/data/compendium/class-progression.ts

## Import Cycles
- None detected.

## Communities (57 total, 17 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.03
Nodes (76): name, private, version, bun-types, class-variance-authority, cmdk, date-fns, @dnd-kit/core (+68 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (72): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+64 more)

### Community 2 - "LevelUpModal.tsx"
Cohesion: 0.08
Nodes (60): LevelDownModalProps, LevelHistoryModalProps, NonClassSpellConfirmModalProps, BATTLE_MASTER_MANEUVERS, ELDRITCH_INVOCATIONS, getLevelUpChoicesConfig(), getThirdCasterSpellSlots(), HUNTER_DEFENSE_OPTIONS (+52 more)

### Community 3 - "CharacterCreationWizardModal.tsx"
Cohesion: 0.09
Nodes (45): CATEGORIES, RaceSelectorModalProps, SparklesDndIcon(), UserHeroIcon(), StatsCalculatorModalProps, CharacterCreationWizardModal(), ALL_DND_LANGUAGES, calcPointBuyTotalSpent() (+37 more)

### Community 4 - "dnd-types.ts"
Cohesion: 0.13
Nodes (45): borders(), dCell(), hCell(), isSafeImageUrl(), normalizeCharacter(), POST(), sectionHeader(), textPara() (+37 more)

### Community 5 - "@supabase/ssr"
Cohesion: 0.09
Nodes (18): @supabase/ssr, createClient(), DELETE(), GET(), isValidUUID(), POST(), PUT(), GET() (+10 more)

### Community 6 - "app/page.tsx"
Cohesion: 0.12
Nodes (21): AuthModal, CreateChoiceModal, CreateChoiceModalProps, getThirdCasterSpellSlots(), LevelDownModal, LevelHistoryModal, NonClassSpellConfirmModal(), ResetModal (+13 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "dnd-icons.tsx"
Cohesion: 0.16
Nodes (14): ArcaneLinkIcon(), CameraPortraitIcon(), ChestIcon(), CoinsChestIcon(), CrystalBallDndIcon(), GoldSealCheckIcon(), HourglassIcon(), IconProps (+6 more)

### Community 9 - "CompendiumModals.tsx"
Cohesion: 0.19
Nodes (11): SpellDetailModal(), SpellModalProps, TraitDetailModal(), TraitModalProps, WeaponDetailModal(), WeaponModalProps, SpellbookIcon(), DND_TRAITS (+3 more)

### Community 10 - "NameGeneratorModal.tsx"
Cohesion: 0.22
Nodes (13): QuillIcon(), NameGeneratorModal(), NameGeneratorModalProps, DND_COMPENDIUM_NAMES_DB, FANTASY_NAMES_DATABASE, FantasyNameResult, generateFantasyName(), generateMultipleFantasyNames() (+5 more)

### Community 11 - "ItemDetailModal.tsx"
Cohesion: 0.22
Nodes (9): ItemDetailModal(), ItemDetailModalProps, BackpackPackIcon(), CompendiumItem, DND_COMPENDIUM_ITEMS, findItemByName(), getWeaponItems(), DND_WEAPONS (+1 more)

### Community 12 - "react"
Cohesion: 0.33
Nodes (4): react, AutocompleteInput(), AutocompleteInputProps, AutocompleteItem

### Community 13 - "CharacterGridModal.tsx"
Cohesion: 0.25
Nodes (9): MysticCloudIcon(), CharacterGridModal, CharacterGridModalProps, formatRussianDate(), getCharAC(), getCharHP(), getCharSpecialStat(), SavedCharacter (+1 more)

### Community 14 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, bun-types, eslint, eslint-config-next, @playwright/test, puppeteer-core, tailwindcss, @tailwindcss/postcss (+5 more)

### Community 15 - "SubclassSelectorModal.tsx"
Cohesion: 0.50
Nodes (4): SubclassSelectorModal(), SubclassSelectorModalProps, CrossedSwordsIcon(), CompendiumSubclass

### Community 16 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:generate, db:migrate, db:push, db:reset, dev, lint (+4 more)

### Community 17 - "next"
Cohesion: 0.22
Nodes (4): nextConfig, next, jsonLd, metadata

### Community 18 - "Proposed Changes"
Cohesion: 0.09
Nodes (21): 1. Глобальные стили (Design System Foundation), 2. Мастер создания персонажа (Wizard Domain), 3. Инструменты и калькуляторы (Tools Domain), 4. Компендиум и страница шеринга (Compendium & Share Domain), 5. Главный лист персонажа (Main Sheet Domain), Automated Tests, [MODIFY] [CharacterCreationWizardModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/wizard/CharacterCreationWizardModal.tsx), [MODIFY] [CharacterGridModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/tools/CharacterGridModal.tsx) (+13 more)

### Community 19 - "mobile-visual-audit.mjs"
Cohesion: 0.50
Nodes (4): puppeteer-core, OUT_DIR, run(), waitForServer()

### Community 21 - "tailwind.config.ts"
Cohesion: 0.50
Nodes (3): tailwindcss, tailwindcss-animate, config

### Community 32 - "🚀 4. Спецификация Новых Функций (Feature Roadmap)"
Cohesion: 0.12
Nodes (15): 🧭 1. Назначение и Философия Продукта, 2.1. Цветовая палитра (Color Palette Matrix), 2.2. Стандарты Иконографики, 2.3. Компоненты Форм, 🎨 2. Дизайн-Система: «Средневековый Пергамент» (Parchment Theme), 🏛️ 3. Архитектура Проекта, 🚀 4. Спецификация Новых Функций (Feature Roadmap), 🛡️ 5. Контроль Качества и Регламент Сдачи Задач (+7 more)

### Community 33 - "📜 D&D 5e Character Sheet — Правила и Стандарты Кодовой Базы"
Cohesion: 0.14
Nodes (13): 1.1. Цветовая палитра (Категорический запрет на случайные цвета), 🎨 1. Единая Дизайн-Система (Parchment Medieval Theme), 2.1. Векторные двухцветные D&D-иконки (`@/components/dnd-icons`), 2.2. Текстовые эмодзи, 🗡️ 2. Стандарты Иконографики и Эмодзи, 📝 3. Стандарты Компонентов Форм, ⚔️ 4. Архитектура и Качество Кода, 🚀 5. Регламент Сборки и Git (+5 more)

### Community 34 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Mobile Responsive & Ergonomics Overhaul Implementation Plan, Task 1: Automated Mobile Visual Test Runner & Baseline Screenshot Capture, Task 2: Responsive Mobile Header & Collapsible Action Drawer, Task 3: Mobile Character Creation Wizard Ergonomics & Sticky Controls, Task 4: Main Sheet Mobile Optimization (Tabs, Attributes, Combat Block, Attacks, Spells), Task 5: Mobile Share & DM View Page Optimization, Task 6: Final Full-Suite Verification & Zero-Artifact Sign-Off

### Community 35 - "Blind Adversarial Breaker (Red Team)"
Cohesion: 0.50
Nodes (3): Blind Adversarial Breaker (Red Team), Core Objective, Strict Operational Rules

### Community 36 - "Blind Adversarial Fixer (Blue Team)"
Cohesion: 0.50
Nodes (3): Blind Adversarial Fixer (Blue Team), Core Objective, Strict Operational Rules

### Community 44 - "Desktop and Laptop UI/UX Audit & Fixes Implementation Plan"
Cohesion: 0.29
Nodes (6): Desktop and Laptop UI/UX Audit & Fixes Implementation Plan, Global Constraints, Task 1: Desktop & Laptop Multi-Viewport Audit Suite, Task 2: Visual & Ergonomic Analysis Across Viewports, Task 3: Implement Layout and Styling Fixes, Task 4: Re-Audit, Verification & Commit

### Community 45 - "Full Level 1 Race & Class Choices Implementation Plan"
Cohesion: 0.25
Nodes (7): Full Level 1 Race & Class Choices Implementation Plan, Task 1: Level 1 Dictionaries, Config Functions & Rule Tests, Task 2: Fix Background Skill Replacement Bug & Lock Name Generator, Task 3: Step 1 UI & Logic — Full Racial Choices (Feat, Cantrip, Tool, Dragon Ancestry, Languages), Task 4: Step 2 UI & Logic — Full Class Choices (Fighting Style, Rogue Expertise, Ranger Favored Enemy/Terrain), Task 5: Character Data Assembly & Serialization (`handleFinish`), Task 6: Playwright Headless / MCP End-to-End Verification Across All Flows

### Community 46 - "2. Архитектура компонентов и данных"
Cohesion: 0.25
Nodes (7): 1. Цели и назначение, 2.1. Расширение `src/components/wizard/wizard-helpers.ts`, 2.2. Расширение состояния в `CharacterCreationWizardModal.tsx`, 2.3. Исправление дефекта `backgroundSkillReplacements`, 2. Архитектура компонентов и данных, 3. Процесс верификации, Дизайн-спецификация: Полная поддержка выборов 1-го уровня для всех рас и классов в мастере создания персонажа D&D 5e

### Community 47 - "compendium/index.ts"
Cohesion: 0.14
Nodes (16): getAutoGrantedSpellsForLevel(), getAvailableSpellsForCharacter(), isSpellAllowedForCharacter(), SpellCheckResult, SUBCLASS_EXPANDED_SPELLS, SUBCLASS_FULL_CLASS_SPELLS, CompendiumFeat, DND_COMPENDIUM_FEATS (+8 more)

### Community 48 - "2. Архитектура и компонентные изменения"
Cohesion: 0.18
Nodes (10): 1. Цели и задачи, 2.1. Глобальные стили (`src/app/globals.css`), 2.2. Навыки и спасброски (`src/app/page.tsx`), 2.3. Доступные броски d20 (`RollBadge`), 2.4. Модальные окна и клавиша Escape, 2.5. Форма авторизации (`AuthModal` в `src/app/page.tsx`), 2.6. Изображения и типографика, 2. Архитектура и компонентные изменения (+2 more)

### Community 49 - "2. Архитектура решения"
Cohesion: 0.20
Nodes (9): 1. Контекст и цели, 2.1. Каталог заклинаний (`src/data/compendium/spells.ts`), 2.2. Движок авто-начисления заклинаний (`src/data/compendium/auto-spells-engine.ts`), 2.3. Движок интерактивных выборов при повышении уровня (`src/components/levelup/level-up-choices.ts`), 2.4. Рефакторинг `LevelUpModal.tsx` (`src/components/levelup/LevelUpModal.tsx`), 2.5. Сериализация в `handleLevelUp`, 2. Архитектура решения, 3. План верификации (+1 more)

### Community 50 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Task 1: Compendium Smite Spells & Auto-Spells Engine, Task 2: Level-Up Interactive Choices Engine, Task 3: Refactor and Create `src/components/levelup/LevelUpModal.tsx`, Task 4: Connect `LevelUpModal` in `src/app/page.tsx` & Update `handleLevelUp`, Task 5: End-to-End Verification with Playwright (Microsoft Edge), Task 6: Final Quality Gate, Graphify Sync & Remote Push, План реализации: Интерактивное повышение уровня (Level-Up) и автоматизация заклинаний D&D 5e

### Community 51 - "Global Constraints"
Cohesion: 0.25
Nodes (7): Global Constraints, Task 1: Global CSS Enhancements (`globals.css`), Task 2: Clickable Hit Targets for Skills, Saves & Form Labels, Task 3: Escape Key Modal Dismissal & Keyboard Dice Rolls, Task 4: Auth Modal Form Wrapping, Image Sizing & Typographic Ellipsis, Task 5: Playwright Headless Edge E2E Verification, UX & Web Guidelines Enhancements Implementation Plan

### Community 52 - "useEscapeKey.ts"
Cohesion: 0.29
Nodes (4): __dirname, __filename, KeyListener, rootDir

### Community 53 - "css-ux-standards.test.mjs"
Cohesion: 0.40
Nodes (4): cssContent, cssPath, __dirname, __filename

### Community 54 - "hit-targets.test.ts"
Cohesion: 0.40
Nodes (4): __dirname, __filename, pageContent, pagePath

### Community 55 - "auth-form-and-images.test.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, rootDir

### Community 56 - "ClassSelectorModal.tsx"
Cohesion: 0.40
Nodes (5): ClassSelectorModal(), ClassSelectorModalProps, EngravedShieldIcon(), ScrollIcon(), CompendiumClass

## Knowledge Gaps
- **337 isolated node(s):** `SCREENSHOT_DIR`, `eslintConfig`, `nextConfig`, `name`, `version` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 397 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `LevelUpModal.tsx`, `CharacterCreationWizardModal.tsx`, `dnd-types.ts`, `app/page.tsx`, `dnd-icons.tsx`, `CompendiumModals.tsx`, `NameGeneratorModal.tsx`, `ItemDetailModal.tsx`, `CharacterGridModal.tsx`, `SubclassSelectorModal.tsx`, `useEscapeKey.ts`, `ClassSelectorModal.tsx`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `@supabase/ssr` connect `@supabase/ssr` to `package.json`, `dnd-types.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `SCREENSHOT_DIR`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.025974025974025976 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.027777777777777776 - nodes in this community are weakly interconnected._
- **Should `LevelUpModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08312020460358056 - nodes in this community are weakly interconnected._