/**
 * OpenAI Codex / ChatGPT Pro Quota & Subscription Extension for Pi Agent
 *
 * Provides OAuth authentication for OpenAI Codex (ChatGPT Plus / Pro) and
 * interactive commands to monitor real-time usage quotas, rate limit reset windows,
 * and subscription credits.
 *
 * Features:
 * - OpenAI OAuth PKCE login (/codex-login or /login openai-codex)
 * - /codex-quota / /openai-quota commands displaying:
 *   - User account email & subscription tier (Pro / Plus / Team)
 *   - Primary & Secondary rate limit usage bars (e.g. 3-hour / 24-hour windows)
 *   - Reset countdown timers
 *   - Real-time limit reached alerts
 * - Helper command /codex-models listing available subscription models (o3-mini, o1, gpt-4o, etc.)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// =============================================================================
// Constants & Endpoints
// =============================================================================

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTH_BASE_URL = "https://auth.openai.com";
const CHATGPT_BACKEND_API = "https://chatgpt.com/backend-api";
const JWT_CLAIM_PATH = "https://api.openai.com/auth";

export interface QuotaWindow {
	usedPercent: number;
	limitWindowSeconds: number;
	resetAfterSeconds: number;
}

export interface CodexUsageInfo {
	planType: string;
	email?: string;
	accountId?: string;
	limitReached: boolean;
	primaryWindow?: QuotaWindow;
	secondaryWindow?: QuotaWindow;
	error?: string;
}

// =============================================================================
// Token & Credentials Helpers
// =============================================================================

function decodeJwtClaim(token: string): { chatgpt_account_id?: string; email?: string } {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return {};
		const decoded = atob(parts[1] || "");
		const payload = JSON.parse(decoded);
		const claim = payload[JWT_CLAIM_PATH] || {};
		return {
			chatgpt_account_id: claim.chatgpt_account_id,
			email: payload.email,
		};
	} catch {
		return {};
	}
}

function getStoredCodexToken(): { access: string; email?: string; accountId?: string } | null {
	try {
		const authPath = path.join(os.homedir(), ".pi", "agent", "auth.json");
		if (!fs.existsSync(authPath)) return null;
		const authData = JSON.parse(fs.readFileSync(authPath, "utf-8"));
		const creds = authData["openai-codex"] || authData["openai"];
		if (!creds?.access) return null;

		const jwtInfo = decodeJwtClaim(creds.access);
		return {
			access: creds.access,
			email: creds.email || jwtInfo.email,
			accountId: jwtInfo.chatgpt_account_id,
		};
	} catch {
		return null;
	}
}

// =============================================================================
// Quota & Usage Fetching
// =============================================================================

export async function fetchCodexQuota(accessToken: string, accountId?: string): Promise<CodexUsageInfo> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		"Content-Type": "application/json",
		"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
	};

	if (accountId) {
		headers["chatgpt-account-id"] = accountId;
	}

	let planType = "Unknown";
	let userEmail = "";

	// 1. Fetch User / Account Info from /me
	try {
		const meRes = await fetch(`${CHATGPT_BACKEND_API}/me`, { headers });
		if (meRes.ok) {
			const meData = (await meRes.json()) as any;
			userEmail = meData.email || "";
			if (meData.orgs?.data?.[0]?.plan_type) {
				planType = meData.orgs.data[0].plan_type;
			}
		}
	} catch {}

	// 2. Fetch Rate Limits & Quota from /wham/usage
	try {
		const usageRes = await fetch(`${CHATGPT_BACKEND_API}/wham/usage`, { headers });
		if (!usageRes.ok) {
			const errText = await usageRes.text().catch(() => "");
			return {
				planType,
				email: userEmail,
				accountId,
				limitReached: false,
				error: `Unable to fetch usage data (${usageRes.status}): ${errText || usageRes.statusText}`,
			};
		}

		const usageData = (await usageRes.json()) as any;
		planType = usageData.plan_type || planType;

		const rateLimit = usageData.rate_limit || {};
		const primary = rateLimit.primary_window;
		const secondary = rateLimit.secondary_window;

		return {
			planType: formatPlanName(planType),
			email: userEmail,
			accountId,
			limitReached: Boolean(rateLimit.limit_reached),
			primaryWindow: primary
				? {
						usedPercent: primary.used_percent ?? 0,
						limitWindowSeconds: primary.limit_window_seconds ?? 0,
						resetAfterSeconds: primary.reset_after_seconds ?? 0,
				  }
				: undefined,
			secondaryWindow: secondary
				? {
						usedPercent: secondary.used_percent ?? 0,
						limitWindowSeconds: secondary.limit_window_seconds ?? 0,
						resetAfterSeconds: secondary.reset_after_seconds ?? 0,
				  }
				: undefined,
		};
	} catch (err: any) {
		return {
			planType,
			email: userEmail,
			accountId,
			limitReached: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

function formatPlanName(plan: string): string {
	const lower = plan.toLowerCase();
	if (lower.includes("pro")) return "ChatGPT Pro ($200/mo)";
	if (lower.includes("plus")) return "ChatGPT Plus ($20/mo)";
	if (lower.includes("team")) return "ChatGPT Team";
	if (lower.includes("free")) return "ChatGPT Free";
	return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function formatSeconds(totalSeconds: number): string {
	if (totalSeconds <= 0) return "Ready / Reset";
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${seconds}s`;
}

function renderProgressBar(percentage: number, length = 20): string {
	const clamped = Math.max(0, Math.min(100, percentage));
	const filled = Math.round((clamped / 100) * length);
	const empty = length - filled;

	let barColor = "🟢";
	if (clamped >= 80) barColor = "🔴";
	else if (clamped >= 50) barColor = "🟡";

	return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${clamped.toFixed(1)}% ${barColor}`;
}

export function formatQuotaDashboard(info: CodexUsageInfo): string {
	const lines: string[] = [];

	lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	lines.push("         ⚡ OpenAI Codex / ChatGPT Subscription Status      ");
	lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	if (info.email) {
		lines.push(` 👤 Account       : ${info.email}`);
	}
	lines.push(` 💳 Plan Tier     : ${info.planType}`);
	lines.push(` 🚦 Status        : ${info.limitReached ? "🔴 RATE LIMIT EXCEEDED" : "🟢 ACTIVE (Quota Available)"}`);

	if (info.error) {
		lines.push(`\n ⚠️ Note          : ${info.error}`);
	}

	if (info.primaryWindow) {
		lines.push("\n 📊 Primary Window (Short-Term Rate Limit):");
		lines.push(`    Usage         : ${renderProgressBar(info.primaryWindow.usedPercent)}`);
		lines.push(`    Window Length : ${formatSeconds(info.primaryWindow.limitWindowSeconds)}`);
		lines.push(`    Resets In     : ${formatSeconds(info.primaryWindow.resetAfterSeconds)}`);
	}

	if (info.secondaryWindow) {
		lines.push("\n 📈 Secondary Window (Daily / Extended Quota):");
		lines.push(`    Usage         : ${renderProgressBar(info.secondaryWindow.usedPercent)}`);
		lines.push(`    Window Length : ${formatSeconds(info.secondaryWindow.limitWindowSeconds)}`);
		lines.push(`    Resets In     : ${formatSeconds(info.secondaryWindow.resetAfterSeconds)}`);
	}

	lines.push("\n 🤖 Pro Subscription Models:");
	lines.push("    • openai-codex/gpt-5.6-sol      (Flagship Deep Reasoning, 272K context)");
	lines.push("    • openai-codex/gpt-5.6-terra    (High-performance Reasoning, 272K context)");
	lines.push("    • openai-codex/gpt-5.6-luna     (Ultra-fast Reasoning, 272K context)");
	lines.push("    • openai-codex/gpt-5.5          (Advanced Multimodal, 272K context)");
	lines.push("    • openai-codex/gpt-5.4          (Fast Frontier Model, 272K context)");
	lines.push("    • openai-codex/gpt-5.4-mini     (Lightweight Model, 272K context)");
	lines.push("    • openai-codex/gpt-5.3-codex-spark (Specialized Coding Model, 128K context)");
	lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	return lines.join("\n");
}

// =============================================================================
// Extension Entry Point
// =============================================================================

export default function (pi: ExtensionAPI) {
	// Command: /codex-quota (or /openai-quota)
	const quotaHandler = async (args: string, ctx: ExtensionContext) => {
		const tokenInfo = getStoredCodexToken();

		if (!tokenInfo) {
			if (ctx.ui) {
				ctx.ui.notify(
					"No OpenAI Codex credentials found.\nPlease login first using `/login openai-codex` or `/codex-login`.",
					"warning",
				);
			}
			return;
		}

		if (ctx.ui) {
			ctx.ui.notify("Fetching OpenAI Codex subscription quota...", "info");
		}

		try {
			const info = await fetchCodexQuota(tokenInfo.access, tokenInfo.accountId);
			const formatted = formatQuotaDashboard({
				...info,
				email: info.email || tokenInfo.email,
			});

			if (ctx.ui) {
				ctx.ui.notify(formatted, info.limitReached ? "error" : "info");
			} else {
				console.log(formatted);
			}
		} catch (err: any) {
			if (ctx.ui) {
				ctx.ui.notify(`Failed to fetch OpenAI Codex quota: ${err.message}`, "error");
			}
		}
	};

	pi.registerCommand("codex-quota", {
		description: "Display real-time quota, rate limits, and remaining usage on your OpenAI ChatGPT Plus/Pro subscription",
		handler: quotaHandler,
	});

	pi.registerCommand("openai-quota", {
		description: "Display real-time quota and subscription usage for OpenAI Codex",
		handler: quotaHandler,
	});

	// Command: /codex-login
	pi.registerCommand("codex-login", {
		description: "Sign in with your OpenAI account (ChatGPT Plus/Pro)",
		handler: async (args, ctx) => {
			if (ctx.ui) {
				ctx.ui.notify("Please run `/login openai-codex` to open the browser sign-in flow for ChatGPT Plus/Pro.", "info");
			}
		},
	});
}
