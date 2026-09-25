# Core Fixes & Enhancements: Character Sheet and Battle Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate critical cross-project bugs, data corruption hazards, and stubs between `dnd5e-character-sheet` and `battle+ai`: preserve character sheet state integrity in Supabase, fix combat spell slots parsing, accurately compute full ability scores (base + race + ASI), and replace hardcoded name-based attack/ability generators with robust data-driven rules.

**Architecture:** 
1. Add defensive resilience in `dnd5e-character-sheet`'s `normalizeCharacterData` to unpack nested snapshots if encountered.
2. Fix `RoomService.joinRoom` in `battle+ai` so it stores the unwrapped `CharacterData` directly into Supabase `characters.data`.
3. Fix `api/combat/import-character` to support object-based `spellSlots` (`{ totalSlots, expendedSlots }`) and aggregate `abilityScores + abilityBonuses + asiBonuses`.
4. Refactor `generator.ts` in `battle+ai` to generate class-appropriate attacks, saving throws, and spells for ANY imported hero rather than 4 hardcoded names.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5, Prisma ORM (SQLite / Postgres), Supabase SSR, Node test runner (`tsx --test`), Vitest.

---

## Global Constraints
- `dnd5e-character-sheet` must pass 100% of existing tests (`npm run test:adversarial` -> 540+ passing) and have 0 `tsc` errors.
- `battle+ai` must pass 100% of existing tests (`npx vitest run` -> 662+ passing) and have 0 `tsc` errors.
- No regression in Supabase database schema or existing character fields.
- Strictly adhere to D&D 5e official class saving throw proficiencies and attack mechanics.

---

### Task 1: Supabase Character Data Integrity & Unnesting Defense

**Files:**
- Modify: `c:\antig\dnd5e-character-sheet\src\lib\dnd-types.ts:1507-1536`
- Modify: `C:\antig\battle+ai\src\lib\room\room-service.ts:255-275`
- Test: `c:\antig\dnd5e-character-sheet\test\character-normalization-resilience.test.ts`
- Test: `C:\antig\battle+ai\src\lib\room\__tests__/room-service.test.ts`

**Interfaces:**
- Consumes: `raw: Partial<CharacterData> | Record<string, any>`
- Produces: Normalized `CharacterData` without losing top-level fields even if wrapped inside `data.data` or `characterSnapshot`.

- [ ] **Step 1: Write failing test in `dnd5e-character-sheet`**
Create `c:\antig\dnd5e-character-sheet\test\character-normalization-resilience.test.ts`:
Verify that `normalizeCharacterData` extracts `abilityScores`, `attacks`, `level`, and `className` when given a nested snapshot `{ id, name, level, data: { name, level, className, abilityScores, attacks } }`.

- [ ] **Step 2: Run test to confirm it fails**
Run `npx tsx --test test/character-normalization-resilience.test.ts`.

- [ ] **Step 3: Implement defensive unwrapping in `dnd-types.ts`**
In `c:\antig\dnd5e-character-sheet\src\lib\dnd-types.ts`:
Update `normalizeCharacterData` to inspect `raw`:
```ts
const source = (raw && typeof (raw as any).data === 'object' && (raw as any).data !== null && ((raw as any).data.abilityScores || (raw as any).data.className))
  ? (raw as any).data as Partial<CharacterData>
  : raw;
```
Ensure all property accesses use `source`.

- [ ] **Step 4: Fix `RoomService.joinRoom` in `battle+ai`**
In `C:\antig\battle+ai\src\lib\room\room-service.ts`:
Ensure `input.characterSnapshot` is unwrapped before saving to `characters` table:
```ts
const snapObj = input.characterSnapshot as any;
const cleanCharData = (snapObj?.data && typeof snapObj.data === "object" && (snapObj.data.abilityScores || snapObj.data.className))
  ? snapObj.data
  : snapObj;

const { error: charSyncError } = await this.client
  .from("characters")
  .upsert(
    {
      id: targetCharacterId,
      user_id: input.userId,
      name: charName,
      data: cleanCharData,
    },
    { onConflict: "id" }
  );
```

- [ ] **Step 5: Run tests in both projects**
Run:
`npx tsx --test test/character-normalization-resilience.test.ts` in `dnd5e-character-sheet`
`npx vitest run src/lib/room/__tests__/room-service.test.ts` in `battle+ai`

---

### Task 2: Fix Spell Slots & Full Stats in Combat Character Import

**Files:**
- Modify: `C:\antig\battle+ai\src\app\api\combat\import-character\route.ts:175-230`
- Test: `C:\antig\battle+ai\src\app\api\combat\__tests__/import-character-slots-and-stats.test.ts`

**Interfaces:**
- Consumes: `characterJson` from `dnd5e-character-sheet` with `abilityScores`, `abilityBonuses`, `asiBonuses`, and `spellSlots: Record<number, { totalSlots: number, expendedSlots: number }>`.
- Produces: `Combatant` with accurate `abilityMods` (reflecting base + racial + ASI) and populated `spells.slots`.

- [ ] **Step 1: Write failing test in `battle+ai`**
Create `C:\antig\battle+ai\src\app\api\combat\__tests__/import-character-slots-and-stats.test.ts`:
Post a character with:
- Base INT 15, racial INT +1, ASI INT +2 (total 18 -> mod +4)
- `spellSlots: { 1: { totalSlots: 4, expendedSlots: 1 }, 2: { totalSlots: 2, expendedSlots: 0 } }`
Assert combatant has `abilityMods.INT === 4` and `spells.slots[1].max === 4` and `spells.slots[1].used === 1`.

- [ ] **Step 2: Run test to confirm it fails**
Run `npx vitest run src/app/api/combat/__tests__/import-character-slots-and-stats.test.ts`.

- [ ] **Step 3: Fix stats calculation and spell slots in `import-character/route.ts`**
In `C:\antig\battle+ai\src\app\api\combat\import-character\route.ts`:
1. Use `extractCharacterStats(cj)` or sum base + bonuses:
```ts
const abilityScores = cj.abilityScores || cj.attributes || cj.stats || {};
const abilityBonuses = cj.abilityBonuses || {};
const asiBonuses = cj.asiBonuses || {};

const abilityMods: Record<string, number> = {};
for (const [ru, en] of Object.entries(ABILITY_RU_TO_EN)) {
  const base = Number(abilityScores[ru] ?? abilityScores[en] ?? 10);
  const bonus = Number(abilityBonuses[ru] ?? abilityBonuses[en] ?? 0);
  const asi = Number(asiBonuses[ru] ?? asiBonuses[en] ?? 0);
  abilityMods[en] = abilityModifier(base + bonus + asi);
}
```
2. Parse `spellSlots`:
```ts
const spellSlotsRaw = cj.spellSlots || {};
const slots: Record<number, { max: number; used: number }> = {};
for (const [levelStr, rawSlot] of Object.entries(spellSlotsRaw)) {
  const lvl = parseInt(levelStr, 10);
  if (lvl >= 1 && lvl <= 9) {
    const total = typeof rawSlot === "number"
      ? rawSlot
      : typeof (rawSlot as any)?.totalSlots === "number"
      ? (rawSlot as any).totalSlots
      : 0;
    const used = typeof (rawSlot as any)?.expendedSlots === "number"
      ? (rawSlot as any).expendedSlots
      : 0;
    if (total > 0) {
      slots[lvl] = { max: total, used };
    }
  }
}
```

- [ ] **Step 4: Verify test passes**
Run `npx vitest run src/app/api/combat/__tests__/import-character-slots-and-stats.test.ts`.

---

### Task 3: Universal Class Attacks, Abilities & Saving Throws in Tactical Spawning

**Files:**
- Modify: `C:\antig\battle+ai\src\lib\combat\generator.ts:920-1325`
- Test: `C:\antig\battle+ai\src\lib\combat\__tests__/generator-party-spawning.test.ts`

**Interfaces:**
- Consumes: Any `Character` record from DB (Barbarian, Wizard, Rogue, Cleric, etc. regardless of name).
- Produces: `Combatant` with class-appropriate attacks, abilities, saving throw proficiencies (`prof: true` for proficient saves), and proper `SpellData` structure.

- [ ] **Step 1: Write failing test in `battle+ai`**
Create `C:\antig\battle+ai\src\lib\combat\__tests__/generator-party-spawning.test.ts`:
Call `createTacticalEncounter` with party characters that have non-preset names (e.g., "Эльдрих", class "Волшебник" and "Роланд", class "Паладин"):
- Verify "Эльдрих" has INT spell attack or spell damage cantrip and INT/WIS save proficiencies (`prof: true`).
- Verify "Роланд" has martial attacks (not generic 1d8 fallback) and WIS/CHA save proficiencies (`prof: true`).

- [ ] **Step 2: Run test to confirm it fails**
Run `npx vitest run src/lib/combat/__tests__/generator-party-spawning.test.ts`.

- [ ] **Step 3: Implement class-based attack, ability, and save resolver in `generator.ts`**
In `C:\antig\battle+ai\src\lib\combat\generator.ts`:
1. Implement `resolveClassSavingThrowProficiencies(className: string): Record<string, boolean>`.
   Standard 5e:
   - Barbarian: STR, CON
   - Bard: DEX, CHA
   - Cleric: WIS, CHA
   - Druid: INT, WIS
   - Fighter: STR, CON
   - Monk: STR, DEX
   - Paladin: WIS, CHA
   - Ranger: STR, DEX
   - Rogue: DEX, INT
   - Sorcerer: CON, CHA
   - Warlock: WIS, CHA
   - Wizard: INT, WIS
   - Artificer: CON, INT
2. Populate `saves` in `combatant.create` with actual proficiency bonus:
   `mod = abilityMod + (prof ? profBonus : 0)`.
3. Provide dynamic attacks and abilities based on `char.class` and best ability modifier when character is not one of the pre-made sample names:
   - Martial classes: main weapon + secondary / ranged.
   - Caster classes: spell cantrips + self-defense weapon.
   - Rogue: finesse weapons + Sneak Attack + Cunning Action.
4. Correct `spells` serialization: generate a valid `SpellData` object with `slots` and `known` IDs instead of passing stringified narrative text.

- [ ] **Step 4: Verify test passes**
Run `npx vitest run src/lib/combat/__tests__/generator-party-spawning.test.ts`.

---

### Task 4: Full Regression Verification & Clean Git Push

**Files:**
- All touched files in `c:\antig\dnd5e-character-sheet` and `C:\antig\battle+ai`.

- [ ] **Step 1: Run typechecks**
Run `npx tsc --noEmit` in `c:\antig\dnd5e-character-sheet` (0 errors).
Run `npx tsc --noEmit` in `C:\antig\battle+ai` (0 errors).

- [ ] **Step 2: Run all tests**
Run `npm run test:adversarial` in `c:\antig\dnd5e-character-sheet` (all 540+ pass).
Run `npx vitest run` in `C:\antig\battle+ai` (all 660+ pass).

- [ ] **Step 3: Graphify update**
Run `graphify update .` in `c:\antig\dnd5e-character-sheet`.
Run `graphify update .` in `C:\antig\battle+ai`.

- [ ] **Step 4: Git commit & push**
Execute:
`$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""; git add .; git commit -m "fix(core): cross-project character data integrity, spell slots, and combat generator"; git push origin main`
