# شيت الليدز (Google Sheets + Apps Script)

## التركيب (مرة واحدة)
1. اعمل Google Sheet جديد فاضي (مثلاً: **Homzegy Leads**).
2. **Extensions → Apps Script** → امسح الكود الموجود والصق محتوى `Code.gs` → Save.
3. من فوق اختار الدالة **setup** ودوس **Run** → وافق على الصلاحيات.
   - هيتعمل تاب **Leads** متنسق بألوان Homzegy + تاب **Summary** فيه الأرقام (الشيت LTR والعناوين إنجليزي).
   - ممكن تشغّل `setup` تاني في أي وقت (مش بيمسح ليدز، بيرجّع التنسيق بس).
4. **Deploy → New deployment** → النوع **Web app**:
   - Execute as: **Me** — Who has access: **Anyone**
5. انسخ **Web app URL** (آخره `/exec`) وابعتهولي، أو حطه في `assets/js/main.js`:
   ```js
   formEndpoint: "https://script.google.com/macros/s/XXXX/exec",
   ```
6. جرّب الفورم من الموقع → المفروض يظهر صف جديد في **Leads**.

## الأعمدة
| بيانات العميل (هيدر كحلي) | بيانات التسويق (هيدر تيل) |
|---|---|
| Date & Time, Name, Phone, WhatsApp, Project, Interest, **Status**, Notes, Repeat | Source, Campaign, Keyword, Page, Form Location, Language, Device, UTMs, gclid / gbraid / wbraid / msclkid, Landing Page, Referrer, Page URL, Lead ID |

- **Status**: New / Contacted / Interested / Site Visit / Booked / Not Interested / No Answer / Wrong Number — كل واحدة بلون.
- **تكرار**: لو نفس الرقم سجّل خلال 30 يوم بيتعلّم "Repeat".
- الـ gclid محفوظ عشان بعدين نرفع Offline Conversions (اللي حجز فعلاً) لجوجل أدز.

## إشعار الإيميل (مقفول حالياً)
الكود جاهز في `sendLeadEmail_`. لتشغيله:
1. فوق في `CONFIG` شيل `//` من قدام `NOTIFY_EMAIL` واكتب الإيميل.
2. في `doPost` شيل `//` من قدام `sendLeadEmail_(lead);`.
3. جوه `sendLeadEmail_` شيل `//` من أول كل سطر.
4. **Deploy → Manage deployments → Edit → New version**.

## ملاحظات
- أي تعديل في الكود بعد النشر: **Manage deployments → Edit → Version: New version** عشان اللينك يفضل هو هو.
- فيه حقل مخفي (honeypot) ضد البوتات، وحماية ضد formula injection.
