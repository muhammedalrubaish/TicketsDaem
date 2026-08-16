// popup.js - Manifest V3 bridge for Balady WhatsApp Extension
const iframe = document.getElementById('daem-iframe');

// الاستماع للرسائل القادمة من إطار صفحة الويب Vercel
window.addEventListener('message', async (event) => {
  if (!event.data) return;

  // 1. طلب سحب البيانات من الصفحة
  if (event.data.action === 'EXTRACT_DATA') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        sendToIframe('EXTRACTED_DATA', { ticketNumber: '', reportText: '', phoneNumber: '' });
        return;
      }

      // البحث عن رقم التذكرة النشطة في عنوان التبويب الرئيسي (Document Title)
      const titleMatch = tab.title ? tab.title.match(/IM\d{5,12}/) : null;
      const activeTicketFromTitle = titleMatch ? titleMatch[0] : null;

      // تنفيذ كود السحب داخل جميع الإطارات (Iframes) في تبويب المتصفح
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          // دالة للتحقق من أن الإطار مرئي وليس مخفياً في الخلفية (تبويبات HPSM غير النشطة)
          function isFrameVisible() {
            try {
              // إذا كان العرض أو الارتفاع للنافذة 0، فهو بالتأكيد مخفي
              if (window.innerWidth === 0 || window.innerHeight === 0) return false;
              if (document.body) {
                const style = window.getComputedStyle(document.body);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
              }
              return true;
            } catch (e) {
              return true;
            }
          }

          // دالة مساعدة عامة للبحث عن قيم بناءً على التسميات التوضيحية
          function extractValue(labels) {
            const allElements = document.querySelectorAll('div, span, label, td, th, p, b, input, textarea');
            for (let el of allElements) {
              const text = el.innerText ? el.innerText.trim() : "";
              const val = el.value ? el.value.trim() : "";
              
              if (labels.some(label => text.includes(label) || val.includes(label))) {
                // 1. محاولة جلبها من السطر نفسه في حال وجود نقطتين فوق بعض
                if (text.includes(':')) {
                  let parts = text.split(':');
                  if (parts[1] && parts[1].trim().length > 1) return parts[1].trim();
                }

                // 2. البحث الذكي باستخدام الحاوية الأقرب (TD, DIV, TR) لضمان الوصول للمدخل
                let container = el.closest('td, th, tr, div');
                if (container) {
                  // أ. البحث عن أي input أو textarea داخل نفس الحاوية
                  let input = container.querySelector('input, textarea');
                  if (input && input.value && input !== el) return input.value;

                  // ب. البحث في الحاوية المجاورة التالية
                  let next = container.nextElementSibling;
                  if (next) {
                    input = next.querySelector('input, textarea') || (['INPUT', 'TEXTAREA'].includes(next.tagName) ? next : null);
                    if (input && input.value) return input.value;
                    // إذا كانت خلية جدول وبها نص عادي
                    if (next.innerText && next.innerText.trim().length > 1) return next.innerText.trim();
                  }

                  // ج. البحث في الحاوية المجاورة السابقة (دعم RTL)
                  let prev = container.previousElementSibling;
                  if (prev) {
                    input = prev.querySelector('input, textarea') || (['INPUT', 'TEXTAREA'].includes(prev.tagName) ? prev : null);
                    if (input && input.value) return input.value;
                    // إذا كانت خلية جدول وبها نص عادي
                    if (prev.innerText && prev.innerText.trim().length > 1) return prev.innerText.trim();
                  }
                }
              }
            }
            return "";
          }

          function extractTicketByRegex() {
            const bodyText = document.body.innerText;
            const ticketRegex = /IM\d{5,12}/g;
            const matches = bodyText.match(ticketRegex);
            return matches ? matches[0] : "";
          }

          function extractReportText() {
            const textareas = document.querySelectorAll('textarea');
            for (let ta of textareas) {
              if (ta.value.length > 20 && !ta.readOnly && !ta.disabled) return ta.value;
            }
            return extractValue(["نص البلاغ", "تفاصيل البلاغ", "الوصف"]);
          }

          function extractPhone() {
            // دالة تنظيف ومطابقة الجوال السعودي وتحويله للصيغة الدولية
            function cleanPhoneString(str) {
              if (!str) return null;
              // إبقاء الأرقام فقط وتجاهل أي رموز أخرى
              let cleaned = str.trim().replace(/\D/g, '');
              
              if (cleaned.length === 9 && cleaned.startsWith('5')) {
                return '966' + cleaned;
              }
              if (cleaned.length === 10 && cleaned.startsWith('05')) {
                return '966' + cleaned.substring(1);
              }
              if (cleaned.length === 12 && cleaned.startsWith('9665')) {
                return cleaned;
              }
              if (cleaned.length === 14 && cleaned.startsWith('009665')) {
                return cleaned.substring(2);
              }
              return null;
            }

            // أ. البحث عن الحقول الموجهة عبر التسمية أولاً
            const fromLabel = extractValue(["جوال المواطن", "رقم الجوال", "الهاتف", "الجوال", "المحمول"]);
            if (fromLabel) {
              const val = cleanPhoneString(fromLabel);
              if (val) return val;
            }

            // ب. البحث في جميع حقول المدخلات بالصفحة
            const inputs = document.querySelectorAll('input, textarea');
            for (let input of inputs) {
              const val = cleanPhoneString(input.value);
              if (val) return val;
            }

            // ج. البحث في العناصر النصية الصغيرة بالصفحة (خلايا، نصوص، فقرات)
            const textElements = document.querySelectorAll('span, div, td, p');
            for (let el of textElements) {
              if (el.children.length === 0 && el.innerText) {
                const val = cleanPhoneString(el.innerText);
                if (val) return val;
              }
            }

            return "";
          }

          return {
            isVisible: isFrameVisible(),
            ticketNumber: extractTicketByRegex() || extractValue(["رقم التذكرة", "رقم البلاغ", "التذكرة"]),
            reportText: extractReportText(),
            phoneNumber: extractPhone()
          };
        }
      });

      // منطق الدمج الذكي المطوّر لمنع تداخل أرقام التذاكر الأخرى تماماً
      let finalData = { ticketNumber: '', reportText: '', phoneNumber: '' };

      // 1. إذا وجدنا رقم تذكرة في عنوان التبويب الرئيسي، نطابق الإطارات بناءً عليه
      if (activeTicketFromTitle) {
        const matchedResults = results.filter(r => r.result && r.result.ticketNumber && r.result.ticketNumber.includes(activeTicketFromTitle));
        
        if (matchedResults.length > 0) {
          for (const { result } of matchedResults) {
            if (!finalData.ticketNumber && result.ticketNumber) finalData.ticketNumber = result.ticketNumber;
            if (!finalData.reportText && result.reportText) finalData.reportText = result.reportText;
            if (!finalData.phoneNumber && result.phoneNumber) finalData.phoneNumber = result.phoneNumber;
          }
        }
      }

      // 2. إذا لم نجد رقم التذكرة النشطة في العنوان أو لم يطابق أي إطار، نستخدم الإطارات المرئية كخيار احتياطي ثانٍ
      if (!finalData.ticketNumber || !finalData.phoneNumber) {
        const visibleResults = results.filter(r => r.result && r.result.isVisible);
        for (const { result } of visibleResults) {
          if (!finalData.ticketNumber && result.ticketNumber) finalData.ticketNumber = result.ticketNumber;
          if (!finalData.reportText && result.reportText) finalData.reportText = result.reportText;
          if (!finalData.phoneNumber && result.phoneNumber) finalData.phoneNumber = result.phoneNumber;
        }
      }

      // 3. كخيار احتياطي أخير جداً: إذا لم نحصل على هاتف، نبحث في بقية الإطارات
      if (!finalData.phoneNumber) {
        const hiddenResults = results.filter(r => r.result && !r.result.isVisible);
        for (const { result } of hiddenResults) {
          if (result.phoneNumber) {
            finalData.phoneNumber = result.phoneNumber;
            if (!finalData.ticketNumber && result.ticketNumber) finalData.ticketNumber = result.ticketNumber;
            if (!finalData.reportText && result.reportText) finalData.reportText = result.reportText;
            break;
          }
        }
      }

      sendToIframe('EXTRACTED_DATA', finalData);
    } catch (err) {
      console.error('Extraction bridge error:', err);
      sendToIframe('EXTRACTED_DATA', { ticketNumber: '', reportText: '', phoneNumber: '' });
    }
  }

  // 2. طلب توجيه وفتح محادثة الواتساب في التبويب الموجود بالفعل أو فتح تبويب جديد إذا لم يكن موجوداً
  if (event.data.action === 'OPEN_WHATSAPP' && event.data.url) {
    chrome.tabs.query({}, (tabs) => {
      const targetTab = tabs.find(tab => 
        tab.url && (
          tab.url.includes("web.whatsapp.com") || 
          tab.url.includes("api.whatsapp.com") || 
          tab.url.includes("wa.me")
        )
      );
      if (targetTab) {
        // التركيز على النافذة التي تحتوي على التبويب
        chrome.windows.update(targetTab.windowId, { focused: true });
        // تحديث الرابط وتنشيط التبويب
        chrome.tabs.update(targetTab.id, { url: event.data.url, active: true });
      } else {
        chrome.tabs.create({ url: event.data.url });
      }
    });
  }

  // 3. استلام إشعار بوجود تحديث جديد للإضافة من صفحة الويب
  if (event.data.action === 'UPDATE_AVAILABLE') {
    showUpdateBanner(event.data.downloadUrl);
  }

  // 4. طلب جلب الإعدادات من التخزين الآمن للإضافة (chrome.storage.local)
  if (event.data.action === 'GET_SETTINGS') {
    chrome.storage.local.get(['balady_whatsapp_empName', 'balady_whatsapp_template'], (result) => {
      sendToIframe('SETTINGS_DATA', {
        empName: result.balady_whatsapp_empName || '',
        msgTemplate: result.balady_whatsapp_template || ''
      });
    });
  }

  // 5. حفظ الإعدادات في التخزين الآمن للإضافة (chrome.storage.local)
  if (event.data.action === 'SAVE_SETTINGS' && event.data.data) {
    chrome.storage.local.set({
      balady_whatsapp_empName: event.data.data.empName,
      balady_whatsapp_template: event.data.data.msgTemplate
    });
  }
});

// عرض شريط التحديث وتعديل ارتفاع نافذة الإضافة
function showUpdateBanner(downloadUrl) {
  const banner = document.getElementById('update-banner');
  const link = document.getElementById('update-link');
  if (banner) {
    banner.style.display = 'block';
    // زيادة ارتفاع الـ body لكي لا ينقص ارتفاع الـ iframe
    document.body.style.height = '645px';
    if (link) {
      link.href = downloadUrl || "https://drive.google.com/drive/folders/1Qu7fYSYR7My--cK7B7VuA9wM6OfgjFy8";
    }
  }
}

// إرسال البيانات المستخرجة إلى إطار الويب
function sendToIframe(action, data) {
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ action, data }, '*');
  }
}

// تحديث رابط الإطار ليشمل رقم الإصدار المخزن
function updateIframeSrc() {
  try {
    const version = chrome.runtime.getManifest().version;
    const targetSrc = "https://tickets-daem.vercel.app/whatsapp-popup?v=" + version;
    if (iframe && iframe.src !== targetSrc && iframe.src !== targetSrc + "/") {
      iframe.src = targetSrc;
    }
  } catch (e) {
    console.error("Failed to read chrome manifest version:", e);
  }
}

// تشغيل التحديث عند الجاهزية
document.addEventListener('DOMContentLoaded', updateIframeSrc);
