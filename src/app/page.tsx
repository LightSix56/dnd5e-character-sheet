'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CharacterData, AbilityName, ABILITY_NAMES, ABILITY_FULL, ALL_SKILLS, SKILL_MAP,
  formatModifier, calcModifier, calcProficiencyBonus, getTotalScore, getModifier,
  getSavingThrow, getSkillBonus, getInitiative, getPassivePerception, getAC,
  getCalculatedAC, getAvailableArmorModes, type ArmorModeOption,
  getHPMax, getSpellSaveDC, getSpellAttackBonus, getSpellDamageBonus, getSpellAbilityMod,
  createDefaultCharacter, createExampleWarrior, createExampleWizard,
  Attack, SpellEntry, LevelUpEntry,
  getHitDieSize, getHitDieAverage, getHitDiceNotation, isStandardASILevel, getMilestonesAtLevel, createEmptyLevelUpEntry,
  CLASS_TEMPLATES, ClassTemplate, applyClassTemplate, applyRaceTemplate, ARMOR_AC_MAP,
  recalculateAttacksOnStatsChange,
  getCarryingCapacity, getJumpDistances, setAttackProficiency,
} from '@/lib/dnd-types';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { DND_SPELLS, findSpellByName, type DndSpell } from '@/data/dnd-spells';
import { DND_WEAPONS, findWeaponByName, type DndWeapon } from '@/data/dnd-weapons';
import { DND_TRAITS, findTraitByName, type DndTrait } from '@/data/dnd-traits';
import { AutocompleteInput, type AutocompleteItem } from '@/components/compendium/AutocompleteInput';
import { SpellDetailModal, WeaponDetailModal, TraitDetailModal } from '@/components/compendium/CompendiumModals';
import { CharacterGridModal } from '@/components/tools/CharacterGridModal';
import { ShareModal } from '@/components/tools/ShareModal';
import { NameGeneratorModal } from '@/components/tools/NameGeneratorModal';
import { StatsCalculatorModal } from '@/components/tools/StatsCalculatorModal';
import { CharacterCreationWizardModal } from '@/components/wizard/CharacterCreationWizardModal';
import { ClassSelectorModal } from '@/components/compendium/ClassSelectorModal';
import { RaceSelectorModal } from '@/components/compendium/RaceSelectorModal';
import { SubclassSelectorModal } from '@/components/compendium/SubclassSelectorModal';
import { ItemDetailModal } from '@/components/compendium/ItemDetailModal';
import { LevelUpModal } from '@/components/levelup/LevelUpModal';
import { RestModal } from '@/components/gameplay/RestModal';
import { EquipmentPaperDoll } from '@/components/equipment/EquipmentPaperDoll';
import {
  getActiveCharacterAttacks,
  type ActiveAttackOption,
  hasTwoWeaponFightingStyle,
  calculateEquipmentBonuses,
  equipItem,
  type EquippedItem,
  type EquipmentSlotId,
} from '@/lib/equipment-types';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { calculateWizardAC } from '@/components/wizard/wizard-helpers';
import { findItemByName, type CompendiumItem } from '@/data/compendium/items';
import type { CompendiumRace, CompendiumSubrace } from '@/data/compendium/races';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass, type CompendiumClass, type CompendiumSubclass } from '@/data/compendium/classes';
import {
  getClassSubclassLevel,
  getSpellSlotsForClassLevel,
  isSpellAllowedForCharacter,
  getMaxAvailableSpellSlotLevel,
  normalizeClassName,
} from '@/data/compendium';
import { WARLOCK_INVOCATIONS } from '@/data/compendium/warlock-choices';
import type { TraitItem } from '@/lib/dnd-types';

import {
  D20Icon, ScrollIcon, SpellbookIcon, ChestIcon, HourglassIcon,
  GoldSealCheckIcon, MysticSpinnerIcon, MysticCloudIcon, PortalIcon,
  QuillIcon, RunedKeyIcon, ArcaneLinkIcon, CrossedSwordsIcon, EngravedShieldIcon,
  UserHeroIcon, SparklesDndIcon, CoinsChestIcon, MasksDramaIcon, BackpackPackIcon,
  CrystalBallDndIcon, CameraPortraitIcon, InfoSealIcon
} from '@/components/dnd-icons';

import {
  CalcBadge,
  rollD20,
  type RollResult,
  RollResultPopup,
  RollBadge,
  StatInput,
  inputClass,
  inputClassCenter,
  textareaClass,
  getThirdCasterSpellSlots,
} from '@/components/sheet/SheetUIPrimitives';
import { MainSheetPage } from '@/components/sheet/pages/MainSheetPage';
import { DetailsSheetPage } from '@/components/sheet/pages/DetailsSheetPage';
import { SpellsSheetPage } from '@/components/sheet/pages/SpellsSheetPage';
import { SheetHeader } from '@/components/sheet/SheetHeader';
import { SheetNavbar, type SheetTab } from '@/components/sheet/SheetNavbar';
import { SheetFooter } from '@/components/sheet/SheetFooter';
import {
  LevelDownModal,
  LevelHistoryModal,
  NonClassSpellConfirmModal,
  TemplateModal,
  AuthModal,
  SignOutModal,
  ResetModal,
  CreateChoiceModal,
} from '@/components/sheet/modals/SheetModals';

// ── Universal Deep Merge Character Normalizer ──
function normalizeCharacterData(raw: Partial<CharacterData> | null | undefined): CharacterData {
  const defaults = createDefaultCharacter();
  if (!raw) return defaults;
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

// ── Main Component ──

export default function DnDCharacterSheet() {
  // ── Load initial data from localStorage (before other state) ──
  const [initialChar] = useState<CharacterData>(() => {
    if (typeof window === 'undefined') return createDefaultCharacter();
    try {
      // Priority 1: Character imported from shared link
      const sharedImportRaw = localStorage.getItem('dnd5e_shared_import');
      if (sharedImportRaw) {
        const parsed = JSON.parse(sharedImportRaw);
        if (parsed?.char) {
          return normalizeCharacterData(parsed.char);
        }
      }
      // Priority 2: Character saved locally
      const saved = localStorage.getItem('dnd5e_character');
      if (saved) {
        return normalizeCharacterData(JSON.parse(saved));
      }
    } catch { /* ignore corrupt data */ }
    return createDefaultCharacter();
  });

  const [initialPortrait] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const sharedImportRaw = localStorage.getItem('dnd5e_shared_import');
      if (sharedImportRaw) {
        const parsed = JSON.parse(sharedImportRaw);
        if (parsed?.portraitUrl !== undefined) {
          return parsed.portraitUrl;
        }
      }
      return localStorage.getItem('dnd5e_portrait') || null;
    } catch { return null; }
  });

  const [char, setChar] = useState<CharacterData>(initialChar);
  const [activeTab, setActiveTab] = useState<'page1' | 'page2' | 'page3'>('page1');
  const [activeSpellModal, setActiveSpellModal] = useState<{ spell: DndSpell | null; customName?: string } | null>(null);
  const [activeWeaponModal, setActiveWeaponModal] = useState<{ weapon: DndWeapon | null; customName?: string; customBonus?: string; customDamage?: string } | null>(null);
  const [activeTraitModal, setActiveTraitModal] = useState<{ trait: DndTrait | null; customName?: string; customSource?: string; customSummary?: string; customDescription?: string; traitIndex?: number } | null>(null);
  const [spellSearchQuery, setSpellSearchQuery] = useState('');
  const [spellAddSuccess, setSpellAddSuccess] = useState<string | null>(null);
  const [traitSearchQuery, setTraitSearchQuery] = useState('');
  const [traitAddSuccess, setTraitAddSuccess] = useState<string | null>(null);
  const [filterOnlyMyClassSpells, setFilterOnlyMyClassSpells] = useState(true);
  const [pendingForeignSpell, setPendingForeignSpell] = useState<{ spell: DndSpell; level: number; callback: () => void } | null>(null);

  const weaponAutocompleteItems: AutocompleteItem[] = useMemo(() => {
    return DND_WEAPONS.map(w => ({
      name: w.name,
      badge: `${w.damageDice} ${w.damageType}`,
      secondary: w.category,
      data: w,
    }));
  }, []);

  const maxAvailableSlot = useMemo(() => getMaxAvailableSpellSlotLevel(char), [char]);

  const spellAutocompleteItems: AutocompleteItem[] = useMemo(() => {
    return DND_SPELLS.map(s => {
      const check = isSpellAllowedForCharacter(char, s);
      const slotAllowed = s.level === 0 || s.level <= maxAvailableSlot;
      return {
        spell: s,
        check,
        slotAllowed,
      };
    })
    .filter(({ check, slotAllowed }) => {
      if (!filterOnlyMyClassSpells) return true;
      return check.allowed && slotAllowed;
    })
    .map(({ spell: s, check, slotAllowed }) => {
      const levelBadge = s.level === 0 ? 'Заговор' : `${s.level} ур.`;
      const slotNote = slotAllowed ? '' : ` • 🔒 Нет ячеек (макс. ${maxAvailableSlot || '0'} ур.)`;
      const badge = `${levelBadge} • ${check.sourceLabel}${slotNote}`;

      return {
        name: s.name,
        badge,
        secondary: s.nameEn ? `${s.nameEn} • ${s.school}` : s.school,
        data: s,
      };
    });
  }, [char, filterOnlyMyClassSpells, maxAvailableSlot]);

  const traitAutocompleteItems: AutocompleteItem[] = useMemo(() => {
    return DND_TRAITS.map(t => ({
      name: t.name,
      badge: t.source,
      secondary: t.category,
      data: t,
    }));
  }, []);
  const [toast, setToast] = useState<{ title: string; description: string } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLevelDown, setShowLevelDown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [showSubclassModal, setShowSubclassModal] = useState(false);
  const [showNameGenModal, setShowNameGenModal] = useState(false);
  const [showStatsCalcModal, setShowStatsCalcModal] = useState(false);
  const [activeItemModal, setActiveItemModal] = useState<CompendiumItem | null>(null);
  const [showRestModal, setShowRestModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [attackSearchQuery, setAttackSearchQuery] = useState('');

  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showCloudSaves, setShowCloudSaves] = useState(false);
  const [cloudCharacters, setCloudCharacters] = useState<any[]>([]);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(initialPortrait);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [showCreateChoiceModal, setShowCreateChoiceModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // ── Auto-save to localStorage on every change ──
  useEffect(() => {
    try {
      localStorage.setItem('dnd5e_character', JSON.stringify(char));
    } catch { /* quota exceeded — ignore */ }
  }, [char]);

  useEffect(() => {
    try {
      if (portraitUrl) localStorage.setItem('dnd5e_portrait', portraitUrl);
      else localStorage.removeItem('dnd5e_portrait');
    } catch { /* ignore */ }
  }, [portraitUrl]);

  // ── Auto-scale weapon attacks when ability modifiers or proficiency bonus change ──
  const prevModifiersRef = React.useRef<{
    mods: Record<AbilityName, number>;
    prof: number;
  }>({
    mods: {
      'СИЛ': getModifier(initialChar, 'СИЛ'),
      'ЛОВ': getModifier(initialChar, 'ЛОВ'),
      'ТЕЛ': getModifier(initialChar, 'ТЕЛ'),
      'ИНТ': getModifier(initialChar, 'ИНТ'),
      'МДР': getModifier(initialChar, 'МДР'),
      'ХАР': getModifier(initialChar, 'ХАР'),
    },
    prof: calcProficiencyBonus(initialChar.level),
  });
  const prevCharIdentityRef = React.useRef<string>(`${initialChar.name}#${initialChar.className}`);

  useEffect(() => {
    const currentMods: Record<AbilityName, number> = {
      'СИЛ': getModifier(char, 'СИЛ'),
      'ЛОВ': getModifier(char, 'ЛОВ'),
      'ТЕЛ': getModifier(char, 'ТЕЛ'),
      'ИНТ': getModifier(char, 'ИНТ'),
      'МДР': getModifier(char, 'МДР'),
      'ХАР': getModifier(char, 'ХАР'),
    };
    const currentProf = calcProficiencyBonus(char.level);
    const currentCharIdentity = `${char.name}#${char.className}`;

    // If character identity changed (switched character in grid / imported), reset baseline without applying deltas
    if (prevCharIdentityRef.current !== currentCharIdentity) {
      prevCharIdentityRef.current = currentCharIdentity;
      prevModifiersRef.current = { mods: currentMods, prof: currentProf };
      return;
    }

    const prev = prevModifiersRef.current;
    let hasDelta = currentProf !== prev.prof;
    if (!hasDelta) {
      for (const ab of ABILITY_NAMES) {
        if (currentMods[ab] !== prev.mods[ab]) {
          hasDelta = true;
          break;
        }
      }
    }

    if (hasDelta) {
      const oldMods = prev.mods;
      const oldProf = prev.prof;
      prevModifiersRef.current = { mods: currentMods, prof: currentProf };

      if (Array.isArray(char.attacks) && char.attacks.length > 0) {
        const updatedAttacks = recalculateAttacksOnStatsChange(
          char.attacks,
          oldMods,
          currentMods,
          oldProf,
          currentProf,
          char
        );
        const isChanged = updatedAttacks.some((atk, idx) => {
          const oldAtk = char.attacks[idx];
          return !oldAtk ||
            atk.attackBonus !== oldAtk.attackBonus ||
            atk.damageAndType !== oldAtk.damageAndType ||
            atk.ability !== oldAtk.ability;
        });
        if (isChanged) {
          setChar(c => ({ ...c, attacks: updatedAttacks }));
        }
      }
    }
  }, [char]);

  // ── Auto-save to cloud (debounced 400ms with instant saving status) when logged in ──
  const cloudSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCloudSaveRef = React.useRef<string>('');
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [cloudSaveError, setCloudSaveError] = useState<string | null>(null);
  const cloudCharIdRef = React.useRef<string | null>(null);
  const [activeCloudCharId, setActiveCloudCharId] = useState<string | null>(null);
  const cloudSaveInProgressRef = React.useRef(false);
  const pendingCloudSaveRef = React.useRef(false);
  const isCloudSyncingRef = React.useRef(false);
  const isSharedImportRef = React.useRef(
    typeof window !== 'undefined' &&
      (Boolean(localStorage.getItem('dnd5e_shared_import')) || window.location.search.includes('import=shared'))
  );

  // Helper: extract active JWT session token for Authorization header
  const getAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch { /* ignore */ }
    return headers;
  }, [supabase]);

  // Helper: save to cloud (POST with id = upsert, server handles update/insert)
  const saveToCloud = useCallback(async (forcedNew = false): Promise<{ ok: boolean; error?: string; id?: string }> => {
    // If a save is already in progress, mark as pending and skip
    if (cloudSaveInProgressRef.current) {
      pendingCloudSaveRef.current = true;
      return { ok: false, error: 'Сохранение уже выполняется' };
    }
    cloudSaveInProgressRef.current = true;
    try {
      const headers = await getAuthHeaders();
      const targetId = forcedNew ? undefined : (cloudCharIdRef.current || undefined);
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: targetId,
          name: char.name || 'Безымянный',
          data: char,
          portrait_url: portraitUrl,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.character) {
        cloudCharIdRef.current = result.character.id;
        setActiveCloudCharId(result.character.id);
        setCloudSaveError(null);
        setCloudSaveStatus('saved');
        setCloudCharacters(prev => {
          const idx = prev.findIndex((c: any) => c.id === result.character.id);
          const updatedEntry = { ...result.character, data: char };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedEntry;
            return next;
          }
          return [updatedEntry, ...prev];
        });
        return { ok: true, id: result.character.id };
      }

      const errorMsg = result.error || `Ошибка сервера (HTTP ${res.status})`;
      console.error('[Cloud Save Error]', res.status, errorMsg);
      setCloudSaveError(errorMsg);
      setCloudSaveStatus('error');
      return { ok: false, error: errorMsg };
    } catch (err: any) {
      console.error('[Cloud Save Network Exception]', err);
      const msg = err.message || 'Сетевая ошибка при сохранении';
      setCloudSaveError(msg);
      setCloudSaveStatus('error');
      return { ok: false, error: msg };
    } finally {
      cloudSaveInProgressRef.current = false;
      // If changes happened while we were saving, trigger another save
      if (pendingCloudSaveRef.current) {
        pendingCloudSaveRef.current = false;
        setTimeout(() => saveToCloud(), 100);
      }
    }
  }, [char, portraitUrl, getAuthHeaders]);

  useEffect(() => {
    if (!user || isCloudSyncingRef.current) return;

    const snapshot = JSON.stringify({ ...char, _portraitUrl: portraitUrl });
    // Skip if data hasn't actually changed since last save
    if (snapshot === lastCloudSaveRef.current) return;

    // Immediately reflect saving status on first keystroke/change
    setCloudSaveStatus('saving');

    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(async () => {
      if (isCloudSyncingRef.current) return;
      const res = await saveToCloud();
      if (res.ok) {
        lastCloudSaveRef.current = snapshot;
        setCloudSaveStatus('saved');
      } else {
        // Do NOT lock lastCloudSaveRef to snapshot on error so future edits retry
        setCloudSaveStatus('error');
      }
    }, 400);
    return () => { if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current); };
  }, [user, char, portraitUrl, saveToCloud]);

  useEffect(() => {
    // Rely solely on onAuthStateChange which fires INITIAL_SESSION synchronously from cookies.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      // On login / page load with existing session: load latest cloud save (cloud > localStorage)
      if (newUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        if (isSharedImportRef.current) {
          // If a shared character was just imported for editing, do NOT overwrite it with latest cloud character!
          isSharedImportRef.current = false;
          return;
        }
        isCloudSyncingRef.current = true;
        try {
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          const res = await fetch('/api/characters', { headers });
          const data = await res.json();
          if (data.characters && data.characters.length > 0) {
            const latest = data.characters[0];
            if (latest.data) {
              const normalized = normalizeCharacterData(latest.data);
              setChar(normalized);
              if (latest.portrait_url) setPortraitUrl(latest.portrait_url);
              else setPortraitUrl(null);
              // Remember the cloud character ID for auto-save updates
              cloudCharIdRef.current = latest.id;
              setActiveCloudCharId(latest.id);
              lastCloudSaveRef.current = JSON.stringify({ ...normalized, _portraitUrl: latest.portrait_url || null });
              setCloudSaveStatus('saved');
              setCloudSaveError(null);
            }
          } else {
            // No characters in cloud yet
            lastCloudSaveRef.current = '';
          }
        } catch {
          /* keep localStorage version */
        } finally {
          isCloudSyncingRef.current = false;
        }
      } else if (!newUser) {
        isCloudSyncingRef.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Stable callbacks for modal close (prevents re-renders when using React.memo)
  const closeRollResult = useCallback(() => setRollResult(null), []);
  const closeLevelUp = useCallback(() => setShowLevelUp(false), []);
  const closeLevelDown = useCallback(() => setShowLevelDown(false), []);
  const closeHistory = useCallback(() => setShowHistory(false), []);
  const closeTemplates = useCallback(() => setShowTemplates(false), []);
  const closeAuth = useCallback(() => setShowAuth(false), []);
  const closeCloudSaves = useCallback(() => setShowCloudSaves(false), []);
  const closeSignOut = useCallback(() => setShowSignOutModal(false), []);
  const closeShareModal = useCallback(() => setShowShareModal(false), []);

  const showToast = useCallback((title: string, description: string) => {
    setToast({ title, description });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Handle shared character import from /share/[code] ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sharedImportRaw = localStorage.getItem('dnd5e_shared_import');
      if (sharedImportRaw) {
        const parsed = JSON.parse(sharedImportRaw);
        if (parsed?.char) {
          const normalized = normalizeCharacterData(parsed.char);
          setChar(normalized);
          const port = parsed.portraitUrl || null;
          setPortraitUrl(port);
          // Ensure cloud IDs are cleared so this is treated as a separate/new character
          cloudCharIdRef.current = null;
          setActiveCloudCharId(null);
          lastCloudSaveRef.current = '';
          setCloudSaveStatus('idle');
          setCloudSaveError(null);
          showToast(
            'Свиток открыт для редактирования',
            `Персонаж "${normalized.name || 'Безымянный'}" загружен из ссылки`
          );
        }
        localStorage.removeItem('dnd5e_shared_import');
      }
      if (window.location.search.includes('import=shared')) {
        const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]import=shared(&|$)/, '$1').replace(/\?$/, '');
        window.history.replaceState({}, '', cleanUrl || '/');
      }
    } catch (e) {
      console.error('[Shared Import Error]', e);
    }
  }, [showToast]);

  const handleRoll = useCallback((result: RollResult) => {
    setRollResult(result);
  }, []);

  const handleRollAttack = useCallback((atk: Attack) => {
    const match = (atk.attackBonus || '').trim().match(/^([+-]?\d+)$/);
    const modifier = match ? parseInt(match[1], 10) : 0;
    const dieResult = rollD20();
    const total = dieResult + modifier;
    handleRoll({
      dieResult,
      modifier,
      total,
      label: `Атака: ${atk.name || 'Оружие'}`,
    });
  }, [handleRoll]);

  const parseAndRollDamageFormula = useCallback((text: string): {
    success: boolean;
    total: number;
    sumDice: number;
    modifier: number;
    typeLabel: string;
    breakdown: string;
  } => {
    const trimmed = (text || '').trim();
    if (!trimmed) return { success: false, total: 0, sumDice: 0, modifier: 0, typeLabel: '', breakdown: '' };

    // Flat damage (e.g. "3 дроб." or "1 дроб.")
    const flatMatch = trimmed.match(/^(\d+)(?:\s+([а-яёa-z\.]+))?$/i);
    if (flatMatch) {
      const val = parseInt(flatMatch[1], 10);
      const type = flatMatch[2] ? ` (${flatMatch[2]})` : '';
      return {
        success: true,
        total: val,
        sumDice: val,
        modifier: 0,
        typeLabel: type,
        breakdown: `${val}`,
      };
    }

    const diceMatch = trimmed.match(/(\d+)\s*[dкDК]\s*(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (!diceMatch) {
      return { success: false, total: 0, sumDice: 0, modifier: 0, typeLabel: '', breakdown: '' };
    }

    const numDice = Math.min(50, Math.max(1, parseInt(diceMatch[1], 10)));
    const dieSides = Math.min(100, Math.max(2, parseInt(diceMatch[2], 10)));
    const sign = diceMatch[3] || '+';
    const modVal = diceMatch[4] ? parseInt(diceMatch[4], 10) : 0;
    const modifier = sign === '-' ? -modVal : modVal;

    const rolls: number[] = [];
    let sumDice = 0;
    for (let d = 0; d < numDice; d++) {
      const arr = new Uint32Array(1);
      const maxSafe = Math.floor(0xffffffff / dieSides) * dieSides;
      let val: number;
      do {
        crypto.getRandomValues(arr);
        val = arr[0];
      } while (val >= maxSafe);
      const r = (val % dieSides) + 1;
      rolls.push(r);
      sumDice += r;
    }

    const total = Math.max(0, sumDice + modifier);
    const remaining = trimmed.replace(diceMatch[0], '').replace(/[,\.]/g, '').trim();
    const typeLabel = remaining ? ` (${remaining})` : '';
    const breakdown = `${numDice}d${dieSides} [${rolls.join(', ')}]${modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}`;

    return {
      success: true,
      total,
      sumDice,
      modifier,
      typeLabel,
      breakdown,
    };
  }, []);

  const handleRollActiveAttack = useCallback((atk: ActiveAttackOption) => {
    if (atk.source === 'dual') {
      const mainBonusStr = atk.dualDetails?.mainAtkBonus || atk.attackBonus.split('/')[0] || '+0';
      const offBonusStr = atk.dualDetails?.offAtkBonus || atk.attackBonus.split('/')[1] || '+0';
      const mainMod = parseInt(mainBonusStr.trim(), 10) || 0;
      const offMod = parseInt(offBonusStr.trim(), 10) || 0;

      const dieMain = rollD20();
      const dieOff = rollD20();
      const totalMain = dieMain + mainMod;
      const totalOff = dieOff + offMod;

      handleRoll({
        dieResult: Math.max(dieMain, dieOff),
        modifier: 0,
        total: totalMain,
        customTotal: `${totalMain} / ${totalOff}`,
        label: `⚔️ Парная атака`,
        breakdown: `[${atk.dualDetails?.mainWeapon || 'Осн. рука'}]: d20 (${dieMain}) ${formatModifier(mainMod)} = ${totalMain} | [${atk.dualDetails?.offWeapon || 'Доп. рука'}]: d20 (${dieOff}) ${formatModifier(offMod)} = ${totalOff}`,
      });
      return;
    }

    const match = (atk.attackBonus || '').trim().match(/^([+-]?\d+)$/);
    const modifier = match ? parseInt(match[1], 10) : 0;
    const dieResult = rollD20();
    const total = dieResult + modifier;
    handleRoll({
      dieResult,
      modifier,
      total,
      label: `Атака: ${atk.weaponName || 'Оружие'}`,
    });
  }, [handleRoll]);

  const handleRollActiveDamage = useCallback((atk: ActiveAttackOption) => {
    if (atk.source === 'dual') {
      const mainFormula = atk.dualDetails?.mainDmg || '';
      const offFormula = atk.dualDetails?.offDmg || '';

      const mainRes = parseAndRollDamageFormula(mainFormula);
      const offRes = parseAndRollDamageFormula(offFormula);

      if (!mainRes.success || !offRes.success) {
        showToast('Бросок урона', 'Не удалось рассчитать урон для парной атаки');
        return;
      }

      const totalCombined = mainRes.total + offRes.total;
      handleRoll({
        dieResult: totalCombined,
        modifier: 0,
        total: totalCombined,
        label: `🎲 Парный урон: ${atk.dualDetails?.mainWeapon || 'Осн.'} + ${atk.dualDetails?.offWeapon || 'Доп.'}`,
        breakdown: `[${atk.dualDetails?.mainWeapon || 'Осн.'}]: ${mainRes.breakdown}${mainRes.typeLabel} = ${mainRes.total} | [${atk.dualDetails?.offWeapon || 'Доп.'}]: ${offRes.breakdown}${offRes.typeLabel} = ${offRes.total} ➔ Всего: ${totalCombined}`,
      });
      return;
    }

    const res = parseAndRollDamageFormula(atk.damageAndType);
    if (!res.success) {
      showToast('Бросок урона', 'Не удалось распознать формулу урона');
      return;
    }

    handleRoll({
      dieResult: res.sumDice,
      modifier: res.modifier,
      total: res.total,
      label: `Урон: ${atk.weaponName || 'Оружие'}${res.typeLabel}`,
      breakdown: res.breakdown,
    });
  }, [handleRoll, parseAndRollDamageFormula, showToast]);

  const handleRollDamage = useCallback((atk: Attack) => {
    const res = parseAndRollDamageFormula(atk.damageAndType || '');
    if (!res.success) {
      showToast('Бросок урона', 'Не удалось распознать формулу урона (например, 1d8+3)');
      return;
    }

    handleRoll({
      dieResult: res.sumDice,
      modifier: res.modifier,
      total: res.total,
      label: `Урон: ${atk.name || 'Оружие'}${res.typeLabel}`,
      breakdown: res.breakdown,
    });
  }, [handleRoll, parseAndRollDamageFormula, showToast]);

  const handleApplyRest = useCallback((updatedChar: CharacterData, toastTitle: string, toastDesc: string) => {
    setChar(updatedChar);
    showToast(toastTitle, toastDesc);
  }, [showToast]);

  const closeRestModal = useCallback(() => setShowRestModal(false), []);
  const closeEquipmentModal = useCallback(() => setShowEquipmentModal(false), []);

  const handleClearHistory = useCallback(() => {
    setChar(prev => ({ ...prev, levelHistory: [] }));
    showToast('История уровней', 'История прокачки очищена');
  }, [showToast]);

  const handleDeleteHistoryEntry = useCallback((index: number) => {
    setChar(prev => {
      const history = Array.isArray(prev.levelHistory) ? prev.levelHistory : [];
      return {
        ...prev,
        levelHistory: history.filter((_, i) => i !== index),
      };
    });
    showToast('История уровней', 'Запись удалена');
  }, [showToast]);

  const update = useCallback(<K extends keyof CharacterData>(key: K, value: CharacterData[K]) => {
    setChar(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAbility = useCallback((ability: AbilityName, field: 'abilityScores' | 'abilityBonuses', value: number) => {
    setChar(prev => ({ ...prev, [field]: { ...prev[field], [ability]: value } }));
  }, []);

  const updateSaveProf = useCallback((ability: AbilityName, value: boolean) => {
    setChar(prev => ({ ...prev, savingThrowProficiencies: { ...prev.savingThrowProficiencies, [ability]: value } }));
  }, []);

  const updateSkillProf = useCallback((skill: string, field: 'skillProficiencies' | 'skillExpertise', value: boolean) => {
    setChar(prev => ({ ...prev, [field]: { ...prev[field], [skill]: value } }));
  }, []);

  const handleSelectWeapon = useCallback((index: number, item: AutocompleteItem) => {
    const weapon = item.data as DndWeapon | undefined;
    if (!weapon) return;

    const strScore = char.abilityScores['СИЛ'] + (char.abilityBonuses['СИЛ'] || 0) + (char.asiBonuses['СИЛ'] || 0);
    const dexScore = char.abilityScores['ЛОВ'] + (char.abilityBonuses['ЛОВ'] || 0) + (char.asiBonuses['ЛОВ'] || 0);
    const strMod = calcModifier(strScore);
    const dexMod = calcModifier(dexScore);

    let bestMod = strMod;
    let usedAbility: AbilityName = 'СИЛ';
    if (weapon.category.includes('дальнобойное')) {
      bestMod = dexMod;
      usedAbility = 'ЛОВ';
    } else if (weapon.finesse) {
      if (dexMod >= strMod) {
        bestMod = dexMod;
        usedAbility = 'ЛОВ';
      } else {
        bestMod = strMod;
        usedAbility = 'СИЛ';
      }
    }
    const currentProf = calcProficiencyBonus(char.level);
    const bonusNum = bestMod + currentProf;
    const bonusStr = formatModifier(bonusNum);
    const modSuffix = bestMod !== 0 ? (bestMod > 0 ? `+${bestMod}` : `${bestMod}`) : '';
    const dmgStr = `${weapon.damageDice}${modSuffix} ${weapon.damageType}`;

    setChar(prev => {
      const a = [...prev.attacks];
      a[index] = {
        name: weapon.name,
        attackBonus: bonusStr,
        damageAndType: dmgStr,
        ability: usedAbility,
      };
      return { ...prev, attacks: a };
    });
  }, [char.abilityScores, char.abilityBonuses, char.asiBonuses, char.level]);

  const handleQuickAddWeapon = useCallback((weaponNameOrItem: string | AutocompleteItem) => {
    const name = typeof weaponNameOrItem === 'string' ? weaponNameOrItem.trim() : weaponNameOrItem.name;
    if (!name) return;

    const weaponDef = findWeaponByName(name);
    if (weaponDef) {
      const is2H = (weaponDef.properties || []).some(p => /двуручное|two-handed/i.test(p));
      const targetSlot: EquipmentSlotId = 'mainHand';
      const equipped: EquippedItem = {
        id: `weapon-${Date.now()}-${weaponDef.name}`,
        name: weaponDef.name,
        slot: targetSlot,
        twoHanded: is2H,
        description: `${weaponDef.damageDice} ${weaponDef.damageType}. ${(weaponDef.properties || []).join(', ')}`,
        weight: weaponDef.weight ? parseFloat(weaponDef.weight.replace(/[^\d.]/g, '')) || undefined : undefined,
      };
      setChar(prev => equipItem(prev, targetSlot, equipped));
      showToast('Оружие экипировано', `«${weaponDef.name}» экипирован в основную руку!`);
    } else {
      const newAtk: Attack = {
        name,
        attackBonus: '+0',
        damageAndType: '1d6 урона',
      };
      setChar(prev => ({
        ...prev,
        attacks: [...(prev.attacks || []), newAtk],
      }));
      showToast('Атака добавлена', `Атака «${name}» добавлена в список!`);
    }
    setAttackSearchQuery('');
  }, [showToast]);

  const effectiveTraitsList = useMemo<TraitItem[]>(() => {
    let baseList: TraitItem[] = [];
    if (char.traitsList && char.traitsList.length > 0) {
      baseList = [...char.traitsList];
    } else if (char.featuresTraits && char.featuresTraits.trim()) {
      const lines = char.featuresTraits.split('\n').filter(l => l.trim());
      baseList = lines.map((line, idx) => {
        const found = findTraitByName(line.trim());
        return {
          id: `legacy-${idx}`,
          name: line.trim(),
          source: found?.source || 'Умение',
          summary: found?.summary || '',
          description: found?.description || '',
        };
      });
    }

    const eqBonuses = calculateEquipmentBonuses(char);
    if (eqBonuses.itemTraits.length > 0) {
      return [...baseList, ...eqBonuses.itemTraits];
    }
    return baseList;
  }, [char]);

  const handleQuickAddSpell = useCallback((item: AutocompleteItem) => {
    const spell = item.data as DndSpell | undefined;
    const spellName = item.name.trim();
    if (!spellName) return;

    const matchedSpell = spell || findSpellByName(spellName);
    const level = matchedSpell ? matchedSpell.level : 0;

    // 1. Strict spell slot validation: cannot take spells higher than available slots
    if (level > 0) {
      const maxSlot = getMaxAvailableSpellSlotLevel(char);
      if (level > maxSlot) {
        showToast(
          'Недоступный круг ячеек',
          `Заклинание «${matchedSpell?.name || spellName}» (${level} ур.) требует ячейки ${level}-го уровня. У вашего персонажа доступны ячейки только до ${maxSlot || '0 (нет ячеек)'}-го уровня.`
        );
        return;
      }
    }

    const doAdd = () => {
      setChar(prev => {
        if (level === 0) {
          return {
            ...prev,
            cantrips: [...prev.cantrips, spellName],
          };
        } else {
          const s = { ...prev.spellsByLevel };
          s[level] = [...(s[level] || []), { name: spellName, prepared: true }];
          return {
            ...prev,
            spellsByLevel: s,
          };
        }
      });

      const lvlLabel = level === 0 ? 'Заговоры (0 ур.)' : `Заклинания ${level} ур.`;
      setSpellAddSuccess(`✨ «${spellName}» добавлено в ${lvlLabel}`);
      setTimeout(() => setSpellAddSuccess(null), 3000);
      setSpellSearchQuery('');
    };

    if (matchedSpell) {
      const check = isSpellAllowedForCharacter(char, matchedSpell);
      if (!check.allowed) {
        setPendingForeignSpell({
          spell: matchedSpell,
          level,
          callback: doAdd,
        });
        return;
      }
    }

    doAdd();
  }, [char, showToast]);

  const updateTraitItem = useCallback((index: number, field: keyof TraitItem, value: string) => {
    setChar(prev => {
      const currentList = prev.traitsList && prev.traitsList.length > 0
        ? [...prev.traitsList]
        : (prev.featuresTraits ? prev.featuresTraits.split('\n').filter(l => l.trim()).map((l, i) => {
            const f = findTraitByName(l.trim());
            return { id: `t-${i}`, name: l.trim(), source: f?.source || 'Умение', summary: f?.summary || '', description: f?.description || '' };
          }) : []);

      if (currentList[index]) {
        currentList[index] = { ...currentList[index], [field]: value };
        if (field === 'name') {
          const matched = findTraitByName(value);
          if (matched) {
            currentList[index].source = matched.source;
            currentList[index].summary = matched.summary;
            currentList[index].description = matched.description;
          }
        }
      }
      const syncText = currentList.map(t => t.name).filter(Boolean).join('\n');
      return { ...prev, traitsList: currentList, featuresTraits: syncText };
    });
  }, []);

  const addTraitItem = useCallback((traitData?: DndTrait, customName?: string) => {
    const name = (traitData?.name || customName || '').trim();
    const matched = traitData || (name ? findTraitByName(name) : undefined);

    setChar(prev => {
      const currentList = prev.traitsList && prev.traitsList.length > 0
        ? [...prev.traitsList]
        : (prev.featuresTraits ? prev.featuresTraits.split('\n').filter(l => l.trim()).map((l, i) => {
            const f = findTraitByName(l.trim());
            return { id: `t-${i}`, name: l.trim(), source: f?.source || 'Умение', summary: f?.summary || '', description: f?.description || '' };
          }) : []);

      const newItem: TraitItem = {
        id: `trait-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: matched?.name || name || '',
        source: matched?.source || 'Умение',
        summary: matched?.summary || '',
        description: matched?.description || '',
      };

      const updated = [...currentList, newItem];
      const syncText = updated.map(t => t.name).filter(Boolean).join('\n');
      return { ...prev, traitsList: updated, featuresTraits: syncText };
    });

    if (name) {
      setTraitAddSuccess(`✨ Умение «${name}» добавлено`);
      setTimeout(() => setTraitAddSuccess(null), 2500);
    }
    setTraitSearchQuery('');
  }, []);

  const removeTraitItem = useCallback((index: number) => {
    setChar(prev => {
      const currentList = prev.traitsList && prev.traitsList.length > 0
        ? [...prev.traitsList]
        : (prev.featuresTraits ? prev.featuresTraits.split('\n').filter(l => l.trim()).map((l, i) => ({ id: `t-${i}`, name: l, source: 'Умение', summary: '', description: '' })) : []);

      const updated = currentList.filter((_, i) => i !== index);
      const syncText = updated.map(t => t.name).filter(Boolean).join('\n');
      return { ...prev, traitsList: updated, featuresTraits: syncText };
    });
  }, []);

  const updateAttack = useCallback((index: number, field: keyof Attack, value: string) => {
    setChar(prev => { const a = [...prev.attacks]; a[index] = { ...a[index], [field]: value }; return { ...prev, attacks: a }; });
  }, []);
  const addAttack = useCallback(() => {
    setChar(prev => ({ ...prev, attacks: [...prev.attacks, { name: '', attackBonus: '', damageAndType: '' }] }));
  }, []);
  const removeAttack = useCallback((i: number) => {
    setChar(prev => ({ ...prev, attacks: prev.attacks.filter((_, j) => j !== i) }));
  }, []);

  const updateDeathSave = useCallback((field: 'deathSaveSuccesses' | 'deathSaveFailures', delta: number) => {
    setChar(prev => ({ ...prev, [field]: Math.max(0, Math.min(3, prev[field] + delta)) }));
  }, []);

  const updateCantrip = useCallback((i: number, v: string) => {
    setChar(prev => { const c = [...prev.cantrips]; c[i] = v; return { ...prev, cantrips: c }; });
  }, []);
  const addCantrip = useCallback(() => {
    setChar(prev => ({ ...prev, cantrips: [...prev.cantrips, ''] }));
  }, []);
  const removeCantrip = useCallback((i: number) => {
    setChar(prev => ({ ...prev, cantrips: prev.cantrips.filter((_, j) => j !== i) }));
  }, []);

  const updateSpellSlot = useCallback((level: number, field: 'totalSlots' | 'expendedSlots', value: number) => {
    setChar(prev => ({ ...prev, spellSlots: { ...prev.spellSlots, [level]: { ...prev.spellSlots[level] || { totalSlots: 0, expendedSlots: 0 }, [field]: value } } }));
  }, []);

  const updateSpellEntry = useCallback((level: number, index: number, field: keyof SpellEntry, value: any) => {
    setChar(prev => {
      const s = { ...prev.spellsByLevel };
      const arr = [...(s[level] || [])];
      arr[index] = { ...arr[index], [field]: value };
      s[level] = arr;
      return { ...prev, spellsByLevel: s };
    });
  }, []);
  const addSpell = useCallback((level: number) => {
    setChar(prev => {
      const s = { ...prev.spellsByLevel };
      s[level] = [...(s[level] || []), { name: '', prepared: false }];
      return { ...prev, spellsByLevel: s };
    });
  }, []);
  const removeSpell = useCallback((level: number, index: number) => {
    setChar(prev => {
      const s = { ...prev.spellsByLevel };
      s[level] = s[level].filter((_, i) => i !== index);
      return { ...prev, spellsByLevel: s };
    });
  }, []);

  const profBonus = useMemo(() => calcProficiencyBonus(char.level), [char.level]);
  const carryCap = useMemo(() => getCarryingCapacity(char), [char]);
  const jumpDist = useMemo(() => getJumpDistances(char), [char]);
  const availableArmorModes = useMemo(() => getAvailableArmorModes(char), [char]);
  const calculatedAC = useMemo(() => getCalculatedAC(char), [char]);
  const activeAC = useMemo(() => getAC(char), [char]);
  const activeAttacks = useMemo(() => getActiveCharacterAttacks(char), [char]);
  const displayedAttacks = useMemo(() => {
    if (!attackSearchQuery.trim()) return activeAttacks;
    const q = attackSearchQuery.toLowerCase().trim();
    return activeAttacks.filter(a =>
      a.weaponName.toLowerCase().includes(q) ||
      (a.notes && a.notes.toLowerCase().includes(q))
    );
  }, [activeAttacks, attackSearchQuery]);

  const compClass = useMemo(() => {
    if (!char.className) return undefined;
    return DND_COMPENDIUM_CLASSES.find(c =>
      char.className.toLowerCase().includes(c.name.toLowerCase()) ||
      char.className.toLowerCase().includes(c.nameEn.toLowerCase())
    );
  }, [char.className]);

  const baseAbilitySum = useMemo(() => {
    return ABILITY_NAMES.reduce((sum, abbr) => sum + (char.abilityScores[abbr] || 0), 0);
  }, [char.abilityScores]);

  const abilityWarnings = useMemo(() => {
    const warnings: string[] = [];
    const maxAllowed = (char.className === 'Варвар' && char.level >= 20) ? 24 : 20;
    for (const abbr of ABILITY_NAMES) {
      const total = getTotalScore(char, abbr);
      if (total > maxAllowed) {
        warnings.push(`${abbr} (${total}) превышает максимум ${maxAllowed}`);
      }
    }
    if (baseAbilitySum > 75) {
      warnings.push(`Сумма базы (${baseAbilitySum}) превышает стандарт D&D (72–75)`);
    }
    return warnings;
  }, [char, baseAbilitySum]);

  const handleResetToStandardScores = useCallback(() => {
    const scores = compClass?.recommendedScores || { 'СИЛ': 15, 'ТЕЛ': 14, 'ЛОВ': 13, 'МДР': 12, 'ХАР': 10, 'ИНТ': 8 };
    setChar(prev => ({
      ...prev,
      abilityScores: { ...scores }
    }));
    showToast('Характеристики', `Установлен стандартный набор (15, 14, 13, 12, 10, 8) для ${compClass?.name || 'класса'}.`);
  }, [compClass, showToast]);

  // ── Level Up ──
  const handleLevelUp = useCallback((entry: LevelUpEntry) => {
    setChar(prev => {
      const newHP = (prev.hpMax || 0) + entry.hpGained;
      const newAsi = { ...prev.asiBonuses };
      if (entry.asiAbilities) {
        newAsi[entry.asiAbilities[0]] = (newAsi[entry.asiAbilities[0]] || 0) + 1;
        newAsi[entry.asiAbilities[1]] = (newAsi[entry.asiAbilities[1]] || 0) + 1;
      }
      // Update hit dice count (preserve user's notation: d or к)
      let newHitDice = prev.hitDice;
      if (newHitDice) {
        const dieSize = getHitDieSize(newHitDice);
        const notation = getHitDiceNotation(newHitDice);
        newHitDice = `${prev.level + 1}${notation}${dieSize}`;
      }

      // Add traits to traitsList
      let updatedTraits = [...(prev.traitsList || [])];

      // If an invocation was swapped out, remove it from traits
      if (entry.swappedOutInvocation) {
        const swapName = entry.swappedOutInvocation.trim().toLowerCase();
        updatedTraits = updatedTraits.filter(t => !t.name.toLowerCase().includes(swapName));
      }

      if (entry.addedTraits && entry.addedTraits.length > 0) {
        updatedTraits = [...updatedTraits, ...entry.addedTraits];
      }

      // Set subclass if chosen
      let updatedSubclass = prev.subclass;
      if (entry.newSubclass) {
        updatedSubclass = entry.newSubclass;
      }

      // Update spell slots if caster
      let updatedSpellSlots = { ...prev.spellSlots };
      const isWarlockClass = normalizeClassName(prev.className) === 'Колдун';
      if (entry.spellSlotsGained) {
        if (isWarlockClass) {
          // Warlock pact magic slots all upgrade together into a single circle
          updatedSpellSlots = {};
          for (const [lvlStr, count] of Object.entries(entry.spellSlotsGained)) {
            const l = Number(lvlStr);
            updatedSpellSlots[l] = {
              totalSlots: count,
              expendedSlots: 0,
            };
          }
        } else {
          for (const [lvlStr, count] of Object.entries(entry.spellSlotsGained)) {
            const l = Number(lvlStr);
            updatedSpellSlots[l] = {
              totalSlots: count,
              expendedSlots: prev.spellSlots?.[l]?.expendedSlots || 0,
            };
          }
        }
      }

      // Add notes to features
      let newFeatures = prev.featuresTraits;
      if (entry.notes) {
        newFeatures = newFeatures ? newFeatures + '\n' + entry.notes : entry.notes;
      }
      if (entry.selectedFeat) {
        const featNote = `[Черта ${entry.level} ур.]: ${entry.selectedFeat}`;
        newFeatures = newFeatures ? newFeatures + '\n' + featNote : featNote;
      }

      // Add cantrips
      const addCantrips = (entry.newCantrips || []).filter(c => c.trim());
      const updatedCantrips = [...prev.cantrips, ...addCantrips];
      // Add spells
      const updatedSpells = { ...prev.spellsByLevel };
      for (const spell of (entry.newSpells || [])) {
        if (!spell.name.trim()) continue;
        const lvl = spell.level;
        const existing = updatedSpells[lvl] || [];
        if (!existing.some(s => s.name.toLowerCase() === spell.name.toLowerCase())) {
          updatedSpells[lvl] = [...existing, { name: spell.name, prepared: spell.prepared }];
        }
      }
      // Add saving throw proficiencies
      const updatedSaveProfs = { ...prev.savingThrowProficiencies };
      for (const ability of (entry.newSavingThrowProfs || [])) {
        updatedSaveProfs[ability] = true;
      }
      // Add skill proficiencies
      const updatedSkillProfs = { ...prev.skillProficiencies };
      for (const skill of (entry.newSkillProfs || [])) {
        updatedSkillProfs[skill] = true;
      }
      const updatedSkillExpertise = { ...prev.skillExpertise };
      for (const skill of (entry.newSkillExpertise || [])) {
        updatedSkillExpertise[skill] = true;
      }
      // Add attacks
      const addAttacks = (entry.newAttacks || []).filter(a => a.name.trim());
      const updatedAttacks = [...prev.attacks, ...addAttacks];
      // Add proficiencies text
      let updatedProfText = prev.otherProficienciesLanguages;
      if (entry.newProficienciesText) {
        updatedProfText = updatedProfText ? updatedProfText + '\n' + entry.newProficienciesText : entry.newProficienciesText;
      }
      // Add equipment text
      let updatedEquipText = prev.equipment;
      if (entry.newEquipmentText) {
        updatedEquipText = updatedEquipText ? updatedEquipText + '\n' + entry.newEquipmentText : entry.newEquipmentText;
      }

      // Update armor class if Defense fighting style is selected and armor is equipped
      let updatedArmorClass = prev.armorClass;
      const isDefenseStyle =
        entry.selectedFightingStyle === 'defense' ||
        (entry.addedTraits || []).some(t => t.name.toLowerCase().includes('оборона'));

      if (isDefenseStyle && prev.equippedArmor) {
        const dexScore = (prev.abilityScores['ЛОВ'] || 10) + (newAsi['ЛОВ'] || 0) + (prev.abilityBonuses?.['ЛОВ'] || 0);
        const conScore = (prev.abilityScores['ТЕЛ'] || 10) + (newAsi['ТЕЛ'] || 0) + (prev.abilityBonuses?.['ТЕЛ'] || 0);
        const wisScore = (prev.abilityScores['МДР'] || 10) + (newAsi['МДР'] || 0) + (prev.abilityBonuses?.['МДР'] || 0);
        const dexMod = calcModifier(dexScore);
        const conMod = calcModifier(conScore);
        const wisMod = calcModifier(wisScore);
        const isDraconic = updatedTraits.some(t =>
          t.name.toLowerCase().includes('драконья устойчивость') ||
          t.name.toLowerCase().includes('draconic resilience')
        );
        updatedArmorClass = calculateWizardAC(
          prev.className,
          prev.equippedArmor,
          !!prev.equippedShield,
          dexMod,
          conMod,
          wisMod,
          {
            hasDefenseFightingStyle: true,
            isDraconicSorcerer: isDraconic,
          }
        );
      }

      return {
        ...prev,
        level: entry.level,
        armorClass: updatedArmorClass,
        hpMax: newHP,
        hpCurrent: newHP,
        hitDice: newHitDice,
        subclass: updatedSubclass,
        asiBonuses: newAsi,
        traitsList: updatedTraits,
        spellSlots: updatedSpellSlots,
        featuresTraits: newFeatures,
        cantrips: updatedCantrips,
        spellsByLevel: updatedSpells,
        savingThrowProficiencies: updatedSaveProfs,
        skillProficiencies: updatedSkillProfs,
        skillExpertise: updatedSkillExpertise,
        attacks: updatedAttacks,
        otherProficienciesLanguages: updatedProfText,
        equipment: updatedEquipText,
        levelHistory: [...(Array.isArray(prev.levelHistory) ? prev.levelHistory : []), entry],
      };
    });

    showToast(`${entry.level} уровень!`, `Персонаж успешно повышен до ${entry.level}-го уровня.`);
    setShowLevelUp(false);
  }, [showToast]);

  // ── Level Down ──
  const handleLevelDown = useCallback(() => {
    setChar(prev => {
      const newLevel = Math.max(1, prev.level - 1);
      const history = Array.isArray(prev.levelHistory) ? prev.levelHistory : [];
      const last = history[history.length - 1];
      let newHP = prev.hpMax || 0;
      if (last) {
        newHP = Math.max(1, newHP - last.hpGained);
      } else {
        const avg = (prev.hitDice ? getHitDieAverage(prev.hitDice) : 5) + getModifier(prev, 'ТЕЛ');
        newHP = Math.max(1, newHP - Math.max(1, avg));
      }
      const newAsi = { ...prev.asiBonuses };
      if (last?.asiAbilities && last.asiAbilities.length > 0) {
        newAsi[last.asiAbilities[0]] = Math.max(0, (newAsi[last.asiAbilities[0]] || 0) - 1);
        if (last.asiAbilities[1]) {
          newAsi[last.asiAbilities[1]] = Math.max(0, (newAsi[last.asiAbilities[1]] || 0) - 1);
        }
      }
      let newHitDice = prev.hitDice;
      if (newHitDice) {
        const dieSize = getHitDieSize(newHitDice);
        const notation = getHitDiceNotation(newHitDice);
        newHitDice = `${newLevel}${notation}${dieSize}`;
      }

      // Revert added traits
      let updatedTraits = [...(prev.traitsList || [])];
      if (last?.addedTraits && last.addedTraits.length > 0) {
        const addedIds = new Set(last.addedTraits.map(t => t.id));
        const addedNames = new Set(last.addedTraits.map(t => t.name.toLowerCase()));
        updatedTraits = updatedTraits.filter(t => !addedIds.has(t.id) && !addedNames.has(t.name.toLowerCase()));
      }

      // If an invocation was swapped out at this level, restore the original one
      if (last?.swappedOutInvocation) {
        const inv = WARLOCK_INVOCATIONS.find(opt => opt.name.toLowerCase() === last.swappedOutInvocation?.toLowerCase());
        if (inv) {
          updatedTraits.push({
            id: `invocation-${inv.id}`,
            name: `Таинственное воззвание: ${inv.name}`,
            source: `Колдун (${newLevel} ур.)`,
            summary: inv.description,
            description: `${inv.name}${inv.prerequisiteDescription ? ` [${inv.prerequisiteDescription}]` : ''}: ${inv.description}`,
          });
        }
      }

      // Revert subclass if set at this level
      let updatedSubclass = prev.subclass;
      if (last?.newSubclass && prev.subclass === last.newSubclass) {
        updatedSubclass = '';
      }

      // Revert spell slots
      const sub = (prev.subclass || '').toLowerCase();
      const isThirdCaster = sub.includes('мистический рыцарь') || sub.includes('eldritch knight') || sub.includes('мистический ловкач') || sub.includes('arcane trickster');
      const prevSlots = isThirdCaster ? getThirdCasterSpellSlots(newLevel) : getSpellSlotsForClassLevel(prev.className, newLevel);
      let updatedSpellSlots = { ...prev.spellSlots };
      if (prevSlots) {
        for (let l = 1; l <= 9; l++) {
          if (prevSlots[l]) {
            updatedSpellSlots[l] = {
              totalSlots: prevSlots[l],
              expendedSlots: Math.min(prevSlots[l], prev.spellSlots?.[l]?.expendedSlots || 0),
            };
          } else {
            delete updatedSpellSlots[l];
          }
        }
      } else if (isThirdCaster || last?.newSubclass) {
        for (let l = 1; l <= 9; l++) {
          delete updatedSpellSlots[l];
        }
      }

      // Remove notes from features
      let newFeatures = prev.featuresTraits;
      if (last?.notes) {
        newFeatures = newFeatures.replace(last.notes, '').replace(/\n{2,}/g, '\n').trim();
      }
      if (last?.selectedFeat) {
        const featNote = `[Черта ${prev.level} ур.]: ${last.selectedFeat}`;
        newFeatures = newFeatures.replace(featNote, '').replace(/\n{2,}/g, '\n').trim();
      }

      // Remove cantrips added at this level
      let updatedCantrips = [...prev.cantrips];
      if (last?.newCantrips) {
        const removeSet = new Set(last.newCantrips);
        updatedCantrips = updatedCantrips.filter(c => !removeSet.has(c));
      }
      // Remove spells added at this level
      const updatedSpells = { ...prev.spellsByLevel };
      if (last?.newSpells) {
        for (const spell of last.newSpells) {
          const lvl = spell.level;
          if (updatedSpells[lvl]) {
            updatedSpells[lvl] = updatedSpells[lvl].filter(s => s.name !== spell.name);
          }
        }
      }
      // Remove saving throw proficiencies
      const updatedSaveProfs = { ...prev.savingThrowProficiencies };
      if (last?.newSavingThrowProfs) {
        for (const ability of last.newSavingThrowProfs) {
          updatedSaveProfs[ability] = false;
        }
      }
      // Remove skill proficiencies
      const updatedSkillProfs = { ...prev.skillProficiencies };
      if (last?.newSkillProfs) {
        for (const skill of last.newSkillProfs) {
          updatedSkillProfs[skill] = false;
        }
      }
      const updatedSkillExpertise = { ...prev.skillExpertise };
      if (last?.newSkillExpertise) {
        for (const skill of last.newSkillExpertise) {
          updatedSkillExpertise[skill] = false;
        }
      }
      // Remove attacks added at this level
      let updatedAttacks = [...prev.attacks];
      if (last?.newAttacks) {
        const removeNames = new Set(last.newAttacks.map(a => a.name));
        updatedAttacks = updatedAttacks.filter(a => !removeNames.has(a.name));
      }
      // Remove proficiencies text
      let updatedProfText = prev.otherProficienciesLanguages;
      if (last?.newProficienciesText) {
        updatedProfText = updatedProfText.replace(last.newProficienciesText, '').replace(/\n{2,}/g, '\n').trim();
      }
      // Remove equipment text
      let updatedEquipText = prev.equipment;
      if (last?.newEquipmentText) {
        updatedEquipText = updatedEquipText.replace(last.newEquipmentText, '').replace(/\n{2,}/g, '\n').trim();
      }

      // Revert AC if Defense fighting style was chosen at this level
      let updatedArmorClass = prev.armorClass;
      const lastHadDefense =
        last?.selectedFightingStyle === 'defense' ||
        (last?.addedTraits || []).some(t => t.name.toLowerCase().includes('оборона'));
      if (lastHadDefense && prev.equippedArmor && typeof prev.armorClass === 'number') {
        const dexScore = (prev.abilityScores['ЛОВ'] || 10) + (newAsi['ЛОВ'] || 0) + (prev.abilityBonuses?.['ЛОВ'] || 0);
        const conScore = (prev.abilityScores['ТЕЛ'] || 10) + (newAsi['ТЕЛ'] || 0) + (prev.abilityBonuses?.['ТЕЛ'] || 0);
        const wisScore = (prev.abilityScores['МДР'] || 10) + (newAsi['МДР'] || 0) + (prev.abilityBonuses?.['МДР'] || 0);
        const dexMod = calcModifier(dexScore);
        const conMod = calcModifier(conScore);
        const wisMod = calcModifier(wisScore);
        const isDraconic = updatedTraits.some(t =>
          t.name.toLowerCase().includes('драконья устойчивость') ||
          t.name.toLowerCase().includes('draconic resilience')
        );
        updatedArmorClass = calculateWizardAC(
          prev.className,
          prev.equippedArmor,
          !!prev.equippedShield,
          dexMod,
          conMod,
          wisMod,
          {
            hasDefenseFightingStyle: false,
            isDraconicSorcerer: isDraconic,
          }
        );
      }

      return {
        ...prev,
        level: newLevel,
        armorClass: updatedArmorClass,
        hpMax: newHP,
        hpCurrent: Math.min(prev.hpCurrent, newHP),
        hitDice: newHitDice,
        subclass: updatedSubclass,
        asiBonuses: newAsi,
        traitsList: updatedTraits,
        spellSlots: updatedSpellSlots,
        featuresTraits: newFeatures,
        cantrips: updatedCantrips,
        spellsByLevel: updatedSpells,
        savingThrowProficiencies: updatedSaveProfs,
        skillProficiencies: updatedSkillProfs,
        skillExpertise: updatedSkillExpertise,
        attacks: updatedAttacks,
        otherProficienciesLanguages: updatedProfText,
        equipment: updatedEquipText,
        levelHistory: history.slice(0, -1),
      };
    });
    setShowLevelDown(false);
    showToast('Откат', `Уровень ${char.level - 1}`);
  }, [char.level, showToast]);

  // ── Export ──
  const handleExport = useCallback(async () => {
    try {
      const r = await fetch('/api/export-docx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...char, _portraitUrl: portraitUrl }) });
      if (!r.ok) throw new Error('Ошибка');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `DnD5e_${char.name || 'Персонаж'}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Экспорт', 'DOCX сохранён');
    } catch (err: any) { showToast('Ошибка', err.message); }
  }, [char, portraitUrl, showToast]);

  const handleExportPdf = useCallback(async () => {
    setIsExportingPdf(true);
    try {
      showToast('Генерация PDF', 'Заполняем интерактивный бланк D&D 5e…');
      const r = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(char),
      });
      if (!r.ok) {
        const errJson = await r.json().catch(() => ({}));
        throw new Error(errJson?.error || 'Сбой формирования PDF');
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cleanName = (char.name || 'Персонаж').replace(/[\\/:*?"<>|]/g, '_');
      const className = char.className || 'Герой';
      const level = char.level || 1;
      a.href = url;
      a.download = `DnD5e_${cleanName}_${className}${level}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Печать PDF', 'Интерактивный бланк (5 стр.) скачан');
    } catch (err: any) {
      console.error('PDF export error:', err);
      showToast('Ошибка PDF', err.message || 'Не удалось сформировать PDF');
    } finally {
      setIsExportingPdf(false);
    }
  }, [char, showToast]);

  const handleLoadExample = useCallback((type: 'warrior' | 'wizard') => {
    setChar(type === 'warrior' ? createExampleWarrior() : createExampleWizard());
    showToast('Загружено', type === 'warrior' ? 'Воин 5 ур.' : 'Волшебник 5 ур.');
  }, [showToast]);

  const handleReset = useCallback(() => {
    setChar(createDefaultCharacter());
    setPortraitUrl(null);
    localStorage.removeItem('dnd5e_portrait');
    cloudCharIdRef.current = null;
    setActiveCloudCharId(null);
    lastCloudSaveRef.current = '';
    showToast('Сброшено', 'Данные очищены');
  }, [showToast]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = CLASS_TEMPLATES.find(t => t.id === templateId);
    setChar(applyClassTemplate(templateId));
    setShowTemplates(false);
    showToast(`${template?.emoji || ''} ${template?.name || ''}`, 'Шаблон применён — 1 уровень');
  }, [showToast]);

  const handleSelectClass = useCallback((cls: CompendiumClass, applyScores?: boolean) => {
    setShowClassModal(false);
    if (char.level > 1) {
      return;
    }
    // Level 1: class selection
    setChar(prev => {
      const updated = { ...prev };
      updated.className = cls.name;
      updated.hitDice = `1d${cls.hitDieSize}`;
      const newSaves = { 'СИЛ': false, 'ЛОВ': false, 'ТЕЛ': false, 'ИНТ': false, 'МДР': false, 'ХАР': false };
      for (const prof of cls.savingThrowProfs) {
        newSaves[prof] = true;
      }
      updated.savingThrowProficiencies = newSaves;
      if (cls.spellcasting?.isCaster) {
        updated.spellcastingClass = cls.name;
        updated.spellcastingAbility = cls.spellcasting.ability || '';
      }
      if (applyScores && cls.recommendedScores) {
        updated.abilityScores = { ...cls.recommendedScores };
      }
      if (prev.className !== cls.name) {
        updated.subclass = '';
      }
      return updated;
    });
    showToast(cls.name, `Класс «${cls.name}» выбран! Кость хитов: 1d${cls.hitDieSize}.`);

    // If subclass is chosen at level 1 (Cleric, Warlock, Sorcerer), trigger subclass modal immediately
    if (getClassSubclassLevel(cls.name) === 1) {
      setShowSubclassModal(true);
    }
  }, [char.level, showToast]);

  const handleSelectRace = useCallback((race: CompendiumRace, subrace?: CompendiumSubrace) => {
    setShowRaceModal(false);
    if (char.level > 1) {
      return;
    }
    // Level 1: free race selection
    setChar(prev => applyRaceTemplate(prev, race, subrace));
    showToast(race.name, `Раса ${race.name}${subrace ? ` (${subrace.name})` : ''} применена!`);
  }, [char.level, showToast]);

  const handleSelectSubclass = useCallback((subclass: CompendiumSubclass) => {
    setChar(prev => {
      const updated = { ...prev, subclass: subclass.name };
      const existingNames = new Set((updated.traitsList || []).map(t => t.name.toLowerCase()));
      const newItems: TraitItem[] = subclass.features
        .filter(f => f.level <= prev.level && !existingNames.has(f.name.toLowerCase()))
        .map(f => ({
          id: `subclass-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: f.name,
          source: `Подкласс: ${subclass.name} (${f.level} ур.)`,
          summary: f.name,
          description: f.description,
        }));
      if (newItems.length > 0) {
        updated.traitsList = [...(updated.traitsList || []), ...newItems];
      }
      return updated;
    });
    setShowSubclassModal(false);
    showToast(subclass.name, `Выбран подкласс «${subclass.name}» (${subclass.nameEn})`);
  }, [showToast]);

  const handleEquipArmor = useCallback((armorName: string) => {
    setChar(prev => ({
      ...prev,
      equippedArmor: armorName === prev.equippedArmor ? '' : armorName,
      armorClass: null,
    }));
    const label = !armorName || armorName === ''
      ? 'Доспех снят (Авторасчёт)'
      : armorName.startsWith('unarmored:')
      ? 'Режим защиты обновлён'
      : `Экипирован: ${armorName}`;
    showToast('Защита', label);
  }, [showToast]);

  const handleToggleShield = useCallback((hasShield: boolean) => {
    setChar(prev => ({
      ...prev,
      equippedShield: hasShield,
      armorClass: null,
    }));
    showToast('Щит', hasShield ? 'Щит экипирован (+2 КД)' : 'Щит убран');
  }, [showToast]);

  // ── Auth / Cloud handlers ──
  const handleAuth = useCallback(async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const redirectUrl = `${window.location.origin}/api/auth/callback`;
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        setAuthError('Проверьте почту для подтверждения!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setShowAuth(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка авторизации');
    } finally {
      setAuthLoading(false);
    }
  }, [supabase, authEmail, authPassword, isSignUp]);

  const handleGoogleAuth = useCallback(async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Ошибка авторизации');
      setAuthLoading(false);
    }
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    try {
      // Sign out from Supabase client
      await supabase.auth.signOut({ scope: 'global' });
      // Also call server-side signout to clear cookies
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (err) {
      console.error('Sign out error:', err);
    }
    // Force clear state regardless of API result
    setUser(null);
    setPortraitUrl(null);
    setCloudCharacters([]);
    cloudCharIdRef.current = null;
    setActiveCloudCharId(null);
    lastCloudSaveRef.current = '';
  }, [supabase]);

  const handleConfirmSignOut = useCallback(async () => {
    setShowSignOutModal(false);
    await handleSignOut();
    showToast('Выход', 'Вы успешно вышли из аккаунта');
  }, [handleSignOut, showToast]);

  const handleSwitchAccount = useCallback(async () => {
    setShowSignOutModal(false);
    await handleSignOut();
    setShowAuth(true);
  }, [handleSignOut]);

  const handlePortraitUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Ошибка', 'Выберите файл изображения');
      return;
    }

    // If user is logged in, upload to Supabase Storage
    if (user) {
      if (file.size > 500 * 1024) {
        showToast('Ошибка', 'Файл слишком большой (макс. 500 КБ)');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        const res = await fetch('/api/upload-portrait', { method: 'POST', headers, body: formData });
        const data = await res.json();
        if (data.url) {
          setPortraitUrl(data.url);
          showToast('Портрет', 'Изображение загружено');
        } else {
          showToast('Ошибка', data.error || 'Не удалось загрузить');
        }
      } catch {
        showToast('Ошибка', 'Не удалось загрузить изображение');
      }
    } else {
      // Offline / unauthenticated mode: read as Base64 Data URL (limit 1MB)
      if (file.size > 1024 * 1024) {
        showToast('Ошибка', 'Файл слишком большой (макс. 1 МБ)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          setPortraitUrl(dataUrl);
          showToast('Портрет', 'Изображение сохранено');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [user, supabase, showToast]);

  const handleCloudSave = useCallback(async () => {
    if (!user) { showToast('Ошибка', 'Войдите в аккаунт'); return; }
    setCloudSaveStatus('saving');
    const res = await saveToCloud();
    if (res.ok) {
      showToast('Сохранено в облако', `"${char.name || 'Безымянный'}" сохранён в базу данных`);
    } else {
      showToast('Ошибка сохранения', res.error || 'Не удалось сохранить в облако');
    }
  }, [user, saveToCloud, char.name, showToast]);

  const handleSaveAsNew = useCallback(async () => {
    if (!user) { showToast('Ошибка', 'Войдите в аккаунт'); return; }
    setCloudSaveStatus('saving');
    const res = await saveToCloud(true);
    if (res.ok) {
      showToast('Новая копия создана', `"${char.name || 'Безымянный'}" сохранён как отдельный персонаж`);
    } else {
      showToast('Ошибка сохранения', res.error || 'Не удалось создать копию');
    }
  }, [user, saveToCloud, char.name, showToast]);

  const handleCloudLoad = useCallback(async () => {
    if (!user) {
      setShowCloudSaves(true);
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/characters', { headers });
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error('[Supabase Load Error]', res.status, data.error);
        showToast('Ошибка базы данных', data.error || 'Не удалось загрузить персонажей');
      } else if (data.characters) {
        setCloudCharacters(data.characters);
      }
      setShowCloudSaves(true);
    } catch (err: any) {
      console.error('[Supabase Load Network Error]', err);
      setShowCloudSaves(true);
      showToast('Внимание', 'Не удалось связаться с облаком');
    }
  }, [user, getAuthHeaders, showToast]);

  const loadCloudCharacter = useCallback(async (cloudChar: any) => {
    if (cloudChar.data) {
      const normalized = normalizeCharacterData(cloudChar.data);
      setChar(normalized);
      if (cloudChar.portrait_url) setPortraitUrl(cloudChar.portrait_url);
      else setPortraitUrl(null);
      // Remember cloud character ID for auto-save if real cloud ID
      if (cloudChar.id && !cloudChar.isLocal && cloudChar.id !== 'local-active') {
        cloudCharIdRef.current = cloudChar.id;
        setActiveCloudCharId(cloudChar.id);
        // Reset dedup tracker with the fresh snapshot
        lastCloudSaveRef.current = JSON.stringify({ ...normalized, _portraitUrl: cloudChar.portrait_url || null });
        setCloudSaveStatus('saved');
        setCloudSaveError(null);
      } else {
        cloudCharIdRef.current = null;
        setActiveCloudCharId(null);
        lastCloudSaveRef.current = '';
        setCloudSaveStatus('idle');
        setCloudSaveError(null);
      }
      setShowCloudSaves(false);
      showToast('Загружено', `"${cloudChar.name || normalized.name}" загружен`);
    }
  }, [showToast]);

  const deleteCloudCharacter = useCallback(async (id: string) => {
    if (id === 'local-active') {
      handleReset();
      setShowCloudSaves(false);
      showToast('Очищено', 'Локальный лист сброшен');
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/characters', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        showToast('Ошибка удаления', data.error || 'Не удалось удалить');
        return;
      }
      setCloudCharacters(prev => prev.filter((c: any) => c.id !== id));
      if (cloudCharIdRef.current === id) {
        cloudCharIdRef.current = null;
        setActiveCloudCharId(null);
        lastCloudSaveRef.current = '';
      }
      showToast('Удалено', 'Персонаж удалён из облака');
    } catch {
      showToast('Ошибка', 'Не удалось удалить');
    }
  }, [handleReset, getAuthHeaders, showToast]);

  const handleShareCharacter = useCallback(async (targetChar: any) => {
    try {
      const charData = targetChar.data || targetChar;
      const charName = targetChar.name || charData?.name || 'Безымянный';
      const charId = targetChar.id && !targetChar.isLocal && targetChar.id !== 'local-active' ? targetChar.id : undefined;
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: charId, name: charName, data: charData, expiresInDays: 30 }),
      });
      const payload = await res.json();
      if (!res.ok) {
        showToast('Ошибка', payload?.error || 'Не удалось создать ссылку');
        return;
      }
      const { code } = payload;
      try {
        await navigator.clipboard.writeText(code);
        showToast('Код скопирован', `${code} — вставьте его в AI Dungeon Master`);
      } catch {
        showToast('Код для импорта', code);
      }
    } catch (err: any) {
      showToast('Ошибка', err?.message || 'Сеть недоступна');
    }
  }, [showToast]);

  const handleCreateNewCharacter = useCallback(() => {
    handleReset();
    setShowCloudSaves(false);
    showToast('Новый герой', 'Создан новый пустой лист персонажа');
  }, [handleReset, showToast]);

  const handleWizardComplete = useCallback((newChar: CharacterData) => {
    setChar(newChar);
    // CRITICAL: Reset cloud character ID so this new character doesn't overwrite a previous character!
    cloudCharIdRef.current = null;
    setActiveCloudCharId(null);
    lastCloudSaveRef.current = '';
    setCloudSaveStatus('idle');
    setCloudSaveError(null);
    setShowCreationWizard(false);
    setActiveTab('page1');
    showToast(
      'Персонаж успешно создан!',
      `Добро пожаловать в игру, ${newChar.name || 'Герой'}! Все параметры, расовые и классовые особенности занесены в лист.`
    );
  }, [showToast]);

  const handleManualCreate = useCallback(() => {
    handleReset();
    setShowCreateChoiceModal(false);
    setActiveTab('page1');
    showToast('Чистый лист готов', 'Создан новый пустой лист персонажа 1-го уровня для ручного заполнения.');
  }, [handleReset, showToast]);

  // ── Save / Load JSON ──
  const handleSaveJSON = useCallback(() => {
    const data = JSON.stringify(char, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DnD5e_${char.name || 'Персонаж'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Сохранено', 'JSON файл скачан');
  }, [char, showToast]);

  const handleLoadJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ошибка', 'Файл слишком большой (макс. 5 МБ)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string);
          // Merge with defaults to ensure all fields exist (handles older/Partial JSON)
          const merged = normalizeCharacterData(raw);
          setChar(merged);
          showToast('Загружено', merged.name || 'Персонаж загружен из JSON');
        } catch {
          showToast('Ошибка', 'Не удалось прочитать JSON файл');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showToast]);

  // ── Публичная ссылка для внешних приложений и Мастера (DM View) ──
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  return (
    <div className="parchment-bg">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] parchment-toast px-4 py-3 max-w-xs">
          <p className="font-semibold text-sm" style={{ color: '#3C2415' }}>{toast.title}</p>
          <p className="text-xs" style={{ color: '#8B6914' }}>{toast.description}</p>
        </div>
      )}

      {showLevelUp && (
        <LevelUpModal
          char={char}
          onConfirm={handleLevelUp}
          onCancel={() => setShowLevelUp(false)}
        />
      )}
      {showLevelDown && <LevelDownModal char={char} onConfirm={handleLevelDown} onCancel={closeLevelDown} />}
      {showHistory && (
        <LevelHistoryModal
          char={char}
          onClose={closeHistory}
          onClearHistory={handleClearHistory}
          onDeleteEntry={handleDeleteHistoryEntry}
        />
      )}
      {showTemplates && <TemplateModal onSelect={handleApplyTemplate} onCancel={closeTemplates} />}
      {showRestModal && (
        <RestModal
          char={char}
          onApplyRest={handleApplyRest}
          onClose={closeRestModal}
        />
      )}
      {showEquipmentModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in"
          // Deliberately no backdrop dismiss to prevent accidental loss of changes
        >
          <div className="w-full max-w-4xl my-auto" onClick={(e) => e.stopPropagation()}>
            <EquipmentPaperDoll
              char={char}
              onChange={(updated) => setChar(updated)}
              onClose={closeEquipmentModal}
            />
          </div>
        </div>
      )}
      {rollResult && <RollResultPopup result={rollResult} onClose={closeRollResult} />}
      {showAuth && <AuthModal onClose={closeAuth} onAuth={handleAuth} onGoogleAuth={handleGoogleAuth} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} isSignUp={isSignUp} setIsSignUp={setIsSignUp} loading={authLoading} error={authError} />}
      {showCloudSaves && (
        <CharacterGridModal
          cloudCharacters={cloudCharacters}
          localCharacter={
            (!user || !activeCloudCharId) && (char.name || char.className || portraitUrl)
              ? {
                  id: 'local-active',
                  name: char.name || 'Текущий герой (на устройстве)',
                  data: char,
                  portrait_url: portraitUrl,
                  updated_at: new Date().toISOString(),
                  isLocal: true,
                }
              : null
          }
          onLoad={loadCloudCharacter}
          onDelete={deleteCloudCharacter}
          onShare={handleShareCharacter}
          onCreateNew={handleCreateNewCharacter}
          onClose={closeCloudSaves}
        />
      )}
      {showSignOutModal && <SignOutModal userEmail={user?.email} onConfirmSignOut={handleConfirmSignOut} onSwitchAccount={handleSwitchAccount} onCancel={closeSignOut} />}
      <ShareModal
        isOpen={showShareModal}
        onClose={closeShareModal}
        char={char}
        portraitUrl={portraitUrl}
        onOpenAuth={() => setShowAuth(true)}
        onToast={showToast}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
      />

      {/* Compendium Detail Modals */}
      {activeSpellModal && (
        <SpellDetailModal
          spell={activeSpellModal.spell}
          customName={activeSpellModal.customName}
          onClose={() => setActiveSpellModal(null)}
        />
      )}
      {activeWeaponModal && (
        <WeaponDetailModal
          weapon={activeWeaponModal.weapon}
          customName={activeWeaponModal.customName}
          customBonus={activeWeaponModal.customBonus}
          customDamage={activeWeaponModal.customDamage}
          onClose={() => setActiveWeaponModal(null)}
        />
      )}
      {activeTraitModal && (
        <TraitDetailModal
          trait={activeTraitModal.trait}
          customName={activeTraitModal.customName}
          customSource={activeTraitModal.customSource}
          customSummary={activeTraitModal.customSummary}
          customDescription={activeTraitModal.customDescription}
          onSaveDescription={desc => {
            if (typeof activeTraitModal.traitIndex === 'number') {
              updateTraitItem(activeTraitModal.traitIndex, 'description', desc);
            }
          }}
          onClose={() => setActiveTraitModal(null)}
        />
      )}

      {showClassModal && (
        <ClassSelectorModal
          currentClass={char.className}
          currentLevel={char.level}
          onSelect={handleSelectClass}
          onClose={() => setShowClassModal(false)}
        />
      )}
      {showRaceModal && (
        <RaceSelectorModal
          currentRace={char.race}
          currentLevel={char.level}
          onSelect={handleSelectRace}
          onClose={() => setShowRaceModal(false)}
        />
      )}
      {showSubclassModal && (
        <SubclassSelectorModal
          classNameString={char.className}
          currentSubclass={char.subclass}
          onSelect={handleSelectSubclass}
          onClose={() => setShowSubclassModal(false)}
        />
      )}
      {showNameGenModal && (
        <NameGeneratorModal
          currentRace={char.race}
          onSelectName={name => update('name', name)}
          onClose={() => setShowNameGenModal(false)}
        />
      )}
      {showStatsCalcModal && (
        <StatsCalculatorModal
          initialScores={char.abilityScores}
          racialBonuses={char.abilityBonuses}
          currentRace={char.race}
          onApply={(scores, customBonuses) => {
            setChar(prev => ({
              ...prev,
              abilityScores: scores as Record<AbilityName, number>,
              ...(customBonuses ? { abilityBonuses: customBonuses as Record<AbilityName, number> } : {}),
            }));
            showToast('Характеристики обновлены', 'Новые значения характеристик сохранены в лист персонажа');
          }}
          onClose={() => setShowStatsCalcModal(false)}
        />
      )}

      {pendingForeignSpell && (
        <NonClassSpellConfirmModal
          char={char}
          spell={pendingForeignSpell.spell}
          onConfirm={() => {
            pendingForeignSpell.callback();
            setPendingForeignSpell(null);
          }}
          onCancel={() => setPendingForeignSpell(null)}
        />
      )}
      {activeItemModal && (
        <ItemDetailModal
          item={activeItemModal}
          onEquipArmor={handleEquipArmor}
          onToggleShield={handleToggleShield}
          onClose={() => setActiveItemModal(null)}
        />
      )}

      <CharacterCreationWizardModal
        isOpen={showCreationWizard}
        onClose={() => setShowCreationWizard(false)}
        onComplete={handleWizardComplete}
      />

      {showCreateChoiceModal && (
        <CreateChoiceModal
          onClose={() => setShowCreateChoiceModal(false)}
          onSelectWizard={() => {
            setShowCreateChoiceModal(false);
            setShowCreationWizard(true);
          }}
          onSelectManual={handleManualCreate}
        />
      )}

      <SheetHeader
        user={user}
        cloudSaveStatus={cloudSaveStatus}
        cloudSaveError={cloudSaveError}
        isExportingPdf={isExportingPdf}
        onOpenCreateChoice={() => setShowCreateChoiceModal(true)}
        onOpenEquipmentModal={() => setShowEquipmentModal(true)}
        onExportPdf={handleExportPdf}
        onOpenTemplates={() => setShowTemplates(true)}
        onSaveJSON={handleSaveJSON}
        onLoadJSON={handleLoadJSON}
        onSaveAsNew={handleSaveAsNew}
        onReset={handleReset}
        onCloudSave={handleCloudSave}
        onCloudLoad={handleCloudLoad}
        onShare={handleShare}
        onOpenSignOut={() => setShowSignOutModal(true)}
        onOpenAuth={() => setShowAuth(true)}
        onExportDocx={handleExport}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <SheetNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* ═══ PAGE 1 ═══ */}
        {/* ═══ PAGE 1 ═══ */}
        {activeTab === 'page1' && (
          <MainSheetPage
            char={char}
            update={update}
            updateAbility={updateAbility}
            updateSaveProf={updateSaveProf}
            updateSkillProf={updateSkillProf}
            handleRoll={handleRoll}
            handleRollActiveAttack={handleRollActiveAttack}
            handleRollActiveDamage={handleRollActiveDamage}
            updateDeathSave={updateDeathSave}
            handleResetToStandardScores={handleResetToStandardScores}
            baseAbilitySum={baseAbilitySum}
            profBonus={profBonus}
            abilityWarnings={abilityWarnings}
            calculatedAC={calculatedAC}
            activeAC={activeAC}
            carryCap={carryCap}
            jumpDist={jumpDist}
            attackSearchQuery={attackSearchQuery}
            setAttackSearchQuery={setAttackSearchQuery}
            displayedAttacks={displayedAttacks}
            weaponAutocompleteItems={weaponAutocompleteItems}
            handleQuickAddWeapon={handleQuickAddWeapon}
            effectiveTraitsList={effectiveTraitsList}
            traitSearchQuery={traitSearchQuery}
            setTraitSearchQuery={setTraitSearchQuery}
            traitAutocompleteItems={traitAutocompleteItems}
            traitAddSuccess={traitAddSuccess}
            setTraitAddSuccess={setTraitAddSuccess}
            addTraitItem={addTraitItem}
            updateTraitItem={updateTraitItem}
            removeTraitItem={removeTraitItem}
            setShowNameGenModal={setShowNameGenModal}
            setShowClassModal={setShowClassModal}
            setShowRaceModal={setShowRaceModal}
            setShowLevelDown={setShowLevelDown}
            setShowLevelUp={setShowLevelUp}
            setShowHistory={setShowHistory}
            setShowStatsCalcModal={setShowStatsCalcModal}
            setShowEquipmentModal={setShowEquipmentModal}
            setShowRestModal={setShowRestModal}
            setActiveWeaponModal={setActiveWeaponModal}
            setActiveItemModal={setActiveItemModal}
            setActiveTraitModal={setActiveTraitModal}
            showToast={showToast}
            compClass={compClass}
          />
        )}

        {/* ═══ PAGE 2 ═══ */}
        {activeTab === 'page2' && (
          <DetailsSheetPage
            char={char}
            update={update}
            portraitUrl={portraitUrl}
            setPortraitUrl={setPortraitUrl}
            handlePortraitUpload={handlePortraitUpload}
          />
        )}

        {/* ═══ PAGE 3 ═══ */}
        {activeTab === 'page3' && (
          <SpellsSheetPage
            char={char}
            update={update}
            updateSpellSlot={updateSpellSlot}
            updateCantrip={updateCantrip}
            addCantrip={addCantrip}
            removeCantrip={removeCantrip}
            updateSpellEntry={updateSpellEntry}
            addSpell={addSpell}
            removeSpell={removeSpell}
            filterOnlyMyClassSpells={filterOnlyMyClassSpells}
            setFilterOnlyMyClassSpells={setFilterOnlyMyClassSpells}
            spellSearchQuery={spellSearchQuery}
            setSpellSearchQuery={setSpellSearchQuery}
            spellAutocompleteItems={spellAutocompleteItems}
            handleQuickAddSpell={handleQuickAddSpell}
            spellAddSuccess={spellAddSuccess}
            setSpellAddSuccess={setSpellAddSuccess}
            setActiveSpellModal={setActiveSpellModal}
            maxAvailableSlot={maxAvailableSlot}
            handleRoll={handleRoll}
            showToast={showToast}
          />
        )}

        <SheetFooter onExportDocx={handleExport} />
      </main>
    </div>
  );
}
