# Интерактивное обучение и Большая Энциклопедия D&D 5e: План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать интерактивную обучающую экосистему для новичков: пошаговый тур-прожектор по листу персонажа, полноэкранный модальный фолиант-энциклопедию с 7 главами базовых правил D&D 5e и контекстные золотые значки разбора блоков листа, с нулевым влиянием на начальную загрузку страницы через lazy-loading.

**Architecture:**
- Данные и типы: `src/data/encyclopedia/encyclopedia-types.ts` и `src/data/encyclopedia/encyclopedia-content.ts`.
- Компоненты интерфейса: `BlockHelpButton.tsx`, `InteractiveSheetTour.tsx`, `DndEncyclopediaModal.tsx`.
- Подключение: ленивая динамическая загрузка в `src/app/page.tsx`, кнопки в `SheetHeader.tsx`, `MainSheetPage.tsx` и `SpellsPage.tsx`.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS (Parchment Theme), `@/components/dnd-icons`, Node.js test runner (`tsx --test`).

**Spec:** `docs/superpowers/specs/2026-09-14-newbie-onboarding-encyclopedia-design.md`

## Global Constraints
- Аутентичная пергаментная палитра D&D: фон `#F5E6C8`, рамки `#C9A84C`, текст `#3D2012` и `#5C341F`, засечки Georgia.
- Категорический запрет на закрытие окна при клике на затемнение (No Backdrop Dismiss): закрытие строго по кнопке `✕` (`.parchment-remove-btn`) или клавише `Escape`.
- Только векторные D&D-иконки из `@/components/dnd-icons`: `InfoSealIcon`, `D20Icon`, `ScrollIcon`, `SpellbookIcon`, `CrossedSwordsIcon`, `EngravedShieldIcon`, `SparklesDndIcon`.
- Нулевой оверхед на первый рендер: динамический импорт компонентов через `next/dynamic` (`ssr: false`).
- 0 ошибок компиляции (`npx tsc --noEmit`), 0 ошибок линтера (`npx eslint .`), все состязательные тесты зеленые (`npm run test:adversarial`).
- Актуализация графа знаний (`graphify update .`) и обязательный `git push origin main` с очисткой прокси.

---

### Task 1: Структуры данных, типы и контент Энциклопедии

**Files:**
- Create: `src/data/encyclopedia/encyclopedia-types.ts`
- Create: `src/data/encyclopedia/encyclopedia-content.ts`
- Test: `test/encyclopedia-data.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface EncyclopediaSection {
    id: string;
    title: string;
    content: string; // Markdown / formatted text
    callout?: { type: 'tip' | 'warning' | 'master'; text: string };
    table?: { headers: string[]; rows: string[][] };
  }

  export interface EncyclopediaChapter {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    sections: EncyclopediaSection[];
  }

  export interface TourStep {
    id: string;
    targetId: string; // Matches data-tour-id in sheet DOM
    title: string;
    description: string;
    chapterId: string; // Deep-link to encyclopedia chapter
    placement?: 'top' | 'bottom' | 'left' | 'right';
  }

  export const ENCYCLOPEDIA_CHAPTERS: EncyclopediaChapter[];
  export const SHEET_TOUR_STEPS: TourStep[];
  ```

- [ ] **Step 1: Write failing test for encyclopedia data and tour steps**

```typescript
// test/encyclopedia-data.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENCYCLOPEDIA_CHAPTERS, SHEET_TOUR_STEPS } from '../src/data/encyclopedia/encyclopedia-content.js';

test('Encyclopedia Data: Contains all 7 comprehensive chapters', () => {
  assert.equal(ENCYCLOPEDIA_CHAPTERS.length, 7);
  const chapterIds = ENCYCLOPEDIA_CHAPTERS.map(c => c.id);
  assert.ok(chapterIds.includes('intro-dnd-basics'));
  assert.ok(chapterIds.includes('d20-checks-dc'));
  assert.ok(chapterIds.includes('sheet-anatomy'));
  assert.ok(chapterIds.includes('combat-and-actions'));
  assert.ok(chapterIds.includes('magic-and-spells'));
  assert.ok(chapterIds.includes('rest-and-recovery'));
  assert.ok(chapterIds.includes('level1-and-level-up'));
});

test('Encyclopedia Data: Tour steps cover all 8 key sheet blocks with valid chapter links', () => {
  assert.equal(SHEET_TOUR_STEPS.length, 8);
  const chapterIds = new Set(ENCYCLOPEDIA_CHAPTERS.map(c => c.id));
  for (const step of SHEET_TOUR_STEPS) {
    assert.ok(step.targetId, `Step ${step.id} has targetId`);
    assert.ok(step.title, `Step ${step.id} has title`);
    assert.ok(step.description, `Step ${step.id} has description`);
    assert.ok(chapterIds.has(step.chapterId), `Step ${step.id} links to valid chapter ${step.chapterId}`);
  }
});

test('Encyclopedia Data: Sheet anatomy chapter has detailed breakdown of every stat and vitals', () => {
  const anatomy = ENCYCLOPEDIA_CHAPTERS.find(c => c.id === 'sheet-anatomy')!;
  assert.ok(anatomy);
  const sectionIds = anatomy.sections.map(s => s.id);
  assert.ok(sectionIds.includes('abilities-and-modifiers'));
  assert.ok(sectionIds.includes('proficiency-bonus'));
  assert.ok(sectionIds.includes('saving-throws'));
  assert.ok(sectionIds.includes('skills-and-expertise'));
  assert.ok(sectionIds.includes('ac-and-vitals'));
  assert.ok(sectionIds.includes('attacks-and-damage'));
});
```

- [ ] **Step 2: Run test to verify it fails**
`npx tsx --test test/encyclopedia-data.test.ts`

- [ ] **Step 3: Implement `src/data/encyclopedia/encyclopedia-types.ts` and `src/data/encyclopedia/encyclopedia-content.ts`**
Заполнить полным и богатым текстом все 7 глав (включая роль ДМ, золотой цикл игры, механику d20, дословный разбор листа, 4 типа действий в бою, концентрацию, отдых, стартового персонажа 1 ур. и прокачку ASI vs Черты) и 8 шагов тура.

- [ ] **Step 4: Run test to verify it passes**
`npx tsx --test test/encyclopedia-data.test.ts`

- [ ] **Step 5: Commit**
`git add src/data/encyclopedia/ test/encyclopedia-data.test.ts`
`git commit -m "feat(encyclopedia): data structures and 7 comprehensive chapters of D&D 5e basics"`

---

### Task 2: Кнопка подсказки блока и Движок интерактивного тура (Spotlight Tour)

**Files:**
- Create: `src/components/encyclopedia/BlockHelpButton.tsx`
- Create: `src/components/encyclopedia/InteractiveSheetTour.tsx`
- Test: `test/interactive-tour.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface BlockHelpButtonProps {
    chapterId: string;
    sectionId?: string;
    label?: string;
    onOpen: (chapterId: string, sectionId?: string) => void;
  }

  export interface InteractiveSheetTourProps {
    isActive: boolean;
    currentStepIndex: number;
    onStepChange: (index: number) => void;
    onClose: () => void;
    onOpenEncyclopedia: (chapterId: string) => void;
  }
  ```

- [ ] **Step 1: Write failing test for tour step calculation and progress**

```typescript
// test/interactive-tour.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { SHEET_TOUR_STEPS } from '../src/data/encyclopedia/encyclopedia-content.js';

test('Interactive Tour: Steps boundary and navigation logic', () => {
  const total = SHEET_TOUR_STEPS.length;
  assert.ok(total >= 8);

  const getNextIndex = (curr: number) => Math.min(total - 1, curr + 1);
  const getPrevIndex = (curr: number) => Math.max(0, curr - 1);

  assert.equal(getNextIndex(0), 1);
  assert.equal(getNextIndex(total - 1), total - 1);
  assert.equal(getPrevIndex(0), 0);
  assert.equal(getPrevIndex(3), 2);
});
```

- [ ] **Step 2: Implement `src/components/encyclopedia/BlockHelpButton.tsx`**
Компактный круговой значок с `<InfoSealIcon size={14} />`, золотым обрамлением, полупрозрачностью и подсказкой при наведении.

- [ ] **Step 3: Implement `src/components/encyclopedia/InteractiveSheetTour.tsx`**
Компонент оверлея:
- Поиск целевого DOM-элемента по `[data-tour-id="${step.targetId}"]`.
- Вычисление `getBoundingClientRect()` и `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- SVG / CSS вырезка с подсветкой и золотистой пульсирующей рамкой `box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 25px rgba(201, 168, 76, 0.9)`.
- Пергаментная карточка подсказки с счетчиком шагов, кнопками `Назад`, `Далее / Завершить`, `✕ Закрыть`, и `📖 Подробнее в энциклопедии →`.

- [ ] **Step 4: Run test to verify it passes**
`npx tsx --test test/interactive-tour.test.ts`

- [ ] **Step 5: Commit**
`git add src/components/encyclopedia/BlockHelpButton.tsx src/components/encyclopedia/InteractiveSheetTour.tsx test/interactive-tour.test.ts`
`git commit -m "feat(encyclopedia): BlockHelpButton and InteractiveSheetTour spotlight engine"`

---

### Task 3: Модальное окно «Большая Энциклопедия D&D 5e» (Фолиант)

**Files:**
- Create: `src/components/encyclopedia/DndEncyclopediaModal.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface DndEncyclopediaModalProps {
    isOpen: boolean;
    initialChapterId?: string | null;
    initialSectionId?: string | null;
    onClose: () => void;
    onStartTour?: () => void;
  }
  ```

- [ ] **Step 1: Implement `src/components/encyclopedia/DndEncyclopediaModal.tsx`**
- Стиль: аутентичный пергаментный фолиант (`#F5E6C8`, золотая окантовка `3px solid #C9A84C`).
- **No Backdrop Dismiss**: клик по затемнению не закрывает окно (`onClick={e => e.stopPropagation()}` на карточке и отсутствие `onClick={onClose}` на фоне). Закрытие только по кнопке `✕` (`.parchment-remove-btn`) или клавише `Escape`.
- Левая колонка: оглавление 7 глав с векторными D&D-иконками, количеством разделов и поисковой строкой по всем статьям.
- Правая колонка: контент выбранной главы со скроллом, заголовками Georgia, блоками «Совет Мастера», таблицами (модификаторы, сложности, КД, действия), примерами и кнопкой наверх.
- Верхняя панель: название фолианта, поиск, кнопка «🎯 Запустить тур по листу» и кнопка закрытия `✕`.

- [ ] **Step 2: Commit**
`git add src/components/encyclopedia/DndEncyclopediaModal.tsx`
`git commit -m "feat(encyclopedia): DndEncyclopediaModal folio component with chapters and search"`

---

### Task 4: Интеграция в лист персонажа, меню и страницы

**Files:**
- Modify: `src/components/sheet/SheetHeader.tsx` (добавить кнопку `📜 Обучение и База` в тулбар и мобильное меню)
- Modify: `src/components/sheet/pages/MainSheetPage.tsx` (добавить `data-tour-id` и кнопки `BlockHelpButton` на карточки)
- Modify: `src/components/sheet/pages/SpellsPage.tsx` (добавить `BlockHelpButton` для магии)
- Modify: `src/app/page.tsx` (динамический импорт, состояние, прокидывание хендлеров, баннер первого входа)

- [ ] **Step 1: Add data-tour-id and BlockHelpButton to `MainSheetPage.tsx`**
- [ ] **Step 2: Add BlockHelpButton to `SpellsPage.tsx`**
- [ ] **Step 3: Add `📜 Обучение и База` button and dropdown to `SheetHeader.tsx`**
- [ ] **Step 4: Integrate state and lazy-loading in `src/app/page.tsx`**
- [ ] **Step 5: Run tests and TypeScript check**
`npx tsc --noEmit`
`npx eslint .`
`npm run test:adversarial`

- [ ] **Step 6: Commit**
`git add src/components/sheet/SheetHeader.tsx src/components/sheet/pages/MainSheetPage.tsx src/components/sheet/pages/SpellsPage.tsx src/app/page.tsx`
`git commit -m "feat(encyclopedia): integrate onboarding tour and encyclopedia into sheet UI"`

---

### Task 5: Итоговая верификация, актуализация графа и Git Push

- [ ] **Step 1: Compile check:** `npx tsc --noEmit` (0 ошибок).
- [ ] **Step 2: Linter check:** `npx eslint .` (0 ошибок).
- [ ] **Step 3: Adversarial tests:** `npm run test:adversarial` (все тесты зеленые).
- [ ] **Step 4: Knowledge graph:** `graphify update .`.
- [ ] **Step 5: Mandatory Git Push:**
```powershell
$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "feat(onboarding): full dnd 5e encyclopedia and interactive sheet tour"; git push origin main
```
