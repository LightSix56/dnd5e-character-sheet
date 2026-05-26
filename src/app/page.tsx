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
  CLASS_TEMPLATES, ClassTemplate, applyClassTemplate,
} from '@/lib/dnd-types';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  // Auto-close after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(handleClose, 3500);
    return () => clearTimeout(timer);
  }, []);

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
  const avgHP = (char.hitDice ? getHitDieAverage(char.hitDice) : 5) + getModifier(char, 'ТЕЛ');
  const conMod = getModifier(char, 'ТЕЛ');
  const isASI = isStandardASILevel(newLevel);
  const milestones = getMilestonesAtLevel(newLevel);
  const profChanged = calcProficiencyBonus(newLevel) !== calcProficiencyBonus(char.level);

  const [hpMode, setHpMode] = useState<'average' | 'roll'>('average');
  const [hpRoll, setHpRoll] = useState(dieSize);
  const [asiAbility1, setAsiAbility1] = useState<AbilityName>('СИЛ');
  const [asiAbility2, setAsiAbility2] = useState<AbilityName>('ЛОВ');
  const [asiUsed, setAsiUsed] = useState(isASI);
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

  const finalHP = hpMode === 'average' ? avgHP : (hpRoll + conMod);

  const addCantripRow = () => setNewCantrips(prev => [...prev, '']);
  const removeCantripRow = (i: number) => setNewCantrips(prev => prev.filter((_, j) => j !== i));
  const updateCantripRow = (i: number, v: string) => setNewCantrips(prev => { const a = [...prev]; a[i] = v; return a; });

  const addSpellRow = () => setNewSpells(prev => [...prev, { level: 1, name: '', prepared: false }]);
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

  const buildEntry = (): LevelUpEntry => ({
    level: newLevel,
    hpGained: finalHP,
    asiAbilities: asiUsed ? [asiAbility1, asiAbility2] : null,
    notes,
    newCantrips: newCantrips.filter(c => c.trim()),
    newSpells: newSpells.filter(s => s.name.trim()),
    newSavingThrowProfs: newSaveProfs,
    newSkillProfs: newSkillProfs,
    newSkillExpertise: newSkillExpertise,
    newAttacks: newAttacks.filter(a => a.name.trim()),
    newProficienciesText: newProfText.trim(),
    newEquipmentText: newEquipText.trim(),
  });

  const hasAdditions = newCantrips.some(c => c.trim()) || newSpells.some(s => s.name.trim()) ||
    newSaveProfs.length > 0 || newSkillProfs.length > 0 || newSkillExpertise.length > 0 ||
    newAttacks.some(a => a.name.trim()) || newProfText.trim() || newEquipText.trim();

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="parchment-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">⬆️ Повышение до {newLevel} уровня</h2>
          <p className="text-sm mb-4" style={{ color: '#8B6914' }}>{char.name || 'Персонаж'} — {char.className || 'Без класса'}</p>

          {/* Auto: Proficiency */}
          {profChanged && (
            <div className="parchment-modal-section-accent">
              <p className="text-sm font-medium" style={{ color: '#6B3A2A' }}>
                🎯 Бонус мастерства: {formatModifier(calcProficiencyBonus(char.level))} → {formatModifier(calcProficiencyBonus(newLevel))}
              </p>
              <p className="text-xs mt-1" style={{ color: '#8B6914' }}>Автоматически обновит все спасброски и навыки с владением</p>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="parchment-modal-section">
              <p className="text-sm font-medium mb-1" style={{ color: '#6B3A2A' }}>📌 Обычно на этом уровне:</p>
              {milestones.map((m, i) => <p key={i} className="text-xs" style={{ color: '#8B6914' }}>{m}</p>)}
            </div>
          )}

          {/* HP */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>❤️ Прирост хитов:</h3>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setHpMode('average')}
                className={hpMode === 'average' ? 'parchment-btn text-xs' : 'parchment-btn-secondary text-xs'}>
                Среднее ({avgHP})
              </button>
              <button onClick={() => setHpMode('roll')}
                className={hpMode === 'roll' ? 'parchment-btn text-xs' : 'parchment-btn-secondary text-xs'}>
                Бросок кубика
              </button>
            </div>
            {hpMode === 'roll' && (
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs" style={{ color: '#8B6914' }}>Бросок {diceNotation}{dieSize}:</label>
                <input type="number" min={1} max={dieSize} value={hpRoll}
                  onChange={e => setHpRoll(Number(e.target.value) || 1)}
                  className="parchment-input-center w-16" />
                <span className="text-xs" style={{ color: '#8B6914' }}>+ {formatModifier(conMod)} ТЕЛ = <strong>{hpRoll + conMod}</strong></span>
              </div>
            )}
            <p className="text-sm" style={{ color: '#3C2415' }}>Итого: <strong style={{ color: '#6B3A2A' }}>+{finalHP}</strong> хитов</p>
          </div>

          {/* ASI */}
          <div className="parchment-modal-section">
            <div className="flex items-center gap-2 mb-2">
              <label className="parchment-checkbox"><input type="checkbox" checked={asiUsed} onChange={e => setAsiUsed(e.target.checked)} /><span className="checkmark"></span></label>
              <h3 className="text-sm font-bold" style={{ color: '#3C2415' }}>📈 Улучшение характеристики (АСИ)</h3>
            </div>
            {asiUsed && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="parchment-label">Характеристика +1:</label>
                  <select value={asiAbility1} onChange={e => setAsiAbility1(e.target.value as AbilityName)} className="parchment-select">
                    {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_FULL[a]} ({getTotalScore(char, a)} → {getTotalScore(char, a) + 1})</option>)}
                  </select>
                </div>
                <div>
                  <label className="parchment-label">Характеристика +1:</label>
                  <select value={asiAbility2} onChange={e => setAsiAbility2(e.target.value as AbilityName)} className="parchment-select">
                    {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_FULL[a]} ({getTotalScore(char, a)} → {getTotalScore(char, a) + 1})</option>)}
                  </select>
                </div>
                <p className="col-span-2 text-xs" style={{ color: '#8B6914' }}>Можно выбрать одну характеристику дважды (+2) или две разные (+1, +1). Или взять черту — тогда впиши её в заметки.</p>
              </div>
            )}
          </div>

          {/* ── NEW CANTRIPS ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>✨ Новые заговоры (→ вкладка Заклинания):</h3>
            {newCantrips.map((c, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input value={c} onChange={e => updateCantripRow(i, e.target.value)} placeholder="Название заговора" className={inputClass} />
                <button onClick={() => removeCantripRow(i)} className="parchment-remove-btn">✕</button>
              </div>
            ))}
            <button onClick={addCantripRow} className="parchment-btn-sm" style={{ color: '#4a7c3f' }}>+ Заговор</button>
          </div>

          {/* ── NEW SPELLS ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>📖 Новые заклинания (→ вкладка Заклинания):</h3>
            {newSpells.map((s, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <select value={s.level} onChange={e => updateSpellRow(i, 'level', Number(e.target.value))} className="parchment-select h-7 shrink-0" style={{ width: '64px' }}>
                  {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l} ур.</option>)}
                </select>
                <input value={s.name} onChange={e => updateSpellRow(i, 'name', e.target.value)} placeholder="Название заклинания" className="flex-1 min-w-0 parchment-input" />
                <label className="parchment-checkbox parchment-checkbox-sm" style={{ color: '#8B6914' }}><input type="checkbox" checked={s.prepared} onChange={e => updateSpellRow(i, 'prepared', e.target.checked)} /><span className="checkmark"></span></label><span className="text-xs" style={{ color: '#8B6914' }}>Подг.</span>
                <button onClick={() => removeSpellRow(i)} className="parchment-remove-btn">✕</button>
              </div>
            ))}
            <button onClick={addSpellRow} className="parchment-btn-sm" style={{ color: '#6B3A2A' }}>+ Заклинание</button>
          </div>

          {/* ── NEW SAVING THROW PROFS ── */}
          <div className="parchment-modal-section-accent">
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>🛡️ Новые владения спасбросками:</h3>
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
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>🎯 Новые владения навыками:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1">
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
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>⚔️ Новые атаки:</h3>
            {newAttacks.map((atk, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center mb-1">
                <input value={atk.name} onChange={e => updateAttackRow(i, 'name', e.target.value)} placeholder="Название" className={inputClass} />
                <input value={atk.attackBonus} onChange={e => updateAttackRow(i, 'attackBonus', e.target.value)} placeholder="+5" className={inputClassCenter + " w-16"} />
                <input value={atk.damageAndType} onChange={e => updateAttackRow(i, 'damageAndType', e.target.value)} placeholder="1d8+3 рубящий" className={inputClass} />
                <button onClick={() => removeAttackRow(i)} className="parchment-remove-btn">✕</button>
              </div>
            ))}
            <button onClick={addAttackRow} className="parchment-btn-sm" style={{ color: '#8B2500' }}>+ Атака</button>
          </div>

          {/* ── NEW PROFICIENCIES TEXT ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>📋 Новые владения / языки (→ добавится к существующим):</h3>
            <textarea value={newProfText} onChange={e => setNewProfText(e.target.value)} rows={2} className={textareaClass} placeholder="Владение тяжёлыми доспехами&#10;Язык: Драконий" />
          </div>

          {/* ── NEW EQUIPMENT TEXT ── */}
          <div className="parchment-modal-section-accent">
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>🎒 Новое снаряжение (→ добавится к существующему):</h3>
            <textarea value={newEquipText} onChange={e => setNewEquipText(e.target.value)} rows={2} className={textareaClass} placeholder="Кольчуга, Длинный меч" />
          </div>

          {/* ── FREEFORM NOTES → FEATURES ── */}
          <div className="parchment-modal-section">
            <h3 className="text-sm font-bold mb-2" style={{ color: '#3C2415' }}>📝 Умения и особенности (→ добавится к существующим):</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={textareaClass}
              placeholder={"Новые умения, подкласс, черты...\nНапример:\n- Выбор подкласса: Школа Воплощения\n- Черта: Мастер тяжёлого оружия"} />
          </div>

          {/* Summary */}
          <div className="parchment-modal-section-accent text-xs space-y-0.5" style={{ color: '#3C2415' }}>
            <p className="font-bold mb-1" style={{ color: '#5C3A6E' }}>Итого:</p>
            <p>• Уровень: {char.level} → <strong>{newLevel}</strong></p>
            <p>• Хиты: +{finalHP} (итого: {(char.hpMax || 0) + finalHP})</p>
            {profChanged && <p>• Бонус мастерства: {formatModifier(calcProficiencyBonus(char.level))} → {formatModifier(calcProficiencyBonus(newLevel))}</p>}
            {asiUsed && <p>• АСИ: {ABILITY_FULL[asiAbility1]} +1, {ABILITY_FULL[asiAbility2]} +1</p>}
            {newCantrips.filter(c => c.trim()).length > 0 && <p>• Заговоры: {newCantrips.filter(c => c.trim()).join(', ')}</p>}
            {newSpells.filter(s => s.name.trim()).length > 0 && <p>• Заклинания: {newSpells.filter(s => s.name.trim()).map(s => `${s.name} (${s.level} ур.)`).join(', ')}</p>}
            {newSaveProfs.length > 0 && <p>• Влад. спасбросками: {newSaveProfs.map(a => ABILITY_FULL[a]).join(', ')}</p>}
            {newSkillProfs.length > 0 && <p>• Влад. навыками: {newSkillProfs.join(', ')}</p>}
            {newSkillExpertise.length > 0 && <p>• Экспертиза: {newSkillExpertise.join(', ')}</p>}
            {newAttacks.filter(a => a.name.trim()).length > 0 && <p>• Атаки: {newAttacks.filter(a => a.name.trim()).map(a => a.name).join(', ')}</p>}
            {newProfText.trim() && <p>• Владения/языки: {newProfText.trim().split('\n').join('; ')}</p>}
            {newEquipText.trim() && <p>• Снаряжение: {newEquipText.trim().split('\n').join('; ')}</p>}
            {notes && <p>• Особенности: {notes.split('\n').join('; ')}</p>}
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 parchment-btn-secondary">Отмена</button>
            <button onClick={() => onConfirm(buildEntry())} className="flex-1 parchment-btn font-medium">
              ⬆️ Повысить
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
  const last = char.levelHistory[char.levelHistory.length - 1];
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="parchment-modal max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#8B2500' }}>⬇️ Откат до {char.level - 1} уровня</h2>
          {last ? (
            <div className="mb-4 p-3 rounded text-sm space-y-1" style={{ background: 'rgba(139, 37, 0, 0.06)', border: '1px solid rgba(139, 37, 0, 0.2)' }}>
              <p className="font-medium" style={{ color: '#8B2500' }}>Будет отменено:</p>
              <p style={{ color: '#A0522D' }}>• −{last.hpGained} хитов</p>
              {last.asiAbilities && <p style={{ color: '#A0522D' }}>• {last.asiAbilities.map(a => `${ABILITY_FULL[a]} +1`).join(', ')}</p>}
              {last.newCantrips?.length > 0 && <p style={{ color: '#A0522D' }}>• Заговоры: {last.newCantrips.join(', ')}</p>}
              {last.newSpells?.length > 0 && <p style={{ color: '#A0522D' }}>• Заклинания: {last.newSpells.map(s => `${s.name} (${s.level} ур.)`).join(', ')}</p>}
              {last.newSavingThrowProfs?.length > 0 && <p style={{ color: '#A0522D' }}>• Влад. спасбросками: {last.newSavingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}</p>}
              {last.newSkillProfs?.length > 0 && <p style={{ color: '#A0522D' }}>• Влад. навыками: {last.newSkillProfs.join(', ')}</p>}
              {last.newSkillExpertise?.length > 0 && <p style={{ color: '#A0522D' }}>• Экспертиза: {last.newSkillExpertise.join(', ')}</p>}
              {last.newAttacks?.length > 0 && <p style={{ color: '#A0522D' }}>• Атаки: {last.newAttacks.map(a => a.name).join(', ')}</p>}
              {last.notes && <p className="text-xs mt-1" style={{ color: '#8B6914' }}>{last.notes}</p>}
            </div>
          ) : (
            <p className="text-sm mb-4" style={{ color: '#8B6914' }}>Нет записи. Будет просто −1 уровень.</p>
          )}
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 parchment-btn-secondary">Отмена</button>
            <button onClick={onConfirm} className="flex-1 font-medium" style={{ background: 'linear-gradient(180deg, #A0522D, #8B2500)', color: '#FBF0DC', border: '1px solid #C9A84C', borderRadius: '3px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Georgia, "Times New Roman", serif', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>⬇️ Откатить</button>
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
}

const LevelHistoryModal = React.memo(function LevelHistoryModal({ char, onClose }: LevelHistoryModalProps) {
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="parchment-modal max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">📜 История уровней</h2>
          {char.levelHistory.length === 0 ? (
            <p className="text-sm" style={{ color: '#8B6914' }}>Нет записей</p>
          ) : (
            <div className="space-y-2">
              {char.levelHistory.map((entry, i) => (
                <div key={i} className="parchment-modal-section">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold" style={{ color: '#6B3A2A' }}>{entry.level} ур.</span>
                    <span className="text-xs" style={{ color: '#8B6914' }}>+{entry.hpGained} хитов</span>
                  </div>
                  {entry.asiAbilities && (
                    <p className="text-xs" style={{ color: '#4a7c3f' }}>📈 {entry.asiAbilities.map(a => `${ABILITY_FULL[a]} +1`).join(', ')}</p>
                  )}
                  {entry.newCantrips?.length > 0 && (
                    <p className="text-xs" style={{ color: '#5C3A6E' }}>✨ Заговоры: {entry.newCantrips.join(', ')}</p>
                  )}
                  {entry.newSpells?.length > 0 && (
                    <p className="text-xs" style={{ color: '#6B3A2A' }}>📖 Заклинания: {entry.newSpells.map(s => `${s.name} (${s.level} ур.)`).join(', ')}</p>
                  )}
                  {entry.newSavingThrowProfs?.length > 0 && (
                    <p className="text-xs" style={{ color: '#8B6914' }}>🛡️ Влад. спасбросками: {entry.newSavingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}</p>
                  )}
                  {entry.newSkillProfs?.length > 0 && (
                    <p className="text-xs" style={{ color: '#5C3A6E' }}>🎯 Влад. навыками: {entry.newSkillProfs.join(', ')}</p>
                  )}
                  {entry.newSkillExpertise?.length > 0 && (
                    <p className="text-xs" style={{ color: '#5C3A6E' }}>🏆 Экспертиза: {entry.newSkillExpertise.join(', ')}</p>
                  )}
                  {entry.newAttacks?.length > 0 && (
                    <p className="text-xs" style={{ color: '#8B2500' }}>⚔️ Атаки: {entry.newAttacks.map(a => a.name).join(', ')}</p>
                  )}
                  {entry.notes && <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: '#8B6914' }}>{entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} className="mt-4 w-full parchment-btn-secondary">Закрыть</button>
        </div>
      </div>
    </div>
  );
});

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
          <h2 className="text-xl font-bold mb-1">📋 Шаблоны классов</h2>
          <p className="text-sm mb-4" style={{ color: '#8B6914' }}>Выберите класс — лист заполнится типичными данными 1-го уровня. Всё можно изменить после.</p>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {([['all', 'Все'], ['martial', '⚔️ Воины'], ['caster', '🔮 Маги'], ['hybrid', '⚡ Гибриды']] as const).map(([f, label]) => (
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
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {isSignUp ? '📝 Регистрация' : '🔑 Вход'}
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

// ── Cloud Saves Modal ──

const CloudSavesModal = React.memo(function CloudSavesModal({ characters, onLoad, onDelete, onClose }: {
  characters: any[];
  onLoad: (char: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="parchment-modal max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">☁️ Облачные сохранения</h2>
          {characters.length === 0 ? (
            <p className="text-sm mb-4" style={{ color: '#8B6914' }}>Нет сохранённых персонажей</p>
          ) : (
            <div className="space-y-2">
              {characters.map((c: any) => (
                <div key={c.id} className="parchment-modal-section flex items-center gap-3">
                  {c.portrait_url && (
                    <img src={c.portrait_url} alt="" className="w-10 h-10 rounded object-cover" style={{ border: '1px solid rgba(139, 105, 20, 0.3)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#3C2415' }}>{c.name}{c.data?.level ? ` — ${c.data.level} ур.` : ''}{c.data?.className ? ` ${c.data.className}` : ''}</p>
                    <p className="text-[10px]" style={{ color: '#8B6914' }}>{new Date(c.updated_at).toLocaleString('ru')}</p>
                  </div>
                  <button onClick={() => onLoad(c)} className="parchment-btn-sm" style={{ color: '#4a7c3f' }}>Загрузить</button>
                  <button onClick={() => onDelete(c.id)} className="parchment-remove-btn" title="Удалить">✕</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} className="mt-4 w-full parchment-btn-secondary">Закрыть</button>
        </div>
      </div>
    </div>
  );
});

// ── Main Component ──

export default function DnDCharacterSheet() {
  // ── Load initial data from localStorage (before other state) ──
  const [initialChar] = useState<CharacterData>(() => {
    if (typeof window === 'undefined') return createDefaultCharacter();
    try {
      const saved = localStorage.getItem('dnd5e_character');
      if (saved) {
        const raw = JSON.parse(saved);
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
          attacks: raw.attacks || defaults.attacks,
          spellSlots: { ...defaults.spellSlots, ...(raw.spellSlots || {}) },
          spellsByLevel: { ...defaults.spellsByLevel, ...(raw.spellsByLevel || {}) },
          cantrips: raw.cantrips || defaults.cantrips,
          levelHistory: raw.levelHistory || [],
        };
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
  const [toast, setToast] = useState<{ title: string; description: string } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLevelDown, setShowLevelDown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
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

  // ── Auto-save to cloud (debounced 3s) when logged in ──
  const cloudSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCloudSaveRef = React.useRef<string>('');
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const cloudCharIdRef = React.useRef<string | null>(null);
  const cloudSaveInProgressRef = React.useRef(false);
  const pendingCloudSaveRef = React.useRef(false);

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
    if (!user) { setCloudSaveStatus('idle'); cloudCharIdRef.current = null; return; }
    // Debounce cloud save by 3 seconds
    setCloudSaveStatus('saving');
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(async () => {
      const snapshot = JSON.stringify({ ...char, _portraitUrl: portraitUrl });
      // Skip if data hasn't actually changed since last save
      if (snapshot === lastCloudSaveRef.current) { setCloudSaveStatus('saved'); return; }
      lastCloudSaveRef.current = snapshot;
      const ok = await saveToCloud();
      setCloudSaveStatus(ok ? 'saved' : 'idle');
    }, 3000);
    return () => { if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current); };
  }, [user, char, portraitUrl, saveToCloud]);

  useEffect(() => {
    // DO NOT use getUser() here — it makes a network request that can resolve
    // with null after OAuth redirect and overwrite the correct user set by
    // onAuthStateChange.  Rely solely on onAuthStateChange which fires
    // INITIAL_SESSION synchronously from cookies.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      // On login / page load with existing session: load latest cloud save (cloud > localStorage)
      // After OAuth redirect the event is INITIAL_SESSION, not SIGNED_IN — handle both.
      if (newUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        try {
          const res = await fetch('/api/characters');
          const data = await res.json();
          if (data.characters && data.characters.length > 0) {
            const latest = data.characters[0];
            if (latest.data) {
              const defaults = createDefaultCharacter();
              setChar({ ...defaults, ...latest.data });
              if (latest.portrait_url) setPortraitUrl(latest.portrait_url);
              else setPortraitUrl(null);
              // Remember the cloud character ID for auto-save updates
              cloudCharIdRef.current = latest.id;
            }
          }
        } catch { /* keep localStorage version */ }
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

  const handleRoll = useCallback((result: RollResult) => {
    setRollResult(result);
  }, []);

  const showToast = useCallback((title: string, description: string) => {
    setToast({ title, description });
    setTimeout(() => setToast(null), 3000);
  }, []);

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
      // Add notes to features
      let newFeatures = prev.featuresTraits;
      if (entry.notes) {
        newFeatures = newFeatures ? newFeatures + '\n' + entry.notes : entry.notes;
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
        asiBonuses: newAsi,
        featuresTraits: newFeatures,
        cantrips: updatedCantrips,
        spellsByLevel: updatedSpells,
        savingThrowProficiencies: updatedSaveProfs,
        skillProficiencies: updatedSkillProfs,
        skillExpertise: updatedSkillExpertise,
        attacks: updatedAttacks,
        otherProficienciesLanguages: updatedProfText,
        equipment: updatedEquipText,
        levelHistory: [...prev.levelHistory, entry],
      };
    });
    setShowLevelUp(false);
    showToast(`${entry.level} уровень!`, 'Персонаж повышен');
  }, [showToast]);

  // ── Level Down ──
  const handleLevelDown = useCallback(() => {
    setChar(prev => {
      const newLevel = prev.level - 1;
      const last = prev.levelHistory[prev.levelHistory.length - 1];
      let newHP = prev.hpMax || 0;
      if (last) newHP = Math.max(1, newHP - last.hpGained);
      const newAsi = { ...prev.asiBonuses };
      if (last?.asiAbilities) {
        newAsi[last.asiAbilities[0]] = Math.max(0, (newAsi[last.asiAbilities[0]] || 0) - 1);
        newAsi[last.asiAbilities[1]] = Math.max(0, (newAsi[last.asiAbilities[1]] || 0) - 1);
      }
      let newHitDice = prev.hitDice;
      if (newHitDice) {
        const dieSize = getHitDieSize(newHitDice);
        const notation = getHitDiceNotation(newHitDice);
        newHitDice = `${newLevel}${notation}${dieSize}`;
      }
      // Remove notes from features
      let newFeatures = prev.featuresTraits;
      if (last?.notes) {
        newFeatures = newFeatures.replace(last.notes, '').replace(/\n{2,}/g, '\n').trim();
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
        asiBonuses: newAsi,
        featuresTraits: newFeatures,
        cantrips: updatedCantrips,
        spellsByLevel: updatedSpells,
        savingThrowProficiencies: updatedSaveProfs,
        skillProficiencies: updatedSkillProfs,
        skillExpertise: updatedSkillExpertise,
        attacks: updatedAttacks,
        otherProficienciesLanguages: updatedProfText,
        equipment: updatedEquipText,
        levelHistory: prev.levelHistory.slice(0, -1),
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
    lastCloudSaveRef.current = '';
    showToast('Сброшено', 'Данные очищены');
  }, [showToast]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = CLASS_TEMPLATES.find(t => t.id === templateId);
    setChar(applyClassTemplate(templateId));
    setShowTemplates(false);
    showToast(`${template?.emoji || ''} ${template?.name || ''}`, 'Шаблон применён — 1 уровень');
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
    lastCloudSaveRef.current = '';
  }, [supabase]);

  const handlePortraitUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
  }, [showToast]);

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
    if (!user) return;
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      if (data.characters) {
        setCloudCharacters(data.characters);
        setShowCloudSaves(true);
      }
    } catch {
      showToast('Ошибка', 'Не удалось загрузить список');
    }
  }, [user, showToast]);

  const loadCloudCharacter = useCallback(async (cloudChar: any) => {
    if (cloudChar.data) {
      setChar(prev => ({ ...createDefaultCharacter(), ...cloudChar.data }));
      if (cloudChar.portrait_url) setPortraitUrl(cloudChar.portrait_url);
      else setPortraitUrl(null);
      // Remember cloud character ID for auto-save
      cloudCharIdRef.current = cloudChar.id;
      // Reset dedup tracker so changes trigger a save
      lastCloudSaveRef.current = '';
      setShowCloudSaves(false);
      showToast('Загружено', `"${cloudChar.name}" загружен из облака`);
    }
  }, [showToast]);

  const deleteCloudCharacter = useCallback(async (id: string) => {
    try {
      await fetch('/api/characters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setCloudCharacters(prev => prev.filter((c: any) => c.id !== id));
      showToast('Удалено', 'Персонаж удалён из облака');
    } catch {
      showToast('Ошибка', 'Не удалось удалить');
    }
  }, [showToast]);

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
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string);
          // Merge with defaults to ensure all fields exist (handles older/Partial JSON)
          const defaults = createDefaultCharacter();
          const merged: CharacterData = {
            ...defaults,
            ...raw,
            // Nested objects need deep merge to preserve all keys
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
          setChar(merged);
          showToast('Загружено', merged.name || 'Персонаж загружен из JSON');
        } catch (err: any) {
          showToast('Ошибка', 'Не удалось прочитать JSON файл');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showToast]);

  return (
    <div className="parchment-bg">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] parchment-toast px-4 py-3 max-w-xs">
          <p className="font-semibold text-sm" style={{ color: '#3C2415' }}>{toast.title}</p>
          <p className="text-xs" style={{ color: '#8B6914' }}>{toast.description}</p>
        </div>
      )}

      {showLevelUp && <LevelUpModal char={char} onConfirm={handleLevelUp} onCancel={closeLevelUp} />}
      {showLevelDown && <LevelDownModal char={char} onConfirm={handleLevelDown} onCancel={closeLevelDown} />}
      {showHistory && <LevelHistoryModal char={char} onClose={closeHistory} />}
      {showTemplates && <TemplateModal onSelect={handleApplyTemplate} onCancel={closeTemplates} />}
      {rollResult && <RollResultPopup result={rollResult} onClose={closeRollResult} />}
      {showAuth && <AuthModal onClose={closeAuth} onAuth={handleAuth} onGoogleAuth={handleGoogleAuth} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} isSignUp={isSignUp} setIsSignUp={setIsSignUp} loading={authLoading} error={authError} />}
      {showCloudSaves && <CloudSavesModal characters={cloudCharacters} onLoad={loadCloudCharacter} onDelete={deleteCloudCharacter} onClose={closeCloudSaves} />}

      <header className="sticky top-0 z-50 parchment-header">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <div>
              <h1 className="text-lg font-bold">Генератор листа персонажа D&D 5e</h1>
              <p className="text-xs">Авторасчёт · Повышение уровня · Экспорт DOCX</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowTemplates(true)} className="parchment-header-btn">📋 Шаблоны</button>
            <button onClick={() => handleLoadExample('warrior')} className="parchment-header-btn">⚔️ Воин</button>
            <button onClick={() => handleLoadExample('wizard')} className="parchment-header-btn">📖 Маг</button>
            <button type="button" onClick={handleSaveJSON} className="parchment-header-btn">💾 JSON</button>
            <button type="button" onClick={handleLoadJSON} className="parchment-header-btn">📂 Загр.</button>
            <button type="button" onClick={handleReset} className="parchment-header-btn">🔄 Сброс</button>
            <button type="button" onClick={handleExport} className="parchment-header-btn-primary">📥 DOCX</button>
            {user ? (
              <>
                <span className="text-xs flex items-center gap-1" style={{ color: cloudSaveStatus === 'saving' ? '#8B6914' : cloudSaveStatus === 'saved' ? '#4a7c3f' : '#999', fontFamily: 'Georgia, serif' }}>
                  {cloudSaveStatus === 'saving' ? '⏳ Сохранение...' : cloudSaveStatus === 'saved' ? '✅ Сохранено' : '☁️'}
                </span>
                <button type="button" onClick={handleCloudSave} className="parchment-header-btn-primary">☁️ Сохранить</button>
                <button type="button" onClick={handleCloudLoad} className="parchment-header-btn">📂 Облако</button>
                <button type="button" onClick={handleSignOut} className="parchment-header-btn">🚪 Выйти</button>
              </>
            ) : (
              <>
                <span className="text-xs" style={{ color: '#4a7c3f', fontFamily: 'Georgia, serif' }}>💾 Автосохранение</span>
                <button type="button" onClick={() => setShowAuth(true)} className="parchment-header-btn-primary">🔑 Войти</button>
              </>
            )}
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
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">👤 Основная информация</h3></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <StatInput label="Имя персонажа" value={char.name} onChange={v => update('name', v)} type="text" placeholder="Имя" />
                    <StatInput label="Имя игрока" value={char.playerName} onChange={v => update('playerName', v)} type="text" placeholder="Игрок" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatInput label="Класс" value={char.className} onChange={v => update('className', v)} type="text" placeholder="Воин" />
                    <div className="space-y-1">
                      <label className="parchment-label">Уровень</label>
                      <div className="flex items-center gap-1">
                        <span className="flex-1 text-center font-bold text-lg" style={{ color: '#6B3A2A', fontFamily: 'Georgia, "Times New Roman", serif' }}>{char.level}</span>
                        <button onClick={() => char.level > 1 && setShowLevelDown(true)} disabled={char.level <= 1}
                          className="parchment-level-btn" title="Понизить">−</button>
                        <button onClick={() => char.level < 20 && setShowLevelUp(true)} disabled={char.level >= 20}
                          className="parchment-level-btn" title="Повысить">+</button>
                        <button onClick={() => setShowHistory(true)} className="parchment-level-btn" title="История">📜</button>
                      </div>
                    </div>
                    <StatInput label="Предыстория" value={char.background} onChange={v => update('background', v)} type="text" placeholder="Солдат" className="col-span-2 sm:col-span-1" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatInput label="Раса" value={char.race} onChange={v => update('race', v)} type="text" placeholder="Дворф" />
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
                  <h3 className="parchment-heading flex items-center gap-2">
                    ✨ Характеристики
                    <span className="ml-auto text-xs font-normal" style={{ color: '#8B6914' }}>Бонус мастерства: {formatModifier(profBonus)}</span>
                  </h3>
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
                      return (
                        <div key={abbr} className={`p-2 rounded ${isProf ? 'parchment-prof' : 'parchment-no-prof'}`}>
                          {/* Mobile layout — stacked grid for narrow screens */}
                          <div className="sm:hidden grid grid-cols-2 gap-x-2 gap-y-1 items-center">
                            {/* Name + total+mod in top-left */}
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs font-bold" style={{ color: '#3C2415' }}>{abbr}</span>
                              <span className="text-xs font-bold" style={{ color: '#6B3A2A' }}>{total}</span>
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
                            <CalcBadge value={total} />
                            <RollBadge value={formatModifier(mod)} label={`Проверка ${ABILITY_FULL[abbr]}`} modifier={mod} onRoll={handleRoll} />
                            <div className="flex items-center gap-1">
                              <label className="parchment-checkbox parchment-checkbox-sm"><input type="checkbox" checked={isProf} onChange={e => updateSaveProf(abbr, e.target.checked)} /><span className="checkmark"></span></label>
                              <RollBadge value={formatModifier(save)} label={`Спасбросок ${ABILITY_FULL[abbr]}`} modifier={save} onRoll={handleRoll} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-right" style={{ color: '#8B6914' }}>База | Раса | АСИ (от уровней) · 🎲 Нажми Мод./Спасбр. для броска</p>
                  </div>
                </div>
              </div>

              {/* Combat */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">🛡️ Боевые параметры</h3></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="parchment-label">КД</label><input type="number" value={char.armorClass ?? ''} onChange={e => update('armorClass', e.target.value === '' ? null : Number(e.target.value))} placeholder={String(getAC(char))} className={inputClass} /></div>
                    <div className="space-y-1"><label className="parchment-label">Инициатива</label><div className="flex items-center gap-1"><RollBadge value={formatModifier(getInitiative(char))} label="Инициатива" modifier={getInitiative(char)} onRoll={handleRoll} /><input type="number" value={char.initiativeOverride ?? ''} onChange={e => update('initiativeOverride', e.target.value === '' ? null : Number(e.target.value))} placeholder="Авто" className={inputClass + " flex-1"} /></div></div>
                    <div className="space-y-1"><label className="parchment-label">Скорость (фт.)</label><input type="number" value={char.speed} onChange={e => update('speed', Number(e.target.value) || 30)} className={inputClass} /></div>
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
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">💰 Валюта</h3></div>
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
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2">✨ Навыки <span className="ml-auto text-xs font-normal" style={{ color: '#8B6914' }}>☑ = владение · ☑☑ = экспертиза · 🎲 бросок</span></h3></div>
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
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">⚔️ Атаки</h3></div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr_auto] gap-2 text-xs font-medium px-1" style={{ color: '#8B6914' }}><span>Название</span><span>Бонус</span><span>Урон / Вид</span><span /></div>
                  {char.attacks.map((atk, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                      <input value={atk.name} onChange={e => updateAttack(i, 'name', e.target.value)} placeholder="Название" className={inputClass} />
                      <input value={atk.attackBonus} onChange={e => updateAttack(i, 'attackBonus', e.target.value)} placeholder="+5" className={inputClassCenter + " w-20"} />
                      <input value={atk.damageAndType} onChange={e => updateAttack(i, 'damageAndType', e.target.value)} placeholder="1d8+3 рубящий" className={inputClass} />
                      <button onClick={() => removeAttack(i)} className="parchment-remove-btn">✕</button>
                    </div>
                  ))}
                  <button onClick={addAttack} className="w-full parchment-btn-secondary text-xs">+ Добавить атаку</button>
                </div>
              </div>

              {/* Personality */}
              <div className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">🎭 Личность</h3></div>
                <div className="px-4 pb-4 space-y-3">
                  {[{ label: 'Черты характера', key: 'personalityTraits' as const },{ label: 'Идеалы', key: 'ideals' as const },{ label: 'Привязанности', key: 'bonds' as const },{ label: 'Слабости', key: 'flaws' as const }].map(item => (
                    <div key={item.key} className="space-y-1"><label className="parchment-label">{item.label}</label><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={2} className={textareaClass} /></div>
                  ))}
                </div>
              </div>

              {/* Other */}
              {[{ label: 'Прочие владения и языки', key: 'otherProficienciesLanguages' as const, rows: 3 },{ label: 'Снаряжение', key: 'equipment' as const, rows: 3 },{ label: 'Умения и особенности', key: 'featuresTraits' as const, rows: 4 }].map(item => (
                <div key={item.key} className="parchment-card">
                  <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">{item.label}</h3></div>
                  <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PAGE 2 ═══ */}
        {activeTab === 'page2' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="parchment-card">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">👤 Физическое описание</h3></div>
              <div className="px-4 pb-4 space-y-3">
                {/* Portrait */}
                <div className="mb-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {portraitUrl ? (
                        <div className="relative w-24 h-24 rounded" style={{ border: '2px solid rgba(139, 105, 20, 0.4)', overflow: 'hidden' }}>
                          <label className="w-full h-full cursor-pointer block">
                            <img src={portraitUrl} alt="Портрет" className="w-full h-full object-cover" />
                            <input type="file" accept="image/*" onChange={handlePortraitUpload} className="hidden" />
                          </label>
                          <button onClick={() => setPortraitUrl(null)} className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-[10px] cursor-pointer" style={{ background: 'rgba(139, 37, 0, 0.7)', color: '#FBF0DC', border: 'none', borderRadius: '0 0 0 3px' }}>✕</button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 flex flex-col items-center justify-center cursor-pointer rounded" style={{ border: '2px dashed rgba(139, 105, 20, 0.3)', background: 'rgba(251, 240, 220, 0.3)' }}>
                          <span className="text-2xl mb-1">📷</span>
                          <span className="text-[9px] text-center px-1" style={{ color: '#8B6914' }}>Загрузить портрет</span>
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
            {[{ label: 'Внешность', key: 'appearance' as const, rows: 5 },{ label: 'Союзники и организации', key: 'alliesOrganizations' as const, rows: 5 },{ label: 'Доп. умения и особенности', key: 'additionalFeaturesTraits' as const, rows: 5 }].map(item => (
              <div key={item.key} className="parchment-card">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">{item.label}</h3></div>
                <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} /></div>
              </div>
            ))}
            {[{ label: 'Предыстория персонажа', key: 'backstory' as const, rows: 8 },{ label: 'Сокровища', key: 'treasure' as const, rows: 3 }].map(item => (
              <div key={item.key} className="parchment-card lg:col-span-2">
                <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">{item.label}</h3></div>
                <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} placeholder={item.key === 'backstory' ? 'Расскажите историю персонажа...' : ''} /></div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ PAGE 3 ═══ */}
        {activeTab === 'page3' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="parchment-card">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">📖 Параметры заклинателя</h3></div>
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
                    <div className="space-y-1"><label className="parchment-label">Бонус атаки</label><CalcBadge value={formatModifier(getSpellAttackBonus(char))} /></div>
                    <div className="space-y-1"><label className="parchment-label">Мод. хар-ки</label><CalcBadge value={formatModifier(getSpellAbilityMod(char))} /></div>
                  </div>
                )}
              </div>
            </div>
            <div className="parchment-card">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">🔮 Ячейки заклинаний</h3></div>
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
            <div className="parchment-card lg:col-span-2">
              <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading">✨ Заговоры (0 ур.)</h3></div>
              <div className="px-4 pb-4 space-y-2">
                {char.cantrips.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={c} onChange={e => updateCantrip(i, e.target.value)} placeholder="Название" className={inputClass + " flex-1"} />
                    <button onClick={() => removeCantrip(i)} className="parchment-remove-btn">✕</button>
                  </div>
                ))}
                <button onClick={addCantrip} className="parchment-btn-secondary text-xs">+ Добавить</button>
              </div>
            </div>
            {[1,2,3,4,5,6,7,8,9].map(lvl => {
              const spells = char.spellsByLevel[lvl] || [];
              // Always show all 9 spell levels on the website
              return (
                <div key={lvl} className="parchment-card">
                  <div className="px-4 pt-4 pb-3"><h3 className="parchment-heading flex items-center gap-2">📖 Заклинания {lvl} ур. <span className="text-xs font-normal" style={{ color: '#8B6914' }}>({spells.length})</span></h3></div>
                  <div className="px-4 pb-4 space-y-2">
                    {spells.map((spell, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <label className="parchment-checkbox"><input type="checkbox" checked={spell.prepared} onChange={e => updateSpellEntry(lvl, i, 'prepared', e.target.checked)} /><span className="checkmark"></span></label>
                        <input value={spell.name} onChange={e => updateSpellEntry(lvl, i, 'name', e.target.value)} placeholder="Название" className={inputClass + " flex-1"} />
                        <button onClick={() => removeSpell(lvl, i)} className="parchment-remove-btn">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addSpell(lvl)} className="parchment-btn-secondary text-xs">+ Добавить</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button onClick={handleExport} className="parchment-btn text-base px-8 py-3 shadow-lg flex items-center gap-2">📥 Экспортировать в DOCX</button>
        </div>
      </main>
    </div>
  );
}
