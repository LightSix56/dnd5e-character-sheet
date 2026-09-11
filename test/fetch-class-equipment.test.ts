import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  parseEquipmentHtml,
  cleanEquipmentText,
  parseEquipmentListItem
} from '../scripts/fetch-class-equipment';

describe('Class Starting Equipment Parser', () => {
  it('cleanEquipmentText strips HTML tags and collapses spaces', () => {
    const raw = 'а) <a href="https://dnd.su/items/123">секира</a> или б) любое <span class="tooltip">воинское оружие</span>';
    const cleaned = cleanEquipmentText(raw);
    assert.equal(cleaned, 'а) секира или б) любое воинское оружие');
  });

  it('parseEquipmentListItem identifies choices with a) / б) / в)', () => {
    const item1 = 'а) секира или б) любое воинское рукопашное оружие';
    const res1 = parseEquipmentListItem(item1);
    assert.equal(res1.isChoice, true);
    assert.deepEqual(res1.choice?.options, ['секира', 'любое воинское рукопашное оружие']);

    const item2 = 'а) рапира, б) длинный меч или в) любое простое оружие';
    const res2 = parseEquipmentListItem(item2);
    assert.equal(res2.isChoice, true);
    assert.deepEqual(res2.choice?.options, ['рапира', 'длинный меч', 'любое простое оружие']);
  });

  it('parseEquipmentListItem identifies fixed items', () => {
    const item = 'Набор путешественника и четыре метательных копья';
    const res = parseEquipmentListItem(item);
    assert.equal(res.isChoice, false);
    assert.equal(res.fixed, 'Набор путешественника и четыре метательных копья');
  });

  it('parseEquipmentHtml parses full HTML block with choices and fixed items', () => {
    const mockHtml = `
      <div>
        <h4 class="smallSectionTitle">СНАРЯЖЕНИЕ</h4>
        <p>Вы начинаете со следующим снаряжением в дополнение к снаряжению, полученному за вашу предысторию:</p>
        <ul>
          <li>а) <a href="#">секира</a> или б) любое <a href="#">воинское рукопашное оружие</a></li>
          <li>а) два <a href="#">ручных топора</a> или б) любое <a href="#">простое оружие</a></li>
          <li>Набор путешественника и четыре метательных копья</li>
        </ul>
      </div>
    `;

    const result = parseEquipmentHtml(mockHtml);
    assert.equal(result.choices.length, 2);
    assert.deepEqual(result.choices[0].options, ['секира', 'любое воинское рукопашное оружие']);
    assert.deepEqual(result.choices[1].options, ['два ручных топора', 'любое простое оружие']);
    assert.equal(result.fixed.length, 1);
    assert.equal(result.fixed[0], 'Набор путешественника и четыре метательных копья');
  });

  it('handles spaces in header like СНАРЯЖЕНИЕ </h4>', () => {
    const mockHtml = `
      <h4 class="smallSectionTitle">СНАРЯЖЕНИЕ </h4>
      <ul>
        <li>а) кольчуга или б) кожаный доспех</li>
        <li>Щит и священный символ</li>
      </ul>
    `;
    const result = parseEquipmentHtml(mockHtml);
    assert.equal(result.choices.length, 1);
    assert.deepEqual(result.choices[0].options, ['кольчуга', 'кожаный доспех']);
    assert.equal(result.fixed.length, 1);
    assert.equal(result.fixed[0], 'Щит и священный символ');
  });
});
