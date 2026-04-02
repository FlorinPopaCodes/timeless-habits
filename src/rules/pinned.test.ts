import { describe, expect, test } from "bun:test";
import { checkTask, dateUpdater, taskCounter } from "./pinned";

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

describe("checkTask", () => {
	test("returns true when Pinned label present", () => {
		expect(checkTask(ctx("Any content", ["Pinned_\u{1F9F7}"]))).toBe(true);
	});

	test("returns false when Pinned label absent", () => {
		expect(checkTask(ctx("Any content", []))).toBe(false);
		expect(checkTask(ctx("Any content", ["Other"]))).toBe(false);
	});
});
