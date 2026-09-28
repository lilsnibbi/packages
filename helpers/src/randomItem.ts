import { randomInt } from "./randomInt";

/**
 * Returns a uniformly random element of an array.
 *
 * Backed by `Math.random` via {@link randomInt}, so this is not
 * cryptographically secure.
 *
 * @typeParam T - The array's element type.
 * @param array - The array to pick from.
 * @returns One of the array's elements.
 * @throws {RangeError} If `array` is empty.
 *
 * @example
 * ```ts
 * randomItem(["rock", "paper", "scissors"]);
 * ```
 */
export function randomItem<T>(array: readonly T[]): T {
	if (array.length === 0) throw new RangeError("array cannot be empty");
	return array[randomInt(0, array.length - 1)] as T;
}
