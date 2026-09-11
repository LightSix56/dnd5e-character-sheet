import { NextRequest, NextResponse } from 'next/server';
import { exportCharacterToPdf } from '@/lib/pdf-export';
import { CharacterData, createDefaultCharacter } from '@/lib/dnd-types';

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
    attacks: Array.isArray(raw.attacks) ? raw.attacks : defaults.attacks,
    cantrips: Array.isArray(raw.cantrips) ? raw.cantrips : defaults.cantrips,
    spellsByLevel: typeof raw.spellsByLevel === 'object' && raw.spellsByLevel !== null ? raw.spellsByLevel : defaults.spellsByLevel,
    traitsList: Array.isArray(raw.traitsList) ? raw.traitsList : defaults.traitsList,
    levelHistory: Array.isArray(raw.levelHistory) ? raw.levelHistory : defaults.levelHistory,
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const char = normalizeCharacter(raw);

    const pdfBytes = await exportCharacterToPdf(char);

    const cleanName = (char.name || 'Персонаж').replace(/[\\/:*?"<>|]/g, '_');
    const className = char.className || 'Герой';
    const level = char.level || 1;
    const filename = 'DnD5e_' + cleanName + '_' + className + level + '.pdf';

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(filename),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('PDF export error:', err);
    return NextResponse.json(
      { error: err?.message || 'Не удалось сформировать PDF' },
      { status: 500 }
    );
  }
}
