// ==========================================================================
// داعم واتساب - Background Service Worker
// ==========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_WHATSAPP' && request.url) {
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
        // التركيز على النافذة التي تحوي التبويب
        if (targetTab.windowId) {
          chrome.windows.update(targetTab.windowId, { focused: true });
        }
        // تحديث رابط التبويب نفسه بالرسالة الجديدة وتنشيطه
        chrome.tabs.update(targetTab.id, { url: request.url, active: true }, () => {
          sendResponse({ success: true, switched: true });
        });
      } else {
        // إذا لم يكن مفتوحاً، نفتح تبويباً جديداً عادياً وليس نافذة منبثقة
        chrome.tabs.create({ url: request.url, active: true }, () => {
          sendResponse({ success: true, created: true });
        });
      }
    });

    return true; // Keep message channel open for async response
  }
});
