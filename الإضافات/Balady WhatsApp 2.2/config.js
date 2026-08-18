/**
 * ==============================================================
 *  config.js - نقطة الفصل الوحيدة بين الإضافة والسيرفر
 * ==============================================================
 * الهدف: عدم وجود أي عنوان سيرفر مكتوب داخل بقية ملفات الإضافة،
 * بحيث يمكن مستقبلاً ربط الإضافة بالسيرفر الخارجي (الشبكة الداخلية / VPN)
 * من صفحة الإعدادات فقط دون أي تعديل برمجي.
 *
 * يعمل هذا الملف في كل بيئات الإضافة:
 *   - الخدمة الخلفية (background.js) عبر importScripts
 *   - سكربت المحتوى (content.js)
 *   - صفحات الإضافة (popup.html / options.html)
 */
(function (root) {
  'use strict';

  /** السيرفر الافتراضي (السحابي) */
  const DEFAULT_SERVER = 'https://tickets-daem.vercel.app';
  /** مفتاح تخزين عنوان السيرفر المخصص */
  const STORAGE_KEY = 'daemServerUrl';

  let cachedServer = DEFAULT_SERVER;

  /** توحيد صيغة العنوان: إضافة البروتوكول وحذف الشرطة الأخيرة */
  function normalize(url) {
    if (!url) return '';
    let value = String(url).trim();
    if (!value) return '';
    if (!/^https?:\/\//i.test(value)) value = 'http://' + value;
    return value.replace(/\/+$/, '');
  }

  /** استخراج المضيف (host) من أي عنوان */
  function hostOf(url) {
    try {
      return new URL(url).host.toLowerCase();
    } catch (e) {
      return '';
    }
  }

  const hasStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  /** تحميل العنوان المخزَّن مرة واحدة عند بدء التشغيل */
  const ready = new Promise(resolve => {
    if (!hasStorage) return resolve(cachedServer);
    try {
      chrome.storage.local.get([STORAGE_KEY], result => {
        const stored = normalize(result && result[STORAGE_KEY]);
        if (stored) cachedServer = stored;
        resolve(cachedServer);
      });
    } catch (e) {
      resolve(cachedServer);
    }
  });

  // تحديث النسخة المخزَّنة فوراً عند تغيير العنوان من صفحة الإعدادات
  if (hasStorage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) return;
      cachedServer = normalize(changes[STORAGE_KEY].newValue) || DEFAULT_SERVER;
    });
  }

  /** عنوان السيرفر الحالي (بعد اكتمال التحميل) */
  async function getServerUrl() {
    await ready;
    return cachedServer;
  }

  /** عنوان السيرفر الحالي بشكل متزامن (قد يكون الافتراضي قبل اكتمال التحميل) */
  function getServerUrlSync() {
    return cachedServer;
  }

  /** بناء رابط واجهة برمجية كامل: apiUrl('/api/leaves') */
  async function apiUrl(path) {
    const base = await getServerUrl();
    return base + (path.startsWith('/') ? path : '/' + path);
  }

  /** نسخة متزامنة من apiUrl */
  function apiUrlSync(path) {
    return cachedServer + (path.startsWith('/') ? path : '/' + path);
  }

  /** حفظ عنوان سيرفر جديد (تمرير قيمة فارغة = العودة للافتراضي) */
  function setServerUrl(url) {
    const value = normalize(url);
    cachedServer = value || DEFAULT_SERVER;
    return new Promise(resolve => {
      if (!hasStorage) return resolve(cachedServer);
      if (!value) {
        chrome.storage.local.remove([STORAGE_KEY], () => resolve(cachedServer));
      } else {
        chrome.storage.local.set({ [STORAGE_KEY]: value }, () => resolve(cachedServer));
      }
    });
  }

  /** هل هذا العنوان يخص لوحة التحكم (السيرفر الحالي أو الافتراضي أو محلي)؟ */
  function isDashboardUrl(href) {
    const host = hostOf(href);
    if (!host) return false;
    if (host === hostOf(cachedServer)) return true;
    if (host === hostOf(DEFAULT_SERVER)) return true;
    return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  }

  /** هل هذا العنوان يخص لوحة التحكم وأحد المسارات المحددة؟ */
  function isDashboardPath(href, paths) {
    if (!isDashboardUrl(href)) return false;
    try {
      const pathname = new URL(href).pathname.replace(/\/+$/, '') || '/';
      return (paths || []).some(p => pathname === p || pathname.startsWith(p + '/'));
    } catch (e) {
      return false;
    }
  }

  /** نمط الصلاحية المطلوب للسيرفر الحالي (يُستخدم في chrome.permissions) */
  function hostPattern(url) {
    const target = normalize(url) || cachedServer;
    try {
      const parsed = new URL(target);
      return `${parsed.protocol}//${parsed.host}/*`;
    } catch (e) {
      return '';
    }
  }

  root.DaemConfig = {
    DEFAULT_SERVER,
    STORAGE_KEY,
    ready,
    normalize,
    getServerUrl,
    getServerUrlSync,
    apiUrl,
    apiUrlSync,
    setServerUrl,
    isDashboardUrl,
    isDashboardPath,
    hostPattern,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
