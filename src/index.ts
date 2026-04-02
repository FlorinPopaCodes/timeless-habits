import { Hono } from "hono";
import { applyRules, eventHandlers } from "./rules";
import {
	duplicateTask,
	TodoistApi,
	TodoistRequestError,
	updateTask,
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

	const { event_name, event_data } = payload;

	const config = eventHandlers[event_name];
	if (!config) {
		return c.body(null, 204);
	}

	const ctx = { content: event_data.content, labels: event_data.labels };

	if (config.guard && !config.guard(ctx)) {
		return c.body(null, 204);
	}

	const result = applyRules(ctx, config.rules);

	const api = new TodoistApi(c.env.TODOIST_ACCESS_TOKEN);
	try {
		if (config.action === "duplicate") {
			const mergedLabels = result.addLabels
				? [...event_data.labels, ...result.addLabels]
				: event_data.labels;
			await duplicateTask(api, event_data, result.content, mergedLabels);
		} else {
			const contentChanged = result.content !== event_data.content;
			const hasNewLabels =
				result.addLabels !== undefined && result.addLabels.length > 0;

			if (contentChanged || hasNewLabels) {
				const updates: { content?: string; labels?: string[] } = {};
				if (contentChanged) updates.content = result.content;
				if (result.addLabels && result.addLabels.length > 0)
					updates.labels = [...event_data.labels, ...result.addLabels];
				await updateTask(api, event_data.id, updates, ctx);
			}
		}
	} catch (error) {
		if (error instanceof TodoistRequestError) {
			console.error(
				`Todoist API error: ${error.httpStatusCode} - ${error.message}`,
			);
			return c.body(null, 204);
		}
		throw error;
	}

	return c.body(null, 204);
});

export default app;
