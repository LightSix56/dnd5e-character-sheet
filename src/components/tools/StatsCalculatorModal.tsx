'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ABILITY_NAMES,
  ABILITY_FULL,
  type AbilityName,
  calcModifier,
  formatModifier,
} from '@/lib/dnd-types';
import { D20Icon, SparklesDndIcon } from '@/components/dnd-icons';

export interface StatsCalculatorModalProps {
  initialScores?: Partial<Record<AbilityName, number>>;
  racialBonuses?: Partial<Record<AbilityName, number>>;
  currentRace?: string;
  onApply: (scores: Record<string, number>, racialBonuses?: Record<string, number>) => void;
  onClose: () => void;
}

type CalculatorTab = 'point_buy' | 'roll_4d6' | 'standard_array';

// Official 5e Point Buy costs
const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

const STANDARD_ARRAY_VALUES = [15, 14, 13, 12, 10, 8] as const;

// ── Visual D6 Die with authentic pips ──
function DieD6({ value, isDropped, isRolling }: { value: number; isDropped?: boolean; isRolling?: boolean }) {
  // SVG Pip positions in 24x24 box
  const pips: Record<number, [number, number][]> = {
    1: [[12, 12]],
    2: [[6, 6], [18, 18]],
    3: [[6, 6], [12, 12], [18, 18]],
    4: [[6, 6], [18, 6], [6, 18], [18, 18]],
    5: [[6, 6], [18, 6], [12, 12], [6, 18], [18, 18]],
    6: [[6, 6], [18, 6], [6, 12], [18, 12], [6, 18], [18, 18]],
  };

  const currentPips = pips[value] || pips[1];

  return (
    <div
      className={`relative inline-flex flex-col items-center transition-all ${
        isRolling ? 'animate-bounce' : ''
      }`}
      title={isDropped ? `Значение ${value} (наименьшее, отброшено)` : `Значение ${value}`}
    >
      <svg
        width={30}
        height={30}
        viewBox="0 0 24 24"
        className={`rounded transition-all ${
          isDropped ? 'opacity-35 grayscale' : 'shadow-sm'
        }`}
      >
        {/* Die body */}
        <rect
          x="1"
          y="1"
          width="22"
          height="22"
          rx="4"
          fill={isDropped ? '#D8C9B0' : '#FFF9EE'}
          stroke={isDropped ? '#998A78' : '#8B4513'}
          strokeWidth="1.8"
        />
        {/* Pips */}
        {currentPips.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="2"
            fill={isDropped ? '#887B6C' : '#5C341F'}
          />
        ))}
      </svg>
      {isDropped && (
        <span className="text-[9px] font-bold text-red-800 absolute -bottom-3 tracking-tighter">
          сброс
        </span>
      )}
    </div>
  );
}

export function StatsCalculatorModal({
  initialScores,
  racialBonuses,
  currentRace,
  onApply,
  onClose,
}: StatsCalculatorModalProps) {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('point_buy');

  // Racial bonuses state (initialized from character's race bonuses)
  const [bonuses, setBonuses] = useState<Record<AbilityName, number>>(() => {
    const res: Record<AbilityName, number> = { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
    if (racialBonuses) {
      ABILITY_NAMES.forEach(ab => {
        res[ab] = racialBonuses[ab] || 0;
      });
    }
    return res;
  });

  // ── Tab 1: Point Buy State ──
  const [pointBuyScores, setPointBuyScores] = useState<Record<AbilityName, number>>(() => {
    const res: Record<AbilityName, number> = { 'СИЛ': 8, 'ЛОВ': 8, 'ТЕЛ': 8, 'ИНТ': 8, 'МДР': 8, 'ХАР': 8 };
    if (initialScores) {
      ABILITY_NAMES.forEach(ab => {
        const val = initialScores[ab];
        if (typeof val === 'number' && val >= 8 && val <= 15) {
          res[ab] = val;
        }
      });
    }
    return res;
  });

  // Calculate total spent in Point Buy
  const pointBuySpent = useMemo(() => {
    return ABILITY_NAMES.reduce((sum, ab) => sum + (POINT_BUY_COST[pointBuyScores[ab]] ?? 0), 0);
  }, [pointBuyScores]);

  const pointBuyRemaining = 27 - pointBuySpent;

  const handlePointBuyChange = (ability: AbilityName, delta: number) => {
    const current = pointBuyScores[ability];
    const target = current + delta;
    if (target < 8 || target > 15) return;

    const currentCost = POINT_BUY_COST[current] ?? 0;
    const targetCost = POINT_BUY_COST[target] ?? 0;
    const diff = targetCost - currentCost;

    if (diff > pointBuyRemaining) return;

    setPointBuyScores(prev => ({ ...prev, [ability]: target }));
  };

  const handlePointBuyReset = () => {
    setPointBuyScores({ 'СИЛ': 8, 'ЛОВ': 8, 'ТЕЛ': 8, 'ИНТ': 8, 'МДР': 8, 'ХАР': 8 });
  };

  const handlePointBuyPreset = (scores: [number, number, number, number, number, number]) => {
    setPointBuyScores({
      'СИЛ': scores[0],
      'ЛОВ': scores[1],
      'ТЕЛ': scores[2],
      'ИНТ': scores[3],
      'МДР': scores[4],
      'ХАР': scores[5],
    });
  };

  // ── Tab 2: Roll 4d6 State ──
  interface StatRoll {
    dice: [number, number, number, number];
    kept: [number, number, number];
    droppedIndex: number;
    score: number;
  }

  const rollSingleStat = useCallback((): StatRoll => {
    const dice: [number, number, number, number] = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];

    // Find the index of the lowest die
    let lowestIdx = 0;
    for (let i = 1; i < 4; i++) {
      if (dice[i] < dice[lowestIdx]) {
        lowestIdx = i;
      }
    }

    const kept: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (i !== lowestIdx) kept.push(dice[i]);
    }

    const score = kept.reduce((a, b) => a + b, 0);

    return {
      dice,
      kept: [kept[0], kept[1], kept[2]],
      droppedIndex: lowestIdx,
      score,
    };
  }, []);

  const [rollData, setRollData] = useState<Record<AbilityName, StatRoll>>(() => {
    const res: Record<AbilityName, StatRoll> = {} as Record<AbilityName, StatRoll>;
    ABILITY_NAMES.forEach(ab => {
      // Initialize with balanced default rolls
      res[ab] = {
        dice: [4, 4, 3, 1],
        kept: [4, 4, 3],
        droppedIndex: 3,
        score: 11,
      };
    });
    return res;
  });

  const [rollingStats, setRollingStats] = useState<Record<AbilityName, boolean>>({
    'СИЛ': false, 'ЛОВ': false, 'ТЕЛ': false, 'ИНТ': false, 'МДР': false, 'ХАР': false,
  });

  const handleRollSingle = (ability: AbilityName) => {
    setRollingStats(prev => ({ ...prev, [ability]: true }));
    setTimeout(() => {
      setRollData(prev => ({ ...prev, [ability]: rollSingleStat() }));
      setRollingStats(prev => ({ ...prev, [ability]: false }));
    }, 320);
  };

  const handleRollAll = () => {
    setRollingStats({
      'СИЛ': true, 'ЛОВ': true, 'ТЕЛ': true, 'ИНТ': true, 'МДР': true, 'ХАР': true,
    });
    setTimeout(() => {
      const nextRolls: Record<AbilityName, StatRoll> = {} as Record<AbilityName, StatRoll>;
      ABILITY_NAMES.forEach(ab => {
        nextRolls[ab] = rollSingleStat();
      });
      setRollData(nextRolls);
      setRollingStats({
        'СИЛ': false, 'ЛОВ': false, 'ТЕЛ': false, 'ИНТ': false, 'МДР': false, 'ХАР': false,
      });
    }, 400);
  };

  // ── Tab 3: Standard Array State ──
  const [standardArray, setStandardArray] = useState<Record<AbilityName, number | null>>({
    'СИЛ': 15,
    'ЛОВ': 14,
    'ТЕЛ': 13,
    'ИНТ': 12,
    'МДР': 10,
    'ХАР': 8,
  });

  const handleStandardArraySelect = (ability: AbilityName, newValue: number | null) => {
    setStandardArray(prev => {
      const next = { ...prev };
      if (newValue === null) {
        next[ability] = null;
        return next;
      }

      // If newValue was already assigned elsewhere, swap!
      const previousOwner = (Object.keys(next) as AbilityName[]).find(
        k => k !== ability && next[k] === newValue
      );
      if (previousOwner) {
        next[previousOwner] = prev[ability];
      }
      next[ability] = newValue;
      return next;
    });
  };

  // Active base scores based on selected tab
  const activeBaseScores = useMemo<Record<AbilityName, number>>(() => {
    if (activeTab === 'point_buy') {
      return pointBuyScores;
    }
    if (activeTab === 'roll_4d6') {
      const res: Record<AbilityName, number> = {} as Record<AbilityName, number>;
      ABILITY_NAMES.forEach(ab => {
        res[ab] = rollData[ab].score;
      });
      return res;
    }
    // standard_array
    const res: Record<AbilityName, number> = {} as Record<AbilityName, number>;
    ABILITY_NAMES.forEach(ab => {
      res[ab] = standardArray[ab] ?? 10;
    });
    return res;
  }, [activeTab, pointBuyScores, rollData, standardArray]);

  // Handle Apply
  const handleApply = () => {
    onApply(activeBaseScores, bonuses);
    onClose();
  };

  // Check if standard array is completely assigned
  const isStandardArrayComplete = useMemo(() => {
    return ABILITY_NAMES.every(ab => standardArray[ab] !== null);
  }, [standardArray]);

  const canApply = activeTab !== 'standard_array' || isStandardArrayComplete;

  return (
    <div
      className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="parchment-modal max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative rounded-lg"
        style={{
          background: '#F5E6C8',
          border: '3px solid #C9A84C',
          boxShadow: '0 12px 48px rgba(30, 15, 8, 0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
          <div className="flex items-center gap-2.5">
            <D20Icon size={24} />
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Калькулятор характеристик D&D 5e
              </h3>
              <span className="text-[11px]" style={{ color: '#8B6914' }}>
                Покупка очков (Point Buy), бросок 4к6 и стандартный набор
                {currentRace ? ` • Раса: ${currentRace}` : ''}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 border-b bg-black/5" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
          <div className="grid grid-cols-3 gap-1 parchment-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('point_buy')}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'point_buy' ? 'parchment-tab-active' : 'parchment-tab-inactive'
              }`}
            >
              <span>Покупка (Point Buy)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roll_4d6')}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'roll_4d6' ? 'parchment-tab-active' : 'parchment-tab-inactive'
              }`}
            >
              <span>Бросок 4к6</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('standard_array')}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'standard_array' ? 'parchment-tab-active' : 'parchment-tab-inactive'
              }`}
            >
              <span>Стандартный набор</span>
            </button>
          </div>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[52vh]">
          {/* ════ TAB 1: POINT BUY ════ */}
          {activeTab === 'point_buy' && (
            <div className="space-y-4">
              {/* Point Pool Banner */}
              <div
                className="p-3 rounded-lg flex items-center justify-between flex-wrap gap-2"
                style={{
                  background:
                    pointBuyRemaining === 0
                      ? 'rgba(46, 125, 50, 0.12)'
                      : pointBuyRemaining > 0
                      ? 'rgba(201, 168, 76, 0.2)'
                      : 'rgba(211, 47, 47, 0.15)',
                  border:
                    pointBuyRemaining === 0
                      ? '1px solid rgba(46, 125, 50, 0.5)'
                      : '1px solid rgba(201, 168, 76, 0.5)',
                }}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: '#8B6914' }}>
                    Пул очков покупки
                  </span>
                  <div className="text-sm font-bold" style={{ color: '#3D2012' }}>
                    Осталось очков:{' '}
                    <span
                      className={`text-base font-extrabold ${
                        pointBuyRemaining === 0
                          ? 'text-green-800'
                          : pointBuyRemaining > 0
                          ? 'text-[#8B4513]'
                          : 'text-red-700'
                      }`}
                    >
                      {pointBuyRemaining}
                    </span>{' '}
                    / 27 (потрачено: {pointBuySpent})
                  </div>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handlePointBuyReset}
                    className="parchment-btn-secondary text-[11px] py-1 px-2.5"
                    title="Сбросить все характеристики на 8"
                  >
                    Сброс (все 8)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePointBuyPreset([15, 14, 13, 12, 10, 8])}
                    className="parchment-btn-secondary text-[11px] py-1 px-2.5"
                    title="Стандартный набор (15, 14, 13, 12, 10, 8)"
                  >
                    15,14,13,12,10,8
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePointBuyPreset([15, 15, 15, 8, 8, 8])}
                    className="parchment-btn-secondary text-[11px] py-1 px-2.5"
                    title="Специалист (15, 15, 15, 8, 8, 8)"
                  >
                    15,15,15,8,8,8
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePointBuyPreset([13, 13, 13, 12, 12, 12])}
                    className="parchment-btn-secondary text-[11px] py-1 px-2.5"
                    title="Универсал (13, 13, 13, 12, 12, 12)"
                  >
                    13,13,13,12,12,12
                  </button>
                </div>
              </div>

              {/* Point buy rows */}
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold px-2" style={{ color: '#8B6914' }}>
                  <div className="col-span-3">Характеристика</div>
                  <div className="col-span-2 text-center">Стоимость</div>
                  <div className="col-span-3 text-center">Базовое значение</div>
                  <div className="col-span-2 text-center">Расовый бонус</div>
                  <div className="col-span-2 text-center">Итого (Мод.)</div>
                </div>

                {ABILITY_NAMES.map(ab => {
                  const score = pointBuyScores[ab];
                  const cost = POINT_BUY_COST[score] ?? 0;
                  const racial = bonuses[ab] || 0;
                  const final = score + racial;
                  const mod = calcModifier(final);

                  // Next upgrade cost
                  const nextCost = score < 15 ? (POINT_BUY_COST[score + 1] ?? 0) - cost : 999;
                  const canIncrease = score < 15 && pointBuyRemaining >= nextCost;
                  const canDecrease = score > 8;

                  return (
                    <div
                      key={ab}
                      className="p-2.5 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      style={{
                        background: 'rgba(251, 240, 220, 0.65)',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                      }}
                    >
                      {/* Name */}
                      <div className="sm:col-span-3 flex items-baseline gap-2">
                        <span className="font-bold text-sm" style={{ color: '#3D2012' }}>
                          {ab}
                        </span>
                        <span className="text-xs" style={{ color: '#8B6914' }}>
                          {ABILITY_FULL[ab]}
                        </span>
                      </div>

                      {/* Cost tag */}
                      <div className="sm:col-span-2 text-center text-xs" style={{ color: '#6B3A2A' }}>
                        <span className="px-2 py-0.5 rounded bg-black/5 font-mono font-semibold">
                          {cost} очк.
                        </span>
                      </div>

                      {/* Counter [-] [ score ] [+] */}
                      <div className="sm:col-span-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={!canDecrease}
                          onClick={() => handlePointBuyChange(ab, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded font-bold text-sm cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(139, 105, 20, 0.2)', color: '#3D2012' }}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-base font-bold font-mono" style={{ color: '#3D2012' }}>
                          {score}
                        </span>
                        <button
                          type="button"
                          disabled={!canIncrease}
                          onClick={() => handlePointBuyChange(ab, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded font-bold text-sm cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(139, 105, 20, 0.2)', color: '#3D2012' }}
                          title={score < 15 ? `Стоимость: +${nextCost} очк.` : 'Максимум 15'}
                        >
                          +
                        </button>
                      </div>

                      {/* Racial bonus */}
                      <div className="sm:col-span-2 text-center text-xs font-semibold" style={{ color: racial > 0 ? '#2E7D32' : '#8B6914' }}>
                        {racial > 0 ? `+${racial}` : '0'}
                      </div>

                      {/* Final + Mod */}
                      <div className="sm:col-span-2 text-center flex items-center justify-center gap-1.5 font-bold">
                        <span className="text-sm font-mono" style={{ color: '#3D2012' }}>
                          {final}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(201, 168, 76, 0.25)', color: '#5C341F' }}
                        >
                          {formatModifier(mod)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ TAB 2: ROLL 4d6 DROP LOWEST ════ */}
          {activeTab === 'roll_4d6' && (
            <div className="space-y-4">
              {/* Roll All Header Banner */}
              <div
                className="p-3 rounded-lg flex items-center justify-between flex-wrap gap-2"
                style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.5)' }}
              >
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6914' }}>
                    Метод «4к6, отбросить наименьший»
                  </h4>
                  <p className="text-xs" style={{ color: '#5C341F' }}>
                    Бросаются 4 шестигранных кубика, наименьший выбывает, сумма 3 лучших — значение характеристики.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRollAll}
                  className="parchment-btn text-xs px-4 py-1.5 flex items-center gap-2 font-bold shadow cursor-pointer"
                >
                  <D20Icon size={16} />
                  <span>Бросить все характеристики</span>
                </button>
              </div>

              {/* 6 stats dice rows */}
              <div className="space-y-2">
                {ABILITY_NAMES.map(ab => {
                  const roll = rollData[ab];
                  const racial = bonuses[ab] || 0;
                  const final = roll.score + racial;
                  const mod = calcModifier(final);
                  const isRolling = rollingStats[ab];

                  return (
                    <div
                      key={ab}
                      className="p-3 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      style={{
                        background: 'rgba(251, 240, 220, 0.65)',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                      }}
                    >
                      {/* Name */}
                      <div className="sm:col-span-3 flex items-baseline gap-2">
                        <span className="font-bold text-sm" style={{ color: '#3D2012' }}>
                          {ab}
                        </span>
                        <span className="text-xs" style={{ color: '#8B6914' }}>
                          {ABILITY_FULL[ab]}
                        </span>
                      </div>

                      {/* 4 Dice visualization */}
                      <div className="sm:col-span-4 flex items-center gap-2">
                        {roll.dice.map((val, dIdx) => (
                          <DieD6
                            key={dIdx}
                            value={val}
                            isDropped={dIdx === roll.droppedIndex}
                            isRolling={isRolling}
                          />
                        ))}
                      </div>

                      {/* Score calculation tag */}
                      <div className="sm:col-span-2 text-center">
                        <div className="text-xs font-medium" style={{ color: '#8B6914' }}>
                          База: <strong className="text-sm font-mono text-[#3D2012]">{roll.score}</strong>
                        </div>
                      </div>

                      {/* Re-roll single button */}
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRollSingle(ab)}
                          disabled={isRolling}
                          className="parchment-btn-secondary text-[11px] py-1 px-2 cursor-pointer"
                          title="Перебросить эту характеристику"
                        >
                          🎲
                        </button>
                      </div>

                      {/* Final + Mod */}
                      <div className="sm:col-span-2 text-right sm:text-center flex items-center justify-end sm:justify-center gap-1.5 font-bold">
                        <span className="text-sm font-mono" style={{ color: '#3D2012' }}>
                          {final}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(201, 168, 76, 0.25)', color: '#5C341F' }}
                        >
                          {formatModifier(mod)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ TAB 3: STANDARD ARRAY ════ */}
          {activeTab === 'standard_array' && (
            <div className="space-y-4">
              {/* Presets banner */}
              <div
                className="p-3 rounded-lg flex items-center justify-between flex-wrap gap-2"
                style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.5)' }}
              >
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6914' }}>
                    Набор: 15, 14, 13, 12, 10, 8
                  </h4>
                  <p className="text-xs" style={{ color: '#5C341F' }}>
                    Каждое значение должно быть распределено ровно один раз без повторов. При выборе занятого значения происходит обмен.
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setStandardArray({ 'СИЛ': 15, 'ТЕЛ': 14, 'ЛОВ': 13, 'МДР': 12, 'ХАР': 10, 'ИНТ': 8 })
                    }
                    className="parchment-btn-secondary text-[10px] py-0.5 px-2"
                  >
                    Воин / Сила
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStandardArray({ 'ЛОВ': 15, 'ТЕЛ': 14, 'ХАР': 13, 'ИНТ': 12, 'МДР': 10, 'СИЛ': 8 })
                    }
                    className="parchment-btn-secondary text-[10px] py-0.5 px-2"
                  >
                    Плут / Ловкость
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStandardArray({ 'ИНТ': 15, 'ТЕЛ': 14, 'ЛОВ': 13, 'МДР': 12, 'ХАР': 10, 'СИЛ': 8 })
                    }
                    className="parchment-btn-secondary text-[10px] py-0.5 px-2"
                  >
                    Волшебник
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStandardArray({ 'МДР': 15, 'ТЕЛ': 14, 'СИЛ': 13, 'ЛОВ': 12, 'ХАР': 10, 'ИНТ': 8 })
                    }
                    className="parchment-btn-secondary text-[10px] py-0.5 px-2"
                  >
                    Жрец / Друид
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStandardArray({ 'ХАР': 15, 'ТЕЛ': 14, 'ЛОВ': 13, 'СИЛ': 12, 'МДР': 10, 'ИНТ': 8 })
                    }
                    className="parchment-btn-secondary text-[10px] py-0.5 px-2"
                  >
                    Бард / Паладин
                  </button>
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {ABILITY_NAMES.map(ab => {
                  const assignedVal = standardArray[ab];
                  const racial = bonuses[ab] || 0;
                  const final = (assignedVal ?? 10) + racial;
                  const mod = calcModifier(final);

                  return (
                    <div
                      key={ab}
                      className="p-2.5 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      style={{
                        background: 'rgba(251, 240, 220, 0.65)',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                      }}
                    >
                      {/* Name */}
                      <div className="sm:col-span-4 flex items-baseline gap-2">
                        <span className="font-bold text-sm" style={{ color: '#3D2012' }}>
                          {ab}
                        </span>
                        <span className="text-xs" style={{ color: '#8B6914' }}>
                          {ABILITY_FULL[ab]}
                        </span>
                      </div>

                      {/* Select Dropdown */}
                      <div className="sm:col-span-4">
                        <select
                          value={assignedVal ?? ''}
                          onChange={e => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            handleStandardArraySelect(ab, val);
                          }}
                          className="parchment-select w-full text-xs font-bold py-1.5 px-2.5"
                        >
                          <option value="">-- Не выбрано --</option>
                          {STANDARD_ARRAY_VALUES.map(val => {
                            const owner = (Object.keys(standardArray) as AbilityName[]).find(
                              k => standardArray[k] === val
                            );
                            return (
                              <option key={val} value={val}>
                                {val} {owner && owner !== ab ? `(занято: ${owner})` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Racial bonus */}
                      <div className="sm:col-span-2 text-center text-xs font-semibold" style={{ color: racial > 0 ? '#2E7D32' : '#8B6914' }}>
                        Раса: {racial > 0 ? `+${racial}` : '0'}
                      </div>

                      {/* Final + Mod */}
                      <div className="sm:col-span-2 text-center flex items-center justify-center gap-1.5 font-bold">
                        <span className="text-sm font-mono" style={{ color: '#3D2012' }}>
                          {assignedVal !== null ? final : '—'}
                        </span>
                        {assignedVal !== null && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(201, 168, 76, 0.25)', color: '#5C341F' }}
                          >
                            {formatModifier(mod)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ Racial Bonuses Customizer Accordion ════ */}
          <div
            className="p-3 rounded-lg space-y-2.5"
            style={{ background: 'rgba(232, 211, 162, 0.3)', border: '1px solid rgba(201, 168, 76, 0.3)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <SparklesDndIcon size={16} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5C341F' }}>
                  Расовые бонусы к характеристикам
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (racialBonuses) {
                      const res: Record<AbilityName, number> = { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
                      ABILITY_NAMES.forEach(ab => {
                        res[ab] = racialBonuses[ab] || 0;
                      });
                      setBonuses(res);
                    }
                  }}
                  className="text-[10px] underline font-medium cursor-pointer hover:opacity-80"
                  style={{ color: '#8B6914' }}
                >
                  Сбросить к расе
                </button>
              </div>
            </div>

            {/* Inputs for each bonus */}
            <div className="grid grid-cols-6 gap-2">
              {ABILITY_NAMES.map(ab => (
                <div key={ab} className="text-center space-y-1">
                  <span className="text-[10px] font-bold block" style={{ color: '#6B3A2A' }}>
                    {ab}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={bonuses[ab] || 0}
                    onChange={e => {
                      const val = Math.max(0, Math.min(4, parseInt(e.target.value) || 0));
                      setBonuses(prev => ({ ...prev, [ab]: val }));
                    }}
                    className="parchment-input-boxed w-full text-center text-xs font-bold py-1 px-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Summary */}
        <div
          className="p-3.5 flex items-center justify-between border-t flex-wrap gap-2"
          style={{ borderColor: 'rgba(201, 168, 76, 0.4)', background: 'rgba(232, 211, 162, 0.25)' }}
        >
          {/* Summary Preview */}
          <div className="flex items-center gap-3 text-xs" style={{ color: '#6B3A2A' }}>
            <span>
              Сумма характеристик:{' '}
              <strong className="text-sm font-mono text-[#3D2012]">
                {ABILITY_NAMES.reduce((sum, ab) => sum + activeBaseScores[ab], 0)}
              </strong>
            </span>
            {activeTab === 'point_buy' && (
              <span className={pointBuyRemaining === 0 ? 'text-green-800 font-bold' : 'text-amber-800'}>
                {pointBuyRemaining === 0 ? '✓ Все 27 очков распределены' : `Осталось: ${pointBuyRemaining} очк.`}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="parchment-btn-secondary text-xs px-4 py-1.5">
              Отмена
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="parchment-btn text-xs px-6 py-1.5 font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow cursor-pointer"
            >
              Применить к персонажу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
