/**
 * Returns a uniformly random integer in the inclusive range `[min, max]`.
 *
 * Backed by `Math.random`, so this is not cryptographically secure — use
 * `crypto.getRandomValues` where that matters.
 *
 * @param min - Lower bound, inclusive.
 * @param max - Upper bound, inclusive.
 * @returns An integer between `min` and `max`.
 * @throws {RangeError} If either bound is not an integer, or `min` exceeds `max`.
 *
 * @example
 * ```ts
 * randomInt(1, 6); // a d6 roll
 * ```
 */
export function randomInt(min: number, max: number): number {
	if (!Number.isInteger(min) || !Number.isInteger(max)) {
		throw new RangeError("min and max must be integers");
	}
	if (min > max) throw new RangeError("min cannot be greater than max");

	return Math.floor(Math.random() * (max - min + 1)) + min;
}
