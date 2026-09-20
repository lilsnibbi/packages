# Workspace

Keep responses minimal. Use Bun.
Never commit, push, tag, publish, or run release automation unless explicitly requested.

The root is a Git superproject. Each package is an independent submodule;
preserve its history, remote, branch, lockfile, and repository-specific settings.
Read each package's AGENTS.md before changing it.

Edit dots/ for shared configuration. Renovate extends its GitHub preset;
Biome and TypeScript extend the pinned @lilsnibbi/dots development dependency.
Use `bun run configs:sync` for files without native inheritance in dots/templates/.
Keep package-local entrypoints and generated templates tracked for standalone clones.
Run `bun run check` and check Git diffs in the root and affected packages.
