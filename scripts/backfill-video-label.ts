import { TodoistApi } from "@doist/todoist-api-typescript";

const YOUTUBE_PATTERN =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/|youtu\.be\/)/;
const VIDEO_LABEL = "Video::Content";

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
		if (
			(YOUTUBE_PATTERN.test(task.content) ||
				YOUTUBE_PATTERN.test(task.description)) &&
			!task.labels.includes(VIDEO_LABEL)
		) {
			matched++;
			console.log(`${dryRun ? "[DRY] " : ""}${task.content}`);

			if (!dryRun) {
				await api.updateTask(task.id, {
					labels: [...task.labels, VIDEO_LABEL],
				});
				updated++;
			}
		}
	}

	cursor = response.nextCursor;
} while (cursor);

console.log(
	`\nDone. Scanned ${scanned}, matched ${matched}${dryRun ? "" : `, updated ${updated}`}`,
);
