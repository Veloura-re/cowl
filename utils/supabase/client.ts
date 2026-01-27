import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseAnonKey || !supabaseAnonKey.startsWith('ey')) {
    console.error('CRITICAL CONFIG ERROR: Your NEXT_PUBLIC_SUPABASE_ANON_KEY seems incorrect.');
    console.error('It should be a JWT token starting with "ey...", but it starts with "' + (supabaseAnonKey ? supabaseAnonKey.substring(0, 10) : 'undefined') + '..."');
    console.error('Please check your .env.local file and copy the "anon" public key from Supabase Dashboard.');
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
