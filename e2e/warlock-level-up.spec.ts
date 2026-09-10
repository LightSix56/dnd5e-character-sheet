import { test, expect } from '@playwright/test';

test.describe('Warlock Character Creation and Level-Up E2E', () => {
  test('Warlock Level 1 creation with Genie patron displays Genie Kind options', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Open Character Creation Choice modal
    const createBtn = page.locator('button:has-text("Создать персонажа"):visible');
    await createBtn.click();

    // Select wizard flow
    const wizardBtn = page.locator('button:has-text("Пошаговый мастер"):visible');
    if (await wizardBtn.isVisible()) {
      await wizardBtn.click();
    }

    // Step 1: Select Race without extra choices required (Тифлинг)
    const tieflingBtn = page.locator('button:has-text("Тифлинг"):visible').first();
    await expect(tieflingBtn).toBeVisible();
    await tieflingBtn.click();

    // Generate random name
    const randomNameBtn = page.locator('button:has-text("Случайное имя"):visible').first();
    await expect(randomNameBtn).toBeVisible();
    await randomNameBtn.click();

    // Advance to Step 2 (Class & Skills)
    const nextBtn = page.locator('button:has-text("Далее"):visible').last();
    await nextBtn.click();

    // Pick Warlock class (Колдун)
    const warlockCard = page.locator('button:has-text("Колдун"):visible').first();
    await expect(warlockCard).toBeVisible({ timeout: 5000 });
    await warlockCard.click();

    // Pick Genie patron (Джинн)
    const geniePatron = page.locator('button:has-text("Джинн"):visible').first();
    await expect(geniePatron).toBeVisible();
    await geniePatron.click();

    // Check that Genie Kinds are visible (Дао, Джинни, Ифрит, Марид)
    const daoOption = page.locator('button:has-text("Дао"):visible').first();
    const efreetiOption = page.locator('button:has-text("Ифрит"):visible').first();
    await expect(daoOption).toBeVisible();
    await expect(efreetiOption).toBeVisible();

    // Select Efreeti
    await efreetiOption.click();

    // Verify Efreeti selection details
    await expect(efreetiOption).toContainText('огонь');
  });

  test('Warlock Level-up flow from Level 1 to 2 (Invocations) and Level 3 (Pact Boon)', async ({ page }) => {
    const warlockChar = {
      name: 'Мордекай',
      race: 'Тифлинг',
      className: 'Колдун',
      subclass: 'Исчадие',
      level: 1,
      maxHp: 10,
      currentHp: 10,
      tempHp: 0,
      hitDice: '1d8',
      hitDiceTotal: '1',
      proficiencyBonus: 2,
      armorClass: 12,
      speed: 30,
      initiative: 2,
      abilityScores: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 16 },
      savingThrowProficiencies: { СИЛ: false, ЛОВ: false, ТЕЛ: false, ИНТ: false, МДР: true, ХАР: true },
      skillProficiencies: { 'Магия': true, 'Обман': true },
      spellSlots: { 1: { current: 1, max: 1 } },
      spells: [],
      traitsList: [
        {
          id: 'trait-1',
          name: 'Благословение Тёмного',
          source: 'Подкласс',
          description: 'Когда вы снижаете хиты враждебного существа до 0, вы получаете временные хиты.',
        },
      ],
      levelHistory: [],
    };

    await page.addInitScript((data) => {
      localStorage.setItem('dnd5e_character', JSON.stringify(data));
    }, warlockChar);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify character is loaded as Level 1 Warlock
    await expect(page.locator('#char-input-class')).toHaveValue('Колдун');
    await expect(page.locator('text=👑 Исчадие')).toBeVisible();

    // ── Level Up from 1 to 2 ──
    const levelUpBtn = page.locator('button[title="Повысить"]:visible');
    await levelUpBtn.click();

    // Verify LevelUp modal is open
    const levelUpModal = page.locator('.parchment-modal:visible');
    await expect(levelUpModal).toBeVisible();
    await expect(levelUpModal).toContainText('Повышение до 2-го уровня');

    // Invocations section should be visible
    await expect(levelUpModal).toContainText('Выбор Таинственных воззваний');
    await expect(levelUpModal).toContainText('Выбрано 0 из 2');

    // Per dnd.su table: Warlock at level 2 gets 0 new cantrips (hidden), but learns +1 spell (visible)
    await expect(levelUpModal.locator('h3:has-text("Новые заговоры:")')).toBeHidden();
    await expect(levelUpModal.locator('h3:has-text("Изучение новых заклинаний:")')).toBeVisible();
    await expect(levelUpModal.locator('h3:has-text("Заметки к уровню:")')).toBeVisible();

    // Confirm button should be disabled until 2 invocations are picked
    const confirmBtn = levelUpModal.locator('button:has-text("Повысить до 2-го уровня")');
    await expect(confirmBtn).toBeDisabled();

    // Pick 2 invocations: "Мучительный взрыв" and "Броня теней"
    const agonizingBlast = levelUpModal.locator('button:has-text("Мучительный взрыв")');
    const armorOfShadows = levelUpModal.locator('button:has-text("Броня теней")');
    await agonizingBlast.click();
    await armorOfShadows.click();

    await expect(levelUpModal).toContainText('Выбрано 2 из 2');
    await expect(confirmBtn).toBeEnabled();

    // Complete Level Up to 2
    await confirmBtn.click();
    await expect(levelUpModal).toBeHidden({ timeout: 5000 });

    // Verify character sheet updated to Level 2
    await expect(page.locator('span:text-is("2")').first()).toBeVisible();

    // ── Level Up from 2 to 3 (Pact Boon) ──
    await levelUpBtn.click();
    await expect(levelUpModal).toBeVisible();
    await expect(levelUpModal).toContainText('Повышение до 3-го уровня');

    // Pact Boon choice should be present
    await expect(levelUpModal).toContainText('Предмет договора колдуна (Pact Boon)');

    // Select Pact of the Tome ("Договор гримуара")
    const tomeBoonBtn = levelUpModal.locator('button:has-text("Договор гримуара")');
    await expect(tomeBoonBtn).toBeVisible();
    await tomeBoonBtn.click();

    // 3 cantrips picker should appear
    await expect(levelUpModal).toContainText('Заговоры «Книги Теней»');

    const confirmLvl3Btn = levelUpModal.locator('button:has-text("Повысить до 3-го уровня")');
    await expect(confirmLvl3Btn).toBeDisabled();

    // Pick 3 cantrips from the list inside the tome section
    const tomeSection = levelUpModal.locator('div:has-text("Заговоры «Книги Теней»")').locator('..');
    const cantripButtons = tomeSection.locator('div.max-h-40 button[type="button"]');
    await cantripButtons.nth(0).click();
    await cantripButtons.nth(1).click();
    await cantripButtons.nth(2).click();

    await expect(confirmLvl3Btn).toBeEnabled();
    await confirmLvl3Btn.click();
    await expect(levelUpModal).toBeHidden({ timeout: 5000 });

    // Verify character is now Level 3
    await expect(page.locator('span:text-is("3")').first()).toBeVisible();
  });

  test('Cleric level 2 hides both cantrips and spell learning blocks, keeping notes and slots', async ({ page }) => {
    const clericChar = {
      name: 'София',
      race: 'Человек',
      className: 'Жрец',
      subclass: 'Домен жизни',
      level: 1,
      maxHp: 10,
      currentHp: 10,
      tempHp: 0,
      hitDice: '1d8',
      hitDiceTotal: '1',
      proficiencyBonus: 2,
      armorClass: 16,
      speed: 30,
      initiative: 0,
      abilityScores: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 10 },
      savingThrowProficiencies: { СИЛ: false, ЛОВ: false, ТЕЛ: false, ИНТ: false, МДР: true, ХАР: true },
      skillProficiencies: { 'Медицина': true, 'Религия': true },
      spellSlots: { 1: { current: 2, max: 2 } },
      spells: [],
      traitsList: [],
      levelHistory: [],
    };

    await page.addInitScript((data) => {
      localStorage.setItem('dnd5e_character', JSON.stringify(data));
    }, clericChar);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify character is loaded as Level 1 Cleric
    await expect(page.locator('#char-input-class')).toHaveValue('Жрец');

    // Level up to 2
    const levelUpBtn = page.locator('button[title="Повысить"]:visible');
    await levelUpBtn.click();

    const levelUpModal = page.locator('.parchment-modal:visible');
    await expect(levelUpModal).toBeVisible();

    // Spell slots section must be visible (showing slots for level 2)
    await expect(levelUpModal.locator('h3:has-text("Магия и ячейки заклинаний:")')).toBeVisible();

    // Per dnd.su: Cleric at lvl 2 gets 0 new cantrips (3->3) and learns 0 individual spells (prepared caster)
    await expect(levelUpModal.locator('h3:has-text("Новые заговоры:")')).toBeHidden();
    await expect(levelUpModal.locator('h3:has-text("Изучение новых заклинаний:")')).toBeHidden();

    // Freeform notes must remain visible
    await expect(levelUpModal.locator('h3:has-text("Заметки к уровню:")')).toBeVisible();
  });
});

