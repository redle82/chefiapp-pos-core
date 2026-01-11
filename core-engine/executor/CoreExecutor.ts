/**
 * Core Executor
 * 
 * Executes state transitions with:
 * - State machine validation (from JSON)
 * - Guard execution (business rules)
 * - Effect execution (data mutations)
 * - Transaction management (atomicity)
 * - Locking (concurrency control)
 */

import sessionMachine from "../../state-machines/session.state-machine.json";
import orderMachine from "../../state-machines/order.state-machine.json";
import paymentMachine from "../../state-machines/payment.state-machine.json";
import { InMemoryRepo } from "../repo/InMemoryRepo";
import { executeGuard, type GuardContext } from "../guards";
import { executeEffect, type EffectContext } from "../effects";

const machines = {
  SESSION: sessionMachine as any,
  ORDER: orderMachine as any,
  PAYMENT: paymentMachine as any,
} as const;

export interface TransitionRequest {
  entity: "SESSION" | "ORDER" | "PAYMENT";
  entityId: string;
  event: string;
  context?: Record<string, any>;
}

export interface TransitionResult {
  success: boolean;
  previousState: string;
  newState: string;
  error?: string;
  guardFailures?: string[];
}

export class CoreExecutor {
  constructor(private repo: InMemoryRepo) {}

  async transition(
    request: TransitionRequest
  ): Promise<TransitionResult> {
    const { entity, entityId, event, context = {} } = request;

    // Get state machine
    const machine = machines[entity];
    if (!machine) {
      return {
        success: false,
        previousState: "",
        newState: "",
        error: `Unknown entity: ${entity}`,
      };
    }

    // Use lock to prevent concurrent modifications
    return await this.repo.withLock(entityId, async () => {
      // Begin transaction
      const txId = this.repo.beginTransaction();

      try {
        // Get current state from repository
        const currentState = await this.getCurrentState(entity, entityId);
        if (!currentState) {
          this.repo.rollback(txId);
          return {
            success: false,
            previousState: "",
            newState: "",
            error: `${entity} ${entityId} not found`,
          };
        }

        // Get state definition
        const stateDef = machine.states[currentState];
        if (!stateDef) {
          this.repo.rollback(txId);
          return {
            success: false,
            previousState: currentState,
            newState: currentState,
            error: `Invalid current state: ${currentState}`,
          };
        }

        // Check if terminal state
        if (stateDef.terminal) {
          this.repo.rollback(txId);
          return {
            success: false,
            previousState: currentState,
            newState: currentState,
            error: `Cannot transition from terminal state: ${currentState}`,
          };
        }

        // Check if transition exists
        const transitions = stateDef.transitions || {};
        const transition = transitions[event];
        if (!transition) {
          this.repo.rollback(txId);
          return {
            success: false,
            previousState: currentState,
            newState: currentState,
            error: `Invalid transition: ${currentState} --[${event}]--> ?`,
          };
        }

        // Execute guards
        const guardFailures: string[] = [];
        if (transition.guards) {
          for (const guardName of transition.guards) {
            const guardContext: GuardContext = {
              repo: this.repo,
              entityId,
              currentState,
              targetState: transition.target,
              ...context,
            };

            const guardResult = await executeGuard(guardName, guardContext);
            if (!guardResult.passed) {
              guardFailures.push(guardName);
              // Continue checking all guards to report all failures
            }
          }
        }

        if (guardFailures.length > 0) {
          this.repo.rollback(txId);
          return {
            success: false,
            previousState: currentState,
            newState: currentState,
            guardFailures,
            error: `Guard failures: ${guardFailures.join(", ")}`,
          };
        }

        // Execute effects
        if (transition.effects) {
          for (const effectName of transition.effects) {
            const effectContext: EffectContext = {
              repo: this.repo,
              entityId,
              currentState,
              newState: transition.target,
              ...context,
            };

            try {
              await executeEffect(effectName, effectContext);
            } catch (error: any) {
              this.repo.rollback(txId);
              return {
                success: false,
                previousState: currentState,
                newState: currentState,
                error: `Effect ${effectName} failed: ${error.message}`,
              };
            }
          }
        }

        // Update state
        await this.updateState(entity, entityId, transition.target, txId);

        // ATOMIC: Handle PAYMENT:CONFIRMED → ORDER:PAID transition BEFORE commit
        // This ensures both payment confirmation and order transition happen atomically
        if (entity === "PAYMENT" && transition.target === "CONFIRMED") {
          // Find payment by searching all orders
          let payment: any = null;
          for (const orderId of Array.from((this.repo as any).orders.keys()) as string[]) {
            const payments = this.repo.getPayments(orderId);
            const found = payments.find((p) => p.id === entityId);
            if (found) {
              payment = found;
              break;
            }
          }

          if (payment) {
            const order = this.repo.getOrder(payment.order_id);
            if (order && order.state === "LOCKED") {
              // Get all confirmed payments INCLUDING this one (already updated in tx)
              const allPayments = this.repo.getPayments(payment.order_id);
              // The current payment state is still PENDING in repo, but will be CONFIRMED after commit
              // So we need to manually count it
              const confirmedPayments = allPayments.filter(
                (p) => p.state === "CONFIRMED" || p.id === entityId
              );
              const totalPaidCents = confirmedPayments.reduce(
                (sum, p) => sum + p.amount_cents,
                0
              );

              // If total paid >= order total, transition order to PAID atomically
              if (order.total_cents && totalPaidCents >= order.total_cents) {
                order.state = "PAID";
                this.repo.saveOrder(order, txId);
              }
            }
          }
        }

        // Commit transaction (includes both payment confirmation AND order transition if applicable)
        await this.repo.commit(txId);

        return {
          success: true,
          previousState: currentState,
          newState: transition.target,
        };
      } catch (error: any) {
        this.repo.rollback(txId);
        return {
          success: false,
          previousState: "",
          newState: "",
          error: `Transition failed: ${error.message}`,
        };
      }
    });
  }

  private async getCurrentState(
    entity: string,
    entityId: string
  ): Promise<string | null> {
    switch (entity) {
      case "SESSION": {
        const session = this.repo.getSession(entityId);
        return session?.state || null;
      }
      case "ORDER": {
        const order = this.repo.getOrder(entityId);
        return order?.state || null;
      }
      case "PAYMENT": {
        // Find payment by searching all orders
        for (const orderId of Array.from((this.repo as any).orders.keys()) as string[]) {
          const payments = this.repo.getPayments(orderId);
          const payment = payments.find((p) => p.id === entityId);
          if (payment) {
            return payment.state;
          }
        }
        return null;
      }
      default:
        return null;
    }
  }

  private async updateState(
    entity: string,
    entityId: string,
    newState: string,
    txId: string
  ): Promise<void> {
    switch (entity) {
      case "SESSION": {
        const session = this.repo.getSession(entityId);
        if (session) {
          session.state = newState as any;
          if (newState === "ACTIVE") {
            session.opened_at = new Date();
          } else if (newState === "CLOSED") {
            session.closed_at = new Date();
          }
          this.repo.saveSession(session, txId);
        }
        break;
      }
      case "ORDER": {
        const order = this.repo.getOrder(entityId);
        if (order) {
          order.state = newState as any;
          this.repo.saveOrder(order, txId);
        }
        break;
      }
      case "PAYMENT": {
        // Find payment by searching all orders
        let payment: any = null;
        for (const orderId of Array.from((this.repo as any).orders.keys()) as string[]) {
          const payments = this.repo.getPayments(orderId);
          const found = payments.find((p) => p.id === entityId);
          if (found) {
            payment = found;
            break;
          }
        }

        if (payment) {
          payment.state = newState as any;
          this.repo.savePayment(payment, txId);
        }
        break;
      }
    }
  }
}

