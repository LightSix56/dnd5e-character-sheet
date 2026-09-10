import { test, expect } from '@playwright/test';

test.describe('Rogue Level-Up E2E Tests', () => {
  const baseRogueChar = {
    name: 'Элиас',
    race: 'Человек',
    className: 'Плут',
    subclass: '',
    level: 2,
    hpMax: 17,
    hpCurrent: 17,
    tempHp: 0,
    hitDice: '2d8',
    hitDiceTotal: '2',
    proficiencyBonus: 2,
    armorClass: 14,
    speed: 30,
    initiative: 3,
    abilityScores: { 'СИЛ': 10, 'ЛОВ': 16, 'ТЕЛ': 14, 'ИНТ': 12, 'МДР': 12, 'ХАР': 10 },
    savingThrowProficiencies: { 'СИЛ': false, 'ЛОВ': true, 'ТЕЛ': false, 'ИНТ': true, 'МДР': false, 'ХАР': false },
    skillProficiencies: { 'Акробатика': true, 'Скрытность': true, 'Ловкость рук': true, 'Анализ': true },
    skillExpertise: { 'Скрытность': true, 'Ловкость рук': true },
    spellSlots: {},
    spells: [],
    traitsList: [
      {
        id: 'sneak-attack',
        name: 'Скрытая атака',
        source: 'Плут (1 ур.)',
        description: 'Дополнительный урон 1d6 при преимуществе.',
      },
      {
        id: 'cunning-action',
        name: 'Хитроумное действие',
        source: 'Плут (2 ур.)',
        description: 'Рывок, Отход или Засада бонусным действием.',
      },
    ],
    levelHistory: [],
  };

  test('Rogue Level 2 to 3 offers all 9 official subclasses in dropdown', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('dnd5e_character', JSON.stringify(data));
    }, baseRogueChar);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Click Level-up button
    const levelUpBtn = page.locator('button[title="Повысить"]:visible');
    await expect(levelUpBtn).toBeVisible({ timeout: 10000 });
    await levelUpBtn.click();

    // Verify modal is open
    const modal = page.locator('.parchment-modal');
    await expect(modal).toBeVisible();

    // Check subclass select dropdown
    const select = page.locator('select.parchment-select').first();
    await expect(select).toBeVisible();

    // Check that all 9 official subclasses are present
    const expectedSubclasses = [
      'Вор',
      'Убийца',
      'Мистический ловкач',
      'Головорез',
      'Клинок души',
      'Фантом',
      'Сыщик',
      'Скаут',
      'Мастер интриг',
    ];

    for (const subName of expectedSubclasses) {
      const option = select.locator(`option[value="${subName}"]`);
      await expect(option).toBeAttached();
    }
  });

  test('Rogue Level 2 to 3 with Scout automatically grants Nature and Survival proficiencies & expertise', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('dnd5e_character', JSON.stringify(data));
    }, baseRogueChar);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Open Level Up Modal
    const levelUpBtn = page.locator('button[title="Повысить"]:visible');
    await levelUpBtn.click();

    // Select Scout
    const select = page.locator('select.parchment-select').first();
    await select.selectOption({ label: 'Скаут (Scout) — XGE' });

    // Verify features displayed
    await expect(page.locator('strong:has-text("Мастер выживания")').first()).toBeVisible();
    await expect(page.locator('text=Манёвренный боец (Застрельщик)').first()).toBeVisible();

    // Apply Level Up
    const applyBtn = page.locator('button:has-text("Повысить до"):visible');
    await applyBtn.click();

    // Modal should close
    await expect(page.locator('.parchment-modal')).not.toBeVisible();

    // Verify Level 3 and Subclass badge on sheet
    await expect(page.locator('text=👑 Скаут')).toBeVisible();

    // Verify Nature and Survival skills on sheet
    await expect(page.locator('text=Выживание (МДР)')).toBeVisible();
    await expect(page.locator('text=Природа (ИНТ)')).toBeVisible();

    // Verify trait is added to sheet traits list
    await expect(page.locator('input[value="Мастер выживания"]').first()).toBeAttached();
    await expect(page.locator('input[value="Манёвренный боец (Застрельщик)"]').first()).toBeAttached();
  });

  test('Rogue Level 2 to 3 with Arcane Trickster handles Mage Hand and spell selection', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('dnd5e_character', JSON.stringify(data));
    }, baseRogueChar);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Open Level Up Modal
    const levelUpBtn = page.locator('button[title="Повысить"]:visible');
    await levelUpBtn.click();

    // Select Arcane Trickster
    const select = page.locator('select.parchment-select').first();
    await select.selectOption({ label: 'Мистический ловкач (Arcane Trickster) — PHB' });

    // Verify Arcane Trickster features
    await expect(page.locator('text=Использование заклинаний (Мистический ловкач)').first()).toBeVisible();
    await expect(page.locator('text=Ловкость рук волшебной рукой').first()).toBeVisible();

    // Verify spell slots section shows 1st circle: 2 slots
    await expect(page.locator('text=1 круг: 2 ячейки').first()).toBeVisible();

    // Verify cantrips section specifies +2 selectable cantrips and mentions auto-granted Mage Hand
    await expect(page.locator('text=Новые заговоры:').first()).toBeVisible();
    await expect(page.locator('text=Волшебная рука').first()).toBeVisible();

    // Select 2 cantrips
    const cantripSelects = page.locator('select:has-text("Выберите заговор...")');
    const cantripCount = await cantripSelects.count();
    if (cantripCount >= 2) {
      await cantripSelects.nth(0).selectOption({ index: 1 });
      await cantripSelects.nth(1).selectOption({ index: 2 });
    }

    // Select 3 spells (1st level)
    const spellSelects = page.locator('select:has-text("Выберите заклинание...")');
    const spellCount = await spellSelects.count();
    if (spellCount >= 3) {
      await spellSelects.nth(0).selectOption({ index: 1 });
      await spellSelects.nth(1).selectOption({ index: 2 });
      await spellSelects.nth(2).selectOption({ index: 3 });
    }

    // Apply Level Up
    const applyBtn = page.locator('button:has-text("Повысить до"):visible');
    await applyBtn.click();

    // Modal should close
    await expect(page.locator('.parchment-modal')).not.toBeVisible();

    // Verify Level 3 and Subclass badge on sheet
    await expect(page.locator('text=👑 Мистический ловкач')).toBeVisible();
  });
});
