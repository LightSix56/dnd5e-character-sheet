'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { CharacterData, DndConditionInfo } from '@/lib/dnd-types';
import {
  DND_CONDITIONS,
  isConditionIncapacitating,
} from '@/lib/dnd-types';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  WarningSignIcon,
  SpellbookIcon,
  CrystalBallDndIcon,
  InfoSealIcon,
  TrashBinIcon,
  SearchLensIcon,
} from '@/components/dnd-icons';

export interface ConditionsTrackerProps {
  char: CharacterData;
  onChange: <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => void;
  className?: string;
}

export function ConditionsTracker({
  char,
  onChange,
  className = '',
}: ConditionsTrackerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCondition, setViewingCondition] = useState<DndConditionInfo | null>(null);
  const [isAddingConcentration, setIsAddingConcentration] = useState(false);
  const [concentrationInput, setConcentrationInput] = useState('');

  const activeConditions = useMemo(() => {
    return Array.isArray(char.conditions) ? char.conditions : [];
  }, [char.conditions]);

  const hasAnyActive = activeConditions.length > 0 || Boolean(char.concentration);

  const getExhaustionLevel = useCallback((condStr: string): number => {
    if (condStr === 'exhaustion') return 1;
    if (condStr.startsWith('exhaustion:')) {
      const val = parseInt(condStr.split(':')[1], 10);
      return isNaN(val) ? 1 : Math.min(6, Math.max(1, val));
    }
    return 1;
  }, []);

  const handleUpdateExhaustion = useCallback((newLevel: number) => {
    const current = Array.isArray(char.conditions) ? char.conditions : [];
    if (newLevel <= 0) {
      onChange('conditions', current.filter(c => c !== 'exhaustion' && !c.startsWith('exhaustion:')));
    } else {
      const clamped = Math.min(6, Math.max(1, newLevel));
      const filtered = current.filter(c => c !== 'exhaustion' && !c.startsWith('exhaustion:'));
      onChange('conditions', [...filtered, `exhaustion:${clamped}`]);
    }
  }, [char.conditions, onChange]);

  const handleRemoveCondition = useCallback((condStr: string) => {
    const current = Array.isArray(char.conditions) ? char.conditions : [];
    onChange('conditions', current.filter(c => c !== condStr));
  }, [char.conditions, onChange]);

  const handleToggleCondition = useCallback((condId: string) => {
    const current = Array.isArray(char.conditions) ? char.conditions : [];
    const isExhaustion = condId === 'exhaustion';
    const isActive = isExhaustion
      ? current.some(c => c === 'exhaustion' || c.startsWith('exhaustion:'))
      : current.includes(condId);

    if (isActive) {
      if (isExhaustion) {
        onChange('conditions', current.filter(c => c !== 'exhaustion' && !c.startsWith('exhaustion:')));
      } else {
        onChange('conditions', current.filter(c => c !== condId));
      }
    } else {
      if (isConditionIncapacitating(condId) && char.concentration) {
        onChange('concentration', null);
      }
      const toAdd = isExhaustion ? 'exhaustion:1' : condId;
      onChange('conditions', [...current, toAdd]);
    }
  }, [char.conditions, char.concentration, onChange]);

  const handleClearAll = useCallback(() => {
    onChange('conditions', []);
    onChange('concentration', null);
  }, [onChange]);

  const handleStartConcentration = useCallback(() => {
    const trimmed = concentrationInput.trim();
    if (!trimmed) return;
    onChange('concentration', {
      spellName: trimmed,
      dc: 10,
    });
    setConcentrationInput('');
    setIsAddingConcentration(false);
  }, [concentrationInput, onChange]);

  const availableSpells = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(char.cantrips)) {
      list.push(...char.cantrips);
    }
    if (char.spellsByLevel) {
      for (const level in char.spellsByLevel) {
        const entries = char.spellsByLevel[level];
        if (Array.isArray(entries)) {
          for (const sp of entries) {
            if (sp.name && !list.includes(sp.name)) {
              list.push(sp.name);
            }
          }
        }
      }
    }
    return list.sort();
  }, [char.cantrips, char.spellsByLevel]);

  const filteredConditions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return DND_CONDITIONS;
    return DND_CONDITIONS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.rulesSummary.some(r => r.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const closeModals = useCallback(() => {
    if (viewingCondition) {
      setViewingCondition(null);
    } else if (showAddModal) {
      setShowAddModal(false);
    }
  }, [viewingCondition, showAddModal]);

  useEscapeKey(closeModals);

  return (
    <div
      className={`parchment-card ${className}`}
      data-tour-id="tour-conditions"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="parchment-heading flex items-center gap-2 mb-0">
            <WarningSignIcon size={20} />
            <span>Состояния и Концентрация</span>
          </h3>
        </div>
        {hasAnyActive && (
          <button
            type="button"
            onClick={handleClearAll}
            className="parchment-btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer transition-all hover:brightness-110 active:scale-95 shadow-xs"
            title="Сбросить все активные состояния и концентрацию"
          >
            <TrashBinIcon size={13} />
            <span>Очистить все</span>
          </button>
        )}
      </div>

      {/* Concentration Section */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#5C341F' }}>
            <CrystalBallDndIcon size={15} />
            <span>Концентрация на заклинании:</span>
          </span>
          {!char.concentration && !isAddingConcentration && (
            <button
              type="button"
              onClick={() => setIsAddingConcentration(true)}
              className="text-[11px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-1 leading-none"
              style={{ color: '#8B6914' }}
              title="Начать удерживать концентрацию на заклинании"
            >
              <span>+ Концентрация</span>
            </button>
          )}
        </div>

        {char.concentration ? (
          <div
            className="p-2.5 rounded-sm space-y-1.5 transition-all"
            style={{
              background: 'rgba(232, 211, 162, 0.45)',
              border: '1px solid #C9A84C',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <SpellbookIcon size={16} />
                <span className="font-bold text-sm truncate" style={{ color: '#3D2012' }}>
                  {char.concentration.spellName}
                </span>
                {typeof char.concentration.castAtLevel === 'number' && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: '#5C341F', color: '#FFE58F' }}
                  >
                    {char.concentration.castAtLevel} круг
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange('concentration', null)}
                className="parchment-remove-btn text-xs px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="Сбросить концентрацию"
              >
                <span>✕</span>
                <span className="text-[11px] hidden sm:inline">Сбросить</span>
              </button>
            </div>

            <div
              className="text-[11px] leading-tight p-2 rounded flex items-start gap-1.5"
              style={{
                background: 'rgba(139, 105, 20, 0.08)',
                color: '#6B3A2A',
                borderLeft: '2px solid #C9A84C',
              }}
            >
              <InfoSealIcon size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>Спасбросок Телосложения при получении урона:</strong> СЛ = 10 или половина полученного урона (что больше).
              </span>
            </div>
          </div>
        ) : isAddingConcentration ? (
          <div
            className="p-2 rounded-sm space-y-2"
            style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px dashed #C9A84C' }}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={concentrationInput}
                onChange={(e) => setConcentrationInput(e.target.value)}
                placeholder="Название заклинания (напр. Благословение)..."
                className="parchment-input-boxed text-xs flex-1 px-2.5 py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStartConcentration();
                  if (e.key === 'Escape') setIsAddingConcentration(false);
                }}
                list="character-concentration-spells"
              />
              <datalist id="character-concentration-spells">
                {availableSpells.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={handleStartConcentration}
                disabled={!concentrationInput.trim()}
                className="parchment-btn text-xs px-2.5 py-1 cursor-pointer disabled:opacity-50"
              >
                Удерживать
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingConcentration(false);
                  setConcentrationInput('');
                }}
                className="parchment-btn-secondary text-xs px-2 py-1 cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Conditions Section */}
      <div className="px-4 pb-4 space-y-2.5" style={{ borderTop: '1px solid rgba(201, 168, 76, 0.3)' }}>
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#5C341F' }}>
            <WarningSignIcon size={14} />
            <span>Активные состояния ({activeConditions.length}):</span>
          </span>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-[11px] font-bold underline cursor-pointer hover:opacity-80 flex items-center gap-1 leading-none"
            style={{ color: '#8B6914' }}
            title="Открыть список всех 15 состояний D&D 5e"
          >
            <span>+ Состояние</span>
          </button>
        </div>

        {/* Active Condition Chips */}
        {activeConditions.length === 0 ? (
          <div
            className="py-2.5 px-3 rounded text-center text-xs italic select-none"
            style={{ color: '#8B6914', background: 'rgba(201, 168, 76, 0.08)' }}
          >
            Нет активных состояний (персонаж в норме)
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeConditions.map((condStr) => {
              const isExhaustion = condStr === 'exhaustion' || condStr.startsWith('exhaustion:');
              const condId = isExhaustion ? 'exhaustion' : condStr;
              const info = DND_CONDITIONS.find((c) => c.id === condId);
              const isIncap = isConditionIncapacitating(condId);
              const exhaustLevel = isExhaustion ? getExhaustionLevel(condStr) : 1;

              if (isExhaustion) {
                return (
                  <div
                    key="exhaustion"
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border shadow-xs"
                    style={{
                      background: exhaustLevel >= 6 ? 'rgba(160, 20, 20, 0.22)' : 'rgba(180, 80, 20, 0.15)',
                      borderColor: exhaustLevel >= 6 ? '#A01414' : '#C9A84C',
                      color: exhaustLevel >= 6 ? '#7A1010' : '#5C2D10',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setViewingCondition(info || null)}
                      className="font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
                      title="Посмотреть правила уровней истощения"
                    >
                      <span>Истощение (ур. {exhaustLevel})</span>
                      <InfoSealIcon size={12} />
                    </button>
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateExhaustion(exhaustLevel - 1)}
                        className="px-1 py-0.2 text-[11px] font-bold rounded bg-amber-900/10 hover:bg-amber-900/20 cursor-pointer"
                        title="Уменьшить уровень истощения"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateExhaustion(exhaustLevel + 1)}
                        disabled={exhaustLevel >= 6}
                        className="px-1 py-0.2 text-[11px] font-bold rounded bg-amber-900/10 hover:bg-amber-900/20 cursor-pointer disabled:opacity-40"
                        title="Увеличить уровень истощения"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(condStr)}
                      className="parchment-remove-btn ml-0.5"
                      title="Снять истощение"
                    >
                      ✕
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={condStr}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded border shadow-xs"
                  style={{
                    background: isIncap ? 'rgba(180, 40, 20, 0.12)' : 'rgba(139, 105, 20, 0.12)',
                    borderColor: isIncap ? 'rgba(180, 40, 20, 0.5)' : '#C9A84C',
                    color: isIncap ? '#7A1A10' : '#3D2012',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewingCondition(info || null)}
                    className="font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
                    title="Посмотреть подробное описание и правила состояния"
                  >
                    <span>{info?.name || condStr}</span>
                    {isIncap && (
                      <span
                        className="text-[9px] px-1 rounded font-bold uppercase"
                        style={{ background: '#7A1A10', color: '#FFE58F' }}
                        title="Недееспособен: сбрасывает концентрацию"
                      >
                        недеесп.
                      </span>
                    )}
                    <InfoSealIcon size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(condStr)}
                    className="parchment-remove-btn ml-0.5"
                    title={`Снять состояние: ${info?.name || condStr}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Condition Selector Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="parchment-modal max-w-lg w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#C9A84C]/40">
              <h3 className="parchment-heading flex items-center gap-2 mb-0">
                <WarningSignIcon size={20} />
                <span>Состояния персонажа (D&D 5e)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="parchment-remove-btn"
                title="Закрыть"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 pb-2 border-b border-[#C9A84C]/20">
              <div className="relative">
                <SearchLensIcon size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или правилу (напр. атака, скорость, зрение)..."
                  className="parchment-input-boxed text-xs w-full pl-8 pr-3 py-1.5"
                  autoFocus
                />
              </div>
            </div>

            {/* List of Conditions */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredConditions.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: '#8B6914' }}>
                  Состояний по запросу «{searchQuery}» не найдено
                </p>
              ) : (
                filteredConditions.map((cond) => {
                  const isExhaustion = cond.id === 'exhaustion';
                  const isActive = isExhaustion
                    ? activeConditions.some(c => c === 'exhaustion' || c.startsWith('exhaustion:'))
                    : activeConditions.includes(cond.id);
                  const isIncap = isConditionIncapacitating(cond.id);

                  return (
                    <div
                      key={cond.id}
                      onClick={() => handleToggleCondition(cond.id)}
                      className={`p-3 rounded border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isActive ? 'ring-1 ring-[#C9A84C]' : 'hover:brightness-95'
                      }`}
                      style={{
                        background: isActive
                          ? 'rgba(201, 168, 76, 0.22)'
                          : 'rgba(251, 240, 220, 0.7)',
                        borderColor: isActive ? '#C9A84C' : 'rgba(201, 168, 76, 0.35)',
                      }}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: '#3D2012' }}>
                            {cond.name}
                          </span>
                          {isIncap && (
                            <span
                              className="text-[10px] px-1.5 py-0.2 rounded font-semibold"
                              style={{ background: '#7A1A10', color: '#FFE58F' }}
                              title="Недееспособность: автоматически прерывает концентрацию на заклинаниях"
                            >
                              Прерывает концентрацию
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#5C341F' }}>
                          {cond.description}
                        </p>
                        <div className="pt-1 space-y-0.5">
                          {cond.rulesSummary.slice(0, 2).map((rule, idx) => (
                            <div key={idx} className="text-[11px] flex items-start gap-1" style={{ color: '#8B6914' }}>
                              <span>•</span>
                              <span>{rule}</span>
                            </div>
                          ))}
                          {cond.rulesSummary.length > 2 && (
                            <span className="text-[10px] italic opacity-80" style={{ color: '#8B6914' }}>
                              +{cond.rulesSummary.length - 2} правил...
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCondition(cond.id);
                          }}
                          className={`text-xs px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                            isActive ? 'parchment-btn' : 'parchment-btn-secondary'
                          }`}
                        >
                          {isActive ? '✓ Активно' : '+ Добавить'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#C9A84C]/40 flex items-center justify-between">
              <span className="text-xs" style={{ color: '#8B6914' }}>
                Активно состояний: {activeConditions.length} из 15
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="parchment-btn text-xs px-4 py-1.5 cursor-pointer"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Condition Details View Modal */}
      {viewingCondition && (
        <div
          className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setViewingCondition(null)}
        >
          <div
            className="parchment-modal max-w-md w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#C9A84C]/40">
              <div className="flex items-center gap-2">
                <WarningSignIcon size={20} />
                <h3 className="parchment-heading mb-0">{viewingCondition.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingCondition(null)}
                className="parchment-remove-btn"
                title="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: '#3D2012' }}>
                {viewingCondition.description}
              </p>

              <div className="p-3 rounded space-y-1.5" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <span className="text-xs font-bold block" style={{ color: '#5C341F' }}>
                  Правила и эффекты:
                </span>
                <ul className="space-y-1 text-xs" style={{ color: '#3D2012' }}>
                  {viewingCondition.rulesSummary.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#8B6914] font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isConditionIncapacitating(viewingCondition.id) && (
                <div
                  className="p-2 rounded text-xs flex items-center gap-2"
                  style={{ background: 'rgba(180, 40, 20, 0.1)', border: '1px solid rgba(180, 40, 20, 0.4)', color: '#7A1A10' }}
                >
                  <WarningSignIcon size={16} />
                  <span>Недееспособность: персонаж автоматически теряет концентрацию на заклинаниях.</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#C9A84C]/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleToggleCondition(viewingCondition.id);
                  setViewingCondition(null);
                }}
                className="parchment-remove-btn text-xs px-2.5 py-1 rounded"
              >
                Снять состояние
              </button>
              <button
                type="button"
                onClick={() => setViewingCondition(null)}
                className="parchment-btn text-xs px-4 py-1.5 cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConditionsTracker;
