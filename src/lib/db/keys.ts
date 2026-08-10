/**
 * Redis key layout. Keys stay consistent between the Redis backend and the
 * in-memory fallback so both behave identically.
 */

export const TTL = {
  EVENT: 90 * 86_400, // raw analytics events: 90 days
  SESSION: 90 * 86_400,
  VISITOR: 366 * 86_400,
  SECURITY: 90 * 86_400,
  DUPLICATE: 24 * 3_600,
  VISITOR_DAY: 400 * 86_400,
} as const;

export const K = {
  event: (id: string) => `ano:event:${id}`,
  visitor: (vid: string) => `ano:v:${vid}`,
  visitorSessions: (vid: string) => `ano:v:${vid}:s`,
  session: (sid: string) => `ano:s:${sid}`,
  sessionIndex: () => 'ano:sidx',
  dmCounters: (date: string) => `ano:dm:${date}:c`,
  dmPages: (date: string) => `ano:dm:${date}:p`,
  dmProjects: (date: string) => `ano:dm:${date}:pr`,
  dmSources: (date: string) => `ano:dm:${date}:src`,
  dmDevices: (date: string) => `ano:dm:${date}:dev`,
  dmBrowsers: (date: string) => `ano:dm:${date}:br`,
  dmOS: (date: string) => `ano:dm:${date}:os`,
  dmErrors: (date: string) => `ano:dm:${date}:err`,
  dmVisitors: (date: string) => `ano:dm:${date}:v`,
  dmNew: (date: string) => `ano:dm:${date}:new`,
  dmRet: (date: string) => `ano:dm:${date}:ret`,
  dmSessions: (date: string) => `ano:dm:${date}:s`,
  dmIndex: () => 'ano:dmidx',
  contact: (id: string) => `ct:${id}`,
  contactSorted: () => 'ct:sorted',
  contactStatus: (status: string) => `ct:st:${status}`,
  contactHash: (hash: string) => `ct:h:${hash}`,
  security: (id: string) => `sec:${id}`,
  securityType: (type: string) => `sec:st:${type}`,
  securityAll: () => 'sec:z',
} as const;

/** Hash fields for visitor records. */
export const VF = {
  firstSeen: 'f',
  lastSeen: 'l',
  device: 'd',
  browser: 'b',
  os: 'o',
  language: 'lang',
  sessionCount: 'sc',
} as const;