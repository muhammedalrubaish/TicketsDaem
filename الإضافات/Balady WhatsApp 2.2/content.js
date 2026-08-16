// دالة متطورة جداً للبحث عن القيم
function extractValue(labels) {
    const allElements = document.querySelectorAll('div, span, label, td, th, p, b, input, textarea');
    for (let el of allElements) {
        const text = el.innerText ? el.innerText.trim() : "";
        const val = el.value ? el.value.trim() : "";
        
        // إذا كانت التسمية موجودة في النص
        if (labels.some(label => text.includes(label) || val.includes(label))) {
            let foundValue = "";
            
            // 1. محاولة إيجاد القيمة في نفس العنصر (إذا كان يحتوي على ":" )
            if (text.includes(':')) {
                let parts = text.split(':');
                if (parts[1] && parts[1].trim().length > 1) foundValue = parts[1].trim();
            }

            // 2. البحث في الأشقاء التاليين
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

            // 3. البحث في الخلية المجاورة (للجداول)
            if (!foundValue && (el.tagName === 'TD' || el.tagName === 'TH' || el.parentElement.tagName === 'TD')) {
                let cell = el.tagName === 'TD' ? el : el.parentElement;
                let nextCell = cell.nextElementSibling;
                if (nextCell) {
                    const input = nextCell.querySelector('input, textarea');
                    foundValue = input ? input.value : nextCell.innerText.trim();
                }
            }

            if (foundValue && foundValue.length > 1) return foundValue;
        }
    }
    return "";
}

// استخراج رقم التذكرة بالاعتماد على النمط (IM متبوعاً بأرقام)
function extractTicketByRegex() {
    const bodyText = document.body.innerText;
    const ticketRegex = /IM\d{5,12}/g;
    const matches = bodyText.match(ticketRegex);
    return matches ? matches[0] : "";
}

function extractReportText() {
    const textareas = document.querySelectorAll('textarea');
    for (let ta of textareas) {
        // غالباً نص البلاغ يكون أطول نص مكتوب
        if (ta.value.length > 20) return ta.value;
    }
    return extractValue(["نص البلاغ", "تفاصيل البلاغ", "الوصف"]);
}

function extractPhone() {
    // 1. البحث عن تسميات الجوال
    const fromLabel = extractValue(["جوال المواطن", "رقم الجوال", "الهاتف"]);
    if (fromLabel && fromLabel.length >= 9) return fromLabel;

    // 2. البحث بنمط الأرقام السعودية (05 أو 5)
    const bodyText = document.body.innerText;
    const phoneRegex = /(05\d{8}|(?<!\d)5\d{8}(?!\d))/g;
    const matches = bodyText.match(phoneRegex);
    if (matches) {
        // نختار الرقم الذي يبدأ بـ 05 أو 5 ويحتوي على 9-10 خانات
        return matches[0];
    }
    return "";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractData") {
        const ticket = extractTicketByRegex() || extractValue(["رقم التذكرة", "رقم البلاغ", "التذكرة"]);
        const phone = extractPhone();
        const report = extractReportText();
        
        sendResponse({
            ticketNumber: ticket,
            reportText: report,
            phoneNumber: phone
        });
    }
    return true;
});
