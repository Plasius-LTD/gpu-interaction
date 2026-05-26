# ADR-0001: GPU Interaction Package Scope

## Status

Accepted

## Context

GPU-rendered UI can be textured onto real 3D surfaces, so DOM event targeting is no longer the source of truth for interaction. The same visual action may be activated by pointer hit testing, gaze, a script call, or voice recognition.

## Decision

Create `@plasius/gpu-interaction` as a browser-safe, renderer-agnostic package that owns action descriptors, surface-local hit regions, script dispatch routing, and phrase matching.

The package does not own ray casting, camera projection, input-device capture, or arbitrary code execution. Consumers map their renderer-specific hit result to a surface-local UV or pixel point, then pass the matched action to this package's registry.

## Consequences

- `gpu-renderer`, WebGPU demos, XR surfaces, and pitch viewers can share the same interaction contract.
- Voice activation can invoke the same action descriptors as pointer and gaze input.
- Consumers remain responsible for state changes and security policy by registering explicit handlers for action kinds.
