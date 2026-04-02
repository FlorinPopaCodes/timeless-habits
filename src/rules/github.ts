import type { RuleResult, TaskContext } from "./types";

const GITHUB_PATTERN = /https?:\/\/(?:www\.)?github\.com\//;
const GITHUB_LABEL = "Github::Content";

export function checkGithubLabel(ctx: TaskContext): boolean {
	return (
		!ctx.labels.includes(GITHUB_LABEL) &&
		(GITHUB_PATTERN.test(ctx.content) ||
			GITHUB_PATTERN.test(ctx.description ?? ""))
	);
}

export function githubLabel(ctx: TaskContext): RuleResult {
	const inContent = GITHUB_PATTERN.test(ctx.content);
	const inDescription = GITHUB_PATTERN.test(ctx.description ?? "");
	if (!inContent && !inDescription) return { content: ctx.content };
	return { content: ctx.content, addLabels: [GITHUB_LABEL] };
}
