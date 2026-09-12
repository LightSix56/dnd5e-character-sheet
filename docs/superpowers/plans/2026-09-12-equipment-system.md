# Интерактивная кукла экипировки (Equipment Paper Doll) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать интерактивную куклу экипировки персонажа на базе силуэта человека с 12 слотами снаряжения, автоматическим правилом двуручного хвата и расчётом бонусов экипировки в реальном времени.

**Architecture:** Модульный движок управления слотами и модификаторами (`src/lib/equipment-types.ts`), компонент куклы экипировки (`src/components/equipment/EquipmentPaperDoll.tsx`) в пергаментном средневековом стиле, и интеграция в лист персонажа (`src/app/page.tsx`) с живой связкой КД, скорости, щита и атак.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind CSS, Framer Motion, Node test runner (`node:test` + `node:assert/strict`).

**Spec:** `C:/Users/FROG2/.gemini/antigravity/brain/d462fedc-d719-4706-80cc-279e35ef406c/equipment_layout_design.md`

## Global Constraints

- Единый пергаментный стиль D&D 5e (`.parchment-card`, `#F5E6C8`, `#C9A84C`, `#3D2012`). Никаких белых пятен и плоских серых блоков.
- Лаконичный заголовок: строго «ЭКИПИРОВКА» без длинных фраз.
- Никаких ячеек настройки (Attunement) в этой версии (отложено).
- Никаких громоздких баннеров правил поперек силуэта: ограничение двуручного хвата работает тихо и наглядно прямо на слоте Второй руки.
- Zero external latency (локальные вычисления и компоненты).
- TDD для математики и логики слотов.

---

### Task 1: Движок слотов экипировки и модификаторов (`src/lib/equipment-types.ts`)

**Files:**
- Create: `src/lib/equipment-types.ts`
- Modify: `src/lib/dnd-types.ts`
- Test: `test/equipment-slots.test.ts`

**Interfaces:**
- Produces:
  - `EquipmentSlotId`: `'head' | 'neck' | 'armor' | 'mainHand' | 'offHand' | 'belt' | 'ring1' | 'cloak' | 'quiver' | 'gloves' | 'ring2' | 'pouch' | 'boots'`
  - `EquippedItem`: `{ id: string; name: string; slot: EquipmentSlotId; bonusAC?: number; bonusSpeed?: number; twoHanded?: boolean; isShield?: boolean; description?: string }`
  - `equipItem(char: CharacterData, slot: EquipmentSlotId, item: EquippedItem): CharacterData`
  - `unequipItem(char: CharacterData, slot: EquipmentSlotId): CharacterData`
  - `isOffHandBlocked(char: CharacterData): boolean`
  - `calculateEquipmentBonuses(char: CharacterData): { acBonus: number; speedBonus: number }`

- [ ] **Step 1: Write the failing test**
Create `test/equipment-slots.test.ts` testing slot assignments, two-handed weapon blocking off-hand, equipping shield, and AC/speed modifier calculations.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx tsx --test test/equipment-slots.test.ts`
Expected: FAIL (module/functions not found).

- [ ] **Step 3: Write implementation**
Create `src/lib/equipment-types.ts` with clean slot types and pure state transition functions.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx tsx --test test/equipment-slots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/lib/equipment-types.ts test/equipment-slots.test.ts; git commit -m "feat: add equipment slots engine with two-handed locking"`

---

### Task 2: Интерактивный компонент куклы экипировки (`src/components/equipment/EquipmentPaperDoll.tsx`)

**Files:**
- Create: `src/components/equipment/EquipmentPaperDoll.tsx`
- Create: `src/components/equipment/EquipmentSlotModal.tsx`
- Test: `test/equipment-ui.test.ts`

**Interfaces:**
- Consumes: `EquipmentSlotId`, `EquippedItem`, `equipItem`, `unequipItem`, `isOffHandBlocked` from `src/lib/equipment-types.ts`
- Produces: `<EquipmentPaperDoll char={char} onUpdateChar={setChar} onToast={showToast} />`

- [ ] **Step 1: Write the UI contract tests**
Verify that `<EquipmentPaperDoll>` renders 12 slots, handles two-handed weapon lock state on off-hand, and emits state updates.

- [ ] **Step 2: Implement EquipmentPaperDoll**
Build the parchment-styled paper doll overlay using `/mannequin.png`, with 12 interactive slot cards, quick modal selector for choosing weapons/armor/trinkets from compendium or inventory, and unequip actions.

- [ ] **Step 3: Verify TypeScript and compilation**
Run: `npx tsc --noEmit` and `npx eslint .`.

- [ ] **Step 4: Commit**
`git add src/components/equipment/; git commit -m "feat: implement interactive equipment paper doll component"`

---

### Task 3: Интеграция куклы в лист персонажа (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/lib/dnd-types.ts`
- Test: `npm run test:adversarial`

**Interfaces:**
- Consumes: `<EquipmentPaperDoll />` in page tabs/modals
- Synchronizes: `char.equippedArmor` and `char.equippedShield` with paper doll armor & off-hand slots.

- [ ] **Step 1: Integrate into page layout**
Add dedicated «⚔️ Экипировка» переключатель/кнопку в секции снаряжения и боевых параметров листа.
Sync paper doll armor and shield with character AC calculator in real time.

- [ ] **Step 2: Run full regression and compilation checks**
Run: `npx tsc --noEmit && npx eslint . && npm run test:adversarial`.

- [ ] **Step 3: Update knowledge graph and Git push**
Run: `graphify update .` and `$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "feat: integrate interactive equipment paper doll into character sheet"; git push origin main`.
