/**
 * Contact/lead service — full submission pipeline (persist → classify → dedup)
 * without blocking the email send. Persistence outlives email failure:
 * a stored request is never lost even if SMTP times out.
 *
 * Never introduces PII into security events; duplicates/spam are flagged on
 * the ContactRequest itself.
 */

import { getStore } from '@/lib/db';
import type { ContactRequest, ContactTimelineEvent } from '@/types/contacts';
import { CONTACT_STATUS, CONTACT_PROCESSING, CONTACT_TIMELINE_EVENT } from '@/types/contacts';
import { TRAFFIC_SOURCE, type TrafficSource } from '@/types/analytics';
import { classifySource, parseClientInfo } from '@/lib/analytics/userAgent';
import { dateKey } from '@/lib/utils/date';

export interface PersistContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  ip?: string;
  userAgent?: string;
  referrer?: string | null;
  landingPage?: string;
  projectSlug?: string;
  /** Known analytics container ids already provided by the client SDK. */
  visitorId?: string;
  sessionId?: string;
  /** Server-assigned; respects order of the analytics pipeline. */
  source?: TrafficSource;
  campaign?: string;
}

export interface PersistContactResult {
  contact: ContactRequest;
  duplicateOf?: string;
  isDuplicate: boolean;
}

function timeline(name: ContactTimelineEvent['name'], at: number, detail?: string): ContactTimelineEvent {
  return { name, at, detail };
}

/**
 * Deterministic but intentionally simple spam heuristics (MVP). Returns a
 * 0–100 score plus human-readable flags.
 */
export function scoreSpam(input: {
  name: string;
  email: string;
  message: string;
  userAgent?: string;
}): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];
  const { name, email, message, userAgent } = input;

  if (/https?:\/\//i.test(message)) {
    score += 20;
    flags.push('contains-link');
  }
  if (/[\u{1F600}-\u{1FAFF}]+/u.test(message)) {
    score += 10;
    flags.push('emoji-heavy');
  }
  if (message.toUpperCase() === message && message.replace(/[^\p{L}]/gu, '').length > 30) {
    score += 15;
    flags.push('all-caps');
  }
  if ((message.match(/\b(img|spam|free|buy|offer|bitcoin|casino)\b/i) ?? []).length > 0) {
    score += 15;
    flags.push('spam-keywords');
  }
  const ua = (userAgent ?? '').toLowerCase();
  if (!ua || ua.includes('curl') || ua.includes('python-requests') || ua.includes('headless') || ua.includes('bot')) {
    score += 20;
    flags.push('suspicious-ua');
  }
  if (score > 0) {
    // Cap per-rule weighting: the most extreme submissions reach the threshold
    // so real users with a single link still land below it.
    score = Math.min(score, 90);
  }
  return { score, flags };
}

/** Deterministic duplicate key within the configured window (email, not full text). */
function duplicateHash(email: string): string {
  try {
    return `sha256:${email.trim().toLowerCase()}`;
  } catch {
    return `sha1:${email.trim().toLowerCase()}`;
  }
}

export async function persistContact(input: PersistContactInput): Promise<PersistContactResult> {
  const store = getStore();
  const now = Date.now();
  const ua = input.userAgent ?? '';
  const device = parseClientInfo(ua);
  const source = input.source ?? classifySource({ referrer: input.referrer });
  const spam = scoreSpam(input);

  const dupHash = duplicateHash(input.email);
  const isDuplicate = !(await store.claimDuplicate(dupHash, `${now}:${input.email}`));

  const id = crypto.randomUUID();
  const contact: ContactRequest = {
    id,
    name: input.name.trim().slice(0, 60),
    email: input.email.trim().slice(0, 120).toLowerCase(),
    subject: input.subject.trim().slice(0, 200),
    message: input.message.trim().slice(0, 2000),
    status: isDuplicate ? CONTACT_STATUS.SPAM : CONTACT_STATUS.NEW,
    processing: spam.score >= 60 || isDuplicate
      ? CONTACT_PROCESSING.SPAM
      : CONTACT_PROCESSING.RECEIVED,
    source,
    referrer: input.referrer ?? undefined,
    landingPage: input.landingPage,
    projectSlug: input.projectSlug,
    campaign: input.campaign,
    deviceType: device.deviceType,
    browser: device.browser,
    os: device.os,
    language: undefined,
    spamScore: spam.score,
    spamFlags: spam.flags,
    duplicateOf: undefined,
    createdAt: now,
    timeline: [timeline(CONTACT_TIMELINE_EVENT.SUBMITTED_FORM, now)],
  };

  await store.recordContact(contact);
  await store.bumpDailyCounter(dateKey(now), spam.score >= 60 || isDuplicate ? 'spam' : 'contacts');
  return { contact, isDuplicate };
}