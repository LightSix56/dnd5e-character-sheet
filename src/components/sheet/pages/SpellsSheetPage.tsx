import React, { useState, useMemo, useCallback } from 'react';
import {
  CharacterData,
  AbilityName,
  ABILITY_NAMES,
  ABILITY_FULL,
  formatModifier,
  getSpellSaveDC,
  getSpellAttackBonus,
  getSpellDamageBonus,
  getSpellAbilityMod,
  SpellEntry,
} from '@/lib/dnd-types';
import {
  CalcBadge,
  RollBadge,
  StatInput,
  RollResult,
  inputClass,
  inputClassCenter,
} from '@/components/sheet/SheetUIPrimitives';
import { AutocompleteInput, AutocompleteItem } from '@/components/compendium/AutocompleteInput';
import { DND_SPELLS, findSpellByName, type DndSpell } from '@/data/dnd-spells';
import { isSpellAllowedForCharacter, getMaxAvailableSpellSlotLevel } from '@/data/compendium/class-spells';
import {
  SpellbookIcon,
  CrystalBallDndIcon,
  SparklesDndIcon,
  InfoSealIcon,
  LockSealIcon,
  WarningSignIcon,
} from '@/components/dnd-icons';
import { BlockHelpButton } from '@/components/encyclopedia/BlockHelpButton';

export interface SpellsSheetPageProps {
  char: CharacterData;
  update: <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => void;
  updateSpellSlot: (level: number, field: 'totalSlots' | 'expendedSlots', value: number) => void;
  updateCantrip: (index: number, value: string) => void;
  addCantrip: () => void;
  removeCantrip: (index: number) => void;
  updateSpellEntry: (level: number, index: number, field: keyof SpellEntry, value: any) => void;
  addSpell: (level: number) => void;
  removeSpell: (level: number, index: number) => void;
  setActiveSpellModal: (data: { spell: DndSpell | null; customName: string }) => void;
  handleRoll: (result: RollResult) => void;
  showToast: (title: string, message: string) => void;
  // Optional overrides (fallback to internal state if omitted)
  filterOnlyMyClassSpells?: boolean;
  setFilterOnlyMyClassSpells?: (val: boolean) => void;
  spellSearchQuery?: string;
  setSpellSearchQuery?: (val: string) => void;
  spellAutocompleteItems?: AutocompleteItem[];
  handleQuickAddSpell?: (item: AutocompleteItem) => void;
  spellAddSuccess?: string | null;
  setSpellAddSuccess?: (val: string | null) => void;
  maxAvailableSlot?: number;
  setPendingForeignSpell?: (data: { spell: DndSpell; level: number; callback: () => void } | null) => void;
  onOpenEncyclopedia?: (chapterId: string, sectionId?: string) => void;
}

export const SpellsSheetPage = React.memo(function SpellsSheetPage({
  char,
  update,
  updateSpellSlot,
  updateCantrip,
  addCantrip,
  removeCantrip,
  updateSpellEntry,
  addSpell,
  removeSpell,
  filterOnlyMyClassSpells: filterOnlyMyClassSpellsProp,
  setFilterOnlyMyClassSpells: setFilterOnlyMyClassSpellsProp,
  spellSearchQuery: spellSearchQueryProp,
  setSpellSearchQuery: setSpellSearchQueryProp,
  spellAutocompleteItems: spellAutocompleteItemsProp,
  handleQuickAddSpell: handleQuickAddSpellProp,
  spellAddSuccess: spellAddSuccessProp,
  setSpellAddSuccess: setSpellAddSuccessProp,
  setActiveSpellModal,
  maxAvailableSlot: maxAvailableSlotProp,
  handleRoll,
  showToast,
  setPendingForeignSpell,
  onOpenEncyclopedia,
}: SpellsSheetPageProps) {
  const [internalFilter, setInternalFilter] = useState(true);
  const [internalQuery, setInternalQuery] = useState('');
  const [internalSuccess, setInternalSuccess] = useState<string | null>(null);

  const filterOnlyMyClassSpells = filterOnlyMyClassSpellsProp !== undefined ? filterOnlyMyClassSpellsProp : internalFilter;
  const setFilterOnlyMyClassSpells = setFilterOnlyMyClassSpellsProp || setInternalFilter;

  const spellSearchQuery = spellSearchQueryProp !== undefined ? spellSearchQueryProp : internalQuery;
  const setSpellSearchQuery = setSpellSearchQueryProp || setInternalQuery;

  const spellAddSuccess = spellAddSuccessProp !== undefined ? spellAddSuccessProp : internalSuccess;
  const setSpellAddSuccess = setSpellAddSuccessProp || setInternalSuccess;

  const calculatedMaxSlot = useMemo(() => getMaxAvailableSpellSlotLevel(char), [char]);
  const maxAvailableSlot = maxAvailableSlotProp !== undefined ? maxAvailableSlotProp : calculatedMaxSlot;

  const internalAutocompleteItems = useMemo<AutocompleteItem[]>(() => {
    return DND_SPELLS.map((s) => {
      const check = isSpellAllowedForCharacter(char, s);
      const slotAllowed = s.level === 0 || s.level <= maxAvailableSlot;
      return { spell: s, check, slotAllowed };
    })
      .filter(({ check, slotAllowed }) => {
        if (!filterOnlyMyClassSpells) return true;
        return check.allowed && slotAllowed;
      })
      .map(({ spell: s, check, slotAllowed }) => {
        const levelBadge = s.level === 0 ? 'Заговор' : `${s.level} ур.`;
        const slotNote = slotAllowed ? '' : ` • [нет ячеек] (макс. ${maxAvailableSlot || '0'} ур.)`;
        const badge = `${levelBadge} • ${check.sourceLabel}${slotNote}`;

        return {
          name: s.name,
          badge,
          secondary: s.nameEn ? `${s.nameEn} • ${s.school}` : s.school,
          data: s,
        };
      });
  }, [char, filterOnlyMyClassSpells, maxAvailableSlot]);

  const spellAutocompleteItems = spellAutocompleteItemsProp || internalAutocompleteItems;

  const internalQuickAdd = useCallback(
    (item: AutocompleteItem) => {
      const spell = item.data as DndSpell | undefined;
      const spellName = item.name.trim();
      if (!spellName) return;

      const matchedSpell = spell || findSpellByName(spellName);
      const level = matchedSpell ? matchedSpell.level : 0;

      if (level > 0) {
        if (level > maxAvailableSlot) {
          showToast(
            'Недоступный круг ячеек',
            `Заклинание «${matchedSpell?.name || spellName}» (${level} ур.) требует ячейки ${level}-го уровня. У вашего персонажа доступны ячейки только до ${maxAvailableSlot || '0 (нет ячеек)'}-го уровня.`
          );
          return;
        }
      }

      const doAdd = () => {
        if (level === 0) {
          update('cantrips', [...(char.cantrips || []), spellName]);
        } else {
          const s = { ...(char.spellsByLevel || {}) };
          s[level] = [...(s[level] || []), { name: spellName, prepared: true }];
          update('spellsByLevel', s);
        }

        const lvlLabel = level === 0 ? 'Заговоры (0 ур.)' : `Заклинания ${level} ур.`;
        setSpellAddSuccess(`✨ «${spellName}» добавлено в ${lvlLabel}`);
        setTimeout(() => setSpellAddSuccess(null), 3000);
        setSpellSearchQuery('');
      };

      if (matchedSpell) {
        const check = isSpellAllowedForCharacter(char, matchedSpell);
        if (!check.allowed && setPendingForeignSpell) {
          setPendingForeignSpell({
            spell: matchedSpell,
            level,
            callback: doAdd,
          });
          return;
        }
      }

      doAdd();
    },
    [char, maxAvailableSlot, showToast, update, setSpellAddSuccess, setSpellSearchQuery, setPendingForeignSpell]
  );

  const handleQuickAddSpell = handleQuickAddSpellProp || internalQuickAdd;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="parchment-card">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <h3 className="parchment-heading flex items-center gap-2 mb-0">
            <SpellbookIcon size={20} />
            <span>Параметры заклинателя</span>
          </h3>
          <BlockHelpButton chapterId="magic-and-spells" sectionId="cantrips-vs-leveled" label="Разбор магии и ячеек" onOpen={onOpenEncyclopedia} />
        </div>
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatInput
              label="Класс заклинателя"
              value={char.spellcastingClass}
              onChange={(v) => update('spellcastingClass', v)}
              type="text"
              placeholder="Волшебник"
            />
            <div className="space-y-1">
              <label className="parchment-label">Характеристика</label>
              <select
                value={char.spellcastingAbility}
                onChange={(e) => update('spellcastingAbility', e.target.value as AbilityName | '')}
                className="parchment-select h-8"
              >
                <option value="">— Нет —</option>
                {ABILITY_NAMES.map((a) => (
                  <option key={a} value={a}>
                    {ABILITY_FULL[a]} ({a})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {char.spellcastingAbility && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="parchment-label">Сл. спасения</label>
                <CalcBadge value={getSpellSaveDC(char)} />
              </div>
              <div className="space-y-1">
                <label className="parchment-label">Бонус атаки</label>
                <RollBadge
                  value={formatModifier(getSpellAttackBonus(char))}
                  label="Атака заклинанием"
                  modifier={getSpellAttackBonus(char)}
                  onRoll={handleRoll}
                />
              </div>
              <div className="space-y-1">
                <label className="parchment-label">Мод. хар-ки</label>
                <CalcBadge value={formatModifier(getSpellAbilityMod(char))} />
              </div>
              <div className="space-y-1">
                <label className="parchment-label">Бонус урона</label>
                <CalcBadge value={formatModifier(getSpellDamageBonus(char))} />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="parchment-card">
        <div className="px-4 pt-4 pb-3">
          <h3 className="parchment-heading flex items-center gap-2">
            <CrystalBallDndIcon size={20} />
            <span>Ячейки заклинаний</span>
          </h3>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
            const slot = char.spellSlots[lvl] || { totalSlots: 0, expendedSlots: 0 };
            return (
              <div key={lvl} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                <span
                  className="text-xs font-bold w-16"
                  style={{ color: '#6B3A2A', fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {lvl} ур.
                </span>
                <div className="space-y-0.5">
                  <label className="text-[10px]" style={{ color: '#8B6914' }}>
                    Всего
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={slot.totalSlots}
                    onChange={(e) => updateSpellSlot(lvl, 'totalSlots', Number(e.target.value) || 0)}
                    className={inputClassCenter}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px]" style={{ color: '#8B6914' }}>
                    Потрач.
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={slot.totalSlots}
                    value={slot.expendedSlots}
                    onChange={(e) => updateSpellSlot(lvl, 'expendedSlots', Number(e.target.value) || 0)}
                    className={inputClassCenter}
                  />
                </div>
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
          <label
            className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold"
            style={{ color: '#5C341F' }}
          >
            <input
              type="checkbox"
              checked={filterOnlyMyClassSpells}
              onChange={(e) => setFilterOnlyMyClassSpells(e.target.checked)}
              className="rounded accent-[#5C341F] cursor-pointer"
            />
            <span>
              Только заклинания {char.className || char.spellcastingClass || 'моего класса'}
              {char.subclass ? ` (+ ${char.subclass})` : ''}
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
                className={inputClass + ' w-full font-medium'}
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
            <div
              className="mt-2.5 text-xs font-medium px-3 py-1.5 rounded flex items-center justify-between"
              style={{
                background: 'rgba(201, 168, 76, 0.15)',
                color: '#6B3A2A',
                border: '1px solid rgba(201, 168, 76, 0.4)',
              }}
            >
              <span>{spellAddSuccess}</span>
              <button
                onClick={() => setSpellAddSuccess(null)}
                className="opacity-70 hover:opacity-100 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="parchment-card lg:col-span-2">
        <div className="px-4 pt-4 pb-3">
          <h3 className="parchment-heading flex items-center gap-2">
            <SparklesDndIcon size={20} />
            <span>Заговоры (0 ур.)</span>
          </h3>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {char.cantrips.map((c, i) => {
            const spellDef = findSpellByName(c);
            const check = c.trim() ? isSpellAllowedForCharacter(char, spellDef || c) : null;
            return (
              <div key={i} className="flex gap-1.5 items-center">
                <div className="flex-1 relative flex items-center">
                  <input
                    value={c}
                    onChange={(e) => updateCantrip(i, e.target.value)}
                    placeholder="Название заговора…"
                    className={inputClass + (check ? ' pr-28' : '')}
                  />
                  {check && (
                    <span
                      className="absolute right-2 text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none truncate max-w-[110px]"
                      style={{
                        background: check.allowed
                          ? check.source === 'class'
                            ? 'rgba(40, 140, 40, 0.15)'
                            : 'rgba(30, 100, 200, 0.15)'
                          : 'rgba(217, 83, 79, 0.18)',
                        color: check.allowed
                          ? check.source === 'class'
                            ? '#276727'
                            : '#1B4D89'
                          : '#900',
                        border: check.allowed
                          ? check.source === 'class'
                            ? '1px solid rgba(40, 140, 40, 0.3)'
                            : '1px solid rgba(30, 100, 200, 0.3)'
                          : '1px solid rgba(217, 83, 79, 0.4)',
                      }}
                      title={check.reason || check.sourceLabel}
                    >
                      {check.allowed ? (
                        check.sourceLabel
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <WarningSignIcon size={10} />
                          <span>Чужой</span>
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSpellModal({
                      spell: spellDef || null,
                      customName: c || 'Заговор',
                    })
                  }
                  title="Подробности заговора"
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: 'rgba(237, 224, 200, 0.6)',
                    border: '1px solid rgba(139, 105, 20, 0.35)',
                  }}
                >
                  <InfoSealIcon size={18} />
                </button>
                <button
                  onClick={() => removeCantrip(i)}
                  className="parchment-remove-btn w-8 h-8 shrink-0 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            );
          })}
          <button onClick={addCantrip} className="parchment-btn-secondary text-xs py-1.5">
            + Добавить заговор
          </button>
        </div>
      </div>

      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
        const spells = char.spellsByLevel[lvl] || [];
        return (
          <div key={lvl} className="parchment-card">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-wrap gap-1">
              <h3 className="parchment-heading flex items-center gap-2">
                <SpellbookIcon size={18} />
                <span>Заклинания {lvl} ур.</span>
                <span className="text-xs font-normal" style={{ color: '#8B6914' }}>
                  ({spells.length})
                </span>
              </h3>
              {lvl > maxAvailableSlot && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono inline-flex items-center gap-1"
                  style={{
                    background: 'rgba(217, 130, 43, 0.15)',
                    color: '#A04000',
                    border: '1px solid rgba(217, 130, 43, 0.3)',
                  }}
                  title={`Ячейки ${lvl}-го круга еще не доступны вашему персонажу`}
                >
                  <LockSealIcon size={11} />
                  <span>Ячейки не открыты</span>
                </span>
              )}
            </div>
            <div className="px-4 pb-4 space-y-2">
              {spells.length === 0 ? (
                <div className="parchment-empty-state">
                  <SpellbookIcon size={22} />
                  <p className="text-xs text-[#5C341F] font-semibold">В книге заклинаний пока нет записей</p>
                  <p className="text-[11px] text-[#8B6914]">
                    Нажмите «+ Добавить», чтобы записать заклинание {lvl}-го круга.
                  </p>
                </div>
              ) : (
                spells.map((spell, i) => {
                  const spellDef = findSpellByName(spell.name);
                  const check = spell.name.trim()
                    ? isSpellAllowedForCharacter(char, spellDef || spell.name)
                    : null;
                  return (
                    <div key={i} className="flex gap-1.5 items-center">
                      <label className="parchment-checkbox" title="Подготовлено">
                        <input
                          type="checkbox"
                          checked={spell.prepared}
                          onChange={(e) => updateSpellEntry(lvl, i, 'prepared', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="flex-1 relative flex items-center">
                        <AutocompleteInput
                          value={spell.name}
                          onChange={(val) => updateSpellEntry(lvl, i, 'name', val)}
                          items={spellAutocompleteItems}
                          placeholder={`Заклинание ${lvl} ур.…`}
                          className={inputClass + (check ? ' pr-28' : '')}
                        />
                        {check && (
                          <span
                            className="absolute right-2 text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none truncate max-w-[110px]"
                            style={{
                              background: check.allowed
                                ? check.source === 'class'
                                  ? 'rgba(40, 140, 40, 0.15)'
                                  : 'rgba(30, 100, 200, 0.15)'
                                : 'rgba(217, 83, 79, 0.18)',
                              color: check.allowed
                                ? check.source === 'class'
                                  ? '#276727'
                                  : '#1B4D89'
                                : '#900',
                              border: check.allowed
                                ? check.source === 'class'
                                  ? '1px solid rgba(40, 140, 40, 0.3)'
                                  : '1px solid rgba(30, 100, 200, 0.3)'
                                : '1px solid rgba(217, 83, 79, 0.4)',
                            }}
                            title={check.reason || check.sourceLabel}
                          >
                            {check.allowed ? (
                              check.sourceLabel
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <WarningSignIcon size={10} />
                                <span>Чужой</span>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSpellModal({
                            spell: spellDef || null,
                            customName: spell.name || `Заклинание ${lvl} ур.`,
                          })
                        }
                        title="Подробности заклинания"
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded text-xs font-bold transition-transform active:scale-95 hover:brightness-110"
                        style={{
                          background: 'rgba(237, 224, 200, 0.6)',
                          border: '1px solid rgba(139, 105, 20, 0.35)',
                        }}
                      >
                        <InfoSealIcon size={18} />
                      </button>
                      <button
                        onClick={() => removeSpell(lvl, i)}
                        className="parchment-remove-btn w-8 h-8 shrink-0 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
              <button
                type="button"
                onClick={() => {
                  if (lvl > maxAvailableSlot) {
                    showToast(
                      'Ячейки не открыты',
                      `У персонажа еще нет ячеек ${lvl}-го круга. Повысьте уровень персонажа.`
                    );
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
  );
});
