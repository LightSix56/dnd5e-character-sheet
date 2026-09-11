import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  CharacterData,
  getTotalScore,
  getModifier,
  getSavingThrow,
  getSkillBonus,
  getInitiative,
  getPassivePerception,
  calcProficiencyBonus,
  formatModifier,
} from './dnd-types';

export interface PdfExportOptions {
  templateBytes?: Uint8Array | ArrayBuffer;
  fontBytes?: Uint8Array | ArrayBuffer;
  boldFontBytes?: Uint8Array | ArrayBuffer;
  includeFullCodex?: boolean;
}

export const SKILL_ROW_MAPPINGS: {
  skillName: string;
  textFieldName: string;
  checkBoxName: string;
}[] = [
  { skillName: 'Акробатика', textFieldName: 'Acrobatics', checkBoxName: 'Check Box 23' },
  { skillName: 'Атлетика', textFieldName: 'Investigation', checkBoxName: 'Check Box 24' },
  { skillName: 'Внимательность', textFieldName: 'Athletics', checkBoxName: 'Check Box 25' },
  { skillName: 'Выживание', textFieldName: 'Perception', checkBoxName: 'Check Box 26' },
  { skillName: 'Выступление', textFieldName: 'Survival', checkBoxName: 'Check Box 27' },
  { skillName: 'Запугивание', textFieldName: 'Performance', checkBoxName: 'Check Box 28' },
  { skillName: 'История', textFieldName: 'Intimidation', checkBoxName: 'Check Box 29' },
  { skillName: 'Ловкость рук', textFieldName: 'History', checkBoxName: 'Check Box 30' },
  { skillName: 'Магия', textFieldName: 'SleightofHand', checkBoxName: 'Check Box 31' },
  { skillName: 'Медицина', textFieldName: 'Arcana', checkBoxName: 'Check Box 32' },
  { skillName: 'Обман', textFieldName: 'Medicine', checkBoxName: 'Check Box 33' },
  { skillName: 'Природа', textFieldName: 'Deception', checkBoxName: 'Check Box 34' },
  { skillName: 'Проницательность', textFieldName: 'Nature', checkBoxName: 'Check Box 35' },
  { skillName: 'Анализ', textFieldName: 'Insight', checkBoxName: 'Check Box 36' },
  { skillName: 'Религия', textFieldName: 'Religion', checkBoxName: 'Check Box 37' },
  { skillName: 'Скрытность', textFieldName: 'Stealth', checkBoxName: 'Check Box 38' },
  { skillName: 'Убеждение', textFieldName: 'Persuasion', checkBoxName: 'Check Box 39' },
  { skillName: 'Уход за животными', textFieldName: 'Animal', checkBoxName: 'Check Box 40' },
];

export async function exportCharacterToPdf(
  char: CharacterData,
  options: PdfExportOptions = {}
): Promise<Uint8Array> {
  let templateBytes = options.templateBytes;
  if (!templateBytes) {
    if (typeof window !== 'undefined') {
      const resp = await fetch('/templates/dnd5e_character_sheet_rus.pdf');
      templateBytes = await resp.arrayBuffer();
    } else {
      const fsModule = await import('fs');
      const pathModule = await import('path');
      const localPath = pathModule.join(process.cwd(), 'public', 'templates', 'dnd5e_character_sheet_rus.pdf');
      templateBytes = fsModule.readFileSync(localPath);
    }
  }

  let fontBytes = options.fontBytes;
  let boldFontBytes = options.boldFontBytes;

  if (!fontBytes) {
    if (typeof window !== 'undefined') {
      const resp = await fetch('/fonts/arial.ttf');
      fontBytes = await resp.arrayBuffer();
    } else {
      const fsModule = await import('fs');
      const pathModule = await import('path');
      const fontPath = pathModule.join(process.cwd(), 'public', 'fonts', 'arial.ttf');
      fontBytes = fsModule.existsSync(fontPath) ? fsModule.readFileSync(fontPath) : fsModule.readFileSync('C:/Windows/Fonts/arial.ttf');
    }
  }

  if (!boldFontBytes) {
    if (typeof window !== 'undefined') {
      try {
        const resp = await fetch('/fonts/arialbd.ttf');
        boldFontBytes = await resp.arrayBuffer();
      } catch {
        boldFontBytes = fontBytes;
      }
    } else {
      const fsModule = await import('fs');
      const pathModule = await import('path');
      const fontPath = pathModule.join(process.cwd(), 'public', 'fonts', 'arialbd.ttf');
      boldFontBytes = fsModule.existsSync(fontPath) ? fsModule.readFileSync(fontPath) : (
        fsModule.existsSync('C:/Windows/Fonts/arialbd.ttf') ? fsModule.readFileSync('C:/Windows/Fonts/arialbd.ttf') : fontBytes
      );
    }
  }

  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);

  const customFont = await doc.embedFont(fontBytes);
  const boldFont = boldFontBytes ? await doc.embedFont(boldFontBytes) : customFont;

  const form = doc.getForm();

  const setText = (name: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined) return;
    try {
      const field = form.getTextField(name);
      field.setText(String(value));
    } catch {
      // Field might not exist
    }
  };

  const check = (name: string, isChecked: boolean = true) => {
    if (!isChecked) return;
    try {
      const field = form.getCheckBox(name);
      field.check();
    } catch {
      // Field might not exist
    }
  };

  const pb = calcProficiencyBonus(char.level);
  const pbStr = formatModifier(pb);

  // 1. Header
  setText('CharacterName', char.name);
  const subStr = char.subclass ? ' (' + char.subclass + ')' : '';
  const classSubclass = ((char.className || '') + ' ' + (char.level || 1) + subStr).trim();
  setText('ClassLevel', classSubclass);
  setText('Background', char.background || '');
  setText('PlayerName', char.playerName || '');
  const subraceStr = char.subrace ? ' (' + char.subrace + ')' : '';
  const raceSubrace = ((char.race || '') + subraceStr).trim();
  setText('Race ', raceSubrace);
  setText('Alignment', char.alignment || '');
  setText('XP', char.experiencePoints !== undefined ? String(char.experiencePoints) : '0');
  setText('ProfBonus', pbStr);
  if (char.inspiration) {
    setText('Inspiration', '✓');
  }

  // 2. Ability Scores & Modifiers
  const strScore = getTotalScore(char, 'СИЛ');
  const dexScore = getTotalScore(char, 'ЛОВ');
  const conScore = getTotalScore(char, 'ТЕЛ');
  const intScore = getTotalScore(char, 'ИНТ');
  const wisScore = getTotalScore(char, 'МДР');
  const chaScore = getTotalScore(char, 'ХАР');

  setText('STR', strScore);
  setText('STRmod', formatModifier(getModifier(char, 'СИЛ')));
  setText('DEX', dexScore);
  setText('DEXmod ', formatModifier(getModifier(char, 'ЛОВ')));
  setText('CON', conScore);
  setText('CONmod', formatModifier(getModifier(char, 'ТЕЛ')));
  setText('INT', intScore);
  setText('INTmod', formatModifier(getModifier(char, 'ИНТ')));
  setText('WIS', wisScore);
  setText('WISmod', formatModifier(getModifier(char, 'МДР')));
  setText('CHA', chaScore);
  setText('CHamod', formatModifier(getModifier(char, 'ХАР')));

  // 3. Saving Throws
  setText('ST Strength', formatModifier(getSavingThrow(char, 'СИЛ')));
  check('Check Box 11', Boolean(char.savingThrowProficiencies?.['СИЛ']));

  setText('ST Dexterity', formatModifier(getSavingThrow(char, 'ЛОВ')));
  check('Check Box 18', Boolean(char.savingThrowProficiencies?.['ЛОВ']));

  setText('ST Constitution', formatModifier(getSavingThrow(char, 'ТЕЛ')));
  check('Check Box 19', Boolean(char.savingThrowProficiencies?.['ТЕЛ']));

  setText('ST Intelligence', formatModifier(getSavingThrow(char, 'ИНТ')));
  check('Check Box 20', Boolean(char.savingThrowProficiencies?.['ИНТ']));

  setText('ST Wisdom', formatModifier(getSavingThrow(char, 'МДР')));
  check('Check Box 21', Boolean(char.savingThrowProficiencies?.['МДР']));

  setText('ST Charisma', formatModifier(getSavingThrow(char, 'ХАР')));
  check('Check Box 22', Boolean(char.savingThrowProficiencies?.['ХАР']));

  // 4. Skills (18 visual rows mapped exactly)
  for (const mapping of SKILL_ROW_MAPPINGS) {
    const bonus = getSkillBonus(char, mapping.skillName);
    setText(mapping.textFieldName, formatModifier(bonus));
    const isProf = Boolean(char.skillProficiencies?.[mapping.skillName] || char.skillExpertise?.[mapping.skillName]);
    check(mapping.checkBoxName, isProf);
  }

  // Passive Perception
  setText('Passive', String(getPassivePerception(char)));

  // 5. Combat Stats
  setText('AC', char.armorClass !== null && char.armorClass !== undefined ? String(char.armorClass) : '10');
  setText('Initiative', formatModifier(getInitiative(char)));
  setText('Speed', (char.speed || 30) + ' фт');
  setText('HPMax', char.hpMax !== null && char.hpMax !== undefined ? String(char.hpMax) : '');
  setText('HPCurrent', char.hpCurrent !== null && char.hpCurrent !== undefined ? String(char.hpCurrent) : String(char.hpMax || ''));
  if (char.hpTemp) {
    setText('HPTemp', String(char.hpTemp));
  }
  const hitDiceVal = char.hitDice || (char.level || 1) + 'd8';
  setText('HD', hitDiceVal);
  setText('HDTotal', hitDiceVal);

  // Death Saves
  for (let s = 1; s <= (char.deathSaveSuccesses || 0); s++) {
    check('Check Box ' + (11 + s));
  }
  for (let f = 1; f <= (char.deathSaveFailures || 0); f++) {
    check('Check Box ' + (14 + f));
  }

  // 6. Attacks & Combat Notes
  const dexMod = getModifier(char, 'ЛОВ');
  const strMod = getModifier(char, 'СИЛ');
  const attacksList: { name: string; bonus: string; damage: string }[] = [];

  if (char.attacks && char.attacks.length > 0) {
    for (const a of char.attacks) {
      let b = a.attackBonus;
      let d = a.damageAndType;
      // If weapon is finesse/ranged, scale to current level 20 stats
      const isFinesse = /рапира|кинжал|лук|арбалет|finesse|bow/i.test(a.name);
      if (isFinesse) {
        b = formatModifier(dexMod + pb);
        d = d.replace(/[+]\d+/, '+' + dexMod);
      }
      attacksList.push({ name: a.name, bonus: b, damage: d });
    }
  }

  // If weapons are mentioned in equipment but not in attacks, add up to 3 weapons
  if (attacksList.length < 2 && /короткий лук|shortbow/i.test(char.equipment || '')) {
    attacksList.push({
      name: 'Короткий лук',
      bonus: formatModifier(dexMod + pb),
      damage: '1d6+' + dexMod + ' кол. (80/320)'
    });
  }
  if (attacksList.length < 3 && /кинжал|dagger/i.test(char.equipment || '')) {
    attacksList.push({
      name: 'Кинжал',
      bonus: formatModifier(dexMod + pb),
      damage: '1d4+' + dexMod + ' кол. (20/60)'
    });
  }

  if (attacksList.length > 0) {
    setText('Wpn Name', attacksList[0].name);
    setText('Wpn1 AtkBonus', attacksList[0].bonus);
    setText('Wpn1 Damage', attacksList[0].damage);
  }
  if (attacksList.length > 1) {
    setText('Wpn Name 2', attacksList[1].name);
    setText('Wpn2 AtkBonus ', attacksList[1].bonus);
    setText('Wpn2 Damage ', attacksList[1].damage);
  }
  if (attacksList.length > 2) {
    setText('Wpn Name 3', attacksList[2].name);
    setText('Wpn3 AtkBonus  ', attacksList[2].bonus);
    setText('Wpn3 Damage ', attacksList[2].damage);
  }

  const attackNotes: string[] = [];
  if (char.traitsList) {
    for (const t of char.traitsList) {
      const traitName = t.name || (t as any)?.title || '';
      const lower = traitName.toLowerCase();
      if (
        lower.includes('скрыт') ||
        lower.includes('стрелок') ||
        lower.includes('когти') ||
        lower.includes('удар милосердия') ||
        lower.includes('всплеск действий') ||
        lower.includes('ярость') ||
        lower.includes('божественн') ||
        lower.includes('стихий')
      ) {
        attackNotes.push('• ' + traitName + ': ' + (t.summary || (t.description ? t.description.slice(0, 95) : '')));
      }
    }
  }
  const attackNotesText = attackNotes.slice(0, 5).join('\n');
  setText('AttacksSpellcasting', attackNotesText);
  setText('AttacksSpellcasting_XFCE', attackNotesText);

  // 7. Currency & Equipment
  setText('CP', String(char.cp || 0));
  setText('SP', String(char.sp || 0));
  setText('EP', String(char.ep || 0));
  setText('GP', String(char.gp || 0));
  setText('PP', String(char.pp || 0));

  const equipText = char.equipment || '';
  setText('Equipment', equipText);
  setText('Equipment_VXRI', equipText);

  // 8. Proficiencies & Languages
  const profText = char.otherProficienciesLanguages || '';
  setText('ProficienciesLang', profText);
  setText('ProficienciesLang_OVQQ', profText);

  // 9. Roleplay Traits
  setText('PersonalityTraits ', char.personalityTraits || '');
  setText('PersonalityTraits _25LZ', char.personalityTraits || '');

  setText('Ideals', char.ideals || '');
  setText('Ideals_KELS', char.ideals || '');

  setText('Bonds', char.bonds || '');
  setText('Bonds_HWGM', char.bonds || '');

  setText('Flaws', char.flaws || '');
  setText('Flaws_DH53', char.flaws || '');

  // 10. Condensed Page 1 Features Summary
  const summaryLines: string[] = [];
  if (char.traitsList && char.traitsList.length > 0) {
    for (const t of char.traitsList) {
      const traitName = t.name || (t as any)?.title || 'Умение';
      summaryLines.push('• ' + traitName + ': ' + (t.summary || (t.description ? t.description.slice(0, 75) : '')));
    }
  } else if (char.featuresTraits) {
    summaryLines.push(char.featuresTraits);
  }
  const condensedFeatures = summaryLines.slice(0, 18).join('\n');
  setText('Features and Traits', condensedFeatures);
  setText('Features and Traits_3R4V', condensedFeatures);

  // 11. Page 2 Details
  setText('text_14uqfb', char.name);
  if (char.age) setText('text_8oymo', char.age + ' лет');
  if (char.height) setText('text_9edkz', char.height);
  if (char.weight) setText('text_10cjuj', char.weight);
  if (char.eyes) setText('text_11lkkm', char.eyes);
  if (char.skin) setText('text_12kfvu', char.skin);
  if (char.hair) setText('text_13lzpo', char.hair);

  setText('textarea_1uxvl', char.appearance || '');
  setText('textarea_2fzes', char.alliesOrganizations || '');
  setText('textarea_3wrh', char.backstory || '');
  setText('textarea_4hgfg', char.additionalFeaturesTraits || '');
  setText('textarea_5wbeq', char.treasure || '');

  // 12. Page 3 Spellcasting
  const hasSpells = Boolean(
    (char.cantrips && char.cantrips.length > 0) ||
    (char.spellsByLevel && Object.keys(char.spellsByLevel).length > 0) ||
    char.spellcastingClass
  );

  if (hasSpells) {
    setText('Spellcasting Class 2', char.spellcastingClass || char.className);
    setText('SpellcastingAbility 2', char.spellcastingAbility || 'ИНТ');
    const spellAbility = (char.spellcastingAbility as any) || 'ИНТ';
    const spellMod = getModifier(char, spellAbility);
    setText('SpellSaveDC  2', String(8 + pb + spellMod));
    setText('SpellAtkBonus 2', formatModifier(pb + spellMod));

    if (char.cantrips) {
      char.cantrips.slice(0, 8).forEach((cantrip, idx) => {
        setText('Spells 101' + (4 + idx), cantrip);
      });
    }
  } else {
    setText('Spellcasting Class 2', (char.className || 'Персонаж') + ' (Не заклинатель)');
    const hasMagicDevice = char.traitsList?.some(t =>
      (t.name || (t as any)?.title || '').includes('магических предметов')
    );
    if (hasMagicDevice) {
      setText('Spells 1014', 'Особенность «Использование магических предметов»:');
      setText('Spells 1015', 'Игнорирует любые классовые, расовые и уровневые');
      setText('Spells 1016', 'требования для активации любых свитков, палочек и артефактов!');
    }
  }

  form.updateFieldAppearances(customFont);

  // 13. Pages 4 & 5: Codex of Features & Traits
  const includeCodex = options.includeFullCodex !== false;
  if (includeCodex && char.traitsList && char.traitsList.length > 0) {
    renderTraitsCodexPages(doc, char, customFont, boldFont);
  }

  return await doc.save();
}

function renderTraitsCodexPages(
  doc: PDFDocument,
  char: CharacterData,
  font: PDFFont,
  boldFont: PDFFont
) {
  const pageHeight = 841.89;
  const topMargin = 96;
  const bottomMargin = 58;
  const columnWidth = 245;
  const col1X = 40;
  const col2X = 310;
  const maxY = pageHeight - topMargin;
  const minY = bottomMargin;

  const codexPages: { page: any; pageNum: number }[] = [];
  let currentPageNumber = 4;
  let page = createParchmentPage(doc, char, currentPageNumber, font, boldFont);
  codexPages.push({ page, pageNum: currentPageNumber });

  let currentX = col1X;
  let currentY = maxY;
  let currentColumn = 1;

  const traits = char.traitsList || [];

  for (let i = 0; i < traits.length; i++) {
    const trait = traits[i];
    const sourceTag = trait.source ? '[' + trait.source + ']' : '';
    const traitName = trait.name || (trait as any)?.title || 'Умение';
    const titleText = (traitName + '  ' + sourceTag).trim();
    const bodyText = trait.description || trait.summary || '';

    const titleLines = wrapText(titleText, columnWidth - 14, boldFont, 8.2);
    const bodyLines = wrapText(bodyText, columnWidth - 14, font, 7.2);
    const itemHeight = 10 + titleLines.length * 11 + 3 + bodyLines.length * 9.5 + 6;

    if (currentY - itemHeight < minY) {
      if (currentColumn === 1) {
        currentColumn = 2;
        currentX = col2X;
        currentY = maxY;
      } else {
        currentPageNumber++;
        page = createParchmentPage(doc, char, currentPageNumber, font, boldFont);
        codexPages.push({ page, pageNum: currentPageNumber });
        currentColumn = 1;
        currentX = col1X;
        currentY = maxY;
      }
    }

    currentY -= 10;

    page.drawCircle({
      x: currentX + 3,
      y: currentY + 3,
      size: 2,
      color: rgb(0.79, 0.66, 0.30)
    });

    for (const tLine of titleLines) {
      page.drawText(tLine, {
        x: currentX + 9,
        y: currentY,
        size: 8.2,
        font: boldFont,
        color: rgb(0.24, 0.13, 0.07)
      });
      currentY -= 11;
    }

    currentY -= 3;

    for (const line of bodyLines) {
      page.drawText(line, {
        x: currentX + 9,
        y: currentY,
        size: 7.2,
        font: font,
        color: rgb(0.18, 0.14, 0.10)
      });
      currentY -= 9.5;
    }

    currentY -= 6;
  }

  // Draw final page footers with total pages count
  const totalPages = doc.getPageCount();
  for (const cp of codexPages) {
    drawPageFooter(cp.page, cp.pageNum, totalPages, font, boldFont);
  }
}

function createParchmentPage(
  doc: PDFDocument,
  char: CharacterData,
  pageNum: number,
  font: PDFFont,
  boldFont: PDFFont
) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = doc.addPage([pageWidth, pageHeight]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.98, 0.96, 0.92)
  });

  page.drawRectangle({
    x: 25,
    y: 25,
    width: pageWidth - 50,
    height: pageHeight - 50,
    borderColor: rgb(0.79, 0.66, 0.30),
    borderWidth: 1.5
  });

  page.drawRectangle({
    x: 28,
    y: 28,
    width: pageWidth - 56,
    height: pageHeight - 56,
    borderColor: rgb(0.55, 0.35, 0.15),
    borderWidth: 0.6
  });

  page.drawRectangle({
    x: 35,
    y: pageHeight - 78,
    width: pageWidth - 70,
    height: 44,
    color: rgb(0.94, 0.89, 0.78),
    borderColor: rgb(0.79, 0.66, 0.30),
    borderWidth: 1
  });

  const title = (char.name || 'ПЕРСОНАЖ').toUpperCase() + ' — ГРИМУАР УМЕНИЙ И СПОСОБНОСТЕЙ';
  const subStr = char.subclass ? ' (' + char.subclass + ')' : '';
  const subtitle = (char.className || '') + ' ' + (char.level || 1) + ' ур.' + subStr + ' | Раса: ' + (char.race || '') + ' | Предыстория: ' + (char.background || '');

  page.drawText(title, {
    x: 45,
    y: pageHeight - 52,
    size: 10,
    font: boldFont,
    color: rgb(0.24, 0.13, 0.07)
  });

  page.drawText(subtitle, {
    x: 45,
    y: pageHeight - 68,
    size: 7.5,
    font: font,
    color: rgb(0.45, 0.25, 0.15)
  });

  page.drawLine({
    start: { x: 297.64, y: pageHeight - 88 },
    end: { x: 297.64, y: 52 },
    color: rgb(0.85, 0.75, 0.55),
    thickness: 0.6
  });

  return page;
}

function drawPageFooter(page: any, pageNum: number, totalPages: number, font: PDFFont, boldFont: PDFFont) {
  const pageWidth = 595.28;

  page.drawLine({
    start: { x: 35, y: 48 },
    end: { x: pageWidth - 35, y: 48 },
    color: rgb(0.79, 0.66, 0.30),
    thickness: 0.8
  });

  page.drawText('D&D 5e Character Sheet — Полный компендиум персонажа', {
    x: 40,
    y: 35,
    size: 7.5,
    font: font,
    color: rgb(0.55, 0.35, 0.15)
  });

  page.drawText('Страница ' + pageNum + ' из ' + totalPages, {
    x: pageWidth - 110,
    y: 35,
    size: 7.5,
    font: boldFont,
    color: rgb(0.35, 0.20, 0.10)
  });
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) continue;
    const words = para.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      let textWidth = 0;
      try {
        textWidth = font.widthOfTextAtSize(testLine, fontSize);
      } catch {
        textWidth = testLine.length * (fontSize * 0.55);
      }

      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}
