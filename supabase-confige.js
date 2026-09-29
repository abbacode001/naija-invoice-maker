const SUPABASE_URL = "https://lrdqaswmdmneqwyjipab.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_E_I-FwseAX5Lywh86P8GRQ_I0P33PH4";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);