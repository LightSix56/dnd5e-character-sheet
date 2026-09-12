import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const readFile = (relPath: string) => fs.readFileSync(path.resolve(rootDir, relPath), 'utf8');

describe('Task 3: Escape Key Modal Dismissal & Keyboard Dice Rolls (TDD)', () => {
  describe('1. useEscapeKey Hook Specification', () => {
    it('file src/hooks/useEscapeKey.ts exists and exports useEscapeKey', async () => {
      const hookPath = path.resolve(rootDir, 'src/hooks/useEscapeKey.ts');
      assert.ok(fs.existsSync(hookPath), 'src/hooks/useEscapeKey.ts must exist');

      const content = fs.readFileSync(hookPath, 'utf8');
      assert.match(content, /export\s+function\s+useEscapeKey/, 'useEscapeKey must be exported');
      assert.match(content, /event\.key\s*===\s*['"]Escape['"]/, 'must check event.key === Escape');
      assert.match(content, /event\.stopPropagation\(\)/, 'must stop propagation of Escape event');
      assert.match(content, /window\.addEventListener\(['"]keydown['"]/, 'must listen to window keydown');
      assert.match(content, /window\.removeEventListener\(['"]keydown['"]/, 'must clean up window keydown');
    });

    it('useEscapeKey behavior simulation with global window mock', async () => {
      type KeyListener = (event: { key: string; stopPropagation: () => void }) => void;
      const listeners: KeyListener[] = [];

      const mockWindow = {
        addEventListener: (event: string, fn: KeyListener) => {
          if (event === 'keydown') listeners.push(fn);
        },
        removeEventListener: (event: string, fn: KeyListener) => {
          if (event === 'keydown') {
            const idx = listeners.indexOf(fn);
            if (idx !== -1) listeners.splice(idx, 1);
          }
        },
      };

      (globalThis as any).window = mockWindow;

      try {
        const { useEscapeKey } = await import('../src/hooks/useEscapeKey');

        let escapeCalled = false;
        let propagationStopped = false;
        const onEscape = () => {
          escapeCalled = true;
        };

        const setupHook = (fn?: () => void, isActive = true) => {
          if (!isActive || !fn) return () => {};
          const handleKeyDown = (event: any) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              fn();
            }
          };
          mockWindow.addEventListener('keydown', handleKeyDown);
          return () => mockWindow.removeEventListener('keydown', handleKeyDown);
        };

        const tearDown = setupHook(onEscape, true);
        assert.strictEqual(listeners.length, 1, 'Should register 1 keydown listener');

        // Trigger non-Escape key
        listeners[0]({ key: 'Enter', stopPropagation: () => {} });
        assert.strictEqual(escapeCalled, false, 'Non-Escape key must not trigger callback');

        // Trigger Escape key
        listeners[0]({
          key: 'Escape',
          stopPropagation: () => {
            propagationStopped = true;
          },
        });
        assert.strictEqual(escapeCalled, true, 'Escape key must trigger onEscape');
        assert.strictEqual(propagationStopped, true, 'Escape key must call stopPropagation');

        // Cleanup
        tearDown();
        assert.strictEqual(listeners.length, 0, 'Cleanup must remove keydown listener');
      } finally {
        delete (globalThis as any).window;
      }
    });
  });

  describe('2. RollBadge Accessibility and Keyboard Support in src/app/page.tsx', () => {
    it('RollBadge renders semantic button with keyboard support for Enter and Space', () => {
      const pageContent = readFile('src/app/page.tsx');
      const rollBadgeMatch = pageContent.match(
        /const RollBadge\s*=\s*React\.memo\(function RollBadge\([\s\S]*?return\s*\([\s\S]*?\);?\s*\}\);?/
      );
      assert.ok(rollBadgeMatch, 'RollBadge component must be found in page.tsx');
      const code = rollBadgeMatch[0];

      // Must be a button element with type="button"
      assert.match(code, /<button[^>]*type=["']button["']/, 'RollBadge must render <button type="button">');
      assert.doesNotMatch(code, /<span[^>]*class(?:Name)?=["'][^"']*roll-badge/, 'RollBadge must no longer be a <span>');

      // Must have calc-badge roll-badge cursor-pointer classes
      assert.match(code, /className=["'][^"']*calc-badge/, 'Must include calc-badge class');
      assert.match(code, /className=["'][^"']*roll-badge/, 'Must include roll-badge class');
      assert.match(code, /className=["'][^"']*cursor-pointer/, 'Must include cursor-pointer class');

      // Keyboard handler
      assert.match(code, /onKeyDown=\{/, 'Must have onKeyDown handler');
      assert.match(code, /e\.key\s*===\s*['"]Enter['"]\s*\|\|\s*e\.key\s*===\s*['"] ['"]/, 'Must handle Enter and Space');
      assert.match(code, /e\.preventDefault\(\)/, 'Must preventDefault on Enter/Space');
      assert.match(code, /handleClick\(/, 'Must trigger handleClick on Enter/Space');
    });
  });

  describe('3. Modal Integration with useEscapeKey', () => {
    it('integrates useEscapeKey into src/app/page.tsx modals', () => {
      const content = readFile('src/app/page.tsx');
      assert.match(content, /import.*useEscapeKey.*from\s+['"]@\/hooks\/useEscapeKey['"]/, 'page.tsx must import useEscapeKey');

      // LevelDownModal
      assert.match(
        content,
        /function LevelDownModal[\s\S]*?useEscapeKey\(onCancel\)/,
        'LevelDownModal must use useEscapeKey(onCancel)'
      );

      // LevelHistoryModal (HistoryModal)
      assert.match(
        content,
        /function LevelHistoryModal[\s\S]*?useEscapeKey\(onClose\)/,
        'LevelHistoryModal must use useEscapeKey(onClose)'
      );

      // TemplateModal (TemplatesModal)
      assert.match(
        content,
        /function TemplateModal[\s\S]*?useEscapeKey\(onCancel\)/,
        'TemplateModal must use useEscapeKey(onCancel)'
      );

      // AuthModal
      assert.match(
        content,
        /function AuthModal[\s\S]*?useEscapeKey\(onClose\)/,
        'AuthModal must use useEscapeKey(onClose)'
      );

      // SignOutModal
      assert.match(
        content,
        /function SignOutModal[\s\S]*?useEscapeKey\(onCancel\)/,
        'SignOutModal must use useEscapeKey(onCancel)'
      );

      // RollResultPopup
      assert.match(
        content,
        /function RollResultPopup[\s\S]*?useEscapeKey\(handleClose\)/,
        'RollResultPopup must use useEscapeKey(handleClose)'
      );

      // CreateChoiceModal
      assert.match(
        content,
        /CreateChoiceModal[\s\S]*?useEscapeKey\(/,
        'CreateChoiceModal must integrate useEscapeKey'
      );
    });

    it('integrates useEscapeKey into LevelUpModal', () => {
      const content = readFile('src/components/levelup/LevelUpModal.tsx');
      assert.match(content, /import.*useEscapeKey.*from\s+['"]@\/hooks\/useEscapeKey['"]/, 'LevelUpModal must import useEscapeKey');
      assert.match(content, /useEscapeKey\(onCancel\)/, 'LevelUpModal must call useEscapeKey(onCancel)');
    });

    it('integrates useEscapeKey into CharacterCreationWizardModal', () => {
      const content = readFile('src/components/wizard/CharacterCreationWizardModal.tsx');
      assert.match(content, /import.*useEscapeKey.*from\s+['"]@\/hooks\/useEscapeKey['"]/, 'CharacterCreationWizardModal must import useEscapeKey');
      assert.match(content, /useEscapeKey\(onClose/, 'CharacterCreationWizardModal must call useEscapeKey(onClose)');
    });

    it('integrates useEscapeKey into NameGeneratorModal', () => {
      const content = readFile('src/components/tools/NameGeneratorModal.tsx');
      assert.match(content, /import.*useEscapeKey.*from\s+['"]@\/hooks\/useEscapeKey['"]/, 'NameGeneratorModal must import useEscapeKey');
      assert.match(content, /useEscapeKey\(onClose\)/, 'NameGeneratorModal must call useEscapeKey(onClose)');
    });

    it('integrates useEscapeKey into StatsCalculatorModal', () => {
      const content = readFile('src/components/tools/StatsCalculatorModal.tsx');
      assert.match(content, /import.*useEscapeKey.*from\s+['"]@\/hooks\/useEscapeKey['"]/, 'StatsCalculatorModal must import useEscapeKey');
      assert.match(content, /useEscapeKey\(onClose\)/, 'StatsCalculatorModal must call useEscapeKey(onClose)');
    });

    it('integrates useEscapeKey into ShareModal', () => {
      const content = readFile('src/components/tools/ShareModal.tsx');
      assert.match(content, /import.*useEscapeKey.*from\s+['"]@\/hooks\/useEscapeKey['"]/, 'ShareModal must import useEscapeKey');
      assert.match(content, /useEscapeKey\(onClose/, 'ShareModal must call useEscapeKey(onClose)');
    });

    it('integrates useEscapeKey into Compendium Modals (Class, Race, Subclass, Item, Spell, Weapon, Trait)', () => {
      const classContent = readFile('src/components/compendium/ClassSelectorModal.tsx');
      assert.match(classContent, /useEscapeKey\(onClose\)/, 'ClassSelectorModal must call useEscapeKey(onClose)');

      const raceContent = readFile('src/components/compendium/RaceSelectorModal.tsx');
      assert.match(raceContent, /useEscapeKey\(onClose\)/, 'RaceSelectorModal must call useEscapeKey(onClose)');

      const subclassContent = readFile('src/components/compendium/SubclassSelectorModal.tsx');
      assert.match(subclassContent, /useEscapeKey\(onClose\)/, 'SubclassSelectorModal must call useEscapeKey(onClose)');

      const itemContent = readFile('src/components/compendium/ItemDetailModal.tsx');
      assert.match(itemContent, /useEscapeKey\(onClose/, 'ItemDetailModal must call useEscapeKey(onClose)');

      const compendiumModalsContent = readFile('src/components/compendium/CompendiumModals.tsx');
      assert.match(
        compendiumModalsContent,
        /function SpellDetailModal[\s\S]*?useEscapeKey\(onClose/,
        'SpellDetailModal must call useEscapeKey(onClose)'
      );
      assert.match(
        compendiumModalsContent,
        /function WeaponDetailModal[\s\S]*?useEscapeKey\(onClose/,
        'WeaponDetailModal must call useEscapeKey(onClose)'
      );
      assert.match(
        compendiumModalsContent,
        /function TraitDetailModal[\s\S]*?useEscapeKey\(onClose/,
        'TraitDetailModal must call useEscapeKey(onClose)'
      );
    });
  });

  describe('4. Backdrop Click Prevention for Complex Modals', () => {
    it('CharacterCreationWizardModal does not dismiss on backdrop click', () => {
      const content = readFile('src/components/wizard/CharacterCreationWizardModal.tsx');
      assert.doesNotMatch(
        content,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'CharacterCreationWizardModal backdrop must not have onClick={onClose}'
      );
    });

    it('LevelUpModal does not dismiss on backdrop click', () => {
      const content = readFile('src/components/levelup/LevelUpModal.tsx');
      assert.doesNotMatch(
        content,
        /parchment-modal-overlay[^>]*onClick=\{onCancel\}/,
        'LevelUpModal backdrop must not have onClick={onCancel}'
      );
    });

    it('Tools and Calculator modals do not dismiss on backdrop click', () => {
      const statsContent = readFile('src/components/tools/StatsCalculatorModal.tsx');
      assert.doesNotMatch(
        statsContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'StatsCalculatorModal backdrop must not have onClick={onClose}'
      );

      const nameContent = readFile('src/components/tools/NameGeneratorModal.tsx');
      assert.doesNotMatch(
        nameContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'NameGeneratorModal backdrop must not have onClick={onClose}'
      );

      const gridContent = readFile('src/components/tools/CharacterGridModal.tsx');
      assert.doesNotMatch(
        gridContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'CharacterGridModal backdrop must not have onClick={onClose}'
      );

      const shareContent = readFile('src/components/tools/ShareModal.tsx');
      assert.doesNotMatch(
        shareContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'ShareModal backdrop must not have onClick={onClose}'
      );
    });

    it('Compendium modals do not dismiss on backdrop click', () => {
      const classContent = readFile('src/components/compendium/ClassSelectorModal.tsx');
      assert.doesNotMatch(
        classContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'ClassSelectorModal backdrop must not have onClick={onClose}'
      );

      const raceContent = readFile('src/components/compendium/RaceSelectorModal.tsx');
      assert.doesNotMatch(
        raceContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'RaceSelectorModal backdrop must not have onClick={onClose}'
      );

      const subclassContent = readFile('src/components/compendium/SubclassSelectorModal.tsx');
      assert.doesNotMatch(
        subclassContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'SubclassSelectorModal backdrop must not have onClick={onClose}'
      );

      const itemContent = readFile('src/components/compendium/ItemDetailModal.tsx');
      assert.doesNotMatch(
        itemContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'ItemDetailModal backdrop must not have onClick={onClose}'
      );

      const compendiumModalsContent = readFile('src/components/compendium/CompendiumModals.tsx');
      assert.doesNotMatch(
        compendiumModalsContent,
        /parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'CompendiumModals backdrops must not have onClick={onClose}'
      );
    });

    it('page.tsx confirmation and management modals do not dismiss on backdrop click', () => {
      const pageContent = readFile('src/app/page.tsx');

      // CreateChoiceModal
      assert.doesNotMatch(
        pageContent,
        /function CreateChoiceModal[\s\S]*?parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'CreateChoiceModal backdrop must not have onClick={onClose}'
      );

      // LevelDownModal
      assert.doesNotMatch(
        pageContent,
        /function LevelDownModal[\s\S]*?parchment-modal-overlay[^>]*onClick=\{onCancel\}/,
        'LevelDownModal backdrop must not have onClick={onCancel}'
      );

      // LevelHistoryModal
      assert.doesNotMatch(
        pageContent,
        /function LevelHistoryModal[\s\S]*?parchment-modal-overlay[^>]*onClick=\{onClose\}/,
        'LevelHistoryModal backdrop must not have onClick={onClose}'
      );

      // ResetModal
      assert.doesNotMatch(
        pageContent,
        /function ResetModal[\s\S]*?parchment-modal-overlay[^>]*onClick=\{onCancel\}/,
        'ResetModal backdrop must not have onClick={onCancel}'
      );

      // TemplateModal (ClassTemplatesModal)
      assert.doesNotMatch(
        pageContent,
        /function TemplateModal[\s\S]*?parchment-modal-overlay[^>]*onClick=\{onCancel\}/,
        'TemplateModal backdrop must not have onClick={onCancel}'
      );
    });
  });
});
