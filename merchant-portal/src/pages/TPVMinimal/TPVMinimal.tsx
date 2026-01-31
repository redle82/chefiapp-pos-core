/**
 * TPV MINIMAL — CRIADO DO ZERO
 *
 * UI mínima para criar pedidos (write-only).
 *
 * REGRAS:
 * - Criado do zero (sem reutilizar componentes antigos)
 * - Apenas criação de pedidos
 * - Sem estilo (HTML básico)
 * - Usa Docker Core diretamente via dockerCoreClient
 * - Usa RPC create_order_atomic
 * - NÃO usa Supabase antigo
 */

import { useEffect, useState } from "react";
import { DemoExplicativoCard } from "../../components/DemoExplicativo";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  getPilotProducts,
  isNetworkError,
} from "../../core-boundary/menuPilotFallback";
import { createOrder } from "../../core-boundary/writers/OrderWriter";
import { ModeGate } from "../../runtime/ModeGate";
import {
  GlobalEmptyView,
  GlobalErrorView,
  GlobalLoadingView,
  GlobalPilotBanner,
} from "../../ui/design-system/components";
import { toUserMessage } from "../../ui/errors";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  available: boolean;
  restaurant_id: string;
}

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number; // em centavos
}

const DEFAULT_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

export function TPVMinimal() {
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const productMode = runtime?.productMode ?? "demo";
  const restaurantId = runtime?.restaurant_id ?? DEFAULT_RESTAURANT_ID;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const globalUI = useGlobalUIState();

  // Carregar produtos do cardápio via Docker Core; fallback B1 (localStorage) em rede falhada (docs/product/B2_TPV_CONTENCAO.md)
  const loadProducts = async () => {
    try {
      globalUI.setScreenLoading(true);
      globalUI.setScreenError(null);

      const DOCKER_CORE_URL =
        import.meta.env.VITE_SUPABASE_URL || "http://localhost:3001";
      const DOCKER_CORE_ANON_KEY =
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        "chefiapp-core-secret-key-min-32-chars-long";

      const url = `${DOCKER_CORE_URL}/rest/v1/gm_products?select=*&restaurant_id=eq.${restaurantId}&available=eq.true`;

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
      const list = (data || []) as Product[];

      // B1 Resilience: If list is empty and we are in pilot mode, try local fallback
      if (
        list.length === 0 &&
        (productMode === "pilot" || productMode === "demo")
      ) {
        const pilot = getPilotProducts(restaurantId);
        if (pilot.length > 0) {
          const fallbackList = pilot.map((p) => ({
            id: p.id,
            name: p.name,
            price_cents: p.price_cents,
            available: true,
            restaurant_id: p.restaurant_id,
          }));
          setProducts(fallbackList);
          globalUI.setScreenEmpty(fallbackList.length === 0);
          globalUI.setScreenLoading(false);
          return;
        }
      }

      setProducts(list);
      globalUI.setScreenEmpty(list.length === 0);
    } catch (err) {
      if (isNetworkError(err)) {
        const pilot = getPilotProducts(restaurantId);
        const fallback: Product[] = pilot.map((p) => ({
          id: p.id,
          name: p.name,
          price_cents: p.price_cents,
          available: true,
          restaurant_id: p.restaurant_id,
        }));
        setProducts(fallback);
        globalUI.setScreenEmpty(fallback.length === 0);
        globalUI.setScreenError(null);
      } else {
        globalUI.setScreenError(toUserMessage(err, "Erro ao carregar produtos."));
      }
    } finally {
      globalUI.setScreenLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [restaurantId]);

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);

    if (existingItem) {
      // Incrementar quantidade
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      // Adicionar novo item
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

  // Atualizar quantidade no carrinho
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

  // Calcular total do carrinho
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  // Criar pedido via Docker Core RPC
  const handleCreateOrder = async () => {
    if (cart.length === 0) return;

    try {
      setCreating(true);
      globalUI.setScreenError(null);
      setSuccess(null);

      // DOCKER CORE: Criar pedido via RPC create_order_atomic
      // Sandbox piloto (SANDBOX_TPV_PILOT_CONTRACT): em modo pilot, marcar origin = 'pilot' no Core
      const orderOrigin = globalUI.isPilot ? "pilot" : "CAIXA";
      const result = await createOrder(
        restaurantId,
        cart,
        orderOrigin,
        "cash",
        {},
      );

      setSuccess(
        `Pedido #${result.id.slice(0, 8)} criado com sucesso! Total: € ${(
          result.total_cents / 100
        ).toFixed(2)}`,
      );
      setCart([]);
    } catch (err) {
      globalUI.setScreenError(
        toUserMessage(
          err,
          "Não foi possível registar o pedido. Tente novamente.",
        ),
      );
    } finally {
      setCreating(false);
    }
  };

  if (globalUI.isLoadingCritical) {
    return (
      <GlobalLoadingView
        message="Carregando produtos..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <ModeGate
      allow={["pilot", "live"]}
      moduleId="tpv"
      fallback={<DemoExplicativoCard moduleId="tpv" />}
    >
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "100vh",
        }}
      >
        {globalUI.isBlockedByShift && (
          <div
            style={{
              padding: "16px",
              marginBottom: "20px",
              backgroundColor: "#fef2f2",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              color: "#b91c1c",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Caixa Fechado:</strong> Para realizar vendas reais, você
              precisa abrir o turno no portal.
            </div>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              style={{
                backgroundColor: "#b91c1c",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Abrir Turno
            </button>
          </div>
        )}
        {globalUI.isPilot && (
          <div style={{ marginBottom: "16px" }}>
            <GlobalPilotBanner />
          </div>
        )}
        <h1 style={{ margin: "0 0 8px 0", color: "#fafafa" }}>TPV Mínimo - Criar Pedido</h1>
        <div
          style={{ fontSize: "0.9rem", color: "#a3a3a3", marginBottom: "20px" }}
        >
          Conectado ao Docker Core:{" "}
          {import.meta.env.VITE_SUPABASE_URL || "http://localhost:3001"}
        </div>

        {globalUI.isError && globalUI.errorMessage && (
          <div style={{ marginBottom: "10px" }}>
            <GlobalErrorView
              message={globalUI.errorMessage}
              title="Erro"
              layout="operational"
              variant="inline"
            />
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#14532d",
              color: "#dcfce7",
              marginBottom: "10px",
              borderRadius: "4px",
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
          }}
        >
          {/* Lista de Produtos */}
          <div>
            <h2 style={{ margin: "0 0 12px 0", color: "#fafafa" }}>Produtos Disponíveis</h2>
            {globalUI.isEmpty ? (
              <GlobalEmptyView
                title="Nenhum produto disponível"
                layout="operational"
                variant="inline"
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "10px",
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      border: "1px solid #262626",
                      backgroundColor: "#141414",
                      padding: "10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: "#fafafa",
                    }}
                    onClick={() => addToCart(product)}
                  >
                    <div style={{ fontWeight: "bold" }}>{product.name}</div>
                    <div style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
                      € {((product.price_cents || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div>
            <h2 style={{ margin: "0 0 12px 0", color: "#fafafa" }}>Carrinho</h2>
            {cart.length === 0 ? (
              <GlobalEmptyView
                title="Carrinho vazio"
                description="Adicione produtos ao carrinho para criar um pedido."
                layout="operational"
                variant="inline"
              />
            ) : (
              <>
                <div style={{ marginBottom: "10px" }}>
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                        border: "1px solid #262626",
                        backgroundColor: "#141414",
                        marginBottom: "5px",
                        borderRadius: "8px",
                        color: "#fafafa",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold" }}>{item.name}</div>
                        <div style={{ fontSize: "0.9rem", color: "#a3a3a3" }}>
                          € {(item.unit_price / 100).toFixed(2)} x{" "}
                          {item.quantity}
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity - 1)
                          }
                          style={{
                            marginRight: "5px",
                            padding: "4px 8px",
                            backgroundColor: "#262626",
                            color: "#fafafa",
                            border: "1px solid #404040",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          -
                        </button>
                        <span style={{ margin: "0 10px" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity + 1)
                          }
                          style={{
                            marginLeft: "5px",
                            padding: "4px 8px",
                            backgroundColor: "#262626",
                            color: "#fafafa",
                            border: "1px solid #404040",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          style={{
                            marginLeft: "10px",
                            padding: "4px 8px",
                            backgroundColor: "#7f1d1d",
                            color: "#fca5a5",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#262626",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    color: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                    Total: € {(cartTotal / 100).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={creating || cart.length === 0 || globalUI.isBlockedByShift}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor:
                      creating || globalUI.isBlockedByShift ? "#ccc" : "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      creating || cart.length === 0 || globalUI.isBlockedByShift
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {creating
                    ? "Criando Pedido..."
                    : globalUI.isBlockedByShift
                    ? "Caixa Fechado"
                    : "Criar Pedido"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </ModeGate>
  );
}
