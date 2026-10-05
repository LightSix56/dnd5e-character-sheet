import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_COLUMNS,
  CHARACTER_META_COLUMNS,
  parseExpectedRevision,
  decideSaveOutcome,
  isForeignKeyViolation,
} from '../src/lib/character-save';

test('parseExpectedRevision accepts only non-negative integers', () => {
  assert.equal(parseExpectedRevision(0), 0);
  assert.equal(parseExpectedRevision(7), 7);
  assert.equal(parseExpectedRevision('7'), null);
  assert.equal(parseExpectedRevision(-1), null);
  assert.equal(parseExpectedRevision(1.5), null);
  assert.equal(parseExpectedRevision(undefined), null);
  assert.equal(parseExpectedRevision(null), null);
  assert.equal(parseExpectedRevision(NaN), null);
});

test('POST without expectedRevision updates', () => {
  assert.equal(
    decideSaveOutcome({ expectedRevision: null, updatedRow: { id: 'a' }, currentRow: null }),
    'updated'
  );
});

test('matching revision updates', () => {
  assert.equal(
    decideSaveOutcome({ expectedRevision: 3, updatedRow: { id: 'a' }, currentRow: null }),
    'updated'
  );
});

test('row exists but revision moved on is a conflict', () => {
  assert.equal(
    decideSaveOutcome({ expectedRevision: 3, updatedRow: null, currentRow: { id: 'a' } }),
    'conflict'
  );
});

test('no row at all falls through to insert', () => {
  assert.equal(decideSaveOutcome({ expectedRevision: 3, updatedRow: null, currentRow: null }), 'insert');
  assert.equal(decideSaveOutcome({ expectedRevision: null, updatedRow: null, currentRow: null }), 'insert');
});

test('column lists carry revision and campaign fields; meta has no data', () => {
  for (const col of ['revision', 'campaign_id', 'campaign_name', 'source_character_id', 'updated_at']) {
    assert.ok(CHARACTER_COLUMNS.split(', ').includes(col), col);
    assert.ok(CHARACTER_META_COLUMNS.split(', ').includes(col), col);
  }
  assert.ok(CHARACTER_COLUMNS.split(', ').includes('data'));
  assert.equal(CHARACTER_META_COLUMNS.split(', ').includes('data'), false);
});

test('foreign key violation is recognised by postgres code', () => {
  assert.equal(isForeignKeyViolation({ code: '23503' }), true);
  assert.equal(isForeignKeyViolation({ code: '23505' }), false);
  assert.equal(isForeignKeyViolation(null), false);
});
