import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ryqohbjotnyeryepboxq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_5JyAXUXIBuduHFTTNyr1Mw_wwazbthB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
