import { readdir, mkdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { isDeepStrictEqual } from "node:util";

const root = join(import.meta.dir, "..");
const check = process.argv.includes("--check");
const packages = ["discord-kit", "logger", "toolkit"];
const template = join(root, "shared/package");
const files = (await readdir(template, { recursive: true, withFileTypes: true }))
	.filter((entry) => entry.isFile())
	.map((entry) => join(entry.parentPath, entry.name).slice(template.length + 1));
const scripts = await Bun.file(join(root, "shared/package-scripts.json")).json();
const release = await Bun.file(join(root, "shared/release-please.json")).json();
const attributes = await Bun.file(join(root, ".gitattributes")).text();
let differences = 0;

async function sync(path: string, expected: string) {
	const file = Bun.file(join(root, path));
	const actual = (await file.exists()) ? await file.text() : "";
	if (actual.replaceAll("\r\n", "\n") === expected.replaceAll("\r\n", "\n")) return;
	differences++;
	console.log(`${check ? "Out of sync" : "Updated"}: ${path}`);
	if (!check) {
		await mkdir(dirname(file.name!), { recursive: true });
		await Bun.write(file, expected);
	}
}

async function syncJson(path: string, config: unknown) {
	const current = Bun.file(join(root, path));
	if (await current.exists()) {
		if (isDeepStrictEqual(await current.json(), config)) return;
	}
	const formatter = Bun.spawn(["bun", "--no-install", "biome", "format", `--stdin-file-path=${basename(path)}`, "--config-path=shared/package"], {
		cwd: root,
		stdin: new Blob([JSON.stringify(config)]),
		stdout: "pipe",
		stderr: "pipe",
	});
	const formatted = await new Response(formatter.stdout).text();
	const error = await new Response(formatter.stderr).text();
	if (await formatter.exited) throw new Error(error);
	await sync(path, formatted);
}

// Read every checkout before writing, so an uninitialised submodule cannot be
// accidentally replaced with a directory containing only generated configs.
for (const name of packages) {
	if (!(await Bun.file(join(root, name, "package.json")).exists())) {
		throw new Error(`Missing ${name}; run git submodule update --init --recursive`);
	}
}
for (const name of packages) {
	for (const file of files) {
		await sync(join(name, file), await Bun.file(join(template, file)).text());
	}
	await sync(`${name}/.gitattributes`, attributes);
	const manifest = await Bun.file(join(root, name, "package.json")).json();
	await syncJson(`${name}/package.json`, {
		...manifest,
		scripts: { ...manifest.scripts, ...scripts },
	});
	const currentRelease = await Bun.file(join(root, name, "release-please-config.json")).json();
	await syncJson(`${name}/release-please-config.json`, {
		...currentRelease,
		...release,
		packages: { ...release.packages, ...currentRelease.packages },
	});
}
console.log(differences ? `${differences} config file(s) ${check ? "differ" : "updated"}.` : "Shared configs are in sync.");
if (check && differences) process.exit(1);
