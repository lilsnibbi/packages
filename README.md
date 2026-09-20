# @lilsnibbi

Git superproject for three independently versioned package repositories:
`discord-kit/`, `logger/`, and `toolkit/`. Each is a submodule with its own
history, remote, branches, lockfile, CI, and releases.

```bash
git clone --recurse-submodules https://github.com/lilsnibbi/packages.git
cd packages
bun install --frozen-lockfile
# Install dependencies separately inside each package.
bun run configs:check
bun run check
```

## Shared configuration

Edit `shared/package/` for common Biome, TypeScript, Git ignore/attributes,
CI, release workflow/policy, and release verification files. Edit
`shared/renovate/base.json` for common Renovate rules and
`shared/renovate/discord-kit.json` for Discord-specific rules.

```bash
bun run configs:sync     # regenerate package-local configs
bun run configs:check    # fail on drift without writing
```

Package-local copies remain tracked so standalone clones and GitHub automation
work without the parent repository. This deduplicates the maintained source;
generated copies are intentional. Review sync diffs before committing, including
any dependency-bot changes that should be brought back into the shared source.
Common package scripts live in `shared/package-scripts.json`; common Release
Please settings live in `shared/release-please.json`. Sync preserves package
identity, dependencies, versions, custom scripts, and bootstrap SHAs. Root
`.gitattributes` also supplies the package copies. Release verification tests
are maintained with the shared verification script in `shared/package/`.
AGENTS.md files remain independently maintained. Package lockfiles stay separate; this is not a
Bun workspace that replaces their dependency resolution.

## Git workflow

Commit package changes in their own repositories first. Then stage the changed
submodule paths in this repository to record their new commit IDs, alongside
shared-config changes. Push package commits before pushing the superproject so
other clones can fetch every pinned commit. `git diff --submodule` shows pointer
changes; `git submodule foreach git status --short` shows package working changes.

For an existing clone, use `git submodule update --init --recursive`. Fresh
submodules use detached HEADs; check out the intended package branch before editing.
The existing local package branches are preserved.

## Package operations

```bash
bun run pipeline help
bun run pipeline status
bun run pipeline release --project=all
bun run pipeline retry --project=logger --run=<run-id>
```

See the shared [release policy](shared/package/.github/RELEASE_POLICY.md) for
release setup and recovery. Commit shared changes in every affected package,
then update the root submodule pointers after pushing those commits.
