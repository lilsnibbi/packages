# Workspace

Keep responses minimal. Use Bun.
Never commit, push, tag, publish, or run release automation unless explicitly requested.

The root is a Git superproject. Each package is an independent submodule;
preserve its history, remote, branch, lockfile, and repository-specific settings.
Read each package's AGENTS.md before changing it.

Edit shared/package/ and shared/renovate/ for shared configuration, then run
`bun run configs:sync`. Keep the generated copies tracked in each package so
standalone clones work. Do not replace them with links outside their repository.
Run `bun run check` and check Git diffs in the root and affected packages.
