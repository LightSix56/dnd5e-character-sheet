<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ (resolved from this file's directory; in monorepos the next package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by next dev — verify at node_modules/next/dist/server/lib/generate-agent-files.js. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# D&D 5e Character Sheet — сайт листа персонажа

Лист персонажа D&D 5e на русском: создание (визард), прокачка, снаряжение, заклинания,
компендиум, экспорт в PDF/DOCX, ссылки для показа. Next.js 16, React 19, Supabase, Tailwind.

Работает в паре с сайтом мастера `../dnd-ai-master`. Оба сайта ходят в **одну базу Supabase**
(проект `npcayouvvwjaqxqgxqxc`, eu-central-1).

## Архитектура

- `src/app/page.tsx` — главный экран листа (большой файл; новые части выносить в компоненты).
- `src/components/` — `sheet/`, `wizard/`, `levelup/`, `equipment/`, `compendium/`, `encyclopedia/`, `tools/`, `dnd-icons.tsx`.
- `src/data/` — весь компендиум (заклинания, расы, классы, оружие) лежит локально, без внешних API.
- `src/lib/` — правила (`ac-calculator.ts`, `feat-bonus-engine.ts`, `xp-thresholds.ts`), сохранение в облако (`character-save.ts`, `cloud-sync-state.ts`, `campaign-merge.ts`), `supabase/`.
- `src/app/api/` — `characters` (CRUD листов), `share`, `export-pdf`, `export-docx`, `upload-portrait`.
- `supabase-*.sql` в корне — схема базы; применяется вручную.

Ключевые правила данных:
- Лист — строка `public.characters`, весь лист в `data` (JSON). Сайт мастера читает её напрямую.
- **Версии кампаний:** строка с `campaign_id` — копия героя для одной кампании (`source_character_id` — оригинал). Её создаёт сайт мастера; прокачать версию можно только при достаточном опыте.
- `revision` увеличивает триггер базы. Сохранение учитывает ревизию: при конфликте — трёхстороннее слияние (`campaign-merge.ts`), правки игрока и игровое состояние от мастера не теряются.

## Команды

- `npm test` — юнит-тесты (`node:test` + `node:assert/strict`, папка `test/`). Тест `supabase-characters-api` требует локальный `.env.local` — без него падает, это нормально.
- `npm run test:e2e` — Playwright (`e2e/`; Edge, iPhone 14, Pixel 7).
- `npx tsc --noEmit` и `npx eslint .` — должны проходить без ошибок.
- Dev-сервер (`next dev` / `next start`) не запускать без просьбы пользователя.
- Если установлен `graphify`, им удобно искать связи (`graphify query "<имя>"`) и после правок обновлять граф (`graphify update .`). Не обязателен.

## Инфраструктура и Git

- Vercel, функции в `fra1` (`vercel.json`) — рядом с базой. Не убирать.
- База общая и боевая: удаление данных и изменение схемы — только с согласия пользователя. Supabase MCP не выполняет `DELETE`/`DROP` — такие отдавать пользователю готовым SQL.
- Работа идёт в `dev`; готовое и проверенное можно сразу пушить в `origin dev`. В `main` — по просьбе пользователя.
- Перед пушем в PowerShell очистить прокси: `$env:HTTPS_PROXY=""; $env:HTTP_PROXY=""`.

## Дизайн: пергамент и книга заклинаний

Любой новый экран, окно или компонент обязан выглядеть как старинный пергамент.

- Карточки — `.parchment-card` (`#F5E6C8`). Модальные окна — фон `#F5E6C8`, рамка `3px solid #C9A84C`,
  подложка `fixed inset-0 z-[350] bg-black/70 backdrop-blur-sm`.
- Текст — `#3D2012` / `#3C2415`, заголовки с засечками (Georgia). Подписи — `#8B6914` / `#6B3A2A`.
- Рамки — `#C9A84C` или `rgba(139, 105, 20, 0.4)`. Акценты — `#FFE58F` / `#E5C158`. Фокус — `0 0 0 2px rgba(201, 168, 76, 0.4)`.
- ❌ Белые фоны (`#FFFFFF`, `rgba(255,255,255,…)`) внутри карточек и строк.
- ❌ Синие браузерные фокусы и стандартные чекбоксы. ❌ Серые/чёрные плашки (`bg-gray-800`, `bg-zinc-900`).

Формы — только классы дизайн-системы:
- `.parchment-input` / `.parchment-input-center` — подчёркнутые строки (характеристики, атаки, заклинания);
- `.parchment-input-boxed` — поля в окнах, визарде и поиске; `.parchment-textarea`; `.parchment-select`;
- `.parchment-btn` — главная кнопка, `.parchment-btn-secondary` — обычная, `.parchment-remove-btn` — удаление `✕`.

Иконки:
- Кнопки, заголовки и бейджи — векторные иконки из `src/components/dnd-icons.tsx`
  (`D20Icon`, `SpellbookIcon`, `ScrollIcon`, `InfoSealIcon`, `CrossedSwordsIcon`, `QuillIcon`, `ChestIcon`):
  контур `#E5C158`/`#FFE58F`, заливка `#5C341F`/`#7A4529`.
- ❌ Эмодзи `ℹ️` в кнопках — вместо него `<InfoSealIcon size={18} />`. Эмодзи в списках и бейджах допустимы.

## Код

- Хуки только в начале компонента: никаких `if (!isOpen) return null` до `useState`/`useMemo`/`useCallback`.
- Не читать `ref.current` в JSX: всё, что влияет на отображение, — в `useState`.
- Математику правил (характеристики, КД, ячейки, мультикласс, прокачка) покрывать тестами в `test/`.
- Крупные изменения окон и вёрстки проверять в браузере, в том числе на мобильной ширине: без белых полос, переполнений и ошибок в консоли.
