import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOUD_SYNC_KEY,
  EMPTY_SYNC_META,
  readSyncMeta,
  writeSyncMeta,
  resolveLoginSync,
  type CloudSyncMeta,
} from '../src/lib/cloud-sync-state';
import { checkRateLimit, sniffImageType, utf8ByteLength } from '../src/lib/request-guards';
import { getLocalShareStore, putLocalShare, LOCAL_SHARE_STORE_LIMIT } from '../src/lib/share-store';

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
}

const USER = 'user-a';
const cloud = [
  { id: 'char-new', name: 'Арагорн', updated_at: '2026-10-02T10:00:00+00:00' },
  { id: 'char-old', name: 'Торин', updated_at: '2026-09-01T10:00:00+00:00' },
];

function meta(patch: Partial<CloudSyncMeta>): CloudSyncMeta {
  return { ...EMPTY_SYNC_META, ...patch };
}

describe('cloud sync state storage', () => {
  it('returns empty meta for missing, corrupt or wrongly typed data', () => {
    assert.deepEqual(readSyncMeta(null), EMPTY_SYNC_META);
    assert.deepEqual(readSyncMeta(memoryStorage()), EMPTY_SYNC_META);
    assert.deepEqual(readSyncMeta(memoryStorage({ [CLOUD_SYNC_KEY]: '{not json' })), EMPTY_SYNC_META);
    assert.deepEqual(
      readSyncMeta(memoryStorage({ [CLOUD_SYNC_KEY]: JSON.stringify({ dirty: 'yes', cloudId: 5 }) })),
      EMPTY_SYNC_META
    );
  });

  it('merges patches and keeps untouched fields', () => {
    const storage = memoryStorage();
    writeSyncMeta(storage, { cloudId: 'char-old', cloudUpdatedAt: 't1', userId: USER });
    const next = writeSyncMeta(storage, { dirty: true });
    assert.deepEqual(next, { dirty: true, cloudId: 'char-old', cloudUpdatedAt: 't1', userId: USER });
    assert.deepEqual(readSyncMeta(storage), next);
  });
});

describe('resolveLoginSync', () => {
  it('takes the latest cloud character when there are no local unsynced edits', () => {
    const decision = resolveLoginSync({ meta: meta({}), localName: 'Торин', userId: USER, cloudCharacters: cloud });
    assert.deepEqual(decision, { action: 'use-cloud', character: cloud[0] });
  });

  it('returns null character when cloud is empty and nothing is dirty', () => {
    const decision = resolveLoginSync({ meta: meta({}), localName: 'Торин', userId: USER, cloudCharacters: [] });
    assert.deepEqual(decision, { action: 'use-cloud', character: null });
  });

  it('does not protect a nameless draft even if it is dirty', () => {
    for (const localName of ['', '   ', 'Безымянный', null, undefined]) {
      const decision = resolveLoginSync({ meta: meta({ dirty: true }), localName, userId: USER, cloudCharacters: cloud });
      assert.equal(decision.action, 'use-cloud');
    }
  });

  it('keeps a dirty guest character and saves it as a new cloud record', () => {
    const decision = resolveLoginSync({ meta: meta({ dirty: true }), localName: 'Гимли', userId: USER, cloudCharacters: cloud });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: null, conflict: false });
  });

  it('keeps dirty edits and updates the same record when cloud was not touched since last sync', () => {
    const decision = resolveLoginSync({
      meta: meta({ dirty: true, cloudId: 'char-old', cloudUpdatedAt: '2026-09-01T10:00:00+00:00', userId: USER }),
      localName: 'Торин',
      userId: USER,
      cloudCharacters: cloud,
    });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: 'char-old', conflict: false });
  });

  it('treats equal instants in different formats as the same version', () => {
    const decision = resolveLoginSync({
      meta: meta({ dirty: true, cloudId: 'char-old', cloudUpdatedAt: '2026-09-01T10:00:00.000Z', userId: USER }),
      localName: 'Торин',
      userId: USER,
      cloudCharacters: cloud,
    });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: 'char-old', conflict: false });
  });

  it('reports a conflict and never targets the cloud record changed on another device', () => {
    const decision = resolveLoginSync({
      meta: meta({ dirty: true, cloudId: 'char-old', cloudUpdatedAt: '2026-08-15T08:00:00+00:00', userId: USER }),
      localName: 'Торин',
      userId: USER,
      cloudCharacters: cloud,
    });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: null, conflict: true });
  });

  it('ignores a link that belongs to another account', () => {
    const decision = resolveLoginSync({
      meta: meta({ dirty: true, cloudId: 'char-old', cloudUpdatedAt: '2026-09-01T10:00:00+00:00', userId: 'user-b' }),
      localName: 'Торин',
      userId: USER,
      cloudCharacters: cloud,
    });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: null, conflict: false });
  });

  it('saves as new when the linked cloud record was deleted', () => {
    const decision = resolveLoginSync({
      meta: meta({ dirty: true, cloudId: 'char-gone', cloudUpdatedAt: 't', userId: USER }),
      localName: 'Торин',
      userId: USER,
      cloudCharacters: cloud,
    });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: null, conflict: false });
  });
});

describe('request guards', () => {
  it('allows up to the limit inside a window, then blocks, then resets', () => {
    const key = `test:${Math.random()}`;
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) assert.equal(checkRateLimit(key, 3, 60_000, t0 + i).ok, true);
    const blocked = checkRateLimit(key, 3, 60_000, t0 + 10);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.retryAfterSeconds, 60);
    assert.equal(checkRateLimit(key, 3, 60_000, t0 + 60_001).ok, true);
  });

  it('counts keys independently', () => {
    const a = `test:${Math.random()}`;
    const b = `test:${Math.random()}`;
    assert.equal(checkRateLimit(a, 1, 60_000, 5).ok, true);
    assert.equal(checkRateLimit(a, 1, 60_000, 6).ok, false);
    assert.equal(checkRateLimit(b, 1, 60_000, 6).ok, true);
  });

  it('measures body size in bytes, not UTF-16 code units', () => {
    assert.equal(utf8ByteLength('abc'), 3);
    assert.equal(utf8ByteLength('Торин'), 10);
  });

  it('detects real image formats by signature and rejects everything else', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const riffNotWebp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45]);

    assert.equal(sniffImageType(png), 'png');
    assert.equal(sniffImageType(jpg), 'jpg');
    assert.equal(sniffImageType(webp), 'webp');
    assert.equal(sniffImageType(svg), null);
    assert.equal(sniffImageType(riffNotWebp), null);
    assert.equal(sniffImageType(new Uint8Array([])), null);
  });
});

describe('local share fallback store', () => {
  it('drops expired records and never grows past the limit', () => {
    const store = getLocalShareStore();
    store.clear();
    const now = Date.parse('2026-10-03T00:00:00Z');
    const future = new Date(now + 86_400_000).toISOString();

    putLocalShare({ code: 'EXPIRED1', name: 'x', data: {}, created_at: '', expires_at: new Date(now - 1000).toISOString() }, now - 5000);
    for (let i = 0; i < LOCAL_SHARE_STORE_LIMIT + 25; i++) {
      putLocalShare({ code: `CODE${i}`, name: 'x', data: {}, created_at: '', expires_at: future }, now);
    }

    assert.equal(store.size, LOCAL_SHARE_STORE_LIMIT);
    assert.equal(store.has('EXPIRED1'), false);
    assert.equal(store.has('CODE0'), false, 'oldest records are evicted first');
    assert.equal(store.has(`CODE${LOCAL_SHARE_STORE_LIMIT + 24}`), true);
    store.clear();
  });
});
