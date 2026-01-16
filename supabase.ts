
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivyotzowcgipmzfhlpgz.supabase.co';
const supabaseAnonKey = 'sb_publishable_OXcA5SNro3p9IzaQHZIUkw_3RiB-EmD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
