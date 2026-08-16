import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    if (!text || text.trim() === '') {
      return NextResponse.json({ correctedText: '', errorCount: 0 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = `
      مهمتك هي تصحيح الأخطاء الإملائية والنحوية في النص العربي المدخل والذي يمثل شرحاً أو إفادة أو حلاً لبلاغ في نظام بلدي.
      
      القواعد:
      1. صحح الكلمات المكتوبة بشكل خاطئ إملائياً فقط (مثل الألف المقصورة، التاء المربوطة والهاء، همزات القطع والوصل، الظاء والضاد، إلخ).
      2. حافظ تماماً على نفس بنية الجملة والمعنى والمفردات المستخدمة دون أي تغيير أو تحوير في صياغة النص أو أسلوبه.
      3. قارن النص الأصلي بالمصحح واحسب عدد الكلمات التي تم تعديلها أو تصحيحها بدقة.
      4. أرجع النتيجة حصراً بصيغة JSON تحتوي على الحقول التالية فقط دون أي نصوص إضافية أو علامات markdown خارج الـ JSON:
         {
           "correctedText": "النص المصحح بالكامل هنا",
           "errorCount": 3
         }
    `;

    let responseText = '';
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b'
    ];
    const modelErrors: Record<string, string> = {};
    let succeeded = false;

    // Helper sleep function
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const modelName of modelsToTry) {
      let attempts = 3; // Try up to 3 times for transient errors (503/429)
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`Trying spelling correction with model: ${modelName} (Attempt ${attempt}/${attempts})`);
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
          });
          const result = await model.generateContent([systemPrompt, text]);
          responseText = result.response.text();
          if (responseText) {
            succeeded = true;
            break; // Succeeded!
          }
        } catch (e: any) {
          const errMsg = e.message || String(e);
          console.warn(`Model ${modelName} attempt ${attempt} failed:`, errMsg);
          modelErrors[modelName] = errMsg;

          const isTransient = errMsg.includes('503') || 
                            errMsg.toLowerCase().includes('service unavailable') || 
                            errMsg.includes('429') || 
                            errMsg.toLowerCase().includes('too many requests') ||
                            errMsg.toLowerCase().includes('overloaded');

          if (isTransient && attempt < attempts) {
            console.log(`Transient error detected on ${modelName}. Waiting 1.5s before retry...`);
            await sleep(1500);
          } else {
            break; // Break the attempt loop if it's not transient, or we ran out of attempts
          }
        }
      }
      if (succeeded) {
        break; // Stop trying other models
      }
    }

    if (!succeeded) {
      return NextResponse.json({
        error: 'Failed to process spelling correction with all models.',
        keyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : 'none',
        details: modelErrors
      }, { status: 500 });
    }

    let parsedData = { correctedText: text, errorCount: 0 };
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error("Failed to parse JSON response from Gemini:", responseText);
      parsedData = { correctedText: responseText.trim(), errorCount: 0 };
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Spelling Correction API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process spelling correction.', 
      details: error.message || String(error) 
    }, { status: 500 });
  }
}


