import { resolve } from "node:path";
import workspace from "../package.json";

/** Validate a package's version, license and component-specific release tag. */
export function verifyRelease(
	name: string,
	manifest: { version?: string; license?: string },
	versions: Record<string, string>,
	tag?: string,
): void {
	const version = manifest.version;
	if (!version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
		throw new Error("The release version must be stable SemVer.");
	}
	if (manifest.license !== "MIT")
		throw new Error("The package must declare MIT.");
	if (versions[name] !== version) {
		throw new Error("Release Please and package.json versions must match.");
	}
	if (tag !== undefined && tag !== `${name}-v${version}`) {
		throw new Error(`Release tag ${tag} does not match ${name}-v${version}.`);
	}
}

if (import.meta.main) {
	const root = resolve(import.meta.dir, "..");
	const [name, tag] = process.argv.slice(2);
	if (name && !workspace.workspaces.includes(name))
		throw new Error(`Unknown package: ${name}`);
	const versions = await Bun.file(
		resolve(root, ".release-please-manifest.json"),
	).json();
	for (const path of name ? [name] : workspace.workspaces) {
		verifyRelease(
			path,
			await Bun.file(resolve(root, path, "package.json")).json(),
			versions,
			tag,
		);
	}
	console.log("Release metadata verified.");
}
