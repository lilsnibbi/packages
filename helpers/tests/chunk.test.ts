import { describe, expect, test } from "bun:test";
import { chunk } from "../src";

describe("chunk", () => {
	test("chunks an array into smaller arrays of specified size (even multiple)", () => {
		expect(chunk([1, 2, 3, 4], 2)).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	test("chunks an array into smaller arrays with a remainder", () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	test("returns an empty array if input array is empty", () => {
		expect(chunk([], 2)).toEqual([]);
		expect(chunk([], 100)).toEqual([]);
	});

	test("returns the whole array as one chunk if size is greater than array length", () => {
		expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
	});

	test("returns the whole array as one chunk if size equals array length", () => {
		expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
	});

	test("handles size of 1 correctly", () => {
		expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
	});

	test("throws when size is 0 or negative (prevents infinite loop)", () => {
		expect(() => chunk([1, 2, 3], 0)).toThrow(RangeError);
		expect(() => chunk([1, 2, 3], -1)).toThrow(
			"size must be a positive integer",
		);
		expect(() => chunk([1, 2, 3], -100)).toThrow(
			"size must be a positive integer",
		);
	});

	test("throws on non-integer sizes rather than mis-slicing", () => {
		// slice(0, 2.5) floors to slice(0, 2) while i advances by 2.5, which
		// silently drops elements — reject it instead.
		expect(() => chunk([1, 2, 3, 4, 5], 2.5)).toThrow(RangeError);
		expect(() => chunk([1, 2, 3], Number.NaN)).toThrow(RangeError);
		expect(() => chunk([1, 2, 3], Number.POSITIVE_INFINITY)).toThrow(
			RangeError,
		);
	});

	test("preserves reference to objects inside chunks", () => {
		const obj = { id: 1 };
		const arr = [obj, { id: 2 }];
		const chunks = chunk(arr, 1);
		expect(chunks[0]?.[0]).toBe(obj);
	});

	test("works with arrays of various types", () => {
		expect(chunk(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
		expect(chunk([true, false, true], 2)).toEqual([[true, false], [true]]);
		expect(chunk([null, undefined, null], 2)).toEqual([
			[null, undefined],
			[null],
		]);
	});
});
