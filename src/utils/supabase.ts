import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Avoid error during build time if credentials are missing. 
// We provide a dummy URL that won't throw an error during the 'next build' static generation phase.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Realtime features will be disabled.');
}
