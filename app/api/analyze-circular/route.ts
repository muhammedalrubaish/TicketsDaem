import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم توفير الملف.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'مفتاح Gemini API غير متوفر في تكوين الخادم.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // استخدام gemini-2.5-flash لقراءة الملفات والسرعة الفائقة
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // تحويل الملف إلى base64
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64Data = fileBuffer.toString('base64');
    const mimeType = file.type || 'application/pdf';

    const prompt = `
      أنت نظام ذكاء اصطناعي متخصص في تحليل المستندات والتعاميم الإدارية الرسمية.
      قم بتحليل مستند التعميم المرفق واستخرج منه البيانات التالية بدقة شديدة وصغها باللغة العربية:
      1. "title": اسم أو عنوان التعميم بشكل واضح ومختصر ومباشر (مثال: "تنظيم الرخص الإنشائية" أو "تحديثات الشهادات الصحية"). تجنب كتابة "تعميم بشأن..." بل اكتب العنوان مباشرة.
      2. "number": رقم التعميم (مثلاً "7.05" أو "1445/02"). إذا لم يكن هناك رقم صريح، اتركه فارغاً.
      3. "description": تلخيص ووصف مختصر جداً لأهم بنود وتفاصيل التعميم في سطرين أو ثلاثة أسطر على الأكثر بأسلوب واضح ومباشر.

      يجب أن تكون الاستجابة بصيغة JSON صالحة تماماً وتحتوي على المفاتيح التالية فقط:
      {
        "title": "...",
        "number": "...",
        "description": "..."
      }
      تنبيه هام جداً: لا تكتب أي نصوص تمهيدية أو شرح أو علامات markdown (مثل \`\`\`json)؛ فقط أرجع نص الـ JSON مباشرة ليكون قابلاً للتحليل البرمجي (JSON.parse).
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      prompt
    ]);

    const response = await result.response;
    let text = response.text().trim();

    // إزالة علامات markdown للـ json إذا وجدت
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    try {
      const parsedData = JSON.parse(text);
      return NextResponse.json({
        success: true,
        title: parsedData.title || '',
        number: parsedData.number || '',
        description: parsedData.description || ''
      });
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', text, parseError);
      return NextResponse.json({
        success: false,
        error: 'فشل تحليل استجابة الذكاء الاصطناعي كـ JSON.',
        rawText: text
      });
    }
  } catch (error: any) {
    console.error('Analyze Circular API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'حدث خطأ غير متوقع أثناء تحليل الملف.' 
    }, { status: 500 });
  }
}
