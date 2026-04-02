import type { RuleResult, TaskContext } from "./types";

const TWITTER_PATTERN =
	/https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\//;
const TWITTER_PATTERN_GLOBAL =
	/https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\//g;
const TWITTER_LABEL = "Twitter::Content";

export function checkTwitterLabel(ctx: TaskContext): boolean {
	return (
		!ctx.labels.includes(TWITTER_LABEL) && TWITTER_PATTERN.test(ctx.content)
	);
}

export function twitterRewrite(ctx: TaskContext): RuleResult {
	if (!TWITTER_PATTERN.test(ctx.content)) return { content: ctx.content };
	const content = ctx.content.replace(
		TWITTER_PATTERN_GLOBAL,
		"https://twitter-libre.sunspear.dev/",
	);
	return { content, addLabels: [TWITTER_LABEL] };
}
