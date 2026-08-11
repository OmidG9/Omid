import { describe, it, expect, beforeEach } from 'vitest';
import { getSettings, saveSettings, resetSettingsForTests, DEFAULT_SETTINGS } from '@/lib/settings';
import { resetStoreForTests, getStore } from '@/lib/db';
import { persistContact } from '@/lib/services/contactService';
import { CONTACT_PROCESSING } from '@/types/contacts';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36';

beforeEach(() => {
  resetSettingsForTests();
  resetStoreForTests();
});

describe('settings persistence (§24)', () => {
  it('returns defaults when nothing is stored', async () => {
    const s = await getSettings();
    expect(s.spamScoreThreshold).toBe(DEFAULT_SETTINGS.spamScoreThreshold);
    expect(s.rateLimitPerIp).toBe(DEFAULT_SETTINGS.rateLimitPerIp);
  });

  it('round-trips saved values and clamps out-of-range input', async () => {
    const saved = await saveSettings({ spamScoreThreshold: 45, rateLimitPerIp: 9999 });
    expect(saved.spamScoreThreshold).toBe(45);
    expect(saved.rateLimitPerIp).toBe(1000); // clamped
    const reread = await getSettings();
    expect(reread.spamScoreThreshold).toBe(45);
    expect(reread.rateLimitPerIp).toBe(1000);
  });

  it('merges partial updates into persisted state', async () => {
    await saveSettings({ duplicateWindowHours: 12 });
    const after = await saveSettings({ alertFormErrorPct: 8 });
    expect(after.duplicateWindowHours).toBe(12);
    expect(after.alertFormErrorPct).toBe(8);
    expect(after.rateLimitPerIp).toBe(DEFAULT_SETTINGS.rateLimitPerIp);
  });
});

describe('configurable spam threshold (§47)', () => {
  it('flags a borderline submission as SPAM only when the threshold is lowered', async () => {
    // URL + emoji = 30-ish; well below default 60 → RECEIVED.
    const clean = await persistContact({
      name: 'Dev',
      email: 'dev@example.com',
      subject: 'Website contact form',
      message: 'Nice work! https://example.com/reference 💡 would love to chat.',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
    });
    expect(clean.contact.processing).toBe(CONTACT_PROCESSING.RECEIVED);

    // Same body, but a strict site threshold (15) → flagged SPAM.
    const strict = await persistContact({
      name: 'Dev',
      email: 'dev2@example.com',
      subject: 'Website contact form',
      message: 'Nice work! https://example.com/reference 💡 would love to chat.',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      spamThreshold: 15,
    });
    expect(strict.contact.processing).toBe(CONTACT_PROCESSING.SPAM);
  });
});

describe('duplicate detection (§50)', () => {
  it('stores the prior contact id in duplicateOf and never the raw hex prefix', async () => {
    const first = await persistContact({
      name: 'Dupe',
      email: 'dupe@example.com',
      subject: 'Website contact form',
      message: 'First message that is long enough to store.',
      userAgent: UA,
    });
    const second = await persistContact({
      name: 'Dupe',
      email: 'dupe@example.com',
      subject: 'Website contact form',
      message: 'Second message that is also long enough to store.',
      userAgent: UA,
    });
    expect(second.isDuplicate).toBe(true);
    expect(second.duplicateOf).toBe(first.contact.id);

    // The duplicate key must not embed the plaintext email (real hash only).
    const store = getStore() as unknown as { debug: { duplicateHashes: Map<string, string> } };
    for (const key of store.debug.duplicateHashes.keys()) {
      expect(key).not.toContain('dupe@example.com');
      expect(key.startsWith('sha256:')).toBe(true);
    }
  });
});