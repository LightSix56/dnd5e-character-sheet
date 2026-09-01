'use client';

import React from 'react';
import { SpellbookIcon, CrossedSwordsIcon, ScrollIcon, SparklesDndIcon } from '@/components/dnd-icons';
import type { DndSpell } from '@/data/dnd-spells';
import type { DndWeapon } from '@/data/dnd-weapons';
import type { DndTrait } from '@/data/dnd-traits';

// ── 1. SPELL DETAIL MODAL ──
interface SpellModalProps {
  spell: DndSpell | null;
  customName?: string;
  onClose: () => void;
}

export function SpellDetailModal({ spell, customName, onClose }: SpellModalProps) {
  if (!spell && !customName) return null;

  return (
    <div className="parchment-modal-overlay" onClick={onClose}>
      <div className="parchment-modal max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="parchment-modal-header flex items-center justify-between">
          <h3 className="parchment-modal-title flex items-center gap-2">
            <SpellbookIcon size={20} />
            <span>{spell?.name || customName}</span>
          </h3>
          <button onClick={onClose} className="parchment-modal-close">✕</button>
        </div>

        <div className="parchment-modal-body space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {spell ? (
            <>
              <div className="flex flex-wrap items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)' }}>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#E8D3A2', color: '#6B3A2A' }}>
                  {spell.level === 0 ? 'Заговор' : `${spell.level} круг`}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(139, 105, 20, 0.1)', color: '#8B6914' }}>
                  Школа: {spell.school}
                </span>
                {spell.concentration && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#FFE58F', color: '#5C341F', border: '1px solid #E5C158' }}>
                    ✦ Концентрация
                  </span>
                )}
                {spell.ritual && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#E6F7FF', color: '#0050B3', border: '1px solid #91CAFF' }}>
                    📜 Ритуал
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold block" style={{ color: '#8B6914' }}>Время накладывания:</span>
                  <span style={{ color: '#3D2012' }}>{spell.castingTime}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold block" style={{ color: '#8B6914' }}>Дистанция:</span>
                  <span style={{ color: '#3D2012' }}>{spell.range}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold block" style={{ color: '#8B6914' }}>Длительность:</span>
                  <span style={{ color: '#3D2012' }}>{spell.duration}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold block" style={{ color: '#8B6914' }}>Компоненты:</span>
                  <span style={{ color: '#3D2012' }}>
                    {[
                      spell.components.v ? 'В (вербальный)' : null,
                      spell.components.s ? 'С (соматический)' : null,
                      spell.components.m ? `М (${spell.components.m})` : null
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {(spell.damage || spell.save) && (
                <div className="flex flex-wrap gap-3 p-2.5 rounded text-xs" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                  {spell.damage && (
                    <div>
                      <span className="font-bold" style={{ color: '#6B3A2A' }}>Урон / эффект: </span>
                      <span className="font-mono font-bold" style={{ color: '#8B2500' }}>{spell.damage} {spell.damageType || ''}</span>
                    </div>
                  )}
                  {spell.save && (
                    <div>
                      <span className="font-bold" style={{ color: '#6B3A2A' }}>Спасбросок: </span>
                      <span style={{ color: '#3D2012' }}>{spell.save}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8B6914' }}>Описание:</h4>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {spell.description}
                </p>
              </div>

              {spell.higherLevels && (
                <div className="p-2.5 rounded space-y-1 text-xs" style={{ background: 'rgba(201, 168, 76, 0.15)', borderLeft: '3px solid #C9A84C' }}>
                  <span className="font-bold block" style={{ color: '#6B3A2A' }}>На более высоких уровнях:</span>
                  <p className="leading-relaxed" style={{ color: '#3D2012' }}>{spell.higherLevels}</p>
                </div>
              )}

              {spell.classes && spell.classes.length > 0 && (
                <div className="text-[11px] pt-2" style={{ color: '#8B6914', borderTop: '1px solid rgba(201, 168, 76, 0.25)' }}>
                  <span className="font-semibold">Классы: </span>
                  <span>{spell.classes.join(', ')}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm font-medium" style={{ color: '#3D2012' }}>
                Пользовательское заклинание <strong>«{customName}»</strong>.
              </p>
              <p className="text-xs" style={{ color: '#8B6914' }}>
                Этого заклинания нет в стандартном компендиуме SRD 5e, либо введено авторское название.
              </p>
            </div>
          )}
        </div>

        <div className="parchment-modal-footer flex justify-end">
          <button onClick={onClose} className="parchment-btn text-xs px-5 py-1.5">Закрыть</button>
        </div>
      </div>
    </div>
  );
}

// ── 2. WEAPON DETAIL MODAL ──
interface WeaponModalProps {
  weapon: DndWeapon | null;
  customName?: string;
  customBonus?: string;
  customDamage?: string;
  onClose: () => void;
}

export function WeaponDetailModal({ weapon, customName, customBonus, customDamage, onClose }: WeaponModalProps) {
  if (!weapon && !customName) return null;

  return (
    <div className="parchment-modal-overlay" onClick={onClose}>
      <div className="parchment-modal max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="parchment-modal-header flex items-center justify-between">
          <h3 className="parchment-modal-title flex items-center gap-2">
            <CrossedSwordsIcon size={20} />
            <span>{weapon?.name || customName}</span>
          </h3>
          <button onClick={onClose} className="parchment-modal-close">✕</button>
        </div>

        <div className="parchment-modal-body space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {weapon ? (
            <>
              <div className="flex flex-wrap items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)' }}>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#E8D3A2', color: '#6B3A2A' }}>
                  {weapon.category}
                </span>
                {weapon.finesse && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#FFE58F', color: '#5C341F' }}>
                    Фехтовальное (СИЛ или ЛОВ)
                  </span>
                )}
                {weapon.weight && (
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(139, 105, 20, 0.1)', color: '#8B6914' }}>
                    Вес: {weapon.weight}
                  </span>
                )}
                {weapon.cost && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#FFFBE6', color: '#B58900', border: '1px solid #FFE58F' }}>
                    Цена: {weapon.cost}
                  </span>
                )}
              </div>

              <div className="p-3 rounded space-y-1.5 text-xs" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: '#6B3A2A' }}>Базовый урон оружия:</span>
                  <span className="font-mono font-bold text-sm" style={{ color: '#8B2500' }}>
                    {weapon.damageDice} {weapon.damageType}
                  </span>
                </div>
                {weapon.versatileDice && (
                  <div className="flex justify-between items-center text-xs" style={{ color: '#8B6914' }}>
                    <span>В двух руках (универсальное):</span>
                    <span className="font-mono font-bold">{weapon.versatileDice} {weapon.damageType}</span>
                  </div>
                )}
                {weapon.rangeNormal && (
                  <div className="flex justify-between items-center text-xs" style={{ color: '#8B6914' }}>
                    <span>Дистанция стрельбы/метания:</span>
                    <span>{weapon.rangeNormal} / {weapon.rangeLong} фт.</span>
                  </div>
                )}
              </div>

              {weapon.properties.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8B6914' }}>Свойства оружия:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {weapon.properties.map((prop, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#F0DEB4', color: '#3D2012', border: '1px solid rgba(201, 168, 76, 0.5)' }}>
                        {prop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8B6914' }}>Описание:</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {weapon.description}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded space-y-1.5 text-xs" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: '#6B3A2A' }}>Атака:</span>
                  <span className="font-bold text-sm" style={{ color: '#3D2012' }}>{customName}</span>
                </div>
                {customBonus && (
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: '#8B6914' }}>Бонус к броску атаки:</span>
                    <span className="font-mono font-bold" style={{ color: '#6B3A2A' }}>{customBonus}</span>
                  </div>
                )}
                {customDamage && (
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: '#8B6914' }}>Формула урона:</span>
                    <span className="font-mono font-bold" style={{ color: '#8B2500' }}>{customDamage}</span>
                  </div>
                )}
              </div>
              <p className="text-xs" style={{ color: '#8B6914' }}>
                Пользовательская или зачарованная атака. Поддерживает составные формулы урона (например, <code>1d8+3 колющий + 1d6 огненный</code>).
              </p>
            </div>
          )}
        </div>

        <div className="parchment-modal-footer flex justify-end">
          <button onClick={onClose} className="parchment-btn text-xs px-5 py-1.5">Закрыть</button>
        </div>
      </div>
    </div>
  );
}

// ── 3. TRAIT / FEATURE DETAIL MODAL ──
interface TraitModalProps {
  trait: DndTrait | null;
  customName?: string;
  customSource?: string;
  customSummary?: string;
  customDescription?: string;
  onSaveDescription?: (desc: string) => void;
  onClose: () => void;
}

export function TraitDetailModal({
  trait,
  customName,
  customSource,
  customSummary,
  customDescription,
  onSaveDescription,
  onClose
}: TraitModalProps) {
  const [editDesc, setEditDesc] = React.useState(customDescription || trait?.description || '');
  const isCustom = !trait;

  if (!trait && !customName) return null;

  return (
    <div className="parchment-modal-overlay" onClick={onClose}>
      <div className="parchment-modal max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="parchment-modal-header flex items-center justify-between">
          <h3 className="parchment-modal-title flex items-center gap-2">
            <SparklesDndIcon size={20} />
            <span>{trait?.name || customName}</span>
          </h3>
          <button onClick={onClose} className="parchment-modal-close">✕</button>
        </div>

        <div className="parchment-modal-body space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)' }}>
            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#E8D3A2', color: '#6B3A2A' }}>
              {trait?.source || customSource || 'Умение'}
            </span>
            {trait?.category && (
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(139, 105, 20, 0.1)', color: '#8B6914' }}>
                {trait.category}
              </span>
            )}
          </div>

          {(trait?.summary || customSummary) && (
            <div className="p-2.5 rounded text-xs font-medium" style={{ background: 'rgba(232, 211, 162, 0.35)', borderLeft: '3px solid #C9A84C', color: '#5C341F' }}>
              {trait?.summary || customSummary}
            </div>
          )}

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8B6914' }}>Полное описание правила:</h4>
            {trait ? (
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {trait.description}
              </p>
            ) : (
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Введите подробное описание умения или особенности..."
                rows={5}
                className="w-full text-xs p-2 rounded parchment-textarea"
              />
            )}
          </div>
        </div>

        <div className="parchment-modal-footer flex justify-end gap-2">
          {isCustom && onSaveDescription && (
            <button
              onClick={() => {
                onSaveDescription(editDesc);
                onClose();
              }}
              className="parchment-btn text-xs px-4 py-1.5"
            >
              Сохранить
            </button>
          )}
          <button onClick={onClose} className="parchment-btn-secondary text-xs px-4 py-1.5">Закрыть</button>
        </div>
      </div>
    </div>
  );
}
