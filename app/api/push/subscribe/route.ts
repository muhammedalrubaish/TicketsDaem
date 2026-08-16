import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { subscription, userName } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription data is required' }, { status: 400 });
    }

    // Insert or ignore if duplicate (unique constraint on subscription)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({ 
        subscription, 
        user_name: userName || 'غير معروف' 
      }, { onConflict: 'subscription' })
      .select();

    if (error) {
      console.error('Supabase subscription save error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Subscribe Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to save subscription.' 
    }, { status: 500 });
  }
}
