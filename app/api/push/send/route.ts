import { NextResponse } from 'next/server';
import { sendPushNotification } from '../../../../lib/push';

export async function POST(req: Request) {
  try {
    const { title, body, url, receiver } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const result = await sendPushNotification({ title, body, url }, receiver);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Send Notification API Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to send notification.' 
    }, { status: 500 });
  }
}
