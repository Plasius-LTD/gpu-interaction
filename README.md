# @plasius/gpu-interaction

[![npm version](https://img.shields.io/npm/v/@plasius/gpu-interaction.svg)](https://www.npmjs.com/package/@plasius/gpu-interaction)
[![CI](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/gpu-interaction/ci.yml?branch=main&label=CI)](https://github.com/Plasius-LTD/gpu-interaction/actions/workflows/ci.yml)
[![CD](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/gpu-interaction/cd.yml?branch=main&label=CD)](https://github.com/Plasius-LTD/gpu-interaction/actions/workflows/cd.yml)
[![License](https://img.shields.io/github/license/Plasius-LTD/gpu-interaction)](./LICENSE)

Browser-safe interaction scripting contracts for Plasius `gpu-*` surfaces.

Apache-2.0. ESM + CJS builds. TypeScript types included.

## Installation

```bash
npm install @plasius/gpu-interaction
```

## Requirements

- Node.js 24+
- npm 11.14.1 (declared via `packageManager`)

## Scope

`@plasius/gpu-interaction` provides renderer-agnostic helpers for:

- describing actions on 3D-rendered UI surfaces
- mapping surface-local hit regions from UV or pixel coordinates
- consuming normalized renderer hit metadata, including entity-id driven selection
- dispatching action scripts through registered handlers
- resolving simple voice phrases to the same action descriptors used by pointer, gaze, or script entry points

The package deliberately does not execute arbitrary JavaScript from script strings. A script is a stable command identifier such as `system.openModule("mcc-core")`; consumers register handlers for action kinds and decide what state changes are allowed.

## Usage

```ts
import {
  createGpuInteractionRegistry,
  resolveGpuInteractionActionFromHit,
  resolveGpuInteractionActionAtUv,
} from "@plasius/gpu-interaction";

const actions = [
  {
    id: "module:mcc-core",
    kind: "module",
    label: "MCC Core",
    script: 'system.openModule("mcc-core")',
    surfaceId: "system-nav",
    bounds: { x: 24, y: 120, width: 300, height: 80 },
    payload: { moduleId: "mcc-core" },
    phrases: ["open mcc core"],
  },
] as const;

const registry = createGpuInteractionRegistry({
  actions,
  handlers: {
    module(invocation) {
      console.log(invocation.action.payload);
    },
  },
});

const action = resolveGpuInteractionActionAtUv(actions, {
  u: 0.2,
  v: 0.24,
  width: 420,
  height: 760,
});

if (action) {
  registry.invokeAction(action, { source: "pointer" });
}

registry.invokePhrase("open mcc core", { source: "voice" });

const rendererHit = resolveGpuInteractionActionFromHit(
  [
    {
      ...actions[0],
      entityId: "entity:module-nav",
    },
  ],
  {
    kind: "surface",
    entityId: "entity:module-nav",
    surfaceId: "system-nav",
    uv: { u: 0.2, v: 0.24 },
  },
  {
    width: 420,
    height: 760,
  }
);

if (rendererHit.action) {
  registry.invokeAction(rendererHit.action, {
    source: "pointer",
    point: rendererHit.point,
    uv: rendererHit.uv,
  });
}
```

`resolveGpuInteractionActionFromHit` returns the renderer hit classification unchanged. Non-action cases such as `miss`, `environment`, `emissive`, and `transparent` remain explicit so consumers can branch on them without guessing from `undefined` coordinates alone.

## Governance

- ADRs: [docs/adrs](./docs/adrs)
- TDRs: [docs/tdrs](./docs/tdrs)
- Design notes: [docs/design](./docs/design)

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run pack:check
```

## Release

The canonical source repository is [`Plasius-LTD/gpu-interaction`](https://github.com/Plasius-LTD/gpu-interaction).

- Pull requests and pushes to `main` run `.github/workflows/ci.yml`.
- npm publication is allowed only through `.github/workflows/cd.yml` on `main`.
- `cd.yml` requires the `production` environment and an `NPM_TOKEN` secret.
- Version changes should be committed to `main` before dispatching the publish workflow.
