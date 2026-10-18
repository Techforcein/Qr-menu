const SUPABASE_URL = 'https://uzrdwnfvdanaohrrwybt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SndQ_tuEBtqvIGMSmdiQ-Q_vg8-zJWP';
const configured = !SUPABASE_URL.includes('YOUR-PROJECT') && !SUPABASE_PUBLISHABLE_KEY.includes('YOUR-SUPABASE');
const db = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
