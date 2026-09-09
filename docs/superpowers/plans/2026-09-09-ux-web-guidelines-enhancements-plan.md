# UX & Web Guidelines Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement UX, accessibility, keyboard navigation, and layout improvements for D&D 5e Character Sheet based on Web Interface Guidelines (excluding invisible screen-reader `aria-label`s).

**Architecture:** Modifies global CSS (`globals.css`) for focus states, tabular numbers, and motion preferences; updates `src/app/page.tsx` for expanded skill/saving throw hit targets, form wrapping, and accessible keyboard dice rolling; introduces `useEscapeKey` hook for modal dismissal; adds image sizing to prevent layout shift.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-09-ux-web-guidelines-enhancements-design.md`

## Global Constraints
- Preserve Parchment Medieval Theme (`AGENTS.md`): all interactive states must use antique gold `#C9A84C` / `#8B6914` and dark leather brown tones.
- No regression in existing tests: all 91 adversarial tests must stay green.
- TypeScript compiler (`tsc --noEmit`) and ESLint must produce 0 errors/warnings.
- Never leave server daemons running.

---

### Task 1: Global CSS Enhancements (`globals.css`)

**Files:**
- Modify: `src/app/globals.css`
- Test: `test/css-ux-standards.test.mjs`

**Interfaces:**
- Produces: `:focus-visible` styling, `font-variant-numeric: tabular-nums` classes, clean `transition` properties, `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 1: Write test checking globals.css rules**
Write `test/css-ux-standards.test.mjs` that verifies:
1. `:focus-visible` exists with `#C9A84C`.
2. `tabular-nums` is defined for numbers.
3. `prefers-reduced-motion` is declared.
4. Absence of bare `transition: all` in core button and input classes.

- [ ] **Step 2: Run test to verify it fails**
Run: `node test/css-ux-standards.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Update `src/app/globals.css`**
1. Add `:focus-visible` rules:
```css
:focus-visible {
  outline: 2px solid #C9A84C !important;
  outline-offset: 2px !important;
}
```
2. Add `tabular-nums` to `.parchment-input`, `.parchment-input-center`, `.calc-badge`, and `.roll-result-total`.
3. Replace `transition: all ...` with explicit `transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;` in `.parchment-btn`, `.parchment-btn-secondary`, `.parchment-level-btn`, `.parchment-header-btn`, `.parchment-remove-btn`, `.parchment-textarea`, `.parchment-input-boxed`, `.parchment-select`.
4. Add `@media (prefers-reduced-motion: reduce)` override block at end of `globals.css`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node test/css-ux-standards.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/app/globals.css test/css-ux-standards.test.mjs && git commit -m "style(ux): add focus-visible ring, tabular numbers, and optimize transitions"`

---

### Task 2: Clickable Hit Targets for Skills, Saves & Form Labels

**Files:**
- Modify: `src/app/page.tsx`
- Test: `test/hit-targets.test.mjs`

**Interfaces:**
- Produces: Expanded click hit targets for skill rows and saving throw abbreviations; `id` and `htmlFor` association for `StatInput` and core info inputs.

- [ ] **Step 1: Write test for hit target behavior**
Write `test/hit-targets.test.mjs` to test click propagation and state toggle logic.

- [ ] **Step 2: Run test to verify it fails**
Run: `node test/hit-targets.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Update `src/app/page.tsx`**
1. In `StatInput`, generate unique `inputId = 'stat-input-' + label.replace(/\s+/g, '-').toLowerCase()` and bind `<label htmlFor={inputId}>` and `<input id={inputId}>`.
2. In skill list rendering (around line 3030):
Make `<span className="flex-1 text-xs cursor-pointer select-none hover:text-[#8B4513]" onClick={() => updateSkillProf(skill, 'skillProficiencies', !isProf)}>` toggle skill proficiency on click!
3. In saving throw rendering (around line 2840):
Make the saving throw label / abbreviation click trigger `updateSaveProf(abbr, !isProf)`.
4. Link character name, class name, and race name inputs with `id` and `htmlFor`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node test/hit-targets.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/app/page.tsx test/hit-targets.test.mjs && git commit -m "feat(ux): expand skill and save hit targets and link form labels to inputs"`

---

### Task 3: Escape Key Modal Dismissal & Keyboard Dice Rolls

**Files:**
- Create: `src/hooks/useEscapeKey.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/levelup/LevelUpModal.tsx`
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`
- Modify: `src/components/tools/NameGeneratorModal.tsx`
- Modify: `src/components/tools/StatsCalculatorModal.tsx`
- Modify: `src/components/tools/ShareModal.tsx`
- Modify: `src/components/compendium/ClassSelectorModal.tsx`
- Modify: `src/components/compendium/RaceSelectorModal.tsx`
- Modify: `src/components/compendium/SubclassSelectorModal.tsx`
- Modify: `src/components/compendium/ItemDetailModal.tsx`
- Modify: `src/components/compendium/CompendiumModals.tsx`

**Interfaces:**
- Produces: `useEscapeKey(handler: () => void, active: boolean)` hook; `<button className="calc-badge roll-badge">` keyboard-interactive dice trigger.

- [ ] **Step 1: Create `src/hooks/useEscapeKey.ts`**
```ts
import { useEffect } from 'react';

export function useEscapeKey(onEscape?: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive || !onEscape) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscape();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}
```

- [ ] **Step 2: Update `RollBadge` in `src/app/page.tsx`**
Convert `RollBadge` from `<span onClick={handleClick}>` to:
```tsx
<button
  type="button"
  className="calc-badge roll-badge cursor-pointer"
  title={label ? `${label} — нажмите или нажмите Enter для броска d20` : 'Нажмите для броска d20'}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  }}
>
  {value}
</button>
```

- [ ] **Step 3: Integrate `useEscapeKey` into all modals**
Add `useEscapeKey(onClose)` / `useEscapeKey(onCancel)` to each modal so pressing Escape instantly dismisses the dialog.

- [ ] **Step 4: Verify compilation and tests**
Run: `npx tsc --noEmit && npm run test:adversarial`
Expected: 0 errors, 91/91 passing.

- [ ] **Step 5: Commit**
`git add src/hooks/useEscapeKey.ts src/app/page.tsx src/components/ && git commit -m "feat(a11y): add Escape key modal dismissal and keyboard dice rolls"`

---

### Task 4: Auth Modal Form Wrapping, Image Sizing & Typographic Ellipsis

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/share/[code]/page.tsx`
- Modify: `src/components/tools/CharacterGridModal.tsx`
- Modify: `src/components/wizard/CharacterCreationWizardModal.tsx`
- Modify: `src/components/levelup/LevelUpModal.tsx`
- Modify: `src/components/compendium/ClassSelectorModal.tsx`
- Modify: `src/components/compendium/RaceSelectorModal.tsx`
- Modify: `src/components/compendium/CompendiumModals.tsx`

**Interfaces:**
- Produces: `<form onSubmit={...}>` in `AuthModal` with Enter key submission; explicit `width`, `height`, and `loading="lazy"` on portrait images; typographical `…` replacement.

- [ ] **Step 1: Wrap `AuthModal` in `<form onSubmit={...}>`**
1. In `AuthModal` (`src/app/page.tsx`), wrap the credentials block in `<form onSubmit={(e) => { e.preventDefault(); onAuth(); }}>`.
2. Add `name="email"`, `autoComplete="email"`, `spellCheck={false}` to email input.
3. Add `name="password"`, `autoComplete={isSignUp ? "new-password" : "current-password"}` to password input.
4. Set submit button `type="submit"`.

- [ ] **Step 2: Add explicit dimensions and lazy loading to images**
1. `src/app/page.tsx:3265`: Add `width={144} height={176} loading="lazy"` to portrait `<img>`.
2. `src/app/share/[code]/page.tsx:425`: Add `width={144} height={176} loading="lazy"`.
3. `src/components/tools/CharacterGridModal.tsx:685`: Add `width={72} height={72} loading="lazy"`.

- [ ] **Step 3: Replace `...` with `…` in placeholders and loading labels**
Replace occurrences of `...` in user-facing placeholders and status texts across the files.

- [ ] **Step 4: Verify compilation and tests**
Run: `npx tsc --noEmit && npx eslint . && npm run test:adversarial`
Expected: 0 errors, 0 lint warnings, 91/91 tests passing.

- [ ] **Step 5: Commit**
`git add src/app/ src/components/ && git commit -m "feat(ux): wrap auth modal in form with Enter submit, set image dimensions, and fix ellipsis typography"`

---

### Task 5: Playwright Headless Edge E2E Verification

**Files:**
- Create: `scratch/verify-ux-enhancements.mjs`
- Test: Full interactive browser verification in Microsoft Edge

- [ ] **Step 1: Write E2E verification script**
Script tests:
1. Toggling skill proficiency by clicking the skill text label.
2. Triggering d20 roll by pressing `Enter` on `RollBadge`.
3. Opening `LevelUpModal` and pressing `Escape` to close it.
4. Opening `CharacterCreationWizardModal` and pressing `Escape` to close it.
5. Opening `AuthModal`, typing email/password, and pressing `Enter` to submit.
6. Tab key focus navigation showing golden `:focus-visible` outline.

- [ ] **Step 2: Build project and launch Next.js server**
Run: `npm run build` and launch test server.

- [ ] **Step 3: Execute Playwright script**
Run: `node scratch/verify-ux-enhancements.mjs`
Expected: All 6 scenarios pass with screenshots.

- [ ] **Step 4: Stop test server & commit audit artifacts**
`git add scratch/ && git commit -m "test(ux): verify all UX enhancements via Playwright E2E"`
