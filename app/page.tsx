
import Link from "next/link";
import { Download, Terminal, BarChart3, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col max-w-4xl p-8 mx-auto min-h-[Calc(100vh-theme(spacing.14))]">
      <>
        {/* Hero Section */}
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <div className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium">
              Now in Public Beta
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent py-4 text-balance">
              Track your coding flow. <br /> Automatically.
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 text-balance">
              Jervi Counts Ur Dev Time integrates directly with VS Code to log your programming activity.
              Visualize your habits, identify peak productivity hours, and compete on the global leaderboard.
            </p>
            <div className="space-x-4">
              <Link
                href="#"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2"
              >
                <Download className="h-4 w-4" />
                Install Extension
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                View Leaderboard
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container space-y-6 bg-slate-50 py-12 dark:bg-transparent md:py-24 lg:py-32 rounded-3xl my-8 border bg-card text-card-foreground shadow-sm">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              How it works
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Start tracking your developer journey in fewer than 3 clicks.
            </p>
          </div>

          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 pt-8">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Download className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-bold">1. Install</h3>
                  <p className="text-sm text-muted-foreground">
                    Get the `Jervi Counts` extension from the VS Code Marketplace.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Terminal className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-bold">2. Connect</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in with your GitHub account to sync your stats to the cloud.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <BarChart3 className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-bold">3. Compete</h3>
                  <p className="text-sm text-muted-foreground">
                    Check the dashboard to see your stats and climb the leaderboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto text-center md:max-w-[58rem] pt-8">
            <Link href="/login" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              Start tracking now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </>
    </div>
  );
}
