# План реализации: Премиальные дизайн-улучшения D&D 5e Character Sheet

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Внедрить премиальные визуальные и тактильные улучшения в `dnd5e-character-sheet` (пружинную физику бросков d20, скользящие вкладки, выпадающее меню «Бланк», тени дубового стола с сусальным золотом и атмосферные пустые состояния) с соблюдением средневековой темы пергамента (`AGENTS.md`).

**Architecture:** Использование `framer-motion` (уже установлен в проекте) для изолированных клиентских spring-анимаций в `RollResultPopup` и навигационных вкладках; CSS-переходы для тактильных нажатий кнопок; рефакторинг десктопной шапки с выносом вторичных действий в выпадающее меню «Бланк»; внедрение компонентов пустых состояний с векторными D&D-иконками.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion (`^12.23.2`), `@playwright/test`, `node:test` + `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-09-09-premium-medieval-design-enhancements-design.md`

## Global Constraints

- **Строгая тема пергамента (`AGENTS.md`):** Никаких чисто белых фонов (`#FFFFFF`), плоских серых блоков Tailwind (`bg-zinc-900`, `bg-gray-800`) или стандартных синих браузерных рамок.
- **Цветовые токены:** Пергамент `#F5E6C8`, чернила `#3D2012` и `#3C2415`, золото `#C9A84C` и `#FFE58F`.
- **Иконки:** Векторные двухцветные D&D-иконки из `@/components/dnd-icons`.
- **Тестирование:** TDD через `node:test` на каждом шаге; 0 ошибок `tsc --noEmit` и `eslint .`.
- **E2E:** Проверка в Microsoft Edge через Playwright без висящих фоновых демонов.

---

### Task 1: Глобальная материальность пергамента, тени и тактильные нажатия

**Files:**
- Modify: `src/app/globals.css:110-160`
- Test: `test/materiality-and-tactility.test.ts`

**Interfaces:**
- Consumes: CSS custom classes (`.parchment-card`, `.parchment-btn`, `.parchment-btn-secondary`, `.roll-badge`)
- Produces: Обновлённые тени цвета дуба/пергамента `rgba(60, 36, 21, 0.22)`, верхний золотой блик `inset 0 1px 0 rgba(255, 240, 200, 0.4)`, тактильные стили `:active` (`scale(0.98)` и `translateY(1px)`).

- [ ] **Step 1: Написать падающий тест на CSS токены материальности и тактильности**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Global CSS Materiality and Tactile Buttons', () => {
  const css = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf-8');
  assert.ok(css.includes('active:scale-[0.98]') || css.includes('transform: scale(0.98)'), 'must contain tactile scale down on active');
  assert.ok(css.includes('rgba(60, 36, 21'), 'must contain warm oak tinted shadows');
  assert.ok(css.includes('inset 0 1px 0'), 'must contain subtle gold/parchment inner edge highlight');
});
```

- [ ] **Step 2: Запустить тест и убедиться в падении**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/materiality-and-tactility.test.ts`  
Expected: FAIL

- [ ] **Step 3: Реализовать CSS стили в `src/app/globals.css`**

Добавить правила для `.parchment-card`, `.parchment-modal`, `.parchment-btn`, `.parchment-btn-secondary`, `.roll-badge` с теплыми дубовыми тенями, верхним внутренним золотистым бликом и тактильным эффектом нажатия `active:scale-[0.98] active:translate-y-[1px]`.

- [ ] **Step 4: Проверить прохождение теста**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/materiality-and-tactility.test.ts`  
Expected: PASS

- [ ] **Step 5: Коммит**

```bash
git add src/app/globals.css test/materiality-and-tactility.test.ts
git commit -m "style(parchment): add layered oak shadows, inner gold highlights, and tactile active press"
```

---

### Task 2: Пружинная физика и кинематика бросков d20 (`RollResultPopup`)

**Files:**
- Modify: `src/app/page.tsx:85-125`
- Test: `test/dice-spring-physics.test.ts`

**Interfaces:**
- Consumes: `framer-motion` (`motion`, `AnimatePresence`), `RollResult`
- Produces: Пружинное появление окна броска, кинематический микро-оборот кубика d20, критические эффекты нат-20 / нат-1.

- [ ] **Step 1: Написать падающий тест на структуру `RollResultPopup` с Framer Motion**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('RollResultPopup Framer Motion Integration', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  assert.ok(code.includes('motion.div') || code.includes('motion'), 'must use motion for animated roll popup');
  assert.ok(code.includes('type: "spring"') || code.includes("type: 'spring'"), 'must use spring physics for dice popup');
  assert.ok(code.includes('D20Icon'), 'must render D20Icon in roll result popup');
});
```

- [ ] **Step 2: Запустить тест и убедиться в падении**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/dice-spring-physics.test.ts`  
Expected: FAIL

- [ ] **Step 3: Реализовать пружинный `RollResultPopup` в `src/app/page.tsx`**

Обернуть окно броска в `<motion.div>` со `spring` конфигурацией (`stiffness: 220, damping: 18`), добавить вращающуюся векторную иконку `<D20Icon />` с пульсацией выпавшего значения, золотистую ауру для нат-20 и багряную для нат-1.

- [ ] **Step 4: Проверить прохождение теста**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/dice-spring-physics.test.ts`  
Expected: PASS

- [ ] **Step 5: Коммит**

```bash
git add src/app/page.tsx test/dice-spring-physics.test.ts
git commit -m "feat(motion): add spring physics and kinetic d20 animations to roll popup"
```

---

### Task 3: Скользящий индикатор переключения вкладок (Sliding Tab Indicator)

**Files:**
- Modify: `src/app/page.tsx:2735-2750`
- Test: `test/sliding-tabs.test.ts`

**Interfaces:**
- Consumes: `activeTab`, `motion.span` с `layoutId="activeTabParchment"`
- Produces: Плавное скольжение фоновой пергаментной плашки между табами «Лист», «Детали», «Магия».

- [ ] **Step 1: Написать падающий тест на скользящий `layoutId` в табах**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Sliding Tab Indicator with layoutId', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  assert.ok(code.includes('layoutId="activeTabParchment"'), 'tabs must include motion layoutId for sliding transition');
});
```

- [ ] **Step 2: Запустить тест и убедиться в падении**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/sliding-tabs.test.ts`  
Expected: FAIL

- [ ] **Step 3: Реализовать скользящий индикатор в табах `src/app/page.tsx`**

В блоке рендеринга `parchment-tabs` добавить `motion.span layoutId="activeTabParchment"` внутри активной кнопки с красивым пергаментным градиентом и золотой окантовкой.

- [ ] **Step 4: Проверить прохождение теста**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/sliding-tabs.test.ts`  
Expected: PASS

- [ ] **Step 5: Коммит**

```bash
git add src/app/page.tsx test/sliding-tabs.test.ts
git commit -m "feat(tabs): add sliding parchment layoutId indicator for character sheet pages"
```

---

### Task 4: Разгрузка шапки — средневековое выпадающее меню «Бланк»

**Files:**
- Modify: `src/app/page.tsx:2470-2565`
- Test: `test/header-menu.test.ts`

**Interfaces:**
- Consumes: `handleApplyTemplate`, `handleSaveJSON`, `handleLoadJSON`, `handleReset`
- Produces: Компактный дропдаун «Бланк / Лист» с иконкой `ScrollIcon`, заменяющий 4 разрозненные кнопки в десктопном тулбаре; закрытие по клику вне меню и Escape.

- [ ] **Step 1: Написать падающий тест на выпадающее меню шапки**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Header Toolbar Dropdown Menu', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  assert.ok(code.includes('showSheetMenu') || code.includes('sheetMenuOpen'), 'header must manage sheet dropdown menu state');
  assert.ok(code.includes('parchment-menu-dropdown') || code.includes('parchment-dropdown'), 'must contain parchment styled dropdown');
});
```

- [ ] **Step 2: Запустить тест и убедиться в падении**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/header-menu.test.ts`  
Expected: FAIL

- [ ] **Step 3: Реализовать выпадающее меню в `src/app/page.tsx`**

Создать компактную кнопку «Бланк ▾» со `ScrollIcon`, открывающую аккуратное пергаментное меню с пунктами: «Готовые шаблоны», «Экспорт в JSON», «Импорт из JSON», «Сбросить лист». Обеспечить закрытие по клику мимо и Escape.

- [ ] **Step 4: Проверить прохождение теста**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/header-menu.test.ts`  
Expected: PASS

- [ ] **Step 5: Коммит**

```bash
git add src/app/page.tsx test/header-menu.test.ts
git commit -m "feat(header): de-clutter toolbar into vintage sheet dropdown menu"
```

---

### Task 5: Атмосферные средневековые пустые состояния (Alive Empty States)

**Files:**
- Modify: `src/app/page.tsx` (разделы Атаки, Снаряжение, Заклинания)
- Test: `test/empty-states.test.ts`

**Interfaces:**
- Consumes: `char.attacks`, `char.equipment`, `char.spellsByLevel`
- Produces: Эстетичные гравюрные штампы с иконками `CrossedSwordsIcon`, `BackpackPackIcon`, `SpellbookIcon` и пояснительным текстом при пустых коллекциях.

- [ ] **Step 1: Написать падающий тест на пустые состояния**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Alive Empty States in Character Sheet', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  assert.ok(code.includes('parchment-empty-state'), 'must contain parchment empty state styling');
  assert.ok(code.includes('Оружие еще не экипировано') || code.includes('Оружие не добавлено'), 'must describe empty weapons state');
});
```

- [ ] **Step 2: Запустить тест и убедиться в падении**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/empty-states.test.ts`  
Expected: FAIL

- [ ] **Step 3: Реализовать стили и компоненты пустых состояний**

В `src/app/globals.css` определить `.parchment-empty-state`, а в `src/app/page.tsx` отображать стилизованные гравюры, когда списки оружия, снаряжения или заклинаний пусты.

- [ ] **Step 4: Проверить прохождение теста**

Run: `& 'C:\Program Files\nodejs\npx.cmd' tsx --test test/empty-states.test.ts`  
Expected: PASS

- [ ] **Step 5: Коммит**

```bash
git add src/app/globals.css src/app/page.tsx test/empty-states.test.ts
git commit -m "feat(ui): add atmospheric medieval empty states for attacks, gear, and spells"
```

---

### Task 6: Комплексная E2E-верификация в Playwright Microsoft Edge

**Files:**
- Modify: `e2e/ux-enhancements.spec.ts`

- [ ] **Step 1: Добавить E2E-сценарии для нового меню и анимаций в `e2e/ux-enhancements.spec.ts`**
  - Открытие меню «Бланк» и закрытие по Escape.
  - Скользящие вкладки на странице.
  - Сохранение скриншотов в `artifacts/taste_audit/`.
- [ ] **Step 2: Запустить Playwright E2E прогон**
  Run: `& 'C:\Program Files\nodejs\npx.cmd' playwright test e2e/ux-enhancements.spec.ts --project=msedge`
  Expected: ALL TESTS PASSED
- [ ] **Step 3: Запустить полный чеклист проекта**
  Run:
  - `& 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit` -> 0 ошибок
  - `& 'C:\Program Files\nodejs\npx.cmd' eslint .` -> 0 ошибок
  - `& 'C:\Program Files\nodejs\npm.cmd' run test:adversarial` -> все тесты зеленые
- [ ] **Step 4: Обновить граф знаний и git push**
  - `graphify update .`
  - `$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git push origin main`
