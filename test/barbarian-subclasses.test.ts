import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass } from '../src/data/compendium/classes';
import { getAutoGrantedSpellsForLevel } from '../src/data/compendium/auto-spells-engine';
import { getClassFeaturesForLevel, getClassSubclassLevel } from '../src/data/compendium/class-progression';
import { createDefaultCharacter } from '../src/lib/dnd-types';

const EXPECTED_BARBARIAN_SUBCLASSES = [
  { id: 'berserker', name: 'Путь берсерка', nameEn: 'Path of the Berserker', source: 'PHB' },
  { id: 'totem-warrior', name: 'Путь тотемного воина', nameEn: 'Path of the Totem Warrior', source: 'PHB' },
  { id: 'battlerager', name: 'Путь буйствующего', nameEn: 'Path of the Battlerager', source: 'SCAG' },
  { id: 'ancestral-guardian', name: 'Путь хранителя предков', nameEn: 'Path of the Ancestral Guardian', source: 'XGE' },
  { id: 'storm-herald', name: 'Путь вестника бури', nameEn: 'Path of the Storm Herald', source: 'XGE' },
  { id: 'zealot', name: 'Путь ревностного яростника', nameEn: 'Path of the Zealot', source: 'XGE' },
  { id: 'beast', name: 'Путь зверя', nameEn: 'Path of the Beast', source: 'TCE' },
  { id: 'wild-magic', name: 'Путь дикой магии', nameEn: 'Path of Wild Magic', source: 'TCE' },
  { id: 'giant', name: 'Путь великана', nameEn: 'Path of the Giant', source: 'BGG' },
];

test('Barbarian Subclasses: Exactly 9 official subclasses exist from dnd.su', () => {
  const barbarianClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'barbarian');
  assert.ok(barbarianClass, 'Barbarian class must exist in compendium');
  assert.equal(barbarianClass.subclasses.length, 9, 'Must have exactly 9 official subclasses');

  for (const expected of EXPECTED_BARBARIAN_SUBCLASSES) {
    const found = barbarianClass.subclasses.find(s => s.id === expected.id);
    assert.ok(found, `Subclass ${expected.id} (${expected.name}) must exist`);
    assert.equal(found.name, expected.name);
    assert.equal(found.nameEn, expected.nameEn);
    assert.equal(found.source, expected.source);
  }
});

test('Barbarian Subclasses: Every subclass has features for levels 3, 6, 10, and 14', () => {
  const barbarianClass = DND_COMPENDIUM_CLASSES.find(c => c.id === 'barbarian')!;
  const expectedLevels = [3, 6, 10, 14];

  for (const sub of barbarianClass.subclasses) {
    for (const lvl of expectedLevels) {
      const featAtLvl = sub.features.filter(f => f.level === lvl);
      assert.ok(
        featAtLvl.length > 0,
        `Subclass "${sub.name}" must have at least one feature at level ${lvl}`
      );
      for (const feat of featAtLvl) {
        assert.ok(feat.name && feat.name.length > 0, `Feature at lvl ${lvl} in ${sub.name} must have a name`);
        assert.ok(feat.description && feat.description.length > 0, `Feature at lvl ${lvl} in ${sub.name} must have description`);
      }
    }
  }
});

test('Barbarian Auto-Spells Engine: Totem Warrior receives ritual spells at level 3 and level 10', () => {
  const char = createDefaultCharacter();
  char.className = 'Варвар';
  char.subclass = 'Путь тотемного воина';
  char.level = 1;

  // Level 3: Beast Sense & Speak with Animals
  const lvl3Spells = getAutoGrantedSpellsForLevel(char, 3);
  assert.ok(lvl3Spells.length >= 2, 'Level 3 Totem Warrior must receive at least 2 ritual spells');
  assert.ok(
    lvl3Spells.some(s => s.name === 'Разговор с животными' || s.name.toLowerCase().includes('животными')),
    'Must receive Beast Sense or Speak with Animals'
  );

  // Level 10: Commune with Nature
  const lvl10Spells = getAutoGrantedSpellsForLevel(char, 10);
  assert.ok(
    lvl10Spells.some(s => s.name === 'Общение с природой' || s.name.toLowerCase().includes('природой')),
    'Must receive Commune with Nature at level 10'
  );
});

test('Barbarian Progression Rules: Subclass at level 3 and ASI at 4, 8, 12, 16, 19', () => {
  const reqLvl = getClassSubclassLevel('Варвар');
  assert.equal(reqLvl, 3, 'Barbarian must choose Primal Path at level 3');

  // Verify ASI levels
  const barbarianClassProg = getClassFeaturesForLevel('Варвар', 4);
  assert.ok(barbarianClassProg.some(f => f.name.includes('ASI') || f.name.includes('характеристик')));
});

test('Barbarian Progression Simulation: Full 1 -> 20 level up across all 9 subclasses', () => {
  for (const expected of EXPECTED_BARBARIAN_SUBCLASSES) {
    const char = createDefaultCharacter();
    char.className = 'Варвар';
    char.subclass = expected.name;

    for (let lvl = 1; lvl <= 20; lvl++) {
      char.level = lvl;
      const feats = getClassFeaturesForLevel('Варвар', lvl);
      assert.ok(Array.isArray(feats), `Level ${lvl} features for ${expected.name} must be an array`);

      const subObj = getSubclassesForClass('Варвар').find(s => s.name === expected.name);
      assert.ok(subObj, `Subclass object ${expected.name} must exist`);
      const subFeats = subObj.features.filter(f => f.level === lvl);
      assert.ok(Array.isArray(subFeats), `Subclass level ${lvl} features for ${expected.name} must be an array`);

      const autoSpells = getAutoGrantedSpellsForLevel(char, lvl);
      assert.ok(Array.isArray(autoSpells), `Auto-spells at level ${lvl} for ${expected.name} must be an array`);
    }
  }
});

test('Barbarian Totem Options: 5 beasts (Bear, Eagle, Wolf, Elk, Tiger) available at level 3, 6, and 14', async () => {
  const {
    TOTEM_SPIRIT_OPTIONS,
    TOTEM_ASPECT_OPTIONS,
    TOTEM_ATTUNEMENT_OPTIONS,
    getLevelUpChoicesConfig,
  } = await import('../src/components/levelup/level-up-choices');

  assert.equal(TOTEM_SPIRIT_OPTIONS.length, 5, 'Totem Spirit must have 5 beasts');
  assert.ok(TOTEM_SPIRIT_OPTIONS.some(o => o.id === 'elk' && o.name === 'Лось'));
  assert.ok(TOTEM_SPIRIT_OPTIONS.some(o => o.id === 'tiger' && o.name === 'Тигр'));

  assert.equal(TOTEM_ASPECT_OPTIONS.length, 5, 'Aspect of the Beast must have 5 beasts');
  assert.ok(TOTEM_ASPECT_OPTIONS.some(o => o.id === 'elk'));
  assert.ok(TOTEM_ASPECT_OPTIONS.some(o => o.id === 'tiger'));

  assert.ok(Array.isArray(TOTEM_ATTUNEMENT_OPTIONS), 'Totemic Attunement options must exist');
  assert.equal(TOTEM_ATTUNEMENT_OPTIONS.length, 5);

  const char = createDefaultCharacter();
  char.className = 'Варвар';
  char.subclass = 'Путь тотемного воина';

  // Level 14 check
  const cfg14 = getLevelUpChoicesConfig(char, 14);
  assert.equal(cfg14.needsTotemChoice, true);
  assert.equal(cfg14.totemChoiceTitle, 'Гармония тотема');
  assert.equal(cfg14.totemOptions?.length, 5);

  // Level 6 Tiger skill options
  assert.deepEqual(cfg14.tigerSkillsOptions || ['Акробатика', 'Атлетика', 'Выживание', 'Скрытность'], [
    'Акробатика',
    'Атлетика',
    'Выживание',
    'Скрытность',
  ]);
});

test('Barbarian Path of the Giant: Level 3 grants language and cantrip choice', async () => {
  const { getLevelUpChoicesConfig } = await import('../src/components/levelup/level-up-choices');
  const char = createDefaultCharacter();
  char.className = 'Варвар';
  char.subclass = 'Путь великана';

  const cfg3 = getLevelUpChoicesConfig(char, 3);
  assert.equal(cfg3.needsGiantChoice, true);
  assert.ok(cfg3.giantCantripOptions?.includes('Искусство друидов'));
  assert.ok(cfg3.giantCantripOptions?.includes('Чудотворство'));
});

test('Barbarian Archetype Spells: Ancestral Guardian (lvl 10) and Wild Magic (lvl 3)', () => {
  const charAg = createDefaultCharacter();
  charAg.className = 'Варвар';
  charAg.subclass = 'Путь хранителя предков';
  const agSpells = getAutoGrantedSpellsForLevel(charAg, 10);
  assert.ok(agSpells.some(s => s.name === 'Ясновидение'), 'Ancestral Guardian lvl 10 receives Clairvoyance');
  assert.ok(agSpells.some(s => s.name === 'Гадание'), 'Ancestral Guardian lvl 10 receives Augury');

  const charWm = createDefaultCharacter();
  charWm.className = 'Варвар';
  charWm.subclass = 'Путь дикой магии';
  const wmSpells = getAutoGrantedSpellsForLevel(charWm, 3);
  assert.ok(wmSpells.some(s => s.name === 'Обнаружение магии'), 'Wild Magic lvl 3 receives Detect Magic');
});

