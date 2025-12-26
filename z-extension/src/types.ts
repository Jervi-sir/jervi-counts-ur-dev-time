// types.ts
// TypeScript types for the extension

export type DailyTotals = Record<string, number>;

export type LanguageTotals = Record<string, Record<string, number>>; // { "YYYY-MM-DD": { "typescript": 120, "python": 60 } }

export interface PendingSyncData {
  day: string;
  focusedSeconds: number;
  totalSeconds: number; // Total time VS Code was open (regardless of focus)
  languageBreakdown: Record<string, number>;
  source: string;
}

export interface SyncPayload {
  username: string;
  data: PendingSyncData[];
}

export interface AuthUser {
  id: string; // Keep ID for local reference if needed
  username: string; // Changed from email to username
  email: string; // Keep email just in case
  provider: 'github' | 'microsoft' | 'google';
}

export interface ExtensionState {
  enabled: boolean;
  lastTickAt: number;
  lastDayKey: string;
  focused: boolean;
  currentLanguage: string | null;
  lastSyncAt: number;
}
