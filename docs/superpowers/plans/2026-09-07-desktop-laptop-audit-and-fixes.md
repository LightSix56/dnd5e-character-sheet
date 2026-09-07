# Desktop and Laptop UI/UX Audit & Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perform a complete visual, layout, and ergonomic audit of the D&D 5e Character Sheet across PC and Laptop viewports (1920x1080, 1440x900, and 1366x768), capture screenshots of all core views and modals, fix any visual artifacts or UX inconveniences, and verify all screens.

**Architecture:** Automated headless browser audit suite capturing multi-viewport screenshots (Full HD, MacBook 16:10, and 1366x768 budget laptop). Inspecting modal height constraints, scroll containment, header wrapping, typography contrast, button accessibility, and parchment theme consistency. Applying surgical fixes to components and re-verifying with before/after evidence.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Playwright / Puppeteer-core with Microsoft Edge, TypeScript 5.

---

## Global Constraints

- Parchment Medieval Theme: Strictly `#F5E6C8` / `.parchment-card`, no pure white `#FFFFFF` / `rgba(255,255,255,...)` card backgrounds.
- D&D Vector Icons: Use `@/components/dnd-icons` for key action buttons and status seals.
- Modal Ergonomics: On 1366x768 laptop screens, modals must never overflow the viewport vertically. Action footers ("Далее", "Применить", "Закрыть") must remain visible or pinned at the bottom with scrollable content bodies (`max-h-[85vh]` + `overflow-y-auto`).
- Zero regressions: `npx tsc --noEmit` must yield 0 errors; `npm run test:adversarial` must remain 100% green.

---

## Task 1: Desktop & Laptop Multi-Viewport Audit Suite

**Files:**
- Create: `scratch/desktop-laptop-audit.mjs`

- [ ] **Step 1.1: Create automated capture script**
  - Implement script to launch headless Edge across:
    1. `1920x1080` (Full HD Desktop)
    2. `1366x768` (Standard 14"/15.6" Laptop)
    3. `1440x900` (MacBook / 16:10 Laptop)
  - Programmatically capture:
    - Main Sheet Pages 1, 2, 3 and Top Navigation Bar
    - Character Creation Wizard (all 6 steps)
    - Saved Characters Grid Modal
    - Stats Calculator Modal (3 tabs: Point Buy, 4d6 Roll, Standard Array)
    - Name Generator Modal
    - Share Modal & Public DM View (`/share/[code]`)
    - Level Up Modal
- [ ] **Step 1.2: Execute capture script and collect screenshot artifacts**
  - Save screenshots to `artifacts/desktop_audit/`.
  - Log console warnings or errors during render.

---

## Task 2: Visual & Ergonomic Analysis Across Viewports

**Files:**
- Inspect screenshot artifacts and examine components:
  - `src/app/page.tsx`
  - `src/components/wizard/CharacterCreationWizardModal.tsx`
  - `src/components/tools/CharacterGridModal.tsx`
  - `src/components/tools/StatsCalculatorModal.tsx`
  - `src/components/tools/NameGeneratorModal.tsx`
  - `src/components/tools/ShareModal.tsx`
  - `src/app/share/[code]/page.tsx`

- [ ] **Step 2.1: Inspect 1366x768 Laptop Constraints**
  - Verify modal heights (`max-h-[85vh]` / `max-h-[90vh]`).
  - Verify footer button visibility without mandatory scroll.
  - Verify grid card density in Character Grid Modal.
- [ ] **Step 2.2: Inspect Full HD & 1440x900 Desktop Alignment**
  - Verify container centering, max-width constraints, margins, and column balancing.
  - Check contrast of text and parchment inputs.

---

## Task 3: Implement Layout and Styling Fixes

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`
- Modify: `src/components/tools/CharacterGridModal.tsx`
- Modify: `src/components/tools/StatsCalculatorModal.tsx`
- Modify: `src/components/tools/NameGeneratorModal.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/share/[code]/page.tsx`

- [ ] **Step 3.1: Fix Modal Viewport Containment on Laptops**
  - Ensure all modals use flex column layouts with `flex-1 overflow-y-auto` body and sticky header/footer.
- [ ] **Step 3.2: Optimize Character Grid & Cards for Laptops**
  - Adjust grid breakpoints: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` with comfortable card heights.
- [ ] **Step 3.3: Refine Wizard Step Navigation & Layouts**
  - Keep step tabs visible without wrapping awkwardly on narrow laptop widths.
- [ ] **Step 3.4: Polish Typography and Parchment Contrast**
  - Clean up any awkward shadows or misaligned action icons.

---

## Task 4: Re-Audit, Verification & Commit

- [ ] **Step 4.1: Re-run Screenshot Capture Suite**
  - Verify fixes on all 3 viewports.
- [ ] **Step 4.2: Run TypeScript and Adversarial Tests**
  - `npx tsc --noEmit`
  - `npm run test:adversarial`
- [ ] **Step 4.3: Update Graphify Knowledge Graph**
  - `graphify update .`
- [ ] **Step 4.4: Commit and Push**
  - Commit fixes and push to `origin main`.
