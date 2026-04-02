import { describe, expect, test } from "bun:test";
import { checkTask } from "./rules";

describe("checkTask", () => {
	test("only care for tasks with Pinned label", () => {
		expect(
			checkTask({ content: "Any task", labels: ["Pinned_\u{1F9F7}"] }),
		).toBe(true);
	});

	test("ignore tasks without Pinned label", () => {
		expect(checkTask({ content: "Any task", labels: ["Other"] })).toBe(false);
	});
});
