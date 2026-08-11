import { createClient } from "@supabase/supabase-js";

// These are the public "anon"/"publishable" keys — safe to be visible in client-side code.
// Never put your service_role/secret key here or anywhere in the frontend.
const SUPABASE_URL = "https://lcekfctnsvvmikbqibki.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6AE9RobJ_sbQ-HSMzdwStA_rl98BtUm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
