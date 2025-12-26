
import { db } from "@/db";
import { profiles, dailyTotals, dailyLanguageTotals } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

// Helper for duration
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

type Props = {
  params: { username: string };
};

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  // 1. Fetch Profile
  const user = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  });

  if (!user) {
    return notFound();
  }

  // 2. Fetch Activity (Last 30 days)
  // We can just fetch daily totals
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const activity = await db
    .select()
    .from(dailyTotals)
    .where(
      sql`${dailyTotals.userId} = ${user.id} AND ${dailyTotals.day} >= ${thirtyDaysAgoStr}`
    )
    .orderBy(desc(dailyTotals.day));

  // 3. Stats Overview
  const totalSecondsAllTimeResult = await db
    .select({ total: sql<number>`cast(sum(${dailyTotals.focusedSeconds}) as int)` })
    .from(dailyTotals)
    .where(eq(dailyTotals.userId, user.id));

  const totalSeconds = totalSecondsAllTimeResult[0]?.total || 0;

  // 4. Languages (Last 30 days)
  const languageStats = await db
    .select({
      language: dailyLanguageTotals.language,
      total: sql<number>`cast(sum(${dailyLanguageTotals.focusedSeconds}) as int)`
    })
    .from(dailyLanguageTotals)
    .where(
      sql`${dailyLanguageTotals.userId} = ${user.id} AND ${dailyLanguageTotals.day} >= ${thirtyDaysAgoStr}`
    )
    .groupBy(dailyLanguageTotals.language)
    .orderBy(desc(sql`sum(${dailyLanguageTotals.focusedSeconds})`))
    .limit(5);

  return (
    <div className="container max-w-4xl p-8 mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-8">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-bold">{user.fullName || user.username}</h1>
          <p className="text-muted-foreground font-mono">@{user.username}</p>
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            Dev Timer User
          </div>
        </div>

        <div className="md:ml-auto flex gap-8 md:gap-12 mr-8">
          <div className="text-center">
            <div className="text-2xl font-bold tracking-tight">{formatDuration(totalSeconds)}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">All Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tracking-tight">{activity.length}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Days</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* Main Feed: Recent Activity */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>

          {activity.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No recent activity found.
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map(item => (
                <div key={item.day} className="flex items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary mr-4 font-bold text-xs">
                    {new Date(item.day).getDate()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Coding Session
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.day).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="font-mono font-medium">
                    {formatDuration(item.focusedSeconds)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Languages */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Top Languages (30d)</h3>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-4 space-y-4">
              {languageStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No language data.</p>
              ) : (
                languageStats.map(stat => (
                  <div key={stat.language} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stat.language}</span>
                      <span className="text-muted-foreground">{formatDuration(stat.total)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min((stat.total / (languageStats[0].total * 1.1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
