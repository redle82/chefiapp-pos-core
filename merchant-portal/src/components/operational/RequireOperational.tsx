/**
 * RequireOperational - Gate de Segurança para Apps de Operação
 *
 * Só permite acesso ao TPV, KDS e Caixa se o restaurante estiver Publicado.
 * Se não estiver, mostra uma tela informativa (GloriaFood model).
 */

import React, { useContext } from "react";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import {
  GlobalBlockedView,
  GlobalLoadingView,
} from "../../ui/design-system/components";

interface Props {
  children: React.ReactNode;
}

export function RequireOperational({ children }: Props) {
  const context = useContext(RestaurantRuntimeContext);
  const runtime = context?.runtime;

  if (!context || runtime?.loading) {
    return (
      <GlobalLoadingView
        message="Verificando estado operacional..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  // Se não estiver publicado, bloquear com tela amigável (componente partilhado)
  if (!runtime.isPublished) {
    return (
      <GlobalBlockedView
        title="Sistema não operacional"
        description="As ferramentas de operação (TPV, KDS) só ficam disponíveis após publicar o restaurante e ter faturação ativa. Aceda ao portal de gestão para configurar."
        action={{ label: "Ir para o Portal de Gestão", to: "/dashboard" }}
      />
    );
  }

  return <>{children}</>;
}
