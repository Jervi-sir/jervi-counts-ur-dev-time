
import { db } from "@/db";
import { profiles, dailyTotals } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "@/components/pagination";

// Helper for duration
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
}

const ITEMS_PER_PAGE = 20;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  // Daily
  const dailyHighScores = await db
    .select({
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
      focusedSeconds: dailyTotals.focusedSeconds,
      userId: dailyTotals.userId,
    })
    .from(dailyTotals)
    .innerJoin(profiles, eq(dailyTotals.userId, profiles.id))
    .where(eq(dailyTotals.day, today))
    .orderBy(desc(dailyTotals.focusedSeconds))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // Weekly
  const weeklyHighScores = await db
    .select({
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
      userId: dailyTotals.userId,
      totalSeconds: sql<number>`cast(sum(${dailyTotals.focusedSeconds}) as int)`,
    })
    .from(dailyTotals)
    .innerJoin(profiles, eq(dailyTotals.userId, profiles.id))
    .where(gte(dailyTotals.day, sevenDaysAgoStr))
    .groupBy(dailyTotals.userId, profiles.username, profiles.avatarUrl)
    .orderBy(desc(sql`sum(${dailyTotals.focusedSeconds})`))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // Get total active users count for pagination
  // This is an estimation. We'll count unique users in daily_totals in the last 7 days.
  const countResult = await db
    .select({ count: sql<number>`count(distinct ${dailyTotals.userId})` })
    .from(dailyTotals)
    .where(gte(dailyTotals.day, sevenDaysAgoStr));

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-5xl mx-auto p-8 space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          See who&apos;s coding the most.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Today */}
        <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
          <div className="p-6 border-b bg-muted/50">
            <h2 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              🔥 Today&apos;s Top
            </h2>
          </div>

          {dailyHighScores.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No activity recorded today.
            </div>
          ) : (
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3">Dev</th>
                    <th className="px-4 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailyHighScores.map((score, idx) => (
                    <tr
                      key={score.userId}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                        {offset + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              score.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${score.userId}`
                            }
                            alt={score.username || "User"}
                            className="w-8 h-8 rounded-full bg-muted object-cover border"
                          />
                          <Link
                            href={`/u/${score.username}`}
                            className="font-medium hover:underline truncate max-w-[120px]"
                          >
                            {score.username || "Anonymous"}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {formatDuration(score.focusedSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Last 7 days */}
        <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
          <div className="p-6 border-b bg-muted/50">
            <h2 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              📅 Last 7 Days
            </h2>
          </div>

          {weeklyHighScores.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No activity recorded this week.
            </div>
          ) : (
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3">Dev</th>
                    <th className="px-4 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {weeklyHighScores.map((score, idx) => (
                    <tr
                      key={score.userId}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                        {offset + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              score.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${score.userId}`
                            }
                            alt={score.username || "User"}
                            className="w-8 h-8 rounded-full bg-muted object-cover border"
                          />
                          <Link
                            href={`/u/${score.username}`}
                            className="font-medium hover:underline truncate max-w-[120px]"
                          >
                            {score.username || "Anonymous"}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {formatDuration(score.totalSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} baseUrl="/leaderboard" />
      )}
    </div>
  );
}
