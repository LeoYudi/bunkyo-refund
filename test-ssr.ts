import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./src/models/database.types";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  // 1. Login normally to get cookies
  const client = createClient(url, key);
  const { data: authData } = await client.auth.signInWithPassword({
    email: "admin@bunkyo.org.br",
    password: "Admin123!"
  });

  const session = authData.session;
  if (!session) {
    console.log("No session");
    return;
  }

  // 2. Mock cookies store
  const cookiesMap = new Map<string, string>();
  // Supabase stores session as a chunked cookie 'sb-[ref]-auth-token'
  // But wait, signInWithPassword on @supabase/supabase-js doesn't set cookies directly unless we mock it or extract it.
  // Actually, we can just use setSession on the SSR client.
  
  const ssrClient = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => {
        return Array.from(cookiesMap.entries()).map(([name, value]) => ({ name, value }));
      },
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => {
          cookiesMap.set(name, value);
        });
      }
    }
  });

  // Set the session into the SSR client so it writes to our mocked cookies
  await ssrClient.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });

  // 3. Query
  const { data: requests, error } = await ssrClient
    .from("refund_requests")
    .select("*");

  if (error) {
    console.error("SSR Query Error:", error);
  } else {
    console.log("SSR Found requests:", requests?.length);
  }
}

main();
