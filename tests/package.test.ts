import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import workspace from "../package.json";
import discord from "../discord-kit/package.json";

test("all published archives install together and expose their public APIs", async () => {
	const root = resolve(import.meta.dir, "..");
	const temporary = mkdtempSync(join(tmpdir(), "lilsnibbi-packages-"));
	const dependencies: Record<string, string> = {
		"discord.js": discord.devDependencies["discord.js"],
	};
	const expected: Record<string, string[]> = {
		toolkit: [
			"chunk",
			"clamp",
			"formatBytes",
			"formatSeconds",
			"isLink",
			"randomInt",
			"randomItem",
			"shuffle",
			"toOrdinal",
			"truncate",
		],
		logger: ["Logger", "LogFile", "formatError", "paint", "stripAnsi"],
		"discord-kit": [
			"DiscordClient",
			"DiscordCommand",
			"DiscordEvent",
			"DiscordPagination",
			"getClient",
			"runDiscordShutdown",
		],
	};
	try {
		for (const name of workspace.workspaces) {
			const archive = join(temporary, `${name}.tgz`);
			const pack = Bun.spawnSync(
				[process.execPath, "pm", "pack", "--filename", archive],
				{ cwd: join(root, name) },
			);
			expect(pack.exitCode, pack.stderr.toString()).toBe(0);
			const listing = Bun.spawnSync(["tar", "-tzf", archive]);
			expect(listing.exitCode, listing.stderr.toString()).toBe(0);
			const files = listing.stdout.toString().trim().split(/\r?\n/);
			for (const file of [
				"src/index.ts",
				"LICENSE",
				"README.md",
				"package.json",
			]) {
				expect(files).toContain(`package/${file}`);
			}
			for (const file of files)
				expect(file).toMatch(
					/^package\/(src\/.*|package\.json|README\.md|LICENSE)$/,
				);
			const extracted = join(temporary, name);
			mkdirSync(extracted);
			const unpack = Bun.spawnSync(["tar", "-xzf", archive, "-C", extracted]);
			expect(unpack.exitCode, unpack.stderr.toString()).toBe(0);
			const manifest = await Bun.file(
				join(extracted, "package/package.json"),
			).json();
			expect(await Bun.file(join(extracted, "package/LICENSE")).text()).toBe(
				await Bun.file(join(root, "LICENSE")).text(),
			);
			for (const [dependency, range] of Object.entries(
				manifest.dependencies ?? {},
			)) {
				const sibling = await Bun.file(
					join(root, dependency.replace("@lilsnibbi/", ""), "package.json"),
				).json();
				expect(range).toBe(`^${sibling.version}`);
			}
			dependencies[manifest.name] = `file:./${name}.tgz`;
		}
		await Bun.write(
			join(temporary, "package.json"),
			JSON.stringify({ private: true, type: "module", dependencies }),
		);
		const install = Bun.spawnSync(
			[process.execPath, "install", "--ignore-scripts"],
			{ cwd: temporary },
		);
		expect(install.exitCode, install.stderr.toString()).toBe(0);
		const smoke = `const expected = ${JSON.stringify(expected)};
			for (const [name, symbols] of Object.entries(expected)) {
				const api = await import('@lilsnibbi/' + name);
				for (const symbol of symbols) if (typeof api[symbol] !== 'function') throw new Error(name + ': ' + symbol);
			}
			const { Logger } = await import('@lilsnibbi/logger');
			const logger = new Logger({ name: 'archive-test', colors: false, layout: 'box' });
			if (typeof logger.notif('Ready', true) !== 'string') throw new Error('Logger archive failed');
			logger.close();`;
		await Bun.write(join(temporary, "smoke.ts"), smoke);
		const run = Bun.spawnSync([process.execPath, "run", "smoke.ts"], {
			cwd: temporary,
		});
		expect(run.exitCode, run.stderr.toString()).toBe(0);
	} finally {
		rmSync(temporary, { recursive: true, force: true });
	}
}, 60_000);
