'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CharacterData,
  AbilityName,
  ABILITY_NAMES,
  ABILITY_FULL,
  ALL_SKILLS,
  SKILL_MAP,
  formatModifier,
  calcModifier,
  calcProficiencyBonus,
  getTotalScore,
  getModifier,
  getSavingThrow,
  getSkillBonus,
  getInitiative,
  getPassivePerception,
  getAC,
  getHPMax,
  getSpellSaveDC,
  getSpellAttackBonus,
  createDefaultCharacter,
} from '@/lib/dnd-types';
import { createClient } from '@/lib/supabase/client';
import {
  D20Icon,
  EngravedShieldIcon,
  CrossedSwordsIcon,
  SparklesDndIcon,
  BackpackPackIcon,
  SpellbookIcon,
  ScrollIcon,
  GoldSealCheckIcon,
  ArcaneLinkIcon,
  CameraPortraitIcon,
  CoinsChestIcon,
  MasksDramaIcon,
  MysticSpinnerIcon,
  CrystalBallDndIcon,
} from '@/components/dnd-icons';

// ── Normalize helper for safely filling defaults ──
function normalizeCharacterData(raw: Partial<CharacterData> | null | undefined): CharacterData {
  const defaults = createDefaultCharacter();
  if (!raw) return defaults;
  return {
    ...defaults,
    ...raw,
    abilityScores: { ...defaults.abilityScores, ...(raw.abilityScores || {}) },
    abilityBonuses: { ...defaults.abilityBonuses, ...(raw.abilityBonuses || {}) },
    asiBonuses: { ...defaults.asiBonuses, ...(raw.asiBonuses || {}) },
    savingThrowProficiencies: {
      ...defaults.savingThrowProficiencies,
      ...(raw.savingThrowProficiencies || {}),
    },
    skillProficiencies: { ...defaults.skillProficiencies, ...(raw.skillProficiencies || {}) },
    skillExpertise: { ...defaults.skillExpertise, ...(raw.skillExpertise || {}) },
    spellSlots: { ...defaults.spellSlots, ...(raw.spellSlots || {}) },
    spellsByLevel: { ...defaults.spellsByLevel, ...(raw.spellsByLevel || {}) },
    attacks: Array.isArray(raw.attacks) ? raw.attacks : defaults.attacks,
    cantrips: Array.isArray(raw.cantrips) ? raw.cantrips : defaults.cantrips,
    levelHistory: Array.isArray(raw.levelHistory) ? raw.levelHistory : defaults.levelHistory,
  };
}

export default function SharedCharacterPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [char, setChar] = useState<CharacterData | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<{
    name: string;
    createdAt?: string;
    expiresAt?: string;
  } | null>(null);

  const [toast, setToast] = useState<{ title: string; description: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const showToast = useCallback((title: string, description: string) => {
    setToast({ title, description });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch character snapshot by code
  useEffect(() => {
    let cancelled = false;

    async function fetchShare() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/share/${encodeURIComponent(code)}`);
        const json = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json?.error || 'Ссылка не найдена или срок её действия истёк');
        }

        const charData = json.character?.data || json.character;
        if (!charData) {
          throw new Error('Данные персонажа отсутствуют в снимке');
        }

        const normalized = normalizeCharacterData(charData);
        setChar(normalized);

        const portrait =
          charData.portraitUrl ||
          charData.portrait_url ||
          normalized.portraitUrl ||
          null;
        setPortraitUrl(portrait);

        setShareInfo({
          name: json.character?.name || normalized.name || 'Безымянный',
          createdAt: json.character?.created_at,
          expiresAt: json.character?.expires_at,
        });
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Ошибка загрузки';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchShare();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Action: Copy URL to clipboard
  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedUrl(true);
        showToast('Ссылка скопирована', 'Адрес листа персонажа сохранён в буфер обмена');
        setTimeout(() => setCopiedUrl(false), 2500);
      }
    } catch {
      showToast('Ошибка копирования', 'Скопируйте URL из адресной строки браузера');
    }
  };

  // Action: Save to user collection or localStorage
  const handleSaveToCollection = async () => {
    if (!char) return;
    setSavingStatus('saving');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // User is authenticated -> save to /api/characters
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: char.name || 'Безымянный',
            data: char,
            portrait_url: portraitUrl,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || 'Не удалось сохранить в облако');
        }

        setSavingStatus('saved');
        showToast('Сохранено в коллекцию', `"${char.name || 'Персонаж'}" успешно добавлен в ваши облачные персонажи!`);
        setTimeout(() => setSavingStatus('idle'), 3000);
      } else {
        // Guest user -> save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('dnd5e_character', JSON.stringify(char));
          if (portraitUrl) {
            localStorage.setItem('dnd5e_portrait', portraitUrl);
          }
          setSavingStatus('saved');
          setShowImportConfirm(true);
          showToast(
            'Сохранено локально',
            `"${char.name || 'Персонаж'}" сохранён в браузере. Вы можете открыть его в редакторе.`
          );
          setTimeout(() => setSavingStatus('idle'), 3000);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить';
      showToast('Ошибка сохранения', message);
      setSavingStatus('idle');
    }
  };

  // Action: Open in editor
  const handleOpenInEditor = () => {
    if (!char) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dnd5e_character', JSON.stringify(char));
        if (portraitUrl) {
          localStorage.setItem('dnd5e_portrait', portraitUrl);
        }
      }
      router.push('/');
    } catch {
      router.push('/');
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="parchment-bg min-h-screen flex items-center justify-center p-4">
        <div className="parchment-card p-8 max-w-md w-full text-center space-y-4">
          <MysticSpinnerIcon size={44} className="text-[#6B3A2A] mx-auto" />
          <h2 className="text-xl font-bold text-[#3C2415]">Загрузка свитка персонажа...</h2>
          <p className="text-sm text-[#8B6914]">
            Считывание рунической печати кода <span className="font-mono font-bold text-[#3C2415]">{code}</span>
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !char) {
    return (
      <div className="parchment-bg min-h-screen flex items-center justify-center p-4">
        <div className="parchment-card p-8 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#8B2500]/10 border-2 border-[#8B2500]/40 flex items-center justify-center mx-auto text-[#8B2500] text-2xl">
            📜
          </div>
          <h2 className="text-2xl font-bold text-[#8B2500]">Свиток не найден</h2>
          <p className="text-sm text-[#3C2415]/80">
            {error || 'Ссылка не существует или срок её действия истёк.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="parchment-btn w-full inline-flex items-center justify-center gap-2 py-2 text-sm"
            >
              <D20Icon size={18} />
              <span>Перейти в генератор персонажей</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Spellcasting flags
  const isCaster = Boolean(
    char.spellcastingClass ||
      char.spellcastingAbility ||
      (char.cantrips && char.cantrips.length > 0) ||
      (char.spellsByLevel && Object.keys(char.spellsByLevel).length > 0)
  );

  return (
    <div className="parchment-bg min-h-screen pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] parchment-toast px-4 py-3 max-w-sm shadow-xl animate-in slide-in-from-top-3 duration-200">
          <p className="font-semibold text-sm text-[#3C2415]">{toast.title}</p>
          <p className="text-xs text-[#8B6914] mt-0.5">{toast.description}</p>
        </div>
      )}

      {/* Guest Local Save Dialog */}
      {showImportConfirm && (
        <div className="fixed inset-0 z-50 parchment-modal-overlay flex items-center justify-center p-4">
          <div className="parchment-modal max-w-sm w-full p-5 text-center space-y-4">
            <div className="text-3xl">📥</div>
            <h3 className="text-lg font-bold text-[#3C2415]">Персонаж импортирован!</h3>
            <p className="text-xs text-[#6B3A2A]">
              Данные листа сохранены в вашем браузере. Вы можете сразу открыть его в интерактивном редакторе.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenInEditor}
                className="flex-1 parchment-btn py-2 text-xs font-semibold"
              >
                ✏️ Открыть в редакторе
              </button>
              <button
                type="button"
                onClick={() => setShowImportConfirm(false)}
                className="flex-1 parchment-btn-secondary py-2 text-xs"
              >
                Остаться здесь
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP ACTION BAR ── */}
      <header className="sticky top-0 z-40 parchment-header shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Logo & DM Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              title="На главную страницу листа персонажа"
            >
              <D20Icon size={26} />
              <span className="hidden sm:inline font-bold text-sm text-[#D4A957]">
                D&D 5e Sheet
              </span>
            </Link>

            {/* Read-only DM badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#C9A84C]/25 border border-[#C9A84C]/60 text-[#FFE58F] text-xs font-semibold tracking-wide">
              <span>👁️</span>
              <span>Режим просмотра D&D 5e</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="parchment-header-btn flex items-center gap-1.5 text-xs py-1.5 px-3"
              title="Скопировать ссылку на этот лист"
            >
              {copiedUrl ? (
                <>
                  <GoldSealCheckIcon size={14} />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <ArcaneLinkIcon size={14} />
                  <span>Скопировать ссылку</span>
                </>
              )}
            </button>

            {/* Save to Collection / Import */}
            <button
              type="button"
              onClick={handleSaveToCollection}
              disabled={savingStatus === 'saving'}
              className="parchment-header-btn flex items-center gap-1.5 text-xs py-1.5 px-3 font-semibold"
              title="Сохранить персонажа в свою коллекцию или браузер"
            >
              {savingStatus === 'saving' ? (
                <>
                  <MysticSpinnerIcon size={14} />
                  <span>Сохранение...</span>
                </>
              ) : savingStatus === 'saved' ? (
                <>
                  <GoldSealCheckIcon size={14} />
                  <span>Сохранено!</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Сохранить к себе</span>
                </>
              )}
            </button>

            {/* Open in Editor */}
            <button
              type="button"
              onClick={handleOpenInEditor}
              className="parchment-header-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3.5 font-bold"
              title="Открыть персонажа в интерактивном бланке для игры"
            >
              <span>✏️</span>
              <span>Открыть в редакторе</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-3 sm:px-5 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* ── 1. CHARACTER HEADER CARD ── */}
        <section className="parchment-card p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Portrait */}
            <div className="shrink-0 mx-auto md:mx-0">
              {portraitUrl ? (
                <div className="relative w-32 h-40 sm:w-36 sm:h-44 rounded-md overflow-hidden border-2 border-[#C9A84C] shadow-lg bg-[#2C1810]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={portraitUrl}
                    alt={char.name || 'Портрет персонажа'}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ) : (
                <div className="w-32 h-40 sm:w-36 sm:h-44 rounded-md border-2 border-[#C9A84C]/60 bg-[#EDE0C8]/50 flex flex-col items-center justify-center p-3 text-center shadow-inner">
                  <CameraPortraitIcon size={40} className="text-[#8B6914]/50 mb-2" />
                  <span className="text-[11px] font-medium text-[#8B6914]">
                    {char.name ? char.name[0] : 'D&D'}
                  </span>
                </div>
              )}
            </div>

            {/* Character Info */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between gap-3 flex-wrap pb-2 border-b border-[#8B6914]/25">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3C2415] tracking-wide leading-tight">
                    {char.name || 'Безымянный персонаж'}
                  </h1>
                  {char.playerName && (
                    <p className="text-xs text-[#8B6914] mt-0.5">
                      Игрок: <span className="text-[#3C2415] font-medium">{char.playerName}</span>
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {char.inspiration && (
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-600/50 text-[#8B4513] text-xs font-bold flex items-center gap-1 shadow-sm">
                      ✨ Вдохновение
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded bg-[#6B3A2A]/10 border border-[#6B3A2A]/30 text-[#6B3A2A] text-xs font-bold">
                    Уровень {char.level || 1}
                  </span>
                  {char.experiencePoints > 0 && (
                    <span className="px-2.5 py-1 rounded bg-[#EDE0C8] border border-[#8B6914]/30 text-[#8B6914] text-xs font-medium">
                      {char.experiencePoints.toLocaleString()} XP
                    </span>
                  )}
                </div>
              </div>

              {/* Descriptive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#8B6914] uppercase tracking-wider block font-semibold">
                    Класс и подкласс
                  </span>
                  <span className="font-semibold text-[#3C2415] text-sm">
                    {char.className || '—'}
                    {char.subclass ? ` (${char.subclass})` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#8B6914] uppercase tracking-wider block font-semibold">
                    Раса / Народ
                  </span>
                  <span className="font-semibold text-[#3C2415] text-sm">
                    {char.race || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#8B6914] uppercase tracking-wider block font-semibold">
                    Предыстория
                  </span>
                  <span className="font-semibold text-[#3C2415] text-sm">
                    {char.background || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#8B6914] uppercase tracking-wider block font-semibold">
                    Мировоззрение
                  </span>
                  <span className="font-semibold text-[#3C2415] text-sm">
                    {char.alignment || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. CORE VITALS STRIP ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Armor Class */}
          <div className="parchment-card p-3 text-center flex flex-col justify-center items-center">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#8B6914] uppercase tracking-wider mb-1">
              <EngravedShieldIcon size={14} />
              <span>КД</span>
            </div>
            <span className="text-2xl font-extrabold text-[#3C2415] leading-none">
              {getAC(char)}
            </span>
            <span className="text-[10px] text-[#8B6914] mt-1">
              {char.equippedArmor || 'Без доспеха'}
              {char.equippedShield ? ' + Щит' : ''}
            </span>
          </div>

          {/* Initiative */}
          <div className="parchment-card p-3 text-center flex flex-col justify-center items-center">
            <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider mb-1">
              Инициатива
            </span>
            <span className="text-2xl font-extrabold text-[#3C2415] leading-none">
              {formatModifier(getInitiative(char))}
            </span>
            <span className="text-[10px] text-[#8B6914] mt-1">
              {char.initiativeOverride !== null ? 'Особая' : 'Мод. ЛОВ'}
            </span>
          </div>

          {/* Speed */}
          <div className="parchment-card p-3 text-center flex flex-col justify-center items-center">
            <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider mb-1">
              Скорость
            </span>
            <span className="text-2xl font-extrabold text-[#3C2415] leading-none">
              {char.speed || 30}
            </span>
            <span className="text-[10px] text-[#8B6914] mt-1">футов</span>
          </div>

          {/* Hit Points (HP) */}
          <div className="parchment-card p-3 text-center flex flex-col justify-center items-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider mb-1">
              Хиты (HP)
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-extrabold text-[#8B2500] leading-none">
                {char.hpCurrent ?? getHPMax(char)}
              </span>
              <span className="text-xs text-[#8B6914]">/ {getHPMax(char) || '—'}</span>
            </div>
            {char.hpTemp > 0 && (
              <span className="text-[10px] font-bold text-emerald-800 mt-1">
                +{char.hpTemp} врем.
              </span>
            )}
          </div>

          {/* Hit Dice */}
          <div className="parchment-card p-3 text-center flex flex-col justify-center items-center">
            <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider mb-1">
              Кость хитов
            </span>
            <span className="text-xl font-bold text-[#3C2415] leading-none">
              {char.hitDice || `${char.level}d8`}
            </span>
            <span className="text-[10px] text-[#8B6914] mt-1">Всего</span>
          </div>

          {/* Proficiency Bonus */}
          <div className="parchment-card p-3 text-center flex flex-col justify-center items-center">
            <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider mb-1">
              Мастерство
            </span>
            <span className="text-2xl font-extrabold text-[#6B3A2A] leading-none">
              +{calcProficiencyBonus(char.level)}
            </span>
            <span className="text-[10px] text-[#8B6914] mt-1">Бонус</span>
          </div>

          {/* Passive Perception */}
          <div className="parchment-card p-3 text-center flex flex-col justify-center items-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider mb-1">
              Пасс. Вним.
            </span>
            <span className="text-2xl font-extrabold text-[#3C2415] leading-none">
              {getPassivePerception(char)}
            </span>
            <span className="text-[10px] text-[#8B6914] mt-1">10 + Внимательность</span>
          </div>
        </section>

        {/* ── 3. ABILITY SCORES & SAVING THROWS ── */}
        <section className="parchment-card p-4 sm:p-5">
          <h2 className="parchment-heading text-base sm:text-lg flex items-center gap-2">
            <SparklesDndIcon size={18} />
            <span>Характеристики и спасброски</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ABILITY_NAMES.map((ab) => {
              const totalScore = getTotalScore(char, ab);
              const mod = getModifier(char, ab);
              const isSavingProf = Boolean(char.savingThrowProficiencies[ab]);
              const savingThrowVal = getSavingThrow(char, ab);

              return (
                <div
                  key={ab}
                  className="p-3 bg-[#EDE0C8]/50 border border-[#8B6914]/30 rounded flex flex-col items-center text-center shadow-xs"
                >
                  <span className="text-xs font-bold text-[#8B6914] tracking-wider uppercase">
                    {ab}
                  </span>
                  <span className="text-[10px] text-[#8B6914]/80 leading-tight">
                    {ABILITY_FULL[ab]}
                  </span>

                  {/* Modifier Seal */}
                  <div className="my-2 calc-badge text-base font-extrabold min-w-[3rem] py-1">
                    {formatModifier(mod)}
                  </div>

                  {/* Total Score */}
                  <span className="text-xs text-[#3C2415] font-semibold">
                    Значение: {totalScore}
                  </span>

                  {/* Saving Throw */}
                  <div
                    className={`mt-2 pt-1.5 border-t w-full text-center text-xs flex items-center justify-center gap-1 ${
                      isSavingProf
                        ? 'border-[#C9A84C] text-[#6B3A2A] font-bold'
                        : 'border-[#8B6914]/20 text-[#3C2415]/70'
                    }`}
                  >
                    <span className="text-sm">{isSavingProf ? '●' : '○'}</span>
                    <span>Спас: {formatModifier(savingThrowVal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. TWO-COLUMN MAIN DETAILS: SKILLS + COMBAT/SPELLS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column (5 cols): Skills & Proficiencies */}
          <div className="lg:col-span-5 space-y-4">
            {/* Skills List */}
            <div className="parchment-card p-4 sm:p-5">
              <h2 className="parchment-heading text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ScrollIcon size={18} />
                  <span>Навыки</span>
                </span>
                <span className="text-[11px] font-normal text-[#8B6914]">
                  ★ Экспертиза • ● Владение
                </span>
              </h2>

              <div className="divide-y divide-[#8B6914]/15">
                {ALL_SKILLS.map((skill) => {
                  const isProf = Boolean(char.skillProficiencies[skill]);
                  const isExpert = Boolean(char.skillExpertise[skill]);
                  const bonus = getSkillBonus(char, skill);
                  const ab = SKILL_MAP[skill];

                  return (
                    <div
                      key={skill}
                      className={`py-1.5 px-1.5 flex items-center justify-between text-xs transition-colors rounded ${
                        isExpert
                          ? 'bg-[#C9A84C]/15 font-bold text-[#6B3A2A]'
                          : isProf
                          ? 'bg-[#EDE0C8]/60 font-medium text-[#3C2415]'
                          : 'text-[#3C2415]/80 hover:bg-[#EDE0C8]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-sm shrink-0 ${
                            isExpert
                              ? 'text-[#C9A84C]'
                              : isProf
                              ? 'text-[#6B3A2A]'
                              : 'text-[#8B6914]/30'
                          }`}
                        >
                          {isExpert ? '★' : isProf ? '●' : '○'}
                        </span>
                        <span className="truncate">{skill}</span>
                        <span className="text-[10px] text-[#8B6914] shrink-0 font-normal">
                          ({ab})
                        </span>
                      </div>

                      <span
                        className={`font-mono font-bold shrink-0 text-right ${
                          bonus >= 0 ? 'text-[#3C2415]' : 'text-[#8B2500]'
                        }`}
                      >
                        {formatModifier(bonus)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Proficiencies & Languages */}
            {char.otherProficienciesLanguages && (
              <div className="parchment-card p-4 sm:p-5">
                <h3 className="parchment-heading text-sm flex items-center gap-2">
                  <BackpackPackIcon size={16} />
                  <span>Прочие владения и языки</span>
                </h3>
                <p className="text-xs text-[#3C2415] whitespace-pre-wrap leading-relaxed">
                  {char.otherProficienciesLanguages}
                </p>
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Attacks, Spells, Features */}
          <div className="lg:col-span-7 space-y-4">
            {/* Attacks & Actions */}
            <div className="parchment-card p-4 sm:p-5">
              <h2 className="parchment-heading text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CrossedSwordsIcon size={18} />
                  <span>Атаки и боевые действия</span>
                </span>
                {isCaster && (
                  <span className="text-[11px] font-normal text-[#8B6914]">
                    Сл: <strong>{getSpellSaveDC(char)}</strong> • Атака:{' '}
                    <strong>{formatModifier(getSpellAttackBonus(char))}</strong>
                  </span>
                )}
              </h2>

              {char.attacks && char.attacks.filter((a) => a.name).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b-2 border-[#C9A84C]/40 text-[#8B6914]">
                        <th className="py-1.5 px-2 font-semibold">Название</th>
                        <th className="py-1.5 px-2 font-semibold text-center">Бонус атаки</th>
                        <th className="py-1.5 px-2 font-semibold">Урон и тип</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8B6914]/15">
                      {char.attacks
                        .filter((a) => a.name)
                        .map((att, idx) => (
                          <tr key={idx} className="hover:bg-[#EDE0C8]/40">
                            <td className="py-2 px-2 font-bold text-[#3C2415]">{att.name}</td>
                            <td className="py-2 px-2 font-mono font-bold text-[#6B3A2A] text-center">
                              {att.attackBonus || '—'}
                            </td>
                            <td className="py-2 px-2 text-[#3C2415]/90">{att.damageAndType || '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#8B6914] italic">Нет записанных атак или оружия.</p>
              )}
            </div>

            {/* Spellcasting Section (if caster) */}
            {isCaster && (
              <div className="parchment-card p-4 sm:p-5">
                <h2 className="parchment-heading text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CrystalBallDndIcon size={18} />
                    <span>Магия и заклинания</span>
                  </span>
                  <span className="text-xs font-normal text-[#8B6914]">
                    {char.spellcastingClass || 'Заклинатель'}{' '}
                    {char.spellcastingAbility ? `(${char.spellcastingAbility})` : ''}
                  </span>
                </h2>

                {/* Spell Slots Grid */}
                {char.spellSlots && Object.keys(char.spellSlots).length > 0 && (
                  <div className="mb-4 p-3 bg-[#EDE0C8]/50 rounded border border-[#8B6914]/30">
                    <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider block mb-2">
                      ✨ Ячейки заклинаний
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                        const slot = char.spellSlots?.[lvl];
                        if (!slot || slot.totalSlots <= 0) return null;
                        const available = Math.max(0, slot.totalSlots - (slot.expendedSlots || 0));

                        return (
                          <div
                            key={lvl}
                            className="p-1.5 rounded bg-[#EDE0C8]/70 border border-[#C9A84C]/50 text-center"
                          >
                            <span className="text-[10px] text-[#8B6914] font-bold block">
                              {lvl} ур.
                            </span>
                            <span className="font-bold text-xs text-[#3C2415]">
                              {available} / {slot.totalSlots}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cantrips (0 level) */}
                {char.cantrips && char.cantrips.filter(Boolean).length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>✨ Заговоры (0 ур.)</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {char.cantrips.filter(Boolean).map((name, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded bg-[#EDE0C8] border border-[#8B6914]/40 text-xs font-medium text-[#3C2415]"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leveled Spells (1-9) */}
                {char.spellsByLevel &&
                  Object.keys(char.spellsByLevel)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map((lvl) => {
                      const spells = char.spellsByLevel?.[lvl] || [];
                      if (!spells || spells.length === 0) return null;

                      return (
                        <div key={lvl} className="mb-3">
                          <h4 className="text-xs font-bold text-[#6B3A2A] mb-1.5 pb-1 border-b border-[#8B6914]/20 flex items-center justify-between">
                            <span>📖 {lvl}-й уровень</span>
                            <span className="text-[10px] font-normal text-[#8B6914]">
                              {spells.length} закл.
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {spells.map((sp, idx) => (
                              <div
                                key={idx}
                                className={`p-1.5 rounded text-xs flex items-center justify-between border ${
                                  sp.prepared
                                    ? 'bg-[#C9A84C]/15 border-[#C9A84C]/60 text-[#3C2415] font-medium'
                                    : 'bg-[#EDE0C8]/40 border-[#8B6914]/20 text-[#3C2415]/70'
                                }`}
                              >
                                <span className="truncate">{sp.name}</span>
                                {sp.prepared && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C9A84C]/30 text-[#6B3A2A] font-bold shrink-0 ml-1">
                                    Подг.
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}

            {/* Features and Traits */}
            <div className="parchment-card p-4 sm:p-5">
              <h2 className="parchment-heading text-base flex items-center gap-2">
                <SpellbookIcon size={18} />
                <span>Умения и особенности</span>
              </h2>

              {/* Structured traits */}
              {char.traitsList && char.traitsList.length > 0 && (
                <div className="space-y-2 mb-4">
                  {char.traitsList.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded bg-[#EDE0C8]/60 border border-[#8B6914]/25 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[#3C2415] font-bold">{tr.name}</strong>
                        {tr.source && (
                          <span className="text-[10px] text-[#8B6914] bg-[#EDE0C8]/80 px-1.5 py-0.5 rounded border border-[#8B6914]/30">
                            {tr.source}
                          </span>
                        )}
                      </div>
                      {tr.description && (
                        <p className="text-[#3C2415]/80 text-[11px] leading-relaxed">
                          {tr.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Freeform features text */}
              {char.featuresTraits ? (
                <p className="text-xs text-[#3C2415] whitespace-pre-wrap leading-relaxed">
                  {char.featuresTraits}
                </p>
              ) : !char.traitsList?.length ? (
                <p className="text-xs text-[#8B6914] italic">Особенности не указаны.</p>
              ) : null}
            </div>

            {/* Equipment and Currency */}
            <div className="parchment-card p-4 sm:p-5">
              <h2 className="parchment-heading text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BackpackPackIcon size={18} />
                  <span>Снаряжение и инвентарь</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#8B6914]">
                  <CoinsChestIcon size={16} />
                  <span>Кошелёк</span>
                </span>
              </h2>

              {/* Currency Strip */}
              <div className="grid grid-cols-5 gap-2 mb-4 p-2.5 bg-[#EDE0C8]/50 border border-[#8B6914]/25 rounded text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#8B6914] uppercase block">ММ (cp)</span>
                  <span className="font-bold text-[#3C2415]">{char.cp || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8B6914] uppercase block">СМ (sp)</span>
                  <span className="font-bold text-[#3C2415]">{char.sp || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8B6914] uppercase block">ЭМ (ep)</span>
                  <span className="font-bold text-[#3C2415]">{char.ep || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#C9A84C] font-bold uppercase block">ЗМ (gp)</span>
                  <span className="font-bold text-[#6B3A2A] text-sm">{char.gp || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-800 font-bold uppercase block">ПМ (pp)</span>
                  <span className="font-bold text-sky-950">{char.pp || 0}</span>
                </div>
              </div>

              {/* Equipment Text */}
              {char.equipment ? (
                <p className="text-xs text-[#3C2415] whitespace-pre-wrap leading-relaxed">
                  {char.equipment}
                </p>
              ) : (
                <p className="text-xs text-[#8B6914] italic">Инвентарь пуст.</p>
              )}
            </div>

            {/* Personality, Appearance & Backstory */}
            {(char.personalityTraits ||
              char.ideals ||
              char.bonds ||
              char.flaws ||
              char.backstory ||
              char.appearance) && (
              <div className="parchment-card p-4 sm:p-5">
                <h2 className="parchment-heading text-base flex items-center gap-2">
                  <MasksDramaIcon size={18} />
                  <span>Личность и предыстория</span>
                </h2>

                <div className="space-y-3 text-xs">
                  {char.personalityTraits && (
                    <div>
                      <strong className="text-[#8B6914] block">Черты характера:</strong>
                      <p className="text-[#3C2415] italic">{char.personalityTraits}</p>
                    </div>
                  )}
                  {char.ideals && (
                    <div>
                      <strong className="text-[#8B6914] block">Идеалы:</strong>
                      <p className="text-[#3C2415] italic">{char.ideals}</p>
                    </div>
                  )}
                  {char.bonds && (
                    <div>
                      <strong className="text-[#8B6914] block">Привязанности:</strong>
                      <p className="text-[#3C2415] italic">{char.bonds}</p>
                    </div>
                  )}
                  {char.flaws && (
                    <div>
                      <strong className="text-[#8B6914] block">Слабости:</strong>
                      <p className="text-[#3C2415] italic">{char.flaws}</p>
                    </div>
                  )}
                  {char.appearance && (
                    <div className="pt-2 border-t border-[#8B6914]/20">
                      <strong className="text-[#8B6914] block">Внешний вид:</strong>
                      <p className="text-[#3C2415]">{char.appearance}</p>
                    </div>
                  )}
                  {char.backstory && (
                    <div className="pt-2 border-t border-[#8B6914]/20">
                      <strong className="text-[#8B6914] block">Предыстория:</strong>
                      <p className="text-[#3C2415] whitespace-pre-wrap leading-relaxed">
                        {char.backstory}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info banner */}
        <footer className="parchment-card p-4 text-center text-xs text-[#8B6914] space-y-1">
          <p>
            Публичный снимок персонажа D&D 5e • Код ссылки:{' '}
            <span className="font-mono font-bold text-[#3C2415]">{code}</span>
          </p>
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-[#6B3A2A] hover:underline font-semibold"
            >
              Скопировать ссылку
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleOpenInEditor}
              className="text-[#6B3A2A] hover:underline font-semibold"
            >
              Открыть в интерактивном редакторе
            </button>
            <span>•</span>
            <Link href="/" className="text-[#6B3A2A] hover:underline font-semibold">
              Создать своего персонажа
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
