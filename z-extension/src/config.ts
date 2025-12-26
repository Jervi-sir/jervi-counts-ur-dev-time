// config.ts
// Configuration for Supabase Edge Function

export const SUPABASE_CONFIG = {
  // Configured for deployed edge function
  url: "https://zdofgzagbuyytgnesfgw.supabase.co",

  // Supabase anon key
  anonKey: "sb_publishable_YElI4wwyRFBzjNY_Wt7H-A_HCZqeJrI",

  // The Edge Function endpoint
  edgeFunctionName: "pushToDb"
};

// Sync interval in milliseconds (14 minutes)
export const SYNC_INTERVAL_MS = 14 * 60 * 1000;

// Storage keys
export const STORAGE_KEYS = {
  DAILY: "ctc.dailyTotals",
  DAILY_TOTAL: "ctc.dailyTotalSeconds", // Total time (regardless of focus)
  ENABLED: "ctc.enabled",
  PROJECT: "ctc.projectTotal",
  PENDING_SYNC: "ctc.pendingSync",
  LANGUAGE_TOTALS: "ctc.languageTotals",
  USER_ID: "ctc.userId",
  USER_EMAIL: "ctc.userEmail",
  LAST_SYNC: "ctc.lastSync"
};
