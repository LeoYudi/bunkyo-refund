import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If we don't have service role key, we can use anon key since profiles might be readable or we can just fetch it directly.
// Actually, I can use the Node postgres driver or just fetch via the REST API using anon key if RLS allows.
