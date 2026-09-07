# Graph Report - dnd5e-character-sheet  (2026-09-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 542 nodes · 1189 edges · 32 communities (20 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21dada3f`
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
- StatsCalculatorModal.tsx
- CompendiumModals.tsx
- ItemDetailModal.tsx
- devDependencies
- ClassSelectorModal.tsx
- scripts
- next
- feats.ts
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

## God Nodes (most connected - your core abstractions)
1. `DnDCharacterSheet()` - 33 edges
2. `POST()` - 21 edges
3. `getModifier()` - 19 edges
4. `LevelUpModal` - 19 edges
5. `CharacterData` - 18 edges
6. `compilerOptions` - 17 edges
7. `calcModifier()` - 15 edges
8. `SharedCharacterPage()` - 15 edges
9. `react` - 15 edges
10. `AbilityName` - 14 edges

## Surprising Connections (you probably didn't know these)
- `applyLevelDown()` --calls--> `calcModifier()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/lib/dnd-types.ts
- `simulateLevelDown()` --calls--> `getModifier()`  [EXTRACTED]
  test/level-up-martial.test.ts → src/lib/dnd-types.ts
- `SpellModalProps` --references--> `DndSpell`  [EXTRACTED]
  src/components/compendium/CompendiumModals.tsx → src/data/compendium/spells.ts
- `applyLevelDown()` --calls--> `getSpellSlotsForClassLevel()`  [EXTRACTED]
  test/level-up-arcane.test.ts → src/data/compendium/class-progression.ts
- `applyLevelDown()` --calls--> `getSpellSlotsForClassLevel()`  [EXTRACTED]
  test/level-up-divine.test.ts → src/data/compendium/class-progression.ts

## Import Cycles
- None detected.

## Communities (32 total, 11 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.03
Nodes (76): name, private, version, bun-types, class-variance-authority, cmdk, date-fns, @dnd-kit/core (+68 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (72): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+64 more)

### Community 2 - "level-up-arcane.test.ts"
Cohesion: 0.10
Nodes (46): LevelUpModal, ARTIFICER_SPELL_SLOTS, CLASS_NAME_MAP, ClassFeatureEntry, ClassLevelProgression, DND_CLASS_PROGRESSION, FULL_CASTER_SPELL_SLOTS, getClassFeaturesForLevel() (+38 more)

### Community 3 - "CharacterCreationWizardModal.tsx"
Cohesion: 0.10
Nodes (39): CATEGORIES, RaceSelectorModal(), RaceSelectorModalProps, UserHeroIcon(), StatsCalculatorModalProps, CharacterCreationWizardModal(), calcPointBuyTotalSpent(), calcPreparedSpellsLimit() (+31 more)

### Community 4 - "dnd-types.ts"
Cohesion: 0.15
Nodes (39): borders(), dCell(), hCell(), isSafeImageUrl(), normalizeCharacter(), POST(), sectionHeader(), textPara() (+31 more)

### Community 5 - "@supabase/ssr"
Cohesion: 0.11
Nodes (15): @supabase/ssr, createClient(), DELETE(), GET(), isValidUUID(), POST(), PUT(), createClient() (+7 more)

### Community 6 - "app/page.tsx"
Cohesion: 0.10
Nodes (17): AuthModal, getThirdCasterSpellSlots(), LevelDownModal, LevelHistoryModal, RollBadge, rollD20(), RollResult, RollResultPopup (+9 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "CharacterGridModal.tsx"
Cohesion: 0.14
Nodes (16): LevelDownModalProps, LevelHistoryModalProps, LevelUpModalProps, NonClassSpellConfirmModalProps, MysticCloudIcon(), CharacterGridModal, CharacterGridModalProps, formatRussianDate() (+8 more)

### Community 9 - "dnd-icons.tsx"
Cohesion: 0.16
Nodes (14): ArcaneLinkIcon(), CameraPortraitIcon(), ChestIcon(), CoinsChestIcon(), CrystalBallDndIcon(), GoldSealCheckIcon(), HourglassIcon(), IconProps (+6 more)

### Community 10 - "NameGeneratorModal.tsx"
Cohesion: 0.24
Nodes (13): QuillIcon(), NameGeneratorModal(), NameGeneratorModalProps, DND_COMPENDIUM_NAMES_DB, FANTASY_NAMES_DATABASE, FantasyNameResult, generateFantasyName(), generateMultipleFantasyNames() (+5 more)

### Community 11 - "StatsCalculatorModal.tsx"
Cohesion: 0.14
Nodes (9): react, AutocompleteInput(), AutocompleteInputProps, AutocompleteItem, D20Icon(), CalculatorTab, POINT_BUY_COST, STANDARD_ARRAY_VALUES (+1 more)

### Community 12 - "CompendiumModals.tsx"
Cohesion: 0.19
Nodes (11): SpellDetailModal(), SpellModalProps, TraitDetailModal(), TraitModalProps, WeaponDetailModal(), WeaponModalProps, SpellbookIcon(), DND_TRAITS (+3 more)

### Community 13 - "ItemDetailModal.tsx"
Cohesion: 0.22
Nodes (9): ItemDetailModal(), ItemDetailModalProps, BackpackPackIcon(), CompendiumItem, DND_COMPENDIUM_ITEMS, findItemByName(), getWeaponItems(), DND_WEAPONS (+1 more)

### Community 14 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, bun-types, eslint, eslint-config-next, puppeteer-core, tailwindcss, @tailwindcss/postcss, tsx (+4 more)

### Community 15 - "ClassSelectorModal.tsx"
Cohesion: 0.21
Nodes (10): ClassSelectorModal(), ClassSelectorModalProps, SubclassSelectorModal(), SubclassSelectorModalProps, CrossedSwordsIcon(), EngravedShieldIcon(), ScrollIcon(), SparklesDndIcon() (+2 more)

### Community 16 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:generate, db:migrate, db:push, db:reset, dev, lint (+2 more)

### Community 17 - "next"
Cohesion: 0.22
Nodes (4): nextConfig, next, jsonLd, metadata

### Community 19 - "mobile-visual-audit.mjs"
Cohesion: 0.50
Nodes (4): puppeteer-core, OUT_DIR, run(), waitForServer()

### Community 21 - "tailwind.config.ts"
Cohesion: 0.50
Nodes (3): tailwindcss, tailwindcss-animate, config

## Knowledge Gaps
- **226 isolated node(s):** `NameGeneratorModalProps`, `RaceNamingCulture`, `RaceNamingEntry`, `AutocompleteInputProps`, `CalculatorTab` (+221 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 265 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `StatsCalculatorModal.tsx` to `package.json`, `CharacterCreationWizardModal.tsx`, `dnd-types.ts`, `app/page.tsx`, `CharacterGridModal.tsx`, `dnd-icons.tsx`, `NameGeneratorModal.tsx`, `CompendiumModals.tsx`, `ItemDetailModal.tsx`, `ClassSelectorModal.tsx`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._
- **Why does `@supabase/ssr` connect `@supabase/ssr` to `package.json`, `dnd-types.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `NameGeneratorModalProps`, `RaceNamingCulture`, `RaceNamingEntry` to the rest of the system?**
  _226 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.025974025974025976 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.027777777777777776 - nodes in this community are weakly interconnected._
- **Should `level-up-arcane.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10482180293501048 - nodes in this community are weakly interconnected._