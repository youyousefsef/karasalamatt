# KaraSalamat

پروژه مدیریت HSE سوپروایزرها با احراز هویت OTP.

---

## راه‌اندازی

برای اجرای پروژه از Docker Compose استفاده کنید:

```bash
docker compose up --build
```

- فرانت‌اند: `http://localhost:3000`
- بک‌اند: `http://localhost:8001`
- PostgreSQL: پورت `5432`

### پیش‌نیازهای بک‌اند (بدون Docker)

بک‌اند از **uv** برای مدیریت پکیج‌ها استفاده می‌کند. با pip نمی‌شود دیپندنسی‌ها را نصب کرد.

---

## معماری پروژه

| بخش | تکنولوژی |
|-----|----------|
| فرانت‌اند | Next.js + TypeScript + Tailwind CSS |
| بک‌اند | FastAPI + SQLAlchemy + PostgreSQL |
| مایگریشن دیتابیس | Alembic |
| ارسال پیامک | فراز SMS (با حالت Dev برای تست) |
| احراز هویت | JWT (Access + Refresh Token) + OTP |
| Rate Limiting | slowapi |

---

## سابقه تغییرات (توسط Mr.Amiram)

### کامیت ۱ — `8bde024` | ۱۳ ژوئن ۲۰۲۶
**راه‌اندازی کامل پروژه از صفر** — ۳۲ فایل، +۲۶۴۷ خط

این کامیت پایه کل پروژه را ساخت. قبل از این کامیت فقط فایل‌های خامی از طریق GitHub آپلود شده بودند.

**فرانت‌اند (Next.js):**
- ساختار کامل اپلیکیشن Next.js با TypeScript و Tailwind CSS
- صفحه لاگین (`page.tsx`) — فرم شماره موبایل با ارسال OTP
- صفحه تأیید OTP (`verify-otp/page.tsx`) — وارد کردن کد تأیید
- صفحه داشبورد (`dashboard/page.tsx`) — پنل اصلی کاربر
- صفحه مدیریت سوپروایزرها (`admin/supervisors/page.tsx`) — اضافه/حذف سوپروایزر
- فایل `api.ts` — سرویس ارتباط با بک‌اند ( درخواست‌های HTTP)
- فایل `auth.ts` — مدیریت توکن و نقش کاربر در localStorage
- فایل `types/index.ts` — تایپ‌های TypeScript مشترک
- Dockerfile اختصاصی فرانت‌اند
- `next.config.mjs` و `postcss.config.js` و `tailwind.config.ts`

**بک‌اند (FastAPI):**
- بازنویسی `main.py`:
  - اضافه شدن `lifespan` برای مقداردهی اولیه دیتابیس هنگام بالا آمدن سرور
  - تنظیم CORS با متغیر محیطی `CORS_ORIGINS`
  - اصلاح endpoint سلامت سرور — حالا ارتباط با PostgreSQL را هم چک می‌کند
  - قابلیت اجرا مستقیم با `python main.py`
- بازنویسی `authentication.py`:
  - تغییر `OTP_EXP_MINUTS` به `OTP_EXP_DAYS` (مشکل نام‌گذاری قبلی)
  - اضافه شدن حالت Dev (`OTP_MOCK`) — OTP در کنسول چاپ می‌شود بدون ارسال پیامک واقعی
  - فعال‌سازی مجدد ارسال پیامک با فراز SMS (قبلاً کامنت شده بود)
  - حذف `otp_code` از پاسخ Dev Mode (مسئویت امنیتی)
- تنظیم `database.py` برای راست‌آمدن با ساختار جدید

**زیرساخت:**
- `docker-compose.yml` — سه سرویس: PostgreSQL 16 + Backend + Frontend
  - healthcheck برای هر سه سرویس
  - شبکه اختصاصی `karasalamat-network`
  - volume برای داده‌های PostgreSQL
- `.env.example` روت پروژه

---

### کامیت ۲ — `ff61e7b` | ۱۴ ژوئن ۲۰۲۶
**ریفکتور صفحه OTP به Client Component** — ۲ فایل، +۱۴۴ / -۱۳۴ خط

- صفحه `verify-otp` از Server Component به Client Component (`VerifyOtpClient.tsx`) تبدیل شد
- کل منطق تعاملی (تایمر شمارش معکوس، ارسال مجدد OTP، مدیریت خطا) به کامپوننت کلاینت منتقل شد
- فایل `page.tsx` فقط کامپوننت کلاینت را رندر می‌کند (پاکسازی کد)

---

### کامیت ۳ — `74e6f2d` | ۱۴ ژوئن ۲۰۲۶
**اضافه شدن تست واحد + Alembic + بازنویسی سیستم احراز هویت** — ۲۷ فایل، +۱۱۴۹ / -۶۹ خط

بزرگ‌ترین تغییر بک‌اند در تاریخ پروژه. سیستم امنیتی و تست به طور کامل بازنویسی شد.

**سیستم مایگریشن Alembic:**
- `alembic.ini` و پوشه `alembic/` با تنظیمات کامل
- مایگریشن اول: ساخت جداول initial (`053822965df0_initial_schema.py`)
- مایگریشن دوم: اضافه شدن ایندکس‌ها و محدودیت‌های یکتا (`e54f61c7f_add_indexes_and_unique_constraints.py`)

**بازنویسی `authentication.py` (تغییرات اساسی):**
- **هش کردن OTP:** OTP دیگر به صورت خام ذخیره نمی‌شود. با HMAC-SHA256 هش می‌شود (`hash_otp` / `verify_otp`)
- **سیستم دو توکنی:**
  - Access Token: ۱۵ دقیقه اعتبار (قبلاً ۳۰ روز بود — مشکل امنیتی مهم)
  - Refresh Token: ۷ روز اعتبار (جدید)
  - هر دو توکن `jti` (ID یکتا) و `iat` (زمان صدور) دارند
- **Rate Limiting:** محدودیت ۵ درخواست در دقیقه برای generate-otp و ۱۰ در دقیقه برای verify-otp
- **Endpoint جدید `/auth/refresh`:** صدور Access Token جدید با Refresh Token
- **Endpoint جدید `/auth/me`:** دریافت اطلاعات کاربر فعلی
- **اصلاح timezone:** `created_at` OTP حالا با UTC مقایسه می‌شود (مشکل با دیتابیس‌های timezone-naive)
- **صفحه‌بندی سوپروایزرها:** `get_all_supervisors` حالا `skip` و `limit` دارد
- حذف `delete_otp_after_delay` (استفاده از `time.sleep` در بک‌اند ایده خوبی نبود)
- حذف `format_otp` اضافی
- آپدیت `HSERegOut.model_config` به روش جدید Pydantic v2

**تست‌های واحد:**
- `conftest.py` — تنظیم دیتابیس تست با SQLite + client تست + کاربر نمونه
- `test_authentication.py`:
  - تست generate OTP و بررسی cooldown
  - تست verify OTP و ساخت کاربر
  - تست CRUD سوپروایزرها (اضافه، دریافت، حذف)
  - تست endpoint سلامت سرور

**سایر تغییرات:**
- بهبود `database.py` و `models.py`
- Docker و docker-compose آپدیت شدند

---

### کامیت ۴ — `935d94b` | ۱۴ ژوئن ۲۰۲۶
**سیستم کامپوننت‌های قابل استفاده فرانت‌اند** — ۲۳ فایل، +۸۳۸ / -۲۵۴ خط

بزرگ‌ترین تغییر فرانت‌اند. ۹ کامپوننت جدید ساخته شد و تمام صفحات با آن‌ها بازنویسی شدند.

**کامپوننت‌های جدید (`src/components/`):**
| کامپوننت | کاربرد |
|-----------|--------|
| `Button` | دکمه با ۵ حالت (primary, secondary, danger, dark, ghost) + loading state + spinner خودکار |
| `Card` | کارت با header و body نوع‌دار |
| `Input` | فیلد ورودی RTL با پشتیبانی از label, error, icon |
| `Modal` | مودال با backdrop و انیمیشن |
| `Toast` | نوتیفیکیشن با ۳ نوع (success, error, info) + auto-dismiss + سیستم global با `showToast()` |
| `PageHeader` | هدر صفحه با عنوان و دکمه بازگشت |
| `LoadingSpinner` | اسپینر لودینگ |
| `ErrorMessage` | نمایش خطا با دکمه تلاش مجدد |
| `EmptyState` | حالت خالی با آیکون و پیام |

**بازنویسی صفحات:**
- **صفحه سوپروایزرها:** اضافه شدن مودال حذف، loading state، error state، بهبود UX
- **صفحه داشبورد:** استفاده از کامپوننت‌های Card و PageHeader
- **صفحه لاگین:** استفاده از Input و Button جدید
- **صفحه OTP:** وضعیت لودینگ و خطا، نوتیفیکیشن Toast برای ارسال مجدد و ورود موفق
- **صفحه not-found:** اصلاح.gradient

**سایر تغییرات:**
- بهبود `api.ts`: مدیریت خطای بهتر، timeout، پیام‌های خطای فارسی
- `globals.css`: استایل‌های focus-visible برای دسترسی‌پذیری بهتر
- `layout.tsx`: اضافه شدن `ToastContainer` سراسری
- اصلاح `tsconfig.json` برای سازگاری بهتر

---

### کامیت ۵ — `32e4b07` | ۱۴ ژوئن ۲۰۲۶
**رفع Dockerfile بک‌اند** — ۱ فایل، +۱۱ / -۵ خط

- نصب `ca-certificates` برای ارتباط HTTPS با فراز SMS
- اصلاح دستور CMD — اجرای مستقیم uvicorn به جای wrapper script
- بهبود لایه‌بندی Docker برای cache بهتر

---

### کامیت ۶ — `6fe3fdd` | ۱۴ ژوئن ۲۰۲۶
**رفکتور وابستگی کاربر** — ۱ فایل، +۲ / -۲ خط

- اصلاح وابستگی `user_dependency` در endpoint `/auth/me`
- آپدیت `test.db` (احتمالاً بعد از اجرای تست‌ها)

---

### کامیت ۷ — `c84782d` | ۱۵ ژوئن ۲۰۲۶
**OTP در کنسول + اسکریپت seed ادمین** — ۳ فایل، +۶۸ / -۱ خط

- چاپ OTP در کنسول در حالت توسعه — وقتی `OTP_MOCK=true` باشد OTP در لاگ سرور چاپ می‌شود
- فایل جدید `seed_admin.py`: اسکریپت ایجاد ادمین اولیه (برای اولین اجرا بدون نیاز به ثبت‌نام دستی)
- اضافه شدن `PYTHONUNBUFFERED=1` در `docker-compose.yml` —/logs را لحظه‌ای در Docker نمایش می‌دهد

---

## خلاصه آماری کل تغییرات

| شاخص | مقدار |
|-------|-------|
| تعداد کامیت‌ها | ۷ |
| مجموع خطوط اضافه شده | ~۴,۹۰۰ |
| مجموع خطوط حذف شده | ~۵۰۰ |
| تعداد فایل‌های ایجاد شده | ~۴۵ |
| کامپوننت‌های UI جدید | ۹ |
| Endpoint‌های API جدید | ۲ (`/auth/refresh`, `/auth/me`) |
| تست‌های واحد جدید | ۱ فایل (~۱۹۴ خط) |
| مایگریشن‌های دیتابیس | ۲ |

---

## نکات مهم برای همکاران

1. **OTP در حالت Dev:** با `OTP_MOCK=true` (پیش‌فرض) پیامک واقعی ارسال نمی‌شود و OTP در کنسول بک‌اند چاپ می‌شود
2. **توکن‌ها:** Access Token ۱۵ دقیقه اعتبار دارد. فرانت‌اند باید از Refresh Token برای تمدید استفاده کند
3. **OTP هاش می‌شود:** OTP در دیتابیس به صورت HMAC-SHA256 ذخیره می‌شود، نه plaintext
4. **Rate Limiting فعال است:** محدودیت درخواست روی endpoint‌های OTP وجود دارد
5. **مایگریشن:** بعد از تغییر مدل‌ها حتماً `alembic revision --autogenerate` اجرا کنید
6. **اجراهای اول:** اسکریپت `seed_admin.py` را برای ایجاد ادمین اول اجرا کنید
7. **دسترسی‌پذیری:** کامپوننت‌های UI از `focus-visible` و ARIA labels پشتیبانی می‌کنند
