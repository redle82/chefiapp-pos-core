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
import cashRegisterMachine from "../../state-machines/cash-register.state-machine.json";
import { InMemoryRepo } from "../repo/InMemoryRepo";
import { executeGuard, type GuardContext } from "../guards";
import { executeEffect, type EffectContext } from "../effects";
import { ConcurrencyConflictError } from "../repo/errors";

const machines = {
  SESSION: sessionMachine as any,
  ORDER: orderMachine as any,
  PAYMENT: paymentMachine as any,
  CASH_REGISTER: cashRegisterMachine as any,
} as const;

export interface TransitionRequest {
  tenantId: string; // [TENANCY-CONTRACT] Required for StreamId and Persistence Scope
  entity: "SESSION" | "ORDER" | "PAYMENT" | "CASH_REGISTER";
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
  conflict?: boolean; // TASK-1.3.3: Indicates concurrency conflict
}

export class CoreExecutor {
  constructor(private repo: InMemoryRepo) { }

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

    // TASK-1.4.2: Para PAYMENT:CONFIRMED, travar tanto Payment quanto Order
    // Determinar quais entidades travar
    let lockIds: string[] = [entityId];

    if (entity === "PAYMENT" && event === "CONFIRMED") {
      // Buscar order_id do payment antes de travar
      // Precisamos buscar sem lock primeiro para obter o order_id
      let orderId: string | null = null;

      // Tentar obter order_id do contexto primeiro
      if (context.order_id) {
        orderId = context.order_id as string;
      } else {
        // Buscar payment para obter order_id
        // Nota: Esta busca não está protegida por lock, mas é apenas leitura
        // e o order_id não muda após criação do payment
        for (const oid of Array.from((this.repo as any).orders.keys()) as string[]) {
          const payments = this.repo.getPayments(oid);
          const payment = payments.find((p) => p.id === entityId);
          if (payment) {
            orderId = payment.order_id;
            break;
          }
        }
      }

      if (orderId) {
        // TASK-1.4.2: Travar ambos Payment e Order (ordem determinística)
        lockIds = [entityId, orderId].sort();
      }
    }

    // Use lock múltiplo para prevenir modificações concorrentes
    return await this.repo.withLock(lockIds, async () => {
      // Begin transaction
      const txId = this.repo.beginTransaction();

      let currentState: string | null = null;
      try {
        // Get current state from repository
        currentState = await this.getCurrentState(entity, entityId);
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
              txId, // TASK-1.1.7: Pass txId to effects
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

        // TASK-1.3.3: Detect and handle ConcurrencyConflictError
        if (error instanceof ConcurrencyConflictError) {
          return {
            success: false,
            previousState: currentState || "",
            newState: currentState || "",
            conflict: true,
            error: `Concurrency conflict: ${error.message}`,
          };
        }

        return {
          success: false,
          previousState: currentState || "",
          newState: currentState || "",
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
      case "CASH_REGISTER": {
        const register = this.repo.getCashRegister(entityId);
        return register?.state || null;
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
        // TASK-1.2.4: getOrder returns clone, but we need to preserve changes already in transaction
        // Check if order is already in transaction changes
        const tx = (this.repo as any).transactions.get(txId);
        const key = `ORDER:${entityId}`;
        let order: any;

        if (tx && tx.changes.has(key)) {
          // Use order from transaction (preserves changes from effects like calculateTotal)
          order = tx.changes.get(key);
        } else {
          // Get fresh clone if not in transaction yet
          order = this.repo.getOrder(entityId);
        }

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
      case "CASH_REGISTER": {
        const register = this.repo.getCashRegister(entityId);
        if (register) {
          register.state = newState as any;
          if (newState === "OPEN") {
            register.opened_at = new Date();
          }
          this.repo.saveCashRegister(register, txId);
        }
        break;
      }
    }
  }
}
