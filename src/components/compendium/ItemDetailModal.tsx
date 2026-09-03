'use client';

import React from 'react';
import { BackpackPackIcon, EngravedShieldIcon, CrossedSwordsIcon } from '@/components/dnd-icons';
import type { CompendiumItem } from '@/data/compendium/items';

interface ItemDetailModalProps {
  item: CompendiumItem | null;
  onEquipArmor?: (armorName: string) => void;
  onToggleShield?: (hasShield: boolean) => void;
  onClose: () => void;
}

export function ItemDetailModal({ item, onEquipArmor, onToggleShield, onClose }: ItemDetailModalProps) {
  if (!item) return null;

  const isArmor = item.category === 'Доспех';
  const isShield = item.category === 'Щит';
  const isWeapon = item.category === 'Оружие';

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div
        className="parchment-modal max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative rounded-lg"
        style={{
          background: '#F5E6C8',
          border: '3px solid #C9A84C',
          boxShadow: '0 12px 48px rgba(30, 15, 8, 0.6)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
          <div className="flex items-center gap-2">
            {isArmor || isShield ? <EngravedShieldIcon size={22} /> : isWeapon ? <CrossedSwordsIcon size={22} /> : <BackpackPackIcon size={22} />}
            <h3 className="text-base sm:text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {item.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[65vh]">
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold" style={{ background: '#E8D3A2', color: '#5C341F', border: '1px solid #C9A84C' }}>
              {item.subcategory || item.category}
            </span>
            {item.nameEn && (
              <span className="text-xs font-semibold" style={{ color: '#8B6914' }}>
                {item.nameEn}
              </span>
            )}
            {item.cost && (
              <span className="px-2 py-0.5 rounded text-xs font-bold ml-auto" style={{ background: '#FFFBE6', color: '#B58900', border: '1px solid #FFE58F' }}>
                {item.cost}
              </span>
            )}
            {item.weight && (
              <span className="text-xs" style={{ color: '#8B6914' }}>
                Вес: {item.weight}
              </span>
            )}
          </div>

          {/* Armor stats */}
          {item.armor && (
            <div className="p-3 rounded space-y-1.5 text-xs" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.5)' }}>
              <div className="flex justify-between items-center">
                <span className="font-bold" style={{ color: '#6B3A2A' }}>Базовый Класс Доспеха (КД):</span>
                <span className="font-mono font-bold text-sm" style={{ color: '#8B2500' }}>
                  {item.armor.baseAC}
                  {item.armor.dexBonus && (item.armor.maxDexBonus ? ' + мод. ЛОВ (макс. +2)' : ' + мод. ЛОВ')}
                </span>
              </div>
              {item.armor.strMinimum && item.armor.strMinimum > 0 ? (
                <div className="flex justify-between items-center text-xs" style={{ color: '#8B6914' }}>
                  <span>Требование к Силе:</span>
                  <span className="font-bold">СИЛ {item.armor.strMinimum}</span>
                </div>
              ) : null}
              {item.armor.stealthDisadvantage && (
                <div className="text-xs font-bold text-amber-900">
                  ⚠️ Накладывает помеху на проверки Скрытности
                </div>
              )}
            </div>
          )}

          {/* Weapon stats */}
          {item.weapon && (
            <div className="p-3 rounded space-y-1.5 text-xs" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.5)' }}>
              <div className="flex justify-between items-center">
                <span className="font-bold" style={{ color: '#6B3A2A' }}>Урон:</span>
                <span className="font-mono font-bold text-sm" style={{ color: '#8B2500' }}>
                  {item.weapon.damageDice} {item.weapon.damageType}
                </span>
              </div>
              {item.weapon.properties.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.weapon.properties.map((p, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[11px] font-medium" style={{ background: '#F0DEB4', color: '#3D2012', border: '1px solid rgba(201, 168, 76, 0.5)' }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8B6914' }}>Описание:</h4>
            <p className="text-xs leading-relaxed" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {item.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 flex justify-between items-center border-t" style={{ borderColor: 'rgba(201, 168, 76, 0.4)', background: 'rgba(232, 211, 162, 0.2)' }}>
          <div>
            {isArmor && onEquipArmor && (
              <button
                onClick={() => {
                  onEquipArmor(item.name);
                  onClose();
                }}
                className="parchment-btn text-xs px-4 py-1.5 font-bold"
              >
                Надеть этот доспех
              </button>
            )}
            {isShield && onToggleShield && (
              <button
                onClick={() => {
                  onToggleShield(true);
                  onClose();
                }}
                className="parchment-btn text-xs px-4 py-1.5 font-bold"
              >
                Экипировать щит (+2 КД)
              </button>
            )}
          </div>
          <button onClick={onClose} className="parchment-btn-secondary text-xs px-5 py-1.5">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
