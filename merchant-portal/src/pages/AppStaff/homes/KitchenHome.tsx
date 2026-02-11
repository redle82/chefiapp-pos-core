/**
 * KitchenHome — Home da Cozinha.
 *
 * Pergunta-chave: "O que eu produzo agora?"
 *
 * Home = KDS em foco total. Nada mais.
 * ❌ NÃO mostra botões de navegação (KDS, Tarefas, Turno — já estão no rodapé).
 */

import KitchenDisplay from "../../TPV/KDS/KitchenDisplay";

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
      <KitchenDisplay />
    </div>
  );
}
