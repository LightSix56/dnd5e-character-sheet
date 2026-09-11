import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DND_COMPENDIUM_RACES, findRaceByName, CompendiumRace } from '../src/data/compendium/races.ts';

describe('Adversarial Quality Gate: D&D 5e Races Compendium Integrity', () => {
  it('contains at least 49 base races and has no duplicate IDs', () => {
    assert.ok(DND_COMPENDIUM_RACES.length >= 49, `Expected at least 49 races, found ${DND_COMPENDIUM_RACES.length}`);
    const seenIds = new Set<string>();
    for (const r of DND_COMPENDIUM_RACES) {
      assert.ok(r.id && typeof r.id === 'string', `Race missing id: ${JSON.stringify(r.name)}`);
      assert.ok(!seenIds.has(r.id), `Duplicate race id detected: "${r.id}" for race "${r.name}"`);
      seenIds.add(r.id);
    }
  });

  it('all races satisfy strict schema constraints', () => {
    const validCategories = new Set(['core', 'multiverse', 'setting', 'spelljammer', 'lineage']);
    const validSizes = new Set(['Средний', 'Маленький']);

    for (const r of DND_COMPENDIUM_RACES) {
      // Name & Identification
      assert.ok(r.name && r.name.trim().length > 0, `Race ${r.id} missing name`);
      assert.ok(r.nameEn && r.nameEn.trim().length > 0, `Race ${r.id} missing nameEn`);
      assert.ok(r.source && r.source.trim().length > 0, `Race ${r.id} missing source`);
      assert.ok(validCategories.has(r.category), `Race ${r.id} invalid category: "${r.category}"`);

      // Mechanics
      assert.ok(typeof r.speed === 'number' && r.speed >= 20 && r.speed <= 60, `Race ${r.id} invalid speed: ${r.speed}`);
      assert.ok(validSizes.has(r.size), `Race ${r.id} invalid size: "${r.size}"`);
      assert.ok(typeof r.darkvision === 'number' && r.darkvision >= 0 && r.darkvision <= 150, `Race ${r.id} invalid darkvision: ${r.darkvision}`);
      assert.ok(Array.isArray(r.languages) && r.languages.length > 0, `Race ${r.id} must have at least 1 language`);

      // Content Integrity
      const hasTraits = Array.isArray(r.traits) && r.traits.length > 0;
      const hasSubraces = Array.isArray(r.subraces) && r.subraces.length > 0;
      assert.ok(hasTraits || hasSubraces, `Race ${r.id} must have either traits or subraces`);

      if (r.traits) {
        for (const t of r.traits) {
          assert.ok(t.name && t.name.trim().length > 0, `Race ${r.id} trait missing name`);
          assert.ok(t.description && t.description.trim().length > 0, `Race ${r.id} trait "${t.name}" missing description`);
        }
      }

      // Subraces
      if (r.subraces) {
        const seenSubIds = new Set<string>();
        for (const sub of r.subraces) {
          assert.ok(sub.id && typeof sub.id === 'string', `Subrace in ${r.id} missing id`);
          assert.ok(!seenSubIds.has(sub.id), `Duplicate subrace id: ${sub.id} in ${r.id}`);
          seenSubIds.add(sub.id);
          assert.ok(sub.name && sub.name.trim().length > 0, `Subrace ${sub.id} in ${r.id} missing name`);
          assert.ok(Array.isArray(sub.traits), `Subrace ${sub.id} in ${r.id} traits must be array`);
        }
      }

      // Choices Validation
      if (r.choices) {
        if (r.choices.sizeChoice) {
          assert.ok(Array.isArray(r.choices.sizeChoice), `Race ${r.id} sizeChoice must be array`);
          for (const s of r.choices.sizeChoice) {
            assert.ok(validSizes.has(s), `Race ${r.id} invalid sizeChoice option: "${s}"`);
          }
        }
        if (r.choices.extraSkillsCount !== undefined) {
          assert.ok(r.choices.extraSkillsCount > 0, `Race ${r.id} extraSkillsCount must be > 0`);
        }
        if (r.choices.skillChoiceOptions !== undefined) {
          assert.ok(Array.isArray(r.choices.skillChoiceOptions) && r.choices.skillChoiceOptions.length > 0, `Race ${r.id} skillChoiceOptions must be non-empty array`);
        }
        if (r.choices.cantripChoice) {
          if (typeof r.choices.cantripChoice === 'string') {
            assert.ok(['wizard', 'druid', 'cleric', 'sorcerer', 'warlock', 'bard', 'artificer', 'any'].includes(r.choices.cantripChoice), `Race ${r.id} unknown cantrip class`);
          } else {
            assert.ok(r.choices.cantripChoice.class || r.choices.cantripChoice.spellOptions, `Race ${r.id} cantripConfig must specify class or spellOptions`);
          }
        }
      }
    }
  });

  it('findRaceByName locates races by Russian name, English name, and prefix', () => {
    const human = findRaceByName('Человек');
    assert.ok(human, 'Should find Человек');
    assert.equal(human.id, 'human');

    const elf = findRaceByName('Elf');
    assert.ok(elf, 'Should find Elf by English name');
    assert.equal(elf.id, 'elf');

    const dwarfPrefix = findRaceByName('Дворф горный');
    assert.ok(dwarfPrefix, 'Should find Дворф by prefix');
    assert.equal(dwarfPrefix.id, 'dwarf');
  });
});
