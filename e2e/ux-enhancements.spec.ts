import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const SCREENSHOT_DIR = path.resolve('artifacts', 'ux_audit');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('UX and Accessibility Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('1. Clickable hit targets for skills and form labels', async ({ page }) => {
    // Locate skill text
    const athleticsSpan = page.locator('span:text-is("Атлетика"):visible').first();
    await expect(athleticsSpan).toBeVisible();

    const skillRow = athleticsSpan.locator('xpath=..');
    const profCheckbox = skillRow.locator('input[type="checkbox"]').first();

    const wasChecked = await profCheckbox.isChecked();

    // Click skill text label
    await athleticsSpan.click();
    await expect(profCheckbox).toBeChecked({ checked: !wasChecked });

    // Click again to toggle back
    await athleticsSpan.click();
    await expect(profCheckbox).toBeChecked({ checked: wasChecked });

    // Click label[for="char-input-name"]
    const charNameLabel = page.locator('label[for="char-input-name"]:visible').first();
    await charNameLabel.click();
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('char-input-name');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_hit_targets.png') });
  });

  test('2. Keyboard accessible dice rolls and escape popup dismissal', async ({ page }) => {
    const rollBadge = page.locator('button.roll-badge:visible').first();
    await expect(rollBadge).toBeVisible();

    await rollBadge.focus();
    await page.keyboard.press('Enter');

    const rollPopup = page.locator('.roll-result-popup:visible');
    await expect(rollPopup).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_roll_popup_keyboard.png') });

    await page.keyboard.press('Escape');
    await expect(rollPopup).toBeHidden({ timeout: 3000 });
  });

  test('3. Escape key modal dismissal across modals', async ({ page }) => {
    // Test Level Up modal
    const levelUpBtn = page.locator('button[title="Повысить"]:visible');
    await levelUpBtn.click();
    const levelUpModal = page.locator('h2:has-text("Повышение до")');
    await expect(levelUpModal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(levelUpModal).toBeHidden({ timeout: 3000 });

    // Test Character Creation Choice modal
    const heroBtn = page.locator('button:has-text("Создать персонажа"):visible');
    await heroBtn.click();
    const choiceModal = page.locator(':is(h2, h3):has-text("Создание нового персонажа")');
    await expect(choiceModal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(choiceModal).toBeHidden({ timeout: 3000 });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_escape_key_modals.png') });
  });

  test('4. Auth modal form wrapping and Enter key submission', async ({ page }) => {
    const authBtn = page.locator('button:has-text("Войти"):visible').first();
    await authBtn.click();

    const authModal = page.locator('form:visible');
    await expect(authModal).toBeVisible();

    const emailInput = page.locator('input[name="email"]:visible');
    const passwordInput = page.locator('input[name="password"]:visible');

    await emailInput.fill('playwright-test@dnd5e.com');
    await passwordInput.fill('SecretPassword123');

    await passwordInput.press('Enter');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_auth_enter_submit.png') });

    await page.keyboard.press('Escape');
    await expect(authModal).toBeHidden({ timeout: 3000 });
  });

  test('5. Focus-visible golden ring during keyboard navigation', async ({ page }) => {
    const firstTab = page.locator('.parchment-tabs button:visible').first();
    await firstTab.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_focus_visible_tab.png') });
  });

  test('6. Sheet dropdown menu ("Бланк") toggle and Escape dismissal', async ({ page }) => {
    const sheetBtn = page.locator('button:has-text("Бланк"):visible').first();
    await expect(sheetBtn).toBeVisible();

    await sheetBtn.click();
    const menuDropdown = page.locator('.parchment-menu-dropdown:visible');
    await expect(menuDropdown).toBeVisible();
    await expect(menuDropdown.locator('button:has-text("Готовые шаблоны")')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_sheet_dropdown.png') });

    await page.keyboard.press('Escape');
    await expect(menuDropdown).toBeHidden({ timeout: 3000 });
  });

  test('7. Sliding tab indicator across navigation tabs', async ({ page }) => {
    const spellsTab = page.locator('.parchment-tabs button:has-text("Заклинания"):visible');
    await spellsTab.click();
    await page.waitForTimeout(300);

    const activeIndicator = page.locator('.parchment-tabs .parchment-tab-active:visible');
    await expect(activeIndicator).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_sliding_tabs.png') });
  });

  test('8. Alive empty states for weapons, equipment, and spells', async ({ page }) => {
    // Navigate to spells tab to verify empty states on fresh/unprepared slots
    const spellsTab = page.locator('.parchment-tabs button:has-text("Заклинания"):visible');
    await spellsTab.click();
    await page.waitForTimeout(300);

    const emptyStates = page.locator('.parchment-empty-state:visible');
    await expect(emptyStates.first()).toBeVisible();
    await emptyStates.first().scrollIntoViewIfNeeded();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_empty_states.png') });
  });
});
