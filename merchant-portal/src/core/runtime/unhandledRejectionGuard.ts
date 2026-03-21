export interface UnhandledRejectionClassification {
  suppress: boolean;
  code: "external-runtime-payload" | "unhandled-rejection";
  message: string;
  stack?: string;
}

interface ClassifyOptions {
  appOrigin?: string;
}

function toErrorLike(reason: unknown): { message: string; stack?: string } {
  if (reason instanceof Error) {
    return { message: reason.message, stack: reason.stack };
  }

  if (typeof reason === "string") {
    return { message: reason };
  }

  try {
    return { message: JSON.stringify(reason) };
  } catch {
    return { message: String(reason) };
  }
}

export function classifyUnhandledRejection(
  reason: unknown,
  options: ClassifyOptions = {},
): UnhandledRejectionClassification {
  const normalized = toErrorLike(reason);
  const stack = normalized.stack ?? "";
  const message = normalized.message ?? "";

  const looksLikePayloadUndefined =
    message.includes("reading 'payload'") ||
    message.includes('reading "payload"');

  const looksLikeBrowserExtension =
    /chrome-extension:\/\//i.test(stack) ||
    /moz-extension:\/\//i.test(stack) ||
    /safari-extension:\/\//i.test(stack);

  const stackOrigins = Array.from(
    stack.matchAll(/https?:\/\/[^/\s)]+/gi),
    (match) => match[0].toLowerCase(),
  );
  const appOrigin = options.appOrigin?.toLowerCase();
  const hasForeignHttpOrigin =
    !!appOrigin && stackOrigins.some((origin) => origin !== appOrigin);

  const looksLikeExternalRuntime =
    looksLikeBrowserExtension || hasForeignHttpOrigin;

  if (looksLikePayloadUndefined && looksLikeExternalRuntime) {
    return {
      suppress: true,
      code: "external-runtime-payload",
      message,
      stack: normalized.stack,
    };
  }

  return {
    suppress: false,
    code: "unhandled-rejection",
    message,
    stack: normalized.stack,
  };
}

let installed = false;

function isSuppressionAllowedForMode(mode: string): boolean {
  return /^(development|dev|local|test)$/i.test(mode);
}

export function installUnhandledRejectionGuard(context: {
  route: string;
  mode: string;
  restaurantId?: string;
}) {
  if (typeof window === "undefined" || installed) return;

  window.addEventListener("unhandledrejection", (event) => {
    const classification = classifyUnhandledRejection(event.reason, {
      appOrigin: window.location.origin,
    });

    if (classification.suppress && isSuppressionAllowedForMode(context.mode)) {
      console.error("[RuntimeGuard] Suppressed external unhandled rejection", {
        code: classification.code,
        route: context.route,
        mode: context.mode,
        restaurantId: context.restaurantId ?? null,
        message: classification.message,
        stack: classification.stack,
      });
      event.preventDefault();
      return;
    }

    console.error("[RuntimeGuard] Unhandled promise rejection", {
      code: classification.code,
      route: context.route,
      mode: context.mode,
      restaurantId: context.restaurantId ?? null,
      message: classification.message,
      stack: classification.stack,
    });
  });

  installed = true;
}
