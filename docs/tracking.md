# Homzegy — GA4 events & audiences

## Setup
- GTM container `GTM-5B2ZWT3M` متركب في كل الصفحات (`<head>` + `<noscript>` بعد `<body>`).
- الموقع مش بيحمّل GA4 بنفسه: اعمل في GTM تاج **Google tag** بالـ Measurement ID على All Pages، وتاج **GA4 Event** لكل حدث تحت.
- كل حدث بيتبعت للـ `dataLayer` بالشكل ده: `{ event: "whatsapp_click", project, page_type, cta_location, phase, unit_type }` — اعمل لكل parameter متغير **Data Layer Variable** بنفس الاسم.

كل حدث معاه تلقائياً: `project` (Homzegy / Somabay / Makadi Heights) و`page_type` (home / project / privacy / thank-you).

### الفورم وصفحة الشكر
بعد إرسال الفورم بنجاح، الزائر بيتحوّل لـ `/thank-you/`، وحدث `generate_lead` بيتبعت هناك **مرة واحدة بس** (لو عمل reload مش بيتحسب تاني). Parameters: `lead_project`, `interest`, `form_location`.
للـ Google Ads conversion: استخدم Custom Event trigger على `generate_lead` (أدق من page view على `/thank-you/`).

## Events

| Event | امتى | Parameters |
|---|---|---|
| `whatsapp_click` | أي ضغطة على زرار واتساب | `cta_location`, `phase`, `unit_type` |
| `payment_plan_request` | ضغطة على "اطلب خطة الدفع" (بيتبعت مع `whatsapp_click`) | `cta_location`, `phase`, `unit_type` |
| `call_click` | أي ضغطة على زرار اتصال | `cta_location` |
| `form_start` | أول ما الزائر يكتب في الفورم | `form_location` |
| `generate_lead` | على صفحة `/thank-you/` بعد إرسال الفورم بنجاح | `lead_project`, `interest`, `form_location` |
| `form_error` | الإرسال فشل | — |
| `form_cta_click` | "أو سيب بياناتك ونكلمك" | `cta_location`, `phase` |
| `view_prices` | سكشن الأسعار ظهر على الشاشة | — |
| `view_contact` | سكشن التواصل ظهر على الشاشة | — |
| `price_filter` | تغيير فلتر المرحلة أو الغرف | `filter`, `value` |
| `show_more_phases` | "اعرض باقي المراحل" في Somabay | — |
| `section_nav_click` | ضغطة على شريط السكاشن | `section` |
| `faq_open` | فتح سؤال | `question` |

قيم `cta_location`: `header`, `hero`, `phase_card`, `price_list`, `phase_units`, `ready_units`, `ready_card`, `payment_section`, `home_project_card`, `*_section` (سكشن التواصل), `sticky_bar`, `footer`, `form_success`, `404`, `thank_you`.

### Custom dimensions (Admin → Custom definitions → Event scope)
`project`, `page_type`, `cta_location`, `phase`, `unit_type`, `form_location`, `interest`

### Key events (conversions)
- `generate_lead` ← الأهم، Primary في Google Ads
- `whatsapp_click`, `call_click` ← Secondary (أو Primary لو الواتساب هو الهدف الأساسي في الحملة)
- `payment_plan_request` ← مؤشر نية شرا عالية، ينفع Secondary

## Audiences (Admin → Audiences)
| Audience | Condition | الاستخدام |
|---|---|---|
| Somabay — visitors | `page_view` + `project = Somabay` · 30 يوم | Remarketing |
| Makadi Heights — visitors | `page_view` + `project = Makadi Heights` · 30 يوم | Remarketing |
| Viewed prices, no contact | `view_prices` · استبعاد `whatsapp_click`, `call_click`, `generate_lead` · 14 يوم | Remarketing بعرض خطة الدفع |
| Payment-plan requesters | `payment_plan_request` · 60 يوم | Remarketing + Similar segments |
| Form starters, no submit | `form_start` · استبعاد `generate_lead` · 7 أيام | Remarketing قصير |
| Contacted (WhatsApp / Call) | `whatsapp_click` أو `call_click` · 90 يوم | استبعاد من prospecting أو upsell للمشروع التاني |
| Leads | `generate_lead` · 180 يوم | استبعاد من الحملات + Customer list seed |
| Engaged visitors | `user_engagement` > 60s أو 3+ page views · 30 يوم | Observation في Search |

اربط GA4 بـ Google Ads (Admin → Product links) عشان الـ Audiences والـ Key events يتنقلوا للحملات.
