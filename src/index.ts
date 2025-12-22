import { Hono } from "hono";

type Bindings = {
	TODOIST_CLIENT_SECRET: string;
	TODOIST_ACCESS_TOKEN: string;
};

interface TodoistTask {
	id: string;
	content: string;
	project_id: string;
	section_id: string;
	parent_id: string | null;
	child_order: number;
	labels: string[];
	priority: number;
}

interface WebhookPayload {
	event_name: string;
	user_id: number;
	event_data: TodoistTask;
}

const app = new Hono<{ Bindings: Bindings }>();

const SAFETY_PIN = "\u{1F9F7}"; // 🧷

// Business Logic (exported for testing)
export function checkTask(title: string): boolean {
	return title.includes(SAFETY_PIN);
}

export function taskCounter(str: string): string {
	return str.replace(/\[(\d+)\/?(\d+)?\]/g, (_match, num1, num2) => {
		const incremented = Number.parseInt(num1, 10) + 1;
		if (num2) {
			return `[${incremented}/${num2}]`;
		}
		return `[${incremented}]`;
	});
}

export function dateUpdater(str: string): string {
	const today = new Date().toISOString().split("T")[0] as string;
	return str.replace(/\[\d{4}-\d{2}-\d{2}\]/g, `[${today}]`);
}

export function updateTitle(title: string): string {
	return dateUpdater(taskCounter(title));
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
	if (a.byteLength !== b.byteLength) return false;
	const viewA = new Uint8Array(a);
	const viewB = new Uint8Array(b);
	let result = 0;
	for (let i = 0; i < viewA.length; i++) {
		result |= (viewA[i] ?? 0) ^ (viewB[i] ?? 0);
	}
	return result === 0;
}

// HMAC Signature Validation
async function checkSignature(
	body: string,
	signature: string | undefined,
	secret: string,
): Promise<boolean> {
	if (!signature) return false;

	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const localDigest = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(body),
	);

	// Decode received signature from base64
	const receivedDigest = Uint8Array.from(atob(signature), (c) =>
		c.charCodeAt(0),
	).buffer;

	return timingSafeEqual(localDigest, receivedDigest);
}

// Todoist API
async function duplicateTask(
	oldTask: TodoistTask,
	token: string,
): Promise<void> {
	const response = await fetch("https://api.todoist.com/rest/v1/tasks", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Request-Id": `thid${oldTask.id}`,
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			content: updateTitle(oldTask.content),
			project_id: oldTask.project_id,
			section_id: oldTask.section_id,
			parent: oldTask.parent_id,
			order: oldTask.child_order,
			label_ids: oldTask.labels,
			priority: oldTask.priority,
		}),
	});

	if (!response.ok) {
		throw new Error(`Todoist API error: ${response.status}`);
	}
}

// Webhook Handler
app.post("/webhooks", async (c) => {
	const rawBody = await c.req.text();
	const signature = c.req.header("X-Todoist-Hmac-Sha256");

	const isValid = await checkSignature(
		rawBody,
		signature,
		c.env.TODOIST_CLIENT_SECRET,
	);
	if (!isValid) {
		return c.body(null, 403);
	}

	let payload: WebhookPayload;
	try {
		payload = JSON.parse(rawBody) as WebhookPayload;
	} catch {
		return c.body(null, 400);
	}

	if (checkTask(payload.event_data.content)) {
		await duplicateTask(payload.event_data, c.env.TODOIST_ACCESS_TOKEN);
	}

	return c.body(null, 204);
});

export default app;
