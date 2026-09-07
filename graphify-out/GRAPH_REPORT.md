# Graph Report - dnd5e-character-sheet  (2026-09-07)

## Corpus Check
- 92 files · ~224,647 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 709 nodes · 1455 edges · 50 communities (32 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `08af33e6`
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
- ClassSelectorModal.tsx
- CharacterGridModal.tsx
- devDependencies
- react
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
- CharacterData
- 2. Архитектура решения
- Global Constraints

## God Nodes (most connected - your core abstractions)
1. `DnDCharacterSheet()` - 34 edges
2. `LevelUpModal` - 23 edges
3. `CharacterData` - 23 edges
4. `POST()` - 21 edges
5. `getModifier()` - 20 edges
6. `compilerOptions` - 17 edges
7. `react` - 16 edges
8. `CharacterCreationWizardModal()` - 16 edges
9. `AbilityName` - 16 edges
10. `SharedCharacterPage()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `applyLevelDown()` --calls--> `calcModifier()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/lib/dnd-types.ts
- `simulateLevelDown()` --calls--> `getModifier()`  [EXTRACTED]
  test/level-up-martial.test.ts → src/lib/dnd-types.ts
- `SpellModalProps` --references--> `DndSpell`  [EXTRACTED]
  src/components/compendium/CompendiumModals.tsx → src/data/compendium/spells.ts
- `SavedCharacter` --references--> `CharacterData`  [EXTRACTED]
  src/components/tools/CharacterGridModal.tsx → src/lib/dnd-types.ts
- `ShareModalProps` --references--> `CharacterData`  [EXTRACTED]
  src/components/tools/ShareModal.tsx → src/lib/dnd-types.ts

## Import Cycles
- None detected.

## Communities (50 total, 17 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.03
Nodes (76): name, private, version, bun-types, class-variance-authority, cmdk, date-fns, @dnd-kit/core (+68 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (72): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+64 more)

### Community 2 - "LevelUpModal.tsx"
Cohesion: 0.09
Nodes (54): BATTLE_MASTER_MANEUVERS, ELDRITCH_INVOCATIONS, getLevelUpChoicesConfig(), getThirdCasterSpellSlots(), HUNTER_DEFENSE_OPTIONS, HUNTER_PREY_OPTIONS, InvocationOption, LevelUpChoicesConfig (+46 more)

### Community 3 - "CharacterCreationWizardModal.tsx"
Cohesion: 0.10
Nodes (44): CATEGORIES, RaceSelectorModalProps, UserHeroIcon(), StatsCalculatorModalProps, CharacterCreationWizardModal(), ALL_DND_LANGUAGES, calcPointBuyTotalSpent(), calcPreparedSpellsLimit() (+36 more)

### Community 4 - "dnd-types.ts"
Cohesion: 0.13
Nodes (45): borders(), dCell(), hCell(), isSafeImageUrl(), normalizeCharacter(), POST(), sectionHeader(), textPara() (+37 more)

### Community 5 - "@supabase/ssr"
Cohesion: 0.09
Nodes (18): @supabase/ssr, createClient(), DELETE(), GET(), isValidUUID(), POST(), PUT(), GET() (+10 more)

### Community 6 - "app/page.tsx"
Cohesion: 0.11
Nodes (16): AuthModal, getThirdCasterSpellSlots(), LevelDownModal, LevelHistoryModal, RollBadge, rollD20(), RollResult, RollResultPopup (+8 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "dnd-icons.tsx"
Cohesion: 0.15
Nodes (15): ArcaneLinkIcon(), CameraPortraitIcon(), ChestIcon(), CoinsChestIcon(), CrystalBallDndIcon(), GoldSealCheckIcon(), HourglassIcon(), IconProps (+7 more)

### Community 9 - "CompendiumModals.tsx"
Cohesion: 0.19
Nodes (11): SpellDetailModal(), SpellModalProps, TraitDetailModal(), TraitModalProps, WeaponDetailModal(), WeaponModalProps, SpellbookIcon(), DND_TRAITS (+3 more)

### Community 10 - "NameGeneratorModal.tsx"
Cohesion: 0.24
Nodes (13): QuillIcon(), NameGeneratorModal(), NameGeneratorModalProps, DND_COMPENDIUM_NAMES_DB, FANTASY_NAMES_DATABASE, FantasyNameResult, generateFantasyName(), generateMultipleFantasyNames() (+5 more)

### Community 11 - "ItemDetailModal.tsx"
Cohesion: 0.22
Nodes (9): ItemDetailModal(), ItemDetailModalProps, BackpackPackIcon(), CompendiumItem, DND_COMPENDIUM_ITEMS, findItemByName(), getWeaponItems(), DND_WEAPONS (+1 more)

### Community 12 - "ClassSelectorModal.tsx"
Cohesion: 0.21
Nodes (10): ClassSelectorModal(), ClassSelectorModalProps, SubclassSelectorModal(), SubclassSelectorModalProps, CrossedSwordsIcon(), EngravedShieldIcon(), ScrollIcon(), SparklesDndIcon() (+2 more)

### Community 13 - "CharacterGridModal.tsx"
Cohesion: 0.25
Nodes (9): MysticCloudIcon(), CharacterGridModal, CharacterGridModalProps, formatRussianDate(), getCharAC(), getCharHP(), getCharSpecialStat(), SavedCharacter (+1 more)

### Community 14 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, bun-types, eslint, eslint-config-next, @playwright/test, puppeteer-core, tailwindcss, @tailwindcss/postcss (+5 more)

### Community 15 - "react"
Cohesion: 0.33
Nodes (4): react, AutocompleteInput(), AutocompleteInputProps, AutocompleteItem

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

### Community 47 - "CharacterData"
Cohesion: 0.11
Nodes (21): LevelDownModalProps, LevelHistoryModalProps, NonClassSpellConfirmModalProps, CharacterCreationWizardModalProps, AutoGrantedSpell, getAutoGrantedSpellsForLevel(), isSpellAllowedForCharacter(), SpellCheckResult (+13 more)

### Community 49 - "2. Архитектура решения"
Cohesion: 0.20
Nodes (9): 1. Контекст и цели, 2.1. Каталог заклинаний (`src/data/compendium/spells.ts`), 2.2. Движок авто-начисления заклинаний (`src/data/compendium/auto-spells-engine.ts`), 2.3. Движок интерактивных выборов при повышении уровня (`src/components/levelup/level-up-choices.ts`), 2.4. Рефакторинг `LevelUpModal.tsx` (`src/components/levelup/LevelUpModal.tsx`), 2.5. Сериализация в `handleLevelUp`, 2. Архитектура решения, 3. План верификации (+1 more)

### Community 50 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Task 1: Compendium Smite Spells & Auto-Spells Engine, Task 2: Level-Up Interactive Choices Engine, Task 3: Refactor and Create `src/components/levelup/LevelUpModal.tsx`, Task 4: Connect `LevelUpModal` in `src/app/page.tsx` & Update `handleLevelUp`, Task 5: End-to-End Verification with Playwright (Microsoft Edge), Task 6: Final Quality Gate, Graphify Sync & Remote Push, План реализации: Интерактивное повышение уровня (Level-Up) и автоматизация заклинаний D&D 5e

## Knowledge Gaps
- **312 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 369 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `LevelUpModal.tsx`, `CharacterCreationWizardModal.tsx`, `dnd-types.ts`, `app/page.tsx`, `dnd-icons.tsx`, `CompendiumModals.tsx`, `NameGeneratorModal.tsx`, `ItemDetailModal.tsx`, `ClassSelectorModal.tsx`, `CharacterGridModal.tsx`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `@supabase/ssr` connect `@supabase/ssr` to `package.json`, `dnd-types.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _312 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.025974025974025976 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.027777777777777776 - nodes in this community are weakly interconnected._
- **Should `LevelUpModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09472606246799795 - nodes in this community are weakly interconnected._