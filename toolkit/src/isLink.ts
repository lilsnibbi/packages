/**
 * Checks whether a string parses as an absolute URL.
 *
 * Any scheme is accepted, not just `http:` and `https:` — `mailto:x@y.z` and
 * `data:text/plain,hi` are both links by this definition. Relative paths are
 * not, since they have no base to resolve against.
 *
 * @param value - The string to test.
 * @returns `true` if `value` parses as an absolute URL.
 *
 * @example
 * ```ts
 * isLink("https://example.com"); // true
 * isLink("/about");              // false
 * ```
 */
export function isLink(value: string): boolean {
	return URL.canParse(value);
}
