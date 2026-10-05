import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupCharacterVersions,
  filterCharacterGroups,
  flattenCharacterGroups,
  isCampaignVersion,
  type GroupableCharacter,
} from '../src/lib/character-grouping';

const orig = (id: string, name: string): GroupableCharacter => ({ id, name });
const ver = (id: string, source: string | null, campaign: string, campaignName: string | null = campaign): GroupableCharacter =>
  ({ id, name: `${id} (${campaignName})`, source_character_id: source, campaign_id: campaign, campaign_name: campaignName });

test('versions follow their original', () => {
  const list = [ver('v2', 'a', 'c2', 'Яма'), orig('b', 'Борин'), ver('v1', 'a', 'c1', 'Встреча'), orig('a', 'Токсин')];
  const groups = groupCharacterVersions(list);
  assert.deepEqual(groups.map(g => g.original.id), ['b', 'a']);
  assert.deepEqual(groups[1].versions.map(v => v.id), ['v1', 'v2']); // по названию кампании
  assert.deepEqual(flattenCharacterGroups(groups).map(c => c.id), ['b', 'a', 'v1', 'v2']);
});

test('orphan version stays visible', () => {
  const groups = groupCharacterVersions([ver('v1', 'gone', 'c1'), ver('v0', null, 'c9'), orig('a', 'Токсин')]);
  assert.deepEqual(groups.map(g => g.original.id), ['v1', 'v0', 'a']);
  assert.deepEqual(groups[0].versions, []);
  assert.equal(isCampaignVersion(groups[0].original), true);
});

test('search hit on a version keeps its original in the group', () => {
  const groups = groupCharacterVersions([orig('a', 'Токсин'), ver('v1', 'a', 'c1', 'Встреча'), ver('v2', 'a', 'c2', 'Яма'), orig('b', 'Борин')]);
  const hit = filterCharacterGroups(groups, c => c.id === 'v2');
  assert.deepEqual(flattenCharacterGroups(hit).map(c => c.id), ['a', 'v2']);
  const origHit = filterCharacterGroups(groups, c => c.id === 'a');
  assert.deepEqual(flattenCharacterGroups(origHit).map(c => c.id), ['a', 'v1', 'v2']);
  assert.deepEqual(filterCharacterGroups(groups, () => false), []);
});

test('local-active entry is never treated as a version', () => {
  const local: GroupableCharacter = { id: 'local-active', name: 'Черновик', isLocal: true, campaign_id: 'c1', source_character_id: 'a' };
  const groups = groupCharacterVersions([orig('a', 'Токсин'), local]);
  assert.deepEqual(groups.map(g => g.original.id), ['a', 'local-active']);
  assert.equal(isCampaignVersion(local), false);
});

test('duplicate ids and a version pointing at itself do not loop or duplicate', () => {
  const self = ver('s', 's', 'c1');
  const groups = groupCharacterVersions([orig('a', 'Токсин'), orig('a', 'Токсин'), self]);
  assert.deepEqual(flattenCharacterGroups(groups).map(c => c.id), ['a', 's']);
});
