// options.js - إدارة عنوان السيرفر وصلاحيات الوصول إليه
const input = document.getElementById('server');
const statusEl = document.getElementById('status');

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || '';
}

// عرض العنوان المحفوظ حالياً عند فتح الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  const current = await DaemConfig.getServerUrl();
  input.value = current;
  input.placeholder = DaemConfig.DEFAULT_SERVER;
});

// طلب صلاحية الوصول للسيرفر الجديد (مطلوبة لأي عنوان خارج الافتراضي)
function requestPermission(url) {
  const origin = DaemConfig.hostPattern(url);
  if (!origin) return Promise.resolve(false);
  return new Promise(resolve => {
    try {
      chrome.permissions.request({ origins: [origin] }, granted => resolve(!!granted));
    } catch (e) {
      resolve(false);
    }
  });
}

document.getElementById('save').addEventListener('click', async () => {
  const value = DaemConfig.normalize(input.value);

  if (!value) {
    await DaemConfig.setServerUrl('');
    input.value = DaemConfig.DEFAULT_SERVER;
    setStatus('✅ تمت العودة إلى السيرفر الافتراضي.', 'ok');
    return;
  }

  const granted = await requestPermission(value);
  if (!granted) {
    setStatus('⚠️ لم تُمنح صلاحية الوصول لهذا السيرفر، لن تعمل الإضافة معه. أعد المحاولة ووافق على الطلب.', 'err');
    return;
  }

  await DaemConfig.setServerUrl(value);
  input.value = value;
  setStatus('✅ تم حفظ السيرفر: ' + value, 'ok');
});

document.getElementById('reset').addEventListener('click', async () => {
  await DaemConfig.setServerUrl('');
  input.value = DaemConfig.DEFAULT_SERVER;
  setStatus('↩️ تمت العودة إلى السيرفر الافتراضي.', 'ok');
});

document.getElementById('test').addEventListener('click', async () => {
  const value = DaemConfig.normalize(input.value) || DaemConfig.DEFAULT_SERVER;
  setStatus('⏳ جارٍ اختبار الاتصال...', '');

  const granted = await requestPermission(value);
  if (!granted) {
    setStatus('⚠️ يجب منح صلاحية الوصول للسيرفر أولاً.', 'err');
    return;
  }

  try {
    const response = await fetch(value + '/api/tickets-json', { method: 'GET' });
    if (response.ok) {
      setStatus('✅ الاتصال ناجح بالسيرفر: ' + value, 'ok');
    } else {
      setStatus('❌ استجاب السيرفر برمز: ' + response.status, 'err');
    }
  } catch (e) {
    setStatus('❌ تعذّر الوصول للسيرفر: ' + e.message, 'err');
  }
});
