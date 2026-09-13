import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('RollResultPopup Framer Motion Integration', () => {
  let code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  const prim = path.resolve('src/components/sheet/SheetUIPrimitives.tsx');
  if (fs.existsSync(prim)) code += '\n' + fs.readFileSync(prim, 'utf-8');
  const nav = path.resolve('src/components/sheet/SheetNavbar.tsx');
  if (fs.existsSync(nav)) code += '\n' + fs.readFileSync(nav, 'utf-8');
  assert.ok(
    code.includes('motion.div') || code.includes('motion.'),
    'must use motion for animated roll popup'
  );
  assert.ok(
    code.includes('type: "spring"') || code.includes("type: 'spring'"),
    'must use spring physics for dice popup'
  );
  assert.ok(
    code.includes('D20Icon'),
    'must render D20Icon in roll result popup'
  );
});
