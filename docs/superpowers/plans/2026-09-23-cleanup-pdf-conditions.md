# Cleanup, PDF Portrait & Conditions Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. All subagents MUST be launched strictly on model Flash (`Model: 'flash'`).

**Goal:** Clean up dead boilerplate artifacts, add portrait image rendering to the PDF character sheet export, and implement a full D&D 5e Conditions & Concentration manager with a 1-click clear-all action.

**Architecture:** Pure component-driven design in parchment medieval aesthetic. Conditions and concentration data are stored directly in `CharacterData` with backward-compatible normalization. PDF export uses `pdf-lib` image embedding into page 2.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, `pdf-lib`, `@pdf-lib/fontkit`, `tsx --test`.

---

## Global Constraints
- All subagents MUST use `Model: 'flash'`.
- Strict Parchment Medieval design system: `#F5E6C8`, borders `#C9A84C`, ink `#3D2012`, no raw white backgrounds, no default blue focus rings.
- 0 TypeScript compiler errors (`npx tsc --noEmit`).
- 0 ESLint errors (`npx eslint .`).
- 100% passing tests (`npm run test:adversarial`).
- Update knowledge graph via `graphify update .` and push to GitHub `git push origin main`.

---

### Task 1: Technical Cleanup & Configuration Fixes

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.ts`
- Modify: `src/components/sheet/SheetFooter.tsx`

- [ ] **Step 1: Clean up package.json**
  - Remove unused dependencies: `@prisma/client`, `prisma`, `next-auth`, `z-ai-web-dev-sdk`.
  - Remove phantom scripts: `"db:push"`, `"db:generate"`, `"db:migrate"`, `"db:reset"`.
- [ ] **Step 2: Fix tailwind.config.ts content paths**
  - Update `content` array to:
    ```ts
    content: [
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    ```
- [ ] **Step 3: Correct legacy text in SheetFooter.tsx**
  - Replace "Любой фиолетовый бейдж с модификатором" with "Любой бейдж с модификатором".
- [ ] **Step 4: Verify build integrity**
  - Run `npx tsc --noEmit` and `npx eslint .`.

---

### Task 2: PDF Export Portrait Embedding & Font Fallback

**Files:**
- Modify: `src/lib/pdf-export.ts`
- Test: `test/export-pdf.test.ts`

- [ ] **Step 1: Write TDD test for portrait export**
  - In `test/export-pdf.test.ts`, add test case that exports a character with a 1x1 test PNG base64 portrait and asserts PDF generation succeeds.
- [ ] **Step 2: Fix font fallback in pdf-export.ts**
  - Prioritize `public/fonts/arial.ttf` via `path.join(process.cwd(), 'public', 'fonts', 'arial.ttf')`.
  - Prevent crashing on non-Windows environments when `C:/Windows/Fonts/` does not exist.
- [ ] **Step 3: Implement portrait embedding on Page 2**
  - On Page 2 of the PDF template, calculate portrait bounding box.
  - If `char.portraitUrl` or `options.portraitUrl` is present (data URL or buffer), embed image via `pdfDoc.embedPng` or `pdfDoc.embedJpg` and draw on page 2.
- [ ] **Step 4: Run tests**
  - Run `npx tsx --test test/export-pdf.test.ts` to ensure all tests pass.

---

### Task 3: Conditions & Concentration Engine & UI

**Files:**
- Modify: `src/lib/dnd-types.ts`
- Create: `src/components/sheet/ConditionsTracker.tsx`
- Modify: `src/components/sheet/pages/MainSheetPage.tsx`
- Modify: `src/app/page.tsx`
- Test: `test/conditions-and-concentration.test.ts`

- [ ] **Step 1: Write TDD tests for conditions & concentration**
  - Create `test/conditions-and-concentration.test.ts`.
  - Test condition toggling, multi-condition selection, "clear all" logic, and concentration DC calculation (`Math.max(10, Math.floor(damage / 2))`).
- [ ] **Step 2: Update dnd-types.ts**
  - Add `conditions?: string[];` and `concentration?: { spellName: string; dc?: number } | null;` to `CharacterData`.
  - Update `createDefaultCharacter()` and `normalizeCharacterData()`.
  - Define `DND_CONDITIONS` constant with all 15 SRD 5.1 conditions (name, nameEn, description, icon/emoji).
- [ ] **Step 3: Create ConditionsTracker.tsx**
  - Implement component in parchment style.
  - Chips for 15 conditions with active/inactive states.
  - Info tooltip with complete SRD rule text.
  - Concentration active badge with spell name and Con save DC reminder.
  - "Очистить все" (Clear all) button.
- [ ] **Step 4: Integrate into MainSheetPage.tsx & page.tsx**
  - Place `ConditionsTracker` on `MainSheetPage.tsx` next to Vitals / Armor.
  - Wire state updates and callbacks.
- [ ] **Step 5: Run tests**
  - Run `npx tsx --test test/conditions-and-concentration.test.ts`.

---

### Task 4: Full Verification, AST Graph Update & Git Push

- [ ] **Step 1: TypeScript validation**
  - Run `npx tsc --noEmit`.
- [ ] **Step 2: ESLint validation**
  - Run `npx eslint .`.
- [ ] **Step 3: Adversarial test suite**
  - Run `npm run test:adversarial`.
- [ ] **Step 4: Graphify update**
  - Run `graphify update .`.
- [ ] **Step 5: Git commit and push**
  - Run `$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "..."; git push origin main`.
