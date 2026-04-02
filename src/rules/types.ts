export type TaskContext = {
	content: string;
	description?: string;
	labels: string[];
};

export type RuleResult = {
	content: string;
	description?: string;
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
	let description = ctx.description;
	const addLabels: string[] = [];

	for (const rule of rules) {
		const result = rule({
			content,
			description,
			labels: [...ctx.labels, ...addLabels],
		});
		content = result.content;
		if (result.description !== undefined) description = result.description;
		if (result.addLabels) {
			addLabels.push(...result.addLabels);
		}
	}

	return {
		content,
		description,
		addLabels: addLabels.length > 0 ? addLabels : undefined,
	};
}
