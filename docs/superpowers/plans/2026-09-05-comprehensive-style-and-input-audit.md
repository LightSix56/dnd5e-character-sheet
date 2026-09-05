# Комплексный аудит и унификация стиля полей ввода, модальных окон и эмодзи

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:dispatching-parallel-agents to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обеспечить 100% визуальное и функциональное соответствие средневековому пергаментному стилю (D&D 5e Parchment Theme) для всех полей ввода (`input`), выпадающих списков (`select`), текстовых областей (`textarea`), модальных окон и эмодзи во всех компонентах приложения.

**Architecture:**
1. В `src/app/globals.css` расширяем глобальную дизайн-систему пергамента: классы `.parchment-input-boxed` (светло-пергаментный фон, античная золотая рамка, золотой focus-ring), `.parchment-select` (пергаментные опции, кастомный вид), `.parchment-textarea` и `.dnd-emoji`.
2. Распределяем аудит и приведение к единому стилю по 4 независимым изолированным доменам с параллельным выполнением субагентами:
   - **Домен 1:** Мастер создания персонажа (`CharacterCreationWizardModal.tsx`)
   - **Домен 2:** Инструменты и калькуляторы (`CharacterGridModal.tsx`, `StatsCalculatorModal.tsx`, `NameGeneratorModal.tsx`, `ShareModal.tsx`)
   - **Домен 3:** Компоненты компендиума и страница шеринга (`ClassSelectorModal.tsx`, `RaceSelectorModal.tsx`, `SubclassSelectorModal.tsx`, `AutocompleteInput.tsx`, `src/app/share/[code]/page.tsx`)
   - **Домен 4:** Главный лист персонажа и глобальные стили (`src/app/page.tsx`, `src/app/globals.css`)
3. Верификация: полный прогон TypeScript (`tsc --noEmit`), проверка сборки (`next build`) и визуальный аудит.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, TypeScript, CSS Custom Properties.

---

## User Review Required

> [!IMPORTANT]
> Все белые и полупрозрачные стандартные браузерные поля ввода (`rgba(255,255,255,...)`, дефолтные синие фокус-аутлайны) будут заменены на пергаментные цвета:
> - Фон полей: теплый пергамент `rgba(251, 240, 220, 0.9)` или `#FFFDF9`.
> - Рамки: античное золото `#C9A84C` / `rgba(201, 168, 76, 0.5)`.
> - Фокус: золотистое свечение `box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.35)`.
> - Текст: глубокий чернильный коричневый `#3C2415`.
> - Плейсхолдеры: приглушенный янтарный `#8B6914`/60 с курсивом.

---

## Proposed Changes

### 1. Глобальные стили (Design System Foundation)
#### [MODIFY] [globals.css](file:///c:/antig/dnd5e-character-sheet/src/app/globals.css)
- Добавить `.parchment-input-boxed` для модальных окон, полей поиска и карточек.
- Добавить стилизацию `.parchment-select` (включая цвет выпадающих элементов `option`).
- Улучшить `.parchment-textarea` с единым золотым фокусом.
- Добавить селекторы `::selection` в пергаментных тонах (золотистый фон выделения).

---

### 2. Мастер создания персонажа (Wizard Domain)
#### [MODIFY] [CharacterCreationWizardModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/wizard/CharacterCreationWizardModal.tsx)
- Заменить все белые инлайновые стили `background: rgba(255, 255, 255, 0.6)` в полях имени (Шаг 1), поиска расы (Шаг 1), выбора навыков предыстории (Шаг 3), поиска заклинаний (Шаг 5), финализации данных (имя игрока, возраст, рост, вес, описание на Шаге 6) на пергаментные классы `.parchment-input-boxed` и `.parchment-textarea`.
- Проверить все эмодзи в визарде: Шаги 1-6 (`👤`, `⚔️`, `📜`, `🎲`, `✨`, `👑`), кость хитов `🎲`, спасброски `🛡️`, золото `💰`, навыки `🎯`.

---

### 3. Инструменты и калькуляторы (Tools Domain)
#### [MODIFY] [StatsCalculatorModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/tools/StatsCalculatorModal.tsx)
- Заменить селект в Standard Array и числовые инпуты расовых бонусов на `.parchment-select` и `.parchment-input-boxed`.
- Убедиться, что фокус на инпутах подсвечивается золотом `#C9A84C`.

#### [MODIFY] [NameGeneratorModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/tools/NameGeneratorModal.tsx)
- Привести выпадающие списки «Раса» и «Культура / Наследие» к классу `.parchment-select`.

#### [MODIFY] [CharacterGridModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/tools/CharacterGridModal.tsx)
- Поле поиска: использовать `.parchment-input-boxed` с иконкой `🔍`.
- Проверить кнопки действий (`⚔️ Играть`, `🔗 Код`, `🗑️`).

#### [MODIFY] [ShareModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/tools/ShareModal.tsx)
- Поле ссылки для копирования: пергаментный фон, моноширинный шрифт, золотая рамка.

---

### 4. Компендиум и страница шеринга (Compendium & Share Domain)
#### [MODIFY] [ClassSelectorModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/compendium/ClassSelectorModal.tsx)
- Поле поиска класса перевести на `.parchment-input-boxed`.

#### [MODIFY] [RaceSelectorModal.tsx](file:///c:/antig/dnd5e-character-sheet/src/components/compendium/RaceSelectorModal.tsx)
- Поле поиска расы перевести на `.parchment-input-boxed`.

#### [MODIFY] [src/app/share/[code]/page.tsx](file:///c:/antig/dnd5e-character-sheet/src/app/share/%5Bcode%5D/page.tsx)
- Проверить все бейджи, кнопки действий (`👁️ Просмотр`, `📥 Сохранить`, `✏️ Открыть в редакторе`), таблицы атак, спасбросков и гримуара.

---

### 5. Главный лист персонажа (Main Sheet Domain)
#### [MODIFY] [src/app/page.tsx](file:///c:/antig/dnd5e-character-sheet/src/app/page.tsx)
- Проверить все `<input>`, `<select>`, `<textarea>` во всех трёх вкладках («Основной лист», «Детали», «Заклинания»).
- Убедиться, что модальные окна Level Up, Level Down, Respec и Export используют единые пергаментные инпуты и селекты.

---

## Verification Plan

### Automated Tests
- TypeScript Compile: `npx tsc --noEmit` (0 errors)
- Next.js Production Build: `npx next build` (успешная генерация всех страниц)

### Visual / Functional Checks
- Проверка отображения полей ввода в светлой и тёмной темах (все поля в едином тёплом пергаментном оттенке).
- Отсутствие синих стандартных outline браузера при клике/фокусе на любое поле.
- Проверка консистентности эмодзи во всех карточках, вкладках и модальных окнах.
