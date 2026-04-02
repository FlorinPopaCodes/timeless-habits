/**
 * A rewrite rule transforms task content. Rules MUST be idempotent —
 * applying a rule twice must produce the same result as applying it once.
 * This property is relied upon for webhook loop prevention.
 */
export type RewriteRule = (content: string) => string;

export type EventConfig = {
	rules: RewriteRule[];
	action: "duplicate" | "update";
	guard?: (content: string) => boolean;
};

export function applyRules(content: string, rules: RewriteRule[]): string {
	let result = content;
	for (const rule of rules) {
		result = rule(result);
	}
	return result;
}

// --- Guards ---

const SAFETY_PIN = "🧷";

export function checkTask(title: string): boolean {
	return title.includes(SAFETY_PIN);
}

// --- Task counter rule ---

export function taskCounter(str: string): string {
	return str.replace(/\[(\d+)\/?(\d+)?\]/g, (_match, num1, num2) => {
		const incremented = Number.parseInt(num1, 10) + 1;
		if (num2) {
			return `[${incremented}/${num2}]`;
		}
		return `[${incremented}]`;
	});
}

// --- Date updater rule ---

export function dateUpdater(str: string): string {
	const today = new Date().toISOString().slice(0, 10);
	return str.replace(/\[\d{4}-\d{2}-\d{2}\]/g, `[${today}]`);
}

// --- YouTube prefix rule ---

const YOUTUBE_PATTERN =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/;
const VIDEO_PREFIX = "[VIDEO] ";

export function youtubePrefix(content: string): string {
	if (!YOUTUBE_PATTERN.test(content)) return content;
	if (content.startsWith(VIDEO_PREFIX)) return content;
	return VIDEO_PREFIX + content;
}

// --- Per-event-type config ---

export const eventHandlers: Record<string, EventConfig> = {
	"item:completed": {
		rules: [taskCounter, dateUpdater],
		action: "duplicate",
		guard: checkTask,
	},
	"item:added": {
		rules: [youtubePrefix],
		action: "update",
	},
	"item:updated": {
		rules: [youtubePrefix],
		action: "update",
	},
};
