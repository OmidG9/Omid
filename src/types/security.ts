/** Security event domain types. Events never contain private form content. */

export const SECURITY_EVENT = {
  SPAM_DETECTED: 'SPAM_DETECTED',
  RATE_LIMIT_TRIGGERED: 'RATE_LIMIT_TRIGGERED',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
  BLOCKED_REQUEST: 'BLOCKED_REQUEST',
  AUTH_FAILURE: 'AUTH_FAILURE',
} as const;

export type SecurityEventType =
  (typeof SECURITY_EVENT)[keyof typeof SECURITY_EVENT];

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  at: number;
  ip?: string;
  path?: string;
  reason?: string;
  /** e.g. spam score, rate limit count. Never stores PII or message content. */
  meta?: Record<string, string | number>;
}