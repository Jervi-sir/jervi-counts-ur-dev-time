import * as vscode from "vscode";
import { STORAGE_KEYS, SYNC_INTERVAL_MS } from "./config";
import { ExtensionState, DailyTotals, LanguageTotals } from "./types";
import { getAuthenticatedUser, ensureAuthenticated } from "./auth";
import { syncToSupabase, getLastSyncTime, formatLastSync } from "./sync";

function dayKey(d = new Date()) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${dd}`;
}

function formatHMS(totalSeconds: number) {
	const s = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const ss = s % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function activate(context: vscode.ExtensionContext) {
	// Status Bar
	const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	status.command = "ctc.openMenu";
	status.tooltip = "Click to open menu";
	status.show();

	const state: ExtensionState = {
		enabled: context.globalState.get<boolean>(STORAGE_KEYS.ENABLED, true),
		lastTickAt: Date.now(),
		lastDayKey: dayKey(),
		focused: vscode.window.state.focused,
		currentLanguage: vscode.window.activeTextEditor?.document.languageId || null,
		lastSyncAt: getLastSyncTime(context)
	};

	// Initialize authentication on startup
	// We now only store USER_ID (the username) for display/sync
	let username: string | null = context.globalState.get<string>(STORAGE_KEYS.USER_ID) || null;

	// Helper Functions
	function readDailyTotals(): DailyTotals {
		return context.globalState.get<DailyTotals>(STORAGE_KEYS.DAILY, {});
	}

	async function writeDailyTotals(totals: DailyTotals) {
		await context.globalState.update(STORAGE_KEYS.DAILY, totals);
	}

	function readDailyTotalSeconds(): DailyTotals {
		return context.globalState.get<DailyTotals>(STORAGE_KEYS.DAILY_TOTAL, {});
	}

	async function writeDailyTotalSeconds(totals: DailyTotals) {
		await context.globalState.update(STORAGE_KEYS.DAILY_TOTAL, totals);
	}

	function readLanguageTotals(): LanguageTotals {
		return context.globalState.get<LanguageTotals>(STORAGE_KEYS.LANGUAGE_TOTALS, {});
	}

	async function writeLanguageTotals(totals: LanguageTotals) {
		await context.globalState.update(STORAGE_KEYS.LANGUAGE_TOTALS, totals);
	}

	async function addSecondsToToday(seconds: number) {
		if (seconds <= 0) return;

		const today = dayKey();
		const totals = readDailyTotals();
		totals[today] = (totals[today] ?? 0) + seconds;
		await writeDailyTotals(totals);
	}

	async function addTotalSecondsToToday(seconds: number) {
		if (seconds <= 0) return;

		const today = dayKey();
		const totals = readDailyTotalSeconds();
		totals[today] = (totals[today] ?? 0) + seconds;
		await writeDailyTotalSeconds(totals);
	}

	async function addSecondsToLanguage(language: string | null, seconds: number) {
		if (seconds <= 0 || !language) return;

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
		return context.workspaceState.get<number>(STORAGE_KEYS.PROJECT, 0);
	}

	async function addSecondsToProject(seconds: number) {
		if (seconds <= 0) return;
		const current = getProjectSeconds();
		await context.workspaceState.update(STORAGE_KEYS.PROJECT, current + seconds);
	}

	function setStatusText() {
		const tProject = getProjectSeconds();
		const tToday = getTodaySeconds();
		const icon = state.enabled ? "⏱" : "⏸";
		const syncIcon = username ? "☁" : "⚠";

		// Display Project Time in the status bar
		status.text = `${icon} ${formatHMS(tProject)} ${syncIcon}`;

		// Detailed tooltip
		const lastSync = formatLastSync(state.lastSyncAt);
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

		const success = await syncToSupabase(context, username);
		if (success) {
			state.lastSyncAt = Date.now();
			setStatusText();
		}
	}

	// Initialize user authentication
	(async () => {
		const user = await getAuthenticatedUser();
		if (user) {
			username = user.username;
			// Store for persistence
			await context.globalState.update(STORAGE_KEYS.USER_ID, username);

			console.log(`Authenticated as: ${username} (${user.provider})`);

			// Perform initial sync
			await performSync();
		} else {
			console.log('User not authenticated - tracking locally only');
		}
		setStatusText();
	})();

	// Initial paint
	setStatusText();

	// Track active editor language changes
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			state.currentLanguage = editor?.document.languageId || null;
		})
	);

	// Track focus changes
	context.subscriptions.push(
		vscode.window.onDidChangeWindowState((e) => {
			state.focused = e.focused;
			// reset tick baseline to avoid counting idle gap
			state.lastTickAt = Date.now();
			setStatusText();
		})
	);

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
	}, SYNC_INTERVAL_MS);

	context.subscriptions.push({ dispose: () => clearInterval(tickInterval) });
	context.subscriptions.push({ dispose: () => clearInterval(syncInterval) });
	context.subscriptions.push(status);

	// Shared logic for toggling
	async function toggleTracking() {
		state.enabled = !state.enabled;
		await context.globalState.update(STORAGE_KEYS.ENABLED, state.enabled);
		state.lastTickAt = Date.now(); // prevent counting jump
		setStatusText();
		vscode.window.showInformationMessage(`Code Time Counter: ${state.enabled ? "ON" : "OFF"}`);
	}

	// Commands
	context.subscriptions.push(
		vscode.commands.registerCommand("ctc.toggleTracking", async () => {
			await toggleTracking();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ctc.openMenu", async () => {
			const tToday = getTodaySeconds();
			const tProject = getProjectSeconds();
			const isPaused = !state.enabled;

			const statsMsg = `Today: ${formatHMS(tToday)}  |  Project: ${formatHMS(tProject)}`;
			const actionToggle = isPaused ? "▶ Resume Tracking" : "⏸ Pause Tracking";
			const actionSync = "☁ Sync Now";
			const actionDash = "📊 Dashboard";

			// "Popup" style notification
			const selection = await vscode.window.showInformationMessage(
				statsMsg,
				actionToggle,
				actionSync,
				actionDash
			);

			if (selection === actionToggle) {
				await toggleTracking();
			} else if (selection === actionSync) {
				vscode.commands.executeCommand("ctc.syncNow");
			} else if (selection === actionDash) {
				vscode.env.openExternal(vscode.Uri.parse("http://jervi-counts-ur-dev-time.vercel.app/"));
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ctc.resetToday", async () => {
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
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ctc.resetProject", async () => {
			await context.workspaceState.update(STORAGE_KEYS.PROJECT, 0);
			state.lastTickAt = Date.now();
			setStatusText();
			vscode.window.showInformationMessage("Code Time Counter: reset project time to 00:00:00");
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ctc.showToday", async () => {
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
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ctc.showUser", async () => {
			const user = await ensureAuthenticated();
			if (user) {
				const lastSync = formatLastSync(state.lastSyncAt);
				vscode.window.showInformationMessage(
					`Authenticated as:\n${user.username}\n(${user.provider})\n\nLast Sync: ${lastSync}`
				);
			}
		})
	);

	// Add manual sync command
	context.subscriptions.push(
		vscode.commands.registerCommand("ctc.syncNow", async () => {
			const user = await ensureAuthenticated();
			if (user) {
				username = user.username;
				await context.globalState.update(STORAGE_KEYS.USER_ID, username);

				vscode.window.showInformationMessage("Syncing to Supabase...");
				await performSync();
			}
		})
	);
}

export function deactivate() { }
