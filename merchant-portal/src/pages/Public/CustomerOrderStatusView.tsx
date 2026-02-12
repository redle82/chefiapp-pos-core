/**
 * CUSTOMER ORDER STATUS VIEW — Status Individual do Cliente
 *
 * REGRAS:
 * - Cliente vê APENAS o pedido dele
 * - Estados simplificados (sem tempo, sem atraso)
 * - Nunca mostra outros pedidos
 * - Nunca mostra tempo exato
 * - Nunca mostra atraso
 *
 * Estados permitidos:
 * - Recebido (OPEN)
 * - Em preparo (PREPARING/IN_PREP)
 * - Quase pronto (ALMOST_READY)
 * - Pronto (READY)
 * - Entregue (DELIVERED)
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type {
  CoreOrder,
  CoreOrderItem,
} from "../../core-boundary/docker-core/types";
import { readOrderById } from "../../core-boundary/readers/OrderReader";
import { GlobalLoadingView } from "../../ui/design-system/components";

type CustomerStatus =
  | "received"
  | "preparing"
  | "almost_ready"
  | "ready"
  | "delivered";

interface CustomerStatusView {
  status: CustomerStatus;
  message: string;
  icon: string;
  color: string;
}

// Validação mínima de UUID para evitar chamadas inválidas ao core (ex.: "<orderId>" em DEV)
function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mapOrderStatusToCustomerStatus(
  orderStatus: string,
): CustomerStatusView {
  switch (orderStatus) {
    case "OPEN":
      return {
        status: "received",
        message: "Pedido recebido",
        icon: "✅",
        color: "#22c55e",
      };
    case "PREPARING":
    case "IN_PREP":
      return {
        status: "preparing",
        message: "Em preparo",
        icon: "🍳",
        color: "#3b82f6",
      };
    case "READY":
      return {
        status: "ready",
        message: "Pronto",
        icon: "🔔",
        color: "#22c55e",
      };
    case "CLOSED":
      return {
        status: "delivered",
        message: "Entregue",
        icon: "✅",
        color: "#6b7280",
      };
    default:
      return {
        status: "preparing",
        message: "Em preparo",
        icon: "🍳",
        color: "#3b82f6",
      };
  }
}

export function CustomerOrderStatusView() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<
    (CoreOrder & { items: CoreOrderItem[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("ID do pedido não encontrado");
      setLoading(false);
      return;
    }

    if (!isValidUUID(orderId)) {
      // Em DEV é comum alguém colar "<orderId>" da doc.
      // Não batemos no core nesse caso; mostramos erro amigável.
      setError("LINK_INVALID");
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        const loadedOrder = await readOrderById(orderId);
        if (!loadedOrder) {
          setError("Pedido não encontrado");
          return;
        }

        const items = await import(
          "../../core-boundary/readers/OrderReader"
        ).then((m) => m.readOrderItems(orderId));

        setOrder({
          ...loadedOrder,
          items: items || [],
        });
        setError(null);
      } catch (e) {
        console.error("Error loading order:", e);
        setError("Erro ao carregar pedido");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();

    // Polling a cada 5 segundos se pedido ainda não finalizado
    const interval = setInterval(() => {
      if (order && order.status !== "CLOSED" && order.status !== "CANCELLED") {
        loadOrder();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, order?.status]);

  if (loading) {
    return (
      <GlobalLoadingView
        message="Carregando status do pedido..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  if (error || !order) {
    if (error === "LINK_INVALID") {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ textAlign: "center", padding: "24px" }}>
            <p
              style={{
                color: "#ef4444",
                fontSize: "18px",
                marginBottom: "16px",
              }}
            >
              Link de desenvolvimento inválido
            </p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                marginBottom: "8px",
              }}
            >
              Este link usa um identificador genérico
              (&quot;&lt;orderId&gt;&quot;). Para ver o status real, crie um
              pedido pela página pública do restaurante ou pela mesa QR.
            </p>
            <p style={{ color: "#6b7280", fontSize: "13px" }}>
              Exemplo: acesse <code>/public/&lt;slug&gt;</code> ou{" "}
              <code>/public/&lt;slug&gt;/mesa/1</code>, finalize um pedido e use
              o link gerado automaticamente.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center", padding: "24px" }}>
          <p
            style={{ color: "#ef4444", fontSize: "18px", marginBottom: "16px" }}
          >
            {error || "Pedido não encontrado"}
          </p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Verifique se o link está correto.
          </p>
        </div>
      </div>
    );
  }

  const customerStatus = mapOrderStatusToCustomerStatus(order.status);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Pedido #{order.number || order.short_id || order.id.slice(0, 8)}
          </h1>
          {order.table_number && (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Mesa {order.table_number}
            </p>
          )}
        </div>

        {/* Status Card */}
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              marginBottom: "16px",
            }}
          >
            {customerStatus.icon}
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: customerStatus.color,
              marginBottom: "8px",
            }}
          >
            {customerStatus.message}
          </h2>
          {customerStatus.status === "preparing" && (
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                marginTop: "8px",
              }}
            >
              Estamos preparando seu pedido com carinho.
            </p>
          )}
          {customerStatus.status === "almost_ready" && (
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                marginTop: "8px",
              }}
            >
              Seu pedido está quase pronto!
            </p>
          )}
        </div>

        {/* Items List */}
        {order.items.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "16px",
              }}
            >
              Itens do pedido
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ color: "#111827", fontSize: "14px" }}>
                    {item.name_snapshot} x{item.quantity}
                  </span>
                  <span
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    € {(item.subtotal_cents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "16px",
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <span
            style={{ fontSize: "18px", fontWeight: "bold", color: "#111827" }}
          >
            Total
          </span>
          <span
            style={{ fontSize: "18px", fontWeight: "bold", color: "#111827" }}
          >
            € {(order.total_cents / 100).toFixed(2)}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
