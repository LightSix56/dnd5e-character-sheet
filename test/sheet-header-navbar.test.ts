import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import * as HeaderModule from '../src/components/sheet/SheetHeader';
import * as NavbarModule from '../src/components/sheet/SheetNavbar';

describe('Sheet Header & Navbar Component Contracts', () => {
  it('SheetNavbar exists and is a valid React component', () => {
    assert.ok(NavbarModule.SheetNavbar, 'SheetNavbar should be exported');
    assert.ok(
      typeof NavbarModule.SheetNavbar === 'function' || typeof NavbarModule.SheetNavbar === 'object',
      'SheetNavbar must be a React component or React.memo object'
    );
  });

  it('SheetHeader exists and is a valid React component', () => {
    assert.ok(HeaderModule.SheetHeader, 'SheetHeader should be exported');
    assert.ok(
      typeof HeaderModule.SheetHeader === 'function' || typeof HeaderModule.SheetHeader === 'object',
      'SheetHeader must be a React component or React.memo object'
    );
  });
});
