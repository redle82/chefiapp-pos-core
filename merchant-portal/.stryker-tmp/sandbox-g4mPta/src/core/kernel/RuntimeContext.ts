/**
 * RuntimeContext — Re-export Barrel
 *
 * The canonical module lives at core/runtime/RuntimeContext.ts.
 * This file re-exports for backward compatibility with kernel imports.
 *
 * @see ../runtime/RuntimeContext.ts
 */

export {
  runtimeMode as RUNTIME_MODE,
  assertNoMock,
  assertProduction,
  assertValidRestaurantId,
  isProduction,
  isTrial,
  logRuntimeStatus,
  validateDemoFlags,
  type RuntimeMode,
} from "../runtime/RuntimeContext";

/** Alias: kernel callers used isProductionMode(), runtime uses isProduction */
export { isProduction as isProductionMode } from "../runtime/RuntimeContext";
