/**
 * OnboardingContext - Gerenciamento de Estado do Setup Tree
 *
 * Gerencia o estado global do processo de onboarding do restaurante,
 * incluindo status de cada seção e validações.
 */
// @ts-nocheck


import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRestaurantRuntime } from "../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../core/identity/useRestaurantIdentity";

export type SetupSection =
  | "identity"
  | "location"
  | "schedule"
  | "menu"
  | "inventory"
  | "people"
  | "payments"
  | "integrations"
  | "publish";

export type SetupStatus = "NOT_STARTED" | "INCOMPLETE" | "COMPLETE";

export interface SetupSectionStatus {
  section: SetupSection;
  status: SetupStatus;
  lastUpdated?: Date;
}

export interface OnboardingState {
  restaurantId: string | null;
  sections: Record<SetupSection, SetupSectionStatus>;
  currentSection: SetupSection | null;
  isPublishing: boolean;
  /**
   * Estado de formulário da seção de identidade.
   * Mantido aqui para sobreviver à troca de seções.
   */
  identityForm: {
    name: string;
    type: "RESTAURANT" | "BAR" | "HOTEL" | "BEACH_CLUB" | "CAFE" | "OTHER";
    country: string;
    timezone: string;
    currency: string;
    locale: string;
  };
}

interface OnboardingContextType {
  state: OnboardingState;
  setCurrentSection: (section: SetupSection) => void;
  updateSectionStatus: (section: SetupSection, status: SetupStatus) => void;
  /**
   * Atualiza apenas a parte de identidade do formulário de onboarding.
   * Usado pelas telas como IdentitySection para não manter estado local.
   */
  updateIdentityForm: (patch: Partial<OnboardingState["identityForm"]>) => void;
  validateSection: (section: SetupSection) => Promise<boolean>;
  canPublish: () => boolean;
  publishRestaurant: () => Promise<void>;
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const INITIAL_SECTIONS: Record<SetupSection, SetupSectionStatus> = {
  identity: { section: "identity", status: "NOT_STARTED" },
  location: { section: "location", status: "NOT_STARTED" },
  schedule: { section: "schedule", status: "NOT_STARTED" },
  menu: { section: "menu", status: "NOT_STARTED" },
  inventory: { section: "inventory", status: "NOT_STARTED" },
  people: { section: "people", status: "NOT_STARTED" },
  payments: { section: "payments", status: "NOT_STARTED" },
  integrations: { section: "integrations", status: "NOT_STARTED" },
  publish: { section: "publish", status: "NOT_STARTED" },
};

const INITIAL_STATE: OnboardingState = {
  restaurantId: null,
  sections: INITIAL_SECTIONS,
  currentSection: null,
  isPublishing: false,
  identityForm: {
    name: "",
    type: "RESTAURANT",
    country: "",
    timezone: "",
    currency: "BRL",
    locale: "pt-BR",
  },
};

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const isInitialLoadRef = useRef(true);

  // Atualizar restaurantId quando identity mudar
  useEffect(() => {
    if (identity.id && identity.id !== state.restaurantId) {
      setState((prev) => ({ ...prev, restaurantId: identity.id }));
    }
  }, [identity.id, state.restaurantId]);

  // Nota: A sincronização com RestaurantRuntimeContext será feita
  // nas seções individuais que têm acesso direto ao contexto

  // Definir saveState ANTES de usar no useEffect
  const saveState = useCallback(async () => {
    try {
      // Sempre salvar no localStorage (para não perder progresso)
      localStorage.setItem("chefiapp_onboarding_state", JSON.stringify(state));
    } catch (error) {
      console.error("Erro ao salvar estado:", error);
    }
  }, [state]);

  const loadState = useCallback(async () => {
    try {
      const saved = localStorage.getItem("chefiapp_onboarding_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          ...parsed,
          sections: {
            ...INITIAL_SECTIONS,
            ...parsed.sections,
          },
        });
      }
      isInitialLoadRef.current = false;
    } catch (error) {
      console.error("Erro ao carregar estado:", error);
      isInitialLoadRef.current = false;
    }
  }, []);

  // Carregar estado do localStorage ao montar
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Sincronizar status das seções com o Runtime (verdade vinda do banco).
  // Assim, a tela de Publicação não fica presa em um estado antigo salvo no localStorage.
  useEffect(() => {
    if (!runtime.setup_status) return;

    setState((prev) => {
      const nextSections: Record<SetupSection, SetupSectionStatus> = {
        ...prev.sections,
      };

      (Object.keys(runtime.setup_status) as SetupSection[]).forEach(
        (section) => {
          const isComplete = runtime.setup_status[section];
          const current = nextSections[section];
          const desiredStatus: SetupStatus = isComplete
            ? "COMPLETE"
            : current?.status ?? "NOT_STARTED";

          if (!current || current.status !== desiredStatus) {
            nextSections[section] = {
              ...(current ?? { section, status: "NOT_STARTED" as SetupStatus }),
              section,
              status: desiredStatus,
              lastUpdated: new Date(),
            };
          }
        },
      );

      return {
        ...prev,
        sections: nextSections,
      };
    });
  }, [runtime.setup_status]);

  // Salvar estado automaticamente quando mudar (mas não no carregamento inicial)
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      saveState();
    }
  }, [state, saveState]);

  const setCurrentSection = useCallback((section: SetupSection) => {
    setState((prev) => ({ ...prev, currentSection: section }));
  }, []);

  const updateSectionStatus = useCallback(
    (section: SetupSection, status: SetupStatus) => {
      // Atualizar estado local
      setState((prev) => ({
        ...prev,
        sections: {
          ...prev.sections,
          [section]: {
            ...prev.sections[section],
            status,
            lastUpdated: new Date(),
          },
        },
      }));

      // Nota: A persistência no banco será feita pelas seções individuais
      // que têm acesso direto ao RestaurantRuntimeContext
    },
    [],
  );

  const updateIdentityForm = useCallback(
    (patch: Partial<OnboardingState["identityForm"]>) => {
      setState((prev) => ({
        ...prev,
        identityForm: {
          ...prev.identityForm,
          ...patch,
        },
      }));
    },
    [],
  );

  const validateSection = useCallback(
    async (section: SetupSection): Promise<boolean> => {
      // TODO: Implementar validações específicas por seção
      // Por enquanto, retorna baseado no status atual
      return state.sections[section].status === "COMPLETE";
    },
    [state.sections],
  );

  const canPublish = useCallback((): boolean => {
    // Requisitos mínimos para publicação:
    // - Identidade COMPLETE
    // - Localização COMPLETE
    // - Horários COMPLETE
    // - Cardápio COMPLETE (mín. 3 produtos)
    // - Pessoas COMPLETE (mín. 1 gerente)

    const required: SetupSection[] = [
      "identity",
      "location",
      "schedule",
      "menu",
      "people",
    ];

    return required.every((section) => {
      return state.sections[section].status === "COMPLETE";
    });
  }, [state.sections]);

  const publishRestaurant = useCallback(async () => {
    if (!canPublish()) {
      throw new Error(
        "Não é possível publicar. Complete as seções obrigatórias primeiro.",
      );
    }

    // Usar RestaurantRuntimeContext para publicação real
    // Isso será feito no PublishSection que tem acesso direto ao contexto
    // Aqui apenas marcamos como publicando
    setState((prev) => ({ ...prev, isPublishing: true }));

    // A lógica real está em RestaurantRuntimeContext.publishRestaurant
    // que será chamado pelo PublishSection
  }, [canPublish]);

  const value: OnboardingContextType = {
    state,
    setCurrentSection,
    updateSectionStatus,
    updateIdentityForm,
    validateSection,
    canPublish,
    publishRestaurant,
    loadState,
    saveState,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboarding deve ser usado dentro de OnboardingProvider",
    );
  }
  return context;
}

export function useOnboardingOptional() {
  return useContext(OnboardingContext);
}
