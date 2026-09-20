import { readdir, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = join(import.meta.dir, "..");
const check = process.argv.includes("--check");
const packages = ["discord-kit", "logger", "toolkit"];
const template = join(root, "shared/package");
const files = (await readdir(template, { recursive: true, withFileTypes: true }))
	.filter((entry) => entry.isFile())
	.map((entry) => join(entry.parentPath, entry.name).slice(template.length + 1));
const base = await Bun.file(join(root, "shared/renovate/base.json")).json();
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
	const overrideFile = Bun.file(join(root, "shared/renovate", `${name}.json`));
	const override = (await overrideFile.exists()) ? await overrideFile.json() : {};
	const config = {
		...base,
		...override,
		packageRules: [...base.packageRules, ...(override.packageRules ?? [])],
	};
	const formatter = Bun.spawn(["bun", "--no-install", "biome", "format", "--stdin-file-path=renovate.json", "--config-path=shared/package"], {
		cwd: root,
		stdin: new Blob([JSON.stringify(config)]),
		stdout: "pipe",
		stderr: "pipe",
	});
	const formatted = await new Response(formatter.stdout).text();
	const error = await new Response(formatter.stderr).text();
	if (await formatter.exited) throw new Error(error);
	await sync(`${name}/renovate.json`, formatted);
}
console.log(differences ? `${differences} config file(s) ${check ? "differ" : "updated"}.` : "Shared configs are in sync.");
if (check && differences) process.exit(1);
