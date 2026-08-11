import { describe, it, expect, beforeEach } from 'vitest';
import { persistContact, scoreSpam } from '@/lib/services/contactService';
import { getStore, resetStoreForTests } from '@/lib/db';
import { CONTACT_PROCESSING, CONTACT_STATUS, CONTACT_TIMELINE_EVENT } from '@/types/contacts';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36';

beforeEach(() => {
  resetStoreForTests();
});

describe('persistContact', () => {
  it('stores a clean lead with processing=RECEIVED and status=NEW', async () => {
    const { contact, isDuplicate } = await persistContact({
      name: 'Ali Rezaei',
      email: 'Ali@Example.com',
      subject: 'Website contact form',
      message: 'I would like to discuss a project with you.',
      userAgent: UA,
      source: 'direct',
    });

    expect(isDuplicate).toBe(false);
    expect(contact.status).toBe(CONTACT_STATUS.NEW);
    expect(contact.processing).toBe(CONTACT_PROCESSING.RECEIVED);
    expect(contact.email).toBe('ali@example.com');
    // SUBMITTED_FORM + REQUEST_STORED are the two guaranteed server events (§37).
    expect(contact.timeline.map((t) => t.name)).toEqual([
      CONTACT_TIMELINE_EVENT.SUBMITTED_FORM,
      CONTACT_TIMELINE_EVENT.REQUEST_STORED,
    ]);
  });

  it('keeps an attribution slug onto the stored lead', async () => {
    const { contact } = await persistContact({
      name: 'Sam',
      email: 'sam@example.com',
      subject: 'Website contact form',
      message: 'Great portfolio, let us collaborate on analytics.',
      userAgent: UA,
      projectSlug: 'arash-dashboard',
    });
    expect(contact.projectSlug).toBe('arash-dashboard');
  });

  it('flags a spam-scored submission even when it is not a duplicate', async () => {
    const { contact } = await persistContact({
      name: 'Spammer',
      email: 'spam@example.com',
      subject: 'Website contact form',
      message: 'BUY BITCOIN NOW https://spam.example.com FREE MONEY 😀😀😀 CASINO OFFER WINNER CLAIM',
      userAgent: 'python-requests/2.31',
    });
    expect(contact.spamScore).toBeGreaterThanOrEqual(30);
    expect(contact.processing).toBe(CONTACT_PROCESSING.SPAM);
    expect(contact.status).not.toBe(CONTACT_STATUS.SPAM); // status is admin-facing
  });

  it('detects a duplicate of an earlier submission', async () => {
    await persistContact({
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
  });

  it('bumps the daily spam counter for spam submissions', async () => {
    await persistContact({
      name: 'Spammer',
      email: 'spam2@example.com',
      subject: 'Website contact form',
      message: 'BUY BITCOIN NOW https://spam.example.com FREE MONEY 😀😀😀 CASINO OFFER WINNER CLAIM',
      userAgent: 'python-requests/2.31',
    });
    const store = getStore();
    const metrics = await store.getDailyMetrics([new Date().toISOString().slice(0, 10)]);
    expect(metrics[0]?.spam).toBe(1);
  });
});

describe('store contact queries (§33–34)', () => {
  it('filters contacts by search term (name/email/subject)', async () => {
    await persistContact({
      name: 'Ali Rezaei',
      email: 'ali@example.com',
      subject: 'Website contact form',
      message: 'I would like to discuss a project with you.',
      userAgent: UA,
    });
    await persistContact({
      name: 'Zahra',
      email: 'zahra@example.com',
      subject: 'Partnership',
      message: 'Let us collaborate on something exciting!',
      userAgent: UA,
    });

    const store = getStore();
    const byName = await store.listContacts({ page: 1, pageSize: 10, q: 'ali' });
    expect(byName.total).toBe(1);
    expect(byName.items[0].email).toBe('ali@example.com');

    const bySubject = await store.listContacts({ page: 1, pageSize: 10, q: 'partnership' });
    expect(bySubject.total).toBe(1);
    expect(bySubject.items[0].name).toBe('Zahra');

    const byEmail = await store.listContacts({ page: 1, pageSize: 10, q: 'zahra@example' });
    expect(byEmail.total).toBe(1);
  });

  it('returns the most recent contacts first via recentContacts', async () => {
    for (let i = 0; i < 4; i++) {
      await persistContact({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        subject: 'Website contact form',
        message: `A sufficiently long message number ${i} to pass validation.`,
        userAgent: UA,
      });
      await new Promise((r) => setTimeout(r, 5));
    }
    const store = getStore();
    const recent = await store.recentContacts(2);
    expect(recent.length).toBe(2);
    expect(recent[0].name).toBe('User 3');
    expect(recent[1].name).toBe('User 2');
  });
});