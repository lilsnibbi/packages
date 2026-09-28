/**
 * Splits an array into consecutive chunks of at most `size` elements.
 *
 * The final chunk holds the remainder and may be shorter. The input array is
 * not modified.
 *
 * @typeParam T - The array's element type.
 * @param array - The array to split.
 * @param size - Maximum number of elements per chunk.
 * @returns The chunks, in order. Empty when `array` is empty.
 * @throws {RangeError} If `size` is not a positive integer.
 *
 * @example
 * ```ts
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * ```
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
	if (!Number.isInteger(size) || size <= 0) {
		throw new RangeError("size must be a positive integer");
	}

	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}
