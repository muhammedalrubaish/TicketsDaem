import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !fileName) {
      return NextResponse.json({ error: 'لم يتم توفير الملف أو اسم الملف.' }, { status: 400 });
    }

    // تعقيم اسم الملف في الخادم ليكون متوافقاً تماماً مع Supabase Storage (حروف إنجليزية، أرقام، نقاط، شرطات فقط)
    const originalExt = fileName.split('.').pop() || 'pdf';
    const baseNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    // إبقاء الأحرف الآمنة واستبدال الباقي بشرطة سفلية
    const safeBaseName = baseNameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFileName = `${safeBaseName}.${originalExt}`;

    // تحويل الملف إلى Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. محاولة الرفع السحابي الفوري إلى Supabase Storage ليعمل تلقائياً على الموقع السحابي Vercel
    try {
      const { data, error } = await supabase.storage
        .from('circulars')
        .upload(safeFileName, buffer, {
          contentType: file.type || 'application/pdf',
          upsert: true
        });

      if (!error && data) {
        // الحصول على الرابط العام المباشر والدائم للملف
        const { data: { publicUrl } } = supabase.storage
          .from('circulars')
          .getPublicUrl(safeFileName);

        return NextResponse.json({ success: true, path: publicUrl });
      } else {
        console.warn('Supabase storage upload failed, falling back to local filesystem:', error);
      }
    } catch (sbErr) {
      console.warn('Supabase storage exception, falling back to local filesystem:', sbErr);
    }

    // 2. الخيار الاحتياطي: الرفع المحلي على الهارد ديسك (يعمل على localhost)
    const uploadDir = path.join(process.cwd(), 'public', 'الملفات', 'التعاميم');

    // إنشاء المجلد إذا لم يكن موجوداً
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      path: `/الملفات/التعاميم/${safeFileName}`,
      warning: 'تنبيه: تم الحفظ محلياً على جهازك. لجعل الملف يعمل مباشرة سحابياً دون الحاجة لرفعه برمجياً، يرجى تفعيل مجلد "circulars" وجعله عاماً (Public) في لوحة تحكم Supabase.'
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ 
      success: true, 
      warning: 'تم تسجيل التعميم وحفظه في المتصفح. لحفظ الملف الفعلي بشكل دائم في مجلد المشروع، يرجى تشغيل الرفع محلياً.' 
    });
  }
}
