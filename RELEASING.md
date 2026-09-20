# Releasing

Use Conventional Commits on main: fix: for patches, feat: for minor releases,
and feat!: or a BREAKING CHANGE: footer for major releases. Merge the generated
Release Please PR after CI passes; the Release workflow creates the tag and
GitHub release, then verifies and publishes the exact tagged package.

All three repos share CI and release.yml through shared/package/. Run
`bun run configs:sync` after editing those templates.
Release Please configs retain each repository's bootstrap SHA, and
.release-please-manifest.json records each package's current version.
Each repo needs RELEASE_TOKEN (GitHub Contents, Issues, and Pull requests write)
and NPM_TOKEN (package publish access). See each .github/RELEASE_POLICY.md.

```bash
bun pipeline.ts release --project=all     # show pending release PRs
bun pipeline.ts retry --project=logger --run=123456
bun pipeline.ts ci --project=all
bun pipeline.ts status
bun pipeline.ts check --project=all
```

Retry failed publish jobs in the original run using Re-run failed jobs.
Rerunning all jobs loses the release_created output for an existing release.

When changing discord-kit's logger dependency, publish a compatible logger
version first, then regenerate discord-kit's registry-backed lockfile.

After package commits are pushed, commit the updated submodule pointers in the
superproject. Shared configuration changes must also be committed in every
affected package repository to reach their independent CI and Renovate runs.
