# Releases

Use Conventional Commits on main. Release Please maintains one PR with independent
package versions and changelogs; its workspace plugin also bumps affected dependents.
Tags are toolkit-vX.Y.Z, logger-vX.Y.Z and discord-kit-vX.Y.Z.

CI checks Windows and Linux before running Release Please. Release PRs also receive
a regenerated Bun lockfile. Merge only after both Verify checks pass.
Publishing checks out each released tag and publishes toolkit, logger, then discord-kit.
Each archive includes source, its manifest and README, and the shared MIT license.

Required repository secrets:
- RELEASE_TOKEN: GitHub token for this repository with Contents, Issues and Pull requests
  write access. Using it lets release PRs and lockfile commits trigger CI.
- NPM_TOKEN: npm token permitted to publish all three packages without interactive approval.

For a publish failure, rerun failed jobs from the original CI run so release outputs
and tags are retained. Already-published versions are tolerated. Do not rerun all jobs.
A GitHub release alone does not verify npm publication.

[Release Please](https://github.com/googleapis/release-please-action) ·
[Workspace releases](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md#node-workspace) ·
[Bun publishing](https://bun.sh/docs/pm/cli/publish)
