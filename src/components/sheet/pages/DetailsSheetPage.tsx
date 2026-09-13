'use client';

import React from 'react';
import type { CharacterData, BaseGenderChoice } from '@/lib/dnd-types';
import { resolveCharacterGender, parseCharacterGender } from '@/lib/dnd-types';
import { StatInput, textareaClass } from '@/components/sheet/SheetUIPrimitives';
import {
  UserHeroIcon,
  ArcaneLinkIcon,
  SparklesDndIcon,
  ScrollIcon,
  CoinsChestIcon,
  CameraPortraitIcon,
} from '@/components/dnd-icons';

export interface DetailsSheetPageProps {
  char: CharacterData;
  update: <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => void;
  portraitUrl: string | null;
  setPortraitUrl: (url: string | null) => void;
  handlePortraitUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DetailsSheetPage = React.memo(function DetailsSheetPage({
  char,
  update,
  portraitUrl,
  setPortraitUrl,
  handlePortraitUpload,
}: DetailsSheetPageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="parchment-card">
        <div className="px-4 pt-4 pb-3">
          <h3 className="parchment-heading flex items-center gap-2">
            <UserHeroIcon size={20} />
            <span>Физическое описание</span>
          </h3>
        </div>
        <div className="px-4 pb-4 space-y-3">
          {/* Portrait */}
          <div className="mb-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {portraitUrl ? (
                  <div
                    className="relative w-24 h-24 rounded"
                    style={{ border: '2px solid rgba(139, 105, 20, 0.4)', overflow: 'hidden' }}
                  >
                    <label className="w-full h-full cursor-pointer block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={portraitUrl}
                        alt="Портрет"
                        width={144}
                        height={176}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <input type="file" accept="image/*" onChange={handlePortraitUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPortraitUrl(null)}
                      className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-[10px] cursor-pointer"
                      style={{
                        background: 'rgba(139, 37, 0, 0.7)',
                        color: '#FBF0DC',
                        border: 'none',
                        borderRadius: '0 0 0 3px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    className="w-24 h-24 flex flex-col items-center justify-center cursor-pointer rounded gap-1"
                    style={{
                      border: '2px dashed rgba(139, 105, 20, 0.3)',
                      background: 'rgba(251, 240, 220, 0.3)',
                    }}
                  >
                    <CameraPortraitIcon size={24} />
                    <span className="text-[10px] text-center px-1" style={{ color: '#8B6914' }}>
                      Загрузить портрет
                    </span>
                    <input type="file" accept="image/*" onChange={handlePortraitUpload} className="hidden" />
                  </label>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <label className="parchment-label">Внешность (описание)</label>
                <textarea
                  value={char.appearance}
                  onChange={(e) => update('appearance', e.target.value)}
                  rows={4}
                  className={textareaClass}
                  placeholder="Опишите внешность персонажа: цвет волос, глаз, отличительные черты…"
                />
              </div>
            </div>
            {!portraitUrl && (
              <label
                className="mt-2 inline-flex items-center gap-1 cursor-pointer text-xs"
                style={{ color: '#8B6914' }}
              >
                <input type="file" accept="image/*" onChange={handlePortraitUpload} className="hidden" />
                + Добавить картинку
              </label>
            )}
          </div>
          {/* Physical Attributes */}
          {(() => {
            const { baseChoice, customText } = parseCharacterGender(char.gender);
            return (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="parchment-label text-xs">Пол</label>
                  <div className="flex gap-2">
                    <select
                      value={baseChoice}
                      onChange={(e) => {
                        const newBase = e.target.value as BaseGenderChoice;
                        update('gender', resolveCharacterGender(newBase, customText));
                      }}
                      className="parchment-select text-xs py-1.5 px-2.5 min-w-[130px]"
                    >
                      <option value="Мужской">♂ Мужской</option>
                      <option value="Женский">♀ Женский</option>
                      <option value="Другой">⚧ Другой</option>
                    </select>
                    {baseChoice === 'Другой' && (
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => {
                          update('gender', resolveCharacterGender('Другой', e.target.value));
                        }}
                        placeholder="Укажите пол (например, Бесполый, Конструкт)…"
                        className="parchment-input-boxed text-xs py-1.5 px-2.5 flex-1"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <StatInput label="Возраст" value={char.age} onChange={(v) => update('age', v)} type="text" />
                  <StatInput label="Рост" value={char.height} onChange={(v) => update('height', v)} type="text" />
                  <StatInput label="Вес" value={char.weight} onChange={(v) => update('weight', v)} type="text" />
                </div>
              </div>
            );
          })()}
          <div className="grid grid-cols-3 gap-3">
            <StatInput label="Глаза" value={char.eyes} onChange={(v) => update('eyes', v)} type="text" />
            <StatInput label="Кожа" value={char.skin} onChange={(v) => update('skin', v)} type="text" />
            <StatInput label="Волосы" value={char.hair} onChange={(v) => update('hair', v)} type="text" />
          </div>
        </div>
      </div>
      {[
        { label: 'Внешность', key: 'appearance' as const, rows: 5, icon: <UserHeroIcon size={18} /> },
        {
          label: 'Союзники и организации',
          key: 'alliesOrganizations' as const,
          rows: 5,
          icon: <ArcaneLinkIcon size={18} />,
        },
        {
          label: 'Доп. умения и особенности',
          key: 'additionalFeaturesTraits' as const,
          rows: 5,
          icon: <SparklesDndIcon size={18} />,
        },
      ].map((item) => (
        <div key={item.key} className="parchment-card">
          <div className="px-4 pt-4 pb-3">
            <h3 className="parchment-heading flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </h3>
          </div>
          <div className="px-4 pb-4">
            <textarea
              value={char[item.key]}
              onChange={(e) => update(item.key, e.target.value)}
              rows={item.rows}
              className={textareaClass}
            />
          </div>
        </div>
      ))}
      {[
        { label: 'Предыстория персонажа', key: 'backstory' as const, rows: 8, icon: <ScrollIcon size={18} /> },
        { label: 'Сокровища', key: 'treasure' as const, rows: 3, icon: <CoinsChestIcon size={18} /> },
      ].map((item) => (
        <div key={item.key} className="parchment-card lg:col-span-2">
          <div className="px-4 pt-4 pb-3">
            <h3 className="parchment-heading flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </h3>
          </div>
          <div className="px-4 pb-4">
            <textarea
              value={char[item.key]}
              onChange={(e) => update(item.key, e.target.value)}
              rows={item.rows}
              className={textareaClass}
              placeholder={item.key === 'backstory' ? 'Расскажите историю персонажа…' : ''}
            />
          </div>
        </div>
      ))}
    </div>
  );
});
