/**
 * useOperationalActivation — Derives which activation steps remain
 * before the restaurant is fully operational.
 *
 * Reads from SetupProgressEngine + runtime context to determine:
 * - Which steps are done
 * - Which is the current active step
 * - Whether activation mode should show or normal TPV
 *
 * Ref: Blueprint ChefiApp — Ordem-Mãe Única (Sprint 4)
 */

import { useMemo } from "react";
import { useSetupProgressFromRuntime } from "./useSetupProgressFromRuntime";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivationStep {
  id: string;
  label: string;
  description: string;
  status: "done" | "active" | "pending";
  /** Route or action to execute this step */
  action: { type: "navigate"; to: string } | { type: "internal"; key: string };
}

export interface OperationalActivationResult {
  /** true when all steps are done — show normal TPV */
  isOperational: boolean;
  /** All activation steps with current status */
  steps: ActivationStep[];
  /** The current active step (first non-done), or null if all done */
  currentStep: ActivationStep | null;
  /** Overall progress 0-100 for the activation phase */
  progress: number;
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const ACTIVATION_STEPS = [
  {
    id: "shift",
    label: "Abrir caixa",
    description: "Abre o primeiro turno e define o fundo de caixa inicial",
    stateKey: "shift_opened" as const,
    action: { type: "internal" as const, key: "open-shift" },
  },
  {
    id: "printer",
    label: "Testar impressora",
    description: "Verifica que a impressora de recibos está ligada e funcional",
    stateKey: null, // checked via separate flag
    action: { type: "navigate" as const, to: "/op/tpv/printers" },
  },
  {
    id: "kds",
    label: "Ligar ecrã de cozinha",
    description: "Configura e liga pelo menos um KDS para receber pedidos",
    stateKey: "kds_connected" as const,
    action: { type: "navigate" as const, to: "/op/tpv/screens" },
  },
  {
    id: "staff",
    label: "Convidar equipa",
    description: "Adiciona pelo menos um membro da equipa ao restaurante",
    stateKey: "staff_app_connected" as const,
    action: { type: "navigate" as const, to: "/admin/config/employees" },
  },
  {
    id: "test",
    label: "Pedido de teste",
    description: "Cria um pedido teste para validar todo o fluxo operacional",
    stateKey: "test_passed" as const,
    action: { type: "internal" as const, key: "test-order" },
  },
] as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOperationalActivation(): OperationalActivationResult {
  const setupProgress = useSetupProgressFromRuntime();

  const result = useMemo(() => {
    const { state, isOperational } = setupProgress;

    // Map setup state to which activation steps are done
    const STATES_ORDER = [
      "shift_opened",
      "kds_connected",
      "staff_app_connected",
      "test_passed",
      "operational",
    ];

    // Find the index of current state in the activation progression
    const stateIdx = STATES_ORDER.indexOf(state);
    const isInActivationPhase = stateIdx >= 0 || state === "tpv_paired";

    // Build steps with status
    let foundActive = false;
    const steps: ActivationStep[] = ACTIVATION_STEPS.map((def) => {
      let status: "done" | "active" | "pending";

      if (isOperational) {
        status = "done";
      } else if (def.stateKey) {
        const keyIdx = STATES_ORDER.indexOf(def.stateKey);
        if (stateIdx > keyIdx) {
          status = "done";
        } else if (stateIdx === keyIdx || (!foundActive && isInActivationPhase)) {
          status = "active";
          foundActive = true;
        } else {
          status = "pending";
        }
      } else {
        // Steps without stateKey (printer) — skip for now, mark as done
        status = foundActive ? "pending" : "done";
      }

      return {
        id: def.id,
        label: def.label,
        description: def.description,
        status,
        action: def.action as ActivationStep["action"],
      };
    });

    const doneCount = steps.filter((s) => s.status === "done").length;
    const progress = Math.round((doneCount / steps.length) * 100);
    const currentStep = steps.find((s) => s.status === "active") ?? null;

    return {
      isOperational,
      steps,
      currentStep,
      progress,
    };
  }, [setupProgress]);

  return result;
}
