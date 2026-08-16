// منطق تلوين خلية "رقم التذكرة" v22 - الاستقرار النهائي مع لوحة التحكم العائمة Premium
let websiteTickets = [];
let listWarningDismissed = false;
let lastMismatchedIds = "";
let currentFilter = "all";

let currentLoggedUserKey = 'alrubaish'; // القيمة الافتراضية للتحذيرات
let currentLoggedUserArabic = 'محمد الربيش'; // القيمة الافتراضية للتحذيرات
let currentSpellingEnabled = true;

function safeGetStorage(keys, callback) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, (result) => {
        try {
          if (chrome.runtime.lastError) {
            callback({});
            return;
          }
          callback(result || {});
        } catch (err) {
          callback({});
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
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => {
        try {
          if (chrome.runtime.lastError) return;
          if (callback) callback();
        } catch (err) { }
      });
    }
  } catch (e) { }
}

function safeSendMessage(message, callback) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, (response) => {
        try {
          if (chrome.runtime.lastError) {
            if (callback) callback(null);
            return;
          }
          if (callback) callback(response);
        } catch (err) {
          if (callback) callback(null);
        }
      });
    } else {
      if (callback) callback(null);
    }
  } catch (e) {
    if (callback) callback(null);
  }
}

function safeRemoveStorage(keys, callback) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(keys, () => {
        try {
          if (chrome.runtime.lastError) return;
          if (callback) callback();
        } catch (err) { }
      });
    }
  } catch (e) { }
}

try {
  safeGetStorage(['daemUserKey', 'daemUserArabic', 'daemSpellingEnabled'], (result) => {
    if (result.daemUserKey) currentLoggedUserKey = result.daemUserKey;
    if (result.daemUserArabic) currentLoggedUserArabic = result.daemUserArabic;
    currentSpellingEnabled = result.daemSpellingEnabled !== false;
  });
} catch (e) { }

const EMPLOYEES = [
  {
    key: 'alnesayan',
    arabic: 'البراء النصيان',
    username: 'a.alnesayan',
    names: ['البراء النصيان', 'البراء علي ابراهيم النصيان', 'alnesayan', 'al-nesayan', 'albaraa', 'a.alnesayan']
  },
  {
    key: 'alowaid',
    arabic: 'عبدالله العويد',
    username: 'aalowaid',
    names: ['عبدالله العويد', 'عبدالله عبدالعزيز محمد العويد', 'alowaid', 'al-owaid', 'aalowaid']
  },
  {
    key: 'alamri',
    arabic: 'عبدالرحمن العمري',
    username: 'af.alamri',
    names: ['عبدالرحمن العمري', 'عبدالرحمن فهيد العمري', 'alamri', 'al-amri', 'af.alamri']
  },
  {
    key: 'alharbi',
    arabic: 'عزام الحربي',
    username: 'azz.alharbi',
    names: ['عزام الحربي', 'عزام أحمد محمد الفريدي الحربي', 'alharbi', 'al-harbi', 'azz.alharbi']
  },
  {
    key: 'alrubaish',
    arabic: 'محمد الربيش',
    username: 'mialrubaish',
    names: ['محمد الربيش', 'محمد إبراهيم محمد الربيش', 'alrubaish', 'al-rubaish', 'mialrubaish', 'ed Ibrahem alrubaish', 'Mohammed Ibrahem alrubaish', 'edrubaish', 'mialrubaish@qassim.gov.sa']
  },
  {
    key: 'alghosen',
    arabic: 'صالح الغصن',
    username: 's.alghosen',
    names: ['صالح الغصن', 'صالح عبدالعزيز صالح الغصن', 'alghosen', 'al-ghosen', 's.alghosen']
  },
  {
    key: 'alhedyani',
    arabic: 'طارق الهدياني',
    username: 't.alhedyani',
    names: ['طارق الهدياني', 'طارق عبدالعزيز عبدالله الهدياني', 'alhedyani', 'al-hedyani', 't.alhedyani']
  },
  {
    key: 'almansour',
    arabic: 'ثامر المنصور',
    username: 't.almansour',
    names: ['ثامر المنصور', 'ثامر عبدالله محمد المنصور', 'almansour', 'al-mansour', 't.almansour']
  }
];

function findEmployeeByName(nameStr) {
  if (!nameStr) return null;
  const cleanName = nameStr.replace(/[⬅️➡️➡️⬅]/g, '').trim().toLowerCase();
  if (!cleanName) return null;

  const commonNames = ['ibrahem', 'mohammed', 'abdullah', 'ابراهيم', 'محمد', 'عبدالله', 'احمد', 'علي', 'بن', 'عبد', 'ابو', 'أبو'];

  for (const emp of EMPLOYEES) {
    for (const variant of emp.names) {
      const cleanVariant = variant.toLowerCase();
      if (cleanName === cleanVariant) {
        return emp;
      }
      if (cleanName.includes(cleanVariant)) {
        return emp;
      }
      if (cleanVariant.includes(cleanName) && !commonNames.includes(cleanName)) {
        return emp;
      }
    }
  }

  const parts = cleanName.split(/\s+/);
  for (const part of parts) {
    if (part.length < 3) continue;
    if (commonNames.includes(part)) continue;
    for (const emp of EMPLOYEES) {
      for (const variant of emp.names) {
        const cleanVariant = variant.toLowerCase();
        if (cleanVariant.includes(part)) {
          return emp;
        }
      }
    }
  }
  return null;
}

function isMyTaskListActive() {
  function checkDoc(doc) {
    if (!doc) return false;

    // 1. تفقد القوائم المنسدلة (select) المعتادة
    const selects = doc.querySelectorAll('select');
    for (const select of selects) {
      if (select.selectedIndex !== -1) {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption) {
          const optText = selectedOption.text.replace(/\s+/g, ' ').trim();
          if (optText.includes('قائمة المهام الخاصة بي') || optText.includes('المهام الخاصة بي')) {
            return true;
          }
        }
      }
    }

    // 2. تفقد حقول الإدخال (Inputs) - مهم جداً لمنصة Remedy/Daem
    const inputs = doc.querySelectorAll('input');
    for (const input of inputs) {
      const val = (input.value || '').trim();
      if (val.includes('قائمة المهام الخاصة بي') || val.includes('المهام الخاصة بي')) {
        return true;
      }
    }

    // 3. تفقد العناصر النصية بشكل عام وسريع بدون layout thrashing
    if (doc.body) {
      const bodyText = doc.body.innerText || '';
      if (bodyText.includes('قائمة المهام الخاصة بي') || bodyText.includes('المهام الخاصة بي')) {
        // فحص سريع ومحدد للعناصر النشطة فقط مثل القوائم المخصصة
        const dropdowns = doc.querySelectorAll('.selection, .dropdown, [role="combobox"], div[id*="select"]');
        for (const el of dropdowns) {
          const txt = (el.innerText || '').trim();
          if (txt.includes('قائمة المهام الخاصة بي') || txt.includes('المهام الخاصة بي')) {
            return true;
          }
        }

        // إذا كان النص موجوداً ولم نجد قائمة مخصصة، نكتفي بمطابقته كدليل كافٍ
        return true;
      }
    }
    return false;
  }

  // فحص المستند الحالي
  if (checkDoc(document)) return true;

  // فحص المستند الرئيسي (Top window) لدعم وجود الجدول داخل إطار (Iframe)
  try {
    if (window.top && window.top.document && window.top.document !== document) {
      if (checkDoc(window.top.document)) return true;
    }
  } catch (e) { }

  // فحص كافة الإطارات الأخرى المتصلة
  try {
    if (window.top && window.top.frames) {
      for (let i = 0; i < window.top.frames.length; i++) {
        try {
          const frameDoc = window.top.frames[i].document;
          if (frameDoc && frameDoc !== document) {
            if (checkDoc(frameDoc)) return true;
          }
        } catch (e) { }
      }
    }
  } catch (e) { }

  return false;
}

// جلب البيانات عبر الخلفية لتجاوز CORS
async function syncFromWebsite() {
  safeSendMessage({ action: "FETCH_TICKETS" }, (response) => {
    if (response && response.tickets) {
      const resData = response.tickets;
      websiteTickets = Array.isArray(resData) ? resData : (resData.tickets || []);
      window.daemTicketsFetched = true;

      // تحديث نص زر التوزيع ديناميكياً بعد انتهاء جلب البيانات
      const nextEmployee = getLeastReceiver();
      updateSubmitButtonText(nextEmployee);

      // تحديث ظهور زر الإسناد التلقائي فوراً
      refreshAutoAssignButtonVisibility();

      // تشغيل الإسناد التلقائي فوراً بمجرد جاهزية البيانات لتقليل زمن الانتظار
      autoAssignIfNewTicket();
    }
  });
}

// جلب البيانات بـ Promise للاستخدام المتزامن/اللحظي
function fetchTicketsPromise() {
  return new Promise((resolve) => {
    safeSendMessage({ action: "FETCH_TICKETS" }, (response) => {
      if (response && response.tickets) {
        const resData = response.tickets;
        const tickets = Array.isArray(resData) ? resData : (resData.tickets || []);
        window.daemTicketsFetched = true;
        resolve(tickets);
      } else {
        resolve([]);
      }
    });
  });
}

function parseDaemDate(dateStr) {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  const timeMatch = cleanStr.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/);
  const dateMatch = cleanStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

  if (!dateMatch) return null;

  let month = parseInt(dateMatch[1], 10);
  let day = parseInt(dateMatch[2], 10);
  let year = parseInt(dateMatch[3], 10);
  if (year < 100) year += 2000;

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    let minutes = parseInt(timeMatch[2], 10);
    let seconds = parseInt(timeMatch[3], 10);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  return new Date(year, month - 1, day);
}

function getRelativeTimeArabic(date) {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'الآن';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes <= 1) return 'منذ دقيقة';
      if (diffMinutes === 2) return 'منذ دقيقتين';
      if (diffMinutes < 11) return `منذ ${diffMinutes} دقائق`;
      return `منذ ${diffMinutes} دقيقة`;
    }
    if (diffHours === 1) return 'منذ ساعة';
    if (diffHours === 2) return 'منذ ساعتين';
    if (diffHours < 11) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffHours} ساعة`;
  }

  if (diffDays === 1) return 'منذ يوم';
  if (diffDays === 2) return 'منذ يومين';

  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    const remDays = diffDays % 30;

    let monthStr = '';
    if (months === 1) monthStr = 'شهر';
    else if (months === 2) monthStr = 'شهرين';
    else if (months < 11) monthStr = `${months} أشهر`;
    else monthStr = `${months} شهراً`;

    let dayStr = '';
    if (remDays === 1) dayStr = 'يوم';
    else if (remDays === 2) dayStr = 'يومين';
    else if (remDays >= 3 && remDays < 11) dayStr = `${remDays} أيام`;
    else if (remDays >= 11) dayStr = `${remDays} يوماً`;

    return `منذ ${monthStr}${dayStr ? ' و' + dayStr : ''}`;
  }

  if (diffDays >= 7) {
    const weeks = Math.floor(diffDays / 7);
    const remDays = diffDays % 7;

    let weekStr = '';
    if (weeks === 1) weekStr = 'أسبوع';
    else if (weeks === 2) weekStr = 'أسبوعين';
    else weekStr = `${weeks} أسابيع`;

    let dayStr = '';
    if (remDays === 1) dayStr = 'يوم';
    else if (remDays === 2) dayStr = 'يومين';
    else if (remDays >= 3 && remDays < 11) dayStr = `${remDays} أيام`;

    return `منذ ${weekStr}${dayStr ? ' و' + dayStr : ''}`;
  }

  if (diffDays < 11) return `منذ ${diffDays} أيام`;
  return `منذ ${diffDays} يوماً`;
}

function cleanBaladiahName(nameStr) {
  if (!nameStr) return '';
  const clean = nameStr.trim();

  if (clean.toLowerCase().includes('qassim municipality') || clean.includes('أمانة')) {
    return 'أمانة القصيم';
  }

  const match = clean.match(/(بلدية\s+[\u0600-\u06FF\s]+)/);
  if (match) {
    return match[1].trim();
  }

  return clean;
}

function setCellText(cell, text, noWrap = false) {
  const child = cell.querySelector('div') || cell.querySelector('span');
  if (child) {
    child.innerText = text;
    if (noWrap) {
      child.style.whiteSpace = 'nowrap';
      cell.style.whiteSpace = 'nowrap';
    }
  } else {
    cell.innerText = text;
    if (noWrap) {
      cell.style.whiteSpace = 'nowrap';
    }
  }
}

function cleanColumnHeaders() {
  // إزالة <br> ونص "قابل للفرز" من عناوين الأعمدة مثل Baladiah<br>قابل للفرز
  document.querySelectorAll('.x-grid3-hd-inner').forEach(hd => {
    hd.querySelectorAll('br').forEach(br => {
      const next = br.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE) next.remove();
      br.remove();
    });
  });
}

function highlightTickets() {
  try {
    if (!chrome.runtime || !chrome.runtime.id) return;
  } catch (e) {
    return;
  }
  // لا تعمل داخل صفحة تفاصيل التذكرة لتجنب التداخل مع تبويباتها
  if (!isListPage()) return;
  cleanColumnHeaders();
  const allRows = document.querySelectorAll('tr');
  if (allRows.length === 0) return;

  // البحث عن فهرس عمود المهندس وعمود المعين السابق وعمود وقت الفتح وعمود التحديث وعمود البلدية وعمود Area/Service لتجنب اللبس
  let engineerColIdx = -1;
  let assigneeOldColIdx = -1;
  let openTimeColIdx = -1;
  let updateTimeColIdx = -1;
  let baladiahColIdx = -1;
  let areaServiceColIdx = -1;
  let mobileColIdx = -1;
  try {
    for (const hRow of allRows) {
      const headers = hRow.querySelectorAll('th, td');
      let foundHeader = false;
      for (let i = 0; i < headers.length; i++) {
        const txt = headers[i].innerText.trim();
        if (txt.includes('المهندس') || txt.toLowerCase().includes('engineer')) {
          engineerColIdx = i;
          foundHeader = true;
        } else if (txt.includes('Assignee Old') || txt.includes('المعين السابق') || txt.includes('signee Old')) {
          assigneeOldColIdx = i;
        } else if (txt.includes('وقت الفتح') || txt.toLowerCase().includes('open time') || txt.toLowerCase().includes('created date') || txt.toLowerCase().includes('open date')) {
          openTimeColIdx = i;
        } else if (txt.includes('تحديث') || txt.toLowerCase().includes('update')) {
          updateTimeColIdx = i;
        } else if (txt.includes('البلدية') || txt.toLowerCase().includes('baladiah') || txt.toLowerCase().includes('municipality')) {
          baladiahColIdx = i;
        } else if (txt.includes('Area/Service') || txt.toLowerCase().includes('area') || txt.toLowerCase().includes('service')) {
          areaServiceColIdx = i;
        } else if (txt.includes('الجوال') || txt.toLowerCase().includes('mobile') || txt.toLowerCase().includes('phone') || txt.toLowerCase().includes('extension')) {
          mobileColIdx = i;
        }
      }
      if (foundHeader) break;
    }
  } catch (e) { }

  let currentCounts = { new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0, notSolved: 0 };
  let foundAny = false;
  let mismatchedList = [];

  allRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    // 1. تنسيق عمود وقت الفتح بنص نسبي وألوان مناسبة
    if (openTimeColIdx !== -1 && openTimeColIdx < cells.length) {
      const openTimeCell = cells[openTimeColIdx];
      let originalTime = openTimeCell.getAttribute('data-original-time');
      if (!originalTime) {
        originalTime = openTimeCell.innerText.trim();
        if (originalTime && originalTime !== '') {
          openTimeCell.setAttribute('data-original-time', originalTime);
        }
      }

      if (originalTime && originalTime !== '') {
        const parsedDate = parseDaemDate(originalTime);
        if (parsedDate) {
          const relativeText = getRelativeTimeArabic(parsedDate);
          if (relativeText) {
            const dateMatch = originalTime.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            const datePart = dateMatch ? dateMatch[0] : '';
            setCellText(openTimeCell, datePart ? `${datePart} (${relativeText})` : relativeText, true);
            openTimeCell.removeAttribute('title');
            openTimeCell.setAttribute('data-tooltip', `وقت الفتح الأصلي: ${originalTime}`);

            const diffDays = Math.floor((new Date().getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
            openTimeCell.classList.remove('daem-time-normal', 'daem-time-week', 'daem-time-month');
            if (diffDays >= 30) {
              openTimeCell.classList.add('daem-time-month');
            } else if (diffDays >= 7) {
              openTimeCell.classList.add('daem-time-week');
            } else {
              openTimeCell.classList.add('daem-time-normal');
            }
          }
        }
      }
    }

    // 2. تنسيق عمود تاريخ التحديث بنص نسبي وألوان مناسبة
    if (updateTimeColIdx !== -1 && updateTimeColIdx < cells.length) {
      const updateTimeCell = cells[updateTimeColIdx];
      let originalTime = updateTimeCell.getAttribute('data-original-time');
      if (!originalTime) {
        originalTime = updateTimeCell.innerText.trim();
        if (originalTime && originalTime !== '') {
          updateTimeCell.setAttribute('data-original-time', originalTime);
        }
      }

      if (originalTime && originalTime !== '') {
        const parsedDate = parseDaemDate(originalTime);
        if (parsedDate) {
          const relativeText = getRelativeTimeArabic(parsedDate);
          if (relativeText) {
            const dateMatch = originalTime.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            const datePart = dateMatch ? dateMatch[0] : '';
            setCellText(updateTimeCell, datePart ? `${datePart} (${relativeText})` : relativeText, true);
            updateTimeCell.removeAttribute('title');
            updateTimeCell.setAttribute('data-tooltip', `تاريخ التحديث الأصلي: ${originalTime}`);

            const diffDays = Math.floor((new Date().getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
            updateTimeCell.classList.remove('daem-time-normal', 'daem-time-week', 'daem-time-month');
            if (diffDays >= 30) {
              updateTimeCell.classList.add('daem-time-month');
            } else if (diffDays >= 7) {
              updateTimeCell.classList.add('daem-time-week');
            } else {
              updateTimeCell.classList.add('daem-time-normal');
            }
          }
        }
      }
    }

    // 2.5 تنسيق عمود المهندس لعرض اسم اليوزر الخاص به
    if (engineerColIdx !== -1 && engineerColIdx < cells.length) {
      const engineerCell = cells[engineerColIdx];
      let originalEngineer = engineerCell.getAttribute('data-original-engineer');
      if (!originalEngineer) {
        originalEngineer = engineerCell.innerText.trim();
        if (originalEngineer && originalEngineer !== '') {
          engineerCell.setAttribute('data-original-engineer', originalEngineer);
        }
      }

      if (originalEngineer && originalEngineer !== '') {
        const emp = findEmployeeByName(originalEngineer);
        if (emp && emp.arabic) {
          setCellText(engineerCell, emp.arabic);
          engineerCell.removeAttribute('title');
          engineerCell.setAttribute('data-tooltip', `المهندس: ${originalEngineer}`);
        }
      }
    }

    // 3. تنسيق عمود البلدية لعرض الاسم العربي فقط
    if (baladiahColIdx !== -1 && baladiahColIdx < cells.length) {
      const baladiahCell = cells[baladiahColIdx];
      let originalBaladiah = baladiahCell.getAttribute('data-original-baladiah');
      if (!originalBaladiah) {
        originalBaladiah = baladiahCell.innerText.trim();
        if (originalBaladiah && originalBaladiah !== '') {
          baladiahCell.setAttribute('data-original-baladiah', originalBaladiah);
        }
      }

      if (originalBaladiah && originalBaladiah !== '') {
        const cleanedName = cleanBaladiahName(originalBaladiah);
        if (cleanedName) {
          setCellText(baladiahCell, cleanedName);
          baladiahCell.removeAttribute('title');
          baladiahCell.setAttribute('data-tooltip', `الاسم الأصلي: ${originalBaladiah}`);
        }
      }
    }

    // 3.5 تنسيق عمود الجوال لضمان البدء بـ 05
    if (mobileColIdx !== -1 && mobileColIdx < cells.length) {
      const mobileCell = cells[mobileColIdx];
      let originalMobile = mobileCell.getAttribute('data-original-mobile');
      if (!originalMobile) {
        originalMobile = mobileCell.innerText.trim();
        if (originalMobile && originalMobile !== '') {
          mobileCell.setAttribute('data-original-mobile', originalMobile);
        }
      }

      if (originalMobile && originalMobile !== '') {
        let clean = originalMobile.trim();
        if (/^5\d{8}$/.test(clean)) {
          setCellText(mobileCell, '0' + clean);
        }
      }
    }

    // البحث الديناميكي عن خلية رقم التذكرة
    let targetCell = null;
    let ticketId = null;
    for (let i = 0; i < cells.length; i++) {
      const cellText = cells[i].innerText.trim();
      const match = cellText.match(/IM\d{5,9}/);
      if (match) {
        targetCell = cells[i];
        ticketId = match[0];
        break;
      }
    }

    if (!targetCell) return;

    // تنظيف التلوين ومؤشرات النقل السابقة
    targetCell.classList.remove('daem-cell-new', 'daem-cell-old', 'daem-cell-very-old', 'daem-cell-recent', 'daem-cell-unassigned', 'daem-cell-not-solved', 'daem-cell-mismatch', 'daem-cell-solved');
    const oldIndicators = row.querySelectorAll('.daem-transfer-indicator');
    oldIndicators.forEach(ind => ind.remove());
    targetCell.style.borderRight = '';

    if (ticketId) {
      const myTicket = websiteTickets.find(t => {
        const n = String(t.number || "").trim();
        return n.includes(ticketId) || ticketId.includes(n);
      });

      if (myTicket) {
        foundAny = true;

        // تحديث عمود Area/Service بناءً على نوع التصنيف في قاعدة البيانات
        if (areaServiceColIdx !== -1 && areaServiceColIdx < cells.length && myTicket.type && myTicket.type !== 'أخرى') {
          const areaServiceCell = cells[areaServiceColIdx];
          let originalService = areaServiceCell.getAttribute('data-original-service');
          if (!originalService) {
            originalService = areaServiceCell.innerText.trim();
            if (originalService && originalService !== '') {
              areaServiceCell.setAttribute('data-original-service', originalService);
            }
          }
          setCellText(areaServiceCell, myTicket.type);
          areaServiceCell.removeAttribute('title');
          areaServiceCell.setAttribute('data-tooltip', `الخدمة الأصلية: ${originalService || areaServiceCell.innerText}`);
        }

        // التحقق من عدم تطابق التعيين (مستقبل البلاغ)
        const dbReceiver = (myTicket.receiver || "").trim();
        let isMismatched = false;
        if (dbReceiver && dbReceiver !== 'غير حدد' && dbReceiver !== 'غير محدد') {
          const dbEmp = findEmployeeByName(dbReceiver);

          // تحديد موظف السطر: نفضل عمود المهندس إن وجد، وإلا نبحث ديناميكياً مع استثناء الأعمدة غير المناسبة
          let rowEmp = null;
          if (engineerColIdx !== -1 && engineerColIdx < cells.length) {
            rowEmp = findEmployeeByName(cells[engineerColIdx].innerText.trim());
          }

          if (!rowEmp) {
            for (let i = 0; i < cells.length; i++) {
              if (cells[i] === targetCell) continue;
              if (i === assigneeOldColIdx) continue;

              const cellText = cells[i].innerText.trim();
              if (cellText.toLowerCase().includes('old') || cellText.includes('السابق') || cellText.includes('التفاصيل')) {
                continue;
              }

              const emp = findEmployeeByName(cellText);
              if (emp) {
                rowEmp = emp;
                break;
              }
            }
          }

          if (dbEmp && rowEmp && dbEmp.key !== rowEmp.key) {
            isMismatched = true;
            targetCell.classList.add('daem-cell-mismatch');
            mismatchedList.push({
              id: ticketId,
              dbEmp: dbEmp.arabic
            });

            // إضافة مؤشر نقل بجانب رقم التذكرة
            const ind = document.createElement('span');
            ind.className = 'daem-transfer-indicator';
            ind.style.color = '#f59e0b';
            ind.style.fontSize = '11px';
            ind.style.marginRight = '5px';
            ind.style.fontWeight = 'bold';
            ind.removeAttribute('title');
            ind.setAttribute('data-tooltip', `المفترض عند ${dbEmp.arabic} (مسند حالياً لـ ${rowEmp.arabic})`);
            ind.innerText = ` ⬅️ ${dbEmp.arabic.split(' ')[0]}`;
            targetCell.appendChild(ind);
          }
        }

        if (isMismatched) {
          // اللون مضاف مسبقاً (daem-cell-mismatch)
        } else {
          const status = (myTicket.solution || "").trim();

          // حساب ما إذا كانت التذكرة متأخرة لأكثر من أسبوع
          const isNew = status === 'بلاغ جديد' || status === 'غير محدد' || status === '';
          let isLate = false;
          if (isNew && myTicket.date && myTicket.date !== 'غير محدد') {
            try {
              const ticketDate = new Date(myTicket.date);
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              if (ticketDate < oneWeekAgo) {
                isLate = true;
              }
            } catch (e) { }
          }

          if (isLate) {
            targetCell.classList.add('daem-cell-unassigned');
            currentCounts.unassigned++;
          } else if (status === 'بلاغ جديد') {
            targetCell.classList.add('daem-cell-new');
            currentCounts.new++;
          } else if (status === 'بانتظار المستفيد') {
            targetCell.classList.add('daem-cell-recent');
            currentCounts.recent++;
          } else if (status === 'لدى الوزارة') {
            targetCell.classList.add('daem-cell-very-old');
            currentCounts.veryOld++;
          } else if (status === 'مشكلة عامة') {
            targetCell.classList.add('daem-cell-old');
            currentCounts.old++;
          } else if (status === 'لم يتم الحل') {
            targetCell.classList.add('daem-cell-not-solved');
            currentCounts.notSolved++;
          } else if (status === 'تم الحل') {
            targetCell.classList.add('daem-cell-solved');
          }
        }
      }
    }
  });

  // تخزين البلاغات غير المتطابقة وتحديث لوحة الداشبورد
  window.daemMismatchedList = mismatchedList;
  updateDashboardPanelData();
  filterTableRows(currentFilter);

  // لا نحدث العداد إلا إذا وجدنا بلاغات ملونة فعلاً في هذا الإطار
  if (foundAny) {
    safeSetStorage({ daemCounts: currentCounts });
  }
}

function filterTableRows(filterType) {
  currentFilter = filterType;
  applyRowFilterInDocument(document, filterType);

  // تطبيق الفلترة أيضاً على صفوف الجدول داخل أي إطارات (iframes) لأن الجدول الفعلي قد يكون بداخلها
  document.querySelectorAll('iframe, frame').forEach(frame => {
    try {
      const fd = frame.contentDocument || frame.contentWindow?.document;
      if (fd) applyRowFilterInDocument(fd, filterType);
    } catch (e) { }
  });
}

function applyRowFilterInDocument(doc, filterType) {
  const allRows = doc.querySelectorAll('tr');
  allRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    let targetCell = null;
    for (let i = 0; i < cells.length; i++) {
      const cellText = cells[i].innerText.trim();
      if (cellText.match(/IM\d{5,9}/)) {
        targetCell = cells[i];
        break;
      }
    }

    if (!targetCell) return;

    if (filterType === 'all') {
      row.style.display = '';
    } else if (filterType === 'new') {
      row.style.display = targetCell.classList.contains('daem-cell-new') ? '' : 'none';
    } else if (filterType === 'recent') { // بانتظار المستفيد
      row.style.display = targetCell.classList.contains('daem-cell-recent') ? '' : 'none';
    } else if (filterType === 'very-old') { // لدى الوزارة
      row.style.display = targetCell.classList.contains('daem-cell-very-old') ? '' : 'none';
    } else if (filterType === 'unassigned') { // متأخر
      row.style.display = targetCell.classList.contains('daem-cell-unassigned') ? '' : 'none';
    } else if (filterType === 'mismatch') { // غير متطابق
      row.style.display = targetCell.classList.contains('daem-cell-mismatch') ? '' : 'none';
    }
  });
}


function injectDashboardPanel() {
  try {
    if (!chrome.runtime || !chrome.runtime.id) return;
  } catch (e) {
    return;
  }

  // نحقن فقط في النافذة الرئيسية
  if (window !== window.top) return;

  // إذا كانت هناك تذكرة مفتوحة في أي iframe، نخفي الداشبورد
  const frames = document.querySelectorAll('iframe, frame');
  let hasPremiumPanel = false;
  for (const frame of frames) {
    try {
      const frameDoc = frame.contentDocument || frame.contentWindow?.document;
      if (frameDoc && frameDoc.getElementById('daem-premium-panel')) {
        hasPremiumPanel = true;
        break;
      }
    } catch (e) { }
  }
  if (hasPremiumPanel) {
    const existingDashboardPanel = document.getElementById('daem-dashboard-panel');
    if (existingDashboardPanel) existingDashboardPanel.remove();
    return;
  }

  // يجب أن نكون في صفحة القائمة
  if (!isListPage()) {
    const existingDashboardPanel = document.getElementById('daem-dashboard-panel');
    if (existingDashboardPanel) existingDashboardPanel.remove();
    return;
  }

  const existingDashboardPanel = document.getElementById('daem-dashboard-panel');
  if (existingDashboardPanel) {
    return; // لوحة الداشبورد موجودة بالفعل
  }

  const panel = document.createElement('div');
  panel.id = 'daem-dashboard-panel';
  panel.style.position = 'fixed';
  panel.style.bottom = '30px';
  panel.style.right = '30px';
  panel.style.width = '320px';
  panel.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
  panel.style.backdropFilter = 'blur(12px)';
  panel.style.webkitBackdropFilter = 'blur(12px)';
  panel.style.border = '1px solid rgba(16, 185, 129, 0.5)';
  panel.style.borderRadius = '16px';
  panel.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(16, 185, 129, 0.25)';
  panel.style.zIndex = '999999';
  panel.style.fontFamily = 'Cairo, Arial, sans-serif';
  panel.style.direction = 'rtl';
  panel.style.overflow = 'hidden';
  panel.style.color = '#f8fafc';
  panel.style.transition = 'all 0.3s ease';

  // حساب الموظف الذي عليه الدور
  const nextEmployee = getLeastReceiver();

  // الحصول على الدور الحالي من المخزن
  safeGetStorage(['daemRole'], (result) => {
    const currentRole = result.daemRole || 'support';

    panel.innerHTML = `
      <!-- رأس اللوحة بتصميم متدرج مميز -->
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; color: white; cursor: pointer; user-select: none;" id="daem-dbpanel-header">
        <span style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px; pointer-events: none;">
          🚀 داعم بلس • لوحة الداشبورد
        </span>
        <span id="daem-dbpanel-toggle" style="font-size: 16px; font-weight: bold; pointer-events: none;">−</span>
      </div>
      
      <!-- محتوى اللوحة -->
      <div id="daem-dbpanel-body" style="padding: 15px; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s ease;">
        
        <!-- قسم الموظف القادم -->
        <div style="background-color: rgba(30, 41, 59, 0.6); border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.05); font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94a3b8;">المستقبل القادم (الدور عليه):</span>
            <span id="daem-dbpanel-next-employee" style="color: #10b981; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 5px;">
              <span class="daem-pulse-green" style="display: inline-block; width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></span>
              ${nextEmployee ? nextEmployee.name : 'جاري الحساب...'}
            </span>
          </div>
        </div>

        <!-- قسم التنبيهات والأخطاء (يحدث ديناميكياً) -->
        <div id="daem-dbpanel-alerts" style="background-color: rgba(120, 53, 15, 0.2); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 10px; font-size: 11px; color: #fef3c7; display: none; flex-direction: column; gap: 6px; font-weight: bold;">
        </div>

        <!-- قسم الإحصائيات والفلترة السريعة -->
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
          <span style="font-size: 11px; color: #94a3b8; font-weight: bold;">إحصائيات وفلترة سريعة للبلاغات:</span>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="daem-dbpanel-stats-grid">
            <button id="daem-filter-all" class="daem-filter-btn active" style="background: rgba(51, 65, 85, 0.6); border: 1px solid rgba(255,255,255,0.1); color: #f8fafc; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; outline: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                الكل
              </span>
              <span id="daem-stat-all" style="background: #475569; padding: 2px 6px; border-radius: 6px; min-width: 16px; text-align: center;">0</span>
            </button>
            <button id="daem-filter-new" class="daem-filter-btn" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; outline: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                جديد
              </span>
              <span id="daem-stat-new" style="background: rgba(59, 130, 246, 0.2); padding: 2px 6px; border-radius: 6px; min-width: 16px; text-align: center;">0</span>
            </button>
            <button id="daem-filter-recent" class="daem-filter-btn" style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); color: #f472b6; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; outline: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                بانتظار المستفيد
              </span>
              <span id="daem-stat-recent" style="background: rgba(236, 72, 153, 0.2); padding: 2px 6px; border-radius: 6px; min-width: 16px; text-align: center;">0</span>
            </button>
            <button id="daem-filter-very-old" class="daem-filter-btn" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; outline: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.47 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                لدى الوزارة
              </span>
              <span id="daem-stat-very-old" style="background: rgba(245, 158, 11, 0.2); padding: 2px 6px; border-radius: 6px; min-width: 16px; text-align: center;">0</span>
            </button>
            <button id="daem-filter-unassigned" class="daem-filter-btn" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; outline: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                متأخر
              </span>
              <span id="daem-stat-unassigned" style="background: rgba(239, 68, 68, 0.2); padding: 2px 6px; border-radius: 6px; min-width: 16px; text-align: center;">0</span>
            </button>
            <button id="daem-filter-mismatch" class="daem-filter-btn" style="background: rgba(163, 116, 255, 0.1); border: 1px solid rgba(163, 116, 255, 0.3); color: #c084fc; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; outline: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg style="width: 12px; height: 12px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.47 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                غير متطابق
              </span>
              <span id="daem-stat-mismatch" style="background: rgba(163, 116, 255, 0.2); padding: 2px 6px; border-radius: 6px; min-width: 16px; text-align: center;">0</span>
            </button>
          </div>
        </div>

        <!-- زر الجولة التعليمية التفاعلية -->
        <button id="daem-btn-start-tour" style="width: 100%; margin-top: 8px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #10b981; padding: 8px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 6px; outline: none;">
          📽️ بدء الجولة التعليمية
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    const style = document.createElement('style');
    style.id = 'daem-pulse-style';
    if (!document.getElementById('daem-pulse-style')) {
      style.innerHTML = `
        @keyframes daem-pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .daem-pulse-green {
          animation: daem-pulse-green 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }

    let isCollapsed = false;
    let dragged = false;
    let dragStartX = 0;
    let dragStartY = 0;

    const headerEl = document.getElementById('daem-dbpanel-header');
    
    // إعدادات السحب والإفلات للداشبورد العائم بالكامل من أي مكان
    panel.style.cursor = 'move';
    panel.style.userSelect = 'none';
    panel.style.webkitUserSelect = 'none';
    
    panel.addEventListener('mousedown', (e) => {
      // تجنب بدء السحب عند النقر على الأزرار التفاعلية أو المدخلات لكي لا تفقد وظيفتها
      if (e.target.closest('button, input, a, #daem-btn-start-tour, .daem-filter-btn')) {
        return;
      }
      if (e.button !== 0) return; // السحب بالزر الأيسر فقط
      
      e.preventDefault(); // منع تحديد النصوص والاهتزاز الافتراضي بالمتصفح
      panel.style.transition = 'none'; // تعطيل الأنيميشن مؤقتاً لضمان حركة فورية وسلسة
      
      dragged = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      
      let pos1 = 0, pos2 = 0, pos3 = e.clientX, pos4 = e.clientY;
      
      const elementDrag = (moveEvent) => {
        moveEvent.preventDefault();
        
        const diffX = Math.abs(moveEvent.clientX - dragStartX);
        const diffY = Math.abs(moveEvent.clientY - dragStartY);
        if (diffX > 5 || diffY > 5) {
          dragged = true; // تم التحريك، هذه عملية سحب وليست نقرة بسيطة
        }
        
        pos1 = pos3 - moveEvent.clientX;
        pos2 = pos4 - moveEvent.clientY;
        pos3 = moveEvent.clientX;
        pos4 = moveEvent.clientY;
        
        let newTop = panel.offsetTop - pos2;
        let newLeft = panel.offsetLeft - pos1;
        
        // التحقق من بقاء اللوحة داخل شاشة العرض
        if (newTop < 10) newTop = 10;
        if (newTop + panel.offsetHeight > window.innerHeight - 10) {
          newTop = window.innerHeight - panel.offsetHeight - 10;
        }
        if (newLeft < 10) newLeft = 10;
        if (newLeft + panel.offsetWidth > window.innerWidth - 10) {
          newLeft = window.innerWidth - panel.offsetWidth - 10;
        }
        
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        panel.style.top = newTop + 'px';
        panel.style.left = newLeft + 'px';
      };
      
      const closeDragElement = () => {
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
        panel.style.transition = 'all 0.3s ease'; // إعادة تفعيل الأنيميشن عند الإفلات لاستعادة مرونة اللوحة
      };
      
      document.addEventListener('mousemove', elementDrag);
      document.addEventListener('mouseup', closeDragElement);
    });

    headerEl.addEventListener('click', (e) => {
      if (dragged) {
        dragged = false;
        e.preventDefault();
        e.stopPropagation();
        return; // عدم تصغير اللوحة إذا انتهت عملية سحب
      }
      
      const body = document.getElementById('daem-dbpanel-body');
      const toggle = document.getElementById('daem-dbpanel-toggle');
      if (isCollapsed) {
        body.style.display = 'flex';
        toggle.innerText = '−';
        isCollapsed = false;
      } else {
        body.style.display = 'none';
        toggle.innerText = '+';
        isCollapsed = true;
      }
    });

    const filterTypes = ['all', 'new', 'recent', 'very-old', 'unassigned', 'mismatch'];
    filterTypes.forEach(type => {
      const btn = document.getElementById(`daem-filter-${type}`);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          filterTypes.forEach(t => {
            const b = document.getElementById(`daem-filter-${t}`);
            if (b) b.classList.remove('active');
          });
          btn.classList.add('active');
          filterTableRows(type);
        });
      }
    });

    document.getElementById('daem-btn-start-tour').addEventListener('click', (e) => {
      e.stopPropagation();
      startGuidedTour();
    });

    // تحقق من الجولة التعليمية التلقائية للمستخدمين الجدد
    safeGetStorage(['daemTourCompleted'], (result) => {
      if (!result || !result.daemTourCompleted) {
        setTimeout(() => {
          startGuidedTour();
        }, 1500);
      }
    });

    updateDashboardPanelData();
  });
}

function updateDashboardPanelData() {
  try {
    const panel = document.getElementById('daem-dashboard-panel');
    if (!panel) return;

    const nextEmployee = getLeastReceiver();
    const nextEl = document.getElementById('daem-dbpanel-next-employee');
    if (nextEl && nextEmployee) {
      nextEl.innerHTML = `
        <span class="daem-pulse-green" style="display: inline-block; width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; margin-left: 5px;"></span>
        ${nextEmployee.name}
      `;
    }

    // جرد وحساب البلاغات الحالية بالجدول لتحديث العدادات (تشمل الـ iframes)
    let allRows = Array.from(document.querySelectorAll('tr'));
    document.querySelectorAll('iframe, frame').forEach(frame => {
      try {
        const fd = frame.contentDocument || frame.contentWindow?.document;
        if (fd) Array.from(fd.querySelectorAll('tr')).forEach(r => allRows.push(r));
      } catch (e) {}
    });
    const rows = allRows;
    let totalTickets = 0;
    let newCount = 0;
    let recentCount = 0;
    let veryOldCount = 0;
    let lateCount = 0;
    let mismatchCount = 0;

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return;

      let hasTicket = false;
      let isMismatch = false;
      let isNew = false;
      let isRecent = false;
      let isVeryOld = false;
      let isLate = false;

      // فحص كلاسات الخلايا التي تم تلوينها لمعرفة حالتها
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.classList.contains('daem-cell-new')) isNew = true;
        if (cell.classList.contains('daem-cell-recent')) isRecent = true;
        if (cell.classList.contains('daem-cell-very-old')) isVeryOld = true;
        if (cell.classList.contains('daem-cell-unassigned')) isLate = true;
        if (cell.classList.contains('daem-cell-mismatch')) isMismatch = true;
        
        // التحقق من وجود رقم التذكرة
        if (!hasTicket) {
          const txt = cell.innerText.trim();
          if (txt.match(/IM\d{5,9}/)) {
            hasTicket = true;
          }
        }
      }

      if (hasTicket) {
        totalTickets++;
        if (isNew) newCount++;
        if (isRecent) recentCount++;
        if (isVeryOld) veryOldCount++;
        if (isLate) lateCount++;
        if (isMismatch) mismatchCount++;
      }
    });

    const statAll = document.getElementById('daem-stat-all');
    if (statAll) statAll.innerText = totalTickets;

    const statNew = document.getElementById('daem-stat-new');
    if (statNew) statNew.innerText = newCount;

    const statRecent = document.getElementById('daem-stat-recent');
    if (statRecent) statRecent.innerText = recentCount;

    const statVeryOld = document.getElementById('daem-stat-very-old');
    if (statVeryOld) statVeryOld.innerText = veryOldCount;

    const statUnassigned = document.getElementById('daem-stat-unassigned');
    if (statUnassigned) statUnassigned.innerText = lateCount;

    const statMismatch = document.getElementById('daem-stat-mismatch');
    if (statMismatch) statMismatch.innerText = mismatchCount;

    const alertsDiv = document.getElementById('daem-dbpanel-alerts');
    if (alertsDiv) {
      const list = window.daemMismatchedList || [];
      if (list.length > 0) {
        alertsDiv.style.display = 'flex';
        alertsDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span>⚠️ يوجد ${list.length} بلاغات مسندة لزملاء آخرين بالخطأ:</span>
          </div>
          <div style="max-height: 80px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-left: 5px;">
            ${list.map(item => `
              <div style="font-size: 10px; color: #fef3c7; background-color: rgba(245, 158, 11, 0.25); padding: 4px 6px; border-radius: 6px; display: flex; justify-content: space-between;">
                <span>رقم: ${item.id}</span>
                <span style="color: #fbbf24;">المفترض لـ: ${item.dbEmp.split(' ')[0]}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        alertsDiv.style.display = 'none';
        alertsDiv.innerHTML = '';
      }
    }
  } catch (e) {
    console.error("Daem Plus Dashboard Panel Update Error:", e);
  }
}

// ==========================================
// منطق الجولة التعليمية التفاعلية (Guided Tour) - داعم بلس Premium
// ==========================================
let currentTourStep = 0;
let tourOverlay = null;
let tourTooltip = null;

const tourSteps = [
  {
    element: '#daem-dashboard-panel',
    title: '🚀 لوحة الداشبورد العائمة',
    content: 'مرحباً بك في داعم بلس! هذه اللوحة العائمة تعرض لك الإحصائيات الفورية للبلاغات، وتسهل عليك متابعة الجدول التوزيعي للمهام.',
    placement: 'top'
  },
  {
    element: '#daem-dbpanel-stats-grid',
    title: '📊 إحصائيات وفلترة سريعة للبلاغات',
    content: 'هنا يتم جرد وحساب البلاغات تلقائياً. يمكنك النقر على أي من هذه الأزرار (الكل، جديد، متأخر، غير متطابق) لتصفية الجدول فوراً وعرض البلاغات المطلوبة فقط.',
    placement: 'top'
  },
  {
    element: '#daem-dbpanel-next-employee',
    title: '👤 المستقبل القادم (الدور التلقائي)',
    content: 'هنا يظهر اسم الزميل الذي عليه الدور التلقائي لاستلام البلاغ القادم. يتم حسابه دورياً لضمان عدالة توزيع المهام بين الفريق.',
    placement: 'left'
  },
  {
    element: '.daem-cell-new, .daem-cell-recent, .daem-cell-very-old, .daem-cell-old, .daem-cell-unassigned, td.daem-cell-mismatch',
    title: '🎨 تلوين ذكي وتحديث تفاصيل البلاغات',
    content: 'تتميز الإضافة بتلوين أرقام التذاكر ديناميكياً لتوضيح الأولويات (أزرق للجديد، برتقالي للمتأخر، إلخ)، مع تعريب أسماء المهندسين وتبسيط أسماء البلديات تلقائياً.',
    placement: 'bottom'
  },
  {
    element: '#daem-dbpanel-alerts',
    title: '⚠️ كاشف البلاغات غير المتطابقة',
    content: 'في حال أُسند بلاغ لمهندس بالخطأ غير المفترض له في قاعدة البيانات، ستقوم الإضافة بتنبيهك فوراً هنا وبجوار رقم التذكرة بالجدول لتفادي فقدان البلاغات.',
    placement: 'top',
    onShow: () => {
      const el = document.getElementById('daem-dbpanel-alerts');
      if (el) {
        el.setAttribute('data-original-display', el.style.display || '');
        el.setAttribute('data-original-html', el.innerHTML || '');
        el.style.display = 'flex';
        el.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span>⚠️ (مثال توضيحي) يوجد بلاغات مسندة لزملاء آخرين بالخطأ:</span>
          </div>
          <div style="font-size: 10px; color: #fef3c7; background-color: rgba(245, 158, 11, 0.25); padding: 4px 6px; border-radius: 6px;">
            <span>رقم: IM123456 • المفترض لـ: البراء</span>
          </div>
        `;
      }
    },
    onHide: () => {
      const el = document.getElementById('daem-dbpanel-alerts');
      if (el) {
        const origDisplay = el.getAttribute('data-original-display') || 'none';
        const origHtml = el.getAttribute('data-original-html') || '';
        el.style.display = origDisplay;
        el.innerHTML = origHtml;
        el.removeAttribute('data-original-display');
        el.removeAttribute('data-original-html');
      }
    }
  }
];

function startGuidedTour() {
  closeGuidedTour();

  // إنشاء طبقة التظليل الخلفية
  tourOverlay = document.createElement('div');
  tourOverlay.className = 'daem-tour-overlay';
  document.body.appendChild(tourOverlay);

  // إنشاء صندوق التلميحات
  tourTooltip = document.createElement('div');
  tourTooltip.className = 'daem-tour-tooltip';
  document.body.appendChild(tourTooltip);

  currentTourStep = 0;
  showTourStep(currentTourStep);
}

function showTourStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= tourSteps.length) {
    completeTour();
    return;
  }

  // إزالة التحديد السابق واستعادة وضعية التموضع إذا تم تعديلها
  const prevHighlight = document.querySelector('.daem-tour-highlighted');
  if (prevHighlight) {
    prevHighlight.classList.remove('daem-tour-highlighted');
    if (prevHighlight.getAttribute('data-tour-position-modified') === 'true') {
      prevHighlight.style.position = '';
      prevHighlight.removeAttribute('data-tour-position-modified');
    }
  }

  // تشغيل دوال الإخفاء للخطوة السابقة أو التالية لتجنب تعارض الحالة التوضيحية
  if (stepIndex > 0 && tourSteps[stepIndex - 1].onHide) {
    tourSteps[stepIndex - 1].onHide();
  }
  if (stepIndex < tourSteps.length - 1 && tourSteps[stepIndex + 1].onHide) {
    tourSteps[stepIndex + 1].onHide();
  }

  const step = tourSteps[stepIndex];
  if (step.onShow) {
    step.onShow();
  }

  // محاولة تحديد العنصر المستهدف
  let targetEl = null;
  if (step.element) {
    targetEl = document.querySelector(step.element);
  }

  if (targetEl) {
    targetEl.classList.add('daem-tour-highlighted');
    const computedStyle = window.getComputedStyle(targetEl);
    if (computedStyle.position === 'static') {
      targetEl.style.position = 'relative';
      targetEl.setAttribute('data-tour-position-modified', 'true');
    }

    // رفع الداشبورد كلياً في حال كان التحديد داخله أو هو الداشبورد نفسه لكي يظهر كاملاً فوق التعتيم
    const dbPanel = document.getElementById('daem-dashboard-panel');
    if (dbPanel) {
      if (targetEl === dbPanel || dbPanel.contains(targetEl)) {
        dbPanel.classList.add('daem-tour-lifted-z');
      } else {
        dbPanel.classList.remove('daem-tour-lifted-z');
      }
    }

    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    const dbPanel = document.getElementById('daem-dashboard-panel');
    if (dbPanel) {
      dbPanel.classList.remove('daem-tour-lifted-z');
    }
  }

  const isLastStep = stepIndex === tourSteps.length - 1;
  tourTooltip.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(16, 185, 129, 0.2); padding-bottom: 8px;">
        <span style="font-weight: bold; font-size: 13px; color: #10b981; display: flex; align-items: center; gap: 6px;">${step.title}</span>
        <button id="daem-tour-close-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; font-weight: bold; outline: none; padding: 0 4px;">×</button>
      </div>
      <div style="font-size: 11px; line-height: 1.6; color: #e2e8f0;">
        ${step.content}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11px;">
        <span style="color: #94a3b8; font-size: 10px;">خطوة ${stepIndex + 1} من ${tourSteps.length}</span>
        <div style="display: flex; gap: 6px;">
          <button id="daem-tour-skip-btn" style="background: transparent; border: 1px solid rgba(248, 113, 113, 0.4); color: #f87171; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.2s; font-size: 10px; font-weight: bold;">تخطي الجولة</button>
          ${stepIndex > 0 ? `<button id="daem-tour-prev-btn" style="background: #334155; border: none; color: white; border-radius: 6px; padding: 4px 8px; cursor: pointer; transition: all 0.2s; font-size: 10px; font-weight: bold;">السابق</button>` : ''}
          <button id="daem-tour-next-btn" style="background: #10b981; border: none; color: white; border-radius: 6px; padding: 4px 12px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 10px;">${isLastStep ? 'إنهاء الجولة' : 'التالي'}</button>
        </div>
      </div>
    </div>
  `;

  // ربط الأحداث
  document.getElementById('daem-tour-close-btn').addEventListener('click', () => completeTour());
  document.getElementById('daem-tour-skip-btn').addEventListener('click', () => completeTour());
  if (stepIndex > 0) {
    document.getElementById('daem-tour-prev-btn').addEventListener('click', () => {
      if (step.onHide) step.onHide();
      currentTourStep--;
      showTourStep(currentTourStep);
    });
  }
  document.getElementById('daem-tour-next-btn').addEventListener('click', () => {
    if (step.onHide) step.onHide();
    currentTourStep++;
    showTourStep(currentTourStep);
  });

  positionTooltip(targetEl, step.placement);
}

function positionTooltip(targetEl, placement) {
  if (!targetEl) {
    // في حال عدم وجود العنصر، يتم التوسيط في منتصف الشاشة كخيار بديل
    tourTooltip.style.top = '50%';
    tourTooltip.style.left = '50%';
    tourTooltip.style.transform = 'translate(-50%, -50%)';
    tourTooltip.className = 'daem-tour-tooltip';
    tourTooltip.style.visibility = 'visible';
    return;
  }

  // إخفاء مؤقت لإجراء قياس دقيق لحجم التلميح الفعلي
  tourTooltip.style.visibility = 'hidden';
  tourTooltip.style.transform = 'none';

  const rect = targetEl.getBoundingClientRect();
  const tooltipWidth = tourTooltip.offsetWidth || 320;
  const tooltipHeight = tourTooltip.offsetHeight || 150;
  const margin = 15;

  let top = 0;
  let left = 0;
  let arrowClass = 'top';

  if (placement === 'top') {
    top = rect.top - tooltipHeight - margin;
    left = rect.left + (rect.width - tooltipWidth) / 2;
    arrowClass = 'top';
  } else if (placement === 'bottom') {
    top = rect.bottom + margin;
    left = rect.left + (rect.width - tooltipWidth) / 2;
    arrowClass = 'bottom';
  } else if (placement === 'left') {
    top = rect.top + (rect.height - tooltipHeight) / 2;
    left = rect.left - tooltipWidth - margin;
    arrowClass = 'left';
  } else if (placement === 'right') {
    top = rect.top + (rect.height - tooltipHeight) / 2;
    left = rect.right + margin;
    arrowClass = 'right';
  }

  // تعديل الحدود لمنع خروج الصندوق خارج الشاشة
  if (left < 10) left = 10;
  if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
  if (top < 10) top = rect.bottom + margin;
  if (top + tooltipHeight > window.innerHeight - 10) top = window.innerHeight - tooltipHeight - 10;

  tourTooltip.style.top = `${top}px`;
  tourTooltip.style.left = `${left}px`;
  tourTooltip.className = `daem-tour-tooltip ${arrowClass}`;
  tourTooltip.style.visibility = 'visible';
}

function closeGuidedTour() {
  const prevHighlight = document.querySelector('.daem-tour-highlighted');
  if (prevHighlight) {
    prevHighlight.classList.remove('daem-tour-highlighted');
    if (prevHighlight.getAttribute('data-tour-position-modified') === 'true') {
      prevHighlight.style.position = '';
      prevHighlight.removeAttribute('data-tour-position-modified');
    }
  }
  const dbPanel = document.getElementById('daem-dashboard-panel');
  if (dbPanel) {
    dbPanel.classList.remove('daem-tour-lifted-z');
  }
  if (tourOverlay) {
    tourOverlay.remove();
    tourOverlay = null;
  }
  if (tourTooltip) {
    tourTooltip.remove();
    tourTooltip = null;
  }
  // إخفاء التأثيرات التوضيحية
  tourSteps.forEach(step => {
    if (step.onHide) step.onHide();
  });
}

function completeTour() {
  closeGuidedTour();
  safeSetStorage({ daemTourCompleted: true });
}

// ==========================================
// ميزات لوحة تحكم عائمة ذكية (🚀 داعم بلس Premium)
// ==========================================

function findJournalUpdatesElement() {
  // 1. البحث باستخدام التسمية "تحديثات دفتر اليومية"
  const labels = Array.from(document.querySelectorAll('label, span, td, div, label-form'));
  for (const label of labels) {
    const txt = (label.innerText || '').trim();
    if (txt === 'تحديثات دفتر اليومية:' || txt === 'تحديثات دفتر اليومية' || txt.includes('دفتر اليومية') || txt.includes('Journal Updates')) {
      let parent = label.parentElement;
      while (parent && parent !== document.body) {
        // البحث عن textarea أولاً داخل نفس الحاوية
        const textarea = parent.querySelector('textarea');
        if (textarea && (textarea.readOnly || textarea.disabled || textarea.value.includes('Asia/Riyadh'))) {
          return textarea;
        }
        // إذا لم يكن textarea، نبحث عن حاوية div أو pre تحتوي على نصوص التحديثات
        const scrollableDivs = Array.from(parent.querySelectorAll('div, pre, td'));
        for (const div of scrollableDivs) {
          const val = div.innerText || '';
          if (val.includes('Asia/Riyadh') || val.includes('--') || /\d{2}\/\d{2}/.test(val)) {
            return div;
          }
        }
        parent = parent.parentElement;
      }
    }
  }

  // 2. البحث العام عن أي عنصر يحتوي على علامات التحديثات التاريخية (مثل Asia/Riyadh أو Contractor)
  const candidates = Array.from(document.querySelectorAll('textarea, div, pre, td'));
  for (const el of candidates) {
    const val = el.tagName === 'TEXTAREA' ? (el.value || '') : (el.innerText || '');
    if (val.includes('Asia/Riyadh') || val.includes('Contractor') || (val.includes('--') && /\d{2}\/\d{2}/.test(val))) {
      // نضمن ألا يكون هذا هو حقل الكتابة النشط للمستخدم
      if (el.tagName === 'TEXTAREA') {
        if (el.readOnly || el.disabled) {
          return el;
        }
      } else {
        // تجنب الحاويات الضخمة مثل body أو html
        if (el.tagName !== 'BODY' && el.tagName !== 'HTML' && val.length < 5000) {
          return el;
        }
      }
    }
  }
  return null;
}

let lastFocusedElement = null;
document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (el && (
    el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && ['text', 'search', 'url', 'tel', 'email'].includes(el.type)) ||
    el.contentEditable === 'true' ||
    el.getAttribute('contenteditable') === 'true'
  )) {
    lastFocusedElement = el;
  }
});

function getEditableValue(el) {
  if (!el) return "";
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    return el.value || "";
  }
  return el.innerText || "";
}

function setEditableValue(el, val) {
  if (!el) return;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.value = val;
  } else {
    el.innerText = val;
  }
}

function findActiveInput() {
  // 1. استخدام آخر حقل تم التركيز عليه من قبل المستخدم
  if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
    return lastFocusedElement;
  }

  // 2. البحث عن أي حقل textarea نشط ومرئي ومفتوح للكتابة
  const textareas = Array.from(document.querySelectorAll('textarea'));
  const editableTextareas = textareas.filter(ta => !ta.readOnly && !ta.disabled && ta.style.display !== 'none');
  if (editableTextareas.length > 0) {
    for (const ta of editableTextareas) {
      const name = (ta.name || '').toLowerCase();
      const id = (ta.id || '').toLowerCase();
      if (name.includes('update') || name.includes('resolution') || name.includes('sol') || id.includes('update') || id.includes('resolution') || name.includes('desc') || id.includes('desc')) {
        return ta;
      }
    }
    return editableTextareas[0];
  }

  // 3. البحث في عناصر contenteditable
  const contentEditables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
  if (contentEditables.length > 0) {
    return contentEditables[0];
  }

  // 4. البحث في حقول الإدخال النصية (input) المفتوحة للكتابة
  const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
  const editableInputs = inputs.filter(inp => !inp.readOnly && !inp.disabled && inp.style.display !== 'none');
  if (editableInputs.length > 0) {
    return editableInputs[0];
  }

  // 5. البحث داخل أي iframe في الصفحة
  const iframes = Array.from(document.querySelectorAll('iframe'));
  for (const iframe of iframes) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        const subTextareas = Array.from(iframeDoc.querySelectorAll('textarea'));
        const subEditable = subTextareas.filter(ta => !ta.readOnly && !ta.disabled && ta.style.display !== 'none');
        if (subEditable.length > 0) return subEditable[0];

        const subEditables = Array.from(iframeDoc.querySelectorAll('[contenteditable="true"]'));
        if (subEditables.length > 0) return subEditables[0];

        const subInputs = Array.from(iframeDoc.querySelectorAll('input[type="text"]'));
        const subEditableInputs = subInputs.filter(inp => !inp.readOnly && !inp.disabled && inp.style.display !== 'none');
        if (subEditableInputs.length > 0) return subEditableInputs[0];
      }
    } catch (e) {
      // قد يفشل بسبب سياسة المنشأ المشترك (cross-origin)
    }
  }

  return null;
}


function findAssigneeInput() {
  // 1. محاولة استهداف الحقل مباشرة عن طريق اسم الحقل الفريد في نظام HPSM/داعم (instance/assignee.name)
  // هذا المعرف دقيق جداً ولا يتأثر بلغة الواجهة أو بنية الخلايا أو المعرفات الديناميكية
  const hpsmInput = document.querySelector(
    'input[name="instance/assignee.name"], textarea[name="instance/assignee.name"], [dvdvar="instance/assignee.name"], input[name*="assignee.name"], textarea[name*="assignee.name"], [dvdvar*="assignee.name"]'
  );
  if (hpsmInput) return hpsmInput;

  // 2. محاولة استهداف الحقل مباشرة عن طريق رقم الحقل الثابت في نظام ريميدي (1000000322 = المعين له)
  const remedyInput = document.querySelector(
    'input[id*="1000000322"], textarea[id*="1000000322"], [id*="1000000322"] input, [id*="1000000322"] textarea, input[name*="1000000322"], textarea[name*="1000000322"]'
  );
  if (remedyInput) return remedyInput;

  const normalize = (str) => {
    if (!str) return "";
    return str
      .replace(/[\u064B-\u065F]/g, "") // إزالة التشكيل
      .replace(/[ىی]/g, "ي")           // توحيد الياء
      .replace(/[أإآ]/g, "ا")          // توحيد الألف
      .replace(/\s+/g, " ")            // توحيد المسافات والمحارف غير المرئية (مثل &nbsp;)
      .trim();
  };

  const labels = Array.from(document.querySelectorAll('label, span, td, div'));
  for (const label of labels) {
    // التحقق من أن التسمية مرئية لتفادي العناصر المخفية في الواجهة
    if (label.offsetWidth === 0 && label.offsetHeight === 0) {
      continue;
    }

    const rawTxt = label.innerText || '';
    const normTxt = normalize(rawTxt);
    const lowerTxt = normTxt.toLowerCase();

    // تخطي أي تسميات تحتوي على "مجموعة" أو "group" لمنع استهداف مجموعة التعيين بالخطأ
    if (lowerTxt.includes('group') || lowerTxt.includes('مجموع')) {
      continue;
    }

    if (lowerTxt === 'المستقبل' || lowerTxt === 'المستقبل:' ||
      lowerTxt === 'المعين له' || lowerTxt === 'المعين له:' ||
      lowerTxt === 'معين له' || lowerTxt === 'معين له:' ||
      lowerTxt.includes('معين له') || lowerTxt.includes('المعين له') ||
      lowerTxt === 'assignee' || lowerTxt.includes('assignee')) {

      // أ. التحقق من سمة for المباشرة للعلامة
      if (label.htmlFor) {
        const input = document.getElementById(label.htmlFor);
        if (input) return input;
      }
      if (typeof label.getAttribute === 'function') {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          const input = document.getElementById(forAttr);
          if (input) return input;
        }
      }

      // ب. البحث في نفس خلية الجدول أو الحاوية أولاً (قد يكون المدخل بداخلها مباشرة)
      const container = label.closest('td, div');
      if (container) {
        const selfInput = container.querySelector('input, textarea, select');
        if (selfInput) return selfInput;

        // ج. البحث في الخلايا/الحاويات المجاورة مباشرة بالترتيب
        let sibling = container.nextElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input, textarea, select') ||
            (['INPUT', 'TEXTAREA', 'SELECT'].includes(sibling.tagName) ? sibling : null);
          if (input) return input;
          sibling = sibling.nextElementSibling;
        }
      }

      // د. حل احتياطي أضيق: البحث في الأب المباشر فقط لكي لا ننتقل لأسطر أخرى
      const parent = label.parentElement;
      if (parent && parent !== document.body) {
        const inputs = Array.from(parent.querySelectorAll('input, textarea, select'));
        const visibleInputs = inputs.filter(inp => inp.style.display !== 'none' && inp.type !== 'hidden');
        if (visibleInputs.length > 0) {
          return visibleInputs[0];
        }
      }
    }
  }

  // استثناء حقول المجموعات (group) لتفادي استهداف مجموعة التعيين بالخطأ
  let el = document.querySelector(
    'textarea[id*="assignee"]:not([id*="group"]):not([id*="Group"]), input[id*="assignee"]:not([id*="group"]):not([id*="Group"]), ' +
    'textarea[name*="assignee"]:not([name*="group"]):not([name*="Group"]), input[name*="assignee"]:not([name*="group"]):not([name*="Group"]), ' +
    'textarea[id*="receiver"]:not([id*="group"]):not([id*="Group"]), input[id*="receiver"]:not([id*="group"]):not([id*="Group"]), ' +
    'textarea[name*="receiver"]:not([name*="group"]):not([name*="Group"]), input[name*="receiver"]:not([name*="group"]):not([name*="Group"])'
  );
  if (el) return el;
  return null;
}

// دالة مساعدة لتعبئة قيم الحقول وإطلاق جميع أحداث المتصفح والكيبورد لضمان استجابة نظام ريميدي
function triggerElementChangeEvents(element, value) {
  if (!element) return;

  element.focus();
  element.value = value;

  // إطلاق حدث الإدخال
  element.dispatchEvent(new Event('input', { bubbles: true }));

  // محاكاة ضغطات الأزرار (Enter و Tab) لتفعيل الروابط النشطة الخاصة بـ Remedy
  const keyEvents = [
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13, which: 13 }),
    new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13, which: 13 }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13, which: 13 }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab', keyCode: 9, which: 9 }),
    new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Tab', keyCode: 9, which: 9 }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Tab', keyCode: 9, which: 9 })
  ];

  keyEvents.forEach(evt => element.dispatchEvent(evt));

  // إطلاق حدث التغيير
  element.dispatchEvent(new Event('change', { bubbles: true }));

  // إزالة التركيز وإطلاق حدث الخروج (الذي يبدأ عملية التحقق وجلب الاسم في ريميدي)
  element.blur();
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

function extractLatestUpdate(fullText) {
  if (!fullText) return '';
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  let latestLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // تحديد ما إذا كان السطر يمثل ترويسة/بيانات وصفية (اسم الموظف، التوقيت، المنطقة الزمنية)
    const isHeader = line.includes('Asia/Riyadh') || line.includes('|') || line.includes('--') || /\d{2}\/\d{2}\/\d{2}/.test(line) || line.includes('Contractor');

    if (isHeader) {
      if (latestLines.length > 0) {
        // إذا كنا قد جمعنا أسطر التحديث الأول ووصلنا للترويسة التالية، نتوقف هنا
        break;
      }
      continue;
    }
    latestLines.push(line);
  }

  return latestLines.join('\n').trim();
}

function getTicketNumber() {
  const titleMatch = document.title.match(/IM\d{5,10}/);
  if (titleMatch) return titleMatch[0];

  const inputs = Array.from(document.querySelectorAll('input'));
  for (const input of inputs) {
    const val = (input.value || '').trim();
    const match = val.match(/^IM\d{5,10}$/);
    if (match) return match[0];
  }

  // fallback to searching inside frames recursively using queryAllInPage
  const pageInputs = queryAllInPage('input');
  for (const input of pageInputs) {
    const val = (input.value || '').trim();
    const match = val.match(/^IM\d{5,10}$/);
    if (match) return match[0];
  }

  return '';
}

// التحقق مما إذا كان البلاغ مسجلاً مسبقاً في قاعدة بياناتنا (Notion/Supabase)
function isTicketAlreadyRegistered(ticketId) {
  if (!ticketId) return false;
  return websiteTickets.some(t => {
    const n = String(t.number || t.ticketNumber || t.ticket_number || "").trim();
    return n && (n.includes(ticketId) || ticketId.includes(n));
  });
}

function getClassification() {
  // 1. البحث عن خلية تحتوي على نص "التصنيف" والتقاط حقل الإدخال في الخلية المجاورة (سواء السابقة أو التالية)
  const cells = Array.from(document.querySelectorAll('td, label, span'));
  for (const cell of cells) {
    const txt = (cell.innerText || '').trim();
    if (txt === 'التصنيف:' || txt === 'التصنيف' || txt === 'Category:' || txt === 'Category') {
      let cellTd = cell;
      while (cellTd && cellTd.tagName !== 'TD' && cellTd !== document.body) {
        cellTd = cellTd.parentElement;
      }

      if (cellTd && cellTd.tagName === 'TD') {
        let input = null;

        // تفقد الخلية السابقة (تخطيط RTL المعتاد)
        const prevTd = cellTd.previousElementSibling;
        if (prevTd) {
          input = prevTd.querySelector('input[type="text"], select');
        }

        // تفقد الخلية التالية (في حال كان التخطيط LTR أو معكوساً برمجياً)
        if (!input) {
          const nextTd = cellTd.nextElementSibling;
          if (nextTd) {
            input = nextTd.querySelector('input[type="text"], select');
          }
        }

        if (input && input.value && input.value.trim() !== '') {
          const val = input.value.trim();
          if (val.toLowerCase() !== 'incident') {
            return val;
          }
        }
      }
    }
  }

  // 2. البحث البديل: إعطاء الأولوية لـ subcategory أو product.type (لأنها تعني التصنيف الفعلي)
  const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (
      (name.includes('subcategory') || id.includes('subcategory') || name.includes('product') || id.includes('product')) &&
      !name.includes('group') && !id.includes('group')
    ) {
      if (input.value && input.value.trim() !== '') {
        return input.value.trim();
      }
    }
  }

  // 3. كخيار أخير: حقل category بشرط ألا تكون قيمته incident أو group
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (
      (name.includes('category') || id.includes('category')) &&
      !name.includes('group') && !id.includes('group') &&
      !name.includes('type') && !id.includes('type')
    ) {
      const val = (input.value || '').trim();
      if (val !== '' && val.toLowerCase() !== 'incident') {
        return val;
      }
    }
  }
  return '';
}

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

// حساب الموظف الذي عليه الدور حسب نفس خوارزمية التوزيع باللوحة الرئيسية
function getLeastReceiver() {
  if (!window.daemTicketsFetched) {
    return null;
  }
  const priorityOrder = [
    { name: 'البراء النصيان', user: 'a.alnesayan' },
    { name: 'عبدالرحمن العمري', user: 'af.alamri' },
    { name: 'عزام الحربي', user: 'azz.alharbi' },
    { name: 'محمد الربيش', user: 'mialrubaish' },
    { name: 'صالح الغصن', user: 's.alghosen' },
    { name: 'طارق الهدياني', user: 't.alhedyani' },
    { name: 'ثامر المنصور', user: 't.almansour' }
  ];

  const counts = {};
  priorityOrder.forEach(emp => {
    counts[emp.name] = 0;
  });

  const baseTickets = websiteTickets.filter(t =>
    t.date &&
    t.date >= '2026-04-04' &&
    t.type !== 'تحديث نظام' &&
    t.type !== 'تحديثات النظام' &&
    !(t.number && t.number.includes('📢'))
  );

  baseTickets.forEach(t => {
    const receiver = (t.receiver || '').trim();
    if (!receiver || receiver === 'غير حدد' || receiver === 'غير محدد') return;

    const matched = priorityOrder.find(p =>
      receiver.includes(p.name.split(' ')[0]) ||
      p.name.includes(receiver.split(' ')[0])
    );

    if (matched) {
      counts[matched.name]++;
    }
  });

  let bestCandidate = priorityOrder[0];
  let minCount = counts[bestCandidate.name];

  for (const emp of priorityOrder) {
    if (counts[emp.name] < minCount) {
      minCount = counts[emp.name];
      bestCandidate = emp;
    }
  }

  return bestCandidate;
}

// تحديث نص زر التوزيع بناءً على الموظف المستلم
function updateSubmitButtonText(nextEmployee) {
  const btnCopy = document.getElementById('btn-copy-new-ticket');
  if (!btnCopy) return;
  const isRobaish = nextEmployee && (nextEmployee.name.includes('محمد الربيش') || nextEmployee.name.includes('الربيش'));
  const linkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px; vertical-align: middle;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
  btnCopy.innerHTML = isRobaish ? `${linkIcon} إسناد البلاغ تلقائياً لـ Notion والترتيب` : `${linkIcon} إسناد البلاغ تلقائياً لـ Supabase والترتيب`;

  const labelNextEmp = document.getElementById('daem-panel-next-employee-value');
  if (labelNextEmp) {
    labelNextEmp.innerText = nextEmployee ? `${nextEmployee.name}` : 'جاري الحساب...';
  }

  const labelAssigneeId = document.getElementById('daem-panel-assignee-id-value');
  if (labelAssigneeId) {
    const assigneeInput = findAssigneeInput();
    labelAssigneeId.innerText = assigneeInput ? (assigneeInput.id || assigneeInput.name || 'مكتشف بدون معرف') : 'لم يتم كشف الحقل';
  }

  // تحديث نافذة المطور التفصيلية
  try {
    updateDebugInfo();
  } catch (e) {
    console.error("Daem Plus Debug Info Update Error:", e);
  }
}

// دالة تفصيلية لجمع بيانات الهيكل لخدمة المطور
function updateDebugInfo() {
  const debugDiv = document.getElementById('daem-debug-info');
  if (!debugDiv) return;

  let html = "";

  // جلب أول 3 تسميات تتعلق بـ معين/تعيين/مستقبل
  const allLabels = Array.from(document.querySelectorAll('label, span, td, div'));
  const targetLabels = allLabels.filter(el => {
    if (el.children.length > 2) return false;
    const txt = (el.innerText || '').trim();
    if (!txt) return false;
    return txt.includes('معين') || txt.includes('تعيين') || txt.toLowerCase().includes('assign') || txt.toLowerCase().includes('receiv');
  }).slice(0, 3);

  html += `<b>Labels:</b><br>`;
  targetLabels.forEach((l, idx) => {
    html += `[${idx}] "${l.innerText.trim().substring(0, 15)}" ID:${l.id || 'N/A'}<br>`;
  });

  // جلب أول 4 حقول إدخال مرئية
  const inputs = Array.from(document.querySelectorAll('input, textarea'));
  const visibleInputs = inputs.filter(inp => inp.style.display !== 'none' && inp.type !== 'hidden').slice(0, 4);

  html += `<b>Inputs:</b><br>`;
  visibleInputs.forEach((inp) => {
    const labelText = getLabelForInput(inp);
    html += `ID:${inp.id || 'N/A'} | V:${(inp.value || '').trim().substring(0, 10)} | L:${labelText}<br>`;
  });

  debugDiv.innerHTML = html;
}

function getLabelForInput(input) {
  if (input.id) {
    const lbl = document.querySelector(`label[for="${input.id}"]`);
    if (lbl) return lbl.innerText.trim().substring(0, 10);
  }
  let parent = input.parentElement;
  for (let i = 0; i < 2 && parent; i++) {
    const text = (parent.innerText || '').replace(input.value || '', '').trim();
    if (text) return text.substring(0, 10);
    parent = parent.parentElement;
  }
}

// دالة للبحث والضغط على زر حفظ وخروج في صفحة النظام تلقائياً
function clickSaveAndExit() {
  return globalClickSaveAndExit();
}

// إدراج نص ولصقه وتنبيه المستخدم
function insertTextToField(text) {
  const activeInput = findActiveInput();
  if (activeInput) {
    activeInput.value = text;
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    activeInput.focus();
    showFloatingNotification("تم نسخ النص ولصقه بنجاح! ⚡");
  } else {
    navigator.clipboard.writeText(text).catch(() => { });
    showFloatingNotification("تعذر اللصق التلقائي؛ تم نسخ النص للحافظة! 📋");
  }
}

function showFloatingNotification(msg) {
  let targetDoc = document;

  // إزالة أي تنبيهات سابقة لتفادي التراكم والتداخل
  const oldToasts = targetDoc.querySelectorAll('.daem-floating-toast');
  oldToasts.forEach(t => t.remove());

  const toast = targetDoc.createElement('div');
  toast.className = 'daem-floating-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '100px';
  toast.style.right = '30px';
  toast.style.backgroundColor = '#10b981';
  toast.style.color = '#fff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.fontFamily = 'Cairo, sans-serif';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = 'bold';
  toast.style.boxShadow = '0 10px 25px rgba(16,185,129,0.3)';
  toast.style.zIndex = '999999';
  toast.style.direction = 'rtl';
  toast.style.transition = 'all 0.3s ease';
  toast.innerText = msg;

  const targetBody = targetDoc.body || targetDoc.documentElement;
  if (targetBody) {
    targetBody.appendChild(toast);
  }

  // جدولة الحذف من سياق الـ content script مباشرة لضمان عمل المؤقت حتى داخل الـ iframe
  setTimeout(() => {
    try {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    } catch (err) { }
    setTimeout(() => {
      try {
        toast.remove();
      } catch (err) { }
    }, 300);
  }, 2500);
}

// إنشاء وحقن لوحة التحكم العائمة في الصفحة
function injectFloatingPanel() {
  try {
    if (!chrome.runtime || !chrome.runtime.id) return;
  } catch (e) {
    return;
  }

  // تجنب تكرار حقن اللوحة في النافذة الرئيسية (Parent) إذا كان هناك إطار داخلي (Iframe) يحتوي على تفاصيل البلاغ
  if (window === window.top && document.querySelector('iframe')) {
    const existingPanel = document.getElementById('daem-premium-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    return;
  }

  // نتأكد من أننا في الصفحة التفصيلية للتذكرة (وليس قائمة البحث أو الصفحات الأخرى)
  const ticketId = getTicketNumber();
  const existingPanel = document.getElementById('daem-premium-panel');

  if (!ticketId || isListPage()) {
    if (existingPanel) {
      existingPanel.remove();
    }
    return;
  }

  if (existingPanel) {
    const savedId = existingPanel.getAttribute('data-ticket-id');
    if (savedId === ticketId) {
      return;
    } else {
      existingPanel.remove();
    }
  }

  const panel = document.createElement('div');
  panel.id = 'daem-premium-panel';
  panel.setAttribute('data-ticket-id', ticketId);
  panel.style.position = 'fixed';
  panel.style.bottom = '30px';
  panel.style.right = '30px';
  panel.style.width = '310px';
  panel.style.backgroundColor = '#ffffff';
  panel.style.backdropFilter = 'blur(20px)';
  panel.style.webkitBackdropFilter = 'blur(20px)';
  panel.style.border = '1.5px solid rgba(16, 185, 129, 0.4)';
  panel.style.borderRadius = '16px';
  panel.style.boxShadow = '0 8px 32px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.08)';
  panel.style.zIndex = '999998';
  panel.style.fontFamily = 'Cairo, Arial, sans-serif';
  panel.style.direction = 'rtl';
  panel.style.overflow = 'hidden';
  panel.style.transition = 'width 0.3s ease, height 0.3s ease, box-shadow 0.3s ease';

  // حساب الموظف الذي عليه الدور تلقائياً ومواءمة نص الزر
  const nextEmployee = getLeastReceiver();
  const isRobaish = nextEmployee && (nextEmployee.name.includes('محمد الربيش') || nextEmployee.name.includes('الربيش'));
  const dynamicBtnText = isRobaish ? '🔗 إسناد البلاغ تلقائياً لـ Notion والترتيب' : '🔗 إسناد البلاغ تلقائياً لـ Supabase والترتيب';

  // قالب واجهة المستخدم
  panel.innerHTML = `
    <style>
      #daem-premium-panel .dp-btn {
        background: #10b981; color: #ffffff;
        border: none; padding: 9px 12px;
        border-radius: 9px; font-weight: bold; cursor: pointer;
        text-align: right; display: flex; align-items: center; gap: 8px;
        transition: all 0.2s ease; font-size: 11.5px; width: 100%;
        font-family: Cairo, Arial, sans-serif;
      }
      #daem-premium-panel .dp-btn:hover { background: #059669; transform: translateX(-2px); }
      #daem-premium-panel .dp-btn-red { background: #10b981; color: #ffffff; }
      #daem-premium-panel .dp-btn-red:hover { background: #059669; }
      #daem-premium-panel .dp-btn-green { background: #059669; color: #ffffff; border: none; }
      #daem-premium-panel .dp-btn-green:hover { background: #047857; }
      #daem-premium-panel::-webkit-scrollbar { display: none; }
      #daem-premium-panel *::-webkit-scrollbar { display: none; }
      #daem-premium-panel { scrollbar-width: none; }
      #daem-premium-panel * { scrollbar-width: none; }
      #daem-premium-panel .dp-icon { display: inline-block; filter: grayscale(1) brightness(0) invert(1); }
      #daem-premium-panel select { appearance: auto; -webkit-appearance: auto; }
    </style>

    <!-- الهيدر -->
    <div style="background: linear-gradient(135deg, #10b981, #059669); border-bottom: 1px solid #059669; padding: 11px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;" id="daem-panel-header">
      <span style="font-weight: bold; font-size: 13.5px; display: flex; align-items: center; gap: 7px; pointer-events: none; color: #ffffff;">
        🚀 داعم بلس Premium
      </span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span id="daem-panel-toggle" style="font-size: 15px; font-weight: bold; color: #ffffff;">−</span>
        <span id="daem-panel-close" style="font-size: 17px; font-weight: bold; line-height: 1; color: #ffffff; padding: 0 2px; border-radius: 4px; pointer-events: all; cursor: pointer;" title="إخفاء اللوحة">×</span>
      </div>
    </div>

    <div id="daem-panel-body" style="padding: 12px; display: flex; flex-direction: column; gap: 8px; transition: all 0.3s ease; max-height: calc(100vh - 100px); overflow-y: auto;">

      <!-- بطاقة معلومات البلاغ -->
      <div id="daem-panel-ticket-info" style="background: #f0fdf4; border-radius: 10px; padding: 11px 13px; border: 1px solid rgba(16,185,129,0.25); font-size: 12px; color: #374151; display: flex; flex-direction: column; gap: 7px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-size: 10px;">رقم البلاغ:</span>
          <span style="color: #059669; font-weight: bold; font-size: 15px;">${ticketId}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(16,185,129,0.15); padding-top: 6px;">
          <span style="color: #6b7280; font-size: 10px;">مدة فتح البلاغ:</span>
          <span id="daem-panel-duration-value" style="color: #059669; font-weight: bold; font-size: 11px;">🕒 جاري حساب المدة...</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(16,185,129,0.15); padding-top: 6px;">
          <span style="color: #6b7280; font-size: 10px;">المستقبل القادم (الدور عليه):</span>
          <span id="daem-panel-next-employee-value" style="color: #ffffff; font-weight: bold; font-size: 11px; background: #10b981; padding: 2px 9px; border-radius: 20px; border: 1px solid #059669;">${nextEmployee ? `${nextEmployee.name}` : 'جاري الحساب...'}</span>
        </div>
      </div>

      <!-- تنبيه تحويل البلاغ -->
      <div id="daem-panel-transfer-warning" style="background: #ecfdf5; border: 1px solid rgba(16,185,129,0.4); border-radius: 9px; padding: 9px 12px; font-size: 11px; color: #065f46; display: none; align-items: center; gap: 6px; font-weight: bold; line-height: 1.4;"></div>

      <!-- تنبيه بلاغ من الوزارة -->
      <div id="daem-panel-ministry-warning" style="background: #ecfdf5; border: 1px solid rgba(16,185,129,0.4); border-radius: 9px; padding: 9px 12px; font-size: 11px; color: #065f46; display: none; align-items: center; gap: 6px; font-weight: bold; line-height: 1.4;"></div>

      <!-- مفتاح الجهة -->
      <div style="display: flex; background: #f0fdf4; border-radius: 9px; padding: 3px; border: 1.5px solid rgba(16,185,129,0.3);">
        <button id="target-beneficiary" style="flex: 1; background: #10b981; color: white; border: none; padding: 7px; border-radius: 7px; font-weight: bold; cursor: pointer; font-size: 11px; transition: all 0.2s; font-family: Cairo, Arial, sans-serif;">
          <span class="dp-icon">👤</span> المستفيد
        </button>
        <button id="target-office" style="flex: 1; background: transparent; color: #6b7280; border: none; padding: 7px; border-radius: 7px; font-weight: bold; cursor: pointer; font-size: 11px; transition: all 0.2s; font-family: Cairo, Arial, sans-serif;">
          <span class="dp-icon" style="filter: none;">🏢</span> المكتب الهندسي
        </button>
      </div>

<!-- تغيير حالة البلاغ -->
      <div style="background: #f0fdf4; border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 10px 12px;">
        <div style="font-size: 10px; color: #6b7280; margin-bottom: 6px; font-weight: bold;">🔄 تغيير حالة البلاغ:</div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <select id="dp-status-select" style="flex: 1; padding: 7px 8px; border-radius: 7px; border: 1.5px solid rgba(16,185,129,0.35); background: white; font-family: Cairo, Arial, sans-serif; font-size: 11px; color: #374151; direction: rtl; outline: none; cursor: pointer; box-sizing: border-box;">
            <option value="">-- اختر الحالة --</option>
          </select>
          <button id="btn-change-status" style="background: #10b981; color: white; border: none; padding: 7px 11px; border-radius: 7px; font-weight: bold; cursor: pointer; font-size: 11px; white-space: nowrap; font-family: Cairo, Arial, sans-serif; transition: all 0.2s;">تغيير</button>
        </div>
      </div>

      <button id="btn-copy-latest" class="dp-btn"><span class="dp-icon">📋</span> دمج وتحديث البلاغ</button>
      <button id="btn-close-no-reply" class="dp-btn dp-btn-red"><span class="dp-icon">❌</span> إغلاق لعدم الرد</button>
      <button id="btn-solved-feedback" class="dp-btn dp-btn-green"><span class="dp-icon">✅</span> تمت المعالجة بالإفادة</button>

      <button id="btn-copy-new-ticket" style="background: #f59e0b; color: white; border: none; padding: 9px 12px; border-radius: 9px; font-weight: bold; cursor: pointer; text-align: right; display: none; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 11.5px; width: 100%; font-family: Cairo, Arial, sans-serif; box-sizing: border-box;">
        ${dynamicBtnText}
      </button>

      <button id="btn-fill-copied" style="background: #ecfdf5; color: #065f46; border: 1.5px solid rgba(16,185,129,0.35); padding: 9px 12px; border-radius: 9px; font-weight: bold; cursor: pointer; text-align: right; display: none; align-items: center; gap: 8px; font-size: 11.5px; width: 100%; font-family: Cairo, Arial, sans-serif; transition: all 0.2s; box-sizing: border-box;">
        📥 تعبئة وإسناد البلاغ المنسوخ
      </button>
    </div>
  `;

  const targetBody = document.body || document.documentElement;
  if (targetBody) {
    targetBody.appendChild(panel);
  }

  // تحديث تنبيه تحويل البلاغ وتحديث نص ومعرف زر التوزيع فوراً بعد الحقن
  updatePanelTransferWarning();
  updateSubmitButtonText(nextEmployee);
  refreshAutoAssignButtonVisibility();

  const isDashboard = window.location.href.includes('tickets-daem.vercel.app') ||
    window.location.href.includes('localhost');
  const btnCopy = document.getElementById('btn-copy-new-ticket');
  if (isDashboard && btnCopy) {
    btnCopy.style.display = 'none';
  }

  // أنماط تحسين تفاعل الأزرار
  const style = document.createElement('style');
  style.innerHTML = `
    #daem-premium-panel button:hover {
      filter: brightness(1.15) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important;
    }
    #daem-premium-panel button:active {
      transform: translateY(0px) !important;
    }
  `;
  const targetHead = document.head || document.documentElement;
  if (targetHead) {
    targetHead.appendChild(style);
  }

  // إدارة حالة الجهة المستهدفة بالتبديل
  let targetType = 'beneficiary'; // beneficiary or office

  const btnBeneficiary = document.getElementById('target-beneficiary');
  const btnOffice = document.getElementById('target-office');

  safeGetStorage(['daemTargetType'], (result) => {
    if (result && result.daemTargetType) {
      targetType = result.daemTargetType;
      updateTargetUI();
    }
  });

  function updateTargetUI() {
    const officeIcon = btnOffice.querySelector('.dp-icon');
    const beneficiaryIcon = btnBeneficiary.querySelector('.dp-icon');
    if (targetType === 'beneficiary') {
      btnBeneficiary.style.backgroundColor = '#10b981';
      btnBeneficiary.style.color = 'white';
      if (beneficiaryIcon) beneficiaryIcon.style.filter = 'grayscale(1) brightness(0) invert(1)';
      btnOffice.style.backgroundColor = 'transparent';
      btnOffice.style.color = '#6b7280';
      if (officeIcon) officeIcon.style.filter = 'none';
    } else {
      btnOffice.style.backgroundColor = '#10b981';
      btnOffice.style.color = 'white';
      if (officeIcon) officeIcon.style.filter = 'grayscale(1) brightness(0) invert(1)';
      btnBeneficiary.style.backgroundColor = 'transparent';
      btnBeneficiary.style.color = '#6b7280';
      if (beneficiaryIcon) beneficiaryIcon.style.filter = 'none';
    }
  }

  btnBeneficiary.addEventListener('click', () => {
    targetType = 'beneficiary';
    safeSetStorage({ daemTargetType: 'beneficiary' });
    updateTargetUI();
  });

  btnOffice.addEventListener('click', () => {
    targetType = 'office';
    safeSetStorage({ daemTargetType: 'office' });
    updateTargetUI();
  });

  // تعبئة قائمة الحالات وربط زر التغيير
  const dpStatusSelect = document.getElementById('dp-status-select');
  const websiteStatuses = ['بلاغ جديد', 'بانتظار المستفيد', 'لدى الوزارة', 'مشكلة عامة', 'لم يتم الحل', 'تم الحل'];
  websiteStatuses.forEach(s => {
    const o = document.createElement('option');
    o.value = s;
    o.textContent = s;
    dpStatusSelect.appendChild(o);
  });

  document.getElementById('btn-change-status').addEventListener('click', () => {
    const newStatus = dpStatusSelect.value;
    if (!newStatus) { showFloatingNotification('⚠️ يرجى اختيار الحالة أولاً'); return; }
    const tId = getTicketNumber();
    if (!tId) { showFloatingNotification('⚠️ لم يتم تحديد رقم البلاغ'); return; }
    showFloatingNotification('⏳ جاري تحديث الحالة في الموقع...');
    safeSendMessage({ action: 'UPDATE_SOLUTION', data: { number: tId, solution: newStatus } }, (res) => {
      if (res && res.success) {
        showFloatingNotification(`✅ تم تحديث الحالة إلى: ${newStatus}`);
      } else {
        showFloatingNotification('⚠️ فشل تحديث الحالة في الموقع');
      }
    });
  });

  // منطق تصغير وتكبير اللوحة وسحبها
  const header = document.getElementById('daem-panel-header');
  const body = document.getElementById('daem-panel-body');
  const toggleBtn = document.getElementById('daem-panel-toggle');

  let isCollapsed = false;
  let isDragging = false;
  let hasMoved = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // استرجاع موضع اللوحة المحفوظ مع التحقق من الحدود لمنع خروجها عن الشاشة
  safeGetStorage(['panelPosition'], (result) => {
    if (result && result.panelPosition) {
      let savedX = result.panelPosition.x; // left
      let savedY = result.panelPosition.y; // top

      const adjustPosition = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const panelWidth = panel.offsetWidth || 300;
        // حساب الارتفاع الحقيقي ديناميكياً بدلاً من 350px لمنع خروج الأزرار السفلية عن نطاق الرؤية
        const panelHeight = panel.offsetHeight || 520;

        // التأكد من بقاء الموضع داخل حدود الشاشة المرئية تماماً
        let x = Math.max(10, Math.min(savedX, viewportWidth - panelWidth - 10));
        let y = Math.max(10, Math.min(savedY, viewportHeight - panelHeight - 10));

        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
      };

      adjustPosition();
      // إعادة الضبط بعد فترات وجيزة للتأكد من حساب الارتفاع الحقيقي بعد رندرة التنبيهات
      setTimeout(adjustPosition, 100);
      setTimeout(adjustPosition, 500);
    }
  });

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('mousemove', drag);

  function dragStart(e) {
    if (e.target.id === 'daem-panel-toggle') return;
    if (e.target.id === 'daem-panel-close') return;

    const rect = panel.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;

    isDragging = true;
    hasMoved = false;
  }

  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    const rect = panel.getBoundingClientRect();
    safeSetStorage({ panelPosition: { x: rect.left, y: rect.top } });
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    let x = e.clientX - initialX;
    let y = e.clientY - initialY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = panel.offsetWidth || 300;
    const panelHeight = panel.offsetHeight || 520;

    // تقييد الحركة داخل أبعاد الشاشة لمنع الخروج نهائياً
    x = Math.max(10, Math.min(x, viewportWidth - panelWidth - 10));
    y = Math.max(10, Math.min(y, viewportHeight - panelHeight - 10));

    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';

    hasMoved = true;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  header.addEventListener('click', (e) => {
    // إذا تحركت اللوحة (حدث سحب)، نمنع تكبير/تصغير اللوحة
    if (hasMoved) {
      hasMoved = false;
      return;
    }

    const rectBefore = panel.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // تحديد ما إذا كانت اللوحة في النصف السفلي من الشاشة بناءً على مركزها الرأسي
    const isInBottomHalf = (rectBefore.top + rectBefore.height / 2) > (viewportHeight / 2);
    const oldHeight = rectBefore.height;

    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      body.style.display = 'none';
      panel.style.width = '180px';
      toggleBtn.innerText = '+';
    } else {
      body.style.display = 'flex';
      panel.style.width = '300px';
      toggleBtn.innerText = '−';
    }

    // قياس الارتفاع الجديد بعد التحديث لتعديل الموضع
    const rectAfter = panel.getBoundingClientRect();
    const newHeight = rectAfter.height;
    const heightDiff = newHeight - oldHeight;

    if (isInBottomHalf) {
      // إذا كانت في النصف السفلي، نعدل موضع y للأعلى/للأسفل لتظهر وكأنها تنمو للأعلى أو تتقلص للأسفل
      const currentTop = parseFloat(panel.style.top) || rectBefore.top;
      let targetTop = currentTop - heightDiff;

      // التأكد من بقائها داخل الحدود المرئية للمتصفح
      targetTop = Math.max(10, Math.min(targetTop, viewportHeight - newHeight - 10));
      panel.style.top = targetTop + 'px';

      const currentLeft = parseFloat(panel.style.left) || rectBefore.left;
      safeSetStorage({ panelPosition: { x: currentLeft, y: targetTop } });
    } else {
      // إذا كانت في النصف العلوي وتمددت لأسفل، نتأكد ألا تتجاوز الحد السفلي للمتصفح
      const currentTop = parseFloat(panel.style.top) || rectBefore.top;
      let targetTop = currentTop;
      if (targetTop + newHeight > viewportHeight - 10) {
        targetTop = viewportHeight - newHeight - 10;
        panel.style.top = targetTop + 'px';
        const currentLeft = parseFloat(panel.style.left) || rectBefore.left;
        safeSetStorage({ panelPosition: { x: currentLeft, y: targetTop } });
      }
    }
  });

  // حدث: إغلاق (إخفاء) اللوحة وإظهار أيقونة صغيرة لاسترجاعها
  document.getElementById('daem-panel-close').addEventListener('click', (e) => {
    e.stopPropagation();
    panel.style.display = 'none';

    const restoreBtn = document.createElement('div');
    restoreBtn.id = 'daem-panel-restore';
    restoreBtn.title = 'إظهار لوحة داعم بلس';
    restoreBtn.style.cssText = `
      position: fixed; bottom: 30px; right: 30px; width: 44px; height: 44px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 999998; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      font-size: 22px; color: white; user-select: none;
    `;
    restoreBtn.innerText = '🚀';
    restoreBtn.addEventListener('click', () => {
      panel.style.display = '';
      restoreBtn.remove();
    });
    document.body.appendChild(restoreBtn);
  });

  // حدث: دمج آخر تحديث
  document.getElementById('btn-copy-latest').addEventListener('click', () => {
    const journalEl = findJournalUpdatesElement();
    if (!journalEl) {
      showFloatingNotification("لم يتم العثور على صندوق التحديثات بالصفحة! ⚠️");
      return;
    }
    const rawText = journalEl.value || '';
    const lastUpdateText = extractLatestUpdate(rawText);

    if (!lastUpdateText) {
      showFloatingNotification("لا توجد تحديثات سابقة لنسخها! ⚠️");
      return;
    }

    const suffix = targetType === 'beneficiary' ? 'المستفيد' : 'المكتب الهندسي';
    const formatted = `${lastUpdateText}\nوإفادة ${suffix} بذلك`;
    insertTextToField(formatted);
  });

  // حدث: إغلاق لعدم الرد
  document.getElementById('btn-close-no-reply').addEventListener('click', () => {
    const suffix = targetType === 'beneficiary' ? 'المستفيد' : 'المكتب الهندسي';
    insertTextToField(`لم يتم الرد من قبل ${suffix}`);
  });

  // حدث: تمت المعالجة بالإفادة
  document.getElementById('btn-solved-feedback').addEventListener('click', () => {
    const suffix = targetType === 'beneficiary' ? 'المستفيد' : 'المكتب الهندسي';
    insertTextToField(`تمت المعالجة بناءً على إفادة ${suffix}`);
  });


  // حدث: نسخ البيانات وإنشاء البلاغ في الموقع تلقائياً في الخلفية
  document.getElementById('btn-copy-new-ticket').addEventListener('click', async () => {
    const ticketId = getTicketNumber();
    const category = getClassification() || "أخرى";

    if (!ticketId) {
      showFloatingNotification("فشل تحديد رقم التذكرة بالصفحة! ⚠️");
      return;
    }

    let tickets = websiteTickets;
    if (!tickets || tickets.length === 0) {
      showFloatingNotification("جاري التحقق من بيانات التوزيع اللحظية... ⏳");
      // محاولة جلب البيانات لحظياً مع وجود مؤقت ومحاولات متكررة في حال عدم اكتمال الجلب
      for (let attempt = 1; attempt <= 3; attempt++) {
        tickets = await fetchTicketsPromise();
        if (tickets && tickets.length > 0) {
          websiteTickets = tickets;
          break;
        }
        if (attempt < 3) {
          showFloatingNotification(`لم يتم جلب البيانات بعد، لحظات من وقتك وجاري المحاولة... ⏳ (محاولة ${attempt}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }
    }

    if (!websiteTickets || websiteTickets.length === 0) {
      showFloatingNotification("عذراً، تعذر جلب البيانات اللحظية للتوزيع. يرجى المحاولة بعد قليل! ⚠️");
      return;
    }

    // حساب الموظف الذي عليه الدور تلقائياً بعد التحقق من البيانات اللحظية
    const nextEmployee = getLeastReceiver();
    if (!nextEmployee || !nextEmployee.user) {
      showFloatingNotification("تعذر حساب الموظف التالي! ⚠️");
      return;
    }
    updateSubmitButtonText(nextEmployee);

    // 1. تعبئة حقل المعين له على الصفحة يدوياً فوراً
    const assigneeInput = findAssigneeInput();
    if (assigneeInput) {
      triggerElementChangeEvents(assigneeInput, nextEmployee.user);
    }

    // نسخ النص للحافظة كدعم للمستخدم
    const clipboardText = `رقم التذكرة: ${ticketId}\nالتصنيف: ${category}\nالموظف المستلم: ${nextEmployee.name} (${nextEmployee.user})`;
    navigator.clipboard.writeText(clipboardText).catch(() => { });

    // تنسيق التاريخ بتوقيت الرياض YYYY-MM-DD
    const localDate = new Date();
    const offset = 3 * 60; // UTC+3
    const localTime = new Date(localDate.getTime() + (localDate.getTimezoneOffset() + offset) * 60000);
    const dateStr = localTime.toISOString().split('T')[0];

    showFloatingNotification("جاري حفظ البلاغ الجديد وتوزيعه بالدور... ⏳");

    safeGetStorage(['daemRole'], (result) => {
      const role = result.daemRole || 'support';
      const phoneNumber = extractPhone();
      const reportText = extractReportText();
      const municipality = extractMunicipality();

      const apiData = {
        date: dateStr,
        receiver: nextEmployee.name,
        ticketNumber: ticketId,
        type: normalizeCategory(category),
        solution: 'بلاغ جديد',
        phoneNumber: phoneNumber,
        reportText: reportText,
        municipality: municipality,
        role: role,
        nationalId: extractNationalId()
      };

      // إرسال الطلب للخلفية لحفظ البلاغ في قاعدة بيانات الموقع مباشرة دون فتح أي نافذة
      safeSendMessage({ action: "CREATE_TICKET", data: apiData }, (response) => {
        if (response && response.success) {
          showFloatingNotification(`تم حفظ البلاغ (${ticketId}) وإسناده للموظف (${nextEmployee.name}) بنجاح! 🚀`);
          // الضغط تلقائياً على زر حفظ وخروج بعد حفظ البيانات بقاعدة البيانات لإنهاء الإجراء
          setTimeout(() => {
            const clicked = clickSaveAndExit();
            if (clicked) {
              showFloatingNotification("جاري حفظ التذكرة والخروج تلقائياً... 💾");
            } else {
              showFloatingNotification("تعذر العثور على زر 'حفظ وخروج' بالصفحة! ⚠️");
            }
          }, 100);
        } else {
          showFloatingNotification(`فشل حفظ البلاغ تلقائياً: ${response?.error || 'خطأ غير معروف'} ⚠️`);
        }
      });
    });
  });

  // تفقد صلاحية المستخدم لإخفاء أو إظهار أزرار الإسناد التلقائي وإنشاء البلاغات
  refreshAutoAssignButtonVisibility();
  safeGetStorage(['daemRole'], (result) => {
    const role = result.daemRole || 'support';
    const btnFill = document.getElementById('btn-fill-copied');
    if (role === 'admin') {
      checkCopiedTicketData();
    } else {
      if (btnFill) btnFill.style.display = 'none';
    }
  });
}

// تحديث ظهور زر الإسناد التلقائي بناءً على تسجيل البلاغ مسبقاً بالموقع
function refreshAutoAssignButtonVisibility() {
  const btnCopy = document.getElementById('btn-copy-new-ticket');
  if (!btnCopy) return;

  const isDashboard = window.location.href.includes('tickets-daem.vercel.app') ||
    window.location.href.includes('localhost');

  if (isDashboard) {
    btnCopy.style.display = 'none';
    return;
  }

  safeGetStorage(['daemRole'], (result) => {
    const role = result.daemRole || 'support';
    if (role !== 'admin') {
      btnCopy.style.display = 'none';
      return;
    }

    if (!window.daemTicketsFetched) {
      btnCopy.style.display = 'none';
      return;
    }

    btnCopy.style.display = isTicketAlreadyRegistered(getTicketNumber()) ? 'none' : 'flex';
  });
}

function checkCopiedTicketData() {
  const isDashboard = window.location.href.includes('tickets-daem.vercel.app') ||
    window.location.href.includes('localhost');
  const btn = document.getElementById('btn-fill-copied');

  if (!isDashboard) {
    if (btn) btn.style.display = 'none';
    return;
  }

  safeGetStorage(['copiedTicketInfo', 'daemRole'], (result) => {
    const role = result.daemRole || 'support';
    if (role === 'support') {
      if (btn) btn.style.display = 'none';
      return;
    }

    if (result.copiedTicketInfo && btn) {
      const data = result.copiedTicketInfo;
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - data.timestamp < oneHour) {
        btn.style.display = 'flex';
        const downloadIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px; vertical-align: middle;"><polyline points="17 10 12 15 7 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line><path d="M20 17a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2"></path></svg>`;
        btn.innerHTML = `${downloadIcon} تعبئة وإسناد (${data.ticketId} ➔ ${data.nextEmployee.name.split(' ')[0]})`;

        const newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
          fillTicketDataToForm(data);
        });
      }
    }
  });
}

// مراقبة تغيير الصلاحية لتحديث الأزرار حياً في التبويبات النشطة
try {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.daemUserKey) {
          currentLoggedUserKey = changes.daemUserKey.newValue || 'alrubaish';
        }
        if (changes.daemUserArabic) {
          currentLoggedUserArabic = changes.daemUserArabic.newValue || 'محمد الربيش';
        }
        if (changes.daemRole) {
          const role = changes.daemRole.newValue || 'support';
          const btnCopy = document.getElementById('btn-copy-new-ticket');
          const btnFill = document.getElementById('btn-fill-copied');
          if (role === 'support') {
            if (btnCopy) btnCopy.style.display = 'none';
            if (btnFill) btnFill.style.display = 'none';
          } else {
            refreshAutoAssignButtonVisibility();
            checkCopiedTicketData();
          }
        }
        if (changes.daemSpellingEnabled) {
          const checked = changes.daemSpellingEnabled.newValue !== false;
          currentSpellingEnabled = checked;

          const chkSpelling = document.getElementById('chk-spelling-toggle');
          if (chkSpelling) chkSpelling.checked = checked;

          const sliderSpan = document.getElementById('spelling-slider-span');
          if (sliderSpan) {
            sliderSpan.style.backgroundColor = checked ? '#10b981' : '#475569';
            sliderSpan.style.boxShadow = checked ? '0 0 6px rgba(16, 185, 129, 0.4)' : 'none';
            const circle = sliderSpan.querySelector('span');
            if (circle) {
              circle.style.left = checked ? '18px' : '4px';
            }
          }

          if (!checked) {
            const alertDiv = document.getElementById('daem-spelling-alert');
            if (alertDiv) alertDiv.remove();
          }
        }
      }
    });
  }
} catch (e) { }

function fillTicketDataToForm(data) {
  let filledAny = false;

  // 1. تعبئة حقل التصنيف
  const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (name.includes('category') || name.includes('class') || id.includes('category') || id.includes('class')) {
      input.value = data.category;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      filledAny = true;
    }
  }

  // 2. تعبئة حقل "المستقبل" أو "التعيين" باسم الموظف الذي عليه الدور
  const assigneeInput = findAssigneeInput();
  if (assigneeInput) {
    triggerElementChangeEvents(assigneeInput, data.nextEmployee.user);
    filledAny = true;
  }

  // 3. تعبئة تفاصيل/رقم البلاغ القديم في حقل الوصف/الحديثة
  const descriptionField = findActiveInput();
  if (descriptionField) {
    descriptionField.value = `بلاغ مرتبط بالبلاغ رقم: ${data.ticketId}\nالتصنيف: ${data.category}\nمسند إلى: ${data.nextEmployee.name}`;
    descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
    descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
    filledAny = true;
  }

  if (filledAny) {
    showFloatingNotification(`تمت تعبئة البيانات وإسنادها للموظف (${data.nextEmployee.name}) بنجاح! 📥`);
  } else {
    navigator.clipboard.writeText(`رقم البلاغ السابق: ${data.ticketId}\nالتصنيف: ${data.category}\nالمستلم: ${data.nextEmployee.name} (${data.nextEmployee.user})`).then(() => {
      showFloatingNotification("تعذر التحديد التلقائي للحقول. تم نسخ البيانات لتلصقها يدوياً! 📋");
    });
  }
}

// تشغيل الحقن والمراقبة
syncFromWebsite();
setInterval(syncFromWebsite, 60000);
setInterval(highlightTickets, 2000);


// محاولة الحقن فوراً وبشكل دوري لدعم التحديثات الديناميكية (AJAX/iFrames)
setTimeout(injectFloatingPanel, 1500);
setInterval(injectFloatingPanel, 3000);

// إعادة تقييم ظهور زر الإسناد التلقائي دورياً بعد اكتمال جلب بيانات التذاكر من الموقع
setTimeout(refreshAutoAssignButtonVisibility, 1600);
setInterval(refreshAutoAssignButtonVisibility, 3000);

let daemAutoFilled = false;
function autoFillOnWebsiteNewPage() {
  try {
    if (!chrome.runtime || !chrome.runtime.id) return;
  } catch (e) {
    return;
  }
  if (daemAutoFilled) return;

  const isTargetPage = window.location.href.includes('tickets-daem.vercel.app/new') ||
    window.location.href.includes('tickets-daem.vercel.app/create') ||
    window.location.href.includes('localhost:3000/new') ||
    window.location.href.includes('localhost:3000/create');

  if (isTargetPage) {
    const ticketInput = document.getElementById('ticketNumber');
    if (!ticketInput) return; // النموذج لم يتم تحميله بعد في الصفحة

    safeGetStorage(['copiedTicketInfo'], (result) => {
      if (result && result.copiedTicketInfo) {
        const data = result.copiedTicketInfo;
        const fiveMinutes = 5 * 60 * 1000;

        // التحقق من أن البيانات حديثة (خلال آخر 5 دقائق) لتجنب تكرار التعبئة
        if (Date.now() - data.timestamp < fiveMinutes) {
          daemAutoFilled = true;

          // 1. رقم البلاغ
          ticketInput.value = data.ticketId;
          ticketInput.dispatchEvent(new Event('input', { bubbles: true }));
          ticketInput.dispatchEvent(new Event('change', { bubbles: true }));

          // 2. المستقبل (الموظف)
          const nameInput = document.getElementById('name');
          if (nameInput) {
            const options = Array.from(nameInput.options);
            const matchedOpt = options.find(opt =>
              opt.text.includes(data.nextEmployee.name) ||
              data.nextEmployee.name.includes(opt.text)
            );
            if (matchedOpt) {
              nameInput.value = matchedOpt.value;
              nameInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }

          // 3. التصنيف (Custom Select)
          const categoryLabel = document.querySelector('label[htmlFor="serviceType"]');
          if (categoryLabel && data.category) {
            const wrapper = categoryLabel.parentElement.querySelector('[class*="customSelectWrapper"]');
            if (wrapper) {
              const trigger = wrapper.querySelector('[class*="customSelectTrigger"]');
              if (trigger) {
                trigger.click();
                setTimeout(() => {
                  const options = Array.from(wrapper.querySelectorAll('[class*="customOption"]'));
                  const matchedOption = options.find(opt => {
                    const optText = opt.innerText.trim();
                    return optText.includes(data.category) || data.category.includes(optText);
                  });
                  if (matchedOption) {
                    matchedOption.click();
                  } else {
                    const otherOpt = options.find(opt => opt.innerText.includes('أخرى'));
                    if (otherOpt) otherOpt.click();
                  }
                }, 200);
              }
            }
          }

          // 4. الحفظ التلقائي بعد وقت كافٍ لاكتمال تعبئة الحقول والخيارات
          setTimeout(() => {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.click();
            }
          }, 800);

          safeRemoveStorage(['copiedTicketInfo']);
          showFloatingNotification("تمت تعبئة تفاصيل البلاغ وحفظه تلقائياً! ⚡");
        }
      }
    });
  }
}
// تشغيل التعبئة التلقائية عند تحميل الصفحة
setTimeout(autoFillOnWebsiteNewPage, 1000);
setInterval(autoFillOnWebsiteNewPage, 2000);
setInterval(checkAndAutoUpdateMinistryDate, 5000);
setInterval(checkOpenedByEmployee, 3000);
setInterval(checkTicketDescriptionSpelling, 4000);

// ==========================================================
// وظائف استخلاص البيانات والتصحيح الإملائي وتحديث الوزارة
// ==========================================
function queryAllInPage(selector) {
  let elements = [];

  function recurse(doc) {
    if (!doc) return;
    try {
      const found = doc.querySelectorAll(selector);
      elements = elements.concat(Array.from(found));

      const frames = doc.querySelectorAll('iframe, frame');
      for (const frame of frames) {
        try {
          const frameDoc = frame.contentDocument || frame.contentWindow.document;
          if (frameDoc) {
            recurse(frameDoc);
          }
        } catch (e) {
          // ignore cross-origin errors
        }
      }
    } catch (e) {
      // ignore
    }
  }

  let startDoc = document;
  try {
    const highestWin = getHighestAccessibleWindow();
    if (highestWin && highestWin.document) {
      startDoc = highestWin.document;
    }
  } catch (e) { }

  recurse(startDoc);
  return elements;
}

function extractValue(labels) {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, input, textarea');
  for (let el of allElements) {
    const text = el.innerText ? el.innerText.trim() : "";
    const val = el.value ? el.value.trim() : "";

    if (labels.some(label => text.includes(label) || val.includes(label))) {
      let foundValue = "";
      if (text.includes(':')) {
        let parts = text.split(':');
        if (parts[1] && parts[1].trim().length > 1) foundValue = parts[1].trim();
      }
      if (!foundValue) {
        let sibling = el.nextElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input, textarea') || (['INPUT', 'TEXTAREA'].includes(sibling.tagName) ? sibling : null);
          if (input && input.value) {
            foundValue = input.value;
            break;
          }
          if (sibling.innerText && sibling.innerText.trim().length > 1) {
            foundValue = sibling.innerText.trim();
            break;
          }
          sibling = sibling.nextElementSibling;
        }
      }
      if (!foundValue && (el.tagName === 'TD' || el.tagName === 'TH' || el.parentElement.tagName === 'TD')) {
        let cell = el.tagName === 'TD' ? el : el.parentElement;

        let nextCell = cell.nextElementSibling;
        if (nextCell) {
          const input = nextCell.querySelector('input, textarea');
          foundValue = input ? input.value : nextCell.innerText.trim();
        }

        if (!foundValue) {
          let prevCell = cell.previousElementSibling;
          if (prevCell) {
            const input = prevCell.querySelector('input, textarea');
            foundValue = input ? input.value : prevCell.innerText.trim();
          }
        }
      }
      if (foundValue && foundValue.length > 1) return foundValue;
    }
  }
  return "";
}

function extractPhone() {
  const inputs = queryAllInPage('input');
  for (let input of inputs) {
    const name = (input.getAttribute('name') || '').toLowerCase();
    if (name.includes('phone')) {
      if (input.value && input.value.trim().length >= 9) {
        return input.value.trim();
      }
    }
  }

  const fromLabel = extractValue(["جوال المواطن", "رقم الجوال", "الهاتف"]);
  if (fromLabel && fromLabel.length >= 9) return fromLabel;

  const bodyText = document.body.innerText;
  const phoneRegex = /(05\d{8}|(?<!\d)5\d{8}(?!\d))/g;
  const matches = bodyText.match(phoneRegex);
  if (matches) {
    return matches[0];
  }
  return "";
}

function extractNationalId() {
  const inputs = queryAllInPage('input');
  for (let input of inputs) {
    const name = (input.getAttribute('name') || '').toLowerCase();
    if (name.includes('nationalid') || name.includes('identity') || name.includes('national_id') || name.includes('national-id') || name.includes('idnumber') || name.includes('id_number') || name.includes('id-number')) {
      if (input.value && input.value.trim().length >= 9) {
        return input.value.trim();
      }
    }
  }

  const fromLabel = extractValue(["رقم الهوية", "الهوية"]);
  if (fromLabel) return fromLabel.trim();
  return "";
}

function extractReportText() {
  const textareas = queryAllInPage('textarea');
  
  // 1. الأولوية الأولى: حقل الوصف النشط الذي يحمل اسم action أو description في خصائصه
  for (let ta of textareas) {
    const name = (ta.getAttribute('name') || '').toLowerCase();
    if (name.includes('action') || name.includes('description')) {
      if (ta.value && ta.value.length > 5 && !ta.value.includes('Asia/Riyadh')) {
        return ta.value;
      }
    }
  }

  // 2. الأولوية الثانية: حقل القراءة فقط ولا يحتوي على توقيت الرياض (لتجنب تحديثات اليومية)
  for (let ta of textareas) {
    if (ta.readOnly || ta.disabled) {
      if (ta.value.length > 20 && !ta.value.includes('Asia/Riyadh')) return ta.value;
    }
  }

  // 3. الأولوية الثالثة: أي حقل نصي يتجاوز 20 حرفاً ولا يحتوي على توقيت الرياض
  for (let ta of textareas) {
    if (ta.value.length > 20 && !ta.value.includes('Asia/Riyadh')) return ta.value;
  }

  return extractValue(["نص البلاغ", "تفاصيل البلاغ", "الوصف"]);
}

function extractMunicipality() {
  const inputs = queryAllInPage('input');
  for (let input of inputs) {
    const name = (input.getAttribute('name') || '').toLowerCase();
    if (name.includes('balady.location') || name.includes('location') || name.includes('municipality')) {
      if (input.value && input.value.trim().length > 1) {
        return input.value.trim().split('-')[0].trim();
      }
    }
  }

  const fromLabel = extractValue(["البلدية"]);
  if (fromLabel) {
    return fromLabel.split('-')[0].trim();
  }
  return "";
}

function detectMinistryUpdateToday() {
  const journalEl = findJournalUpdatesElement();
  if (!journalEl) return false;

  const rawText = journalEl.tagName === 'TEXTAREA' ? (journalEl.value || '') : (journalEl.innerText || '');

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();

  const format1 = `${dd}/${mm}/${yyyy}`;
  const format2 = `${yyyy}-${mm}-${dd}`;
  const format3 = `${yyyy}/${mm}/${dd}`;

  const lines = rawText.split('\n');
  for (const line of lines) {
    const hasMinistry = line.includes('الوزارة') || line.includes('وزارة') || line.includes('Ministry');
    const hasToday = line.includes(format1) || line.includes(format2) || line.includes(format3);
    if (hasMinistry && hasToday) {
      return true;
    }
  }
  return false;
}

function checkAndAutoUpdateMinistryDate() {
  safeGetStorage(['daemRole'], (result) => {
    const role = result.daemRole || 'support';
    if (role !== 'admin') return;

    const ticketId = getTicketNumber();
    if (!ticketId) return;

    if (!window.daemProcessedMinistryTickets) {
      window.daemProcessedMinistryTickets = {};
    }
    if (window.daemProcessedMinistryTickets[ticketId]) return;

    if (detectMinistryUpdateToday()) {
      window.daemProcessedMinistryTickets[ticketId] = true;

      const today = new Date();
      const offset = 3 * 60; // UTC+3
      const localTime = new Date(today.getTime() + (today.getTimezoneOffset() + offset) * 60000);
      const todayStr = localTime.toISOString().split('T')[0];

      safeSendMessage({
        action: "UPDATE_TICKET_DATE",
        data: {
          ticketNumber: ticketId,
          date: todayStr
        }
      }, (response) => {
        if (response && response.success) {
          showFloatingNotification("تم تحديث تاريخ البلاغ في نوشن تلقائياً! 📅");
        }
      });
    }
  });
} function showCorrectionConfirmationModal(original, corrected, inputElement) {
  const modal = document.createElement('div');
  modal.id = 'daem-spelling-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999999';
  modal.style.fontFamily = 'Cairo, sans-serif';
  modal.style.direction = 'rtl';

  modal.innerHTML = `
    <div style="background-color: #1e293b; border: 2px solid #10b981; border-radius: 16px; width: 450px; padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 15px; color: white;">
      <div style="font-weight: bold; font-size: 16px; color: #10b981; border-bottom: 1px solid #334155; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
        🪄 مراجعة وتصحيح النص الإملائي
      </div>
      
      <div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 5px;">النص الأصلي:</div>
        <div style="background-color: #0f172a; padding: 10px; border-radius: 8px; font-size: 12px; border: 1px solid #334155; line-height: 1.5; color: #cbd5e1; max-height: 80px; overflow-y: auto;">
          ${original}
        </div>
      </div>
      
      <div>
        <div style="font-size: 11px; color: #10b981; margin-bottom: 5px;">النص المصحح المقترح:</div>
        <div style="background-color: #0f172a; padding: 10px; border-radius: 8px; font-size: 13px; border: 1px solid #10b981; line-height: 1.5; font-weight: bold; max-height: 120px; overflow-y: auto;">
          ${corrected}
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <button id="btn-spelling-confirm" style="flex: 2; background-color: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: Cairo; font-size: 12px; transition: all 0.2s;">
          ${(inputElement && inputElement.tagName) ? 'استبدال وتحديث الحقل ✏️' : 'نسخ النص المصحح للحافظة 📋'}
        </button>
        <button id="btn-spelling-cancel" style="flex: 1; background-color: #334155; color: #cbd5e1; border: 1px solid #475569; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: Cairo; font-size: 12px; transition: all 0.2s;">
          إلغاء ❌
        </button>
      </div>
    </div>
  `;

  const targetBody = document.body || document.documentElement;
  if (targetBody) {
    targetBody.appendChild(modal);
  }
  document.getElementById('btn-spelling-confirm').addEventListener('click', () => {
    if (inputElement && inputElement.tagName) {
      setEditableValue(inputElement, corrected);
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.focus();
      showFloatingNotification("تم استبدال النص وتصحيحه بنجاح! ⚡");
    } else {
      navigator.clipboard.writeText(corrected).then(() => {
        showFloatingNotification("تم نسخ النص المصحح للحافظة بنجاح! 📋");
      }).catch(() => {
        showFloatingNotification("فشل نسخ النص؛ يرجى تحديده ونسخه يدوياً. ⚠️");
      });
    }
    modal.remove();
  });


  document.getElementById('btn-spelling-cancel').addEventListener('click', () => {
    modal.remove();
  });
}

// ==========================================
// فحص وتنبيه البلاغات المرفوعة من قبل موظفينا
// ==========================================

const EMPLOYEE_IDENTIFIERS = [
  'a.alnesayan', 'aalowaid', 'af.alamri', 'azz.alharbi', 'mialrubaish', 's.alghosen', 't.alhedyani', 't.almansour',
  'alnesayan', 'alowaid', 'alamri', 'alharbi', 'mialrubaish', 'alghosen', 'alhedyani', 'almansour',
  'البراء النصيان', 'عبدالله العويد', 'عبدالرحمن العمري', 'عزام الحربي', 'محمد الربيش', 'صالح الغصن', 'طارق الهدياني', 'ثامر المنصور',
  'البراء علي ابراهيم النصيان', 'عبدالله عبدالعزيز محمد العويد', 'عبدالرحمن فهيد العمري', 'عزام أحمد محمد الفريدي الحربي',
  'محمد إبراهيم محمد الربيش', 'صالح عبدالعزيز صالح الغصن', 'طارق عبدالعزيز عبدالله الهدياني', 'ثامر عبدالله محمد المنصور'
];

function extractOpenedByValue() {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, input');
  for (let el of allElements) {
    const text = el.innerText ? el.innerText.trim() : "";
    if (text === 'فتح بواسطة:' || text === 'فتح بواسطة' || text.includes('Opened by') || text.includes('Opened By')) {
      let foundValue = "";

      // 1. إذا كان يحتوي على نقطتين وقيمة
      if (text.includes(':')) {
        let parts = text.split(':');
        if (parts[1] && parts[1].trim().length > 1) {
          foundValue = parts[1].trim();
        }
      }

      // 2. البحث في الأشقاء التاليين والسابقين
      if (!foundValue) {
        let sibling = el.nextElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input') || (sibling.tagName === 'INPUT' ? sibling : null);
          if (input && input.value) {
            foundValue = input.value;
            break;
          }
          const textVal = sibling.innerText ? sibling.innerText.trim() : "";
          if (textVal && textVal.length > 1 && textVal !== 'i' && textVal !== 'ℹ️' && textVal !== 'ℹ') {
            foundValue = textVal;
            break;
          }
          sibling = sibling.nextElementSibling;
        }
      }

      if (!foundValue) {
        let sibling = el.previousElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input') || (sibling.tagName === 'INPUT' ? sibling : null);
          if (input && input.value) {
            foundValue = input.value;
            break;
          }
          const textVal = sibling.innerText ? sibling.innerText.trim() : "";
          if (textVal && textVal.length > 1 && textVal !== 'i' && textVal !== 'ℹ️' && textVal !== 'ℹ') {
            foundValue = textVal;
            break;
          }
          sibling = sibling.previousElementSibling;
        }
      }

      // 3. البحث في الخلية المجاورة
      if (!foundValue && (el.tagName === 'TD' || el.tagName === 'TH' || el.parentElement.tagName === 'TD')) {
        let cell = el.tagName === 'TD' ? el : el.parentElement;

        let nextCell = cell.nextElementSibling;
        if (nextCell) {
          const input = nextCell.querySelector('input');
          if (input && input.value) {
            foundValue = input.value;
          } else {
            foundValue = nextCell.innerText ? nextCell.innerText.trim() : "";
          }
        }

        if (!foundValue) {
          let prevCell = cell.previousElementSibling;
          if (prevCell) {
            const input = prevCell.querySelector('input');
            if (input && input.value) {
              foundValue = input.value;
            } else {
              foundValue = prevCell.innerText ? prevCell.innerText.trim() : "";
            }
          }
        }
      }

      if (foundValue) {
        foundValue = foundValue.replace(/[iℹ️ℹ]/g, '').trim();
        return foundValue;
      }
    }
  }
  return "";
}

function checkOpenedByEmployee() {
  const openedByRaw = extractOpenedByValue().trim();
  if (!openedByRaw) return;
  const openedBy = openedByRaw.toLowerCase();

  // إذا كان الموظف الذي رفع البلاغ هو نفس المستخدم الحالي المسجل دخوله، لا داعي للتنبيه
  const loggedUserClean = (currentLoggedUserArabic || "").trim().toLowerCase();
  const loggedUserKeyClean = (currentLoggedUserKey || "").trim().toLowerCase();

  if (loggedUserClean && (openedBy === loggedUserClean || openedBy.includes(loggedUserClean) || loggedUserClean.includes(openedBy))) {
    return;
  }
  if (loggedUserKeyClean && (openedBy === loggedUserKeyClean || openedBy.includes(loggedUserKeyClean) || loggedUserKeyClean.includes(openedBy))) {
    return;
  }

  const emp = findEmployeeByName(openedByRaw);
  if (emp && emp.key === currentLoggedUserKey) {
    return;
  }

  // منع تكرار إظهار التنبيه لنفس البلاغ في نفس الجلسة
  const ticketId = getTicketNumber();
  if (ticketId) {
    if (!window.daemOpenedByAlertedTickets) {
      window.daemOpenedByAlertedTickets = {};
    }
    if (window.daemOpenedByAlertedTickets[ticketId]) return;
  }

  const matches = EMPLOYEE_IDENTIFIERS.some(id => {
    const cleanId = id.trim().toLowerCase();
    return openedBy === cleanId || openedBy.includes(cleanId) || cleanId.includes(openedBy);
  });

  if (matches) {
    if (ticketId) {
      window.daemOpenedByAlertedTickets[ticketId] = true;
    }
    showOpenedByNotification(`⚠️ تنبيه: تم رفع هذا البلاغ من قبل موظفينا (${openedByRaw})!`);
  }
}

function showOpenedByNotification(msg) {
  if (document.getElementById('daem-openedby-alert')) return;

  const alertDiv = document.createElement('div');
  alertDiv.id = 'daem-openedby-alert';
  alertDiv.style.position = 'fixed';
  alertDiv.style.bottom = '100px';
  alertDiv.style.left = '30px';
  alertDiv.style.backgroundColor = '#d97706'; // برتقالي تحذيري مميز
  alertDiv.style.color = '#ffffff';
  alertDiv.style.padding = '14px 24px';
  alertDiv.style.borderRadius = '12px';
  alertDiv.style.fontFamily = 'Cairo, sans-serif';
  alertDiv.style.fontSize = '14px';
  alertDiv.style.fontWeight = 'bold';
  alertDiv.style.boxShadow = '0 10px 30px rgba(217, 119, 6, 0.4)';
  alertDiv.style.zIndex = '999999';
  alertDiv.style.direction = 'rtl';
  alertDiv.style.display = 'flex';
  alertDiv.style.alignItems = 'center';
  alertDiv.style.gap = '10px';
  alertDiv.style.border = '2px solid #f59e0b';
  alertDiv.style.transition = 'all 0.3s ease';

  alertDiv.innerHTML = `
    <span>📢</span>
    <span>${msg}</span>
    <button id="btn-close-openedby-alert" style="background: transparent; border: none; color: white; cursor: pointer; font-weight: bold; margin-right: 15px; font-size: 14px;">✕</button>
  `;

  const targetBody = document.body || document.documentElement;
  if (targetBody) {
    targetBody.appendChild(alertDiv);
  }

  document.getElementById('btn-close-openedby-alert').addEventListener('click', () => {
    alertDiv.remove();
  });
}

// ==========================================
// الفحص التلقائي والتنبيه عند وجود أخطاء إملائية بالوصف
// ==========================================

function checkTicketDescriptionSpelling() {
  if (!currentSpellingEnabled) {
    const alertDiv = document.getElementById('daem-spelling-alert');
    if (alertDiv) alertDiv.remove();
    return;
  }
  const ticketId = getTicketNumber();
  if (!ticketId) return;

  if (!window.daemCheckedSpellingTickets) {
    window.daemCheckedSpellingTickets = {};
  }
  if (window.daemCheckedSpellingTickets[ticketId]) return;

  const text = extractReportText();
  if (!text || text.length < 10) return;

  // تحديد أن التذكرة جاري فحصها لمنع التكرار
  window.daemCheckedSpellingTickets[ticketId] = true;

  safeSendMessage({
    action: "CORRECT_SPELLING",
    data: { text: text }
  }, (response) => {
    if (response && response.success && response.errorCount > 0) {
      showSpellingAlert(response.errorCount, text, response.correctedText);
    }
  });
}

function showSpellingAlert(errorCount, originalText, correctedText) {
  if (document.getElementById('daem-spelling-alert')) return;

  const alertDiv = document.createElement('div');
  alertDiv.id = 'daem-spelling-alert';
  alertDiv.style.position = 'fixed';
  alertDiv.style.bottom = '170px'; // موضوعة فوق تنبيه فتح بواسطة لتفادي التداخل
  alertDiv.style.left = '30px';
  alertDiv.style.backgroundColor = '#7c3aed'; // لغز بنفسجي مميز
  alertDiv.style.color = '#ffffff';
  alertDiv.style.padding = '14px 24px';
  alertDiv.style.borderRadius = '12px';
  alertDiv.style.fontFamily = 'Cairo, sans-serif';
  alertDiv.style.fontSize = '14px';
  alertDiv.style.fontWeight = 'bold';
  alertDiv.style.boxShadow = '0 10px 30px rgba(124, 58, 237, 0.4)';
  alertDiv.style.zIndex = '999999';
  alertDiv.style.direction = 'rtl';
  alertDiv.style.display = 'flex';
  alertDiv.style.alignItems = 'center';
  alertDiv.style.gap = '15px';
  alertDiv.style.border = '2px solid #a78bfa';
  alertDiv.style.transition = 'all 0.3s ease';

  alertDiv.innerHTML = `
    <span>🪄</span>
    <span>هل تريد تصحيح الأخطاء الإملائية؟ (تم اكتشاف ${errorCount} كلمة خاطئة في تفاصيل البلاغ)</span>
    <button id="btn-spelling-alert-correct" style="background-color: #10b981; border: none; color: white; padding: 6px 12px; cursor: pointer; font-family: Cairo; font-weight: bold; font-size: 12px; border-radius: 6px;">✏️ تصحيح النص</button>
    <button id="btn-close-spelling-alert" style="background: transparent; border: none; color: white; cursor: pointer; font-weight: bold; font-size: 14px;">✕</button>
  `;

  const targetBody = document.body || document.documentElement;
  if (targetBody) {
    targetBody.appendChild(alertDiv);
  }

  document.getElementById('btn-spelling-alert-correct').addEventListener('click', () => {
    const activeInput = findActiveInput();
    showCorrectionConfirmationModal(originalText, correctedText, activeInput);
    alertDiv.remove();
  });

  document.getElementById('btn-close-spelling-alert').addEventListener('click', () => {
    alertDiv.remove();
  });
}

// ==========================================================
// وظائف حساب الفرق الزمني للبلاغات (تاريخ وقت متاح)
// ==========================================================

function cleanDateString(rawStr) {
  if (!rawStr) return "";
  const matches = rawStr.match(/(\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}:\d{2}(?::\d{2})?)/g);
  return matches ? matches.join(' ') : "";
}

function parseTicketDate(dateStr) {
  if (!dateStr) return null;

  // Extract date component
  const dateMatch = dateStr.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!dateMatch) return null;

  // Extract time component (optional)
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);

  const first = parseInt(dateMatch[1], 10);
  const second = parseInt(dateMatch[2], 10);

  let year, month, day;
  if (first > 1000) {
    year = first;
    month = second - 1;
    day = parseInt(dateMatch[3], 10);
  } else {
    // format is DD/MM/YY or MM/DD/YY
    year = parseInt(dateMatch[3], 10);
    if (year < 100) year += 2000;

    // assume MM/DD/YY first
    month = first - 1;
    day = second;
    if (month > 11) {
      month = second - 1;
      day = first;
    }
  }

  let hour = 0, minute = 0, secondVal = 0;
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    minute = parseInt(timeMatch[2], 10);
    if (timeMatch[3]) {
      secondVal = parseInt(timeMatch[3], 10);
    }
  }

  let parsedDate = new Date(year, month, day, hour, minute, secondVal);

  // If parsed date is in the future, try swapping day and month
  const now = new Date();
  if (parsedDate > now) {
    month = second - 1;
    day = first;
    parsedDate = new Date(year, month, day, hour, minute, secondVal);
  }

  return parsedDate;
}

function calculateDateDifference(ticketDate) {
  const now = new Date();
  const diffTime = now - ticketDate;
  if (diffTime < 0) return 0; // في حال وجود فرق طفيف بالثواني
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatElapsedArabic(days) {
  if (days === 0) return "اليوم";
  if (days === 1) return "منذ يوم";
  if (days === 2) return "منذ يومين";

  if (days < 7) {
    return `منذ ${days} أيام`;
  }

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  if (days < 30) {
    let weekStr = "";
    if (weeks === 1) weekStr = "أسبوع";
    else if (weeks === 2) weekStr = "أسبوعين";
    else weekStr = `${weeks} أسابيع`;

    let dayStr = "";
    if (remainingDays === 1) dayStr = "ويوم";
    else if (remainingDays === 2) dayStr = "ويومين";
    else if (remainingDays > 2) dayStr = `و ${remainingDays} أيام`;

    return `منذ ${weekStr} ${dayStr}`.trim();
  }

  const months = Math.floor(days / 30);
  const remainingDaysInMonth = days % 30;

  let monthStr = "";
  if (months === 1) monthStr = "شهر";
  else if (months === 2) monthStr = "شهرين";
  else if (months >= 3 && months <= 10) monthStr = `${months} أشهر`;
  else monthStr = `${months} شهراً`;

  let dayStr = "";
  if (remainingDaysInMonth === 1) dayStr = "ويوم";
  else if (remainingDaysInMonth === 2) dayStr = "ويومين";
  else if (remainingDaysInMonth > 2) dayStr = `و ${remainingDaysInMonth} يوماً`;

  return `منذ ${monthStr} ${dayStr}`.trim();
}

function extractDateFromContainer(container) {
  // 1. البحث عن جميع حقول إدخال input والتأكد من تطابق محتواها مع نمط تاريخ
  const inputs = container.querySelectorAll('input');
  for (const input of inputs) {
    if (input && input.value) {
      const val = input.value.trim();
      if (val && (/\d{2}[\/-]\d{2}/.test(val) || /\d{4}[\/-]\d{2}/.test(val))) {
        return { element: input, value: cleanDateString(val) };
      }
    }
  }

  // 2. البحث عن أي عنصر نصي يحتوي على نمط تاريخ
  const candidates = container.querySelectorAll('td, div, span, font, b, label');
  for (const cand of candidates) {
    // استبدال جميع الفراغات بما فيها غير المكسورة \u00a0 بفراغ عادي
    const txt = (cand.innerText || '').replace(/\s+/g, ' ').trim();
    if (txt && (/\d{2}[\/-]\d{2}/.test(txt) || /\d{4}[\/-]\d{2}/.test(txt))) {
      // نضمن ألا يكون هذا النص هو العنوان الرئيسي أو النص الطويل
      if (txt.length < 100) {
        const cleaned = cleanDateString(txt);
        if (cleaned) {
          return { element: cand, value: cleaned };
        }
      }
    }
  }
  return null;
}

function findAvailableTimeElement() {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, label-form, font');
  const DATE_LABELS = [
    'وقت متاح', 'تاريخ ووقت متاح', 'تاريخ استقبال البلاغ', 'تاريخ البلاغ', 'تاريخ الإبلاغ',
    'تاريخ التسجيل', 'تاريخ التقديم', 'تاريخ الإنشاء', 'تاريخ الإسناد',
    'open time', 'available time', 'alert time', 'submit date', 'reported date', 'created date', 'create date', 'open date'
  ];

  for (let el of allElements) {
    const text = el.innerText ? el.innerText.replace(/\s+/g, ' ').trim() : "";
    const textLower = text.toLowerCase();

    const matched = DATE_LABELS.some(label => text === label || text === (label + ':') || text.includes(label) || textLower.includes(label));
    if (matched) {
      // محاولة 1: العثور على أقرب حاوية سطر (TR) والبحث بداخلها
      let container = el.closest('tr');
      if (!container) {
        // محاولة 2: الصعود للأعلى للبحث عن حاوية سطر نموذج أو عنصر أب نشط
        let temp = el.parentElement;
        for (let i = 0; i < 4 && temp; i++) {
          const tagName = temp.tagName;
          if (tagName === 'TR' || temp.classList.contains('row') || temp.classList.contains('form-group')) {
            container = temp;
            break;
          }
          temp = temp.parentElement;
        }
      }

      if (container) {
        const data = extractDateFromContainer(container);
        if (data) return data;
      }

      // محاولة 3: البحث في الأشقاء التاليين مباشرة
      let sibling = el.nextElementSibling;
      while (sibling) {
        const data = extractDateFromContainer(sibling);
        if (data) return data;
        sibling = sibling.nextElementSibling;
      }

      // محاولة 4: البحث في الخلايا المجاورة داخل الجدول (TD السابق والتالي)
      let parent = el.parentElement;
      if (parent && parent.tagName === 'TD') {
        let nextTd = parent.nextElementSibling;
        if (nextTd) {
          const data = extractDateFromContainer(nextTd);
          if (data) return data;
        }
        let prevTd = parent.previousElementSibling;
        if (prevTd) {
          const data = extractDateFromContainer(prevTd);
          if (data) return data;
        }
      }
    }
  }
  return null;
}

// فحص وتحديث حالة تنبيه تحويل البلاغ لموظف آخر في اللوحة العائمة
function updatePanelTransferWarning() {
  try {
    const panel = document.getElementById('daem-premium-panel');
    if (!panel) return;

    const warningDiv = document.getElementById('daem-panel-transfer-warning');
    if (!warningDiv) return;

    const ticketId = panel.getAttribute('data-ticket-id');
    if (!ticketId) {
      warningDiv.style.display = 'none';
      warningDiv.innerHTML = '';
      return;
    }

    if (!websiteTickets || websiteTickets.length === 0) {
      warningDiv.style.display = 'none';
      warningDiv.innerHTML = '';
      return;
    }

    const myTicket = websiteTickets.find(t => {
      const n = String(t.number || t.ticketNumber || t.ticket_number || "").trim();
      return n.includes(ticketId) || ticketId.includes(n);
    });

    if (!myTicket) {
      warningDiv.style.display = 'none';
      warningDiv.innerHTML = '';
      return;
    }

    const dbReceiver = (myTicket.receiver || "").trim();
    if (dbReceiver && dbReceiver !== 'غير حدد' && dbReceiver !== 'غير محدد') {
      const dbEmp = findEmployeeByName(dbReceiver);
      // إذا كان الموظف في قاعدة البيانات ليس هو الموظف المسجل دخوله حالياً
      if (dbEmp && dbEmp.key !== currentLoggedUserKey) {
        warningDiv.style.display = 'flex';
        warningDiv.innerHTML = `⚠️ تم تحويل البلاغ لك (المفترض عند ${dbEmp.arabic})`;
        return;
      }
    }

    warningDiv.style.display = 'none';
    warningDiv.innerHTML = '';
  } catch (e) {
    console.error("Daem Plus Transfer Warning Error:", e);
  }
}

function findStatusSelectField() {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, label-form, font');
  const STATUS_LABELS = ['الحالة', 'حالة البلاغ', 'Status'];
  for (let el of allElements) {
    const text = el.innerText ? el.innerText.trim() : '';
    if (STATUS_LABELS.some(label => text === label || text === (label + ':'))) {
      let parentTd = el.closest('td');
      if (parentTd) {
        let nextTd = parentTd.nextElementSibling;
        if (nextTd) {
          const sel = nextTd.querySelector('select');
          if (sel) return sel;
          const inp = nextTd.querySelector('input');
          if (inp) return inp;
        }
      }
    }
  }
  const inputs = queryAllInPage('input, select');
  for (const input of inputs) {
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    if (id.includes('status') || name.includes('status')) return input;
  }
  return null;
}

function getTicketStatus() {
  const allElements = queryAllInPage('div, span, label, td, th, p, b, label-form, font');
  const STATUS_LABELS = ['الحالة', 'حالة البلاغ', 'Status'];
  for (let el of allElements) {
    const text = el.innerText ? el.innerText.trim() : "";
    if (STATUS_LABELS.some(label => text === label || text === (label + ':'))) {
      let parentTd = el.closest('td');
      if (parentTd) {
        let nextTd = parentTd.nextElementSibling;
        if (nextTd) {
          const input = nextTd.querySelector('input, select');
          if (input && input.value) return input.value.trim();
          const innerText = nextTd.innerText.trim();
          if (innerText) return innerText;
        }
      }
      let sibling = el.nextElementSibling;
      while (sibling) {
        const input = sibling.querySelector('input, select') || (sibling.tagName === 'INPUT' || sibling.tagName === 'SELECT' ? sibling : null);
        if (input && input.value) return input.value.trim();
        const innerText = sibling.innerText.trim();
        if (innerText) return innerText;
        sibling = sibling.nextElementSibling;
      }
    }
  }
  const inputs = queryAllInPage('input, select');
  for (const input of inputs) {
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    if (id.includes('status') || name.includes('status')) {
      if (input.value) return input.value.trim();
    }
  }
  return '';
}

function isStatusWithMinistry(status) {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('vendor') || s.includes('الوزارة') || s.includes('المورد');
}

function getLastContractorUpdater(fullText) {
  if (!fullText) return null;
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('----') && line.includes('Contractor')) {
      const contractorIndex = line.indexOf('(Contractor)');
      if (contractorIndex !== -1) {
        const start = line.indexOf('(');
        if (start !== -1 && start < contractorIndex) {
          let fullName = line.substring(start + 1, contractorIndex).trim();
          let arabicName = fullName.replace(/[a-zA-Z]/g, '').trim();
          if (arabicName) {
            const parts = arabicName.split(/\s+/).filter(Boolean);
            if (parts.length > 1) {
              return parts[0] + ' ' + parts[parts.length - 1];
            }
            return parts[0];
          }
          const parts = fullName.split(/\s+/).filter(Boolean);
          if (parts.length > 1) {
            return parts[0] + ' ' + parts[parts.length - 1];
          }
          return fullName;
        }
      }
    }
  }
  return null;
}

function updatePanelMinistryWarning() {
  try {
    const panel = document.getElementById('daem-premium-panel');
    if (!panel) return;

    const warningDiv = document.getElementById('daem-panel-ministry-warning');
    if (!warningDiv) return;

    const status = getTicketStatus();
    if (!isStatusWithMinistry(status)) {
      warningDiv.style.display = 'none';
      warningDiv.innerHTML = '';
      return;
    }

    const journalEl = findJournalUpdatesElement();
    if (!journalEl) {
      warningDiv.style.display = 'none';
      warningDiv.innerHTML = '';
      return;
    }

    const rawText = journalEl.tagName === 'TEXTAREA' ? (journalEl.value || '') : (journalEl.innerText || '');
    const contractor = getLastContractorUpdater(rawText);

    if (contractor) {
      warningDiv.style.display = 'flex';
      warningDiv.innerHTML = `🔹 البلاغ أتى من الوزارة من المهندس: ${contractor}`;
    } else {
      warningDiv.style.display = 'none';
      warningDiv.innerHTML = '';
    }
  } catch (e) {
    console.error("Daem Plus Ministry Warning Error:", e);
  }
}

function isListPage() {
  const LIST_HEADERS = ['Ticket ID', 'وقت الفتح', 'Open Time', 'Area/Service', 'الأولوية', 'Assignee'];

  function checkDoc(doc) {
    if (!doc) return false;
    try {
      // الطريقة 1: وجود عنصر combo خاص بفلتر القائمة (var/L.inbox)
      const inboxEl = doc.querySelector('input[alias*="inbox"], input[dvdvar*="inbox"]');
      if (inboxEl) return true;

      // الطريقة 2: رؤوس جدول خاصة بصفحات القوائم
      const headers = doc.querySelectorAll('th');
      for (const h of headers) {
        const txt = (h.innerText || '').trim();
        if (LIST_HEADERS.some(lh => txt === lh || txt.includes(lh))) return true;
      }
    } catch (e) { }
    return false;
  }

  if (checkDoc(document)) return true;

  const frames = document.querySelectorAll('iframe, frame');
  for (const frame of frames) {
    try {
      const fd = frame.contentDocument || frame.contentWindow?.document;
      if (fd && checkDoc(fd)) return true;
    } catch (e) { }
  }

  // احتياطي: 3+ أرقام IM فريدة
  let allMatches = [];
  function recurse(doc) {
    if (!doc) return;
    try {
      const html = doc.body.innerHTML || '';
      const m = html.match(/IM\d{5,10}/g);
      if (m) allMatches = allMatches.concat(m);
      const fs = doc.querySelectorAll('iframe, frame');
      for (const f of fs) {
        try { const fd = f.contentDocument || f.contentWindow.document; if (fd) recurse(fd); } catch (e) { }
      }
    } catch (e) { }
  }
  recurse(document);
  return new Set(allMatches).size >= 3;
}

function updateAvailableTimeDisplay() {
  try {
    if (window === window.top && document.querySelector('iframe')) {
      const badge = document.getElementById('daem-available-time-badge');
      if (badge) badge.remove();
      return;
    }

    if (isListPage()) {
      const badge = document.getElementById('daem-available-time-badge');
      if (badge) badge.remove();
      // حقن لوحة الداشبورد للتأكيد
      injectDashboardPanel();
      return;
    }

    // تحديث تنبيه تحويل البلاغ أولاً وبشكل مستقل لضمان عمله حتى لو لم يتم العثور على تاريخ فتح البلاغ بالصفحة
    updatePanelTransferWarning();
    updatePanelMinistryWarning();

    const timeData = findAvailableTimeElement();
    if (!timeData) return;

    const { element, value } = timeData;
    if (!value) return;

    let badge = document.getElementById('daem-available-time-badge');
    const panelDurationValue = document.getElementById('daem-panel-duration-value');

    // إذا كانت الشارة واللوحة العائمة كلاهما محدثين بالفعل بالقيمة الحالية، نتخطى التحديث
    const isPanelUpdated = panelDurationValue && !panelDurationValue.innerText.includes('جاري') && panelDurationValue.innerText !== '';
    if (badge && badge.getAttribute('data-original-value') === value && isPanelUpdated) {
      return; // كلاهما محدث، لا داعي للتحديث
    }

    let ticketDate = parseTicketDate(value);
    if (!ticketDate || isNaN(ticketDate.getTime())) {
      return;
    }

    const diffDays = calculateDateDifference(ticketDate);
    const durationText = formatElapsedArabic(diffDays);

    // تحديد لون الشارة بناءً على عمر البلاغ
    let bgColor = '#10b981'; // أخضر للبلاغات الجديدة
    let textColor = '#ffffff';

    if (diffDays >= 30) {
      bgColor = '#e11d48'; // وردي/أحمر داكن لأكثر من شهر
    } else if (diffDays >= 7) {
      bgColor = '#ea580c'; // برتقالي لأكثر من أسبوع
    } else if (diffDays >= 3) {
      bgColor = '#f59e0b'; // أصفر/خردلي لأكثر من 3 أيام
    } else if (diffDays > 0) {
      bgColor = '#3b82f6'; // أزرق لأكثر من يوم
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'daem-available-time-badge';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '4px';
      badge.style.marginRight = '8px';
      badge.style.marginLeft = '8px';
      badge.style.padding = '4px 10px';
      badge.style.borderRadius = '20px';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = 'bold';
      badge.style.fontFamily = 'Cairo, sans-serif';
      badge.style.whiteSpace = 'nowrap';
      badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
      badge.style.transition = 'all 0.3s ease';
      badge.style.verticalAlign = 'middle';

      // إدراج الشارة خلف العنصر مباشرة
      element.after(badge);
    }

    badge.style.backgroundColor = bgColor;
    badge.style.color = textColor;
    badge.innerHTML = `🕒 ${durationText}`;
    badge.setAttribute('data-original-value', value);

    // تحديث اللوحة العائمة حياً بالتوازي
    if (panelDurationValue) {
      panelDurationValue.innerText = durationText;
      panelDurationValue.style.color = bgColor;
    }
  } catch (e) {
    console.error("Daem Plus Available Time Error:", e);
  }
}

// تفعيل وظيفة حساب المدة وجدولتها
setTimeout(updateAvailableTimeDisplay, 2000);
setInterval(updateAvailableTimeDisplay, 3000);

// تفعيل وظيفة تحديث تنبيه تحويل البلاغ بشكل مستقل ودوري
// تفعيل وظيفة تحديث تنبيه تحويل البلاغ بشكل مستقل ودوري
setTimeout(updatePanelTransferWarning, 2500);
setInterval(updatePanelTransferWarning, 3000);

// تفعيل وظيفة تحديث تنبيه الوزارة بشكل مستقل ودوري
setTimeout(updatePanelMinistryWarning, 2700);
setInterval(updatePanelMinistryWarning, 3000);

// تفعيل وظيفة لوحة الداشبورد للرئيسية بشكل دوري
setTimeout(injectDashboardPanel, 1500);
setInterval(injectDashboardPanel, 3000);

// ==========================================================
// التوزيع التلقائي للبلاغات الجديدة عند الدخول لصفحة البلاغ
// ==========================================================
async function autoAssignIfNewTicket() {
  try {
    const ticketId = getTicketNumber();
    if (!ticketId) return;

    // تهيئة السجل وتفادي التكرار للبلاغ الحالي
    if (!window.daemAutoAssignedTickets) {
      window.daemAutoAssignedTickets = {};
    }
    if (window.daemAutoAssignedTickets[ticketId]) return;

    // ننتظر حتى اكتمال جلب التذاكر من الموقع لتجنب تكرار الإسناد للبلاغات المسجلة
    if (!window.daemTicketsFetched) return;

    const assigneeInput = findAssigneeInput();
    if (!assigneeInput) return;

    // البحث في قائمة التذاكر المسجلة لدينا بقاعدة البيانات
    const myTicket = websiteTickets.find(t => {
      const n = String(t.number || t.ticketNumber || t.ticket_number || "").trim();
      return n.includes(ticketId) || ticketId.includes(n);
    });

    // نعتبر البلاغ جديداً وغير موزع إذا لم يكن مسجلاً في قاعدة بياناتنا (سواء Notion أو Supabase)
    const isNew = !myTicket;

    if (isNew) {
      // وضع علامة لمنع التكرار قبل البدء لتجنب السباق في الاستدعاء المتزامن
      window.daemAutoAssignedTickets[ticketId] = true;

      // جلب أحدث بيانات التوزيع والترتيب اللحظي فقط إذا كانت القائمة فارغة
      if (!websiteTickets || websiteTickets.length === 0) {
        const tickets = await fetchTicketsPromise();
        if (tickets && tickets.length > 0) {
          websiteTickets = tickets;
        }
      }

      const nextEmployee = getLeastReceiver();
      if (nextEmployee && nextEmployee.user) {
        triggerElementChangeEvents(assigneeInput, nextEmployee.user);

        // تحديث نص زر النسخ في اللوحة
        updateSubmitButtonText(nextEmployee);

        showFloatingNotification(`✨ تم إسناد البلاغ الجديد تلقائياً للموظف: ${nextEmployee.name} (الدور عليه)`);
      }
    }
  } catch (e) {
    console.error("Daem Plus Auto Assign Error:", e);
  }
}

// جدولة تشغيل التحقق من التوزيع التلقائي بشكل أسرع (كل 800 مللي ثانية) لضمان الاستجابة الفورية
setTimeout(autoAssignIfNewTicket, 300);
setInterval(autoAssignIfNewTicket, 800);

// الاستماع للحدث المخصص الذي تم إرساله من بيئة الصفحة لتنفيذ الإسناد والحفظ
window.addEventListener('daem-shortcut-triggered', () => {
  handleKeyboardShortcutAssign();
});

function getHighestAccessibleWindow() {
  let curr = window;
  let highest = window;
  while (true) {
    try {
      if (curr === window.top) break;
      if (curr.parent && curr.parent.document) {
        curr = curr.parent;
        highest = curr;
      } else {
        break;
      }
    } catch (e) {
      break;
    }
  }
  return highest;
}

function queryAllInTab(selector) {
  let elements = [];
  function recurse(doc) {
    if (!doc) return;
    try {
      const found = doc.querySelectorAll(selector);
      elements = elements.concat(Array.from(found));

      const frames = doc.querySelectorAll('iframe, frame');
      for (const frame of frames) {
        try {
          const frameDoc = frame.contentDocument || frame.contentWindow.document;
          if (frameDoc) {
            recurse(frameDoc);
          }
        } catch (e) { }
      }
    } catch (e) { }
  }
  let startDoc = document;
  try {
    const highestWin = getHighestAccessibleWindow();
    if (highestWin && highestWin.document) {
      startDoc = highestWin.document;
    }
  } catch (e) { }
  recurse(startDoc);
  return elements;
}

function globalGetTicketNumber() {
  let titleMatch = document.title.match(/IM\d{5,10}/);
  if (titleMatch) return titleMatch[0];

  try {
    if (window.top && window.top.document && window.top.document.title) {
      titleMatch = window.top.document.title.match(/IM\d{5,10}/);
      if (titleMatch) return titleMatch[0];
    }
  } catch (e) { }

  const inputs = queryAllInTab('input');
  for (const input of inputs) {
    const val = (input.value || '').trim();
    const match = val.match(/^IM\d{5,10}$/);
    if (match) return match[0];
  }
  return '';
}

function globalFindAssigneeInput() {
  const inputs = queryAllInTab('input, textarea');
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const dvdvar = typeof input.getAttribute === 'function' ? (input.getAttribute('dvdvar') || '').toLowerCase() : '';

    if (name === 'instance/assignee.name' || dvdvar === 'instance/assignee.name' || name.includes('assignee.name') ||
      id.includes('1000000322') || name.includes('1000000322')) {
      return input;
    }
  }

  const normalize = (str) => {
    if (!str) return "";
    return str
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/[ىی]/g, "ي")
      .replace(/[أإآ]/g, "ا")
      .replace(/\s+/g, " ")
      .trim();
  };

  const labels = queryAllInTab('label, span, td, div');
  for (const label of labels) {
    if (label.offsetWidth === 0 && label.offsetHeight === 0) continue;

    const rawTxt = label.innerText || '';
    const normTxt = normalize(rawTxt);
    const lowerTxt = normTxt.toLowerCase();

    if (lowerTxt.includes('group') || lowerTxt.includes('مجموع')) continue;

    if (lowerTxt === 'المستقبل' || lowerTxt === 'المستقبل:' ||
      lowerTxt === 'المعين له' || lowerTxt === 'المعين له:' ||
      lowerTxt === 'معين له' || lowerTxt === 'معين له:' ||
      lowerTxt.includes('معين له') || lowerTxt.includes('المعين له') ||
      lowerTxt === 'assignee' || lowerTxt.includes('assignee')) {

      if (label.htmlFor) {
        for (const input of inputs) {
          if (input.id === label.htmlFor) return input;
        }
      }

      const container = label.closest('td, div');
      if (container) {
        const selfInput = container.querySelector('input, textarea, select');
        if (selfInput) return selfInput;

        let sibling = container.nextElementSibling;
        while (sibling) {
          const input = sibling.querySelector('input, textarea, select') ||
            (['INPUT', 'TEXTAREA', 'SELECT'].includes(sibling.tagName) ? sibling : null);
          if (input) return input;
          sibling = sibling.nextElementSibling;
        }
      }
    }
  }

  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (
      (id.includes('assignee') && !id.includes('group')) ||
      (name.includes('assignee') && !name.includes('group')) ||
      (id.includes('receiver') && !id.includes('group')) ||
      (name.includes('receiver') && !name.includes('group'))
    ) {
      return input;
    }
  }
  return null;
}

function globalGetClassification() {
  const inputs = queryAllInTab('input[type="text"]');
  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (
      (name.includes('subcategory') || id.includes('subcategory') || name.includes('product') || id.includes('product')) &&
      !name.includes('group') && !id.includes('group')
    ) {
      if (input.value && input.value.trim() !== '') {
        return input.value.trim();
      }
    }
  }

  for (const input of inputs) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    if (
      (name.includes('category') || id.includes('category')) &&
      !name.includes('group') && !id.includes('group') &&
      !name.includes('type') && !id.includes('type')
    ) {
      const val = (input.value || '').trim();
      if (val !== '' && val.toLowerCase() !== 'incident') {
        return val;
      }
    }
  }
  return '';
}

function globalExtractPhone() {
  const inputs = queryAllInTab('input, textarea, div, span, label, td, th, p');
  const labels = ["جوال المواطن", "رقم الجوال", "الهاتف"];

  for (let el of inputs) {
    const text = el.innerText ? el.innerText.trim() : "";
    const val = el.value ? el.value.trim() : "";
    if (labels.some(label => text.includes(label) || val.includes(label))) {
      let nextCell = el.nextElementSibling;
      if (nextCell) {
        const input = nextCell.querySelector('input');
        const phone = input ? input.value : nextCell.innerText.trim();
        if (phone && phone.length >= 9) return phone;
      }
    }
  }

  let bodyText = document.body.innerText;
  try {
    if (window.top && window.top.document && window.top.document.body) {
      bodyText += " " + window.top.document.body.innerText;
    }
  } catch (e) { }

  const phoneRegex = /(05\d{8}|(?<!\d)5\d{8}(?!\d))/g;
  const matches = bodyText.match(phoneRegex);
  if (matches) return matches[0];
  return "";
}

function globalExtractReportText() {
  const textareas = queryAllInTab('textarea');
  for (let ta of textareas) {
    if (ta.readOnly || ta.disabled) {
      if (ta.value.length > 20) return ta.value;
    }
  }
  for (let ta of textareas) {
    if (ta.value.length > 20 && !ta.value.includes('Asia/Riyadh')) return ta.value;
  }
  return "";
}

function getElementScore(el) {
  // التحقق من أن العنصر مرئي أولاً
  if (!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) {
    return -1; // تجاهل العناصر المخفية
  }

  const label = typeof el.getAttribute === 'function' ? (el.getAttribute('aria-label') || '') : '';
  const shortcuts = typeof el.getAttribute === 'function' ? (el.getAttribute('aria-keyshortcuts') || '') : '';
  const txt = (el.innerText || el.value || el.alt || el.title || label || '').trim();

  // إذا كان النص طويلاً جداً، فهو على الأرجح حاوية عامة وليس الزر نفسه
  if (txt.length > 50) {
    return -1;
  }

  // مؤشرات زر "حفظ وخروج" الحقيقي (هو المطلوب: يحفظ ثم يغلق البلاغ)
  // ملاحظة: اختصار Ctrl+Shift+F2 خاص بـ "حفظ وخروج" في ريميدي
  const isSaveExit = (
    txt === 'حفظ وخروج' ||
    txt === 'Save & Exit' ||
    txt.includes('حفظ وخروج') ||
    txt.includes('Save & Exit') ||
    label.includes('حفظ وخروج') ||
    shortcuts.includes('Ctrl+Shift+F2')
  );

  // مؤشرات زر "الحفظ فقط" (حفظ سجل / Save) — يحفظ دون خروج، لذا يُستخدم كحل أخير فقط
  // اختصار Ctrl+Shift+F1 خاص بـ "حفظ سجل" (حفظ فقط) في ريميدي
  const isSaveOnly = !isSaveExit && (
    txt === 'حفظ' ||
    txt === 'Save' ||
    label === 'حفظ سجل' ||
    label.includes('حفظ سجل') ||
    shortcuts.includes('Ctrl+Shift+F1')
  );

  if (!isSaveExit && !isSaveOnly) {
    return -1;
  }

  let score = 0;

  // أولوية قصوى وحاسمة لزر "حفظ وخروج" حتى لا يُختار "حفظ سجل" بالخطأ عند ظهوره أولاً
  if (isSaveExit) {
    score += 1000;
    if (shortcuts.includes('Ctrl+Shift+F2')) score += 200; // تأكيد إضافي عبر الاختصار
    if (txt === 'حفظ وخروج' || txt === 'Save & Exit') score += 100; // تطابق نصي تام
  } else {
    // زر الحفظ فقط: نقطة واحدة فقط ليُستخدم كحل احتياطي عند غياب زر "حفظ وخروج"
    score += 1;
  }

  // النص الأقصر أفضل (لأنه يمثل تسمية الزر المحددة)
  score += (50 - txt.length);

  // تصنيف العناصر التفاعلية المفضلة
  const tagName = el.tagName.toUpperCase();
  if (tagName === 'BUTTON' || (tagName === 'INPUT' && el.type === 'button')) {
    score += 40;
  } else if (tagName === 'A' || el.getAttribute('role') === 'button') {
    score += 30;
  } else if (el.className && typeof el.className === 'string' && el.className.includes('btn')) {
    score += 25;
  } else if (tagName === 'SPAN') {
    score += 20;
  } else if (tagName === 'TD') {
    score += 10;
  }

  return score;
}

function globalClickSaveAndExit() {
  const elements = queryAllInTab('button, input[type="button"], span, a, td, div, img');

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
    // محاولة إيجاد العنصر التفاعلي الأقرب (مثل زر أو رابط أو عنصر يحمل كلاس btn)
    const interactiveParent = bestElement.closest('button, a, input[type="button"], [role="button"], [class*="btn"]');
    const elementToClick = interactiveParent || bestElement;

    // إرسال سلسلة أحداث الماوس الكاملة لضمان توافقية معالجات ExtJS / Remedy
    elementToClick.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    elementToClick.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    elementToClick.click();
    return true;
  }

  return false;
}

async function handleKeyboardShortcutAssign() {
  const ticketId = getTicketNumber();
  if (!ticketId) {
    showFloatingNotification("فشل تحديد رقم التذكرة بالصفحة! ⚠️");
    return;
  }

  // جلب البيانات اللحظية فقط إذا كانت فارغة
  if (!websiteTickets || websiteTickets.length === 0) {
    showFloatingNotification("جاري التحقق من حالة البلاغ... ⏳");
    const tickets = await fetchTicketsPromise();
    if (tickets && tickets.length > 0) {
      websiteTickets = tickets;
    }
  }

  // التحقق مما إذا كان البلاغ موجوداً مسبقاً في قاعدة البيانات
  const myTicket = websiteTickets.find(t => {
    const n = String(t.number || t.ticketNumber || t.ticket_number || "").trim();
    return n.includes(ticketId) || ticketId.includes(n);
  });

  if (myTicket) {
    showFloatingNotification("البلاغ مسجل مسبقاً؛ جاري حفظ التذكرة والخروج... 💾");
    setTimeout(() => {
      const clicked = clickSaveAndExit();
      if (!clicked) {
        showFloatingNotification("تعذر العثور على زر 'حفظ وخروج' بالصفحة! ⚠️");
      }
    }, 100);
    return;
  }

  const assigneeInput = findAssigneeInput();
  if (!assigneeInput) {
    showFloatingNotification("تعذر العثور على حقل المعين له! جاري محاولة الحفظ والخروج... ⚠️");
    setTimeout(() => {
      clickSaveAndExit();
    }, 100);
    return;
  }

  const nextEmployee = getLeastReceiver();
  if (!nextEmployee || !nextEmployee.user) {
    showFloatingNotification("تعذر حساب الموظف التالي! جاري محاولة الحفظ والخروج... ⚠️");
    setTimeout(() => {
      clickSaveAndExit();
    }, 100);
    return;
  }

  // 1. تغيير حقل المعين له
  triggerElementChangeEvents(assigneeInput, nextEmployee.user);
  showFloatingNotification(`تم إدخال الموظف: ${nextEmployee.name} 👤`);

  // 2. تحويل وإسناد البلاغ (حفظه في قاعدة البيانات والخروج)
  const category = getClassification() || "أخرى";
  const localDate = new Date();
  const offset = 3 * 60; // UTC+3
  const localTime = new Date(localDate.getTime() + (localDate.getTimezoneOffset() + offset) * 60000);
  const dateStr = localTime.toISOString().split('T')[0];

  safeGetStorage(['daemRole'], (result) => {
    const role = result.daemRole || 'support';
    const phoneNumber = extractPhone();
    const reportText = extractReportText();
    const municipality = extractMunicipality();

    const apiData = {
      date: dateStr,
      receiver: nextEmployee.name,
      ticketNumber: ticketId,
      type: normalizeCategory(category),
      solution: 'بلاغ جديد',
      phoneNumber: phoneNumber,
      reportText: reportText,
      municipality: municipality,
      role: role,
      nationalId: extractNationalId()
    };

    showFloatingNotification("جاري إسناد البلاغ وحفظ البيانات... ⏳");

    safeSendMessage({ action: "CREATE_TICKET", data: apiData }, (response) => {
      if (response && response.success) {
        showFloatingNotification(`تم حفظ البلاغ (${ticketId}) بنجاح! 🚀`);

        // الضغط تلقائياً على زر حفظ وخروج بعد حفظ البيانات بقاعدة البيانات لإنهاء الإجراء
        setTimeout(() => {
          const clicked = clickSaveAndExit();
          if (clicked) {
            showFloatingNotification("جاري حفظ التذكرة والخروج تلقائياً... 💾");
          } else {
            showFloatingNotification("تعذر العثور على زر 'حفظ وخروج' بالصفحة! ⚠️");
          }
        }, 100);
      } else {
        showFloatingNotification(`فشل حفظ البلاغ تلقائياً: ${response?.error || 'خطأ غير معروف'} ⚠️`);
        // حتى لو فشل الحفظ، نقوم بالخروج والحفظ لكيلا تتعطل إنتاجية المستخدم
        setTimeout(() => {
          clickSaveAndExit();
        }, 200);
      }
    });
  });
}
