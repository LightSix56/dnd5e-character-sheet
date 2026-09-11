import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DND_COMPENDIUM_RACES, findRaceByName, CompendiumRace } from '../src/data/compendium/races';

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

  it('verifies MPMM and Setting merged races have accurate choices configured', () => {
    // 1. Kobold MPMM
    const kobold = DND_COMPENDIUM_RACES.find(r => r.id === 'kobold-mpmm');
    assert.ok(kobold, 'kobold-mpmm must exist in compendium');
    assert.ok(kobold.choices?.isFlexibleASI, 'kobold-mpmm must have isFlexibleASI');
    assert.ok(typeof kobold.choices?.cantripChoice === 'object');
    if (typeof kobold.choices?.cantripChoice === 'object') {
      assert.equal(kobold.choices.cantripChoice.class, 'sorcerer');
      assert.deepEqual(kobold.choices.cantripChoice.abilityChoice, ['ИНТ', 'МДР', 'ХАР']);
    }

    // 2. Lizardfolk MPMM
    const lizardfolk = DND_COMPENDIUM_RACES.find(r => r.id === 'lizardfolk-mpmm');
    assert.ok(lizardfolk, 'lizardfolk-mpmm must exist in compendium');
    assert.equal(lizardfolk.choices?.extraSkillsCount, 2);
    assert.ok(lizardfolk.choices?.skillChoiceOptions?.includes('Выживание'));

    // 3. Autognome
    const autognome = DND_COMPENDIUM_RACES.find(r => r.id === 'autognome');
    assert.ok(autognome, 'autognome must exist in compendium');
    assert.ok(typeof autognome.choices?.toolChoice === 'object');
    if (typeof autognome.choices?.toolChoice === 'object') {
      assert.equal(autognome.choices.toolChoice.category, 'artisan');
      assert.equal(autognome.choices.toolChoice.count, 2);
    }

    // 4. Astral Elf
    const astralElf = DND_COMPENDIUM_RACES.find(r => r.id === 'astral-elf');
    assert.ok(astralElf, 'astral-elf must exist in compendium');
    assert.ok(typeof astralElf.choices?.cantripChoice === 'object');
    if (typeof astralElf.choices?.cantripChoice === 'object') {
      assert.ok(astralElf.choices.cantripChoice.spellOptions?.includes('Свет'));
      assert.deepEqual(astralElf.choices.cantripChoice.abilityChoice, ['ИНТ', 'МДР', 'ХАР']);
    }

    // 5. Simic Hybrid
    const simic = DND_COMPENDIUM_RACES.find(r => r.id === 'simic-hybrid');
    assert.ok(simic, 'simic-hybrid must exist in compendium');
    assert.ok(simic.choices?.customFeatureChoice, 'simic-hybrid must have customFeatureChoice');
    assert.equal(simic.choices?.customFeatureChoice?.options.length, 3);
    assert.ok(simic.choices?.customFeatureChoice?.options.some(o => o.id === 'manta-glide'));

    // 6. Githyanki & Githzerai MPMM
    const githyanki = DND_COMPENDIUM_RACES.find(r => r.id === 'githyanki-mpmm');
    assert.ok(githyanki, 'githyanki-mpmm must exist');
    assert.ok(githyanki.traits.length >= 3, 'githyanki-mpmm must have traits parsed');
    if (typeof githyanki.choices?.cantripChoice === 'object') {
      assert.deepEqual(githyanki.choices.cantripChoice.spellOptions, ['Волшебная рука']);
      assert.deepEqual(githyanki.choices.cantripChoice.abilityChoice, ['ИНТ', 'МДР', 'ХАР']);
    }

    // 7. Harengon MPMM
    const harengon = DND_COMPENDIUM_RACES.find(r => r.id === 'harengon-mpmm');
    assert.ok(harengon, 'harengon-mpmm must exist');
    assert.deepEqual(harengon.choices?.sizeChoice, ['Средний', 'Маленький']);

    // 8. Kender
    const kender = DND_COMPENDIUM_RACES.find(r => r.id === 'kender');
    assert.ok(kender, 'kender must exist from Dragonlance');
    assert.equal(kender.size, 'Маленький');
  });
});
