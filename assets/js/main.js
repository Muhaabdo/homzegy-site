/* Homzegy — shared site script (no dependencies) */
(function () {
  "use strict";

  /* ================= CONFIG — edit here ================= */
  var SITE = {
    whatsapp: "201224044430",          // WhatsApp number, international format, no +
    phone: "+201224044430",            // Call number
    formEndpoint: "https://script.google.com/macros/s/AKfycby5Y6Q8TkXai2f3ZDf0QUXTCtr9QqQOO7gNpWNrmh8sQwisHkUXwlgBSHKmQtvKLb0q/exec",                  // Google Apps Script Web App URL (see apps-script/README.md)
    thankYouUrl: "/thank-you/",        // page shown after a successful form submit (generate_lead fires there)
    cookieHideMs: 8000                 // cookie notice auto-hide delay
  };
  window.HOMZEGY = SITE;
  /* ====================================================== */

  var body = document.body;
  var EN = (document.documentElement.lang || "").slice(0, 2) === "en";
  var T = EN ? {
    waDefault: "Hello, I'd like more details.", less: "Show less", allUnits: "Show all units",
    errName: "Please enter your name", errPhone: "Please enter a valid mobile number, e.g. +20 101 234 5678",
    sending: "Sending...", errSend: "Couldn't send. Please try again or message us on WhatsApp.",
    tyHello: "Hello, I just submitted my details on the website.", tyName: "Name: ", tyInt: "Interested in: ", rlm: "",
    phEg: "01xxxxxxxxx", phIntl: "Mobile number", errPhoneIntl: "Please enter a valid mobile number"
  } : {
    waDefault: "مرحباً، عايز أعرف تفاصيل أكتر.", less: "اعرض أقل", allUnits: "اعرض كل الوحدات",
    errName: "اكتب اسمك", errPhone: "اكتب رقم موبايل صحيح، مثال 01012345678",
    sending: "جاري الإرسال...", errSend: "الإرسال ماكملش. جرّب تاني أو كلمنا واتساب.",
    tyHello: "مرحباً، سجلت بياناتي على الموقع.", tyName: "الاسم: ", tyInt: "مهتم بـ: ", rlm: "\u200F",
    phEg: "01xxxxxxxxx", phIntl: "رقم الموبايل", errPhoneIntl: "اكتب رقم موبايل صحيح"
  };
  if (EN) SITE.thankYouUrl = "/en/thank-you/";
  var PAGE = {
    project: body.getAttribute("data-project") || "Homzegy",
    pageType: body.getAttribute("data-page") || "page"
  };

  /* ---------- storage helpers (never throw) ---------- */
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  /* ---------- analytics: GTM is installed in every page <head>; events go to the dataLayer ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(name, params) {
    window.dataLayer.push(Object.assign({ event: name, project: PAGE.project, page_type: PAGE.pageType }, params || {}));
  }
  window.homzegyTrack = track;

  /* ---------- attribution (first touch in this session) ---------- */
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "msclkid"];
  // kept 30 days in localStorage so a lead that comes back later is still attributed to the ad click
  var ATTR_TTL = 30 * 24 * 3600 * 1000;
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var attr = {};
  try { attr = JSON.parse(lget("hz_attr") || "{}") || {}; } catch (e) { attr = {}; }
  if (attr._ts && Date.now() - attr._ts > ATTR_TTL) attr = {};
  var qs = new URLSearchParams(location.search);
  var fresh = ATTR_KEYS.some(function (k) { return qs.get(k); });
  if (fresh || !attr.landing_page) {
    if (fresh) attr = {};
    ATTR_KEYS.forEach(function (k) { if (qs.get(k)) attr[k] = qs.get(k); });
    attr.landing_page = attr.landing_page || location.pathname;
    attr.referrer = attr.referrer || document.referrer || "";
    attr._ts = Date.now();
    lset("hz_attr", JSON.stringify(attr));
  }

  /* ---------- WhatsApp & call links ---------- */
  function waUrl(msg) {
    return "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(msg);
  }
  var defaultMsg = body.getAttribute("data-wa-default") || T.waDefault;
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = waUrl(a.getAttribute("data-wa-msg") || defaultMsg);
    a.target = "_blank";
    a.rel = "noopener";
    // thank-you page link goes straight to WhatsApp; every other WhatsApp button opens the gate (see "WhatsApp gate")
    if (a.hasAttribute("data-wa-after")) {
      a.addEventListener("click", function () { track("whatsapp_open", { cta_location: a.getAttribute("data-loc") || "" }); });
      return;
    }
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (window.HZ_GATE) window.HZ_GATE.open(a);
      else window.open(a.href, "_blank");
    });
  });
  document.querySelectorAll("[data-call]").forEach(function (a) {
    a.href = "tel:" + SITE.phone;
    a.addEventListener("click", function () {
      track("call_click", { cta_location: a.getAttribute("data-loc") || "unknown" });
    });
  });
  document.querySelectorAll("[data-to-form]").forEach(function (a) {
    a.addEventListener("click", function () {
      var ph = a.getAttribute("data-phase");
      if (ph) document.querySelectorAll("select[name=interest]").forEach(function (s) {
        for (var i = 0; i < s.options.length; i++) if (s.options[i].value === ph) s.value = ph;
      });
      track("form_cta_click", { cta_location: a.getAttribute("data-loc") || "unknown", phase: ph || "" });
    });
  });

  /* ---------- blurred prices: click/Enter opens the nearest WhatsApp CTA (row, card or phase) ---------- */
  document.querySelectorAll("[data-unlock]").forEach(function (el) {
    function go() {
      var box = el.closest("tr, li, .card, .phase, .ready, article");
      var wa = box && box.querySelector("[data-wa]");
      track("price_unlock_click", { cta_location: wa ? (wa.getAttribute("data-loc") || "") : "", phase: wa ? (wa.getAttribute("data-phase") || "") : "" });
      if (wa) wa.click();
    }
    el.addEventListener("click", go);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  /* ---------- show more cards ---------- */
  document.querySelectorAll("[data-cards]").forEach(function (wrap) {
    var btn = wrap.querySelector("[data-more-cards]");
    var extra = wrap.querySelectorAll("[data-extra]");
    if (!btn || !extra.length) { if (btn) btn.hidden = true; return; }
    var label = btn.textContent, open = false;
    btn.addEventListener("click", function () {
      open = !open;
      extra.forEach(function (c) { c.hidden = !open; });
      btn.textContent = open ? T.less : label;
      if (open) { extra[0].querySelector("a, button") && extra[0].scrollIntoView({ block: "nearest" }); track("show_more_phases", {}); }
    });
  });

  /* ---------- price list filter + show more ---------- */
  document.querySelectorAll("[data-plist]").forEach(function (wrap) {
    var rows = Array.prototype.slice.call(wrap.querySelectorAll("tbody tr"));
    var selects = wrap.querySelectorAll("select[data-filter]");
    var more = wrap.querySelector("[data-more]");
    var empty = wrap.querySelector("[data-empty]");
    var limit = parseInt(wrap.getAttribute("data-limit") || "0", 10);
    var showAll = !limit;
    function apply() {
      var f = {};
      selects.forEach(function (s) { if (s.value) f[s.getAttribute("data-filter")] = s.value; });
      var match = rows.filter(function (r) {
        return Object.keys(f).every(function (k) { return r.getAttribute("data-" + k) === f[k]; });
      });
      rows.forEach(function (r) { r.hidden = true; });
      match.forEach(function (r, i) { r.hidden = !showAll && i >= limit; });
      if (empty) empty.hidden = match.length > 0;
      if (more) {
        more.hidden = !limit || match.length <= limit;
        more.textContent = showAll ? T.less : T.allUnits + " (" + match.length + ")";
      }
    }
    selects.forEach(function (s) {
      s.addEventListener("change", function () {
        showAll = !limit; apply();
        track("price_filter", { filter: s.getAttribute("data-filter"), value: s.value || "all" });
      });
    });
    if (more) more.addEventListener("click", function () { showAll = !showAll; apply(); });
    apply();
  });

  /* ---------- section progress nav ---------- */
  var secnav = document.querySelector("[data-secnav]");
  if (secnav) {
    var navLinks = Array.prototype.slice.call(secnav.querySelectorAll("a[href^='#']"));
    var targets = navLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var bar = secnav.querySelector(".secnav-bar span");
    var list = secnav.querySelector("ol");
    var current = -1, ticking = false;
    function update() {
      ticking = false;
      var offset = secnav.getBoundingClientRect().bottom + 24;
      var idx = -1;
      targets.forEach(function (el, i) { if (el && el.getBoundingClientRect().top <= offset) idx = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = targets.length - 1;
      if (idx !== current) {
        current = idx;
        navLinks.forEach(function (a, i) {
          if (i === idx) {
            a.setAttribute("aria-current", "true");
            var lr = a.getBoundingClientRect(), nr = list.getBoundingClientRect();
            if (lr.left < nr.left || lr.right > nr.right) list.scrollLeft += (lr.left + lr.width / 2) - (nr.left + nr.width / 2);
          } else a.removeAttribute("aria-current");
        });
      }
      var first = targets[0] ? targets[0].getBoundingClientRect().top + window.scrollY - offset : 0;
      var total = document.documentElement.scrollHeight - window.innerHeight - first;
      var pct = total > 0 ? Math.min(1, Math.max(0, (window.scrollY - first) / total)) : 0;
      if (bar) bar.style.width = (pct * 100).toFixed(1) + "%";
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    navLinks.forEach(function (a) {
      a.addEventListener("click", function () { track("section_nav_click", { section: a.getAttribute("href").slice(1) }); });
    });
    update();
  }

  /* ---------- view & engagement events ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        track(en.target.getAttribute("data-track-view"), {});
        io.unobserve(en.target);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll("[data-track-view]").forEach(function (el) { io.observe(el); });
  }
  document.querySelectorAll(".faq details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) track("faq_open", { question: d.querySelector("summary").textContent.trim().slice(0, 90) });
    });
  });

  /* ---------- lead forms ---------- */
  /* Phone → E.164 (+201xxxxxxxxx for Egypt), then SHA-256 hex — Google enhanced conversions format */
  function e164(v) {
    var s = String(v || "").replace(/[^\d+]/g, "");
    if (s.indexOf("00") === 0) s = "+" + s.slice(2);
    if (/^01\d{9}$/.test(s)) return "+2" + s;
    if (/^1[0125]\d{8}$/.test(s)) return "+20" + s;
    if (/^20\d{10}$/.test(s)) return "+" + s;
    return s.charAt(0) === "+" ? s : "+" + s;
  }
  function sha256(str) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.reject();
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }
  /* Phone = country-code select + number. A number typed with its own + / 00 prefix wins over the select. */
  var TZ_CC = { "Africa/Cairo": "+20", "Asia/Riyadh": "+966", "Asia/Dubai": "+971", "Asia/Kuwait": "+965", "Asia/Qatar": "+974",
    "Asia/Bahrain": "+973", "Asia/Muscat": "+968", "Asia/Amman": "+962", "Asia/Beirut": "+961", "Europe/London": "+44",
    "Europe/Berlin": "+49", "Europe/Rome": "+39", "Europe/Paris": "+33", "Europe/Amsterdam": "+31", "Europe/Zurich": "+41",
    "Europe/Vienna": "+43", "Europe/Brussels": "+32", "Europe/Warsaw": "+48", "Europe/Prague": "+420", "Europe/Stockholm": "+46",
    "Europe/Moscow": "+7", "Europe/Kiev": "+380", "Europe/Kyiv": "+380" };
  var ccTz = ""; try { ccTz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var CC_DEFAULT = TZ_CC[ccTz] || (/^America\//.test(ccTz) ? "+1" : "+20");
  document.querySelectorAll(".phone-in").forEach(function (w) {
    var sel = w.querySelector("select"), inp = w.querySelector("input");
    function ph() { inp.placeholder = sel.value === "+20" ? T.phEg : T.phIntl; }
    if (sel) { sel.value = CC_DEFAULT; if (sel.value !== CC_DEFAULT) sel.selectedIndex = 0; sel.addEventListener("change", ph); ph(); }
  });
  function fullPhone(form) {
    var n = String(form.elements.phone.value || "").replace(/[^\d+]/g, "");
    var cc = form.elements.cc ? form.elements.cc.value : "+20";
    if (n.charAt(0) === "+") return n;
    if (n.indexOf("00") === 0) return "+" + n.slice(2);
    if (cc === "+20" && /^20(1\d{9})$/.test(n)) return "+" + n;
    return cc + n.replace(/^0+/, "");
  }
  function phoneOK(full) {
    if (/^\+20/.test(full)) return /^\+201[0125]\d{8}$/.test(full);
    return /^\+\d{7,15}$/.test(full);
  }
  document.querySelectorAll("form[data-lead-form]").forEach(function (form) {
    var started = false;
    form.addEventListener("focusin", function () {
      if (started) return; started = true;
      track("form_start", { form_location: form.getAttribute("data-loc") || "" });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name, phone = form.elements.phone, ok = true;
      function setErr(el, msg) {
        var holder = el.closest("[data-field]") || el.parentNode, box = holder.querySelector(".err");
        if (box) box.textContent = msg;
        el.setAttribute("aria-invalid", msg ? "true" : "false");
        if (msg) ok = false;
      }
      setErr(name, name.value.trim().length < 2 ? T.errName : "");
      var full = fullPhone(form);
      setErr(phone, phoneOK(full) ? "" : (/^\+20/.test(full) ? T.errPhone : T.errPhoneIntl));
      if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
      if (form.elements.website && form.elements.website.value) return; // honeypot

      var interest = form.elements.interest ? form.elements.interest.value : "";
      var data = Object.assign({
        name: name.value.trim(),
        phone: full,
        project: PAGE.project,
        interest: interest,
        form_location: form.getAttribute("data-loc") || "",
        page: location.pathname,
        page_url: location.href,
        submitted_at: new Date().toISOString(),
        lang: (document.documentElement.lang || "ar").slice(0, 2),
        device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : (/iPad|Tablet/i.test(navigator.userAgent) ? "Tablet" : "Desktop")
      }, attr);
      delete data._ts;

      var btn = form.querySelector("button[type=submit]");
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = T.sending;

      var phoneHash = "";
      sha256(data.phone).then(function (h) { phoneHash = h; }, function () {});
      function done() {
        // generate_lead fires once on the thank-you page (see below), so reloads don't double count.
        // Only the SHA-256 hash of the phone is kept (for Google Ads enhanced conversions) — never the raw number.
        sset("hz_lead", JSON.stringify({ name: data.name, interest: interest, project: PAGE.project, form_location: data.form_location, ph: phoneHash }));
        location.href = SITE.thankYouUrl + "?ok=1";
      }
      if (!SITE.formEndpoint) { console.warn("[Homzegy] formEndpoint is empty — lead not stored."); done(); return; }
      fetch(SITE.formEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams(data).toString()
      }).then(done).catch(function () {
        btn.disabled = false; btn.textContent = label;
        setErr(phone, T.errSend);
        track("form_error", {});
      });
    });
  });

  /* ---------- WhatsApp gate ----------
     Every WhatsApp button opens a short sheet (name + phone) before WhatsApp, so a lead is saved even if the visitor
     never sends the message. "Continue on WhatsApp" → saves lead + opens WhatsApp + fires whatsapp_click (Ads conversion).
     "Call me instead" → saves lead + thank-you page (generate_lead). Once submitted in a session, buttons go straight to WhatsApp. */
  (function () {
    var g = document.getElementById("wa-gate");
    if (!g) return;
    var form = g.querySelector("[data-wag-form]"), ok = g.querySelector("[data-wag-ok]"), link = g.querySelector("[data-wag-link]");
    var ctxEl = g.querySelector("[data-wag-ctx]"), src = null, lastFocus = null, mode = "wa";
    function ctx(a) {
      return { loc: a.getAttribute("data-loc") || "unknown", phase: a.getAttribute("data-phase") || "", unit: a.getAttribute("data-unit") || "",
               intent: a.getAttribute("data-intent") || "", msg: a.getAttribute("data-wa-msg") || defaultMsg };
    }
    function close() { g.hidden = true; body.classList.remove("wag-on"); if (lastFocus) try { lastFocus.focus(); } catch (e) {} }
    function open(a) {
      src = ctx(a);
      var known = null; try { known = JSON.parse(sget("hz_wa") || "null"); } catch (e) {}
      if (known) {                                   // already gave their number this session → straight to WhatsApp
        window.open(waUrl(src.msg + "\n" + T.rlm + T.tyName + known.name), "_blank");
        track("whatsapp_open", { cta_location: src.loc, phase: src.phase, unit_type: src.unit });
        return;
      }
      lastFocus = a;
      var label = [src.phase, src.unit].filter(Boolean).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).join(" · ");
      ctxEl.textContent = label; ctxEl.hidden = !label;
      form.hidden = false; ok.hidden = true;
      g.hidden = false; body.classList.add("wag-on");
      setTimeout(function () { var n = form.elements.name; if (n) n.focus(); }, 60);
      track("wa_gate_open", { cta_location: src.loc, phase: src.phase, unit_type: src.unit });
    }
    window.HZ_GATE = { open: open };
    g.querySelectorAll("[data-wag-close]").forEach(function (b) { b.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !g.hidden) close(); });
    form.querySelectorAll("button[type=submit]").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.getAttribute("data-mode") || "wa"; });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return;   // honeypot
      var name = form.elements.name, phone = form.elements.phone, valid = true;
      function setErr(el, msg) {
        var box = (el.closest("[data-field]") || el.parentNode).querySelector(".err");
        if (box) box.textContent = msg;
        el.setAttribute("aria-invalid", msg ? "true" : "false");
        if (msg) valid = false;
      }
      var full = fullPhone(form);
      setErr(name, name.value.trim().length < 2 ? T.errName : "");
      setErr(phone, phoneOK(full) ? "" : (/^\+20/.test(full) ? T.errPhone : T.errPhoneIntl));
      if (!valid) { form.querySelector('[aria-invalid="true"]').focus(); return; }
      var s0 = src || ctx(document.createElement("a"));
      var interest = [s0.phase, s0.unit].filter(Boolean).join(" · ");
      var data = Object.assign({
        name: name.value.trim(), phone: full, project: PAGE.project, interest: interest,
        form_location: (mode === "wa" ? "WhatsApp" : "Callback") + " · " + s0.loc,
        page: location.pathname, page_url: location.href, submitted_at: new Date().toISOString(),
        lang: (document.documentElement.lang || "ar").slice(0, 2),
        device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : (/iPad|Tablet/i.test(navigator.userAgent) ? "Tablet" : "Desktop")
      }, attr);
      delete data._ts;
      if (SITE.formEndpoint) {
        try {
          fetch(SITE.formEndpoint, { method: "POST", mode: "no-cors", keepalive: true,
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: new URLSearchParams(data).toString() });
        } catch (err) {}
      }
      var params = { cta_location: s0.loc, phase: s0.phase, unit_type: s0.unit, form_location: data.form_location };
      if (mode === "wa") {
        var url = waUrl(s0.msg + "\n" + T.rlm + T.tyName + data.name);
        var w = window.open(url, "_blank");           // opened synchronously (still inside the click) so it isn't blocked
        sset("hz_wa", JSON.stringify({ name: data.name }));
        link.href = url;
        form.hidden = true; ok.hidden = false;
        sha256(full).then(function (h) { params.user_data = { sha256_phone_number: h }; }, function () {}).then(function () {
          track("whatsapp_click", params);           // Ads "WhatsApp" conversion now = number captured + WhatsApp opened
          if (s0.intent === "payment_plan") track("payment_plan_request", { cta_location: s0.loc, phase: s0.phase, unit_type: s0.unit });
        });
        if (!w) location.href = url;
      } else {
        sha256(full).then(function (h) { return h; }, function () { return ""; }).then(function (h) {
          sset("hz_lead", JSON.stringify({ name: data.name, interest: interest, project: PAGE.project, form_location: data.form_location, ph: h }));
          location.href = SITE.thankYouUrl + "?ok=1";
        });
      }
    });
  })();

  /* ---------- cookies / consent ----------
     Outside Europe: short notice, once per session, auto-hides (consent granted by default in <head>).
     Europe (EEA/UK/CH, detected by time zone): real Accept / Decline choice, no auto-hide; stored 6 months. */
  function consentUpdate(granted) {
    var v = granted ? "granted" : "denied";
    if (typeof window.gtag === "function") window.gtag("consent", "update", { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
    lset("hz_consent", v); lset("hz_consent_ts", String(Date.now()));
  }
  var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var isEU = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe))/.test(tz) && !/^Europe\/(Istanbul|Moscow|Minsk|Kiev|Kyiv|Simferopol|Volgograd|Kaliningrad|Samara|Ulyanovsk|Astrakhan|Saratov|Kirov|Chisinau)$/.test(tz);
  var ck = document.getElementById("cookie");
  if (ck) {
    var okb = ck.querySelector("[data-ck-ok]"), nob = ck.querySelector("[data-ck-no]");
    var ts = parseInt(lget("hz_consent_ts") || "0", 10);
    if (isEU) {
      if (!lget("hz_consent") || Date.now() - ts > 182 * 864e5) {
        if (okb) okb.textContent = EN ? "Accept" : "موافق";
        if (nob) nob.hidden = false;
        ck.classList.add("show", "consent");
        if (okb) okb.addEventListener("click", function () { consentUpdate(true); ck.classList.remove("show"); });
        if (nob) nob.addEventListener("click", function () { consentUpdate(false); ck.classList.remove("show"); });
      }
    } else if (sget("hz_ck") !== "1") {
      ck.classList.add("show");
      var hide = function () { ck.classList.remove("show"); sset("hz_ck", "1"); };
      if (okb) okb.addEventListener("click", hide);
      setTimeout(hide, SITE.cookieHideMs);
    }
  }

  /* ---------- header: hide on scroll down (after hero), show on scroll up; close menu on scroll ---------- */
  var hdr = document.querySelector(".top");
  var hero = document.querySelector(".hero");
  var menu = document.querySelector(".menu");
  var lastY = window.scrollY, hTick = false;
  function onScrollHeader() {
    hTick = false;
    var y = window.scrollY, dy = y - lastY;
    if (Math.abs(dy) < 6) return;
    if (menu && menu.open) menu.open = false;
    var heroEnd = hero ? hero.offsetTop + hero.offsetHeight - (hdr ? hdr.offsetHeight : 0) : 200;
    if (dy > 0 && y > heroEnd) body.classList.add("hdr-hide");
    else if (dy < 0) body.classList.remove("hdr-hide");
    lastY = y;
  }
  if (hdr) window.addEventListener("scroll", function () { if (!hTick) { hTick = true; requestAnimationFrame(onScrollHeader); } }, { passive: true });
  if (menu) menu.addEventListener("toggle", function () { if (menu.open) body.classList.remove("hdr-hide"); });

  /* ---------- thank-you page ---------- */
  if (PAGE.pageType === "thank-you") {
    var lead = null;
    try { lead = JSON.parse(sget("hz_lead") || "null"); } catch (e) { lead = null; }
    if (lead) {
      var ev = { lead_project: lead.project, interest: lead.interest || "", form_location: lead.form_location || "" };
      if (lead.ph) ev.user_data = { sha256_phone_number: lead.ph };   // read by the Google Ads conversion tag (enhanced conversions)
      track("generate_lead", ev);
      try { sessionStorage.removeItem("hz_lead"); } catch (e) {}
      var R = T.rlm;
      document.querySelectorAll("[data-wa-after]").forEach(function (wa) {
        wa.href = waUrl([R + T.tyHello, R + T.tyName + lead.name, R + T.tyInt + (lead.interest || lead.project)].join("\n"));
      });
    }
  }

  /* ---------- misc ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll(".menu a").forEach(function (a) {
    a.addEventListener("click", function () { a.closest("details").open = false; });
  });
})();
