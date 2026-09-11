import fs from 'fs';
import path from 'path';
import { exportCharacterToPdf } from '../src/lib/pdf-export';
import { CharacterData } from '../src/lib/dnd-types';

async function main() {
  const arg = process.argv[2] || '7WFZKWT8';
  let code = arg;
  if (arg.includes('/share/')) {
    const parts = arg.split('/share/');
    code = parts[1].split(/[?#]/)[0];
  }

  console.log('Fetching character data for code:', code);
  const apiUrl = 'https://dnd5e-character-sheet-theta.vercel.app/api/share/' + code;

  let characterData: CharacterData;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error('API returned HTTP ' + res.status);
    }
    const json = await res.json();
    if (!json.character || !json.character.data) {
      throw new Error('Invalid response structure: ' + JSON.stringify(json));
    }
    characterData = json.character.data;
    console.log('Loaded from API:', characterData.name, '(' + characterData.className + ' ' + characterData.level + ')');
  } catch (err: any) {
    console.warn('API fetch failed (' + err.message + '), checking local fallback...');
    const localFallback = 'C:/Users/FROG2/.gemini/antigravity/brain/d462fedc-d719-4706-80cc-279e35ef406c/scratch/shared_character_7WFZKWT8.json';
    if (fs.existsSync(localFallback)) {
      characterData = JSON.parse(fs.readFileSync(localFallback, 'utf-8'));
      console.log('Loaded from local fallback:', characterData.name);
    } else {
      throw err;
    }
  }

  console.log('Generating full 5-page PDF with AcroForm native fields and traits codex...');
  const pdfBytes = await exportCharacterToPdf(characterData);

  const outputPath = process.argv[3] || 'C:/Users/FROG2/Downloads/Leovrukaya_Rogue20_Full_Sheet.pdf';
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, pdfBytes);
  console.log('SUCCESS! PDF generated and saved to:');
  console.log(outputPath);
  console.log('File size:', (pdfBytes.length / 1024).toFixed(1), 'KB');
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
