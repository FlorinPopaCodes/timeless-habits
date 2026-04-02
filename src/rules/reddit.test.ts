import { describe, expect, test } from "bun:test";
import { checkRedditLabel, redditRewrite } from "./reddit";

const ctx = (content: string, labels: string[] = [], description?: string) => ({
	content,
	labels,
	description,
});

describe("redditRewrite", () => {
	test("rewrites reddit.com URLs", () => {
		const result = redditRewrite(ctx("Read https://reddit.com/r/programming"));
		expect(result.content).toBe(
			"Read https://reddit-libre.sunspear.dev/r/programming",
		);
		expect(result.addLabels).toEqual(["Reddit::Content"]);
	});

	test("rewrites old.reddit.com URLs", () => {
		const result = redditRewrite(ctx("See https://old.reddit.com/r/linux"));
		expect(result.content).toBe(
			"See https://reddit-libre.sunspear.dev/r/linux",
		);
	});

	test("rewrites new.reddit.com URLs", () => {
		const result = redditRewrite(ctx("See https://new.reddit.com/r/linux"));
		expect(result.content).toBe(
			"See https://reddit-libre.sunspear.dev/r/linux",
		);
	});

	test("rewrites www.reddit.com URLs", () => {
		const result = redditRewrite(ctx("See https://www.reddit.com/r/linux"));
		expect(result.content).toBe(
			"See https://reddit-libre.sunspear.dev/r/linux",
		);
	});

	test("rewrites multiple Reddit URLs in one task", () => {
		const result = redditRewrite(
			ctx("https://reddit.com/r/a and https://old.reddit.com/r/b"),
		);
		expect(result.content).toBe(
			"https://reddit-libre.sunspear.dev/r/a and https://reddit-libre.sunspear.dev/r/b",
		);
	});

	test("is idempotent", () => {
		const first = redditRewrite(ctx("https://reddit.com/r/test"));
		const second = redditRewrite(ctx(first.content));
		expect(second.content).toBe(first.content);
		expect(second.addLabels).toBeUndefined();
	});

	test("rewrites Reddit URL in description", () => {
		const result = redditRewrite(
			ctx(
				"Check this post",
				[],
				"https://reddit.com/r/programming/comments/abc",
			),
		);
		expect(result.content).toBe("Check this post");
		expect(result.description).toBe(
			"https://reddit-libre.sunspear.dev/r/programming/comments/abc",
		);
		expect(result.addLabels).toEqual(["Reddit::Content"]);
	});

	test("rewrites URLs in both content and description", () => {
		const result = redditRewrite(
			ctx("https://reddit.com/r/a", [], "https://old.reddit.com/r/b"),
		);
		expect(result.content).toBe("https://reddit-libre.sunspear.dev/r/a");
		expect(result.description).toBe("https://reddit-libre.sunspear.dev/r/b");
	});

	test("leaves non-Reddit content unchanged", () => {
		expect(redditRewrite(ctx("Buy groceries")).addLabels).toBeUndefined();
		expect(redditRewrite(ctx("https://x.com/user")).addLabels).toBeUndefined();
	});
});

describe("checkRedditLabel", () => {
	test("returns true when Reddit::Content absent and Reddit URL present", () => {
		expect(checkRedditLabel(ctx("https://reddit.com/r/test", []))).toBe(true);
	});

	test("returns true when Reddit URL is in description only", () => {
		expect(
			checkRedditLabel(ctx("Check this", [], "https://reddit.com/r/test")),
		).toBe(true);
	});

	test("returns false when Reddit::Content label present", () => {
		expect(
			checkRedditLabel(ctx("https://reddit.com/r/test", ["Reddit::Content"])),
		).toBe(false);
	});

	test("returns false when no Reddit URL present", () => {
		expect(checkRedditLabel(ctx("Buy groceries", []))).toBe(false);
	});
});
