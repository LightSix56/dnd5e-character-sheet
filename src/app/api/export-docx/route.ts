import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle,
  ShadingType, VerticalAlign, TextRun, PageBreak, ImageRun,
} from 'docx';
import {
  CharacterData, AbilityName, ABILITY_NAMES, ABILITY_FULL, ALL_SKILLS, SKILL_MAP,
  formatModifier, calcProficiencyBonus, getTotalScore, getModifier,
  getSavingThrow, getSkillBonus, getInitiative, getPassivePerception, getAC,
  getHPMax, getSpellSaveDC, getSpellAttackBonus, getSpellAbilityMod,
  createDefaultCharacter,
} from '@/lib/dnd-types';

// Частичный лист (например, от внешнего приложения) дополняем значениями по
// умолчанию: расчётные функции обращаются к вложенным полям напрямую и падают,
// если пришёл только abilityScores без abilityBonuses/asiBonuses.
function normalizeCharacter(raw: Partial<CharacterData>): CharacterData {
  const defaults = createDefaultCharacter();
  return {
    ...defaults,
    ...raw,
    abilityScores: { ...defaults.abilityScores, ...(raw.abilityScores || {}) },
    abilityBonuses: { ...defaults.abilityBonuses, ...(raw.abilityBonuses || {}) },
    asiBonuses: { ...defaults.asiBonuses, ...(raw.asiBonuses || {}) },
    savingThrowProficiencies: { ...defaults.savingThrowProficiencies, ...(raw.savingThrowProficiencies || {}) },
    skillProficiencies: { ...defaults.skillProficiencies, ...(raw.skillProficiencies || {}) },
    skillExpertise: { ...defaults.skillExpertise, ...(raw.skillExpertise || {}) },
    spellSlots: { ...defaults.spellSlots, ...(raw.spellSlots || {}) },
    spellsByLevel: { ...defaults.spellsByLevel, ...(raw.spellsByLevel || {}) },
    attacks: Array.isArray(raw.attacks) ? raw.attacks : defaults.attacks,
    cantrips: Array.isArray(raw.cantrips) ? raw.cantrips : defaults.cantrips,
    levelHistory: Array.isArray(raw.levelHistory) ? raw.levelHistory : defaults.levelHistory,
  };
}

const COLOR_HEADER = '2C3E50';
const COLOR_SUBHEADER = '34495E';
const COLOR_LIGHT_BG = 'ECF0F1';
const COLOR_ACCENT = '2980B9';
const COLOR_CALCULATED = '8E44AD';
const COLOR_TEXT = '2C3E50';
const COLOR_BORDER = 'BDC3C7';

function hCell(text: string, bg: string = COLOR_HEADER): TableCell {
  return new TableCell({
    shading: { fill: bg, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, bold: true, size: 18, color: 'FFFFFF', font: 'Arial' })],
    })],
  });
}

function dCell(text: string, opts?: { bold?: boolean; color?: string; align?: typeof AlignmentType.CENTER; bg?: string; size?: number }): TableCell {
  const o = opts || {};
  return new TableCell({
    shading: o.bg ? { fill: o.bg, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: o.align || AlignmentType.LEFT,
      spacing: { before: 30, after: 30 },
      children: [new TextRun({ text, bold: o.bold || false, size: o.size || 18, color: o.color || COLOR_TEXT, font: 'Arial' })],
    })],
  });
}

function borders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
  };
}

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: COLOR_ACCENT, space: 2 } },
    children: [new TextRun({ text, bold: true, size: 24, color: COLOR_HEADER, font: 'Arial' })],
  });
}

function textPara(text: string, opts?: { bold?: boolean; color?: string; size?: number; italic?: boolean }): Paragraph {
  const o = opts || {};
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text: text || '—', bold: o.bold, size: o.size || 18, color: o.color || COLOR_TEXT, italics: o.italic, font: 'Arial' })],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const char: CharacterData = normalizeCharacter(body);
    const portraitUrl: string | undefined = body._portraitUrl;
    const profBonus = calcProficiencyBonus(char.level);
    const content: (Paragraph | Table)[] = [];

    // Title
    content.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'ЛИСТ ПЕРСОНАЖА D&D 5e', bold: true, size: 36, color: COLOR_HEADER, font: 'Arial' })],
    }));

    // ── Portrait ──
    if (portraitUrl) {
      try {
        const imgRes = await fetch(portraitUrl);
        if (imgRes.ok) {
          const imgBuf = Buffer.from(await imgRes.arrayBuffer());
          const contentType = imgRes.headers.get('content-type') || 'image/png';
          const isJpeg = contentType.includes('jpeg') || contentType.includes('jpg');
          content.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new ImageRun({
              data: imgBuf,
              transformation: { width: 150, height: 150 },
              type: isJpeg ? 'jpg' : 'png',
            })],
          }));
        }
      } catch {
        // Portrait fetch failed — skip silently
      }
    }

    // ── Basic Info ──
    content.push(sectionHeader('ОСНОВНАЯ ИНФОРМАЦИЯ'));
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({ children: [hCell('Имя персонажа'), hCell('Класс и уровень'), hCell('Предыстория'), hCell('Имя игрока')] }),
        new TableRow({ children: [
          dCell(char.name, { bold: true, size: 20 }),
          dCell(`${char.className} ${char.level} ур.`, { bold: true, size: 20 }),
          dCell(char.background, { size: 20 }),
          dCell(char.playerName, { size: 20 }),
        ]}),
        new TableRow({ children: [hCell('Раса', COLOR_SUBHEADER), hCell('Мировоззрение', COLOR_SUBHEADER), hCell('Очки опыта', COLOR_SUBHEADER), hCell('Вдохновение', COLOR_SUBHEADER)] }),
        new TableRow({ children: [
          dCell(char.race, { size: 20 }), dCell(char.alignment, { size: 20 }),
          dCell(String(char.experiencePoints), { size: 20 }),
          dCell(char.inspiration ? 'Да' : 'Нет', { size: 20 }),
        ]}),
      ],
    }));

    // ── Abilities & Combat ──
    content.push(sectionHeader('ХАРАКТЕРИСТИКИ И БОЕВЫЕ ПАРАМЕТРЫ'));

    const combatItems = [
      { label: 'Бонус мастерства', value: formatModifier(profBonus), calc: true },
      { label: 'КД', value: String(getAC(char)), calc: false },
      { label: 'Инициатива', value: formatModifier(getInitiative(char)), calc: true },
      { label: 'Скорость', value: `${char.speed} фт.`, calc: false },
      { label: 'Макс. хитов', value: String(getHPMax(char)), calc: false },
      { label: 'Текущие хиты', value: String(char.hpCurrent), calc: false },
    ];

    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({ children: [hCell('Характеристика'), hCell('Значение'), hCell('Модификатор'), hCell('Владение'), hCell('Спасбросок'), hCell('Боевые параметры')] }),
        ...ABILITY_NAMES.map((abbr, i) => {
          const total = getTotalScore(char, abbr);
          const mod = getModifier(char, abbr);
          const save = getSavingThrow(char, abbr);
          const isProf = char.savingThrowProficiencies[abbr];
          const combat = combatItems[i];
          return new TableRow({ children: [
            dCell(`${ABILITY_FULL[abbr]} (${abbr})`, { bold: true }),
            dCell(String(total), { bold: true, align: AlignmentType.CENTER, size: 20 }),
            dCell(formatModifier(mod), { bold: true, color: COLOR_CALCULATED, align: AlignmentType.CENTER }),
            dCell(isProf ? '●' : '○', { align: AlignmentType.CENTER, size: 22 }),
            dCell(formatModifier(save), { color: COLOR_CALCULATED, align: AlignmentType.CENTER, bg: isProf ? COLOR_LIGHT_BG : undefined }),
            dCell(`${combat.label}: ${combat.value}`, { bold: combat.calc, color: combat.calc ? COLOR_CALCULATED : COLOR_TEXT, bg: COLOR_LIGHT_BG }),
          ]});
        }),
      ],
    }));

    // ── Hit Dice & Death Saves ──
    content.push(sectionHeader('КОСТЬ ХИТОВ И СПАСБРОСКИ ОТ СМЕРТИ'));
    const succMarks = '● '.repeat(char.deathSaveSuccesses) + '○ '.repeat(3 - char.deathSaveSuccesses);
    const failMarks = '● '.repeat(char.deathSaveFailures) + '○ '.repeat(3 - char.deathSaveFailures);
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({ children: [hCell('Кость хитов'), hCell('Успехи'), hCell('Провалы')] }),
        new TableRow({ children: [
          dCell(char.hitDice, { align: AlignmentType.CENTER, size: 20 }),
          dCell(succMarks.trim(), { align: AlignmentType.CENTER, size: 22 }),
          dCell(failMarks.trim(), { align: AlignmentType.CENTER, size: 22 }),
        ]}),
      ],
    }));

    // ── Skills ──
    content.push(sectionHeader('НАВЫКИ'));
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({ children: [hCell('Влад.'), hCell('Навык'), hCell('Бонус'), hCell('Влад.'), hCell('Навык'), hCell('Бонус')] }),
        ...Array.from({ length: 9 }, (_, i) => {
          const sL = ALL_SKILLS[i], sR = ALL_SKILLS[i + 9];
          const pL = char.skillProficiencies[sL], pR = char.skillProficiencies[sR];
          const eL = char.skillExpertise[sL], eR = char.skillExpertise[sR];
          return new TableRow({ children: [
            dCell(eL ? '●●' : pL ? '●' : '○', { align: AlignmentType.CENTER }),
            dCell(`${sL} (${SKILL_MAP[sL]})`, { size: 16 }),
            dCell(formatModifier(getSkillBonus(char, sL)), { bold: true, color: COLOR_CALCULATED, align: AlignmentType.CENTER, bg: pL ? COLOR_LIGHT_BG : undefined }),
            dCell(eR ? '●●' : pR ? '●' : '○', { align: AlignmentType.CENTER }),
            dCell(`${sR} (${SKILL_MAP[sR]})`, { size: 16 }),
            dCell(formatModifier(getSkillBonus(char, sR)), { bold: true, color: COLOR_CALCULATED, align: AlignmentType.CENTER, bg: pR ? COLOR_LIGHT_BG : undefined }),
          ]});
        }),
      ],
    }));

    // Passive Perception
    content.push(new Paragraph({
      spacing: { before: 80 },
      children: [
        new TextRun({ text: 'Пассивная Мудрость (Внимательность): ', bold: true, size: 18, font: 'Arial' }),
        new TextRun({ text: String(getPassivePerception(char)), bold: true, size: 20, color: COLOR_CALCULATED, font: 'Arial' }),
      ],
    }));

    // ── Attacks ──
    content.push(sectionHeader('АТАКИ И ЗАКЛИНАНИЯ'));
    const namedAttacks = char.attacks.filter(a => a.name);
    if (namedAttacks.length > 0) {
      content.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [
          new TableRow({ children: [hCell('Название'), hCell('Бонус атаки'), hCell('Урон / Вид')] }),
          ...namedAttacks.map(a => new TableRow({ children: [
            dCell(a.name), dCell(a.attackBonus, { align: AlignmentType.CENTER }), dCell(a.damageAndType, { align: AlignmentType.CENTER }),
          ]})),
        ],
      }));
    }

    // ── Currency ──
    content.push(sectionHeader('ВАЛЮТА'));
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({ children: [hCell('ММ (медь)'), hCell('СМ (серебро)'), hCell('ЭМ (электрум)'), hCell('ЗМ (золото)'), hCell('ПМ (платина)')] }),
        new TableRow({ children: [
          dCell(String(char.cp), { align: AlignmentType.CENTER, size: 20 }),
          dCell(String(char.sp), { align: AlignmentType.CENTER, size: 20 }),
          dCell(String(char.ep), { align: AlignmentType.CENTER, size: 20 }),
          dCell(String(char.gp), { align: AlignmentType.CENTER, size: 20 }),
          dCell(String(char.pp), { align: AlignmentType.CENTER, size: 20 }),
        ]}),
      ],
    }));

    // ── Personality ──
    content.push(sectionHeader('ЛИЧНОСТЬ'));
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        { label: 'Черты характера', value: char.personalityTraits },
        { label: 'Идеалы', value: char.ideals },
        { label: 'Привязанности', value: char.bonds },
        { label: 'Слабости', value: char.flaws },
      ].map(item => new TableRow({ children: [
        dCell(item.label, { bold: true, bg: COLOR_LIGHT_BG }),
        dCell(item.value),
      ]})),
    }));

    // ── Other sections as text ──
    content.push(sectionHeader('ПРОЧИЕ ВЛАДЕНИЯ И ЯЗЫКИ'));
    content.push(textPara(char.otherProficienciesLanguages));
    content.push(sectionHeader('СНАРЯЖЕНИЕ'));
    content.push(textPara(char.equipment));
    content.push(sectionHeader('УМЕНИЯ И ОСОБЕННОСТИ'));
    content.push(textPara(char.featuresTraits));

    // ═══ PAGE 2 ═══
    content.push(new Paragraph({ children: [new PageBreak()] }));
    content.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [new TextRun({ text: 'ДЕТАЛИ ПЕРСОНАЖА', bold: true, size: 32, color: COLOR_HEADER, font: 'Arial' })],
    }));

    content.push(sectionHeader('ФИЗИЧЕСКОЕ ОПИСАНИЕ'));
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({ children: [hCell('Возраст'), hCell('Рост'), hCell('Вес'), hCell('Глаза'), hCell('Кожа'), hCell('Волосы')] }),
        new TableRow({ children: [
          dCell(char.age, { align: AlignmentType.CENTER }),
          dCell(char.height, { align: AlignmentType.CENTER }),
          dCell(char.weight, { align: AlignmentType.CENTER }),
          dCell(char.eyes, { align: AlignmentType.CENTER }),
          dCell(char.skin, { align: AlignmentType.CENTER }),
          dCell(char.hair, { align: AlignmentType.CENTER }),
        ]}),
      ],
    }));

    for (const [title, value] of [
      ['ВНЕШНОСТЬ ПЕРСОНАЖА', char.appearance],
      ['СОЮЗНИКИ И ОРГАНИЗАЦИИ', char.alliesOrganizations],
      ['ДОПОЛНИТЕЛЬНЫЕ УМЕНИЯ И ОСОБЕННОСТИ', char.additionalFeaturesTraits],
      ['ПРЕДЫСТОРИЯ ПЕРСОНАЖА', char.backstory],
      ['СОКРОВИЩА', char.treasure],
    ] as [string, string][]) {
      content.push(sectionHeader(title));
      content.push(textPara(value));
    }

    // ═══ PAGE 3 ═══
    content.push(new Paragraph({ children: [new PageBreak()] }));
    content.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [new TextRun({ text: 'ЗАКЛИНАНИЯ', bold: true, size: 32, color: COLOR_HEADER, font: 'Arial' })],
    }));

    content.push(sectionHeader('ПАРАМЕТРЫ ЗАКЛИНАТЕЛЯ'));
    const spellAFull = ABILITY_FULL[char.spellcastingAbility as AbilityName] || '';
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({ children: [hCell('Класс заклинателя'), hCell('Характеристика'), hCell('Сложность спасения'), hCell('Бонус атаки закл.'), hCell('Мод. характеристики')] }),
        new TableRow({ children: [
          dCell(char.spellcastingClass || '—', { align: AlignmentType.CENTER }),
          dCell(char.spellcastingAbility ? `${spellAFull} (${char.spellcastingAbility})` : '—', { align: AlignmentType.CENTER }),
          dCell(String(getSpellSaveDC(char)), { bold: true, color: COLOR_CALCULATED, align: AlignmentType.CENTER }),
          dCell(formatModifier(getSpellAttackBonus(char)), { bold: true, color: COLOR_CALCULATED, align: AlignmentType.CENTER }),
          dCell(formatModifier(getSpellAbilityMod(char)), { bold: true, color: COLOR_CALCULATED, align: AlignmentType.CENTER }),
        ]}),
      ],
    }));

    // Spell Slots
    const activeSlotLevels = [1,2,3,4,5,6,7,8,9].filter(lvl => char.spellSlots[lvl]?.totalSlots > 0);
    if (activeSlotLevels.length > 0) {
      content.push(sectionHeader('ЯЧЕЙКИ ЗАКЛИНАНИЙ'));
      content.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [
          new TableRow({ children: activeSlotLevels.map(lvl => hCell(`${lvl} ур.`)) }),
          new TableRow({ children: activeSlotLevels.map(lvl => dCell(String(char.spellSlots[lvl]?.totalSlots || 0), { align: AlignmentType.CENTER, bg: COLOR_LIGHT_BG })) }),
          new TableRow({ children: activeSlotLevels.map(lvl => dCell(`Потрачено: ${char.spellSlots[lvl]?.expendedSlots || 0}`, { align: AlignmentType.CENTER, size: 14 })) }),
        ],
      }));
    }

    // Cantrips
    content.push(sectionHeader('ЗАГОВОРЫ (0 уровень)'));
    const realCantrips = char.cantrips.filter(c => c);
    if (realCantrips.length > 0) {
      content.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [
          new TableRow({ children: [hCell('#'), hCell('Название')] }),
          ...realCantrips.map((c, i) => new TableRow({ children: [
            dCell(String(i + 1), { align: AlignmentType.CENTER }),
            dCell(c),
          ]})),
        ],
      }));
    } else {
      content.push(textPara('(нет заговоров)', { italic: true, color: COLOR_BORDER }));
    }

    // Spells by Level
    for (let lvl = 1; lvl <= 9; lvl++) {
      const spells = char.spellsByLevel[lvl] || [];
      if (spells.length === 0) continue;
      content.push(sectionHeader(`ЗАКЛИНАНИЯ ${lvl} УРОВНЯ`));
      content.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [
          new TableRow({ children: [hCell('Подг.'), hCell('Название')] }),
          ...spells.map(s => new TableRow({ children: [
            dCell(s.prepared ? '●' : '○', { align: AlignmentType.CENTER }),
            dCell(s.name),
          ]})),
        ],
      }));
    }

    // Legend
    content.push(new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({ text: 'Обозначения: ', bold: true, size: 16, font: 'Arial' }),
        new TextRun({ text: '● = владение / подготовлено  ○ = нет владения  ●● = экспертиза  ', size: 16, font: 'Arial' }),
        new TextRun({ text: 'Фиолетовый = авторасчёт', size: 16, color: COLOR_CALCULATED, font: 'Arial' }),
      ],
    }));

    // ── Level History ──
    if (char.levelHistory && char.levelHistory.length > 0) {
      content.push(sectionHeader('ИСТОРИЯ ПОВЫШЕНИЯ УРОВНЕЙ'));
      content.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [
          new TableRow({ children: [hCell('Уровень'), hCell('Прирост хитов'), hCell('Улучшение характ.'), hCell('Добавления'), hCell('Примечания')] }),
          ...char.levelHistory.map(entry => {
            const additions: string[] = [];
            if (entry.newCantrips?.length) additions.push(`Заговоры: ${entry.newCantrips.join(', ')}`);
            if (entry.newSpells?.length) additions.push(`Заклинания: ${entry.newSpells.map(s => `${s.name} (${s.level} ур.)`).join(', ')}`);
            if (entry.newSavingThrowProfs?.length) additions.push(`Влад. спасбр.: ${entry.newSavingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}`);
            if (entry.newSkillProfs?.length) additions.push(`Влад. навыками: ${entry.newSkillProfs.join(', ')}`);
            if (entry.newSkillExpertise?.length) additions.push(`Экспертиза: ${entry.newSkillExpertise.join(', ')}`);
            if (entry.newAttacks?.length) additions.push(`Атаки: ${entry.newAttacks.map(a => a.name).join(', ')}`);
            return new TableRow({ children: [
              dCell(String(entry.level), { bold: true, align: AlignmentType.CENTER }),
              dCell(`+${entry.hpGained}`, { align: AlignmentType.CENTER }),
              dCell(entry.asiAbilities ? entry.asiAbilities.map(a => `${ABILITY_FULL[a]} +1`).join(', ') : '—', { align: AlignmentType.CENTER }),
              dCell(additions.length > 0 ? additions.join('\n') : '—', { size: 14 }),
              dCell(entry.notes, { size: 14 }),
            ]});
          }),
        ],
      }));
    }

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: content,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`DnD5e_${char.name || 'Персонаж'}.docx`)}`,
      },
    });
  } catch (error: any) {
    console.error('DOCX generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
