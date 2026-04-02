import type { RuleResult, TaskContext } from "./types";

const TWITTER_PATTERN =
	/https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\//;
const TWITTER_PATTERN_GLOBAL =
	/https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\//g;
const TWITTER_LABEL = "Twitter::Content";

export function checkTwitterLabel(ctx: TaskContext): boolean {
	return (
		!ctx.labels.includes(TWITTER_LABEL) &&
		(TWITTER_PATTERN.test(ctx.content) ||
			TWITTER_PATTERN.test(ctx.description ?? ""))
	);
}

export function twitterRewrite(ctx: TaskContext): RuleResult {
	const inContent = TWITTER_PATTERN.test(ctx.content);
	const inDescription = TWITTER_PATTERN.test(ctx.description ?? "");
	if (!inContent && !inDescription) return { content: ctx.content };
	const content = inContent
		? ctx.content.replace(
				TWITTER_PATTERN_GLOBAL,
				"https://twitter-libre.sunspear.dev/",
			)
		: ctx.content;
	const description = inDescription
		? (ctx.description ?? "").replace(
				TWITTER_PATTERN_GLOBAL,
				"https://twitter-libre.sunspear.dev/",
			)
		: ctx.description;
	return { content, description, addLabels: [TWITTER_LABEL] };
}
