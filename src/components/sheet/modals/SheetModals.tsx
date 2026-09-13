'use client';

import React, { useState } from 'react';
import type { CharacterData } from '@/lib/dnd-types';
import {
  ABILITY_NAMES,
  ABILITY_FULL,
  formatModifier,
  calcModifier,
  CLASS_TEMPLATES,
} from '@/lib/dnd-types';
import type { DndSpell } from '@/data/dnd-spells';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  HourglassIcon,
  ScrollIcon,
  CrossedSwordsIcon,
  SparklesDndIcon,
  GoldSealCheckIcon,
  CrystalBallDndIcon,
  SpellbookIcon,
  EngravedShieldIcon,
  RunedKeyIcon,
  PortalIcon,
  UserHeroIcon,
  QuillIcon,
} from '@/components/dnd-icons';

// ── Level Down Confirm ──

export interface LevelDownModalProps {
  char: CharacterData;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LevelDownModal = React.memo(function LevelDownModal({
  char,
  onConfirm,
  onCancel,
}: LevelDownModalProps) {
  useEscapeKey(onCancel);
  const history = Array.isArray(char.levelHistory) ? char.levelHistory : [];
  const last = history[history.length - 1];
  const targetLevel = Math.max(1, char.level - 1);

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="parchment-modal max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#8B2500' }}>
            <HourglassIcon size={22} />
            <span>Откат до {targetLevel} уровня</span>
          </h2>
          {last ? (
            <div
              className="mb-4 p-3 rounded text-sm space-y-1.5"
              style={{ background: 'rgba(139, 37, 0, 0.06)', border: '1px solid rgba(139, 37, 0, 0.2)' }}
            >
              <p className="font-bold text-xs" style={{ color: '#8B2500' }}>
                Будут отменены изменения {last.level}-го уровня:
              </p>
              <p className="text-xs" style={{ color: '#A0522D' }}>
                • −{last.hpGained} хитов
              </p>
              {last.newSubclass && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Сброс архетипа: {last.newSubclass}
                </p>
              )}
              {last.asiAbilities && last.asiAbilities.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  •{' '}
                  {last.asiAbilities[0] === last.asiAbilities[1]
                    ? `−2 к характеристике ${ABILITY_FULL[last.asiAbilities[0]] || last.asiAbilities[0]}`
                    : `−1 к характеристикам ${last.asiAbilities.map((a) => ABILITY_FULL[a] || a).join(', ')}`}
                </p>
              )}
              {last.selectedFeat && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Отмена черты: {last.selectedFeat}
                </p>
              )}
              {last.addedTraits && last.addedTraits.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Удаление умений: {last.addedTraits.map((t) => t.name).join(', ')}
                </p>
              )}
              {last.newCantrips?.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Заговоры: {last.newCantrips.join(', ')}
                </p>
              )}
              {last.newSpells?.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Заклинания: {last.newSpells.map((s) => `${s.name} (${s.level} ур.)`).join(', ')}
                </p>
              )}
              {last.newSavingThrowProfs?.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Влад. спасбросками: {last.newSavingThrowProfs.map((a) => ABILITY_FULL[a] || a).join(', ')}
                </p>
              )}
              {last.newSkillProfs?.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Влад. навыками: {last.newSkillProfs.join(', ')}
                </p>
              )}
              {last.newSkillExpertise?.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Экспертиза: {last.newSkillExpertise.join(', ')}
                </p>
              )}
              {last.newAttacks?.length > 0 && (
                <p className="text-xs" style={{ color: '#A0522D' }}>
                  • Атаки: {last.newAttacks.map((a) => a.name).join(', ')}
                </p>
              )}
              {last.notes && (
                <p className="text-xs mt-1" style={{ color: '#8B6914' }}>
                  {last.notes}
                </p>
              )}
            </div>
          ) : (
            <div
              className="mb-4 p-3 rounded text-sm space-y-1"
              style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.4)' }}
            >
              <p className="font-bold text-xs" style={{ color: '#8B6914' }}>
                ⚠️ Запись о предыдущем уровне не найдена
              </p>
              <p className="text-xs" style={{ color: '#6B3A2A' }}>
                Персонаж будет понижен до {targetLevel} уровня, а здоровье скорректировано на среднее значение кости.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 parchment-btn-secondary py-2">
              Отмена
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 parchment-btn font-bold text-sm py-2 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(180deg, #A0522D, #8B2500)' }}
            >
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

export interface LevelHistoryModalProps {
  char: CharacterData;
  onClose: () => void;
  onClearHistory?: () => void;
  onDeleteEntry?: (index: number) => void;
}

export const LevelHistoryModal = React.memo(function LevelHistoryModal({
  char,
  onClose,
  onClearHistory,
  onDeleteEntry,
}: LevelHistoryModalProps) {
  useEscapeKey(onClose);
  const history = Array.isArray(char.levelHistory) ? char.levelHistory : [];

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="parchment-modal max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
                  if (
                    window.confirm(
                      'Очистить всю историю прокачки? (Характеристики и умения персонажа останутся)'
                    )
                  ) {
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
              <p className="font-bold text-sm" style={{ color: '#5C341F' }}>
                История прокачки пуста
              </p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: '#8B6914' }}>
                При каждом повышении уровня через кнопку «+» здесь автоматически сохраняются все выборы: здоровье, черты, характеристики, архетипы и умения.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div key={i} className="parchment-modal-section space-y-1.5 relative group">
                  <div
                    className="flex items-center justify-between border-b pb-1.5"
                    style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold font-mono"
                        style={{ background: '#5C3A6E', color: '#FBF0DC' }}
                      >
                        {entry.level} уровень
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#8B2500' }}>
                        +{entry.hpGained} HP
                      </span>
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
                      <span>
                        {entry.asiAbilities[0] === entry.asiAbilities[1]
                          ? `${ABILITY_FULL[entry.asiAbilities[0]] || entry.asiAbilities[0]} +2`
                          : entry.asiAbilities.map((a) => `${ABILITY_FULL[a] || a} +1`).join(', ')}
                      </span>
                    </p>
                  )}

                  {entry.addedTraits && entry.addedTraits.length > 0 && (
                    <div className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: '#3D2012' }}>
                      <span className="font-semibold flex items-center gap-1" style={{ color: '#5C341F' }}>
                        <GoldSealCheckIcon size={14} />
                        <span>Умения:</span>
                      </span>
                      <span>{entry.addedTraits.map((t) => t.name).join(', ')}</span>
                    </div>
                  )}

                  {entry.spellSlotsGained && Object.keys(entry.spellSlotsGained).length > 0 && (
                    <div className="text-xs flex items-center gap-1 flex-wrap" style={{ color: '#5C3A6E' }}>
                      <span className="font-semibold flex items-center gap-1">
                        <CrystalBallDndIcon size={14} />
                        <span>Ячейки:</span>
                      </span>
                      {Object.entries(entry.spellSlotsGained).map(([lvl, cnt]) => (
                        <span
                          key={lvl}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono"
                          style={{ background: '#E8D3A2', border: '1px solid #C9A84C' }}
                        >
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
                      <span>Заклинания: {entry.newSpells.map((s) => `${s.name} (${s.level} ур.)`).join(', ')}</span>
                    </p>
                  )}

                  {entry.newSavingThrowProfs?.length > 0 && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: '#8B6914' }}>
                      <EngravedShieldIcon size={14} />
                      <span>Спасброски: {entry.newSavingThrowProfs.map((a) => ABILITY_FULL[a] || a).join(', ')}</span>
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
                      <span>Атаки: {entry.newAttacks.map((a) => a.name).join(', ')}</span>
                    </p>
                  )}

                  {entry.notes && (
                    <p
                      className="text-xs mt-1 p-1.5 rounded whitespace-pre-wrap"
                      style={{ background: 'rgba(232, 211, 162, 0.4)', color: '#5C341F' }}
                    >
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t mt-4" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
            <button type="button" onClick={onClose} className="w-full parchment-btn-secondary py-2">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Non-Class Spell Confirmation Warning Modal ──

export interface NonClassSpellConfirmModalProps {
  char: CharacterData;
  spell: DndSpell;
  onConfirm: () => void;
  onCancel: () => void;
}

export function NonClassSpellConfirmModal({
  char,
  spell,
  onConfirm,
  onCancel,
}: NonClassSpellConfirmModalProps) {
  useEscapeKey(onCancel);
  const allowedClasses = (spell.classes || []).join(', ') || 'Другие классы';
  const charClass = char.className || char.spellcastingClass || 'Без класса';

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[360] flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm">
      <div
        className="parchment-modal max-w-md w-full p-5 space-y-4 shadow-2xl relative rounded-lg"
        style={{ background: '#F5E6C8', border: '3px solid #D9822B' }}
        onClick={(e) => e.stopPropagation()}
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
          <div
            className="p-2.5 rounded space-y-1.5"
            style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.3)' }}
          >
            <div className="flex justify-between">
              <span>Заклинание:</span>
              <strong className="text-[#3D2012]">
                «{spell.name}» ({spell.level === 0 ? 'Заговор' : `${spell.level} круг`})
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Доступно классам:</span>
              <strong className="text-[#A04000]">{allowedClasses}</strong>
            </div>
            <div
              className="flex justify-between border-t pt-1.5 mt-1"
              style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
            >
              <span>Ваш персонаж:</span>
              <strong className="text-[#5C341F]">
                {charClass} {char.subclass ? `(${char.subclass})` : ''}
              </strong>
            </div>
          </div>

          <p>
            В D&D 5e персонаж класса <strong>{charClass}</strong> не может изучать или готовить заклинания других классов (например, заклинания Друида, Волшебника или Барда) без соответствующего домена/покровителя, черты (например, <em>«Посвященный в магию»</em>, <em>«Фейский коснувшийся»</em>) или расового источника.
          </p>

          <div
            className="p-2 rounded text-[11px]"
            style={{ background: 'rgba(201, 168, 76, 0.2)', border: '1px dashed #C9A84C' }}
          >
            <p className="font-semibold text-[#5C341F]">💡 Добавление из внешнего источника:</p>
            <p className="opacity-90">
              Вы можете добавить это заклинание, если оно получено от свитка, магического предмета, обучения у мастера или специальной черты.
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 pt-2 border-t"
          style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}
        >
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

export interface TemplateModalProps {
  onSelect: (templateId: string) => void;
  onCancel: () => void;
}

export const TemplateModal = React.memo(function TemplateModal({
  onSelect,
  onCancel,
}: TemplateModalProps) {
  useEscapeKey(onCancel);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'martial' | 'caster' | 'hybrid'>('all');

  const template = selected ? CLASS_TEMPLATES.find((t) => t.id === selected) : null;

  const filtered = CLASS_TEMPLATES.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'martial') return !t.spellcasting.isCaster;
    if (filter === 'caster')
      return t.spellcasting.isCaster && ['Чародей', 'Волшебник', 'Колдун'].includes(t.name);
    if (filter === 'hybrid')
      return t.spellcasting.isCaster && !['Чародей', 'Волшебник', 'Колдун'].includes(t.name);
    return true;
  });

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4">
      <div
        className="parchment-modal max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <ScrollIcon size={22} />
            <span>Шаблоны классов</span>
          </h2>
          <p className="text-sm mb-4" style={{ color: '#8B6914' }}>
            Выберите класс — лист заполнится типичными данными 1-го уровня. Всё можно изменить после.
          </p>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {(
              [
                ['all', 'Все'],
                ['martial', '⚔️ Воины'],
                ['caster', '✨ Маги'],
                ['hybrid', '⚡ Гибриды'],
              ] as const
            ).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={filter === f ? 'parchment-filter-active' : 'parchment-filter-inactive'}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`parchment-template-card ${selected === t.id ? 'parchment-template-card-selected' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{t.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: '#3C2415' }}>
                    {t.name}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: '#8B6914', background: 'rgba(139, 105, 20, 0.1)' }}
                  >
                    d{t.hitDieSize}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: '#5C3A6E', background: 'rgba(92, 58, 110, 0.1)' }}
                  >
                    {t.primaryAbility}
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#8B6914' }}>
                  {t.role}
                </p>
              </button>
            ))}
          </div>

          {/* Detail preview */}
          {template && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{template.emoji}</span>
                <div>
                  <h3 className="font-bold" style={{ color: '#3C2415' }}>
                    {template.name}
                  </h3>
                  <p className="text-xs" style={{ color: '#8B6914' }}>
                    {template.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span style={{ color: '#8B6914' }}>Кость хитов:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>
                    1d{template.hitDieSize} (макс. {template.hitDieSize} + ТЕЛ на 1 ур.)
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8B6914' }}>Основная характ.:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>
                    {template.primaryAbility}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8B6914' }}>Спасброски:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>
                    {template.savingThrowProfs.map((a) => ABILITY_FULL[a]).join(', ')}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#8B6914' }}>Навыков:</span>
                  <span className="ml-1 font-medium" style={{ color: '#3C2415' }}>
                    {template.skillChoices} из {template.skillOptions.length}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>
                  Рекомендуемые навыки:
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.recommendedSkills.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(92, 58, 110, 0.1)', color: '#5C3A6E' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>
                  Характеристики (станд. массив):
                </p>
                <div className="flex gap-3 text-xs">
                  {ABILITY_NAMES.map((ab) => (
                    <div key={ab} className="text-center">
                      <div className="font-bold" style={{ color: '#3C2415' }}>
                        {template.recommendedScores[ab]}
                      </div>
                      <div className="text-[10px]" style={{ color: '#8B6914' }}>
                        {ab} ({formatModifier(calcModifier(template.recommendedScores[ab]))})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {template.spellcasting.isCaster && (
                <div>
                  <p className="text-xs mb-1" style={{ color: '#8B6914' }}>
                    Магия ({template.spellcasting.ability ? ABILITY_FULL[template.spellcasting.ability] : '—'}):
                  </p>
                  <div className="text-xs space-y-0.5" style={{ color: '#3C2415' }}>
                    <p>
                      Заговоры: {template.spellcasting.cantripsKnown} — {template.spellcasting.cantripList?.join(', ') || '—'}
                    </p>
                    {template.spellcasting.spellListAt1 && template.spellcasting.spellListAt1.length > 0 && (
                      <p>Заклинания 1 ур.: {template.spellcasting.spellListAt1.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>
                  Умения 1-го уровня:
                </p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: '#3C2415' }}>
                  {template.features}
                </p>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: '#8B6914' }}>
                  Типичное снаряжение:
                </p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: '#3C2415' }}>
                  {template.equipment}
                </p>
              </div>

              <div
                className="grid grid-cols-3 gap-2 text-xs text-center pt-1"
                style={{ borderTop: '1px solid rgba(201, 168, 76, 0.3)' }}
              >
                <div className="rounded p-1.5" style={{ background: 'rgba(139, 105, 20, 0.08)' }}>
                  <div style={{ color: '#8B6914' }}>КД</div>
                  <div className="font-bold" style={{ color: '#6B3A2A' }}>
                    {template.typicalAC}
                  </div>
                </div>
                <div className="rounded p-1.5" style={{ background: 'rgba(139, 37, 0, 0.06)' }}>
                  <div style={{ color: '#8B6914' }}>Хиты 1 ур.</div>
                  <div className="font-bold" style={{ color: '#8B2500' }}>
                    {template.hitDieSize + calcModifier(template.recommendedScores['ТЕЛ'])}
                  </div>
                </div>
                <div className="rounded p-1.5" style={{ background: 'rgba(74, 124, 63, 0.08)' }}>
                  <div style={{ color: '#8B6914' }}>Золото</div>
                  <div className="font-bold text-[10px]" style={{ color: '#4a7c3f' }}>
                    {template.startingGold}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 parchment-btn-secondary">
              Отмена
            </button>
            <button
              onClick={() => selected && onSelect(selected)}
              disabled={!selected}
              className={`flex-1 font-medium ${selected ? 'parchment-btn' : 'parchment-btn opacity-40 cursor-not-allowed'}`}
            >
              📋 Применить шаблон
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Auth Modal ──

export interface AuthModalProps {
  onClose: () => void;
  onAuth: () => void;
  onGoogleAuth: () => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  loading: boolean;
  error: string;
}

export const AuthModal = React.memo(function AuthModal({
  onClose,
  onAuth,
  onGoogleAuth,
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  loading,
  error,
}: AuthModalProps) {
  useEscapeKey(onClose);
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4">
      <div className="parchment-modal max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2
            className="text-xl font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <RunedKeyIcon size={22} />
            <span>{isSignUp ? 'Регистрация' : 'Вход в аккаунт'}</span>
          </h2>

          <button
            onClick={onGoogleAuth}
            disabled={loading}
            className="w-full parchment-btn-secondary mb-4 flex items-center justify-center gap-2 py-2.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Войти через Google
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 105, 20, 0.3)' }} />
            <span className="text-xs" style={{ color: '#8B6914' }}>
              или
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 105, 20, 0.3)' }} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAuth();
            }}
          >
            <div className="space-y-3 mb-4">
              <div className="space-y-1">
                <label className="parchment-label">Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="parchment-input"
                />
              </div>
              <div className="space-y-1">
                <label className="parchment-label">Пароль</label>
                <input
                  type="password"
                  name="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="parchment-input"
                />
              </div>
            </div>

            {error && (
              <p
                className="text-xs mb-3 p-2 rounded"
                style={{
                  color: error.includes('Проверьте') ? '#4a7c3f' : '#8B2500',
                  background: error.includes('Проверьте')
                    ? 'rgba(74,124,63,0.08)'
                    : 'rgba(139,37,0,0.06)',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full parchment-btn py-2.5 mb-3"
            >
              {loading ? 'Загрузка…' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-xs"
            style={{
              color: '#8B6914',
              fontFamily: 'Georgia, "Times New Roman", serif',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
          >
            {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Sign Out Confirmation Modal ──

export interface SignOutModalProps {
  userEmail?: string | null;
  onConfirmSignOut: () => void;
  onSwitchAccount: () => void;
  onCancel: () => void;
}

export const SignOutModal = React.memo(function SignOutModal({
  userEmail,
  onConfirmSignOut,
  onSwitchAccount,
  onCancel,
}: SignOutModalProps) {
  useEscapeKey(onCancel);
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[200] flex items-center justify-center p-4">
      <div className="parchment-modal max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
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

export interface ResetModalProps {
  onConfirm?: () => void;
  onCancel: () => void;
}

export const ResetModal = React.memo(function ResetModal({
  onConfirm,
  onCancel,
}: ResetModalProps) {
  useEscapeKey(onCancel);
  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="parchment-modal max-w-md w-full p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-lg font-bold"
          style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}
        >
          Очистить лист персонажа?
        </h3>
        <p className="text-xs" style={{ color: '#5C341F' }}>
          Все введённые данные будут сброшены к начальным значениям 1-го уровня.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="parchment-btn-secondary text-xs px-4 py-2"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="parchment-btn text-xs px-4 py-2"
          >
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Create Choice Modal ──

export interface CreateChoiceModalProps {
  onClose: () => void;
  onSelectWizard: () => void;
  onSelectManual: () => void;
}

export const CreateChoiceModal = React.memo(function CreateChoiceModal({
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
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b pb-3"
          style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}
        >
          <div className="flex items-center gap-2.5">
            <UserHeroIcon size={26} />
            <div>
              <h3
                className="text-base sm:text-lg font-bold"
                style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}
              >
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
              boxShadow: '0 2px 8px rgba(60, 36, 21, 0.15)',
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
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
              boxShadow: '0 2px 6px rgba(60, 36, 21, 0.1)',
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

        <div
          className="pt-2 border-t flex justify-end"
          style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
        >
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
