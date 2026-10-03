const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: "admin@bunkyo.org.br",
      password: "Admin123!",
    });

  if (authError) {
    console.log("Login error:", authError.message);
    return;
  }

  console.log("Logged in as:", authData.user.email);

  const { data, error } = await supabase.from("refund_requests").select("*");
  console.log("Error:", error);
  console.log("Data count:", data ? data.length : 0);
}
main();
