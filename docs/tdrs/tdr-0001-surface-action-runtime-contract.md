# TDR-0001: Surface Action Runtime Contract

## Direction

The runtime contract has three layers:

- action descriptors: stable IDs, labels, scripts, payloads, and optional voice phrases
- surface descriptors: action descriptors plus pixel bounds within a rasterized or textured surface
- registry dispatch: explicit action-kind handlers invoked by pointer, gaze, script, keyboard, voice, or programmatic sources

## Hit Testing

Renderer-specific code should resolve 3D geometry to either:

- a surface-local pixel point, then call `resolveGpuInteractionActionAtPoint`
- a UV coordinate plus surface size, then call `resolveGpuInteractionActionAtUv`

The package stays independent from world matrices and camera projection so it can be used by WebGPU, XR, Canvas fallback, and future renderers.

## Scripting

Script strings are command identifiers, not executable code. The registry resolves a script string to a known action descriptor and invokes the registered handler for that action kind.

## Voice

Voice activation should pass recognized text into `invokePhrase`. Phrase matching uses normalized labels, explicit `phrases`, script strings, and common activation prefixes. Consumers can layer richer speech recognition or NLU above the same action descriptor contract.
