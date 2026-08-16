'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';
import TicketForm from './TicketForm';
import SupervisorsSearch from './SupervisorsSearch';
import AIChat from './AIChat';

type Complaint = {
  id: string;
  number: string;
  type: string;
  status: string;
  solution: string;
  date: string;
  receiver: string;
};

type Props = {
  complaints: Complaint[];
};

const SYSTEM_UPDATES = [
  {
    version: 'v7.8.2',
    title: '🏗️ إعادة هيكلة الهيدر الشاملة',
    points: [
      'توزيع أزرار النظام (خروج/مظهر) في الزوايا العلوية لتسهيل الوصول',
      'دمج الجرس وتبديل الحساب مع الأيقونات الخضراء في سطر واحد منظم',
      'دعم الوضع الأفقي للجوال (Landscape) ليعرض الواجهة مثل الكمبيوتر'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.8.0',
    title: '📱 تحسين واجهة الجوال',
    points: [
      'إعادة تصميم شريط العمليات للجوال ليكون في سطر واحد وبأحجم أصغر',
      'تحسين استجابة الأيقونات العلوية لتناسب الشاشات الصغيرة',
      'توفير مساحة أكبر لعرض محتوى البلاغات عبر تقليص حجم عناصر التحكم'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.7.3',
    title: '🔧 إصلاحات تقنية عاجلة',
    points: [
      'معالجة خطأ في بنية الكود (JSX) كان يمنع بناء المشروع بشكل صحيح',
      'تحسين استقرار الواجهة البرمجية وضمان توافق كافة العناصر المرئية',
      'تحديث معايير الأمان والأداء للمكونات التفاعلية الجديدة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.7.2',
    title: '🎯 تنظيم أزرار الاختصار',
    points: [
      'تجميع كافة أزرار العمليات (إنشاء، واتساب، تواصل) في صف واحد بجانب القائمة',
      'تحسين التباعد البصري للأزرار لضمان سهولة النقر على كافة الأجهزة',
      'توحيد نمط الظلال والتأثيرات الحركية لكافة أزرار الوصول السريع'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.7.1',
    title: '🛡️ استقرار نظام التنبيهات',
    points: [
      'حل مشكلة ظهور التنبيهات المحذوفة مرة أخرى عند تحديث الصفحة',
      'تفعيل نظام الذاكرة الدائمة (LocalStorage) لتذكر التنبيهات التي تم حذفها',
      'تحسين أداء معالجة الإشعارات العامة والخاصة لضمان سرعة الاستجابة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.7',
    title: '⚡ أزرار الوصول السريع',
    points: [
      'نقل وتطوير أزرار "بلاغ واتساب" و"التحدث مع الموظف" لتكون بجانب قائمة البلاغات مباشرة',
      'تحسين تجربة الاستخدام عبر توفير اختصارات المهام الأكثر تكراراً في مكان واحد',
      'تحديث أيقونات التواصل لتعمل بشكل أسرع وأكثر وضوحاً'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.6.3',
    title: '🔍 فلترة ذكية للسجلات',
    points: [
      'تفعيل الفلترة التفاعلية في نافذة التعاميم لتصفية المحتوى حسب النوع',
      'تحسين تجربة المستخدم عند التنقل بين تحديثات النظام والملفات المرفوعة',
      'إضافة تأثيرات بصرية للأوسمة المختارة لسهولة التمييز'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.6.2',
    title: '🎯 تركيز المحتوى في لوحة الرادار',
    points: [
      'تصفية لوحة "آخر التحديثات" لتشمل فقط التعاميم والملفات المرفوعة حديثاً',
      'استبعاد سجلات النظام البرمجية من الواجهة الرئيسية لتقليل التشتيت',
      'تفعيل العرض الديناميكي لآخر تحديث تم إرساله بواسطة الموظفين'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.6.1',
    title: '📢 رادار التنبيهات الذكي',
    points: [
      'إضافة قسم "أهم الملاحظات والتعاميم" بجوار إحصائيات اليوم للوصول السريع',
      'تحسين عرض البطاقات العلوية لتعطي نظرة شاملة على حالة العمل والتوجيهات',
      'تحديث التصميم المتجاوب لضمان سلاسة العرض على الهواتف'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.5.2',
    title: '🎯 تخصيص عرض الإحصائيات',
    points: [
      'استبعاد تحديثات الدرايف والملفات من قائمة البلاغات الرئيسية لعدم تشتيت الفريق',
      'إصلاح إحصائيات "آخر بلاغ تم استقباله" لتركز فقط على بلاغات المواطنين',
      'الحفاظ على ظهور التحديثات في جرس الإشعارات فقط كجهة إعلامية'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.5.1',
    title: '🎨 تحسين تمييز الملفات المرفوعة',
    points: [
      'إضافة تصنيف لوني أصفر (الملفات) لتمييز التحديثات التي يقوم بها الموظفون يدوياً',
      'تحسين التوازن اللوني في نافذة السجل والتعاميم'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.5',
    title: '🔔 نظام تنبيهات الدرايف الجديد',
    points: [
      'إضافة زر "أبلغ الفريق" داخل مركز النماذج لإرسال تنبيه فوري للزملاء',
      'تكامل جرس الإشعارات مع التحديثات التي يتم إرسالها من الموظفين',
      'تحسين استجابة الواجهة لعرض التحديثات الجماعية (للمستقبل: الجميع)'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.4.2',
    title: '🔧 إصلاحات تقنية وثبات النظام',
    points: [
      'إصلاح خطأ برمي في هيكلية JSX تسبب في فشل البناء',
      'تحسين استقرار الواجهة البرمجية وضمان التوافق مع Vercel',
      'تنظيف الأكواد المكررة لزيادة سرعة التحميل'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.4',
    title: '🎯 محاذاة دقيقة للنوافذ المنبثقة',
    points: [
      'جعل نافذة تبديل البوابة تظهر تحت الأيقونة الخاصة بها مباشرة وبدقة',
      'إصلاح مشكلة الانزياح لليسار التي كانت تظهر في بعض الشاشات',
      'تحسين تجربة التنقل بين الحسابات لتكون أكثر طبيعية وانسيابية'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.3',
    title: '🔐 تحسين نظام تسجيل الدخول',
    points: [
      'جعل اسم المستخدم غير حساس لحالة الأحرف (A/a) لتسهيل الدخول',
      'إضافة ميزة التجاهل التلقائي للمسافات الزائدة في الحقول',
      'إصلاح مشكلة تسجيل الدخول لبعض الحسابات (ثامر المنصور)'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.2',
    title: '📐 تحسين محاذاة أيقونة الإضافة',
    points: [
      'نقل أيقونة الزائد (+) لتكون بجوار عنوان "قائمة البلاغات" مباشرة جهة اليمين',
      'تحسين التوازن البصري لترتيب العناصر في الواجهة الرئيسية',
      'تعديل المسافات البينية (Gap) لضمان تجربة مستخدم أكثر تناسقاً'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.1',
    title: '🛠️ إصلاح نظام تحديث الحالات',
    points: [
      'حل مشكلة "فشل الاتصال" عند تعديل حالة البلاغ',
      'تفعيل المزامنة الفورية بين الواجهة وقاعدة بيانات نوشن',
      'تحسين استقرار النظام في معالجة طلبات التحديث السريعة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v7.0',
    title: '➕ واجهة إنشاء بلاغات عصرية',
    points: [
      'استبدال زر "بلاغ جديد" التقليدي بأيقونة (+) عصرية في زاوية منطقة البلاغات',
      'تحسين المساحة الرأسية للشاشة لزيادة التركيز على البيانات',
      'تحديث تجربة المستخدم لتكون أكثر سرعة وانسيابية عند البدء ببلاغ جديد'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.9',
    title: '⚡ تحديث فوري للبلاغات',
    points: [
      'جعل البلاغات تختفي مباشرة من قائمة "غير محدد" فور تعديل حالتها',
      'تحسين سرعة الاستجابة في لوحة التحكم (Instant UI Update)',
      'تحديث تلقائي للرسوم البيانية والمؤشرات عند أي تعديل'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.8',
    title: '📁 تحديثات مركز المرفقات (Drive)',
    points: [
      'تفعيل خاصية التنبيه الذكي عند إضافة أي مستندات أو صور جديدة في الدرايف',
      'تم إضافة مرفقات ونماذج عمل جديدة في المجلدات الرسمية',
      'ربط جرس التنبيهات تلقائياً مع تحديثات مركز النماذج والمرفقات'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.7',
    title: '📝 تبسيط واجهة إنشاء البلاغات',
    points: [
      'تغيير مسمى زر الإجراء الرئيسي إلى "بلاغ جديد" لسهولة القراءة',
      'الحفاظ على أيقونة نوشن الرسمية لضمان استمرارية الربط التقني',
      'تحسين التوازن البصري للنصوص في منطقة الإجراءات الرئيسية'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.6',
    title: '🫧 نافذة تبديل انسيابية (فقاعة)',
    points: [
      'تحويل مبدل البوابات إلى فقاعة تظهر بجانب الزر مباشرة بدلاً من منتصف الشاشة',
      'إضافة تأثيرات ظهور انسيابية (Fade & Scale) لتعزيز الجمالية',
      'تصغير حجم النافذة لتكون أخف وزناً وأسرع في الاستخدام'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.5',
    title: '🎨 لمسات نهائية لمبدل البوابات',
    points: [
      'تحديث موقع زر الإغلاق ليكون في الزاوية اليسرى العلوية للنافذة المنبثقة',
      'تغيير هوية لون زر الإغلاق (خلفية حمراء، إكس أبيض) لتعزيز التباين',
      'تحسين تجربة المستخدم في التفاعل مع نوافذ النظام المنبثقة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.4',
    title: '📐 إعادة تنظيم الشريط العلوي',
    points: [
      'تجميع كافة الأيقونات الخضراء الوظيفية في الجانب الأيمن للوصول السريع',
      'تفريغ وسط الشريط العلوي لإعطاء مساحة بصرية أكبر وشعور بالاتساع',
      'تحسين ترتيب الأدوات (تحديثات، تعاميم، مرفقات، أرقام، معلومات) بشكل منطقي'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.3',
    title: '🔱 توحيد الهوية البصرية للشعار',
    points: [
      'استبدال أيقونة النخلة المؤقتة بشعار "بلدي" الرسمي في جميع النوافذ المنبثقة',
      'تحسين دقة عرض الشعار في نافذة تبديل البوابات ليكون متناسقاً مع واجهة الموقع',
      'ضبط أحجام العناصر العلوية لضمان توازن بصري مثالي'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.2',
    title: '🎨 تصميم متطور لمبدل البوابات',
    points: [
      'تحديث تصميم نافذة تبديل البوابات لتطابق الهوية الرسمية لنظام بلاغات بلدي',
      'إضافة شعار النخلة والأيقونات التعبيرية (القلم للمحرر، العين للمشرف)',
      'تحسين التنسيق البصري للبطاقات لجعلها أكثر وضوحاً وتفاعلية'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.1',
    title: '🎯 تركيز وتمرير ذكي لمساحتي',
    points: [
      'تغيير الفلترة الافتراضية لزر "مساحتي" لتعرض البلاغات "غير المحددة" أولاً لإنجازها',
      'إضافة ميزة التمرير التلقائي (Smooth Scroll) لقائمة البلاغات عند الضغط على الزر',
      'تحسين التوجيه التلقائي للموظفين عند تسجيل الدخول للبدء بالبلاغات غير المحددة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v6.0',
    title: '🔄 نظام تبديل البوابات الذكي',
    points: [
      'استبدال تسجيل الخروج المباشر بنافذة تأكيد ذكية تطلب اختيار البوابة المطلوبة',
      'إتاحة الاختيار بين "بوابة الموظفين" و"بوابة المشرفين" بلمسة واحدة',
      'تحسين مسار التنقل لضمان وصول المستخدم للمكان الصحيح دون تكرار خطوات الدخول'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.9',
    title: '🔔 عداد التنبيهات الذكي بمساحتي',
    points: [
      'إضافة عداد رقمي صغير على زر "مساحتي" يوضح عدد البلاغات المعلقة للموظف',
      'العداد يشمل البلاغات "غير المحددة" و"لم يتم حلها" الخاصة بك فقط',
      'تحسين التفاعل البصري لمعرفة حجم العمل المطلوب بلمحة واحدة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.8',
    title: '👤 تخصيص مسمى المشرف العام',
    points: [
      'دمج اسم المشرف مع رتبته ليظهر "محمد الربيش (المشرف)" في الشريط العلوي',
      'تحسين منطق عرض الأسماء لجميع الرتب (مشرف، محرر، زائر)',
      'تحديث سجل التغييرات ليعكس التخصيصات الجديدة للهوية'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.7',
    title: '🟢 استعادة الهوية اللونية للزر',
    points: [
      'إعادة تعيين خلفية زر "مساحتي" للون الأخضر المميز لتعزيز الهوية البصرية',
      'تغيير لون النص داخل الزر للأبيض الناصع لضمان أعلى مستويات المقروئية',
      'الحفاظ على استقامة السطر الواحد وتناسق الأيقونات العلوية'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.6',
    title: '📏 ضبط المحاذاة والأيقونات',
    points: [
      'توحيد عرض اسم المستخدم وزر المساحة في سطر واحد لمنع التداخل',
      'استبدال إيموجي المستخدم بأيقونة SVG بيضاء دقيقة واحترافية',
      'تحسين توزيع المساحات داخل الشريط العلوي لضمان مظهر متناسق'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.5',
    title: '✨ تحسين تباين الزر الشخصي',
    points: [
      'تغيير لون خلفية زر "مساحتي" إلى الأبيض لزيادة الوضوح في الشريط العلوي',
      'تحسين مظهر الزر ليكون أكثر بروزاً وتناسقاً مع هوية المشرف',
      'ضبط تأثيرات الحوم (Hover) لتوفير تجربة مستخدم أكثر استجابة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.4',
    title: '🚀 تحسين الوصول للمساحة الشخصية',
    points: [
      'نقل زر "مساحتي الخاصة" إلى الشريط العلوي بجانب اسم المستخدم لسهولة الوصول',
      'تحسين التنسيق البصري للزر ليكون أكثر جاذبية وتناسقاً مع الواجهة العلوية',
      'إصلاح تداخل بسيط في تنسيقات الفلاتر بعد نقل الزر'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.3',
    title: '👑 تمكين مساحة العمل للمشرف',
    points: [
      'تمكين "مساحة العمل الشخصية" للمشرف (محمد الربيش) أيضاً لمتابعة بلاغاته الخاصة',
      'توحيد تجربة المستخدم لجميع أعضاء الفريق (مشرفين ومحررين)',
      'إتاحة زر "مساحتي الخاصة" لجميع الحسابات المسماة في النظام'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.2',
    title: '🎯 مساحة العمل الشخصية الذكية',
    points: [
      'تفعيل "مساحة العمل الشخصية" تلقائياً للمحررين عند تسجيل الدخول لزيادة التركيز',
      'فلترة تلقائية لعرض البلاغات الجارية (المفتوحة، المعلقة، غير المحددة) الخاصة بكل موظف',
      'إضافة زر "مساحتي الخاصة" للتبديل السريع بين مهامك الشخصية وبقية البلاغات',
      'تنبيه الموظف بعدد البلاغات التي تتطلب تحديثاً فورياً في حسابه'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.1',
    title: '🏢 تحديث الهوية البصرية لنوشن',
    points: [
      'استبدال أيقونة الزائد بأيقونة نوشن الرسمية في أزرار الإنشاء',
      'تحسين مظهر أزرار الإجراءات الرئيسية في لوحة التحكم',
      'ضبط تباين الأيقونات الجديدة مع الخلفية الداكنة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v5.0',
    title: '🎨 الإصدار الذهبي للتنسيق اللوني',
    points: [
      'فصل حالة "لم يتم الحل" لتظهر باللون الأحمر الصريح بدلاً من البرتقالي',
      'تخصيص اللون البرتقالي حصرياً لحالة "أخرى معلقة"',
      'زيادة وضوح ألوان الخلفية للبطاقات النشطة عند الاختيار (Active States)',
      'تحسين التناسق البصري الشامل بين الإحصائيات وبطاقات البلاغات'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.9',
    title: '🛠️ إصلاحات نهائية للتوزيع',
    points: [
      'تصحيح مسمى "البلاغ القادم يكون عند" في الموقع الصحيح داخل شريط الإحصائيات',
      'إعادة برمجة منطق التعادل لضمان أولوية محمد الربيش عند تساوي البلاغات',
      'تحسين دقة قراءة أسماء الموظفين من قاعدة البيانات'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.8',
    title: '🎨 تخصيص الهوية اللونية للمؤشرات',
    points: [
      'تخصيص لون خلفية البطاقات النشطة ليطابق لون المؤشر (بنفسجي لغير المحدد، أحمر للمفتوح)',
      'تغيير لون مؤشر "غير محدد" في بطاقات البلاغات إلى البنفسجي بدلاً من الأحمر',
      'تحسين التمييز البصري بين الحالات المختلفة في لوحة الإحصائيات'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.7',
    title: '⚖️ تحسين التوزيع والواجهة',
    points: [
      'تغيير مسمى "أقل مستقبل" إلى "البلاغ القادم يكون عند" لوضوح آلية التوزيع',
      'تحسين منطق حساب الموزع القادم لضمان دقة الاختيار وتجاوز المسافات الزائدة',
      'إكمال توحيد وتوسيط أيقونات الإغلاق (X) في جميع واجهات النظام'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.6',
    title: '🎯 ضبط التوسيط والمحاذاة',
    points: [
      'استبدال علامة الإغلاق (X) بأيقونة SVG دقيقة لضمان توسيطها المثالي داخل الدائرة',
      'تحسين التوازن البصري لجميع النوافذ المنبثقة (Modals)',
      'تحديث أيقونات الإغلاق في: تحديث الحالة، التعاميم، مركز النماذج، ودليل الموظفين'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.5',
    title: '⚖️ موازنة توزيع البلاغات',
    points: [
      'تحديث منطق "أقل مستقبل" ليعتمد على قائمة أولوية دقيقة عند تساوي البلاغات',
      'إعطاء الأولوية في الظهور لمحمد الربيش ثم بقية الفريق بالترتيب المعتمد',
      'تحسين دقة حساب الإحصائيات العامة وتوزيع المهام'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.4',
    title: '🏷️ تحسين تجربة المستخدم (UX)',
    points: [
      'إضافة تسميات نصية (نسخ، تعديل) للأزرار في بطاقات البلاغات لسهولة الاستخدام',
      'تحسين مظهر أزرار التحكم وجعلها أكثر تفاعلية',
      'ضبط المحاذاة والمسافات للأيقونات مع النصوص التوضيحية'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.3',
    title: '📏 تحسينات الاستجابة والتنسيق',
    points: [
      'جعل جميع بطاقات الإحصائيات تظهر في سطر واحد لتوفير المساحة',
      'إصلاح تداخل الروابط في بطاقات البلاغات لضمان عمل أزرار الواتساب',
      'تحسين عرض الواجهة على الشاشات الكبيرة والصغيرة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.2',
    title: '🎨 توحيد الهوية البصرية',
    points: [
      'توحيد زوايا جميع النوافذ والأزرار (Border Radius) لتصميم أكثر تناسقاً',
      'تحديث أيقونة الواتساب في جميع أنحاء الموقع لتكون موحدة ومحترفة',
      'تحسين مظهر أزرار إنشاء البلاغات (نوشن وواتساب)'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.1',
    title: '📊 مؤشرات دقة البيانات',
    points: [
      'إضافة فلتر ومؤشر خاص للبلاغات ذات الحالة "غير محدد"',
      'تحسين دقة حساب البلاغات المعلقة بفصلها عن غير المصنفة',
      'إتاحة اختيار "غير محدد" كحالة عند تحديث البلاغات'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v4.0',
    title: '🚀 التحديث الذهبي للصلاحيات',
    points: [
      'حل نهائي لمشكلة صلاحيات "محمد الربيش" (إدارة كاملة + إنشاء بلاغات)',
      'تفعيل نظام التنبيهات الذكي (Badge) على أيقونة التعاميم',
      'تحسين استقرار جلسات الدخول ومنع تسجيل الخروج التلقائي',
      'إصلاح مسمى "المشرف" في جميع واجهات النظام'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.9',
    title: '🔔 نظام تنبيهات التحديثات',
    points: [
      'إضافة شارة تنبيه حمراء على أيقونة التعاميم عند وجود تحديث جديد',
      'تحسين التفاعل البصري مع أزرار شريط الأدوات العلوي',
      'إدارة ذكية لحالة "المقروء" لضمان عدم إزعاج المستخدم'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.8',
    title: '👤 تحسين مسميات الرتب',
    points: [
      'تحديث مسمى "مستخدم" إلى "المشرف" عند الدخول عبر بوابة الإشراف',
      'تنسيق عرض الأسماء في شريط الأدوات العلوي لجميع أنواع الحسابات',
      'إصلاحات طفيفة في واجهة تسجيل الدخول'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.7',
    title: '🔐 تحديث أمان وصلاحيات متقدم',
    points: [
      'إصلاح مشكلة عدم ظهور زر "نوشن" لبعض المستخدمين بصلاحيات خاصة',
      'تحسين التوافق مع متصفحات الجوال في قوائم الفلترة',
      'تحديث نظام الجلسات لضمان بقاء اسم المستخدم ظاهراً'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.6',
    title: '🎨 تحسينات بصرية للفلترة',
    points: [
      'تعديل ألوان الخطوط في قائمة التاريخ لتكون أكثر وضوحاً (أبيض)',
      'تحسين مظهر أزرار الفلترة السريعة في الوضع الداكن',
      'ضبط تباين الألوان في القوائم المنبثقة لسهولة القراءة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.5',
    title: '🔐 تحديث الصلاحيات والمسميات',
    points: [
      'تعديل مسمى "المشرف العام" إلى "المشرف" في شريط الأدوات',
      'منح صلاحيات كاملة (إدارة + إنشاء) للمستخدم "محمد الربيش" عند الدخول كعضو دعم',
      'تحسين منطق عرض الأسماء الثنائية للموظفين لضمان مظهر احترافي'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.4',
    title: '📅 نظام فلترة التاريخ المتطور',
    points: [
      'دمج حقول التاريخ في أيقونة واحدة ذكية لتوفير مساحة في اللوحة',
      'إضافة خيارات سريعة: (اليوم، أمس، آخر 7 أيام)',
      'إمكانية تحديد "يوم واحد" أو "نطاق مخصص" بسهولة من نافذة منبثقة',
      'تحسين تجربة المستخدم على الهواتف والمتصفحات المختلفة'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.3',
    title: '🔐 تعزيز نظام الصلاحيات',
    points: [
      'حصر صلاحية "إنشاء بلاغ بنوشن" على موظفي الدعم الميداني فقط',
      'إخفاء ميزات إدخال البيانات عن حساب المشرف لضمان دقة الرقابة',
      'تحسين استجابة القوائم المنسدلة في نماذج الإدخال'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.2',
    title: '👤 تخصيص واجهة المستخدم',
    points: [
      'إظهار اسم المستخدم المسجل حالياً في شريط الأدوات العلوي',
      'تحسين مظهر أزرار التحكم والوصول السريع',
      'ضبط تنسيق النصوص في الوضعين الفاتح والداكن'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.1',
    title: '🔔 تحسين الوصول للتعاميم',
    points: [
      'إضافة إمكانية فتح التعميم مباشرة من داخل قائمة الإشعارات',
      'تحديث رابط ملف الـ VPN ليعمل بشكل أسرع',
      'إصلاح مشكلة عدم ظهور التعاميم في بعض الحالات'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v3.0',
    title: '🔔 نظام التعاميم والإشعارات الجديد',
    points: [
      'تفعيل أيقونة الجرس للتنبيه بالتعاميم الجديدة فور صدورها',
      'إضافة تعميم VPN 6.18 الجديد لقائمة التعاميم الرسمية',
      'تحسين آلية عرض الملفات والتعاميم داخل اللوحة',
      'أتمتة عملية رفع التحديثات البرمجية مباشرة للموقع'
    ],
    date: '10-05-2026'
  },
  {
    version: 'v2.9.1',
    title: '🔒 ضبط صلاحيات بوابة المشرف',
    points: [
      'حصر ميزة "إنشاء بلاغ بنوشن" على بوابة الموظفين فقط',
      'إخفاء الميزة بالكامل عند الدخول من بوابة المشرف أو المدير العام',
      'تحسين دقة تحديد الأدوار برمجياً لضمان الخصوصية'
    ],
    date: '07-05-2026'
  },
  {
    version: 'v2.9',
    title: '🔒 تخصيص الصلاحيات',
    points: [
      'إخفاء زر "إنشاء بلاغ بنوشن" عند الدخول بحساب المشرف (Super Admin)',
      'تعزيز الفصل بين مهام الإدارة ومهام إدخال البيانات',
      'تحسين واجهة المشرف لتكون أكثر تركيزاً على الرقابة والتحليل'
    ],
    date: '07-05-2026'
  },
  {
    version: 'v2.8',
    title: '📅 تحديث تنسيق التاريخ',
    points: [
      'تغيير لغة التسميات التوضيحية للتاريخ إلى الإنجليزية لتفادي مشكلة الانعكاس',
      'تحسين تجربة المستخدم في اختيار المواعيد من خلال الفلترة',
      'التأكد من توافق الحقول مع جميع المتصفحات'
    ],
    date: '07-05-2026'
  },
  {
    version: 'v2.7',
    title: '🔧 إصلاح انعكاس النصوص',
    points: [
      'حل مشكلة ظهور الكلمات العربية مقلوبة في حقول التاريخ',
      'تحسين توافق الخطوط مع خاصية RTL (من اليمين لليسار)',
      'ضبط تنسيق حقول الإدخال لتكون أكثر وضوحاً'
    ],
    date: '07-05-2026'
  },
  {
    version: 'v2.6',
    title: '✨ ميزة نسخ تفاصيل البلاغ',
    points: [
      'إضافة زر جديد لنسخ رقم وتفاصيل البلاغ بضغطة واحدة',
      'تحديث نظام سجل التحديثات ليكون ديناميكياً وتلقائياً',
      'تحسين سرعة استجابة الأزرار في لوحة التحكم'
    ],
    date: '07-05-2026'
  },
  {
    version: 'v2.5',
    title: '🎨 تحسينات بصرية شاملة',
    points: [
      'توحيد الخطوط بالكامل (Cairo) لجمالية واحترافية أعلى',
      'تفعيل نظام الألوان التلقائي والذكي لتصنيفات البلاغات',
      'إضافة ميزة "التحدث مع الموظف" عبر الواتساب مباشرة',
      'تنسيق شريط الأدوات العلوي (أيقونات دائرية موحدة)'
    ],
    date: '07-05-2026'
  }
];

const EMPLOYEES = [
  { name: 'البراء النصيان', user: 'a.alnesayan', phone: '966537313164' },
  { name: 'عبدالله العويد', user: 'aalowaid', phone: '966582060644' },
  { name: 'عبدالرحمن العمري', user: 'af.alamri', phone: '966553077432' },
  { name: 'عزام الحربي', user: 'azz.alharbi', phone: '966500000000' },
  { name: 'محمد الربيش', user: 'mialrubaish', phone: '966595866711' },
  { name: 'صالح الغصن', user: 's.alghosen', phone: '966557828464' },
  { name: 'طارق الهدياني', user: 't.alhedyani', phone: '966500221260' },
  { name: 'ثامر المنصور', user: 't.almansour', phone: '966570770940' },
];

export default function DashboardClient({ complaints: initialComplaints }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);

  // تحديث الحالة المحلية عند تغير البيانات من الخادم
  useEffect(() => {
    setComplaints(initialComplaints);
  }, [initialComplaints]);

  // دالة لتوليد لون فريد لكل تصنيف
  const getCategoryColor = (type: string) => {
    if (!type || type === 'غير محدد') return 'var(--primary)';
    const colors = [
      '#3b82f6', // أزرق
      '#8b5cf6', // بنفسجي
      '#f59e0b', // برتقالي
      '#10b981', // أخضر
      '#ec4899', // وردي
      '#06b6d4', // سماوي
      '#f43f5e', // أحمر وردي
      '#a855f7', // لافندر
      '#22c55e', // أخضر زمردي
      '#eab308'  // أصفر
    ];
    let hash = 0;
    for (let i = 0; i < type.length; i++) {
      hash = type.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'closed' | 'inProgress' | 'undated' | 'undefined'>('all');
  const [selectedReceiver, setSelectedReceiver] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'whatsapp' | 'notion'>('notion');
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isSupOpen, setIsSupOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Complaint | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [newTicketToast, setNewTicketToast] = useState<string | null>(null);
  const [prevCount, setPrevCount] = useState<number>(complaints.length);
  const [notifications, setNotifications] = useState<{id:string, msg:string, time:string, read:boolean}[]>([]);
  const [circularFilter, setCircularFilter] = useState<'all' | 'circular' | 'system' | 'drive'>('all');


  // مزامنة التنبيهات من البلاغات العامة (المستقبل: الجميع) - مع تجنب المكرر والمحذوف
  useEffect(() => {
    // جلب قائمة المعرفات المحذوفة من الذاكرة المحلية
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]');
    
    const publicNotifs = complaints
      .filter(c => c.receiver === 'الجميع' || c.type === 'تحديث نظام')
      .filter(c => !dismissedIds.includes(c.id)) // استبعاد ما تم حذفه سابقاً
      .map(c => ({
        id: c.id,
        msg: c.number, // هنا رقم البلاغ يحتوي على نص التحديث
        time: c.date,
        read: localStorage.getItem(`read_notif_${c.id}`) === 'true'
      }));
    
    setNotifications(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newOnes = publicNotifs.filter(n => !existingIds.has(n.id));
      return [...prev, ...newOnes];
    });
  }, [complaints]);

  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [ticketStateMap, setTicketStateMap] = useState<Record<string, {state: string, number: string}>>({});
  const router = useRouter();

  const [isCircularsOpen, setIsCircularsOpen] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [userRole, setUserRole] = useState<'viewer' | 'editor' | 'super_admin' | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  // التحقق من وجود تحديثات جديدة غير مقروءة
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('last_seen_system_version');
    if (lastSeenVersion !== SYSTEM_UPDATES[0].version) {
      setHasNewUpdate(true);
    }
  }, []);

  // حماية الصفحة عبر الكوكي وتحديد الصلاحيات
  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const authCookie = cookies.find(c => c.startsWith('auth_token='));
    
    if (!authCookie) {
      router.push('/login');
      return;
    }

    const value = authCookie.split('=')[1];
    if (value === 'super_admin') {
      setUserRole('super_admin');
    } else if (value === 'viewer' || value === 'admin' || value === 'true') {
      setUserRole('viewer'); // المشرف الآن يرى فقط
    } else if (value.startsWith('editor_')) {
      const name = decodeURIComponent(value.replace('editor_', ''));
      setLoggedInUser(name);
      
      // ترقية تلقائية لمحمد الربيش ليكون مشرفاً بصلاحيات محرر
      // ترقية تلقائية لمحمد الربيش ليكون مشرفاً بصلاحيات محرر
      if (name.includes('محمد الربيش')) {
        setUserRole('super_admin');
      } else {
        setUserRole('editor');
      }
      
      // تفعيل مساحة العمل الشخصية تلقائياً لجميع الموظفين (بمن فيهم المشرف) عند الدخول
      setSelectedReceiver(name);
      setActiveFilter('undefined'); 
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // حساب عدد البلاغات المعلقة للموظف الحالي (مفتوحة أو غير محددة)
  const myPendingCount = useMemo(() => {
    if (!loggedInUser) return 0;
    return complaints.filter(c => {
      const isMine = c.receiver && c.receiver.trim().includes(loggedInUser.trim().split(' ')[0]);
      const isPending = !c.solution || c.solution === 'غير محدد' || c.solution === 'لم يتم الحل';
      return isMine && isPending;
    }).length;
  }, [complaints, loggedInUser]);

  // طلب إذن إشعارات المتصفح عند الدخول
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // كشف التغييرات (بلاغات جديدة أو تحديث حالة)
  useEffect(() => {
    const currentCount = complaints.length;
    let newNotifications: {id:string, msg:string, time:string, read:boolean}[] = [];

    // 1. كشف البلاغات الجديدة
    if (currentCount > prevCount && prevCount > 0) {
      const diff = currentCount - prevCount;
      const latestTicket = complaints[0]; 
      const receiverName = latestTicket?.receiver || 'غير محدد';
      const msg = diff === 1 ? `بلاغ جديد للمستقبل: ${receiverName}` : `وصل ${diff} بلاغات جديدة!`;
      
      setNewTicketToast(msg);
      newNotifications.push({
        id: `new-${Date.now()}`,
        msg,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 بلاغ جديد - وحدة بلدي', { body: msg, icon: '/logo.png' });
      }
    }

    // 1.1 إضافة تعميم الـ VPN الجديد كإشعار (لمرة واحدة)
    const hasSeenVPNCircular = localStorage.getItem('seen_vpn_circular_v3.1');
    if (!hasSeenVPNCircular) {
      newNotifications.push({
        id: `circular-vpn-${Date.now()}`,
        msg: '📢 تعميم جديد: تغيير نطاق 6.18 VPN - يرجى الاطلاع',
        time: new Date().toLocaleDateString('ar-SA'),
        read: false
      });
      localStorage.setItem('seen_vpn_circular_v3.1', 'true');
    }

    // 2. كشف تحديثات الحالة للبلاغات الموجودة
    if (Object.keys(ticketStateMap).length > 0) {
      complaints.forEach(ticket => {
        const prev = ticketStateMap[ticket.id] as {state: string, number: string} | undefined;
        const currentState = `${ticket.status}-${ticket.solution}`;
        
        if (prev && prev.state !== currentState) {
          const msg = `تحديث في بلاغ ${ticket.number} للمستقبل ${ticket.receiver || 'غير محدد'}: ${ticket.solution}`;
          newNotifications.push({
            id: `update-${ticket.id}-${Date.now()}`,
            msg,
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
          if (!newTicketToast) setNewTicketToast(msg);
        }
      });

      // 3. كشف البلاغات المحذوفة
      const currentIds = new Set(complaints.map(c => c.id));
      Object.keys(ticketStateMap).forEach(id => {
        if (!currentIds.has(id)) {
          const deletedTicket = ticketStateMap[id] as {state: string, number: string};
          const msg = `⚠️ تم حذف البلاغ رقم: ${deletedTicket.number}`;
          newNotifications.push({
            id: `delete-${id}-${Date.now()}`,
            msg,
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
          if (!newTicketToast) setNewTicketToast(msg);
        }
      });
    }

    // تحديث خريطة الحالات للمرة القادمة
    const newMap: Record<string, {state: string, number: string}> = {};
    complaints.forEach(t => {
      newMap[t.id] = { state: `${t.status}-${t.solution}`, number: t.number };
    });
    setTicketStateMap(newMap);
    setPrevCount(currentCount);

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  }, [complaints]);

  // إخفاء التنبيه المنبثق تلقائياً بعد 5 ثواني
  useEffect(() => {
    if (newTicketToast) {
      const timer = setTimeout(() => {
        setNewTicketToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newTicketToast]);

  // التحديث التلقائي للبيانات كل 20 ثانية (للانعكاس المتوازن)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 20000); // 20 ثانية
    return () => clearInterval(interval);
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
    router.refresh();
  };

  const handleUpdate = async (ticketId: string, newSolution: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/update-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, solution: newSolution }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        setEditingTicket(null);
        
        // تحديث الحالة محلياً فوراً لضمان اختفاء البلاغ من القائمة المفلترة مباشرة
        // @ts-ignore
        setComplaints(prev => prev.map(c => 
          c.id === ticketId ? { ...c, solution: newSolution } : c
        ));

        router.refresh();
      } else {
        alert('حدث خطأ أثناء التحديث');
      }
    } catch (err) {
      alert('فشل الاتصال بالخادم');
    } finally {
      setIsUpdating(false);
    }
  };


  const stats = useMemo(() => {
    // بلاغات صالحة زمنياً (بعد 4 ابريل) بغض النظر عن الفلتر المختار - مع استبعاد تحديثات النظام من الإحصائيات
    const allRelevantComplaints = complaints.filter(c => c.date && c.date !== 'غير محدد' && c.date >= '2026-04-04' && c.type !== 'تحديث نظام');

    // البلاغات المفلترة حسب الموظف المختار (لعرضها في القائمة والرسوم البيانية الأخرى)
    const baseComplaints = (selectedReceiver === 'all' 
      ? complaints 
      : complaints.filter(c => {
          const emp = EMPLOYEES.find(e => e.name === selectedReceiver);
          const receiverValue = (c.receiver || '').toLowerCase().trim();
          const targetName = selectedReceiver.toLowerCase().trim();
          const targetUser = emp ? emp.user.toLowerCase().trim() : '';
          const receiverWords = receiverValue.split(' ').filter(w => w.length > 1);
          const isNameMatch = receiverWords.length > 0 && receiverWords.every(word => targetName.includes(word));
          return isNameMatch || (targetUser && receiverValue.includes(targetUser));
        })).filter(c => c.date && c.date !== 'غير محدد' && c.date >= '2026-04-04');

    const todayStr = new Date().toISOString().split('T')[0];
    const todayComplaints = allRelevantComplaints.filter(c => c.date === todayStr);

    const sortedGlobal = [...allRelevantComplaints].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const lastComplaint = sortedGlobal[0] || null;

    // حساب الموزع القادم للبلاغات (تحديد الموظف الأقل استقبالاً مع مراعاة الأولوية)
    const receiverCounts: {[key: string]: number} = {};
    allRelevantComplaints.forEach(c => {
      if (c.receiver) {
        const cleanName = c.receiver.trim();
        receiverCounts[cleanName] = (receiverCounts[cleanName] || 0) + 1;
      }
    });

    const priorityList = [
      'محمد الربيش',
      'البراء النصيان',
      'عبدالرحمن العمري',
      'عزام الحربي',
      'صالح الغصن',
      'طارق الهدياني',
      'ثامر المنصور'
    ];

    let leastCount = Infinity;
    let leastReceiver = 'لا يوجد';
    
    // تحديد أقل عدد من البلاغات موجود حالياً
    priorityList.forEach(name => {
      const count = receiverCounts[name] || 0;
      if (count < leastCount) leastCount = count;
    });

    // اختيار أول موظف في قائمة الأولوية يمتلك هذا العدد الأقل (لحل مشكلة التعادل)
    const firstWithLeast = priorityList.find(name => (receiverCounts[name] || 0) === leastCount);
    if (firstWithLeast) {
      leastReceiver = firstWithLeast;
    }

    const undated = complaints.filter(c => !c.date || c.date === 'غير محدد');

    return {
      total: baseComplaints.length, // هذا يتغير مع الفلترة
      today: todayComplaints.length, // ثابت (من الكل)
      open: baseComplaints.filter((c) => (c.solution || '').trim() === 'لم يتم الحل').length,
      closed: baseComplaints.filter((c) => (c.solution || '').trim() === 'تم الحل').length,
      inProgress: baseComplaints.filter((c) => (c.solution || '').trim() === 'أخرى معلقة').length,
      undefinedStatus: baseComplaints.filter((c) => {
        const sol = (c.solution || '').trim();
        return sol === 'غير محدد' || sol === '';
      }).length,
      lastComplaint, // ثابت (من الكل)
      leastReceiver: { name: leastReceiver, count: leastCount === Infinity ? 0 : leastCount }, // ثابت (من الكل)
      undated: undated.length,
    };
  }, [complaints, selectedReceiver]);

  const filteredComplaints = useMemo(() => {
    // 1. فرز البلاغات من الأحدث للأقدم - مع استبعاد تحديثات النظام من القائمة الرئيسية
    let base = [...complaints].filter(c => c.type !== 'تحديث نظام').sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // 2. فلترة البلاغات بعد 4 أبريل 2026 فقط (مع استبعاد غير المحدد)
    base = base.filter(c => 
      c.date && 
      c.date !== 'غير محدد' && 
      c.date >= '2026-04-04'
    );

    // 3. فلترة حسب الموظف المختار
    let filtered = selectedReceiver === 'all' 
      ? base 
      : base.filter(c => {
          const emp = EMPLOYEES.find(e => e.name === selectedReceiver);
          const receiverValue = (c.receiver || '').toLowerCase().trim();
          const targetName = selectedReceiver.toLowerCase().trim();
          const targetUser = emp ? emp.user.toLowerCase().trim() : '';
          const receiverWords = receiverValue.split(' ').filter(w => w.length > 1);
          const isNameMatch = receiverWords.length > 0 && receiverWords.every(word => targetName.includes(word));
          return isNameMatch || (targetUser && receiverValue.includes(targetUser));
        });

    if (activeFilter === 'open') {
      filtered = filtered.filter((c) => (c.solution || '').trim() === 'لم يتم الحل');
    } else if (activeFilter === 'closed') {
      filtered = filtered.filter((c) => (c.solution || '').trim() === 'تم الحل');
    } else if (activeFilter === 'inProgress') {
      filtered = filtered.filter((c) => (c.solution || '').trim() === 'أخرى معلقة');
    } else if (activeFilter === 'undefined') {
      filtered = filtered.filter((c) => {
        const sol = (c.solution || '').trim();
        return sol === 'غير محدد' || sol === '';
      });
    } else if (activeFilter === 'undated') {
      filtered = complaints.filter(c => !c.date || c.date === 'غير محدد');
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.number || '').toLowerCase().includes(lowerSearch) ||
          (c.type || '').toLowerCase().includes(lowerSearch) ||
          (c.receiver || '').toLowerCase().includes(lowerSearch)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(c => c.type === selectedType);
    }

    if (startDate) filtered = filtered.filter((c) => c.date >= startDate);
    if (endDate) filtered = filtered.filter((c) => c.date <= endDate);

    // 4. حذف المكرر (Deduplication) بناءً على رقم البلاغ لضمان عدم التكرار البصري
    const uniqueFiltered = filtered.filter((v, i, a) => {
      // إذا كان رقم البلاغ موجوداً وغير افتراضي، نستخدمه للتحقق من التكرار
      if (v.number && v.number !== 'غير محدد') {
        return a.findIndex(t => t.number === v.number) === i;
      }
      // وإلا نعتمد على المعرف الفريد (ID)
      return a.findIndex(t => t.id === v.id) === i;
    });

    return uniqueFiltered;
  }, [complaints, activeFilter, selectedReceiver, selectedType, searchTerm, startDate, endDate]);

  // تفعيل تأثيرات الظهور عند التمرير (Scroll Reveal)
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.activeReveal);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll(`.${styles.reveal}`);
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [filteredComplaints]);

  return (
    <main className={styles.container}>
      {newTicketToast && (
        <div className={styles.toast}>
          <span>🚨</span>
          <span>{newTicketToast}</span>
        </div>
      )}
      {/* هيكل الهيدر الجديد المتجاوب */}
      <div className={styles.headerLayout}>
        {/* صف الخدمات (مظهر + خروج) */}
        <div className={styles.topUtilityRow}>
          <button className={styles.navIconButton} onClick={toggleTheme} title="تغيير مظهر الموقع" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <span style={{fontSize:'1.2rem'}}>{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>
          
          <button 
            className={styles.navIconButton} 
            onClick={handleLogout} 
            title="تسجيل الخروج" 
            style={{background:'rgba(239, 68, 68, 0.15)', border:'none', color:'#ef4444'}}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* صف العمليات والبروفايل */}
        <div className={styles.mainActionsRow}>
          {/* مجموعة الأيقونات المدمجة */}
          <div className={styles.iconsGroup}>
            {/* التعاميم */}
            <button 
              className={styles.navIconButton} 
              onClick={() => { 
                setIsCircularsOpen(true); 
                setHasNewUpdate(false); 
                localStorage.setItem('last_seen_system_version', SYSTEM_UPDATES[0].version);
              }} 
              title="التعاميم وتحديثات النظام" 
              style={{ backgroundColor: 'var(--primary)', color: 'white', position: 'relative' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              {hasNewUpdate && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid white', animation: 'pulse 2s infinite' }} />
              )}
            </button>

            {/* المرفقات */}
            <button className={styles.navIconButton} onClick={() => setIsDriveOpen(true)} title="مركز النماذج والمرفقات" style={{ backgroundColor: 'var(--primary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>

            {/* الهاتف */}
            <button className={styles.navIconButton} onClick={() => setIsSupOpen(true)} title="دليل أرقام مشرفي البلديات" style={{ backgroundColor: 'var(--primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>

            {/* معلومات */}
            <button className={styles.navIconButton} onClick={() => setIsInfoOpen(true)} title="ملخص ودورة حياة البلاغ" style={{ backgroundColor: 'var(--primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>

            {/* الجرس */}
            <div style={{position:'relative'}}>
              <button 
                className={styles.navIconButton} 
                onClick={() => setIsNotiOpen(!isNotiOpen)} 
                title="الإشعارات" 
                style={{background:'rgba(255,255,255,0.1)', color:'white'}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '1.5px solid var(--card-bg)' }} />
                )}
              </button>
              {isNotiOpen && (
                <div style={{ position: 'absolute', top: '55px', left: '0', width: '300px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 3000, padding: '1rem', direction: 'rtl' }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem'}}>
                    <h4 style={{margin:0, fontSize:'0.9rem'}}>الإشعارات</h4>
                    <button onClick={() => setNotifications(prev => prev.map(n => ({...n, read:true})))} style={{background:'none', border:'none', cursor:'pointer'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></button>
                  </div>
                  <div style={{maxHeight:'300px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                    {notifications.length === 0 ? <p style={{textAlign:'center', fontSize:'0.8rem', color:'var(--text-muted)', margin:'1rem 0'}}>لا توجد إشعارات</p> : notifications.map(n => (
                      <div key={n.id} style={{ padding:'0.75rem', borderRadius:'8px', background: n.read ? 'transparent' : 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--border)' }}>
                        <p style={{margin:0, fontSize:'0.85rem', color:'var(--text)'}}>{n.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* تبديل البوابة */}
            <div style={{position:'relative'}}>
              <button 
                className={styles.navIconButton} 
                onClick={() => setIsSwitchModalOpen(true)} 
                title="تبديل البوابة / الحساب" 
                style={{background:'rgba(255,255,255,0.1)', color:'white'}}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5"></path><path d="M4 20L21 3"></path><path d="M21 16v5h-5"></path><path d="M15 15l6 6"></path><path d="M4 4l5 5"></path>
                </svg>
              </button>
              {isSwitchModalOpen && (
                <div style={{ position: 'absolute', top: '55px', left: '0', width: '300px', background: '#1a1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10000, animation: 'bubbleIn 0.3s ease', textAlign: 'center' }}>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <button onClick={() => { document.cookie = 'auth_token=viewer; path=/; max-age=604800'; window.location.reload(); }} style={{ padding:'15px', borderRadius:'15px', background:'rgba(255,255,255,0.05)', color:'white', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer' }}>بوابة المشرف</button>
                    <button onClick={() => { document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'; window.location.href = '/login'; }} style={{ padding:'15px', borderRadius:'15px', background:'rgba(255,255,255,0.05)', color:'white', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer' }}>بوابة الموظف</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* بيانات المستخدم */}
          <div className={styles.profileGroup}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.1)', padding:'6px 14px', borderRadius:'20px', border:'1px solid var(--border)', whiteSpace:'nowrap'}}>
              <span style={{fontSize:'0.8rem', color:'white', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                </svg>
                {userRole === 'super_admin' && loggedInUser ? `${loggedInUser} (المشرف)` : (userRole === 'super_admin' || userRole === 'viewer' ? 'المشرف' : (loggedInUser ? loggedInUser : 'مستخدم'))}
              </span>
              {loggedInUser && (
                <button 
                  onClick={() => { setSelectedReceiver(loggedInUser); setActiveFilter('undefined'); }} 
                  className={styles.myWorkspaceBtn} 
                  title="🎯 مساحتي"
                  style={{ marginLeft:'5px', fontSize:'0.7rem', background:'var(--primary)', color:'white', border:'none', padding:'4px 12px', borderRadius:'15px', cursor:'pointer', fontWeight:'bold' }}
                >
                  🎯 مساحتي
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <header className={styles.logoHeader}>
        <img src="/logo.png" alt="Baladi Logo" className={styles.mainLogo} onClick={() => window.location.reload()} />
        <h1 className={styles.dashboardTitle}>
          لوحة التحكم للبلاغات | وحدة بلدي
        </h1>
      </header>

      <div className={styles.statsGrid}>
        {/* بطاقة اليوم - شريط تقدم */}
        <div className={`${styles.statCard} ${styles.statTodayFull}`}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', gap:'1rem', flexWrap:'nowrap'}}>
            <div>
              <h3 style={{margin:0, opacity:0.9, fontSize: '1.1rem'}}>إجمالي بلاغات اليوم</h3>
              <p className={styles.statValueLarge} style={{margin:'0.5rem 0 0'}}>{stats.today}</p>
            </div>
            
            <div style={{display:'flex', gap:'1.2rem', flexWrap:'nowrap'}}>
              {/* آخر بلاغ تم استقباله */}
              {stats.lastComplaint && (
                <div style={{textAlign:'right', borderRight:'2px solid rgba(255,255,255,0.3)', paddingRight:'1rem'}}>
                  <p style={{margin:0, fontSize:'0.72rem', opacity:0.75}}>آخر بلاغ تم استقباله</p>
                  <p style={{margin:'0.2rem 0 0', fontWeight:'bold', fontSize:'0.9rem'}}>{stats.lastComplaint.receiver || 'غير محدد'}</p>
                  <p style={{margin:'0.15rem 0 0', fontSize:'0.75rem', opacity:0.8}}>#{stats.lastComplaint.number}</p>
                </div>
              )}

              {/* الموزع القادم */}
              <div style={{textAlign:'right', borderRight:'2px solid rgba(255,152,0,0.4)', paddingRight:'1rem'}}>
                <p style={{margin:0, fontSize:'0.72rem', opacity:0.75}}>البلاغ القادم يكون عند</p>
                <p style={{margin:'0.2rem 0 0', fontWeight:'bold', fontSize:'0.9rem', color:'#ff9800'}}>{stats.leastReceiver.name}</p>
                <p style={{margin:'0.15rem 0 0', fontSize:'0.75rem', opacity:0.8}}>{stats.leastReceiver.count} بلاغ</p>
              </div>
            </div>
          </div>
        </div>

        {/* بطاقة الملاحظات والتعاميم الجديدة */}
        <div className={styles.notesCard} onClick={() => setIsCircularsOpen(true)}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
            <h3 style={{margin:0, fontSize:'0.9rem', color:'var(--primary)', fontWeight:'800'}}>📢 آخر التحديثات والتعاميم</h3>
            <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>فتح السجل</span>
          </div>
          
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {/* أحدث تحديث ملف درايف من نوشن */}
            {complaints.filter(c => c.type === 'تحديث نظام' && c.receiver === 'الجميع').slice(0, 1).map(update => (
              <div key={update.id} className={styles.noteItem} style={{borderColor:'#eab308', background:'rgba(234, 179, 8, 0.05)'}}>
                <span style={{color:'#eab308'}}>🟡</span>
                <span style={{fontWeight:'bold', fontSize:'0.8rem'}}>{update.number}</span>
              </div>
            ))}
            
            {/* أحدث تعميم إداري مثبت */}
            <div className={styles.noteItem} style={{borderColor:'#ef4444', background:'rgba(239, 68, 68, 0.05)'}}>
              <span style={{color:'#ef4444'}}>🆕</span>
              <span style={{fontSize:'0.8rem'}}>تعميم رقم 1445/02 بشأن VPN</span>
            </div>
          </div>
        </div>

        {/* بطاقة غير محدد - تظهر فقط عند وجود بلاغات بدون تاريخ */}
        {stats.undated > 0 && (
          <div
            className={`${styles.statCard} ${activeFilter === 'undated' ? styles.active : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'undated' ? 'all' : 'undated')}
            style={{display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer', borderColor:'#6b7280', opacity: 0.85}}
          >
            <svg width="70" height="70" viewBox="0 0 70 70" style={{flexShrink:0, transform:'rotate(-90deg)'}}>
              <circle cx="35" cy="35" r="28" fill="none" stroke="var(--border)" strokeWidth="7"/>
              <circle cx="35" cy="35" r="28" fill="none" stroke="#6b7280" strokeWidth="7"
                strokeDasharray={`${(stats.undated/(stats.undated+stats.total))*2*Math.PI*28} ${2*Math.PI*28}`}
                strokeLinecap="round"
              />
              <text x="35" y="35" textAnchor="middle" dominantBaseline="central"
                fill={theme === 'dark' ? '#ffffff' : '#1a1a2e'}
                fontSize="11" fontWeight="bold"
                style={{transform:'rotate(90deg)', transformOrigin:'35px 35px'}}
              >؟</text>
            </svg>
            <div>
              <h3 style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)'}}>غير محدد التاريخ</h3>
              <p style={{margin:'0.1rem 0 0', fontSize:'1.8rem', fontWeight:'bold', color:'#6b7280'}}>{stats.undated}</p>
            </div>
          </div>
        )}
        {[
          { label: 'إجمالي البلاغات', value: stats.total, color: 'var(--primary)', filter: 'all' as const, percent: 100 },
          { label: 'لم يتم حلها', value: stats.open, color: '#ef4444', filter: 'open' as const, percent: stats.total > 0 ? (stats.open/stats.total)*100 : 0 },
          { label: 'تم حلها', value: stats.closed, color: '#22c55e', filter: 'closed' as const, percent: stats.total > 0 ? (stats.closed/stats.total)*100 : 0 },
          { label: 'أخرى معلقة', value: stats.inProgress, color: '#f59e0b', filter: 'inProgress' as const, percent: stats.total > 0 ? (stats.inProgress/stats.total)*100 : 0 },
          { label: 'غير محدد', value: stats.undefinedStatus, color: '#8b5cf6', filter: 'undefined' as const, percent: stats.total > 0 ? (stats.undefinedStatus/stats.total)*100 : 0 },
        ].map(({ label, value, color, filter, percent }) => {
          const r = 28;
          const circ = 2 * Math.PI * r;
          const dash = (percent / 100) * circ;
          return (
            <div
              key={filter}
              className={`${styles.statCard} ${activeFilter === filter ? styles.active : ''}`}
              onClick={() => setActiveFilter(filter)}
              style={{
                display:'flex', 
                alignItems:'center', 
                gap:'0.75rem', 
                cursor:'pointer',
                backgroundColor: activeFilter === filter ? (color.startsWith('#') ? `${color}33` : 'rgba(34, 197, 94, 0.2)') : 'transparent',
                borderColor: activeFilter === filter ? color : 'var(--border)',
                transform: activeFilter === filter ? 'scale(1.02)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {/* الحلقة الدائرية */}
              <svg width="70" height="70" viewBox="0 0 70 70" style={{flexShrink:0, transform:'rotate(-90deg)'}}>
                <circle cx="35" cy="35" r={r} fill="none" stroke="var(--border)" strokeWidth="7"/>
                <circle
                  cx="35" cy="35" r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth="7"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  style={{transition:'stroke-dasharray 0.8s ease'}}
                />
                <text
                  x="35" y="35"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={theme === 'dark' ? '#ffffff' : '#1a1a2e'}
                  fontSize="13"
                  fontWeight="bold"
                  style={{transform:'rotate(90deg)', transformOrigin:'35px 35px'}}
                >
                  {Math.round(percent)}%
                </text>
              </svg>
              {/* النص */}
              <div>
                <h3 style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)'}}>{label}</h3>
                <p style={{margin:'0.1rem 0 0', fontSize:'1.8rem', fontWeight:'bold', color}}>{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* نافذة المعلومات */}
      {isInfoOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInfoOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{maxWidth:'600px', width:'90vw'}}>
            <button className={styles.closeButton} onClick={() => setIsInfoOpen(false)}>&times;</button>
            <h2 style={{marginTop:0, fontSize:'1.1rem'}}>📊 معلومات البلاغات</h2>

            {/* ملخص البلاغات */}
            <h3 style={{fontSize:'0.9rem', color:'var(--text-muted)', margin:'1rem 0 0.5rem'}}>ملخص البلاغات</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem'}}>
              {[
                { label: 'معدل الحل', value: stats.total > 0 ? `${Math.round((stats.closed/stats.total)*100)}%` : '0%', color: '#22c55e' },
                { label: 'قيد الانتظار', value: stats.open, color: '#ef4444' },
                { label: 'تم معالجتها', value: stats.closed, color: '#22c55e' },
                { label: 'معلقة', value: stats.inProgress, color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', borderRadius:'8px', background:'var(--bg)'}}>
                  <span style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>{item.label}</span>
                  <span style={{fontWeight:'bold', color: item.color}}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* دورة حياة البلاغ */}
            <h3 style={{fontSize:'0.9rem', color:'var(--text-muted)', margin:'0 0 0.75rem'}}>🔄 دورة حياة البلاغ</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              {[
                { step: '1', label: 'استقبال البلاغ', desc: 'يصل البلاغ من المستفيد', color: 'var(--primary)' },
                { step: '2', label: 'التصنيف', desc: 'تصنيف البلاغ حسب النوع', color: '#f59e0b' },
                { step: '3', label: 'المعالجة', desc: 'إحالة البلاغ للجهة المختصة', color: '#8b5cf6' },
                { step: '4', label: 'الإغلاق', desc: 'تأكيد الحل وإغلاق البلاغ', color: '#22c55e' },
              ].map(item => (
                <div key={item.step} style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                  <div style={{width:'32px', height:'32px', borderRadius:'50%', background:item.color, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', flexShrink:0}}>{item.step}</div>
                  <div>
                    <div style={{fontWeight:'600', color:'var(--text)'}}>{item.label}</div>
                    <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.filterGroup} style={{flex: '2'}}>
          <input type="text" className={styles.filterInput} placeholder="بحث برقم البلاغ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className={styles.filterGroup} style={{flex: '1.5'}}>
          <select className={styles.filterSelect} value={selectedReceiver} onChange={(e) => setSelectedReceiver(e.target.value)}>
            <option value="all">الموظف (الكل)</option>
            {EMPLOYEES.map((emp) => (
              <option key={emp.user} value={emp.name}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup} style={{flex: '1.5'}}>
          <select className={styles.filterSelect} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">التصنيف (الكل)</option>
            {Array.from(new Set(complaints.map(c => c.type).filter(t => t && t !== 'غير محدد'))).sort().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup} style={{flex: '0.5', position: 'relative'}}>
          <button 
            className={styles.filterSelect} 
            onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
            style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', cursor:'pointer', background: (startDate || endDate) ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: (startDate || endDate) ? 'white' : 'inherit'}}
            title="فلترة حسب التاريخ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span style={{fontSize:'0.8rem'}}>{(startDate || endDate) ? 'مفعل' : ''}</span>
          </button>

          {isDateMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '55px',
              left: '0',
              width: '280px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              zIndex: 3000,
              padding: '1.2rem',
              direction: 'rtl'
            }}>
              <h4 style={{margin:'0 0 1rem', fontSize:'0.9rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem'}}>فلترة التاريخ</h4>
              
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'1.2rem'}}>
                <button 
                  onClick={() => { const d = new Date().toISOString().split('T')[0]; setStartDate(d); setEndDate(d); setIsDateMenuOpen(false); }}
                  style={{padding:'6px', borderRadius:'6px', border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', cursor:'pointer', fontSize:'0.8rem', color:'white'}}
                >اليوم</button>
                <button 
                  onClick={() => { 
                    const d = new Date(); d.setDate(d.getDate() - 1); 
                    const s = d.toISOString().split('T')[0];
                    setStartDate(s); setEndDate(s); setIsDateMenuOpen(false); 
                  }}
                  style={{padding:'6px', borderRadius:'6px', border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', cursor:'pointer', fontSize:'0.8rem', color:'white'}}
                >أمس</button>
                <button 
                  onClick={() => { 
                    const d = new Date(); d.setDate(d.getDate() - 7); 
                    setStartDate(d.toISOString().split('T')[0]); 
                    setEndDate(new Date().toISOString().split('T')[0]); 
                    setIsDateMenuOpen(false); 
                  }}
                  style={{padding:'6px', borderRadius:'6px', border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', cursor:'pointer', fontSize:'0.8rem', color:'white'}}
                >آخر 7 أيام</button>
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setIsDateMenuOpen(false); }}
                  style={{padding:'6px', borderRadius:'6px', border:'1px solid var(--danger)', color:'var(--danger)', background:'transparent', cursor:'pointer', fontSize:'0.8rem'}}
                >إلغاء الفلتر</button>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <div>
                  <label style={{fontSize:'0.75rem', display:'block', marginBottom:'4px', color:'white', opacity:0.9}}>من تاريخ:</label>
                  <input type="date" className={styles.filterInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{width:'100%', padding:'8px', color:'white'}} />
                </div>
                <div>
                  <label style={{fontSize:'0.75rem', display:'block', marginBottom:'4px', color:'white', opacity:0.9}}>إلى تاريخ:</label>
                  <input type="date" className={styles.filterInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{width:'100%', padding:'8px', color:'white'}} />
                </div>
                <button 
                  onClick={() => setIsDateMenuOpen(false)}
                  style={{marginTop:'10px', background:'var(--primary)', color:'white', border:'none', padding:'8px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}
                >تطبيق النطاق</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* تم نقل أزرار الواتساب والتواصل للأعلى بجانب القائمة بناءً على طلب المستخدم */}


      {isFormOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsFormOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <TicketForm mode={formMode} onClose={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}

      {/* نافذة التعاميم الجديدة */}
      {isCircularsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCircularsOpen(false)}>
          <div className={styles.modalContent} style={{maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                التعاميم وتحديثات النظام
              </h2>
              <button className={styles.modalCloseIcon} onClick={() => setIsCircularsOpen(false)} title="إغلاق">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{marginBottom:'1rem', display:'flex', gap:'10px', flexWrap:'wrap'}}>
              <span 
                onClick={() => setCircularFilter(circularFilter === 'circular' ? 'all' : 'circular')}
                style={{
                  padding:'4px 12px', borderRadius:'20px', 
                  background: circularFilter === 'circular' ? '#10b981' : 'rgba(34, 197, 94, 0.2)', 
                  color: circularFilter === 'circular' ? 'white' : '#10b981', 
                  fontSize:'0.75rem', fontWeight:'bold', cursor:'pointer', transition:'all 0.2s',
                  border: circularFilter === 'circular' ? '1px solid white' : '1px solid transparent'
                }}
              >
                التعاميم
              </span>
              <span 
                onClick={() => setCircularFilter(circularFilter === 'system' ? 'all' : 'system')}
                style={{
                  padding:'4px 12px', borderRadius:'20px', 
                  background: circularFilter === 'system' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)', 
                  color: circularFilter === 'system' ? 'white' : '#3b82f6', 
                  fontSize:'0.75rem', fontWeight:'bold', cursor:'pointer', transition:'all 0.2s',
                  border: circularFilter === 'system' ? '1px solid white' : '1px solid transparent'
                }}
              >
                تحديثات النظام
              </span>
              <span 
                onClick={() => setCircularFilter(circularFilter === 'drive' ? 'all' : 'drive')}
                style={{
                  padding:'4px 12px', borderRadius:'20px', 
                  background: circularFilter === 'drive' ? '#eab308' : 'rgba(234, 179, 8, 0.2)', 
                  color: circularFilter === 'drive' ? 'white' : '#eab308', 
                  fontSize:'0.75rem', fontWeight:'bold', cursor:'pointer', transition:'all 0.2s',
                  border: circularFilter === 'drive' ? '1px solid white' : '1px solid transparent'
                }}
              >
                تحديثات الدرايف (الملفات)
              </span>
            </div>

            <div className={styles.driveListSimple} style={{maxHeight:'400px', overflowY:'auto'}}>
              {/* تحديثات النظام الديناميكية */}
              {(circularFilter === 'all' || circularFilter === 'system') && SYSTEM_UPDATES.map((update, idx) => (
                <div key={idx} className={styles.driveItemSimple} style={{textAlign:'right', borderRight:`4px solid ${idx === 0 ? '#3b82f6' : '#94a3b8'}`, cursor:'default', background: idx === 0 ? 'rgba(59, 130, 246, 0.05)' : 'transparent', marginBottom:'1rem'}}>
                  <div style={{fontWeight:'800', marginBottom:'5px', color: idx === 0 ? '#3b82f6' : 'inherit'}}>{update.version} — {update.title}</div>
                  {update.points.map((p, pIdx) => (
                    <div key={pIdx} style={{fontSize:'0.85rem', opacity:0.8}}>• {p}</div>
                  ))}
                  <div style={{fontSize:'0.75rem', marginTop:'10px', opacity:0.6}}>{update.date}</div>
                </div>
              ))}

              {/* تحديثات الدرايف المأخوذة من نوشن */}
              {(circularFilter === 'all' || circularFilter === 'drive') && complaints.filter(c => c.type === 'تحديث نظام' && c.receiver === 'الجميع').map(update => (
                <div key={update.id} className={styles.driveItemSimple} style={{textAlign:'right', borderRight:'4px solid #eab308', cursor:'default', background: 'rgba(234, 179, 8, 0.05)', marginBottom:'1rem'}}>
                   <div style={{fontWeight:'800', marginBottom:'5px', color:'#eab308'}}>🟡 تحديث من الموظفين</div>
                   <div style={{fontSize:'0.85rem', opacity:0.8}}>{update.number}</div>
                   <div style={{fontSize:'0.75rem', marginTop:'10px', opacity:0.6}}>{update.date}</div>
                </div>
              ))}

              {/* التعاميم */}
              {(circularFilter === 'all' || circularFilter === 'circular') && (
                <>
                  <div className={styles.driveItemSimple} style={{textAlign:'right', borderRight:'4px solid #ef4444', cursor:'default', background: 'rgba(239, 68, 68, 0.05)', marginBottom:'1rem'}}>
                    <div style={{fontWeight:'800', marginBottom:'5px', color:'#ef4444'}}>🆕 تعميم رقم 1445/02 (هام)</div>
                    <div style={{fontSize:'0.85rem', opacity:0.8}}>بشأن تغيير نطاق 6.18 VPN - تحديثات الأمان الجديدة</div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px'}}>
                      <span style={{fontSize:'0.75rem', color:'var(--primary)'}}>10-05-2026</span>
                      <a href="/الملفات/التعاميم/6.18 VPN  تغيير نطاق.pdf" target="_blank" style={{fontSize:'0.75rem', background:'var(--primary)', color:'white', padding:'2px 8px', borderRadius:'4px', textDecoration:'none'}}>عرض الملف</a>
                    </div>
                  </div>

                  <div className={styles.driveItemSimple} style={{textAlign:'right', borderRight:'4px solid var(--primary)', cursor:'default', marginBottom:'1rem'}}>
                    <div style={{fontWeight:'800', marginBottom:'5px'}}>📌 تعميم رقم 1445/01</div>
                    <div style={{fontSize:'0.85rem', opacity:0.8}}>بشأن تنظيم آلية استقبال البلاغات لعام 2026</div>
                    <div style={{fontSize:'0.75rem', marginTop:'10px', color:'var(--primary)'}}>07-05-2026</div>
                  </div>
                  <div className={styles.driveItemSimple} style={{textAlign:'right', borderRight:'4px solid var(--warning)', cursor:'default', marginBottom:'1rem'}}>
                    <div style={{fontWeight:'800', marginBottom:'5px'}}>📢 قرار إداري داخلي</div>
                    <div style={{fontSize:'0.85rem', opacity:0.8}}>تحديث قائمة المشرفين والمسؤولين في البلديات الفرعية</div>
                    <div style={{fontSize:'0.75rem', marginTop:'10px', color:'var(--primary)'}}>تاريخ النشر: 01-05-2026</div>
                  </div>
                </>
              )}
            </div>

            <button className={styles.submitButton} onClick={() => setIsCircularsOpen(false)} style={{marginTop:'1.5rem'}}>
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {isDriveOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDriveOpen(false)}>
          <div className={styles.modalContent} style={{maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                مركز النماذج والمرفقات
              </h2>
              <button className={styles.modalCloseIcon} onClick={() => setIsDriveOpen(false)} title="إغلاق">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.driveListSimple}>
              <a href="https://drive.google.com/drive/folders/1vEFhhR7njDyb1UvkkcGh2ckf2akbURAq?usp=drive_link" target="_blank" rel="noopener noreferrer" className={styles.driveItemSimple}>📄 النماذج الرسمية</a>
              <a href="https://drive.google.com/drive/folders/1-G-tqa_NCZHQuDtxNgyv4COVI4l4JF8D?usp=drive_link" target="_blank" rel="noopener noreferrer" className={styles.driveItemSimple}>📁 المرفقات العامة</a>
              <a href="https://drive.google.com/drive/folders/1FKKFL7QJYXCCWYU-YH8-F1Z-sZ3whEud?usp=drive_link" target="_blank" rel="noopener noreferrer" className={styles.driveItemSimple}>🛠️ نماذج يخص داعم</a>
            </div>

            <div style={{marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <button 
                onClick={async () => {
                  const fileName = prompt('ما هو اسم الملف أو التحديث الذي أضفته؟');
                  if (!fileName) return;

                  try {
                    setNewTicketToast('جاري إرسال التنبيه للفريق...');
                    const res = await fetch('/api/create-ticket', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ticketNumber: `📢 تحديث درايف: ${fileName} (بواسطة ${loggedInUser || 'المسؤول'})`,
                        type: 'تحديث نظام',
                        receiver: 'الجميع',
                        date: new Date().toISOString().split('T')[0],
                        solution: 'تم الرفع'
                      })
                    });

                    if (res.ok) {
                      setNewTicketToast('✅ تم إرسال التنبيه لجميع الزملاء بنجاح!');
                      setIsDriveOpen(false);
                      // تحديث البيانات محلياً لرؤية التنبيه فوراً
                      window.location.reload(); 
                    }
                  } catch (e) {
                    setNewTicketToast('❌ فشل إرسال التنبيه. حاول مرة أخرى.');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                أبلغ الفريق بتحديث الدرايف 🔔
              </button>
            </div>

          </div>
        </div>
      )}

      {isSupOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSupOpen(false)}>
          <div className={styles.modalContent} style={{maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <button className={styles.modalCloseIcon} onClick={() => setIsSupOpen(false)} title="إغلاق">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <SupervisorsSearch />
          </div>
        </div>
      )}

      {/* نافذة التحدث مع الموظف */}
      {isContactOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsContactOpen(false)}>
          <div className={styles.modalContent} style={{maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.04c0 2.123.542 4.19 1.594 6.02l-1.595 5.821 5.956-1.562a11.754 11.754 0 005.441 1.341h.005c6.635 0 12.044-5.414 12.048-12.044 0-3.212-1.251-6.232-3.524-8.504"/>
                </svg>
                تواصل مع الموظفين
              </h2>
              <button className={styles.modalCloseIcon} onClick={() => setIsContactOpen(false)} title="إغلاق">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.driveListSimple} style={{maxHeight:'400px', overflowY:'auto'}}>
              {EMPLOYEES.map(emp => (
                <a 
                  key={emp.user} 
                  href={`https://wa.me/${emp.phone}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.driveItemSimple}
                  style={{display:'flex', justifyContent:'space-between', alignItems:'center', textDecoration:'none'}}
                >
                  <span style={{fontWeight:'700'}}>{emp.name}</span>
                  <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#25D366', fontSize:'0.8rem'}}>
                    <span>مراسلـة</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.04c0 2.123.542 4.19 1.594 6.02l-1.595 5.821 5.956-1.562a11.754 11.754 0 005.441 1.341h.005c6.635 0 12.044-5.414 12.048-12.044 0-3.212-1.251-6.232-3.524-8.504"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      {isEditOpen && editingTicket && (
        <div className={styles.modalOverlay} onClick={() => setIsEditOpen(false)}>
          <div className={styles.modalContent} style={{maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{display:'flex', alignItems:'center', gap:'8px'}}>
                تحديث حالة البلاغ 
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </h2>
              <button className={styles.modalCloseIcon} onClick={() => setIsEditOpen(false)} title="إغلاق">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.editForm}>
              <p><strong>رقم البلاغ:</strong> {editingTicket.number}</p>
              <div className={styles.formGroup}>
                <label className={styles.filterLabel}>الحل المقترح (الحالة):</label>
                <select className={styles.filterSelect} defaultValue={editingTicket.solution} id="newSolutionSelect">
                  <option value="تم الحل">✅ تم الحل</option>
                  <option value="لم يتم الحل">❌ لم يتم الحل</option>
                  <option value="أخرى معلقة">⏳ أخرى معلقة</option>
                  <option value="غير محدد">❓ غير محدد</option>
                </select>
              </div>
              <button className={styles.submitButton} disabled={isUpdating} onClick={() => {
                const select = document.getElementById('newSolutionSelect') as HTMLSelectElement;
                handleUpdate(editingTicket.id, select.value);
              }}>
                {isUpdating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.listHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <h2 style={{fontSize:'1.1rem', color:'var(--text)', margin:0}}>📑 قائمة البلاغات</h2>
          
          {(userRole === 'editor' || (loggedInUser && loggedInUser.includes('محمد الربيش'))) && (
            <div className={styles.quickActions}>
              {/* زر إنشاء بلاغ نوشن (+) */}
              <button 
                onClick={() => { setFormMode('notion'); setIsFormOpen(true); }}
                className={styles.quickBtn}
                style={{
                  width:'42px', 
                  background:'var(--primary)', color:'white', 
                  boxShadow:'0 4px 15px rgba(34, 197, 94, 0.4)',
                  fontSize:'1.5rem'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'; e.currentTarget.style.background = '#16a34a'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.background = 'var(--primary)'; }}
                title="إنشاء بلاغ جديد"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>

              {/* زر بلاغ واتساب */}
              <button 
                onClick={() => { setFormMode('whatsapp'); setIsFormOpen(true); }}
                title="إنشاء بلاغ واتساب"
                className={styles.quickBtn}
                style={{
                  padding:'0 15px',
                  background:'linear-gradient(135deg, #25D366, #128C7E)', color:'white', 
                  fontSize:'0.85rem', fontWeight:'bold', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.04c0 2.123.542 4.19 1.594 6.02l-1.595 5.821 5.956-1.562a11.754 11.754 0 005.441 1.341h.005c6.635 0 12.044-5.414 12.048-12.044 0-3.212-1.251-6.232-3.524-8.504"/>
                </svg>
                بلاغ واتساب
              </button>

              {/* زر التحدث مع الموظف */}
              <button 
                onClick={() => setIsContactOpen(true)}
                title="التحدث مع الموظف"
                className={styles.quickBtn}
                style={{
                  padding:'0 15px',
                  background:'#075e54', color:'white', 
                  fontSize:'0.85rem', fontWeight:'bold', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.04c0 2.123.542 4.19 1.594 6.02l-1.595 5.821 5.956-1.562a11.754 11.754 0 005.441 1.341h.005c6.635 0 12.044-5.414 12.048-12.044 0-3.212-1.251-6.232-3.524-8.504"/>
                </svg>
                تحدث مع موظف
              </button>
            </div>
          )}
        </div>
      </div>



      <div className={styles.grid}>
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((complaint) => {
             let statusClass = 'open';
             if (complaint.solution === 'تم الحل') statusClass = 'closed';
             else if (complaint.solution === 'لم يتم الحل') statusClass = 'open';
             else if (complaint.solution === 'أخرى معلقة') statusClass = 'inProgress';
             else if (complaint.solution === 'غير محدد' || !complaint.solution) statusClass = 'undefined';
            return (
              <div key={complaint.id} className={`${styles.card} ${styles['status-' + statusClass]} ${styles.reveal}`}>
                <div className={styles.cardHeader} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span className={styles.ticketNumber}>{complaint.number}</span>
                  {(userRole === 'super_admin' || (userRole === 'editor' && (
                    complaint.receiver === loggedInUser || 
                    // معالجة فروق الأسماء البسيطة
                    (loggedInUser && complaint.receiver.includes(loggedInUser.split(' ')[0]))
                  ))) && (
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      <button 
                        className={styles.editBtn} 
                        onClick={() => {
                          navigator.clipboard.writeText(`رقم البلاغ: ${complaint.number}\nالمستقبل: ${complaint.receiver}\nالحالة: ${complaint.solution}\nالتاريخ: ${complaint.date}`);
                          setNewTicketToast('تم نسخ تفاصيل البلاغ بنجاح!');
                          setTimeout(() => setNewTicketToast(null), 3000);
                        }}
                        title="نسخ تفاصيل البلاغ"
                        style={{background: 'rgba(255, 255, 255, 0.15)', color: 'white'}}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                      </button>
                      <button 
                        className={styles.editBtn} 
                        onClick={() => { setEditingTicket(complaint); setIsEditOpen(true); }} 
                        title="تحديث حالة البلاغ"
                        style={{marginRight: '0', marginLeft: '0'}}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                    <p style={{margin:0}}><strong>المستقبل:</strong> {complaint.receiver}</p>
                  </div>
                  <p><strong>الحل المقترح:</strong> {complaint.solution}</p>
                  <p><strong>التاريخ:</strong> {complaint.date}</p>
                  <div className={styles.cardFooter} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1rem'}}>
                    <span className={styles.typeBadge} style={{ backgroundColor: getCategoryColor(complaint.type) }}>
                      {complaint.type}
                    </span>
                    {EMPLOYEES.find(e => e.name === complaint.receiver) && (
                      <a 
                        href={`https://wa.me/${EMPLOYEES.find(e => e.name === complaint.receiver)?.phone}?text=${encodeURIComponent(`السلام عليكم، بخصوص البلاغ رقم ${complaint.number}:\nاكتب استفسارك`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className={styles.waCardBtn}
                        title="تواصل واتساب"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.04c0 2.123.542 4.19 1.594 6.02l-1.595 5.821 5.956-1.562a11.754 11.754 0 005.441 1.341h.005c6.635 0 12.044-5.414 12.048-12.044 0-3.212-1.251-6.232-3.524-8.504"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <h2>لا توجد بلاغات لعرضها حالياً</h2>
            <p>تأكد من اختيار الفلاتر الصحيحة أو تأكد من وجود البلاغات في Notion.</p>
          </div>
        )}
      </div>
      <AIChat />
      
      {/* تم نقل نافذة تبديل البوابة لتكون تحت الأيقونة مباشرة في الهيدر العلوي */}

    </main>
  );
}
