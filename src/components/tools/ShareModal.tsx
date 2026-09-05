'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CharacterData } from '@/lib/dnd-types';
import {
  ArcaneLinkIcon,
  GoldSealCheckIcon,
  MysticSpinnerIcon,
  RunedKeyIcon,
} from '@/components/dnd-icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  char: CharacterData;
  portraitUrl?: string | null;
  onOpenAuth?: () => void;
  onToast?: (title: string, description: string) => void;
}

export function ShareModal({
  isOpen,
  onClose,
  char,
  portraitUrl,
  onOpenAuth,
  onToast,
}: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const generateShareLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: char.name || 'Безымянный',
          data: char,
          portraitUrl: portraitUrl || undefined,
          expiresInDays: 30,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload?.error || 'Не удалось создать публичную ссылку');
      }

      const code = payload.code;
      const url =
        payload.url ||
        `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${code}`;

      setShareCode(code);
      setShareUrl(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка соединения';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [char, portraitUrl]);

  useEffect(() => {
    if (isOpen) {
      setCopiedUrl(false);
      setCopiedCode(false);
      generateShareLink();
    }
  }, [isOpen, generateShareLink]);

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      onToast?.('Ссылка скопирована', 'Адрес листа персонажа сохранён в буфер обмена');
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      onToast?.('Ошибка копирования', 'Скопируйте ссылку вручную из поля ввода');
    }
  };

  const handleCopyCode = async () => {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      onToast?.('Код скопирован', `${shareCode} сохранён в буфер обмена`);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      onToast?.('Ошибка копирования', 'Скопируйте код вручную');
    }
  };

  if (!isOpen) return null;

  const isAuthRequired =
    error?.toLowerCase().includes('войти в аккаунт') ||
    error?.toLowerCase().includes('авториз') ||
    error?.toLowerCase().includes('unauthorized');

  const qrImageUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        shareUrl
      )}&color=60-36-21&bgcolor=245-230-200`
    : null;

  return (
    <div
      className="parchment-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="parchment-modal w-full max-w-lg p-5 sm:p-6 my-auto text-[#3C2415] relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть модальное окно"
          className="absolute top-4 right-4 text-[#8B6914] hover:text-[#3C2415] p-1 text-lg font-bold leading-none transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#C9A84C]/40">
          <div className="p-2 rounded-md bg-[#6B3A2A]/10 border border-[#C9A84C]/50 text-[#6B3A2A]">
            <ArcaneLinkIcon size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold leading-tight text-[#3C2415] m-0 border-0 p-0">
              Поделиться персонажем
            </h2>
            <p className="text-xs text-[#8B6914] mt-0.5">
              {char.name || 'Безымянный персонаж'} • {char.race || 'Раса не указана'}{' '}
              {char.className || 'Класс'} ({char.level || 1} ур.)
            </p>
          </div>
        </div>

        {/* Modal Body */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <MysticSpinnerIcon size={36} className="text-[#6B3A2A]" />
            <p className="text-sm font-medium text-[#6B3A2A]">
              Создание магической ссылки и снимка листа...
            </p>
            <p className="text-xs text-[#8B6914]">
              Формируются данные персонажа для Мастера подземелий
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="py-4">
            <div className="p-4 rounded bg-red-900/10 border border-red-800/30 text-sm text-[#8B2500] mb-4">
              <p className="font-semibold mb-1">Не удалось создать ссылку</p>
              <p className="text-xs">{error}</p>
            </div>

            {isAuthRequired ? (
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="flex-1 parchment-btn flex items-center justify-center gap-2 py-2"
                  >
                    <RunedKeyIcon size={16} />
                    <span>Войти в аккаунт</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={generateShareLink}
                  className="flex-1 parchment-btn-secondary py-2"
                >
                  Попробовать снова
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={generateShareLink}
                className="w-full parchment-btn py-2"
              >
                Повторить попытку
              </button>
            )}
          </div>
        )}

        {shareCode && shareUrl && !loading && !error && (
          <div className="space-y-4 text-sm">
            {/* Short Code Row */}
            <div className="p-3 bg-[#EDE0C8]/60 border border-[#8B6914]/30 rounded-md flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B6914] block">
                  Короткий код для AI DM и поиска
                </span>
                <span className="font-mono font-bold text-lg text-[#3C2415] tracking-widest">
                  {shareCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="parchment-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                title="Скопировать код"
              >
                {copiedCode ? (
                  <>
                    <GoldSealCheckIcon size={14} />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <span>Скопировать код</span>
                )}
              </button>
            </div>

            {/* Direct URL Row */}
            <div>
              <label className="text-xs font-semibold text-[#8B6914] block mb-1.5">
                Публичная ссылка для просмотра (DM View)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="parchment-input-boxed flex-1 px-3 py-1.5 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="parchment-btn text-xs px-3.5 py-1.5 whitespace-nowrap flex items-center gap-1.5 shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <GoldSealCheckIcon size={14} />
                      <span>Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <ArcaneLinkIcon size={14} />
                      <span>Скопировать</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Code and DM View Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 pt-2">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-[#FDF7EC] border border-[#C9A84C]/40 rounded text-center">
                {qrImageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrImageUrl}
                    alt={`QR-код для ${char.name || 'персонажа'}`}
                    width={120}
                    height={120}
                    className="rounded shadow-sm"
                    loading="lazy"
                  />
                )}
                <span className="text-[10px] text-[#8B6914] mt-1.5 leading-tight">
                  Сканировать камерой телефона
                </span>
              </div>

              {/* Explanatory Info Card */}
              <div className="p-3 bg-[#C9A84C]/10 border border-[#C9A84C]/35 rounded text-xs space-y-1.5 flex flex-col justify-center">
                <div className="flex items-start gap-1.5">
                  <span className="text-[#6B3A2A] font-bold">👁️</span>
                  <span>
                    <strong>Режим DM:</strong> Мастер увидит все статы, спасброски, навыки, заклинания и экипировку в удобном виде.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-[#6B3A2A] font-bold">📥</span>
                  <span>
                    <strong>Импорт:</strong> Любой зритель сможет в 1 клик сохранить копию листа себе или открыть в редакторе.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-[#6B3A2A] font-bold">⏳</span>
                  <span>
                    <strong>Срок хранения:</strong> Ссылка активна в течение 30 дней.
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#8B6914]/20 flex items-center justify-between gap-2 flex-wrap">
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#6B3A2A] hover:text-[#8B2500] font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <span>Открыть страницу просмотра</span>
                <span className="text-[10px]">↗</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="parchment-btn-secondary text-xs px-4 py-1.5"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
