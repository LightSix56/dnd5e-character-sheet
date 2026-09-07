# Mobile Responsive & Ergonomics Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the D&D 5e character sheet, creation wizard, tools modals, and share page into an ergonomic, visually flawless mobile experience on 360px-412px viewports with automated headless Edge screenshot audits.

**Architecture:** 
- Mobile Header: On mobile viewports (<768px), collapse multi-row toolbar into a sleek compact bar with logo, "+ Создать" button, cloud sync status, and a parchment action drawer ("☰ Меню").
- Wizard Modal: Convert wide 6-step progress bar into a compact responsive step indicator ("Шаг X из 6"), fix modal footer sticky to bottom so "Назад" / "Далее" buttons are always accessible without scrolling.
- Main Sheet: Reorganize attributes into 3x2 grid on mobile, combat block into 2x2 grid, wrap attack and weapon tables into horizontal-scrolling cards with parchment scroll indicators, make touch targets >= 44px.
- Share & DM View Page: Make action bar responsive and stack cleanly on mobile, adapt portrait + info grid to single-column flex.
- Automated Visual Verification: Use `puppeteer-core` with native Chromium (`msedge.exe`) to capture high-res mobile screenshots (390x844) and inspect them with `view_file` to verify zero visual artifacts.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, Puppeteer-Core + Microsoft Edge Chromium.

**Spec:** `docs/TECH_SPEC.md`

## Global Constraints
- Preserve Parchment Medieval Design System (no pure white backgrounds, no default blue focus rings, no raw system emojis in controls).
- Maintain 100% strict TypeScript types (`npx tsc --noEmit` must pass with 0 errors).
- Zero ESLint errors (`npx eslint .` must pass with 0 errors).
- Maintain all 64 adversarial unit tests (`npm run test:adversarial` must pass with 0 failures).

---

### Task 1: Automated Mobile Visual Test Runner & Baseline Screenshot Capture

**Files:**
- Create: `scripts/mobile-visual-audit.mjs`
- Test: `node scripts/mobile-visual-audit.mjs`

**Interfaces:**
- Consumes: Next.js production build (`.next/`), Microsoft Edge executable (`msedge.exe`), `puppeteer-core`.
- Produces: Screenshot PNGs in `mobile_audit/` for visual inspection via `view_file`.

- [ ] **Step 1: Create the automated mobile audit script**
Create `scripts/mobile-visual-audit.mjs` that spawns `next start -p 3099`, connects puppeteer-core to Edge at 390x844 viewport (2x DPR), captures all screens and modals, and shuts down the server cleanly.

- [ ] **Step 2: Run mobile audit script to capture baseline screenshots**
Run `node scripts/mobile-visual-audit.mjs` and verify screenshots are generated.

- [ ] **Step 3: Inspect baseline screenshots with view_file**
Examine captured images to log specific mobile layout defects (toolbar stacking, wizard overflow, button touch sizes).

- [ ] **Step 4: Commit test runner**
`git add scripts/mobile-visual-audit.mjs && git commit -m "test(mobile): add automated puppeteer-core edge screenshot runner"`

---

### Task 2: Responsive Mobile Header & Collapsible Action Drawer

**Files:**
- Modify: `src/app/page.tsx` (lines ~3170-3290)
- Modify: `src/app/globals.css` (lines ~930-970)

**Interfaces:**
- Consumes: `showCreateChoiceModal`, `handleSaveJSON`, `handleLoadJSON`, `handleReset`, `handleExport`, `handleCloudSave`, `handleCloudLoad`, `handleShare`, `user`.
- Produces: Responsive header layout: on `md:` desktop shows full button groups; on mobile shows compact bar with `☰ Меню` button that toggles an animated parchment action drawer.

- [ ] **Step 1: Add mobile menu state and drawer JSX in page.tsx**
Add `const [showMobileMenu, setShowMobileMenu] = useState(false)`.
In header, add `hidden md:flex` to large toolbar groups, and add a mobile-only button `md:hidden parchment-header-btn` with `☰ Меню`.
Render a mobile drawer/sheet modal containing all secondary actions with clear icons and touch-friendly paddings.

- [ ] **Step 2: Add parchment mobile drawer styling in globals.css**
Define `.parchment-mobile-drawer` with backdrop blur, gold borders, and smooth slide-down animation.

- [ ] **Step 3: Run mobile audit script and inspect header screenshot**
Run `node scripts/mobile-visual-audit.mjs` and view `01_home_header.png` and `01b_mobile_menu_open.png` via `view_file`. Verify header is compact and menu is intuitive.

- [ ] **Step 4: Verify type safety and commit**
Run `npx tsc --noEmit` then `git commit -m "feat(mobile): implement compact mobile header with collapsible parchment action drawer"`.

---

### Task 3: Mobile Character Creation Wizard Ergonomics & Sticky Controls

**Files:**
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`

**Interfaces:**
- Consumes: Wizard state (`step`, `race`, `class`, `scores`, `spells`), callbacks (`onClose`, `onComplete`).
- Produces: Responsive modal: sticky bottom footer with navigation buttons, compact mobile step progress header, responsive touch cards for race/class options.

- [ ] **Step 1: Replace wide 6-button step bar with responsive header**
On mobile (`sm:hidden`), display:
```tsx
<div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/20">
  <span className="text-xs font-bold text-[#3D2012]">Шаг {step} из 6: {STEP_TITLES[step-1]}</span>
  <div className="flex gap-1.5">{/* 6 dots */}</div>
</div>
```
Keep full buttons visible on `sm:flex`.

- [ ] **Step 2: Implement sticky mobile footer for wizard navigation**
Wrap the bottom buttons ("Назад", "Далее", "Завершить") in a sticky footer container:
`sticky bottom-0 bg-[#F5E6C8] z-20 border-t border-[#C9A84C]/40 p-3 flex items-center justify-between gap-2 shadow-lg`.
This ensures the player can always progress without scrolling through 50 spells or races.

- [ ] **Step 3: Adapt option cards and ability score selectors for touch**
Ensure buttons and selection cards have `min-h-[44px]`, grid uses `grid-cols-1 sm:grid-cols-2`.
In Step 4 (Abilities), format Point Buy and Standard Array inputs with clear +/- buttons and touch spacing.

- [ ] **Step 4: Run mobile audit script and inspect wizard screenshots**
Run `node scripts/mobile-visual-audit.mjs` and inspect `06_modal_wizard_step1.png` and `06b_modal_wizard_step4.png` via `view_file`.

- [ ] **Step 5: Verify tests and commit**
Run `npm run test:adversarial` and commit: `git commit -m "feat(mobile): optimize character creation wizard for touch screens and small viewports"`.

---

### Task 4: Main Sheet Mobile Optimization (Tabs, Attributes, Combat Block, Attacks, Spells)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `char`, `activeTab`, stat inputs, weapon tables, spell lists.
- Produces: Mobile-first responsive layout across all 3 sheet tabs.

- [ ] **Step 1: Optimize Tab Bar for mobile touch**
Give tab buttons a minimum height of 44px, active indicator with gold underglow, and clear icons.

- [ ] **Step 2: Responsive Attribute Score Block (6 stats)**
On mobile, format the 6 core stats into a clean 3-column or 2-column grid (`grid-cols-3 gap-2`) with large clickable modifier badges for d20 dice rolls.

- [ ] **Step 3: Responsive Combat Stats Block**
Format AC, Initiative, Speed, HP, Temporary HP, and Hit Dice into a balanced 2x2 or 2x3 mobile grid (`grid-cols-2 sm:grid-cols-4`) so numbers and labels are never truncated.

- [ ] **Step 4: Overflow protection for Attacks & Equipment tables**
Wrap weapon and spellcasting tables with `overflow-x-auto` and responsive card fallbacks so table columns never force horizontal page scroll on 360px-390px viewports.

- [ ] **Step 5: Run mobile audit script and inspect all 3 tabs**
Run audit and inspect `02_home_page1_combat.png`, `03_home_page1_attacks.png`, `04_home_page2_details.png`, and `05_home_page3_spells.png` via `view_file`.

- [ ] **Step 6: Verify types & commit**
Run `npx tsc --noEmit` and commit: `git commit -m "feat(mobile): responsive attributes, combat stats, and scroll-guarded tables on main sheet"`.

---

### Task 5: Mobile Share & DM View Page Optimization

**Files:**
- Modify: `src/app/share/[code]/page.tsx`

**Interfaces:**
- Consumes: Shared character snapshot via `/api/share/[code]`.
- Produces: Seamless read-only mobile sheet for DMs and party members.

- [ ] **Step 1: Responsive Action Bar in Share View**
On mobile, reorganize the top bar: logo and "Режим просмотра" badge on top, with action buttons ("Скопировать ссылку", "Сохранить", "Открыть в редакторе") wrapped into a neat touch-friendly flex bar (`flex-wrap sm:flex-nowrap gap-2`).

- [ ] **Step 2: Responsive Header and Stat Summary**
Ensure character portrait, class badges, and level are stacked cleanly on mobile without horizontal clipping.
Align AC, HP, Passive Perception, and Spell DC into a 2x2 or 4-item grid on mobile.

- [ ] **Step 3: Run mobile audit script on share page**
Capture `08_share_view_mobile.png` and inspect via `view_file`.

- [ ] **Step 4: Verify types & commit**
Run `npx tsc --noEmit` and commit: `git commit -m "feat(mobile): optimize public shared character page for smartphones"`.

---

### Task 6: Final Full-Suite Verification & Zero-Artifact Sign-Off

**Files:**
- Audit all modified files: `src/app/page.tsx`, `src/app/globals.css`, `src/components/wizard/CharacterCreationWizardModal.tsx`, `src/app/share/[code]/page.tsx`.

**Verification Gate Checklist:**
- [ ] Run full mobile screenshot suite (`node scripts/mobile-visual-audit.mjs`).
- [ ] Inspect all captured PNG images in `mobile_audit/` via `view_file` to confirm zero visual artifacts.
- [ ] Run `npm run test:adversarial` (64/64 tests green).
- [ ] Run `npx tsc --noEmit` (0 compilation errors).
- [ ] Run `npx eslint .` (0 lint errors).
- [ ] Run `npx next build` (production build succeeds).
- [ ] Commit and push to `origin main`.
