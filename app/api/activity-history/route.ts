
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = 7;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch paginated history
  const { data: historyData, count } = await supabase
    .from("daily_totals")
    .select("day, focused_seconds, total_seconds", { count: "exact" })
    .eq("user_id", user.id)
    .order("day", { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  return NextResponse.json({
    data: historyData || [],
    meta: {
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
    },
  });
}
