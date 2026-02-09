/**
 * ERRO-005 Fix: Página de status do pedido (web)
 *
 * Permite que o cliente acompanhe o status do pedido em tempo real.
 * Rota: /public/:slug/status/:orderId
 */

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WebOrderingService } from "../../core/services/WebOrderingService";

interface OrderStatus {
  status: string;
  message: string;
}

const STATUS_ICONS: Record<string, string> = {
  new: "📋",
  OPEN: "👨‍🍳",
  IN_PREP: "🔥",
  READY: "✅",
  PAID: "💳",
  CANCELLED: "❌",
  PENDING: "⏳",
  ACCEPTED: "✅",
  REJECTED: "❌",
  UNKNOWN: "❓",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  OPEN: "bg-yellow-100 text-yellow-700",
  IN_PREP: "bg-orange-100 text-orange-700",
  READY: "bg-green-100 text-green-700",
  PAID: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  UNKNOWN: "bg-gray-100 text-gray-700",
};

export const OrderStatusPage: React.FC = () => {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Polling para atualizar status em tempo real
  useEffect(() => {
    if (!orderId) {
      setError("ID do pedido não encontrado");
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const result = await WebOrderingService.checkStatus(orderId);
        setStatus(result);
        setError(null);
      } catch (e) {
        console.error("Error checking order status:", e);
        setError("Erro ao verificar status do pedido");
      } finally {
        setLoading(false);
      }
    };

    // Verificar imediatamente
    checkStatus();

    // Polling a cada 5 segundos se pedido ainda não finalizado
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Carregando status do pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Erro</h1>
          <p className="text-neutral-600">{error || "Status não disponível"}</p>
        </div>
      </div>
    );
  }

  const icon = STATUS_ICONS[status.status] || "❓";
  const colorClass =
    STATUS_COLORS[status.status] || "bg-gray-100 text-gray-700";

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Status do Pedido
          </h1>
          <p className="text-neutral-600">Acompanhe seu pedido em tempo real</p>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          <div className="text-center">
            <div className="text-8xl mb-4">{icon}</div>
            <div
              className={`inline-block px-4 py-2 rounded-full font-semibold mb-4 ${colorClass}`}
            >
              {status.message}
            </div>
            <p className="text-sm text-neutral-500">
              Pedido #{orderId?.slice(0, 8)}
            </p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">
            Etapas do Pedido
          </h2>
          <div className="space-y-4">
            {[
              { key: "new", label: "Pedido Recebido", icon: "📋" },
              { key: "OPEN", label: "Em Preparação", icon: "👨‍🍳" },
              { key: "IN_PREP", label: "Cozinha Preparando", icon: "🔥" },
              { key: "READY", label: "Pronto para Retirada", icon: "✅" },
              { key: "PAID", label: "Finalizado", icon: "💳" },
            ].map((step) => {
              const isActive = status.status === step.key;
              const isCompleted =
                ["new", "OPEN", "IN_PREP", "READY", "PAID"].indexOf(
                  status.status,
                ) >
                ["new", "OPEN", "IN_PREP", "READY", "PAID"].indexOf(step.key);

              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-neutral-200 text-neutral-400"
                    }`}
                  >
                    {isCompleted ? "✓" : step.icon}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                          ? "text-green-600"
                          : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-neutral-500 mb-4">
            Esta página atualiza automaticamente a cada 5 segundos
          </p>
          <button
            onClick={() => (window.location.href = `/public/${slug}/menu`)}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  );
};
