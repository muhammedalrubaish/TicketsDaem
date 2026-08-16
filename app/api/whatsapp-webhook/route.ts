import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// دالة إرسال رسالة نصية عبر Meta WhatsApp API
async function sendWhatsAppMessage(to: string, text: string) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    console.error('[WhatsApp Webhook] Missing WhatsApp credentials in environment variables.');
    return false;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp Webhook] Failed to send message:', data);
      return false;
    }
    console.log('[WhatsApp Webhook] Message sent successfully:', data);
    return true;
  } catch (error) {
    console.error('[WhatsApp Webhook] Error sending message:', error);
    return false;
  }
}

// معالجة التحقق من الويب هوك (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[WhatsApp Webhook] Webhook verified successfully!');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      console.error('[WhatsApp Webhook] Verification token mismatch.');
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return new NextResponse('Bad Request', { status: 400 });
}

// معالجة الرسائل الواردة (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // التحقق من أن هذا إشعار رسالة
    const changes = body?.entry?.[0]?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    if (!message) {
      // قد يكون إشعار بحالة الرسالة (sent, delivered, read) وليس رسالة جديدة
      return NextResponse.json({ status: 'ignored_not_a_message' });
    }

    const from = message.from; // رقم جوال المستفيد
    const msgType = message.type;

    if (msgType !== 'text') {
      // الرد على الرسائل غير النصية (مثل الصور أو المستندات) برسالة توضيحية
      await sendWhatsAppMessage(
        from,
        'مرحباً بك في الدعم الفني لوحدة بلدي. نرجو منك كتابة استفسارك أو رقم البلاغ نصياً لنتمكن من خدمتك.'
      );
      return NextResponse.json({ status: 'success' });
    }

    const userText = message.text?.body?.trim() || '';
    console.log(`[WhatsApp Webhook] Received message from ${from}: ${userText}`);

    // 1. فحص ما إذا كانت الرسالة تحتوي على رقم بلاغ (مثال: IM12345678)
    const ticketRegex = /IM\d{5,12}/i;
    const match = userText.match(ticketRegex);

    if (match) {
      const ticketNumber = match[0].toUpperCase();
      console.log(`[WhatsApp Webhook] Detected ticket number: ${ticketNumber}`);

      // الاستعلام من قاعدة بيانات Supabase
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('ticket_number, solution, category_type, reception_date')
        .eq('ticket_number', ticketNumber)
        .maybeSingle();

      if (error) {
        console.error('[WhatsApp Webhook] Supabase Query Error:', error);
        await sendWhatsAppMessage(
          from,
          `عذراً، حدث خطأ أثناء الاستعلام عن البلاغ رقم ${ticketNumber}. يرجى المحاولة مرة أخرى لاحقاً.`
        );
        return NextResponse.json({ status: 'success' });
      }

      if (ticket) {
        // تحديد الرد بناءً على حالة البلاغ
        const status = ticket.solution || 'بلاغ جديد';
        let responseMsg = '';

        if (status === 'تم الحل') {
          responseMsg = `✅ مرحباً بك. بلاغك رقم (${ticket.ticket_number}) قد *تم حله* بنجاح. شكراً لتواصلك معنا.`;
        } else if (status === 'بانتظار المستفيد') {
          responseMsg = `⚠️ مرحباً بك. بلاغك رقم (${ticket.ticket_number}) حالته حالياً هي: *بانتظار المستفيد*. يرجى مراجعة الطلبات المطلوبة منك على بوابة بلدي لاستكمال المعالجة.`;
        } else if (status === 'لدى الوزارة') {
          responseMsg = `⏳ مرحباً بك. بلاغك رقم (${ticket.ticket_number}) تم توجيهه وهو حالياً *لدى الوزارة* للدراسة والمعالجة. نتابع الموضوع بدقة وسيتم إفادتك فور التحديث.`;
        } else {
          responseMsg = `⚙️ مرحباً بك. بلاغك رقم (${ticket.ticket_number}) حالته حالياً هي: *${status}*. وهو قيد المتابعة والمعالجة من قبل الفريق الفني.`;
        }

        await sendWhatsAppMessage(from, responseMsg);
        return NextResponse.json({ status: 'success' });
      } else {
        await sendWhatsAppMessage(
          from,
          `🔍 عذراً، لم نتمكن من العثور على بلاغ بالرقم (${ticketNumber}) في سجلاتنا. يرجى التأكد من كتابة الرقم بشكل صحيح (مثال: IM12345678).`
        );
        return NextResponse.json({ status: 'success' });
      }
    }

    // 2. إذا لم يكن هناك رقم تذكرة، نستخدم الذكاء الاصطناعي Gemini للرد
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      await sendWhatsAppMessage(
        from,
        'مرحباً بك في الدعم الفني لوحدة بلدي. للاستفسار عن بلاغ معين يرجى إرسال رقم البلاغ (يبدأ بـ IM).'
      );
      return NextResponse.json({ status: 'success' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // إعداد التوجيهات الصارمة للبوت (System Prompt) لمنعه من الخروج عن نطاق العمل
    const systemPrompt = `
      أنت المساعد الذكي الرسمي لـ "وحدة بلدي" على الواتساب.
      مهمتك هي الرد على المستفيدين بشكل رسمي، ودود، ومهني للغاية، وضمن إطار العمل فقط.

      قواعد هامة جداً:
      1. أجب فقط على الأسئلة المتعلقة بتقديم البلاغات، أو الاستفسار عن حالات البلاغات، أو خدمات منصة بلدي (الرخص الإنشائية، الرخص التجارية، الشهادات الصحية، إلخ).
      2. **امنع نفسك تماماً** من الإجابة على أي أسئلة خارج نطاق العمل الفني للوحدة (مثل الأسئلة السياسية، الرياضية، الشخصية، الفلسفية، أو طلبات كتابة الأكواد أو القصص). إذا حاول المستخدم تشتيتك، اعتذر منه بلباقة ورسمية وأخبره أنك مخصص لمساعدته في خدمات وحدة بلدي فقط.
      3. إذا سألك المستفيد عن حالة بلاغ معين، ذكره بلطف بضرورة كتابة رقم البلاغ بالتنسيق الصحيح (مثال: IM12345678) ليقوم النظام بفحصه تلقائياً.
      4. أسلوبك يجب أن يكون رسمياً ومختصراً. لا تستخدم لغة عامية مفرطة بل لغة عربية مهنية سهلة الفهم.
      5. لا تقدم وعوداً بحل المشاكل الفورية من عندك، بل وضح له آلية المعالجة وأن الفريق الفني يعمل على ذلك.

      [التعليمات والضوابط الخاصة المستقبلية]:
      - (هنا يمكنك إضافة أي تعليمات عمل إضافية مستقبلاً بكل سهولة)
    `;

    const chatSession = model.startChat({
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.2, // منخفض لضمان استقرار ودقة الإجابات وعدم الابتكار خارج العمل
      },
      history: [],
    });

    const result = await chatSession.sendMessage([
      { text: systemPrompt },
      { text: `المستفيد يرسل: ${userText}` }
    ]);
    
    const replyText = result.response.text().trim();
    await sendWhatsAppMessage(from, replyText);

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
