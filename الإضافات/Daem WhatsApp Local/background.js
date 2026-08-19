// ==========================================================================
// داعم واتساب - Background Service Worker
// ==========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_WHATSAPP') {
    chrome.tabs.query({}, (tabs) => {
      // البحث عن تبويب واتساب المفتوح بالفعل
      const targetTab = tabs.find(tab =>
        tab.url && (
          tab.url.includes("web.whatsapp.com") ||
          tab.url.includes("api.whatsapp.com") ||
          tab.url.includes("wa.me")
        )
      );

      if (targetTab) {
        // 1. التركيز على نافذة المتصفح التي تحتوي على واتساب
        if (targetTab.windowId) {
          chrome.windows.update(targetTab.windowId, { focused: true });
        }
        // 2. الانتقال المباشر للتبويب دون إعادة تحميل الصفحة (Zero Reload)
        chrome.tabs.update(targetTab.id, { active: true }, () => {
          sendResponse({ success: true, switched: true });
        });
      } else {
        // إذا لم يكن تبويب واتساب مفتوحاً مسبقاً، نفتحه في تبويب جديد
        const openUrl = request.url || 'https://web.whatsapp.com';
        chrome.tabs.create({ url: openUrl, active: true }, () => {
          sendResponse({ success: true, created: true });
        });
      }
    });

    return true; // Keep message channel open for async response
  }
});
