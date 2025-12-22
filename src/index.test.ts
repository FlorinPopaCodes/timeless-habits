import { describe, expect, test } from "bun:test";
import { checkTask, dateUpdater, taskCounter, updateTitle } from "./index.ts";

describe("Timeless Habits", () => {
	test("only care for tasks with safety pin emoji", () => {
		expect(checkTask("🧷 We need to keep this tasked pinned")).toBe(true);
	});

	test("ignore other emojis", () => {
		expect(checkTask("🔧🦾🔩 Build factory of the future")).toBe(false);
	});

	test("add last completion date", () => {
		const today = new Date().toISOString().split("T")[0]!;
		const result = updateTitle(
			"🧷 We need to keep this tasked pinned [2021-04-19]",
		);
		expect(result).toContain(today);
	});

	test("increment simple counter", () => {
		const result = updateTitle("🧷 We need to keep this tasked pinned [543]");
		expect(result).toContain("544");
	});

	test("increment bound counter", () => {
		const result = updateTitle(
			"🧷 We need to keep this tasked pinned [122/222]",
		);
		expect(result).toContain("123/222");
	});
});

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
		const today = new Date().toISOString().split("T")[0]!;
		expect(dateUpdater("[2021-04-19]")).toBe(`[${today}]`);
		expect(dateUpdater("[1999-01-01]")).toBe(`[${today}]`);
	});

	test("handles multiple dates in title", () => {
		const today = new Date().toISOString().split("T")[0]!;
		expect(dateUpdater("Start [2021-01-01] End [2021-12-31]")).toBe(
			`Start [${today}] End [${today}]`,
		);
	});
});
