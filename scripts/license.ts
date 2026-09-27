import { unlink } from "node:fs/promises";
import { basename, resolve } from "node:path";
import workspace from "../package.json";

const root = resolve(import.meta.dir, "..");
const name = basename(process.cwd());
if (
	!workspace.workspaces.includes(name) ||
	process.cwd() !== resolve(root, name)
) {
	throw new Error("Run this hook from a workspace package.");
}
const license = resolve(root, name, "LICENSE");
if (process.argv.includes("--clean")) {
	await unlink(license);
} else {
	await Bun.write(license, Bun.file(resolve(root, "LICENSE")));
}
