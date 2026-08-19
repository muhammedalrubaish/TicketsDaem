// ==========================================================================
// منطق شاشة الإعدادات - Popup JS
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

let currentEmployees = [...DEFAULT_EMPLOYEES];

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadSettings();
  setupEvents();
});

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

function loadSettings() {
  chrome.storage.local.get(['dwa_template', 'dwa_employees', 'dwa_group_url'], (res) => {
    // 1. القالب
    const templateInput = document.getElementById('template-input');
    templateInput.value = res.dwa_template || DEFAULT_TEMPLATE;

    // 2. قائمة الموظفين
    if (res.dwa_employees && Array.isArray(res.dwa_employees) && res.dwa_employees.length > 0) {
      currentEmployees = res.dwa_employees;
    } else {
      currentEmployees = [...DEFAULT_EMPLOYEES];
    }
    renderEmployeesList();

    // 3. رابط القروب
    const groupInput = document.getElementById('group-url-input');
    groupInput.value = res.dwa_group_url || '';
  });
}

function renderEmployeesList() {
  const container = document.getElementById('employees-list-container');
  container.innerHTML = '';

  if (currentEmployees.length === 0) {
    container.innerHTML = '<div style="font-size: 11px; color: #94a3b8; text-align: center; padding: 10px;">لا يوجد موظفون بالقائمة. أضف موظفاً بالأعلى.</div>';
    return;
  }

  currentEmployees.forEach((emp, index) => {
    const item = document.createElement('div');
    item.className = 'emp-item';
    item.innerHTML = `
      <div class="emp-info">
        <span>👤 <b>${emp.name}</b></span>
        <span class="emp-user-badge">(${emp.user})</span>
      </div>
      <button class="emp-del-btn" data-index="${index}" title="حذف">🗑️</button>
    `;
    container.appendChild(item);
  });

  // ربط أزرار الحذف
  container.querySelectorAll('.emp-del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      currentEmployees.splice(idx, 1);
      renderEmployeesList();
    });
  });
}

function setupEvents() {
  // إدراج المتغيرات في القالب
  document.querySelectorAll('.tag-badge').forEach(tag => {
    tag.addEventListener('click', () => {
      const textToInsert = tag.dataset.insert;
      const textarea = document.getElementById('template-input');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      textarea.value = text.substring(0, start) + textToInsert + text.substring(end);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    });
  });

  // استعادة القالب الافتراضي
  document.getElementById('btn-reset-template').addEventListener('click', () => {
    document.getElementById('template-input').value = DEFAULT_TEMPLATE;
  });

  // إضافة موظف جديد
  document.getElementById('btn-add-emp').addEventListener('click', () => {
    const nameInput = document.getElementById('new-emp-name');
    const userInput = document.getElementById('new-emp-user');
    const name = nameInput.value.trim();
    const user = userInput.value.trim();

    if (!name || !user) {
      alert('يرجى إدخال اسم الموظف ويوزر النظام معاً.');
      return;
    }

    currentEmployees.push({ name, user });
    nameInput.value = '';
    userInput.value = '';
    renderEmployeesList();
  });

  // إعادة ضبط الدور للأول
  document.getElementById('btn-reset-emp-index').addEventListener('click', () => {
    chrome.storage.local.set({ dwa_next_employee_index: 0 }, () => {
      showStatus('تمت إعادة ضبط الدور للموظف الأول بنجاح! 🔄');
    });
  });

  // استعادة القائمة الافتراضية
  document.getElementById('btn-restore-default-emp').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من استعادة قائمة الموظفين الافتراضية؟')) {
      currentEmployees = [...DEFAULT_EMPLOYEES];
      renderEmployeesList();
    }
  });

  // حفظ جميع الإعدادات
  document.getElementById('btn-save-all').addEventListener('click', () => {
    const template = document.getElementById('template-input').value.trim() || DEFAULT_TEMPLATE;
    const groupUrl = document.getElementById('group-url-input').value.trim();

    chrome.storage.local.set({
      dwa_template: template,
      dwa_employees: currentEmployees,
      dwa_group_url: groupUrl
    }, () => {
      showStatus('تم حفظ الإعدادات بنجاح! 💾');
    });
  });
}

function showStatus(msg) {
  const statusEl = document.getElementById('save-status');
  statusEl.innerText = msg;
  setTimeout(() => {
    statusEl.innerText = '';
  }, 3000);
}
