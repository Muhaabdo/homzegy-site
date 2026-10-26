# Homzegy — الخطوات الجاية

آخر تحديث: 26 أكتوبر 2026 · الموقع شغال على https://homzegy.com (Hostinger، من فرع `main`)

## 1. التتبع (أول أولوية — قبل أي إعلان)
- [ ] Abdo: يعمل GTM container وGA4 property ويبعت `GTM-XXXX` و`G-XXXX`
- [ ] Abdo: يعمل Google Sheet + Apps Script (`apps-script/README.md`) ويبعت لينك `/exec`
- [ ] Claude: يحط `gtmId` و`formEndpoint` في `assets/js/main.js`
- [ ] Claude: يجهز ملف GTM container JSON للـ import (GA4 config + event tags لكل الأحداث + triggers + variables)
- [ ] GA4: تسجيل custom dimensions + تعليم key events (`generate_lead`, `whatsapp_click`, `call_click`, `payment_plan_request`) — `docs/tracking.md`
- [ ] ربط GA4 بحساب Google Ads + import الـ key events كـ conversions
- [ ] Google Ads conversion tag + Conversion Linker في GTM (+ Enhanced Conversions for Leads اختياري)
- [ ] عمل الـ Audiences في GA4
- [ ] تست كامل: GTM Preview + GA4 DebugView + ليد تجريبي يوصل للشيت

## 2. النسخة الإنجليزية
- [ ] `/en/`, `/en/somabay/`, `/en/makadi-heights/`, `/en/privacy-policy/`
- [ ] زرار تغيير اللغة في الهيدر + `hreflang` بين النسختين
- [ ] رسائل واتساب إنجليزي + تحديث `sitemap.xml` و`llms.txt`

## 3. SEO والفهرسة
- [ ] Google Search Console (Domain property) + إرسال `sitemap.xml` + Request indexing للصفحات
- [ ] Bing Webmaster Tools (Import من Search Console)
- [ ] Rich Results Test (FAQ / Breadcrumb / RealEstateListing) + PageSpeed Insights موبايل
- [ ] تست صور المشاركة على واتساب وفيسبوك

## 4. داتا محتاجة تأكيد
- [ ] أسعار مكادي: الفلاير (26/10) ولا شيت ATS (25/10)؟ (حالياً الفلاير)
- [ ] أنظمة سداد التسليم القريب: Ria 35%/3 سنين، Ledge وLedge Flare 30%/4 سنين — تأكيد
- [ ] مساحة مكادي (4.75M من البروشور vs 3.4M من الموقع) والمسافة للمطار (20 vs 15 دقيقة)
- [ ] صورة خاصة بـ Aden Parks (حالياً صورة عامة لمكادي)
- [ ] لوجو Homzegy، وإيميل للتواصل في سياسة الخصوصية، واسم صاحب المنصة لو هيظهر

## 5. حملات Google Ads (Search)
- [ ] حملة لكل مشروع (Somabay / Makadi Heights)، Ad groups حسب المرحلة + كلمات عامة للمشروع (عربي وإنجليزي)
- [ ] RSAs + Sitelinks على سكاشن الصفحة (`#prices`, `#payment`, `#ready`) + Call asset
- [ ] Negative keywords (وظايف، إيجار، فنادق/حجز إقامة، ...)
- [ ] الحذر من أسماء البراندات في نص الإعلان (trademark)
- [ ] Remarketing من Audiences GA4 بعد ما تتجمع داتا

## 6. تشغيل مستمر
- [ ] تحديث الأسعار لما يوصل price list جديد (`README.md` → تحديث الأسعار)
- [ ] تقرير Leads vs Conversions أسبوعي (الشيت مقابل Google Ads)
