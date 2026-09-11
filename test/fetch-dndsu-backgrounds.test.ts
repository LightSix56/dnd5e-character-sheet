import test from 'node:test';
import * as assert from 'node:assert/strict';
import {
  isOfficialBackgroundSource,
  parseBackgroundHtml,
  formatBackgroundMarkdown,
  ParsedBackgroundData,
} from '../scripts/fetch-dndsu-backgrounds';

test('Background Parser: isOfficialBackgroundSource correctly identifies official WotC sources', () => {
  // Official books
  assert.equal(isOfficialBackgroundSource("Player's Handbook"), true);
  assert.equal(isOfficialBackgroundSource("Sword Coast Adventurer's Guide"), true);
  assert.equal(isOfficialBackgroundSource("Xanathar’s Guide to Everything"), true);
  assert.equal(isOfficialBackgroundSource("Guildmasters' Guide to Ravnica"), true);
  assert.equal(isOfficialBackgroundSource("Mythic Odysseys of Theros"), true);
  assert.equal(isOfficialBackgroundSource("Van Richten’s Guide to Ravenloft"), true);
  assert.equal(isOfficialBackgroundSource("Curse of Strahd"), true);
  assert.equal(isOfficialBackgroundSource("Spelljammer: Adventures in Space"), true);
  assert.equal(isOfficialBackgroundSource("Strixhaven: A Curriculum of Chaos"), true);
  assert.equal(isOfficialBackgroundSource("Dragonlance: Shadow of the Dragon Queen"), true);
  assert.equal(isOfficialBackgroundSource("Eberron: Rising from the Last War"), true);

  // Unofficial / Homebrew / 3rd-party
  assert.equal(isOfficialBackgroundSource("Homebrew"), false);
  assert.equal(isOfficialBackgroundSource("Grim Hollow"), false);
  assert.equal(isOfficialBackgroundSource("Kobold Press"), false);
  assert.equal(isOfficialBackgroundSource("Steinhardt's Guide"), false);
  assert.equal(isOfficialBackgroundSource("Dungeon Dudes"), false);
});

test('Background Parser: parseBackgroundHtml extracts clean structured data from article HTML', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Прислужник [Acolyte] - Предыстории D&D 5</title></head>
      <body>
        <div class="card__article">
          <h2>Прислужник [Acolyte]</h2>
          <div class="card__source">Источник: «Player's Handbook»</div>
          <div class="card__body">
            <p>Вы провели жизнь на службе в храме конкретного бога или пантеона богов.</p>
            <p>Вы выступаете посредником между царством священного и миром смертных.</p>
            <ul>
              <li><strong>Владение навыками:</strong> Проницательность, Религия</li>
              <li><strong>Языки:</strong> Два на ваш выбор</li>
              <li><strong>Владение инструментами:</strong> Нет</li>
              <li><strong>Снаряжение:</strong> Священный символ, молитвенник, 5 палочек благовоний, облачение, комплект обычной одежды и кошель с 15 зм</li>
            </ul>
            <h3>УМЕНИЕ: ПРИЮТ ДЛЯ ВЕРУЮЩИХ</h3>
            <p>Как прислужник, вы пользуетесь уважением единоверцев и можете проводить религиозные церемонии вашего божества.</p>
            <h3>ПЕРСОНАЛИЗАЦИЯ</h3>
            <p>Прислужники сформированы своим опытом служения в храме.</p>
            <div class="table">
              <table>
                <caption>к8 Черта характера</caption>
                <tr><td>1</td><td>Я боготворю конкретного героя своей веры.</td></tr>
                <tr><td>2</td><td>Я вижу знаки и предзнаменования в каждом событии.</td></tr>
              </table>
              <table>
                <caption>к6 Идеал</caption>
                <tr><td>1</td><td>Традиция. Древние обычаи веры должны сохраняться вечно. (Законный)</td></tr>
              </table>
              <table>
                <caption>к6 Привязанность</caption>
                <tr><td>1</td><td>Я сделаю всё, чтобы защитить священную реликвию моего храма.</td></tr>
              </table>
              <table>
                <caption>к6 Слабость</caption>
                <tr><td>1</td><td>Я слепо доверяю тем, кто исповедует мою религию.</td></tr>
              </table>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const parsed = parseBackgroundHtml(sampleHtml, 'https://dnd.su/backgrounds/766-acolyte/');

  assert.equal(parsed.id, 'acolyte');
  assert.equal(parsed.nameRu, 'Прислужник');
  assert.equal(parsed.nameEn, 'Acolyte');
  assert.equal(parsed.source, "Player's Handbook");
  assert.equal(parsed.isOfficial, true);
  assert.deepEqual(parsed.skillProficiencies, ['Проницательность', 'Религия']);
  assert.deepEqual(parsed.languages, ['Два на ваш выбор']);
  assert.equal(parsed.startingGold, 15);
  assert.equal(parsed.feature.name, 'Приют для верующих');
  assert.ok(parsed.feature.description.includes('Как прислужник, вы пользуетесь уважением'));
  assert.ok(parsed.suggestedCharacteristics);
  assert.equal(parsed.suggestedCharacteristics.personalityTraits.length, 2);
  assert.equal(parsed.suggestedCharacteristics.ideals.length, 1);
  assert.equal(parsed.suggestedCharacteristics.bonds.length, 1);
  assert.equal(parsed.suggestedCharacteristics.flaws.length, 1);
});

test('Background Parser: formatBackgroundMarkdown produces clean, readable Markdown without HTML', () => {
  const dummy: ParsedBackgroundData = {
    id: 'soldier',
    nameRu: 'Солдат',
    nameEn: 'Soldier',
    source: "Player's Handbook",
    isOfficial: true,
    sourceUrl: 'https://dnd.su/backgrounds/767-soldier/',
    description: 'Сколько вы помните, в вашей жизни всегда была война.',
    skillProficiencies: ['Атлетика', 'Запугивание'],
    toolProficiencies: ['Один игровой набор', 'Транспорт (сухопутный)'],
    languages: [],
    equipment: 'Знак отличия, кошель с 10 зм',
    startingGold: 10,
    feature: {
      name: 'Воинское звание',
      description: 'Будучи солдатом, вы заслужили звание.',
    },
    suggestedCharacteristics: {
      personalityTraits: ['Я всегда вежлив и почтителен.'],
      ideals: ['Высшее благо. (Добрый)'],
      bonds: ['Моя честь — моя жизнь.'],
      flaws: ['Я подчиняюсь закону, даже если закон вызывает страдания.'],
    },
  };

  const md = formatBackgroundMarkdown(dummy);

  assert.ok(md.includes('# 📜 Солдат [Soldier]'));
  assert.ok(md.includes("**Источник:** *Player's Handbook* (Официальный контент WotC)"));
  assert.ok(md.includes('- **Владение навыками:** Атлетика, Запугивание'));
  assert.ok(md.includes('- **Владение инструментами:** Один игровой набор, Транспорт (сухопутный)'));
  assert.ok(md.includes('- **Стартовое золото:** 10 зм'));
  assert.ok(md.includes('### 🛡️ Умение: Воинское звание'));
  assert.ok(md.includes('### 🎭 Персонализация'));
  assert.ok(!md.includes('<div>'));
  assert.ok(!md.includes('<table>'));
});
