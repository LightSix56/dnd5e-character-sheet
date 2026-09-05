import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass } from '../src/data/compendium/classes';
import { getClassSubclassLevel } from '../src/data/compendium/class-progression';

describe('D&D 5e Subclass Selection Rules & Progression Integrity', () => {
  it('Level 1 Subclasses: Cleric, Warlock, and Sorcerer must require subclass at Level 1', () => {
    const level1Classes = ['Жрец', 'Колдун', 'Чародей'];
    for (const clsName of level1Classes) {
      const lvl = getClassSubclassLevel(clsName);
      assert.strictEqual(lvl, 1, `${clsName} must choose subclass at Level 1`);

      const compClass = DND_COMPENDIUM_CLASSES.find(c => c.name.toLowerCase() === clsName.toLowerCase());
      assert.ok(compClass, `Class ${clsName} must exist in compendium`);
      assert.strictEqual(compClass.subclassLevel, 1, `${clsName} subclassLevel in compendium must be 1`);
      assert.ok(compClass.subclasses.length > 0, `${clsName} must have at least one subclass`);

      // All subclasses of level 1 classes must provide features at level 1
      for (const sub of compClass.subclasses) {
        const lvl1Feats = sub.features.filter(f => f.level <= 1);
        assert.ok(
          lvl1Feats.length > 0,
          `Subclass "${sub.name}" of "${clsName}" must have 1st-level features, found 0`
        );
      }
    }
  });

  it('Level 2 Subclasses: Wizard and Druid must choose subclass strictly at Level 2', () => {
    const level2Classes = ['Волшебник', 'Друид'];
    for (const clsName of level2Classes) {
      const lvl = getClassSubclassLevel(clsName);
      assert.strictEqual(lvl, 2, `${clsName} must choose subclass at Level 2`);

      const compClass = DND_COMPENDIUM_CLASSES.find(c => c.name.toLowerCase() === clsName.toLowerCase());
      assert.ok(compClass, `Class ${clsName} must exist in compendium`);
      assert.strictEqual(compClass.subclassLevel, 2, `${clsName} subclassLevel in compendium must be 2`);
    }
  });

  it('Level 3 Subclasses: All martial, half-caster, and remaining classes must choose subclass at Level 3', () => {
    const level3Classes = [
      'Воин', 'Варвар', 'Плут', 'Монах',
      'Паладин', 'Следопыт', 'Бард', 'Изобретатель'
    ];
    for (const clsName of level3Classes) {
      const lvl = getClassSubclassLevel(clsName);
      assert.strictEqual(lvl, 3, `${clsName} must choose subclass at Level 3`);

      const compClass = DND_COMPENDIUM_CLASSES.find(c => c.name.toLowerCase() === clsName.toLowerCase());
      assert.ok(compClass, `Class ${clsName} must exist in compendium`);
      assert.strictEqual(compClass.subclassLevel, 3, `${clsName} subclassLevel in compendium must be 3`);

      // Subclasses of level 3 classes should not have level 1 or 2 features
      for (const sub of compClass.subclasses) {
        const earlyFeats = sub.features.filter(f => f.level < 3);
        assert.strictEqual(
          earlyFeats.length,
          0,
          `Subclass "${sub.name}" of "${clsName}" should not have features below level 3`
        );
      }
    }
  });

  it('Subclass catalog: getSubclassesForClass returns matching subclasses for all classes', () => {
    for (const compClass of DND_COMPENDIUM_CLASSES) {
      const subs = getSubclassesForClass(compClass.name);
      assert.ok(subs.length > 0, `Class ${compClass.name} must have subclasses returned by helper`);
      assert.strictEqual(subs.length, compClass.subclasses.length);
    }
  });
});
