'use client';

import React from 'react';
import type {
  CharacterData,
  AbilityName,
  TraitItem,
  ClassTemplate,
} from '@/lib/dnd-types';
import {
  ABILITY_NAMES,
  ABILITY_FULL,
  ALL_SKILLS,
  SKILL_MAP,
  formatModifier,
  getTotalScore,
  getModifier,
  getSavingThrow,
  getSkillBonus,
  getInitiative,
  getPassivePerception,
} from '@/lib/dnd-types';
import {
  CalcBadge,
  RollBadge,
  StatInput,
  RollResult,
  inputClass,
  inputClassCenter,
  textareaClass,
} from '@/components/sheet/SheetUIPrimitives';
import { AutocompleteInput, AutocompleteItem } from '@/components/compendium/AutocompleteInput';
import { findWeaponByName, DndWeapon } from '@/data/dnd-weapons';
import { findTraitByName, DndTrait } from '@/data/dnd-traits';
import { findItemByName, CompendiumItem } from '@/data/compendium/items';
import type { CompendiumClass } from '@/data/compendium/classes';
import type { ActiveAttackOption } from '@/lib/equipment-types';
import {
  UserHeroIcon,
  SparklesDndIcon,
  ScrollIcon,
  CrossedSwordsIcon,
  EngravedShieldIcon,
  HourglassIcon,
  CoinsChestIcon,
  MasksDramaIcon,
  BackpackPackIcon,
  InfoSealIcon,
  D20Icon,
  WarningSignIcon,
  CrownRulerIcon,
  WeightAnvilIcon,
  WingedBootIcon,
  LightningStrikeIcon,
  TargetAimIcon,
  CompendiumBookIcon,
} from '@/components/dnd-icons';

export interface MainSheetPageProps {
  char: CharacterData;
  update: <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => void;
  updateAbility: (ability: AbilityName, field: 'abilityScores' | 'abilityBonuses', value: number) => void;
  updateSaveProf: (ability: AbilityName, val: boolean) => void;
  updateSkillProf: (skill: string, field: 'skillProficiencies' | 'skillExpertise', val: boolean) => void;
  handleRoll: (result: RollResult) => void;
  handleRollActiveAttack: (atk: ActiveAttackOption) => void;
  handleRollActiveDamage: (atk: ActiveAttackOption) => void;
  updateDeathSave: (field: 'deathSaveSuccesses' | 'deathSaveFailures', delta: number) => void;
  handleResetToStandardScores: () => void;
  baseAbilitySum: number;
  profBonus: number;
  abilityWarnings: string[];
  calculatedAC: number;
  activeAC: number;
  carryCap: { maxCarry: number; pushDragLift: number; isPowerfulBuild: boolean };
  jumpDist: { longRun: number; longStanding: number; highRun: number; highStanding: number };
  attackSearchQuery: string;
  setAttackSearchQuery: (q: string) => void;
  displayedAttacks: ActiveAttackOption[];
  weaponAutocompleteItems?: AutocompleteItem[];
  handleQuickAddWeapon?: (weaponNameOrItem: string | AutocompleteItem) => void;
  effectiveTraitsList: TraitItem[];
  traitSearchQuery: string;
  setTraitSearchQuery: (q: string) => void;
  traitAutocompleteItems: AutocompleteItem[];
  traitAddSuccess: string | null;
  setTraitAddSuccess: (val: string | null) => void;
  addTraitItem: (traitData?: DndTrait, customName?: string) => void;
  updateTraitItem: (index: number, field: keyof TraitItem, value: any) => void;
  removeTraitItem: (index: number) => void;
  setShowNameGenModal: (val: boolean) => void;
  setShowClassModal: (val: boolean) => void;
  setShowRaceModal: (val: boolean) => void;
  setShowLevelDown: (val: boolean) => void;
  setShowLevelUp: (val: boolean) => void;
  setShowHistory: (val: boolean) => void;
  setShowStatsCalcModal: (val: boolean) => void;
  setShowEquipmentModal: (val: boolean) => void;
  setShowRestModal: (val: boolean) => void;
  setActiveWeaponModal: (data: { weapon: DndWeapon; customName: string; customBonus?: string; customDamage?: string }) => void;
  setActiveItemModal: (item: CompendiumItem) => void;
  setActiveTraitModal: (data: { trait: DndTrait | null; customName: string; customSource?: string; customSummary?: string; customDescription?: string; traitIndex?: number }) => void;
  showToast: (title: string, message: string) => void;
  compClass?: CompendiumClass | ClassTemplate | null;
  onToggleMainHandGrip?: () => void;
}

export const MainSheetPage = React.memo(function MainSheetPage({
  char,
  update,
  updateAbility,
  updateSaveProf,
  updateSkillProf,
  handleRoll,
  handleRollActiveAttack,
  handleRollActiveDamage,
  updateDeathSave,
  handleResetToStandardScores,
  baseAbilitySum,
  profBonus,
  abilityWarnings,
  calculatedAC,
  activeAC,
  carryCap,
  jumpDist,
  attackSearchQuery,
  setAttackSearchQuery,
  displayedAttacks,
  weaponAutocompleteItems,
  handleQuickAddWeapon,
  effectiveTraitsList,
  traitSearchQuery,
  setTraitSearchQuery,
  traitAutocompleteItems,
  traitAddSuccess,
  setTraitAddSuccess,
  addTraitItem,
  updateTraitItem,
  removeTraitItem,
  setShowNameGenModal,
  setShowClassModal,
  setShowRaceModal,
  setShowLevelDown,
  setShowLevelUp,
  setShowHistory,
  setShowStatsCalcModal,
  setShowEquipmentModal,
  setShowRestModal,
  setActiveWeaponModal,
  setActiveItemModal,
  setActiveTraitModal,
  showToast,
  compClass,
  onToggleMainHandGrip,
}: MainSheetPageProps) {
  return (
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
                    className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-1 leading-none"
                    style={{ color: '#8B6914' }}
                    title="Открыть генератор фэнтезийных имён с этимологией и корнями"
                  >
                    <D20Icon size={12} />
                    <span>Имена</span>
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
                      className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-1 leading-none"
                      style={{ color: '#8B6914' }}
                      title="Выбрать класс из компендиума"
                    >
                      <CompendiumBookIcon size={12} />
                      <span>Каталог классов</span>
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
                    className="text-[10px] font-bold truncate max-w-[140px] flex items-center gap-1"
                    style={{ color: '#6B3A2A' }}
                    title={char.subclass ? `Архетип: ${char.subclass}` : 'Выбор архетипа на соответствующем уровне'}
                  >
                    {char.subclass ? (
                      <>
                        <CrownRulerIcon size={12} />
                        <span>{char.subclass}</span>
                      </>
                    ) : (
                      'Выбор на уровне'
                    )}
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
                      className="text-[10px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-1 leading-none"
                      style={{ color: '#8B6914' }}
                      title="Открыть полный компендиум рас"
                    >
                      <CompendiumBookIcon size={12} />
                      <span>Каталог рас</span>
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
                        {isOverMax && <WarningSignIcon size={12} className="inline cursor-help" title={`Превышает обычный максимум D&D 5e (${maxAllowed})`} />}
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
                        {isOverMax && <WarningSignIcon size={13} className="inline cursor-help" title={`Превышает обычный максимум D&D 5e (${maxAllowed})`} />}
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
                  <WarningSignIcon size={18} />
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
                  className="text-[11px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-1"
                  style={{ color: '#8B6914' }}
                  title="Установить рекомендованный стандартный набор 15, 14, 13, 12, 10, 8 для этого класса"
                >
                  <TargetAimIcon size={12} />
                  <span>Сбросить на стандарт класса ({compClass?.name || char.className || 'Воин'})</span>
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
                  <span>Экипировка</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold flex items-center gap-1" style={{ color: '#3D2012' }}>
                    {char.equippedSlots?.armor?.name ? (
                      <>
                        <EngravedShieldIcon size={12} />
                        <span>{char.equippedSlots.armor.name}</span>
                      </>
                    ) : char.equippedArmor ? (
                      <>
                        <EngravedShieldIcon size={12} />
                        <span>{char.equippedArmor}</span>
                      </>
                    ) : (
                      <span>Без доспехов</span>
                    )}
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
                    <span className="font-bold flex items-center gap-1.5" style={{ color: '#5C341F' }}>
                      <WeightAnvilIcon size={15} />
                      <span>Грузоподъёмность:</span>
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
                    <span className="font-bold flex items-center gap-1.5" style={{ color: '#5C341F' }}>
                      <WingedBootIcon size={15} />
                      <span>Прыжки:</span>
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
              <span>Настроить в Экипировке</span>
            </button>
          </div>

          <div className="px-3 sm:px-4 pb-4 space-y-2">
            <div className="flex gap-2 items-center mb-1">
              <div className="flex-1">
                <AutocompleteInput
                  value={attackSearchQuery}
                  onChange={setAttackSearchQuery}
                  onSelect={item => {
                    if (handleQuickAddWeapon) {
                      handleQuickAddWeapon(item);
                    }
                  }}
                  items={weaponAutocompleteItems || []}
                  placeholder="Оружие или атака…"
                  className="parchment-input text-xs w-full py-1 px-2"
                />
              </div>
              {handleQuickAddWeapon && (
                <button
                  type="button"
                  onClick={() => {
                    if (attackSearchQuery.trim()) {
                      handleQuickAddWeapon(attackSearchQuery.trim());
                    }
                  }}
                  className="parchment-btn-secondary text-xs px-3 py-1.5 shrink-0 font-bold"
                  title="Экипировать оружие в основную руку"
                >
                  + Вооружить
                </button>
              )}
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
                              <CrossedSwordsIcon size={11} />
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
                              <LightningStrikeIcon size={11} />
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
                              <TargetAimIcon size={11} />
                              <span>Действие</span>
                            </span>
                          )}
                        </div>

                        {/* Weapon Name and Subtext */}
                        <div className="min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs truncate flex items-center gap-1" style={{ color: '#3D2012' }}>
                              <CrossedSwordsIcon size={12} className="shrink-0" />
                              <span>{atk.weaponName}</span>
                            </span>
                            {atk.canToggleGrip && onToggleMainHandGrip && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleMainHandGrip();
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs"
                                style={{
                                  background: atk.grip === '2H'
                                    ? 'linear-gradient(180deg, #8B4513, #5C341F)'
                                    : 'rgba(232, 211, 162, 0.95)',
                                  color: atk.grip === '2H' ? '#FFE58F' : '#5C341F',
                                  border: atk.grip === '2H' ? '1px solid #C9A84C' : '1px solid rgba(139, 105, 20, 0.45)',
                                }}
                                title={atk.grip === '2H'
                                  ? 'Двуручный хват (увеличенный урон, вторая рука занята). Нажмите, чтобы переключить на 1H хват'
                                  : 'Одноручный хват (базовый урон, вторая рука свободна). Нажмите, чтобы переключить на 2H хват'}
                              >
                                <span>{atk.grip === '2H' ? '👐 2H хват' : '✋ 1H хват'}</span>
                              </button>
                            )}
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
                              : atk.grip === '2H'
                              ? 'Основная рука · Двуручный хват'
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
                            <D20Icon size={14} />
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
              <span className="flex items-center gap-1.5">
                <InfoSealIcon size={14} className="shrink-0" />
                <span>Оружие в руках управляется в Экипировке. Метательное оружие из рюкзака всегда доступно для броска.</span>
              </span>
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
  );
});
