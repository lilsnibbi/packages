# Workspace

Keep responses minimal. Use Bun.
Never commit, push, tag, publish, or run release automation unless explicitly requested.
Preserve existing user changes and public APIs.

One Git repository on main, with three Bun workspaces: toolkit, logger and discord-kit.
Read each package's AGENTS.md before changing it. Shared tooling, lockfile,
configuration, release checks and Actions live at the root; do not duplicate them.
Packages ship TypeScript source from src/index.ts. Keep package.json files allowlists narrow.
Use workspace dependencies between packages. Release Please versions them independently.

Use tabs, double quotes and LF. Keep named types beside their implementations
and document public exports. Run bun run check and review git diff before committing.
