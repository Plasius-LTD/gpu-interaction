# AGENTS.md

## Scope
- This repository contains `@plasius/gpu-interaction`.
- The package provides browser-safe action, surface hit region, script dispatch, and voice phrase contracts for the Plasius `gpu-*` family.

## Setup
- Use Node.js 24 or later (see `.nvmrc`) and npm.
- Install dependencies with `npm ci`.

## Common Commands
- `npm run build`
- `npm run test`
- `npm run test:coverage`
- `npm run lint`
- `npm run typecheck`
- `npm run pack:check`

## Repo Conventions
- Source lives in `src/`; tests live in `tests/`; package docs live in `docs/`.
- `dist/` and `coverage/` are generated output and must not be edited by hand.
- Keep TypeScript `strict`, preserve dual ESM/CJS packaging, and keep public exports intentional.
- Keep this package renderer-agnostic; renderer/camera math belongs in consuming packages.
- Update `README.md`, `CHANGELOG.md`, ADRs, and TDRs for public contract changes.

## Safety
- Never commit secrets, production tokens, or real user/player data.
- Interaction payloads must remain explicit data contracts; do not execute arbitrary script strings inside this package.
