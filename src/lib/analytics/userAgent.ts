/**
 * Minimal UA parsing at family level (master prompt §18–19). No fingerprints,
 * no versions — just the families the dashboard needs.
 */

import { DEVICE, TRAFFIC_SOURCE } from '@/types/analytics';
import type { DeviceType, TrafficSource } from '@/types/analytics';

export function detectDevice(ua: string): DeviceType {
  const u = ua.toLowerCase();
  if (/(ipad|tablet|kindle|silk|playbook)/i.test(u)) return DEVICE.TABLET;
  if (/(mobi|iphone|ipod|android|phone)/i.test(u)) return DEVICE.MOBILE;
  return DEVICE.DESKTOP;
}

export function detectBrowser(ua: string): string {
  const u = ua.toLowerCase();
  if (u.includes('edg/')) return 'Edge';
  if (u.includes('opr/') || u.includes('opera')) return 'Opera';
  if (u.includes('firefox/')) return 'Firefox';
  if (u.includes('samsungbrowser')) return 'Samsung';
  if (u.includes('chrome/')) return 'Chrome';
  if (u.includes('crios')) return 'Chrome';
  if (u.includes('fxios')) return 'Firefox';
  if (/safari\//.test(u)) return 'Safari';
  return 'Other';
}

export function detectOS(ua: string): string {
  const u = ua.toLowerCase();
  if (u.includes('windows')) return 'Windows';
  if (u.includes('iphone') || u.includes('ipad') || u.includes('ios')) return 'iOS';
  if (u.includes('android')) return 'Android';
  if (u.includes('mac os x') || u.includes('macintosh')) return 'macOS';
  if (u.includes('linux')) return 'Linux';
  return 'Other';
}

export interface ParsedClientInfo {
  deviceType: DeviceType;
  browser: string;
  os: string;
}

export function parseClientInfo(ua: string): ParsedClientInfo {
  return {
    deviceType: detectDevice(ua),
    browser: detectBrowser(ua),
    os: detectOS(ua),
  };
}

const SEARCH_HOSTS = ['google', 'bing', 'duckduckgo', 'yandex', 'yahoo', 'ecosia', 'baidu'];
const SOCIAL_HOSTS = [
  'instagram.com',
  'linkedin.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  't.me',
  'telegram.me',
  'wa.me',
  'whatsapp.com',
  'github.com',
  'youtube.com',
  'discord.com',
  'tiktok.com',
];

function hostOf(url: string | undefined | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Classify a traffic source from referrer + UTM params (master prompt §15).
 * UTM campaign outranks raw referrer; explicit utm flags win over host lists.
 */
export function classifySource(opts: {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}): TrafficSource {
  const { referrer, utmSource, utmMedium, utmCampaign } = opts;
  const source = (utmSource ?? '').toLowerCase();
  const medium = (utmMedium ?? '').toLowerCase();

  if (utmCampaign && utmCampaign.length > 0) return TRAFFIC_SOURCE.CAMPAIGN;
  if (medium && ['cpc', 'paid', 'ppc', 'banner', 'display'].includes(medium)) {
    return TRAFFIC_SOURCE.CAMPAIGN;
  }
  if (source && source.length > 0) {
    if (SEARCH_HOSTS.some((h) => source.includes(h))) return TRAFFIC_SOURCE.SEARCH;
    if (SOCIAL_HOSTS.some((h) => source.includes(h))) return TRAFFIC_SOURCE.SOCIAL;
    return TRAFFIC_SOURCE.REFERRAL;
  }

  const ref = hostOf(referrer);
  if (!ref) return TRAFFIC_SOURCE.DIRECT;
  if (SEARCH_HOSTS.some((h) => ref.includes(h))) return TRAFFIC_SOURCE.SEARCH;
  if (SOCIAL_HOSTS.some((h) => ref.includes(h))) return TRAFFIC_SOURCE.SOCIAL;
  return TRAFFIC_SOURCE.REFERRAL;
}

export function shortHost(referrer: string | undefined | null): string {
  const host = hostOf(referrer);
  return host.replace(/^www\./, '') || 'direct';
}