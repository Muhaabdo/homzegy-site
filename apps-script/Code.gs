/**
 * Homzegy — Lead capture to Google Sheets
 * ----------------------------------------
 * 1) Paste this file into Extensions → Apps Script of an empty Google Sheet.
 * 2) Run `setup` once (Run ▸ setup) and approve permissions — it builds and styles the sheets.
 * 3) Deploy ▸ New deployment ▸ Web app — Execute as: Me, Who has access: Anyone.
 * 4) Put the /exec URL in assets/js/main.js → SITE.formEndpoint.
 * Details: apps-script/README.md
 */

/* ============================ CONFIG ============================ */
const CONFIG = {
  SHEET_LEADS: 'Leads',
  SHEET_SUMMARY: 'ملخص',
  TIMEZONE: 'Africa/Cairo',
  DUPLICATE_WINDOW_DAYS: 30,          // same phone within N days → flagged as repeat
  // NOTIFY_EMAIL: 'sales@example.com', // ← email notifications (see sendLeadEmail_ below, currently disabled)
};

// Homzegy brand colors
const BRAND = {
  navy: '#0A2B42', teal: '#1FB5B5', tealLight: '#E3F4F4', coral: '#E3734F',
  sand: '#E1DFD6', sandLight: '#F6F5F1', white: '#FFFFFF', muted: '#4D6272'
};

const STATUSES = ['جديد', 'تم التواصل', 'مهتم', 'معاينة', 'حجز', 'غير مهتم', 'مش بيرد', 'رقم غلط'];
const STATUS_COLORS = {
  'جديد': ['#FBE9E2', '#A9461F'], 'تم التواصل': ['#E3F4F4', '#0C7373'], 'مهتم': ['#D7F0E1', '#1F8F4E'],
  'معاينة': ['#DCEBFA', '#1B5A96'], 'حجز': ['#1F8F4E', '#FFFFFF'], 'غير مهتم': ['#ECEAE3', '#4D6272'],
  'مش بيرد': ['#FFF4D6', '#8A6100'], 'رقم غلط': ['#F6D5D5', '#9B1C1C']
};

/*
 * Columns: [key, Arabic header, width]
 * Client-facing data first, marketing/attribution data after.
 */
const COLUMNS = [
  ['submitted_at', 'التاريخ والوقت', 150],
  ['name', 'الاسم', 160],
  ['phone', 'الموبايل', 135],
  ['whatsapp', 'واتساب', 95],
  ['project', 'المشروع', 130],
  ['interest', 'مهتم بـ', 170],
  ['status', 'الحالة', 115],
  ['notes', 'ملاحظات', 220],
  ['repeat', 'تكرار', 95],
  ['source', 'المصدر', 130],
  ['campaign', 'الحملة', 170],
  ['keyword', 'الكلمة', 150],
  ['page', 'الصفحة', 140],
  ['form_location', 'مكان الفورم', 100],
  ['lang', 'اللغة', 60],
  ['device', 'الجهاز', 75],
  ['utm_source', 'utm_source', 110],
  ['utm_medium', 'utm_medium', 100],
  ['utm_campaign', 'utm_campaign', 140],
  ['utm_term', 'utm_term', 130],
  ['utm_content', 'utm_content', 120],
  ['gclid', 'gclid', 160],
  ['gbraid', 'gbraid', 120],
  ['wbraid', 'wbraid', 120],
  ['msclkid', 'msclkid', 120],
  ['landing_page', 'أول صفحة دخلها', 160],
  ['referrer', 'جاي منين (Referrer)', 180],
  ['page_url', 'رابط الصفحة', 220],
  ['lead_id', 'Lead ID', 110],
];
const COL = {}; COLUMNS.forEach(function (c, i) { COL[c[0]] = i + 1; });
/* ================================================================ */


/* ---------------------------- Web app ---------------------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const p = (e && e.parameter) || {};
    if (p.website) return json_({ ok: true });                       // honeypot — bots fill it
    const name = clean_(p.name), phone = normalizePhone_(p.phone);
    if (!name || !phone) return json_({ ok: false, error: 'missing name or phone' });

    const sh = getLeadsSheet_();
    const now = new Date();
    const lead = {
      submitted_at: now,
      name: name,
      phone: phone,
      whatsapp: '',
      project: clean_(p.project),
      interest: clean_(p.interest) || '—',
      status: 'جديد',
      notes: '',
      repeat: isRepeat_(sh, phone, now) ? 'رقم مكرر' : '',
      source: sourceLabel_(p),
      campaign: clean_(p.utm_campaign),
      keyword: clean_(p.utm_term),
      page: clean_(p.page),
      form_location: clean_(p.form_location),
      lang: clean_(p.lang) || 'ar',
      device: clean_(p.device),
      utm_source: clean_(p.utm_source), utm_medium: clean_(p.utm_medium), utm_campaign: clean_(p.utm_campaign),
      utm_term: clean_(p.utm_term), utm_content: clean_(p.utm_content),
      gclid: clean_(p.gclid), gbraid: clean_(p.gbraid), wbraid: clean_(p.wbraid), msclkid: clean_(p.msclkid),
      landing_page: clean_(p.landing_page), referrer: clean_(p.referrer), page_url: clean_(p.page_url),
      lead_id: 'HZ-' + Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 90 + 10)
    };

    // Append after the last lead; grow the sheet from *inside* the formatted area so
    // banding, status dropdown, colors and filter all stretch automatically.
    if (sh.getLastRow() + 20 > sh.getMaxRows()) sh.insertRowsBefore(sh.getMaxRows(), 500);
    const row = sh.getLastRow() + 1;
    const values = COLUMNS.map(function (c) {
      if (c[0] === 'whatsapp') return '';
      if (c[0] === 'phone') return "'" + phone;                     // keep the leading 0
      return lead[c[0]];
    });
    sh.getRange(row, 1, 1, COLUMNS.length).setValues([values]);
    sh.getRange(row, COL.whatsapp).setFormula('=HYPERLINK("https://wa.me/' + waNumber_(phone) + '","فتح واتساب")');
    styleDataRow_(sh, row);

    // sendLeadEmail_(lead);   // ← enable later (uncomment) after setting CONFIG.NOTIFY_EMAIL

    return json_({ ok: true, id: lead.lead_id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'homzegy-leads' });
}


/* ----------------------------- Setup ----------------------------- */
/** Run once from the editor. Safe to run again: it re-applies styles without deleting leads. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  // Leads sheet
  let sh = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (!sh) {
    const first = ss.getSheets()[0];
    sh = (first.getLastRow() === 0 && first.getName() !== CONFIG.SHEET_SUMMARY) ? first.setName(CONFIG.SHEET_LEADS) : ss.insertSheet(CONFIG.SHEET_LEADS);
  }
  sh.setRightToLeft(true);
  if (sh.getMaxColumns() < COLUMNS.length) sh.insertColumnsAfter(sh.getMaxColumns(), COLUMNS.length - sh.getMaxColumns());
  if (sh.getMaxColumns() > COLUMNS.length) sh.deleteColumns(COLUMNS.length + 1, sh.getMaxColumns() - COLUMNS.length);
  if (sh.getMaxRows() < 500) sh.insertRowsAfter(sh.getMaxRows(), 500 - sh.getMaxRows());

  const header = sh.getRange(1, 1, 1, COLUMNS.length);
  header.setValues([COLUMNS.map(function (c) { return c[1]; })])
    .setBackground(BRAND.navy).setFontColor(BRAND.white).setFontWeight('bold')
    .setFontFamily('Cairo').setFontSize(11).setVerticalAlignment('middle').setHorizontalAlignment('center').setWrap(true);
  // marketing columns header in teal so the sales team knows where client data ends
  sh.getRange(1, COL.source, 1, COLUMNS.length - COL.source + 1).setBackground(BRAND.teal).setFontColor(BRAND.navy);
  sh.setRowHeight(1, 40);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(COL.phone);
  COLUMNS.forEach(function (c, i) { sh.setColumnWidth(i + 1, c[2]); });

  const body = sh.getRange(2, 1, sh.getMaxRows() - 1, COLUMNS.length);
  body.setFontFamily('Cairo').setFontSize(10).setVerticalAlignment('middle').setFontColor(BRAND.navy);
  sh.getRange(2, COL.submitted_at, sh.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange(2, COL.phone, sh.getMaxRows() - 1, 1).setNumberFormat('@');

  // Alternating rows (brand sand)
  sh.getBandings().forEach(function (b) { b.remove(); });
  sh.getRange(1, 1, sh.getMaxRows(), COLUMNS.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(BRAND.navy).setFirstRowColor(BRAND.white).setSecondRowColor(BRAND.sandLight);
  header.setBackground(BRAND.navy);
  sh.getRange(1, COL.source, 1, COLUMNS.length - COL.source + 1).setBackground(BRAND.teal);

  // Status dropdown + colors
  const statusRange = sh.getRange(2, COL.status, sh.getMaxRows() - 1, 1);
  statusRange.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build())
    .setHorizontalAlignment('center').setFontWeight('bold');
  const rules = [];
  STATUSES.forEach(function (s) {
    const c = STATUS_COLORS[s];
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s).setBackground(c[0]).setFontColor(c[1]).setRanges([statusRange]).build());
  });
  const repeatRange = sh.getRange(2, COL.repeat, sh.getMaxRows() - 1, 1);
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('رقم مكرر').setBackground('#FFF4D6').setFontColor('#8A6100').setRanges([repeatRange]).build());
  const sourceRange = sh.getRange(2, COL.source, sh.getMaxRows() - 1, 1);
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Google Ads').setFontColor('#0C7373').setBold(true).setRanges([sourceRange]).build());
  sh.setConditionalFormatRules(rules);

  sh.getRange(2, COL.whatsapp, sh.getMaxRows() - 1, 1).setHorizontalAlignment('center').setFontColor('#1F8F4E');
  sh.getRange(2, COL.notes, sh.getMaxRows() - 1, 1).setWrap(true);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), COLUMNS.length).createFilter();

  buildSummary_(ss);
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);
  toast_(ss, 'تم تجهيز الشيت ✓');
}

function buildSummary_(ss) {
  let s = ss.getSheetByName(CONFIG.SHEET_SUMMARY);
  if (!s) s = ss.insertSheet(CONFIG.SHEET_SUMMARY);
  s.clear(); s.clearConditionalFormatRules();
  s.setRightToLeft(true);
  s.getRange('A:Z').setFontFamily('Cairo').setFontColor(BRAND.navy);
  const L = "'" + CONFIG.SHEET_LEADS + "'!";
  const col = function (k) { const a = colLetter_(COL[k]); return L + a + '2:' + a; };

  s.getRange('A1').setValue('Homzegy — ملخص الليدز').setFontSize(16).setFontWeight('bold');
  s.getRange('A1:D1').merge().setBackground(BRAND.navy).setFontColor(BRAND.white);
  s.setRowHeight(1, 44);

  const kpis = [
    ['إجمالي الليدز', '=COUNTA(' + col('lead_id') + ')'],
    ['النهارده', '=COUNTIFS(' + col('submitted_at') + ',">="&TODAY())'],
    ['آخر 7 أيام', '=COUNTIFS(' + col('submitted_at') + ',">="&TODAY()-6)'],
    ['من Google Ads', '=COUNTIF(' + col('source') + ',"Google Ads*")'],
    ['لسه جديد (ماحدش كلمه)', '=COUNTIF(' + col('status') + ',"جديد")'],
    ['حجز', '=COUNTIF(' + col('status') + ',"حجز")'],
  ];
  s.getRange(3, 1, kpis.length, 2).setValues(kpis);
  s.getRange(3, 1, kpis.length, 1).setBackground(BRAND.sandLight).setFontWeight('bold');
  s.getRange(3, 2, kpis.length, 1).setBackground(BRAND.tealLight).setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');

  const section = function (row, title, key) {
    s.getRange(row, 1, 1, 2).setValues([[title, 'عدد']]).setBackground(BRAND.teal).setFontWeight('bold');
    s.getRange(row + 1, 1).setFormula('=IFERROR(QUERY({' + col(key) + '},"select Col1, count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label count(Col1) \'\'",0),"—")');
  };
  section(11, 'حسب المشروع', 'project');
  section(11 + 12, 'حسب الاهتمام', 'interest');
  s.getRange(11, 4, 1, 2).setValues([['حسب المصدر', 'عدد']]).setBackground(BRAND.teal).setFontWeight('bold');
  s.getRange(12, 4).setFormula('=IFERROR(QUERY({' + col('source') + '},"select Col1, count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label count(Col1) \'\'",0),"—")');
  s.getRange(23, 4, 1, 2).setValues([['حسب الحالة', 'عدد']]).setBackground(BRAND.teal).setFontWeight('bold');
  s.getRange(24, 4).setFormula('=IFERROR(QUERY({' + col('status') + '},"select Col1, count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label count(Col1) \'\'",0),"—")');
  s.setColumnWidth(1, 220); s.setColumnWidth(2, 90); s.setColumnWidth(3, 30); s.setColumnWidth(4, 200); s.setColumnWidth(5, 90);
  s.setFrozenRows(1);
}


/* ------------------------ Email notification ------------------------ */
// Disabled for now. To enable: set CONFIG.NOTIFY_EMAIL above, then uncomment the call in doPost and the body below.
function sendLeadEmail_(lead) {
  // if (!CONFIG.NOTIFY_EMAIL) return;
  // const subject = 'ليد جديد — ' + (lead.project || 'Homzegy') + ' — ' + lead.name;
  // const rows = [
  //   ['الاسم', lead.name], ['الموبايل', lead.phone], ['المشروع', lead.project], ['مهتم بـ', lead.interest],
  //   ['المصدر', lead.source], ['الحملة', lead.campaign], ['الكلمة', lead.keyword], ['الصفحة', lead.page],
  //   ['الجهاز', lead.device], ['تكرار', lead.repeat || '—'], ['Lead ID', lead.lead_id]
  // ];
  // const html =
  //   '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:' + BRAND.navy + '">' +
  //   '<div style="background:' + BRAND.navy + ';color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;font-size:18px"><b>Homzegy</b> — ليد جديد</div>' +
  //   '<table style="border-collapse:collapse;width:100%;max-width:560px;background:#fff">' +
  //   rows.map(function (r, i) {
  //     return '<tr style="background:' + (i % 2 ? BRAND.sandLight : '#fff') + '"><td style="padding:8px 12px;font-weight:bold;width:130px">' + r[0] +
  //            '</td><td style="padding:8px 12px">' + (r[1] || '—') + '</td></tr>';
  //   }).join('') +
  //   '</table>' +
  //   '<p style="margin:16px 0"><a href="https://wa.me/' + waNumber_(lead.phone) + '" style="background:#1F8F4E;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">كلّمه واتساب</a> ' +
  //   '&nbsp; <a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" style="color:' + BRAND.teal + '">افتح الشيت</a></p></div>';
  // MailApp.sendEmail({ to: CONFIG.NOTIFY_EMAIL, subject: subject, htmlBody: html, name: 'Homzegy Leads' });
}


/* ----------------------------- Helpers ----------------------------- */
function getLeadsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_LEADS);
  if (!sh) { setup(); sh = ss.getSheetByName(CONFIG.SHEET_LEADS); }
  return sh;
}

function styleDataRow_(sh, row) {
  sh.getRange(row, 1, 1, COLUMNS.length).setFontFamily('Cairo').setFontSize(10).setFontColor(BRAND.navy).setVerticalAlignment('middle');
  sh.getRange(row, COL.submitted_at).setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange(row, COL.status).setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(row, COL.whatsapp).setHorizontalAlignment('center').setFontColor('#1F8F4E');
  sh.getRange(row, COL.name).setFontWeight('bold');
  sh.getRange(row, COL.phone).setNumberFormat('@');
}

/** Human-readable traffic source from the attribution fields. */
function sourceLabel_(p) {
  if (p.gclid || p.gbraid || p.wbraid) return 'Google Ads';
  if (p.msclkid) return 'Microsoft Ads';
  const src = (p.utm_source || '').toLowerCase(), med = (p.utm_medium || '').toLowerCase();
  if (src) {
    if (/google/.test(src) && /cpc|ppc|paid/.test(med)) return 'Google Ads';
    if (/facebook|fb|instagram|ig|meta/.test(src)) return 'Meta' + (med ? ' (' + med + ')' : '');
    return p.utm_source + (p.utm_medium ? ' / ' + p.utm_medium : '');
  }
  const ref = (p.referrer || '').toLowerCase();
  if (!ref || ref.indexOf('homzegy.com') > -1) return 'Direct';
  if (/google\./.test(ref)) return 'Google (Organic)';
  if (/bing\./.test(ref)) return 'Bing (Organic)';
  if (/facebook|instagram|fb\./.test(ref)) return 'Meta (Organic)';
  if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(ref)) return 'AI Search';
  try { return 'Referral: ' + ref.replace(/^https?:\/\//, '').split('/')[0]; } catch (e) { return 'Referral'; }
}

function isRepeat_(sh, phone, now) {
  const last = sh.getLastRow();
  if (last < 2) return false;
  const n = Math.min(last - 1, 2000);
  const phones = sh.getRange(2, COL.phone, n, 1).getValues();
  const dates = sh.getRange(2, COL.submitted_at, n, 1).getValues();
  const limit = now.getTime() - CONFIG.DUPLICATE_WINDOW_DAYS * 864e5;
  for (let i = 0; i < n; i++) {
    if (String(phones[i][0]).replace(/^'/, '') === phone && dates[i][0] instanceof Date && dates[i][0].getTime() >= limit) return true;
  }
  return false;
}

/** 01012345678 / +201012345678 / 00201012345678 → 01012345678 (Egypt); other countries kept with + */
function normalizePhone_(v) {
  let s = String(v || '').replace(/[^\d+]/g, '');
  if (!s) return '';
  if (s.indexOf('00') === 0) s = '+' + s.slice(2);
  if (/^\+?20(1\d{9})$/.test(s)) return '0' + s.replace(/^\+?20/, '');
  if (/^1[0125]\d{8}$/.test(s)) return '0' + s;
  return s;
}

function waNumber_(phone) {
  const s = String(phone).replace(/[^\d+]/g, '');
  if (/^01\d{9}$/.test(s)) return '2' + s;          // Egypt local → 20...
  return s.replace(/^\+/, '');
}

// Text only, trimmed, no formula injection
function clean_(v) {
  v = String(v == null ? '' : v).trim().slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function colLetter_(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

function toast_(ss, msg) { try { ss.toast(msg, 'Homzegy', 4); } catch (e) {} }

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
