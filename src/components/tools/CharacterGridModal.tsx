import React, { useState, useMemo, useEffect } from 'react';
import type { CharacterData, AbilityName } from '@/lib/dnd-types';
import {
  MysticCloudIcon,
  ArcaneLinkIcon,
  ScrollIcon,
} from '@/components/dnd-icons';

export interface SavedCharacter {
  id: string;
  name?: string;
  data?: Partial<CharacterData> | CharacterData | any;
  portrait_url?: string | null;
  created_at?: string;
  updated_at?: string;
  isLocal?: boolean;
}

export interface CharacterGridModalProps {
  characters?: SavedCharacter[];
  cloudCharacters?: SavedCharacter[];
  localCharacter?: SavedCharacter | null;
  onLoad: (char: SavedCharacter) => void;
  onDelete: (id: string) => void;
  onShare?: (char: SavedCharacter) => void;
  onCreateNew?: () => void;
  onClose: () => void;
}

// ── Artistic Class Silhouette / Emblem Icons ──

function ClassEmblem({
  className: charClass,
  size = 48,
}: {
  className?: string;
  size?: number;
}) {
  const c = (charClass || '').trim().toLowerCase();

  let emblemType:
    | 'fighter'
    | 'wizard'
    | 'rogue'
    | 'cleric'
    | 'barbarian'
    | 'bard'
    | 'druid'
    | 'monk'
    | 'paladin'
    | 'ranger'
    | 'sorcerer'
    | 'warlock'
    | 'artificer'
    | 'default' = 'default';

  if (c.includes('воин') || c.includes('fighter')) emblemType = 'fighter';
  else if (c.includes('волшеб') || c.includes('wizard') || c.includes('маг')) emblemType = 'wizard';
  else if (c.includes('плут') || c.includes('rogue') || c.includes('вор')) emblemType = 'rogue';
  else if (c.includes('жрец') || c.includes('cleric')) emblemType = 'cleric';
  else if (c.includes('варвар') || c.includes('barbarian')) emblemType = 'barbarian';
  else if (c.includes('бард') || c.includes('bard')) emblemType = 'bard';
  else if (c.includes('друид') || c.includes('druid')) emblemType = 'druid';
  else if (c.includes('монах') || c.includes('monk')) emblemType = 'monk';
  else if (c.includes('паладин') || c.includes('paladin')) emblemType = 'paladin';
  else if (c.includes('следопыт') || c.includes('ranger')) emblemType = 'ranger';
  else if (c.includes('чародей') || c.includes('sorcerer')) emblemType = 'sorcerer';
  else if (c.includes('колдун') || c.includes('warlock')) emblemType = 'warlock';
  else if (c.includes('изобрет') || c.includes('artificer')) emblemType = 'artificer';

  return (
    <div
      className="flex items-center justify-center rounded-md overflow-hidden shrink-0 select-none shadow-inner"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 40% 30%, #523420, #221208)',
        border: '1.5px solid rgba(201, 168, 76, 0.65)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.25)',
      }}
      title={charClass || 'Приключенец'}
    >
      {emblemType === 'fighter' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Crossed Broadswords */}
          <line x1="8" y1="8" x2="40" y2="40" stroke="#E5C158" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="8" x2="8" y2="40" stroke="#E5C158" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 6l-6 6M42 36l-6 6M36 6l6 6M6 36l6 6" stroke="#FFE58F" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="24,17 31,24 24,31 17,24" fill="#8B4513" stroke="#FFE58F" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="3" fill="#FFE58F" />
        </svg>
      )}

      {emblemType === 'wizard' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Grimoire & Arcane Star */}
          <path d="M8 38V10a4 4 0 0 1 4-4h28v36H12a4 4 0 0 1-4-4z" fill="#422518" stroke="#E5C158" strokeWidth="2.5" />
          <path d="M12 14h20M12 20h20M12 26h12" stroke="#E5C158" strokeWidth="2" strokeLinecap="round" />
          <polygon points="28,24 30,29 35,29 31,32 33,37 28,34 23,37 25,32 21,29 26,29" fill="#FFE58F" stroke="#C9A84C" strokeWidth="1" />
        </svg>
      )}

      {emblemType === 'rogue' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Dagger & Cloak Cowl */}
          <path d="M24 6c-8 6-14 16-14 26 0 6 6 10 14 10s14-4 14-10c0-10-6-20-14-26z" fill="#2E1810" stroke="#E5C158" strokeWidth="2" />
          <line x1="24" y1="12" x2="24" y2="34" stroke="#FFE58F" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 20h12M20 34h8" stroke="#FFE58F" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="38" r="2.5" fill="#FFE58F" />
        </svg>
      )}

      {emblemType === 'cleric' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Holy Sunburst & Cross */}
          <circle cx="24" cy="24" r="14" fill="#52381C" stroke="#E5C158" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="24" y1="6" x2="24" y2="42" stroke="#FFE58F" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="12" y1="18" x2="36" y2="18" stroke="#FFE58F" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="24" cy="18" r="4" fill="#C9A84C" stroke="#FFE58F" strokeWidth="1.5" />
        </svg>
      )}

      {emblemType === 'barbarian' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Double-Bitted Battleaxe */}
          <line x1="24" y1="4" x2="24" y2="44" stroke="#E5C158" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 10c-8-4-16-1-18 6 4 6 12 7 18 5M24 10c8-4 16-1 18 6-4 6-12 7-18 5" fill="#5C2E1A" stroke="#FFE58F" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="24" cy="14" r="2.5" fill="#FFE58F" />
        </svg>
      )}

      {emblemType === 'bard' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Lyre / Lute */}
          <path d="M14 12c-2 8-2 18 10 24 12-6 12-16 10-24" fill="#4A2B19" stroke="#E5C158" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="12" x2="36" y2="12" stroke="#FFE58F" strokeWidth="3" strokeLinecap="round" />
          <line x1="20" y1="14" x2="20" y2="32" stroke="#E5C158" strokeWidth="1.5" />
          <line x1="24" y1="14" x2="24" y2="34" stroke="#E5C158" strokeWidth="1.5" />
          <line x1="28" y1="14" x2="28" y2="32" stroke="#E5C158" strokeWidth="1.5" />
          <circle cx="24" cy="36" r="3" fill="#FFE58F" />
        </svg>
      )}

      {emblemType === 'druid' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Oak Leaf & Antlers */}
          <path d="M24 40C16 34 14 26 16 18c3 2 5 1 7-2 2 3 4 4 7 2 2 8 0 16-6 22z" fill="#3D4522" stroke="#E5C158" strokeWidth="2" />
          <line x1="24" y1="16" x2="24" y2="38" stroke="#FFE58F" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 24l4 4 4-4M18 30l6 4 6-4" stroke="#FFE58F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {emblemType === 'monk' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Strike Fist & Ki Energy */}
          <circle cx="24" cy="24" r="16" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="4 2" />
          <rect x="18" y="16" width="12" height="15" rx="3" fill="#5C341F" stroke="#FFE58F" strokeWidth="2" />
          <line x1="21" y1="16" x2="21" y2="24" stroke="#FFE58F" strokeWidth="1.5" />
          <line x1="24" y1="16" x2="24" y2="24" stroke="#FFE58F" strokeWidth="1.5" />
          <line x1="27" y1="16" x2="27" y2="24" stroke="#FFE58F" strokeWidth="1.5" />
          <path d="M15 28c2 6 7 9 13 8" stroke="#FFE58F" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}

      {emblemType === 'paladin' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Kite Shield & Radiant Sword */}
          <path d="M24 6L10 12v12c0 10 14 18 14 18s14-8 14-18V12L24 6z" fill="#4B3219" stroke="#E5C158" strokeWidth="2" />
          <line x1="24" y1="12" x2="24" y2="34" stroke="#FFE58F" strokeWidth="3" strokeLinecap="round" />
          <line x1="18" y1="20" x2="30" y2="20" stroke="#FFE58F" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="24,10 27,14 21,14" fill="#FFE58F" />
        </svg>
      )}

      {emblemType === 'ranger' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Recurve Bow & Arrow */}
          <path d="M16 8c8 10 8 22 0 32" stroke="#E5C158" strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="8" x2="16" y2="40" stroke="#FFE58F" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="10" y1="24" x2="38" y2="24" stroke="#FFE58F" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="38,24 30,20 32,24 30,28" fill="#FFE58F" />
        </svg>
      )}

      {emblemType === 'sorcerer' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Dragon Eye / Magic Flame */}
          <path d="M8 24C16 12 32 12 40 24 32 36 16 36 8 24z" fill="#4A1E29" stroke="#E5C158" strokeWidth="2" />
          <ellipse cx="24" cy="24" rx="7" ry="11" fill="#C9A84C" stroke="#FFE58F" strokeWidth="1.5" />
          <line x1="24" y1="14" x2="24" y2="34" stroke="#220B10" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}

      {emblemType === 'warlock' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Eldritch Eye & Occult Tentacles */}
          <circle cx="24" cy="24" r="16" stroke="#E5C158" strokeWidth="2" strokeDasharray="6 3" />
          <circle cx="24" cy="24" r="8" fill="#361730" stroke="#FFE58F" strokeWidth="2" />
          <circle cx="24" cy="24" r="3" fill="#FFE58F" />
          <path d="M12 36c4-6 6-10 6-10M36 36c-4-6-6-10-6-10M24 40v-8" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {emblemType === 'artificer' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* Cogwheel & Flask */}
          <circle cx="24" cy="24" r="10" stroke="#E5C158" strokeWidth="3" />
          <path d="M24 8v4M24 36v4M8 24h4M36 24h4M13 13l3 3M32 32l3 3M13 35l3-3M32 16l3-3" stroke="#FFE58F" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="24" r="4" fill="#FFE58F" />
        </svg>
      )}

      {emblemType === 'default' && (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48" fill="none">
          {/* D20 polyhedral die seal */}
          <polygon points="24,6 8,16 14,38 34,38 40,16" fill="#4B2C19" stroke="#E5C158" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="24,6 16,19 32,19" fill="#6B3A2A" stroke="#E5C158" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="24,34 16,19 32,19" fill="#3D2012" stroke="#FFE58F" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ── Stat Helpers ──

function getCharHP(char: SavedCharacter): number {
  const d = char.data;
  if (!d) return 10;
  if (d.hpMax !== null && d.hpMax !== undefined && !isNaN(Number(d.hpMax))) {
    return Number(d.hpMax);
  }
  if (d.hpCurrent !== undefined && !isNaN(Number(d.hpCurrent))) {
    return Number(d.hpCurrent);
  }
  return 10;
}

function getCharAC(char: SavedCharacter): number {
  const d = char.data;
  if (!d) return 10;
  if (d.armorClass !== null && d.armorClass !== undefined && !isNaN(Number(d.armorClass))) {
    return Number(d.armorClass);
  }
  const dex =
    Number(d.abilityScores?.['ЛОВ'] ?? 10) +
    Number(d.abilityBonuses?.['ЛОВ'] ?? 0) +
    Number(d.asiBonuses?.['ЛОВ'] ?? 0);
  const dexMod = Math.floor((dex - 10) / 2);
  const shield = d.equippedShield ? 2 : 0;
  return 10 + dexMod + shield;
}

interface StatPillInfo {
  label: string;
  value: string;
  icon: string;
}

function getCharSpecialStat(char: SavedCharacter): StatPillInfo {
  const d = char.data;
  if (!d) return { label: 'СИЛ', value: '10 (+0)', icon: '⚔️' };

  const lvl = Number(d.level ?? 1);
  const profBonus = lvl <= 4 ? 2 : lvl <= 8 ? 3 : lvl <= 12 ? 4 : lvl <= 16 ? 5 : 6;

  // If character has a spellcasting ability specified
  if (d.spellcastingAbility) {
    const ability = d.spellcastingAbility as AbilityName;
    const score =
      Number(d.abilityScores?.[ability] ?? 10) +
      Number(d.abilityBonuses?.[ability] ?? 0) +
      Number(d.asiBonuses?.[ability] ?? 0);
    const mod = Math.floor((score - 10) / 2);
    const dc = 8 + profBonus + mod;
    return {
      label: 'Спас. ДЦ',
      value: `ДЦ ${dc}`,
      icon: '✨',
    };
  }

  // Otherwise determine primary stat
  const cls = (d.className || '').toLowerCase();
  let primaryAbility: AbilityName = 'СИЛ';
  let icon = '⚔️';

  if (
    cls.includes('плут') ||
    cls.includes('rogue') ||
    cls.includes('монах') ||
    cls.includes('monk') ||
    cls.includes('следопыт') ||
    cls.includes('ranger')
  ) {
    primaryAbility = 'ЛОВ';
    icon = '🎯';
  } else if (
    cls.includes('волшеб') ||
    cls.includes('wizard') ||
    cls.includes('изобрет') ||
    cls.includes('artificer')
  ) {
    primaryAbility = 'ИНТ';
    icon = '📖';
  } else if (
    cls.includes('жрец') ||
    cls.includes('cleric') ||
    cls.includes('друид') ||
    cls.includes('druid')
  ) {
    primaryAbility = 'МДР';
    icon = '👁️';
  } else if (
    cls.includes('бард') ||
    cls.includes('bard') ||
    cls.includes('чародей') ||
    cls.includes('sorcerer') ||
    cls.includes('колдун') ||
    cls.includes('warlock') ||
    cls.includes('паладин') ||
    cls.includes('paladin')
  ) {
    primaryAbility = 'ХАР';
    icon = '✨';
  } else {
    // Pick highest among abilityScores
    const scores = d.abilityScores || {};
    let maxScore = -999;
    for (const ab of ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР'] as AbilityName[]) {
      const total =
        Number(scores[ab] ?? 10) +
        Number(d.abilityBonuses?.[ab] ?? 0) +
        Number(d.asiBonuses?.[ab] ?? 0);
      if (total > maxScore) {
        maxScore = total;
        primaryAbility = ab;
      }
    }
    const abIconMap: Record<AbilityName, string> = {
      'СИЛ': '⚔️',
      'ЛОВ': '🎯',
      'ТЕЛ': '🛡️',
      'ИНТ': '📖',
      'МДР': '👁️',
      'ХАР': '✨',
    };
    icon = abIconMap[primaryAbility] || '⚔️';
  }

  const totalScore =
    Number(d.abilityScores?.[primaryAbility] ?? 10) +
    Number(d.abilityBonuses?.[primaryAbility] ?? 0) +
    Number(d.asiBonuses?.[primaryAbility] ?? 0);
  const mod = Math.floor((totalScore - 10) / 2);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

  return {
    label: primaryAbility,
    value: `${primaryAbility} ${totalScore} (${modStr})`,
    icon,
  };
}

function formatRussianDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Сегодня, ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${timeStr}`;
    }

    return (
      d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      }) + `, ${timeStr}`
    );
  } catch {
    return '';
  }
}

// ── Main Character Grid Modal Component ──

export const CharacterGridModal = React.memo(function CharacterGridModal({
  characters,
  cloudCharacters,
  localCharacter,
  onLoad,
  onDelete,
  onShare,
  onCreateNew,
  onClose,
}: CharacterGridModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deletingId) {
          setDeletingId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deletingId, onClose]);

  // Combine characters from cloud and local storage fallback
  const allCharacters = useMemo<SavedCharacter[]>(() => {
    const list: SavedCharacter[] = [];
    const seenIds = new Set<string>();

    if (characters && characters.length > 0) {
      for (const c of characters) {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          list.push(c);
        }
      }
    } else if (cloudCharacters && cloudCharacters.length > 0) {
      for (const c of cloudCharacters) {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          list.push(c);
        }
      }
    }

    // Include local character fallback if available and not redundant
    if (localCharacter && !seenIds.has(localCharacter.id)) {
      list.push(localCharacter);
    }

    return list;
  }, [characters, cloudCharacters, localCharacter]);

  // Real-time filtering by Name, Class, or Race
  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCharacters;

    return allCharacters.filter(c => {
      const name = (c.name || c.data?.name || '').toLowerCase();
      const cls = (c.data?.className || '').toLowerCase();
      const subclass = (c.data?.subclass || '').toLowerCase();
      const race = (c.data?.race || '').toLowerCase();
      const subrace = (c.data?.subrace || '').toLowerCase();

      return (
        name.includes(q) ||
        cls.includes(q) ||
        subclass.includes(q) ||
        race.includes(q) ||
        subrace.includes(q)
      );
    });
  }, [allCharacters, searchQuery]);

  return (
    <div
      className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="parchment-modal w-full max-w-5xl my-auto max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="p-4 sm:p-6 pb-3 border-b-2 border-[#C9A84C]/40 bg-[#2C1810]/5 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#5C341F]/30 border border-[#C9A84C]/50 shadow-inner">
                <MysticCloudIcon size={24} className="text-[#C9A84C]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif leading-none text-[#3C2415] flex items-center gap-2">
                  <span>Мои персонажи</span>
                  <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-[#8B4513]/15 text-[#6B3A2A] border border-[#C9A84C]/40 font-normal">
                    {allCharacters.length}
                  </span>
                </h2>
                <p className="text-xs text-[#8B6914] mt-1 font-serif italic">
                  Выберите героя для загрузки или создайте нового
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onCreateNew && (
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="parchment-btn text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center gap-1.5 font-bold shadow"
                  title="Создать нового героя с нуля"
                >
                  <span className="text-base leading-none font-bold">+</span>
                  <span className="hidden sm:inline">Создать персонажа</span>
                  <span className="sm:hidden">Создать</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="parchment-remove-btn w-8 h-8 flex items-center justify-center text-base rounded hover:bg-black/10 transition-colors"
                title="Закрыть окно (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Search Input Bar ── */}
          <div className="relative flex items-center">
            <div className="absolute left-3 text-[#8B6914] pointer-events-none text-sm">
              🔍
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, классу или расе..."
              className="w-full pl-9 pr-8 py-2 text-sm font-serif bg-[#FBF0DC]/80 border border-[#C9A84C]/50 rounded text-[#3C2415] placeholder:italic placeholder:text-[#8B6914]/60 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] shadow-inner transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-xs text-[#8B6914] hover:text-[#3C2415] p-1 font-bold"
                title="Очистить поиск"
              >
                ✕
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="text-[11px] text-[#8B6914] mt-2 italic px-1 flex justify-between">
              <span>
                Найдено: <strong>{filteredCharacters.length}</strong> из {allCharacters.length}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#6B3A2A] underline hover:text-[#3C2415]"
              >
                Сбросить фильтр
              </button>
            </div>
          )}
        </div>

        {/* ── Modal Scrollable Grid Area ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar min-h-[260px]">
          {allCharacters.length === 0 ? (
            /* Empty State: No Characters Saved */
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-[#C9A84C]/15 border-2 border-[#C9A84C]/40 flex items-center justify-center shadow-inner">
                <ScrollIcon size={40} />
              </div>
              <h3 className="text-xl font-bold font-serif text-[#3C2415] mb-2">
                У вас пока нет сохранённых персонажей
              </h3>
              <p className="text-sm text-[#8B6914] max-w-md mb-6 font-serif leading-relaxed">
                Создайте своего первого героя, выберите класс и отправляйтесь в захватывающее
                приключение по миру D&D 5e!
              </p>
              {onCreateNew && (
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="parchment-btn text-sm px-6 py-2.5 font-bold shadow-lg flex items-center gap-2"
                >
                  <span className="text-lg leading-none">+</span>
                  <span>Создать первого героя</span>
                </button>
              )}
            </div>
          ) : filteredCharacters.length === 0 ? (
            /* Empty State: Search yielded no matches */
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-3">📜</div>
              <h3 className="text-lg font-bold font-serif text-[#3C2415] mb-1">
                Ничего не найдено
              </h3>
              <p className="text-xs sm:text-sm text-[#8B6914] max-w-sm mb-4 font-serif">
                По запросу «<strong>{searchQuery}</strong>» не найдено ни одного сохранённого
                персонажа.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="parchment-btn-secondary text-xs px-4 py-1.5"
              >
                Показать всех персонажей
              </button>
            </div>
          ) : (
            /* Responsive Grid of Character Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCharacters.map(char => {
                const charData = char.data || {};
                const name = char.name || charData.name || 'Безымянный герой';
                const level = charData.level || 1;
                const className = charData.className || 'Приключенец';
                const subclass = charData.subclass;
                const race = charData.race || 'Раса не указана';
                const subrace = charData.subrace;

                const portrait = char.portrait_url || charData._portraitUrl;
                const hp = getCharHP(char);
                const ac = getCharAC(char);
                const specialStat = getCharSpecialStat(char);
                const updatedDateStr = formatRussianDate(char.updated_at || char.created_at);

                const isConfirmingDelete = deletingId === char.id;

                return (
                  <div
                    key={char.id}
                    className="relative group bg-[#FBF0DC]/85 hover:bg-[#FBF0DC] border-2 border-[#8B6914]/35 hover:border-[#C9A84C] rounded-lg p-3.5 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden hover:-translate-y-0.5"
                    style={{
                      boxShadow:
                        '0 3px 10px rgba(60, 36, 21, 0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
                    }}
                  >
                    {/* Inline Delete Confirmation Overlay */}
                    {isConfirmingDelete && (
                      <div className="absolute inset-0 bg-[#28150C]/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 text-center z-20 animate-fade-in">
                        <div className="text-2xl mb-1">⚠️</div>
                        <p className="text-amber-100 text-xs sm:text-sm font-semibold mb-3">
                          Удалить персонажа <br />
                          <span className="text-amber-300 font-bold font-serif text-sm">
                            «{name}»
                          </span>
                          ?
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingId(null);
                              onDelete(char.id);
                            }}
                            className="bg-red-800 hover:bg-red-700 active:bg-red-900 text-amber-50 text-xs font-bold px-3 py-1.5 rounded border border-red-500 shadow transition-colors"
                          >
                            Да, удалить
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="parchment-btn-secondary text-xs px-3 py-1.5 !text-amber-100 !border-amber-200/40 hover:!bg-amber-100/10"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      {/* ── Card Header: Portrait + Basic Details ── */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Portrait / Class Emblem */}
                        <div className="shrink-0">
                          {portrait ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={portrait}
                              alt={name}
                              className="w-16 h-16 sm:w-18 sm:h-18 rounded-md object-cover object-top border-2 border-[#C9A84C]/80 shadow-md bg-[#2C1810]"
                            />
                          ) : (
                            <ClassEmblem className={className} size={64} />
                          )}
                        </div>

                        {/* Name & Badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className="font-serif font-bold text-base sm:text-lg text-[#3C2415] truncate leading-tight"
                              title={name}
                            >
                              {name}
                            </h4>
                            {char.isLocal ? (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/10 text-amber-900 border border-amber-800/20 shrink-0 font-sans"
                                title="Персонаж сохранён локально в браузере"
                              >
                                💾 Устройство
                              </span>
                            ) : (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/10 text-blue-900 border border-blue-800/20 shrink-0 font-sans"
                                title="Персонаж сохранён в облаке"
                              >
                                ☁️ Облако
                              </span>
                            )}
                          </div>

                          {/* Class & Level Badge */}
                          <div className="mt-1 flex flex-wrap gap-1 items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#8B4513]/15 text-[#5C2E1A] border border-[#C9A84C]/40 truncate max-w-full">
                              {level} ур. {className}
                              {subclass ? ` (${subclass})` : ''}
                            </span>
                          </div>

                          {/* Race Badge */}
                          <div className="mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-[#8B6914] bg-[#EDE0C8]/70 border border-[#8B6914]/25 truncate max-w-full">
                              {race}
                              {subrace ? ` (${subrace})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── Mini Stats Pills Row ── */}
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {/* HP */}
                        <div
                          className="flex flex-col items-center justify-center p-1.5 rounded bg-red-900/10 border border-red-800/20 text-center"
                          title="Максимум здоровья (HP)"
                        >
                          <span className="text-[10px] font-medium text-red-950/70 leading-none mb-0.5">
                            Здоровье
                          </span>
                          <span className="text-xs font-bold text-red-900 font-serif leading-none flex items-center gap-0.5">
                            ❤️ {hp}
                          </span>
                        </div>

                        {/* AC */}
                        <div
                          className="flex flex-col items-center justify-center p-1.5 rounded bg-amber-900/10 border border-amber-800/25 text-center"
                          title="Класс доспеха (КД)"
                        >
                          <span className="text-[10px] font-medium text-amber-950/70 leading-none mb-0.5">
                            Броня (КД)
                          </span>
                          <span className="text-xs font-bold text-[#5C341F] font-serif leading-none flex items-center gap-0.5">
                            🛡️ {ac}
                          </span>
                        </div>

                        {/* Spell DC or Primary Stat */}
                        <div
                          className="flex flex-col items-center justify-center p-1.5 rounded bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-center"
                          title={specialStat.label}
                        >
                          <span className="text-[10px] font-medium text-[#6B3A2A] leading-none mb-0.5 truncate max-w-full">
                            {specialStat.label}
                          </span>
                          <span className="text-xs font-bold text-[#3C2415] font-serif leading-none truncate max-w-full">
                            {specialStat.icon} {specialStat.value}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Card Footer: Date & Quick Actions ── */}
                    <div className="pt-2 border-t border-[#8B6914]/20 mt-auto">
                      {updatedDateStr && (
                        <div className="text-[10px] text-[#8B6914] italic mb-2 truncate">
                          🕒 {updatedDateStr}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onLoad(char)}
                          className="parchment-btn text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1 font-bold shadow-sm"
                          title="Загрузить этого персонажа в лист"
                        >
                          <span>⚔️ Играть</span>
                        </button>

                        {onShare && (
                          <button
                            type="button"
                            onClick={() => onShare(char)}
                            className="parchment-btn-secondary text-xs py-1.5 px-2.5 flex items-center justify-center gap-1 hover:bg-[#C9A84C]/15"
                            title="Поделиться персонажем (код для AI Dungeon Master)"
                          >
                            <ArcaneLinkIcon size={14} />
                            <span className="hidden xs:inline">Код</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeletingId(char.id)}
                          className="parchment-remove-btn px-2 py-1.5 text-xs text-red-700 hover:text-red-950 hover:bg-red-200/50 rounded flex items-center justify-center"
                          title="Удалить персонажа"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-3 sm:p-4 bg-[#2C1810]/5 border-t border-[#C9A84C]/30 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#8B6914] italic font-serif">
            {allCharacters.length > 0
              ? `Всего персонажей: ${allCharacters.length}`
              : 'Нет сохранённых персонажей'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="parchment-btn-secondary text-xs sm:text-sm px-5 py-1.5"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
});
