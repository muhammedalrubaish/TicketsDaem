import webpush from 'web-push';
import { supabase } from './supabase';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:info@baladi-unit.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} else {
  console.warn('VAPID keys are missing in environment variables. Web Push will not function.');
}

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(payload: NotificationPayload, receiverName?: string) {
  try {
    // 1. Fetch all active subscriptions from Supabase
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('Failed to fetch push subscriptions:', error);
      return { success: false, error };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, count: 0 };
    }

    // Filter subscriptions: Mohammed Al-Rubaish gets everything, others get only if they are the receiver
    const filteredSubscriptions = subscriptions.filter((row: any) => {
      const subUserName = row.user_name ? row.user_name.trim() : '';
      
      if (subUserName.includes('محمد الربيش')) {
        return true;
      }
      
      if (receiverName) {
        const cleanRec = receiverName.trim();
        const firstWordSub = subUserName.split(/\s+/)[0];
        const firstWordRec = cleanRec.split(/\s+/)[0];
        
        if (
          subUserName === cleanRec ||
          cleanRec.includes(subUserName) ||
          subUserName.includes(cleanRec) ||
          (firstWordSub && firstWordRec && firstWordSub === firstWordRec)
        ) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });

    if (filteredSubscriptions.length === 0) {
      return { success: true, count: 0, total: subscriptions.length };
    }

    const payloadString = JSON.stringify(payload);
    
    // 2. Send to all filtered subscriptions in parallel
    const promises = filteredSubscriptions.map(async (row: any) => {
      try {
        await webpush.sendNotification(row.subscription, payloadString);
        return { success: true, id: row.id };
      } catch (err: any) {
        console.error(`Error sending push notification to subscription ${row.id}:`, err);
        // If subscription is expired or invalid (410 Gone or 404), remove it from db
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing expired subscription: ${row.id}`);
          await supabase.from('push_subscriptions').delete().eq('id', row.id);
        }
        return { success: false, id: row.id, error: err };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    return { success: true, count: successCount, total: filteredSubscriptions.length };
  } catch (err) {
    console.error('Push notifications sending failed:', err);
    return { success: false, error: err };
  }
}
