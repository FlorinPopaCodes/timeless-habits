import { Hono } from "hono";
import {
	duplicateTask,
	TodoistApi,
	TodoistRequestError,
	type WebhookTask,
} from "./todoist";

type Bindings = {
	TODOIST_CLIENT_SECRET: string;
	TODOIST_ACCESS_TOKEN: string;
};

interface WebhookPayload {
	event_name: string;
	user_id: number;
	event_data: WebhookTask;
}

const app = new Hono<{ Bindings: Bindings }>();

const SAFETY_PIN = "🧷";

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
	const today = new Date().toISOString().split("T")[0]!;
	return str.replace(/\[\d{4}-\d{2}-\d{2}\]/g, `[${today}]`);
}

export function updateTitle(title: string): string {
	return dateUpdater(taskCounter(title));
}

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

	const receivedDigest = Uint8Array.from(atob(signature), (c) =>
		c.charCodeAt(0),
	).buffer;

	return timingSafeEqual(localDigest, receivedDigest);
}

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

	// Only process task completion events for tasks with the safety pin emoji
	if (
		payload.event_name === "item:completed" &&
		checkTask(payload.event_data.content)
	) {
		const api = new TodoistApi(c.env.TODOIST_ACCESS_TOKEN);
		const newContent = updateTitle(payload.event_data.content);

		try {
			await duplicateTask(api, payload.event_data, newContent);
		} catch (error) {
			if (error instanceof TodoistRequestError) {
				console.error(
					`Todoist API error: ${error.httpStatusCode} - ${error.message}`,
				);
				// Return 204 to acknowledge webhook and prevent retries for API errors
				return c.body(null, 204);
			}
			throw error;
		}
	}

	return c.body(null, 204);
});

export default app;
