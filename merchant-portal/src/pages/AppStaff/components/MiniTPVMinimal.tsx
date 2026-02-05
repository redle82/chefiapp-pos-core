/**
 * MINI TPV MINIMAL — Versão compacta para AppStaff.
 * Visual: VPC (escuro, superfície, botão CTA verde).
 */

import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../../../config";
import { createOrder } from "../../../core-boundary/writers/OrderWriter";
import { toUserMessage } from "../../../ui/errors";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 12,
  btnMinHeight: 48,
  fontSizeBase: 14,
  fontSizeSmall: 12,
} as const;

interface Product {
  id: string;
  name: string;
  price_cents: number;
  available: boolean;
}

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

interface MiniTPVMinimalProps {
  restaurantId: string;
  maxHeight?: string;
}

export function MiniTPVMinimal({
  restaurantId,
  maxHeight = "400px",
}: MiniTPVMinimalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const coreUnreachableRef = useRef(false);

  // Carregar produtos (fail-fast quando Core está em baixo)
  const loadProducts = async () => {
    if (coreUnreachableRef.current) {
      setLoading(false);
      setProducts([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);

const DOCKER_CORE_URL = CONFIG.CORE_URL;
const DOCKER_CORE_ANON_KEY = CONFIG.CORE_ANON_KEY;

      const url = `${DOCKER_CORE_URL}/gm_products?select=*&restaurant_id=eq.${restaurantId}&available=eq.true&limit=10`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: DOCKER_CORE_ANON_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar produtos.");
      }

      const data = await response.json();
      setProducts((data || []) as Product[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("ERR_CONNECTION_REFUSED")
      ) {
        coreUnreachableRef.current = true;
      }
      setError(toUserMessage(err, "Erro ao carregar produtos."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [restaurantId]);

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.price_cents || 0,
        },
      ]);
    }
  };

  // Remover item do carrinho
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  // Atualizar quantidade
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  // Calcular total
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  // Criar pedido
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError("Carrinho vazio");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const result = await createOrder(restaurantId, cart, "CAIXA", "cash", {});

      setSuccess(`Pedido #${result.id.slice(0, 8)} criado!`);
      setCart([]);

      // Limpar mensagem de sucesso após 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: VPC.space,
          textAlign: "center",
          fontSize: VPC.fontSizeBase,
          color: VPC.textMuted,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        A carregar produtos...
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${VPC.border}`,
        borderRadius: VPC.radius,
        overflow: "hidden",
        maxHeight,
        display: "flex",
        flexDirection: "column",
        backgroundColor: VPC.surface,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: `${VPC.space}px 16px`,
          backgroundColor: VPC.bg,
          borderBottom: `1px solid ${VPC.border}`,
        }}
      >
        <span
          style={{
            fontSize: VPC.fontSizeBase,
            fontWeight: 600,
            color: VPC.text,
          }}
        >
          TPV Mínimo
        </span>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: VPC.space }}>
        {error && (
          <div
            style={{
              padding: VPC.space,
              backgroundColor: "rgba(185, 28, 28, 0.12)",
              color: "#f87171",
              borderRadius: VPC.radius,
              marginBottom: VPC.space,
              fontSize: VPC.fontSizeSmall,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: VPC.space,
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              color: VPC.accent,
              borderRadius: VPC.radius,
              marginBottom: VPC.space,
              fontSize: VPC.fontSizeSmall,
            }}
          >
            {success}
          </div>
        )}

        <div style={{ marginBottom: VPC.space }}>
          <div
            style={{
              fontSize: VPC.fontSizeSmall,
              fontWeight: 600,
              marginBottom: 8,
              color: VPC.textMuted,
            }}
          >
            Produtos ({products.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: VPC.space,
            }}
          >
            {products.slice(0, 6).map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  border: `1px solid ${VPC.border}`,
                  padding: VPC.space,
                  borderRadius: VPC.radius,
                  cursor: "pointer",
                  fontSize: VPC.fontSizeSmall,
                  backgroundColor: VPC.bg,
                  color: VPC.text,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  {product.name}
                </div>
                <div
                  style={{ color: VPC.textMuted, fontSize: VPC.fontSizeSmall }}
                >
                  € {((product.price_cents || 0) / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {cart.length > 0 && (
          <div
            style={{
              borderTop: `1px solid ${VPC.border}`,
              paddingTop: VPC.space,
            }}
          >
            <div
              style={{
                fontSize: VPC.fontSizeSmall,
                fontWeight: 600,
                marginBottom: 8,
                color: VPC.text,
              }}
            >
              Carrinho ({cart.length})
            </div>
            {cart.map((item) => (
              <div
                key={item.product_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: VPC.space,
                  border: `1px solid ${VPC.border}`,
                  borderRadius: VPC.radius,
                  marginBottom: 8,
                  fontSize: VPC.fontSizeSmall,
                  backgroundColor: VPC.bg,
                  color: VPC.text,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: VPC.textMuted }}>
                    € {(item.unit_price / 100).toFixed(2)} x {item.quantity}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity - 1)
                    }
                    style={{
                      padding: "4px 8px",
                      minWidth: 32,
                      fontSize: VPC.fontSizeBase,
                      border: `1px solid ${VPC.border}`,
                      borderRadius: VPC.radius,
                      backgroundColor: "transparent",
                      color: VPC.text,
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 20, textAlign: "center" }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity + 1)
                    }
                    style={{
                      padding: "4px 8px",
                      minWidth: 32,
                      fontSize: VPC.fontSizeBase,
                      border: `1px solid ${VPC.border}`,
                      borderRadius: VPC.radius,
                      backgroundColor: "transparent",
                      color: VPC.text,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div
              style={{
                padding: VPC.space,
                backgroundColor: VPC.bg,
                borderRadius: VPC.radius,
                marginTop: VPC.space,
                fontSize: VPC.fontSizeBase,
                fontWeight: 600,
                color: VPC.accent,
              }}
            >
              Total: € {(cartTotal / 100).toFixed(2)}
            </div>
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={creating || cart.length === 0}
              style={{
                width: "100%",
                minHeight: VPC.btnMinHeight,
                padding: "12px 24px",
                marginTop: VPC.space,
                fontSize: VPC.fontSizeBase,
                fontWeight: 600,
                backgroundColor:
                  creating || cart.length === 0 ? VPC.textMuted : VPC.accent,
                color: "#fff",
                border: "none",
                borderRadius: VPC.radius,
                cursor: creating ? "wait" : "pointer",
              }}
            >
              {creating ? "A criar..." : "Criar pedido"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
