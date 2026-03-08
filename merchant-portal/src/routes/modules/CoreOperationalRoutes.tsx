import { Route } from "react-router-dom";
import { RequireOperational } from "../../components/operational/RequireOperational";
import { DebugTPV } from "../../pages/DebugTPV";
import { InventoryStockMinimal } from "../../pages/InventoryStock/InventoryStockMinimal";
import { MenuBuilderMinimal } from "../../pages/MenuBuilder/MenuBuilderMinimal";
import { OperacaoMinimal } from "../../pages/Operacao/OperacaoMinimal";
import { RunbookCorePage } from "../../pages/RunbookCorePage";
import { ShoppingListMinimal } from "../../pages/ShoppingList/ShoppingListMinimal";
import { TaskSystemMinimal } from "../../pages/TaskSystem/TaskSystemMinimal";
import { ErrorBoundary } from "../../ui/design-system/ErrorBoundary";
import { GlobalBlockedView } from "../../ui/design-system/components/GlobalBlockedView";

export const CoreOperationalRoutesFragment = (
  <>
    <Route path="/app/runbook-core" element={<RunbookCorePage />} />
    <Route path="/menu-builder" element={<MenuBuilderMinimal />} />
    <Route
      path="/operacao"
      element={
        <ErrorBoundary
          context="Pedidos"
          fallback={
            <GlobalBlockedView
              title="Pedidos indisponíveis"
              description="O módulo de pedidos encontrou um erro. Recarregue a tela para continuar o atendimento."
              action={{
                label: "Recarregar",
                onClick: () => window.location.reload(),
              }}
            />
          }
        >
          <RequireOperational>
            <OperacaoMinimal />
          </RequireOperational>
        </ErrorBoundary>
      }
    />
    <Route path="/inventory-stock" element={<InventoryStockMinimal />} />
    <Route path="/task-system" element={<TaskSystemMinimal />} />
    <Route path="/shopping-list" element={<ShoppingListMinimal />} />
    <Route
      path="/tpv-test"
      element={
        <RequireOperational surface="TPV">
          <DebugTPV />
        </RequireOperational>
      }
    />
  </>
);
