# University_planner — WEEKLY//UNI

ترمینال برنامه هفتگی دانشگاه: گرید کلاس‌های هفتگی، امتحان‌ها و ارائه‌ها با شمارش معکوس،
یادداشت هر درس، تقویم جلالی و تعطیلات رسمی — با استایل Terminal/Cyber.

## سه حالت اجرا

| حالت | فعال‌سازی | بک‌اند | دیتا |
| --- | --- | --- | --- |
| Railway (پیش‌فرض) | `npm run build && npm start` | API Routes + Prisma/JSON | `data/db.json` روی Volume |
| GitHub Pages | `NEXT_PUBLIC_STATIC=1 next build` | بدون سرور | localStorage مرورگر |
| **Telegram Serverless** | `npm run deploy:tgcloud` | tgcloud endpoints + دیتابیس ابری تلگرام | جدول‌های SQLite در tgcloud |

## Telegram Mini App + Bot

- **مینی‌اپ:** https://app9229459492.tgcloud.ai/ — همون UI کامل، داخل تلگرام دیتا رو از
  `Telegram.WebApp.Serverless.call` می‌خونه (خارج از تلگرام: fallback به seed).
- **ربات:** [@QWETUODFBHXCIRWDJRSCHTHDJEWCJBOT](https://t.me/QWETUODFBHXCIRWDJRSCHTHDJEWCJBOT)
  - `/days` — روزهای کلاس در قالب **«تاریخ - نام روز»** (مثل `۱۴۰۵/۰۹/۰۲ - دوشنبه`) با کلاس‌های هر روز،
    علامت‌گذاری تعطیلات رسمی و دکمه‌های «۴ هفتهٔ بعد/قبل»
  - `/today` و `/tomorrow` — کلاس‌های امروز/فردا
  - `/exams` — امتحان‌ها و ارائه‌های پیش‌رو با شمارش معکوس
  - `/start` — خوش‌آمد + ثبت «برنامه هفتگی» به‌عنوان دکمهٔ منوی ربات
  - فقط برای Owner (`2040835005`) فعال است؛ بقیه پیام رد می‌شوند.
- ساختار سرورلس: `tgcloud/schema.js` (جداول classes/exams/notes)، `tgcloud/handlers/`،
  `tgcloud/endpoints/`، `tgcloud/lib/` — بک‌اند ربات و مینی‌اپ روی زیرساخت خود تلگرام.
- دیپلوی مجدد: `npm run deploy:tgcloud` (بیلد استاتیک + `tgcloud push` + `tgcloud migrate --yes`).
  توکن CLI در `TGCLOUD_TOKEN` (فرمت `app<id>:<secret>` از BotFather → Serverless → CLI Access).

## توسعه

```bash
npm install
npm run dev          # حالت Railway روی localhost:3000
npm run lint
npm run build:tgcloud   # فقط بیلد استاتیک مینی‌اپ → out/
```
