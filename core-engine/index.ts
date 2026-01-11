/**
 * Core Engine Entry Point
 * 
 * Exports the complete CORE ENGINE with:
 * - Repository (InMemoryRepo)
 * - Guards (business rules)
 * - Effects (data mutations)
 * - Executor (state machine execution)
 */

export { InMemoryRepo } from "./repo/InMemoryRepo";
export type {
  Session,
  Order,
  OrderItem,
  Payment,
} from "./repo/types";

export { CoreExecutor } from "./executor/CoreExecutor";
export type {
  TransitionRequest,
  TransitionResult,
} from "./executor/CoreExecutor";

export { guards, executeGuard } from "./guards";
export { effects, executeEffect } from "./effects";

