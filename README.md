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
كل وحدة في جدول الأسعار عبارة عن `<tr>` في صفحة المشروع. عدّل الرقم في `u-price`، وعدّل نفس الرقم في رسالة الواتساب (`data-wa-msg`) في نفس السطر.
لو أقل سعر في المشروع اتغير، عدّله كمان في: الهيرو، كارت المرحلة، الأسئلة الشائعة، `<meta name="description">`، الـ JSON-LD (`lowPrice`)، `llms.txt`، والصفحة الرئيسية.

## النشر على GitHub Pages
1. ارفع محتوى الفولدر ده على الـ repo (الملفات في الـ root).
2. Settings → Pages → Source: **Deploy from a branch** → `main` / `root`.
3. ملف `CNAME` فيه `homzegy.com`. من الـ DNS عند مزوّد الدومين:
   - `A` records للـ root على: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` لـ `www` على `<username>.github.io`
4. فعّل **Enforce HTTPS**.

## بعد النشر
- Google Search Console: ضيف الدومين وابعت `https://homzegy.com/sitemap.xml`.
- Bing Webmaster Tools: Import من Search Console.
- `llms.txt` و`robots.txt` جاهزين لمحركات البحث والـ AI.
- التتبع والأحداث والـ Audiences: `docs/tracking.md`.

## الفولدرات اللي مش جزء من الموقع
- `apps-script/` — كود Google Sheets للفورم
- `docs/` — توثيق التتبع
