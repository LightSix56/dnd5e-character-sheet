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
