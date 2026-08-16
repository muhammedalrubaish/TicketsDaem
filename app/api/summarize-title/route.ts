import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// اختصار عناوين البلاغات الطويلة في قائمة داعم إلى وصف قصير ومفهوم بالعربية
export async function POST(req: Request) {
  try {
    const { titles } = await req.json();
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is missing.' }, { status: 500 });
    }

    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({ summaries: [] });
    }

    // حد أقصى 25 عنواناً في الطلب الواحد لتفادي تجاوز حدود النموذج
    const inputTitles: string[] = titles.slice(0, 25).map((t: any) => String(t || '').slice(0, 500));

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = `
      مهمتك اختصار عناوين بلاغات نظام بلدي إلى وصف قصير جداً وواضح باللغة العربية.

      القواعد:
      1. لكل عنوان أعد ملخصاً من 4 إلى 8 كلمات كحد أقصى يوضح جوهر المشكلة (مثال: "مشكلة تقنية في إصدار رخصة تجارية" أو "خطأ في تواريخ رخصة بناء مجددة").
      2. حافظ على المصطلحات الأساسية: رخصة بناء، رخصة تجارية، قرار مساحي، مخطط، شهادة إشغال، مكتب هندسي، إلخ.
      3. إذا احتوى العنوان رقم مرجعي مهم فلا تدرجه في الملخص.
      4. إذا كان العنوان عاماً بالإنجليزية مثل "New Ticket from E Ticket Balady Portal" فالملخص: "بلاغ من بوابة التذاكر الإلكترونية".
      5. أرجع النتيجة حصراً بصيغة JSON بالشكل التالي دون أي نص إضافي:
         { "summaries": ["ملخص العنوان الأول", "ملخص العنوان الثاني", ...] }
      6. يجب أن يكون عدد عناصر summaries مساوياً تماماً لعدد العناوين المدخلة وبنفس الترتيب.
    `;

    const inputJson = JSON.stringify({ titles: inputTitles });

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b'
    ];

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let responseText = '';
    let succeeded = false;

    for (const modelName of modelsToTry) {
      const attempts = 2;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' }
          });
          const result = await model.generateContent([systemPrompt, inputJson]);
          responseText = result.response.text();
          if (responseText) {
            succeeded = true;
            break;
          }
        } catch (e: any) {
          const errMsg = e.message || String(e);
          console.warn(`Summarize model ${modelName} attempt ${attempt} failed:`, errMsg);
          const isTransient = errMsg.includes('503') || errMsg.includes('429') ||
            errMsg.toLowerCase().includes('overloaded') ||
            errMsg.toLowerCase().includes('service unavailable');
          if (isTransient && attempt < attempts) {
            await sleep(1200);
          } else {
            break;
          }
        }
      }
      if (succeeded) break;
    }

    if (!succeeded) {
      return NextResponse.json({ error: 'All Gemini models failed.' }, { status: 502 });
    }

    let summaries: string[] = [];
    try {
      const parsed = JSON.parse(responseText);
      summaries = Array.isArray(parsed.summaries) ? parsed.summaries.map((s: any) => String(s || '')) : [];
    } catch (parseErr) {
      return NextResponse.json({ error: 'Failed to parse model response.' }, { status: 502 });
    }

    // ضمان تطابق عدد الملخصات مع عدد المدخلات
    while (summaries.length < inputTitles.length) summaries.push('');

    return NextResponse.json({ summaries: summaries.slice(0, inputTitles.length) });
  } catch (error: any) {
    console.error('Summarize Title Error:', error);
    return NextResponse.json({ error: error?.message || 'خطأ أثناء اختصار العناوين.' }, { status: 500 });
  }
}
