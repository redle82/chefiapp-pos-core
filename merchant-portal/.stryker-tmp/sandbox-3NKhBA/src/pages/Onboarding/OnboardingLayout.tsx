/**
 * OnboardingLayout - Layout Principal do Setup Tree
 *
 * Layout com sidebar fixa + conteúdo dinâmico à direita
 * Inspirado no UX do GloriaFood
 */
// @ts-nocheck


import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SetupSidebar } from "../../components/onboarding/SetupSidebar";
import {
  OnboardingProvider,
  useOnboarding,
  type SetupSection,
} from "../../context/OnboardingContext";
import styles from "./OnboardingLayout.module.css";
import { IdentitySection } from "./sections/IdentitySection";
import { IntegrationsSection } from "./sections/IntegrationsSection";
import { InventorySection } from "./sections/InventorySection";
import { LocationSection } from "./sections/LocationSection";
import { MenuSection } from "./sections/MenuSection";
import { PaymentsSection } from "./sections/PaymentsSection";
import { PeopleSection } from "./sections/PeopleSection";
import { PublishSection } from "./sections/PublishSection";
import { ScheduleSection } from "./sections/ScheduleSection";

const SECTION_COMPONENTS: Record<SetupSection, React.ComponentType> = {
  identity: IdentitySection,
  location: LocationSection,
  schedule: ScheduleSection,
  menu: MenuSection,
  inventory: InventorySection,
  people: PeopleSection,
  payments: PaymentsSection,
  integrations: IntegrationsSection,
  publish: PublishSection,
};

function OnboardingContent() {
  const { state, setCurrentSection } = useOnboarding();
  const [searchParams, setSearchParams] = useSearchParams();

  // Ler seção da URL
  useEffect(() => {
    const sectionParam = searchParams.get("section") as SetupSection | null;
    if (
      sectionParam &&
      Object.keys(SECTION_COMPONENTS).includes(sectionParam)
    ) {
      // URL manda na primeira carga
      setCurrentSection(sectionParam);
      return;
    }

    // Se não houver seção na URL, usar a primeira não completa UMA vez
    const firstIncomplete = Object.entries(state.sections).find(
      ([_, s]) => s.status !== "COMPLETE",
    )?.[0] as SetupSection | undefined;

    if (firstIncomplete) {
      setCurrentSection(firstIncomplete);
      setSearchParams({ section: firstIncomplete });
    } else {
      // Se tudo completo, mostrar publicação
      setCurrentSection("publish");
      setSearchParams({ section: "publish" });
    }
    // Este efeito deve rodar apenas na montagem.
    // Depois disso, quem manda é a sidebar + mudanças explícitas de seção.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualizar URL quando seção mudar
  useEffect(() => {
    if (state.currentSection) {
      setSearchParams({ section: state.currentSection }, { replace: true });
    }
  }, [state.currentSection, setSearchParams]);

  const CurrentSectionComponent = state.currentSection
    ? SECTION_COMPONENTS[state.currentSection]
    : null;

  return (
    <div className={styles.layoutRoot}>
      {/* Sidebar Fixa */}
      <SetupSidebar />

      {/* Conteúdo Dinâmico */}
      <div className={styles.contentArea}>
        {CurrentSectionComponent ? (
          <CurrentSectionComponent />
        ) : (
          <div className={styles.emptyState}>
            <p>Selecione uma seção para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
