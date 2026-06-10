import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hxjojtgvxzgeouthylwa.supabase.co';
const supabaseAnonKey = 'sb_publishable_e7ESpEOIZS1hmOTpckYewg_HLOBaQwe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);