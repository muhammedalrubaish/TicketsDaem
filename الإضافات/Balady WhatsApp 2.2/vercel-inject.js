// vercel-inject.js - كود لحقن أيقونة الواتساب الرسمية في صفحة Vercel
function replaceWhatsAppIcon() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    // التحقق من وجود نص متعلق بالواتساب داخل الزر
    if (btn.textContent.includes('واتساب') || btn.textContent.includes('إرسال')) {
      const svg = btn.querySelector('svg');
      if (svg) {
        // منع التكرار اللانهائي
        if (svg.getAttribute('data-real-whatsapp') === 'true') return;
        
        // إنشاء عنصر SVG جديد لأيقونة الواتساب الرسمية
        const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        newSvg.setAttribute('viewBox', '0 0 24 24');
        newSvg.setAttribute('width', '24');
        newSvg.setAttribute('height', '24');
        newSvg.setAttribute('fill', 'currentColor');
        newSvg.setAttribute('data-real-whatsapp', 'true');
        
        if (svg.className) {
          newSvg.setAttribute('class', svg.className.baseVal || svg.className);
        }
        
        newSvg.innerHTML = `<path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.293 1.503 5.397 1.505 5.518.002 10.01-4.48 10.013-9.988.002-2.67-1.033-5.18-2.909-7.059C17.266 1.733 14.773.7 12.008.7c-5.52 0-10.014 4.479-10.017 9.986-.001 2.14.56 4.225 1.624 5.922L2.57 20.572l4.077-1.418zm11.233-5.263c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>`;
        svg.parentNode.replaceChild(newSvg, svg);
      }
    }
  });
}

// البدء عند تحميل الصفحة ومراقبة التغييرات في شجرة العناصر (DOM)
replaceWhatsAppIcon();
const observer = new MutationObserver(replaceWhatsAppIcon);
observer.observe(document.body, { childList: true, subtree: true });
