# FocusLens Frontend

الواجهة الأمامية لمشروع FocusLens، وتشمل صفحة الهبوط وتجربة الطالب ولوحة متابعة ولي الأمر.

الموقع المنشور: [focuslens-frontend.vercel.app](https://focuslens-frontend.vercel.app/)

## التقنيات

- React
- Vite
- React Router

## التشغيل محليًا

تأكدي من تثبيت Node.js وnpm، ثم شغّلي الأوامر من مجلد المشروع:

```bash
npm install
npm run dev
```

افتحي الرابط المحلي الذي يظهره Vite في الطرفية.

## متغيرات البيئة

أنشئي ملفًا باسم `.env.local` في جذر المشروع عند الحاجة لاتصال الـAPI أو تسجيل الدخول عبر Google:

```env
VITE_API_BASE_URL=https://your-api-url
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

استبدلي القيم بعناوين ومعرّفات البيئة المناسبة. لا تضعي أسرارًا أو مفاتيح خاصة في هذا الملف؛ متغيرات `VITE_` تكون متاحة في كود المتصفح. ملف البيئة المحلي مستثنى من Git.

## أوامر المشروع

```bash
npm run dev      # تشغيل بيئة التطوير
npm run build    # إنشاء نسخة الإنتاج داخل dist
npm run preview  # معاينة نسخة الإنتاج محليًا
```

## النشر

المشروع مربوط بـVercel، والتغييرات على فرع `main` تنشئ نشرًا للإنتاج. تُدار متغيرات البيئة الخاصة بالإنتاج من إعدادات المشروع في Vercel.

## بنية الملفات

- `src/` — صفحات ومكونات التطبيق وأنماطه.
- `public/images/` — الصور والأصول الثابتة.
- `index.html` — نقطة دخول تطبيق Vite.
- `vercel.json` — إعدادات توجيه المسارات على Vercel.
- `vite.config.js` — إعدادات Vite.
