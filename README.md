# @lilsnibbi

Git superproject for `discord-kit/`, `logger/`, `toolkit/`, and `dots/`.
Each submodule keeps its own history, remote, branches, and repository settings.

```bash
git clone --recurse-submodules https://github.com/lilsnibbi/packages.git
cd packages
bun install --frozen-lockfile
# Run bun install --frozen-lockfile inside each runtime package too.
bun run check
```

## Shared configuration

[dots](https://github.com/lilsnibbi/dots) owns the shared configuration:

- Renovate: `default.json`, extended with `github>lilsnibbi/dots`.
- Biome: `biome.json`, extended with `@lilsnibbi/dots/biome`.
- TypeScript: `tsconfig.json`, extended with `@lilsnibbi/dots/tsconfig.json`.

Each runtime package installs `@lilsnibbi/dots` as a Git development dependency,
locked to a commit. Standalone clones need no parent directory or local links.
Renovate uses the current preset; Biome and TypeScript use the installed revision.
After changing those presets, push dots first and update consumer dependencies
and lockfiles to the new commit. The root TypeScript config extends the dots
submodule directly.

Files without native inheritance live under `dots/templates/`, plus
`dots/package-scripts.json` and `dots/release-please.json`.

```bash
bun run configs:sync     # update standalone templates and config entrypoints
bun run configs:check    # check for drift without writing
```

Package identities, dependencies, release versions, bootstrap SHAs, and custom
scripts remain independent. Each package retains its own lockfile.

## Git and package operations

Commit and push changed submodules first, then commit their updated pointers
in this repository. `git diff --submodule` shows pointer changes;
`git submodule foreach git status --short` shows package working changes.

For an existing clone, run `git submodule update --init --recursive`. Fresh
submodules use detached HEADs; check out the intended branch before editing.

The pipeline drives the three runtime packages:

```bash
bun run pipeline help
bun run pipeline status
bun run pipeline release --project=all
bun run pipeline retry --project=logger --run=<run-id>
```

See the shared [release policy](dots/templates/.github/RELEASE_POLICY.md).
