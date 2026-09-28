/** Time units {@link formatSeconds} can emit, largest to smallest. */
export type TimeUnit = "y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms";

/** How the smallest emitted unit is rounded. */
export type RoundingMode = "floor" | "ceil" | "round";

/** Output style: full words or single-letter abbreviations. */
export type DurationFormat = "long" | "short";

/** Options accepted by {@link formatSeconds}. */
export interface FormatSecondsOptions {
	/** Emit units whose value is zero. Defaults to `false`. */
	includeZeroUnits?: boolean;
	/** Restrict output to these units. Defaults to all of them. */
	onlyUnits?: TimeUnit[];
	/** `"long"` for full words, `"short"` for abbreviations. Defaults to `"long"`. */
	format?: DurationFormat;
	/** How to round the smallest emitted unit. Defaults to `"round"`. */
	rounding?: RoundingMode;
	/**
	 * Renders a single unit, replacing the built-in rendering.
	 * @param unit - The unit being rendered.
	 * @param value - Its numeric value.
	 * @param label - The pluralised long label, or the short label in `"short"` mode.
	 */
	customFormatter?: (unit: TimeUnit, value: number, label: string) => string;
}

/** Both plural forms are stored so no label has to be built per call. */
const UNITS: Record<
	TimeUnit,
	{ one: string; many: string; short: string; ms: number }
> = {
	y: { one: "year", many: "years", short: "y", ms: 31536000000 },
	mo: { one: "month", many: "months", short: "mo", ms: 2628000000 },
	w: { one: "week", many: "weeks", short: "w", ms: 604800000 },
	d: { one: "day", many: "days", short: "d", ms: 86400000 },
	h: { one: "hour", many: "hours", short: "h", ms: 3600000 },
	m: { one: "minute", many: "minutes", short: "m", ms: 60000 },
	s: { one: "second", many: "seconds", short: "s", ms: 1000 },
	ms: { one: "millisecond", many: "milliseconds", short: "ms", ms: 1 },
};

const ALL_UNITS_ORDER: TimeUnit[] = ["y", "mo", "w", "d", "h", "m", "s", "ms"];

const SECONDS_PER_YEAR = UNITS.y.ms / 1000;
const SECONDS_PER_MONTH = UNITS.mo.ms / 1000;

/**
 * Every calendar month spans at least 28 days, so a duration shorter than this
 * cannot contain a whole year or month and needs no calendar arithmetic. The
 * margin below 28 days absorbs a 23-hour DST day inside the span.
 */
const MIN_CALENDAR_MS = 27 * 86400000;

/**
 * Joins rendered parts into `"a"`, `"a and b"` or `"a, b, and c"`.
 *
 * This is what `Intl.ListFormat("en-US", { style: "long", type: "conjunction"
 * })` produces, Oxford comma included, written out because the locale and
 * options are fixed and constructing the formatter costs more than everything
 * else {@link formatSeconds} does.
 */
function conjoin(parts: string[]): string {
	const count = parts.length;
	if (count < 2) return parts[0] ?? "";
	if (count === 2) return `${parts[0]} and ${parts[1]}`;

	let result = parts[0] ?? "";
	for (let index = 1; index < count - 1; index += 1) {
		result += `, ${parts[index]}`;
	}

	return `${result}, and ${parts[count - 1]}`;
}

/**
 * Converts a duration in seconds into a human-readable string.
 *
 * Years and months are calendar-aware: they are measured against the current
 * date rather than fixed averages, so the result respects leap years and
 * varying month lengths. Smaller units fall back to fixed arithmetic.
 *
 * @param seconds - The duration in seconds. Non-finite values yield zero.
 * @param options - See {@link FormatSecondsOptions}.
 * @returns The formatted duration, negated with a leading `-` when `seconds` is
 * negative.
 *
 * @example
 * ```ts
 * formatSeconds(9000);                      // "2 hours and 30 minutes"
 * formatSeconds(9000, { format: "short" }); // "2h 30m"
 * formatSeconds(9000, { onlyUnits: ["h"] }); // "3 hours"
 * ```
 */
export function formatSeconds(
	seconds: number,
	options: FormatSecondsOptions = {},
): string {
	const {
		includeZeroUnits = false,
		onlyUnits = [],
		format = "long",
		rounding = "round",
		customFormatter,
	} = options;

	const short = format === "short";

	if (!Number.isFinite(seconds)) return short ? "0s" : "0 seconds";

	const isNegative = seconds < 0;
	const absSeconds = Math.abs(seconds);

	const unitsToDisplay = onlyUnits.length
		? ALL_UNITS_ORDER.filter((u) => onlyUnits.includes(u))
		: ALL_UNITS_ORDER;

	const lastUnit = unitsToDisplay[unitsToDisplay.length - 1] ?? "s";
	const round = Math[rounding];

	// Round once before splitting fixed units so carries reach larger units.
	// Calendar units keep their own rounding below.
	const smallestMs = UNITS[lastUnit].ms;
	let totalMs =
		lastUnit === "y" || lastUnit === "mo"
			? absSeconds * 1000
			: round(absSeconds * (1000 / smallestMs)) * smallestMs;

	// Units are computed largest first, which is also the order they print in,
	// so each one is rendered as it is worked out rather than collected into an
	// intermediate record and walked a second time.
	const parts: string[] = [];

	/** Renders one unit into {@link parts}, dropping it when it is empty. */
	const emit = (unit: TimeUnit, value: number): void => {
		if (value <= 0 && !includeZeroUnits) return;

		const names = UNITS[unit];
		const label = short ? names.short : value === 1 ? names.one : names.many;

		parts.push(
			customFormatter
				? customFormatter(unit, value, label)
				: short
					? `${value}${label}`
					: `${value} ${label}`,
		);
	};

	const showYears = unitsToDisplay.includes("y");
	const showMonths = unitsToDisplay.includes("mo");

	// A duration too short to hold a month is zero years and zero months, and
	// `Date` never has to be consulted. Durations that round *to* a year or a
	// month are excluded: those divide through fixed averages below, however
	// small they are.
	const skipCalendar =
		lastUnit !== "y" && lastUnit !== "mo" && totalMs < MIN_CALENDAR_MS;

	if (!showYears && !showMonths) {
		// Nothing calendar-aware was asked for.
	} else if (skipCalendar) {
		if (showYears) emit("y", 0);
		if (showMonths) emit("mo", 0);
	} else {
		const now = new Date();
		const end = new Date(now.getTime() + totalMs);
		const endMs = end.getTime();
		const nowMs = now.getTime();

		// One scratch date is reused for every calendar jump below. Adding
		// years and months has to go through `Date` to respect leap years,
		// month lengths and DST, but it does not need a fresh object each time.
		const scratch = new Date(nowMs);

		/**
		 * Epoch milliseconds of `now` moved forward by whole years and months.
		 * @param years - Years to add.
		 * @param months - Months to add, applied after the years.
		 */
		const jump = (years: number, months?: number): number => {
			scratch.setTime(nowMs);
			scratch.setFullYear(now.getFullYear() + years);
			if (months !== undefined) scratch.setMonth(scratch.getMonth() + months);
			return scratch.getTime();
		};

		let years: number | undefined;

		if (showYears) {
			if (lastUnit === "y") {
				years = Math.max(0, round(absSeconds / SECONDS_PER_YEAR));
				totalMs = 0;
			} else {
				let y = end.getFullYear() - now.getFullYear();
				if (jump(y) > endMs) y--;

				years = Math.max(0, y);
				totalMs -= jump(years) - nowMs;
			}

			emit("y", years);
		}

		if (showMonths) {
			let months = 0;

			if (totalMs > 0) {
				if (lastUnit === "mo") {
					months = Math.max(0, round(totalMs / (SECONDS_PER_MONTH * 1000)));
					totalMs = 0;
				} else {
					const start = new Date(jump(years ?? 0));
					const startTotalMonths = start.getFullYear() * 12 + start.getMonth();
					const endTotalMonths = end.getFullYear() * 12 + end.getMonth();
					let mo = endTotalMonths - startTotalMonths;
					while (mo > 0 && jump(years ?? 0, mo) > endMs) mo--;

					months = Math.max(0, mo);
					totalMs = endMs - jump(years ?? 0, months);
				}
			}

			emit("mo", months);
		}
	}

	for (const unit of unitsToDisplay) {
		if (unit === "y" || unit === "mo") continue;

		const unitMs = UNITS[unit].ms;

		if (unit === lastUnit) {
			emit(unit, round(totalMs / unitMs));
			totalMs = 0;
		} else {
			const value = Math.floor(totalMs / unitMs);
			totalMs %= unitMs;
			emit(unit, value);
		}
	}

	if (parts.length === 0) {
		const zero = short ? "0s" : "0 seconds";
		return isNegative ? `-${zero}` : zero;
	}

	const result = short ? parts.join(" ") : conjoin(parts);

	return isNegative ? `-${result}` : result;
}
