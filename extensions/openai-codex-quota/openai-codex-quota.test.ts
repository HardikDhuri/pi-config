import { describe, expect, it, vi } from "vitest";
import registerExtension, { fetchCodexQuota, formatQuotaDashboard } from "./index.ts";

describe("OpenAI Codex Quota Extension", () => {
	it("registers /codex-quota, /openai-quota, and /codex-login commands", () => {
		const registeredCommands: Record<string, any> = {};
		const mockPi: any = {
			registerCommand: vi.fn((name: string, config: any) => {
				registeredCommands[name] = config;
			}),
		};

		registerExtension(mockPi);

		expect(mockPi.registerCommand).toHaveBeenCalledWith("codex-quota", expect.any(Object));
		expect(mockPi.registerCommand).toHaveBeenCalledWith("openai-quota", expect.any(Object));
		expect(mockPi.registerCommand).toHaveBeenCalledWith("codex-login", expect.any(Object));
	});

	it("formats quota dashboard string properly", () => {
		const fakeInfo = {
			planType: "ChatGPT Pro ($200/mo)",
			email: "user@example.com",
			limitReached: false,
			primaryWindow: {
				usedPercent: 24.5,
				limitWindowSeconds: 10800,
				resetAfterSeconds: 7200,
			},
			secondaryWindow: {
				usedPercent: 12.0,
				limitWindowSeconds: 86400,
				resetAfterSeconds: 43200,
			},
		};

		const formatted = formatQuotaDashboard(fakeInfo);
		expect(formatted).toContain("ChatGPT Pro");
		expect(formatted).toContain("user@example.com");
		expect(formatted).toContain("24.5%");
		expect(formatted).toContain("2h 0m");
		expect(formatted).toContain("gpt-5.6-sol");
		expect(formatted).toContain("gpt-5.5");
	});

	it("fetches and parses quota information from ChatGPT backend API", async () => {
		const fakeMe = {
			email: "testuser@gmail.com",
			orgs: { data: [{ plan_type: "pro" }] },
		};

		const fakeUsage = {
			plan_type: "pro",
			rate_limit: {
				limit_reached: false,
				primary_window: {
					used_percent: 30,
					limit_window_seconds: 10800,
					reset_after_seconds: 5400,
				},
			},
		};

		vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(new Response(JSON.stringify(fakeMe), { status: 200 }))
			.mockResolvedValueOnce(new Response(JSON.stringify(fakeUsage), { status: 200 }));

		const quota = await fetchCodexQuota("fake-token", "fake-account-id");
		expect(quota.email).toBe("testuser@gmail.com");
		expect(quota.planType).toContain("Pro");
		expect(quota.limitReached).toBe(false);
		expect(quota.primaryWindow?.usedPercent).toBe(30);
		expect(quota.primaryWindow?.resetAfterSeconds).toBe(5400);
	});
});
