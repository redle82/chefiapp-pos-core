/**
 * FiscalAlertBadge - Alerta Visual de External ID Pendente
 *
 * Exibe badge vermelho com contagem de pedidos fiscais
 * aguardando External ID ou que falharam.
 *
 * Impossível de ignorar:
 * - Badge vermelho sempre visível quando há pendências
 * - Toast persistente (não some automaticamente)
 * - Link direto para lista de pendências
 */

import { AlertCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isDevStableMode } from "../core/runtime/devStableMode";

interface FiscalAlertData {
  pending: number;
  failed: number;
  total: number;
}

interface FiscalAlertBadgeProps {
  restaurantId: string;
  apiBase?: string;
}

export function FiscalAlertBadge({
  restaurantId,
  apiBase = "/api",
}: FiscalAlertBadgeProps) {
  const [alertData, setAlertData] = useState<FiscalAlertData | null>(null);
  const [_isVisible, _setIsVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const errorCountRef = useRef(0);
  const isPollingDisabledRef = useRef(false);

  useEffect(() => {
    if (!restaurantId) return;

    // DEV_STABLE_MODE: Não fazer polling para reduzir ruído de transporte
    if (isDevStableMode()) {
      return;
    }

    // Se já desabilitamos polling devido a muitos erros, não tentar novamente
    if (isPollingDisabledRef.current) {
      return;
    }

    const fetchPendingExternalIds = async () => {
      try {
        // Timeout de 5 segundos para evitar requisições pendentes
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `${apiBase}/fiscal/pending-external-ids?restaurantId=${restaurantId}`,
          {
            headers: {
              "x-restaurant-id": restaurantId,
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        // Se erro 500 ou outro erro, incrementar contador de erros
        if (!response.ok) {
          errorCountRef.current += 1;

          // Se muitos erros consecutivos (3+), desabilitar polling para evitar spam
          if (errorCountRef.current >= 3) {
            console.warn(
              "[FiscalAlertBadge] Too many errors, disabling polling",
              {
                errorCount: errorCountRef.current,
                status: response.status,
              },
            );
            isPollingDisabledRef.current = true;
            return;
          }
          return;
        }

        // Reset contador de erros em caso de sucesso
        errorCountRef.current = 0;
        isPollingDisabledRef.current = false;

        const data = await response.json();
        setAlertData(data);

        // Mostrar toast se houver pendências E não estiver visível ainda
        if (data.total > 0 && !showToast) {
          setShowToast(true);
        }

        // Esconder toast se não houver mais pendências
        if (data.total === 0 && showToast) {
          setShowToast(false);
        }
      } catch (error: any) {
        // Ignorar erros de abort (timeout)
        if (error.name === "AbortError") {
          console.warn("[FiscalAlertBadge] Request timeout");
          return;
        }

        errorCountRef.current += 1;

        // Se muitos erros consecutivos, desabilitar polling
        if (errorCountRef.current >= 3) {
          console.warn(
            "[FiscalAlertBadge] Too many errors, disabling polling",
            {
              errorCount: errorCountRef.current,
              error: error.message,
            },
          );
          isPollingDisabledRef.current = true;
          return;
        }

        console.error(
          "[FiscalAlertBadge] Error fetching pending external IDs:",
          error,
        );
      }
    };

    // Poll a cada 30 segundos
    fetchPendingExternalIds();
    const interval = setInterval(fetchPendingExternalIds, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [restaurantId, apiBase, showToast]);

  const totalPending = (alertData?.pending || 0) + (alertData?.failed || 0);

  if (totalPending === 0) {
    return null; // Não mostrar nada se não houver pendências
  }

  const handleClick = () => {
    navigate("/app/fiscal/pending");
  };

  const handleDismissToast = () => {
    setShowToast(false);
    // Re-mostrar após 5 minutos se ainda houver pendências
    setTimeout(() => {
      if (totalPending > 0) {
        setShowToast(true);
      }
    }, 5 * 60 * 1000);
  };

  return (
    <>
      {/* Badge fixo no canto superior direito */}
      <div
        className="fixed top-4 right-4 z-50 cursor-pointer"
        onClick={handleClick}
        role="button"
        aria-label={`${totalPending} pedidos fiscais pendentes`}
      >
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-red-700 transition-colors">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">
            {totalPending} Fiscal{" "}
            {totalPending === 1 ? "Pendente" : "Pendentes"}
          </span>
          {(alertData?.failed ?? 0) > 0 && (
            <span className="bg-red-800 px-2 py-1 rounded text-xs">
              {alertData?.failed} Falhou
            </span>
          )}
        </div>
      </div>

      {/* Toast persistente (não some automaticamente) */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="bg-red-600 text-white p-4 rounded-lg shadow-xl border-l-4 border-red-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Atenção: Fiscal Pendente</h3>
                </div>
                <p className="text-sm text-red-100">
                  {totalPending} pedido{totalPending === 1 ? "" : "s"}{" "}
                  aguardando External ID do provedor fiscal.
                  {(alertData?.failed ?? 0) > 0 && (
                    <span className="block mt-1 font-semibold">
                      {alertData?.failed} pedido
                      {alertData?.failed === 1 ? "" : "s"} falhou após múltiplas
                      tentativas.
                    </span>
                  )}
                </p>
                <button
                  onClick={handleClick}
                  className="mt-3 bg-red-800 hover:bg-red-900 px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Ver Detalhes
                </button>
              </div>
              <button
                onClick={handleDismissToast}
                className="text-red-200 hover:text-white transition-colors"
                aria-label="Fechar alerta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
