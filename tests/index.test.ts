import { describe, expect, it } from "vitest";
import {
  createGpuInteractionRegistry,
  normalizeGpuInteractionPhrase,
  resolveGpuInteractionActionByEntityId,
  resolveGpuInteractionActionFromHit,
  resolveGpuInteractionActionAtPoint,
  resolveGpuInteractionActionAtUv,
  resolveGpuInteractionActionByPhrase,
  resolveGpuInteractionPointFromUv,
  type GpuInteractionResolvedHit,
  type GpuInteractionRenderHit,
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

const rendererActions: readonly GpuInteractionSurfaceAction[] = [
  {
    ...actions[0]!,
    entityId: "entity:nav-panel",
  },
  {
    ...actions[1]!,
    entityIds: ["entity:track-button", "entity:quest-context"],
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

  it("converts UV coordinates into stable pixel coordinates", () => {
    expect(
      resolveGpuInteractionPointFromUv({
        u: 0.0525,
        v: 0.1513,
        width: 420,
        height: 760,
      })
    ).toEqual({
      x: 22.05,
      y: 114.988,
    });
  });

  it("can resolve actions directly from renderer entity ids", () => {
    expect(resolveGpuInteractionActionByEntityId(rendererActions, "entity:nav-panel")?.id).toBe(
      "module:mcc-core"
    );
    expect(
      resolveGpuInteractionActionByEntityId(rendererActions, "entity:track-button")?.id
    ).toBe("command:track");
    expect(
      resolveGpuInteractionActionByEntityId(rendererActions, "entity:quest-context", "context")
        ?.id
    ).toBe("command:track");
    expect(resolveGpuInteractionActionByEntityId(rendererActions, "missing-entity")).toBeUndefined();
  });

  it("returns explicit renderer-hit outcomes for hit, miss, environment, emissive, and transparent cases", () => {
    const miss = resolveGpuInteractionActionFromHit(rendererActions, { kind: "miss" });
    const environment = resolveGpuInteractionActionFromHit(rendererActions, {
      kind: "environment",
      point: { x: 128, y: 64 },
    });
    const emissive = resolveGpuInteractionActionFromHit(rendererActions, {
      kind: "emissive",
      entityId: "entity:track-button",
    });
    const transparent = resolveGpuInteractionActionFromHit(rendererActions, {
      kind: "transparent",
      point: { x: 24, y: 430 },
      entityId: "entity:track-button",
    });
    const entityHit = resolveGpuInteractionActionFromHit(rendererActions, {
      kind: "surface",
      entityId: "entity:track-button",
    });
    const uvHit = resolveGpuInteractionActionFromHit(
      rendererActions,
      {
        kind: "surface",
        surfaceId: "nav",
        uv: { u: 0.0525, v: 0.1513 },
      },
      { width: 420, height: 760 }
    );

    expectResolvedHit(miss, { hitKind: "miss" });
    expectResolvedHit(environment, {
      hitKind: "environment",
      point: { x: 128, y: 64 },
    });
    expectResolvedHit(emissive, {
      hitKind: "emissive",
      entityId: "entity:track-button",
    });
    expectResolvedHit(transparent, {
      hitKind: "transparent",
      entityId: "entity:track-button",
      point: { x: 24, y: 430 },
    });
    expectResolvedHit(entityHit, {
      hitKind: "surface",
      entityId: "entity:track-button",
      actionId: "command:track",
    });
    expectResolvedHit(uvHit, {
      hitKind: "surface",
      actionId: "module:mcc-core",
      point: {
        x: 22.05,
        y: 114.988,
      },
      uv: { u: 0.0525, v: 0.1513 },
      surfaceId: "nav",
    });
  });
});

function expectResolvedHit(
  actual: GpuInteractionResolvedHit<GpuInteractionSurfaceAction>,
  expected: {
    readonly hitKind: GpuInteractionRenderHit["kind"];
    readonly actionId?: string;
    readonly entityId?: string;
    readonly point?: { readonly x: number; readonly y: number };
    readonly uv?: { readonly u: number; readonly v: number };
    readonly surfaceId?: string;
  }
): void {
  expect(actual.hit.kind).toBe(expected.hitKind);
  expect(actual.action?.id).toBe(expected.actionId);
  expect(actual.entityId).toEqual(expected.entityId);
  expect(actual.point).toEqual(expected.point);
  expect(actual.uv).toEqual(expected.uv);
  expect(actual.surfaceId).toEqual(expected.surfaceId);
}
