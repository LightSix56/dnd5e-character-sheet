'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CharacterData, AbilityName, ABILITY_NAMES, ABILITY_FULL, ALL_SKILLS, SKILL_MAP,
  formatModifier, calcModifier, calcProficiencyBonus, getTotalScore, getModifier,
  getSavingThrow, getSkillBonus, getInitiative, getPassivePerception, getAC,
  getHPMax, getSpellSaveDC, getSpellAttackBonus, getSpellAbilityMod,
  createDefaultCharacter, createExampleWarrior, createExampleWizard,
  Attack, SpellEntry, LevelUpEntry,
  getHitDieSize, getHitDieAverage, getHitDiceNotation, isStandardASILevel, getMilestonesAtLevel, createEmptyLevelUpEntry,
  CLASS_TEMPLATES, ClassTemplate, applyClassTemplate, applyRaceTemplate, ARMOR_AC_MAP,
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
import { findItemByName, type CompendiumItem } from '@/data/compendium/items';
import type { CompendiumRace, CompendiumSubrace } from '@/data/compendium/races';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass, type CompendiumClass, type CompendiumSubclass } from '@/data/compendium/classes';
import {
  getCompendiumAutocompleteItems,
  getClassFeaturesForLevel,
  isClassASILevel,
  getClassSubclassLevel,
  getSpellSlotsForClassLevel,
  getNewSpellLevelUnlocked,
  DND_COMPENDIUM_FEATS,
  getRacialFeaturesForLevel,
  getRacialHPBonusPerLevel,
  isSpellAllowedForCharacter,
  getAvailableSpellsForCharacter,
  getMaxAvailableSpellSlotLevel,
  isSpellLevelAllowedForCharacter
} from '@/data/compendium';
import type { TraitItem } from '@/lib/dnd-types';

import {
  D20Icon, ScrollIcon, SpellbookIcon, ChestIcon, HourglassIcon,
  GoldSealCheckIcon, MysticSpinnerIcon, MysticCloudIcon, PortalIcon,
  QuillIcon, RunedKeyIcon, ArcaneLinkIcon, CrossedSwordsIcon, EngravedShieldIcon,
  UserHeroIcon, SparklesDndIcon, CoinsChestIcon, MasksDramaIcon, BackpackPackIcon,
  CrystalBallDndIcon, CameraPortraitIcon, InfoSealIcon
} from '@/components/dnd-icons';

// ── Small helper components ──

function CalcBadge({ value, label }: { value: string | number; label?: string }) {
  return (
    <span className="calc-badge" title={label || 'Авторасчёт'}>
      {value}
    </span>
  );
}

// ── Crypto-random dice roller (true uniform distribution) ──

function rollD20(): number {
  // Use crypto.getRandomValues for unbiased randomness
  // Rejection sampling to avoid modulo bias: reject values >= 256 - (256 % 20) = 240
  const arr = new Uint8Array(1);
  let val: number;
  do {
    crypto.getRandomValues(arr);
    val = arr[0];
  } while (val >= 240); // reject to ensure uniform distribution
  return (val % 20) + 1; // 1..20
}

// ── Roll Result Popup ──

interface RollResult {
  dieResult: number;   // the d20 roll (1-20)
  modifier: number;    // the modifier value (can be negative)
  total: number;       // dieResult + modifier
  label: string;       // what was rolled, e.g. "Проверка Силы" or "Спасбросок Лов"
}

const RollResultPopup = React.memo(function RollResultPopup({ result, onClose }: { result: RollResult; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const isNat20 = result.dieResult === 20;
  const isNat1 = result.dieResult === 1;

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Auto-close after 3.5 seconds
  React.useEffect(() => {
    const timer = setTimeout(handleClose, 3500);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[300] flex items-center justify-center" onClick={handleClose}>
      <div className={`roll-result-popup ${closing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="roll-result-label">{result.label}</div>
        <div className={`roll-result-die ${isNat20 ? 'nat20' : ''} ${isNat1 ? 'nat1' : ''}`}>
          {result.dieResult}
        </div>
        <div className="roll-result-breakdown">
          d20 ({result.dieResult}) {result.modifier >= 0 ? '+' : ''}{result.modifier}
        </div>
        <div className="roll-result-total">
          = {result.total}
        </div>
        {isNat20 && <div className="roll-result-tag crit">Критический успех!</div>}
        {isNat1 && <div className="roll-result-tag fumble">Критический провал!</div>}
      </div>
    </div>
  );
});

// ── Rollable Badge (clickable modifier badge for checks & saves) ──

const RollBadge = React.memo(function RollBadge({ value, label, modifier, onRoll }: {
  value: string | number;
  label?: string;
  modifier: number;
  onRoll: (result: RollResult) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dieResult = rollD20();
    const total = dieResult + modifier;
    onRoll({ dieResult, modifier, total, label: label || 'Проверка' });
  };

  return (
    <span className="calc-badge roll-badge" title={label ? `${label} — нажмите для броска d20` : 'Нажмите для броска d20'} onClick={handleClick}>
      {value}
    </span>
  );
});

function StatInput({ label, value, onChange, type = 'number', placeholder, className = '' }: {
  label: string; value: string | number; onChange: (v: any) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="parchment-label">{label}</label>
      <input type={type} value={value}
        onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder}
        className="parchment-input" />
    </div>
  );
}

const inputClass = "parchment-input";
const inputClassCenter = "parchment-input-center";
const textareaClass = "parchment-textarea";

// ── Third-Casters Spell Slots (Eldritch Knight / Arcane Trickster) ──
function getThirdCasterSpellSlots(level: number): Record<number, number> | null {
  if (level < 3) return null;
  if (level <= 3) return { 1: 2 };
  if (level <= 6) return { 1: 3 };
  if (level <= 8) return { 1: 4, 2: 2 };
  if (level <= 9) return { 1: 4, 2: 2 };
  if (level <= 12) return { 1: 4, 2: 3 };
  if (level <= 15) return { 1: 4, 2: 3, 3: 2 };
  if (level <= 18) return { 1: 4, 2: 3, 3: 3 };
  return { 1: 4, 2: 3, 3: 3, 4: 1 };
}

// ── Level Up Modal (comprehensive draft sheet) ──

interface LevelUpModalProps {
  char: CharacterData;
  onConfirm: (entry: LevelUpEntry) => void;
  onCancel: () => void;
}

const LevelUpModal = React.memo(function LevelUpModal({ char, onConfirm, onCancel }: LevelUpModalProps) {
  const newLevel = char.level + 1;
  const dieSize = char.hitDice ? getHitDieSize(char.hitDice) : 8;
  const diceNotation = char.hitDice ? getHitDiceNotation(char.hitDice) : 'd';
  const conMod = getModifier(char, 'ТЕЛ');
  
  // Tough feat bonus (+2 HP per level)
  const hasTough = (char.traitsList || []).some(t => 
    t.name.toLowerCase().includes('живучий') || t.name.toLowerCase().includes('tough')
  );
  const toughBonus = hasTough ? 2 : 0;

  // Racial HP bonus (Hill Dwarf: +1 HP per level)
  const racialHPBonus = getRacialHPBonusPerLevel(char.race, char.subrace);

  const avgHP = (char.hitDice ? getHitDieAverage(char.hitDice) : 5) + conMod + toughBonus + racialHPBonus;
  
  // Class progression data
  const classFeatures = useMemo(() => getClassFeaturesForLevel(char.className, newLevel), [char.className, newLevel]);
  const isASI = useMemo(() => isClassASILevel(char.className, newLevel), [char.className, newLevel]);
  const subclassReqLevel = useMemo(() => getClassSubclassLevel(char.className), [char.className]);
  const isSubclassChoice = !char.subclass && newLevel >= subclassReqLevel;
  const availableSubclasses = useMemo(() => getSubclassesForClass(char.className), [char.className]);

  // Subclass choice
  const [chosenSubclass, setChosenSubclass] = useState<string>(availableSubclasses[0]?.name || '');
  const effectiveSubclass = char.subclass || (isSubclassChoice ? chosenSubclass : '');

  // Subclass object
  const currentSubclassObj = useMemo(() => {
    if (!effectiveSubclass) return null;
    return availableSubclasses.find(s =>
      s.name.toLowerCase() === effectiveSubclass.toLowerCase() ||
      s.nameEn.toLowerCase() === effectiveSubclass.toLowerCase()
    ) || null;
  }, [effectiveSubclass, availableSubclasses]);

  // Subclass features for this level
  const subclassFeatures = useMemo(() => {
    if (!currentSubclassObj?.features) return [];
    if (isSubclassChoice) {
      // First time selecting subclass: only features at or below current level
      return currentSubclassObj.features.filter(f => f.level <= newLevel);
    }
    // Already has subclass: features strictly unlocked on newLevel
    return currentSubclassObj.features.filter(f => f.level === newLevel);
  }, [currentSubclassObj, isSubclassChoice, newLevel]);

  // Third-caster check
  const isThirdCaster = useMemo(() => {
    const s = effectiveSubclass.toLowerCase();
    return s.includes('мистический рыцарь') || s.includes('eldritch knight') || s.includes('мистический ловкач') || s.includes('arcane trickster');
  }, [effectiveSubclass]);

  const newSpellSlots = useMemo(() => {
    if (isThirdCaster) {
      return getThirdCasterSpellSlots(newLevel);
    }
    return getSpellSlotsForClassLevel(char.className, newLevel);
  }, [isThirdCaster, char.className, newLevel]);

  const unlockedCircle = useMemo(() => {
    if (isThirdCaster) {
      const cur = getThirdCasterSpellSlots(newLevel);
      const prev = newLevel > 3 ? getThirdCasterSpellSlots(newLevel - 1) : null;
      const curMax = cur ? Math.max(...Object.keys(cur).map(Number)) : 0;
      const prevMax = prev ? Math.max(...Object.keys(prev).map(Number)) : 0;
      return curMax > prevMax ? curMax : null;
    }
    return getNewSpellLevelUnlocked(char.className, newLevel);
  }, [isThirdCaster, char.className, newLevel]);

  const profChanged = calcProficiencyBonus(newLevel) !== calcProficiencyBonus(char.level);

  // Racial progression data for this level (scaling breath, innate spells, Aasimar transformation, etc.)
  const racialFeatures = useMemo(
    () => getRacialFeaturesForLevel(char.race, char.subrace, newLevel),
    [char.race, char.subrace, newLevel]
  );

  // States
  const [hpMode, setHpMode] = useState<'average' | 'roll'>('average');
  const [hpRoll, setHpRoll] = useState(dieSize);

  const rollHpDie = useCallback(() => {
    const rolled = Math.floor(Math.random() * dieSize) + 1;
    setHpRoll(rolled);
  }, [dieSize]);
  
  // Selected class and subclass features to add (default all checked)
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const f of classFeatures) init[f.name] = true;
    for (const sf of subclassFeatures) init[sf.name] = true;
    return init;
  });

  useEffect(() => {
    if (subclassFeatures.length > 0) {
      setSelectedFeatures(prev => {
        const next = { ...prev };
        for (const sf of subclassFeatures) {
          if (next[sf.name] === undefined) next[sf.name] = true;
        }
        return next;
      });
    }
  }, [subclassFeatures]);

  // Selected racial features to add (default all checked)
  const [selectedRacialFeatures, setSelectedRacialFeatures] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const rf of racialFeatures) init[rf.name] = true;
    return init;
  });

  // ASI / Feat choice
  const [asiChoice, setAsiChoice] = useState<'stats' | 'feat'>('stats');
  const [asiAbility1, setAsiAbility1] = useState<AbilityName>('СИЛ');
  const [asiAbility2, setAsiAbility2] = useState<AbilityName>('ЛОВ');
  const allFeats = useMemo(() => DND_COMPENDIUM_FEATS.filter(f => f.category === 'Черта'), []);
  const [selectedFeatId, setSelectedFeatId] = useState<string>(allFeats[0]?.id || 'alert');
  const selectedFeat = allFeats.find(f => f.id === selectedFeatId);

  // ASI Cap calculation (max 20 per 5e rules)
  const score1 = getTotalScore(char, asiAbility1);
  const score2 = getTotalScore(char, asiAbility2);
  const isSameAbility = asiAbility1 === asiAbility2;
  const nextScore1 = score1 + (isSameAbility ? 2 : 1);
  const nextScore2 = isSameAbility ? nextScore1 : score2 + 1;
  const isScore1OverCap = nextScore1 > 20;
  const isScore2OverCap = nextScore2 > 20;
  const isASIOverCap = isASI && asiChoice === 'stats' && (isScore1OverCap || isScore2OverCap);

  const [notes, setNotes] = useState('');

  // Structured additions
  const [newCantrips, setNewCantrips] = useState<string[]>(['']);
  const [newSpells, setNewSpells] = useState<{ level: number; name: string; prepared: boolean }[]>([]);
  const [newSaveProfs, setNewSaveProfs] = useState<AbilityName[]>([]);
  const [newSkillProfs, setNewSkillProfs] = useState<string[]>([]);
  const [newSkillExpertise, setNewSkillExpertise] = useState<string[]>([]);
  const [newAttacks, setNewAttacks] = useState<Attack[]>([]);
  const [newProfText, setNewProfText] = useState('');
  const [newEquipText, setNewEquipText] = useState('');

  const finalHP = Math.max(1, (hpMode === 'average' ? avgHP : (hpRoll + conMod + toughBonus + racialHPBonus)));

  const toggleFeature = (name: string) => {
    setSelectedFeatures(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleRacialFeature = (name: string) => {
    setSelectedRacialFeatures(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const charWithEffectiveSubclass = useMemo(() => {
    return { ...char, subclass: effectiveSubclass };
  }, [char, effectiveSubclass]);

  const availableClassSpells = useMemo(() => getAvailableSpellsForCharacter(charWithEffectiveSubclass), [charWithEffectiveSubclass]);
  const cantripAutocompleteItems: AutocompleteItem[] = useMemo(() => {
    return availableClassSpells.filter(s => s.level === 0).map(s => ({
      name: s.name,
      badge: 'Заговор',
      secondary: s.school,
      data: s,
    }));
  }, [availableClassSpells]);
  const maxSlotLevelAtNewLevel = useMemo(() => {
    return getMaxAvailableSpellSlotLevel(charWithEffectiveSubclass, newLevel);
  }, [charWithEffectiveSubclass, newLevel]);

  const leveledSpellAutocompleteItems: AutocompleteItem[] = useMemo(() => {
    return availableClassSpells
      .filter(s => s.level > 0 && s.level <= maxSlotLevelAtNewLevel)
      .map(s => ({
        name: s.name,
        badge: `${s.level} ур.`,
        secondary: s.school,
        data: s,
      }));
  }, [availableClassSpells, maxSlotLevelAtNewLevel]);

  const addCantripRow = () => setNewCantrips(prev => [...prev, '']);
  const removeCantripRow = (i: number) => setNewCantrips(prev => prev.filter((_, j) => j !== i));
  const updateCantripRow = (i: number, v: string) => setNewCantrips(prev => { const a = [...prev]; a[i] = v; return a; });

  const addSpellRow = () => setNewSpells(prev => [...prev, { level: Math.min(unlockedCircle || 1, Math.max(1, maxSlotLevelAtNewLevel)), name: '', prepared: false }]);
  const removeSpellRow = (i: number) => setNewSpells(prev => prev.filter((_, j) => j !== i));
  const updateSpellRow = (i: number, field: 'level' | 'name' | 'prepared', value: any) =>
    setNewSpells(prev => { const a = [...prev]; a[i] = { ...a[i], [field]: value }; return a; });

  const addAttackRow = () => setNewAttacks(prev => [...prev, { name: '', attackBonus: '', damageAndType: '' }]);
  const removeAttackRow = (i: number) => setNewAttacks(prev => prev.filter((_, j) => j !== i));
  const updateAttackRow = (i: number, field: keyof Attack, value: string) =>
    setNewAttacks(prev => { const a = [...prev]; a[i] = { ...a[i], [field]: value }; return a; });

  const toggleSaveProf = (ability: AbilityName) => {
    setNewSaveProfs(prev => prev.includes(ability) ? prev.filter(a => a !== ability) : [...prev, ability]);
  };
  const toggleSkillProf = (skill: string) => {
    setNewSkillProfs(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };
  const toggleSkillExpertise = (skill: string) => {
    setNewSkillExpertise(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const buildEntry = (): LevelUpEntry => {
    // Collect added class features as TraitItem
    const addedTraits: TraitItem[] = [];
    for (const f of classFeatures) {
      if (selectedFeatures[f.name]) {
        addedTraits.push({
          id: `feat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          source: `${char.className || 'Класс'} (${newLevel} ур.)`,
          summary: f.name,
          description: f.description,
        });
      }
    }

    // Collect added subclass features
    for (const sf of subclassFeatures) {
      if (selectedFeatures[sf.name]) {
        addedTraits.push({
          id: `subfeat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
          name: sf.name,
          source: `${effectiveSubclass} (${sf.level || newLevel} ур.)`,
          summary: sf.name,
          description: sf.description,
        });
      }
    }

    // Collect added racial features (scaling breath, innate spells, etc.)
    const spellsToAdd = [...newSpells];
    for (const rf of racialFeatures) {
      if (selectedRacialFeatures[rf.name]) {
        addedTraits.push({
          id: `racefeat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
          name: rf.name,
          source: `${char.subrace || char.race || 'Раса'} (${newLevel} ур.)`,
          summary: rf.name,
          description: rf.description,
        });
        if (rf.spell && !spellsToAdd.some(s => s.name.toLowerCase() === rf.spell!.name.toLowerCase())) {
          spellsToAdd.push({ ...rf.spell });
        }
      }
    }

    // If Feat chosen
    let featName: string | undefined = undefined;
    if (isASI && asiChoice === 'feat' && selectedFeat) {
      featName = selectedFeat.name;
      addedTraits.push({
        id: `feat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
        name: selectedFeat.name,
        source: `Черта (${newLevel} ур.)`,
        summary: selectedFeat.summary,
        description: selectedFeat.description,
      });
    }

    return {
      level: newLevel,
      hpGained: finalHP,
      asiAbilities: (isASI && asiChoice === 'stats' && !isASIOverCap) ? [asiAbility1, asiAbility2] : null,
      selectedFeat: featName,
      newSubclass: (isSubclassChoice && chosenSubclass) ? chosenSubclass : undefined,
      addedTraits,
      spellSlotsGained: newSpellSlots || undefined,
      notes,
      newCantrips: newCantrips.filter(c => c.trim()),
      newSpells: spellsToAdd.filter(s => s.name.trim() && (maxSlotLevelAtNewLevel > 0 ? s.level <= maxSlotLevelAtNewLevel : false)),
      newSavingThrowProfs: newSaveProfs,
      newSkillProfs: newSkillProfs,
      newSkillExpertise: newSkillExpertise,
      newAttacks: newAttacks.filter(a => a.name.trim()),
      newProficienciesText: newProfText.trim(),
      newEquipmentText: newEquipText.trim(),
    };
  };

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onCancel}>
      <div className="parchment-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="border-b pb-3" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#3D2012' }}>
              <D20Icon size={24} />
              <span>Повышение до {newLevel}-го уровня</span>
            </h2>
            <div className="flex items-center justify-between text-xs mt-1" style={{ color: '#8B6914' }}>
              <span>{char.name || 'Персонаж'} — <strong>{char.className || 'Без класса'}</strong> {char.subclass ? `(${char.subclass})` : ''}</span>
              <span className="font-mono">Кость хитов: 1{diceNotation}{dieSize}</span>
            </div>
          </div>


          {/* Proficiency Bonus Notification */}
          {profChanged && (
            <div className="p-2.5 rounded text-xs flex items-center gap-2.5" style={{ background: 'rgba(230, 140, 20, 0.15)', border: '1px solid rgba(200, 120, 20, 0.4)', color: '#7C3E08' }}>
              <GoldSealCheckIcon size={20} />
              <div>
                <strong>Бонус мастерства увеличивается:</strong> {formatModifier(calcProficiencyBonus(char.level))} → <span className="font-bold text-sm">{formatModifier(calcProficiencyBonus(newLevel))}</span>
                <div className="opacity-80 text-[11px]">Автоматически увеличит все ваши профильные атаки, спасброски и навыки.</div>
              </div>
            </div>
          )}

          {/* 1. HP Gain Section */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2 flex items-center justify-between" style={{ color: '#3C2415' }}>
              <span className="flex items-center gap-1.5">
                <SparklesDndIcon size={16} />
                <span>Прирост хитов на {newLevel} уровне:</span>
              </span>
              <span className="text-sm font-extrabold" style={{ color: '#8B2500' }}>+{finalHP} HP</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setHpMode('average')}
                className={hpMode === 'average' ? 'parchment-btn text-xs py-1' : 'parchment-btn-secondary text-xs py-1'}
              >
                Среднее ({avgHP})
              </button>
              <button
                type="button"
                onClick={() => setHpMode('roll')}
                className={hpMode === 'roll' ? 'parchment-btn text-xs py-1' : 'parchment-btn-secondary text-xs py-1'}
              >
                Бросок кубика (1{diceNotation}{dieSize})
              </button>
            </div>
            {hpMode === 'roll' && (
              <div className="flex flex-wrap items-center gap-2 p-2 rounded text-xs mb-2" style={{ background: 'rgba(232, 211, 162, 0.3)' }}>
                <button
                  type="button"
                  onClick={rollHpDie}
                  className="parchment-btn text-xs py-1 px-2.5 flex items-center gap-1 shrink-0"
                >
                  <D20Icon size={14} />
                  <span>Бросить 1{diceNotation}{dieSize}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <label style={{ color: '#8B6914' }}>Выпало:</label>
                  <input
                    type="number"
                    min={1}
                    max={dieSize}
                    value={hpRoll}
                    onChange={e => setHpRoll(Math.min(dieSize, Math.max(1, Number(e.target.value) || 1)))}
                    className="parchment-input-boxed text-center w-16 text-xs"
                  />
                </div>
                <span style={{ color: '#8B6914' }}>
                  + мод. ТЕЛ ({formatModifier(conMod)}) {hasTough ? '+ Живучий (+2)' : ''} {racialHPBonus > 0 ? '+ Дворф (+1)' : ''} = <strong>{hpRoll + conMod + toughBonus + racialHPBonus}</strong>
                </span>
              </div>
            )}
            <div className="text-[11px]" style={{ color: '#6B3A2A' }}>
              Новый максимум здоровья: <strong>{(char.hpMax || 0) + finalHP} HP</strong> {hasTough ? '(включая +2 от «Живучий») ' : ''}{racialHPBonus > 0 ? '(включая +1 от «Дворфская стойкость»)' : ''}
            </div>
          </div>

          {/* 2. Class Features at this level */}
          {classFeatures.length > 0 && (
            <div className="parchment-modal-section space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                  <CrossedSwordsIcon size={16} />
                  <span>Классовые умения {newLevel}-го уровня:</span>
                </h3>
                <span className="text-[10px]" style={{ color: '#8B6914' }}>Отмеченные умения добавятся в особенности листа</span>
              </div>
              <div className="space-y-2">
                {classFeatures.map(f => (
                  <div
                    key={f.name}
                    className="p-2.5 rounded text-xs transition-colors"
                    style={{
                      background: selectedFeatures[f.name] ? 'rgba(232, 211, 162, 0.45)' : 'rgba(232, 211, 162, 0.15)',
                      border: '1px solid rgba(201, 168, 76, 0.4)'
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <label className="parchment-checkbox parchment-checkbox-sm mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={!!selectedFeatures[f.name]}
                          onChange={() => toggleFeature(f.name)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs block" style={{ color: '#3D2012' }}>{f.name}</span>
                        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#6B3A2A' }}>{f.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2.1. Racial Progression at this level */}
          {racialFeatures.length > 0 && (
            <div className="parchment-modal-section space-y-2" style={{ background: 'rgba(201, 168, 76, 0.12)', border: '1px solid rgba(201, 168, 76, 0.45)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#5C341F' }}>
                  <SparklesDndIcon size={16} />
                  <span>Расовое развитие ({char.race || 'Раса'}{char.subrace ? ` — ${char.subrace}` : ''}, {newLevel} ур.):</span>
                </h3>
                <span className="text-[10px]" style={{ color: '#8B6914' }}>Врождённая магия и масштабирование</span>
              </div>
              <div className="space-y-2">
                {racialFeatures.map(rf => (
                  <div
                    key={rf.name}
                    className="p-2.5 rounded text-xs transition-colors"
                    style={{
                      background: selectedRacialFeatures[rf.name] ? 'rgba(232, 211, 162, 0.55)' : 'rgba(232, 211, 162, 0.2)',
                      border: '1px solid rgba(201, 168, 76, 0.4)'
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <label className="parchment-checkbox parchment-checkbox-sm mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={!!selectedRacialFeatures[rf.name]}
                          onChange={() => toggleRacialFeature(rf.name)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs" style={{ color: '#3D2012' }}>{rf.name}</span>
                          {rf.spell && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono" style={{ background: '#E8D3A2', color: '#5C341F', border: '1px solid #C9A84C' }}>
                              Заклинание {rf.spell.level} круга
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#6B3A2A' }}>{rf.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2.2. Subclass Features at this level (for already chosen subclass) */}
          {!isSubclassChoice && subclassFeatures.length > 0 && (
            <div className="parchment-modal-section space-y-2" style={{ background: 'rgba(92, 58, 110, 0.08)', borderColor: 'rgba(138, 93, 157, 0.4)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#5C3A6E' }}>
                  <ScrollIcon size={16} />
                  <span>Умения архетипа ({effectiveSubclass}, {newLevel} ур.):</span>
                </h3>
                <span className="text-[10px]" style={{ color: '#8B6914' }}>Особенности вашей специализации</span>
              </div>
              <div className="space-y-2">
                {subclassFeatures.map(sf => (
                  <div
                    key={sf.name}
                    className="p-2.5 rounded text-xs transition-colors"
                    style={{
                      background: selectedFeatures[sf.name] ? 'rgba(232, 211, 162, 0.45)' : 'rgba(232, 211, 162, 0.15)',
                      border: '1px solid rgba(201, 168, 76, 0.4)'
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <label className="parchment-checkbox parchment-checkbox-sm mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={!!selectedFeatures[sf.name]}
                          onChange={() => toggleFeature(sf.name)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs block" style={{ color: '#3D2012' }}>{sf.name}</span>
                        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#6B3A2A' }}>{sf.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Subclass Choice (if reached archetype level and not yet chosen) */}
          {isSubclassChoice && availableSubclasses.length > 0 && (
            <div className="p-3 rounded-lg border space-y-2" style={{ background: 'rgba(92, 58, 110, 0.08)', borderColor: '#8A5D9D' }}>
              <div className="flex items-center gap-2">
                <ScrollIcon size={18} />
                <h3 className="text-sm font-bold" style={{ color: '#5C3A6E' }}>
                  Выбор воинского пути / Архетипа ({newLevel} уровень):
                </h3>
              </div>
              <p className="text-xs" style={{ color: '#5C3A6E' }}>
                Ваш класс <strong>{char.className}</strong> открывает выбор специализации на {newLevel} уровне. Выберите архетип:
              </p>
              <select
                value={chosenSubclass}
                onChange={e => setChosenSubclass(e.target.value)}
                className="parchment-select w-full font-bold text-xs"
              >
                {availableSubclasses.map(sc => (
                  <option key={sc.id} value={sc.name}>
                    {sc.name} ({sc.nameEn}) — {sc.source || 'PHB'}
                  </option>
                ))}
              </select>
              {availableSubclasses.find(s => s.name === chosenSubclass) && (
                <div className="p-2 rounded text-[11px] leading-relaxed" style={{ background: 'rgba(245, 230, 200, 0.75)', border: '1px solid rgba(201, 168, 76, 0.4)', color: '#3D2012' }}>
                  <p className="font-semibold mb-1">
                    {availableSubclasses.find(s => s.name === chosenSubclass)?.description}
                  </p>
                  {availableSubclasses.find(s => s.name === chosenSubclass)?.features?.[0] && (
                    <div className="text-[10px] mt-1 border-t pt-1" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
                      <strong>Стартовое умение архетипа: </strong>
                      {availableSubclasses.find(s => s.name === chosenSubclass)?.features[0].name} —{' '}
                      {availableSubclasses.find(s => s.name === chosenSubclass)?.features[0].description}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. ASI or Feat Choice */}
          {isASI && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                  <SparklesDndIcon size={16} />
                  <span>Улучшение характеристик (ASI) или Черта:</span>
                </h3>
                <span className="text-[10px] font-bold" style={{ color: '#8B6914' }}>Уровень {newLevel}</span>
              </div>

              {/* Tabs: Stats vs Feat */}
              <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                <button
                  type="button"
                  onClick={() => setAsiChoice('stats')}
                  className={asiChoice === 'stats' ? 'parchment-btn text-xs py-1 px-3 font-bold flex items-center gap-1.5' : 'parchment-btn-secondary text-xs py-1 px-3 flex items-center gap-1.5'}
                >
                  <ScrollIcon size={14} />
                  <span>Характеристики (+2 или +1/+1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAsiChoice('feat')}
                  className={asiChoice === 'feat' ? 'parchment-btn text-xs py-1 px-3 font-bold flex items-center gap-1.5' : 'parchment-btn-secondary text-xs py-1 px-3 flex items-center gap-1.5'}
                >
                  <CrossedSwordsIcon size={14} />
                  <span>Выбрать черту (Feat)</span>
                </button>
              </div>

              {asiChoice === 'stats' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="parchment-label text-xs">Первая характеристика +1:</label>
                    <select
                      value={asiAbility1}
                      onChange={e => setAsiAbility1(e.target.value as AbilityName)}
                      className="parchment-select text-xs w-full"
                    >
                      {ABILITY_NAMES.map(a => (
                        <option key={a} value={a}>
                          {ABILITY_FULL[a]} ({getTotalScore(char, a)} → {getTotalScore(char, a) + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="parchment-label text-xs">Вторая характеристика +1:</label>
                    <select
                      value={asiAbility2}
                      onChange={e => setAsiAbility2(e.target.value as AbilityName)}
                      className="parchment-select text-xs w-full"
                    >
                      {ABILITY_NAMES.map(a => (
                        <option key={a} value={a}>
                          {ABILITY_FULL[a]} ({getTotalScore(char, a)} → {getTotalScore(char, a) + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="col-span-full text-[11px]" style={{ color: '#8B6914' }}>
                    * Если выбрать одну и ту же характеристику в обоих полях, она получит +2.
                  </p>
                  {isASIOverCap && (
                    <div className="col-span-full p-2.5 rounded text-xs font-bold flex items-center gap-2" style={{ background: 'rgba(139, 37, 0, 0.12)', border: '1px solid rgba(139, 37, 0, 0.35)', color: '#8B2500' }}>
                      <HourglassIcon size={16} />
                      <span>Значение характеристики не может превышать 20 при стандартном повышении (PHB 5e). Выберите другую характеристику.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <label className="parchment-label text-xs">Выберите официальную черту D&D 5e:</label>
                  <select
                    value={selectedFeatId}
                    onChange={e => setSelectedFeatId(e.target.value)}
                    className="parchment-select text-xs w-full font-bold"
                  >
                    {allFeats.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.nameEn}) {f.abilityBonus ? `[+1 к ${f.abilityBonus}]` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedFeat && (
                    <div className="p-2.5 rounded text-xs space-y-1" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                      <div className="font-bold text-sm" style={{ color: '#3D2012' }}>{selectedFeat.name}</div>
                      <div className="text-[11px] font-medium" style={{ color: '#8B6914' }}>{selectedFeat.summary}</div>
                      <div className="text-[11px] leading-relaxed whitespace-pre-line pt-1 border-t border-amber-900/10" style={{ color: '#5C341F' }}>
                        {selectedFeat.description}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Spellcasting Progression */}
          {newSpellSlots && (
            <div className="parchment-modal-section space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                <SparklesDndIcon size={16} />
                <span>Магия и ячейки заклинаний:</span>
              </h3>
              {unlockedCircle && (
                <div className="p-2 rounded text-xs font-bold flex items-center gap-2" style={{ background: 'rgba(92, 58, 110, 0.12)', border: '1px solid #8A5D9D', color: '#5C3A6E' }}>
                  <CrystalBallDndIcon size={18} />
                  <span>Поздравляем! Открыт доступ к заклинаниям {unlockedCircle}-го круга!</span>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(newSpellSlots).map(([circle, count]) => (
                  <span
                    key={circle}
                    className="px-2 py-0.5 rounded text-xs font-mono font-semibold"
                    style={{ background: '#E8D3A2', border: '1px solid #C9A84C', color: '#5C341F' }}
                  >
                    {circle} круг: {count} {count === 1 ? 'ячейка' : count < 5 ? 'ячейки' : 'ячеек'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── NEW CANTRIPS ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#3C2415' }}>
              <SparklesDndIcon size={16} />
              <span>Новые заговоры (→ вкладка Заклинания):</span>
            </h3>
            {newCantrips.map((c, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="flex-1">
                  <AutocompleteInput
                    value={c}
                    onChange={v => updateCantripRow(i, v)}
                    items={cantripAutocompleteItems}
                    placeholder="Название заговора вашего класса..."
                    className="w-full parchment-input-boxed"
                  />
                </div>
                <button onClick={() => removeCantripRow(i)} className="parchment-remove-btn">✕</button>
              </div>
            ))}
            <button onClick={addCantripRow} className="parchment-btn-sm" style={{ color: '#4a7c3f' }}>+ Заговор</button>
          </div>

          {/* ── NEW SPELLS ── */}
          <div className="parchment-modal-section">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                <SpellbookIcon size={16} />
                <span>Новые заклинания (→ вкладка Заклинания):</span>
              </h3>
              {maxSlotLevelAtNewLevel > 0 && (
                <span className="text-[11px] font-mono" style={{ color: '#8B6914' }}>
                  Доступны ячейки до {maxSlotLevelAtNewLevel} ур.
                </span>
              )}
            </div>
            {maxSlotLevelAtNewLevel === 0 ? (
              <p className="text-xs italic p-2 rounded" style={{ background: 'rgba(201, 168, 76, 0.15)', color: '#8B6914' }}>
                Класс «{char.className || 'Без класса'}» не обладает ячейками магии на {newLevel}-м уровне.
              </p>
            ) : (
              <>
                {newSpells.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <select value={s.level} onChange={e => updateSpellRow(i, 'level', Number(e.target.value))} className="parchment-select text-xs w-20 shrink-0">
                      {[1,2,3,4,5,6,7,8,9]
                        .filter(l => l <= Math.max(1, maxSlotLevelAtNewLevel))
                        .map(l => <option key={l} value={l}>{l} ур.</option>)
                      }
                    </select>
                    <div className="flex-1 min-w-0">
                      <AutocompleteInput
                        value={s.name}
                        onChange={v => updateSpellRow(i, 'name', v)}
                        items={leveledSpellAutocompleteItems}
                        placeholder="Название заклинания вашего класса..."
                        className="w-full parchment-input-boxed"
                      />
                    </div>
                    <label className="parchment-checkbox parchment-checkbox-sm" style={{ color: '#8B6914' }}><input type="checkbox" checked={s.prepared} onChange={e => updateSpellRow(i, 'prepared', e.target.checked)} /><span className="checkmark"></span></label><span className="text-xs" style={{ color: '#8B6914' }}>Подг.</span>
                    <button onClick={() => removeSpellRow(i)} className="parchment-remove-btn">✕</button>
                  </div>
                ))}
                <button onClick={addSpellRow} className="parchment-btn-sm" style={{ color: '#6B3A2A' }}>+ Заклинание</button>
              </>
            )}
          </div>

          {/* ── NEW SAVING THROW PROFS ── */}
          <div className="parchment-modal-section-accent">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#3C2415' }}>
              <EngravedShieldIcon size={16} />
              <span>Новые владения спасбросками:</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {ABILITY_NAMES.map(abbr => (
                <div key={abbr} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${newSaveProfs.includes(abbr) ? 'parchment-skill-expert font-bold' : char.savingThrowProficiencies[abbr] ? 'opacity-40' : 'parchment-no-prof'}`}>
                  <label className="parchment-checkbox parchment-checkbox-sm"><input type="checkbox" checked={newSaveProfs.includes(abbr)} onChange={() => toggleSaveProf(abbr)} disabled={char.savingThrowProficiencies[abbr]} /><span className="checkmark"></span></label>
                  {ABILITY_FULL[abbr]}
                </div>
              ))}
            </div>
          </div>

          {/* ── NEW SKILL PROFS ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#3C2415' }}>
              <GoldSealCheckIcon size={16} />
              <span>Новые владения навыками:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1">
              {ALL_SKILLS.map(skill => {
                const alreadyProf = char.skillProficiencies[skill];
                const isNewProf = newSkillProfs.includes(skill);
                const isNewExpert = newSkillExpertise.includes(skill);
                return (
                  <div key={skill} className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded text-xs ${isNewExpert ? 'parchment-skill-expert font-bold' : isNewProf ? 'parchment-skill-prof' : alreadyProf ? 'opacity-40' : ''}`}>
                    <label className="parchment-checkbox parchment-checkbox-sm" title="Владение"><input type="checkbox" checked={isNewProf} onChange={() => toggleSkillProf(skill)} disabled={alreadyProf} /><span className="checkmark"></span></label>
                    <label className="parchment-checkbox parchment-checkbox-sm parchment-checkbox-expert" title="Экспертиза"><input type="checkbox" checked={isNewExpert} onChange={() => toggleSkillExpertise(skill)} disabled={alreadyProf || !isNewProf} /><span className="checkmark"></span></label>
                    <span>{skill}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] mt-1" style={{ color: '#8B6914' }}>1-я галочка = владение, 2-я = экспертиза. Серые = уже есть.</p>
          </div>

          {/* ── NEW ATTACKS ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#3C2415' }}>
              <CrossedSwordsIcon size={16} />
              <span>Новые атаки:</span>
            </h3>
            {newAttacks.map((atk, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center mb-1.5 p-1.5 rounded border border-amber-900/10">
                <input value={atk.name} onChange={e => updateAttackRow(i, 'name', e.target.value)} placeholder="Название оружия/атаки" className="parchment-input-boxed text-xs w-full" />
                <input value={atk.attackBonus} onChange={e => updateAttackRow(i, 'attackBonus', e.target.value)} placeholder="+5" className="parchment-input-boxed text-center text-xs w-full sm:w-16" />
                <input value={atk.damageAndType} onChange={e => updateAttackRow(i, 'damageAndType', e.target.value)} placeholder="1d8+3 рубящий" className="parchment-input-boxed text-xs w-full" />
                <button onClick={() => removeAttackRow(i)} className="parchment-remove-btn self-center">✕</button>
              </div>
            ))}
            <button onClick={addAttackRow} className="parchment-btn-sm" style={{ color: '#8B2500' }}>+ Атака</button>
          </div>

          {/* ── NEW PROFICIENCIES TEXT ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#3C2415' }}>
              <ScrollIcon size={16} />
              <span>Новые владения / языки:</span>
            </h3>
            <textarea value={newProfText} onChange={e => setNewProfText(e.target.value)} rows={2} className={textareaClass} placeholder="Владение тяжёлыми доспехами&#10;Язык: Драконий" />
          </div>

          {/* ── NEW EQUIPMENT TEXT ── */}
          <div className="parchment-modal-section-accent">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#3C2415' }}>
              <BackpackPackIcon size={16} />
              <span>Новое снаряжение:</span>
            </h3>
            <textarea value={newEquipText} onChange={e => setNewEquipText(e.target.value)} rows={2} className={textareaClass} placeholder="Кольчуга, Длинный меч" />
          </div>

          {/* ── FREEFORM NOTES → FEATURES ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#3C2415' }}>
              <QuillIcon size={16} />
              <span>Заметки к уровню:</span>
            </h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={textareaClass} placeholder="Дополнительные примечания..." />
          </div>

          {/* Summary */}
          <div className="parchment-modal-section-accent text-xs space-y-1" style={{ color: '#3C2415' }}>
            <p className="font-bold text-sm mb-1" style={{ color: '#5C3A6E' }}>Итоговые изменения {newLevel}-го уровня:</p>
            <p>• Уровень: {char.level} → <strong>{newLevel}</strong></p>
            <p>• Хиты: +{finalHP} (новый максимум: {(char.hpMax || 0) + finalHP})</p>
            {profChanged && <p>• Бонус мастерства: {formatModifier(calcProficiencyBonus(char.level))} → {formatModifier(calcProficiencyBonus(newLevel))}</p>}
            {isSubclassChoice && chosenSubclass && <p>• Выбран архетип: <strong>{chosenSubclass}</strong></p>}
            {isASI && asiChoice === 'stats' && <p>• Улучшение характеристик: {ABILITY_FULL[asiAbility1]} +1, {ABILITY_FULL[asiAbility2]} +1</p>}
            {isASI && asiChoice === 'feat' && selectedFeat && <p>• Получена черта: <strong>{selectedFeat.name}</strong></p>}
            {Object.keys(selectedFeatures).filter(k => selectedFeatures[k]).length > 0 && (
              <p>• Классовые умения: {Object.keys(selectedFeatures).filter(k => selectedFeatures[k]).join(', ')}</p>
            )}
            {Object.keys(selectedRacialFeatures).filter(k => selectedRacialFeatures[k]).length > 0 && (
              <p>• Расовые особенности: {Object.keys(selectedRacialFeatures).filter(k => selectedRacialFeatures[k]).join(', ')}</p>
            )}
            {unlockedCircle && <p>• Доступ к магии: <strong>{unlockedCircle}-й круг заклинаний!</strong></p>}
            {newCantrips.filter(c => c.trim()).length > 0 && <p>• Заговоры: {newCantrips.filter(c => c.trim()).join(', ')}</p>}
            {newSpells.filter(s => s.name.trim()).length > 0 && <p>• Заклинания: {newSpells.filter(s => s.name.trim()).map(s => `${s.name} (${s.level} ур.)`).join(', ')}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 parchment-btn-secondary py-2">
              Отмена
            </button>
            <button
              type="button"
              disabled={isASIOverCap || (isSubclassChoice && availableSubclasses.length > 0 && !chosenSubclass)}
              onClick={() => onConfirm(buildEntry())}
              className="flex-1 parchment-btn font-bold text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <D20Icon size={18} />
              <span>Повысить до {newLevel}-го уровня</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Level Down Confirm ──

interface LevelDownModalProps {
  char: CharacterData;
  onConfirm: () => void;
  onCancel: () => void;
}

const LevelDownModal = React.memo(function LevelDownModal({ char, onConfirm, onCancel }: LevelDownModalProps) {
  const history = Array.isArray(char.levelHistory) ? char.levelHistory : [];
  const last = history[history.length - 1];
  const targetLevel = Math.max(1, char.level - 1);

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onCancel}>
      <div className="parchment-modal max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#8B2500' }}>
            <HourglassIcon size={22} />
            <span>Откат до {targetLevel} уровня</span>
          </h2>
          {last ? (
            <div className="mb-4 p-3 rounded text-sm space-y-1.5" style={{ background: 'rgba(139, 37, 0, 0.06)', border: '1px solid rgba(139, 37, 0, 0.2)' }}>
              <p className="font-bold text-xs" style={{ color: '#8B2500' }}>Будут отменены изменения {last.level}-го уровня:</p>
              <p className="text-xs" style={{ color: '#A0522D' }}>• −{last.hpGained} хитов</p>
              {last.newSubclass && <p className="text-xs" style={{ color: '#A0522D' }}>• Сброс архетипа: {last.newSubclass}</p>}
              {last.asiAbilities && last.asiAbilities.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • {last.asiAbilities[0] === last.asiAbilities[1]
                    ? `−2 к характеристике ${ABILITY_FULL[last.asiAbilities[0]] || last.asiAbilities[0]}`
                    : `−1 к характеристикам ${last.asiAbilities.map(a => ABILITY_FULL[a] || a).join(', ')}`}
                </p>
              )}
              {last.selectedFeat && <p className="text-xs" style={{ color: '#A0522D' }}>• Отмена черты: {last.selectedFeat}</p>}
              {last.addedTraits && last.addedTraits.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>• Удаление умений: {last.addedTraits.map(t => t.name).join(', ')}</p>
              )}
              {last.newCantrips?.length > 0 && <p className="text-xs" style={{ color: '#A0522D' }}>• Заговоры: {last.newCantrips.join(', ')}</p>}
              {last.newSpells?.length > 0 && <p className="text-xs" style={{ color: '#A0522D' }}>• Заклинания: {last.newSpells.map(s => `${s.name} (${s.level} ур.)`).join(', ')}</p>}
              {last.newSavingThrowProfs?.length > 0 && <p className="text-xs" style={{ color: '#A0522D' }}>• Влад. спасбросками: {last.newSavingThrowProfs.map(a => ABILITY_FULL[a] || a).join(', ')}</p>}
              {last.newSkillProfs?.length > 0 && <p className="text-xs" style={{ color: '#A0522D' }}>• Влад. навыками: {last.newSkillProfs.join(', ')}</p>}
              {last.newSkillExpertise?.length > 0 && <p className="text-xs" style={{ color: '#A0522D' }}>• Экспертиза: {last.newSkillExpertise.join(', ')}</p>}
              {last.newAttacks?.length > 0 && <p className="text-xs" style={{ color: '#A0522D' }}>• Атаки: {last.newAttacks.map(a => a.name).join(', ')}</p>}
              {last.notes && <p className="text-xs mt-1" style={{ color: '#8B6914' }}>{last.notes}</p>}
            </div>
          ) : (
            <div className="mb-4 p-3 rounded text-sm space-y-1" style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
              <p className="font-bold text-xs" style={{ color: '#8B6914' }}>⚠️ Запись о предыдущем уровне не найдена</p>
              <p className="text-xs" style={{ color: '#6B3A2A' }}>
                Персонаж будет понижен до {targetLevel} уровня, а здоровье скорректировано на среднее значение кости.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 parchment-btn-secondary py-2">Отмена</button>
            <button type="button" onClick={onConfirm} className="flex-1 parchment-btn font-bold text-sm py-2 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(180deg, #A0522D, #8B2500)' }}>
              <HourglassIcon size={16} />
              <span>Откатить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Level History ──

interface LevelHistoryModalProps {
  char: CharacterData;
  onClose: () => void;
  onClearHistory?: () => void;
  onDeleteEntry?: (index: number) => void;
}

const LevelHistoryModal = React.memo(function LevelHistoryModal({ char, onClose, onClearHistory, onDeleteEntry }: LevelHistoryModalProps) {
  const history = Array.isArray(char.levelHistory) ? char.levelHistory : [];

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="parchment-modal max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#3C2415' }}>
              <ScrollIcon size={22} />
              <span>История прокачки уровней</span>
            </h2>
            {history.length > 0 && onClearHistory && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Очистить всю историю прокачки? (Характеристики и умения персонажа останутся)')) {
                    onClearHistory();
                  }
                }}
                className="text-[11px] underline cursor-pointer hover:opacity-80 font-medium"
                style={{ color: '#8B2500' }}
                title="Очистить записи истории"
              >
                Очистить историю
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <ScrollIcon size={36} className="mx-auto opacity-60" />
              <p className="font-bold text-sm" style={{ color: '#5C341F' }}>История прокачки пуста</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: '#8B6914' }}>
                При каждом повышении уровня через кнопку «+» здесь автоматически сохраняются все выборы: здоровье, черты, характеристики, архетипы и умения.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div key={i} className="parchment-modal-section space-y-1.5 relative group">
                  <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold font-mono" style={{ background: '#5C3A6E', color: '#FBF0DC' }}>
                        {entry.level} уровень
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#8B2500' }}>+{entry.hpGained} HP</span>
                    </div>
                    {onDeleteEntry && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Удалить запись о ${entry.level} уровне из истории?`)) {
                            onDeleteEntry(i);
                          }
                        }}
                        className="text-xs text-red-700 opacity-60 hover:opacity-100 hover:scale-110 transition-all p-1"
                        title="Удалить эту запись"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {entry.newSubclass && (
                    <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#5C3A6E' }}>
                      <ScrollIcon size={14} />
                      <span>Архетип: {entry.newSubclass}</span>
                    </p>
                  )}

                  {entry.selectedFeat && (
                    <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#8B2500' }}>
                      <CrossedSwordsIcon size={14} />
                      <span>Черта: {entry.selectedFeat}</span>
                    </p>
                  )}

                  {entry.asiAbilities && entry.asiAbilities.length > 0 && (
                    <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#4a7c3f' }}>
                      <SparklesDndIcon size={14} />
                      <span>{entry.asiAbilities[0] === entry.asiAbilities[1]
                        ? `${ABILITY_FULL[entry.asiAbilities[0]] || entry.asiAbilities[0]} +2`
                        : entry.asiAbilities.map(a => `${ABILITY_FULL[a] || a} +1`).join(', ')}</span>
                    </p>
                  )}

                  {entry.addedTraits && entry.addedTraits.length > 0 && (
                    <div className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: '#3D2012' }}>
                      <span className="font-semibold flex items-center gap-1" style={{ color: '#5C341F' }}>
                        <GoldSealCheckIcon size={14} />
                        <span>Умения:</span>
                      </span>
                      <span>{entry.addedTraits.map(t => t.name).join(', ')}</span>
                    </div>
                  )}

                  {entry.spellSlotsGained && Object.keys(entry.spellSlotsGained).length > 0 && (
                    <div className="text-xs flex items-center gap-1 flex-wrap" style={{ color: '#5C3A6E' }}>
                      <span className="font-semibold flex items-center gap-1">
                        <CrystalBallDndIcon size={14} />
                        <span>Ячейки:</span>
                      </span>
                      {Object.entries(entry.spellSlotsGained).map(([lvl, cnt]) => (
                        <span key={lvl} className="px-1.5 py-0.2 rounded text-[10px] font-mono" style={{ background: '#E8D3A2', border: '1px solid #C9A84C' }}>
                          {lvl} кр: {cnt}
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.newCantrips?.length > 0 && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#5C3A6E' }}>
                      <SparklesDndIcon size={14} />
                      <span>Заговоры: {entry.newCantrips.join(', ')}</span>
                    </p>
                  )}

                  {entry.newSpells?.length > 0 && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#6B3A2A' }}>
                      <SpellbookIcon size={14} />
                      <span>Заклинания: {entry.newSpells.map(s => `${s.name} (${s.level} ур.)`).join(', ')}</span>
                    </p>
                  )}

                  {entry.newSavingThrowProfs?.length > 0 && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#8B6914' }}>
                      <EngravedShieldIcon size={14} />
                      <span>Спасброски: {entry.newSavingThrowProfs.map(a => ABILITY_FULL[a] || a).join(', ')}</span>
                    </p>
                  )}

                  {entry.newSkillProfs?.length > 0 && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#5C3A6E' }}>
                      <GoldSealCheckIcon size={14} />
                      <span>Навыки: {entry.newSkillProfs.join(', ')}</span>
                    </p>
                  )}

                  {entry.newSkillExpertise?.length > 0 && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#5C3A6E' }}>
                      <GoldSealCheckIcon size={14} />
                      <span>Экспертиза: {entry.newSkillExpertise.join(', ')}</span>
                    </p>
                  )}

                  {entry.newAttacks?.length > 0 && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#8B2500' }}>
                      <CrossedSwordsIcon size={14} />
                      <span>Атаки: {entry.newAttacks.map(a => a.name).join(', ')}</span>
                    </p>
                  )}

                  {entry.notes && (
                    <p className="text-xs mt-1 p-1.5 rounded whitespace-pre-wrap" style={{ background: 'rgba(232, 211, 162, 0.4)', color: '#5C341F' }}>
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t mt-4" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
            <button type="button" onClick={onClose} className="w-full parchment-btn-secondary py-2">Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  );
});


// ── Non-Class Spell Confirmation Warning Modal ──

interface NonClassSpellConfirmModalProps {
  char: CharacterData;
  spell: DndSpell;
  onConfirm: () => void;
  onCancel: () => void;
}

function NonClassSpellConfirmModal({ char, spell, onConfirm, onCancel }: NonClassSpellConfirmModalProps) {
  const allowedClasses = (spell.classes || []).join(', ') || 'Другие классы';
  const charClass = char.className || char.spellcastingClass || 'Без класса';

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[360] flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="parchment-modal max-w-md w-full p-5 space-y-4 shadow-2xl relative rounded-lg"
        style={{ background: '#F5E6C8', border: '3px solid #D9822B' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(217, 130, 43, 0.4)' }}>
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-base font-bold text-[#6B3A2A]" style={{ fontFamily: 'Georgia, serif' }}>
              Заклинание другого класса
            </h3>
            <div className="text-[11px]" style={{ color: '#8B6914' }}>
              Ограничение правил D&D 5e
            </div>
          </div>
        </div>

        <div className="text-xs space-y-2.5 leading-relaxed" style={{ color: '#4A2A18' }}>
          <div className="p-2.5 rounded space-y-1.5" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
            <div className="flex justify-between">
              <span>Заклинание:</span>
              <strong className="text-[#3D2012]">«{spell.name}» ({spell.level === 0 ? 'Заговор' : `${spell.level} круг`})</strong>
            </div>
            <div className="flex justify-between">
              <span>Доступно классам:</span>
              <strong className="text-[#A04000]">{allowedClasses}</strong>
            </div>
            <div className="flex justify-between border-t pt-1.5 mt-1" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
              <span>Ваш персонаж:</span>
              <strong className="text-[#5C341F]">{charClass} {char.subclass ? `(${char.subclass})` : ''}</strong>
            </div>
          </div>

          <p>
            В D&D 5e персонаж класса <strong>{charClass}</strong> не может изучать или готовить заклинания других классов (например, заклинания Друида, Волшебника или Барда) без соответствующего домена/покровителя, черты (например, <em>«Посвященный в магию»</em>, <em>«Фейский коснувшийся»</em>) или расового источника.
          </p>

          <div className="p-2 rounded text-[11px]" style={{ background: 'rgba(201, 168, 76, 0.2)', border: '1px dashed #C9A84C' }}>
            <p className="font-semibold text-[#5C341F]">💡 Добавление из внешнего источника:</p>
            <p className="opacity-90">
              Вы можете добавить это заклинание, если оно получено от свитка, магического предмета, обучения у мастера или специальной черты.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded text-xs font-semibold cursor-pointer"
            style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
            style={{ background: '#7C3E08', color: '#FBF0DC', border: '1px solid #5C341F' }}
          >
            <span>Всё равно добавить (от черты / свитка)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Class Template Modal ──

interface TemplateModalProps {
  onSelect: (templateId: string) => void;
  onCancel: () => void;
}

const TemplateModal = React.memo(function TemplateModal({ onSelect, onCancel }: TemplateModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'martial' | 'caster' | 'hybrid'>('all');

  const template = selected ? CLASS_TEMPLATES.find(t => t.id === selected) : null;

  const filtered = CLASS_TEMPLATES.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'martial') return !t.spellcasting.isCaster;
    if (filter === 'caster') return t.spellcasting.isCaster && ['Чародей', 'Волшебник', 'Колдун'].includes(t.name);
    if (filter === 'hybrid') return t.spellcasting.isCaster && !['Чародей', 'Волшебник', 'Колдун'].includes(t.name);
    return true;
  });

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="parchment-modal max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <ScrollIcon size={22} />
            <span>Шаблоны классов</span>
          </h2>
          <p className="text-sm mb-4" style={{ color: '#8B6914' }}>Выберите класс — лист заполнится типичными данными 1-го уровня. Всё можно изменить после.</p>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {([['all', 'Все'], ['martial', '⚔️ Воины'], ['caster', '✨ Маги'], ['hybrid', '⚡ Гибриды']] as const).map(([f, label]) => (
              <button key={f} onClick={() => setFilter(f as any)}
                className={filter === f ? 'parchment-filter-active' : 'parchment-filter-inactive'}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {filtered.map(t => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`parchment-template-card ${selected === t.id ? 'parchment-template-card-selected' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{t.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: '#3C2415' }}>{t.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#8B6914', background: 'rgba(139, 105, 20, 0.1)' }}>d{t.hitDieSize}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#5C3A6E', background: 'rgba(92, 58, 110, 0.1)' }}>{t.primaryAbility}</span>
                </div>
                <p className="text-xs" style={{ color: '#8B6914' }}>{t.role}</p>
              </button>
            ))}
          </div>

          {/* Detail preview */}
          {template && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{template.emoji}</span>
                <div>
                  <h3 className="font-bold" style={{ color: '#3C2415' }}>{template.name}</h3>
                  <p className="text-xs" style={{ color: '#8B6914' }}>{template.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span style={{ color: '#8B6914' }}>Кость хитов:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>1d{template.hitDieSize} (макс. {template.hitDieSize} + ТЕЛ на 1 ур.)</span>
                </div>
                <div>
                  <span style={{ color: '#8B6914' }}>Основная характ.:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>{template.primaryAbility}</span>
                </div>
                <div>
                  <span style={{ color: '#8B6914' }}>Спасброски:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>{template.savingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}</span>
                </div>
                <div>
                  <span style={{ color: '#8B6914' }}>Навыков:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>{template.skillChoices} из {template.skillOptions.length}</span>
                </div>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>Рекомендуемые навыки:</p>
                <div className="flex flex-wrap gap-1">
                  {template.recommendedSkills.map(s => (
                    <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(92, 58, 110, 0.1)', color: '#5C3A6E' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>Характеристики (станд. массив):</p>
                <div className="flex gap-3 text-xs">
                  {ABILITY_NAMES.map(ab => (
                    <div key={ab} className="text-center">
                      <div className="font-bold" style={{ color: '#3C2415' }}>{template.recommendedScores[ab]}</div>
                      <div className="text-[10px]" style={{ color: '#8B6914' }}>{ab} ({formatModifier(calcModifier(template.recommendedScores[ab]))})</div>
                    </div>
                  ))}
                </div>
              </div>

              {template.spellcasting.isCaster && (
                <div>
                  <p className="text-xs mb-1" style={{ color: '#8B6914' }}>Магия ({template.spellcasting.ability ? ABILITY_FULL[template.spellcasting.ability] : '—'}):</p>
                  <div className="text-xs space-y-0.5" style={{ color: '#3C2415' }}>
                    <p>Заговоры: {template.spellcasting.cantripsKnown} — {template.spellcasting.cantripList?.join(', ') || '—'}</p>
                    {template.spellcasting.spellListAt1 && template.spellcasting.spellListAt1.length > 0 && (
                      <p>Заклинания 1 ур.: {template.spellcasting.spellListAt1.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>Умения 1-го уровня:</p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: '#3C2415' }}>{template.features}</p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>Типичное снаряжение:</p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: '#3C2415' }}>{template.equipment}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-center pt-1" style={{ borderTop: '1px solid rgba(201, 168, 76, 0.3)' }}>
                <div className="rounded p-1.5" style={{ background: 'rgba(139, 105, 20, 0.08)' }}>
                  <div style={{ color: '#8B6914' }}>КД</div>
                  <div className="font-bold" style={{ color: '#6B3A2A' }}>{template.typicalAC}</div>
                </div>
                <div className="rounded p-1.5" style={{ background: 'rgba(139, 37, 0, 0.06)' }}>
                  <div style={{ color: '#8B6914' }}>Хиты 1 ур.</div>
                  <div className="font-bold" style={{ color: '#8B2500' }}>{template.hitDieSize + calcModifier(template.recommendedScores['ТЕЛ'])}</div>
                </div>
                <div className="rounded p-1.5" style={{ background: 'rgba(74, 124, 63, 0.08)' }}>
                  <div style={{ color: '#8B6914' }}>Золото</div>
                  <div className="font-bold text-[10px]" style={{ color: '#4a7c3f' }}>{template.startingGold}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 parchment-btn-secondary">Отмена</button>
            <button onClick={() => selected && onSelect(selected)}
              disabled={!selected}
              className={`flex-1 font-medium ${selected ? 'parchment-btn' : 'parchment-btn opacity-40 cursor-not-allowed'}`}>
              📋 Применить шаблон
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Auth Modal ──

const AuthModal = React.memo(function AuthModal({ onClose, onAuth, onGoogleAuth, email, setEmail, password, setPassword, isSignUp, setIsSignUp, loading, error }: {
  onClose: () => void;
  onAuth: () => void;
  onGoogleAuth: () => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  isSignUp: boolean; setIsSignUp: (v: boolean) => void;
  loading: boolean; error: string;
}) {
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="parchment-modal max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <RunedKeyIcon size={22} />
            <span>{isSignUp ? 'Регистрация' : 'Вход в аккаунт'}</span>
          </h2>

          <button onClick={onGoogleAuth} disabled={loading}
            className="w-full parchment-btn-secondary mb-4 flex items-center justify-center gap-2 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Войти через Google
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 105, 20, 0.3)' }}></div>
            <span className="text-xs" style={{ color: '#8B6914' }}>или</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 105, 20, 0.3)' }}></div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="space-y-1">
              <label className="parchment-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="parchment-input" />
            </div>
            <div className="space-y-1">
              <label className="parchment-label">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 6 символов" className="parchment-input" />
            </div>
          </div>

          {error && <p className="text-xs mb-3 p-2 rounded" style={{ color: error.includes('Проверьте') ? '#4a7c3f' : '#8B2500', background: error.includes('Проверьте') ? 'rgba(74,124,63,0.08)' : 'rgba(139,37,0,0.06)' }}>{error}</p>}

          <button onClick={onAuth} disabled={loading || !email || !password}
            className="w-full parchment-btn py-2.5 mb-3">
            {loading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </button>

          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-xs" style={{ color: '#8B6914', fontFamily: 'Georgia, "Times New Roman", serif', cursor: 'pointer', background: 'none', border: 'none' }}>
            {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
});



// ── Sign Out Confirmation Modal ──
const SignOutModal = React.memo(function SignOutModal({ userEmail, onConfirmSignOut, onSwitchAccount, onCancel }: {
  userEmail?: string | null;
  onConfirmSignOut: () => void;
  onSwitchAccount: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="parchment-modal max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <PortalIcon size={20} />
            <span>Выход из аккаунта</span>
          </h2>
          <p className="text-sm mb-3" style={{ color: '#3C2415' }}>
            Вы вошли как: <strong>{userEmail || 'Пользователь'}</strong>
          </p>
          <p className="text-xs mb-5" style={{ color: '#8B6914', lineHeight: 1.4 }}>
            Текущий лист персонажа останется в вашем браузере, а облачные копии сохранятся в вашем профиле.
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={onConfirmSignOut}
              className="w-full font-medium text-xs py-2"
              style={{
                background: 'linear-gradient(180deg, #A0522D, #8B2500)',
                color: '#FBF0DC',
                border: '1px solid #C9A84C',
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              Выйти из аккаунта
            </button>
            <button
              type="button"
              onClick={onSwitchAccount}
              className="w-full parchment-btn text-xs py-2"
            >
              Сменить аккаунт
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full parchment-btn-secondary text-xs py-2 mt-1"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

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

  // ── Auto-save to cloud (debounced 400ms with instant saving status) when logged in ──
  const cloudSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCloudSaveRef = React.useRef<string>('');
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const cloudCharIdRef = React.useRef<string | null>(null);
  const [activeCloudCharId, setActiveCloudCharId] = useState<string | null>(null);
  const cloudSaveInProgressRef = React.useRef(false);
  const pendingCloudSaveRef = React.useRef(false);
  const isCloudSyncingRef = React.useRef(false);

  // Helper: save to cloud (POST with id = upsert, server handles update/insert)
  const saveToCloud = useCallback(async (): Promise<boolean> => {
    // If a save is already in progress, mark as pending and skip
    if (cloudSaveInProgressRef.current) {
      pendingCloudSaveRef.current = true;
      return false;
    }
    cloudSaveInProgressRef.current = true;
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cloudCharIdRef.current || undefined,
          name: char.name || 'Безымянный',
          data: char,
          portrait_url: portraitUrl,
        }),
      });
      const result = await res.json();
      if (result.character?.id) {
        cloudCharIdRef.current = result.character.id;
        setActiveCloudCharId(result.character.id);
      }
      return !!result.character;
    } catch { return false; }
    finally {
      cloudSaveInProgressRef.current = false;
      // If changes happened while we were saving, trigger another save
      if (pendingCloudSaveRef.current) {
        pendingCloudSaveRef.current = false;
        setTimeout(() => saveToCloud(), 100);
      }
    }
  }, [char, portraitUrl]);

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
      lastCloudSaveRef.current = snapshot;
      const ok = await saveToCloud();
      setCloudSaveStatus(ok ? 'saved' : 'idle');
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
        isCloudSyncingRef.current = true;
        try {
          const res = await fetch('/api/characters');
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

  const handleRoll = useCallback((result: RollResult) => {
    setRollResult(result);
  }, []);

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
    if (weapon.category.includes('дальнобойное')) {
      bestMod = dexMod;
    } else if (weapon.finesse) {
      bestMod = Math.max(strMod, dexMod);
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
      };
      return { ...prev, attacks: a };
    });
  }, [char.abilityScores, char.abilityBonuses, char.asiBonuses, char.level]);

  const effectiveTraitsList = useMemo<TraitItem[]>(() => {
    if (char.traitsList && char.traitsList.length > 0) {
      return char.traitsList;
    }
    if (char.featuresTraits && char.featuresTraits.trim()) {
      const lines = char.featuresTraits.split('\n').filter(l => l.trim());
      return lines.map((line, idx) => {
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
    return [];
  }, [char.traitsList, char.featuresTraits]);

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
      if (entry.spellSlotsGained) {
        for (const [lvlStr, count] of Object.entries(entry.spellSlotsGained)) {
          const l = Number(lvlStr);
          updatedSpellSlots[l] = {
            totalSlots: count,
            expendedSlots: prev.spellSlots?.[l]?.expendedSlots || 0,
          };
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
      const addCantrips = entry.newCantrips.filter(c => c.trim());
      const updatedCantrips = [...prev.cantrips, ...addCantrips];
      // Add spells
      const updatedSpells = { ...prev.spellsByLevel };
      for (const spell of entry.newSpells) {
        if (!spell.name.trim()) continue;
        const lvl = spell.level;
        updatedSpells[lvl] = [...(updatedSpells[lvl] || []), { name: spell.name, prepared: spell.prepared }];
      }
      // Add saving throw proficiencies
      const updatedSaveProfs = { ...prev.savingThrowProficiencies };
      for (const ability of entry.newSavingThrowProfs) {
        updatedSaveProfs[ability] = true;
      }
      // Add skill proficiencies
      const updatedSkillProfs = { ...prev.skillProficiencies };
      for (const skill of entry.newSkillProfs) {
        updatedSkillProfs[skill] = true;
      }
      const updatedSkillExpertise = { ...prev.skillExpertise };
      for (const skill of entry.newSkillExpertise) {
        updatedSkillExpertise[skill] = true;
      }
      // Add attacks
      const addAttacks = entry.newAttacks.filter(a => a.name.trim());
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
      return {
        ...prev,
        level: entry.level,
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
      return {
        ...prev,
        level: newLevel,
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
    }));
    showToast('Доспех обновлен', armorName ? `Экипирован: ${armorName}` : 'Доспех снят');
  }, [showToast]);

  const handleToggleShield = useCallback((hasShield: boolean) => {
    setChar(prev => ({
      ...prev,
      equippedShield: hasShield,
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
        const res = await fetch('/api/upload-portrait', { method: 'POST', body: formData });
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
  }, [user, showToast]);

  const handleCloudSave = useCallback(async () => {
    if (!user) { showToast('Ошибка', 'Войдите в аккаунт'); return; }
    const ok = await saveToCloud();
    if (ok) {
      showToast('Сохранено', `"${char.name || 'Безымянный'}" сохранён в облако`);
    } else {
      showToast('Ошибка', 'Не удалось сохранить');
    }
  }, [user, saveToCloud, char.name, showToast]);

  const handleCloudLoad = useCallback(async () => {
    if (!user) {
      setShowCloudSaves(true);
      return;
    }
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      if (data.characters) {
        setCloudCharacters(data.characters);
      }
      setShowCloudSaves(true);
    } catch {
      setShowCloudSaves(true);
      showToast('Внимание', 'Не удалось связаться с облаком');
    }
  }, [user, showToast]);

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
      } else {
        cloudCharIdRef.current = null;
        setActiveCloudCharId(null);
        lastCloudSaveRef.current = '';
        setCloudSaveStatus('idle');
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
      await fetch('/api/characters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
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
  }, [handleReset, showToast]);

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
        <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={() => setShowCreateChoiceModal(false)}>
          <div
            className="parchment-modal max-w-lg w-full p-6 space-y-4 shadow-2xl relative rounded-xl"
            style={{ background: '#F5E6C8', border: '3px solid #C9A84C' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
              <div className="flex items-center gap-2.5">
                <UserHeroIcon size={26} />
                <div>
                  <h3 className="text-base sm:text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}>
                    Создание нового персонажа
                  </h3>
                  <p className="text-xs" style={{ color: '#8B6914' }}>
                    Выберите удобный для вас способ создания
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateChoiceModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold cursor-pointer"
                style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Interactive Wizard */}
              <div
                onClick={() => {
                  setShowCreateChoiceModal(false);
                  setShowCreationWizard(true);
                }}
                className="p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md space-y-1.5"
                style={{ background: '#FFFDF9', border: '2px solid #C9A84C' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#3D2012]">
                    <span className="text-xl">🧙‍♂️</span>
                    <span>Интерактивное пошаговое создание</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: '#E8D3A2', color: '#5C341F' }}>
                    Рекомендуется
                  </span>
                </div>
                <p className="text-xs text-[#5C341F] leading-relaxed">
                  Пошаговые вопросы: выбор расы, класса с жестким лимитом навыков (не дает взять лишнее!), предыстории с защитой от совпадений, расчет характеристик (Point Buy, 4d6, массив) и выбор заклинаний с лимитами.
                </p>
              </div>

              {/* Option 2: Manual Blank Sheet */}
              <div
                onClick={handleManualCreate}
                className="p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md space-y-1.5"
                style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(139, 105, 20, 0.3)' }}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#3D2012]">
                  <span className="text-xl">✍️</span>
                  <span>Полностью ручное создание (Чистый бланк)</span>
                </div>
                <p className="text-xs text-[#5C341F] leading-relaxed">
                  Создать пустой лист персонажа 1-го уровня. Вы сможете самостоятельно вручную вписать все названия, значения характеристик, особенности и снаряжение.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
              <button
                type="button"
                onClick={() => setShowCreateChoiceModal(false)}
                className="parchment-btn-secondary text-xs px-4 py-1.5"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 parchment-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <D20Icon size={28} />
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight">Лист персонажа D&D 5e</h1>
              <p className="text-[11px] leading-tight text-amber-100/70">Интерактивный бланк для игры</p>
            </div>
          </div>

          <div className="parchment-toolbar">
            {/* Create Character group */}
            <div className="parchment-btn-group">
              <button
                type="button"
                onClick={() => setShowCreateChoiceModal(true)}
                className="parchment-header-btn flex items-center gap-1.5 font-bold"
                title="Создать персонажа: Интерактивный мастер или чистый бланк"
                style={{
                  background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.4) 0%, rgba(139, 105, 20, 0.3) 100%)',
                  border: '1px solid #C9A84C',
                  color: '#FFF8EB'
                }}
              >
                <UserHeroIcon size={16} />
                <span>Создать персонажа</span>
              </button>
            </div>

            {/* Template presets group */}
            <div className="parchment-btn-group">
              <button type="button" onClick={() => setShowTemplates(true)} className="parchment-header-btn flex items-center gap-1.5" title="Выбрать готовый шаблон класса">
                <ScrollIcon size={16} />
                <span>Шаблоны</span>
              </button>
            </div>

            {/* File actions group */}
            <div className="parchment-btn-group">
              <button type="button" onClick={handleSaveJSON} className="parchment-header-btn flex items-center gap-1.5" title="Сохранить в JSON">
                <SpellbookIcon size={16} />
                <span>JSON</span>
              </button>
              <button type="button" onClick={handleLoadJSON} className="parchment-header-btn flex items-center gap-1.5" title="Загрузить из JSON">
                <ChestIcon size={16} />
                <span>Загрузить JSON</span>
              </button>
              <button type="button" onClick={handleReset} className="parchment-header-btn flex items-center gap-1.5" title="Очистить лист">
                <HourglassIcon size={16} />
                <span>Сброс</span>
              </button>
            </div>

            {/* Cloud / Auth group */}
            {user ? (
              <div className="parchment-btn-group">
                <button
                  type="button"
                  onClick={handleCloudSave}
                  className="parchment-header-btn min-w-[128px] inline-flex items-center justify-center gap-1.5 text-center"
                  title="Синхронизировать с облаком"
                >
                  {cloudSaveStatus === 'saving' ? (
                    <>
                      <MysticSpinnerIcon size={15} />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <GoldSealCheckIcon size={15} />
                      <span>Сохранено</span>
                    </>
                  )}
                </button>
                <button type="button" onClick={handleCloudLoad} className="parchment-header-btn flex items-center gap-1.5" title="Список сохранённых персонажей">
                  <MysticCloudIcon size={16} />
                  <span>Персонажи</span>
                </button>
                <button type="button" onClick={handleShare} className="parchment-header-btn flex items-center gap-1.5" title="Поделиться ссылкой с Мастером (DM)">
                  <ArcaneLinkIcon size={16} />
                  <span>Поделиться</span>
                </button>
                <button type="button" onClick={() => setShowSignOutModal(true)} className="parchment-header-btn flex items-center gap-1.5" title="Выйти из аккаунта или сменить пользователя">
                  <PortalIcon size={16} />
                  <span>Выйти из аккаунта</span>
                </button>
              </div>
            ) : (
              <div className="parchment-btn-group">
                <button type="button" onClick={handleCloudLoad} className="parchment-header-btn flex items-center gap-1.5" title="Список сохранённых персонажей">
                  <MysticCloudIcon size={16} />
                  <span>Персонажи</span>
                </button>
                <button type="button" onClick={handleShare} className="parchment-header-btn flex items-center gap-1.5" title="Поделиться ссылкой с Мастером (DM)">
                  <ArcaneLinkIcon size={16} />
                  <span>Поделиться</span>
                </button>
                <button type="button" onClick={() => setShowAuth(true)} className="parchment-header-btn flex items-center gap-1.5" title="Вход в аккаунт для облачного сохранения">
                  <RunedKeyIcon size={16} />
                  <span>Войти</span>
                </button>
              </div>
            )}

            {/* Primary export button */}
            <button type="button" onClick={handleExport} className="parchment-header-btn-primary flex items-center gap-1.5" title="Экспортировать лист персонажа в файл Word">
              <QuillIcon size={16} />
              <span>Экспорт DOCX</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 mb-6 parchment-tabs">
          {[
            { key: 'page1' as const, label: 'Основной лист', shortLabel: 'Лист' },
            { key: 'page2' as const, label: 'Детали', shortLabel: 'Детали' },
            { key: 'page3' as const, label: 'Заклинания', shortLabel: 'Магия' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded transition-colors ${activeTab === tab.key ? 'parchment-tab-active' : 'parchment-tab-inactive'}`}>
              <span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* ═══ PAGE 1 ═══ */}
        {activeTab === 'page1' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">

              {/* Basic Info */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><UserHeroIcon size={20} /><span>Основная информация</span></h3></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="parchment-label">Имя персонажа</label>
                        <button
                          type="button"
                          onClick={() => setShowNameGenModal(true)}
                          className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-0.5"
                          style={{ color: '#8B6914' }}
                          title="Открыть генератор фэнтезийных имён с этимологией и корнями"
                        >
                          🎲 Имена
                        </button>
                      </div>
                      <input
                        type="text"
                        value={char.name}
                        onChange={e => update('name', e.target.value)}
                        placeholder="Имя"
                        className={inputClass}
                      />
                    </div>
                    <StatInput label="Имя игрока" value={char.playerName} onChange={v => update('playerName', v)} type="text" placeholder="Игрок" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="parchment-label">Класс</label>
                        {char.level <= 1 && (
                          <button
                            type="button"
                            onClick={() => setShowClassModal(true)}
                            className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-0.5"
                            style={{ color: '#8B6914' }}
                            title="Выбрать класс из компендиума"
                          >
                            📖 Каталог классов
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={char.className}
                        onChange={e => update('className', e.target.value)}
                        placeholder="Воин"
                        className={inputClass}
                      />
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px]" style={{ color: '#8B6914' }}>Архетип:</span>
                        <span
                          className="text-[10px] font-bold truncate max-w-[140px]"
                          style={{ color: '#6B3A2A' }}
                          title={char.subclass ? `Архетип: ${char.subclass}` : 'Выбор архетипа на соответствующем уровне'}
                        >
                          {char.subclass ? `👑 ${char.subclass}` : 'Выбор на уровне'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="parchment-label">Уровень</label>
                      <div className="flex items-center gap-1">
                        <span className="flex-1 text-center font-bold text-lg" style={{ color: '#6B3A2A', fontFamily: 'Georgia, "Times New Roman", serif' }}>{char.level}</span>
                        <button onClick={() => char.level > 1 && setShowLevelDown(true)} disabled={char.level <= 1}
                          className="parchment-level-btn" title="Понизить">−</button>
                        <button onClick={() => char.level < 20 && setShowLevelUp(true)} disabled={char.level >= 20}
                          className="parchment-level-btn" title="Повысить">+</button>
                        <button onClick={() => setShowHistory(true)} className="parchment-level-btn" title="История уровней"><ScrollIcon size={14} /></button>
                      </div>
                    </div>
                    <StatInput label="Предыстория" value={char.background} onChange={v => update('background', v)} type="text" placeholder="Солдат" className="col-span-2 sm:col-span-1" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="parchment-label">Раса</label>
                        {char.level <= 1 && (
                          <button
                            type="button"
                            onClick={() => setShowRaceModal(true)}
                            className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-0.5"
                            style={{ color: '#8B6914' }}
                            title="Открыть полный компендиум рас"
                          >
                            📖 Каталог рас
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={char.race}
                        onChange={e => update('race', e.target.value)}
                        placeholder="Дворф"
                        className={inputClass}
                      />
                    </div>
                    <StatInput label="Мировоззрение" value={char.alignment} onChange={v => update('alignment', v)} type="text" placeholder="Законно-добрый" />
                    <StatInput label="Очки опыта" value={char.experiencePoints} onChange={v => update('experiencePoints', v)} placeholder="0" className="col-span-2 sm:col-span-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="parchment-checkbox"><input type="checkbox" checked={char.inspiration} onChange={e => update('inspiration', e.target.checked)} /><span className="checkmark"></span></label>
                    <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Вдохновение</span>
                  </div>
                </div>
              </div>

              {/* Abilities */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="parchment-heading flex items-center gap-2">
                      <SparklesDndIcon size={20} />
                      <span>Характеристики</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowStatsCalcModal(true)}
                        className="text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        style={{
                          background: 'linear-gradient(180deg, #8B4513, #6B3A2A)',
                          color: '#FBF0DC',
                          border: '1px solid #C9A84C',
                        }}
                        title="Открыть калькулятор характеристик (Point Buy, 4к6, Standard Array)"
                      >
                        <D20Icon size={13} />
                        <span>Калькулятор</span>
                      </button>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                        style={
                          baseAbilitySum > 75
                            ? { background: '#FFEBE6', color: '#D9381E', border: '1px solid #FF8F73' }
                            : { background: 'rgba(232, 211, 162, 0.5)', color: '#6B3A2A', border: '1px solid rgba(201, 168, 76, 0.4)' }
                        }
                        title="Сумма базовых характеристик (Standard Array = 72, Point Buy = 72..75)"
                      >
                        База: {baseAbilitySum}/72
                      </span>
                      <span className="text-xs font-normal" style={{ color: '#8B6914' }}>
                        Мастерство: {formatModifier(profBonus)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    <div className="hidden sm:grid gap-1 text-xs font-medium px-1" style={{ color: '#8B6914', gridTemplateColumns: '2fr repeat(6, 1fr)' }}>
                      <span>Характ.</span><span className="text-center">База</span><span className="text-center">Раса</span><span className="text-center">АСИ</span><span className="text-center">Итого</span><span className="text-center">Мод.</span><span className="text-center">Спасбр.</span>
                    </div>
                    {ABILITY_NAMES.map(abbr => {
                      const base = char.abilityScores[abbr] || 10;
                      const racial = char.abilityBonuses[abbr] || 0;
                      const asi = char.asiBonuses[abbr] || 0;
                      const total = getTotalScore(char, abbr);
                      const mod = getModifier(char, abbr);
                      const save = getSavingThrow(char, abbr);
                      const isProf = char.savingThrowProficiencies[abbr];
                      const maxAllowed = (char.className === 'Варвар' && char.level >= 20) ? 24 : 20;
                      const isOverMax = total > maxAllowed;

                      return (
                        <div key={abbr} className={`p-2 rounded ${isProf ? 'parchment-prof' : 'parchment-no-prof'}`}>
                          {/* Mobile layout — stacked grid for narrow screens */}
                          <div className="sm:hidden grid grid-cols-2 gap-x-2 gap-y-1 items-center">
                            {/* Name + total+mod in top-left */}
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs font-bold" style={{ color: '#3C2415' }}>{abbr}</span>
                              <span className={`text-xs font-bold ${isOverMax ? 'text-red-700' : ''}`} style={{ color: isOverMax ? '#C92A2A' : '#6B3A2A' }}>
                                {total}
                              </span>
                              {isOverMax && <span title={`Превышает обычный максимум D&D 5e (${maxAllowed})`} className="text-[10px] cursor-help">⚠️</span>}
                              <span className="text-[11px]" style={{ color: '#8B6914' }}>({formatModifier(mod)})</span>
                            </div>
                            {/* Save throw in top-right */}
                            <div className="flex items-center justify-end gap-1">
                              <label className="parchment-checkbox parchment-checkbox-sm"><input type="checkbox" checked={isProf} onChange={e => updateSaveProf(abbr, e.target.checked)} /><span className="checkmark"></span></label>
                              <RollBadge value={formatModifier(save)} label={`Спасбросок ${ABILITY_FULL[abbr]}`} modifier={save} onRoll={handleRoll} />
                            </div>
                            {/* База input bottom-left */}
                            <div>
                              <label className="text-[10px] block leading-tight" style={{ color: '#8B6914' }}>База</label>
                              <input type="number" value={base} onChange={e => updateAbility(abbr, 'abilityScores', Number(e.target.value) || 10)} className={inputClassCenter + " text-xs"} style={{ height: '24px' }} />
                            </div>
                            {/* Раса input + АСИ bottom-right */}
                            <div className="flex items-end gap-1.5">
                              <div className="flex-1 min-w-0">
                                <label className="text-[10px] block leading-tight" style={{ color: '#8B6914' }}>Раса</label>
                                <input type="number" value={racial} onChange={e => updateAbility(abbr, 'abilityBonuses', Number(e.target.value) || 0)} className={inputClassCenter + " text-xs"} style={{ height: '24px' }} />
                              </div>
                              <div className="shrink-0 pb-0.5">
                                <span className="text-[10px]" style={{ color: '#5C3A6E' }}>АСИ:{asi > 0 ? `+${asi}` : '0'}</span>
                              </div>
                            </div>
                          </div>
                          {/* Desktop layout */}
                          <div className={`hidden sm:grid gap-1 items-center p-1.5 rounded ${isProf ? 'parchment-prof' : 'parchment-no-prof'}`} style={{ gridTemplateColumns: '2fr repeat(6, 1fr)' }}>
                            <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#3C2415' }}>{ABILITY_FULL[abbr]}</span>
                            <input type="number" value={base} onChange={e => updateAbility(abbr, 'abilityScores', Number(e.target.value) || 10)} className={inputClassCenter + " text-xs"} />
                            <input type="number" value={racial} onChange={e => updateAbility(abbr, 'abilityBonuses', Number(e.target.value) || 0)} className={inputClassCenter + " text-xs"} title="Расовый бонус" />
                            <CalcBadge value={asi > 0 ? `+${asi}` : '0'} />
                            <div className="flex items-center justify-center gap-1">
                              <CalcBadge value={total} />
                              {isOverMax && <span title={`Превышает обычный максимум D&D 5e (${maxAllowed})`} className="text-[11px] cursor-help">⚠️</span>}
                            </div>
                            <RollBadge value={formatModifier(mod)} label={`Проверка ${ABILITY_FULL[abbr]}`} modifier={mod} onRoll={handleRoll} />
                            <div className="flex items-center gap-1">
                              <label className="parchment-checkbox parchment-checkbox-sm"><input type="checkbox" checked={isProf} onChange={e => updateSaveProf(abbr, e.target.checked)} /><span className="checkmark"></span></label>
                              <RollBadge value={formatModifier(save)} label={`Спасбросок ${ABILITY_FULL[abbr]}`} modifier={save} onRoll={handleRoll} />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Warning alert if stats exceed official limits */}
                    {abilityWarnings.length > 0 && (
                      <div className="p-2.5 rounded text-xs flex items-center gap-2 mt-2" style={{ background: 'rgba(230, 140, 20, 0.15)', border: '1px solid rgba(200, 120, 20, 0.4)', color: '#7C3E08' }}>
                        <span className="text-base leading-none">⚠️</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold">Предупреждение по правилам D&D 5e:</span>
                          <div className="text-[11px] opacity-90">{abilityWarnings.join(' • ')}</div>
                        </div>
                      </div>
                    )}

                    {/* Footer controls & hint */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pt-1">
                      <button
                        type="button"
                        onClick={handleResetToStandardScores}
                        className="text-[11px] font-bold underline cursor-pointer hover:opacity-80"
                        style={{ color: '#8B6914' }}
                        title="Установить рекомендованный стандартный набор 15, 14, 13, 12, 10, 8 для этого класса"
                      >
                        🎯 Сбросить на стандарт класса ({compClass?.name || char.className || 'Воин'})
                      </button>
                      <p className="text-[10px]" style={{ color: '#8B6914' }}>
                        База | Раса | АСИ · Нажмите Мод./Спасбр. для d20
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combat */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><EngravedShieldIcon size={20} /><span>Боевые параметры</span></h3></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="parchment-label">КД</label><input type="number" value={char.armorClass ?? ''} onChange={e => update('armorClass', e.target.value === '' ? null : Number(e.target.value))} placeholder={String(getAC(char))} className={inputClass} /></div>
                    <div className="space-y-1"><label className="parchment-label">Инициатива</label><div className="flex items-center gap-1"><RollBadge value={formatModifier(getInitiative(char))} label="Инициатива" modifier={getInitiative(char)} onRoll={handleRoll} /><input type="number" value={char.initiativeOverride ?? ''} onChange={e => update('initiativeOverride', e.target.value === '' ? null : Number(e.target.value))} placeholder="Авто" className={inputClass + " flex-1"} /></div></div>
                    <div className="space-y-1"><label className="parchment-label">Скорость (фт.)</label><input type="number" value={char.speed} onChange={e => update('speed', Number(e.target.value) || 30)} className={inputClass} /></div>
                  </div>
                  {/* Armor & Shield Selector */}
                  <div className="p-2.5 rounded space-y-2" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <div className="flex items-center justify-between">
                      <label className="parchment-label text-[11px]">Экипированный доспех</label>
                      {char.equippedArmor && (
                        <button
                          type="button"
                          onClick={() => {
                            const item = findItemByName(char.equippedArmor || '');
                            if (item) setActiveItemModal(item);
                          }}
                          className="text-[10px] underline font-bold cursor-pointer"
                          style={{ color: '#8B6914' }}
                          title="Свойства доспеха"
                        >
                          Свойства доспеха
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <select
                        value={char.equippedArmor || ''}
                        onChange={e => handleEquipArmor(e.target.value)}
                        className="parchment-select text-xs sm:col-span-2 py-1"
                      >
                        <option value="">Без доспехов (КД 10 + ЛОВ)</option>
                        <optgroup label="Лёгкие доспехи (+ ЛОВ)">
                          <option value="Стеганый доспех">Стеганый доспех (11 + ЛОВ)</option>
                          <option value="Кожаный доспех">Кожаный доспех (11 + ЛОВ)</option>
                          <option value="Проклепанный кожаный доспех">Проклепанный кожаный (12 + ЛОВ)</option>
                        </optgroup>
                        <optgroup label="Средние доспехи (+ ЛОВ макс. +2)">
                          <option value="Шкурный доспех">Шкурный доспех (12 + ЛОВ макс. 2)</option>
                          <option value="Кольчужная рубаха">Кольчужная рубаха (13 + ЛОВ макс. 2)</option>
                          <option value="Чешуйчатый доспех">Чешуйчатый доспех (14 + ЛОВ макс. 2)</option>
                          <option value="Кираса">Кираса (14 + ЛОВ макс. 2)</option>
                          <option value="Полулаты">Полулаты (15 + ЛОВ макс. 2)</option>
                        </optgroup>
                        <optgroup label="Тяжёлые доспехи (без ЛОВ)">
                          <option value="Колечный доспех">Колечный доспех (14)</option>
                          <option value="Кольчуга">Кольчуга (16, СИЛ 13)</option>
                          <option value="Наборный доспех">Наборный доспех (17, СИЛ 15)</option>
                          <option value="Латы">Латы (18, СИЛ 15)</option>
                        </optgroup>
                      </select>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!char.equippedShield}
                          onChange={e => handleToggleShield(e.target.checked)}
                          className="accent-[#8B6914] w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#3D2012' }}>🛡️ Щит (+2 КД)</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="parchment-label">Макс. хитов</label><input type="number" value={char.hpMax ?? ''} onChange={e => update('hpMax', e.target.value === '' ? null : Number(e.target.value))} className={inputClass} /></div>
                    <div className="space-y-1"><label className="parchment-label">Текущие хиты</label><input type="number" value={char.hpCurrent} onChange={e => update('hpCurrent', Number(e.target.value) || 0)} className={inputClass} /></div>
                    <div className="space-y-1"><label className="parchment-label">Врем. хиты</label><input type="number" value={char.hpTemp} onChange={e => update('hpTemp', Number(e.target.value) || 0)} className={inputClass} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatInput label="Кость хитов" value={char.hitDice} onChange={v => update('hitDice', v)} type="text" placeholder="1d10" />
                    <div className="space-y-1"><label className="parchment-label">Пассивная внимательность</label><CalcBadge value={getPassivePerception(char)} /></div>
                  </div>
                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(201, 168, 76, 0.3)' }}>
                    <label className="text-xs font-medium" style={{ color: '#8B6914' }}>Спасброски от смерти</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#8B6914' }}>Успехи:</span>{[0,1,2].map(i => (<button key={`s${i}`} onClick={() => updateDeathSave('deathSaveSuccesses', i < char.deathSaveSuccesses ? -1 : 1)} className={i < char.deathSaveSuccesses ? 'death-save-success' : 'death-save-empty'} />))}</div>
                      <div className="flex items-center gap-1"><span className="text-xs" style={{ color: '#8B6914' }}>Провалы:</span>{[0,1,2].map(i => (<button key={`f${i}`} onClick={() => updateDeathSave('deathSaveFailures', i < char.deathSaveFailures ? -1 : 1)} className={i < char.deathSaveFailures ? 'death-save-failure' : 'death-save-empty'} />))}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><CoinsChestIcon size={20} /><span>Валюта</span></h3></div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[{ key: 'cp' as const, label: 'ММ' },{ key: 'sp' as const, label: 'СМ' },{ key: 'ep' as const, label: 'ЭМ' },{ key: 'gp' as const, label: 'ЗМ' },{ key: 'pp' as const, label: 'ПМ' }].map(c => (
                      <div key={c.key} className="space-y-1 text-center"><label className="parchment-label">{c.label}</label><input type="number" value={char[c.key]} onChange={e => update(c.key, Number(e.target.value) || 0)} className={inputClassCenter} /></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7 space-y-4">

              {/* Skills */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><SparklesDndIcon size={20} /><span>Навыки</span> <span className="ml-auto text-xs font-normal" style={{ color: '#8B6914' }}>☑ = владение · ☑☑ = экспертиза · Нажмите для броска</span></h3></div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                    {ALL_SKILLS.map(skill => {
                      const ability = SKILL_MAP[skill];
                      const isProf = char.skillProficiencies[skill];
                      const isExpert = char.skillExpertise[skill];
                      const bonus = getSkillBonus(char, skill);
                      return (
                        <div key={skill} className={`flex items-center gap-2 py-1 px-2 rounded text-sm ${isExpert ? 'parchment-skill-expert' : isProf ? 'parchment-skill-prof' : ''}`}>
                          <label className="parchment-checkbox parchment-checkbox-sm"><input type="checkbox" checked={isProf} onChange={e => updateSkillProf(skill, 'skillProficiencies', e.target.checked)} /><span className="checkmark"></span></label>
                          <label className="parchment-checkbox parchment-checkbox-sm parchment-checkbox-expert"><input type="checkbox" checked={isExpert} onChange={e => updateSkillProf(skill, 'skillExpertise', e.target.checked)} disabled={!isProf} /><span className="checkmark"></span></label>
                          <span className="flex-1 text-xs" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{skill} <span style={{ color: '#8B6914' }}>({ability})</span></span>
                          <RollBadge value={formatModifier(bonus)} label={`Проверка ${skill}`} modifier={bonus} onRoll={handleRoll} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Attacks */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><CrossedSwordsIcon size={20} /><span>Атаки и оружие</span></h3></div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-[1fr_70px_1fr_32px_32px] gap-1.5 text-xs font-medium px-1" style={{ color: '#8B6914' }}>
                    <span>Оружие (автопоиск)</span>
                    <span>Бонус</span>
                    <span>Урон / Вид</span>
                    <span className="text-center" title="Свойства и правила">Инфо</span>
                    <span />
                  </div>
                  {char.attacks.map((atk, i) => {
                    const weaponDef = findWeaponByName(atk.name);
                    return (
                      <div key={i} className="grid grid-cols-[1fr_70px_1fr_32px_32px] gap-1.5 items-center">
                        <AutocompleteInput
                          value={atk.name}
                          onChange={val => updateAttack(i, 'name', val)}
                          onSelect={item => handleSelectWeapon(i, item)}
                          items={weaponAutocompleteItems}
                          placeholder="Оружие или атака..."
                          className={inputClass}
                        />
                        <input
                          value={atk.attackBonus}
                          onChange={e => updateAttack(i, 'attackBonus', e.target.value)}
                          placeholder="+5"
                          className={inputClassCenter + " w-full"}
                        />
                        <input
                          value={atk.damageAndType}
                          onChange={e => updateAttack(i, 'damageAndType', e.target.value)}
                          placeholder="1d8+3 рубящий"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => setActiveWeaponModal({
                            weapon: weaponDef || null,
                            customName: atk.name || 'Атака',
                            customBonus: atk.attackBonus,
                            customDamage: atk.damageAndType
                          })}
                          title="Посмотреть свойства оружия"
                          className="w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-transform active:scale-95 hover:brightness-110"
                          style={{
                            background: 'rgba(237, 224, 200, 0.6)',
                            border: '1px solid rgba(139, 105, 20, 0.35)',
                            boxShadow: '0 1px 3px rgba(61, 32, 18, 0.15)'
                          }}
                        >
                          <InfoSealIcon size={18} />
                        </button>
                        <button onClick={() => removeAttack(i)} className="parchment-remove-btn w-8 h-8 flex items-center justify-center">✕</button>
                      </div>
                    );
                  })}
                  <button onClick={addAttack} className="w-full parchment-btn-secondary text-xs py-2">+ Добавить атаку</button>
                </div>
              </div>

              {/* Personality */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><MasksDramaIcon size={20} /><span>Личность</span></h3></div>
                <div className="px-4 pb-4 space-y-3">
                  {[{ label: 'Черты характера', key: 'personalityTraits' as const },{ label: 'Идеалы', key: 'ideals' as const },{ label: 'Привязанности', key: 'bonds' as const },{ label: 'Слабости', key: 'flaws' as const }].map(item => (
                    <div key={item.key} className="space-y-1"><label className="parchment-label">{item.label}</label><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={2} className={textareaClass} /></div>
                  ))}
                </div>
              </div>

              {/* Other Proficiencies & Languages */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><ScrollIcon size={18} /><span>Прочие владения и языки</span></h3></div>
                <div className="px-4 pb-4"><textarea value={char.otherProficienciesLanguages} onChange={e => update('otherProficienciesLanguages', e.target.value)} rows={3} className={textareaClass} /></div>
              </div>

              {/* Equipment */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><BackpackPackIcon size={18} /><span>Снаряжение</span></h3></div>
                <div className="px-4 pb-4"><textarea value={char.equipment} onChange={e => update('equipment', e.target.value)} rows={3} className={textareaClass} /></div>
              </div>

              {/* Features & Traits Table */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <h3 className="parchment-heading flex items-center gap-2">
                    <SparklesDndIcon size={18} />
                    <span>Умения и особенности</span>
                    <span className="text-xs font-normal opacity-70">({effectiveTraitsList.length})</span>
                  </h3>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  {/* Search & Quick Add Trait */}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <AutocompleteInput
                        value={traitSearchQuery}
                        onChange={setTraitSearchQuery}
                        onSelect={item => {
                          const t = item.data as DndTrait;
                          addTraitItem(t);
                        }}
                        items={traitAutocompleteItems}
                        placeholder="Поиск способности (Второе дыхание, Ярость, Темное зрение)..."
                        autoClearOnSelect={true}
                        className={inputClass + " w-full text-xs"}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => addTraitItem(undefined, traitSearchQuery)}
                      className="parchment-btn-secondary text-xs px-3 py-1.5 shrink-0"
                    >
                      + Добавить
                    </button>
                  </div>

                  {traitAddSuccess && (
                    <div className="text-xs font-medium px-3 py-1.5 rounded flex items-center justify-between" style={{ background: 'rgba(201, 168, 76, 0.15)', color: '#6B3A2A', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                      <span>{traitAddSuccess}</span>
                      <button onClick={() => setTraitAddSuccess(null)} className="opacity-70 hover:opacity-100 font-bold ml-2">✕</button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {effectiveTraitsList.length === 0 ? (
                      <div className="text-center py-4 text-xs italic" style={{ color: '#8B6914' }}>
                        Список пуст. Введите способность в поле выше или нажмите «+ Добавить».
                      </div>
                    ) : (
                      effectiveTraitsList.map((traitItem, i) => {
                        const matchedCompendium = findTraitByName(traitItem.name);
                        return (
                          <div
                            key={traitItem.id || i}
                            className="py-2 border-b last:border-b-0 space-y-1"
                            style={{ borderColor: 'rgba(139, 105, 20, 0.2)' }}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1">
                                <AutocompleteInput
                                  value={traitItem.name}
                                  onChange={val => updateTraitItem(i, 'name', val)}
                                  onSelect={item => {
                                    const t = item.data as DndTrait;
                                    if (t) {
                                      updateTraitItem(i, 'name', t.name);
                                    }
                                  }}
                                  items={traitAutocompleteItems}
                                  placeholder="Название умения..."
                                  className={inputClass + " font-bold text-xs"}
                                />
                              </div>
                              <input
                                value={traitItem.source || ''}
                                onChange={e => updateTraitItem(i, 'source', e.target.value)}
                                placeholder="Источник"
                                className={inputClass + " w-28 text-[11px]"}
                              />
                              <button
                                type="button"
                                onClick={() => setActiveTraitModal({
                                  trait: matchedCompendium || null,
                                  customName: traitItem.name || 'Умение',
                                  customSource: traitItem.source,
                                  customSummary: traitItem.summary,
                                  customDescription: traitItem.description,
                                  traitIndex: i
                                })}
                                title="Подробное описание правила"
                                className="w-7 h-7 shrink-0 flex items-center justify-center rounded transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                style={{
                                  background: 'rgba(237, 224, 200, 0.6)',
                                  border: '1px solid rgba(139, 105, 20, 0.35)'
                                }}
                              >
                                <InfoSealIcon size={16} />
                              </button>
                              <button
                                onClick={() => removeTraitItem(i)}
                                className="parchment-remove-btn w-7 h-7 shrink-0 flex items-center justify-center cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            <input
                              value={traitItem.summary || ''}
                              onChange={e => updateTraitItem(i, 'summary', e.target.value)}
                              placeholder="Краткая суть умения (действие, урон, хиты...)"
                              className={inputClass + " text-[11px] opacity-85"}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PAGE 2 ═══ */}
        {activeTab === 'page2' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="parchment-card">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><UserHeroIcon size={20} /><span>Физическое описание</span></h3></div>
              <div className="px-4 pb-4 space-y-3">
                {/* Portrait */}
                <div className="mb-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {portraitUrl ? (
                        <div className="relative w-24 h-24 rounded" style={{ border: '2px solid rgba(139, 105, 20, 0.4)', overflow: 'hidden' }}>
                          <label className="w-full h-full cursor-pointer block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={portraitUrl} alt="Портрет" className="w-full h-full object-cover" />
                            <input type="file" accept="image/*" onChange={handlePortraitUpload} className="hidden" />
                          </label>
                          <button onClick={() => setPortraitUrl(null)} className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-[10px] cursor-pointer" style={{ background: 'rgba(139, 37, 0, 0.7)', color: '#FBF0DC', border: 'none', borderRadius: '0 0 0 3px' }}>✕</button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 flex flex-col items-center justify-center cursor-pointer rounded gap-1" style={{ border: '2px dashed rgba(139, 105, 20, 0.3)', background: 'rgba(251, 240, 220, 0.3)' }}>
                          <CameraPortraitIcon size={24} />
                          <span className="text-[10px] text-center px-1" style={{ color: '#8B6914' }}>Загрузить портрет</span>
                          <input type="file" accept="image/*" onChange={handlePortraitUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="parchment-label">Внешность (описание)</label>
                      <textarea value={char.appearance} onChange={e => update('appearance', e.target.value)} rows={4} className={textareaClass} placeholder="Опишите внешность персонажа: цвет волос, глаз, отличительные черты..." />
                    </div>
                  </div>
                  {!portraitUrl && (
                    <label className="mt-2 inline-flex items-center gap-1 cursor-pointer text-xs" style={{ color: '#8B6914' }}>
                      <input type="file" accept="image/*" onChange={handlePortraitUpload} className="hidden" />
                      + Добавить картинку
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatInput label="Возраст" value={char.age} onChange={v => update('age', v)} type="text" />
                  <StatInput label="Рост" value={char.height} onChange={v => update('height', v)} type="text" />
                  <StatInput label="Вес" value={char.weight} onChange={v => update('weight', v)} type="text" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatInput label="Глаза" value={char.eyes} onChange={v => update('eyes', v)} type="text" />
                  <StatInput label="Кожа" value={char.skin} onChange={v => update('skin', v)} type="text" />
                  <StatInput label="Волосы" value={char.hair} onChange={v => update('hair', v)} type="text" />
                </div>
              </div>
            </div>
            {[
              { label: 'Внешность', key: 'appearance' as const, rows: 5, icon: <UserHeroIcon size={18} /> },
              { label: 'Союзники и организации', key: 'alliesOrganizations' as const, rows: 5, icon: <ArcaneLinkIcon size={18} /> },
              { label: 'Доп. умения и особенности', key: 'additionalFeaturesTraits' as const, rows: 5, icon: <SparklesDndIcon size={18} /> }
            ].map(item => (
              <div key={item.key} className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2">{item.icon}<span>{item.label}</span></h3></div>
                <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} /></div>
              </div>
            ))}
            {[
              { label: 'Предыстория персонажа', key: 'backstory' as const, rows: 8, icon: <ScrollIcon size={18} /> },
              { label: 'Сокровища', key: 'treasure' as const, rows: 3, icon: <CoinsChestIcon size={18} /> }
            ].map(item => (
              <div key={item.key} className="parchment-card lg:col-span-2">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2">{item.icon}<span>{item.label}</span></h3></div>
                <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} placeholder={item.key === 'backstory' ? 'Расскажите историю персонажа...' : ''} /></div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ PAGE 3 ═══ */}
        {activeTab === 'page3' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="parchment-card">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><SpellbookIcon size={20} /><span>Параметры заклинателя</span></h3></div>
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatInput label="Класс заклинателя" value={char.spellcastingClass} onChange={v => update('spellcastingClass', v)} type="text" placeholder="Волшебник" />
                  <div className="space-y-1"><label className="parchment-label">Характеристика</label>
                    <select value={char.spellcastingAbility} onChange={e => update('spellcastingAbility', e.target.value as AbilityName | '')} className="parchment-select h-8">
                      <option value="">— Нет —</option>
                      {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_FULL[a]} ({a})</option>)}
                    </select>
                  </div>
                </div>
                {char.spellcastingAbility && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="parchment-label">Сл. спасения</label><CalcBadge value={getSpellSaveDC(char)} /></div>
                    <div className="space-y-1"><label className="parchment-label">Бонус атаки</label><RollBadge value={formatModifier(getSpellAttackBonus(char))} label="Атака заклинанием" modifier={getSpellAttackBonus(char)} onRoll={handleRoll} /></div>
                    <div className="space-y-1"><label className="parchment-label">Мод. хар-ки</label><CalcBadge value={formatModifier(getSpellAbilityMod(char))} /></div>
                  </div>
                )}
              </div>
            </div>
            <div className="parchment-card">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><CrystalBallDndIcon size={20} /><span>Ячейки заклинаний</span></h3></div>
              <div className="px-4 pb-4 space-y-2">
                {[1,2,3,4,5,6,7,8,9].map(lvl => {
                  const slot = char.spellSlots[lvl] || { totalSlots: 0, expendedSlots: 0 };
                  // Always show all 9 spell slot levels on the website
                  return (
                    <div key={lvl} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                      <span className="text-xs font-bold w-16" style={{ color: '#6B3A2A', fontFamily: 'Georgia, "Times New Roman", serif' }}>{lvl} ур.</span>
                      <div className="space-y-0.5"><label className="text-[10px]" style={{ color: '#8B6914' }}>Всего</label><input type="number" min={0} value={slot.totalSlots} onChange={e => updateSpellSlot(lvl, 'totalSlots', Number(e.target.value) || 0)} className={inputClassCenter} /></div>
                      <div className="space-y-0.5"><label className="text-[10px]" style={{ color: '#8B6914' }}>Потрач.</label><input type="number" min={0} max={slot.totalSlots} value={slot.expendedSlots} onChange={e => updateSpellSlot(lvl, 'expendedSlots', Number(e.target.value) || 0)} className={inputClassCenter} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Quick Spell Adder (Unified Search) */}
            <div className="parchment-card lg:col-span-2">
              <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-wrap gap-2">
                <h3 className="parchment-heading flex items-center gap-2">
                  <SpellbookIcon size={20} />
                  <span>Поиск и быстрое добавление заклинания</span>
                </h3>
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold" style={{ color: '#5C341F' }}>
                  <input
                    type="checkbox"
                    checked={filterOnlyMyClassSpells}
                    onChange={e => setFilterOnlyMyClassSpells(e.target.checked)}
                    className="rounded accent-[#5C341F] cursor-pointer"
                  />
                  <span>
                    Только заклинания {char.className || char.spellcastingClass || 'моего класса'}{char.subclass ? ` (+ ${char.subclass})` : ''}
                  </span>
                </label>
              </div>
              <div className="px-4 pb-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <AutocompleteInput
                      value={spellSearchQuery}
                      onChange={setSpellSearchQuery}
                      onSelect={handleQuickAddSpell}
                      items={spellAutocompleteItems}
                      placeholder="Введите заклинание (Огненный шар, Щит, Лечащее слово)..."
                      autoClearOnSelect={true}
                      className={inputClass + " w-full font-medium"}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (spellSearchQuery.trim()) {
                        const matched = findSpellByName(spellSearchQuery.trim());
                        handleQuickAddSpell({ name: spellSearchQuery.trim(), data: matched });
                      }
                    }}
                    className="parchment-btn-secondary text-xs px-3 py-1.5 shrink-0"
                  >
                    + Добавить
                  </button>
                </div>
                {spellAddSuccess && (
                  <div className="mt-2.5 text-xs font-medium px-3 py-1.5 rounded flex items-center justify-between" style={{ background: 'rgba(201, 168, 76, 0.15)', color: '#6B3A2A', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <span>{spellAddSuccess}</span>
                    <button onClick={() => setSpellAddSuccess(null)} className="opacity-70 hover:opacity-100 font-bold ml-2">✕</button>
                  </div>
                )}
              </div>
            </div>

            <div className="parchment-card lg:col-span-2">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2"><SparklesDndIcon size={20} /><span>Заговоры (0 ур.)</span></h3></div>
              <div className="px-4 pb-4 space-y-2">
                {char.cantrips.map((c, i) => {
                  const spellDef = findSpellByName(c);
                  const check = c.trim() ? isSpellAllowedForCharacter(char, spellDef || c) : null;
                  return (
                    <div key={i} className="flex gap-1.5 items-center">
                      <div className="flex-1 relative flex items-center">
                        <input
                          value={c}
                          onChange={e => updateCantrip(i, e.target.value)}
                          placeholder="Название заговора..."
                          className={inputClass + (check ? " pr-28" : "")}
                        />
                        {check && (
                          <span
                            className="absolute right-2 text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none truncate max-w-[110px]"
                            style={{
                              background: check.allowed ? (check.source === 'class' ? 'rgba(40, 140, 40, 0.15)' : 'rgba(30, 100, 200, 0.15)') : 'rgba(217, 83, 79, 0.18)',
                              color: check.allowed ? (check.source === 'class' ? '#276727' : '#1B4D89') : '#900',
                              border: check.allowed ? (check.source === 'class' ? '1px solid rgba(40, 140, 40, 0.3)' : '1px solid rgba(30, 100, 200, 0.3)') : '1px solid rgba(217, 83, 79, 0.4)'
                            }}
                            title={check.reason || check.sourceLabel}
                          >
                            {check.allowed ? check.sourceLabel : '⚠️ Чужой'}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSpellModal({
                          spell: spellDef || null,
                          customName: c || 'Заговор'
                        })}
                        title="Подробности заговора"
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                          background: 'rgba(237, 224, 200, 0.6)',
                          border: '1px solid rgba(139, 105, 20, 0.35)'
                        }}
                      >
                        <InfoSealIcon size={18} />
                      </button>
                      <button onClick={() => removeCantrip(i)} className="parchment-remove-btn w-8 h-8 shrink-0 flex items-center justify-center cursor-pointer">✕</button>
                    </div>
                  );
                })}
                <button onClick={addCantrip} className="parchment-btn-secondary text-xs py-1.5">+ Добавить заговор</button>
              </div>
            </div>
            {[1,2,3,4,5,6,7,8,9].map(lvl => {
              const spells = char.spellsByLevel[lvl] || [];
              return (
                <div key={lvl} className="parchment-card">
                  <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-wrap gap-1">
                    <h3 className="parchment-heading flex items-center gap-2">
                      <SpellbookIcon size={18} />
                      <span>Заклинания {lvl} ур.</span>
                      <span className="text-xs font-normal" style={{ color: '#8B6914' }}>({spells.length})</span>
                    </h3>
                    {lvl > maxAvailableSlot && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(217, 130, 43, 0.15)', color: '#A04000', border: '1px solid rgba(217, 130, 43, 0.3)' }} title={`Ячейки ${lvl}-го круга еще не доступны вашему персонажу`}>
                        🔒 Ячейки не открыты
                      </span>
                    )}
                  </div>
                  <div className="px-4 pb-4 space-y-2">
                    {spells.map((spell, i) => {
                      const spellDef = findSpellByName(spell.name);
                      const check = spell.name.trim() ? isSpellAllowedForCharacter(char, spellDef || spell.name) : null;
                      return (
                        <div key={i} className="flex gap-1.5 items-center">
                          <label className="parchment-checkbox" title="Подготовлено"><input type="checkbox" checked={spell.prepared} onChange={e => updateSpellEntry(lvl, i, 'prepared', e.target.checked)} /><span className="checkmark"></span></label>
                          <div className="flex-1 relative flex items-center">
                            <AutocompleteInput
                              value={spell.name}
                              onChange={val => updateSpellEntry(lvl, i, 'name', val)}
                              items={spellAutocompleteItems}
                              placeholder={`Заклинание ${lvl} ур....`}
                              className={inputClass + (check ? " pr-28" : "")}
                            />
                            {check && (
                              <span
                                className="absolute right-2 text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none truncate max-w-[110px]"
                                style={{
                                  background: check.allowed ? (check.source === 'class' ? 'rgba(40, 140, 40, 0.15)' : 'rgba(30, 100, 200, 0.15)') : 'rgba(217, 83, 79, 0.18)',
                                  color: check.allowed ? (check.source === 'class' ? '#276727' : '#1B4D89') : '#900',
                                  border: check.allowed ? (check.source === 'class' ? '1px solid rgba(40, 140, 40, 0.3)' : '1px solid rgba(30, 100, 200, 0.3)') : '1px solid rgba(217, 83, 79, 0.4)'
                                }}
                                title={check.reason || check.sourceLabel}
                              >
                                {check.allowed ? check.sourceLabel : '⚠️ Чужой'}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveSpellModal({
                              spell: spellDef || null,
                              customName: spell.name || `Заклинание ${lvl} ур.`
                            })}
                            title="Подробности заклинания"
                            className="w-8 h-8 shrink-0 flex items-center justify-center rounded text-xs font-bold transition-transform active:scale-95 hover:brightness-110"
                            style={{
                              background: 'rgba(237, 224, 200, 0.6)',
                              border: '1px solid rgba(139, 105, 20, 0.35)'
                            }}
                          >
                            <InfoSealIcon size={18} />
                          </button>
                          <button onClick={() => removeSpell(lvl, i)} className="parchment-remove-btn w-8 h-8 shrink-0 flex items-center justify-center">✕</button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        if (lvl > maxAvailableSlot) {
                          showToast('Ячейки не открыты', `У персонажа еще нет ячеек ${lvl}-го круга. Повысьте уровень персонажа.`);
                          return;
                        }
                        addSpell(lvl);
                      }}
                      className="parchment-btn-secondary text-xs py-1.5"
                    >
                      + Добавить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button onClick={handleExport} className="parchment-btn text-base px-8 py-3 shadow-lg flex items-center gap-2">
            <QuillIcon size={20} />
            <span>Экспортировать в DOCX</span>
          </button>
        </div>

        {/* ═══ FAQ & Mechanics Reference Section ═══ */}
        <section className="parchment-faq-section" aria-label="Справочник по листу персонажа D&D 5e">
          <h2 className="parchment-heading text-base sm:text-lg mb-3 flex items-center gap-2">
            <ScrollIcon size={22} />
            <span>Справочник и частые вопросы</span>
          </h2>
          <div className="space-y-2">
            <details className="parchment-faq-item" open>
              <summary>Как рассчитываются характеристики и модификаторы?</summary>
              <p>
                Модификатор характеристики вычисляется по формуле 5-й редакции: <code>(Значение − 10) / 2</code> с округлением вниз. Лист автоматически суммирует базовое значение, расовый бонус и прибавки от уровней (ASI), пересчитывая спасброски, навыки, пассивную внимательность и класс доспеха.
              </p>
            </details>
            <details className="parchment-faq-item">
              <summary>Как работают броски кубиков (d20)?</summary>
              <p>
                Любой фиолетовый бейдж с модификатором (проверка характеристики, спасбросок, навык, инициатива, атака заклинанием) кликабелен. По клику выполняется криптографически равномерный бросок <code>d20 + модификатор</code> с отображением критического успеха (20) или провала (1).
              </p>
            </details>
            <details className="parchment-faq-item">
              <summary>Как устроено повышение и откат уровня?</summary>
              <p>
                Кнопки «+» и «−» возле уровня открывают пошаговый мастер. При повышении уровня рассчитывается прирост хитов (среднее или бросок кости хитов с модификатором ТЕЛ, минимум +1), распределяются очки характеристик (ASI) на ключевых уровнях (4, 8, 12, 16, 19) и добавляются заклинания. Полная история изменений сохраняется и позволяет корректно откатить персонажа назад.
              </p>
            </details>
            <details className="parchment-faq-item">
              <summary>Что входит в экспортируемый DOCX-документ?</summary>
              <p>
                При нажатии «Экспорт DOCX» формируется трёхстраничный файл Microsoft Word: 1-я страница — основные боевые параметры, навыки и снаряжение; 2-я страница — внешность, портрет и предыстория; 3-я страница — ячейки и книга заклинаний с параметрами заклинателя.
              </p>
            </details>
            <details className="parchment-faq-item">
              <summary>Как сохранить и перенести персонажа?</summary>
              <p>
                Все данные сохраняются локально в вашем браузере. Вы можете экспортировать персонажа в файл JSON для резервной копии или пересылки, а при входе в аккаунт — синхронизировать персонажей через облако Supabase и создавать публичные коды для импорта в AI Dungeon Master.
              </p>
            </details>
          </div>
        </section>

        <footer className="parchment-footer">
          <p>Лист персонажа D&D 5e · Совместимо с правилами 5-й редакции Dungeons & Dragons (SRD 5.1)</p>
        </footer>
      </main>
    </div>
  );
}
