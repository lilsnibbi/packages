import { describe, expect, test } from "bun:test";
import { toOrdinal } from "../src";

describe("main", () => {
	describe("basic suffixes", () => {
		test("1st, 2nd, 3rd", () => {
			expect(toOrdinal(1)).toBe("1st");
			expect(toOrdinal(2)).toBe("2nd");
			expect(toOrdinal(3)).toBe("3rd");
		});

		test("4th–9th use 'th'", () => {
			for (let i = 4; i <= 9; i++) {
				expect(toOrdinal(i)).toEndWith("th");
			}
		});

		test("10th", () => {
			expect(toOrdinal(10)).toBe("10th");
		});
	});

	describe("teens (11–13) always use 'th'", () => {
		test("11th, 12th, 13th", () => {
			expect(toOrdinal(11)).toBe("11th");
			expect(toOrdinal(12)).toBe("12th");
			expect(toOrdinal(13)).toBe("13th");
		});

		test("111th, 112th, 113th", () => {
			expect(toOrdinal(111)).toBe("111th");
			expect(toOrdinal(112)).toBe("112th");
			expect(toOrdinal(113)).toBe("113th");
		});

		test("1011th, 1012th, 1013th", () => {
			expect(toOrdinal(1011)).toBe("1011th");
			expect(toOrdinal(1012)).toBe("1012th");
			expect(toOrdinal(1013)).toBe("1013th");
		});
	});

	describe("larger numbers", () => {
		test("21st, 22nd, 23rd", () => {
			expect(toOrdinal(21)).toBe("21st");
			expect(toOrdinal(22)).toBe("22nd");
			expect(toOrdinal(23)).toBe("23rd");
		});

		test("100th, 101st, 1000th", () => {
			expect(toOrdinal(100)).toBe("100th");
			expect(toOrdinal(101)).toBe("101st");
			expect(toOrdinal(1000)).toBe("1000th");
		});
	});

	describe("edge cases", () => {
		test("zero", () => {
			expect(toOrdinal(0)).toBe("0th");
			expect(toOrdinal(-0)).toBe("0th");
		});

		test("negative numbers", () => {
			expect(toOrdinal(-1)).toBe("-1st");
			expect(toOrdinal(-11)).toBe("-11th");
			expect(toOrdinal(-22)).toBe("-22nd");
		});

		test("infinities", () => {
			expect(toOrdinal(Infinity)).toBe("Infinityth");
			expect(toOrdinal(-Infinity)).toBe("-Infinityth");
		});

		test("NaN", () => {
			expect(toOrdinal(NaN)).toBe("NaNth");
		});

		test("decimals use Intl.PluralRules result", () => {
			expect(toOrdinal(1.5)).toBe("1.5th");
			expect(toOrdinal(3.1)).toBe("3.1th");
		});
	});
});
