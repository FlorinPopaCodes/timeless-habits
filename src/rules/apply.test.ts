import { describe, expect, test } from "bun:test";
import { applyRules } from "./types";

const ctx = (content: string, labels: string[] = []) => ({
	content,
	labels,
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
});
