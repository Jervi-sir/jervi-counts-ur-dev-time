
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ActivityHistory } from "@/components/dashboard/activity-history";

// Helper to format seconds into H:MM
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// Helper to get formatted date string YYYY-MM-DD
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

// Helper to get date string for N days ago
function getDateDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const today = getTodayString();
  const sevenDaysAgo = getDateDaysAgo(6);

  // Parallel fetching
  const [todayData, weekData] = await Promise.all([
    // 1. Fetch Today's Stats
    supabase
      .from("daily_totals")
      .select("focused_seconds, total_seconds")
      .eq("user_id", user.id)
      .eq("day", today)
      .single(),

    // 2. Fetch Last 7 Days (for summary card)
    supabase
      .from("daily_totals")
      .select("focused_seconds, total_seconds")
      .eq("user_id", user.id)
      .gte("day", sevenDaysAgo)
      .lte("day", today),
  ]);

  const currentFocusedSeconds = todayData.data?.focused_seconds || 0;
  const currentTotalSeconds = todayData.data?.total_seconds || 0;
  const weeklyStatsForCard = weekData.data || [];

  // Calculate totals for the week card
  const weekTotalSeconds = weeklyStatsForCard.reduce((acc, curr) => acc + (curr.total_seconds || 0), 0);
  const weekFocusedSeconds = weeklyStatsForCard.reduce((acc, curr) => acc + curr.focused_seconds, 0);

  return (
    <div className="w-full max-w-4xl mx-auto p-8 space-y-8">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Today&apos;s Time</span>
            <span className="text-4xl font-bold tracking-tight">{formatDuration(currentTotalSeconds)}</span>
            <p className="text-xs text-muted-foreground">
              {currentFocusedSeconds > 0 ? `${formatDuration(currentFocusedSeconds)} focused` : "No activity recorded yet today."}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Last 7 Days</span>
            <span className="text-4xl font-bold tracking-tight">{formatDuration(weekTotalSeconds)}</span>
            <p className="text-xs text-muted-foreground">{formatDuration(weekFocusedSeconds)} focused time.</p>
          </div>
        </div>
      </div>

      {/* Client-Side Activity History */}
      <ActivityHistory />
    </div>
  );
}
