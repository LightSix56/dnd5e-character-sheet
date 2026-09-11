import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES, findClassById } from '../src/data/compendium/classes';

describe('Class Starting Equipment Compendium Integrity', () => {
  it('all 13 official classes have startingEquipment defined', () => {
    assert.equal(DND_COMPENDIUM_CLASSES.length, 13);
    for (const cls of DND_COMPENDIUM_CLASSES) {
      assert.ok(cls.startingEquipment, `Class ${cls.name} (${cls.id}) must have startingEquipment defined`);
      assert.ok(Array.isArray(cls.startingEquipment.choices), `Class ${cls.name} must have choices array`);
      assert.ok(Array.isArray(cls.startingEquipment.fixed), `Class ${cls.name} must have fixed array`);
      assert.ok(cls.startingEquipment.choices.length >= 1, `Class ${cls.name} must have at least 1 equipment choice`);
      for (const choice of cls.startingEquipment.choices) {
        assert.ok(choice.options.length >= 2, `Every choice in ${cls.name} must have at least 2 options`);
      }
    }
  });

  it('verifies specific class choices and fixed items', () => {
    const fighter = findClassById('fighter');
    assert.ok(fighter);
    assert.equal(fighter.startingEquipment?.choices.length, 4);

    const wizard = findClassById('wizard');
    assert.ok(wizard);
    assert.equal(wizard.startingEquipment?.choices.length, 3);
    assert.ok(wizard.startingEquipment?.fixed.some(f => f.includes('Книга заклинаний')));

    const barbarian = findClassById('barbarian');
    assert.ok(barbarian);
    assert.equal(barbarian.startingEquipment?.choices.length, 2);
    assert.ok(barbarian.startingEquipment?.fixed.some(f => f.includes('Набор путешественника')));

    const cleric = findClassById('cleric');
    assert.ok(cleric);
    assert.equal(cleric.startingEquipment?.choices.length, 4);
    assert.ok(cleric.startingEquipment?.fixed.some(f => f.includes('Щит') || f.includes('священный символ')));

    const artificer = findClassById('artificer');
    assert.ok(artificer);
    assert.equal(artificer.startingEquipment?.choices.length, 1);
    assert.ok(artificer.startingEquipment?.fixed.some(f => f.includes('воровские инструменты')));
  });
});
