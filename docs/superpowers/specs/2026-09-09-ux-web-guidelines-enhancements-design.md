# Спецификация: Улучшение UX, доступности и веб-стандартов D&D 5e Character Sheet

**Дата:** 2026-09-09  
**Тема:** Реализация рекомендаций Web Interface Guidelines (кроме `aria-label` для скринридеров)  
**Статус:** Утверждено пользователем  

---

## 1. Цели и задачи

Устранить проблемы эргономики, мобильного взаимодействия и клавиатурного управления в приложении `dnd5e-character-sheet`, выявленные в ходе аудита по стандарту Web Interface Guidelines:
1. **Кликабельные зоны (Hit Targets):** Сделать названия навыков и характеристик активными для переключения чекбоксов; связать `<label>` с инпутами через `htmlFor` / `id`.
2. **Закрытие по Escape и броски d20 с клавиатуры:** Реализовать глобальный слушатель Escape для всех модальных окон; перевести `RollBadge` на доступный интерактивный элемент с поддержкой Enter/Space.
3. **Форма входа (Auth Modal):** Добавить тег `<form onSubmit={...}>`, поддержку отправки по Enter, и атрибуты автозаполнения паролей (`autoComplete`).
4. **Фокус при навигации Tab (Focus States):** Внедрить золотое кольцо `:focus-visible` в `globals.css` без раздражающих контуров при клике мышкой.
5. **Предотвращение Layout Shift:** Прописать явные размеры и `loading="lazy"` для портрета и карточек.
6. **Табличные моноширинные цифры и типографика:** Добавить `font-variant-numeric: tabular-nums` для числовых параметров листа; заменить `...` на `…`.
7. **Оптимизация анимаций:** Избавиться от `transition: all` в стилях; добавить поддержку `@media (prefers-reduced-motion: reduce)`.

---

## 2. Архитектура и компонентные изменения

### 2.1. Глобальные стили (`src/app/globals.css`)
- **Focus visible:**
  ```css
  :focus-visible {
    outline: 2px solid #C9A84C !important;
    outline-offset: 2px !important;
  }
  ```
  Исключить отображение фокуса при обычном клике мыши (оставить только `:focus-visible`).
- **Tabular nums:**
  Добавить `font-variant-numeric: tabular-nums;` для инпутов с числами, бейджей бросков, характеристик и параметров боя.
- **Оптимизация transition:**
  Заменить `transition: all ...` в `.parchment-btn`, `.parchment-btn-secondary`, `.parchment-input`, `.parchment-level-btn` на явный перечень свойств:
  `transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;`
- **Prefers-reduced-motion:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

### 2.2. Навыки и спасброски (`src/app/page.tsx`)
- **Навыки:** В строке навыка клик по блоку с названием (`{skill} ({ability})`) вызывает `updateSkillProf(skill, 'skillProficiencies', !isProf)`. Экспертиза остаётся отдельным кликом по чекбоксу экспертизы. Курсор на названии навыка — `cursor-pointer`.
- **Спасброски:** Клик по названию спасброска переключает владение спасброском.
- **Инпуты и лейблы:** Связать `StatInput` и ключевые поля инпутов через уникальные `id` и `htmlFor`.

### 2.3. Доступные броски d20 (`RollBadge`)
- Заменить `<span className="calc-badge roll-badge" onClick={handleClick}>` на интерактивный семантический тег `<button type="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRoll(); } }}>`. Стилизовать как кнопку без дефолтной рамки браузера.

### 2.4. Модальные окна и клавиша Escape
- Создать хук или обработчик `useEffect(() => { const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onClose])`.
- Подключить обработчик во все открывающиеся диалоги (`LevelUpModal`, `CharacterCreationWizardModal`, селекторы классов/рас/подклассов, модалки деталей предметов/заклинаний, калькулятор характеристик, генератор имен, меню выхода и выбора создания).

### 2.5. Форма авторизации (`AuthModal` в `src/app/page.tsx`)
- Обернуть блок инпутов в `<form onSubmit={(e) => { e.preventDefault(); onAuth(); }}>`.
- Поле Email: `type="email" name="email" autoComplete="email" spellCheck={false}`.
- Поле Password: `type="password" name="password" autoComplete={isSignUp ? "new-password" : "current-password"}`.
- Кнопка «Войти/Зарегистрироваться»: `type="submit"`.

### 2.6. Изображения и типографика
- В тегах `<img>` портрета персонажа и карточек (`page.tsx`, `share/[code]/page.tsx`, `CharacterGridModal.tsx`) указать размеры и `loading="lazy"`.
- Плейсхолдеры и статусы загрузки: заменить многоточия `...` на типографическое `…`.

---

## 3. План тестирования и верификации
1. **Автоматические тесты:**
   - `npm run test:adversarial` — 91/91 зелёных.
   - `npx tsc --noEmit` — 0 ошибок.
   - `npx eslint .` — 0 ошибок.
2. **E2E / Браузерная проверка (Playwright):**
   - Проверка нажатия `Escape` для закрытия окон.
   - Проверка клика по названию навыка — чекбокс владения переключается.
   - Проверка броска кубика клавишей `Enter` на бейдже бонуса.
   - Проверка отправки формы входа по нажатию `Enter`.
   - Проверка отображения фокус-кольца при нажатии `Tab`.
