import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug: Log env vars to help troubleshoot (will be replaced at build time)
console.log('Supabase Config Debug:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl.substring(0, 20),
    isPlaceholder: supabaseUrl.includes('placeholder')
});

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

// Avoid error during build time if credentials are missing. 
// We provide a dummy URL that won't throw an error during the 'next build' static generation phase.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

if (!isSupabaseConfigured) {
    console.warn('Supabase Realtime: Not configured. Realtime updates will be unavailable.');
    console.warn('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel and rebuild was triggered.');
}
