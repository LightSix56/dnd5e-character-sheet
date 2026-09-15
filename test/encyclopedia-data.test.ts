import test from 'node:test';
import assert from 'node:assert/strict';
import { ENCYCLOPEDIA_CHAPTERS, SHEET_TOUR_STEPS } from '../src/data/encyclopedia/encyclopedia-content.js';

test('Encyclopedia Data: Contains all 8 comprehensive chapters', () => {
  assert.equal(ENCYCLOPEDIA_CHAPTERS.length, 8);
  const chapterIds = ENCYCLOPEDIA_CHAPTERS.map(c => c.id);
  assert.ok(chapterIds.includes('intro-dnd-basics'), 'Has chapter 1');
  assert.ok(chapterIds.includes('classes-and-archetypes'), 'Has classes chapter');
  assert.ok(chapterIds.includes('d20-checks-dc'), 'Has chapter d20-checks-dc');
  assert.ok(chapterIds.includes('sheet-anatomy'), 'Has chapter sheet-anatomy');
  assert.ok(chapterIds.includes('combat-and-actions'), 'Has chapter combat-and-actions');
  assert.ok(chapterIds.includes('magic-and-spells'), 'Has chapter magic-and-spells');
  assert.ok(chapterIds.includes('rest-and-recovery'), 'Has chapter rest-and-recovery');
  assert.ok(chapterIds.includes('level1-and-level-up'), 'Has chapter level1-and-level-up');
});

test('Encyclopedia Data: Tour steps cover all 8 key sheet blocks with valid chapter links', () => {
  assert.equal(SHEET_TOUR_STEPS.length, 8);
  const chapterIds = new Set(ENCYCLOPEDIA_CHAPTERS.map(c => c.id));
  for (const step of SHEET_TOUR_STEPS) {
    assert.ok(step.targetId, `Step ${step.id} has targetId`);
    assert.ok(step.title, `Step ${step.id} has title`);
    assert.ok(step.description, `Step ${step.id} has description`);
    assert.ok(chapterIds.has(step.chapterId), `Step ${step.id} links to valid chapter ${step.chapterId}`);
  }
});

test('Encyclopedia Data: Sheet anatomy chapter has detailed breakdown of every stat and vitals', () => {
  const anatomy = ENCYCLOPEDIA_CHAPTERS.find(c => c.id === 'sheet-anatomy')!;
  assert.ok(anatomy, 'Anatomy chapter exists');
  const sectionIds = anatomy.sections.map(s => s.id);
  assert.ok(sectionIds.includes('abilities-and-modifiers'), 'Has abilities breakdown');
  assert.ok(sectionIds.includes('proficiency-bonus'), 'Has proficiency bonus breakdown');
  assert.ok(sectionIds.includes('saving-throws'), 'Has saving throws breakdown');
  assert.ok(sectionIds.includes('skills-and-expertise'), 'Has skills breakdown');
  assert.ok(sectionIds.includes('ac-and-vitals'), 'Has AC and vitals breakdown');
  assert.ok(sectionIds.includes('attacks-and-damage'), 'Has attacks breakdown');
});

test('Encyclopedia Data: Intro chapter explains what DM is and how to start playing', () => {
  const intro = ENCYCLOPEDIA_CHAPTERS.find(c => c.id === 'intro-dnd-basics')!;
  assert.ok(intro);
  const text = intro.sections.map(s => s.content).join(' ').toLowerCase();
  assert.ok(text.includes('мастер'), 'Mentions Dungeon Master');
  assert.ok(text.includes('игрок'), 'Mentions Players');
});

test('Encyclopedia Data: Level Up chapter explains ASI vs Feats', () => {
  const levelUp = ENCYCLOPEDIA_CHAPTERS.find(c => c.id === 'level1-and-level-up')!;
  assert.ok(levelUp);
  const text = levelUp.sections.map(s => s.content).join(' ').toLowerCase();
  assert.ok(text.includes('черт'), 'Mentions Feats');
  assert.ok(text.includes('характеристик'), 'Mentions Ability Score Improvement');
});

test('Encyclopedia Data: Classes and Archetypes chapter covers all classes, subclasses, and multiclassing warning', () => {
  const ch = ENCYCLOPEDIA_CHAPTERS.find(c => c.id === 'classes-and-archetypes')!;
  assert.ok(ch, 'Classes chapter exists');
  const sectionIds = ch.sections.map(s => s.id);
  assert.ok(sectionIds.includes('what-is-class'), 'Has what-is-class');
  assert.ok(sectionIds.includes('what-are-subclasses'), 'Has what-are-subclasses');
  assert.ok(sectionIds.includes('classes-overview'), 'Has classes-overview');
  assert.ok(sectionIds.includes('multiclassing-rules'), 'Has multiclassing-rules');

  const multiclassSection = ch.sections.find(s => s.id === 'multiclassing-rules')!;
  assert.ok(multiclassSection.callout, 'Multiclassing has warning/callout');
  assert.equal(multiclassSection.callout?.type, 'warning');

  const overviewSection = ch.sections.find(s => s.id === 'classes-overview')!;
  const text = overviewSection.content;
  assert.ok(text.includes('Варвар'));
  assert.ok(text.includes('Бард'));
  assert.ok(text.includes('Жрец'));
  assert.ok(text.includes('Друид'));
  assert.ok(text.includes('Воин'));
  assert.ok(text.includes('Монах'));
  assert.ok(text.includes('Паладин'));
  assert.ok(text.includes('Следопыт'));
  assert.ok(text.includes('Плут'));
  assert.ok(text.includes('Чародей'));
  assert.ok(text.includes('Колдун'));
  assert.ok(text.includes('Волшебник'));
  assert.ok(text.includes('Изобретатель'));
});

