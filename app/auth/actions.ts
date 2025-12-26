"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { headers, cookies } from "next/headers";

export async function signInWithGithub() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error(error);
    return redirect("/login?message=Could not authenticate user");
  }

  return redirect(data.url);
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  return redirect("/login");
}
