import { describe, expect, test } from "bun:test";
import { isLink } from "../src";

describe("isLink", () => {
	test("returns true for standard HTTP/HTTPS URLs", () => {
		expect(isLink("https://google.com")).toBe(true);
		expect(isLink("http://google.com")).toBe(true);
		expect(isLink("https://www.example.co.uk")).toBe(true);
	});

	test("returns true for localhost and IP addresses", () => {
		expect(isLink("http://localhost")).toBe(true);
		expect(isLink("http://localhost:3000")).toBe(true);
		expect(isLink("http://127.0.0.1:8080")).toBe(true);
		expect(isLink("http://[::1]:8080")).toBe(true); // IPv6
	});

	test("returns true for URLs with paths, queries, and fragments", () => {
		expect(
			isLink(
				"https://api.github.com/users/oven-sh/repos?sort=updated&direction=desc#readme",
			),
		).toBe(true);
	});

	test("returns true for non-HTTP protocols", () => {
		expect(isLink("ftp://example.com/file.zip")).toBe(true);
		expect(isLink("wss://echo.websocket.org")).toBe(true);
		expect(isLink("mailto:test@example.com")).toBe(true);
		expect(isLink("file:///C:/Users/test/file.txt")).toBe(true);
		expect(isLink("data:text/plain;base64,SGVsbG8=")).toBe(true);
		expect(isLink("javascript:alert('xss')")).toBe(true); // Valid URL structurally
	});

	test("returns false for domain names without protocols", () => {
		expect(isLink("google.com")).toBe(false);
		expect(isLink("www.google.com")).toBe(false);
		// 'localhost:3000' is technically a valid URI because 'localhost:' is treated as the scheme
		expect(isLink("localhost:3000")).toBe(true);
	});

	test("returns false for invalid or malformed strings", () => {
		expect(isLink("not a link")).toBe(false);
		expect(isLink("")).toBe(false);
		expect(isLink("http://")).toBe(false); // Missing host
		expect(isLink("https://")).toBe(false);
		expect(isLink("://invalid")).toBe(false);
	});

	test("handles URLs with whitespace properly", () => {
		// URL constructor automatically strips leading/trailing whitespace
		expect(isLink(" https://google.com ")).toBe(true);
		// However, whitespace inside the URL structure often invalidates it
		expect(isLink("https:// google.com")).toBe(false);
	});

	test("handles unicode and internationalized domains (IDNs)", () => {
		expect(isLink("https://xn--bcher-kva.example")).toBe(true); // Punycode
		expect(isLink("https://münchen.de")).toBe(true); // Unicode
		expect(isLink("https://🚀.com")).toBe(true); // Emoji domain
	});
});
