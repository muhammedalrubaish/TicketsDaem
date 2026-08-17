/**
 * أداة تحويل البلاغات بالجوال — سكربت الحقن داخل منصة داعم
 * ===========================================================
 * نسخة مبسّطة ومحمولة من منطق إضافة «Daem Plus» ليعمل داخل متصفح الجوال
 * (حيث لا تُدعم إضافات كروم) عبر تشغيله كـ Bookmarklet داخل صفحة البلاغ.
 *
 * ما يقوم به:
 *  ١. يكتشف رقم البلاغ والتصنيف من الصفحة (مع الدخول في الإطارات الداخلية).
 *  ٢. يعرض لوحة عربية عائمة لاختيار المحوَّل له (يدوياً أو بالدور تلقائياً).
 *  ٣. يعبّئ حقل «المعين له» ويطلق أحداث ريميدي اللازمة.
 *  ٤. يسجّل التحويل في قاعدة بيانات الموقع.
 *  ٥. يضغط «حفظ وخروج» تلقائياً، ثم يتيح إرسال نموذج الواتساب المرجعي.
 *
 * الإعدادات تُمرَّر عبر: window.__BALADY_TRANSFER_CFG__ = { base, token, group }
 */
(function () {
  'use strict';

  // ─── منع التشغيل المزدوج ──────────────────────────────────────────────
  if (window.__baladyTransferPanelOpen) {
    var existing = document.getElementById('balady-transfer-panel');
    if (existing) { existing.style.display = 'block'; return; }
  }
  window.__baladyTransferPanelOpen = true;

  // ─── الإعدادات ────────────────────────────────────────────────────────
  var STORE_KEY = 'balady_transfer_cfg';
  var cfg = window.__BALADY_TRANSFER_CFG__ || {};

  // استرجاع الإعدادات المحفوظة سابقاً على نطاق داعم (حتى يبقى الرمز محفوظاً)
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    cfg = {
      base: cfg.base || saved.base || 'https://tickets-daem.vercel.app',
      token: cfg.token || saved.token || '',
      group: cfg.group || saved.group || ''
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
  } catch (e) {
    cfg.base = cfg.base || 'https://tickets-daem.vercel.app';
    cfg.token = cfg.token || '';
    cfg.group = cfg.group || '';
  }
  cfg.base = String(cfg.base).replace(/\/+$/, '');

  // ─── قائمة الموظفين (مطابقة للموقع) ──────────────────────────────────
  var EMPLOYEES = [
    { name: 'البراء النصيان',   username: 'a.alnesayan', phone: '966537313164' },
    { name: 'عبدالله العويد',   username: 'aalowaid',    phone: '966582060644' },
    { name: 'عبدالرحمن العمري', username: 'af.alamri',   phone: '966553077432' },
    { name: 'عزام الحربي',      username: 'azz.alharbi', phone: '966500000000' },
    { name: 'محمد الربيش',      username: 'mialrubaish', phone: '966595866711' },
    { name: 'صالح الغصن',       username: 's.alghosen',  phone: '966557828464' },
    { name: 'طارق الهدياني',    username: 't.alhedyani', phone: '966500221260' },
    { name: 'ثامر المنصور',     username: 't.almansour', phone: '966570770940' }
  ];

  // ─── تصنيفات لوحة التحكم المعتمدة (مطابقة لـ lib/employees.ts) ────────
  var CATEGORIES = [
    'الرخص التجارية', 'الرخص الإنشائية', 'بلدي أعمال', 'مسار منصة الحفريات',
    'التقرير المساحي', 'الإدارة الذكية للنظافة', 'خدمة المواعيد الالكترونية',
    'الشهادات الصحية', 'خدمة مرافق إيواء', 'مستشارك بلدي', 'نظام الصلاحيات',
    'تطبيق بلدي', 'شكوى المستفيد منصة بلدي', 'منصة الرقابة الموحدة (ممثل)',
    'لوحة التحكم', 'خدمة الدمج والتجزئة', 'خدمة تحديث الصكوك',
    'خدمة اعتماد المخططات الخاصة', 'تصنيف مقدمي خدمات المدن', 'الهوية العقارية',
    'شكوى المستفيد بلدي 940', 'خدمة الفرص الاستثمارية', 'خدمة السكن الجماعي',
    'خدمة السكن الجماعي للأفراد', 'صفحة بلدي', 'GIS Web Portal', 'رمز الاستجابة',
    'إكرام الموتى', 'التشوه البصري', 'امتثال', 'رقابة الصحي والأسواق',
    'الخرائط الجغرافية', 'صوت العميل', 'نظام المتاجر المتنقلة',
    'شؤون البلدية والقروية والإسكان', 'Investment Opportunities',
    'امتثال المباني', 'منصة رسم تقديم منتجات التبغ', 'فاتورة سداد آلياً', 'أخرى'
  ];

  /**
   * توحيد التصنيف القادم من داعم إلى أحد تصنيفات لوحة التحكم.
   * مطابقة تماماً لدالة normalizeCategory في lib/employees.ts.
   */
  function normalizeCategory(raw) {
    if (!raw) return 'أخرى';
    raw = String(raw).trim();
    if (!raw) return 'أخرى';

    // ١. مطابقة مباشرة مع التصنيفات المعتمدة
    for (var i = 0; i < CATEGORIES.length; i++) {
      var cat = CATEGORIES[i];
      if (cat === 'أخرى') continue;
      if (raw.indexOf(cat) > -1 || cat.indexOf(raw) > -1) return cat;
    }

    // ٢. مطابقة مرنة بالكلمات الدلالية
    var l = raw.toLowerCase();
    if (l.indexOf('digging') > -1 || l.indexOf('حفريات') > -1) return 'مسار منصة الحفريات';
    if (l.indexOf('commercial') > -1 || l.indexOf('تجارية') > -1 || l.indexOf('رخصة تجارية') > -1) return 'الرخص التجارية';
    if (l.indexOf('building permit') > -1 || l.indexOf('building') > -1 ||
        l.indexOf('إنشائية') > -1 || l.indexOf('انشائية') > -1 ||
        l.indexOf('رخصة بناء') > -1 || l.indexOf('رخص بناء') > -1) return 'الرخص الإنشائية';
    if (l.indexOf('survey') > -1 || l.indexOf('مساحي') > -1) return 'التقرير المساحي';
    if (l.indexOf('business') > -1 || l.indexOf('أعمال') > -1) return 'بلدي أعمال';
    if (l.indexOf('complaint') > -1 || l.indexOf('شكوى') > -1) {
      return l.indexOf('940') > -1 ? 'شكوى المستفيد بلدي 940' : 'شكوى المستفيد منصة بلدي';
    }
    if (l.indexOf('hygiene') > -1 || l.indexOf('صحي') > -1 || l.indexOf('أسواق') > -1) return 'رقابة الصحي والأسواق';
    if (l.indexOf('clean') > -1 || l.indexOf('نظافة') > -1) return 'الإدارة الذكية للنظافة';
    if (l.indexOf('health') > -1) return 'الشهادات الصحية';
    if (l.indexOf('appointment') > -1 || l.indexOf('مواعيد') > -1) return 'خدمة المواعيد الالكترونية';
    if (l.indexOf('investment') > -1 || l.indexOf('استثمار') > -1) return 'خدمة الفرص الاستثمارية';
    if (l.indexOf('housing') > -1 || l.indexOf('سكن جماعي') > -1) return 'خدمة السكن الجماعي';

    return 'أخرى';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // أدوات التعامل مع الصفحة والإطارات (منقولة من إضافة Daem Plus)
  // ═══════════════════════════════════════════════════════════════════════

  function highestWindow() {
    var curr = window, highest = window;
    while (true) {
      try {
        if (curr === window.top) break;
        if (curr.parent && curr.parent.document) { curr = curr.parent; highest = curr; }
        else break;
      } catch (e) { break; }
    }
    return highest;
  }

  function topDocument() {
    try {
      var w = highestWindow();
      if (w && w.document) return w.document;
    } catch (e) { }
    return document;
  }

  /** بحث عن عناصر داخل الصفحة وكل الإطارات المسموح بالوصول إليها */
  function queryAll(selector) {
    var out = [];
    function recurse(doc) {
      if (!doc) return;
      try {
        out = out.concat(Array.prototype.slice.call(doc.querySelectorAll(selector)));
        var frames = doc.querySelectorAll('iframe, frame');
        for (var i = 0; i < frames.length; i++) {
          try {
            var fd = frames[i].contentDocument || (frames[i].contentWindow && frames[i].contentWindow.document);
            if (fd) recurse(fd);
          } catch (e) { /* إطار من نطاق مختلف — نتجاهله */ }
        }
      } catch (e) { }
    }
    recurse(topDocument());
    return out;
  }

  /** رقم البلاغ: من عنوان الصفحة أو من أي حقل قيمته IM+أرقام */
  function getTicketNumber() {
    try {
      var t = topDocument().title.match(/IM\d{4,12}/);
      if (t) return t[0];
    } catch (e) { }

    var inputs = queryAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var v = (inputs[i].value || '').trim();
      var m = v.match(/^IM\d{4,12}$/);
      if (m) return m[0];
    }

    // كحل أخير: البحث في نص الصفحة كاملاً
    try {
      var bodyMatch = topDocument().body.innerText.match(/IM\d{5,12}/);
      if (bodyMatch) return bodyMatch[0];
    } catch (e) { }
    return '';
  }

  /** تنظيف النص للمقارنة (إزالة النقطتين والمسافات الزائدة وتوحيد الألف والياء) */
  function normText(s) {
    return String(s || '')
      .replace(/[ً-ٟ]/g, '')
      .replace(/[ىی]/g, 'ي')
      .replace(/[أإآ]/g, 'ا')
      .replace(/[:：]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * قراءة قيمة حقل من خلال تسميته داخل جدول ريميدي.
   * التخطيط RTL فالحقل قد يكون في الخلية السابقة أو التالية، ولذلك نفحص
   * الخليتين ثم بقية خلايا نفس الصف كحل أخير.
   */
  function readFieldByLabel(labelNames) {
    var cells = queryAll('td, label, span, div');

    for (var i = 0; i < cells.length; i++) {
      var el = cells[i];
      if (el.children && el.children.length > 2) continue;

      var txt = normText(el.innerText);
      if (!txt || txt.length > 25) continue;
      // مطابقة تامة فقط، حتى لا يلتقط «التصنيف الفرعي» بدل «التصنيف»
      if (labelNames.indexOf(txt) === -1) continue;

      var td = el;
      while (td && td.tagName !== 'TD' && td.parentElement) td = td.parentElement;
      if (!td || td.tagName !== 'TD') continue;

      var probes = [];
      if (td.previousElementSibling) probes.push(td.previousElementSibling);
      if (td.nextElementSibling) probes.push(td.nextElementSibling);
      var row = td.closest ? td.closest('tr') : null;
      if (row) probes = probes.concat(Array.prototype.slice.call(row.children));

      for (var p = 0; p < probes.length; p++) {
        if (probes[p] === td) continue;
        var input = probes[p].querySelector
          ? probes[p].querySelector('input[type="text"], select, textarea')
          : null;
        if (!input) continue;
        var val = (input.value || '').trim();
        if (val && val.toLowerCase() !== 'incident') return val;
      }
    }
    return '';
  }

  /**
   * جمع كل القيم المرشّحة للتصنيف بترتيب الأولوية.
   * حقل «التصنيف» في داعم يحمل قيمة مثل: "Building Permit - خدمة الرخص الإنشائية"
   * وهي التي يجب اعتمادها، لا «الخدمة» ولا «نوع المشكلة».
   */
  function collectCategoryCandidates() {
    var out = [];
    var push = function (v) { if (v && out.indexOf(v) === -1) out.push(v); };

    // ١. حقل «التصنيف» الرئيسي — الأولوية القصوى
    push(readFieldByLabel(['التصنيف', 'Category']));

    // ٢. حقول النظام الخاصة بالتصنيف (product.type / subcategory)
    var texts = queryAll('input[type="text"], select');
    for (var j = 0; j < texts.length; j++) {
      var name = (texts[j].name || '').toLowerCase();
      var id = (texts[j].id || '').toLowerCase();
      if (name.indexOf('group') > -1 || id.indexOf('group') > -1) continue;
      var isTarget = name.indexOf('product.type') > -1 || id.indexOf('product.type') > -1 ||
                     name.indexOf('subcategory') > -1 || id.indexOf('subcategory') > -1 ||
                     name.indexOf('product') > -1 || id.indexOf('product') > -1;
      if (!isTarget) continue;
      var val = (texts[j].value || '').trim();
      if (val && val.toLowerCase() !== 'incident') push(val);
    }

    // ٣. حقول مساندة تُستخدم فقط إذا لم ينجح ما سبق
    push(readFieldByLabel(['الخدمة']));
    push(readFieldByLabel(['نوع المشكلة']));
    push(readFieldByLabel(['التصنيف الفرعي']));

    return out;
  }

  /**
   * اختيار التصنيف المعتمد: أول قيمة مرشّحة تُطابق أحد تصنيفات لوحة التحكم.
   * تُرجع { category: التصنيف المعتمد, raw: النص كما هو في داعم }
   */
  function detectCategory() {
    var candidates = collectCategoryCandidates();
    for (var i = 0; i < candidates.length; i++) {
      var mapped = normalizeCategory(candidates[i]);
      if (mapped !== 'أخرى') return { category: mapped, raw: candidates[i] };
    }
    return { category: 'أخرى', raw: candidates[0] || '' };
  }

  /** حقل «المعين له» في نظام HPSM/ريميدي */
  function findAssigneeInput() {
    var direct = queryAll(
      'input[name="instance/assignee.name"], textarea[name="instance/assignee.name"],' +
      '[dvdvar="instance/assignee.name"], input[name*="assignee.name"],' +
      'textarea[name*="assignee.name"], [dvdvar*="assignee.name"]'
    );
    if (direct.length) return direct[0];

    var remedy = queryAll('input[id*="1000000322"], textarea[id*="1000000322"], input[name*="1000000322"], textarea[name*="1000000322"]');
    if (remedy.length) return remedy[0];

    function normalize(s) {
      return (s || '')
        .replace(/[ً-ٟ]/g, '')
        .replace(/[ىی]/g, 'ي')
        .replace(/[أإآ]/g, 'ا')
        .replace(/\s+/g, ' ')
        .trim();
    }

    var labels = queryAll('label, span, td, div');
    for (var i = 0; i < labels.length; i++) {
      var label = labels[i];
      if (label.offsetWidth === 0 && label.offsetHeight === 0) continue;

      var low = normalize(label.innerText || '').toLowerCase();
      if (!low || low.length > 30) continue;
      // تفادي استهداف «مجموعة التعيين» بالخطأ
      if (low.indexOf('group') > -1 || low.indexOf('مجموع') > -1) continue;

      var isTarget = (low === 'المستقبل' || low === 'المستقبل:' || low.indexOf('معين له') > -1 ||
                      low.indexOf('المعين له') > -1 || low.indexOf('assignee') > -1);
      if (!isTarget) continue;

      var forAttr = label.getAttribute && label.getAttribute('for');
      if (forAttr) {
        try {
          var byId = label.ownerDocument.getElementById(forAttr);
          if (byId) return byId;
        } catch (e) { }
      }

      var container = label.closest ? label.closest('td, div') : null;
      if (container) {
        var self = container.querySelector('input, textarea, select');
        if (self) return self;
        var sib = container.nextElementSibling;
        while (sib) {
          var found = sib.querySelector ? sib.querySelector('input, textarea, select') : null;
          if (found) return found;
          sib = sib.nextElementSibling;
        }
      }
    }

    var loose = queryAll(
      'textarea[id*="assignee"]:not([id*="group"]), input[id*="assignee"]:not([id*="group"]),' +
      'textarea[name*="assignee"]:not([name*="group"]), input[name*="assignee"]:not([name*="group"])'
    );
    return loose.length ? loose[0] : null;
  }

  /** تعبئة الحقل مع إطلاق كل الأحداث التي يحتاجها ريميدي للتحقق من الاسم */
  function fillField(element, value) {
    if (!element) return false;
    try {
      element.focus();
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));

      ['keydown', 'keypress', 'keyup'].forEach(function (type) {
        element.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13, which: 13 }));
        element.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: 'Tab', keyCode: 9, which: 9 }));
      });

      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** ترشيح زر «حفظ وخروج» عن «حفظ سجل» */
  function scoreElement(el) {
    try {
      if (!(el.offsetWidth || el.offsetHeight || (el.getClientRects && el.getClientRects().length))) return -1;
    } catch (e) { return -1; }

    var label = (el.getAttribute && el.getAttribute('aria-label')) || '';
    var shortcuts = (el.getAttribute && el.getAttribute('aria-keyshortcuts')) || '';
    var txt = (el.innerText || el.value || el.alt || el.title || label || '').trim();
    if (txt.length > 50) return -1;

    var isSaveExit = txt.indexOf('حفظ وخروج') > -1 || txt.indexOf('Save & Exit') > -1 ||
                     label.indexOf('حفظ وخروج') > -1 || shortcuts.indexOf('Ctrl+Shift+F2') > -1;
    var isSaveOnly = !isSaveExit && (txt === 'حفظ' || txt === 'Save' ||
                     label.indexOf('حفظ سجل') > -1 || shortcuts.indexOf('Ctrl+Shift+F1') > -1);
    if (!isSaveExit && !isSaveOnly) return -1;

    var score = isSaveExit ? 1000 : 1;
    if (isSaveExit && shortcuts.indexOf('Ctrl+Shift+F2') > -1) score += 200;
    if (txt === 'حفظ وخروج' || txt === 'Save & Exit') score += 100;
    score += (50 - txt.length);

    var tag = el.tagName.toUpperCase();
    if (tag === 'BUTTON' || (tag === 'INPUT' && el.type === 'button')) score += 40;
    else if (tag === 'A' || (el.getAttribute && el.getAttribute('role') === 'button')) score += 30;
    else if (typeof el.className === 'string' && el.className.indexOf('btn') > -1) score += 25;
    else if (tag === 'SPAN') score += 20;
    else if (tag === 'TD') score += 10;

    return score;
  }

  function clickSaveAndExit() {
    var elements = queryAll('button, input[type="button"], span, a, td, div, img');
    var best = null, high = -1;
    for (var i = 0; i < elements.length; i++) {
      var s = scoreElement(elements[i]);
      if (s > high) { high = s; best = elements[i]; }
    }
    if (!best) return false;

    var target = (best.closest && best.closest('button, a, input[type="button"], [role="button"], [class*="btn"]')) || best;
    try {
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      target.click();
      return true;
    } catch (e) {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // الاتصال بالموقع (مع بديل احتياطي عند حجب CSP للطلبات)
  // ═══════════════════════════════════════════════════════════════════════

  function apiRequest(path, options) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('انتهت مهلة الاتصال')); }, 20000);
      fetch(cfg.base + path, options)
        .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
        .then(function (r) { clearTimeout(timer); resolve(r); })
        .catch(function (err) { clearTimeout(timer); reject(err); });
    });
  }

  /**
   * بديل احتياطي: فتح صفحة التأكيد على الموقع لتنفيذ الحفظ من نطاقنا مباشرة
   * (يُستخدم إذا منعت سياسة أمان صفحة داعم الطلبات الخارجية).
   */
  function fallbackSave(payload) {
    var url = cfg.base + '/transfer/confirm?t=' + encodeURIComponent(payload.ticketNumber) +
      '&r=' + encodeURIComponent(payload.receiver) +
      '&c=' + encodeURIComponent(payload.category) +
      '&d=' + encodeURIComponent(payload.date);
    try { window.open(url, '_blank'); } catch (e) { location.href = url; }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // واجهة اللوحة العائمة
  // ═══════════════════════════════════════════════════════════════════════

  var doc = topDocument();
  var ticket = getTicketNumber();
  var detected = detectCategory();
  var category = detected.category;   // التصنيف المعتمد بصيغة لوحة التحكم
  var categoryRaw = detected.raw;     // النص الأصلي كما هو في داعم
  var assigneeField = findAssigneeInput();
  var selected = null;
  var lastResult = null;

  // ── مقاسات اللوحة: عادية (أكبر من السابق) وملء الشاشة ────────────────
  var SIZE_KEY = 'balady_transfer_panel_size';
  var panelSize = 'normal';
  try { panelSize = localStorage.getItem(SIZE_KEY) || 'normal'; } catch (e) { }

  var panel = doc.createElement('div');
  panel.id = 'balady-transfer-panel';
  panel.setAttribute('dir', 'rtl');

  function applyPanelSize() {
    var full = panelSize === 'full';
    panel.style.cssText = [
      'position:fixed',
      full ? 'inset:0' : 'inset:auto 0 0 0',
      'z-index:2147483647',
      'background:#ffffff',
      full ? 'border-radius:0' : 'border-top-right-radius:22px;border-top-left-radius:22px',
      'box-shadow:0 -10px 46px rgba(0,0,0,.4)',
      // حشوة سفلية إضافية لتفادي شريط المتصفح السفلي في الجوال
      'padding:20px 18px calc(28px + env(safe-area-inset-bottom,0px))',
      full ? 'height:100%' : 'min-height:74vh;max-height:94vh',
      'overflow:auto',
      '-webkit-overflow-scrolling:touch',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif',
      'font-size:16px', 'color:#0f172a', 'direction:rtl', 'text-align:right',
      'box-sizing:border-box'
    ].join(';');
  }
  applyPanelSize();

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var optionsHtml = EMPLOYEES.map(function (e) {
    return '<option value="' + esc(e.username) + '">' + esc(e.name) + '</option>';
  }).join('');

  var categoryOptionsHtml = CATEGORIES.map(function (c) {
    return '<option value="' + esc(c) + '"' + (c === category ? ' selected' : '') + '>' + esc(c) + '</option>';
  }).join('');

  // أنماط موحّدة ومكبَّرة لعناصر اللوحة (أهداف لمس أكبر وخط أوضح)
  var S = {
    label: 'display:block;font-size:14.5px;font-weight:700;margin:0 0 7px;color:#334155',
    field: 'width:100%;padding:15px 13px;border:1.8px solid #cbd5e1;border-radius:14px;' +
           'font-size:17px;margin-bottom:14px;box-sizing:border-box;background:#fff;color:#0f172a',
    btn:   'width:100%;padding:17px;border:none;border-radius:15px;font-size:17px;font-weight:800;cursor:pointer'
  };

  panel.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px">' +
      '<strong style="font-size:18px">🏛️ تحويل بلاغ — وحدة بلدي</strong>' +
      '<div style="display:flex;gap:7px;flex-shrink:0">' +
        '<button id="bt-size" title="تكبير/تصغير اللوحة" style="border:none;background:#e0e7ff;color:#4338ca;border-radius:13px;width:44px;height:44px;font-size:19px;cursor:pointer">' +
          (panelSize === 'full' ? '🗕' : '🗖') + '</button>' +
        '<button id="bt-close" style="border:none;background:#f1f5f9;border-radius:13px;width:44px;height:44px;font-size:21px;cursor:pointer">✕</button>' +
      '</div>' +
    '</div>' +

    '<div id="bt-status" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:15px;padding:13px 15px;margin-bottom:15px;font-size:15px;line-height:2">' +
      '🔢 رقم البلاغ: <b id="bt-ticket-label">' + esc(ticket || 'لم يُكتشف') + '</b><br>' +
      '📁 التصنيف: <b style="color:' + (category === 'أخرى' ? '#d97706' : '#059669') + '">' +
        esc(category) + '</b>' +
      (categoryRaw && normText(categoryRaw) !== normText(category)
        ? '<br><span style="color:#64748b;font-size:13.5px">↳ في داعم: ' + esc(categoryRaw) + '</span>'
        : '') + '<br>' +
      '🎯 حقل المعين له: <b style="color:' + (assigneeField ? '#059669' : '#dc2626') + '">' +
        (assigneeField ? 'تم العثور عليه ✓' : 'لم يُعثر عليه ✕') + '</b>' +
    '</div>' +

    '<label style="' + S.label + '">رقم البلاغ</label>' +
    '<input id="bt-ticket" value="' + esc(ticket) + '" placeholder="IM12345678" ' +
      'style="' + S.field + ';direction:ltr;text-align:left;letter-spacing:1px;font-weight:700">' +

    '<label style="' + S.label + '">المحوَّل له</label>' +
    '<select id="bt-emp" style="' + S.field + ';margin-bottom:10px">' +
      '<option value="">— اختر الموظف —</option>' + optionsHtml +
    '</select>' +

    '<button id="bt-auto" style="' + S.btn + ';border:1.8px dashed #6366f1;background:#eef2ff;color:#4338ca;font-size:15.5px;padding:15px;margin-bottom:16px">🎲 اختيار الموظف الذي عليه الدور</button>' +

    '<label style="' + S.label + '">تصنيف البلاغ</label>' +
    '<select id="bt-cat" style="' + S.field + ';margin-bottom:16px">' +
      categoryOptionsHtml +
    '</select>' +

    '<button id="bt-go" style="' + S.btn + ';background:#059669;color:#fff;font-size:18px;padding:19px">⚡ تحويل + تسجيل + حفظ وخروج</button>' +

    '<div id="bt-after" style="display:none;margin-top:13px">' +
      '<button id="bt-wa" style="' + S.btn + ';background:#25D366;color:#fff">💬 إرسال النموذج للمجموعة</button>' +
      '<button id="bt-save" style="' + S.btn + ';border:1.8px solid #cbd5e1;background:#fff;color:#0f172a;font-size:15.5px;padding:15px;margin-top:9px">💾 حفظ وخروج من داعم</button>' +
    '</div>' +

    '<div id="bt-log" style="margin-top:14px;font-size:14.5px;line-height:2;color:#334155"></div>';

  doc.body.appendChild(panel);

  var $ = function (id) { return doc.getElementById(id); };
  var logBox = $('bt-log');

  function log(msg, color) {
    var line = doc.createElement('div');
    line.style.color = color || '#334155';
    line.textContent = msg;
    logBox.insertBefore(line, logBox.firstChild);
  }

  if (!cfg.token) {
    log('⚠️ لا يوجد رمز دخول — أعد تركيب الأداة من صفحة الإعداد بالموقع.', '#dc2626');
  }

  // ── تمييز الموظفين في إجازة داخل القائمة ──────────────────────────────
  var employeesOnLeave = [];
  apiRequest('/api/leaves', { method: 'GET' })
    .then(function (r) {
      if (!r.ok || !r.json || !r.json.success) return;
      employeesOnLeave = r.json.onLeave || [];
      if (employeesOnLeave.length === 0) return;

      var sel = $('bt-emp');
      for (var i = 0; i < sel.options.length; i++) {
        var opt = sel.options[i];
        var emp = EMPLOYEES.filter(function (e) { return e.username === opt.value; })[0];
        if (emp && employeesOnLeave.indexOf(emp.name) > -1) {
          opt.textContent = emp.name + ' 🏖️ (في إجازة)';
        }
      }
      log('🏖️ في إجازة حالياً: ' + employeesOnLeave.join('، '), '#d97706');
    })
    .catch(function () { /* تعذر جلب الإجازات — لا يمنع عمل الأداة */ });

  $('bt-close').onclick = function () {
    panel.parentNode.removeChild(panel);
    window.__baladyTransferPanelOpen = false;
  };

  // ── التبديل بين الحجم العادي وملء الشاشة (يُحفظ للمرات القادمة) ────────
  $('bt-size').onclick = function () {
    panelSize = panelSize === 'full' ? 'normal' : 'full';
    applyPanelSize();
    $('bt-size').textContent = panelSize === 'full' ? '🗕' : '🗖';
    try { localStorage.setItem(SIZE_KEY, panelSize); } catch (e) { }
  };

  // ── اختيار الموظف الذي عليه الدور ──────────────────────────────────────
  $('bt-auto').onclick = function () {
    log('⏳ جاري حساب الموظف الذي عليه الدور...');
    apiRequest('/api/transfer/next?token=' + encodeURIComponent(cfg.token), { method: 'GET' })
      .then(function (r) {
        if (r.ok && r.json && r.json.success) {
          $('bt-emp').value = r.json.next.username;
          log('✅ الدور على: ' + r.json.next.name, '#059669');
        } else {
          log('⚠️ ' + ((r.json && r.json.error) || 'تعذر الحساب') + ' — اختر الموظف يدوياً.', '#d97706');
        }
      })
      .catch(function () {
        log('⚠️ تعذر الاتصال بالموقع (قد تكون الشبكة محجوبة) — اختر الموظف يدوياً.', '#d97706');
      });
  };

  // ── التنفيذ الكامل ────────────────────────────────────────────────────
  $('bt-go').onclick = function () {
    var ticketVal = ($('bt-ticket').value || '').trim().toUpperCase();
    var username = $('bt-emp').value;
    var emp = EMPLOYEES.filter(function (e) { return e.username === username; })[0];

    if (!/^IM\d{4,12}$/.test(ticketVal)) { log('❌ رقم البلاغ غير صحيح.', '#dc2626'); return; }
    if (!emp) { log('❌ اختر المحوَّل له أولاً.', '#dc2626'); return; }

    selected = emp;
    // التصنيف المعتمد من القائمة (يسمح بتصحيح الاكتشاف التلقائي يدوياً)
    category = $('bt-cat').value || category;

    if (employeesOnLeave.indexOf(emp.name) > -1) {
      log('🏖️ تنبيه: ' + emp.name + ' مسجَّل في إجازة — جارٍ التحويل كما طلبت.', '#d97706');
    }

    // ١) تعبئة حقل المعين له داخل صفحة داعم
    var field = assigneeField || findAssigneeInput();
    if (field && fillField(field, emp.username)) {
      log('✅ تم إدخال (' + emp.username + ') في حقل المعين له.', '#059669');
    } else {
      log('⚠️ تعذر تعبئة حقل المعين له تلقائياً — أدخله يدوياً: ' + emp.username, '#d97706');
    }

    // ٢) تسجيل التحويل في قاعدة بيانات الموقع
    var payload = {
      token: cfg.token,
      ticketNumber: ticketVal,
      receiver: emp.name,
      category: category || '',
      date: new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000).toISOString().split('T')[0]
    };

    log('⏳ جاري تسجيل التحويل في الموقع...');
    apiRequest('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (r.ok && r.json && r.json.success) {
          lastResult = r.json;
          if (r.json.duplicate) log('ℹ️ ' + r.json.message, '#d97706');
          else log('✅ تم تسجيل البلاغ في الموقع بنجاح.', '#059669');
          $('bt-after').style.display = 'block';
          setTimeout(doSaveExit, 400);
        } else {
          log('⚠️ ' + ((r.json && r.json.error) || 'فشل التسجيل') + ' — سيتم فتح صفحة التأكيد.', '#d97706');
          fallbackSave({ ticketNumber: ticketVal, receiver: emp.name, category: category || '', date: payload.date });
          $('bt-after').style.display = 'block';
        }
      })
      .catch(function () {
        log('⚠️ تعذر الاتصال المباشر — سيتم فتح صفحة التأكيد بالموقع.', '#d97706');
        fallbackSave({ ticketNumber: ticketVal, receiver: emp.name, category: category || '', date: payload.date });
        $('bt-after').style.display = 'block';
      });
  };

  function doSaveExit() {
    if (clickSaveAndExit()) log('💾 تم الضغط على «حفظ وخروج».', '#059669');
    else log('⚠️ لم يُعثر على زر «حفظ وخروج» — اضغطه يدوياً.', '#d97706');
  }

  $('bt-save').onclick = doSaveExit;

  // ── إرسال نموذج الواتساب المرجعي ──────────────────────────────────────
  $('bt-wa').onclick = function () {
    var ticketVal = ($('bt-ticket').value || '').trim().toUpperCase();
    var emp = selected || {};
    var now = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
    var time = ('0' + now.getUTCHours()).slice(-2) + ':' + ('0' + now.getUTCMinutes()).slice(-2);
    var date = now.toISOString().split('T')[0];

    var msg = (lastResult && lastResult.whatsappMessage) ||
      ('📋 *تحويل بلاغ - وحدة بلدي*\n' +
       '━━━━━━━━━━━━━━━━━━\n' +
       '🔢 *رقم البلاغ:* ' + ticketVal + '\n' +
       '👤 *المحوّل له:* ' + (emp.name || '—') + '\n' +
       '📁 *التصنيف:* ' + (($('bt-cat') && $('bt-cat').value) || category || 'غير محدد') + '\n' +
       '📅 *تاريخ البلاغ:* ' + date + '\n' +
       '⏰ *وقت التحويل:* ' + time + '\n' +
       '━━━━━━━━━━━━━━━━━━');

    var url = cfg.group
      ? cfg.group + (cfg.group.indexOf('?') > -1 ? '&' : '?') + 'text=' + encodeURIComponent(msg)
      : 'https://wa.me/?text=' + encodeURIComponent(msg);

    try { window.open(url, '_blank'); } catch (e) { location.href = url; }
  };

  log('🚀 الأداة جاهزة.', '#0369a1');
})();
