/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports) => {


// config.ts
// Configuration for Supabase Edge Function
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.STORAGE_KEYS = exports.SYNC_INTERVAL_MS = exports.SUPABASE_CONFIG = void 0;
exports.SUPABASE_CONFIG = {
    // Configured for deployed edge function
    url: "https://zdofgzagbuyytgnesfgw.supabase.co",
    // Supabase anon key
    anonKey: "sb_publishable_YElI4wwyRFBzjNY_Wt7H-A_HCZqeJrI",
    // The Edge Function endpoint
    edgeFunctionName: "pushToDb"
};
// Sync interval in milliseconds (14 minutes)
exports.SYNC_INTERVAL_MS = 14 * 60 * 1000;
// Storage keys
exports.STORAGE_KEYS = {
    DAILY: "ctc.dailyTotals",
    DAILY_TOTAL: "ctc.dailyTotalSeconds", // Total time (regardless of focus)
    ENABLED: "ctc.enabled",
    PROJECT: "ctc.projectTotal",
    PENDING_SYNC: "ctc.pendingSync",
    LANGUAGE_TOTALS: "ctc.languageTotals",
    // Track what we have successfully synced to allow delta updates
    SYNCED_DAILY: "ctc.syncedDailyTotals",
    SYNCED_DAILY_TOTAL: "ctc.syncedDailyTotalSeconds",
    SYNCED_LANGUAGE: "ctc.syncedLanguageTotals",
    USER_ID: "ctc.userId",
    USER_EMAIL: "ctc.userEmail",
    LAST_SYNC: "ctc.lastSync"
};


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// auth.ts
// Authentication utilities for getting VSCode user identity
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAuthenticatedUser = getAuthenticatedUser;
exports.ensureAuthenticated = ensureAuthenticated;
const vscode = __webpack_require__(1);
/**
 * Get the authenticated user from VSCode
 * Tries GitHub, Microsoft, then Google in that order
 * Forces GitHub login if none found
 */
async function getAuthenticatedUser() {
    try {
        // Helper to extract username from label (which might be email)
        const extractUsername = (label) => {
            if (label.includes('@')) {
                return label.split('@')[0];
            }
            return label;
        };
        // 1. Try GitHub first (most common for developers)
        try {
            const ghSession = await vscode.authentication.getSession('github', ['read:user'], { createIfNone: false });
            if (ghSession) {
                return {
                    id: ghSession.account.id,
                    username: ghSession.account.label, // GitHub label is usually username
                    email: ghSession.account.label, // Might not be email, but used for display
                    provider: 'github'
                };
            }
        }
        catch (e) {
            console.log('GitHub auth not available');
        }
        // 2. Try Microsoft (built-in to VSCode)
        try {
            const msSession = await vscode.authentication.getSession('microsoft', ['User.Read'], { createIfNone: false });
            if (msSession) {
                return {
                    id: msSession.account.id,
                    username: extractUsername(msSession.account.label),
                    email: msSession.account.label,
                    provider: 'microsoft'
                };
            }
        }
        catch (e) {
            console.log('Microsoft auth not available');
        }
        // 3. Try Google
        try {
            const googleSession = await vscode.authentication.getSession('google', ['profile', 'email'], { createIfNone: false });
            if (googleSession) {
                return {
                    id: googleSession.account.id,
                    username: extractUsername(googleSession.account.label),
                    email: googleSession.account.label,
                    provider: 'google'
                };
            }
        }
        catch (e) {
            console.log('Google auth not available');
        }
        // 4. Force GitHub login if nothing found
        const session = await vscode.authentication.getSession('github', ['read:user'], { createIfNone: true });
        if (session) {
            return {
                id: session.account.id,
                username: session.account.label,
                email: session.account.label,
                provider: 'github'
            };
        }
        return null;
    }
    catch (e) {
        console.error('Error getting authenticated user:', e);
        vscode.window.showErrorMessage(`Failed to authenticate: ${e instanceof Error ? e.message : String(e)}`);
        return null;
    }
}
/**
 * Ensure user is authenticated, show error if not
 */
async function ensureAuthenticated() {
    const user = await getAuthenticatedUser();
    if (!user) {
        vscode.window.showErrorMessage('Please sign in to track your coding time. Use Command Palette: "Sign in to sync settings"');
    }
    return user;
}


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// sync.ts
// Handles syncing data to Supabase Edge Function
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildDeltaPayload = buildDeltaPayload;
exports.syncToSupabase = syncToSupabase;
exports.getLastSyncTime = getLastSyncTime;
exports.formatLastSync = formatLastSync;
const config_1 = __webpack_require__(2);
/**
 * Build the sync payload calculating Deltas (New - Synced)
 */
function buildDeltaPayload(username, current, synced) {
    const data = [];
    // Clone current state to capture as snapshot for after-sync update
    // We use the values captured HERE to update the 'synced' state later
    const snapshotUsed = {
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
        const deltaLangs = {};
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
async function syncToSupabase(context, username) {
    try {
        // 1. Get Current Accumulated Totals (The "Truth")
        const current = {
            dailyTotals: context.globalState.get(config_1.STORAGE_KEYS.DAILY, {}),
            dailyTotalSeconds: context.globalState.get(config_1.STORAGE_KEYS.DAILY_TOTAL, {}),
            languageTotals: context.globalState.get(config_1.STORAGE_KEYS.LANGUAGE_TOTALS, {})
        };
        // 2. Get Last Successfully Synced Totals (The "Baseline")
        const synced = {
            dailyTotals: context.globalState.get(config_1.STORAGE_KEYS.SYNCED_DAILY, {}),
            dailyTotalSeconds: context.globalState.get(config_1.STORAGE_KEYS.SYNCED_DAILY_TOTAL, {}),
            languageTotals: context.globalState.get(config_1.STORAGE_KEYS.SYNCED_LANGUAGE, {})
        };
        // 3. Build Delta Payload
        const { payload, snapshotUsed } = buildDeltaPayload(username, current, synced);
        // 4. Skip if nothing new
        if (payload.data.length === 0) {
            console.log('No new data to sync');
            return true;
        }
        // 5. Send to Supabase
        const edgeFunctionUrl = `${config_1.SUPABASE_CONFIG.url}/functions/v1/${config_1.SUPABASE_CONFIG.edgeFunctionName}`;
        console.log(`[Sync] Sending Deltas: ${payload.data.length} days`);
        // detailed logging for debug
        // console.log(JSON.stringify(payload, null, 2));
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config_1.SUPABASE_CONFIG.anonKey}`
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
        await context.globalState.update(config_1.STORAGE_KEYS.SYNCED_DAILY, snapshotUsed.dailyTotals);
        await context.globalState.update(config_1.STORAGE_KEYS.SYNCED_DAILY_TOTAL, snapshotUsed.dailyTotalSeconds);
        await context.globalState.update(config_1.STORAGE_KEYS.SYNCED_LANGUAGE, snapshotUsed.languageTotals);
        // Update last sync timestamp
        await context.globalState.update(config_1.STORAGE_KEYS.LAST_SYNC, Date.now());
        return true;
    }
    catch (error) {
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
function getLastSyncTime(context) {
    return context.globalState.get(config_1.STORAGE_KEYS.LAST_SYNC, 0);
}
/**
 * Format last sync time for display
 */
function formatLastSync(timestamp) {
    if (timestamp === 0) {
        return "Never";
    }
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) {
        return "Just now";
    }
    else if (minutes < 60) {
        return `${minutes} min ago`;
    }
    else {
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m ago`;
    }
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __webpack_require__(1);
const config_1 = __webpack_require__(2);
const auth_1 = __webpack_require__(3);
const sync_1 = __webpack_require__(4);
function dayKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function formatHMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
function activate(context) {
    // Status Bar
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    status.command = "ctc.openMenu";
    status.tooltip = "Click to open menu";
    status.show();
    const state = {
        enabled: context.globalState.get(config_1.STORAGE_KEYS.ENABLED, true),
        lastTickAt: Date.now(),
        lastDayKey: dayKey(),
        focused: vscode.window.state.focused,
        currentLanguage: vscode.window.activeTextEditor?.document.languageId || null,
        lastSyncAt: (0, sync_1.getLastSyncTime)(context)
    };
    // Initialize authentication on startup
    // We now only store USER_ID (the username) for display/sync
    let username = context.globalState.get(config_1.STORAGE_KEYS.USER_ID) || null;
    // Helper Functions
    function readDailyTotals() {
        return context.globalState.get(config_1.STORAGE_KEYS.DAILY, {});
    }
    async function writeDailyTotals(totals) {
        await context.globalState.update(config_1.STORAGE_KEYS.DAILY, totals);
    }
    function readDailyTotalSeconds() {
        return context.globalState.get(config_1.STORAGE_KEYS.DAILY_TOTAL, {});
    }
    async function writeDailyTotalSeconds(totals) {
        await context.globalState.update(config_1.STORAGE_KEYS.DAILY_TOTAL, totals);
    }
    function readLanguageTotals() {
        return context.globalState.get(config_1.STORAGE_KEYS.LANGUAGE_TOTALS, {});
    }
    async function writeLanguageTotals(totals) {
        await context.globalState.update(config_1.STORAGE_KEYS.LANGUAGE_TOTALS, totals);
    }
    async function addSecondsToToday(seconds) {
        if (seconds <= 0)
            return;
        const today = dayKey();
        const totals = readDailyTotals();
        totals[today] = (totals[today] ?? 0) + seconds;
        await writeDailyTotals(totals);
    }
    async function addTotalSecondsToToday(seconds) {
        if (seconds <= 0)
            return;
        const today = dayKey();
        const totals = readDailyTotalSeconds();
        totals[today] = (totals[today] ?? 0) + seconds;
        await writeDailyTotalSeconds(totals);
    }
    async function addSecondsToLanguage(language, seconds) {
        if (seconds <= 0 || !language)
            return;
        const today = dayKey();
        const totals = readLanguageTotals();
        if (!totals[today]) {
            totals[today] = {};
        }
        totals[today][language] = (totals[today][language] ?? 0) + seconds;
        await writeLanguageTotals(totals);
    }
    function getTodaySeconds() {
        const totals = readDailyTotals();
        return totals[dayKey()] ?? 0;
    }
    function getProjectSeconds() {
        return context.workspaceState.get(config_1.STORAGE_KEYS.PROJECT, 0);
    }
    async function addSecondsToProject(seconds) {
        if (seconds <= 0)
            return;
        const current = getProjectSeconds();
        await context.workspaceState.update(config_1.STORAGE_KEYS.PROJECT, current + seconds);
    }
    function setStatusText() {
        const tProject = getProjectSeconds();
        const tToday = getTodaySeconds();
        const icon = state.enabled ? "⏱" : "⏸";
        const syncIcon = username ? "☁" : "⚠";
        // Display Project Time in the status bar
        status.text = `${icon} ${formatHMS(tProject)} ${syncIcon}`;
        // Detailed tooltip
        const lastSync = (0, sync_1.formatLastSync)(state.lastSyncAt);
        const authStatus = username ? `Signed in as: ${username}` : "Not signed in";
        const statusText = state.enabled ? "Tracking ON" : "Tracking OFF";
        status.tooltip = `Jervi Tracker\n${statusText}\nToday: ${formatHMS(tToday)}\n${authStatus}\nLast Sync: ${lastSync}\n\nClick for Menu`;
    }
    async function rollDayIfNeeded() {
        const nowKey = dayKey();
        if (nowKey !== state.lastDayKey) {
            // day changed; just update reference
            state.lastDayKey = nowKey;
        }
    }
    async function tick() {
        const now = Date.now();
        const elapsedSec = Math.floor((now - state.lastTickAt) / 1000);
        state.lastTickAt = now;
        await rollDayIfNeeded();
        if (state.enabled && elapsedSec > 0) {
            // Always count total seconds (regardless of focus)
            await addTotalSecondsToToday(elapsedSec);
            // Count focused seconds only when VS Code window is focused
            if (state.focused) {
                await addSecondsToToday(elapsedSec);
                await addSecondsToProject(elapsedSec);
                await addSecondsToLanguage(state.currentLanguage, elapsedSec);
            }
        }
        setStatusText();
    }
    async function performSync() {
        if (!username) {
            console.log('Skipping sync: user not authenticated');
            return;
        }
        const success = await (0, sync_1.syncToSupabase)(context, username);
        if (success) {
            state.lastSyncAt = Date.now();
            setStatusText();
        }
    }
    // Initialize user authentication
    (async () => {
        const user = await (0, auth_1.getAuthenticatedUser)();
        if (user) {
            username = user.username;
            // Store for persistence
            await context.globalState.update(config_1.STORAGE_KEYS.USER_ID, username);
            console.log(`Authenticated as: ${username} (${user.provider})`);
            // Perform initial sync
            await performSync();
        }
        else {
            console.log('User not authenticated - tracking locally only');
        }
        setStatusText();
    })();
    // Initial paint
    setStatusText();
    // Track active editor language changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        state.currentLanguage = editor?.document.languageId || null;
    }));
    // Track focus changes
    context.subscriptions.push(vscode.window.onDidChangeWindowState((e) => {
        state.focused = e.focused;
        // reset tick baseline to avoid counting idle gap
        state.lastTickAt = Date.now();
        setStatusText();
    }));
    // 1-second heartbeat
    const tickInterval = setInterval(() => {
        tick().catch(() => {
            // keep silent; this is a tiny local tracker
        });
    }, 1000);
    // Sync interval
    const syncInterval = setInterval(() => {
        performSync().catch((e) => {
            console.error('Sync interval error:', e);
        });
    }, config_1.SYNC_INTERVAL_MS);
    context.subscriptions.push({ dispose: () => clearInterval(tickInterval) });
    context.subscriptions.push({ dispose: () => clearInterval(syncInterval) });
    context.subscriptions.push(status);
    // Shared logic for toggling
    async function toggleTracking() {
        state.enabled = !state.enabled;
        await context.globalState.update(config_1.STORAGE_KEYS.ENABLED, state.enabled);
        state.lastTickAt = Date.now(); // prevent counting jump
        setStatusText();
        vscode.window.showInformationMessage(`Code Time Counter: ${state.enabled ? "ON" : "OFF"}`);
    }
    // Commands
    context.subscriptions.push(vscode.commands.registerCommand("ctc.toggleTracking", async () => {
        await toggleTracking();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("ctc.openMenu", async () => {
        const tToday = getTodaySeconds();
        const tProject = getProjectSeconds();
        const isPaused = !state.enabled;
        const statsMsg = `Today: ${formatHMS(tToday)}  |  Project: ${formatHMS(tProject)}`;
        const actionToggle = isPaused ? "▶ Resume Tracking" : "⏸ Pause Tracking";
        const actionSync = "☁ Sync Now";
        const actionDash = "📊 Dashboard";
        // "Popup" style notification
        const selection = await vscode.window.showInformationMessage(statsMsg, actionToggle, actionSync, actionDash);
        if (selection === actionToggle) {
            await toggleTracking();
        }
        else if (selection === actionSync) {
            vscode.commands.executeCommand("ctc.syncNow");
        }
        else if (selection === actionDash) {
            vscode.env.openExternal(vscode.Uri.parse("http://jervi-counts-ur-dev-time.vercel.app/"));
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("ctc.resetToday", async () => {
        const totals = readDailyTotals();
        totals[dayKey()] = 0;
        await writeDailyTotals(totals);
        const totalSeconds = readDailyTotalSeconds();
        totalSeconds[dayKey()] = 0;
        await writeDailyTotalSeconds(totalSeconds);
        const langTotals = readLanguageTotals();
        langTotals[dayKey()] = {};
        await writeLanguageTotals(langTotals);
        state.lastTickAt = Date.now();
        setStatusText();
        vscode.window.showInformationMessage("Code Time Counter: reset today to 00:00:00");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("ctc.resetProject", async () => {
        await context.workspaceState.update(config_1.STORAGE_KEYS.PROJECT, 0);
        state.lastTickAt = Date.now();
        setStatusText();
        vscode.window.showInformationMessage("Code Time Counter: reset project time to 00:00:00");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("ctc.showToday", async () => {
        const t = getTodaySeconds();
        const p = getProjectSeconds();
        const langTotals = readLanguageTotals();
        const todayLangs = langTotals[dayKey()] || {};
        let langBreakdown = "";
        if (Object.keys(todayLangs).length > 0) {
            langBreakdown = "\n\nLanguage Breakdown:\n" +
                Object.entries(todayLangs)
                    .sort((a, b) => b[1] - a[1])
                    .map(([lang, secs]) => `  ${lang}: ${formatHMS(secs)}`)
                    .join("\n");
        }
        vscode.window.showInformationMessage(`Project: ${formatHMS(p)} | Today: ${formatHMS(t)}${langBreakdown}`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("ctc.showUser", async () => {
        const user = await (0, auth_1.ensureAuthenticated)();
        if (user) {
            const lastSync = (0, sync_1.formatLastSync)(state.lastSyncAt);
            vscode.window.showInformationMessage(`Authenticated as:\n${user.username}\n(${user.provider})\n\nLast Sync: ${lastSync}`);
        }
    }));
    // Add manual sync command
    context.subscriptions.push(vscode.commands.registerCommand("ctc.syncNow", async () => {
        const user = await (0, auth_1.ensureAuthenticated)();
        if (user) {
            username = user.username;
            await context.globalState.update(config_1.STORAGE_KEYS.USER_ID, username);
            vscode.window.showInformationMessage("Syncing to Supabase...");
            await performSync();
        }
    }));
}
function deactivate() { }

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map