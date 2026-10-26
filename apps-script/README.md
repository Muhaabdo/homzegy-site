# ربط الفورم بشيت Google

1. اعمل Google Sheet جديد (مثلاً: Homzegy Leads).
2. من القائمة: **Extensions → Apps Script**.
3. امسح الكود الموجود والصق محتوى `Code.gs`.
   - لو عايز إيميل مع كل ليد، اكتب الإيميل في `NOTIFY_EMAIL`.
4. **Deploy → New deployment** → النوع **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. وافق على الصلاحيات، وانسخ **Web app URL** (بيخلص بـ `/exec`).
6. افتح `assets/js/main.js` وحط اللينك في:
   ```js
   formEndpoint: "https://script.google.com/macros/s/XXXX/exec",
   ```
7. جرّب: ابعت الفورم من الموقع، المفروض يظهر صف جديد في تاب **Leads** (التاب والعناوين بيتعملوا أوتوماتيك أول مرة).

## ملاحظات
- لو عدّلت الكود بعد النشر: **Deploy → Manage deployments → Edit → New version**، عشان اللينك يفضل زي ما هو.
- الفورم بيبعت: الاسم، الموبايل، المشروع، "مهتم بإيه"، مكان الفورم في الصفحة، الصفحة، وUTM وgclid/gbraid/wbraid ولينك أول صفحة دخلها الزائر.
- فيه حقل مخفي (honeypot) بيمنع السبام من البوتات.
