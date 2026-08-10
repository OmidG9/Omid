/**
 * Contact / lead domain types.
 *
 * `status` is the admin-facing lead state; `processing` describes the internal
 * submission lifecycle. Processing states are never exposed in the admin UI as
 * primary statuses (see master prompt §42).
 */

import type { DeviceType, TrafficSource } from './analytics';

export const CONTACT_STATUS = {
  NEW: 'NEW',
  READ: 'READ',
  REPLIED: 'REPLIED',
  ARCHIVED: 'ARCHIVED',
  SPAM: 'SPAM',
} as const;

export type ContactStatus =
  (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS];

export const CONTACT_PROCESSING = {
  RECEIVED: 'RECEIVED',
  VALIDATED: 'VALIDATED',
  STORED: 'STORED',
  EMAIL_PENDING: 'EMAIL_PENDING',
  EMAIL_SENT: 'EMAIL_SENT',
  EMAIL_ERROR: 'EMAIL_ERROR',
  FAILED: 'FAILED',
  SPAM: 'SPAM',
  BLOCKED: 'BLOCKED',
} as const;

export type ContactProcessing =
  (typeof CONTACT_PROCESSING)[keyof typeof CONTACT_PROCESSING];

export const SUBMISSION_RESULT = {
  SUCCESS: 'success',
  SPAM: 'spam',
  BLOCKED: 'blocked',
  RATE_LIMITED: 'rate_limited',
  ERROR: 'error',
} as const;

export type SubmissionResult =
  (typeof SUBMISSION_RESULT)[keyof typeof SUBMISSION_RESULT];

export const FORM_ERROR_TYPE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SPAM_BLOCKED: 'SPAM_BLOCKED',
  SERVER_ERROR: 'SERVER_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type FormErrorType = (typeof FORM_ERROR_TYPE)[keyof typeof FORM_ERROR_TYPE];

export const FORMAT_ERROR_TYPES: readonly FormErrorType[] = [
  FORM_ERROR_TYPE.VALIDATION_ERROR,
  FORM_ERROR_TYPE.RATE_LIMITED,
  FORM_ERROR_TYPE.SPAM_BLOCKED,
  FORM_ERROR_TYPE.SERVER_ERROR,
  FORM_ERROR_TYPE.EMAIL_ERROR,
  FORM_ERROR_TYPE.UNKNOWN_ERROR,
];

export const CONTACT_TIMELINE_EVENT = {
  ARRIVED: 'visitor arrived',
  VIEWED_PROJECT: 'viewed project',
  OPENED_FORM: 'opened contact form',
  STARTED_FORM: 'started contact form',
  SUBMITTED_FORM: 'submitted contact form',
  REQUEST_STORED: 'request stored',
  EMAIL_SENT: 'email sent',
  EMAIL_ERROR: 'email error',
} as const;

export type ContactTimelineEventName =
  (typeof CONTACT_TIMELINE_EVENT)[keyof typeof CONTACT_TIMELINE_EVENT];

export interface ContactTimelineEvent {
  name: ContactTimelineEventName;
  at: number;
  detail?: string;
}

export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  processing: ContactProcessing;
  source: TrafficSource;
  referrer?: string;
  landingPage?: string;
  projectSlug?: string;
  campaign?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  language?: string;
  /** Deterministic spam score 0–100. */
  spamScore: number;
  spamFlags: string[];
  duplicateOf?: string;
  createdAt: number;
  timeline: ContactTimelineEvent[];
}

export const CONTACT_STATUSES: readonly ContactStatus[] = [
  CONTACT_STATUS.NEW,
  CONTACT_STATUS.READ,
  CONTACT_STATUS.REPLIED,
  CONTACT_STATUS.ARCHIVED,
  CONTACT_STATUS.SPAM,
];