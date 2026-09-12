'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CharacterData, AbilityName, ABILITY_NAMES, ABILITY_FULL, ALL_SKILLS, SKILL_MAP,
  formatModifier, calcModifier, calcProficiencyBonus, getTotalScore, getModifier,
  getSavingThrow, getSkillBonus, getInitiative, getPassivePerception, getAC,
  getCalculatedAC, getAvailableArmorModes, type ArmorModeOption,
  getHPMax, getSpellSaveDC, getSpellAttackBonus, getSpellAbilityMod,
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
import { getActiveCharacterAttacks, type ActiveAttackOption, hasTwoWeaponFightingStyle } from '@/lib/equipment-types';
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
  dieResult: number;   // the d20 roll (1-20) or sum of dice
  modifier: number;    // the modifier value (can be negative)
  total: number;       // dieResult + modifier
  label: string;       // what was rolled, e.g. "Проверка Силы" or "Спасбросок Лов"
  breakdown?: string;  // optional formula breakdown, e.g. "1d8 [6] + 3"
  customTotal?: string; // optional formatted display, e.g. "19 / 23"
}

const RollResultPopup = React.memo(function RollResultPopup({ result, onClose }: { result: RollResult; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const isCustomBreakdown = !!result.breakdown;
  const isNat20 = !isCustomBreakdown && !result.customTotal && result.dieResult === 20;
  const isNat1 = !isCustomBreakdown && !result.customTotal && result.dieResult === 1;

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEscapeKey(handleClose);

  // Auto-close after 3.5 seconds
  React.useEffect(() => {
    const timer = setTimeout(handleClose, 3500);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[300] flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={handleClose}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={closing ? { scale: 0.8, opacity: 0, y: 10 } : { scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className={`roll-result-popup ${closing ? 'closing' : ''} ${isNat20 ? 'shadow-[0_0_25px_rgba(201,168,76,0.5)] border-[#C9A84C]' : isNat1 ? 'shadow-[0_0_25px_rgba(139,37,0,0.4)] border-[#8B2500]' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1 text-xs">
          <motion.div
            initial={{ rotate: -180, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 15 }}
          >
            <D20Icon size={18} />
          </motion.div>
          <span className="roll-result-label font-bold mb-0">{result.label}</span>
        </div>

        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: [0.6, 1.15, 1] }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`roll-result-die ${isNat20 ? 'nat20' : ''} ${isNat1 ? 'nat1' : ''}`}
        >
          {result.customTotal || (isCustomBreakdown ? result.total : result.dieResult)}
        </motion.div>

        <div className="roll-result-breakdown">
          {result.breakdown || `d20 (${result.dieResult}) ${result.modifier >= 0 ? '+' : ''}${result.modifier}`}
        </div>
        <div className="roll-result-total">
          = {result.customTotal || result.total}
        </div>
        {isNat20 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="roll-result-tag crit"
          >
            ✨ Критический успех!
          </motion.div>
        )}
        {isNat1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="roll-result-tag fumble"
          >
            💀 Критический провал!
          </motion.div>
        )}
      </motion.div>
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
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const dieResult = rollD20();
    const total = dieResult + modifier;
    onRoll({ dieResult, modifier, total, label: label || 'Проверка' });
  };

  return (
    <button
      type="button"
      className="calc-badge roll-badge cursor-pointer"
      title={label ? `${label} — нажмите для броска d20` : 'Нажмите для броска d20'}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      {value}
    </button>
  );
});

function StatInput({ label, value, onChange, type = 'number', placeholder, className = '' }: {
  label: string; value: string | number; onChange: (v: any) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  const inputId = 'stat-input-' + label.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-');
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="h-5 flex items-center">
        <label className="parchment-label" htmlFor={inputId}>{label}</label>
      </div>
      <input id={inputId} type={type} value={value}
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

// ── Level Down Confirm ──

interface LevelDownModalProps {
  char: CharacterData;
  onConfirm: () => void;
  onCancel: () => void;
}

const LevelDownModal = React.memo(function LevelDownModal({ char, onConfirm, onCancel }: LevelDownModalProps) {
  useEscapeKey(onCancel);
  const history = Array.isArray(char.levelHistory) ? char.levelHistory : [];
  const last = history[history.length - 1];
  const targetLevel = Math.max(1, char.level - 1);

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
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
  useEscapeKey(onClose);
  const history = Array.isArray(char.levelHistory) ? char.levelHistory : [];

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
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
  useEscapeKey(onCancel);
  const allowedClasses = (spell.classes || []).join(', ') || 'Другие классы';
  const charClass = char.className || char.spellcastingClass || 'Без класса';

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[360] flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm">
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
  useEscapeKey(onCancel);
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
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4">
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
  useEscapeKey(onClose);
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4">
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

          <form onSubmit={(e) => { e.preventDefault(); onAuth(); }}>
            <div className="space-y-3 mb-4">
              <div className="space-y-1">
                <label className="parchment-label">Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="parchment-input"
                />
              </div>
              <div className="space-y-1">
                <label className="parchment-label">Пароль</label>
                <input
                  type="password"
                  name="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="parchment-input"
                />
              </div>
            </div>

            {error && <p className="text-xs mb-3 p-2 rounded" style={{ color: error.includes('Проверьте') ? '#4a7c3f' : '#8B2500', background: error.includes('Проверьте') ? 'rgba(74,124,63,0.08)' : 'rgba(139,37,0,0.06)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full parchment-btn py-2.5 mb-3"
            >
              {loading ? 'Загрузка…' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

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
  useEscapeKey(onCancel);
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4">
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

// ── Reset Confirmation Modal ──
const ResetModal = React.memo(function ResetModal({ onConfirm, onCancel }: { onConfirm?: () => void; onCancel: () => void }) {
  useEscapeKey(onCancel);
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="parchment-modal max-w-md w-full p-5 sm:p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}>Очистить лист персонажа?</h3>
        <p className="text-xs" style={{ color: '#5C341F' }}>Все введённые данные будут сброшены к начальным значениям 1-го уровня.</p>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel} className="parchment-btn-secondary text-xs px-4 py-2">Отмена</button>
          <button type="button" onClick={onConfirm} className="parchment-btn text-xs px-4 py-2">Сбросить</button>
        </div>
      </div>
    </div>
  );
});

// ── Create Choice Modal ──
interface CreateChoiceModalProps {
  onClose: () => void;
  onSelectWizard: () => void;
  onSelectManual: () => void;
}

const CreateChoiceModal = React.memo(function CreateChoiceModal({
  onClose,
  onSelectWizard,
  onSelectManual,
}: CreateChoiceModalProps) {
  useEscapeKey(onClose);

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="parchment-modal max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative rounded-xl"
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
            type="button"
            onClick={onClose}
            className="parchment-remove-btn w-7 h-7 flex items-center justify-center text-sm font-bold"
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {/* Option 1: Interactive Wizard */}
          <button
            type="button"
            onClick={onSelectWizard}
            className="w-full text-left p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md space-y-2 group"
            style={{
              background: 'rgba(232, 211, 162, 0.55)',
              border: '2px solid #C9A84C',
              boxShadow: '0 2px 8px rgba(60, 36, 21, 0.15)'
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 font-bold text-sm text-[#3D2012]">
                <SparklesDndIcon size={22} />
                <span style={{ fontFamily: 'Georgia, serif' }}>Интерактивное пошаговое создание</span>
              </div>
              <span
                className="text-[11px] px-2.5 py-0.5 rounded font-bold shrink-0"
                style={{
                  background: '#5C341F',
                  color: '#FFE58F',
                  border: '1px solid #3D2012',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                Рекомендуется
              </span>
            </div>
            <p className="text-xs text-[#5C341F] leading-relaxed pl-8">
              Пошаговый мастер: выбор расы, класса с жестким лимитом навыков, предыстории с защитой от совпадений, расчет характеристик (Point Buy, 4d6, стандартный массив) и выбор заклинаний с лимитами.
            </p>
          </button>

          {/* Option 2: Manual Blank Sheet */}
          <button
            type="button"
            onClick={onSelectManual}
            className="w-full text-left p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md space-y-2 group"
            style={{
              background: 'rgba(245, 230, 200, 0.75)',
              border: '1.5px solid rgba(139, 105, 20, 0.4)',
              boxShadow: '0 2px 6px rgba(60, 36, 21, 0.1)'
            }}
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-[#3D2012]">
              <QuillIcon size={22} />
              <span style={{ fontFamily: 'Georgia, serif' }}>Полностью ручное создание (Чистый бланк)</span>
            </div>
            <p className="text-xs text-[#5C341F] leading-relaxed pl-8">
              Создать пустой лист персонажа 1-го уровня. Вы сможете самостоятельно вручную вписать все названия, значения характеристик, особенности и снаряжение.
            </p>
          </button>
        </div>

        <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
          <button
            type="button"
            onClick={onClose}
            className="parchment-btn-secondary text-xs px-5 py-2 cursor-pointer"
          >
            Отмена
          </button>
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSheetMenu, setShowSheetMenu] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!showSheetMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSheetMenu(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSheetMenu]);

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
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEquipmentModal();
          }}
        >
          <div className="w-full max-w-4xl my-auto">
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

      <header className="sticky top-0 z-50 parchment-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <D20Icon size={28} />
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight">Лист персонажа D&D 5e</h1>
              <p className="text-[11px] leading-tight text-amber-100/70">Интерактивный бланк для игры</p>
            </div>
          </div>

          {/* Desktop Toolbar (visible on md screens and up) */}
          <div className="hidden md:flex parchment-toolbar">
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

            {/* Sheet Actions Dropdown Menu */}
            <div className="relative">
              <div className="parchment-btn-group">
                <button
                  type="button"
                  onClick={() => setShowSheetMenu(prev => !prev)}
                  className="parchment-header-btn flex items-center gap-1.5 font-semibold"
                  title="Управление бланком (шаблоны, JSON, сброс)"
                  aria-expanded={showSheetMenu}
                >
                  <ScrollIcon size={16} />
                  <span>Бланк</span>
                  <span className="text-[10px] opacity-75">▾</span>
                </button>
              </div>

              {showSheetMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[110]"
                    onClick={() => setShowSheetMenu(false)}
                  />
                  <div
                    className="absolute left-0 top-full mt-1.5 w-52 parchment-menu-dropdown z-[120] py-1.5 rounded shadow-xl"
                    role="menu"
                  >
                    <button
                      type="button"
                      onClick={() => { setShowSheetMenu(false); setShowEquipmentModal(true); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <CrossedSwordsIcon size={14} />
                      <span>Экипировка (кукла)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSheetMenu(false); handleExportPdf(); }}
                      disabled={isExportingPdf}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <ScrollIcon size={14} />
                      <span>{isExportingPdf ? 'Создание PDF…' : 'Печать PDF (5 стр.)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSheetMenu(false); setShowTemplates(true); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <ScrollIcon size={14} />
                      <span>Готовые шаблоны</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSheetMenu(false); handleSaveJSON(); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <SpellbookIcon size={14} />
                      <span>Сохранить в JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSheetMenu(false); handleLoadJSON(); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <ChestIcon size={14} />
                      <span>Загрузить из JSON</span>
                    </button>
                    {user && (
                      <button
                        type="button"
                        onClick={() => { setShowSheetMenu(false); handleSaveAsNew(); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                        role="menuitem"
                      >
                        <MysticCloudIcon size={14} />
                        <span>Сохранить как копию</span>
                      </button>
                    )}
                    <div className="my-1 border-t border-[#C9A84C]/30" />
                    <button
                      type="button"
                      onClick={() => { setShowSheetMenu(false); handleReset(); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#8B2500] hover:bg-[#8B2500]/10 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <HourglassIcon size={14} />
                      <span>Сбросить бланк</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Cloud / Auth group */}
            {user ? (
              <div className="parchment-btn-group">
                <button
                  type="button"
                  onClick={handleCloudSave}
                  className={`parchment-header-btn min-w-[110px] xl:min-w-[128px] inline-flex items-center justify-center gap-1.5 text-center ${
                    cloudSaveStatus === 'error' ? 'text-amber-800' : ''
                  }`}
                  title={
                    cloudSaveStatus === 'error'
                      ? `Ошибка: ${cloudSaveError || 'Сбой связи с БД. Нажмите для повтора'}`
                      : cloudSaveStatus === 'saving'
                      ? 'Сохранение в базу данных…'
                      : cloudSaveStatus === 'saved'
                      ? 'Все изменения сохранены в облаке (нажмите для ручного сохранения)'
                      : 'Синхронизировать с базой данных'
                  }
                >
                  {cloudSaveStatus === 'saving' ? (
                    <>
                      <MysticSpinnerIcon size={15} />
                      <span>Сохранение…</span>
                    </>
                  ) : cloudSaveStatus === 'error' ? (
                    <>
                      <span className="text-amber-600 font-bold text-sm">⚠️</span>
                      <span className="text-amber-800 font-semibold text-xs">Повторить</span>
                    </>
                  ) : cloudSaveStatus === 'saved' ? (
                    <>
                      <GoldSealCheckIcon size={15} />
                      <span>Сохранено</span>
                    </>
                  ) : (
                    <>
                      <MysticCloudIcon size={15} />
                      <span>Сохранить</span>
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
                  <span>Выйти<span className="hidden xl:inline"> из аккаунта</span></span>
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

            {/* Primary export buttons */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="parchment-header-btn-primary flex items-center gap-1.5"
              title="Скачать официальный интерактивный PDF-бланк D&D 5e на русском языке (3 страницы бланка + Кодекс способностей и черт)"
            >
              {isExportingPdf ? <MysticSpinnerIcon size={16} /> : <ScrollIcon size={16} />}
              <span>{isExportingPdf ? 'Создание PDF…' : 'Печать PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="parchment-header-btn flex items-center gap-1.5"
              title="Экспортировать лист персонажа в файл Word"
            >
              <QuillIcon size={16} />
              <span>DOCX</span>
            </button>
          </div>

          {/* Mobile Toolbar (visible only on mobile screens < md) */}
          <div className="parchment-mobile-bar flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateChoiceModal(true)}
              className="parchment-header-btn flex items-center gap-1.5 text-xs px-2.5 py-1.5 font-bold shadow-sm"
              style={{
                background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.45) 0%, rgba(139, 105, 20, 0.35) 100%)',
                border: '1px solid #C9A84C',
                color: '#FFF8EB'
              }}
              title="Создать персонажа"
            >
              <UserHeroIcon size={14} />
              <span>+ Герой</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={handleCloudSave}
                className="parchment-header-btn p-1.5 flex items-center justify-center"
                title={
                  cloudSaveStatus === 'error'
                    ? `Ошибка: ${cloudSaveError || 'Сбой связи с БД. Нажмите для повтора'}`
                    : 'Синхронизировать с базой данных'
                }
              >
                {cloudSaveStatus === 'saving' ? (
                  <MysticSpinnerIcon size={16} />
                ) : cloudSaveStatus === 'error' ? (
                  <span className="text-amber-600 font-bold text-xs">⚠️</span>
                ) : cloudSaveStatus === 'saved' ? (
                  <GoldSealCheckIcon size={16} />
                ) : (
                  <MysticCloudIcon size={16} />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="parchment-header-btn flex items-center gap-1 text-xs px-2.5 py-1.5 font-bold"
              style={{
                background: showMobileMenu ? 'rgba(201, 168, 76, 0.3)' : 'rgba(30, 16, 10, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.4)'
              }}
              aria-label="Меню листа персонажа"
            >
              <span className="text-sm">☰</span>
              <span>Меню</span>
            </button>
          </div>
        </div>

        {/* Mobile Action Drawer Overlay */}
        {showMobileMenu && (
          <div
            className="fixed inset-0 z-[150] parchment-modal-overlay bg-black/60 backdrop-blur-xs flex flex-col justify-start pt-14 px-3 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <div
              className="parchment-mobile-drawer w-full max-w-sm mx-auto p-4 rounded-xl shadow-2xl space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#C9A84C]/40 pb-2">
                <span className="font-bold text-sm text-[#3D2012] flex items-center gap-1.5">
                  <D20Icon size={16} />
                  <span>Меню персонажа</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(false)}
                  className="parchment-remove-btn w-6 h-6 flex items-center justify-center font-bold text-xs"
                  title="Закрыть меню"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); handleExportPdf(); }}
                  disabled={isExportingPdf}
                  className="parchment-btn flex items-center gap-2 p-2.5 text-xs justify-start font-bold col-span-2"
                  title="Скачать официальный интерактивный PDF-бланк D&D 5e (5 страниц)"
                >
                  {isExportingPdf ? <MysticSpinnerIcon size={15} /> : <ScrollIcon size={15} />}
                  <span>{isExportingPdf ? 'Создание PDF…' : 'Печать официального PDF (5 стр.)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); setShowEquipmentModal(true); }}
                  className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start col-span-2 font-bold"
                  style={{
                    background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.3) 0%, rgba(139, 105, 20, 0.2) 100%)',
                    border: '1px solid #C9A84C',
                  }}
                >
                  <CrossedSwordsIcon size={15} />
                  <span>Экипировка (кукла снаряжения)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); setShowTemplates(true); }}
                  className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
                >
                  <ScrollIcon size={15} />
                  <span>Шаблоны</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); handleExport(); }}
                  className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
                >
                  <QuillIcon size={15} />
                  <span>Экспорт DOCX</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); handleSaveJSON(); }}
                  className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
                >
                  <SpellbookIcon size={15} />
                  <span>Скачать JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); handleLoadJSON(); }}
                  className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
                >
                  <ChestIcon size={15} />
                  <span>Импорт JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); handleCloudLoad(); }}
                  className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
                >
                  <MysticCloudIcon size={15} />
                  <span>Персонажи</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); handleShare(); }}
                  className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
                >
                  <ArcaneLinkIcon size={15} />
                  <span>Поделиться</span>
                </button>
              </div>

              <div className="border-t border-[#C9A84C]/30 pt-2 flex items-center justify-between gap-2">
                {user ? (
                  <button
                    type="button"
                    onClick={() => { setShowMobileMenu(false); setShowSignOutModal(true); }}
                    className="text-xs text-[#8B2500] hover:underline flex items-center gap-1.5 py-1.5"
                  >
                    <PortalIcon size={14} />
                    <span>Выйти ({user.email?.split('@')[0]})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setShowMobileMenu(false); setShowAuth(true); }}
                    className="text-xs text-[#3D2012] font-semibold hover:underline flex items-center gap-1.5 py-1.5"
                  >
                    <RunedKeyIcon size={14} />
                    <span>Войти в аккаунт</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setShowMobileMenu(false); handleReset(); }}
                  className="text-xs text-[#8B2500]/80 hover:underline flex items-center gap-1 py-1.5"
                >
                  <HourglassIcon size={13} />
                  <span>Сброс</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Tabs */}
        <div
          className="grid grid-cols-3 gap-2 mb-6 parchment-tabs relative p-1.5 rounded-lg"
          style={{
            background: 'rgba(32, 18, 11, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.45)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 240, 200, 0.15)'
          }}
        >
          {[
            { key: 'page1' as const, label: 'Основной лист', shortLabel: 'Лист' },
            { key: 'page2' as const, label: 'Детали', shortLabel: 'Детали' },
            { key: 'page3' as const, label: 'Заклинания', shortLabel: 'Магия' },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded min-h-[44px] flex items-center justify-center cursor-pointer select-none transition-all ${
                  isActive
                    ? 'text-[#3D2012]'
                    : 'text-[#F5E6C8] bg-[rgba(60,36,21,0.7)] hover:bg-[rgba(85,48,28,0.9)] hover:text-[#FFF8EB] border border-[rgba(201,168,76,0.3)] shadow-sm'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTabParchment"
                    className="absolute inset-0 rounded parchment-tab-active shadow-md"
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  />
                )}
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                <span className="relative z-10 sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
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
                      <div className="h-5 flex items-center justify-between">
                        <label className="parchment-label" htmlFor="char-input-name">Имя персонажа</label>
                        <button
                          type="button"
                          onClick={() => setShowNameGenModal(true)}
                          className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-0.5 leading-none"
                          style={{ color: '#8B6914' }}
                          title="Открыть генератор фэнтезийных имён с этимологией и корнями"
                        >
                          🎲 Имена
                        </button>
                      </div>
                      <input
                        id="char-input-name"
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
                      <div className="h-5 flex items-center justify-between">
                        <label className="parchment-label" htmlFor="char-input-class">Класс</label>
                        {char.level <= 1 && (
                          <button
                            type="button"
                            onClick={() => setShowClassModal(true)}
                            className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-0.5 leading-none"
                            style={{ color: '#8B6914' }}
                            title="Выбрать класс из компендиума"
                          >
                            📖 Каталог классов
                          </button>
                        )}
                      </div>
                      <input
                        id="char-input-class"
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
                      <div className="h-5 flex items-center">
                        <label className="parchment-label">Уровень</label>
                      </div>
                      <div className="flex items-center gap-1 h-[28px]">
                        <span className="flex-1 text-center font-bold text-lg leading-none" style={{ color: '#6B3A2A', fontFamily: 'Georgia, "Times New Roman", serif' }}>{char.level}</span>
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
                      <div className="h-5 flex items-center justify-between">
                        <label className="parchment-label" htmlFor="char-input-race">Раса</label>
                        {char.level <= 1 && (
                          <button
                            type="button"
                            onClick={() => setShowRaceModal(true)}
                            className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-0.5 leading-none"
                            style={{ color: '#8B6914' }}
                            title="Открыть полный компендиум рас"
                          >
                            📖 Каталог рас
                          </button>
                        )}
                      </div>
                      <input
                        id="char-input-race"
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
                              <span
                                onClick={() => updateSaveProf(abbr, !isProf)}
                                className="text-xs font-bold cursor-pointer select-none hover:text-[#8B4513] transition-colors"
                                style={{ color: '#3C2415' }}
                                title={`Нажмите, чтобы ${isProf ? 'снять владение' : 'выбрать владение'} спасброском (${abbr})`}
                              >
                                {abbr}
                              </span>
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
                            <span
                              onClick={() => updateSaveProf(abbr, !isProf)}
                              className="text-xs font-bold whitespace-nowrap cursor-pointer select-none hover:text-[#8B4513] transition-colors"
                              style={{ color: '#3C2415' }}
                              title={`Нажмите, чтобы ${isProf ? 'снять владение' : 'выбрать владение'} спасброском (${ABILITY_FULL[abbr]})`}
                            >
                              {ABILITY_FULL[abbr]}
                            </span>
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
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <h3 className="parchment-heading flex items-center gap-2">
                    <EngravedShieldIcon size={20} />
                    <span>Боевые параметры</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEquipmentModal(true)}
                      className="text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:brightness-110 active:scale-95 shadow-sm"
                      style={{
                        background: 'linear-gradient(180deg, #8B4513, #6B3A2A)',
                        color: '#FFE58F',
                        border: '1px solid #C9A84C',
                      }}
                      title="Интерактивная кукла экипировки (13 слотов)"
                    >
                      <CrossedSwordsIcon size={14} />
                      <span>Экипировка</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRestModal(true)}
                      className="text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:brightness-110 active:scale-95 shadow-sm"
                      style={{
                        background: 'linear-gradient(180deg, #8B4513, #6B3A2A)',
                        color: '#FFE58F',
                        border: '1px solid #C9A84C',
                      }}
                      title="Короткий (1 ч.) или продолжительный (8 ч.) отдых"
                    >
                      <HourglassIcon size={14} />
                      <span>Отдых</span>
                    </button>
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="parchment-label text-xs font-bold">КД</label>
                        {char.armorClass !== null && (
                          <button
                            type="button"
                            onClick={() => update('armorClass', null)}
                            className="text-[10px] text-[#8B6914] underline hover:text-[#5C341F] cursor-pointer"
                            title="Сбросить ручное переопределение и вернуть авторасчёт"
                          >
                            Авто
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="flex items-center justify-center font-bold rounded px-1.5 py-1 text-sm sm:text-base min-w-[34px] shadow-xs select-none"
                          style={{
                            background: char.armorClass !== null ? 'rgba(139, 69, 19, 0.15)' : 'rgba(201, 168, 76, 0.28)',
                            border: '1px solid #C9A84C',
                            color: '#3D2012',
                          }}
                          title={char.armorClass !== null ? `Текущий КД (ручной): ${char.armorClass}. Авторасчёт: ${calculatedAC}` : `Авторасчёт КД: ${calculatedAC}`}
                        >
                          {activeAC}
                        </div>
                        <input
                          type="number"
                          value={char.armorClass ?? ''}
                          onChange={e => update('armorClass', e.target.value === '' ? null : Number(e.target.value))}
                          placeholder="Ручн."
                          className={inputClass + " flex-1 min-w-0 text-center text-xs px-1"}
                          title="Оставьте пустым для авторасчёта или введите своё значение"
                        />
                      </div>
                    </div>
                    <div className="space-y-1"><label className="parchment-label text-xs">Инициатива</label><div className="flex items-center gap-1"><RollBadge value={formatModifier(getInitiative(char))} label="Инициатива" modifier={getInitiative(char)} onRoll={handleRoll} /><input type="number" value={char.initiativeOverride ?? ''} onChange={e => update('initiativeOverride', e.target.value === '' ? null : Number(e.target.value))} placeholder="Авто" className={inputClass + " flex-1"} /></div></div>
                    <div className="space-y-1"><label className="parchment-label text-xs">Скорость</label><input type="number" value={char.speed} onChange={e => update('speed', Number(e.target.value) || 30)} className={inputClass} /></div>
                  </div>
                  {/* Defense & Armor Display (Managed in Equipment) */}
                  <div className="p-2.5 rounded space-y-1.5" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="parchment-label text-[11px] font-bold">Защита и Доспех</label>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold" style={{ background: 'rgba(201, 168, 76, 0.25)', color: '#5C341F', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                          КД {calculatedAC}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEquipmentModal(true)}
                        className="text-[11px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-1"
                        style={{ color: '#8B6914' }}
                        title="Надеть броню, щит или аксессуары в окне Экипировки"
                      >
                        <EngravedShieldIcon size={13} />
                        <span>🛡️ Экипировка</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold" style={{ color: '#3D2012' }}>
                          {char.equippedSlots?.armor?.name
                            ? `🛡️ ${char.equippedSlots.armor.name}`
                            : (char.equippedArmor ? `🛡️ ${char.equippedArmor}` : '🥋 Без доспехов')}
                        </span>
                        {(char.equippedSlots?.offHand?.isShield || char.equippedShield) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(201, 168, 76, 0.25)', color: '#5C341F', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                            + Щит (+2 КД)
                          </span>
                        )}
                      </div>
                      {(char.equippedSlots?.armor?.name || char.equippedArmor) && !char.equippedArmor?.startsWith('unarmored:') && (
                        <button
                          type="button"
                          onClick={() => {
                            const armorName = char.equippedSlots?.armor?.name || char.equippedArmor || '';
                            const item = findItemByName(armorName);
                            if (item) setActiveItemModal(item);
                          }}
                          className="text-[10px] underline font-medium cursor-pointer"
                          style={{ color: '#8B6914' }}
                        >
                          Свойства
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="space-y-1"><label className="parchment-label text-xs truncate">Макс. хитов</label><input type="number" value={char.hpMax ?? ''} onChange={e => update('hpMax', e.target.value === '' ? null : Number(e.target.value))} className={inputClass} /></div>
                    <div className="space-y-1"><label className="parchment-label text-xs truncate">Текущие</label><input type="number" value={char.hpCurrent} onChange={e => update('hpCurrent', Number(e.target.value) || 0)} className={inputClass} /></div>
                    <div className="space-y-1"><label className="parchment-label text-xs truncate">Временные</label><input type="number" value={char.hpTemp} onChange={e => update('hpTemp', Number(e.target.value) || 0)} className={inputClass} /></div>
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

                  {/* Jump & Carrying Capacity Widget */}
                  <div className="pt-2.5 space-y-2" style={{ borderTop: '1px solid rgba(201, 168, 76, 0.3)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Carrying capacity */}
                      <div
                        className="p-2 rounded flex flex-col justify-between"
                        style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.35)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1" style={{ color: '#5C341F' }}>
                            <span>🏋️</span> <span>Грузоподъёмность:</span>
                          </span>
                          {carryCap.isPowerfulBuild && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                              style={{ background: '#5C341F', color: '#FFE58F' }}
                              title="Мощное телосложение: грузоподъёмность удвоена (×2)"
                            >
                              ×2
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span>Макс.: <strong style={{ color: '#3D2012' }}>{carryCap.maxCarry} фнт.</strong></span>
                          <span className="opacity-80">Толчок: <strong style={{ color: '#3D2012' }}>{carryCap.pushDragLift} фнт.</strong></span>
                        </div>
                      </div>

                      {/* Jump distances */}
                      <div
                        className="p-2 rounded flex flex-col justify-between"
                        style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.35)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1" style={{ color: '#5C341F' }}>
                            <span>🦘</span> <span>Прыжки:</span>
                          </span>
                          <span className="text-[10px] opacity-75" style={{ color: '#8B6914' }}>
                            разбег / с места
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span>В длину: <strong style={{ color: '#3D2012' }}>{jumpDist.longRun} / {jumpDist.longStanding} фт.</strong></span>
                          <span>В высоту: <strong style={{ color: '#3D2012' }}>{jumpDist.highRun} / {jumpDist.highStanding} фт.</strong></span>
                        </div>
                      </div>
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
                          <span
                            onClick={() => updateSkillProf(skill, 'skillProficiencies', !isProf)}
                            className="flex-1 text-xs cursor-pointer select-none hover:text-[#8B4513] transition-colors"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                            title={`Нажмите, чтобы ${isProf ? 'снять владение' : 'выбрать владение'} (${skill})`}
                          >
                            {skill} <span style={{ color: '#8B6914' }}>({ability})</span>
                          </span>
                          <RollBadge value={formatModifier(bonus)} label={`Проверка ${skill}`} modifier={bonus} onRoll={handleRoll} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Attacks and Weapons Card */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <h3 className="parchment-heading flex items-center gap-2 mb-0">
                    <CrossedSwordsIcon size={20} />
                    <span>Атаки и оружие</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowEquipmentModal(true)}
                    className="parchment-btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 font-bold shadow-xs hover:brightness-110 active:scale-95 cursor-pointer"
                    style={{
                      background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.25) 0%, rgba(139, 105, 20, 0.15) 100%)',
                      border: '1px solid #C9A84C',
                      color: '#3D2012',
                    }}
                    title="Экипировать, сменить оружие или щит в окне Экипировки"
                  >
                    <CrossedSwordsIcon size={14} />
                    <span>⚔️ Настроить в Экипировке</span>
                  </button>
                </div>

                <div className="px-3 sm:px-4 pb-4 space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={attackSearchQuery}
                      onChange={e => setAttackSearchQuery(e.target.value)}
                      placeholder="Оружие или атака…"
                      className="parchment-input text-xs w-full py-1 px-2 mb-1"
                    />
                  </div>

                  <div className="overflow-x-auto custom-scrollbar pb-1">
                    <div className="min-w-[480px] space-y-2">
                      <div className="grid grid-cols-[105px_1fr_80px_1fr_36px] gap-1.5 text-xs font-medium px-1" style={{ color: '#8B6914' }}>
                        <span>Тип действия</span>
                        <span>Оружие и хват</span>
                        <span className="text-center">Попадание</span>
                        <span>Урон / Вид</span>
                        <span className="text-center" title="Свойства и описание">Инфо</span>
                      </div>

                      {displayedAttacks.length === 0 ? (
                        <div className="parchment-empty-state my-2">
                          <CrossedSwordsIcon size={26} />
                          <p className="text-xs text-[#5C341F] font-semibold">Оружие не экипировано</p>
                          <p className="text-[11px] text-[#8B6914]">Оружие не выбрано. Нажмите «Настроить в Экипировке», чтобы вооружить персонажа.</p>
                        </div>
                      ) : (
                        displayedAttacks.map((atk, i) => {
                          const weaponDef = atk.weaponDef || findWeaponByName(atk.weaponName);
                          const isDual = atk.source === 'dual';
                          const isOff = atk.source === 'offHand';
                          const isThrown = atk.source === 'thrown';
                          const isUnarmed = atk.source === 'unarmed';

                          return (
                            <div
                              key={`${atk.source}-${atk.weaponName}-${i}`}
                            className={`grid grid-cols-[105px_1fr_80px_1fr_36px] gap-1.5 items-center p-1.5 rounded transition-colors ${
                              isDual
                                ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/60 shadow-xs'
                                : isOff
                                ? 'bg-[#8B6914]/10 border border-[#8B6914]/30'
                                : 'bg-[rgba(232,211,162,0.25)] border border-[rgba(201,168,76,0.3)]'
                            }`}
                          >
                            {/* Action Type Badge */}
                            <div>
                              {atk.actionType === 'dualAction' ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs select-none"
                                  style={{
                                    background: 'linear-gradient(135deg, #8B4513, #5C341F)',
                                    color: '#FFE58F',
                                    border: '1px solid #C9A84C',
                                  }}
                                  title="Требует Основное действие + Бонусное действие"
                                >
                                  <span>⚔️</span>
                                  <span>Действие + Бонус</span>
                                </span>
                              ) : atk.actionType === 'bonus' ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded select-none"
                                  style={{
                                    background: 'rgba(139, 105, 20, 0.2)',
                                    color: '#6B3A2A',
                                    border: '1px solid rgba(139, 105, 20, 0.4)',
                                  }}
                                  title="Бонусное действие (вторая рука)"
                                >
                                  <span>⚡</span>
                                  <span>Бонусное</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded select-none"
                                  style={{
                                    background: 'rgba(92, 52, 31, 0.12)',
                                    color: '#5C341F',
                                    border: '1px solid rgba(92, 52, 31, 0.3)',
                                  }}
                                  title="Основное действие"
                                >
                                  <span>🎯</span>
                                  <span>Действие</span>
                                </span>
                              )}
                            </div>

                            {/* Weapon Name and Subtext */}
                            <div className="min-w-0 pr-1">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs truncate" style={{ color: '#3D2012' }}>
                                  {isDual ? '⚔️ ' : isThrown ? '🎯 ' : isUnarmed ? '👊 ' : isOff ? '🗡️ ' : '🗡️ '}
                                  {atk.weaponName}
                                </span>
                              </div>
                              <div className="text-[10px] truncate" style={{ color: isDual ? '#8B4513' : '#8B6914' }}>
                                {isDual
                                  ? 'Парная атака двумя руками'
                                  : isOff
                                  ? 'Вторая рука (бонусное действие)'
                                  : isThrown
                                  ? 'Метательное (снаряжение / пояс)'
                                  : isUnarmed
                                  ? 'Безоружная атака'
                                  : 'Основная рука'}
                              </div>
                            </div>

                            {/* Attack Bonus + D20 Roll */}
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'rgba(251, 240, 220, 0.9)',
                                  border: '1px solid rgba(201, 168, 76, 0.4)',
                                  color: '#3D2012',
                                }}
                              >
                                {atk.attackBonus}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRollActiveAttack(atk)}
                                className="w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer hover:brightness-110 active:scale-95 shrink-0"
                                style={{
                                  background: isDual
                                    ? 'linear-gradient(180deg, #A0522D, #7A4529)'
                                    : 'linear-gradient(180deg, #8B4513, #6B3A2A)',
                                  color: '#FFE58F',
                                  border: '1px solid #C9A84C',
                                  boxShadow: '0 1px 2px rgba(61, 32, 18, 0.2)'
                                }}
                                title={isDual ? 'Бросить два d20 на попадание обеими руками' : 'Бросить d20 на попадание'}
                              >
                                <D20Icon size={14} />
                              </button>
                            </div>

                            {/* Damage & Type + Roll Button */}
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className="text-xs truncate flex-1 font-medium px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'rgba(251, 240, 220, 0.9)',
                                  border: '1px solid rgba(201, 168, 76, 0.4)',
                                  color: '#3D2012',
                                }}
                                title={atk.damageAndType}
                              >
                                {atk.damageAndType}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRollActiveDamage(atk)}
                                className="w-7 h-7 flex items-center justify-center rounded text-xs cursor-pointer hover:brightness-110 active:scale-95 shrink-0"
                                style={{
                                  background: 'rgba(237, 224, 200, 0.95)',
                                  border: '1px solid rgba(139, 105, 20, 0.45)',
                                  color: '#5C341F'
                                }}
                                title={isDual ? 'Бросить урон обеих атак суммарно' : 'Бросить урон оружия'}
                              >
                                🎲
                              </button>
                            </div>

                            {/* Info Button */}
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (weaponDef) {
                                    setActiveWeaponModal({
                                      weapon: weaponDef,
                                      customName: atk.weaponName,
                                      customBonus: atk.attackBonus,
                                      customDamage: atk.damageAndType,
                                    });
                                  } else {
                                    showToast(atk.weaponName, atk.damageAndType);
                                  }
                                }}
                                title="Посмотреть свойства оружия и правила"
                                className="w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-transform active:scale-95 hover:brightness-110 shrink-0 cursor-pointer"
                                style={{
                                  background: 'rgba(237, 224, 200, 0.6)',
                                  border: '1px solid rgba(139, 105, 20, 0.35)',
                                  boxShadow: '0 1px 3px rgba(61, 32, 18, 0.15)'
                                }}
                              >
                                <InfoSealIcon size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] px-1" style={{ color: '#8B6914' }}>
                    <span>💡 Оружие в руках управляется в Экипировке. Метательное оружие из рюкзака всегда доступно для броска.</span>
                  </div>
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
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <h3 className="parchment-heading flex items-center gap-2">
                    <BackpackPackIcon size={18} />
                    <span>Снаряжение</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowEquipmentModal(true)}
                    className="text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:brightness-110 active:scale-95 shadow-sm"
                    style={{
                      background: 'linear-gradient(180deg, #8B4513, #6B3A2A)',
                      color: '#FFE58F',
                      border: '1px solid #C9A84C',
                    }}
                    title="Интерактивная кукла экипировки (13 слотов)"
                  >
                    <CrossedSwordsIcon size={14} />
                    <span>Экипировка</span>
                  </button>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  {!char.equipment?.trim() && (
                    <div className="parchment-empty-state">
                      <BackpackPackIcon size={24} />
                      <p className="text-xs text-[#5C341F] font-semibold">Рюкзак пуст</p>
                      <p className="text-[11px] text-[#8B6914]">Снаряжение не записано. Запишите предметы походного набора или экипировку.</p>
                    </div>
                  )}
                  <textarea value={char.equipment} onChange={e => update('equipment', e.target.value)} rows={3} placeholder="Набор путешественника, факелы (10), рационы (10 дн.), верёвка..." className={textareaClass} />
                </div>
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
                        placeholder="Поиск способности (Второе дыхание, Ярость, Темное зрение)…"
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
                                  placeholder="Название умения…"
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
                              placeholder="Краткая суть умения (действие, урон, хиты…)"
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
                            <img src={portraitUrl} alt="Портрет" width={144} height={176} loading="lazy" className="w-full h-full object-cover" />
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
                      <textarea value={char.appearance} onChange={e => update('appearance', e.target.value)} rows={4} className={textareaClass} placeholder="Опишите внешность персонажа: цвет волос, глаз, отличительные черты…" />
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
                <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} placeholder={item.key === 'backstory' ? 'Расскажите историю персонажа…' : ''} /></div>
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
                      placeholder="Введите заклинание (Огненный шар, Щит, Лечащее слово)…"
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
                          placeholder="Название заговора…"
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
                    {spells.length === 0 ? (
                      <div className="parchment-empty-state">
                        <SpellbookIcon size={22} />
                        <p className="text-xs text-[#5C341F] font-semibold">В книге заклинаний пока нет записей</p>
                        <p className="text-[11px] text-[#8B6914]">Нажмите «+ Добавить», чтобы записать заклинание {lvl}-го круга.</p>
                      </div>
                    ) : (
                      spells.map((spell, i) => {
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
                                placeholder={`Заклинание ${lvl} ур.…`}
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
                      })
                    )}
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
