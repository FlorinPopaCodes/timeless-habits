import type { RuleResult, TaskContext } from "./types";

const PINNED_LABEL = "Pinned_\u{1F9F7}";

export function checkTask(ctx: TaskContext): boolean {
	return ctx.labels.includes(PINNED_LABEL);
}

export function taskCounter(ctx: TaskContext): RuleResult {
	const content = ctx.content.replace(
		/\[(\d+)\/?(\d+)?\]/g,
		(_match, num1, num2) => {
			const incremented = Number.parseInt(num1, 10) + 1;
			if (num2) {
				return `[${incremented}/${num2}]`;
			}
			return `[${incremented}]`;
		},
	);
	return { content };
}

export function dateUpdater(ctx: TaskContext): RuleResult {
	const today = new Date().toISOString().slice(0, 10);
	const content = ctx.content.replace(/\[\d{4}-\d{2}-\d{2}\]/g, `[${today}]`);
	return { content };
}
