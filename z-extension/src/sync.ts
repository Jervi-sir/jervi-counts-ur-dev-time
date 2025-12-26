// sync.ts
// Handles syncing data to Supabase Edge Function

import * as vscode from "vscode";
import { SUPABASE_CONFIG, STORAGE_KEYS } from "./config";
import { SyncPayload, PendingSyncData, LanguageTotals } from "./types";

/**
 * Build the sync payload from accumulated data
 */
export function buildSyncPayload(
  username: string,
  dailyTotals: Record<string, number>,
  dailyTotalSeconds: Record<string, number>,
  languageTotals: LanguageTotals
): SyncPayload {
  const data: PendingSyncData[] = [];

  // Get all unique days from both focused and total seconds
  const allDays = new Set([
    ...Object.keys(dailyTotals),
    ...Object.keys(dailyTotalSeconds)
  ]);

  // Iterate through each day that has data
  for (const day of allDays) {
    const focusedSeconds = dailyTotals[day] || 0;
    const totalSeconds = dailyTotalSeconds[day] || 0;

    // Only sync if there's any time recorded
    if (focusedSeconds > 0 || totalSeconds > 0) {
      const languageBreakdown = languageTotals[day] || {};

      data.push({
        day,
        focusedSeconds,
        totalSeconds,
        languageBreakdown,
        source: "vscode"
      });
    }
  }

  return {
    username,
    data
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
    // Get accumulated data
    const dailyTotals = context.globalState.get<Record<string, number>>(STORAGE_KEYS.DAILY, {});
    const dailyTotalSeconds = context.globalState.get<Record<string, number>>(STORAGE_KEYS.DAILY_TOTAL, {});
    const languageTotals = context.globalState.get<LanguageTotals>(STORAGE_KEYS.LANGUAGE_TOTALS, {});

    // Build payload
    const payload = buildSyncPayload(username, dailyTotals, dailyTotalSeconds, languageTotals);

    // Skip if no data to sync
    if (payload.data.length === 0) {
      console.log('No data to sync');
      return true;
    }

    // Construct Edge Function URL
    // Construct Edge Function URL
    const edgeFunctionUrl = `${SUPABASE_CONFIG.url}/functions/v1/${SUPABASE_CONFIG.edgeFunctionName}`;

    console.log(`[Sync] Target: ${edgeFunctionUrl}`);
    console.log(`[Sync] Payload size: ${payload.data.length} days for user: ${username}`);
    console.log(JSON.stringify(payload, null, 2)); // Now enabled for debugging 

    // Send to Supabase Edge Function
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
      console.error(`[Sync] Failed: ${response.status} ${response.statusText}`);
      console.error(`[Sync] Response Body: ${responseText}`);
      throw new Error(`Sync failed: ${response.status} - ${responseText}`);
    }

    console.log(`[Sync] Success! Response: ${responseText}`);
    const result = JSON.parse(responseText);
    console.log('Sync successful:', result);

    // Update last sync timestamp
    await context.globalState.update(STORAGE_KEYS.LAST_SYNC, Date.now());

    return true;
  } catch (error) {
    console.error('Sync error:', error);
    vscode.window.showErrorMessage(`Failed to sync: ${error instanceof Error ? error.message : String(error)}`);
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
