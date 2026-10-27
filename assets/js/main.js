/* Homzegy — shared site script (no dependencies) */
(function () {
  "use strict";

  /* ================= CONFIG — edit here ================= */
  var SITE = {
    whatsapp: "201224044430",          // WhatsApp number, international format, no +
    phone: "+201224044430",            // Call number
    formEndpoint: "",                  // Google Apps Script Web App URL (see apps-script/README.md)
    ga4Id: "",                         // e.g. G-XXXXXXXXXX  (leave empty if you load GA4 through GTM)
    gtmId: "",                         // e.g. GTM-XXXXXXX   (optional — use GA4 OR GTM, not both for the same tag)
    cookieHideMs: 8000                 // cookie notice auto-hide delay
  };
  window.HOMZEGY = SITE;
  /* ====================================================== */

  var body = document.body;
  var PAGE = {
    project: body.getAttribute("data-project") || "Homzegy",
    pageType: body.getAttribute("data-page") || "page"
  };

  /* ---------- storage helpers (never throw) ---------- */
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  /* ---------- analytics ---------- */
  window.dataLayer = window.dataLayer || [];
  if (SITE.ga4Id) {
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + SITE.ga4Id;
    document.head.appendChild(g);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", SITE.ga4Id, { project: PAGE.project, page_type: PAGE.pageType });
  }
  if (SITE.gtmId) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var t = document.createElement("script");
    t.async = true;
    t.src = "https://www.googletagmanager.com/gtm.js?id=" + SITE.gtmId;
    document.head.appendChild(t);
  }
  function track(name, params) {
    var p = Object.assign({ project: PAGE.project, page_type: PAGE.pageType }, params || {});
    if (SITE.ga4Id && typeof window.gtag === "function") {
      window.gtag("event", name, p);
    } else {
      window.dataLayer.push(Object.assign({ event: name }, p));
    }
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
  var defaultMsg = body.getAttribute("data-wa-default") || "مرحباً، عايز أعرف تفاصيل أكتر.";
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = waUrl(a.getAttribute("data-wa-msg") || defaultMsg);
    a.target = "_blank";
    a.rel = "noopener";
    a.addEventListener("click", function () {
      var p = {
        cta_location: a.getAttribute("data-loc") || "unknown",
        phase: a.getAttribute("data-phase") || "",
        unit_type: a.getAttribute("data-unit") || ""
      };
      track("whatsapp_click", p);
      if (a.getAttribute("data-intent") === "payment_plan") track("payment_plan_request", p);
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

  /* ---------- tabs ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (list) {
    var btns = list.querySelectorAll("[role=tab]");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) {
          var on = x === b;
          x.setAttribute("aria-selected", on);
          x.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(x.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        track("tab_select", { tab: b.getAttribute("data-label") || b.textContent.trim() });
      });
      b.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        var arr = Array.prototype.slice.call(btns), i = arr.indexOf(b);
        var next = arr[(i + (e.key === "ArrowLeft" ? 1 : -1) + arr.length) % arr.length];
        next.focus(); next.click();
      });
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
        more.textContent = showAll ? "اعرض أقل" : "اعرض كل الوحدات (" + match.length + ")";
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
  function phoneOK(v) {
    var s = v.replace(/[\s\-()]/g, "");
    return /^(\+?20|0020)?0?1[0125]\d{8}$/.test(s) || /^(\+|00)\d{8,15}$/.test(s);
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
        var box = el.parentNode.querySelector(".err");
        if (box) box.textContent = msg;
        el.setAttribute("aria-invalid", msg ? "true" : "false");
        if (msg) ok = false;
      }
      setErr(name, name.value.trim().length < 2 ? "اكتب اسمك" : "");
      setErr(phone, phoneOK(phone.value) ? "" : "اكتب رقم موبايل صحيح، مثال 01012345678");
      if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
      if (form.elements.website && form.elements.website.value) return; // honeypot

      var interest = form.elements.interest ? form.elements.interest.value : "";
      var data = Object.assign({
        name: name.value.trim(),
        phone: phone.value.trim(),
        project: PAGE.project,
        interest: interest,
        form_location: form.getAttribute("data-loc") || "",
        page: location.pathname,
        page_url: location.href,
        submitted_at: new Date().toISOString()
      }, attr);
      delete data._ts;

      var btn = form.querySelector("button[type=submit]");
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = "جاري الإرسال...";

      function done() {
        track("generate_lead", { form_location: data.form_location, interest: interest });
        form.hidden = true;
        var box = form.parentNode.querySelector(".form-done");
        if (box) {
          var wa = box.querySelector("[data-wa-after]");
          if (wa) {
            var R = "\u200F";
            wa.href = waUrl([R + "مرحباً، سجلت بياناتي على الموقع.", R + "الاسم: " + data.name, R + "مهتم بـ: " + (interest || PAGE.project)].join("\n"));
            wa.addEventListener("click", function () { track("whatsapp_click", { cta_location: "form_success" }); });
          }
          box.hidden = false;
          box.focus && box.focus();
        }
      }
      if (!SITE.formEndpoint) { console.warn("[Homzegy] formEndpoint is empty — lead not stored."); done(); return; }
      fetch(SITE.formEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams(data).toString()
      }).then(done).catch(function () {
        btn.disabled = false; btn.textContent = label;
        setErr(phone, "الإرسال ماكملش. جرّب تاني أو كلمنا واتساب.");
        track("form_error", {});
      });
    });
  });

  /* ---------- cookie notice: once per session, auto-hide ---------- */
  var ck = document.getElementById("cookie");
  if (ck && sget("hz_ck") !== "1") {
    ck.classList.add("show");
    var hide = function () { ck.classList.remove("show"); sset("hz_ck", "1"); };
    var okb = ck.querySelector("button");
    if (okb) okb.addEventListener("click", hide);
    setTimeout(hide, SITE.cookieHideMs);
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

  /* ---------- misc ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll(".menu a").forEach(function (a) {
    a.addEventListener("click", function () { a.closest("details").open = false; });
  });
})();
