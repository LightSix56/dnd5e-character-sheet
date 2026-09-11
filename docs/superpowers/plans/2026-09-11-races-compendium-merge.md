# План слияния компендиума рас D&D 5e и автогенерации choices

> **Для исполнителей-агентов:** ОБЯЗАТЕЛЬНЫЙ ПОДНАВЫК: Используйте superpowers:subagent-driven-development или superpowers:executing-plans для пошагового выполнения плана. Шаги используют синтаксис чекбоксов (`- [ ]`).

**Цель:** Модуляризировать компендиум рас, объединить 76 официальных рас и 79 подрас с dnd.su батчами по 3-5 рас, аккуратно сопоставить все `choices: RaceChoicesConfig` (размеры, заговоры, характеристики, инструменты, навыки, черты) и обеспечить 100% прохождение тестов без регрессий.

**Архитектура:** Разделение `src/data/compendium/races.ts` на модули в `src/data/compendium/races/` (`types.ts`, `core.ts`, `multiverse.ts`, `supplements.ts`, `index.ts`), скрипт сопоставления рас `scripts/merge-races-compendium.ts` с поддержкой батчей и флага `--dry-run`, состязательный тестовый сьют `test/races-compendium-adversarial.test.ts`.

**Стек:** TypeScript, Node.js (`node:test`, `node:assert/strict`), Next.js 15, React 19.

**Спецификация:** [`docs/superpowers/specs/2026-09-11-races-compendium-merge-design.md`](file:///c:/antig/dnd5e-character-sheet/docs/superpowers/specs/2026-09-11-races-compendium-merge-design.md)

## Глобальные ограничения
- Входной фасад `src/data/compendium/races.ts` обязан сохранить 100% совместимость со всеми существующими импортами (`export * from './races/index'`).
- Никаких затираний базовых рас из PHB: существующие тексты, описания и подрасы сохраняются.
- Версии рас из MPMM и других книг разводятся по уникальным ID (`${id}-mpmm`) и отображаются с указанием книги, например `Аасимар (MPMM)`.
- Все 317 существующих тестов визарда и правил обязаны оставаться зелеными на каждом шаге.
- Обязательный `git push origin main` по завершении.

---

### Задача 1: Модуляризация файловой структуры рас (Zero-Regression)

**Файлы:**
- Создать: `src/data/compendium/races/types.ts`
- Создать: `src/data/compendium/races/core.ts`
- Создать: `src/data/compendium/races/multiverse.ts`
- Создать: `src/data/compendium/races/supplements.ts`
- Создать: `src/data/compendium/races/index.ts`
- Модифицировать: `src/data/compendium/races.ts`

- [ ] **Шаг 1.1: Вынести типы в `src/data/compendium/races/types.ts`**
  Перенести `CompendiumRace`, `CompendiumSubrace`, `RaceChoicesConfig`, `MagicClass`, `ToolCategory`, `RaceCantripChoiceConfig` и т.д.
- [ ] **Шаг 1.2: Перенести базовые расы PHB и TCoE в `core.ts`, создать заготовки для `multiverse.ts` и `supplements.ts`**
- [ ] **Шаг 1.3: Собрать экспорт в `index.ts` и превратить `src/data/compendium/races.ts` в фасад**
- [ ] **Шаг 1.4: Запустить `npx tsc --noEmit` и `npm run test:adversarial` для проверки отсутствия регрессий**
- [ ] **Шаг 1.5: Закоммитить модуляризацию структуры**

---

### Задача 2: Создание скрипта слияния и генератора choices с батчами и dry-run

**Файлы:**
- Создать: `scripts/merge-races-compendium.ts`

- [ ] **Шаг 2.1: Разработать эвристический парсер `choices`**
  - Определение `sizeChoice` по вхождению "Средний или Маленький" / "Маленький или Средний".
  - Определение `isFlexibleASI` для MPMM.
  - Определение `cantripChoice` с правильным классом и выбором заклинательной характеристики.
  - Определение `toolChoice` и `skillChoiceOptions` по тексту особенностей.
- [ ] **Шаг 2.2: Реализовать поддержку аргументов `--dry-run` и `--batch <name_or_range>`**
- [ ] **Шаг 2.3: Протестировать скрипт в режиме `--dry-run` и сверить вывод отчета**
- [ ] **Шаг 2.4: Закоммитить скрипт**

---

### Задача 3: Создание состязательного теста валидности компендиума рас

**Файлы:**
- Создать: `test/races-compendium-adversarial.test.ts`

- [ ] **Шаг 3.1: Написать проверки уникальности ID, валидности скорости, размеров, названий**
- [ ] **Шаг 3.2: Написать проверку структуры подрас и типизации всех `choices`**
- [ ] **Шаг 3.3: Запустить тест и убедиться, что он проходит для текущего набора рас**
- [ ] **Шаг 3.4: Закоммитить тест**

---

### Задача 4: Батч 1 — MPMM Ревизии классических рас (5 рас)

**Расы:**
1. Аасимар (MPMM) (`aasimar-mpmm`)
2. Багбир (MPMM) (`bugbear-mpmm`)
3. Гоблин (MPMM) (`goblin-mpmm`) — `sizeChoice: ['Средний', 'Маленький']`
4. Голиаф (MPMM) (`goliath-mpmm`)
5. Кенку (MPMM) (`kenku-mpmm`) — `extraSkillsCount: 2`

- [ ] **Шаг 4.1: Запустить слияние Батча 1 в `src/data/compendium/races/multiverse.ts`**
- [ ] **Шаг 4.2: Сверить отчет и сгенерированные свойства с dnd.su**
- [ ] **Шаг 4.3: Запустить `npx tsc --noEmit` и `npm run test:adversarial`**
- [ ] **Шаг 4.4: Закоммитить Батч 1**

---

### Задача 5: Батч 2 — MPMM Экзотические ревизии (5 рас)

**Расы:**
1. Кобольд (MPMM) (`kobold-mpmm`) — `cantripChoice: { class: 'sorcerer', abilityChoice: ['ИНТ', 'МДР', 'ХАР'] }`, `sizeChoice: ['Средний', 'Маленький']`
2. Ящеролюд (MPMM) (`lizardfolk-mpmm`) — `extraSkillsCount: 2, skillChoiceOptions: [...]`
3. Минотавр (MPMM) (`minotaur-mpmm`)
4. Орк (MPMM) (`orc-mpmm`)
5. Сатир (MPMM) (`satyr-mpmm`)

- [ ] **Шаг 5.1: Запустить слияние Батча 2 в `src/data/compendium/races/multiverse.ts`**
- [ ] **Шаг 5.2: Сверить отчет и сгенерированные свойства с dnd.su**
- [ ] **Шаг 5.3: Запустить `npx tsc --noEmit` и `npm run test:adversarial`**
- [ ] **Шаг 5.4: Закоммитить Батч 2**

---

### Задача 6: Батч 3 — MPMM Природные и планарные ревизии (6 рас)

**Расы:**
1. Табакси (MPMM) (`tabaxi-mpmm`)
2. Тритон (MPMM) (`triton-mpmm`)
3. Фирболг (MPMM) (`firbolg-mpmm`)
4. Хобгоблин (MPMM) (`hobgoblin-mpmm`)
5. Чейнджлинг (MPMM) (`changeling-mpmm`) — `extraSkillsCount: 2, skillChoiceOptions: [...]`
6. Шифтер (MPMM) (`shifter-mpmm`)

- [ ] **Шаг 6.1: Запустить слияние Батча 3 в `src/data/compendium/races/multiverse.ts`**
- [ ] **Шаг 6.2: Сверить отчет и сгенерированные свойства с dnd.su**
- [ ] **Шаг 6.3: Запустить `npx tsc --noEmit` и `npm run test:adversarial`**
- [ ] **Шаг 6.4: Закоммитить Батч 3**

---

### Задача 7: Батч 4 — MPMM Новые астральные и подземные расы (5 рас)

**Расы:**
1. Гитъянки (MPMM) (`githyanki-mpmm`)
2. Гитцерай (MPMM) (`githzerai-mpmm`)
3. Глубинный гном (Свирфнеблин MPMM) (`deep-gnome-mpmm`)
4. Дуэргар (MPMM) (`duergar-mpmm`)
5. Эладрин (MPMM) (`eladrin-mpmm`)

- [ ] **Шаг 7.1: Запустить слияние Батча 4 в `src/data/compendium/races/multiverse.ts`**
- [ ] **Шаг 7.2: Сверить отчет и сгенерированные свойства с dnd.su**
- [ ] **Шаг 7.3: Запустить `npx tsc --noEmit` и `npm run test:adversarial`**
- [ ] **Шаг 7.4: Закоммитить Батч 4**

---

### Задача 8: Батч 5 — MPMM Фэйри, звериные и эльфийские расы (5 рас)

**Расы:**
1. Зайцегон (`harengon-mpmm`) — `sizeChoice: ['Средний', 'Маленький']`
2. Фэйри (`fairy-mpmm`) — `sizeChoice: ['Средний', 'Маленький']`
3. Морской эльф (MPMM) (`sea-elf-mpmm`)
4. Шадар-кай (MPMM) (`shadar-kai-mpmm`)
5. Кентавр (MPMM) (`centaur-mpmm`)

- [ ] **Шаг 8.1: Запустить слияние Батча 5 в `src/data/compendium/races/multiverse.ts`**
- [ ] **Шаг 8.2: Сверить отчет и сгенерированные свойства с dnd.su**
- [ ] **Шаг 8.3: Запустить `npx tsc --noEmit` и `npm run test:adversarial`**
- [ ] **Шаг 8.4: Закоммитить Батч 5**

---

### Задача 9: Батч 6 — Расы сеттингов Spelljammer, Dragonlance и Strixhaven (6 рас)

**Расы:**
1. Кендер (Dragonlance) (`kender`)
2. Астральный эльф (Spelljammer) (`astral-elf`) — `cantripChoice: { spellOptions: [...] }`
3. Автогном (Spelljammer) (`autognome`) — `toolChoice: { category: 'artisan', count: 2 }`, `sizeChoice: ['Маленький']`
4. Хадози (Spelljammer) (`hadozee`)
5. Гифф (Spelljammer) (`giff`)
6. Три-крин (Spelljammer) (`thri-kreen`) — `sizeChoice: ['Средний', 'Маленький']`
7. Совлин (Strixhaven) (`owlin`) — `sizeChoice: ['Средний', 'Маленький']`

- [ ] **Шаг 9.1: Запустить слияние Батча 6 в `src/data/compendium/races/supplements.ts`**
- [ ] **Шаг 9.2: Сверить отчет и сгенерированные свойства с dnd.su**
- [ ] **Шаг 9.3: Запустить `npx tsc --noEmit` и `npm run test:adversarial`**
- [ ] **Шаг 9.4: Закоммитить Батч 6**

---

### Задача 10: Батч 7 — Сеттинги Ravnica, Theros, Eberron и Ravenloft (8 рас)

**Расы:**
1. Гибрид Симиков (Ravnica) (`simic-hybrid`) — `customFeatureChoice`
2. Ведалкен (Ravnica) (`vedalken`)
3. Локсодон (Ravnica) (`loxodon`)
4. Леонинец (Theros) (`leonin`) — `skillChoiceOptions: [...]`
5. Калаштар (Eberron) (`kalashtar`)
6. Кованый (Eberron) (`warforged`)
7. Дампир (VRGtR) (`dhampir`) — `sizeChoice: ['Средний', 'Маленький']`
8. Хексблад (VRGtR) (`hexblood`) — `sizeChoice: ['Средний', 'Маленький']`
9. Возрожденный (VRGtR) (`reborn`) — `sizeChoice: ['Средний', 'Маленький']`

- [ ] **Шаг 10.1: Запустить слияние Батча 7 в `src/data/compendium/races/supplements.ts`**
- [ ] **Шаг 10.2: Сверить отчет и сгенерированные свойства с dnd.su**
- [ ] **Шаг 10.3: Запустить `npx tsc --noEmit` и `npm run test:adversarial`**
- [ ] **Шаг 10.4: Закоммитить Батч 7**

---

### Задача 11: Финальная интеграция, аудит визарда и пуш

- [ ] **Шаг 11.1: Полный прогон тестов `npm run test:adversarial`**
- [ ] **Шаг 11.2: `npx tsc --noEmit` и `npx eslint .`**
- [ ] **Шаг 11.3: `graphify update .`**
- [ ] **Шаг 11.4: `git push origin main`**
- [ ] **Шаг 11.5: Оформить отчет в `walkthrough.md`**
