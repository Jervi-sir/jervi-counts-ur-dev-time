import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { HeaderClient } from "./header-client";

export default async function Header() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HeaderClient user={user} />;
}
