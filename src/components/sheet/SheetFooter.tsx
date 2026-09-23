'use client';

import React from 'react';
import { QuillIcon, ScrollIcon } from '@/components/dnd-icons';

export interface SheetFooterProps {
  onExportDocx: () => void;
}

export const SheetFooter = React.memo(function SheetFooter({
  onExportDocx,
}: SheetFooterProps) {
  return (
    <>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onExportDocx}
          className="parchment-btn text-base px-8 py-3 shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <QuillIcon size={20} />
          <span>Экспортировать в DOCX</span>
        </button>
      </div>

      {/* ═══ FAQ & Mechanics Reference Section ═══ */}
      <section className="parchment-faq-section" aria-label="Справочник по листу персонажа D&D 5e">
        <h2 className="parchment-heading text-base sm:text-lg mb-3 flex items-center gap-2">
          <ScrollIcon size={22} />
          <span>Справочник и частые вопросы</span>
        </h2>
        <div className="space-y-2">
          <details className="parchment-faq-item" open>
            <summary>Как рассчитываются характеристики и модификаторы?</summary>
            <p>
              Модификатор характеристики вычисляется по формуле 5-й редакции: <code>(Значение − 10) / 2</code> с округлением вниз. Лист автоматически суммирует базовое значение, расовый бонус и прибавки от уровней (ASI), пересчитывая спасброски, навыки, пассивную внимательность и класс доспеха.
            </p>
          </details>
          <details className="parchment-faq-item">
            <summary>Как работают броски кубиков (d20)?</summary>
            <p>
              Любой бейдж с модификатором (проверка характеристики, спасбросок, навык, инициатива, атака заклинанием) кликабелен. По клику выполняется криптографически равномерный бросок <code>d20 + модификатор</code> с отображением критического успеха (20) или провала (1).
            </p>
          </details>
          <details className="parchment-faq-item">
            <summary>Как устроено повышение и откат уровня?</summary>
            <p>
              Кнопки «+» и «−» возле уровня открывают пошаговый мастер. При повышении уровня рассчитывается прирост хитов (среднее или бросок кости хитов с модификатором ТЕЛ, минимум +1), распределяются очки характеристик (ASI) на ключевых уровнях (4, 8, 12, 16, 19) и добавляются заклинания. Полная история изменений сохраняется и позволяет корректно откатить персонажа назад.
            </p>
          </details>
          <details className="parchment-faq-item">
            <summary>Что входит в экспортируемый DOCX-документ?</summary>
            <p>
              При нажатии «Экспорт DOCX» формируется трёхстраничный файл Microsoft Word: 1-я страница — основные боевые параметры, навыки и снаряжение; 2-я страница — внешность, портрет и предыстория; 3-я страница — ячейки и книга заклинаний с параметрами заклинателя.
            </p>
          </details>
          <details className="parchment-faq-item">
            <summary>Как сохранить и перенести персонажа?</summary>
            <p>
              Все данные сохраняются локально в вашем браузере. Вы можете экспортировать персонажа в файл JSON для резервной копии или пересылки, а при входе в аккаунт — синхронизировать персонажей через облако Supabase и создавать публичные коды для импорта в AI Dungeon Master.
            </p>
          </details>
        </div>
      </section>

      <footer className="parchment-footer">
        <p>Лист персонажа D&D 5e · Совместимо с правилами 5-й редакции Dungeons & Dragons (SRD 5.1)</p>
      </footer>
    </>
  );
});
