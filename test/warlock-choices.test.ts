import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WARLOCK_INVOCATIONS,
  WARLOCK_PACT_BOONS,
  GENIE_KINDS,
  WARLOCK_MYSTIC_ARCANUM_SPELLS,
  isInvocationAvailable,
  type InvocationDefinition,
  type PactBoonDefinition,
  type GenieKindDefinition
} from '../src/data/compendium/warlock-choices';

test('Warlock Invocations database', async (t) => {
  await t.test('contains at least 47 official invocations', () => {
    assert.ok(
      WARLOCK_INVOCATIONS.length >= 47,
      `Expected at least 47 invocations, got ${WARLOCK_INVOCATIONS.length}`
    );
  });

  await t.test('has unique IDs across all invocations', () => {
    const ids = new Set<string>();
    for (const inv of WARLOCK_INVOCATIONS) {
      assert.ok(!ids.has(inv.id), `Duplicate invocation id detected: ${inv.id}`);
      ids.add(inv.id);
    }
  });

  await t.test('all invocations have valid required fields', () => {
    for (const inv of WARLOCK_INVOCATIONS) {
      assert.ok(inv.id, 'Invocation must have id');
      assert.ok(inv.name, `Invocation ${inv.id} must have Russian name`);
      assert.ok(inv.nameEn, `Invocation ${inv.id} must have English name`);
      assert.ok(typeof inv.levelReq === 'number' && inv.levelReq >= 2, `Invocation ${inv.id} levelReq must be >= 2`);
      assert.ok(inv.description && inv.description.length > 10, `Invocation ${inv.id} must have detailed description`);
    }
  });

  await t.test('contains all mandatory Level 2 / no req invocations', () => {
    const requiredLvl2 = [
      'agonizing-blast',
      'armor-of-shadows',
      'beast-speech',
      'beguiling-influence',
      'devils-sight',
      'eldritch-sight',
      'eldritch-spear',
      'eyes-of-the-rune-keeper',
      'fiendish-vigor',
      'gaze-of-two-minds',
      'grasp-of-hadar',
      'lance-of-lethargy',
      'mask-of-many-faces',
      'misty-visions',
      'repelling-blast',
      'thief-of-five-fates'
    ];

    for (const id of requiredLvl2) {
      const found = WARLOCK_INVOCATIONS.find((i) => i.id === id);
      assert.ok(found, `Missing Level 2 invocation: ${id}`);
    }

    const agonizingBlast = WARLOCK_INVOCATIONS.find((i) => i.id === 'agonizing-blast')!;
    assert.equal(agonizingBlast.cantripReq, 'Мистический заряд');
    assert.equal(agonizingBlast.name, 'Мучительный взрыв');
    assert.equal(agonizingBlast.nameEn, 'Agonizing Blast');

    const repellingBlast = WARLOCK_INVOCATIONS.find((i) => i.id === 'repelling-blast')!;
    assert.equal(repellingBlast.cantripReq, 'Мистический заряд');
  });

  await t.test('contains all mandatory Pact Boon invocations (Level 3+)', () => {
    const tomeBoon = WARLOCK_INVOCATIONS.find((i) => i.id === 'book-of-ancient-secrets');
    assert.ok(tomeBoon, 'Missing book-of-ancient-secrets');
    assert.equal(tomeBoon?.pactReq, 'tome');
    assert.equal(tomeBoon?.name, 'Книга древних секретов');

    const chainBoon = WARLOCK_INVOCATIONS.find((i) => i.id === 'voice-of-the-chain-master');
    assert.ok(chainBoon, 'Missing voice-of-the-chain-master');
    assert.equal(chainBoon?.pactReq, 'chain');

    const bladeBoon = WARLOCK_INVOCATIONS.find((i) => i.id === 'improved-pact-weapon');
    assert.ok(bladeBoon, 'Missing improved-pact-weapon');
    assert.equal(bladeBoon?.pactReq, 'blade');

    const talismanBoon = WARLOCK_INVOCATIONS.find((i) => i.id === 'rebuke-of-the-talisman');
    assert.ok(talismanBoon, 'Missing rebuke-of-the-talisman');
    assert.equal(talismanBoon?.pactReq, 'talisman');
  });

  await t.test('contains all mandatory Level 5+ invocations', () => {
    const requiredLvl5 = [
      'thirsting-blade',
      'cloak-of-flies',
      'maddening-hex',
      'relentless-hex',
      'sign-of-ill-omen',
      'tomb-of-levistus',
      'undying-servitude',
      'aspect-of-the-moon',
      'gift-of-the-ever-living-ones',
      'one-with-shadows'
    ];

    for (const id of requiredLvl5) {
      const found = WARLOCK_INVOCATIONS.find((i) => i.id === id);
      assert.ok(found, `Missing Level 5 invocation: ${id}`);
      assert.equal(found?.levelReq, 5, `${id} should have levelReq 5`);
    }

    const thirstingBlade = WARLOCK_INVOCATIONS.find((i) => i.id === 'thirsting-blade')!;
    assert.equal(thirstingBlade.pactReq, 'blade');

    const aspectOfMoon = WARLOCK_INVOCATIONS.find((i) => i.id === 'aspect-of-the-moon')!;
    assert.equal(aspectOfMoon.pactReq, 'tome');

    const giftEverLiving = WARLOCK_INVOCATIONS.find((i) => i.id === 'gift-of-the-ever-living-ones')!;
    assert.equal(giftEverLiving.pactReq, 'chain');
  });

  await t.test('contains all mandatory Level 7+ invocations', () => {
    const requiredLvl7 = [
      'bewitching-whispers',
      'ghostly-gaze',
      'sculptor-of-flesh',
      'tricksters-escape',
      'protection-of-the-talisman'
    ];

    for (const id of requiredLvl7) {
      const found = WARLOCK_INVOCATIONS.find((i) => i.id === id);
      assert.ok(found, `Missing Level 7 invocation: ${id}`);
      assert.equal(found?.levelReq, 7, `${id} should have levelReq 7`);
    }

    const protectionTalisman = WARLOCK_INVOCATIONS.find((i) => i.id === 'protection-of-the-talisman')!;
    assert.equal(protectionTalisman.pactReq, 'talisman');
  });

  await t.test('contains all mandatory Level 9+ invocations', () => {
    const requiredLvl9 = [
      'ascendant-step',
      'minions-of-chaos',
      'otherworldly-leap',
      'whispers-of-the-grave',
      'gift-of-the-protectors'
    ];

    for (const id of requiredLvl9) {
      const found = WARLOCK_INVOCATIONS.find((i) => i.id === id);
      assert.ok(found, `Missing Level 9 invocation: ${id}`);
      assert.equal(found?.levelReq, 9, `${id} should have levelReq 9`);
    }

    const giftProtectors = WARLOCK_INVOCATIONS.find((i) => i.id === 'gift-of-the-protectors')!;
    assert.equal(giftProtectors.pactReq, 'tome');
  });

  await t.test('contains all mandatory Level 12+ invocations', () => {
    const lifedrinker = WARLOCK_INVOCATIONS.find((i) => i.id === 'lifedrinker');
    assert.ok(lifedrinker, 'Missing lifedrinker');
    assert.equal(lifedrinker?.levelReq, 12);
    assert.equal(lifedrinker?.pactReq, 'blade');

    const bondTalisman = WARLOCK_INVOCATIONS.find((i) => i.id === 'bond-of-the-talisman');
    assert.ok(bondTalisman, 'Missing bond-of-the-talisman');
    assert.equal(bondTalisman?.levelReq, 12);
    assert.equal(bondTalisman?.pactReq, 'talisman');
  });

  await t.test('contains all mandatory Level 15+ invocations', () => {
    const requiredLvl15 = [
      'chains-of-carceri',
      'master-of-myriad-forms',
      'shroud-of-shadow',
      'visions-of-distant-realms',
      'witch-sight'
    ];

    for (const id of requiredLvl15) {
      const found = WARLOCK_INVOCATIONS.find((i) => i.id === id);
      assert.ok(found, `Missing Level 15 invocation: ${id}`);
      assert.equal(found?.levelReq, 15, `${id} should have levelReq 15`);
    }

    const chainsCarceri = WARLOCK_INVOCATIONS.find((i) => i.id === 'chains-of-carceri')!;
    assert.equal(chainsCarceri.pactReq, 'chain');
  });
});

test('Warlock Pact Boons database', async (t) => {
  await t.test('contains all 4 pact boons', () => {
    const boons: ('tome' | 'blade' | 'chain' | 'talisman')[] = ['tome', 'blade', 'chain', 'talisman'];
    for (const key of boons) {
      const boon = WARLOCK_PACT_BOONS[key];
      assert.ok(boon, `Missing pact boon: ${key}`);
      assert.equal(boon.id, key);
      assert.ok(boon.name, `Pact boon ${key} missing name`);
      assert.ok(boon.nameEn, `Pact boon ${key} missing nameEn`);
      assert.ok(boon.description, `Pact boon ${key} missing description`);
      assert.ok(Array.isArray(boon.features) && boon.features.length > 0, `Pact boon ${key} must have features`);
    }
  });

  await t.test('Chain pact boon specifies familiar options', () => {
    const chain = WARLOCK_PACT_BOONS.chain;
    assert.ok(chain.specialOptions, 'Chain boon must have specialOptions');
    assert.ok(chain.specialOptions.includes('Имп'));
    assert.ok(chain.specialOptions.includes('Квазит'));
    assert.ok(chain.specialOptions.includes('Псевдодракон'));
    assert.ok(chain.specialOptions.includes('Спрайт'));
  });
});

test('Genie Kinds database', async (t) => {
  await t.test('contains all 4 genie kinds with correct damage types and spell progression', () => {
    const kinds: ('dao' | 'djinni' | 'efreeti' | 'marid')[] = ['dao', 'djinni', 'efreeti', 'marid'];
    for (const k of kinds) {
      const genie = GENIE_KINDS[k];
      assert.ok(genie, `Missing genie kind ${k}`);
      assert.equal(genie.id, k);
      assert.ok(genie.name);
      assert.ok(genie.element);
      assert.ok(genie.damageType);
      assert.ok(genie.vesselType);
      assert.ok(genie.spells);
      for (let lvl = 1; lvl <= 5; lvl++) {
        assert.ok(Array.isArray(genie.spells[lvl]), `Genie ${k} must have spells for level ${lvl}`);
        assert.ok(genie.spells[lvl].length > 0, `Genie ${k} level ${lvl} spells cannot be empty`);
      }
    }

    assert.equal(GENIE_KINDS.dao.damageType, 'дробящий');
    assert.equal(GENIE_KINDS.djinni.damageType, 'звук');
    assert.equal(GENIE_KINDS.efreeti.damageType, 'огонь');
    assert.equal(GENIE_KINDS.marid.damageType, 'холод');
  });
});

test('Mystic Arcanum Spells database', async (t) => {
  await t.test('contains spells for circles 6, 7, 8, and 9', () => {
    for (const circle of [6, 7, 8, 9]) {
      const spells = WARLOCK_MYSTIC_ARCANUM_SPELLS[circle];
      assert.ok(Array.isArray(spells), `Arcanum spells for circle ${circle} must be an array`);
      assert.ok(spells.length >= 4, `Arcanum spells for circle ${circle} should have at least 4 spells`);
    }

    assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[6].includes('Круг смерти'));
    assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[7].includes('Перст смерти'));
    assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[8].includes('Демиплан'));
    assert.ok(WARLOCK_MYSTIC_ARCANUM_SPELLS[9].includes('Истинное превращение'));
  });
});

test('isInvocationAvailable helper', async (t) => {
  const agonizingBlast: InvocationDefinition = {
    id: 'agonizing-blast',
    name: 'Мучительный взрыв',
    nameEn: 'Agonizing Blast',
    levelReq: 2,
    cantripReq: 'Мистический заряд',
    description: 'Бонус к урону'
  };

  const thirstingBlade: InvocationDefinition = {
    id: 'thirsting-blade',
    name: 'Жаждущий клинок',
    nameEn: 'Thirsting Blade',
    levelReq: 5,
    pactReq: 'blade',
    description: 'Дополнительная атака'
  };

  const armorOfShadows: InvocationDefinition = {
    id: 'armor-of-shadows',
    name: 'Броня теней',
    nameEn: 'Armor of Shadows',
    levelReq: 2,
    description: 'Доспехи мага по желанию'
  };

  await t.test('checks level requirements', () => {
    assert.equal(isInvocationAvailable(thirstingBlade, 2, 'blade', []), false);
    assert.equal(isInvocationAvailable(thirstingBlade, 4, 'blade', []), false);
    assert.equal(isInvocationAvailable(thirstingBlade, 5, 'blade', []), true);
    assert.equal(isInvocationAvailable(thirstingBlade, 10, 'blade', []), true);
  });

  await t.test('checks pact boon requirements', () => {
    assert.equal(isInvocationAvailable(thirstingBlade, 5, undefined, []), false);
    assert.equal(isInvocationAvailable(thirstingBlade, 5, 'tome', []), false);
    assert.equal(isInvocationAvailable(thirstingBlade, 5, 'chain', []), false);
    assert.equal(isInvocationAvailable(thirstingBlade, 5, 'blade', []), true);
  });

  await t.test('checks cantrip requirements', () => {
    assert.equal(isInvocationAvailable(agonizingBlast, 2, undefined, []), false);
    assert.equal(isInvocationAvailable(agonizingBlast, 2, undefined, ['Огненный снаряд']), false);
    assert.equal(isInvocationAvailable(agonizingBlast, 2, undefined, ['Мистический заряд']), true);
  });

  await t.test('allows invocations with no special requirements once level is met', () => {
    assert.equal(isInvocationAvailable(armorOfShadows, 1), false);
    assert.equal(isInvocationAvailable(armorOfShadows, 2), true);
    assert.equal(isInvocationAvailable(armorOfShadows, 5), true);
  });
});
