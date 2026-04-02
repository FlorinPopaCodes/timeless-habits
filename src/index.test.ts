import { describe, expect, test } from "bun:test";
import { checkTask } from "./rules";

describe("checkTask", () => {
	test("only care for tasks with safety pin emoji", () => {
		expect(checkTask("🧷 We need to keep this tasked pinned")).toBe(true);
	});

	test("ignore other emojis", () => {
		expect(checkTask("🔧🦾🔩 Build factory of the future")).toBe(false);
	});
});
