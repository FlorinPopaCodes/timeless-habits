export { checkTask, dateUpdater, taskCounter } from "./pinned";
export { checkRedditLabel, redditRewrite } from "./reddit";
export { checkTwitterLabel, twitterRewrite } from "./twitter";
export type {
	EventConfig,
	RewriteRule,
	RuleResult,
	TaskContext,
} from "./types";
export { applyRules } from "./types";
export { checkVideoLabel, youtubeLabel } from "./youtube";

import { checkTask, dateUpdater, taskCounter } from "./pinned";
import { checkRedditLabel, redditRewrite } from "./reddit";
import { checkTwitterLabel, twitterRewrite } from "./twitter";
import type { EventConfig } from "./types";
import { checkVideoLabel, youtubeLabel } from "./youtube";

export const eventHandlers: Record<string, EventConfig[]> = {
	"item:completed": [
		{
			rules: [taskCounter, dateUpdater],
			action: "duplicate",
			guard: checkTask,
		},
	],
	"item:added": [
		{ rules: [youtubeLabel], action: "update", guard: checkVideoLabel },
		{ rules: [twitterRewrite], action: "update", guard: checkTwitterLabel },
		{ rules: [redditRewrite], action: "update", guard: checkRedditLabel },
	],
	"item:updated": [
		{ rules: [youtubeLabel], action: "update", guard: checkVideoLabel },
		{ rules: [twitterRewrite], action: "update", guard: checkTwitterLabel },
		{ rules: [redditRewrite], action: "update", guard: checkRedditLabel },
	],
};
