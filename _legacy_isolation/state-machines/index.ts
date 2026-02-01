/**
 * State Machine Executor
 * 
 * Executes state transitions based on JSON state machine definitions.
 * Source of truth: JSON files in this directory.
 */

import sessionMachine from "./session.state-machine.json";
import orderMachine from "./order.state-machine.json";
import paymentMachine from "./payment.state-machine.json";
import type {
  SessionState,
  OrderState,
  PaymentState,
  TransitionRequest,
  TransitionResult,
} from "./types";

// ============================================================================
// TYPE-SAFE MACHINE LOADERS
// ============================================================================

const machines = {
  SESSION: sessionMachine as any,
  ORDER: orderMachine as any,
  PAYMENT: paymentMachine as any,
} as const;

// ============================================================================
// STATE MACHINE EXECUTOR
// ============================================================================

export class StateMachineExecutor {
  /**
   * Execute a state transition
   */
  static async transition(
    request: TransitionRequest
  ): Promise<TransitionResult> {
    const machine = machines[request.entity];
    if (!machine) {
      return {
        success: false,
        previousState: "",
        newState: "",
        error: `Unknown entity: ${request.entity}`,
      };
    }

    // Get current state (would come from database in real implementation)
    // For now, we assume it's passed in context
    const currentState =
      (request.context?.currentState as string) || machine.initial;

    const stateDef = machine.states[currentState];
    if (!stateDef) {
      return {
        success: false,
        previousState: currentState,
        newState: currentState,
        error: `Invalid current state: ${currentState}`,
      };
    }

    // Check if terminal state
    if (stateDef.terminal) {
      return {
        success: false,
        previousState: currentState,
        newState: currentState,
        error: `Cannot transition from terminal state: ${currentState}`,
      };
    }

    // Check if transition exists
    const transitions = stateDef.transitions || {};
    const transition = transitions[request.event];
    if (!transition) {
      return {
        success: false,
        previousState: currentState,
        newState: currentState,
        error: `Invalid transition: ${currentState} --[${request.event}]--> ?`,
      };
    }

    // Execute guards (would be implemented based on business rules)
    const guardFailures: string[] = [];
    if (transition.guards) {
      for (const guardName of transition.guards) {
        const guardPassed = await this.executeGuard(
          request.entity,
          guardName,
          request
        );
        if (!guardPassed) {
          guardFailures.push(guardName);
        }
      }
    }

    if (guardFailures.length > 0) {
      return {
        success: false,
        previousState: currentState,
        newState: currentState,
        guardFailures,
        error: `Guard failures: ${guardFailures.join(", ")}`,
      };
    }

    // Execute effects (would be implemented based on business rules)
    if (transition.effects) {
      for (const effectName of transition.effects) {
        await this.executeEffect(request.entity, effectName, request);
      }
    }

    return {
      success: true,
      previousState: currentState,
      newState: transition.target,
    };
  }

  /**
   * Execute a guard (business rule validation)
   */
  private static async executeGuard(
    entity: string,
    guardName: string,
    request: TransitionRequest
  ): Promise<boolean> {
    // In real implementation, these would check:
    // - Database state
    // - Business rules
    // - External conditions

    const machine = machines[entity as keyof typeof machines];
    const guard = machine?.guards?.[guardName];

    if (!guard) {
      // Guard not defined = pass (fail-safe)
      return true;
    }

    // Placeholder: In real implementation, execute actual guard logic
    // For now, return true to allow transition
    // TODO: Implement actual guard logic based on 03_CORE_CONSTRAINTS.md
    return true;
  }

  /**
   * Execute an effect (side effect of transition)
   */
  private static async executeEffect(
    entity: string,
    effectName: string,
    request: TransitionRequest
  ): Promise<void> {
    // In real implementation, these would:
    // - Update database
    // - Calculate totals
    // - Lock records
    // - Send notifications

    const machine = machines[entity as keyof typeof machines];
    const effect = machine?.effects?.[effectName];

    if (!effect) {
      return;
    }

    // Placeholder: In real implementation, execute actual effect logic
    // TODO: Implement actual effect logic
  }

  /**
   * Get valid transitions for current state
   */
  static getValidTransitions(
    entity: "SESSION" | "ORDER" | "PAYMENT",
    currentState: string
  ): string[] {
    const machine = machines[entity];
    const stateDef = machine.states[currentState];
    if (!stateDef || stateDef.terminal) {
      return [];
    }
    return Object.keys(stateDef.transitions || {});
  }

  /**
   * Check if state is terminal
   */
  static isTerminalState(
    entity: "SESSION" | "ORDER" | "PAYMENT",
    state: string
  ): boolean {
    const machine = machines[entity];
    const stateDef = machine.states[state];
    return stateDef?.terminal === true;
  }

  /**
   * Get initial state
   */
  static getInitialState(
    entity: "SESSION" | "ORDER" | "PAYMENT"
  ): string {
    return machines[entity].initial;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { machines };
export default StateMachineExecutor;

