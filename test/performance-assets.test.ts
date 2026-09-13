import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const readFile = (relPath: string) => {
  return fs.readFileSync(path.resolve(rootDir, relPath), 'utf8');
};

describe('Performance: Static Assets, Preloading & Mobile CSS', () => {
  it('configures long-term immutable caching in next.config.ts for static media/fonts', () => {
    const content = readFile('next.config.ts');
    assert.match(content, /Cache-Control/i, 'next.config.ts must configure Cache-Control headers');
    assert.match(content, /immutable/i, 'Cache-Control headers should include immutable for static assets');
    assert.match(content, /31536000|max-age/i, 'Cache-Control headers should specify long max-age');
  });

  it('preloads book-bg.webp in src/app/layout.tsx for LCP optimization', () => {
    const content = readFile('src/app/layout.tsx');
    assert.match(
      content,
      /<link[^>]*rel="preload"[^>]*href="\/book-bg\.webp"[^>]*as="image"[^>]*type="image\/webp"/,
      'layout.tsx must preload /book-bg.webp as image/webp'
    );
  });

  it('optimizes mobile background scrolling in src/app/globals.css', () => {
    const content = readFile('src/app/globals.css');
    assert.match(
      content,
      /@media\s*\(\s*max-width:\s*768px\s*\)[\s\S]*?\.parchment-bg[\s\S]*?background-attachment:\s*scroll/,
      'globals.css must set background-attachment: scroll on mobile for .parchment-bg'
    );
  });
});
