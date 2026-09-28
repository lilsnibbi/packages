# Releases

Use Conventional Commits on main. Release Please maintains a separate PR,
version and changelog for each package. Workspace dependencies use `workspace:^`;
update dependent packages when a dependency requires a new release.
Tags are helpers-vX.Y.Z, logger-vX.Y.Z and discord-vX.Y.Z.

CI checks Windows and Linux before the Release workflow runs. Release PRs also receive
a regenerated Bun lockfile. Merge only after both Verify checks pass.
Publishing checks out each released tag and publishes helpers, logger, then discord.
Each archive includes source, its manifest and README, and the shared MIT license.

Required repository secrets:

- RELEASE_TOKEN: GitHub token for this repository with Contents, Issues and Pull requests
  write access. Using it lets release PRs and lockfile commits trigger CI.

Publishing uses npm Trusted Publishing from `release.yml` with GitHub OIDC.
New npm names need a one-time interactive first publish before configuring their
trusted publisher.

For a publish failure, rerun failed jobs from the original Release run so release outputs
and tags are retained. Already-published versions are tolerated. Do not rerun all jobs.
A GitHub release alone does not verify npm publication.

[Release Please](https://github.com/googleapis/release-please-action) ·
[Manifest releases](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md) ·
[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
