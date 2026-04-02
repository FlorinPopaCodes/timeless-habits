import { describe, expect, test } from "bun:test";
import {
	applyRules,
	checkTask,
	checkVideoLabel,
	dateUpdater,
	taskCounter,
	youtubeLabel,
} from "./rules";

const ctx = (content: string, labels: string[] = []) => ({
	content,
	labels,
});

describe("taskCounter", () => {
	test("increments simple counter", () => {
		expect(taskCounter(ctx("[0]")).content).toBe("[1]");
		expect(taskCounter(ctx("[99]")).content).toBe("[100]");
		expect(taskCounter(ctx("[543]")).content).toBe("[544]");
	});

	test("increments bounded counter", () => {
		expect(taskCounter(ctx("[0/10]")).content).toBe("[1/10]");
		expect(taskCounter(ctx("[122/222]")).content).toBe("[123/222]");
		expect(taskCounter(ctx("[364/365]")).content).toBe("[365/365]");
	});

	test("handles multiple counters in title", () => {
		expect(taskCounter(ctx("Task [5] with [10/20]")).content).toBe(
			"Task [6] with [11/20]",
		);
	});
});

describe("dateUpdater", () => {
	test("updates date to today", () => {
		const today = new Date().toISOString().slice(0, 10);
		expect(dateUpdater(ctx("[2021-04-19]")).content).toBe(`[${today}]`);
		expect(dateUpdater(ctx("[1999-01-01]")).content).toBe(`[${today}]`);
	});

	test("handles multiple dates in title", () => {
		const today = new Date().toISOString().slice(0, 10);
		expect(
			dateUpdater(ctx("Start [2021-01-01] End [2021-12-31]")).content,
		).toBe(`Start [${today}] End [${today}]`);
	});
});

describe("youtubeLabel", () => {
	test("adds Video::Content label for youtube.com/watch URLs", () => {
		const result = youtubeLabel(
			ctx("Check https://youtube.com/watch?v=abc123"),
		);
		expect(result.content).toBe("Check https://youtube.com/watch?v=abc123");
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for youtu.be short URLs", () => {
		const result = youtubeLabel(ctx("Watch https://youtu.be/abc123"));
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for youtube.com/shorts URLs", () => {
		const result = youtubeLabel(ctx("See https://youtube.com/shorts/abc123"));
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for www.youtube.com URLs", () => {
		const result = youtubeLabel(
			ctx("Check https://www.youtube.com/watch?v=abc123"),
		);
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("leaves non-YouTube content unchanged", () => {
		expect(youtubeLabel(ctx("Buy groceries")).addLabels).toBeUndefined();
		expect(
			youtubeLabel(ctx("Check https://vimeo.com/123")).addLabels,
		).toBeUndefined();
	});
});

describe("checkVideoLabel", () => {
	test("returns true when Video::Content label absent", () => {
		expect(checkVideoLabel(ctx("any", []))).toBe(true);
		expect(checkVideoLabel(ctx("any", ["Other"]))).toBe(true);
	});

	test("returns false when Video::Content label present", () => {
		expect(checkVideoLabel(ctx("any", ["Video::Content"]))).toBe(false);
	});
});

describe("checkTask", () => {
	test("returns true when Pinned label present", () => {
		expect(checkTask(ctx("Any content", ["Pinned_\u{1F9F7}"]))).toBe(true);
	});

	test("returns false when Pinned label absent", () => {
		expect(checkTask(ctx("Any content", []))).toBe(false);
		expect(checkTask(ctx("Any content", ["Other"]))).toBe(false);
	});
});

describe("applyRules", () => {
	test("returns content unchanged with empty rules", () => {
		const result = applyRules(ctx("hello"), []);
		expect(result.content).toBe("hello");
		expect(result.addLabels).toBeUndefined();
	});

	test("applies rules in order", () => {
		const addA = (c: { content: string; labels: string[] }) => ({
			content: `${c.content}A`,
		});
		const addB = (c: { content: string; labels: string[] }) => ({
			content: `${c.content}B`,
		});
		expect(applyRules(ctx("X"), [addA, addB]).content).toBe("XAB");
	});

	test("accumulates labels from multiple rules", () => {
		const labelA = (c: { content: string; labels: string[] }) => ({
			content: c.content,
			addLabels: ["A"],
		});
		const labelB = (c: { content: string; labels: string[] }) => ({
			content: c.content,
			addLabels: ["B"],
		});
		expect(applyRules(ctx("X"), [labelA, labelB]).addLabels).toEqual([
			"A",
			"B",
		]);
	});

	test("loop prevention: guard blocks re-processing when Video::Content label present", () => {
		const taskCtx = ctx("Watch https://youtube.com/watch?v=abc123", [
			"Video::Content",
		]);
		expect(checkVideoLabel(taskCtx)).toBe(false);
	});
});
