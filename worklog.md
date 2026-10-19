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
