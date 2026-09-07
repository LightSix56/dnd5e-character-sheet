# Graph Report - dnd5e-character-sheet  (2026-09-07)

## Corpus Check
- 83 files · ~979,939 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 646 nodes · 1287 edges · 46 communities (27 shown, 18 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd1a3b9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- dependencies
- level-up-arcane.test.ts
- CharacterCreationWizardModal.tsx
- dnd-types.ts
- @supabase/ssr
- app/page.tsx
- compilerOptions
- CharacterGridModal.tsx
- dnd-icons.tsx
- NameGeneratorModal.tsx
- react
- CompendiumModals.tsx
- ItemDetailModal.tsx
- devDependencies
- classes.ts
- scripts
- next
- Proposed Changes
- desktop-laptop-audit.mjs
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
- feats.ts

## God Nodes (most connected - your core abstractions)
1. `DnDCharacterSheet()` - 33 edges
2. `POST()` - 21 edges
3. `LevelUpModal` - 19 edges
4. `getModifier()` - 19 edges
5. `CharacterData` - 18 edges
6. `compilerOptions` - 17 edges
7. `react` - 15 edges
8. `SharedCharacterPage()` - 15 edges
9. `calcModifier()` - 15 edges
10. `CharacterCreationWizardModal()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `applyLevelDown()` --calls--> `calcModifier()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/lib/dnd-types.ts
- `simulateLevelDown()` --calls--> `getModifier()`  [EXTRACTED]
  test/level-up-martial.test.ts → src/lib/dnd-types.ts
- `applyLevelDown()` --calls--> `getSpellSlotsForClassLevel()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/data/compendium/class-progression.ts
- `applyLevelDown()` --calls--> `getSpellSlotsForClassLevel()`  [EXTRACTED]
  test/level-up-divine.test.ts → src/data/compendium/class-progression.ts
- `applyLevelDown()` --calls--> `getHitDieSize()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/lib/dnd-types.ts

## Import Cycles
- None detected.

## Communities (46 total, 18 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.03
Nodes (76): name, private, version, bun-types, class-variance-authority, cmdk, date-fns, @dnd-kit/core (+68 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (72): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+64 more)

### Community 2 - "level-up-arcane.test.ts"
Cohesion: 0.11
Nodes (45): getThirdCasterSpellSlots(), LevelUpModal, ARTIFICER_SPELL_SLOTS, CLASS_NAME_MAP, ClassFeatureEntry, ClassLevelProgression, DND_CLASS_PROGRESSION, FULL_CASTER_SPELL_SLOTS (+37 more)

### Community 3 - "CharacterCreationWizardModal.tsx"
Cohesion: 0.12
Nodes (33): CATEGORIES, RaceSelectorModal(), RaceSelectorModalProps, UserHeroIcon(), StatsCalculatorModalProps, CharacterCreationWizardModal(), calcPointBuyTotalSpent(), calcPreparedSpellsLimit() (+25 more)

### Community 4 - "dnd-types.ts"
Cohesion: 0.13
Nodes (45): borders(), dCell(), hCell(), isSafeImageUrl(), normalizeCharacter(), POST(), sectionHeader(), textPara() (+37 more)

### Community 5 - "@supabase/ssr"
Cohesion: 0.09
Nodes (18): @supabase/ssr, createClient(), DELETE(), GET(), isValidUUID(), POST(), PUT(), GET() (+10 more)

### Community 6 - "app/page.tsx"
Cohesion: 0.10
Nodes (18): AuthModal, LevelDownModal, LevelHistoryModal, RollBadge, rollD20(), RollResult, RollResultPopup, SignOutModal (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "CharacterGridModal.tsx"
Cohesion: 0.15
Nodes (15): LevelDownModalProps, LevelHistoryModalProps, LevelUpModalProps, MysticCloudIcon(), CharacterGridModal, CharacterGridModalProps, formatRussianDate(), getCharAC() (+7 more)

### Community 9 - "dnd-icons.tsx"
Cohesion: 0.16
Nodes (14): ArcaneLinkIcon(), CameraPortraitIcon(), ChestIcon(), CoinsChestIcon(), CrystalBallDndIcon(), GoldSealCheckIcon(), HourglassIcon(), IconProps (+6 more)

### Community 10 - "NameGeneratorModal.tsx"
Cohesion: 0.22
Nodes (13): QuillIcon(), NameGeneratorModal(), NameGeneratorModalProps, DND_COMPENDIUM_NAMES_DB, FANTASY_NAMES_DATABASE, FantasyNameResult, generateFantasyName(), generateMultipleFantasyNames() (+5 more)

### Community 11 - "react"
Cohesion: 0.33
Nodes (4): react, AutocompleteInput(), AutocompleteInputProps, AutocompleteItem

### Community 12 - "CompendiumModals.tsx"
Cohesion: 0.17
Nodes (13): NonClassSpellConfirmModalProps, SpellDetailModal(), SpellModalProps, TraitDetailModal(), TraitModalProps, WeaponDetailModal(), WeaponModalProps, SpellbookIcon() (+5 more)

### Community 13 - "ItemDetailModal.tsx"
Cohesion: 0.22
Nodes (9): ItemDetailModal(), ItemDetailModalProps, BackpackPackIcon(), CompendiumItem, DND_COMPENDIUM_ITEMS, findItemByName(), getWeaponItems(), DND_WEAPONS (+1 more)

### Community 14 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, bun-types, eslint, eslint-config-next, @playwright/test, puppeteer-core, tailwindcss, @tailwindcss/postcss (+5 more)

### Community 15 - "classes.ts"
Cohesion: 0.20
Nodes (14): ClassSelectorModal(), ClassSelectorModalProps, SubclassSelectorModal(), SubclassSelectorModalProps, CrossedSwordsIcon(), EngravedShieldIcon(), ScrollIcon(), SparklesDndIcon() (+6 more)

### Community 16 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:generate, db:migrate, db:push, db:reset, dev, lint (+4 more)

### Community 17 - "next"
Cohesion: 0.22
Nodes (4): nextConfig, next, jsonLd, metadata

### Community 18 - "Proposed Changes"
Cohesion: 0.09
Nodes (21): 1. Глобальные стили (Design System Foundation), 2. Мастер создания персонажа (Wizard Domain), 3. Инструменты и калькуляторы (Tools Domain), 4. Компендиум и страница шеринга (Compendium & Share Domain), 5. Главный лист персонажа (Main Sheet Domain), Automated Tests, [MODIFY] [CharacterCreationWizardModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/wizard/CharacterCreationWizardModal.tsx), [MODIFY] [CharacterGridModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/tools/CharacterGridModal.tsx) (+13 more)

### Community 19 - "desktop-laptop-audit.mjs"
Cohesion: 0.24
Nodes (9): puppeteer-core, clickButtonWithText(), OUT_DIR, run(), VIEWPORTS, waitForServer(), OUT_DIR, run() (+1 more)

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

## Knowledge Gaps
- **287 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+282 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 339 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `CharacterCreationWizardModal.tsx`, `dnd-types.ts`, `app/page.tsx`, `CharacterGridModal.tsx`, `dnd-icons.tsx`, `NameGeneratorModal.tsx`, `CompendiumModals.tsx`, `ItemDetailModal.tsx`, `classes.ts`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `@supabase/ssr` connect `@supabase/ssr` to `package.json`, `dnd-types.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _287 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.025974025974025976 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.027777777777777776 - nodes in this community are weakly interconnected._
- **Should `level-up-arcane.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10588235294117647 - nodes in this community are weakly interconnected._