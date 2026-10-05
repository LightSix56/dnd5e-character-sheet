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

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
}

const USER = 'user-a';

describe('cloud revision in sync meta', () => {
  it('defaults to null for stored meta that lacks the key', () => {
    const storage = memoryStorage({
      [CLOUD_SYNC_KEY]: JSON.stringify({ dirty: true, cloudId: 'c1', cloudUpdatedAt: 't', userId: USER }),
    });
    assert.equal(readSyncMeta(storage).cloudRevision, null);
    assert.equal(EMPTY_SYNC_META.cloudRevision, null);
  });

  it('round-trips a revision and rejects non-integers', () => {
    const storage = memoryStorage();
    writeSyncMeta(storage, { cloudRevision: 4 });
    assert.equal(readSyncMeta(storage).cloudRevision, 4);
    storage.setItem(CLOUD_SYNC_KEY, JSON.stringify({ cloudRevision: '4' }));
    assert.equal(readSyncMeta(storage).cloudRevision, null);
    storage.setItem(CLOUD_SYNC_KEY, JSON.stringify({ cloudRevision: -1 }));
    assert.equal(readSyncMeta(storage).cloudRevision, null);
  });
});

describe('resolveLoginSync with campaign versions', () => {
  const meta = (patch: Partial<CloudSyncMeta>): CloudSyncMeta => ({ ...EMPTY_SYNC_META, ...patch });
  const version = { id: 'ver-1', name: 'Токсин (Встреча)', updated_at: '2026-10-05T10:00:00+00:00', campaign_id: 'camp-1' };
  const original = { id: 'orig-1', name: 'Токсин', updated_at: '2026-10-05T10:00:00+00:00', campaign_id: null };

  it('dirty campaign version changed by the master is merged into the same record, not copied', () => {
    const decision = resolveLoginSync({
      meta: meta({ dirty: true, cloudId: 'ver-1', cloudUpdatedAt: '2026-10-01T08:00:00+00:00', userId: USER }),
      localName: 'Токсин',
      userId: USER,
      cloudCharacters: [version, original],
    });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: 'ver-1', conflict: false, mergeFrom: version });
  });

  it('dirty original changed elsewhere is still saved as a separate copy', () => {
    const decision = resolveLoginSync({
      meta: meta({ dirty: true, cloudId: 'orig-1', cloudUpdatedAt: '2026-10-01T08:00:00+00:00', userId: USER }),
      localName: 'Токсин',
      userId: USER,
      cloudCharacters: [version, original],
    });
    assert.deepEqual(decision, { action: 'keep-local', cloudId: null, conflict: true });
  });

  it('with nothing dirty the newest record is used even if it is a campaign version', () => {
    const decision = resolveLoginSync({ meta: meta({}), localName: 'Токсин', userId: USER, cloudCharacters: [version, original] });
    assert.deepEqual(decision, { action: 'use-cloud', character: version });
  });
});
