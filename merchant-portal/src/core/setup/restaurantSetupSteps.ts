import { useMemo } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  deriveRestaurantReadiness,
  type RestaurantReadiness,
} from "../restaurant/deriveRestaurantReadiness";
import { runtimeToRestaurant } from "../restaurant/runtimeToRestaurant";

export type SetupStepId =
  | "identity"
  | "location"
  | "schedule"
  | "menu"
  | "publication";

export type SetupStepGroupId =
  | "BASICS"
  | "SERVICES"
  | "PAYMENTS"
  | "MENU"
  | "PUBLISHING";

export interface SetupStep {
  id: SetupStepId;
  label: string;
  route: string;
  group: SetupStepGroupId;
}

export type SetupStepState = "RED" | "YELLOW" | "GREEN";

export interface SetupStepWithState extends SetupStep {
  state: SetupStepState;
}

export const SETUP_STEPS: SetupStep[] = [
  {
    id: "identity",
    label: "Nome & identidade",
    route: "/admin/config/general",
    group: "BASICS",
  },
  {
    id: "location",
    label: "Local & endereço",
    route: "/admin/config/ubicaciones",
    group: "BASICS",
  },
  {
    id: "schedule",
    label: "Serviços & horários",
    route: "/admin/config",
    group: "SERVICES",
  },
  {
    id: "menu",
    label: "Cardápio",
    route: "/menu-builder",
    group: "MENU",
  },
  {
    id: "publication",
    label: "Publicação",
    route: "/app/publish",
    group: "PUBLISHING",
  },
];

export function classifyStepState(
  step: SetupStep,
  readiness: RestaurantReadiness
): SetupStepState {
  const reasons = new Set(readiness.blockingReasons);

  switch (step.id) {
    case "identity":
      return reasons.has("Identidade") ? "RED" : "GREEN";
    case "location":
      return reasons.has("Local & Moeda") ? "RED" : "GREEN";
    case "menu":
      return reasons.has("Cardápio") ? "RED" : "GREEN";
    case "publication":
      return reasons.has("Publicação") ? "RED" : "GREEN";
    case "schedule":
      // Horários ainda não fazem parte do schema canónico → neutro.
      return "YELLOW";
    default:
      return "YELLOW";
  }
}

export function stepsWithState(
  readiness: RestaurantReadiness
): SetupStepWithState[] {
  return SETUP_STEPS.map((step) => ({
    ...step,
    state: classifyStepState(step, readiness),
  }));
}

export function useRestaurantReadinessForSetup(): RestaurantReadiness {
  const { runtime } = useRestaurantRuntime();

  return useMemo(() => {
    const ownerUserId = runtime.restaurant_id ?? "runtime-owner-unavailable";
    let ownerPhone = "runtime-owner-phone-unavailable";
    if (typeof window !== "undefined") {
      try {
        ownerPhone =
          window.localStorage.getItem("chefiapp_owner_phone") ?? ownerPhone;
      } catch {
        // ignore
      }
    }

    const restaurant = runtimeToRestaurant({
      runtime,
      ownerUserId,
      ownerPhone,
    });

    return deriveRestaurantReadiness(restaurant);
  }, [runtime]);
}

