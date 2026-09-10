---
name: dnd-su-parser
description: Fetches and cleanly parses D&D 5e classes, subclasses, spells, and mechanics from dnd.su into structured Markdown and JSON, eliminating 90% of HTML boilerplate.
---

# 📜 D&D.su Class & Mechanics Parser Skill

This skill allows agents to extract clean, authoritative D&D 5e content directly from `dnd.su` with 100% precision, zero HTML boilerplate, and maximum context efficiency.

## 🚀 How to Execute

To fetch and parse any class from `dnd.su`, run:

```bash
npx tsx scripts/fetch-dndsu.ts <название класса или ссылка>
```

### Examples:
- `npx tsx scripts/fetch-dndsu.ts друид`
- `npx tsx scripts/fetch-dndsu.ts wizard`
- `npx tsx scripts/fetch-dndsu.ts жрец`
- `npx tsx scripts/fetch-dndsu.ts https://dnd.su/class/90-druid/`

The parser will:
1. Strip all navigation, banners, headers, footers, scripts, tracking, and comments.
2. Cut raw HTML down by ~85–90% (from 1.5 MB to ~100–150 KB of pure rules Markdown).
3. Save the structured Markdown to `.dndsu-cache/<class>.md`.

---

## 📋 What the Output Contains

The generated Markdown file in `.dndsu-cache/<class>.md` provides:

1. **🛡️ Базовые параметры и владения**:
   - Hit Dice (Кость хитов)
   - Saving Throw Proficiencies (Спасброски)
   - Armor & Weapon Proficiencies (Доспехи и оружие)
   - Tool Proficiencies (Инструменты)
   - Skill Choice Options (Навыки)
2. **📊 Таблица прогрессии (1–20 уровни)**:
   - Level, Proficiency Bonus, Core Features list, Spell Slots / Class resource progression (Rages, Ki, Sorcery Points, Sneak Attack, etc.).
3. **⚔️ Умения базового класса**:
   - Feature title, milestone level, and verbatim rules description.
4. **🌟 Официальные архетипы D&D 5e (WotC)**:
   - Filtered exclusively for official sourcebooks (Player's Handbook, SCAG, Xanathar's, Tasha's, Fizban's, Glory of the Giants).
   - Lists all archetype abilities by level (e.g. 3, 6, 10, 14 ур.), bonus proficiencies, cantrips, and expanded spell lists.
5. **📚 Сторонние и партнерские архетипы**:
   - Partner / setting archetypes (Grim Hollow, Critical Role, Steinhardt's, etc.) cleanly separated.

---

## 🎯 Implementation Workflow for Character Sheet

When implementing or auditing a class in `dnd5e-character-sheet`:
1. Run `npx tsx scripts/fetch-dndsu.ts <класс>`.
2. Open `.dndsu-cache/<class>.md` via `view_file` to review:
   - Core proficiencies & saving throws for `src/data/compendium/classes.ts`.
   - Feature descriptions and milestone levels for `CLASS_FEATURES` and `SUBCLASS_FEATURES`.
   - Archetype bonus spells for `SUBCLASS_EXPANDED_SPELLS` in `src/data/compendium/class-spells.ts` and `src/data/compendium/auto-spells-engine.ts`.
   - Choice points (e.g. fighting styles, skill/tool picks) for `src/components/levelup/level-up-choices.ts`.
3. Verify implementation against test suites (`npm run test:adversarial`).
