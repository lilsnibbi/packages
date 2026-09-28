/**
 * Returns a copy of an array with its elements in uniformly random order.
 *
 * A Fisher–Yates shuffle over a copy, so the input array is not modified.
 * Backed by `Math.random`, so this is not cryptographically secure.
 *
 * @typeParam T - The array's element type.
 * @param array - The array to shuffle.
 * @returns A new array holding the same elements in random order.
 *
 * @example
 * ```ts
 * shuffle([1, 2, 3, 4, 5]); // e.g. [3, 1, 5, 2, 4]
 * ```
 */
export function shuffle<T>(array: readonly T[]): T[] {
	const result = [...array];

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j] as T, result[i] as T];
	}

	return result;
}
