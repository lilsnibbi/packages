import { describe, expect, test } from "bun:test";
import { formatBytes } from "../src";

describe("formatBytes", () => {
	test("formats plain byte counts", () => {
		expect(formatBytes(0)).toBe("0 B");
		expect(formatBytes(1)).toBe("1 B");
		expect(formatBytes(999)).toBe("999 B");
	});

	test("uses decimal units by default", () => {
		expect(formatBytes(1000)).toBe("1 KB");
		expect(formatBytes(1500)).toBe("1.5 KB");
		expect(formatBytes(1_000_000)).toBe("1 MB");
		expect(formatBytes(2_500_000_000)).toBe("2.5 GB");
	});

	test("uses 1024-based units with binary set", () => {
		expect(formatBytes(1024, { binary: true })).toBe("1 KiB");
		expect(formatBytes(1536, { binary: true })).toBe("1.5 KiB");
		expect(formatBytes(5 * 1024 * 1024, { binary: true })).toBe("5 MiB");
	});

	test("trims trailing zeroes", () => {
		expect(formatBytes(2_000_000)).toBe("2 MB");
		expect(formatBytes(2_000_000, { decimals: 3 })).toBe("2 MB");
	});

	test("honours the decimals option", () => {
		expect(formatBytes(1234)).toBe("1.2 KB");
		expect(formatBytes(1234, { decimals: 2 })).toBe("1.23 KB");
		expect(formatBytes(1234, { decimals: 0 })).toBe("1 KB");
	});

	test("keeps the sign of negative counts", () => {
		expect(formatBytes(-1500)).toBe("-1.5 KB");
		expect(formatBytes(-1)).toBe("-1 B");
	});

	test("caps at the largest unit", () => {
		expect(formatBytes(1e18)).toBe("1000 PB");
	});

	test("falls back to zero for non-finite input", () => {
		expect(formatBytes(Number.NaN)).toBe("0 B");
		expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("0 B");
	});

	test("throws on a bad decimals option", () => {
		expect(() => formatBytes(1000, { decimals: -1 })).toThrow(RangeError);
		expect(() => formatBytes(1000, { decimals: 1.5 })).toThrow(RangeError);
	});
});
