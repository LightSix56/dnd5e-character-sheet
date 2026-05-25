'use client';

import React, { useState, useCallback, useMemo } from 'react';
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

// ── Small helper components ──

function CalcBadge({ value, label }: { value: string | number; label?: string }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-1.5 py-0.5 text-sm font-bold rounded bg-purple-100 text-purple-800 border border-purple-200" title={label || 'Авторасчёт'}>
      {value}
    </span>
  );
}

function StatInput({ label, value, onChange, type = 'number', placeholder, className = '' }: {
  label: string; value: string | number; onChange: (v: any) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs text-gray-500">{label}</label>
      <input type={type} value={value}
        onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white" />
    </div>
  );
}

const inputClass = "w-full h-7 px-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400";
const inputClassCenter = "w-full h-7 px-2 text-sm border border-gray-300 rounded bg-white text-center focus:outline-none focus:ring-1 focus:ring-purple-400";
const textareaClass = "w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 resize-y";

// ── Level Up Modal (comprehensive draft sheet) ──

interface LevelUpModalProps {
  char: CharacterData;
  onConfirm: (entry: LevelUpEntry) => void;
  onCancel: () => void;
}

function LevelUpModal({ char, onConfirm, onCancel }: LevelUpModalProps) {
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
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-purple-800 mb-1">⬆️ Повышение до {newLevel} уровня</h2>
          <p className="text-sm text-gray-500 mb-4">{char.name || 'Персонаж'} — {char.className || 'Без класса'}</p>

          {/* Auto: Proficiency */}
          {profChanged && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">
                🎯 Бонус мастерства: {formatModifier(calcProficiencyBonus(char.level))} → {formatModifier(calcProficiencyBonus(newLevel))}
              </p>
              <p className="text-xs text-yellow-600 mt-1">Автоматически обновит все спасброски и навыки с владением</p>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">📌 Обычно на этом уровне:</p>
              {milestones.map((m, i) => <p key={i} className="text-xs text-blue-600">{m}</p>)}
            </div>
          )}

          {/* HP */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">❤️ Прирост хитов:</h3>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setHpMode('average')}
                className={`px-3 py-1.5 text-xs rounded-md ${hpMode === 'average' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Среднее ({avgHP})
              </button>
              <button onClick={() => setHpMode('roll')}
                className={`px-3 py-1.5 text-xs rounded-md ${hpMode === 'roll' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Бросок кубика
              </button>
            </div>
            {hpMode === 'roll' && (
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Бросок {diceNotation}{dieSize}:</label>
                <input type="number" min={1} max={dieSize} value={hpRoll}
                  onChange={e => setHpRoll(Number(e.target.value) || 1)}
                  className="w-16 h-7 px-2 text-sm border rounded text-center" />
                <span className="text-xs text-gray-500">+ {formatModifier(conMod)} ТЕЛ = <strong>{hpRoll + conMod}</strong></span>
              </div>
            )}
            <p className="text-sm text-gray-600">Итого: <strong className="text-purple-700">+{finalHP}</strong> хитов</p>
          </div>

          {/* ASI */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={asiUsed} onChange={e => setAsiUsed(e.target.checked)} className="w-4 h-4 accent-purple-600" />
              <h3 className="text-sm font-bold text-gray-700">📈 Улучшение характеристики (АСИ)</h3>
            </div>
            {asiUsed && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="text-xs text-gray-500">Характеристика +1:</label>
                  <select value={asiAbility1} onChange={e => setAsiAbility1(e.target.value as AbilityName)} className="w-full h-7 px-2 text-sm border rounded bg-white">
                    {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_FULL[a]} ({getTotalScore(char, a)} → {getTotalScore(char, a) + 1})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Характеристика +1:</label>
                  <select value={asiAbility2} onChange={e => setAsiAbility2(e.target.value as AbilityName)} className="w-full h-7 px-2 text-sm border rounded bg-white">
                    {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_FULL[a]} ({getTotalScore(char, a)} → {getTotalScore(char, a) + 1})</option>)}
                  </select>
                </div>
                <p className="col-span-2 text-xs text-gray-400">Можно выбрать одну характеристику дважды (+2) или две разные (+1, +1). Или взять черту — тогда впиши её в заметки.</p>
              </div>
            )}
          </div>

          {/* ── NEW CANTRIPS ── */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">✨ Новые заговоры (→ вкладка Заклинания):</h3>
            {newCantrips.map((c, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input value={c} onChange={e => updateCantripRow(i, e.target.value)} placeholder="Название заговора" className={inputClass} />
                <button onClick={() => removeCantripRow(i)} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded hover:bg-red-50">✕</button>
              </div>
            ))}
            <button onClick={addCantripRow} className="mt-1 px-3 py-1 text-xs font-medium border border-green-300 rounded-md hover:bg-green-100 text-green-700">+ Заговор</button>
          </div>

          {/* ── NEW SPELLS ── */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">📖 Новые заклинания (→ вкладка Заклинания):</h3>
            {newSpells.map((s, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <select value={s.level} onChange={e => updateSpellRow(i, 'level', Number(e.target.value))} className="h-7 px-2 text-sm border rounded bg-white">
                  {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l} ур.</option>)}
                </select>
                <input value={s.name} onChange={e => updateSpellRow(i, 'name', e.target.value)} placeholder="Название заклинания" className="flex-1 h-7 px-2 text-sm border rounded" />
                <label className="flex items-center gap-1 text-xs text-gray-500"><input type="checkbox" checked={s.prepared} onChange={e => updateSpellRow(i, 'prepared', e.target.checked)} className="w-3.5 h-3.5 accent-purple-600" />Подг.</label>
                <button onClick={() => removeSpellRow(i)} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded hover:bg-red-50">✕</button>
              </div>
            ))}
            <button onClick={addSpellRow} className="mt-1 px-3 py-1 text-xs font-medium border border-blue-300 rounded-md hover:bg-blue-100 text-blue-700">+ Заклинание</button>
          </div>

          {/* ── NEW SAVING THROW PROFS ── */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">🛡️ Новые владения спасбросками:</h3>
            <div className="flex flex-wrap gap-2">
              {ABILITY_NAMES.map(abbr => (
                <label key={abbr} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${newSaveProfs.includes(abbr) ? 'bg-purple-200 font-bold' : char.savingThrowProficiencies[abbr] ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={newSaveProfs.includes(abbr)} onChange={() => toggleSaveProf(abbr)} disabled={char.savingThrowProficiencies[abbr]} className="w-3.5 h-3.5 accent-purple-600" />
                  {ABILITY_FULL[abbr]}
                </label>
              ))}
            </div>
          </div>

          {/* ── NEW SKILL PROFS ── */}
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">🎯 Новые владения навыками:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1">
              {ALL_SKILLS.map(skill => {
                const alreadyProf = char.skillProficiencies[skill];
                const isNewProf = newSkillProfs.includes(skill);
                const isNewExpert = newSkillExpertise.includes(skill);
                return (
                  <div key={skill} className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded text-xs ${isNewExpert ? 'bg-purple-200 font-bold' : isNewProf ? 'bg-indigo-200' : alreadyProf ? 'text-gray-400' : ''}`}>
                    <input type="checkbox" checked={isNewProf} onChange={() => toggleSkillProf(skill)} disabled={alreadyProf} className="w-3 h-3 accent-purple-600" title="Владение" />
                    <input type="checkbox" checked={isNewExpert} onChange={() => toggleSkillExpertise(skill)} disabled={alreadyProf || !isNewProf} className="w-3 h-3 accent-purple-600" title="Экспертиза" />
                    <span>{skill}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">1-я галочка = владение, 2-я = экспертиза. Серые = уже есть.</p>
          </div>

          {/* ── NEW ATTACKS ── */}
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">⚔️ Новые атаки:</h3>
            {newAttacks.map((atk, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center mb-1">
                <input value={atk.name} onChange={e => updateAttackRow(i, 'name', e.target.value)} placeholder="Название" className={inputClass} />
                <input value={atk.attackBonus} onChange={e => updateAttackRow(i, 'attackBonus', e.target.value)} placeholder="+5" className={inputClassCenter + " w-16"} />
                <input value={atk.damageAndType} onChange={e => updateAttackRow(i, 'damageAndType', e.target.value)} placeholder="1d8+3 рубящий" className={inputClass} />
                <button onClick={() => removeAttackRow(i)} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}
            <button onClick={addAttackRow} className="mt-1 px-3 py-1 text-xs font-medium border border-red-300 rounded-md hover:bg-red-100 text-red-700">+ Атака</button>
          </div>

          {/* ── NEW PROFICIENCIES TEXT ── */}
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">📋 Новые владения / языки (→ добавится к существующим):</h3>
            <textarea value={newProfText} onChange={e => setNewProfText(e.target.value)} rows={2} className={textareaClass} placeholder="Владение тяжёлыми доспехами&#10;Язык: Драконий" />
          </div>

          {/* ── NEW EQUIPMENT TEXT ── */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">🎒 Новое снаряжение (→ добавится к существующему):</h3>
            <textarea value={newEquipText} onChange={e => setNewEquipText(e.target.value)} rows={2} className={textareaClass} placeholder="Кольчуга, Длинный меч" />
          </div>

          {/* ── FREEFORM NOTES → FEATURES ── */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">📝 Умения и особенности (→ добавится к существующим):</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={textareaClass}
              placeholder={"Новые умения, подкласс, черты...\nНапример:\n- Выбор подкласса: Школа Воплощения\n- Черта: Мастер тяжёлого оружия"} />
          </div>

          {/* Summary */}
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-gray-600 space-y-0.5">
            <p className="font-bold text-purple-800 mb-1">Итого:</p>
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
            <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Отмена</button>
            <button onClick={() => onConfirm(buildEntry())} className="flex-1 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
              ⬆️ Повысить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Level Down Confirm ──

interface LevelDownModalProps {
  char: CharacterData;
  onConfirm: () => void;
  onCancel: () => void;
}

function LevelDownModal({ char, onConfirm, onCancel }: LevelDownModalProps) {
  const last = char.levelHistory[char.levelHistory.length - 1];
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">⬇️ Откат до {char.level - 1} уровня</h2>
          {last ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm space-y-1">
              <p className="text-red-800 font-medium">Будет отменено:</p>
              <p className="text-red-600">• −{last.hpGained} хитов</p>
              {last.asiAbilities && <p className="text-red-600">• {last.asiAbilities.map(a => `${ABILITY_FULL[a]} +1`).join(', ')}</p>}
              {last.newCantrips?.length > 0 && <p className="text-red-600">• Заговоры: {last.newCantrips.join(', ')}</p>}
              {last.newSpells?.length > 0 && <p className="text-red-600">• Заклинания: {last.newSpells.map(s => `${s.name} (${s.level} ур.)`).join(', ')}</p>}
              {last.newSavingThrowProfs?.length > 0 && <p className="text-red-600">• Влад. спасбросками: {last.newSavingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}</p>}
              {last.newSkillProfs?.length > 0 && <p className="text-red-600">• Влад. навыками: {last.newSkillProfs.join(', ')}</p>}
              {last.newSkillExpertise?.length > 0 && <p className="text-red-600">• Экспертиза: {last.newSkillExpertise.join(', ')}</p>}
              {last.newAttacks?.length > 0 && <p className="text-red-600">• Атаки: {last.newAttacks.map(a => a.name).join(', ')}</p>}
              {last.notes && <p className="text-red-600 text-xs mt-1">{last.notes}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-4">Нет записи. Будет просто −1 уровень.</p>
          )}
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Отмена</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">⬇️ Откатить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Level History ──

interface LevelHistoryModalProps {
  char: CharacterData;
  onClose: () => void;
}

function LevelHistoryModal({ char, onClose }: LevelHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-purple-800 mb-4">📜 История уровней</h2>
          {char.levelHistory.length === 0 ? (
            <p className="text-sm text-gray-500">Нет записей</p>
          ) : (
            <div className="space-y-2">
              {char.levelHistory.map((entry, i) => (
                <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-purple-700">{entry.level} ур.</span>
                    <span className="text-xs text-gray-400">+{entry.hpGained} хитов</span>
                  </div>
                  {entry.asiAbilities && (
                    <p className="text-xs text-green-700">📈 {entry.asiAbilities.map(a => `${ABILITY_FULL[a]} +1`).join(', ')}</p>
                  )}
                  {entry.newCantrips?.length > 0 && (
                    <p className="text-xs text-teal-700">✨ Заговоры: {entry.newCantrips.join(', ')}</p>
                  )}
                  {entry.newSpells?.length > 0 && (
                    <p className="text-xs text-blue-700">📖 Заклинания: {entry.newSpells.map(s => `${s.name} (${s.level} ур.)`).join(', ')}</p>
                  )}
                  {entry.newSavingThrowProfs?.length > 0 && (
                    <p className="text-xs text-yellow-700">🛡️ Влад. спасбросками: {entry.newSavingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}</p>
                  )}
                  {entry.newSkillProfs?.length > 0 && (
                    <p className="text-xs text-indigo-700">🎯 Влад. навыками: {entry.newSkillProfs.join(', ')}</p>
                  )}
                  {entry.newSkillExpertise?.length > 0 && (
                    <p className="text-xs text-purple-700">🏆 Экспертиза: {entry.newSkillExpertise.join(', ')}</p>
                  )}
                  {entry.newAttacks?.length > 0 && (
                    <p className="text-xs text-red-700">⚔️ Атаки: {entry.newAttacks.map(a => a.name).join(', ')}</p>
                  )}
                  {entry.notes && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} className="mt-4 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Закрыть</button>
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

function TemplateModal({ onSelect, onCancel }: TemplateModalProps) {
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
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-purple-800 mb-1">📋 Шаблоны классов</h2>
          <p className="text-sm text-gray-500 mb-4">Выберите класс — лист заполнится типичными данными 1-го уровня. Всё можно изменить после.</p>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {([['all', 'Все'], ['martial', '⚔️ Воины'], ['caster', '🔮 Маги'], ['hybrid', '⚡ Гибриды']] as const).map(([f, label]) => (
              <button key={f} onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 text-xs rounded-md ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {filtered.map(t => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`text-left p-3 rounded-lg border-2 transition-all ${selected === t.id ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{t.emoji}</span>
                  <span className="font-bold text-sm text-gray-900">{t.name}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">d{t.hitDieSize}</span>
                  <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">{t.primaryAbility}</span>
                </div>
                <p className="text-xs text-gray-500">{t.role}</p>
              </button>
            ))}
          </div>

          {/* Detail preview */}
          {template && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{template.emoji}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{template.name}</h3>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-gray-400">Кость хитов:</span>
                  <span className="ml-1 font-medium">1d{template.hitDieSize} (макс. {template.hitDieSize} + ТЕЛ на 1 ур.)</span>
                </div>
                <div>
                  <span className="text-gray-400">Основная характ.:</span>
                  <span className="ml-1 font-medium">{template.primaryAbility}</span>
                </div>
                <div>
                  <span className="text-gray-400">Спасброски:</span>
                  <span className="ml-1 font-medium">{template.savingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-400">Навыков:</span>
                  <span className="ml-1 font-medium">{template.skillChoices} из {template.skillOptions.length}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Рекомендуемые навыки:</p>
                <div className="flex flex-wrap gap-1">
                  {template.recommendedSkills.map(s => (
                    <span key={s} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Характеристики (станд. массив):</p>
                <div className="flex gap-3 text-xs">
                  {ABILITY_NAMES.map(ab => (
                    <div key={ab} className="text-center">
                      <div className="font-bold text-gray-700">{template.recommendedScores[ab]}</div>
                      <div className="text-gray-400 text-[10px]">{ab} ({formatModifier(calcModifier(template.recommendedScores[ab]))})</div>
                    </div>
                  ))}
                </div>
              </div>

              {template.spellcasting.isCaster && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Магия ({template.spellcasting.ability ? ABILITY_FULL[template.spellcasting.ability] : '—'}):</p>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>Заговоры: {template.spellcasting.cantripsKnown} — {template.spellcasting.cantripList?.join(', ') || '—'}</p>
                    {template.spellcasting.spellListAt1 && template.spellcasting.spellListAt1.length > 0 && (
                      <p>Заклинания 1 ур.: {template.spellcasting.spellListAt1.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">Умения 1-го уровня:</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{template.features}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Типичное снаряжение:</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{template.equipment}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-center pt-1 border-t border-gray-200">
                <div className="bg-blue-50 rounded p-1.5">
                  <div className="text-gray-400">КД</div>
                  <div className="font-bold text-blue-700">{template.typicalAC}</div>
                </div>
                <div className="bg-red-50 rounded p-1.5">
                  <div className="text-gray-400">Хиты 1 ур.</div>
                  <div className="font-bold text-red-700">{template.hitDieSize + calcModifier(template.recommendedScores['ТЕЛ'])}</div>
                </div>
                <div className="bg-green-50 rounded p-1.5">
                  <div className="text-gray-400">Золото</div>
                  <div className="font-bold text-green-700 text-[10px]">{template.startingGold}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Отмена</button>
            <button onClick={() => selected && onSelect(selected)}
              disabled={!selected}
              className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium ${selected ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              📋 Применить шаблон
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function DnDCharacterSheet() {
  const [char, setChar] = useState<CharacterData>(createDefaultCharacter());
  const [activeTab, setActiveTab] = useState<'page1' | 'page2' | 'page3'>('page1');
  const [toast, setToast] = useState<{ title: string; description: string } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLevelDown, setShowLevelDown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

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
      const r = await fetch('/api/export-docx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(char) });
      if (!r.ok) throw new Error('Ошибка');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `DnD5e_${char.name || 'Персонаж'}.docx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Экспорт', 'DOCX сохранён');
    } catch (err: any) { showToast('Ошибка', err.message); }
  }, [char, showToast]);

  const handleLoadExample = useCallback((type: 'warrior' | 'wizard') => {
    setChar(type === 'warrior' ? createExampleWarrior() : createExampleWizard());
    showToast('Загружено', type === 'warrior' ? 'Воин 5 ур.' : 'Волшебник 5 ур.');
  }, [showToast]);

  const handleReset = useCallback(() => {
    setChar(createDefaultCharacter());
    showToast('Сброшено', '');
  }, [showToast]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = CLASS_TEMPLATES.find(t => t.id === templateId);
    setChar(applyClassTemplate(templateId));
    setShowTemplates(false);
    showToast(`${template?.emoji || ''} ${template?.name || ''}`, 'Шаблон применён — 1 уровень');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-white border border-purple-300 rounded-lg shadow-lg px-4 py-3 max-w-xs">
          <p className="font-semibold text-sm text-gray-900">{toast.title}</p>
          <p className="text-xs text-gray-500">{toast.description}</p>
        </div>
      )}

      {showLevelUp && <LevelUpModal char={char} onConfirm={handleLevelUp} onCancel={() => setShowLevelUp(false)} />}
      {showLevelDown && <LevelDownModal char={char} onConfirm={handleLevelDown} onCancel={() => setShowLevelDown(false)} />}
      {showHistory && <LevelHistoryModal char={char} onClose={() => setShowHistory(false)} />}
      {showTemplates && <TemplateModal onSelect={handleApplyTemplate} onCancel={() => setShowTemplates(false)} />}

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Генератор листа персонажа D&D 5e</h1>
              <p className="text-xs text-gray-500">Авторасчёт · Повышение уровня · Экспорт DOCX</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300 rounded-md hover:bg-purple-200">📋 Шаблоны</button>
            <button onClick={() => handleLoadExample('warrior')} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100">⚔️ Воин</button>
            <button onClick={() => handleLoadExample('wizard')} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100">📖 Маг</button>
            <button type="button" onClick={handleSaveJSON} className="px-3 py-1.5 text-xs font-medium border border-green-300 bg-green-50 text-green-700 rounded-md hover:bg-green-100 touch-manipulation active:scale-95">💾 JSON</button>
            <button type="button" onClick={handleLoadJSON} className="px-3 py-1.5 text-xs font-medium border border-blue-300 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 touch-manipulation active:scale-95">📂 Загр.</button>
            <button type="button" onClick={handleReset} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100 touch-manipulation active:scale-95">🔄 Сброс</button>
            <button type="button" onClick={handleExport} className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 touch-manipulation active:scale-95">📥 DOCX</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 mb-6 bg-gray-200 rounded-lg p-1">
          {[
            { key: 'page1' as const, label: 'Основной лист', shortLabel: 'Лист' },
            { key: 'page2' as const, label: 'Детали', shortLabel: 'Детали' },
            { key: 'page3' as const, label: 'Заклинания', shortLabel: 'Магия' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-white text-purple-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              <span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* ═══ PAGE 1 ═══ */}
        {activeTab === 'page1' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">

              {/* Basic Info */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">👤 Основная информация</h3></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <StatInput label="Имя персонажа" value={char.name} onChange={v => update('name', v)} type="text" placeholder="Имя" />
                    <StatInput label="Имя игрока" value={char.playerName} onChange={v => update('playerName', v)} type="text" placeholder="Игрок" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatInput label="Класс" value={char.className} onChange={v => update('className', v)} type="text" placeholder="Воин" />
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Уровень</label>
                      <div className="flex items-center gap-1">
                        <span className="flex-1 text-center font-bold text-lg text-purple-700">{char.level}</span>
                        <button onClick={() => char.level > 1 && setShowLevelDown(true)} disabled={char.level <= 1}
                          className="w-7 h-7 flex items-center justify-center text-sm border rounded hover:bg-red-50 hover:border-red-300 disabled:opacity-30" title="Понизить">−</button>
                        <button onClick={() => char.level < 20 && setShowLevelUp(true)} disabled={char.level >= 20}
                          className="w-7 h-7 flex items-center justify-center text-sm border rounded hover:bg-green-50 hover:border-green-300 disabled:opacity-30" title="Повысить">+</button>
                        <button onClick={() => setShowHistory(true)} className="w-7 h-7 flex items-center justify-center text-sm border rounded hover:bg-purple-50 hover:border-purple-300" title="История">📜</button>
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
                    <input type="checkbox" checked={char.inspiration} onChange={e => update('inspiration', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                    <label className="text-sm">Вдохновение</label>
                  </div>
                </div>
              </div>

              {/* Abilities */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    ✨ Характеристики
                    <span className="ml-auto text-xs font-normal text-purple-600">Бонус мастерства: {formatModifier(profBonus)}</span>
                  </h3>
                </div>
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    <div className="hidden sm:grid grid-cols-7 gap-1 text-xs text-gray-500 font-medium px-1">
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
                        <div key={abbr} className={`p-2 rounded ${isProf ? 'bg-purple-50' : 'bg-gray-50'}`}>
                          {/* Mobile layout */}
                          <div className="sm:hidden">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-700">{ABILITY_FULL[abbr]} ({abbr})</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Итого: <strong className="text-gray-700">{total}</strong></span>
                                <span className="text-xs text-gray-400">Мод: <strong className="text-purple-700">{formatModifier(mod)}</strong></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">База</label>
                                <input type="number" value={base} onChange={e => updateAbility(abbr, 'abilityScores', Number(e.target.value) || 10)} className={inputClassCenter + " text-xs"} />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Раса</label>
                                <input type="number" value={racial} onChange={e => updateAbility(abbr, 'abilityBonuses', Number(e.target.value) || 0)} className={inputClassCenter + " text-xs"} />
                              </div>
                              <div className="flex items-end gap-1">
                                <CalcBadge value={asi > 0 ? `+${asi}` : '0'} />
                              </div>
                              <div className="flex items-end gap-1">
                                <label className="text-[10px] text-gray-400">Спасбр.</label>
                                <input type="checkbox" checked={isProf} onChange={e => updateSaveProf(abbr, e.target.checked)} className="w-3.5 h-3.5 accent-purple-600" />
                                <CalcBadge value={formatModifier(save)} />
                              </div>
                            </div>
                          </div>
                          {/* Desktop layout */}
                          <div className={`hidden sm:grid grid-cols-7 gap-1 items-center p-1.5 rounded ${isProf ? 'bg-purple-50' : 'bg-gray-50'}`}>
                            <span className="text-xs font-bold text-gray-700">{ABILITY_FULL[abbr]}</span>
                            <input type="number" value={base} onChange={e => updateAbility(abbr, 'abilityScores', Number(e.target.value) || 10)} className={inputClassCenter + " text-xs"} />
                            <input type="number" value={racial} onChange={e => updateAbility(abbr, 'abilityBonuses', Number(e.target.value) || 0)} className={inputClassCenter + " text-xs"} title="Расовый бонус" />
                            <CalcBadge value={asi > 0 ? `+${asi}` : '0'} />
                            <CalcBadge value={total} />
                            <CalcBadge value={formatModifier(mod)} />
                            <div className="flex items-center gap-1">
                              <input type="checkbox" checked={isProf} onChange={e => updateSaveProf(abbr, e.target.checked)} className="w-3.5 h-3.5 accent-purple-600" />
                              <CalcBadge value={formatModifier(save)} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-gray-400 text-right">База | Раса | АСИ (от уровней)</p>
                  </div>
                </div>
              </div>

              {/* Combat */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">🛡️ Боевые параметры</h3></div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-xs text-gray-500">КД</label><input type="number" value={char.armorClass ?? ''} onChange={e => update('armorClass', e.target.value === '' ? null : Number(e.target.value))} placeholder={String(getAC(char))} className={inputClass} /></div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">Инициатива</label><div className="flex items-center gap-1"><CalcBadge value={formatModifier(getInitiative(char))} /><input type="number" value={char.initiativeOverride ?? ''} onChange={e => update('initiativeOverride', e.target.value === '' ? null : Number(e.target.value))} placeholder="Авто" className={inputClass + " flex-1"} /></div></div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">Скорость (фт.)</label><input type="number" value={char.speed} onChange={e => update('speed', Number(e.target.value) || 30)} className={inputClass} /></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-xs text-gray-500">Макс. хитов</label><input type="number" value={char.hpMax ?? ''} onChange={e => update('hpMax', e.target.value === '' ? null : Number(e.target.value))} className={inputClass} /></div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">Текущие хиты</label><input type="number" value={char.hpCurrent} onChange={e => update('hpCurrent', Number(e.target.value) || 0)} className={inputClass} /></div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">Врем. хиты</label><input type="number" value={char.hpTemp} onChange={e => update('hpTemp', Number(e.target.value) || 0)} className={inputClass} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatInput label="Кость хитов" value={char.hitDice} onChange={v => update('hitDice', v)} type="text" placeholder="1d10" />
                    <div className="space-y-1"><label className="text-xs text-gray-500">Пассивная внимательность</label><CalcBadge value={getPassivePerception(char)} /></div>
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-xs text-gray-500 font-medium">Спасброски от смерти</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Успехи:</span>{[0,1,2].map(i => (<button key={`s${i}`} onClick={() => updateDeathSave('deathSaveSuccesses', i < char.deathSaveSuccesses ? -1 : 1)} className={`w-5 h-5 rounded-full border-2 ${i < char.deathSaveSuccesses ? 'bg-green-500 border-green-600' : 'bg-white border-gray-300'}`} />))}</div>
                      <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Провалы:</span>{[0,1,2].map(i => (<button key={`f${i}`} onClick={() => updateDeathSave('deathSaveFailures', i < char.deathSaveFailures ? -1 : 1)} className={`w-5 h-5 rounded-full border-2 ${i < char.deathSaveFailures ? 'bg-red-500 border-red-600' : 'bg-white border-gray-300'}`} />))}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">Валюта</h3></div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[{ key: 'cp' as const, label: 'ММ' },{ key: 'sp' as const, label: 'СМ' },{ key: 'ep' as const, label: 'ЭМ' },{ key: 'gp' as const, label: 'ЗМ' },{ key: 'pp' as const, label: 'ПМ' }].map(c => (
                      <div key={c.key} className="space-y-1 text-center"><label className="text-xs text-gray-500">{c.label}</label><input type="number" value={char[c.key]} onChange={e => update(c.key, Number(e.target.value) || 0)} className={inputClassCenter} /></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7 space-y-4">

              {/* Skills */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900 flex items-center gap-2">✨ Навыки <span className="ml-auto text-xs font-normal text-purple-600">☑ = владение · ☑☑ = экспертиза</span></h3></div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                    {ALL_SKILLS.map(skill => {
                      const ability = SKILL_MAP[skill];
                      const isProf = char.skillProficiencies[skill];
                      const isExpert = char.skillExpertise[skill];
                      const bonus = getSkillBonus(char, skill);
                      return (
                        <div key={skill} className={`flex items-center gap-2 py-1 px-2 rounded text-sm ${isExpert ? 'bg-purple-100' : isProf ? 'bg-purple-50' : ''}`}>
                          <input type="checkbox" checked={isProf} onChange={e => updateSkillProf(skill, 'skillProficiencies', e.target.checked)} className="w-3.5 h-3.5 accent-purple-600" />
                          <input type="checkbox" checked={isExpert} onChange={e => updateSkillProf(skill, 'skillExpertise', e.target.checked)} className="w-3.5 h-3.5 accent-purple-600" disabled={!isProf} />
                          <span className="flex-1 text-xs">{skill} <span className="text-gray-400">({ability})</span></span>
                          <CalcBadge value={formatModifier(bonus)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Attacks */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">⚔️ Атаки</h3></div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr_auto] gap-2 text-xs text-gray-500 font-medium px-1"><span>Название</span><span>Бонус</span><span>Урон / Вид</span><span /></div>
                  {char.attacks.map((atk, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                      <input value={atk.name} onChange={e => updateAttack(i, 'name', e.target.value)} placeholder="Название" className={inputClass} />
                      <input value={atk.attackBonus} onChange={e => updateAttack(i, 'attackBonus', e.target.value)} placeholder="+5" className={inputClassCenter + " w-20"} />
                      <input value={atk.damageAndType} onChange={e => updateAttack(i, 'damageAndType', e.target.value)} placeholder="1d8+3 рубящий" className={inputClass} />
                      <button onClick={() => removeAttack(i)} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded hover:bg-red-50">✕</button>
                    </div>
                  ))}
                  <button onClick={addAttack} className="w-full px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100">+ Добавить атаку</button>
                </div>
              </div>

              {/* Personality */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">Личность</h3></div>
                <div className="px-4 pb-4 space-y-3">
                  {[{ label: 'Черты характера', key: 'personalityTraits' as const },{ label: 'Идеалы', key: 'ideals' as const },{ label: 'Привязанности', key: 'bonds' as const },{ label: 'Слабости', key: 'flaws' as const }].map(item => (
                    <div key={item.key} className="space-y-1"><label className="text-xs text-gray-500">{item.label}</label><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={2} className={textareaClass} /></div>
                  ))}
                </div>
              </div>

              {/* Other */}
              {[{ label: 'Прочие владения и языки', key: 'otherProficienciesLanguages' as const, rows: 3 },{ label: 'Снаряжение', key: 'equipment' as const, rows: 3 },{ label: 'Умения и особенности', key: 'featuresTraits' as const, rows: 4 }].map(item => (
                <div key={item.key} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">{item.label}</h3></div>
                  <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PAGE 2 ═══ */}
        {activeTab === 'page2' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">Физическое описание</h3></div>
              <div className="px-4 pb-4 space-y-3">
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
              <div key={item.key} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">{item.label}</h3></div>
                <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} /></div>
              </div>
            ))}
            {[{ label: 'Предыстория персонажа', key: 'backstory' as const, rows: 8 },{ label: 'Сокровища', key: 'treasure' as const, rows: 3 }].map(item => (
              <div key={item.key} className="bg-white rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
                <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">{item.label}</h3></div>
                <div className="px-4 pb-4"><textarea value={char[item.key]} onChange={e => update(item.key, e.target.value)} rows={item.rows} className={textareaClass} placeholder={item.key === 'backstory' ? 'Расскажите историю персонажа...' : ''} /></div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ PAGE 3 ═══ */}
        {activeTab === 'page3' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">📖 Параметры заклинателя</h3></div>
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatInput label="Класс заклинателя" value={char.spellcastingClass} onChange={v => update('spellcastingClass', v)} type="text" placeholder="Волшебник" />
                  <div className="space-y-1"><label className="text-xs text-gray-500">Характеристика</label>
                    <select value={char.spellcastingAbility} onChange={e => update('spellcastingAbility', e.target.value as AbilityName | '')} className="w-full h-8 px-2 text-sm border border-gray-300 rounded bg-white">
                      <option value="">— Нет —</option>
                      {ABILITY_NAMES.map(a => <option key={a} value={a}>{ABILITY_FULL[a]} ({a})</option>)}
                    </select>
                  </div>
                </div>
                {char.spellcastingAbility && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-xs text-gray-500">Сл. спасения</label><CalcBadge value={getSpellSaveDC(char)} /></div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">Бонус атаки</label><CalcBadge value={formatModifier(getSpellAttackBonus(char))} /></div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">Мод. хар-ки</label><CalcBadge value={formatModifier(getSpellAbilityMod(char))} /></div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">Ячейки заклинаний</h3></div>
              <div className="px-4 pb-4 space-y-2">
                {[1,2,3,4,5,6,7,8,9].map(lvl => {
                  const slot = char.spellSlots[lvl] || { totalSlots: 0, expendedSlots: 0 };
                  // Always show all 9 spell slot levels on the website
                  return (
                    <div key={lvl} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                      <span className="text-xs font-bold text-gray-600 w-16">{lvl} ур.</span>
                      <div className="space-y-0.5"><label className="text-[10px] text-gray-400">Всего</label><input type="number" min={0} value={slot.totalSlots} onChange={e => updateSpellSlot(lvl, 'totalSlots', Number(e.target.value) || 0)} className={inputClassCenter} /></div>
                      <div className="space-y-0.5"><label className="text-[10px] text-gray-400">Потрач.</label><input type="number" min={0} max={slot.totalSlots} value={slot.expendedSlots} onChange={e => updateSpellSlot(lvl, 'expendedSlots', Number(e.target.value) || 0)} className={inputClassCenter} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
              <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900">Заговоры (0 ур.)</h3></div>
              <div className="px-4 pb-4 space-y-2">
                {char.cantrips.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={c} onChange={e => updateCantrip(i, e.target.value)} placeholder="Название" className={inputClass + " flex-1"} />
                    <button onClick={() => removeCantrip(i)} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded hover:bg-red-50">✕</button>
                  </div>
                ))}
                <button onClick={addCantrip} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100">+ Добавить</button>
              </div>
            </div>
            {[1,2,3,4,5,6,7,8,9].map(lvl => {
              const spells = char.spellsByLevel[lvl] || [];
              // Always show all 9 spell levels on the website
              return (
                <div key={lvl} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-4 pt-4 pb-3"><h3 className="text-base font-bold text-gray-900 flex items-center gap-2">Заклинания {lvl} ур. <span className="text-xs font-normal text-gray-400">({spells.length})</span></h3></div>
                  <div className="px-4 pb-4 space-y-2">
                    {spells.map((spell, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input type="checkbox" checked={spell.prepared} onChange={e => updateSpellEntry(lvl, i, 'prepared', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                        <input value={spell.name} onChange={e => updateSpellEntry(lvl, i, 'name', e.target.value)} placeholder="Название" className={inputClass + " flex-1"} />
                        <button onClick={() => removeSpell(lvl, i)} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded hover:bg-red-50">✕</button>
                      </div>
                    ))}
                    <button onClick={() => addSpell(lvl)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100">+ Добавить</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button onClick={handleExport} className="px-8 py-3 text-base font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg flex items-center gap-2">📥 Экспортировать в DOCX</button>
        </div>
      </main>
    </div>
  );
}
