/**
 * PUBLIC WEB PAGE — Página Web Pública
 *
 * Menu do restaurante em /public/:slug. Visual: VPC (escuro, botões grandes, CTA verde).
 * MENU_OPERATIONAL_STATE: só mostra cardápio se restaurante publicado (status === 'active').
 */

import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  readMenu,
  readRestaurantById,
  readRestaurantBySlug,
  type CoreMenuCategory,
  type CoreProduct,
  type CoreRestaurant,
} from "../../infra/readers/RestaurantReader";
import {
  createOrder,
  type OrderItemInput,
} from "../../infra/writers/OrderWriter";
import { MENU_NOT_LIVE_WEB_MESSAGE } from "../../core/menu/MenuState";
import { BlockingScreen, useOperationalReadiness } from "../../core/readiness";
import { GlobalBlockedView } from "../../ui/design-system/components";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  spaceLg: 32,
  btnMinHeight: 48,
  btnPadding: "12px 24px",
  fontSizeBase: 16,
  fontSizeLarge: 20,
  lineHeight: 1.6,
} as const;

interface CartItem {
  product: CoreProduct;
  quantity: number;
}

export function PublicWebPage() {
  const readiness = useOperationalReadiness("WEB");
  const { slug } = useParams<{ slug: string }>();
  const { runtime } = useRestaurantRuntime();
  const [restaurant, setRestaurant] = useState<CoreRestaurant | null>(null);
  /** MENU_OPERATIONAL_STATE: menu só visível se LIVE (restaurante publicado). */
  const [menuNotLive, setMenuNotLive] = useState(false);
  const [categories, setCategories] = useState<CoreMenuCategory[]>([]);
  const [products, setProducts] = useState<CoreProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!readiness.ready && readiness.uiDirective === "SHOW_BLOCKING_SCREEN") {
    return (
      <BlockingScreen
        reason={readiness.blockingReason}
        redirectTo={readiness.redirectTo}
      />
    );
  }
  if (
    !readiness.ready &&
    readiness.uiDirective === "REDIRECT" &&
    readiness.redirectTo
  ) {
    return <Navigate to={readiness.redirectTo} replace />;
  }

  if (menuNotLive) {
    return (
      <GlobalBlockedView
        title="Cardápio não disponível"
        description={MENU_NOT_LIVE_WEB_MESSAGE}
        action={{ label: "Voltar ao início", to: "/" }}
      />
    );
  }

  useEffect(() => {
    async function loadData() {
      if (!slug) {
        setError("Slug não fornecido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let restaurantData: CoreRestaurant | null = await readRestaurantBySlug(
          slug,
        );
        // Fallback: slug "trial-restaurant" — usar restaurante do runtime quando existir
        if (!restaurantData && slug === "trial-restaurant") {
          if (runtime?.loading) {
            // Ainda a carregar: não mostrar erro, manter loading até o runtime ter restaurant_id
            setLoading(true);
            return;
          }
          if (runtime?.restaurant_id) {
            restaurantData = await readRestaurantById(runtime.restaurant_id);
          }
        }
        if (!restaurantData) {
          setError("Restaurante não encontrado");
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        // MENU_OPERATIONAL_STATE: QR/Web só abre se menu LIVE (restaurante publicado)
        if (restaurantData.status !== "active") {
          setMenuNotLive(true);
          setLoading(false);
          return;
        }

        const menu = await readMenu(restaurantData.id);
        setCategories(menu.categories);
        setProducts(menu.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug, runtime?.restaurant_id, runtime?.loading]);

  // FASE 8: Adicionar produto ao carrinho
  const addToCart = (product: CoreProduct) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id,
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // FASE 8: Remover item do carrinho
  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId),
    );
  };

  // FASE 8: Atualizar quantidade no carrinho
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  // FASE 8: Calcular total do carrinho
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price_cents * item.quantity,
    0,
  );

  // FASE 8: Criar pedido
  const handleCreateOrder = async () => {
    if (!restaurant || cart.length === 0) {
      setError("Carrinho vazio");
      return;
    }

    try {
      setCreatingOrder(true);
      setError(null);
      setOrderSuccess(null);

      const orderItems: OrderItemInput[] = cart.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price_cents,
      }));

      const result = await createOrder(
        restaurant.id,
        orderItems,
        "WEB_PUBLIC",
        "cash",
      );

      setOrderSuccess(
        `Pedido criado com sucesso! ID: ${result.id.slice(0, 8)}...`,
      );
      setCart([]); // Limpar carrinho após sucesso
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: VPC.spaceLg,
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: VPC.textMuted,
          fontSize: VPC.fontSizeBase,
        }}
      >
        <p style={{ margin: 0, opacity: 0.9 }}>A carregar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: VPC.spaceLg,
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#f87171",
          fontSize: VPC.fontSizeBase,
          textAlign: "center",
        }}
      >
        Erro: {error}
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: VPC.spaceLg,
          backgroundColor: VPC.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          color: VPC.textMuted,
          fontSize: VPC.fontSizeBase,
        }}
      >
        Restaurante não encontrado
      </div>
    );
  }

  // Agrupar produtos por categoria
  const productsByCategory = new Map<string, CoreProduct[]>();
  products.forEach((product) => {
    const categoryId = product.category_id || "sem-categoria";
    if (!productsByCategory.has(categoryId)) {
      productsByCategory.set(categoryId, []);
    }
    productsByCategory.get(categoryId)!.push(product);
  });

  // Ordenar categorias
  const sortedCategories = [...categories].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Header do Restaurante — FASE 4: nome, descrição, horários, localização */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          {restaurant.name}
        </h1>
        {restaurant.description && (
          <p style={{ fontSize: "1.2rem", color: "#666" }}>
            {restaurant.description}
          </p>
        )}
        {(restaurant.opening_hours_text || restaurant.address_text) && (
          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.95rem",
              color: VPC.textMuted,
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              alignItems: "center",
            }}
          >
            {restaurant.opening_hours_text && (
              <span>🕐 {restaurant.opening_hours_text}</span>
            )}
            {restaurant.address_text && (
              <span>📍 {restaurant.address_text}</span>
            )}
          </div>
        )}
      </div>

      {/* FASE 8: Mensagens de sucesso/erro */}
      {orderSuccess && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "2rem",
            backgroundColor: "#d1fae5",
            border: "1px solid #22c55e",
            borderRadius: "8px",
            color: "#065f46",
          }}
        >
          ✅ {orderSuccess}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "2rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#991b1b",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* FASE 8: Carrinho (fixo no topo direito) */}
      {cart.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "2rem",
            right: "2rem",
            width: "300px",
            maxHeight: "80vh",
            backgroundColor: "#fff",
            border: "2px solid #22c55e",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
            overflowY: "auto",
          }}
        >
          <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Carrinho</h3>
          {cart.map((item) => (
            <div
              key={item.product.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #ddd",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{item.product.name}</div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  € {(item.product.price_cents / 100).toFixed(2)} x{" "}
                  {item.quantity}
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <button
                  onClick={() =>
                    updateCartQuantity(item.product.id, item.quantity - 1)
                  }
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() =>
                    updateCartQuantity(item.product.id, item.quantity + 1)
                  }
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
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
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "2px solid #22c55e",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>Total:</strong>
            <strong style={{ fontSize: "1.2rem", color: "#22c55e" }}>
              € {(cartTotal / 100).toFixed(2)}
            </strong>
          </div>
          <button
            onClick={handleCreateOrder}
            disabled={creatingOrder}
            style={{
              width: "100%",
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: creatingOrder ? "#ccc" : "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: creatingOrder ? "not-allowed" : "pointer",
            }}
          >
            {creatingOrder ? "Criando pedido..." : "Finalizar Pedido"}
          </button>
        </div>
      )}

      {/* Menu */}
      <div>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Cardápio</h2>

        {sortedCategories.length === 0 && products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            Nenhum item no cardápio disponível
          </div>
        ) : (
          <>
            {/* Produtos com categoria */}
            {sortedCategories.map((category) => {
              const categoryProducts =
                productsByCategory.get(category.id) || [];
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} style={{ marginBottom: "3rem" }}>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      marginBottom: "1rem",
                      borderBottom: "2px solid #ddd",
                      paddingBottom: "0.5rem",
                    }}
                  >
                    {category.name}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "1rem",
                          backgroundColor: "#fff",
                        }}
                      >
                        {product.photo_url && (
                          <img
                            src={product.photo_url}
                            alt={product.name}
                            style={{
                              width: "100%",
                              height: "200px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              marginBottom: "0.5rem",
                            }}
                          />
                        )}
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {product.name}
                        </div>
                        {product.description && (
                          <div
                            style={{
                              color: "#666",
                              fontSize: "0.9rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {product.description}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "bold",
                              color: "#22c55e",
                            }}
                          >
                            € {(product.price_cents / 100).toFixed(2)}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#22c55e",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                            }}
                          >
                            + Adicionar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Produtos sem categoria */}
            {productsByCategory.has("sem-categoria") && (
              <div style={{ marginBottom: "3rem" }}>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    marginBottom: "1rem",
                    borderBottom: "2px solid #ddd",
                    paddingBottom: "0.5rem",
                  }}
                >
                  Outros
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {productsByCategory.get("sem-categoria")!.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "1rem",
                        backgroundColor: "#fff",
                      }}
                    >
                      {product.photo_url && (
                        <img
                          src={product.photo_url}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            marginBottom: "0.5rem",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {product.name}
                      </div>
                      {product.description && (
                        <div
                          style={{
                            color: "#666",
                            fontSize: "0.9rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {product.description}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                            color: "#22c55e",
                          }}
                        >
                          € {(product.price_cents / 100).toFixed(2)}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#22c55e",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                          }}
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "4rem",
          paddingTop: "2rem",
          borderTop: "1px solid #ddd",
          textAlign: "center",
          color: "#999",
        }}
      >
        <div>FASE 8 — Criação de Pedido via Web</div>
        <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
          Adicione itens ao carrinho e finalize seu pedido.
        </div>
      </div>
    </div>
  );
}
