# Surface Interaction Contract

`@plasius/gpu-interaction` treats every interactive 3D UI element as data:

- `id`: durable action ID for capture tooling and tests
- `kind`: handler route such as `module`, `selection`, or `command`
- `label`: user-facing text
- `script`: stable command string for scripted demos and automation
- `payload`: structured state required by the consumer
- `phrases`: optional voice aliases
- `bounds`: pixel-space hit region within the rendered surface
- `entityId` / `entityIds`: optional renderer entity bindings for selection buffers or hit-buffer lookups

The consumer owns the visual renderer and converts pointer/gaze/ray hits into surface coordinates. The package owns matching those coordinates to actions and dispatching them through explicit handlers.

When a renderer exposes normalized selection metadata, the package can also consume:

- explicit hit classifications: `surface`, `miss`, `environment`, `emissive`, `transparent`
- source pixel coordinates or surface-local UV coordinates
- optional `entityId` values for direct action lookup or surface scoping
