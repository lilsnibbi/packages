import {
	afterEach,
	beforeEach,
	describe,
	expect,
	setSystemTime,
	test,
} from "bun:test";
import { formatSeconds } from "../src";

describe("main", () => {
	describe("long format (default)", () => {
		test("single unit", () => {
			expect(formatSeconds(60)).toBe("1 minute");
			expect(formatSeconds(3600)).toBe("1 hour");
			expect(formatSeconds(86400)).toBe("1 day");
		});

		test("pluralizes values > 1", () => {
			expect(formatSeconds(120)).toBe("2 minutes");
			expect(formatSeconds(7200)).toBe("2 hours");
			expect(formatSeconds(172800)).toBe("2 days");
		});

		test("joins multiple parts with commas and trailing 'and' (Oxford comma)", () => {
			expect(formatSeconds(3661)).toBe("1 hour, 1 minute, and 1 second");
			expect(formatSeconds(90061)).toBe(
				"1 day, 1 hour, 1 minute, and 1 second",
			);
		});
	});

	describe("short format", () => {
		test("abbreviates units", () => {
			expect(formatSeconds(3661, { format: "short" })).toBe("1h 1m 1s");
		});

		test("no spaces between value and unit", () => {
			expect(formatSeconds(7200, { format: "short" })).toBe("2h");
		});

		test("zero returns '0s'", () => {
			expect(formatSeconds(0, { format: "short" })).toBe("0s");
		});
	});

	describe("zero / non-finite input", () => {
		test("zero seconds", () => {
			expect(formatSeconds(0)).toBe("0 seconds");
			expect(formatSeconds(0, { format: "short" })).toBe("0s");
		});

		test("negative input now supported", () => {
			expect(formatSeconds(-100)).toBe("-1 minute and 40 seconds");
			expect(formatSeconds(-100, { format: "short" })).toBe("-1m 40s");
		});

		test("NaN returns zero fallback", () => {
			expect(formatSeconds(NaN)).toBe("0 seconds");
			expect(formatSeconds(NaN, { format: "short" })).toBe("0s");
		});

		test("Infinity returns zero fallback", () => {
			expect(formatSeconds(Infinity)).toBe("0 seconds");
			expect(formatSeconds(-Infinity, { format: "short" })).toBe("0s");
		});
	});

	describe("rounding options", () => {
		test("honours rounding below a millisecond without double rounding", () => {
			expect(formatSeconds(0.0006, { rounding: "floor" })).toBe("0 seconds");
			expect(formatSeconds(0.0001, { rounding: "ceil" })).toBe("1 millisecond");
			expect(
				formatSeconds(1.9996, { rounding: "floor", onlyUnits: ["s"] }),
			).toBe("1 second");
		});

		test("carries rounded units into larger displayed units", () => {
			expect(formatSeconds(3599.9, { onlyUnits: ["h", "m", "s"] })).toBe(
				"1 hour",
			);
			expect(formatSeconds(59.9, { onlyUnits: ["m", "s"] })).toBe("1 minute");
		});

		test("floor", () => {
			expect(formatSeconds(1.9, { rounding: "floor" })).toBe(
				"1 second and 900 milliseconds",
			);
			expect(
				formatSeconds(1.999, { rounding: "floor", onlyUnits: ["s"] }),
			).toBe("1 second");
		});

		test("ceil", () => {
			expect(formatSeconds(1.1, { rounding: "ceil", onlyUnits: ["s"] })).toBe(
				"2 seconds",
			);
		});

		test("round (default)", () => {
			expect(formatSeconds(1.5, { rounding: "round", onlyUnits: ["s"] })).toBe(
				"2 seconds",
			);
			expect(formatSeconds(1.4, { rounding: "round", onlyUnits: ["s"] })).toBe(
				"1 second",
			);
		});
	});

	describe("onlyUnits filter", () => {
		test("restricts output to selected units", () => {
			expect(formatSeconds(3661, { onlyUnits: ["h", "m"] })).toBe(
				"1 hour and 1 minute",
			);
		});

		test("remainder stays in the smallest allowed unit", () => {
			expect(formatSeconds(3661, { onlyUnits: ["m"] })).toBe("61 minutes");
		});

		test("only seconds", () => {
			expect(formatSeconds(90, { onlyUnits: ["s"] })).toBe("90 seconds");
		});

		test("only milliseconds", () => {
			expect(formatSeconds(0.123, { onlyUnits: ["ms"] })).toBe(
				"123 milliseconds",
			);
		});

		test("weeks and days", () => {
			const sevenDays = 604800;
			expect(formatSeconds(sevenDays, { onlyUnits: ["w", "d"] })).toBe(
				"1 week",
			);
			expect(formatSeconds(sevenDays + 86400, { onlyUnits: ["w", "d"] })).toBe(
				"1 week and 1 day",
			);
		});
	});

	describe("includeZeroUnits", () => {
		test("shows zero-valued units when true (with Oxford comma)", () => {
			expect(
				formatSeconds(3600, {
					includeZeroUnits: true,
					onlyUnits: ["d", "h", "m", "s"],
				}),
			).toBe("0 days, 1 hour, 0 minutes, and 0 seconds");
		});

		test("hides zero-valued units when false (default)", () => {
			expect(
				formatSeconds(3600, {
					includeZeroUnits: false,
					onlyUnits: ["d", "h", "m", "s"],
				}),
			).toBe("1 hour");
		});
	});

	describe("customFormatter", () => {
		test("overrides per-unit rendering", () => {
			expect(
				formatSeconds(60, {
					customFormatter: (unit, value) => `${value}${unit.toUpperCase()}`,
				}),
			).toBe("1M");
		});

		test("receives correct label for long format", () => {
			const calls: Array<{ unit: string; value: number; label: string }> = [];
			formatSeconds(3661, {
				onlyUnits: ["h", "m", "s"],
				customFormatter: (unit, value, label) => {
					calls.push({ unit, value, label });
					return `${value} ${label}`;
				},
			});
			expect(calls).toEqual([
				{ unit: "h", value: 1, label: "hour" },
				{ unit: "m", value: 1, label: "minute" },
				{ unit: "s", value: 1, label: "second" },
			]);
		});

		test("receives plural label when value > 1", () => {
			let capturedLabel = "";
			formatSeconds(7200, {
				onlyUnits: ["h"],
				customFormatter: (_unit, _value, label) => {
					capturedLabel = label;
					return "";
				},
			});
			expect(capturedLabel).toBe("hours");
		});
	});

	describe("calendar-aware units", () => {
		beforeEach(() => setSystemTime(new Date(2026, 0, 1, 12)));
		afterEach(() => setSystemTime());

		test("keeps the remainder after a leap-day year rollover", () => {
			const start = new Date(2024, 1, 29, 12);
			const end = new Date(2025, 2, 2, 12);
			setSystemTime(start);
			expect(
				formatSeconds((end.getTime() - start.getTime()) / 1000, {
					onlyUnits: ["y", "mo", "d"],
				}),
			).toBe("1 year and 1 day");
		});

		test("does not subtract a month that rolls past the end date", () => {
			const start = new Date(2025, 0, 31, 12);
			const end = new Date(2025, 2, 1, 12);
			setSystemTime(start);
			expect(
				formatSeconds((end.getTime() - start.getTime()) / 1000, {
					onlyUnits: ["mo", "d"],
				}),
			).toBe("29 days");
		});

		test("years", () => {
			expect(formatSeconds(31536000)).toContain("1 year");
		});

		test("months", () => {
			expect(formatSeconds(2678400, { onlyUnits: ["mo", "d"] })).toContain(
				"1 month",
			);
		});

		test("years and months together", () => {
			const result = formatSeconds(31536000 + 2678400, {
				onlyUnits: ["y", "mo", "d"],
			});
			expect(result).toContain("1 year");
			expect(result).toContain("1 month");
		});
	});

	describe("fractional seconds", () => {
		test("sub-second value produces milliseconds", () => {
			expect(formatSeconds(0.5)).toBe("500 milliseconds");
		});

		test("mixed seconds and milliseconds", () => {
			expect(formatSeconds(1.5, { onlyUnits: ["s", "ms"] })).toBe(
				"1 second and 500 milliseconds",
			);
		});
	});
});
