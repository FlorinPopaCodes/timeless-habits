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

	// Request ID format: "th-{taskId}-{completed_at}"
	// - Prevents duplicate creation from webhook retries (same completed_at)
	// - Allows recreation when task is completed again (different completed_at)
	const requestId = `th-${task.id}-${task.completed_at}`;

	return api.addTask(addTaskArgs, requestId);
}
