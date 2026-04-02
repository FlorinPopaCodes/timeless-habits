import type { RuleResult, TaskContext } from "./types";

const REDDIT_PATTERN = /https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\//;
const REDDIT_PATTERN_GLOBAL = /https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\//g;
const REDDIT_LABEL = "Reddit::Content";

export function checkRedditLabel(ctx: TaskContext): boolean {
	return (
		!ctx.labels.includes(REDDIT_LABEL) &&
		(REDDIT_PATTERN.test(ctx.content) ||
			REDDIT_PATTERN.test(ctx.description ?? ""))
	);
}

export function redditRewrite(ctx: TaskContext): RuleResult {
	const inContent = REDDIT_PATTERN.test(ctx.content);
	const inDescription = REDDIT_PATTERN.test(ctx.description ?? "");
	if (!inContent && !inDescription) return { content: ctx.content };
	const content = inContent
		? ctx.content.replace(
				REDDIT_PATTERN_GLOBAL,
				"https://reddit-libre.sunspear.dev/",
			)
		: ctx.content;
	const description = inDescription
		? (ctx.description ?? "").replace(
				REDDIT_PATTERN_GLOBAL,
				"https://reddit-libre.sunspear.dev/",
			)
		: ctx.description;
	return { content, description, addLabels: [REDDIT_LABEL] };
}
