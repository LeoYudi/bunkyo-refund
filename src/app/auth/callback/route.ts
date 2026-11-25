import { NextResponse } from "next/server";
import { isAllowedAdminEmail } from "@/lib/auth/allowed-emails";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userEmail = data?.user?.email;
      if (!isAllowedAdminEmail(userEmail)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=unauthorized_email`,
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Callback Error:", error);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
