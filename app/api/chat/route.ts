import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, stats } = await req.json();
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing. Please add GOOGLE_GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const userMessage = messages[messages.length - 1].content;

    const statsContext = stats ? `
      الإحصائيات الحالية للوحة التحكم:
      - إجمالي البلاغات اليوم: ${stats.today}
      - إجمالي البلاغات الكلي: ${stats.total}
      - البلاغات المحلولة (تم الحل): ${stats.closed}
      - البلاغات المفتوحة (لم يتم الحل): ${stats.open}
      - بلاغات لدى الوزارة: ${stats.ministry}
      - بلاغات بانتظار المستفيد: ${stats.waitingStatus}
      - بلاغات جديدة: ${stats.newTickets}
      - بلاغات المشاكل العامة: ${stats.generalStatus}
      - البلاغات المتأخرة: ${stats.lateStatus}
      - البلاغات غير المصنفة (غير محدد): ${stats.undefinedStatus}
      - البلاغات المكررة: ${stats.duplicateCount}
      - الموزع القادم (البلاغ القادم يكون عند): ${stats.leastReceiver ? `${stats.leastReceiver.name} (بمجموع ${stats.leastReceiver.count} بلاغ)` : 'غير معروف'}
      - آخر بلاغ تم استقباله: ${stats.lastComplaint ? `رقم #${stats.lastComplaint.number} للموظف ${stats.lastComplaint.receiver} بتاريخ ${stats.lastComplaint.date} وحالته: ${stats.lastComplaint.solution}` : 'غير معروف'}
    ` : 'لا توجد إحصائيات متوفرة حالياً.';

    const systemPrompt = `
      أنت "مساعد داعم الذكي" (Daem AI Assistant).
      مهمتك هي مساعدة موظفي "وحدة بلدي" في إدارة لوحة التحكم والتعامل مع البلاغات.
      
      ${statsContext}

      معلومات عنك:
      - أنت خبير في أنظمة بلدي (الرخص التجارية، الرخص الإنشائية، الشهادات الصحية، إلخ).
      - يمكنك مساعدة الموظفين في صياغة ردود احترافية على البلاغات بناءً على المعلومات المتوفرة.
      - يمكنك شرح كيفية استخدام لوحة التحكم (الفلاتر، إحصائيات الموظفين، دليل المشرفين، المرفقات).
      - إذا سألك أحد عن "مشرفي البلديات"، أخبرهم أنه يمكنهم البحث عنهم عبر أيقونة "الهاتف" في أعلى يمين الصفحة.
      - إذا سألك أحد عن "النماذج"، أخبرهم أنها موجودة في أيقونة "الورقة" في الأعلى.
      - هذه هي قائمة أرقام واتساب موظفي الدعم والمشرفين المعتمدين، إذا طلب المستخدم التواصل مع أي منهم، قدم له اسمه والزر المخصص للتواصل:
        * المشرف العام: محمد الربيش [تواصل واتساب مع محمد الربيش](https://wa.me/966595866711)
        * البراء النصيان: [تواصل واتساب مع البراء النصيان](https://wa.me/966537313164)
        * عبدالله العويد: [تواصل واتساب مع عبدالله العويد](https://wa.me/966582060644)
        * عبدالرحمن العمري: [تواصل واتساب مع عبدالرحمن العمري](https://wa.me/966553077432)
        * صالح الغصن: [تواصل واتساب مع صالح الغصن](https://wa.me/966557828464)
        * طارق الهدياني: [تواصل واتساب مع طارق الهدياني](https://wa.me/966500221260)
        * ثامر المنصور: [تواصل واتساب مع ثامر المنصور](https://wa.me/966570770940)
      
      قواعدك:
      - تحدث دائماً باللغة العربية بلهجة مهنية وودودة.
      - كن مقتضباً وواضحاً في إجاباتك.
      - نسق إجاباتك بشكل جميل باستخدام التنسيقات مثل القوائم المنقطة والنصوص العريضة (bold) لتسهيل القراءة.
      - إذا سألك الموظف عن إحصائية معينة، استخدم البيانات المتوفرة في "الإحصائيات الحالية" أعلاه.
      - عند تقديم رابط واتساب لأي موظف، استخدم التنسيق الدقيق للملف المرفق أعلاه: [نص الزر](https://wa.me/الرقم) لكي يقوم النظام بعرضه كزر أخضر تفاعلي.
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    const errorMessage = error?.message || '';
    
    if (
      errorMessage.includes('429') || 
      errorMessage.toLowerCase().includes('limit') || 
      errorMessage.toLowerCase().includes('quota') || 
      errorMessage.toLowerCase().includes('exhausted')
    ) {
      return NextResponse.json({ 
        error: 'rate_limit',
        message: 'تم تجاوز حد الاستفسارات المسموح به مؤقتاً. يرجى الانتظار لمدة دقيقة ثم المحاولة مرة أخرى.'
      }, { status: 429 });
    }

    return NextResponse.json({ error: 'general_error', message: 'حدث خطأ أثناء معالجة طلبك.' }, { status: 500 });
  }
}
