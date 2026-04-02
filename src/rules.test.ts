import { describe, expect, test } from "bun:test";
import {
	applyRules,
	dateUpdater,
	taskCounter,
	youtubePrefix,
} from "./rules";

describe("taskCounter", () => {
	test("increments simple counter", () => {
		expect(taskCounter("[0]")).toBe("[1]");
		expect(taskCounter("[99]")).toBe("[100]");
		expect(taskCounter("[543]")).toBe("[544]");
	});

	test("increments bounded counter", () => {
		expect(taskCounter("[0/10]")).toBe("[1/10]");
		expect(taskCounter("[122/222]")).toBe("[123/222]");
		expect(taskCounter("[364/365]")).toBe("[365/365]");
	});

	test("handles multiple counters in title", () => {
		expect(taskCounter("Task [5] with [10/20]")).toBe("Task [6] with [11/20]");
	});
});

describe("dateUpdater", () => {
	test("updates date to today", () => {
		const today = new Date().toISOString().slice(0, 10);
		expect(dateUpdater("[2021-04-19]")).toBe(`[${today}]`);
		expect(dateUpdater("[1999-01-01]")).toBe(`[${today}]`);
	});

	test("handles multiple dates in title", () => {
		const today = new Date().toISOString().slice(0, 10);
		expect(dateUpdater("Start [2021-01-01] End [2021-12-31]")).toBe(
			`Start [${today}] End [${today}]`,
		);
	});
});

describe("youtubePrefix", () => {
	test("prefixes youtube.com/watch URLs", () => {
		expect(youtubePrefix("Check https://youtube.com/watch?v=abc123")).toBe(
			"[VIDEO] Check https://youtube.com/watch?v=abc123",
		);
	});

	test("prefixes youtu.be short URLs", () => {
		expect(youtubePrefix("Watch https://youtu.be/abc123")).toBe(
			"[VIDEO] Watch https://youtu.be/abc123",
		);
	});

	test("prefixes youtube.com/shorts URLs", () => {
		expect(youtubePrefix("See https://youtube.com/shorts/abc123")).toBe(
			"[VIDEO] See https://youtube.com/shorts/abc123",
		);
	});

	test("prefixes www.youtube.com URLs", () => {
		expect(youtubePrefix("Check https://www.youtube.com/watch?v=abc123")).toBe(
			"[VIDEO] Check https://www.youtube.com/watch?v=abc123",
		);
	});

	test("is idempotent — already prefixed content unchanged", () => {
		const prefixed = "[VIDEO] Watch https://youtube.com/watch?v=abc123";
		expect(youtubePrefix(prefixed)).toBe(prefixed);
	});

	test("leaves non-YouTube content unchanged", () => {
		expect(youtubePrefix("Buy groceries")).toBe("Buy groceries");
		expect(youtubePrefix("Check https://vimeo.com/123")).toBe(
			"Check https://vimeo.com/123",
		);
	});
});

describe("applyRules", () => {
	test("returns content unchanged with empty rules", () => {
		expect(applyRules("hello", [])).toBe("hello");
	});

	test("applies rules in order", () => {
		const addA = (s: string) => `${s}A`;
		const addB = (s: string) => `${s}B`;
		expect(applyRules("X", [addA, addB])).toBe("XAB");
	});

	test("loop prevention: reapplying rules to already-rewritten content is a no-op", () => {
		const content = "Watch https://youtube.com/watch?v=abc123";
		const firstPass = applyRules(content, [youtubePrefix]);
		const secondPass = applyRules(firstPass, [youtubePrefix]);
		expect(secondPass).toBe(firstPass);
	});
});
