import { TodoistApi } from "@doist/todoist-api-typescript";
import {
	checkRedditLabel,
	checkTwitterLabel,
	redditRewrite,
	twitterRewrite,
} from "../src/rules";

const token = process.env.TODOIST_ACCESS_TOKEN;
if (!token) {
	console.error("TODOIST_ACCESS_TOKEN env var required");
	process.exit(1);
}

const dryRun = !process.argv.includes("--apply");
if (dryRun) {
	console.log("DRY RUN — pass --apply to actually update tasks\n");
}

const api = new TodoistApi(token);

let cursor: string | null = null;
let scanned = 0;
let matched = 0;
let updated = 0;

do {
	const response = await api.getTasks({
		...(cursor ? { cursor } : {}),
		limit: 200,
	});

	for (const task of response.results) {
		scanned++;
		const rules = [
			{ check: checkTwitterLabel, rewrite: twitterRewrite },
			{ check: checkRedditLabel, rewrite: redditRewrite },
		];

		let content = task.content;
		const addLabels: string[] = [];

		for (const { check, rewrite } of rules) {
			if (!check({ content, labels: [...task.labels, ...addLabels] }))
				continue;
			const result = rewrite({
				content,
				labels: [...task.labels, ...addLabels],
			});
			content = result.content;
			if (result.addLabels) addLabels.push(...result.addLabels);
		}

		const contentChanged = content !== task.content;
		const hasNewLabels = addLabels.length > 0;

		if (contentChanged || hasNewLabels) {
			matched++;
			console.log(`${dryRun ? "[DRY] " : ""}${task.content}`);
			if (contentChanged) console.log(`    → ${content}`);
			if (hasNewLabels) console.log(`    + ${addLabels.join(", ")}`);

			if (!dryRun) {
				const updates: { content?: string; labels?: string[] } = {};
				if (contentChanged) updates.content = content;
				if (hasNewLabels)
					updates.labels = [...task.labels, ...addLabels];
				await api.updateTask(task.id, updates);
				updated++;
			}
		}
	}

	cursor = response.nextCursor;
} while (cursor);

console.log(
	`\nDone. Scanned ${scanned}, matched ${matched}${dryRun ? "" : `, updated ${updated}`}`,
);
