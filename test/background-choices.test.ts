import test from 'node:test';
import * as assert from 'node:assert/strict';
import { DND_COMPENDIUM_BACKGROUNDS, type CompendiumBackground } from '../src/data/compendium/backgrounds';
import { ALL_SKILLS } from '../src/lib/dnd-types';
import { resolveBackgroundSkills } from '../src/components/wizard/wizard-helpers';

type SkillName = typeof ALL_SKILLS[number];

test('Background Compendium: All 84 backgrounds grant exactly 2 skills', () => {
  for (const bg of DND_COMPENDIUM_BACKGROUNDS) {
    const fixedCount = bg.skillProficiencies.length;
    const choiceCount = bg.skillChoices?.choose || 0;
    const totalSkills = fixedCount + choiceCount;

    assert.equal(
      totalSkills,
      2,
      `Background "${bg.name}" (${bg.id}) grants ${totalSkills} skills instead of 2 (fixed: ${fixedCount}, choice: ${choiceCount})`
    );
  }
});

test('Background Compendium: All fixed skills are valid D&D 5e skills in ALL_SKILLS', () => {
  for (const bg of DND_COMPENDIUM_BACKGROUNDS) {
    for (const skill of bg.skillProficiencies) {
      assert.ok(
        ALL_SKILLS.includes(skill as SkillName),
        `Background "${bg.name}" (${bg.id}) has invalid skill "${skill}". Must be one of: ${ALL_SKILLS.join(', ')}`
      );
    }
  }
});

test('Background Compendium: All skill choice options are valid D&D 5e skills and have no duplicates', () => {
  for (const bg of DND_COMPENDIUM_BACKGROUNDS) {
    if (!bg.skillChoices) continue;

    const { choose, options } = bg.skillChoices;
    assert.ok(choose >= 1, `Background "${bg.name}" (${bg.id}) has choose < 1`);
    assert.ok(
      options.length >= choose + 1,
      `Background "${bg.name}" (${bg.id}) must offer at least ${choose + 1} options to choose from, got ${options.length}`
    );

    // Options must be in ALL_SKILLS
    for (const opt of options) {
      assert.ok(
        ALL_SKILLS.includes(opt as SkillName),
        `Background "${bg.name}" (${bg.id}) has invalid choice option "${opt}"`
      );
      assert.ok(
        !bg.skillProficiencies.includes(opt),
        `Background "${bg.name}" (${bg.id}) has option "${opt}" that is already a fixed skill`
      );
    }

    // Options must be unique
    const uniqueOptions = new Set(options);
    assert.equal(
      uniqueOptions.size,
      options.length,
      `Background "${bg.name}" (${bg.id}) has duplicate choice options`
    );
  }
});

test('Background Compendium: Specific backgrounds with choices are properly configured', () => {
  const ubh = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'urban-bounty-hunter');
  assert.ok(ubh);
  assert.equal(ubh.skillProficiencies.length, 0);
  assert.equal(ubh.skillChoices?.choose, 2);
  assert.deepEqual(ubh.skillChoices?.options.sort(), ['Обман', 'Проницательность', 'Скрытность', 'Убеждение'].sort());

  const haunted = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'haunted-one');
  assert.ok(haunted);
  assert.equal(haunted.skillProficiencies.length, 0);
  assert.equal(haunted.skillChoices?.choose, 2);
  assert.deepEqual(haunted.skillChoices?.options.sort(), ['Анализ', 'Выживание', 'Магия', 'Религия'].sort());

  const scholar = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'cloistered-scholar');
  assert.ok(scholar);
  assert.deepEqual(scholar.skillProficiencies, ['История']);
  assert.equal(scholar.skillChoices?.choose, 1);
  assert.deepEqual(scholar.skillChoices?.options.sort(), ['Магия', 'Природа', 'Религия'].sort());

  const inheritor = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'inheritor');
  assert.ok(inheritor);
  assert.deepEqual(inheritor.skillProficiencies, ['Выживание']);
  assert.equal(inheritor.skillChoices?.choose, 1);
  assert.deepEqual(inheritor.skillChoices?.options.sort(), ['История', 'Магия', 'Религия'].sort());

  const knight = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'knight-of-the-order');
  assert.ok(knight);
  assert.deepEqual(knight.skillProficiencies, ['Убеждение']);
  assert.equal(knight.skillChoices?.choose, 1);
  assert.deepEqual(knight.skillChoices?.options.sort(), ['История', 'Магия', 'Природа', 'Религия'].sort());

  const agent = DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === 'faction-agent');
  assert.ok(agent);
  assert.deepEqual(agent.skillProficiencies, ['Проницательность']);
  assert.equal(agent.skillChoices?.choose, 1);
  assert.ok((agent.skillChoices?.options.length || 0) >= 10);
});

test('resolveBackgroundSkills: correctly combines fixed and chosen skills and resolves replacements', () => {
  const mockBg: CompendiumBackground = {
    id: 'test-bg',
    name: 'Тестовая',
    nameEn: 'Test BG',
    description: 'Test',
    skillProficiencies: ['Атлетика'],
    skillChoices: {
      choose: 1,
      options: ['Акробатика', 'Скрытность']
    },
    toolProficiencies: [],
    languages: [],
    equipment: '',
    startingGold: 10,
    feature: { name: 'F', description: 'D' }
  };

  // Case 1: No overlaps
  const res1 = resolveBackgroundSkills({
    background: mockBg,
    selectedChoices: ['Скрытность'],
    existingSkills: ['Магия', 'История'],
    replacements: {}
  });

  assert.equal(res1.isValid, true);
  assert.deepEqual(res1.finalSkills.sort(), ['Атлетика', 'Скрытность'].sort());
  assert.equal(res1.unresolvedOverlaps.length, 0);

  // Case 2: Fixed skill overlaps with class skill, requires replacement
  const res2 = resolveBackgroundSkills({
    background: mockBg,
    selectedChoices: ['Скрытность'],
    existingSkills: ['Атлетика'], // overlap!
    replacements: {}
  });
  assert.equal(res2.isValid, false);
  assert.deepEqual(res2.unresolvedOverlaps, ['Атлетика']);

  // Case 3: Overlap is replaced
  const res3 = resolveBackgroundSkills({
    background: mockBg,
    selectedChoices: ['Скрытность'],
    existingSkills: ['Атлетика'],
    replacements: { 'Атлетика': 'Обман' }
  });
  assert.equal(res3.isValid, true);
  assert.deepEqual(res3.finalSkills.sort(), ['Обман', 'Скрытность'].sort());

  // Case 4: Not enough choices selected
  const res4 = resolveBackgroundSkills({
    background: mockBg,
    selectedChoices: [],
    existingSkills: [],
    replacements: {}
  });
  assert.equal(res4.isValid, false);
  assert.ok(res4.error?.includes('1'));
});
