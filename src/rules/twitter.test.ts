import { describe, expect, test } from "bun:test";
import { checkTwitterLabel, twitterRewrite } from "./twitter";

const ctx = (content: string, labels: string[] = []) => ({
	content,
	labels,
});

describe("twitterRewrite", () => {
	test("rewrites twitter.com URLs", () => {
		const result = twitterRewrite(
			ctx("Read https://twitter.com/elonmusk/status/123"),
		);
		expect(result.content).toBe(
			"Read https://twitter-libre.sunspear.dev/elonmusk/status/123",
		);
		expect(result.addLabels).toEqual(["Twitter::Content"]);
	});

	test("rewrites x.com URLs", () => {
		const result = twitterRewrite(ctx("See https://x.com/user/status/456"));
		expect(result.content).toBe(
			"See https://twitter-libre.sunspear.dev/user/status/456",
		);
		expect(result.addLabels).toEqual(["Twitter::Content"]);
	});

	test("rewrites www.twitter.com URLs", () => {
		const result = twitterRewrite(ctx("Check https://www.twitter.com/user"));
		expect(result.content).toBe(
			"Check https://twitter-libre.sunspear.dev/user",
		);
	});

	test("rewrites mobile.twitter.com URLs", () => {
		const result = twitterRewrite(ctx("Check https://mobile.twitter.com/user"));
		expect(result.content).toBe(
			"Check https://twitter-libre.sunspear.dev/user",
		);
	});

	test("rewrites multiple Twitter URLs in one task", () => {
		const result = twitterRewrite(
			ctx("https://x.com/a and https://twitter.com/b"),
		);
		expect(result.content).toBe(
			"https://twitter-libre.sunspear.dev/a and https://twitter-libre.sunspear.dev/b",
		);
	});

	test("is idempotent", () => {
		const first = twitterRewrite(ctx("https://x.com/user"));
		const second = twitterRewrite(ctx(first.content));
		expect(second.content).toBe(first.content);
		expect(second.addLabels).toBeUndefined();
	});

	test("leaves non-Twitter content unchanged", () => {
		expect(twitterRewrite(ctx("Buy groceries")).addLabels).toBeUndefined();
		expect(
			twitterRewrite(ctx("https://reddit.com/r/test")).addLabels,
		).toBeUndefined();
	});
});

describe("checkTwitterLabel", () => {
	test("returns true when Twitter::Content absent and Twitter URL present", () => {
		expect(checkTwitterLabel(ctx("https://x.com/user", []))).toBe(true);
	});

	test("returns false when Twitter::Content label present", () => {
		expect(
			checkTwitterLabel(ctx("https://x.com/user", ["Twitter::Content"])),
		).toBe(false);
	});

	test("returns false when no Twitter URL present", () => {
		expect(checkTwitterLabel(ctx("Buy groceries", []))).toBe(false);
	});
});
