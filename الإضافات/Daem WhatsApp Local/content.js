// ==========================================================================
// داعم واتساب - Daem WhatsApp Local (إضافة محلية بدون قاعدة بيانات)
// ==========================================================================

const DEFAULT_EMPLOYEES = [
  { name: 'البراء النصيان', user: 'a.alnesayan' },
  { name: 'عبدالرحمن العمري', user: 'af.alamri' },
  { name: 'عزام الحربي', user: 'azz.alharbi' },
  { name: 'محمد الربيش', user: 'mialrubaish' },
  { name: 'صالح الغصن', user: 's.alghosen' },
  { name: 'طارق الهدياني', user: 't.alhedyani' },
  { name: 'ثامر المنصور', user: 't.almansour' }
];

const DEFAULT_TEMPLATE = `{رقم التذكرة}
{اسم المعين له}
{نوع التصنيف}
{تاريخ تحويل البلاغ}`;

let employeesList = [...DEFAULT_EMPLOYEES];
let selectedEmployeeIndex = 0;
let customTemplate = "";
let customWhatsAppGroupUrl = "";

// --------------------------------------------------------------------------
// Storage Helpers
// --------------------------------------------------------------------------
function safeGetStorage(keys, callback) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, (res) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          callback({});
        } else {
          callback(res || {});
        }
      });
    } else {
      callback({});
    }
  } catch (e) {
    callback({});
  }
}

function safeSetStorage(data, callback) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => {
        if (callback) callback();
      });
    }
  } catch (e) { }
}

// --------------------------------------------------------------------------
// Extraction Utilities - Active & Visible Frame Targeting
// --------------------------------------------------------------------------
function isElementVisible(el) {
  if (!el) return false;
  if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  
  try {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  } catch (e) { }

  let parent = el.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    try {
      const pStyle = window.getComputedStyle(parent);
      if (pStyle.display === 'none' || pStyle.visibility === 'hidden') return false;
    } catch (e) { }
    parent = parent.parentElement;
  }
  return true;
}

function getVisibleDocuments() {
  const docs = [document];
  function recurseFrames(doc) {
    if (!doc) return;
    try {
      const frames = doc.querySelectorAll('iframe, frame');
      for (const f of frames) {
        try {
          if (f.offsetWidth > 0 && f.offsetHeight > 0) {
            const style = window.getComputedStyle(f);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              const frameDoc = f.contentDocument || f.contentWindow?.document;
              if (frameDoc) {
                docs.push(frameDoc);
                recurseFrames(frameDoc);
              }
            }
          }
        } catch (e) { }
      }
    } catch (e) { }
  }
  recurseFrames(document);
  return docs;
}

function queryVisibleInPage(selector) {
  let results = [];
  const docs = getVisibleDocuments();
  for (const doc of docs) {
    try {
      const elements = Array.from(doc.querySelectorAll(selector));
      for (const el of elements) {
        if (isElementVisible(el)) {
          results.push(el);
        }
      }
    } catch (e) { }
  }
  return results;
}

function getTicketNumber() {
  const docs = getVisibleDocuments();

  // 1. الأولوية الأولى: التبويب النشط في شريط التبويبات العلوي (Active Tab Strip)
  for (const doc of docs) {
    const activeTabs = doc.querySelectorAll('.x-tab-strip-active, [class*="tab-strip-active"], [class*="tab-active"], [aria-selected="true"]');
    for (const tab of activeTabs) {
      const txt = (tab.innerText || tab.textContent || '').trim();
      const m = txt.match(/IM\d{5,12}/);
      if (m) return m[0];
    }
  }

  // 2. الأولوية الثانية: ترويسة البلاغ النشط بالصفحة (مثل "الحدث : IM4692578" أو "الحدث - IM...")
  for (const doc of docs) {
    const headers = doc.querySelectorAll('h1, h2, h3, div, span, td');
    for (const h of headers) {
      if (isElementVisible(h)) {
        const txt = (h.innerText || '').trim();
        if (txt.length < 50 && (txt.includes('الحدث') || txt.includes('Incident') || txt.includes('البلاغ'))) {
          const m = txt.match(/IM\d{5,12}/);
          if (m) return m[0];
        }
      }
    }
  }

  // 3. الأولوية الثالثة: حقول الإدخال المرئية فقط
  const visibleInputs = queryVisibleInPage('input');
  for (const input of visibleInputs) {
    const val = (input.value || '').trim();
    if (/^IM\d{5,12}$/.test(val)) return val;
  }

  // 4. أرقام التذاكر في عنوان التبويب
  const titleMatch = document.title ? document.title.match(/IM\d{5,12}/) : null;
  if (titleMatch) return titleMatch[0];

  // 5. مسح عام للنصوص المرئية فقط
  for (const doc of docs) {
    const bodyText = doc.body ? doc.body.innerText : '';
    const matches = bodyText.match(/IM\d{5,12}/);
    if (matches) return matches[0];
  }

  return '';
}

function findAssigneeInput() {
  const visibleInputs = queryVisibleInPage('input, textarea');
  
  // 1. Direct HPSM / Daem instance attribute
  for (const input of visibleInputs) {
    const name = (input.name || '').toLowerCase();
    const dvdvar = typeof input.getAttribute === 'function' ? (input.getAttribute('dvdvar') || '').toLowerCase() : '';
    if (name === 'instance/assignee.name' || dvdvar === 'instance/assignee.name' || name.includes('assignee.name')) {
      return input;
    }
  }

  // 2. Remedy field ID 1000000322
  for (const input of visibleInputs) {
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    if (id.includes('1000000322') || name.includes('1000000322')) {
      return input;
    }
  }

  // 3. Search via visible labels
  const visibleLabels = queryVisibleInPage('label, span, td, div');
  for (const label of visibleLabels) {
    const txt = (label.innerText || '').trim().replace(/[\u064B-\u065F]/g, "").toLowerCase();
    if (txt.includes('group') || txt.includes('مجموع')) continue;

    if (txt === 'المعين له' || txt === 'المعين له:' || txt === 'معين له' || txt === 'معين له:' || txt === 'المستقبل' || txt === 'assignee') {
      if (label.htmlFor) {
        const inp = document.getElementById(label.htmlFor);
        if (inp && isElementVisible(inp)) return inp;
      }
      const container = label.closest('td, div');
      if (container) {
        const directInp = container.querySelector('input, textarea');
        if (directInp && isElementVisible(directInp)) return directInp;

        let sib = container.nextElementSibling;
        while (sib) {
          const inp = sib.querySelector('input, textarea') || (['INPUT', 'TEXTAREA'].includes(sib.tagName) ? sib : null);
          if (inp && isElementVisible(inp)) return inp;
          sib = sib.nextElementSibling;
        }
      }
    }
  }

  // 4. General input query fallback
  for (const input of visibleInputs) {
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    if ((id.includes('assignee') || name.includes('assignee') || id.includes('receiver') || name.includes('receiver')) &&
        !id.includes('group') && !name.includes('group')) {
      return input;
    }
  }

  return null;
}

// مطابقة التصنيف بنفس منطق لوحة التحكم (بدون ترجمة إنجليزية وبشكل معرب قياسي)
function normalizeCategory(rawCategory) {
  if (!rawCategory) return "أخرى";

  const cleanCategories = [
    "الرخص التجارية", "الرخص الإنشائية", "بلدي أعمال", "مسار منصة الحفريات",
    "التقرير المساحي", "الإدارة الذكية للنظافة", "خدمة المواعيد الالكترونية",
    "الشهادات الصحية", "خدمة مرافق إيواء", "مستشارك بلدي", "نظام الصلاحيات",
    "تطبيق بلدي", "شكوى المستفيد منصة بلدي", "منصة الرقابة الموحدة (ممثل)",
    "لوحة التحكم", "خدمة الدمج والتجزئة", "خدمة تحديث الصكوك",
    "خدمة اعتماد المخططات الخاصة", "تصنيف مقدمي خدمات المدن", "الهوية العقارية",
    "شكوى المستفيد بلدي 940", "خدمة الفرص الاستثمارية", "خدمة السكن الجماعي",
    "خدمة السكن الجماعي للأفراد", "صفحة بلدي", "GIS Web Portal", "رمز الاستجابة",
    "إكرام الموتى", "التشوه البصري", "امتثال", "رقابة الصحي والأسواق",
    "الخرائط الجغرافية", "صوت العميل", "نظام المتاجر المتنقلة",
    "شؤون البلدية والقروية والإسكان", "Investment Opportunities",
    "امتثال المباني", "منصة رسم تقديم منتجات التبغ", "فاتورة سداد آلياً"
  ];

  // 1. مطابقة مباشرة جزئية
  const matched = cleanCategories.find(cat =>
    rawCategory.includes(cat) || cat.includes(rawCategory)
  );
  if (matched) return matched;

  // 2. مطابقة مرنة للكلمات الدلالية الرئيسية
  const lowerRaw = rawCategory.toLowerCase();

  if (lowerRaw.includes('digging') || lowerRaw.includes('حفريات')) return 'مسار منصة الحفريات';
  if (lowerRaw.includes('commercial') || lowerRaw.includes('تجارية')) return 'الرخص التجارية';
  if (lowerRaw.includes('building') || lowerRaw.includes('إنشائية')) return 'الرخص الإنشائية';
  if (lowerRaw.includes('survey') || lowerRaw.includes('مساحي')) return 'التقرير المساحي';
  if (lowerRaw.includes('business') || lowerRaw.includes('أعمال')) return 'بلدي أعمال';
  if (lowerRaw.includes('complaint') || lowerRaw.includes('شكوى')) {
    if (lowerRaw.includes('940')) return 'شكوى المستفيد بلدي 940';
    return 'شكوى المستفيد منصة بلدي';
  }
  if (lowerRaw.includes('hygiene') || lowerRaw.includes('صحي') || lowerRaw.includes('أسواق')) return 'رقابة الصحي والأسواق';
  if (lowerRaw.includes('clean') || lowerRaw.includes('نظافة')) return 'الإدارة الذكية للنظافة';
  if (lowerRaw.includes('health') || lowerRaw.includes('شهادة صحية') || lowerRaw.includes('شهادات صحية')) return 'الشهادات الصحية';
  if (lowerRaw.includes('appointment') || lowerRaw.includes('مواعيد')) return 'خدمة المواعيد الالكترونية';
  if (lowerRaw.includes('investment') || lowerRaw.includes('استثمار')) return 'خدمة الفرص الاستثمارية';
  if (lowerRaw.includes('housing') || lowerRaw.includes('سكن جماعي')) return 'خدمة السكن الجماعي';

  return "أخرى";
}

function getClassification() {
  const visibleCells = queryVisibleInPage('td, label, span');
  for (const cell of visibleCells) {
    const txt = (cell.innerText || '').trim();
    if (txt === 'التصنيف:' || txt === 'التصنيف' || txt === 'Category:' || txt === 'Category') {
      let cellTd = cell.closest('td');
      if (cellTd) {
        let input = cellTd.previousElementSibling?.querySelector('input, select') ||
                    cellTd.nextElementSibling?.querySelector('input, select');
        if (input && input.value && input.value.trim() && input.value.trim().toLowerCase() !== 'incident') {
          return normalizeCategory(input.value.trim());
        }
      }
    }
  }

  const visibleInputs = queryVisibleInPage('input[type="text"]');
  for (const input of visibleInputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if ((name.includes('subcategory') || id.includes('subcategory') || name.includes('product') || id.includes('product')) &&
        !name.includes('group') && !id.includes('group')) {
      if (input.value && input.value.trim()) return normalizeCategory(input.value.trim());
    }
  }

  for (const input of visibleInputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if ((name.includes('category') || id.includes('category')) && !name.includes('group') && !id.includes('group') && !name.includes('type')) {
      const val = (input.value || '').trim();
      if (val && val.toLowerCase() !== 'incident') return normalizeCategory(val);
    }
  }

  return 'خدمة بلدي';
}

function getTodayFormattedDate() {
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
}

// --------------------------------------------------------------------------
// Remedy Event Simulation
// --------------------------------------------------------------------------
function triggerElementChangeEvents(element, value) {
  if (!element) return;
  element.focus();
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));

  const keyEvents = [
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }),
    new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab', keyCode: 9 }),
    new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Tab', keyCode: 9 }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Tab', keyCode: 9 })
  ];
  keyEvents.forEach(evt => element.dispatchEvent(evt));

  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

// --------------------------------------------------------------------------
// Save and Exit Automation
// --------------------------------------------------------------------------
function getElementScore(el) {
  if (!el || !isElementVisible(el)) return -1;
  const label = typeof el.getAttribute === 'function' ? (el.getAttribute('aria-label') || '') : '';
  const shortcuts = typeof el.getAttribute === 'function' ? (el.getAttribute('aria-keyshortcuts') || '') : '';
  const txt = (el.innerText || el.value || el.alt || el.title || label || '').trim();

  if (txt.length > 50) return -1;

  const isSaveExit = (
    txt === 'حفظ وخروج' ||
    txt === 'Save & Exit' ||
    txt.includes('حفظ وخروج') ||
    txt.includes('Save & Exit') ||
    label.includes('حفظ وخروج') ||
    shortcuts.includes('Ctrl+Shift+F2')
  );

  const isSaveOnly = !isSaveExit && (
    txt === 'حفظ' ||
    txt === 'Save' ||
    label === 'حفظ سجل' ||
    shortcuts.includes('Ctrl+Shift+F1')
  );

  if (!isSaveExit && !isSaveOnly) return -1;

  let score = 0;
  if (isSaveExit) {
    score += 1000;
    if (shortcuts.includes('Ctrl+Shift+F2')) score += 200;
    if (txt === 'حفظ وخروج' || txt === 'Save & Exit') score += 100;
  } else {
    score += 1;
  }

  score += (50 - txt.length);
  const tagName = el.tagName.toUpperCase();
  if (tagName === 'BUTTON' || (tagName === 'INPUT' && el.type === 'button')) score += 40;
  else if (tagName === 'A' || el.getAttribute('role') === 'button') score += 30;
  else if (el.className && typeof el.className === 'string' && el.className.includes('btn')) score += 25;

  return score;
}

function globalClickSaveAndExit() {
  const elements = queryVisibleInPage('button, input[type="button"], span, a, td, div');
  let bestElement = null;
  let highestScore = -1;

  for (const el of elements) {
    const score = getElementScore(el);
    if (score > highestScore) {
      highestScore = score;
      bestElement = el;
    }
  }

  if (bestElement) {
    const interactiveParent = bestElement.closest('button, a, input[type="button"], [role="button"], [class*="btn"]');
    const elToClick = interactiveParent || bestElement;
    elToClick.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    elToClick.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    elToClick.click();
    return true;
  }
  return false;
}

// --------------------------------------------------------------------------
// Toast Notification
// --------------------------------------------------------------------------
function showToast(msg, icon = '✅') {
  let toast = document.querySelector('.daem-wa-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'daem-wa-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
  toast.classList.add('show');
  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// --------------------------------------------------------------------------
// WhatsApp Template Generation & Sender
// --------------------------------------------------------------------------
function buildWhatsAppMessage(ticketId, assigneeName, category, dateStr) {
  if (customTemplate && customTemplate.trim()) {
    if (!customTemplate.includes('رقم التذكرة:') && !customTemplate.includes('اسم المعين له:') && !customTemplate.includes('نوع التصنيف:')) {
      return customTemplate
        .replace(/{ticket}|{رقم التذكرة}/g, ticketId)
        .replace(/{assignee}|{المعين له}|{اسم المعين له}/g, assigneeName)
        .replace(/{category}|{التصنيف}|{نوع التصنيف}/g, category)
        .replace(/{date}|{التاريخ}|{تاريخ تحويل البلاغ}/g, dateStr);
    }
  }

  // الصيغة المطلوبة بدقة: 4 أسطر نقية بدون أي عناوين أو رموز
  return `${ticketId}\n${assigneeName}\n${category}\n${dateStr}`;
}

function openWhatsAppWithMessage(messageText) {
  const encoded = encodeURIComponent(messageText);
  let waUrl = `https://web.whatsapp.com/send?text=${encoded}`;
  
  if (customWhatsAppGroupUrl && customWhatsAppGroupUrl.trim()) {
    const groupUrl = customWhatsAppGroupUrl.trim();
    if (groupUrl.includes('chat.whatsapp.com/')) {
      waUrl = `https://web.whatsapp.com/send?text=${encoded}`;
    } else if (groupUrl.startsWith('http')) {
      waUrl = groupUrl.includes('?') ? `${groupUrl}&text=${encoded}` : `${groupUrl}?text=${encoded}`;
    }
  }

  // إرسال الطلب للـ Service Worker للتحويل إلى التبويب المفتوح بالفعل للواتساب
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'OPEN_WHATSAPP', url: waUrl }, (res) => {
        if (chrome.runtime.lastError) {
          window.open(waUrl, '_blank');
        }
      });
      return;
    }
  } catch (e) { }

  window.open(waUrl, '_blank');
}

// --------------------------------------------------------------------------
// Master One-Click Action
// --------------------------------------------------------------------------
async function executeMasterAction() {
  const ticketId = getTicketNumber();
  if (!ticketId) {
    showToast('تعذر العثور على رقم التذكرة بالصفحة! ⚠️', '⚠️');
    return;
  }

  const selectEl = document.getElementById('dwa-employee-select');
  const empIdx = selectEl ? parseInt(selectEl.value, 10) : selectedEmployeeIndex;
  const currentEmp = employeesList[empIdx] || employeesList[0] || { name: 'محمد الربيش', user: 'mialrubaish' };

  const category = getClassification();
  const dateStr = getTodayFormattedDate();

  // 1. توليد النموذج بالصيغة النقية
  const messageText = buildWhatsAppMessage(ticketId, currentEmp.name, category, dateStr);

  // 2. نسخ النص للحافظة فوراً
  try {
    await navigator.clipboard.writeText(messageText);
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = messageText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  // 3. فتح واتساب مع الرسالة الجاهزة
  openWhatsAppWithMessage(messageText);

  // 4. تحويل البلاغ وتعبئة حقل المعين له
  const assigneeInput = findAssigneeInput();
  if (assigneeInput) {
    triggerElementChangeEvents(assigneeInput, currentEmp.user);
  }

  // 5. تحديث مؤشر التوزيع الدوري المحلي للدور القادم
  const nextIdx = (empIdx + 1) % employeesList.length;
  safeSetStorage({ dwa_next_employee_index: nextIdx });
  if (selectEl) {
    selectEl.value = nextIdx;
  }

  showToast(`تم النسخ وإسناد البلاغ والانتقال للواتساب! الصق النص (Ctrl+V) في القروب 🚀`);

  // 6. الضغط على حفظ وخروج تلقائياً
  setTimeout(() => {
    const clicked = globalClickSaveAndExit();
    if (clicked) {
      showToast('جاري حفظ التذكرة والخروج تلقائياً... 💾', '💾');
    } else {
      showToast('تم الإجراء! اضغط زر حفظ وخروج يدوياً إن لم يُغلق تلقائياً ⚠️', 'ℹ️');
    }
  }, 400);
}

// --------------------------------------------------------------------------
// UI Panel Injection (Top Window Only)
// --------------------------------------------------------------------------
function injectFloatingPanel() {
  if (window !== window.top) {
    return;
  }

  if (document.getElementById('daem-whatsapp-panel') || document.getElementById('daem-whatsapp-restore')) {
    updatePanelPreview();
    return;
  }

  safeGetStorage(['dwa_employees', 'dwa_next_employee_index', 'dwa_template', 'dwa_group_url', 'dwa_panel_pos'], (res) => {
    if (res.dwa_employees && Array.isArray(res.dwa_employees) && res.dwa_employees.length > 0) {
      employeesList = res.dwa_employees;
    }
    if (typeof res.dwa_next_employee_index === 'number') {
      selectedEmployeeIndex = res.dwa_next_employee_index % employeesList.length;
    }
    if (res.dwa_template) {
      if (res.dwa_template.includes('رقم التذكرة:') || res.dwa_template.includes('اسم المعين له:')) {
        customTemplate = DEFAULT_TEMPLATE;
        safeSetStorage({ dwa_template: DEFAULT_TEMPLATE });
      } else {
        customTemplate = res.dwa_template;
      }
    } else {
      customTemplate = DEFAULT_TEMPLATE;
      safeSetStorage({ dwa_template: DEFAULT_TEMPLATE });
    }
    if (res.dwa_group_url) customWhatsAppGroupUrl = res.dwa_group_url;

    if (document.getElementById('daem-whatsapp-panel') || document.getElementById('daem-whatsapp-restore')) {
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'daem-whatsapp-panel';

    let optionsHtml = '';
    employeesList.forEach((emp, idx) => {
      const selected = idx === selectedEmployeeIndex ? 'selected' : '';
      optionsHtml += `<option value="${idx}" ${selected}>${emp.name} (${emp.user})</option>`;
    });

    panel.innerHTML = `
      <div class="dwa-header" id="dwa-drag-header">
        <div class="dwa-title-wrap">
          <div class="dwa-logo">💬</div>
          <div class="dwa-title">داعم واتساب بلس</div>
        </div>
        <div class="dwa-header-actions">
          <button class="dwa-icon-btn" id="dwa-btn-toggle" title="تصغير / تكبير">−</button>
          <button class="dwa-icon-btn" id="dwa-btn-close" title="إخفاء">✕</button>
        </div>
      </div>

      <div class="dwa-body" id="dwa-body-content">
        <!-- بطاقة المعاينة اللحظية الحية -->
        <div class="dwa-preview-card">
          <div class="dwa-preview-row">
            <span class="dwa-label">🎫 رقم التذكرة:</span>
            <span class="dwa-val dwa-val-highlight" id="dwa-val-ticket">جاري الكشف...</span>
          </div>
          <div class="dwa-preview-row">
            <span class="dwa-label">🏷️ نوع التصنيف:</span>
            <span class="dwa-val-rtl" id="dwa-val-category">جاري الكشف...</span>
          </div>
          <div class="dwa-preview-row">
            <span class="dwa-label">📅 تاريخ التحويل:</span>
            <span class="dwa-val" id="dwa-val-date">${getTodayFormattedDate()}</span>
          </div>
        </div>

        <!-- اختيار الموظف المعين له -->
        <div class="dwa-select-wrap">
          <div class="dwa-select-title">
            <span>👤 المعين له (الدور التالي):</span>
          </div>
          <select class="dwa-select" id="dwa-employee-select">
            ${optionsHtml}
          </select>
        </div>

        <!-- الزر الشامل بضغطة زر واحدة -->
        <button class="dwa-btn-master" id="dwa-btn-master-action" title="نسخ + إرسال واتساب + تحويل + حفظ وخروج">
          <span>🚀</span>
          <span>تحويل وإرسال للواتساب مع حفظ وخروج</span>
        </button>

        <!-- أزرار منفصلة للحاجة -->
        <div class="dwa-btn-sub-row">
          <button class="dwa-btn-sub" id="dwa-btn-copy-only" title="نسخ نص النموذج فقط للحافظة">
            <span>📋</span>
            <span>نسخ النموذج</span>
          </button>
          <button class="dwa-btn-sub" id="dwa-btn-wa-only" title="فتح الواتساب فقط">
            <span>💬</span>
            <span>فتح واتساب</span>
          </button>
        </div>

        <button class="dwa-btn-sub dwa-btn-save-exit" id="dwa-btn-exit-only" title="حفظ وخروج التذكرة فقط">
          <span>💾</span>
          <span>حفظ وخروج فقط</span>
        </button>
      </div>
    `;

    if (res.dwa_panel_pos) {
      panel.style.top = Math.max(10, Math.min(res.dwa_panel_pos.y, window.innerHeight - 300)) + 'px';
      panel.style.left = Math.max(10, Math.min(res.dwa_panel_pos.x, window.innerWidth - 340)) + 'px';
      panel.style.right = 'auto';
    }

    document.body.appendChild(panel);

    setupPanelEvents(panel);
    updatePanelPreview();
  });
}

function updatePanelPreview() {
  const ticketEl = document.getElementById('dwa-val-ticket');
  const catEl = document.getElementById('dwa-val-category');
  const dateEl = document.getElementById('dwa-val-date');

  if (ticketEl) {
    const tId = getTicketNumber();
    if (tId) {
      ticketEl.innerText = tId;
    }
  }
  if (catEl) {
    const cat = getClassification();
    if (cat) {
      catEl.innerText = cat;
    }
  }
  if (dateEl) {
    dateEl.innerText = getTodayFormattedDate();
  }
}

function setupPanelEvents(panel) {
  const header = document.getElementById('dwa-drag-header');
  const body = document.getElementById('dwa-body-content');
  const toggleBtn = document.getElementById('dwa-btn-toggle');
  const closeBtn = document.getElementById('dwa-btn-close');
  const masterBtn = document.getElementById('dwa-btn-master-action');
  const copyOnlyBtn = document.getElementById('dwa-btn-copy-only');
  const waOnlyBtn = document.getElementById('dwa-btn-wa-only');
  const exitOnlyBtn = document.getElementById('dwa-btn-exit-only');
  const selectEl = document.getElementById('dwa-employee-select');

  masterBtn.addEventListener('click', executeMasterAction);

  copyOnlyBtn.addEventListener('click', async () => {
    const ticketId = getTicketNumber() || 'IM...';
    const empIdx = selectEl ? parseInt(selectEl.value, 10) : 0;
    const emp = employeesList[empIdx] || employeesList[0];
    const category = getClassification();
    const dateStr = getTodayFormattedDate();
    const msg = buildWhatsAppMessage(ticketId, emp.name, category, dateStr);

    try {
      await navigator.clipboard.writeText(msg);
      showToast('تم نسخ نموذج الواتساب للحافظة! 📋');
    } catch (e) {
      showToast('تعذر النسخ التلقائي ⚠️', '⚠️');
    }
  });

  waOnlyBtn.addEventListener('click', () => {
    const ticketId = getTicketNumber() || 'IM...';
    const empIdx = selectEl ? parseInt(selectEl.value, 10) : 0;
    const emp = employeesList[empIdx] || employeesList[0];
    const category = getClassification();
    const dateStr = getTodayFormattedDate();
    const msg = buildWhatsAppMessage(ticketId, emp.name, category, dateStr);
    openWhatsAppWithMessage(msg);
    showToast('جاري فتح واتساب ويب... 💬');
  });

  exitOnlyBtn.addEventListener('click', () => {
    const clicked = globalClickSaveAndExit();
    if (clicked) {
      showToast('جاري حفظ التذكرة والخروج... 💾', '💾');
    } else {
      showToast('تعذر العثور على زر حفظ وخروج بالصفحة ⚠️', '⚠️');
    }
  });

  let isCollapsed = false;
  toggleBtn.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      body.style.display = 'none';
      panel.style.width = '190px';
      toggleBtn.innerText = '+';
    } else {
      body.style.display = 'flex';
      panel.style.width = '320px';
      toggleBtn.innerText = '−';
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.style.display = 'none';
    const restoreBtn = document.createElement('div');
    restoreBtn.id = 'daem-whatsapp-restore';
    restoreBtn.title = 'إظهار لوحة داعم واتساب';
    restoreBtn.innerText = '💬';
    restoreBtn.addEventListener('click', () => {
      panel.style.display = '';
      restoreBtn.remove();
    });
    document.body.appendChild(restoreBtn);
  });

  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - panel.offsetWidth - 10));
    newTop = Math.max(10, Math.min(newTop, window.innerHeight - panel.offsetHeight - 10));

    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      const rect = panel.getBoundingClientRect();
      safeSetStorage({ dwa_panel_pos: { x: rect.left, y: rect.top } });
    }
  });
}

// --------------------------------------------------------------------------
// Start Watching & Periodic Check
// --------------------------------------------------------------------------
if (window === window.top) {
  setTimeout(injectFloatingPanel, 600);
  setInterval(injectFloatingPanel, 2000);
  // تحديث سريع للمعاينة اللحظية كل 500 مللي ثانية
  setInterval(updatePanelPreview, 500);

  // تحديث فوري عند نقر المستخدم على أي تبويب بالصفحة
  document.addEventListener('click', () => {
    setTimeout(updatePanelPreview, 150);
    setTimeout(updatePanelPreview, 500);
    setTimeout(updatePanelPreview, 1200);
  });
}

// مراقبة تحديثات الإعدادات من popup
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.dwa_employees) {
        employeesList = changes.dwa_employees.newValue || DEFAULT_EMPLOYEES;
        const selectEl = document.getElementById('dwa-employee-select');
        if (selectEl) {
          selectEl.innerHTML = employeesList.map((emp, idx) => `<option value="${idx}">${emp.name} (${emp.user})</option>`).join('');
        }
      }
      if (changes.dwa_template) customTemplate = changes.dwa_template.newValue || '';
      if (changes.dwa_group_url) customWhatsAppGroupUrl = changes.dwa_group_url.newValue || '';
    }
  });
}
