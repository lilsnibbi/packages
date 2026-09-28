import { describe, expect, test } from "bun:test";
import { randomItem } from "../src";

describe("randomItem", () => {
	test("returns an element of the array", () => {
		const list = ["a", "b", "c", "d"];
		for (let i = 0; i < 100; i++) {
			expect(list).toContain(randomItem(list));
		}
	});

	test("eventually returns more than one distinct element", () => {
		const list = [1, 2, 3, 4, 5];
		const seen = new Set<number>();
		for (let i = 0; i < 200; i++) {
			seen.add(randomItem(list));
		}
		expect(seen.size).toBeGreaterThan(1);
	});

	test("returns the only element of a single-element array", () => {
		expect(randomItem(["only"])).toBe("only");
	});

	test("does not modify the array", () => {
		const list = [1, 2, 3];
		randomItem(list);
		expect(list).toEqual([1, 2, 3]);
	});

	test("throws on an empty array", () => {
		expect(() => randomItem([])).toThrow(RangeError);
		expect(() => randomItem([])).toThrow("array cannot be empty");
	});
});
