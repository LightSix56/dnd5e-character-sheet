import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as ModalsModule from '../src/components/sheet/modals/SheetModals';

describe('Sheet Modals Component Contract', () => {
  it('all 8 modal components exist and are valid React components', () => {
    const modalNames = [
      'LevelDownModal',
      'LevelHistoryModal',
      'NonClassSpellConfirmModal',
      'TemplateModal',
      'AuthModal',
      'SignOutModal',
      'ResetModal',
      'CreateChoiceModal',
    ] as const;

    for (const name of modalNames) {
      const component = (ModalsModule as any)[name];
      assert.ok(component, `${name} should be exported from SheetModals`);
      assert.ok(
        typeof component === 'function' || typeof component === 'object',
        `${name} must be a valid component function or React.memo object`
      );
    }
  });
});
