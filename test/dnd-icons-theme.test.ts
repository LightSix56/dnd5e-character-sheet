import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  TrashBinIcon,
  SearchLensIcon,
  LockSealIcon,
  WarningSignIcon,
  WeightAnvilIcon,
  WingedBootIcon,
  MoonRestIcon,
  HeartGemIcon,
  EyeMysticIcon,
  ScrollDownloadIcon,
  CrownRulerIcon,
  ParchmentMenuIcon,
  DeviceStoneIcon,
  SkullDeathIcon,
  LightningStrikeIcon,
  TargetAimIcon,
  CompendiumBookIcon,
} from '../src/components/dnd-icons';

describe('D&D Medieval Icons Library', () => {
  it('exports all new authentic vector icons', () => {
    const icons = [
      TrashBinIcon,
      SearchLensIcon,
      LockSealIcon,
      WarningSignIcon,
      WeightAnvilIcon,
      WingedBootIcon,
      MoonRestIcon,
      HeartGemIcon,
      EyeMysticIcon,
      ScrollDownloadIcon,
      CrownRulerIcon,
      ParchmentMenuIcon,
      DeviceStoneIcon,
      SkullDeathIcon,
      LightningStrikeIcon,
      TargetAimIcon,
      CompendiumBookIcon,
    ];

    for (const icon of icons) {
      assert.strictEqual(typeof icon, 'function');
      const el = icon({ size: 24, className: 'test-icon' });
      assert.ok(React.isValidElement(el));
      assert.strictEqual(el.type, 'svg');
      const props = el.props as Record<string, any>;
      assert.strictEqual(props.width, 24);
      assert.strictEqual(props.height, 24);
      assert.ok(props.className.includes('test-icon'));
    }
  });
});
