import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }

  const supabase = createClient(url, key);

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: "admin@bunkyo.org.br",
      password: "Admin123!",
    });

  if (authError) {
    console.error("Auth error:", authError);
    return;
  }

  console.log("Logged in as:", authData.user?.id);

  const { data: requests, error: requestsError } = await supabase
    .from("refund_requests")
    .select("*");

  if (requestsError) {
    console.error("Query error:", requestsError);
  } else {
    console.log("Found requests:", requests.length);
  }
}

main();
