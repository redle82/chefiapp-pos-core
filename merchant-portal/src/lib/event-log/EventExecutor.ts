/**
 * EventExecutor (Top-level re-export)
 *
 * Canonical implementation lives in core-engine/event-log/EventExecutor.ts.
 * This file exists so that packages referencing "../../event-log/EventExecutor"
 * from outside core-engine resolve correctly.
 */
export { EventExecutor } from "../core-engine/event-log/EventExecutor";
