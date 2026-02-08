import { BootstrapPage } from "../BootstrapPage";

/**
 * RestaurantMinimalSetupPage
 *
 * Setup mínimo do restaurante após autenticação (telefone/email).
 * Contém apenas os campos essenciais (nome + país/moeda) e, ao concluir,
 * redireciona sempre para o Dashboard config-first.
 *
 * Nota: reutiliza a lógica existente de BootstrapPage, mas fixa o destino
 * de sucesso em `/dashboard` para alinhar com o modelo telefone → Dashboard.
 */
export function RestaurantMinimalSetupPage() {
  return <BootstrapPage successNextPath="/dashboard" />;
}

