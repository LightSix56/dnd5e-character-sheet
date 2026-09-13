# Декомпозиция монолита page.tsx в модульную архитектуру — План Реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Безопасно разбить гигантский файл `src/app/page.tsx` (4790 строк) на изолированные переиспользуемые модули в `src/components/sheet/` и хук `src/hooks/useCharacterState.ts` со 100% сохранением визуального стиля, верстки и функционала.

**Architecture:** Выделение презентационных компонентов вкладок (`src/components/sheet/tabs/`), атомарных UI-компонентов (`SheetUIPrimitives.tsx`), шапки и навигации (`SheetHeader.tsx`, `SheetNavbar.tsx`), а также хука управления состоянием (`useCharacterState.ts`). Корневой `page.tsx` становится компактным оркестратором (~250–350 строк).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Supabase client.

**Spec:** `docs/superpowers/specs/2026-09-13-page-decomposition-design.md`

## Global Constraints
- Сохранить 100% визуальное соответствие («пиксель-в-пиксель»): те же CSS-классы, цвета пергамента, отступы и анимации.
- Никаких случайных изменений логики правил D&D 5e: формулы КД, характеристик, бросков и заклинаний не изменяются.
- 0 ошибок компиляции TypeScript: `npx tsc --noEmit`.
- 0 ошибок линтера: `npx eslint .`.
- 100% прохождение состязательного набора тестов: `npm run test:adversarial` (388+ тестов).
- Обязательная актуализация графа: `graphify update .`.
- Обязательный коммит и пуш на GitHub в конце каждого крупного этапа.

---

### Task 1: Выделение UI-атомов листа (`SheetUIPrimitives.tsx`)

**Files:**
- Create: `src/components/sheet/SheetUIPrimitives.tsx`
- Test: `test/sheet-ui-primitives.test.ts`
- Modify: `src/app/page.tsx:60-220`

**Interfaces:**
- Produces:
  - `rollD20(): number`
  - `interface RollResult { dieResult: number; modifier: number; total: number; label: string; breakdown?: string; customTotal?: string; }`
  - `RollResultPopup: React.FC<{ result: RollResult; onClose: () => void }>`
  - `RollBadge: React.FC<{ value: string | number; label?: string; modifier: number; onRoll: (result: RollResult) => void }>`
  - `CalcBadge: React.FC<{ value: string | number; label?: string }>`
  - `StatInput: React.FC<{ label: string; value: string | number; onChange: (v: any) => void; type?: string; placeholder?: string; className?: string }>`
  - `CustomDropdown: React.FC<{ value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; className?: string }>`

- [ ] **Step 1: Написать модульный тест для UI-примитивов и rollD20**
Создать `test/sheet-ui-primitives.test.ts`, проверяющий диапазон `rollD20` (1..20), отсутствие NaN, и корректность структуры `RollResult`.

- [ ] **Step 2: Запустить тест и убедиться в падении**
`npx tsx --test test/sheet-ui-primitives.test.ts` (файл `SheetUIPrimitives.tsx` еще не существует).

- [ ] **Step 3: Создать `src/components/sheet/SheetUIPrimitives.tsx`**
Перенести из `page.tsx` функции `rollD20`, `CalcBadge`, `RollResultPopup`, `RollBadge`, `StatInput`, `CustomDropdown`.

- [ ] **Step 4: Импортировать примитивы в `src/app/page.tsx` и удалить дублирующиеся объявления**

- [ ] **Step 5: Запустить тесты и tsc**
`npx tsx --test test/sheet-ui-primitives.test.ts && npx tsc --noEmit` — должны пройти без ошибок.

- [ ] **Step 6: Закоммитить этап 1**
`git add src/components/sheet/SheetUIPrimitives.tsx test/sheet-ui-primitives.test.ts src/app/page.tsx && git commit -m "refactor: extract SheetUIPrimitives from page.tsx"`

---

### Task 2: Выделение вкладок боевых и магических характеристик (Tabs 1–3)

**Files:**
- Create: `src/components/sheet/tabs/CoreStatsTab.tsx`
- Create: `src/components/sheet/tabs/CombatTab.tsx`
- Create: `src/components/sheet/tabs/SpellsTab.tsx`
- Test: `test/sheet-tabs-stats-combat-spells.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `CharacterData`, `SheetUIPrimitives`, `equipment-types`, `dnd-types`
- Produces:
  - `CoreStatsTab: React.FC<CoreStatsTabProps>`
  - `CombatTab: React.FC<CombatTabProps>`
  - `SpellsTab: React.FC<SpellsTabProps>`

- [ ] **Step 1: Создать тест рендеринга и контрактов пропсов для вкладок 1-3**
Создать `test/sheet-tabs-stats-combat-spells.test.ts` с проверкой экспортов и типов.

- [ ] **Step 2: Реализовать `CoreStatsTab.tsx`**
Перенести верстку вкладки 1 (Характеристики, КД, Скорость, Хиты, Кости хитов, Спасброски, Навыки, Пассивные чувства, Перегрузка, Прыжки).

- [ ] **Step 3: Реализовать `CombatTab.tsx`**
Перенести верстку вкладки 2 (Атаки оружием, Парный бой, Боевые действия, Бонусные действия, Реакции).

- [ ] **Step 4: Реализовать `SpellsTab.tsx`**
Перенести верстку вкладки 3 (Параметры заклинателя, Сл, Атака, Бонус урона, Ячейки 1-9 уровней, Подготовленные заклинания, Списки заклинаний по кругам).

- [ ] **Step 5: Подключить вкладки 1-3 в `src/app/page.tsx`**
Заменить инлайн-разметку в `page.tsx` вызовами `<CoreStatsTab ... />`, `<CombatTab ... />`, `<SpellsTab ... />`.

- [ ] **Step 6: Проверить компиляцию и тесты**
`npx tsc --noEmit && npx tsx --test test/sheet-tabs-stats-combat-spells.test.ts`

- [ ] **Step 7: Закоммитить этап 2**
`git add src/components/sheet/tabs/ test/ src/app/page.tsx && git commit -m "refactor: extract CoreStatsTab, CombatTab, SpellsTab"`

---

### Task 3: Выделение вкладок инвентаря, умений и предыстории (Tabs 4–6)

**Files:**
- Create: `src/components/sheet/tabs/EquipmentTab.tsx`
- Create: `src/components/sheet/tabs/TraitsTab.tsx`
- Create: `src/components/sheet/tabs/BioTab.tsx`
- Test: `test/sheet-tabs-equip-traits-bio.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces:
  - `EquipmentTab: React.FC<EquipmentTabProps>`
  - `TraitsTab: React.FC<TraitsTabProps>`
  - `BioTab: React.FC<BioTabProps>`

- [ ] **Step 1: Создать тест рендеринга и контрактов для вкладок 4-6**
Создать `test/sheet-tabs-equip-traits-bio.test.ts`.

- [ ] **Step 2: Реализовать `EquipmentTab.tsx`**
Перенести верстку вкладки 4 (Инвентарь, Кнопка открытия Куклы экипировки, Монетница, Список снаряжения).

- [ ] **Step 3: Реализовать `TraitsTab.tsx`**
Перенести верстку вкладки 5 (Классовые умения, Расовые особенности, Черты, Эффекты магических предметов).

- [ ] **Step 4: Реализовать `BioTab.tsx`**
Перенести верстку вкладки 6 (Черты характера, Идеалы, Привязанности, Слабости, Внешность, Предыстория, Заметки).

- [ ] **Step 5: Подключить вкладки 4-6 в `src/app/page.tsx`**

- [ ] **Step 6: Проверить компиляцию и тесты**
`npx tsc --noEmit && npx tsx --test test/sheet-tabs-equip-traits-bio.test.ts`

- [ ] **Step 7: Закоммитить этап 3**
`git add src/components/sheet/tabs/ test/ src/app/page.tsx && git commit -m "refactor: extract EquipmentTab, TraitsTab, BioTab"`

---

### Task 4: Выделение Шапки и Навигации (`SheetHeader.tsx`, `SheetNavbar.tsx`)

**Files:**
- Create: `src/components/sheet/SheetHeader.tsx`
- Create: `src/components/sheet/SheetNavbar.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces:
  - `SheetHeader: React.FC<SheetHeaderProps>`
  - `SheetNavbar: React.FC<SheetNavbarProps>`

- [ ] **Step 1: Реализовать `SheetHeader.tsx`**
Перенести верхнюю плашку персонажа (Аватар, Имя, Раса, Класс, Подкласс, Уровень, Предыстория, Кнопки Отдыха, Level-Up, Смертельные спасброски, Вдохновение).

- [ ] **Step 2: Реализовать `SheetNavbar.tsx`**
Перенести переключатель вкладок с плавающим индикатором Framer Motion `layoutId="activeTabIndicator"`.

- [ ] **Step 3: Подключить `SheetHeader` и `SheetNavbar` в `src/app/page.tsx`**

- [ ] **Step 4: Проверить компиляцию и E2E/Adversarial**
`npx tsc --noEmit && npm run test:adversarial`

- [ ] **Step 5: Закоммитить этап 4**
`git add src/components/sheet/ src/app/page.tsx && git commit -m "refactor: extract SheetHeader and SheetNavbar"`

---

### Task 5: Выделение хука `useCharacterState.ts` и очистка `page.tsx`

**Files:**
- Create: `src/hooks/useCharacterState.ts`
- Test: `test/use-character-state.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces:
  - `useCharacterState(): { char, update, batchUpdate, user, saving, cloudSynced, handleRoll, rollResult, closeRollResult, ... }`

- [ ] **Step 1: Создать модульный тест `test/use-character-state.test.ts`**

- [ ] **Step 2: Реализовать хук `src/hooks/useCharacterState.ts`**
Инкапсулировать стейт `char`, синхронизацию Supabase/localStorage, защиту от перезаписи импорта, обработчик кубиков `handleRoll`.

- [ ] **Step 3: Отрефакторить `src/app/page.tsx` до минимального оркестратора (~250-350 строк)**

- [ ] **Step 4: Проверить компиляцию, ESLint и все тесты**
`npx tsc --noEmit && npx eslint . && npm run test:adversarial`

- [ ] **Step 5: Закоммитить этап 5**
`git add src/hooks/useCharacterState.ts src/app/page.tsx test/ && git commit -m "refactor: integrate useCharacterState hook and streamline page.tsx"`

---

### Task 6: Финальная валидация, аудит верстки, актуализация графа и пуш на GitHub

**Files:**
- All modified files

- [ ] **Step 1: Полный TypeScript check**
`npx tsc --noEmit` (0 ошибок).

- [ ] **Step 2: Полный ESLint check**
`npx eslint .` (0 ошибок).

- [ ] **Step 3: Запуск полного набора состязательных тестов**
`npm run test:adversarial` (388+ тестов зелёные).

- [ ] **Step 4: Актуализация графа знаний Graphify**
`graphify update .`

- [ ] **Step 5: Финальный Git Push**
`$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "refactor: complete modular decomposition of page.tsx into components and hooks"; git push origin main`
