# Graph Report - dnd5e-character-sheet  (2026-09-22)

## Corpus Check
- 240 files · ~534,350 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1461 nodes · 3362 edges · 108 communities (81 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9a48ed9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- dependencies
- LevelUpModal.tsx
- dnd-types.ts
- export-docx/route.ts
- characters/route.ts
- parse-dndsu-feats.ts
- compilerOptions
- 2. Архитектура и структура модулей
- Global Constraints
- names-data.ts
- Global Constraints
- 2. Архитектурные разделы дизайна
- equipment-types.ts
- devDependencies
- fetch-dndsu-backgrounds.ts
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
- 2. Архитектура и компонентные изменения
- 2. Архитектура решения
- Global Constraints
- Global Constraints
- dnd-icons.tsx
- css-ux-standards.test.mjs
- hit-targets.test.ts
- auth-form-and-images.test.ts
- 📜 D&D.su Class & Mechanics Parser Skill
- class-progression.ts
- pdf-export.ts
- CharacterData
- RaceSelectorModal.tsx
- EquipmentSlotModal.tsx
- useEscapeKey
- Глобальные ограничения
- Спецификация: Конструктор предметов и движок динамических магических эффектов
- modularize-races.js
- fetch-dndsu-races.ts
- 📜 Спецификация дизайна: Модульный компендиум рас D&D 5e и автогенерация choices
- backgrounds.ts
- build-spells-compendium.ts
- Дизайн: Интерактивное обучение и Большая Энциклопедия новичка D&D 5e
- ../src/components/sheet/pages/MainSheetPage.js
- react
- Global Constraints
- Global Constraints
- Global Constraints
- spells/index.ts
- level-up-arcane.test.ts
- app/page.tsx
- ClassSelectorModal.tsx
- feats.ts
- parse-dndsu-spells.ts
- Спецификация: Декомпозиция монолита page.tsx в модульную архитектуру
- Global Constraints
- escape-key-and-keyboard-rolls.test.ts
- fetch-dndsu-race-names.ts
- merge-races-compendium.ts
- encyclopedia-content.ts
- wizard-helpers.ts
- Global Constraints
- CharacterCreationWizardModal.tsx
- CharacterGridModal.tsx
- AutocompleteInput.tsx
- performance-assets.test.ts
- spells-autocomplete-internal.test.ts
- tree-shaking-compendium.test.ts
- Global Constraints
- 2026-09-14-feat-ability-bonus-choice-design.md
- races/types.ts
- DndEncyclopediaModal.tsx

## God Nodes (most connected - your core abstractions)
1. `../src/components/sheet/pages/MainSheetPage.js` - 66 edges
2. `CharacterData` - 47 edges
3. `../src/components/sheet/pages/SpellsSheetPage.js` - 45 edges
4. `useEscapeKey()` - 41 edges
5. `createDefaultCharacter()` - 39 edges
6. `DnDCharacterSheet()` - 36 edges
7. `react` - 33 edges
8. `LevelUpModal` - 31 edges
9. `formatModifier()` - 30 edges
10. `AbilityName` - 28 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `exportCharacterToPdf()`  [EXTRACTED]
  scripts/generate-sheet.ts → src/lib/pdf-export.ts
- `applyLevelDown()` --calls--> `getSpellSlotsForClassLevel()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/data/compendium/class-progression.ts
- `applyLevelDown()` --calls--> `getSpellSlotsForClassLevel()`  [EXTRACTED]
  test/level-up-divine.test.ts → src/data/compendium/class-progression.ts
- `applyLevelDown()` --calls--> `calcModifier()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/lib/dnd-types.ts
- `simulateLevelDown()` --calls--> `getModifier()`  [EXTRACTED]
  test/level-up-martial.test.ts → src/lib/dnd-types.ts

## Import Cycles
- None detected.

## Communities (108 total, 17 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.03
Nodes (74): name, private, version, bun-types, class-variance-authority, cmdk, date-fns, @dnd-kit/core (+66 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (74): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+66 more)

### Community 2 - "LevelUpModal.tsx"
Cohesion: 0.09
Nodes (45): LevelUpModal, BATTLE_MASTER_MANEUVERS, BLADESINGING_WEAPONS, DIVINE_AFFINITY_OPTIONS, DivineAffinityOption, DRACONIC_ANCESTRY_OPTIONS, DraconicAncestryOption, ELDRITCH_INVOCATIONS (+37 more)

### Community 3 - "dnd-types.ts"
Cohesion: 0.11
Nodes (37): DnDCharacterSheet(), fetchShare(), RestModal(), TemplateModal, StatsCalculatorModal(), applyLongRest(), applyRaceTemplate(), applyShortRest() (+29 more)

### Community 4 - "export-docx/route.ts"
Cohesion: 0.24
Nodes (23): docx, main(), borders(), dCell(), hCell(), isSafeImageUrl(), normalizeCharacter(), POST() (+15 more)

### Community 5 - "characters/route.ts"
Cohesion: 0.08
Nodes (23): @supabase/ssr, createClient(), DELETE(), GET(), getAuthenticatedUser(), isValidUUID(), POST(), PUT() (+15 more)

### Community 6 - "parse-dndsu-feats.ts"
Cohesion: 0.21
Nodes (16): CACHE_DIR, cleanText(), COMPENDIUM_FEATS_FILE, CompendiumFeat, crawlAllFeats(), detectAbilityBonus(), ensureDirs(), FeatCatalogItem (+8 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "2. Архитектура и структура модулей"
Cohesion: 0.18
Nodes (10): 1. Цель и контекст, 2.1. Новый модуль данных: `src/data/compendium/warlock-choices.ts`, 2.2. Обновление подклассов в `src/data/compendium/classes.ts`, 2.3. Расширенный список заклинаний покровителя в `src/data/compendium/class-spells.ts`, 2.4. Движок интерактивных выборов `src/components/levelup/level-up-choices.ts`, 2.5. Мастер создания персонажа `CharacterCreationWizardModal.tsx`, 2.6. Модальное окно повышения уровня `LevelUpModal.tsx`, 2. Архитектура и структура модулей (+2 more)

### Community 9 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Task 1: Глобальная материальность пергамента, тени и тактильные нажатия, Task 2: Пружинная физика и кинематика бросков d20 (`RollResultPopup`), Task 3: Скользящий индикатор переключения вкладок (Sliding Tab Indicator), Task 4: Разгрузка шапки — средневековое выпадающее меню «Бланк», Task 5: Атмосферные средневековые пустые состояния (Alive Empty States), Task 6: Комплексная E2E-верификация в Playwright Microsoft Edge, План реализации: Премиальные дизайн-улучшения D&D 5e Character Sheet

### Community 10 - "names-data.ts"
Cohesion: 0.18
Nodes (15): NameGeneratorModal(), DND_COMPENDIUM_NAMES_DB, FANTASY_NAMES_DATABASE, FantasyNameResult, generateFantasyName(), generateMultipleFantasyNames(), generateRaceFantasyName(), getAvailableCultures() (+7 more)

### Community 11 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Task 1: Comprehensive Warlock Choices Database (`src/data/compendium/warlock-choices.ts`), Task 2: Full 9 Subclasses Expansion in `classes.ts` & `class-progression.ts`, Task 3: Interactive Choices Engine Expansion (`level-up-choices.ts` & `auto-spells-engine.ts`), Task 4: Character Creation Wizard Support (`CharacterCreationWizardModal.tsx`), Task 5: Level-Up Modal Interactive UI & Serialization (`LevelUpModal.tsx`), Task 6: Comprehensive Verification & E2E Testing, Warlock (Колдун) 1–20 Level-Up & Subclasses Deepening Implementation Plan

### Community 12 - "2. Архитектурные разделы дизайна"
Cohesion: 0.22
Nodes (8): 1. Контекст и цели, 2.1. Физика бросков d20 и тактильный отклик (Spring Physics & Tactility), 2.2. Архитектурная разгрузка шапки (Header De-Cluttering & Vintage Menu), 2.3. Слоистая глубина пергамента и золотое тиснение (Materiality & Shadows), 2.4. Атмосферные пустые состояния (Alive Empty States), 2. Архитектурные разделы дизайна, 3. План верификации и безопасность изменений, Спецификация: Премиальные дизайн-улучшения D&D 5e Character Sheet (по мотивам Taste-Skill & GPT-Taste)

### Community 13 - "equipment-types.ts"
Cohesion: 0.13
Nodes (30): EquipmentPaperDoll, EquipmentPaperDoll(), EquipmentSlotModalProps, canToggleWeaponGrip(), applyClassTemplate(), createDefaultCharacter(), getEffectiveSpeed(), normalizeAbilityName() (+22 more)

### Community 14 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, bun-types, cheerio, eslint, eslint-config-next, @playwright/test, puppeteer-core, tailwindcss (+6 more)

### Community 15 - "fetch-dndsu-backgrounds.ts"
Cohesion: 0.08
Nodes (36): cheerio, CLASS_SLUGS, ClassEquipmentChoice, ClassStartingEquipmentData, cleanEquipmentText(), fetchAllClassEquipment(), parseEquipmentHtml(), parseEquipmentListItem() (+28 more)

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
Cohesion: 0.12
Nodes (16): 1.1. Цветовая палитра (Категорический запрет на случайные цвета), 🎨 1. Единая Дизайн-Система (Parchment Medieval Theme), 2.1. Векторные двухцветные D&D-иконки (`@/components/dnd-icons`), 2.2. Текстовые эмодзи, 🗡️ 2. Стандарты Иконографики и Эмодзи, 📝 3. Стандарты Компонентов Форм, ⚔️ 4. Архитектура и Качество Кода, 🚀 5. Регламент Сборки и Git (ОБЯЗАТЕЛЬНЫЙ GIT PUSH) (+8 more)

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

### Community 52 - "dnd-icons.tsx"
Cohesion: 0.15
Nodes (22): RestModal, CompendiumBookIcon(), CrownRulerIcon(), DeviceStoneIcon(), EyeMysticIcon(), GoldSealCheckIcon(), HeartGemIcon(), IconProps (+14 more)

### Community 53 - "css-ux-standards.test.mjs"
Cohesion: 0.40
Nodes (4): cssContent, cssPath, __dirname, __filename

### Community 54 - "hit-targets.test.ts"
Cohesion: 0.33
Nodes (5): __dirname, __filename, mainPagePath, pagePath, primitivesPath

### Community 55 - "auth-form-and-images.test.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, rootDir

### Community 62 - "📜 D&D.su Class & Mechanics Parser Skill"
Cohesion: 0.33
Nodes (5): 📜 D&D.su Class & Mechanics Parser Skill, Examples:, 🚀 How to Execute, 🎯 Implementation Workflow for Character Sheet, 📋 What the Output Contains

### Community 63 - "class-progression.ts"
Cohesion: 0.09
Nodes (36): ARTIFICER_SPELL_SLOTS, BARD_SPELLS_KNOWN, CLASS_CANTRIPS_PROGRESSION, CLASS_NAME_MAP, CLASS_SPELLS_KNOWN_TABLES, ClassFeatureEntry, ClassLevelProgression, getCantripsKnownForLevel() (+28 more)

### Community 64 - "pdf-export.ts"
Cohesion: 0.15
Nodes (14): pdf-lib, normalizeCharacter(), POST(), CodexItem, createParchmentPage(), drawPageFooter(), PdfExportOptions, renderCodexPages() (+6 more)

### Community 65 - "CharacterData"
Cohesion: 0.09
Nodes (35): SpellsSheetPage, AutocompleteItem, EquipmentPaperDollProps, RestModalProps, LevelUpModalProps, LevelDownModalProps, LevelHistoryModalProps, NonClassSpellConfirmModalProps (+27 more)

### Community 66 - "RaceSelectorModal.tsx"
Cohesion: 0.19
Nodes (9): RaceSelectorModal, CATEGORIES, RaceSelectorModal(), RaceSelectorModalProps, DND_COMPENDIUM_RACES, findRaceByName(), CompendiumSubrace, RaceCategory (+1 more)

### Community 67 - "EquipmentSlotModal.tsx"
Cohesion: 0.14
Nodes (18): EFFECT_TYPES, EquipmentSlotModal(), formatEffectBadge(), ITEM_RARITIES, SLOT_PRESETS, DND_COMPENDIUM_ITEMS, DND_WEAPON_COMPENDIUM_ITEMS, findItemByName() (+10 more)

### Community 68 - "useEscapeKey"
Cohesion: 0.13
Nodes (18): SpellDetailModal, TraitDetailModal, WeaponDetailModal, SpellDetailModal(), SpellModalProps, TraitDetailModal(), TraitModalProps, WeaponDetailModal() (+10 more)

### Community 69 - "Глобальные ограничения"
Cohesion: 0.14
Nodes (13): Глобальные ограничения, Задача 10: Батч 7 — Сеттинги Ravnica, Theros, Eberron и Ravenloft (8 рас), Задача 11: Финальная интеграция, аудит визарда и пуш, Задача 1: Модуляризация файловой структуры рас (Zero-Regression), Задача 2: Создание скрипта слияния и генератора choices с батчами и dry-run, Задача 3: Создание состязательного теста валидности компендиума рас, Задача 4: Батч 1 — MPMM Ревизии классических рас (5 рас), Задача 5: Батч 2 — MPMM Экзотические ревизии (5 рас) (+5 more)

### Community 70 - "Спецификация: Конструктор предметов и движок динамических магических эффектов"
Cohesion: 0.14
Nodes (13): 1. Обзор и цели, 2.1. Типы эффектов (`ItemEffect`), 2.2. Расширение структуры предмета (`EquippedItem`), 2.3. Хранение в объекте персонажа (`CharacterData`), 2. Архитектура модели данных, 3.1. Вкладка «Свой предмет» в `EquipmentSlotModal.tsx`, 3.2. Отображение сохраненных предметов персонажа, 3. Пользовательский интерфейс: Конструктор предмета (+5 more)

### Community 71 - "modularize-races.js"
Cohesion: 0.18
Nodes (9): coreRaces, { DND_COMPENDIUM_RACES }, endTypes, fs, multiverseRaces, path, srcFile, startTypes (+1 more)

### Community 72 - "fetch-dndsu-races.ts"
Cohesion: 0.22
Nodes (16): cleanText(), extractFeatureFromElement(), fetchRaceCatalogue(), formatRaceMarkdown(), isOfficialSource(), main(), OFFICIAL_WOTC_SOURCES, parseAbilityBonus() (+8 more)

### Community 73 - "📜 Спецификация дизайна: Модульный компендиум рас D&D 5e и автогенерация choices"
Cohesion: 0.25
Nodes (7): 1. Цель и контекст, 2. Архитектура файлов и модулей, 3. Правила определения `choices: RaceChoicesConfig`, 4. Скрипт слияния (`scripts/merge-races-compendium.ts`), 5. План верификации, Ключевые требования:, 📜 Спецификация дизайна: Модульный компендиум рас D&D 5e и автогенерация choices

### Community 74 - "backgrounds.ts"
Cohesion: 0.24
Nodes (5): BackgroundSkillResolutionParams, CompendiumBackground, DND_COMPENDIUM_BACKGROUNDS, ALL_SKILLS, SkillName

### Community 75 - "build-spells-compendium.ts"
Cohesion: 0.20
Nodes (14): CACHE_FILE, capitalize(), EXTRA_PALADIN_SMITES, formatSpell(), generateIndexFile(), generateLevelFile(), generateRootSpellsFile(), generateTypesFile() (+6 more)

### Community 76 - "Дизайн: Интерактивное обучение и Большая Энциклопедия новичка D&D 5e"
Cohesion: 0.12
Nodes (16): 1. Цель, 2. Дизайн-система и правила интерфейса, 3. Производительность и Code Splitting (Zero Bundle Overhead), 4. Структура файлов и компонентов, 5. Детализация 7 Глав Энциклопедии, 6. Механика Интерактивного тура (Spotlight Tour), 7. Интеграция в лист персонажа (Data Flow & Entry Points), 8. План верификации (+8 more)

### Community 77 - "../src/components/sheet/pages/MainSheetPage.js"
Cohesion: 0.18
Nodes (19): DetailsSheetPage, WeaponModalProps, CoinsChestIcon(), UserHeroIcon(), ../src/components/sheet/pages/DetailsSheetPage.js, ../src/components/sheet/pages/MainSheetPage.js, MainSheetPageProps, CalcBadge() (+11 more)

### Community 78 - "react"
Cohesion: 0.11
Nodes (17): framer-motion, react, NameGeneratorModal, StatsCalculatorModal, SubclassSelectorModal, SubclassSelectorModal(), SubclassSelectorModalProps, SparklesDndIcon() (+9 more)

### Community 79 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Task 1: Движок слотов экипировки и модификаторов (`src/lib/equipment-types.ts`), Task 2: Интерактивный компонент куклы экипировки (`src/components/equipment/EquipmentPaperDoll.tsx`), Task 3: Интеграция куклы в лист персонажа (`src/app/page.tsx`), Интерактивная кукла экипировки (Equipment Paper Doll) Implementation Plan

### Community 80 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Custom Items and Dynamic Effects Engine Implementation Plan, Global Constraints, Task 1: Model, Data Types & Equipment Modifier Calculation Engine, Task 2: Character Sheet Real-Time Metric Integration (AC, Speed, Stats, HP, Attacks, Traits), Task 3: Equipment Slot Modal Custom Item Builder UI & Saved Custom Items List, Task 4: Verification, Adversarial Testing, Graphify Update & GitHub Push

### Community 81 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Task 1: Dual-Wield Engine, Thrown Items & Attack Generator, Task 2: Class Starting Equipment Auto-Equip, Task 3: Character Sheet UI Integration: Armor & Attacks Cleanup, Dual Roll Popup, Task 4: Verification, Lint, Tests, Graphify & Git Push, Two-Weapon Fighting, Attack Auto-Generation & Equipment Sync Implementation Plan

### Community 82 - "spells/index.ts"
Cohesion: 0.16
Nodes (15): CANTRIPS, SPELL_ALIASES, LEVEL_1_SPELLS, LEVEL_2_SPELLS, LEVEL_3_SPELLS, LEVEL_4_SPELLS, LEVEL_5_SPELLS, LEVEL_6_SPELLS (+7 more)

### Community 83 - "level-up-arcane.test.ts"
Cohesion: 0.21
Nodes (22): DND_CLASS_PROGRESSION, FULL_CASTER_SPELL_SLOTS, getClassFeaturesForLevel(), getNewSpellLevelUnlocked(), isClassASILevel(), isClassSubclassMilestone(), normalizeClassName(), CLASS_TEMPLATES (+14 more)

### Community 84 - "app/page.tsx"
Cohesion: 0.10
Nodes (35): @supabase/supabase-js, AuthModal, CreateChoiceModal, LevelDownModal, LevelHistoryModal, NonClassSpellConfirmModal, ResetModal, ShareModal (+27 more)

### Community 85 - "ClassSelectorModal.tsx"
Cohesion: 0.19
Nodes (11): ClassSelectorModal, ItemDetailModal, ClassSelectorModal(), ClassSelectorModalProps, ItemDetailModal(), ItemDetailModalProps, BackpackPackIcon(), CrossedSwordsIcon() (+3 more)

### Community 86 - "feats.ts"
Cohesion: 0.19
Nodes (13): CharacterPrereqContext, PrerequisiteCheckResult, CompendiumFeat, DND_COMPENDIUM_FEATS, findFeatByName(), getTraits(), ALTERNATE_BARBARIAN_TRAITS, BARBARIAN_EXPLOIT_TRAITS (+5 more)

### Community 87 - "parse-dndsu-spells.ts"
Cohesion: 0.15
Nodes (19): CACHE_DIR, CATALOG_CACHE_FILE, CatalogCard, cleanText(), crawlAllSpells(), DND_CLASS_ID_MAP, DND_SCHOOL_ID_MAP, DND_SOURCE_ID_MAP (+11 more)

### Community 88 - "Спецификация: Декомпозиция монолита page.tsx в модульную архитектуру"
Cohesion: 0.18
Nodes (10): 1. Проблема и Контекст, 2. Архитектурное Решение: Подход 1 (Custom Hook + Презентационные Вкладки), 3.1. `src/components/sheet/SheetUIPrimitives.tsx`, 3.2. `src/hooks/useCharacterState.ts`, 3.3. Вкладки `src/components/sheet/tabs/*.tsx`, 3. Детализация Компонентов, 4. План Безопасной Поэтапной Реализации (Zero-Regression Strategy), 5. Критерии Приемки (+2 more)

### Community 89 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Task 1: Выделение UI-атомов листа (`SheetUIPrimitives.tsx`), Task 2: Выделение вкладок боевых и магических характеристик (Tabs 1–3), Task 3: Выделение вкладок инвентаря, умений и предыстории (Tabs 4–6), Task 4: Выделение Шапки и Навигации (`SheetHeader.tsx`, `SheetNavbar.tsx`), Task 5: Выделение хука `useCharacterState.ts` и очистка `page.tsx`, Task 6: Финальная валидация, аудит верстки, актуализация графа и пуш на GitHub, Декомпозиция монолита page.tsx в модульную архитектуру — План Реализации

### Community 90 - "escape-key-and-keyboard-rolls.test.ts"
Cohesion: 0.33
Nodes (4): __dirname, __filename, KeyListener, rootDir

### Community 92 - "fetch-dndsu-race-names.ts"
Cohesion: 0.53
Nodes (5): cleanNameList(), extractNamesFromText(), main(), parseAllRacesFromCache(), ParsedRacialNames

### Community 93 - "merge-races-compendium.ts"
Cohesion: 0.24
Nodes (11): BATCH_DEFINITIONS, convertParsedToCompendium(), detectChoices(), normalizeAbilityBonuses(), ParsedRace, ParsedSubrace, ParsedTrait, parseSubraces() (+3 more)

### Community 94 - "encyclopedia-content.ts"
Cohesion: 0.24
Nodes (8): ENCYCLOPEDIA_CHAPTERS, SHEET_TOUR_STEPS, CalloutType, EncyclopediaCallout, EncyclopediaChapter, EncyclopediaSection, EncyclopediaTable, TourStep

### Community 95 - "wizard-helpers.ts"
Cohesion: 0.11
Nodes (24): ALL_ARTISAN_TOOLS, ALL_DND_LANGUAGES, BackgroundLanguageChoiceConfig, BackgroundSkillResolution, ClassLevel1ChoicesConfig, ClassSkillConfig, ClassSpellcastingLimits, DRAGON_ANCESTRIES (+16 more)

### Community 96 - "Global Constraints"
Cohesion: 0.25
Nodes (7): Global Constraints, Task 1: Структуры данных, типы и контент Энциклопедии, Task 2: Кнопка подсказки блока и Движок интерактивного тура (Spotlight Tour), Task 3: Модальное окно «Большая Энциклопедия D&D 5e» (Фолиант), Task 4: Интеграция в лист персонажа, меню и страницы, Task 5: Итоговая верификация, актуализация графа и Git Push, Интерактивное обучение и Большая Энциклопедия D&D 5e: План реализации

### Community 97 - "CharacterCreationWizardModal.tsx"
Cohesion: 0.17
Nodes (23): CharacterCreationWizardModal, DetailsSheetPage, CharacterCreationWizardModal(), calcPointBuyTotalSpent(), calcPreparedSpellsLimit(), generateFantasyName(), getBackgroundLanguageChoiceConfig(), getClassSkillConfig() (+15 more)

### Community 98 - "CharacterGridModal.tsx"
Cohesion: 0.24
Nodes (10): CharacterGridModal, CharacterGridModal, CharacterGridModalProps, formatRussianDate(), getCharAC(), getCharHP(), getCharSpecialStat(), SavedCharacter (+2 more)

### Community 99 - "AutocompleteInput.tsx"
Cohesion: 0.40
Nodes (4): AutocompleteInput(), AutocompleteInputProps, calculateDropdownPosition(), DropdownPosition

### Community 100 - "performance-assets.test.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, rootDir

### Community 101 - "spells-autocomplete-internal.test.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, rootDir

### Community 102 - "tree-shaking-compendium.test.ts"
Cohesion: 0.40
Nodes (3): __dirname, __filename, rootDir

### Community 104 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Task 1: Feat Ability Bonus Engine & Unit Tests (TDD), Task 2: LevelUpModal Feat Ability Choice Integration, Task 3: Character Sheet Level Up & Level Down Handlers (`page.tsx`), Task 4: Character Creation Wizard Feat Choice Integration, Task 5: Full Regression, Adversarial Verification & Git Push

### Community 105 - "2026-09-14-feat-ability-bonus-choice-design.md"
Cohesion: 0.50
Nodes (3): Архитектурные принципы, Модули, Цель

### Community 107 - "races/types.ts"
Cohesion: 0.22
Nodes (12): RacialChoicesConfig, CORE_RACES, MULTIVERSE_RACES, SUPPLEMENT_RACES, CompendiumRace, MagicClass, RaceCantripChoiceConfig, RaceCustomFeatureChoiceConfig (+4 more)

### Community 109 - "DndEncyclopediaModal.tsx"
Cohesion: 0.14
Nodes (12): DndEncyclopediaModal, InteractiveSheetTour, D20Icon(), HourglassIcon(), InfoSealIcon(), BlockHelpButton, BlockHelpButtonProps, DndEncyclopediaModal (+4 more)

## Knowledge Gaps
- **586 isolated node(s):** `SCREENSHOT_DIR`, `eslintConfig`, `nextConfig`, `name`, `version` (+581 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 682 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `CharacterData`, `RaceSelectorModal.tsx`, `AutocompleteInput.tsx`, `useEscapeKey`, `EquipmentSlotModal.tsx`, `LevelUpModal.tsx`, `CharacterGridModal.tsx`, `CharacterCreationWizardModal.tsx`, `DndEncyclopediaModal.tsx`, `equipment-types.ts`, `../src/components/sheet/pages/MainSheetPage.js`, `app/page.tsx`, `ClassSelectorModal.tsx`, `dnd-icons.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `cheerio` connect `fetch-dndsu-backgrounds.ts` to `package.json`, `fetch-dndsu-races.ts`, `parse-dndsu-feats.ts`, `parse-dndsu-spells.ts`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `SCREENSHOT_DIR`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _586 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.02666666666666667 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.02702702702702703 - nodes in this community are weakly interconnected._
- **Should `LevelUpModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0899854862119013 - nodes in this community are weakly interconnected._