import type { RuleResult, TaskContext } from "./types";

const YOUTUBE_PATTERN =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/|youtu\.be\/)/;
const VIDEO_LABEL = "Video::Content";

export function checkVideoLabel(ctx: TaskContext): boolean {
	return (
		!ctx.labels.includes(VIDEO_LABEL) &&
		(YOUTUBE_PATTERN.test(ctx.content) ||
			YOUTUBE_PATTERN.test(ctx.description ?? ""))
	);
}

export function youtubeLabel(ctx: TaskContext): RuleResult {
	const inContent = YOUTUBE_PATTERN.test(ctx.content);
	const inDescription = YOUTUBE_PATTERN.test(ctx.description ?? "");
	if (!inContent && !inDescription) return { content: ctx.content };
	return { content: ctx.content, addLabels: [VIDEO_LABEL] };
}
