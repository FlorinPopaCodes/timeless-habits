import { describe, expect, test } from "bun:test";
import { checkGithubLabel, githubLabel } from "./github";

const ctx = (content: string, labels: string[] = [], description?: string) => ({
	content,
	labels,
	description,
});

describe("githubLabel", () => {
	test("adds label for github.com URLs", () => {
		const result = githubLabel(
			ctx("Check https://github.com/anthropics/claude-code"),
		);
		expect(result.content).toBe(
			"Check https://github.com/anthropics/claude-code",
		);
		expect(result.addLabels).toEqual(["Github::Content"]);
	});

	test("adds label for www.github.com URLs", () => {
		const result = githubLabel(
			ctx("See https://www.github.com/user/repo/issues/1"),
		);
		expect(result.addLabels).toEqual(["Github::Content"]);
	});

	test("adds label when URL is in description only", () => {
		const result = githubLabel(
			ctx("Review this PR", [], "https://github.com/user/repo/pull/42"),
		);
		expect(result.addLabels).toEqual(["Github::Content"]);
	});

	test("adds label when URL in both content and description", () => {
		const result = githubLabel(
			ctx("https://github.com/a/b", [], "https://github.com/c/d"),
		);
		expect(result.addLabels).toEqual(["Github::Content"]);
	});

	test("is idempotent — no label when no URL", () => {
		const result = githubLabel(ctx("Buy groceries"));
		expect(result.addLabels).toBeUndefined();
	});

	test("leaves non-GitHub URLs unchanged", () => {
		expect(
			githubLabel(ctx("https://twitter.com/user")).addLabels,
		).toBeUndefined();
		expect(
			githubLabel(ctx("https://reddit.com/r/test")).addLabels,
		).toBeUndefined();
	});
});

describe("checkGithubLabel", () => {
	test("returns true when Github::Content absent and GitHub URL present", () => {
		expect(checkGithubLabel(ctx("https://github.com/user/repo", []))).toBe(
			true,
		);
	});

	test("returns true when GitHub URL is in description only", () => {
		expect(
			checkGithubLabel(ctx("Check this", [], "https://github.com/user/repo")),
		).toBe(true);
	});

	test("returns false when Github::Content label present", () => {
		expect(
			checkGithubLabel(
				ctx("https://github.com/user/repo", ["Github::Content"]),
			),
		).toBe(false);
	});

	test("returns false when no GitHub URL present", () => {
		expect(checkGithubLabel(ctx("Buy groceries", []))).toBe(false);
	});
});
