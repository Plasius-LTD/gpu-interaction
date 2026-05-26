export const GPU_INTERACTION_PACKAGE = "@plasius/gpu-interaction";

export type GpuInteractionActionKind = string;

export type GpuInteractionSource =
  | "pointer"
  | "gaze"
  | "voice"
  | "script"
  | "keyboard"
  | "programmatic";

export interface GpuInteractionPoint {
  readonly x: number;
  readonly y: number;
}

export interface GpuInteractionUvPoint {
  readonly u: number;
  readonly v: number;
}

export interface GpuInteractionSurfaceSize {
  readonly width: number;
  readonly height: number;
}

export interface GpuInteractionBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface GpuInteractionActionDescriptor<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly id: string;
  readonly kind: GpuInteractionActionKind;
  readonly label: string;
  readonly script?: string;
  readonly payload?: TPayload;
  readonly phrases?: readonly string[];
}

export interface GpuInteractionSurfaceAction<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> extends GpuInteractionActionDescriptor<TPayload> {
  readonly surfaceId: string;
  readonly bounds: GpuInteractionBounds;
}

export interface GpuInteractionInvokeContext {
  readonly source: GpuInteractionSource;
  readonly phrase?: string;
  readonly script?: string;
  readonly point?: GpuInteractionPoint;
  readonly uv?: GpuInteractionUvPoint;
  readonly timestamp?: number;
}

export interface GpuInteractionInvocation<
  TAction extends GpuInteractionActionDescriptor = GpuInteractionActionDescriptor,
> {
  readonly action: TAction;
  readonly source: GpuInteractionSource;
  readonly phrase?: string;
  readonly script?: string;
  readonly point?: GpuInteractionPoint;
  readonly uv?: GpuInteractionUvPoint;
  readonly timestamp: number;
}

export type GpuInteractionHandler<
  TAction extends GpuInteractionActionDescriptor = GpuInteractionActionDescriptor,
> = (invocation: GpuInteractionInvocation<TAction>) => void | boolean;

export interface GpuInteractionRegistryOptions<
  TAction extends GpuInteractionActionDescriptor = GpuInteractionActionDescriptor,
> {
  readonly actions?: readonly TAction[];
  readonly handlers?: Readonly<Record<string, GpuInteractionHandler<TAction>>>;
  readonly onInvoke?: GpuInteractionHandler<TAction>;
  readonly clock?: () => number;
}

export interface GpuInteractionRegistry<
  TAction extends GpuInteractionActionDescriptor = GpuInteractionActionDescriptor,
> {
  readonly getActions: () => readonly TAction[];
  readonly setActions: (actions: readonly TAction[]) => void;
  readonly registerHandler: (
    kind: GpuInteractionActionKind,
    handler: GpuInteractionHandler<TAction>
  ) => () => void;
  readonly resolveActionId: (actionId: string) => TAction | undefined;
  readonly resolveScript: (script: string) => TAction | undefined;
  readonly resolvePhrase: (phrase: string) => TAction | undefined;
  readonly invokeAction: (action: TAction, context: GpuInteractionInvokeContext) => boolean;
  readonly invokeActionId: (actionId: string, context: GpuInteractionInvokeContext) => boolean;
  readonly invokeScript: (script: string, context?: Partial<GpuInteractionInvokeContext>) => boolean;
  readonly invokePhrase: (phrase: string, context?: Partial<GpuInteractionInvokeContext>) => boolean;
}

export const gpuInteractionVoicePrefixes = Object.freeze([
  "open",
  "select",
  "choose",
  "run",
  "trigger",
  "activate",
]);

export function normalizeGpuInteractionPhrase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function resolveGpuInteractionActionAtPoint<
  TAction extends GpuInteractionSurfaceAction,
>(
  actions: readonly TAction[],
  point: GpuInteractionPoint
): TAction | undefined {
  return actions.find((action) => {
    const bounds = action.bounds;
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  });
}

export function resolveGpuInteractionActionAtUv<
  TAction extends GpuInteractionSurfaceAction,
>(
  actions: readonly TAction[],
  uv: GpuInteractionUvPoint & GpuInteractionSurfaceSize
): TAction | undefined {
  return resolveGpuInteractionActionAtPoint(actions, {
    x: uv.u * uv.width,
    y: uv.v * uv.height,
  });
}

export function resolveGpuInteractionActionByPhrase<
  TAction extends GpuInteractionActionDescriptor,
>(
  phrase: string,
  actions: readonly TAction[]
): TAction | undefined {
  const normalizedPhrase = normalizeGpuInteractionPhrase(phrase);

  if (!normalizedPhrase) {
    return undefined;
  }

  return actions.find((action) => {
    const candidates = [
      action.id,
      action.label,
      action.script ?? "",
      ...(action.phrases ?? []),
      ...gpuInteractionVoicePrefixes.map((prefix) => `${prefix} ${action.label}`),
    ].map(normalizeGpuInteractionPhrase);

    return candidates.includes(normalizedPhrase);
  });
}

export function createGpuInteractionRegistry<
  TAction extends GpuInteractionActionDescriptor = GpuInteractionActionDescriptor,
>(
  options: GpuInteractionRegistryOptions<TAction> = {}
): GpuInteractionRegistry<TAction> {
  let actions = [...(options.actions ?? [])];
  const handlers = new Map<string, GpuInteractionHandler<TAction>>(
    Object.entries(options.handlers ?? {})
  );
  const clock = options.clock ?? Date.now;

  function resolveActionId(actionId: string): TAction | undefined {
    return actions.find((action) => action.id === actionId);
  }

  function resolveScript(script: string): TAction | undefined {
    return actions.find((action) => action.script === script);
  }

  function resolvePhrase(phrase: string): TAction | undefined {
    return resolveGpuInteractionActionByPhrase(phrase, actions);
  }

  function invokeAction(action: TAction, context: GpuInteractionInvokeContext): boolean {
    const invocation: GpuInteractionInvocation<TAction> = {
      action,
      source: context.source,
      timestamp: context.timestamp ?? clock(),
      ...(context.phrase === undefined ? {} : { phrase: context.phrase }),
      ...(context.script === undefined ? {} : { script: context.script }),
      ...(context.point === undefined ? {} : { point: context.point }),
      ...(context.uv === undefined ? {} : { uv: context.uv }),
    };
    options.onInvoke?.(invocation);
    handlers.get(action.kind)?.(invocation);
    return true;
  }

  return {
    getActions: () => actions,
    setActions(nextActions) {
      actions = [...nextActions];
    },
    registerHandler(kind, handler) {
      handlers.set(kind, handler);
      return () => {
        if (handlers.get(kind) === handler) {
          handlers.delete(kind);
        }
      };
    },
    resolveActionId,
    resolveScript,
    resolvePhrase,
    invokeAction,
    invokeActionId(actionId, context) {
      const action = resolveActionId(actionId);
      return action ? invokeAction(action, context) : false;
    },
    invokeScript(script, context = {}) {
      const action = resolveScript(script);
      return action
        ? invokeAction(action, { ...context, source: context.source ?? "script", script })
        : false;
    },
    invokePhrase(phrase, context = {}) {
      const action = resolvePhrase(phrase);
      return action
        ? invokeAction(action, { ...context, source: context.source ?? "voice", phrase })
        : false;
    },
  };
}
