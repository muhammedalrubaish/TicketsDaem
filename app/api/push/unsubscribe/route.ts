import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Subscription endpoint is required' }, { status: 400 });
    }

    // Delete subscription based on the endpoint
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .filter('subscription->>endpoint', 'eq', subscription.endpoint);

    if (error) {
      console.error('Supabase subscription delete error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unsubscribe Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to remove subscription.' 
    }, { status: 500 });
  }
}
