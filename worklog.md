# WEEKLY//UNI — Worklog

---
Task ID: 2-a
Agent: frontend-styling-expert
Task: ساخت ۹ کامپوننت terminal برای WEEKLY//UNI

Work Log:
- مراجع خوانده شد: /tmp/live-ref/body.html (DOM لایو — مرجع اصلی ساختار/کلاس‌ها)، /tmp/live-ref/css2.css، و همه‌ی libها (types, tehran, jalali, sounds, store, reminders) + کامپوننت‌های shadcn موجود (popover, dialog, select, accordion, command, toast/use-toast, alert-dialog, tooltip, skeleton, button, input, label). worklog.md وجود نداشت → ساخته شد.
- globals.css پروژه بررسی شد (glass-card, dot-live, توکن‌های terminal/cyber/plasma/amber/final، فونت‌های font-fa/font-mono) تا کلاس‌های لایو دقیقاً استفاده شوند.
- jalali-date.tsx — JalaliDatePicker با سه Select شادکامن (روز/ماه/سال)، اعداد فارسی، سال ۱۳۸۰–۱۴۲۰، طول ماه با jalaliMonthLength + clamp روز هنگام تغییر ماه، تبدیل با isoToJalaliParts/jalaliPartsToISO.
- navbar.tsx — هدر sticky عین DOM لایو (logo با آیکون Terminal و WEEKLY//UNI، nav pills Schedule/Exams با شمارنده و scroll به #schedule/#exams، ساعت تهران dot-live + tehranClock با مقدار اولیه "--:--:--" برای جلوگیری از SSR mismatch، title="Tehran local time")، BellButton با Popover شادکامن (سه صدا از SOUND_LABELS + «▶ تست» با playSound + راهنمای فارسی + دکمه «فعال‌سازی نوتیفیکیشن» وقتی permission !== granted) و دات کهربایی `absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-amber animate-pulse`، دکمه ⌘K با setPalette(true). متن "//" به صورت {"//"} نوشته شد تا react/jsx-no-comment-textnodes خطا ندهد.
- schedule-grid.tsx — دسکتاپ `hidden xl:grid xl:grid-cols-6 xl:gap-2.5` با dir=rtl (شنبه راست‌ترین)، پنجره‌ی نمایش 8:00–17:00 روی ستون h-[520px] با خط‌های ساعت کم‌رنگ و برچسب فارسی، هدر هر ستون با نام روز + تاریخ جلالی کوچک (محاسبه‌ی تاریخ‌های هفته از tehranParts/isoToJalaliParts)، هایلایت امروز (bg-terminal/10 + دات سبز)، الگوریتم cluster/lane برای تداخل‌ها (سه کلاس دوشنبه در سه زیرستون باریک flex)، بلوک کلاس با border-inline-start ضخیم رنگ کلاس + پس‌زمینه ${color}14، ردیف اجباری «استاد: X» با GraduationCap h-3 w-3 (در ستون‌های باریک فقط نام خانوادگی + Tooltip نام کامل)، خط قرمز «الان» با border-red-500/60 + دات + label در ستون امروز (tehranMinutes، آپدیت هر ۳۰s)، کلیک روی هر کلاس → openClass، ردیف جدا «بدون زمان‌بندی» برای پروژه، اسکلت لودینگ ۶تایی h-[520px] مثل لایو، موبایل (<xl) آکاردئون شادکامن تک‌بازه با روزِ امروز باز و کارت کلاس (nameFa/استاد/زمان/مکان/دات رنگی).
- exam-tracker.tsx — هدر رز با GraduationCap + «EXAMS & PRESENTATIONS»، گرید md:2/ xl:3 کارت glass-card با برچسب kind (امتحان=رز، ارائه=بنفش plasma)، تاریخ جلالی بزرگ با isoToJalaliLabel، شمارش معکوس با daysUntilISO (۰=«امروز!» کهربایی، منفی=«تمام شد» کم‌رنگ)، حذف با AlertDialog شادکامن → deleteExam، کارت dashed افزودن + Dialog فرم (Select درس، عنوان، نوع، JalaliDatePicker، ساعت، مکان) → addExam با رنگ درس + toast، کارت خالی «هنوز امتحانی ثبت نشده»، اسکلت ۳تایی h-32 مثل لایو.
- class-modal.tsx — Dialog باز وقتی activeClassId !== null؛ هدر با دات رنگ کلاس + nameFa + name مونو + کد درس؛ ردیف‌های اطلاعات استاد/زمان/مکان/واحد-نوع؛ Textarea یادداشت با ذخیره‌ی debounce خودکار ۸۰۰ms + دکمه «ذخیره یادداشت» → setNote + toast موفقیت (draft با ref فقط با تعویض کلاس ریست می‌شود تا تایپ پاک نشود)؛ دکمه‌های قبلی/بعدی با شمارنده فارسی.
- command-palette.tsx — CommandDialog متصل به paletteOpen/setPalette + شورت‌کات سراسری ⌘K/Ctrl+K؛ گروه‌ها: کلاس‌ها (openClass)، ناوبری (scroll به #schedule/#exams + پنل سیستم)، صداها (سه playSound)، یادآورها (resetFired + toast).
- status-bar.tsx — فوتر `sticky bottom-0 z-40 mt-auto border-t border-white/[0.07] bg-background/80 backdrop-blur-xl` با h-9: dot-live + LIVE سبز مونو، «syncing…»/«synced HH:MM:SS» (ساعت تهران، SSR-safe)، ml-auto دامنه‌ی مونو weeklyuni.up.railway.app (کلیک → setSystem(true)).
- system.tsx — پنل Dialog متصل به systemOpen/setSystem؛ fetch /api/health (ok/classes/exams/ts) با وضعیت متصل/قطع/در حال بررسی + بررسی مجدد، دکمه «پاک‌سازی کش یادآورها» → resetFired + toast، نسخه «WEEKLY//UNI v2 · Midnight Campus» مونو LTR، توضیح فارسی پارسیست شدن دیتا روی Volume.
- reminders.tsx — ReminderEngine بدون UI: با loaded → catch-up بوت (computeAllReminders با now-۱۰دقیقه → fireReminder + toast) سپس setInterval تیک ۲۰ثانیه‌ای (TICK=20s) + re-check در window focus؛ data با selectorهای zustand همیشه fresh است (بدون دستکاری ref در render تا react-hooks/refs خطا ندهد). BellBadge با useSyncExternalStore روی شمارنده‌ی ماژول‌سطح یادآورهای اخیر (دات/عدد کهربایی برای زنگ).
- کیفیت: TypeScript strict بدون any، همه‌ی ۹ فایل 'use client'، فقط توکن‌های رنگ لایو، اعداد فارسی برای محتوای فارسی و tabular-nums مونو برای ساعت، RTL/LTR inline درست. `bunx tsc --noEmit` برای src/components/terminal صفر خطا. `bun run lint` دو خطا داد (jsx-no-comment-textnodes در navbar، react-hooks/refs در reminders) — هر دو فیکس شد و lint نهایی صفر error/zero warning شد.

Stage Summary:
- هر ۹ فایل در src/components/terminal/ ساخته شد: jalali-date.tsx، navbar.tsx، schedule-grid.tsx، exam-tracker.tsx، class-modal.tsx، command-palette.tsx، status-bar.tsx، system.tsx، reminders.tsx.
- گرید دسکتاپ ستون‌های تداخل را می‌سازد (دوشنبه: سه زیرستون باریک با نام کوتاه استاد + Tooltip) و فیچر «اسم استاد» در دسکتاپ/موبایل/کارت‌های بدون زمان‌بندی و مودال کلاس رعایت شد.
- SSR-safe: ساعت‌ها با مقدار اولیه "--:--:--"، خط «الان» و تاریخ‌های هفته فقط بعد از load/client رندر می‌شوند؛ hydration mismatch رخ نمی‌دهد.
- lint نهایی: `bun run lint` → 0 error, 0 warning. tsc: 0 خطا در فایل‌های این تسک.
- گام بعدی (تسک‌های دیگر): ساخت page.tsx که Navbar/ScheduleGrid/ExamTracker/ClassModal/CommandPalette/StatusBar/SystemPanel/ReminderEngine (+Toaster) را در wrapper `flex min-h-screen flex-col` سوار کند و هدر بخش‌ها (WEEKLY SCHEDULE / EXAMS) را اضافه کند.

---
Task ID: 1 (سیستم)، 2-b، 2-c، 3، 4، 5
Agent: main (Z.ai Code)
Task: بازسازی کامل WEEKLY//UNI پس از ریست sandbox + دیپلو روی Railway + فیکس لایو + وریفای نهایی

Work Log:
- کشف ریست کامل sandbox: /home/z/my-project فقط قالب پیش‌فرض بود؛ src/lib/terminal/* پروژه غایب
- استخراج مرجع از لایو: /api/health، /api/schedule، /api/exams، /api/notes (دیتای دقیق ۶ کلاس) + index.html (DOM کامل) + css chunks (توکن‌ها: --terminal #00ff41، --background #06080a، glass-card، dot-live، aurora body gradients، ping-soft) + manifest.webmanifest + sw.js + icons 192/512 → ذخیره در /tmp/live-ref و public/
- بازسازی libs (Task 1): types.ts، tehran.ts (ساعت/تاریخ Asia/Tehran)، jalali.ts (تبدیل گرجی↔جلالی + اعداد فارسی)، sounds.ts (سه امضا: دینگ‌دونگ E6→C6 با پارشیال، آژیر سه‌ضرب D5→G5 مربعی+lowpass، آرپژ پنتاتونیک C5..E6 + آکورد درخشش؛ delay 0.155s/0.34 + compressor)، reminders.ts (۹۰/۶۰ دقیقه کلاس و امتحان، ۴روز+۲روز+دقیقه‌ای ارائه، dedupe localStorage «wu.reminders.fired» TTL ۸روز، تیک ۲۰s)، store.ts (zustand)، db.ts (SEED با ZWNJ درس ۳ + data/db.json + DATA_DIR env)
- API routes: health، schedule، classes، classes/[id] (PUT جزئی whitelist)، exams، exams/[id]، notes
- Sub-agent frontend-styling-expert (Task 2-a): ۹ کامپوننت terminal — نتیجه lint صفر؛ جزئیات در بخش Task ID: 2-a بالا
- globals.css (توکن‌های دقیق لایو)، layout.tsx (Inter/JetBrains Mono/Vazirmatn + manifest + sw-ready)، page.tsx (ساختار DOM لایو: hero، ۴ stat card، هدر بخش‌ها، hint ⌘K)
- Task 2-c: public/sw.js (کپی از لایو)، public/manifest.webmanifest، public/icons/{icon-192,icon-512}.png، Dockerfile multi-stage (bun deps/build → node:20-slim runner، DATA_DIR=/app/data، EXPOSE، CMD node server.js)، railway.json (builder DOCKERFILE + startCommand «node server.js» — طبق قانون بدون تغییر)
- وریفای لوکال (agent-browser): کشف و فیکس باگ فیلتر روز در DayColumn (همه‌ی کلاس‌ها در همه‌ی ستون‌ها تکرار می‌شدند → filter c.day === day)؛ دسکتاپ 1440 و موبایل 390 و مودال و پالت و زنگ: همگی سالم؛ کنسول صفر خطا؛ lint/tsc صفر
- دیپلو: railway link (پروژه extraordinary-patience، محیط production) → railway up -d
  * تلاش ۱: FAILED — علت: Next standalone با env HOSTNAME کانتینر Railway به جای 0.0.0.0 بایند می‌شد و healthcheck /api/health نمی‌رسید
  * تلاش ۲ با ENV PORT=8080 + EXPOSE 8080: باز FAILED (همان علت)
  * تلاش ۳ با ENV HOSTNAME=0.0.0.0: SUCCESS ✅ (ریشه‌یابی از مقایسه‌ی banner لاگ دیپلوی موفق قدیمی: «Local: http://localhost:8080» در برابر «http://<container-id>:8080»)
- گام ۵: PUT /api/classes/3 با nameFa «ساختمان‌داده‌ها» (ZWNJ) → تایید ZWNJ present: True در /api/schedule لایو
- وریفای نهایی لایو (گام ۶-۸): دسکتاپ 1440 — ردیف «استاد: X» در بلاک‌های کامل («استاد: مهدی امیرمیاندرق»، «استاد: محمدعلی اسماعیل‌زاده») و نام کوتاه + آیکون GraduationCap در ۳ ستون باریک دوشنبه (فاطمی/خوز/حسین‌خانی، ۳ آیکون)؛ موبایل 390 — «استاد: X» روی هر کارت آکاردئون؛ BellButton پاپ‌اور با ۳ دکمه تست + فعال‌سازی نوتیفیکیشن؛ RTL درست (شنبه راست‌ترین)، هایلایت امروز دوشنبه، ساعت تهران 19:07-19:09 TEH، فوتر چسبان LIVE/synced؛ کنسول صفر خطا؛ /api/health سالم (6 classes, 0 exams)؛ nameFa درس ۳ لایو با ZWNJ در UI و API

Stage Summary:
- WEEKLY//UNI v2 با فیچر «اسم استاد در گرید» + صداهای جدید سه‌گانه لایو شد: https://weeklyuni.up.railway.app
- buildId جدید: wwFsA0PusFE8dhg9FQshm (قبلی: oeM5aZw_FqMhHt6Q_CTJN)
- درس آموخته‌ی کلیدی برای دیپلوهای بعدی: در Dockerfile runner حتماً ENV HOSTNAME=0.0.0.0 (بدون آن healthcheck Railway شکست می‌خورد)
- دیتای لایو روی Volume دست‌نخورده ماند (6 classes, 0 exams)؛ فقط تغییر مجاز: PUT درس ۳ (ZWNJ)
- هر ۸ چک‌باکس وریفای گام ۸ پاس شد؛ کنسول لایو بدون خطا

---
Task ID: 6
Agent: main (Z.ai Code)
Task: ۷ فیکس/فیچر جدید به درخواست کاربر (تاگل تم روشن/تاریک، RTL سکشن‌ها، کارت امتحان بهتر، پروژه بزرگ، تعطیلات شمسی، جای «بدون زمان‌بندی»، اطلاعات آزمایشگاه سیستم‌عامل، حضور فدائیان پنج‌شنبه) + آماده‌سازی دیپلو

Work Log:
- ThemeToggle (next-themes 0.4.6 — از قبل نصب): ThemeProvider جدید (attribute=class, defaultTheme=dark, enableSystem=false) در layout.tsx؛ دکمه Sun/Moon کنار BellButton در navbar.tsx
- تم روشن کامل: globals.css — متغیرهای :root خوانا روی زمینه‌ی روشن (--terminal #0a8f30، --final #e11d48 و...)، بازنویسی glass-card/dot-live/scrollbar، تبدیل ۱۲ کلاس alpha سفید (bg-white/[0.01..0.08] و border-white/[0.05..0.12] و hover) به alpha تیره با سلکتور html:not(.dark)
- src/lib/colors.ts جدید: accentFor() — نگاشت نئون‌های دیتا (#00ff41, #22d3ee, #c084fc, #fbbf24, #fb7185, #34d399) به نسخه‌ی تیره‌ی خوانا برای تم روشن + fallback darkenHex؛ مصرف در ClassBlock، MobileClassCard، UnscheduledCard، ExamCard
- src/lib/holidays.ts جدید: تعطیلات رسمی ایران — fixed solar (نوروز، ۱۲/۱۳ فروردین، ۱۴/۱۵ خرداد، ۲۲ بهمن، ۲۹ اسفند) + جدول سال ۱۴۰۵ از دیتاست رسمی (پکیج date-holidays@3.24.0، استخراج یک‌بار مصرف): ۱۳ آبان، ۲۲ آبان (شهادت حضرت فاطمه)، ۱ دی (ولادت امام علی)، ۴ دی (ولادت عیسی)، ۱۵ دی (مبعث)، ۳ بهمن (نیمه شعبان)، ۹ اسفند (شهادت امام علی)، ۱۸/۱۹ اسفند (عید فطر)؛ jalaliHoliday(jy,jm,jd)
- schedule-grid.tsx: برچسب تاریخ قرمز «۲۵ مهر (تعطیل)» در هدر ستون دسکتاپ + بج قرمز در آکاردئون موبایل + تینت قرمز ملایم ستون؛ بلاک حضور پنج‌شنبه (PRESENCE: استاد محمد فدائیان ۰۸:۰۰–۱۹:۰۰، dashed سبز، z-0 زیر بلاک کلاس‌ها، غیرکلیک) در دسکتاپ و کارت dashed در آکاردئون؛ سکشن «کلاس‌های بدون ساعت ثابت» با هدر آیکون‌دار و توضیح واضح + کارت‌های بزرگ UnscheduledCard (nameFa text-lg font-black + استاد: X با text-sm font-bold + کد/نام انگلیسی + «جزئیات و یادداشت ‹»)
- exam-tracker.tsx: بازطراحی کارت امتحان (p-5، بج نوع + حذف بالا، عنوان bold، نام درس با فاصله درست، جداکننده رنگی، تاریخ جلالی text-xl font-black + نام روز هفته + ساعت/مکان با آیکون، شمارش معکوس pill بزرگ، hover lift)
- page.tsx: هدرهای WEEKLY SCHEDULE و EXAMS & PRESENTATIONS به dir=rtl (آیکون راست) + StatCard/آیکون سکشن‌ها از hex ثابت به color-mix با var(--tone)
- دیتا: data/db.json و seed src/lib/db.ts — درس ۲ (آزمایشگاه سیستم‌عامل): time «13:00 - 15:00»، location «خوارزمی-۴۱۱» (طبق پیام کاربر)
- وریفای لوکال (agent-browser): دسکتاپ 1440 دارک و لایت — تاگل سالم، RTL هدرها، بلاک حضور پنج‌شنبه زیر تربیت بدنی، ۳ ستون باریک دوشنبه؛ موبایل 390 — آکاردئون، کارت حضور در پنج‌شنبه، کارت بزرگ پروژه؛ پاپ‌اور زنگ با ۳ تست؛ ۲ کارت امتحان تستی ساخته/حذف شد (کارت جدید تایید شد)؛ کنسول صفر خطا؛ lint صفر؛ تست منطق تعطیلات: این هفته بدون تعطیل (درست)، ۱۳ آبان/۲۲ آبان/۴ دی/۳ بهمن قرمز می‌شوند
- کشف: شنبه‌ی هفته‌ی جاری دقیقاً ۲۵ مهر ۱۴۰۵ است (مثال کاربر)؛ ساعت sandbox درست است؛ ۱۴۰۴→۱۴۰۵
- Railway: CLI دوباره پاک شده بود → نصب مجدد 5.70.0؛ توکن از دست رفته → login --browserless با orphan-subshell (code JKCS-FKVN) — در انتظار تایید کاربر
- چک لایو: /api/health سالم (6 classes, 0 exams)؛ درس ۳ لایو ZWNJ دارد (از قبل PUT شده)؛ درس ۲ لایو هنوز «خوارزمی-۳ / 14:00 - 15:55» → پس از دیپلو PUT می‌شود

Stage Summary:
- هر ۷ درخواست UI کاربر پیاده و لوکال وریفای شد (دارک/لایت، RTL، کارت‌ها، پروژه بزرگ، تعطیلات، جای بدون-زمان‌بندی، اطلاعات آزمایشگاه OS، حضور پنج‌شنبه)
- فایل‌های جدید: src/components/theme-provider.tsx، src/lib/holidays.ts، src/lib/colors.ts
- دیپلو به weeklyuni.up.railway.app منتظر تایید کد JKCS-FKVN است؛ بعدش فقط PUT درس ۲ + وریفای لایو

---
Task ID: 6-final (دیپلو + وریفای لایو)
Agent: main (Z.ai Code)
Task: دیپلوی ترکیبی Railway (نام استاد + صداها + ۷ فیکس) + PUT دیتای زنده + وریفای مرورگری لایو

Work Log:
- توکن Railway منقضی بود → login --browserless با orphan-subshell، کد NKLD-HNGX → کاربر تایید کرد → whoami ✓
- railway link با UUIDهای پروژه (extraordinary-patience/production) ✓ (بدون تغییر railway.json)
- railway up -d → deployment 3f1245b5: BUILDING → SUCCESS (حدود ۲ دقیقه)؛ live health در حین بیلد سالم ماند
- PUT /api/classes/2 لایو: location «خوارزمی-۴۱۱» + time «13:00 - 15:00» (آزمایشگاه سیستم‌عامل طبق درخواست کاربر) → تایید با GET
- تایید مجدد ZWNJ درس ۳ لایو (ساختمان‌داده‌ها ✓)؛ /api/schedule کامل و سالم (۶ کلاس + اساتید)
- وریفای مرورگری لایو (agent-browser):
  * دسکتاپ 1440: تاگل تم کنار زنگ و ⌘K («حالت روشن») — کلیک → تم روشن کامل و خوانا → برگشت به تاریک ✓
  * RTL کامل: هدرهای WEEKLY SCHEDULE / EXAMS & PRESENTATIONS راست‌چین با آیکون، شنبه راست‌ترین ستون (۲۵ مهر … پنج‌شنبه ۳۰ مهر) ✓
  * هایلایت امروز: سه‌شنبه ۲۸ مهر سبز با دات ✓
  * نام استادها: «استاد: مهدی امیرمیاندرق»، «استاد: محمدعلی اسماعیل‌زاده» در بلاک‌های کامل؛ ۳ ستون باریک دوشنبه (فاطمی/حسین‌خانی/خوز) + Tooltip نام کامل (تست شد: «استاد: سیدحمیدرضا فاطمی») ✓
  * دوشنبه لایو: آزمایشگاه سیستم‌عامل 13:00-15:00 خوارزمی-۴۱۱ (دیتای PUT جدید در گرید) ✓
  * پنج‌شنبه: بلاک dashed سبز «استاد فدائیان — حضور دارد · 08:00-19:00 · هماهنگی پروژه — ساعت ثابت ندارد» زیر تربیت بدنی ✓
  * بخش «کلاس‌های بدون ساعت ثابت» با کارت بزرگ پروژه (استاد: محمد فدائیان + Project · 5990114704 + جزئیات و یادداشت) ✓
  * BellButton: پاپ‌اور با ۳ دکمه «▶ تست» + «فعال‌سازی نوتیفیکیشن» — هر ۳ صدا کلیک شد، صفر خطا ✓
  * مودال پروژه: استاد/زمان/مکان/واحد + یادداشت + ناوبری ۶ از ۶ ✓
  * موبایل 390: آکاردئون RTL کامل (شنبه بالای لیست)، بج «امروز» + باز بودن سه‌شنبه، کارت حضور در پنج‌شنبه، کارت بزرگ پروژه، تاگل تم و زنگ در ناوبار ✓
  * کنسول لایو: صفر error/warning (پاک + reload + تعاملات)؛ /api/health ✓ (6 classes, 0 exams)؛ homepage 200
- نکته: این هفته (۲۵–۳۰ مهر ۱۴۰۵) تعطیل رسمی ندارد → برچسب «تعطیل» نمایش داده نمی‌شود (رفتار درست؛ منطق holidays.ts قبلاً لوکال تست شد: ۱۳/۲۲ آبان، ۴/۱۵ دی، ۳/۹ بهمن و... قرمز می‌شوند)

Stage Summary:
- https://weeklyuni.up.railway.app نسخه‌ی نهایی: نام استاد + صداهای سه‌گانه + ۷ فیکس کاربر (تم روشن/تاریک، RTL سکشن‌ها، کارت بهتر امتحان، پروژه بزرگ، تعطیلات شمسی، جای درست «بدون زمان‌بندی»، آزمایشگاه OS خوارزمی-۴۱۱ ۱۳–۱۵، حضور پنج‌شنبه فدائیان)
- deployment id: 3f1245b5 (SUCCESS)؛ دیتای زنده: درس ۲ PUT شد، درس ۳ ZWNJ از قبل داشت؛ بقیه دست‌نخورده
- هر چک‌باکس وریفای پاس شد؛ کنسول لایو صفر خطا

---
Task ID: 7 (فیکس‌های A+B: چیدمان WEEKLY SCHEDULE + نوتیفیکیشن)
Agent: main (Z.ai Code)
Task: Fix A (روزها سمت راست + حذف تعداد کلاس + راست‌چین شدن متن کارت‌های برنامه هفتگی) و Fix B (اسم کارکردی صداها + دکمه فعال/غیرفعال نوتیفیکیشن) — پیاده‌سازی، دیپلو، وریفای لایو

Work Log:
- Sandbox ریست شده بود → نصب مجدد Railway CLI 5.70.0 (install.sh) → login --browserless (کد VRJR-RLRL، کاربر تایید کرد) → whoami ✓ → railway link با UUIDهای پروژه (بدون تغییر railway.json) ✓
- کشف: هر دو فیکس در commit محلی 3e90103 از قبل پیاده شده بودند (پس از آخرین سشن) ولی هنوز دیپلو نشده بودند (آخرین دیپلوی worklog: 3f1245b5 بدون این فیکس‌ها)؛ git clean، lint صفر
- Fix A (schedule-grid.tsx — تایید با git show): حذف بج شمارنده «{toPersianDigits(timed.length)}» از AccordionTrigger موبایل؛ dir="rtl" روی ClassBlock/MobileClassCard/UnscheduledCard + AccordionItem؛ text-start روی AccordionTrigger؛ ms-auto روی تاریخ؛ text-right روی اسپن‌های ساعت dir=ltr
- Fix B (navbar.tsx + sounds.ts + reminders.ts — تایید با git show و grep): SOUND_LABELS کارکردی (اعلام یادآوری کلاس/امتحان/ارائه) + SOUND_HINTS (زنگ دینگ‌دونگ ۹۰/۶۰ دقیقه قبل کلاس، آژیر ۹۰/۶۰ دقیقه قبل امتحان، آرپژ ۴/۲ روز قبل ارائه)؛ دکمه تاگل «فعال‌سازی/غیرفعال‌سازی نوتیفیکیشن» + پیل وضعیت «نوتیفیکیشن: فعال/خاموش» + کلید localStorage «wu.notifs.enabled» + گیت notifsEnabled() در ReminderEngine
- وریفای لوکال (agent-browser، dev :3000): دسکتاپ 1440 — نام روزها راست هدر ستون، تاریخ چپ، بدون شمارنده، متن کارت‌ها راست‌چین (تربیت بدنی، معماری، ۳ ستون باریک دوشنبه، بلاک حضور پنج‌شنبه)؛ پاپ‌اور: ۳ برچسب کارکردی + ۳ تست + تاگل خاموش/روشن (toast + پیل + localStorage هر دو جهت)؛ موبایل 390 — آکاردئون RTL بدون بج شمارنده؛ کنسول صفر خطا
- دیپلو: railway up -d → deployment f423843e-34ef-4ebf-b49a-707b5b3748a5 Online؛ health در طول بیلد سالم؛ buildId جدید — برچسب «اعلام یادآوری کلاس» در باندل لایو تأیید شد
- وریفای لایو (agent-browser): دسکتاپ 1440 — روزها راست/تاریخ چپ/بدون شمارنده/کارت‌ها راست‌چین/خط «الان» در ستون امروز؛ پاپ‌اور زنگ با متن کامل کارکردی + ۳ تست صدا (۳ کلیک، صفر خطا) + تاگل دوطرفه («نوتیفیکیشن خاموش شد» → پیل خاموش → «فعال‌سازی» → «نوتیفیکیشن روشن شد» + localStorage=1)؛ موبایل 390 — آکاردئون بدون شمارنده، بج «امروز»، کارت پروژه راست‌چین، هدرهای RTL، اسکرول تا EXAMS؛ کنسول صفر error/warning؛ /api/health ✓ (6 classes, 0 exams)
- دیتای زنده دست نخورد (تغییرات صرفاً UI بود؛ PUT لازم نبود)

Stage Summary:
- هر دو درخواست کاربر لایو شد: https://weeklyuni.up.railway.app (deployment f423843e)
  ۱) WEEKLY SCHEDULE: نام روزها سمت راست هدر، شمارنده تعداد کلاس حذف شد، متن همه کارت‌ها راست‌چین
  ۲) نوتیفیکیشن: اسم صداها کارکردی شد («اعلام یادآوری کلاس/امتحان/ارائه» + توضیح زمان‌بندی) + دکمه فعال/غیرفعال‌سازی نوتیفیکیشن با پیل وضعیت و ذخیره در localStorage و گیت در موتور یادآور
- کنسول لایو صفر خطا؛ دیتای Volume دست‌نخورده؛ railway.json تغییر نکرد

---
Task ID: 8 (EXAMS & PRESENTATIONS: ادیت + یادداشت + ری‌دیزاین + تقویم شمسی)
Agent: main (Z.ai Code)
Task: ۴ فیچر جدید بخش امتحان‌ها به درخواست کاربر: (۱) ادیت رویداد با کلیک روی کارت (۲) بخش توضیحات/یادداشت (۳) ری‌دیزاین کارت‌ها کوچک‌تر + تایتل چندخطی بدون «…» (۴) دیت‌پیکر تقویم پاپ‌آپ شمسی — فقط لوکال؛ دیپلو بعد از تایید preview کاربر

Work Log:
- types.ts: فیلد notes: string به UniExam اضافه شد؛ api/exams POST: notes ذخیره می‌شود؛ api/exams/[id] PUT: «notes» به ALLOWED اضافه شد (old live data بدون notes → runtime با ?? "" سازگار)
- jalali-date.tsx بازنویسی کامل: از ۳ Select به تقویم پاپ‌آپ کامل (Popover): تریگر شبیه input[type=date] با آیکون تقویم و لیبل جلالی؛ هدر با ‹ › ناوبری ماه + Select ماه/سال (۱۳۸۰–۱۴۲۰)؛ گرید ۷ ستونه شنبه-اول با حروف ش ی د س چ پ ج؛ اعداد فارسی؛ جمعه‌ها قرمز؛ امروز حلقه سبز ring؛ روز انتخابی پر سبز؛ چیپ «امروز» + فوتر «تقویم هجری شمسی»؛ بسته‌شدن بعد از انتخاب روز؛ firstDayColumn = (getUTCDay+1)%7 با jalaliToGregorian
- exam-tracker.tsx بازنویسی: ExamCard حالا role=button قابل‌کلیک (Enter/Space هم) → دیالوگ ادیت؛ دکمه Pencil + Trash2 با stopPropagation (نستد داخل کارت)؛ تایتل line-clamp-2 break-words (جای truncate با «…»)؛ نام درس truncate؛ پیش‌نمایش یادداشت با آیکون StickyNote و line-clamp-1 فقط وقتی یادداشت هست؛ p-4 (قبلاً p-5)، تایتل text-sm (قبلاً text-base)، تاریخ text-base (قبلاً text-xl)، بج/pill کوچک‌تر، حدvider باریک‌تر؛ grid پدر dir="rtl" گرفت (کارت نزدیک‌ترین امتحان سمت راست)
- AddExamDialog → ExamDialog با دو مود: exam=null (افزودن) / exam مشخص (ویرایش با پیش‌پرکردن همه فیلدها + notes)؛ Textarea «توضیحات و یادداشت» ۳ ردیفی با placeholder مثال کاربر؛ max-h-[60vh] overflow-y-auto برای فرم؛ دکمه‌های انصراف/ذخیره (در ادیت: «ذخیره تغییرات» + toast «ذخیره شد»)
- store.updateExam از قبل موجود بود — مستقیم استفاده شد
- وریفای لوکال (agent-browser 1440 + 390، دارک + لایت):
  * ساخت امتحان تستی با تایتل بلند مثال کاربر → کارت: تایتل در ۲ خط کامل بدون «…» ✓، پیش‌نمایش یادداشت ✓، «۱۳ آبان ۱۴۰۵ جمعه» + «۲۴ روز مانده» ✓
  * تقویم: ناوبری مهر→آبان ✓، انتخاب روز ✓، lead=4 (۱ مهر = چهارشنبه) با x-position تایید شد (ش x=905 راست، ج x=684 چپ، ۳ مهر زیر ج) ✓، جمعه قرمز، امروز سبز ✓
  * کلیک روی کارت → دیالوگ «ویرایش امتحان/ارائه» با همه فیلدها پیش‌پرشده ✓؛ تغییر عنوان → ذخیره تغییرات → toast «ذخیره شد» + کارت آپدیت ✓
  * حذف با AlertDialog ✓ → empty state برگشت؛ کنسول صفر error/warning؛ lint صفر؛ /api/health ✓
  * تم روشن: دیالوگ + تقویم خوانا ✓؛ موبایل ۳۹۰: empty state و کارت‌ها ✓
- دیتای تستی پاک شد (local db.json exams خالی)؛ دیپلو انجام نشد — منتظر تایید preview کاربر طبق خواسته‌ی صریح او

Stage Summary:
- هر ۴ فیچر لوکال آماده و وریفای شده: کلیک-برای-ادیت، یادداشت (API+UI+پیش‌نمایش کارت)، کارت‌های کوچک با تایتل ۲ خطی، تقویم شمسی پاپ‌آپ
- گام بعد پس از تایید کاربر: railway up -d (لاگین در صورت نیاز) + وریفای لایو + گزارش
