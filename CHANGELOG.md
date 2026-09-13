# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- **Added**
  - (placeholder)

- **Changed**
  - Bound npm publication to the exact prepared `main` commit after successful push-triggered CI.
  - Enabled exact-head manual CI dispatch for reviewed release validation.
  - (placeholder)

- **Fixed**
  - Disabled package-manager caching on self-hosted CI to prevent cache-save
    cleanup stalls from blocking the validation queue.
  - (placeholder)

- **Security**
  - Updated Vitest and its coverage adapter to 4.1.11, clearing the redirect-mock path traversal advisory.
  - Removed the npm write-token path, added a fail-closed npm 11.5.1-or-newer OIDC guard, and denied fork PR code access to self-hosted CI.
  - Pinned patched transitive npm dependencies to clear the current audit baseline.
  - Added fail-closed source and npm-package admission for the administrative contributor registry and pinned the CI/CD runtime to Node.js 24.18.0 LTS.
  - Pinned audited transitive build dependencies to fixed `brace-expansion`, `esbuild`, and `postcss` releases.
  - (placeholder)

## [0.1.3] - 2026-06-22

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.2] - 2026-06-21
- add renderer-hit resolution helpers, explicit non-action hit classifications, and optional entity-id bindings for surface actions
- bootstrap `@plasius/gpu-interaction` with typed action descriptors, surface hit regions, script dispatch, and voice phrase matching for `gpu-*` 3D UI surfaces
- establish the canonical GitHub repository plus CI and npm release workflows for `@plasius/gpu-interaction`


[0.1.2]: https://github.com/Plasius-LTD/gpu-interaction/releases/tag/v0.1.2
[0.1.3]: https://github.com/Plasius-LTD/gpu-interaction/releases/tag/v0.1.3
