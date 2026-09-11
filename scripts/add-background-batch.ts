import * as fs from 'fs';
import * as path from 'path';
import { CompendiumBackground } from '../src/data/compendium/backgrounds';

export function appendBackgroundsToCompendium(newBackgrounds: CompendiumBackground[]) {
  const filePath = path.resolve('src/data/compendium/backgrounds.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  const boundary = '];\n\nexport function findBackgroundById';
  const boundaryIdx = content.indexOf(boundary);
  if (boundaryIdx === -1) {
    throw new Error('Boundary "];\\n\\nexport function findBackgroundById" not found in backgrounds.ts');
  }

  const before = content.slice(0, boundaryIdx);
  const after = content.slice(boundaryIdx);

  // Format new backgrounds as clean TypeScript code
  const formattedItems = newBackgrounds.map(bg => {
    return '  ' + JSON.stringify(bg, null, 2)
      .split('\n')
      .map((line, idx) => (idx === 0 ? line : '  ' + line))
      .join('\n');
  }).join(',\n');

  const updated = before.trimEnd() + ',\n' + formattedItems + '\n' + after;
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`Successfully appended ${newBackgrounds.length} backgrounds to backgrounds.ts!`);
}
