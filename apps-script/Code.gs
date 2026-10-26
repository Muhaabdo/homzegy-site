/**
 * Homzegy — lead capture to Google Sheets
 * Paste this file into Extensions → Apps Script of your Google Sheet,
 * then deploy as a Web App (see README.md in this folder).
 */

const SHEET_NAME = 'Leads';
const NOTIFY_EMAIL = '';            // optional: put an email to get notified on every lead
const COLUMNS = [
  'submitted_at', 'name', 'phone', 'project', 'interest', 'form_location',
  'page', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'gbraid', 'wbraid', 'msclkid', 'landing_page', 'referrer', 'page_url', 'received_at'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    if (p.website) return json_({ ok: true });            // honeypot — bots fill it
    if (!p.name || !p.phone) return json_({ ok: false, error: 'missing fields' });

    const sheet = getSheet_();
    const row = COLUMNS.map(function (c) {
      if (c === 'received_at') return new Date();
      return safe_(p[c] || '');
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        'ليد جديد — ' + (p.project || 'Homzegy') + ' — ' + p.name,
        'الاسم: ' + p.name + '\nالموبايل: ' + p.phone + '\nالمشروع: ' + (p.project || '') +
        '\nمهتم بـ: ' + (p.interest || '') + '\nالحملة: ' + (p.utm_campaign || '') + '\nالصفحة: ' + (p.page_url || ''));
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'homzegy-leads' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sh;
}

// Stops values like "+2010..." or "=..." being read as formulas.
function safe_(v) {
  v = String(v).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
