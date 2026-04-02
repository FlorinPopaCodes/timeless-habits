import type { RuleResult, TaskContext } from "./types";

const YOUTUBE_PATTERN =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/|youtu\.be\/)/;
const VIDEO_LABEL = "Video::Content";

export function checkVideoLabel(ctx: TaskContext): boolean {
	return !ctx.labels.includes(VIDEO_LABEL) && YOUTUBE_PATTERN.test(ctx.content);
}

export function youtubeLabel(ctx: TaskContext): RuleResult {
	if (!YOUTUBE_PATTERN.test(ctx.content)) return { content: ctx.content };
	return { content: ctx.content, addLabels: [VIDEO_LABEL] };
}
