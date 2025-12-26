
"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Helper to format seconds into H:MM
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

interface ActivityItem {
  day: string;
  focused_seconds: number;
  total_seconds: number;
}

export function ActivityHistory() {
  const [data, setData] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/activity-history?page=${page}`);
        const json = await res.json();
        setData(json.data);
        setTotalPages(json.meta.totalPages);
      } catch (error) {
        console.error("Failed to fetch activity history", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page]);

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <div className="p-6 border-b bg-muted/50">
          <h2 className="font-semibold leading-none tracking-tight">Activity History</h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 py-4.5 bg-background">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block h-2 bg-muted animate-pulse w-32 rounded-full" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No activity data found.
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {data.map((stat) => (
                <div key={stat.day} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">
                    {new Date(stat.day).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <div className="flex items-center gap-4">
                    {/* Simple CSS bar visualization */}
                    <div className="hidden sm:block h-2 bg-primary/20 w-32 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min((stat.total_seconds / 28800) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-medium">
                        {formatDuration(stat.total_seconds)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(stat.focused_seconds)} focused
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={page === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
