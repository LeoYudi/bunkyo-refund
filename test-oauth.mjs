import { createClient } from "@supabase/supabase-js";

const supabase = createClient("http://127.0.0.1:54321", "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH");

async function test() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/auth/callback",
      skipBrowserRedirect: true,
    }
  });
  console.log("URL:", data.url);
}

test();
