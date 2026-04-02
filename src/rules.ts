export type TaskContext = {
	content: string;
	labels: string[];
};

export type RuleResult = {
	content: string;
	addLabels?: string[];
};

/**
 * A rewrite rule transforms task content and/or adds labels.
 * Rules MUST be idempotent — applying a rule twice must produce the same result.
 * This property is relied upon for webhook loop prevention.
 */
export type RewriteRule = (ctx: TaskContext) => RuleResult;

export type EventConfig = {
	rules: RewriteRule[];
	action: "duplicate" | "update";
	guard?: (ctx: TaskContext) => boolean;
};

export function applyRules(ctx: TaskContext, rules: RewriteRule[]): RuleResult {
	let content = ctx.content;
	const addLabels: string[] = [];

	for (const rule of rules) {
		const result = rule({ content, labels: [...ctx.labels, ...addLabels] });
		content = result.content;
		if (result.addLabels) {
			addLabels.push(...result.addLabels);
		}
	}

	return { content, addLabels: addLabels.length > 0 ? addLabels : undefined };
}

// --- Guards ---

const PINNED_LABEL = "Pinned_\u{1F9F7}";

export function checkTask(ctx: TaskContext): boolean {
	return ctx.labels.includes(PINNED_LABEL);
}

// --- Task counter rule ---

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

// --- Date updater rule ---

export function dateUpdater(ctx: TaskContext): RuleResult {
	const today = new Date().toISOString().slice(0, 10);
	const content = ctx.content.replace(/\[\d{4}-\d{2}-\d{2}\]/g, `[${today}]`);
	return { content };
}

// --- YouTube label rule ---

const YOUTUBE_PATTERN =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/|youtu\.be\/)/;
const VIDEO_LABEL = "Video::Content";

export function checkVideoLabel(ctx: TaskContext): boolean {
	return !ctx.labels.includes(VIDEO_LABEL);
}

export function youtubeLabel(ctx: TaskContext): RuleResult {
	if (!YOUTUBE_PATTERN.test(ctx.content)) return { content: ctx.content };
	return { content: ctx.content, addLabels: [VIDEO_LABEL] };
}

// --- Per-event-type config ---

export const eventHandlers: Record<string, EventConfig> = {
	"item:completed": {
		rules: [taskCounter, dateUpdater],
		action: "duplicate",
		guard: checkTask,
	},
	"item:added": {
		rules: [youtubeLabel],
		action: "update",
		guard: checkVideoLabel,
	},
	"item:updated": {
		rules: [youtubeLabel],
		action: "update",
		guard: checkVideoLabel,
	},
};
