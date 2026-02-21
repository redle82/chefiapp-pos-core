import { useLocation } from "react-router-dom";
import { BootstrapPage } from "../BootstrapPage";

/**
 * RestaurantMinimalSetupPage
 *
 * Setup mínimo do restaurante após autenticação (telefone/email).
 * Contém apenas os campos essenciais (nome + país/moeda) e, ao concluir,
 * redireciona para o destino indicado (default: Dashboard).
 *
 * Quando vindo do Onboarding assistente (location.state.fromOnboarding),
 * successNextPath é /app/activation (Centro de Ativação).
 */
export function RestaurantMinimalSetupPage() {
  const location = useLocation();
  const state = location.state as
    | { successNextPath?: string; fromOnboarding?: boolean }
    | undefined;
  const successNextPath =
    state?.successNextPath ??
    (state?.fromOnboarding ? "/app/activation" : "/dashboard");
  return <BootstrapPage successNextPath={successNextPath} />;
}

