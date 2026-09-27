import { describe, expect, test } from "bun:test";
import { verifyRelease } from "../scripts/verifyRelease";

describe("release metadata", () => {
	const manifest = { version: "1.2.3", license: "MIT" };
	const versions = { logger: "1.2.3", toolkit: "1.2.2" };
	test("accepts matching package metadata and component tag", () => {
		expect(() =>
			verifyRelease("logger", manifest, versions, "logger-v1.2.3"),
		).not.toThrow();
	});
	test("rejects missing or stale package versions", () => {
		for (const name of ["toolkit", "discord-kit"]) {
			expect(() => verifyRelease(name, manifest, versions)).toThrow(
				"versions must match",
			);
		}
	});
	test("rejects another package's tag, old unscoped tags and wrong versions", () => {
		for (const tag of ["toolkit-v1.2.3", "v1.2.3", "logger-v1.2.4"]) {
			expect(() => verifyRelease("logger", manifest, versions, tag)).toThrow(
				"does not match",
			);
		}
	});
	test("rejects invalid or non-stable versions", () => {
		for (const version of [
			undefined,
			"01.2.3",
			"1.2",
			"1.2.3-beta.1",
			"1.2.3+build",
		]) {
			expect(() =>
				verifyRelease("logger", { ...manifest, version }, versions),
			).toThrow("stable SemVer");
		}
	});
	test("requires the MIT license", () => {
		expect(() =>
			verifyRelease("logger", { ...manifest, license: "ISC" }, versions),
		).toThrow("MIT");
	});
});
