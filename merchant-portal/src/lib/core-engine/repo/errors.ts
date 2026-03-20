/**
 * Repository Errors
 * 
 * Custom error classes for repository operations.
 */

/**
 * TASK-1.3.2: ConcurrencyConflictError
 * 
 * Thrown when a commit detects that the entity version has changed
 * since the transaction snapshot was taken (optimistic concurrency conflict).
 */
export class ConcurrencyConflictError extends Error {
  public readonly entityId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;
  public readonly entityType: string;

  constructor(
    entityType: string,
    entityId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    const message = `Concurrency conflict: ${entityType} ${entityId} was modified. Expected version ${expectedVersion}, but current version is ${actualVersion}.`;
    super(message);
    
    this.name = 'ConcurrencyConflictError';
    this.entityType = entityType;
    this.entityId = entityId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConcurrencyConflictError);
    }
  }
}
