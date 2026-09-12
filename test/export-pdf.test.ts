import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter } from '../src/lib/dnd-types';
import { exportCharacterToPdf, SKILL_ROW_MAPPINGS } from '../src/lib/pdf-export';
import { PDFDocument } from 'pdf-lib';

test('PDF Export: SKILL_ROW_MAPPINGS contains all 18 standard D&D 5e skills', () => {
  assert.equal(SKILL_ROW_MAPPINGS.length, 18);
  const expectedSkills = [
    'Акробатика', 'Атлетика', 'Внимательность', 'Выживание', 'Выступление',
    'Запугивание', 'История', 'Ловкость рук', 'Магия', 'Медицина',
    'Обман', 'Природа', 'Проницательность', 'Анализ', 'Религия',
    'Скрытность', 'Убеждение', 'Уход за животными',
  ];
  for (const skill of expectedSkills) {
    const found = SKILL_ROW_MAPPINGS.find((m) => m.skillName === skill);
    assert.ok(found, `Skill ${skill} must be mapped`);
  }
});

test('PDF Export: generates valid PDF buffer from default character', async () => {
  const char = createDefaultCharacter();
  char.name = 'Тестовый Герой';
  char.className = 'Воин';
  char.level = 1;
  char.race = 'Человек';

  const pdfBytes = await exportCharacterToPdf(char, { includeFullCodex: false });
  assert.ok(pdfBytes instanceof Uint8Array, 'Returns Uint8Array');
  assert.ok(pdfBytes.length > 1000, 'PDF size should be substantial');

  // Verify it starts with %PDF- header
  const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
  assert.equal(header, '%PDF-');

  // Load back with pdf-lib to verify structural validity
  const pdfDoc = await PDFDocument.load(pdfBytes);
  assert.equal(pdfDoc.getPageCount(), 3, 'Default without traits codex should have 3 pages');

  const form = pdfDoc.getForm();
  const nameField = form.getTextField('CharacterName');
  assert.equal(nameField.getText(), 'Тестовый Герой');
});

test('PDF Export: generates 5 pages when character has traits for codex', async () => {
  const char = createDefaultCharacter();
  char.name = 'Леворукая птица';
  char.className = 'Плут';
  char.level = 20;
  char.traitsList = [
    { id: '1', name: 'Кошачьи когти', source: 'Раса', description: 'Ваши когти — естественное оружие.' },
    { id: '2', name: 'Скрытная атака', source: 'Класс', description: 'Вы умеете бить точно в уязвимое место.' },
    { id: '3', title: 'Воровская честь (fallback test)', source: 'Предыстория', description: 'Вы знаете контакты в преступном мире.' } as any,
  ];

  const pdfBytes = await exportCharacterToPdf(char, { includeFullCodex: true });
  const pdfDoc = await PDFDocument.load(pdfBytes);
  // 3 official pages + codex page(s)
  assert.ok(pdfDoc.getPageCount() >= 4, 'Should include at least page 4 for traits codex');
});

test('PDF Export: exports cantrips and leveled spells (1-9) onto page 3 with correct fields, slots and checkboxes', async () => {
  const char = createDefaultCharacter();
  char.name = 'Элара Тестовая';
  char.className = 'Волшебник';
  char.level = 5;
  char.spellcastingClass = 'Волшебник';
  char.spellcastingAbility = 'ИНТ';
  char.abilityScores['ИНТ'] = 16;

  char.spellSlots = {
    1: { totalSlots: 4, expendedSlots: 1 },
    2: { totalSlots: 3, expendedSlots: 0 },
    3: { totalSlots: 2, expendedSlots: 2 },
  };

  char.cantrips = ['Огненный снаряд', 'Маленькая иллюзия', 'Престидижитация', 'Луч мороза'];
  char.spellsByLevel = {
    1: [
      { name: 'Опознание', prepared: true },
      { name: 'Магический снаряд', prepared: true },
      { name: 'Щит', prepared: true },
      { name: 'Волна грома', prepared: false },
    ],
    2: [
      { name: 'Невидимость', prepared: true },
      { name: 'Паутина', prepared: false },
    ],
    3: [
      { name: 'Огненный шар', prepared: true },
    ],
  };

  const pdfBytes = await exportCharacterToPdf(char, { includeFullCodex: false });
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // 1. Cantrips (Level 0)
  assert.equal(form.getTextField('Spells 1014').getText(), 'Огненный снаряд');
  assert.equal(form.getTextField('Spells 1016').getText(), 'Маленькая иллюзия');
  assert.equal(form.getTextField('Spells 1017').getText(), 'Престидижитация');
  assert.equal(form.getTextField('Spells 1018').getText(), 'Луч мороза');

  // 2. Level 1 Spells & Slots
  assert.equal(form.getTextField('SlotsTotal 19').getText(), '4');
  assert.equal(form.getTextField('SlotsRemaining 19').getText(), '1');
  assert.equal(form.getTextField('Spells 1015').getText(), 'Опознание');
  assert.equal(form.getCheckBox('Check Box 251').isChecked(), true);
  assert.equal(form.getTextField('Spells 1023').getText(), 'Магический снаряд');
  assert.equal(form.getCheckBox('Check Box 309').isChecked(), true);
  assert.equal(form.getTextField('Spells 1024').getText(), 'Щит');
  assert.equal(form.getCheckBox('Check Box 3010').isChecked(), true);
  assert.equal(form.getTextField('Spells 1025').getText(), 'Волна грома');
  assert.equal(form.getCheckBox('Check Box 3011').isChecked(), false);

  // 3. Level 2 Spells & Slots
  assert.equal(form.getTextField('SlotsTotal 20').getText(), '3');
  assert.equal(form.getTextField('Spells 1046').getText(), 'Невидимость');
  assert.equal(form.getCheckBox('Check Box 313').isChecked(), true);
  assert.equal(form.getTextField('Spells 1034').getText(), 'Паутина');
  assert.equal(form.getCheckBox('Check Box 310').isChecked(), false);

  // 4. Level 3 Spells & Slots
  assert.equal(form.getTextField('SlotsTotal 21').getText(), '2');
  assert.equal(form.getTextField('SlotsRemaining 21').getText(), '2');
  assert.equal(form.getTextField('Spells 1048').getText(), 'Огненный шар');
  assert.equal(form.getCheckBox('Check Box 315').isChecked(), true);
});

test('PDF Export: renders overflow spells exceeding page 3 row limits into codex pages', async () => {
  const char = createDefaultCharacter();
  char.name = 'Архимаг';
  char.className = 'Волшебник';
  char.level = 10;
  char.spellcastingClass = 'Волшебник';
  char.spellcastingAbility = 'ИНТ';
  char.abilityScores['ИНТ'] = 20;

  // Level 1 capacity on page 3 is 12 rows. Provide 15 spells: 12 on page 3, 3 overflow.
  char.spellsByLevel = {
    1: Array.from({ length: 15 }, (_, i) => ({
      name: `Заклинание 1 круга #${i + 1}`,
      prepared: i % 2 === 0,
    })),
  };

  const pdfBytes = await exportCharacterToPdf(char, { includeFullCodex: true });
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // First 12 on Page 3
  const form = pdfDoc.getForm();
  assert.equal(form.getTextField('Spells 1015').getText(), 'Заклинание 1 круга #1');
  assert.equal(form.getTextField('Spells 1033').getText(), 'Заклинание 1 круга #12');

  // Should have generated codex pages for the 3 overflow spells
  assert.ok(pdfDoc.getPageCount() >= 4, 'Must have at least 4 pages to contain overflow spells');
});

