import {
	type AddTaskArgs,
	type Task,
	TodoistApi,
	TodoistRequestError,
} from "@doist/todoist-api-typescript";

export { TodoistApi, TodoistRequestError };
export type { Task };

/**
 * Webhook task data from Todoist (snake_case format from webhook payload).
 * Note: This is intentionally minimal - only fields used by the worker are included.
 */
export interface WebhookTask {
	id: string;
	content: string;
	project_id: string;
	section_id: string | null;
	parent_id: string | null;
	child_order: number;
	labels: string[];
	priority: number;
	completed_at: string;
}

async function hashPayload(input: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(input),
	);
	return Array.from(new Uint8Array(digest).slice(0, 8))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Updates a task's content and/or labels.
 * requestId is derived from the original webhook payload (content + labels)
 * so retries of the same webhook are deduplicated, but new updates get a fresh ID.
 */
export async function updateTask(
	api: TodoistApi,
	taskId: string,
	updates: { content?: string; labels?: string[] },
	originalTask: { content: string; labels: string[] },
): Promise<Task> {
	const fingerprint = `${originalTask.content}\0${originalTask.labels.join(",")}`;
	const hash = await hashPayload(fingerprint);
	const requestId = `th-update-${taskId}-${hash}`;
	return api.updateTask(taskId, updates, requestId);
}

export async function duplicateTask(
	api: TodoistApi,
	task: WebhookTask,
	newContent: string,
	labels?: string[],
): Promise<Task> {
	const addTaskArgs: AddTaskArgs = {
		content: newContent,
		projectId: task.project_id,
		labels: labels ?? task.labels,
		priority: task.priority,
		order: task.child_order,
	};

	// Only set optional fields if they have values
	if (task.section_id) {
		addTaskArgs.sectionId = task.section_id;
	}
	if (task.parent_id) {
		addTaskArgs.parentId = task.parent_id;
	}

	// Request ID format: "th-{taskId}-{completed_at}"
	// - Prevents duplicate creation from webhook retries (same completed_at)
	// - Allows recreation when task is completed again (different completed_at)
	const requestId = `th-${task.id}-${task.completed_at}`;

	return api.addTask(addTaskArgs, requestId);
}
