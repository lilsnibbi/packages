/** Options accepted by {@link formatBytes}. */
export interface FormatBytesOptions {
	/** Maximum decimal places. Trailing zeroes are trimmed. Defaults to `1`. */
	decimals?: number;
	/**
	 * Divide by 1024 and label with `KiB`, `MiB`, … instead of dividing by 1000
	 * and labelling with `KB`, `MB`, …. Defaults to `false`.
	 */
	binary?: boolean;
}

const DECIMAL_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
const BINARY_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;

/**
 * Converts a byte count into a human-readable string.
 *
 * Decimal units by default — `1500` is `"1.5 KB"` — matching how drives and
 * most operating systems report sizes; pass `binary: true` for 1024-based
 * `KiB`/`MiB` units instead.
 *
 * @param bytes - The number of bytes. Non-finite values yield `"0 B"`.
 * @param options - See {@link FormatBytesOptions}.
 * @returns The formatted size, negated with a leading `-` when `bytes` is
 * negative.
 * @throws {RangeError} If `decimals` is not a non-negative integer.
 *
 * @example
 * ```ts
 * formatBytes(1500);                  // "1.5 KB"
 * formatBytes(1536, { binary: true }); // "1.5 KiB"
 * formatBytes(5 * 1024 * 1024);       // "5.2 MB"
 * ```
 */
export function formatBytes(
	bytes: number,
	options: FormatBytesOptions = {},
): string {
	const { decimals = 1, binary = false } = options;

	if (!Number.isInteger(decimals) || decimals < 0) {
		throw new RangeError("decimals must be a non-negative integer");
	}

	if (!Number.isFinite(bytes)) return "0 B";

	const base = binary ? 1024 : 1000;
	const units = binary ? BINARY_UNITS : DECIMAL_UNITS;

	let value = Math.abs(bytes);
	let unit = 0;
	while (value >= base && unit < units.length - 1) {
		value /= base;
		unit++;
	}

	// `toFixed` pads with zeroes; parsing it back drops them, so a round value
	// prints as `2 MB` rather than `2.0 MB`.
	const rounded = Number.parseFloat(value.toFixed(decimals));

	return `${bytes < 0 ? "-" : ""}${rounded} ${units[unit]}`;
}
