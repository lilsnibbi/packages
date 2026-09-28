import { describe, expect, test } from "bun:test";
import { randomInt } from "../src";

describe("randomInt", () => {
	test("generates an integer within a positive range (inclusive)", () => {
		const min = 1;
		const max = 10;
		const results = new Set<number>();
		for (let i = 0; i < 200; i++) {
			const result = randomInt(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThanOrEqual(max);
			expect(Number.isInteger(result)).toBe(true);
			results.add(result);
		}
		// With 200 iterations on a range of 10, we expect multiple unique results
		expect(results.size).toBeGreaterThan(1);
	});

	test("generates an integer within a negative range (inclusive)", () => {
		const min = -20;
		const max = -10;
		for (let i = 0; i < 50; i++) {
			const result = randomInt(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThanOrEqual(max);
			expect(Number.isInteger(result)).toBe(true);
		}
	});

	test("generates an integer within a range spanning zero", () => {
		const min = -5;
		const max = 5;
		const results = new Set<number>();
		for (let i = 0; i < 100; i++) {
			const result = randomInt(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThanOrEqual(max);
			results.add(result);
		}
		expect(results.has(0)).toBeDefined(); // highly likely to hit 0 eventually
	});

	test("returns exactly min when min and max are equal", () => {
		expect(randomInt(5, 5)).toBe(5);
		expect(randomInt(-10, -10)).toBe(-10);
		expect(randomInt(0, 0)).toBe(0);
	});

	test("throws an error when min is greater than max", () => {
		expect(() => randomInt(10, 5)).toThrow("min cannot be greater than max");
		expect(() => randomInt(0, -1)).toThrow("min cannot be greater than max");
	});

	test("handles large boundaries", () => {
		const min = 1000000;
		const max = 1000005;
		const result = randomInt(min, max);
		expect(result).toBeGreaterThanOrEqual(min);
		expect(result).toBeLessThanOrEqual(max);
	});
});
