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

- [x] افزودن `vitest` + `@testing-library/react` به devDependencies (دلایل: سرویس‌ها Pure/مستقل هستند، نیاز به Jest config سنگین نیست).
- [x] افزودن اسکریپت‌ها به `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
  ```
- [x] ساخت پوشه‌ی `src/lib/__tests__/` و `src/app/api/contact/__tests__/`.

## ۱.۲ تست‌های Contact (بایدها طبق سند §۷۶)

- [x] Valid submission → 200 و ذخیره شدن contact
- [x] Invalid email → 400 `VALIDATION_ERROR`
- [x] Missing fields → 400
- [x] Maximum length → رد شدن
- [x] XSS payloads: `<script>alert('x')</script>`، `<img src=x onerror=alert(1)>`، `<svg onload=alert(1)>`، `javascript:alert(1)` → ذخیره/رندر امن، بدون اجرا (§۷۷)
- [x] Honeypot → دریافت نشدن درخواست واقعی
- [x] Rate limiting → 429 بعد از آستانه
- [x] Spam detection → `spamScore` و وضعیت SPAM
- [x] Duplicate detection → flag شدن تکرار

## ۱.۳ تست‌های Analytics (§۷۶)

- [x] Page view
- [x] Project view
- [x] Contact form view
- [x] Contact submission
- [x] محاسبه conversion
- [x] محاسبه growth (از جمله حالت‌های `0 → positive` و `positive → 0` و negative)

## ۱.۴ تست‌های Security (§۷۶)

- [x] دسترسی غیرمجاز به `/admin/*` و `/api/admin/*` → ریدایرکت/۴۰۱
- [x] Invalid payload
- [x] Rate limit
- [x] XSS
- [x] Spam classification

## ۱.۵ Quality Gate

- [x] اجرای `npm run lint` و اصلاح خطاها
- [x] اجرای `npm run typecheck` و رسیدن به صفر خطا
- [x] اجرای `npm run build` (تست production build)
- [ ] بررسی دستی مسیر Definition of Done سند (§۸۳): Visitor → … → Admin Dashboard

**معیار قبولی:** `lint`، `typecheck`، `build` و `test` همه سبز.

---

# مرحله ۲ — فاز ۴: تکمیل Contacts

## ۲.۱ جستجو در UI

- [x] افزودن input جستجو به `src/app/admin/(dashboard)/contacts/page.tsx`
- [x] اتصال به پارامتر query `q` (بک‌اند آماده است: `store.ts:346-354`)
- [x] حفظ پارامترهای `q`, `status`, `from`, `to` در pagination (با `withParam` موجود)

## ۲.۲ CSV Export (§۶۴)

- [x] ساخت کامپوننت/اکشن `exportContactsCsv` (داخل `contactService` یا اکشن سرور)
- [x] ستون‌ها: Status, Name, Email, Subject, Source, Created, Project
- [x] دکمه «Export CSV» در Contacts با `Content-Type: text/csv`
- [ ] (اختیاری بعداً) Export خلاصه‌ی Analytics

## ۲.۳ Lead Timeline (§۳۷)

- [x] تکمیل ثبت رویدادها در `contactService.ts` / `ContactForm.tsx`:
  - `ARRIVED`, `VIEWED_PROJECT`, `OPENED_FORM`, `STARTED_FORM`, `SUBMITTED_FORM` (موجود), `REQUEST_STORED`, `EMAIL_SENT`, `EMAIL_ERROR`
- [x] رندر Timeline در `src/app/admin/(dashboard)/contacts/[id]/page.tsx`

## ۲.۴ Project → Lead Attribution (§۳۶) — باگ اصلی

- [x] رفع: `projectSlug` هیچ‌وقت ست نمی‌شود
  - مسیر پیشنهادی: در `/api/contact` خواندن `projectSlug` از body و validation، سپس پاس به `persistContact`
  - کلاینت: ثبت آخرین پروژه‌ی دیده‌شده (state اشتراکی سبک یا field مخفی در فرم که `ProjectViewTracker` آن را به‌روز می‌کند)
- [x] نمایش Project در دیتیل contact و ستون Sources

## ۲.۵ Recent Requests + اندیکاتور New (§۳۳، §۳۴)

- [x] سکشن «Recent Contact Requests» در داشبورد (استفاده از `recentContacts(limit)` که در `store.ts:360` موجود است ولی استفاده نمی‌شود)
- [x] اتصال `newRequests` badge در `AdminShell.tsx` (prop موجود، مقداردهی نشده)

## ۲.۶ بازبینی Detail page

- [x] جستجوی Missing fields: `subject`, `source`, `project`, `createdAt` همه قابل مشاهده باشند
- [x] Collapsible بخش Technical (§۳۰)

**معیار قبولی:** جستجو/فیلتر/اکسپورت کار می‌کند؛ هر lead به پروژه‌ی دیده‌شده لینک می‌خورد؛ تایملاین کامل؛ داشبورد آخرین درخواست‌ها و نشانگر New را نشان می‌دهد.

---

# مرحله ۳ — فاز ۳: تکمیل Dashboard

## ۳.۱ کارت‌های KPI (§۸)

- [x] افزودن کارت **Conversion Rate** (مقدار + درصد تغییر) — اتصال به `analyticsService` (گرفتن `conversionRate` در بازه‌ی جاری/قبلی)
- [x] افزودن کارت **Growth** (§۲۱) با تفاوت درصدی
- [x] افزودن `change` به کارت Sessions (در `analyticsService.ts:237-242` فقط ۴ متریک compare دارد)
- [x] نمایش عدد دوره‌ی قبل در `MetricCard` (الان فقط درصد را نشان می‌دهد)

## ۳.۲ Traffic Chart تعاملی (§۲۰)

- [x] تبدیل نمودار صفحه‌ی اول به کامپوننت کلاینت با سوییچ متریک (Visitors / Sessions / Page Views)
- [x] سوییچ Daily / Weekly (برای بازه‌های ۳۰/۹۰ روزه)
- [x] (پشتیبانی aggregate هفتگی در `analyticsService` یا یک utility در `lib/utils/metrics.ts`)

## ۳.۳ سکشن‌های داشبورد (§۷)

- [x] افزودن **Form Health** روی داشبورد (از `getHealth` موجود در `analyticsService.ts:310-319`)
- [ ] (اختیاری) افزودن Browsers در کنار Devices (طبق §۱۸ — الان Devices صفحه‌ی جدا دارد ولی در داشبورد referrers جایگزین شده)

## ۳.۴ Insights و Alerts

- [x] چک‌لیست کامل شدن rule-based insights (§۲۲): growth، top project، source→lead، device share، conversion drop
- [ ] آستانه‌های Alerts به تنظیمات واقعی وصل شوند (§۲۳، پس از مرحله ۴)

**معیار قبولی:** داشبورد هر ۱۳ سؤال سند §۲ را در ~۳۰ ثانیه جواب می‌دهد.

---

# مرحله ۴ — فاز ۵: تکمیل Security

## ۴.۱ Honeypot (§۴۵)

- [x] رفع dead code: فیلد `company` با `z.string().max(0)` باعث ۴۰۰ می‌شود و مسیر سایلنت ۲۰۰ هرگز اجرا نمی‌شود
  - [x] حذف `max(0)` از schema یا جابجایی چک به route قبل از Zod
  - [x] در صورت فیل بودن honeypot → پاسخ ۲۰۰ سایلنت + لاگ `SPAM_DETECTED` (بدون افشای دلیل)

## ۴.۲ Timing Analysis (§۴۶)

- [x] `formTimeMs`/`pageTimeMs` الان ثبت می‌شوند ولی تحلیل نمی‌شوند
- [x] اعمال به `scoreSpam`: ارسال فوق‌سریع → امتیاز +SUSPICIOUS (اما بدون بلاک خودکار)

## ۴.۳ Spam Score قابل‌تنظیم (§۴۷، §۲۳)

- [x] threshold 60 سخت‌کد شده در `contactService.ts:116-118` و `contact/route.ts:86`
- [x] اتصال `spamScoreThreshold` از Settings به هر دو مکان
- [x] آستانه‌های Alerts (traffic>۳۰٪، form error>۵٪، spam>۵۰٪) از Settings خوانده شوند

## ۴.۴ Duplicate Detection (§۵۰)

- [x] رفع ذخیره‌ی plaintext email در کلید Redis (`sha256:${email}` واقعاً hash شود)
- [x] ست‌کردن `duplicateOf` روی رکورد flagged (`contactService.ts:130`)

## ۴.۵ Security Events (§۵۷)

- [x] ثبت `SUSPICIOUS_REQUEST` و `BLOCKED_REQUEST` (الان تعریف شده‌اند ولی هیچ‌جا لاگ نمی‌شوند)
- [x] رویداد مستقل honeypot

## ۴.۶ Settings واقعی (§۲۴، §۲۳)

- [x] `api/admin/settings` الان فقط validate می‌کند و `persisted:false` برمی‌گرداند — هیچ‌چیز ذخیره نمی‌شود
- [x] پیاده‌سازی ذخیره‌سازی (در Redis با key مثل `ano:settings`)
- [x] اتصال thresholdها و retentionها به رفتار واقعی (rate limiter، spam، TTL ها)

**معیار قبولی:** هیچ مسیر dead-code امنیتی نمانده؛ همه‌ی آستانه‌ها از Settings خوانده می‌شوند؛ لاگ‌های امنیتی کامل.

---

# مرحله ۵ — فاز ۲: رفع نقایص Analytics

## ۵.۱ UTM capture (§۱۵)

- [x] باگ: `client.ts:136` کلید `utm_source` را به `utmsource` تبدیل می‌کند در حالی که سرور `utmSource` را می‌خواند → UTM ها ساکت حذف می‌شوند
- [x] رفع مپینگ کلیدها در client و تست یکپارچه‌ی end-to-end

## ۵.۲ رویدادهای مفقود (§۱۰)

- [ ] `SESSION_START`: ثبت هنگام شروع session جدید
- [ ] `CONTACT_FORM_SUBMIT`: ثبت هنگام ارسال فرم (جدا از SUCCESS/ERROR)
- [x] (بعد از آن) بررسی که `analyticsService` این رویدادها را مصرف می‌کند

## ۵.۳ Form Errorهای دقیق (§۴۱)

- [ ] الان فقط `SERVER_ERROR` ثبت می‌شود
- [ ] سرور باید `VALIDATION_ERROR`, `RATE_LIMITED`, `SPAM_BLOCKED`, `EMAIL_ERROR` را هم ثبت کند

**معیار قبولی:** UTM ها در dashboard دیده می‌شوند؛ جدول رویدادها کامل؛ error categorization دقیق.

---

# مرحله ۶ — Observability + Data Quality (افزوده‌های انتهای MASTER PROMPT)

## ۶.۱ System Health

- [x] پنل Health در داشبورد یا صفحه‌ی Settings:
  - [x] Analytics: وضعیت آخرین `track` event («Last tracking event: X min ago»)
  - [x] Contact API: وضعیت آخرین submission + نرخ خطا
  - [x] Email: وضعیت آخرین ارسال
  - [x] Database: ping به Redis
- [x] بدون overengineering — فقط چند check ساده (بدون SOC)

## ۶.۲ Data Quality & Metric Integrity

- [x] تعریف صریح معیارها (در یک سند `METRICS.md` و بازتاب در کد):
  - Visitor: تعریف (anonymous id، window و...)
  - Session: شروع/پایان
  - Conversion: **Successful Contact Stored** (نه فقط Submit) — مطابق پیشنهاد سند
  - Returning Visitor: بر اساس چه شناسه‌ای
  - Bounce Rate: تعریف دقیق
  - Project Conversion: در چه window زمانی
- [x] ساخت تابع/سرویس واحد برای این محاسبات تا همه‌ی صفحه‌ها یک‌دست باشند
- [x] (اختیاری) یک سکشن «Data Quality» کوچک که این تعاریف را در UI نشان دهد

**معیار قبولی:** داشبورد اعداد «صحیح و قابل‌اعتماد» تولید می‌کند، نه اعداد حرفه‌ای‌نمای بی‌تعریف.

---

# مرحله ۷ — فاز ۷: Polish

## ۷.۱ Error / Loading boundaries

- [x] `src/app/admin/error.tsx` (لایه‌ی مشترک)
- [x] `src/app/admin/(dashboard)/error.tsx` (پوشش توسط admin/error.tsx)
- [x] `src/app/admin/(dashboard)/loading.tsx` + skeleton
- [x] استفاده از `LoadingState`/`ErrorState` (skeleton جایگزین شد؛ کامپوننت‌ها موجودند) در `StateViews.tsx` (الان dead exports هستند)
- [x] try/catch در صفحات سمت سرور (layout + صفحات) تا یک خطای Redis کل داشبورد را نکشد (§۷۴)

## ۷.۲ Responsive (§۷۱)

- [x] تست/اصلاح داشبورد روی تبلت (جداول overflow-x، chart responsive) و موبایل (مخصوصاً جدول Contacts و charts)

## ۷.۳ Accessibility (§۷۲)

- [ ] `role="img"` + `tabindex` مناسب برای SVG charts
- [x] ادامه‌ی ARIA (aria-pressed در toggleها)

## ۷.۴ Performance (§۶۲، §۷۵)

- [ ] بررسی N+1 و aggregation queries
- [ ] بررسی caching / revalidation
- [x] اطمینان از اینکه bundle ادمین (route group مجزا) روی سایت عمومی تأثیر نمی‌گذارد روی سایت عمومی تأثیر نمی‌گذارد (§۹۳)

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
