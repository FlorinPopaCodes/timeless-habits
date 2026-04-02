/**
 * A rewrite rule transforms task content. Rules MUST be idempotent —
 * applying a rule twice must produce the same result as applying it once.
 * This property is relied upon for webhook loop prevention.
 */
export type RewriteRule = (content: string) => string;

export function applyRules(content: string, rules: RewriteRule[]): string {
	let result = content;
	for (const rule of rules) {
		result = rule(result);
	}
	return result;
}

const YOUTUBE_PATTERN =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/;
const VIDEO_PREFIX = "[VIDEO] ";

export function youtubePrefix(content: string): string {
	if (!YOUTUBE_PATTERN.test(content)) return content;
	if (content.startsWith(VIDEO_PREFIX)) return content;
	return VIDEO_PREFIX + content;
}

export const rewriteRules: Record<string, RewriteRule[]> = {
	"item:added": [youtubePrefix],
	"item:updated": [youtubePrefix],
};
