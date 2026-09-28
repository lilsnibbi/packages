/**
 * Clamps a number into the inclusive range `[min, max]`.
 *
 * @param value - The number to clamp.
 * @param min - Lower bound, inclusive.
 * @param max - Upper bound, inclusive.
 * @returns `value`, limited to the range.
 * @throws {RangeError} If `min` exceeds `max`.
 *
 * @example
 * ```ts
 * clamp(15, 0, 10); // 10
 * clamp(-2, 0, 10); // 0
 * clamp(5, 0, 10);  // 5
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
	if (min > max) throw new RangeError("min cannot be greater than max");
	return Math.max(min, Math.min(value, max));
}
