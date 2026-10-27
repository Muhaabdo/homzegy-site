# Homzegy — homzegy.com

موقع Homzegy: منصة عقارية مستقلة لمشروعات البحر الأحمر. HTML + CSS + JavaScript بس، من غير build أو مكتبات.

## الصفحات
| المسار | الملف |
|---|---|
| `/` | `index.html` — الصفحة الرئيسية التعريفية |
| `/somabay/` | `somabay/index.html` |
| `/makadi-heights/` | `makadi-heights/index.html` |
| `/privacy-policy/` | `privacy-policy/index.html` |
| 404 | `404.html` |

## الملفات المشتركة
- `assets/css/style.css` — كل الستايل (الألوان في `:root` أول الملف)
- `assets/js/main.js` — الواتساب والاتصال، الفورم، التتبع، الفلاتر، الكوكيز
- `assets/img/` — الصور (`somabay/`, `makadi/`, `brand/` للأيقونة وصور المشاركة)

## الإعدادات (أول `assets/js/main.js`)
```js
whatsapp: "201224044430",
phone: "+201224044430",
formEndpoint: "",   // لينك Google Apps Script — شوف apps-script/README.md
ga4Id: "",          // G-XXXXXXX
gtmId: "",          // اختياري
```

## تحديث الأسعار
- **Somabay:** جدول الأسعار مختصر بـ 4 فئات حسب عدد الغرف (أقل سعر تقسيط 8 سنين في كل فئة)، وكل كارت مرحلة فيه "يبدأ من". عدّل الأرقام في `somabay/index.html` (السعر + نفس الرقم في `data-wa-msg`).
- **Makadi Heights:** كل وحدة `<tr>` في جدول المرحلة (أول 3 بيظهروا والباقي ورا "اعرض كل الوحدات").
- لو أقل سعر في المشروع اتغير، عدّله كمان في: الهيرو، الأسئلة الشائعة، `<meta name="description">`، الـ JSON-LD (`lowPrice`)، `llms.txt`، والصفحة الرئيسية.

## التجربة لوكال
افتح الفولدر بسيرفر محلي (مش بدبل كليك على الملف) عشان الروابط تشتغل صح:
```bash
python -m http.server 8000
```
وبعدين افتح `http://localhost:8000`. أو استخدم Live Server في VS Code.

## النشر على Hostinger
- اربط الـ repo من hPanel → Advanced → **Git**: الـ repository `https://github.com/Muhaabdo/homzegy-site.git`، الفرع `main`، والمسار `public_html`. وفعّل Auto Deployment لو عايز كل push يتنشر لوحده.
- ملف `.htaccess` جاهز: بيحوّل لـ HTTPS ومن غير www، وبيشغّل صفحة 404، وبيقفل فولدرات `apps-script` و`docs` وملف `README.md` عن الزوار، وبيضغط الملفات ويعمل caching للصور.

## بعد النشر
- Google Search Console: ضيف الدومين وابعت `https://homzegy.com/sitemap.xml`.
- Bing Webmaster Tools: Import من Search Console.
- `llms.txt` و`robots.txt` جاهزين لمحركات البحث والـ AI.
- التتبع والأحداث والـ Audiences: `docs/tracking.md`.

## الفولدرات اللي مش جزء من الموقع
- `apps-script/` — كود Google Sheets للفورم
- `docs/` — توثيق التتبع
