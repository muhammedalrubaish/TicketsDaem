/**
 * الخدمة الخلفية - مهمتها الوحيدة ربط الإضافة بالسيرفر المُعد حالياً.
 * عند اختيار سيرفر خارجي من صفحة الإعدادات، يُسجَّل سكربت الحقن
 * (vercel-inject.js) على عنوان ذلك السيرفر ديناميكياً.
 */
importScripts('config.js');

const CUSTOM_SCRIPT_ID = 'vercel-inject-custom-server';

async function syncCustomServerInjection() {
  const server = await DaemConfig.getServerUrl();
  const pattern = DaemConfig.hostPattern(server);

  // إزالة أي تسجيل سابق لتفادي التكرار عند تغيير السيرفر
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CUSTOM_SCRIPT_ID] });
  } catch (e) {
    // لا يوجد تسجيل سابق - تجاهل
  }

  // السيرفر الافتراضي مُسجَّل أصلاً في manifest.json
  if (!pattern || server === DaemConfig.DEFAULT_SERVER) return;

  try {
    const granted = await chrome.permissions.contains({ origins: [pattern] });
    if (!granted) return;

    await chrome.scripting.registerContentScripts([{
      id: CUSTOM_SCRIPT_ID,
      matches: [pattern],
      js: ['vercel-inject.js'],
      allFrames: true,
      runAt: 'document_idle'
    }]);
  } catch (e) {
    console.error('تعذّر تسجيل سكربت الحقن للسيرفر الخارجي:', e.message);
  }
}

chrome.runtime.onInstalled.addListener(syncCustomServerInjection);
chrome.runtime.onStartup.addListener(syncCustomServerInjection);

// إعادة الضبط فور تغيير عنوان السيرفر من صفحة الإعدادات
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[DaemConfig.STORAGE_KEY]) {
    syncCustomServerInjection();
  }
});
