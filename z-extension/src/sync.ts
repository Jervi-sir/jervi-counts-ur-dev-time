// sync.ts
// Handles syncing data to Supabase Edge Function

import * as vscode from "vscode";
import { SUPABASE_CONFIG, STORAGE_KEYS } from "./config";
import { SyncPayload, PendingSyncData, LanguageTotals } from "./types";

interface SyncSnapshot {
  dailyTotals: Record<string, number>;
  dailyTotalSeconds: Record<string, number>;
  languageTotals: LanguageTotals;
}

/**
 * Build the sync payload calculating Deltas (New - Synced)
 */
export function buildDeltaPayload(
  username: string,
  current: SyncSnapshot,
  synced: SyncSnapshot
): { payload: SyncPayload; snapshotUsed: SyncSnapshot } {
  const data: PendingSyncData[] = [];

  // Clone current state to capture as snapshot for after-sync update
  // We use the values captured HERE to update the 'synced' state later
  const snapshotUsed: SyncSnapshot = {
    dailyTotals: { ...current.dailyTotals },
    dailyTotalSeconds: { ...current.dailyTotalSeconds },
    languageTotals: JSON.parse(JSON.stringify(current.languageTotals))
  };

  // Get all unique days
  const allDays = new Set([
    ...Object.keys(current.dailyTotals),
    ...Object.keys(current.dailyTotalSeconds)
  ]);

  for (const day of allDays) {
    const curFocused = current.dailyTotals[day] || 0;
    const curTotal = current.dailyTotalSeconds[day] || 0;

    const syncFocused = synced.dailyTotals[day] || 0;
    const syncTotal = synced.dailyTotalSeconds[day] || 0;

    const deltaFocused = Math.max(0, curFocused - syncFocused);
    const deltaTotal = Math.max(0, curTotal - syncTotal);

    // Calculate Language Deltas
    const curLangs = current.languageTotals[day] || {};
    const syncLangs = synced.languageTotals[day] || {};

    const deltaLangs: Record<string, number> = {};
    let hasLangDeltas = false;

    // Check all languages in current day
    for (const [lang, secs] of Object.entries(curLangs)) {
      const prev = syncLangs[lang] || 0;
      const d = Math.max(0, secs - prev);
      if (d > 0) {
        deltaLangs[lang] = d;
        hasLangDeltas = true;
      }
    }

    // Only add to payload if there is NEW data to add
    if (deltaFocused > 0 || deltaTotal > 0 || hasLangDeltas) {
      data.push({
        day,
        focusedSeconds: deltaFocused,
        totalSeconds: deltaTotal,
        languageBreakdown: deltaLangs,
        source: "vscode"
      });
    }
  }

  return {
    payload: { username, data },
    snapshotUsed
  };
}

/**
 * Send data to Supabase Edge Function
 */
export async function syncToSupabase(
  context: vscode.ExtensionContext,
  username: string
): Promise<boolean> {
  try {
    // 1. Get Current Accumulated Totals (The "Truth")
    const current: SyncSnapshot = {
      dailyTotals: context.globalState.get<Record<string, number>>(STORAGE_KEYS.DAILY, {}),
      dailyTotalSeconds: context.globalState.get<Record<string, number>>(STORAGE_KEYS.DAILY_TOTAL, {}),
      languageTotals: context.globalState.get<LanguageTotals>(STORAGE_KEYS.LANGUAGE_TOTALS, {})
    };

    // 2. Get Last Successfully Synced Totals (The "Baseline")
    const synced: SyncSnapshot = {
      dailyTotals: context.globalState.get<Record<string, number>>(STORAGE_KEYS.SYNCED_DAILY, {}),
      dailyTotalSeconds: context.globalState.get<Record<string, number>>(STORAGE_KEYS.SYNCED_DAILY_TOTAL, {}),
      languageTotals: context.globalState.get<LanguageTotals>(STORAGE_KEYS.SYNCED_LANGUAGE, {})
    };

    // 3. Build Delta Payload
    const { payload, snapshotUsed } = buildDeltaPayload(username, current, synced);

    // 4. Skip if nothing new
    if (payload.data.length === 0) {
      console.log('No new data to sync');
      return true;
    }

    // 5. Send to Supabase
    const edgeFunctionUrl = `${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.edgeFunctionName}`;

    console.log(`[Sync] Sending Deltas: ${payload.data.length} days`);
    // detailed logging for debug
    // console.log(JSON.stringify(payload, null, 2));

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} - ${responseText}`);
    }

    console.log(`[Sync] Success!`);

    // 6. Update "Synced" State to match the snapshot we just sent
    // We update the baseline to be what we just calculated as "Current"
    // So next time, we only send what is added on top of this.
    await context.globalState.update(STORAGE_KEYS.SYNCED_DAILY, snapshotUsed.dailyTotals);
    await context.globalState.update(STORAGE_KEYS.SYNCED_DAILY_TOTAL, snapshotUsed.dailyTotalSeconds);
    await context.globalState.update(STORAGE_KEYS.SYNCED_LANGUAGE, snapshotUsed.languageTotals);

    // Update last sync timestamp
    await context.globalState.update(STORAGE_KEYS.LAST_SYNC, Date.now());

    return true;
  } catch (error) {
    console.error('Sync error:', error);
    // Don't show error message box effectively on every interval if internet is down, 
    // just log it. Only show if manually triggered? 
    // For now we keep it silent or use a status bar warning if we wanted.
    return false;
  }
}

/**
 * Get the last sync timestamp
 */
export function getLastSyncTime(context: vscode.ExtensionContext): number {
  return context.globalState.get<number>(STORAGE_KEYS.LAST_SYNC, 0);
}

/**
 * Format last sync time for display
 */
export function formatLastSync(timestamp: number): string {
  if (timestamp === 0) {
    return "Never";
  }

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes} min ago`;
  } else {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  }
}

