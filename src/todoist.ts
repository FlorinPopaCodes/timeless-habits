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
}

/**
 * Creates a duplicate of a task with updated content.
 * Uses requestId for idempotency to prevent duplicate tasks from webhook retries.
 * Includes timestamp to allow the same task to be recreated on future completions.
 */
export async function duplicateTask(
	api: TodoistApi,
	task: WebhookTask,
	newContent: string,
): Promise<Task> {
	const addTaskArgs: AddTaskArgs = {
		content: newContent,
		projectId: task.project_id,
		labels: task.labels,
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

	// Request ID format: "th-{taskId}-{timestamp}"
	// - Prevents duplicate creation from webhook retries (same timestamp)
	// - Allows recreation when recurring task is completed again (different timestamp)
	const requestId = `th-${task.id}-${Date.now()}`;

	return api.addTask(addTaskArgs, requestId);
}
