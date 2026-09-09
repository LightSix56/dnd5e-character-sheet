import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const readFile = (relPath: string) => fs.readFileSync(path.resolve(rootDir, relPath), 'utf8');

describe('Task 4: Auth Modal Form Wrapping, Image Sizing & Typographic Ellipsis (TDD)', () => {
  describe('1. AuthModal Form Wrapping & Attributes in src/app/page.tsx', () => {
    it('wraps email, password inputs, and submit button in a form element with onSubmit', () => {
      const content = readFile('src/app/page.tsx');

      // Extract AuthModal definition
      const authModalMatch = content.match(/const AuthModal = React\.memo\(function AuthModal[\s\S]*?\n\}\);/);
      assert.ok(authModalMatch, 'AuthModal component should exist');
      const authModal = authModalMatch[0];

      // Form tag wrapping onSubmit with preventDefault and onAuth
      assert.match(
        authModal,
        /<form[^>]*onSubmit=\{\s*\(?e\)?\s*=>\s*\{\s*e\.preventDefault\(\);\s*onAuth\(\);\s*\}\s*\}/,
        'AuthModal must have <form onSubmit={(e) => { e.preventDefault(); onAuth(); }}>'
      );
      assert.match(authModal, /<\/form>/, 'AuthModal must have closing </form>');

      // Email input attributes
      assert.match(
        authModal,
        /<input[^>]*type="email"[^>]*name="email"[^>]*autoComplete="email"[^>]*spellCheck=\{false\}/,
        'Email input must have type="email", name="email", autoComplete="email", and spellCheck={false}'
      );

      // Password input attributes
      assert.match(
        authModal,
        /<input[^>]*type="password"[^>]*name="password"[^>]*autoComplete=\{\s*isSignUp\s*\?\s*['"]new-password['"]\s*:\s*['"]current-password['"]\s*\}/,
        'Password input must have type="password", name="password", and autoComplete={isSignUp ? "new-password" : "current-password"}'
      );

      // Submit button type="submit" and loading text with typographic ellipsis
      assert.match(
        authModal,
        /<button[^>]*type="submit"[^>]*>[\s\S]*?Загрузка…[\s\S]*?<\/button>/,
        'Auth button must have type="submit" and use typographic ellipsis in "Загрузка…"'
      );
    });
  });

  describe('2. Portrait Image Sizing and Lazy Loading', () => {
    it('portrait <img> in src/app/page.tsx has width, height, and loading="lazy"', () => {
      const content = readFile('src/app/page.tsx');
      const portraitImgMatch = content.match(/<img[^>]*src=\{portraitUrl\}[^>]*\/>/);
      assert.ok(portraitImgMatch, 'Portrait <img> in src/app/page.tsx must exist');
      const imgTag = portraitImgMatch[0];

      assert.match(imgTag, /width=\{144\}|width="144"/, 'Portrait <img> must have width 144');
      assert.match(imgTag, /height=\{176\}|height="176"/, 'Portrait <img> must have height 176');
      assert.match(imgTag, /loading="lazy"/, 'Portrait <img> must have loading="lazy"');
    });

    it('portrait <img> in src/app/share/[code]/page.tsx has width, height, and loading="lazy"', () => {
      const content = readFile('src/app/share/[code]/page.tsx');
      const portraitImgMatch = content.match(/<img[\s\S]*?src=\{portraitUrl\}[\s\S]*?\/>/);
      assert.ok(portraitImgMatch, 'Portrait <img> in src/app/share/[code]/page.tsx must exist');
      const imgTag = portraitImgMatch[0];

      assert.match(imgTag, /width=\{144\}|width="144"/, 'Portrait <img> must have width 144');
      assert.match(imgTag, /height=\{176\}|height="176"/, 'Portrait <img> must have height 176');
      assert.match(imgTag, /loading="lazy"/, 'Portrait <img> must have loading="lazy"');
    });

    it('portrait <img> in src/components/tools/CharacterGridModal.tsx has width, height, and loading="lazy"', () => {
      const content = readFile('src/components/tools/CharacterGridModal.tsx');
      const portraitImgMatch = content.match(/<img[\s\S]*?src=\{portrait\}[\s\S]*?\/>/);
      assert.ok(portraitImgMatch, 'Portrait <img> in CharacterGridModal.tsx must exist');
      const imgTag = portraitImgMatch[0];

      assert.match(imgTag, /width=\{72\}|width="72"/, 'Portrait <img> must have width 72');
      assert.match(imgTag, /height=\{72\}|height="72"/, 'Portrait <img> must have height 72');
      assert.match(imgTag, /loading="lazy"/, 'Portrait <img> must have loading="lazy"');
    });
  });

  describe('3. Typographic Ellipsis (… instead of ...) in Placeholders & Loading', () => {
    it('updates placeholders in src/app/page.tsx', () => {
      const content = readFile('src/app/page.tsx');
      assert.match(content, /placeholder="Оружие или атака…"/, 'Must use … in weapon placeholder');
      assert.match(
        content,
        /placeholder="Поиск способности \(Второе дыхание, Ярость, Темное зрение\)…"|placeholder='Поиск способности \(Второе дыхание, Ярость, Темное зрение\)…'/,
        'Must use … in ability search placeholder'
      );
      assert.match(content, /placeholder="Название умения…"/, 'Must use … in feature name placeholder');
      assert.match(
        content,
        /placeholder="Опишите внешность персонажа: цвет волос, глаз, отличительные черты…"|placeholder='Опишите внешность персонажа: цвет волос, глаз, отличительные черты…'/,
        'Must use … in appearance placeholder'
      );
      assert.match(content, /Расскажите историю персонажа…/, 'Must use … in backstory placeholder');
      assert.match(
        content,
        /placeholder="Введите заклинание \(Огненный шар, Щит, Лечащее слово\)…"|placeholder='Введите заклинание \(Огненный шар, Щит, Лечащее слово\)…'/,
        'Must use … in spell search placeholder'
      );
      assert.match(content, /placeholder="Название заговора…"/, 'Must use … in cantrip placeholder');
    });

    it('updates loading text in src/app/share/[code]/page.tsx', () => {
      const content = readFile('src/app/share/[code]/page.tsx');
      assert.match(content, /Загрузка свитка персонажа…/, 'Must use … in shared page loading text');
      assert.doesNotMatch(content, /Загрузка свитка персонажа\.\.\./, 'Must not have 3 dots in shared loading text');
    });

    it('updates placeholder in src/components/tools/CharacterGridModal.tsx', () => {
      const content = readFile('src/components/tools/CharacterGridModal.tsx');
      assert.match(content, /placeholder="Поиск по имени, классу или расе…"/, 'Must use … in character search placeholder');
      assert.doesNotMatch(content, /placeholder="Поиск по имени, классу или расе\.\.\."/, 'Must not have 3 dots');
    });

    it('updates loading text and shareUrl input spellCheck in src/components/tools/ShareModal.tsx', () => {
      const content = readFile('src/components/tools/ShareModal.tsx');
      assert.match(content, /Создание магической ссылки и снимка листа…/, 'Must use … in share loading text');
      assert.doesNotMatch(content, /Создание магической ссылки и снимка листа\.\.\./, 'Must not have 3 dots in share loading text');

      // shareUrl input spellCheck={false}
      const shareUrlInputMatch = content.match(/<input[\s\S]*?value=\{shareUrl\}[\s\S]*?\/>/);
      assert.ok(shareUrlInputMatch, 'shareUrl input must exist');
      assert.match(shareUrlInputMatch[0], /spellCheck=\{false\}/, 'shareUrl input must have spellCheck={false}');
    });

    it('updates descriptions and placeholders in src/components/wizard/CharacterCreationWizardModal.tsx', () => {
      const content = readFile('src/components/wizard/CharacterCreationWizardModal.tsx');
      assert.match(content, /description\.slice\(0,\s*90\)\s*\+\s*['"]…['"]/, 'Must use … in description slices');
      assert.doesNotMatch(content, /description\.slice\(0,\s*90\)\s*\+\s*['"]\.\.\.['"]/, 'Must not have ... in description slices');

      assert.match(content, /Сначала выберите расу персонажа из списка ниже…/, 'Must use … in wizard race select prompt');
      assert.match(content, /Например, Торин Дубощит, Лираэль Лунная Тень…/, 'Must use … in wizard name example');
      assert.match(content, /placeholder="Поиск расы…"|placeholder='Поиск расы…'/, 'Must use … in wizard race search placeholder');
      assert.match(content, /placeholder="Быстрый поиск по заклинаниям…"|placeholder='Быстрый поиск по заклинаниям…'/, 'Must use … in wizard spell search placeholder');
      assert.match(
        content,
        /placeholder="Опишите внешность вашего персонажа: особые приметы, шрамы, осанку…"|placeholder='Опишите внешность вашего персонажа: особые приметы, шрамы, осанку…'/,
        'Must have colon and … in wizard appearance placeholder'
      );
    });

    it('updates placeholders in src/components/levelup/LevelUpModal.tsx', () => {
      const content = readFile('src/components/levelup/LevelUpModal.tsx');
      assert.match(content, /placeholder="Название заговора вашего класса…"/, 'Must use … in levelup cantrip placeholder');
      assert.match(content, /placeholder="Название заклинания вашего класса…"/, 'Must use … in levelup spell placeholder');
      assert.match(content, /placeholder="Дополнительные примечания к повышению уровня…"/, 'Must use … in levelup notes placeholder');
    });

    it('updates placeholders in src/components/compendium/ modals', () => {
      const classContent = readFile('src/components/compendium/ClassSelectorModal.tsx');
      assert.match(classContent, /placeholder="Поиск класса…"|placeholder='Поиск класса…'/, 'ClassSelectorModal must use …');

      const raceContent = readFile('src/components/compendium/RaceSelectorModal.tsx');
      assert.match(raceContent, /placeholder="Поиск расы или книги…"|placeholder='Поиск расы или книги…'/, 'RaceSelectorModal must use …');

      const compContent = readFile('src/components/compendium/CompendiumModals.tsx');
      assert.match(compContent, /placeholder="Введите подробное описание умения…"|placeholder='Введите подробное описание умения…'/, 'CompendiumModals must use …');
    });
  });
});
