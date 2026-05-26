import { describe, expect, it } from "vitest";
import {
  createGpuInteractionRegistry,
  normalizeGpuInteractionPhrase,
  resolveGpuInteractionActionAtPoint,
  resolveGpuInteractionActionAtUv,
  resolveGpuInteractionActionByPhrase,
  type GpuInteractionSurfaceAction,
} from "../src/index.js";

const actions: readonly GpuInteractionSurfaceAction[] = [
  {
    id: "module:mcc-core",
    kind: "module",
    label: "MCC Core",
    script: 'system.openModule("mcc-core")',
    surfaceId: "nav",
    bounds: { x: 20, y: 100, width: 300, height: 90 },
    payload: { moduleId: "mcc-core" },
    phrases: ["open command core"],
  },
  {
    id: "command:track",
    kind: "command",
    label: "Track",
    script: 'system.command("Track", "quest-starfall-archive")',
    surfaceId: "context",
    bounds: { x: 16, y: 420, width: 240, height: 40 },
    payload: { command: "Track" },
  },
];

describe("@plasius/gpu-interaction", () => {
  it("normalizes voice phrases for stable matching", () => {
    expect(normalizeGpuInteractionPhrase("  Open: MCC-Core! ")).toBe("open mcc core");
  });

  it("resolves surface actions from pixel and UV coordinates", () => {
    expect(resolveGpuInteractionActionAtPoint(actions, { x: 25, y: 110 })?.id).toBe(
      "module:mcc-core"
    );
    expect(
      resolveGpuInteractionActionAtUv(actions, {
        u: 0.0525,
        v: 0.1513,
        width: 420,
        height: 760,
      })?.id
    ).toBe("module:mcc-core");
    expect(resolveGpuInteractionActionAtPoint(actions, { x: 5, y: 5 })).toBeUndefined();
  });

  it("matches phrases against labels, aliases, and scripts", () => {
    expect(resolveGpuInteractionActionByPhrase("activate mcc core", actions)?.id).toBe(
      "module:mcc-core"
    );
    expect(resolveGpuInteractionActionByPhrase("open command core", actions)?.id).toBe(
      "module:mcc-core"
    );
    expect(
      resolveGpuInteractionActionByPhrase(
        'system.command("Track", "quest-starfall-archive")',
        actions
      )?.id
    ).toBe("command:track");
  });

  it("dispatches action IDs, scripts, and voice phrases through the same registry", () => {
    const invoked: string[] = [];
    const registry = createGpuInteractionRegistry({
      actions,
      clock: () => 123,
      handlers: {
        module(invocation) {
          invoked.push(`${invocation.source}:${invocation.timestamp}:${invocation.action.id}`);
        },
      },
      onInvoke(invocation) {
        invoked.push(`event:${invocation.action.kind}`);
      },
    });

    expect(registry.invokeActionId("module:mcc-core", { source: "pointer" })).toBe(true);
    expect(registry.invokeScript('system.openModule("mcc-core")')).toBe(true);
    expect(registry.invokePhrase("open command core")).toBe(true);
    expect(registry.invokeActionId("missing", { source: "programmatic" })).toBe(false);

    expect(invoked).toEqual([
      "event:module",
      "pointer:123:module:mcc-core",
      "event:module",
      "script:123:module:mcc-core",
      "event:module",
      "voice:123:module:mcc-core",
    ]);
  });

  it("supports replacing actions and unregistering handlers", () => {
    const invoked: string[] = [];
    const registry = createGpuInteractionRegistry<GpuInteractionSurfaceAction>();
    const unregister = registry.registerHandler("command", (invocation) => {
      invoked.push(invocation.action.id);
    });

    registry.setActions([actions[1]!]);
    expect(registry.invokePhrase("run track")).toBe(true);
    unregister();
    expect(registry.invokePhrase("run track")).toBe(true);
    expect(invoked).toEqual(["command:track"]);
  });
});
