# IMPLEMENTATION ROADMAP — تکمیل فازهای MASTER PROMPT

> وضعیت فعلی: حدود ۶۰٪ از MASTER PROMPT پیاده‌سازی شده است.
> این سند ترتیب دقیق و قدم‌به‌قدم تکمیل فازهای باقی‌مانده را مشخص می‌کند.

## نماد وضعیت

- `[x]` انجام شده
- `[~]` ناقص — نیاز به تکمیل یا اصلاح
- `[ ]` انجام نشده

---

## خلاصه وضعیت فازها

| اولویت | فاز | درصد فعلی | هدف این مرحله |
|---|---|---|---|
| ۱ | فاز ۸ — Testing & Quality Gate | ~۱۵٪ | ایجاد تست، typecheck، بررسی build |
| ۲ | فاز ۴ — Contacts | ~۶۰٪ | جستجو، تایملاین، attribution، CSV، Recent Requests |
| ۳ | فاز ۳ — Dashboard | ~۶۵٪ | کارت Growth/Conversion، نمودار تعاملی، Form Health |
| ۴ | فاز ۵ — Security | ~۷۵٪ | رفع نقایص honeypot، timing، threshold، duplicate |
| ۵ | فاز ۲ — Analytics | ~۸۵٪ | رفع UTM، ثبت رویدادهای مفقود |
| ۶ | Observability + Data Quality | ~۱۵٪ | پنل System Health و تعریف معیارها |
| ۷ | فاز ۷ — Polish | ~۵۵٪ | error/loading boundaries، responsive، a11y |

---

# مرحله ۱ — فاز ۸: Testing & Quality Gate

## ۱.۱ زیرساخت تست

- [ ] افزودن `vitest` + `@testing-library/react` به devDependencies (دلایل: سرویس‌ها Pure/مستقل هستند، نیاز به Jest config سنگین نیست).
- [ ] افزودن اسکریپت‌ها به `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
  ```
- [ ] ساخت پوشه‌ی `src/lib/__tests__/` و `src/app/api/contact/__tests__/`.

## ۱.۲ تست‌های Contact (بایدها طبق سند §۷۶)

- [ ] Valid submission → 200 و ذخیره شدن contact
- [ ] Invalid email → 400 `VALIDATION_ERROR`
- [ ] Missing fields → 400
- [ ] Maximum length → رد شدن
- [ ] XSS payloads: `<script>alert('x')</script>`، `<img src=x onerror=alert(1)>`، `<svg onload=alert(1)>`، `javascript:alert(1)` → ذخیره/رندر امن، بدون اجرا (§۷۷)
- [ ] Honeypot → دریافت نشدن درخواست واقعی
- [ ] Rate limiting → 429 بعد از آستانه
- [ ] Spam detection → `spamScore` و وضعیت SPAM
- [ ] Duplicate detection → flag شدن تکرار

## ۱.۳ تست‌های Analytics (§۷۶)

- [ ] Page view
- [ ] Project view
- [ ] Contact form view
- [ ] Contact submission
- [ ] محاسبه conversion
- [ ] محاسبه growth (از جمله حالت‌های `0 → positive` و `positive → 0` و negative)

## ۱.۴ تست‌های Security (§۷۶)

- [ ] دسترسی غیرمجاز به `/admin/*` و `/api/admin/*` → ریدایرکت/۴۰۱
- [ ] Invalid payload
- [ ] Rate limit
- [ ] XSS
- [ ] Spam classification

## ۱.۵ Quality Gate

- [ ] اجرای `npm run lint` و اصلاح خطاها
- [ ] اجرای `npm run typecheck` و رسیدن به صفر خطا
- [ ] اجرای `npm run build` (تست production build)
- [ ] بررسی دستی مسیر Definition of Done سند (§۸۳): Visitor → … → Admin Dashboard

**معیار قبولی:** `lint`، `typecheck`، `build` و `test` همه سبز.

---

# مرحله ۲ — فاز ۴: تکمیل Contacts

## ۲.۱ جستجو در UI

- [ ] افزودن input جستجو به `src/app/admin/(dashboard)/contacts/page.tsx`
- [ ] اتصال به پارامتر query `q` (بک‌اند آماده است: `store.ts:346-354`)
- [ ] حفظ پارامترهای `q`, `status`, `from`, `to` در pagination (با `withParam` موجود)

## ۲.۲ CSV Export (§۶۴)

- [ ] ساخت کامپوننت/اکشن `exportContactsCsv` (داخل `contactService` یا اکشن سرور)
- [ ] ستون‌ها: Status, Name, Email, Subject, Source, Created, Project
- [ ] دکمه «Export CSV» در Contacts با `Content-Type: text/csv`
- [ ] (اختیاری بعداً) Export خلاصه‌ی Analytics

## ۲.۳ Lead Timeline (§۳۷)

- [ ] تکمیل ثبت رویدادها در `contactService.ts` / `ContactForm.tsx`:
  - `ARRIVED`, `VIEWED_PROJECT`, `OPENED_FORM`, `STARTED_FORM`, `SUBMITTED_FORM` (موجود), `REQUEST_STORED`, `EMAIL_SENT`, `EMAIL_ERROR`
- [ ] رندر Timeline در `src/app/admin/(dashboard)/contacts/[id]/page.tsx`

## ۲.۴ Project → Lead Attribution (§۳۶) — باگ اصلی

- [ ] رفع: `projectSlug` هیچ‌وقت ست نمی‌شود
  - مسیر پیشنهادی: در `/api/contact` خواندن `projectSlug` از body و validation، سپس پاس به `persistContact`
  - کلاینت: ثبت آخرین پروژه‌ی دیده‌شده (state اشتراکی سبک یا field مخفی در فرم که `ProjectViewTracker` آن را به‌روز می‌کند)
- [ ] نمایش Project در دیتیل contact و ستون Sources

## ۲.۵ Recent Requests + اندیکاتور New (§۳۳، §۳۴)

- [ ] سکشن «Recent Contact Requests» در داشبورد (استفاده از `recentContacts(limit)` که در `store.ts:360` موجود است ولی استفاده نمی‌شود)
- [ ] اتصال `newRequests` badge در `AdminShell.tsx` (prop موجود، مقداردهی نشده)

## ۲.۶ بازبینی Detail page

- [ ] جستجوی Missing fields: `subject`, `source`, `project`, `createdAt` همه قابل مشاهده باشند
- [ ] Collapsible بخش Technical (§۳۰)

**معیار قبولی:** جستجو/فیلتر/اکسپورت کار می‌کند؛ هر lead به پروژه‌ی دیده‌شده لینک می‌خورد؛ تایملاین کامل؛ داشبورد آخرین درخواست‌ها و نشانگر New را نشان می‌دهد.

---

# مرحله ۳ — فاز ۳: تکمیل Dashboard

## ۳.۱ کارت‌های KPI (§۸)

- [ ] افزودن کارت **Conversion Rate** (مقدار + درصد تغییر) — اتصال به `analyticsService` (گرفتن `conversionRate` در بازه‌ی جاری/قبلی)
- [ ] افزودن کارت **Growth** (§۲۱) با تفاوت درصدی
- [ ] افزودن `change` به کارت Sessions (در `analyticsService.ts:237-242` فقط ۴ متریک compare دارد)
- [ ] نمایش عدد دوره‌ی قبل در `MetricCard` (الان فقط درصد را نشان می‌دهد)

## ۳.۲ Traffic Chart تعاملی (§۲۰)

- [ ] تبدیل نمودار صفحه‌ی اول به کامپوننت کلاینت با سوییچ متریک (Visitors / Sessions / Page Views)
- [ ] سوییچ Daily / Weekly (برای بازه‌های ۳۰/۹۰ روزه)
- [ ] (پشتیبانی aggregate هفتگی در `analyticsService` یا یک utility در `lib/utils/metrics.ts`)

## ۳.۳ سکشن‌های داشبورد (§۷)

- [ ] افزودن **Form Health** روی داشبورد (از `getHealth` موجود در `analyticsService.ts:310-319`)
- [ ] (اختیاری) افزودن Browsers در کنار Devices (طبق §۱۸ — الان Devices صفحه‌ی جدا دارد ولی در داشبورد referrers جایگزین شده)

## ۳.۴ Insights و Alerts

- [ ] چک‌لیست کامل شدن rule-based insights (§۲۲): growth، top project، source→lead، device share، conversion drop
- [ ] آستانه‌های Alerts به تنظیمات واقعی وصل شوند (§۲۳، پس از مرحله ۴)

**معیار قبولی:** داشبورد هر ۱۳ سؤال سند §۲ را در ~۳۰ ثانیه جواب می‌دهد.

---

# مرحله ۴ — فاز ۵: تکمیل Security

## ۴.۱ Honeypot (§۴۵)

- [ ] رفع dead code: فیلد `company` با `z.string().max(0)` باعث ۴۰۰ می‌شود و مسیر سایلنت ۲۰۰ هرگز اجرا نمی‌شود
  - [ ] حذف `max(0)` از schema یا جابجایی چک به route قبل از Zod
  - [ ] در صورت فیل بودن honeypot → پاسخ ۲۰۰ سایلنت + لاگ `SPAM_DETECTED` (بدون افشای دلیل)

## ۴.۲ Timing Analysis (§۴۶)

- [ ] `formTimeMs`/`pageTimeMs` الان ثبت می‌شوند ولی تحلیل نمی‌شوند
- [ ] اعمال به `scoreSpam`: ارسال فوق‌سریع → امتیاز +SUSPICIOUS (اما بدون بلاک خودکار)

## ۴.۳ Spam Score قابل‌تنظیم (§۴۷، §۲۳)

- [ ] threshold 60 سخت‌کد شده در `contactService.ts:116-118` و `contact/route.ts:86`
- [ ] اتصال `spamScoreThreshold` از Settings به هر دو مکان
- [ ] آستانه‌های Alerts (traffic>۳۰٪، form error>۵٪، spam>۵۰٪) از Settings خوانده شوند

## ۴.۴ Duplicate Detection (§۵۰)

- [ ] رفع ذخیره‌ی plaintext email در کلید Redis (`sha256:${email}` واقعاً hash شود)
- [ ] ست‌کردن `duplicateOf` روی رکورد flagged (`contactService.ts:130`)

## ۴.۵ Security Events (§۵۷)

- [ ] ثبت `SUSPICIOUS_REQUEST` و `BLOCKED_REQUEST` (الان تعریف شده‌اند ولی هیچ‌جا لاگ نمی‌شوند)
- [ ] رویداد مستقل honeypot

## ۴.۶ Settings واقعی (§۲۴، §۲۳)

- [ ] `api/admin/settings` الان فقط validate می‌کند و `persisted:false` برمی‌گرداند — هیچ‌چیز ذخیره نمی‌شود
- [ ] پیاده‌سازی ذخیره‌سازی (در Redis با key مثل `ano:settings`)
- [ ] اتصال thresholdها و retentionها به رفتار واقعی (rate limiter، spam، TTL ها)

**معیار قبولی:** هیچ مسیر dead-code امنیتی نمانده؛ همه‌ی آستانه‌ها از Settings خوانده می‌شوند؛ لاگ‌های امنیتی کامل.

---

# مرحله ۵ — فاز ۲: رفع نقایص Analytics

## ۵.۱ UTM capture (§۱۵)

- [ ] باگ: `client.ts:136` کلید `utm_source` را به `utmsource` تبدیل می‌کند در حالی که سرور `utmSource` را می‌خواند → UTM ها ساکت حذف می‌شوند
- [ ] رفع مپینگ کلیدها در client و تست یکپارچه‌ی end-to-end

## ۵.۲ رویدادهای مفقود (§۱۰)

- [ ] `SESSION_START`: ثبت هنگام شروع session جدید
- [ ] `CONTACT_FORM_SUBMIT`: ثبت هنگام ارسال فرم (جدا از SUCCESS/ERROR)
- [ ] (بعد از آن) بررسی که `analyticsService` این رویدادها را مصرف می‌کند

## ۵.۳ Form Errorهای دقیق (§۴۱)

- [ ] الان فقط `SERVER_ERROR` ثبت می‌شود
- [ ] سرور باید `VALIDATION_ERROR`, `RATE_LIMITED`, `SPAM_BLOCKED`, `EMAIL_ERROR` را هم ثبت کند

**معیار قبولی:** UTM ها در dashboard دیده می‌شوند؛ جدول رویدادها کامل؛ error categorization دقیق.

---

# مرحله ۶ — Observability + Data Quality (افزوده‌های انتهای MASTER PROMPT)

## ۶.۱ System Health

- [ ] پنل Health در داشبورد یا صفحه‌ی Settings:
  - [ ] Analytics: وضعیت آخرین `track` event («Last tracking event: X min ago»)
  - [ ] Contact API: وضعیت آخرین submission + نرخ خطا
  - [ ] Email: وضعیت آخرین ارسال
  - [ ] Database: ping به Redis
- [ ] بدون overengineering — فقط چند check ساده (بدون SOC)

## ۶.۲ Data Quality & Metric Integrity

- [ ] تعریف صریح معیارها (در یک سند `METRICS.md` و بازتاب در کد):
  - Visitor: تعریف (anonymous id، window و...)
  - Session: شروع/پایان
  - Conversion: **Successful Contact Stored** (نه فقط Submit) — مطابق پیشنهاد سند
  - Returning Visitor: بر اساس چه شناسه‌ای
  - Bounce Rate: تعریف دقیق
  - Project Conversion: در چه window زمانی
- [ ] ساخت تابع/سرویس واحد برای این محاسبات تا همه‌ی صفحه‌ها یک‌دست باشند
- [ ] (اختیاری) یک سکشن «Data Quality» کوچک که این تعاریف را در UI نشان دهد

**معیار قبولی:** داشبورد اعداد «صحیح و قابل‌اعتماد» تولید می‌کند، نه اعداد حرفه‌ای‌نمای بی‌تعریف.

---

# مرحله ۷ — فاز ۷: Polish

## ۷.۱ Error / Loading boundaries

- [ ] `src/app/admin/error.tsx` (لایه‌ی مشترک)
- [ ] `src/app/admin/(dashboard)/error.tsx`
- [ ] `src/app/admin/loading.tsx` + skeleton
- [ ] استفاده از `LoadingState`/`ErrorState` در `StateViews.tsx` (الان dead exports هستند)
- [ ] try/catch در صفحات سمت سرور تا یک خطای Redis کل داشبورد را نکشد (§۷۴)

## ۷.۲ Responsive (§۷۱)

- [ ] تست/اصلاح داشبورد روی تبلت و موبایل (مخصوصاً جدول Contacts و charts)

## ۷.۳ Accessibility (§۷۲)

- [ ] `role="img"` + `tabindex` مناسب برای SVG charts
- [ ] ادامه‌ی ARIA در کارت‌های تعاملی

## ۷.۴ Performance (§۶۲، §۷۵)

- [ ] بررسی N+1 و aggregation queries
- [ ] بررسی caching / revalidation
- [ ] اطمینان از اینکه bundle ادمین روی سایت عمومی تأثیر نمی‌گذارد (§۹۳)

---

# معیار نهایی «Definition of Done» (§۸۳)

- [ ] چرخه: Visitor → Portfolio → Page View → Project View → Contact Form → Server Validation → Anti-Spam → Contact Stored → Analytics Updated → Email Notification → Admin Dashboard
- [ ] ادمین به همه‌ی ۱۳ سؤال §۸۳ جواب می‌دهد
- [ ] `lint` / `typecheck` / `build` / `test` سبز
- [ ] تست‌های امنیتی XSS پاس
- [ ] فرم با شکست analytics هیچ‌وقت درخواست واقعی را از دست نمی‌دهد (§۹۶)
- [ ] کاربر-محتوای تولیدشده نمی‌تواند اسکریپت اجرا کند (§۷۷)
- [ ] بدون لاگین دسترسی به analytics ممکن نیست (§۶۵)

---

## دستورالعمل‌های اجرایی (Rules of Engagement)

- هر مرحله فقط با وجود تست/تأیید قبلی، مرحله‌ی بعد را آغاز کند.
- تغییرات روی برنچ `dashboard`؛ کامیت فقط بعد از سبز بودن lint/typecheck/test.
- افزودن dependency جدید فقط در صورت توجیه (§۸۹).
- هر کامیت مربوط به یک مرحله باشد و پیام واضح داشته باشد.
