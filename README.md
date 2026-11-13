# FURSA (Mostaqel) — سوق زراعي رقمي

منصة ويب عربية (RTL) تربط المزارعين والتجار ومقدمي الخدمات الزراعية في الأردن، وتتيح نشر عروض البيع وطلبات الشراء، والتفاوض، والمراسلة، وإدارة الاشتراكات، ولوحة إدارة للمنصة.

## التقنيات

- **الخادم:** Node.js + Express + `node:sqlite` + Zod + bcryptjs + JWT (httpOnly cookie)
- **العميل:** React 18 + Vite + React Router + CSS (Tajawal)
- **الاختبارات:** Node.js test runner + Supertest

## المتطلبات

- Node.js 24 (أو أحدث إصدار LTS)
- npm

## الإعداد والتشغيل

```bash
npm install
npm run build:client
npm run dev
```

- الخادم: `http://localhost:4000`
- الواجهة (Vite): `http://localhost:5173`

أو تشغيل كل خدمة على حدة:

```bash
npm run dev:server
npm run dev:client
```

### متغيرات البيئة (اختيارية)

انسخ `.env.example` (إن وُجد) أو اضبط:

| المتغير | الوصف | القيمة الافتراضية |
| --- | --- | --- |
| `PORT` | منفذ الخادم | `4000` |
| `JWT_SECRET` | مفتاح توقيع JWT | قيمة تطوير |
| `DATABASE_PATH` | مسار قاعدة البيانات | `data/app.db` |
| `SEED_DEMO` | بذر بيانات تجريبية | `true` |
| `PAYMENT_PROVIDER` | مزوّد الدفع (اختياري) | غير مفعّل |
| `NODE_ENV` | بيئة التشغيل | `development` |

## الحسابات التجريبية

| الدور | رقم الهاتف | كلمة المرور |
| --- | --- | --- |
| مشرف | 0790000000 | Admin1234 |
| مزارع | 0790000001 | Mostaqel123 |
| تاجر | 0790000002 | Mostaqel123 |
| شركة نقل | 0790000003 | Mostaqel123 |

## الاختبارات

```bash
npm run typecheck
npm test
npm run build:client
```

## هيكل المشروع

```
server/src/       # خادم Express + الوحدات
client/src/       # واجهة React
tests/            # اختبارات Supertest
data/             # قاعدة البيانات (تُنشأ تلقائياً)
```

## ملاحظات

- الدفع الإلكتروني غير مفعّل افتراضياً (`PAYMENT_PROVIDER` غير مضبوط)؛ تظهر رسالة تواصل مع الدعم.
- دورة الاشتراك 30 يوماً؛ الخطة المجانية: 5 إعلانات/شهر، المهنية: 50 إعلاناً/شهر بسعر 4.97 د.أ.
- صور الإعلانات: حتى 5 صور، 5 ميجابايت للصورة.
