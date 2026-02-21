/**
 * KitchenHome — Home da Cozinha.
 *
 * Pergunta-chave: "O que eu produzo agora?"
 *
 * Home = KDS em foco total. Nada mais.
 * ❌ NÃO mostra botões de navegação (KDS, Tarefas, Turno — já estão no rodapé).
 *
 * Uses StaffMiniKDS for mobile-responsive layout.
 */

import { StaffMiniKDS } from "../components/StaffMiniKDS";

export function KitchenHome() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <StaffMiniKDS />
    </div>
  );
}
