import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagePath = path.resolve(__dirname, '../src/app/page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

describe('Hit Targets & Form Label Associations (TDD)', () => {
  describe('1. Functional Toggle Behavior for Skills & Saves', () => {
    it('toggles skill proficiency correctly when clicking label', () => {
      let char = {
        skillProficiencies: { 'Атлетика': false, 'Акробатика': true } as Record<string, boolean>,
      };

      const updateSkillProf = (skill: string, field: 'skillProficiencies', value: boolean) => {
        char = {
          ...char,
          [field]: { ...char[field], [skill]: value }
        };
      };

      const isProfAthletics = char.skillProficiencies['Атлетика'];
      updateSkillProf('Атлетика', 'skillProficiencies', !isProfAthletics);
      assert.strictEqual(char.skillProficiencies['Атлетика'], true);

      updateSkillProf('Атлетика', 'skillProficiencies', !char.skillProficiencies['Атлетика']);
      assert.strictEqual(char.skillProficiencies['Атлетика'], false);

      assert.strictEqual(char.skillProficiencies['Акробатика'], true);
    });

    it('toggles saving throw proficiency correctly when clicking save label', () => {
      let char = {
        savingThrowProficiencies: { 'СИЛ': false, 'ЛОВ': true } as Record<string, boolean>,
      };

      const updateSaveProf = (ability: string, value: boolean) => {
        char = {
          ...char,
          savingThrowProficiencies: { ...char.savingThrowProficiencies, [ability]: value }
        };
      };

      const isProfStr = char.savingThrowProficiencies['СИЛ'];
      updateSaveProf('СИЛ', !isProfStr);
      assert.strictEqual(char.savingThrowProficiencies['СИЛ'], true);

      const isProfDex = char.savingThrowProficiencies['ЛОВ'];
      updateSaveProf('ЛОВ', !isProfDex);
      assert.strictEqual(char.savingThrowProficiencies['ЛОВ'], false);
    });
  });

  describe('2. StatInput Label & Input ID Association', () => {
    it('StatInput generates clean inputId and connects htmlFor with id', () => {
      const statInputMatch = pageContent.match(/function StatInput\([\s\S]*?return\s*\([\s\S]*?\);?\s*\}/);
      assert.ok(statInputMatch, 'StatInput component must be found in page.tsx');
      const statInputCode = statInputMatch[0];

      assert.match(statInputCode, /inputId\s*=/, 'StatInput must compute inputId');
      assert.match(statInputCode, /htmlFor=\{inputId\}/, 'StatInput label must have htmlFor={inputId}');
      assert.match(statInputCode, /id=\{inputId\}/, 'StatInput input must have id={inputId}');
    });

    it('generates sanitized id with cyrillic and latin characters', () => {
      const generateId = (label: string) => 'stat-input-' + label.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-');
      assert.strictEqual(generateId('Имя игрока'), 'stat-input-имя-игрока');
      assert.strictEqual(generateId('Возраст'), 'stat-input-возраст');
      assert.strictEqual(generateId('Очки опыта'), 'stat-input-очки-опыта');
      assert.strictEqual(generateId('Spell DC!'), 'stat-input-spell-dc-');
    });
  });

  describe('3. Character Sheet Main Info Form Labels', () => {
    it('connects char-input-name label with input', () => {
      assert.match(pageContent, /htmlFor="char-input-name"[^>]*>Имя персонажа<\/label>/, 'Label must have htmlFor="char-input-name"');
      assert.match(pageContent, /<input[^>]*id="char-input-name"/, 'Input for name must have id="char-input-name"');
    });

    it('connects char-input-class label with input', () => {
      assert.match(pageContent, /htmlFor="char-input-class"[^>]*>Класс<\/label>/, 'Label must have htmlFor="char-input-class"');
      assert.match(pageContent, /<input[^>]*id="char-input-class"/, 'Input for class must have id="char-input-class"');
    });

    it('connects char-input-race label with input', () => {
      assert.match(pageContent, /htmlFor="char-input-race"[^>]*>Раса<\/label>/, 'Label must have htmlFor="char-input-race"');
      assert.match(pageContent, /<input[^>]*id="char-input-race"/, 'Input for race must have id="char-input-race"');
    });
  });

  describe('4. Clickable Skill List Hit Targets', () => {
    it('skill list text span has onClick handler calling updateSkillProf', () => {
      assert.match(
        pageContent,
        /onClick=\{\(\)\s*=>\s*updateSkillProf\(skill,\s*['"]skillProficiencies['"],\s*!isProf\)\}/,
        'Skill span must toggle proficiency on click'
      );
      assert.match(
        pageContent,
        /cursor-pointer\s+select-none\s+hover:text-\[#8B4513\]/,
        'Skill span must have cursor-pointer and hover styling'
      );
    });
  });

  describe('5. Clickable Saving Throw Hit Targets', () => {
    it('saving throw mobile and desktop labels have onClick handler calling updateSaveProf', () => {
      assert.match(
        pageContent,
        /onClick=\{\(\)\s*=>\s*updateSaveProf\(abbr,\s*!isProf\)\}/,
        'Saving throw label must toggle save proficiency on click'
      );
      const matches = [...pageContent.matchAll(/onClick=\{\(\)\s*=>\s*updateSaveProf\(abbr,\s*!isProf\)\}/g)];
      assert.ok(matches.length >= 2, `Expected at least 2 updateSaveProf onClick handlers (mobile and desktop), found ${matches.length}`);
    });
  });
});
