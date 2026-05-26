# TDR-0002: Canonical Repository and Release Path

## Direction

`@plasius/gpu-interaction` is owned by the dedicated GitHub repository `Plasius-LTD/gpu-interaction`.

The package source, issue tracking, CI validation, and npm publication path all live in that repository instead of remaining a local-only directory or being folded back into another repo.

## CI

The repository runs a package-local GitHub Actions CI workflow on pushes and pull requests to `main`.

CI must validate:

- dependency installation with the pinned Node/npm toolchain
- lint
- typecheck
- coverage-backed tests
- build output
- public package verification

## Release

The only approved npm publish path is the repository-local `.github/workflows/cd.yml` workflow.

The publish workflow must:

- run from `main`
- require the GitHub `production` environment
- require `NPM_TOKEN`
- verify the package version is not already published
- publish with npm provenance enabled

Version changes remain code-reviewed repository changes. The publish workflow releases the version already committed on `main`; it does not invent unpublished local state.

## Alternatives Considered

- keep the package as a local-only directory:
  rejected because there is no reviewable git history, no issue/PR path, and no approved release workflow
- host package CI/CD in another repository:
  rejected because ownership, change history, and release evidence become ambiguous for package-specific work
