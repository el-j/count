export interface CounterSyncPayload {
  id: string;
  createdAt: string;
  state: Record<string, unknown>;
  event?: Record<string, unknown> | null;
  source: 'manual' | 'restore';
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const COUNTER_STORAGE_KEY = 'sonnenraum_party_counter_v1';
export const COUNTER_SYNC_QUEUE_KEY = 'sonnenraum_party_counter_sync_queue_v1';

export function normalizeCounterState(raw: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const safe = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const count = typeof safe.count === 'number' ? safe.count : 0;
  const target = typeof safe.target === 'number' && safe.target > 0 ? safe.target : 300;
  const stationName = typeof safe.stationName === 'string' && safe.stationName.trim() ? safe.stationName.trim() : 'Tür 1';
  const deviceId = typeof safe.deviceId === 'string' && safe.deviceId.trim() ? safe.deviceId.trim().toUpperCase() : 'DEV-1001';
  const recipientEmail = typeof safe.recipientEmail === 'string' ? safe.recipientEmail.trim() : '';
  const history = Array.isArray(safe.history) ? safe.history.slice(0, 500) : [];
  const startTime = typeof safe.startTime === 'string' && safe.startTime ? safe.startTime : new Date().toISOString();

  return {
    count: Math.max(0, count),
    target,
    stationName,
    deviceId,
    recipientEmail,
    history,
    startTime,
  };
}

export function getBrowserStorage(): StorageLike | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}

export function readQueuedCounterSyncs(storage: StorageLike | null = getBrowserStorage()): CounterSyncPayload[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(COUNTER_SYNC_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry) => entry && typeof entry === 'object') as CounterSyncPayload[];
  } catch {
    return [];
  }
}

export function writeQueuedCounterSyncs(queue: CounterSyncPayload[], storage: StorageLike | null = getBrowserStorage()): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(COUNTER_SYNC_QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    // Keep silent; local fallback still remains in memory or browser storage may be full.
  }
}

export function clearQueuedCounterSyncs(storage: StorageLike | null = getBrowserStorage()): void {
  if (!storage) {
    return;
  }
  storage.removeItem(COUNTER_SYNC_QUEUE_KEY);
}

export function buildCounterSyncPayload(state: Record<string, unknown>, options: { event?: Record<string, unknown> | null; source?: 'manual' | 'restore' } = {}): CounterSyncPayload {
  const normalizedState = normalizeCounterState(state);
  const createdAt = new Date().toISOString();

  return {
    id: `sync_${createdAt}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    state: normalizedState,
    event: options.event ?? null,
    source: options.source ?? 'manual',
  };
}

export function enqueueCounterSync(payload: CounterSyncPayload, storage: StorageLike | null = getBrowserStorage()): CounterSyncPayload[] {
  const queue = readQueuedCounterSyncs(storage);
  const deduped = queue.filter((entry) => entry.id !== payload.id);
  deduped.push(payload);
  writeQueuedCounterSyncs(deduped, storage);
  return deduped;
}

export function removeSyncedCounterSyncs(ids: string[], storage: StorageLike | null = getBrowserStorage()): CounterSyncPayload[] {
  const queue = readQueuedCounterSyncs(storage);
  const remaining = queue.filter((entry) => !ids.includes(entry.id));
  writeQueuedCounterSyncs(remaining, storage);
  return remaining;
}
