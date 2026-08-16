// ─────────────────────────────────────────────────────────────
// 📱 ويدجت بلاغات وحدة بلدي — إصدار الموظف
// Developer: Balady Unit / Claude AI
// متطلبات: تطبيق Scriptable (iOS) — مجاني من App Store
// ─────────────────────────────────────────────────────────────

const BASE_URL  = "https://tickets-daem.vercel.app";
const API_URL   = `${BASE_URL}/api/widget-employee`;
const WIDGET_URL = `${BASE_URL}/mobile-widget`;

// مفاتيح التخزين الآمن في iOS Keychain
const KC_MODE   = "balady_widget_mode";
const KC_USER   = "balady_widget_user";
const KC_PASS   = "balady_widget_pass";

// ─────────────────────────────────────────────────────────────
// 1. قراءة أو جلب بيانات الدخول
// ─────────────────────────────────────────────────────────────
let creds = loadCredentials();

if (!creds && !config.runsInWidget) {
  // طلب بيانات الدخول عند التشغيل داخل التطبيق
  creds = await promptLogin();
}

// ─────────────────────────────────────────────────────────────
// 2. جلب البيانات من الـ API
// ─────────────────────────────────────────────────────────────
let data = await fetchStats(creds);

// ─────────────────────────────────────────────────────────────
// 3. بناء وعرض الويدجت
// ─────────────────────────────────────────────────────────────
if (config.runsInWidget) {
  let widget = createWidget(data);
  Script.setWidget(widget);
  Script.complete();
} else {
  // قائمة خيارات عند التشغيل اليدوي
  let choice = await showMenu(data);
  if (choice === 0) {
    let w = createWidget(data);
    await w.presentMedium();
  } else if (choice === 1) {
    Keychain.remove(KC_MODE);
    Keychain.remove(KC_USER);
    Keychain.remove(KC_PASS);
    let newCreds = await promptLogin();
    let newData  = await fetchStats(newCreds);
    let w = createWidget(newData);
    await w.presentMedium();
  } else if (choice === 2) {
    // فتح صفحة الويدجت الكاملة
    Safari.open(WIDGET_URL);
  }
}

// ═════════════════════════════════════════════════════════════
// الدوال المساعدة
// ═════════════════════════════════════════════════════════════

function loadCredentials() {
  if (!Keychain.contains(KC_PASS)) return null;
  return {
    mode:     Keychain.contains(KC_MODE) ? Keychain.get(KC_MODE) : "employee",
    username: Keychain.contains(KC_USER) ? Keychain.get(KC_USER) : "",
    password: Keychain.get(KC_PASS),
  };
}

async function promptLogin() {
  // 1) اختيار نوع الدخول
  let modeAlert = new Alert();
  modeAlert.title   = "وحدة بلدي 🏙️";
  modeAlert.message = "اختر نوع الدخول";
  modeAlert.addAction("موظف 👨‍💼");
  modeAlert.addAction("مشرف 👁️");
  modeAlert.addCancelAction("إلغاء");
  let modeIdx = await modeAlert.presentAlert();

  if (modeIdx === 0) {
    // دخول الموظف
    let form = new Alert();
    form.title = "دخول الموظف";
    form.addTextField("اسم المستخدم (مثال: s.alghosen)");
    form.addSecureTextField("كلمة السر");
    form.addAction("دخول ✅");
    form.addCancelAction("إلغاء");
    let ok = await form.presentAlert();
    if (ok === 0) {
      let user = form.textFieldValue(0);
      let pass = form.textFieldValue(1);
      Keychain.set(KC_MODE, "employee");
      Keychain.set(KC_USER, user);
      Keychain.set(KC_PASS, pass);
      return { mode: "employee", username: user, password: pass };
    }
  } else if (modeIdx === 1) {
    // دخول المشرف
    let form = new Alert();
    form.title = "دخول المشرف";
    form.addSecureTextField("كلمة مرور المشرف");
    form.addAction("دخول ✅");
    form.addCancelAction("إلغاء");
    let ok = await form.presentAlert();
    if (ok === 0) {
      let pass = form.textFieldValue(0);
      Keychain.set(KC_MODE, "admin");
      Keychain.set(KC_USER, "admin");
      Keychain.set(KC_PASS, pass);
      return { mode: "admin", username: "admin", password: pass };
    }
  }
  // تسجيل دخول افتراضي فاشل إذا ألغى المستخدم
  return null;
}

async function fetchStats(credentials) {
  if (!credentials) return buildEmptyData("لم يتم تسجيل الدخول");
  try {
    let req    = new Request(API_URL);
    req.method = "POST";
    req.headers = { "Content-Type": "application/json" };
    req.body   = JSON.stringify(credentials);
    let res    = await req.loadJSON();

    if (res && res.success) return res;

    // مصادقة فاشلة: احذف البيانات المحفوظة
    if (res && (res.error || "").includes("غير صحيح")) {
      Keychain.remove(KC_PASS);
    }
    return buildEmptyData(res?.error ?? "خطأ في الاستجابة");
  } catch (e) {
    return buildEmptyData("لا يوجد اتصال");
  }
}

function buildEmptyData(reason) {
  return {
    success: false,
    employeeName: "—",
    isAdmin: false,
    stats: { total:0, new:0, waiting:0, ministry:0, unsolved:0, solved:0, other:0 },
    latest: [],
    hasNewTickets: false,
    error: reason,
  };
}

async function showMenu(data) {
  let name = data.employeeName ?? "—";
  let a = new Alert();
  a.title   = `وحدة بلدي — ${name}`;
  a.message = data.success
    ? `الإجمالي: ${data.stats.total} | جديد: ${data.stats.new}`
    : (data.error ?? "غير متصل");
  a.addAction("🖼️ معاينة الويدجت");
  a.addAction("🔑 تغيير بيانات الدخول");
  a.addAction("🌐 فتح صفحة الويدجت");
  a.addCancelAction("إلغاء");
  return await a.presentAlert();
}

// ═════════════════════════════════════════════════════════════
// بناء الويدجت المرئي
// ═════════════════════════════════════════════════════════════

function createWidget(data) {
  let widget = new ListWidget();

  // ── الخلفية ──────────────────────────────────────────────
  let gradient = new LinearGradient();
  if (data.hasNewTickets) {
    gradient.colors    = [new Color("#1a0a2e"), new Color("#2d1060"), new Color("#0f172a")];
    gradient.locations = [0, 0.5, 1];
  } else {
    gradient.colors    = [new Color("#0f172a"), new Color("#1e293b")];
    gradient.locations = [0, 1];
  }
  widget.backgroundGradient = gradient;
  widget.padding = new Rect(14, 14, 14, 14);
  widget.url     = WIDGET_URL;
  // تحديث تلقائي كل 15 دقيقة
  widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  // ── رأس الويدجت ──────────────────────────────────────────
  let header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  let title = header.addText("📊 " + (data.employeeName ?? "وحدة بلدي"));
  title.font      = Font.boldSystemFont(13);
  title.textColor = new Color("#f1f5f9");

  header.addSpacer();

  let badge = header.addStack();
  badge.backgroundColor = data.success
    ? new Color("#10b981", 0.2)
    : new Color("#ef4444", 0.2);
  badge.cornerRadius = 5;
  badge.padding = new Rect(2, 7, 2, 7);
  let badgeTxt = badge.addText(data.success ? "● متصل" : "● أوفلاين");
  badgeTxt.font      = Font.boldSystemFont(9);
  badgeTxt.textColor = data.success ? new Color("#10b981") : new Color("#ef4444");

  // ── تنبيه البلاغات الجديدة ────────────────────────────────
  if (data.hasNewTickets) {
    widget.addSpacer(6);
    let alertRow = widget.addStack();
    alertRow.backgroundColor = new Color("#7c3aed", 0.3);
    alertRow.cornerRadius    = 8;
    alertRow.padding         = new Rect(5, 10, 5, 10);
    let alertTxt = alertRow.addText(
      `🔔 لديك ${data.stats.new} بلاغ جديد!`
    );
    alertTxt.font      = Font.boldSystemFont(11);
    alertTxt.textColor = new Color("#c4b5fd");
  }

  widget.addSpacer(8);

  // ── صف الإحصائيات ────────────────────────────────────────
  let row = widget.addStack();
  row.layoutHorizontally();
  row.spacing = 6;
  addCard(row, "الإجمالي",  String(data.stats.total),    "#f8fafc");
  addCard(row, "جديد",      String(data.stats.new),      "#8b5cf6");
  addCard(row, "غير محلول", String(data.stats.unsolved),  "#ef4444");
  addCard(row, "تم الحل",   String(data.stats.solved),    "#10b981");

  widget.addSpacer(10);

  // ── آخر البلاغات ─────────────────────────────────────────
  let secTitle = widget.addText("🕒 آخر البلاغات:");
  secTitle.font      = Font.boldSystemFont(10);
  secTitle.textColor = new Color("#94a3b8");
  widget.addSpacer(4);

  let list = data.latest ?? [];
  if (list.length === 0) {
    let empty = widget.addText(
      data.success ? "لا توجد بلاغات" : (data.error ?? "تحقق من الاتصال")
    );
    empty.font      = Font.systemFont(10);
    empty.textColor = new Color("#64748b");
  } else {
    for (let t of list.slice(0, 2)) {
      let tRow = widget.addStack();
      tRow.layoutHorizontally();
      tRow.centerAlignContent();
      tRow.spacing = 4;

      let num = tRow.addText(`🎫 ${t.number}`);
      num.font      = Font.boldSystemFont(10);
      num.textColor = new Color("#f1f5f9");

      tRow.addSpacer(4);

      let typ = tRow.addText(t.type);
      typ.font      = Font.systemFont(10);
      typ.textColor = new Color("#cbd5e1");
      typ.lineLimit = 1;

      tRow.addSpacer();

      let sb = tRow.addStack();
      let sc = statusColor(t.status);
      sb.backgroundColor = new Color(sc, 0.15);
      sb.cornerRadius    = 4;
      sb.padding         = new Rect(1, 5, 1, 5);
      let st = sb.addText(t.status);
      st.font      = Font.boldSystemFont(8);
      st.textColor = new Color(sc);

      widget.addSpacer(3);
    }
  }

  return widget;
}

function addCard(parent, label, value, colorHex) {
  let card = parent.addStack();
  card.layoutVertically();
  card.backgroundColor = new Color("#1e293b", 0.65);
  card.cornerRadius    = 8;
  card.padding         = new Rect(7, 7, 7, 7);
  card.centerAlignContent();

  let v = card.addText(value);
  v.font        = Font.boldSystemFont(16);
  v.textColor   = new Color(colorHex);
  v.textOpacity = 0.95;

  let l = card.addText(label);
  l.font        = Font.systemFont(8);
  l.textColor   = new Color("#94a3b8");
  l.textOpacity = 0.8;
}

function statusColor(status) {
  const MAP = {
    "بلاغ جديد":          "#8b5cf6",
    "بانتظار المستفيد":   "#ec4899",
    "لدى الوزارة":        "#f59e0b",
    "مشكلة عامة":         "#0ea5e9",
    "لم يتم الحل":        "#ef4444",
    "تم الحل":            "#10b981",
    "مجاز":               "#6b7280",
  };
  return MAP[status] ?? "#3b82f6";
}
