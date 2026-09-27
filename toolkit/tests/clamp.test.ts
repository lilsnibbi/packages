import { describe, expect, test } from "bun:test";
import { clamp } from "../src";

describe("clamp", () => {
	test("returns the value when it sits inside the range", () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(0, 0, 10)).toBe(0);
		expect(clamp(10, 0, 10)).toBe(10);
	});

	test("clamps to the lower bound", () => {
		expect(clamp(-2, 0, 10)).toBe(0);
		expect(clamp(-100, -10, 10)).toBe(-10);
	});

	test("clamps to the upper bound", () => {
		expect(clamp(15, 0, 10)).toBe(10);
		expect(clamp(100, -10, -5)).toBe(-5);
	});

	test("handles a collapsed range", () => {
		expect(clamp(3, 7, 7)).toBe(7);
		expect(clamp(9, 7, 7)).toBe(7);
	});

	test("handles fractional values", () => {
		expect(clamp(0.5, 0, 1)).toBe(0.5);
		expect(clamp(1.5, 0, 1)).toBe(1);
	});

	test("throws when min is greater than max", () => {
		expect(() => clamp(5, 10, 0)).toThrow(RangeError);
		expect(() => clamp(5, 10, 0)).toThrow("min cannot be greater than max");
	});
});
