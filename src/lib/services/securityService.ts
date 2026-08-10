/** Lightweight security-event logging. Never stores PII or message content. */

import { getStore } from '@/lib/db';
import type { SecurityEventType } from '@/types/security';

export interface LogSecurityInput {
  type: SecurityEventType;
  ip?: string;
  path?: string;
  reason?: string;
  meta?: Record<string, string | number>;
}

export async function logSecurityEvent(input: LogSecurityInput): Promise<void> {
  try {
    await getStore().recordSecurityEvent({
      id: crypto.randomUUID(),
      type: input.type,
      at: Date.now(),
      ip: input.ip,
      path: input.path,
      reason: input.reason,
      meta: input.meta,
    });
  } catch (error) {
    // Logging must never break the caller (contact flow, auth).
    console.error('[security] failed to record event:', error);
  }
}