'use client';

import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  D20Icon,
  UserHeroIcon,
  ScrollIcon,
  CrossedSwordsIcon,
  SpellbookIcon,
  ChestIcon,
  MysticCloudIcon,
  MysticSpinnerIcon,
  GoldSealCheckIcon,
  PortalIcon,
  RunedKeyIcon,
  ArcaneLinkIcon,
  QuillIcon,
  HourglassIcon,
  WarningSignIcon,
  ParchmentMenuIcon,
} from '@/components/dnd-icons';

export interface SheetHeaderProps {
  user: User | null;
  cloudSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  cloudSaveError: string | null;
  isExportingPdf: boolean;
  onOpenCreateChoice: () => void;
  onOpenEquipmentModal: () => void;
  onExportPdf: () => void;
  onOpenTemplates: () => void;
  onSaveJSON: () => void;
  onLoadJSON: () => void;
  onSaveAsNew: () => void;
  onReset: () => void;
  onCloudSave: () => void;
  onCloudLoad: () => void;
  onShare: () => void;
  onOpenSignOut: () => void;
  onOpenAuth: () => void;
  onExportDocx: () => void;
  onStartTour: () => void;
  onOpenEncyclopedia: (chapterId?: string) => void;
}

export const SheetHeader = React.memo(function SheetHeader({
  user,
  cloudSaveStatus,
  cloudSaveError,
  isExportingPdf,
  onOpenCreateChoice,
  onOpenEquipmentModal,
  onExportPdf,
  onOpenTemplates,
  onSaveJSON,
  onLoadJSON,
  onSaveAsNew,
  onReset,
  onCloudSave,
  onCloudLoad,
  onShare,
  onOpenSignOut,
  onOpenAuth,
  onExportDocx,
  onStartTour,
  onOpenEncyclopedia,
}: SheetHeaderProps) {
  const [showSheetMenu, setShowSheetMenu] = useState(false);
  const [showGuideMenu, setShowGuideMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  React.useEffect(() => {
    if (!showSheetMenu && !showGuideMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSheetMenu(false);
        setShowGuideMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSheetMenu, showGuideMenu]);

  return (
    <header className="sticky top-0 z-50 parchment-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <D20Icon size={28} />
          <div>
            <h1 className="text-base sm:text-lg font-bold leading-tight">Лист персонажа D&D 5e</h1>
            <p className="text-[11px] leading-tight text-amber-100/70">Интерактивный бланк для игры</p>
          </div>
        </div>

        {/* Desktop Toolbar (visible on md screens and up) */}
        <div className="hidden md:flex parchment-toolbar">
          {/* Create Character group */}
          <div className="parchment-btn-group">
            <button
              type="button"
              onClick={onOpenCreateChoice}
              className="parchment-header-btn flex items-center gap-1.5 font-bold"
              title="Создать персонажа: Интерактивный мастер или чистый бланк"
              style={{
                background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.4) 0%, rgba(139, 105, 20, 0.3) 100%)',
                border: '1px solid #C9A84C',
                color: '#FFF8EB',
              }}
            >
              <UserHeroIcon size={16} />
              <span>Создать персонажа</span>
            </button>
          </div>

          {/* Onboarding & Guide Dropdown */}
          <div className="relative">
            <div className="parchment-btn-group">
              <button
                type="button"
                onClick={() => setShowGuideMenu((prev) => !prev)}
                className="parchment-header-btn flex items-center gap-1.5 font-semibold"
                title="Обучение D&D 5e: Тур по листу и Энциклопедия правил"
                aria-expanded={showGuideMenu}
              >
                <ScrollIcon size={16} />
                <span>Обучение D&D</span>
                <span className="text-[10px] opacity-75">▾</span>
              </button>
            </div>

            {showGuideMenu && (
              <>
                <div
                  className="fixed inset-0 z-[110]"
                  onClick={() => setShowGuideMenu(false)}
                />
                <div
                  className="absolute left-0 top-full mt-1.5 w-60 parchment-menu-dropdown z-[120] py-1.5 rounded shadow-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuideMenu(false);
                      onStartTour();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <D20Icon size={16} />
                    <div>
                      <div className="font-bold">🎯 Экскурсия по листу</div>
                      <div className="text-[10px] text-[#8B6914]">Интерактивный тур за 2 минуты</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuideMenu(false);
                      onOpenEncyclopedia();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <ScrollIcon size={16} />
                    <div>
                      <div className="font-bold">📖 Большая Энциклопедия</div>
                      <div className="text-[10px] text-[#8B6914]">7 глав правил, ДМ и разбор цифр</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sheet Actions Dropdown Menu */}
          <div className="relative">
            <div className="parchment-btn-group">
              <button
                type="button"
                onClick={() => setShowSheetMenu((prev) => !prev)}
                className="parchment-header-btn flex items-center gap-1.5 font-semibold"
                title="Управление бланком (шаблоны, JSON, сброс)"
                aria-expanded={showSheetMenu}
              >
                <ScrollIcon size={16} />
                <span>Бланк</span>
                <span className="text-[10px] opacity-75">▾</span>
              </button>
            </div>

            {showSheetMenu && (
              <>
                <div
                  className="fixed inset-0 z-[110]"
                  onClick={() => setShowSheetMenu(false)}
                />
                <div
                  className="absolute left-0 top-full mt-1.5 w-52 parchment-menu-dropdown z-[120] py-1.5 rounded shadow-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowSheetMenu(false);
                      onOpenEquipmentModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <CrossedSwordsIcon size={14} />
                    <span>Экипировка (кукла)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSheetMenu(false);
                      onExportPdf();
                    }}
                    disabled={isExportingPdf}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <ScrollIcon size={14} />
                    <span>{isExportingPdf ? 'Создание PDF…' : 'Печать PDF (5 стр.)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSheetMenu(false);
                      onOpenTemplates();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <ScrollIcon size={14} />
                    <span>Готовые шаблоны</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSheetMenu(false);
                      onSaveJSON();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <SpellbookIcon size={14} />
                    <span>Сохранить в JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSheetMenu(false);
                      onLoadJSON();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <ChestIcon size={14} />
                    <span>Загрузить из JSON</span>
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSheetMenu(false);
                        onSaveAsNew();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#3D2012] hover:bg-[#C9A84C]/20 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <MysticCloudIcon size={14} />
                      <span>Сохранить как копию</span>
                    </button>
                  )}
                  <div className="my-1 border-t border-[#C9A84C]/30" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowSheetMenu(false);
                      onReset();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#8B2500] hover:bg-[#8B2500]/10 flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    <HourglassIcon size={14} />
                    <span>Сбросить бланк</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Cloud / Auth group */}
          {user ? (
            <div className="parchment-btn-group">
              <button
                type="button"
                onClick={onCloudSave}
                className={`parchment-header-btn min-w-[110px] xl:min-w-[128px] inline-flex items-center justify-center gap-1.5 text-center ${
                  cloudSaveStatus === 'error' ? 'text-amber-800' : ''
                }`}
                title={
                  cloudSaveStatus === 'error'
                    ? `Ошибка: ${cloudSaveError || 'Сбой связи с БД. Нажмите для повтора'}`
                    : cloudSaveStatus === 'saving'
                    ? 'Сохранение в базу данных…'
                    : cloudSaveStatus === 'saved'
                    ? 'Все изменения сохранены в облаке (нажмите для ручного сохранения)'
                    : 'Синхронизировать с базой данных'
                }
              >
                {cloudSaveStatus === 'saving' ? (
                  <>
                    <MysticSpinnerIcon size={15} />
                    <span>Сохранение…</span>
                  </>
                ) : cloudSaveStatus === 'error' ? (
                  <>
                    <WarningSignIcon size={15} />
                    <span className="text-amber-800 font-semibold text-xs">Повторить</span>
                  </>
                ) : cloudSaveStatus === 'saved' ? (
                  <>
                    <GoldSealCheckIcon size={15} />
                    <span>Сохранено</span>
                  </>
                ) : (
                  <>
                    <MysticCloudIcon size={15} />
                    <span>Сохранить</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCloudLoad}
                className="parchment-header-btn flex items-center gap-1.5"
                title="Список сохранённых персонажей"
              >
                <MysticCloudIcon size={16} />
                <span>Персонажи</span>
              </button>
              <button
                type="button"
                onClick={onShare}
                className="parchment-header-btn flex items-center gap-1.5"
                title="Поделиться ссылкой с Мастером (DM)"
              >
                <ArcaneLinkIcon size={16} />
                <span>Поделиться</span>
              </button>
              <button
                type="button"
                onClick={onOpenSignOut}
                className="parchment-header-btn flex items-center gap-1.5"
                title="Выйти из аккаунта или сменить пользователя"
              >
                <PortalIcon size={16} />
                <span>
                  Выйти<span className="hidden xl:inline"> из аккаунта</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="parchment-btn-group">
              <button
                type="button"
                onClick={onCloudLoad}
                className="parchment-header-btn flex items-center gap-1.5"
                title="Список сохранённых персонажей"
              >
                <MysticCloudIcon size={16} />
                <span>Персонажи</span>
              </button>
              <button
                type="button"
                onClick={onShare}
                className="parchment-header-btn flex items-center gap-1.5"
                title="Поделиться ссылкой с Мастером (DM)"
              >
                <ArcaneLinkIcon size={16} />
                <span>Поделиться</span>
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="parchment-header-btn flex items-center gap-1.5"
                title="Вход в аккаунт для облачного сохранения"
              >
                <RunedKeyIcon size={16} />
                <span>Войти</span>
              </button>
            </div>
          )}

          {/* Primary export buttons */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="parchment-header-btn-primary flex items-center gap-1.5"
            title="Скачать официальный интерактивный PDF-бланк D&D 5e на русском языке (3 страницы бланка + Кодекс способностей и черт)"
          >
            {isExportingPdf ? <MysticSpinnerIcon size={16} /> : <ScrollIcon size={16} />}
            <span>{isExportingPdf ? 'Создание PDF…' : 'Печать PDF'}</span>
          </button>
          <button
            type="button"
            onClick={onExportDocx}
            className="parchment-header-btn flex items-center gap-1.5"
            title="Экспортировать лист персонажа в файл Word"
          >
            <QuillIcon size={16} />
            <span>DOCX</span>
          </button>
        </div>

        {/* Mobile Toolbar (visible only on mobile screens < md) */}
        <div className="parchment-mobile-bar flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateChoice}
            className="parchment-header-btn flex items-center gap-1.5 text-xs px-2.5 py-1.5 font-bold shadow-sm"
            style={{
              background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.45) 0%, rgba(139, 105, 20, 0.35) 100%)',
              border: '1px solid #C9A84C',
              color: '#FFF8EB',
            }}
            title="Создать персонажа"
          >
            <UserHeroIcon size={14} />
            <span>+ Герой</span>
          </button>

          {user && (
            <button
              type="button"
              onClick={onCloudSave}
              className="parchment-header-btn p-1.5 flex items-center justify-center"
              title={
                cloudSaveStatus === 'error'
                  ? `Ошибка: ${cloudSaveError || 'Сбой связи с БД. Нажмите для повтора'}`
                  : 'Синхронизировать с базой данных'
              }
            >
              {cloudSaveStatus === 'saving' ? (
                <MysticSpinnerIcon size={16} />
              ) : cloudSaveStatus === 'error' ? (
                <WarningSignIcon size={16} />
              ) : cloudSaveStatus === 'saved' ? (
                <GoldSealCheckIcon size={16} />
              ) : (
                <MysticCloudIcon size={16} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="parchment-header-btn flex items-center gap-1 text-xs px-2.5 py-1.5 font-bold"
            style={{
              background: showMobileMenu ? 'rgba(201, 168, 76, 0.3)' : 'rgba(30, 16, 10, 0.6)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
            }}
            aria-label="Меню листа персонажа"
          >
            <ParchmentMenuIcon size={16} />
            <span>Меню</span>
          </button>
        </div>
      </div>

      {/* Mobile Action Drawer Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-[150] parchment-modal-overlay bg-black/60 backdrop-blur-xs flex flex-col justify-start pt-14 px-3 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="parchment-mobile-drawer w-full max-w-sm mx-auto p-4 rounded-xl shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#C9A84C]/40 pb-2">
              <span className="font-bold text-sm text-[#3D2012] flex items-center gap-1.5">
                <D20Icon size={16} />
                <span>Меню персонажа</span>
              </span>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="parchment-remove-btn w-6 h-6 flex items-center justify-center font-bold text-xs"
                title="Закрыть меню"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onExportPdf();
                }}
                disabled={isExportingPdf}
                className="parchment-btn flex items-center gap-2 p-2.5 text-xs justify-start font-bold col-span-2"
                title="Скачать официальный интерактивный PDF-бланк D&D 5e (5 страниц)"
              >
                {isExportingPdf ? <MysticSpinnerIcon size={15} /> : <ScrollIcon size={15} />}
                <span>{isExportingPdf ? 'Создание PDF…' : 'Печать официального PDF (5 стр.)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenEquipmentModal();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start col-span-2 font-bold"
                style={{
                  background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.3) 0%, rgba(139, 105, 20, 0.2) 100%)',
                  border: '1px solid #C9A84C',
                }}
              >
                <CrossedSwordsIcon size={15} />
                <span>Экипировка (кукла снаряжения)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onStartTour();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <D20Icon size={15} />
                <span>🎯 Экскурсия по листу</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenEncyclopedia();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <ScrollIcon size={15} />
                <span>📖 Энциклопедия правил</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenTemplates();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <ScrollIcon size={15} />
                <span>Шаблоны</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onExportDocx();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <QuillIcon size={15} />
                <span>Экспорт DOCX</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onSaveJSON();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <SpellbookIcon size={15} />
                <span>Скачать JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onLoadJSON();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <ChestIcon size={15} />
                <span>Импорт JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onCloudLoad();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <MysticCloudIcon size={15} />
                <span>Персонажи</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onShare();
                }}
                className="parchment-btn-secondary flex items-center gap-2 p-2.5 text-xs justify-start"
              >
                <ArcaneLinkIcon size={15} />
                <span>Поделиться</span>
              </button>
            </div>

            <div className="border-t border-[#C9A84C]/30 pt-2 flex items-center justify-between gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenSignOut();
                  }}
                  className="text-xs text-[#8B2500] hover:underline flex items-center gap-1.5 py-1.5"
                >
                  <PortalIcon size={14} />
                  <span>Выйти ({user.email?.split('@')[0]})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenAuth();
                  }}
                  className="text-xs text-[#3D2012] font-semibold hover:underline flex items-center gap-1.5 py-1.5"
                >
                  <RunedKeyIcon size={14} />
                  <span>Войти в аккаунт</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onReset();
                }}
                className="text-xs text-[#8B2500]/80 hover:underline flex items-center gap-1 py-1.5"
              >
                <HourglassIcon size={13} />
                <span>Сброс</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
