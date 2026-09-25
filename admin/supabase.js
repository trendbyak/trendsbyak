const SUPABASE_URL = "https://ltxrycmreumoqfpcbwnb.supabase.co";
const SUPABASE_KEY = "sb_publishable_wdc4ImKB1f0Q-v4Po9DOwA_xIpPXHkh";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);
