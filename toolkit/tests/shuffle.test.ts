import { describe, expect, test } from "bun:test";
import { shuffle } from "../src";

describe("shuffle", () => {
	test("keeps every element, including duplicates", () => {
		const list = [1, 2, 2, 3, 4, 5];
		const result = shuffle(list);
		expect(result).toHaveLength(list.length);
		expect([...result].sort()).toEqual([...list].sort());
	});

	test("does not modify the input array", () => {
		const list = [1, 2, 3, 4, 5];
		shuffle(list);
		expect(list).toEqual([1, 2, 3, 4, 5]);
	});

	test("returns a new array, not the input", () => {
		const list = [1, 2, 3];
		expect(shuffle(list)).not.toBe(list);
	});

	test("eventually produces a different order", () => {
		const list = Array.from({ length: 10 }, (_, i) => i);
		const changed = Array.from({ length: 50 }, () => shuffle(list)).some(
			(result) => result.some((value, index) => value !== list[index]),
		);
		expect(changed).toBe(true);
	});

	test("handles empty and single-element arrays", () => {
		expect(shuffle([])).toEqual([]);
		expect(shuffle([42])).toEqual([42]);
	});
});
