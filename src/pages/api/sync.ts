import type { APIRoute } from 'astro';
import { createDatabaseConnection, ensureDatabaseSchema } from '../../lib/db';

export const prerender = false;

function isCounterSyncPayload(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && 'id' in value && 'state' in value;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({ queue: [] }));
    const queue = Array.isArray(body?.queue) ? body.queue : [];

    if (!queue.length) {
      return new Response(JSON.stringify({ ok: true, processedIds: [], skipped: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pool = await createDatabaseConnection().catch(() => null);
    if (!pool) {
      return new Response(JSON.stringify({ ok: false, reason: 'database-unavailable', processedIds: [] }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await ensureDatabaseSchema(pool);

    const processedIds: string[] = [];

    for (const item of queue) {
      if (!isCounterSyncPayload(item)) {
        continue;
      }

      const state = item.state as Record<string, unknown>;
      const deviceId = typeof state.deviceId === 'string' ? state.deviceId.trim().toUpperCase() : 'DEV-1001';
      const stationName = typeof state.stationName === 'string' && state.stationName.trim() ? state.stationName.trim() : 'Tür 1';
      const target = typeof state.target === 'number' && state.target > 0 ? Math.max(1, state.target) : 300;
      const currentCount = typeof state.count === 'number' ? Math.max(0, state.count) : 0;
      const recipientEmail = typeof state.recipientEmail === 'string' ? state.recipientEmail.trim() : '';
      const startTime = typeof state.startTime === 'string' && state.startTime ? state.startTime : new Date().toISOString();
      const eventId = typeof item.id === 'string' ? item.id : `event_${Date.now()}`;
      const event = item.event as Record<string, unknown> | undefined;
      const delta = typeof event?.delta === 'number' ? event.delta : 0;
      const resultingTotal = typeof event?.resultingTotal === 'number' ? event.resultingTotal : currentCount;
      const label = typeof event?.label === 'string' ? event.label : 'counter-sync';
      const eventTime = typeof event?.iso === 'string' && event.iso ? event.iso : startTime;

      await pool.execute(
        `
          INSERT INTO counter_state (device_id, station_name, current_count, target_count, recipient_email, start_time)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            station_name = VALUES(station_name),
            current_count = VALUES(current_count),
            target_count = VALUES(target_count),
            recipient_email = VALUES(recipient_email),
            start_time = VALUES(start_time),
            updated_at = CURRENT_TIMESTAMP
        `,
        [deviceId, stationName, currentCount, target, recipientEmail, startTime]
      );

      await pool.execute(
        `
          INSERT INTO counter_events (device_id, event_id, delta, resulting_total, label, event_time, payload)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            device_id = VALUES(device_id),
            delta = VALUES(delta),
            resulting_total = VALUES(resulting_total),
            label = VALUES(label),
            event_time = VALUES(event_time),
            payload = VALUES(payload)
        `,
        [deviceId, eventId, delta, resultingTotal, label, eventTime, JSON.stringify({ state, event, createdAt: item.createdAt ?? new Date().toISOString() })]
      );

      processedIds.push(eventId);
    }

    return new Response(JSON.stringify({ ok: true, processedIds, skipped: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Counter sync failed:', error);
    return new Response(JSON.stringify({ ok: false, reason: 'sync-error', processedIds: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
