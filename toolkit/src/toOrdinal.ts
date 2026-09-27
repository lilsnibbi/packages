const PLURAL_RULES = new Intl.PluralRules("en-US", { type: "ordinal" });

const SUFFIXES: Readonly<Record<Intl.LDMLPluralRule, string>> = {
	one: "st",
	two: "nd",
	few: "rd",
	other: "th",
	zero: "th",
	many: "th",
};

/**
 * Converts a number to its English ordinal string.
 *
 * The suffix comes from `Intl.PluralRules`, so the teens exceptions (11th,
 * 12th, 13th) are handled correctly rather than by a hand-rolled modulo table.
 * Negative numbers keep their sign; non-finite values fall back to `"th"`.
 *
 * @param value - The number to convert.
 * @returns The number with its ordinal suffix appended.
 *
 * @example
 * ```ts
 * toOrdinal(1);   // "1st"
 * toOrdinal(22);  // "22nd"
 * toOrdinal(113); // "113th"
 * ```
 */
export function toOrdinal(value: number): string {
	const rule = PLURAL_RULES.select(value);
	return `${value}${SUFFIXES[rule] ?? "th"}`;
}
