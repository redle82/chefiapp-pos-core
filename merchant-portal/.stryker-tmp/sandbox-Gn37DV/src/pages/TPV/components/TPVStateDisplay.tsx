import {
  AlertCircle,
  FilterX,
  Search,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import { EmptyState } from "../../../ui/design-system/EmptyState";

interface TPVStateDisplayProps {
  type: "empty_orders" | "empty_search" | "error" | "generic";
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  compact?: boolean;
}

/**
 * TPVStateDisplay — Specialized states for the TPV environment.
 * Reduces cognitive load by providing clear visual context when data is missing or failed.
 */
export const TPVStateDisplay: React.FC<TPVStateDisplayProps> = ({
  type,
  icon: CustomIcon,
  title,
  description,
  onRetry,
  actionLabel,
  compact = false,
}) => {
  const configs = {
    empty_orders: {
      icon: ShoppingBag,
      title: "Aguardando Pedidos",
      description:
        "O restaurante está operacional. Novos pedidos aparecerão aqui automaticamente.",
    },
    empty_search: {
      icon: Search,
      title: "Nenhum produto encontrado",
      description: "Tente ajustar os filtros ou o termo de busca.",
    },
    error: {
      icon: AlertCircle,
      title: "Falha na Sincronização",
      description: "Não foi possível carregar os dados. Verifique a conexão.",
    },
    generic: {
      icon: FilterX,
      title: "Sem dados",
      description: "Não há informações para exibir neste momento.",
    },
  };

  const config = configs[type] || configs.generic;
  const Icon = CustomIcon || config.icon;

  return (
    <div
      className={`tpv-state-display ${
        compact ? "tpv-state-display--compact" : ""
      }`}
    >
      <EmptyState
        icon={<Icon size={compact ? 32 : 48} strokeWidth={1.5} />}
        title={title || config.title}
        description={description || config.description}
        action={
          onRetry
            ? {
                label:
                  actionLabel ||
                  (type === "error" ? "Tentar Novamente" : "Recarregar"),
                onClick: onRetry,
              }
            : undefined
        }
      />

      <style>{`
        .tpv-state-display {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: tpvFadeIn 0.3s ease-out;
        }

        .tpv-state-display--compact {
          padding: 24px;
        }

        .tpv-state-display--compact .empty-state {
          padding: 24px 0;
          min-height: auto;
        }

        .tpv-state-display--compact .empty-state__title {
          font-size: 16px;
        }

        .tpv-state-display--compact .empty-state__description {
          font-size: 13px;
          max-width: 240px;
        }

        @keyframes tpvFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
