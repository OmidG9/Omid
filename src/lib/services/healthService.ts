/**
 * System health snapshot (§6.1). Purely read-path: gathers a few cheap signals
 * used by the Settings page — last analytics event, last contact submission,
 * last email outcome, storage backend status and form error rate.
 */

import { getStore, storeBackend, type StoreBackend } from '@/lib/db';
import { redisPing, isRedisConfigured } from '@/lib/db/redis';
import { mySqlPing, isMySqlConfigured } from '@/lib/db/mysql';
import { CONTACT_TIMELINE_EVENT } from '@/types/contacts';
import type { ContactRequest } from '@/types/contacts';
import { startOfDayUtc, DAY_MS, dateKey } from '@/lib/utils/date';

export interface HealthSnapshot {
  backend: StoreBackend;
  mysql: { configured: boolean; reachable: boolean };
  redis: { configured: boolean; reachable: boolean };
  lastEventAt: number;
  lastEventAgeSec: number | null;
  contact: {
    latestAt: number;
    ageSec: number | null;
    emailSentOk: boolean | null;
    emailErrorAt: number | null;
    errorRatePct: number;
  };
}

function ageSec(at: number, now: number): number {
  return at > 0 ? Math.max(0, Math.round((now - at) / 1000)) : -1;
}

export async function getHealthSnapshot(now = Date.now()): Promise<HealthSnapshot> {
  const store = getStore();

  const [lastEventAt, recent] = await Promise.all([
    store.getLastEventAt(),
    store.recentContacts(3),
  ]);

  // Summarize email outcomes across the most recent contacts.
  let emailSentOk: boolean | null = null;
  let emailErrorAt: number | null = null;
  let latestContact: ContactRequest | null = recent[0] ?? null;
  for (const c of recent) {
    for (const ev of c.timeline) {
      if (ev.name === CONTACT_TIMELINE_EVENT.EMAIL_SENT) {
        emailSentOk = true;
        emailErrorAt = null;
      } else if (ev.name === CONTACT_TIMELINE_EVENT.EMAIL_ERROR && emailSentOk !== true) {
        emailSentOk = false;
        emailErrorAt = ev.at;
      }
    }
  }

  // Form error rate over the trailing 30 days (from daily metrics).
  let errorRatePct = 0;
  try {
    const fromKey = dateKey(startOfDayUtc(now - 30 * DAY_MS));
    const toKey = dateKey(now);
    const metrics = await store.getDailyMetrics([fromKey, toKey]);
    let views = 0;
    let errors = 0;
    for (const m of metrics) {
      if (!m) continue;
      views += m.formViews;
      errors += m.formErrors;
    }
    if (views > 0) errorRatePct = Math.round((errors / views) * 100);
  } catch {
    // metrics unavailable — keep 0
  }

  const redisReachable = isRedisConfigured() ? await redisPing() : false;
  const mysqlReachable = isMySqlConfigured() ? await mySqlPing() : false;

  return {
    backend: storeBackend(),
    mysql: { configured: isMySqlConfigured(), reachable: mysqlReachable },
    redis: { configured: isRedisConfigured(), reachable: redisReachable },
    lastEventAt,
    lastEventAgeSec: ageSec(lastEventAt, now),
    contact: {
      latestAt: latestContact?.createdAt ?? 0,
      ageSec: latestContact ? ageSec(latestContact.createdAt, now) : null,
      emailSentOk,
      emailErrorAt,
      errorRatePct,
    },
  };
}