import test from 'node:test';
import assert from 'node:assert/strict';
import { ENCYCLOPEDIA_CHAPTERS, SHEET_TOUR_STEPS } from '../src/data/encyclopedia/encyclopedia-content.js';

test('Encyclopedia Data: Contains all 7 comprehensive chapters', () => {
  assert.equal(ENCYCLOPEDIA_CHAPTERS.length, 7);
  const chapterIds = ENCYCLOPEDIA_CHAPTERS.map(c => c.id);
  assert.ok(chapterIds.includes('intro-dnd-basics'), 'Has chapter 1');
  assert.ok(chapterIds.includes('d20-checks-dc'), 'Has chapter 2');
  assert.ok(chapterIds.includes('sheet-anatomy'), 'Has chapter 3');
  assert.ok(chapterIds.includes('combat-and-actions'), 'Has chapter 4');
  assert.ok(chapterIds.includes('magic-and-spells'), 'Has chapter 5');
  assert.ok(chapterIds.includes('rest-and-recovery'), 'Has chapter 6');
  assert.ok(chapterIds.includes('level1-and-level-up'), 'Has chapter 7');
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
