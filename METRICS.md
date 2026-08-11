# معیارهای Analytics — تعاریف رسمی (§۶.۲)

این سند تعریف دقیق هر معیار نمایش‌داده‌شده در داشبورد ghanbariomid.ir است. هر
تعریف باید با پیاده‌سازی در کد هم‌خانواده بماند؛ اگر عددی با این تعریف هم‌خوانی
نداشت، باگ حساب می‌شود نه «تفاوت روش جمع‌آوری».

## شناسه‌ها (unit of analysis)

| مفهوم | تعریف | شناسه‌ی واقعی |
| --- | --- | --- |
| Visitor | یک مرورگر ناشناس که کوکی `ano_vid` دارد | `visitorId` (UUID تصادفی، بدون fingerprinting، TTL یک سال) |
| Session | یک بازه‌ی فعالیت پیوسته از یک visitor با کوکی `ano_sid` | `sessionId` (UUID، TTL ۳۰ دقیقه‌ی عدم فعالیت) |
| Event | یک رویداد ثبت‌شده با `eventName` معتبر | `eventId` (UUID، deduplicate در ذخیره‌سازی) |

> نکته: همه‌ی شناسه‌ها سمت client ساخته می‌شوند و در کوکی/پارامتر ارسال
> می‌شوند؛ سرور هیچ‌گاه شناسه نمی‌سازد مگر در fallback (بدون کوکی).

## معیارهای اصلی

| معیار | تعریف دقیق | مبنای کد |
| --- | --- | --- |
| Visitors | تعداد **visitorهای یکتا** در بازه (set بر اساس `visitorId`) | `store.ts → dayVisitors` |
| New / Returning | New = اولین رویداد مشاهدشده‌ی آن visitor؛ Returning = قبلاً دیده شده | `isNewVisitor` در `trackEvent` |
| Sessions | تعداد **sessionهای یکتا** در بازه (set بر اساس `sessionId`) | `daySessions` / `dmSessions` |
| Page Views | تعداد رویدادهای `PAGE_VIEW` | `metricIncrementsForEvent` |
| Project Views | تعداد رویدادهای `PROJECT_VIEW` (با `projectSlug`) | همان |
| Bounce Rate | نسبت sessionهای **بدون هیچ رویداد `PAGE_VIEW`** به کل sessionها در بازه — `max(0, sessions − pageViews) / sessions` | سرویس `averageBounceRate` |
| Conversion | **Successful Contact Stored** — یعنی پیام با موفقیت در ذخیره‌سازی ثبت شده (نه فقط submit) | `conversionRate = contacts / formViews` |
| Abandonment | سهمی از بازدیدکنندگان فرم که شروع کردند ولی به موفقیت نرسیدند | `abandonmentRate = (formStarts − formSuccess) / formStarts` |
| Spam Rate | سهم اسپم از کل ارسال‌ها | `spamRate = spam / (contacts + spam)` |
| Form Error Rate | سهم خطاهای فرم از کل نمایش‌های فرم (۳۰ روز) | `formErrors / formViews` |

## Conversion و «Successful Contact Stored»

معیار اصلی تبدیل، **ثبت موفق پیام در ذخیره‌سازی** است (rogate از `persistContact`).
رویداد `CONTACT_FORM_SUCCESS` نماینده‌ی همان لحظه است اما تنها وقتی «شمارنده‌ی
conversion» را بالا می‌برد که پیام واقعاً ذخیره شده باشد. این دو جریان در
`/api/contact` هماهنگ‌اند:

1. `persistContact` موفق → رویداد `CONTACT_FORM_SUCCESS` ثبت می‌شود و `contacts+1`.
2. خطای SMTP بر ثبت تأثیری ندارد (درخواست موفق می‌ماند، پیام «انبارشده» است).
3. اسپم/تکراری بودن → status جداگانه، ولی در count پیام‌های ذخیره‌شده حساب می‌شود.

## Project Conversion

کلیک روی یک پروژه که به آن `projectViewedAt`/`projectSlug` نسبت می‌دهیم؛ اگر
within همان window زمانی (پیش‌فرض: همان session) پیام ذخیره‌شود و پروژه در
`contactProjectSlug` ثبت شده باشد، به آن پروژه attribution می‌شود.

## UTM و منابع ترافیک

منبع هر رویداد با `classifySource` تعیین می‌شود:

- `utm_source + utm_medium + utm_campaign` کامل → `campaign`
- referrer شامل google/bing/yahoo/duckduckgo → `search`
- referrer شامل instagram/linkedin/x/twitter/telegram/youtube → `social`
- referrer دیگر → `referral`
- بدون referrer → `direct`

## Project Views → Conversion window

زمان بین `PROJECT_VIEW` و `CONTACT_FORM_SUCCESS` برای «لید از پروژه» سنجیده
می‌شود؛ فقط اگر در همان session باشد به پروژه نسبت داده می‌شود.

## قوانین deduplication و پنجره‌ها

- Events: dedupe با `eventId` (یک بار در هر backend).
- Duplicate submissions: hash یکتای (email, message, ip) در پنجره‌ی پیکربندی
  `duplicateWindowHours` → نتیجه در status پیام منعکس می‌شود.
- Visitors/Sessions: چون شناسه‌ها client-side هستند، هر پاک‌کردن کوکی یک
  visitor جدید می‌سازد؛ این محدودیت مستند است نه باگ.

## سنجش سلامتِ معیارها (Data Quality)

رفتارهایی که در UI/code به عنوان «فلاگ کیفیت داده» نشان داده می‌شوند:

| سناریو | نشانه |
| --- | --- |
| آخرین رویداد خیلی قدیمی است | پنل سلامت «آخرین رویداد تحلیلی» |
| نرخ خطای فرم بالا | هشدار `نرخ خطای فرم ≥ فرمErrorPct` |
| سهم اسپم بالا | هشدار `سهم اسپم ≥ spamPct` |
| افت شدید ترافیک | هشدار `کاهش ترافیک ≥ trafficDropPct` |
| نرخ رهاسازی بالا | هشدار `abandonmentRate ≥ ۶۰٪` |