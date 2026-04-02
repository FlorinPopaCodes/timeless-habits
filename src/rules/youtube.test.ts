import { describe, expect, test } from "bun:test";
import { checkVideoLabel, youtubeLabel } from "./youtube";

const ctx = (content: string, labels: string[] = []) => ({
	content,
	labels,
});

describe("youtubeLabel", () => {
	test("adds Video::Content label for youtube.com/watch URLs", () => {
		const result = youtubeLabel(
			ctx("Check https://youtube.com/watch?v=abc123"),
		);
		expect(result.content).toBe("Check https://youtube.com/watch?v=abc123");
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for youtu.be short URLs", () => {
		const result = youtubeLabel(ctx("Watch https://youtu.be/abc123"));
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for youtube.com/shorts URLs", () => {
		const result = youtubeLabel(ctx("See https://youtube.com/shorts/abc123"));
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for www.youtube.com URLs", () => {
		const result = youtubeLabel(
			ctx("Check https://www.youtube.com/watch?v=abc123"),
		);
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for youtube.com/@channel/streams URLs", () => {
		const result = youtubeLabel(
			ctx("Live https://www.youtube.com/@ValDotTown/streams"),
		);
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for youtube.com/@channel URLs", () => {
		const result = youtubeLabel(
			ctx("Channel https://youtube.com/@3Blue1Brown"),
		);
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("adds label for youtube.com/playlist URLs", () => {
		const result = youtubeLabel(
			ctx(
				"Playlist https://youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
			),
		);
		expect(result.addLabels).toEqual(["Video::Content"]);
	});

	test("leaves non-YouTube content unchanged", () => {
		expect(youtubeLabel(ctx("Buy groceries")).addLabels).toBeUndefined();
		expect(
			youtubeLabel(ctx("Check https://vimeo.com/123")).addLabels,
		).toBeUndefined();
	});
});

describe("checkVideoLabel", () => {
	test("returns true when Video::Content absent and YouTube URL present", () => {
		expect(checkVideoLabel(ctx("https://youtube.com/watch?v=abc", []))).toBe(
			true,
		);
	});

	test("returns false when Video::Content label present", () => {
		expect(
			checkVideoLabel(
				ctx("https://youtube.com/watch?v=abc", ["Video::Content"]),
			),
		).toBe(false);
	});

	test("returns false when no YouTube URL present", () => {
		expect(checkVideoLabel(ctx("Buy groceries", []))).toBe(false);
	});
});
