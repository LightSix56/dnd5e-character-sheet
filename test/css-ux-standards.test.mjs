import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, '../src/app/globals.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

test('CSS UX Standards: contains :focus-visible rule specifying #C9A84C', () => {
  assert.match(cssContent, /:focus-visible\s*\{[^}]*#C9A84C/i);
});

test('CSS UX Standards: contains font-variant-numeric: tabular-nums in required classes', () => {
  assert.ok(cssContent.includes('font-variant-numeric: tabular-nums;'));
  
  const requiredClasses = [
    '.parchment-input',
    '.parchment-input-center',
    '.calc-badge',
    '.roll-result-total',
    '.parchment-card'
  ];

  for (const cls of requiredClasses) {
    const escapedCls = cls.replace('.', '\\.');
    const regex = new RegExp(`${escapedCls}\\s*\\{[^}]*font-variant-numeric:\\s*tabular-nums;`, 's');
    assert.match(cssContent, regex, `${cls} must contain font-variant-numeric: tabular-nums`);
  }
});

test('CSS UX Standards: contains @media (prefers-reduced-motion: reduce)', () => {
  assert.ok(cssContent.includes('@media (prefers-reduced-motion: reduce)'));
});

test('CSS UX Standards: .parchment-btn does NOT contain transition: all', () => {
  const match = cssContent.match(/\.parchment-btn\s*\{([^}]+)\}/);
  assert.ok(match, '.parchment-btn block not found');
  assert.doesNotMatch(match[1], /transition:\s*all/);
});

test('CSS UX Standards: .parchment-btn-secondary does NOT contain transition: all', () => {
  const match = cssContent.match(/\.parchment-btn-secondary\s*\{([^}]+)\}/);
  assert.ok(match, '.parchment-btn-secondary block not found');
  assert.doesNotMatch(match[1], /transition:\s*all/);
});

test('CSS UX Standards: all updated interactive elements do NOT contain transition: all', () => {
  const components = [
    '\\.parchment-btn',
    '\\.parchment-btn-secondary',
    '\\.parchment-level-btn',
    '\\.parchment-header-btn',
    '\\.parchment-remove-btn',
    '\\.parchment-textarea',
    '\\.parchment-input-boxed',
    '\\.parchment-select',
    '\\.death-save-empty',
    '\\.parchment-checkbox\\s+\\.checkmark',
    '\\.parchment-btn-sm',
    '\\.parchment-template-card',
    '\\.parchment-header-btn-primary'
  ];

  for (const pattern of components) {
    const regex = new RegExp(`${pattern}\\s*\\{([^}]+)\\}`, 's');
    const match = cssContent.match(regex);
    assert.ok(match, `CSS block for ${pattern} not found`);
    assert.doesNotMatch(match[1], /transition:\s*all/, `${pattern} must not contain transition: all`);
  }
});

