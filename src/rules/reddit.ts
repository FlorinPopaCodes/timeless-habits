import type { RuleResult, TaskContext } from "./types";

const REDDIT_PATTERN = /https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\//;
const REDDIT_PATTERN_GLOBAL = /https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\//g;
const REDDIT_LABEL = "Reddit::Content";

export function checkRedditLabel(ctx: TaskContext): boolean {
	return !ctx.labels.includes(REDDIT_LABEL) && REDDIT_PATTERN.test(ctx.content);
}

export function redditRewrite(ctx: TaskContext): RuleResult {
	if (!REDDIT_PATTERN.test(ctx.content)) return { content: ctx.content };
	const content = ctx.content.replace(
		REDDIT_PATTERN_GLOBAL,
		"https://reddit-libre.sunspear.dev/",
	);
	return { content, addLabels: [REDDIT_LABEL] };
}
