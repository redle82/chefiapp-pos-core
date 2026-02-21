/**
 * TABLE PAGE — Página da Mesa via QR
 *
 * Acessível via /public/:slug/mesa/:number.
 * Mostra menu, carrinho, cria pedido com origem QR_MESA.
 *
 * Visual: VPC (Visual Patch Comercial) — escuro, botões grandes,
 * um único CTA verde "Enviar pedido". Sem UI de config.
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resolveProductImageUrl } from "../../core/products/resolveProductImageUrl";
import {
  readMenu,
  readRestaurantBySlug,
  readTableByNumber,
  type CoreMenuCategory,
  type CoreProduct,
  type CoreRestaurant,
  type CoreTable,
} from "../../infra/readers/RestaurantReader";
import {
  createOrder,
  type OrderItemInput,
} from "../../infra/writers/OrderWriter";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { getTrustedPhotoUrl } from "../../utils/isPlaceholderPhoto";

/* VPC — valores locais (QR/Menu = vitrine do cliente) */
const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  accentHover: "#16a34a",
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

export function TablePage() {
  const { slug, number } = useParams<{ slug: string; number: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<CoreRestaurant | null>(null);
  const [table, setTable] = useState<CoreTable | null>(null);
  const [categories, setCategories] = useState<CoreMenuCategory[]>([]);
  const [products, setProducts] = useState<CoreProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolveTrustedPhoto = (product: CoreProduct) =>
    getTrustedPhotoUrl(resolveProductImageUrl(product));

  useEffect(() => {
    async function loadData() {
      if (!slug || !number) {
        setError("Slug ou número da mesa não fornecido");
        setLoading(false);
        return;
      }

      const tableNumber = parseInt(number, 10);
      if (isNaN(tableNumber)) {
        setError("Número da mesa inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const restaurantData = await readRestaurantBySlug(slug);
        if (!restaurantData) {
          setError("Restaurante não encontrado");
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        const tableData = await readTableByNumber(
          restaurantData.id,
          tableNumber,
        );
        if (!tableData) {
          setError(`Mesa ${tableNumber} não encontrada`);
          setLoading(false);
          return;
        }

        setTable(tableData);

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
  }, [slug, number]);

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

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId),
    );
  };

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

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price_cents * item.quantity,
    0,
  );

  const handleCreateOrder = async () => {
    if (!restaurant || !table || cart.length === 0) {
      setError("Carrinho vazio ou dados inválidos");
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
        "QR_MESA",
        "cash",
        {
          table_id: table.id,
          table_number: table.number,
          origin: "QR_MESA",
        },
      );

      navigate(`/public/${slug}/order/${result.id}`);
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <GlobalLoadingView
        message="A carregar..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  if (error && (!restaurant || !table)) {
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
          color: VPC.text,
        }}
      >
        <p
          style={{
            fontSize: VPC.fontSizeBase,
            color: "#f87171",
            marginBottom: VPC.spaceLg,
            textAlign: "center",
          }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate(`/public/${slug}`)}
          style={{
            minHeight: VPC.btnMinHeight,
            padding: VPC.btnPadding,
            fontSize: VPC.fontSizeBase,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: VPC.accent,
            border: "none",
            borderRadius: VPC.radius,
            cursor: "pointer",
          }}
        >
          Voltar ao menu
        </button>
      </div>
    );
  }

  if (!restaurant || !table) {
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
        Dados não encontrados
      </div>
    );
  }

  const productsByCategory = new Map<string, CoreProduct[]>();
  products.forEach((product) => {
    const categoryId = product.category_id || "sem-categoria";
    if (!productsByCategory.has(categoryId)) {
      productsByCategory.set(categoryId, []);
    }
    productsByCategory.get(categoryId)!.push(product);
  });

  const sortedCategories = [...categories].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: VPC.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        color: VPC.text,
        lineHeight: VPC.lineHeight,
        paddingBottom: VPC.spaceLg * 2,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: VPC.spaceLg }}>
        {/* Header */}
        <header
          style={{
            marginBottom: VPC.spaceLg,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: VPC.fontSizeLarge,
              fontWeight: 700,
              color: VPC.text,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Mesa {table.number}
          </h1>
          <p
            style={{
              fontSize: VPC.fontSizeBase,
              color: VPC.textMuted,
              margin: 0,
            }}
          >
            {restaurant.name}
          </p>
        </header>

        {/* Mensagens sucesso / erro (após submit) */}
        {orderSuccess && (
          <div
            style={{
              padding: VPC.space,
              marginBottom: VPC.space,
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              color: VPC.accent,
              fontSize: VPC.fontSizeBase,
            }}
          >
            ✅ {orderSuccess}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: VPC.space,
              marginBottom: VPC.space,
              backgroundColor: "rgba(185, 28, 28, 0.12)",
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              color: "#f87171",
              fontSize: VPC.fontSizeBase,
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Carrinho fixo */}
        {cart.length > 0 && (
          <div
            style={{
              position: "fixed",
              top: VPC.spaceLg,
              right: VPC.spaceLg,
              width: 320,
              maxHeight: "80vh",
              backgroundColor: VPC.surface,
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              padding: VPC.space,
              zIndex: 1000,
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                marginBottom: VPC.space,
                fontSize: VPC.fontSizeBase,
                fontWeight: 600,
                color: VPC.text,
              }}
            >
              Carrinho — Mesa {table.number}
            </h3>
            {cart.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: `1px solid ${VPC.border}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: VPC.fontSizeBase,
                      color: VPC.text,
                    }}
                  >
                    {item.product.name}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: VPC.textMuted,
                    }}
                  >
                    {(item.product.price_cents / 100).toFixed(2)} ×{" "}
                    {item.quantity}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateCartQuantity(item.product.id, item.quantity - 1)
                    }
                    style={{
                      width: 36,
                      height: 36,
                      border: `1px solid ${VPC.border}`,
                      borderRadius: VPC.radius,
                      backgroundColor: "transparent",
                      color: VPC.text,
                      fontSize: 18,
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 24, textAlign: "center" }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCartQuantity(item.product.id, item.quantity + 1)
                    }
                    style={{
                      width: 36,
                      height: 36,
                      border: `1px solid ${VPC.border}`,
                      borderRadius: VPC.radius,
                      backgroundColor: "transparent",
                      color: VPC.text,
                      fontSize: 18,
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
                marginTop: VPC.space,
                paddingTop: VPC.space,
                borderTop: `1px solid ${VPC.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: VPC.fontSizeBase,
                fontWeight: 600,
              }}
            >
              <span style={{ color: VPC.textMuted }}>Total</span>
              <span style={{ color: VPC.accent, fontSize: VPC.fontSizeLarge }}>
                {(cartTotal / 100).toFixed(2)} €
              </span>
            </div>
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              style={{
                width: "100%",
                minHeight: VPC.btnMinHeight,
                marginTop: VPC.space,
                padding: VPC.btnPadding,
                fontSize: VPC.fontSizeBase,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: creatingOrder ? VPC.textMuted : VPC.accent,
                border: "none",
                borderRadius: VPC.radius,
                cursor: creatingOrder ? "not-allowed" : "pointer",
              }}
            >
              {creatingOrder ? "A enviar..." : "Enviar pedido"}
            </button>
          </div>
        )}

        {/* Menu */}
        <section>
          <h2
            style={{
              fontSize: VPC.fontSizeLarge,
              fontWeight: 700,
              color: VPC.text,
              marginBottom: VPC.spaceLg,
            }}
          >
            Cardápio
          </h2>

          {sortedCategories.length === 0 && products.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                padding: VPC.spaceLg,
                color: VPC.textMuted,
                fontSize: VPC.fontSizeBase,
              }}
            >
              Nenhum item no cardápio disponível
            </p>
          ) : (
            <>
              {sortedCategories.map((category) => {
                const categoryProducts =
                  productsByCategory.get(category.id) || [];
                if (categoryProducts.length === 0) return null;

                return (
                  <div key={category.id} style={{ marginBottom: VPC.spaceLg }}>
                    <h3
                      style={{
                        fontSize: VPC.fontSizeBase,
                        fontWeight: 600,
                        color: VPC.textMuted,
                        marginBottom: VPC.space,
                        paddingBottom: 8,
                        borderBottom: `1px solid ${VPC.border}`,
                      }}
                    >
                      {category.name}
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: VPC.space,
                      }}
                    >
                      {categoryProducts.map((product) => (
                        <div
                          key={product.id}
                          style={{
                            border: `1px solid ${VPC.border}`,
                            borderRadius: VPC.radius,
                            padding: VPC.space,
                            backgroundColor: VPC.surface,
                          }}
                        >
                          {(() => {
                            const photoUrl = resolveTrustedPhoto(product);
                            if (!photoUrl) return null;
                            return (
                              <img
                                src={photoUrl}
                                alt={product.name}
                                style={{
                                  width: "100%",
                                  height: 180,
                                  objectFit: "cover",
                                  borderRadius: VPC.radius,
                                  marginBottom: 12,
                                }}
                              />
                            );
                          })()}
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: VPC.fontSizeBase,
                              color: VPC.text,
                              marginBottom: 4,
                            }}
                          >
                            {product.name}
                          </div>
                          {product.description && (
                            <div
                              style={{
                                color: VPC.textMuted,
                                fontSize: 14,
                                marginBottom: 8,
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
                              marginTop: 8,
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                fontSize: VPC.fontSizeBase,
                                fontWeight: 600,
                                color: VPC.accent,
                              }}
                            >
                              {(product.price_cents / 100).toFixed(2)} €
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              style={{
                                minHeight: VPC.btnMinHeight,
                                padding: VPC.btnPadding,
                                fontSize: VPC.fontSizeBase,
                                fontWeight: 600,
                                color: VPC.text,
                                backgroundColor: "transparent",
                                border: `1px solid ${VPC.border}`,
                                borderRadius: VPC.radius,
                                cursor: "pointer",
                              }}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {productsByCategory.has("sem-categoria") && (
                <div style={{ marginBottom: VPC.spaceLg }}>
                  <h3
                    style={{
                      fontSize: VPC.fontSizeBase,
                      fontWeight: 600,
                      color: VPC.textMuted,
                      marginBottom: VPC.space,
                      paddingBottom: 8,
                      borderBottom: `1px solid ${VPC.border}`,
                    }}
                  >
                    Outros
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: VPC.space,
                    }}
                  >
                    {productsByCategory.get("sem-categoria")!.map((product) => (
                      <div
                        key={product.id}
                        style={{
                          border: `1px solid ${VPC.border}`,
                          borderRadius: VPC.radius,
                          padding: VPC.space,
                          backgroundColor: VPC.surface,
                        }}
                      >
                        {(() => {
                          const photoUrl = resolveTrustedPhoto(product);
                          if (!photoUrl) return null;
                          return (
                            <img
                              src={photoUrl}
                              alt={product.name}
                              style={{
                                width: "100%",
                                height: 180,
                                objectFit: "cover",
                                borderRadius: VPC.radius,
                                marginBottom: 12,
                              }}
                            />
                          );
                        })()}
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: VPC.fontSizeBase,
                            color: VPC.text,
                            marginBottom: 4,
                          }}
                        >
                          {product.name}
                        </div>
                        {product.description && (
                          <div
                            style={{
                              color: VPC.textMuted,
                              fontSize: 14,
                              marginBottom: 8,
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
                            marginTop: 8,
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: VPC.fontSizeBase,
                              fontWeight: 600,
                              color: VPC.accent,
                            }}
                          >
                            {(product.price_cents / 100).toFixed(2)} €
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            style={{
                              minHeight: VPC.btnMinHeight,
                              padding: VPC.btnPadding,
                              fontSize: VPC.fontSizeBase,
                              fontWeight: 600,
                              color: VPC.text,
                              backgroundColor: "transparent",
                              border: `1px solid ${VPC.border}`,
                              borderRadius: VPC.radius,
                              cursor: "pointer",
                            }}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Footer mínimo — sem "FASE 9" */}
        <footer
          style={{
            marginTop: VPC.spaceLg * 2,
            paddingTop: VPC.space,
            borderTop: `1px solid ${VPC.border}`,
            textAlign: "center",
            fontSize: 14,
            color: VPC.textMuted,
          }}
        >
          Mesa {table.number}
        </footer>
      </div>

      <style>{`
        @keyframes vpc-fade {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
