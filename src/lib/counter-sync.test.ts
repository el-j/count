import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCounterSyncPayload,
  clearQueuedCounterSyncs,
  enqueueCounterSync,
  normalizeCounterState,
  readQueuedCounterSyncs,
} from './counter-sync.ts';

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

test('normalizeCounterState fills in defaults and clips to a safe range', () => {
  const result = normalizeCounterState({
    count: -3,
    target: 0,
    stationName: '   ',
    deviceId: ' dev-abc ',
    recipientEmail: '  user@example.com ',
    history: [{ id: '1' }, { id: '2' }],
    startTime: '',
  });

  assert.equal(result.count, 0);
  assert.equal(result.target, 300);
  assert.equal(result.stationName, 'Tür 1');
  assert.equal(result.deviceId, 'DEV-ABC');
  assert.equal(result.recipientEmail, 'user@example.com');
  assert.equal(Array.isArray(result.history), true);
  assert.equal((result.history as Array<{ id: string }>).length, 2);
  assert.ok(typeof result.startTime === 'string' && result.startTime.length > 0);
});

test('queued sync entries are persisted and deduplicated by id', () => {
  const storage = new MemoryStorage();
  const payloadA = buildCounterSyncPayload({
    count: 12,
    target: 300,
    stationName: 'Tür 1',
    deviceId: 'DEV-TEST',
    recipientEmail: 'ops@example.com',
    history: [],
    startTime: '2025-01-01T00:00:00.000Z',
  }, { source: 'manual' });

  const queue = enqueueCounterSync(payloadA, storage);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].id, payloadA.id);

  const queuedAgain = enqueueCounterSync({ ...payloadA }, storage);
  assert.equal(queuedAgain.length, 1);

  const loaded = readQueuedCounterSyncs(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].state.deviceId, 'DEV-TEST');

  clearQueuedCounterSyncs(storage);
  assert.deepEqual(readQueuedCounterSyncs(storage), []);
});
