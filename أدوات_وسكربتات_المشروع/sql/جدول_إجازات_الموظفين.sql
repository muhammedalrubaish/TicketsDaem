-- ═══════════════════════════════════════════════════════════════════
-- جدول إجازات الموظفين + معادلة عدد البلاغات
-- ═══════════════════════════════════════════════════════════════════
-- الغرض:
--   ١. تسجيل إجازات الموظفين حتى يتخطاهم نظام التوزيع بالدور.
--   ٢. الاحتفاظ بسجل الإجازات لمعرفة من كان غائباً ومتى.
--
-- المعادلة نفسها لا تحتاج جدولاً: النظام يضيف بلاغات باسم «إجازة»
-- في جدول tickets نفسه (كما هو معمول به يدوياً حالياً) ليبقى الموظف
-- الغائب متوازياً مع أعلى زميل، فلا يُختار أثناء غيابه ولا ينهال عليه
-- سيل البلاغات عند رجوعه.
--
-- طريقة التشغيل:
--   لوحة تحكم Supabase ← SQL Editor ← الصق الأمر التالي ← Run
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.employee_leaves (
  id           bigserial PRIMARY KEY,
  -- اسم الموظف كما هو مخزَّن في عمود receiver بجدول البلاغات
  employee_name text        NOT NULL,
  start_date    date        NOT NULL,
  -- فارغ = إجازة مفتوحة تُنهى يدوياً
  end_date      date,
  active        boolean     NOT NULL DEFAULT true,
  created_by    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  ended_at      timestamptz,
  ended_by      text,
  note          text
);

COMMENT ON TABLE  public.employee_leaves            IS 'إجازات الموظفين — يتخطاهم التوزيع بالدور أثناء الإجازة';
COMMENT ON COLUMN public.employee_leaves.end_date   IS 'تاريخ نهاية الإجازة، فارغ يعني إجازة مفتوحة تُنهى يدوياً';
COMMENT ON COLUMN public.employee_leaves.active     IS 'هل الإجازة سارية؟ تُغلق يدوياً أو تلقائياً بعد تجاوز تاريخ النهاية';

-- فهرس يسرّع جلب الإجازات السارية عند كل تسجيل بلاغ
CREATE INDEX IF NOT EXISTS employee_leaves_active_idx
  ON public.employee_leaves (active, employee_name);

-- منع تسجيل أكثر من إجازة سارية لنفس الموظف في وقت واحد
CREATE UNIQUE INDEX IF NOT EXISTS employee_leaves_one_active_idx
  ON public.employee_leaves (employee_name)
  WHERE active;
