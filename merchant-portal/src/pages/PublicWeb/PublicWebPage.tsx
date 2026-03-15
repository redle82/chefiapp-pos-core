/**
 * PUBLIC WEB PAGE — Página Web Pública do Restaurante
 *
 * Menu em /public/:slug. Visual: tema escuro, acentos vermelhos, hero com CTA,
 * navegação por categorias, grid de pratos, secções de ofertas e reviews.
 * MENU_OPERATIONAL_STATE: cardápio só visível se restaurante publicado (status === 'active').
 *
 * Conexões (anti-regressão): docs/architecture/PUBLIC_WEB_ORDER_FLOW_CONTRACT.md
 * - Catálogo: readMenu(restaurantId) — mesmo Core que TPV/KDS (gm_products, gm_menu_categories).
 * - Pedidos: createOrder(..., "WEB_PUBLIC", ...) — origin persistido no Core; KDS/KDS Mini exibem badge "WEB".
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useCurrency } from "../../core/currency/useCurrency";
import { useFormatLocale } from "../../core/i18n/useFormatLocale";
import { MENU_NOT_LIVE_WEB_MESSAGE } from "../../core/menu/MenuState";
import { resolveProductImageUrl } from "../../core/products/resolveProductImageUrl";
import { BlockingScreen, useOperationalReadiness } from "../../core/readiness";
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
import { GlobalBlockedView } from "../../ui/design-system/components";
import { RestaurantLogo } from "../../ui/RestaurantLogo";
import { getTrustedPhotoUrl } from "../../utils/isPlaceholderPhoto";

/** Design system da web pública: tema escuro, accent #FF2F30, Alegreya (ref. mockups). */
const THEME = {
  bg: "#0a0a0a",
  surface: "#171717",
  surfaceElevated: "#1c1c1c",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  textTertiary: "#737373",
  accent: "#FF2F30",
  accentHover: "#e02829",
  radius: 12,
  radiusSm: 8,
  space: 24,
  spaceLg: 32,
  fontFamily: "'Alegreya', Georgia, 'Times New Roman', serif",
} as const;

interface CartItem {
  product: CoreProduct;
  quantity: number;
}

const MOCK_REVIEWS = [
  {
    handle: "@dresacampany",
    stars: 5,
    text: "Excelente serviço e comida sempre fresca. Recomendo o menu do dia.",
    name: "João Silva",
    title: "Cliente habitual",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
  },
  {
    handle: "@mariafood",
    stars: 5,
    text: "Entrega rápida e embalagem impecável. O prato chegou quente.",
    name: "Maria Santos",
    title: "CEO Obc company R&D",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
  },
  {
    handle: "@chefiapp_fan",
    stars: 5,
    text: "Melhor experiência de pedido online. Interface clara e preços justos.",
    name: "Carlos Oliveira",
    title: "Gestor de operações",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
  },
];

export function PublicWebPage() {
  const readiness = useOperationalReadiness("WEB");
  const { slug } = useParams<{ slug: string }>();
  const { runtime } = useRestaurantRuntime();
  const locale = useFormatLocale();
  const { formatAmount } = useCurrency();
  const [restaurant, setRestaurant] = useState<CoreRestaurant | null>(null);
  const [menuNotLive, setMenuNotLive] = useState(false);
  const [categories, setCategories] = useState<CoreMenuCategory[]>([]);
  const [products, setProducts] = useState<CoreProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [reviewIndex, setReviewIndex] = useState(0);

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
        let restaurantData: (CoreRestaurant & { status?: string }) | null =
          await readRestaurantBySlug(slug);
        if (!restaurantData && slug === "trial-restaurant") {
          if (runtime?.loading) {
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

  const addToCart = (product: CoreProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
  };

  const cartTotal = cart.reduce(
    (sum, i) => sum + i.product.price_cents * i.quantity,
    0,
  );

  const handleCreateOrder = async () => {
    if (!restaurant || cart.length === 0) return;
    try {
      setCreatingOrder(true);
      setError(null);
      setOrderSuccess(null);
      const orderItems: OrderItemInput[] = cart.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.price_cents,
      }));
      const result = await createOrder(
        restaurant.id,
        orderItems,
        "WEB_PUBLIC",
        "cash",
      );
      setOrderSuccess(`Pedido criado! ID: ${result.id.slice(0, 8)}...`);
      setCart([]);
      setCartOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pedido");
    } finally {
      setCreatingOrder(false);
    }
  };

  const productsByCategory = useMemo(() => {
    const map = new Map<string, CoreProduct[]>();
    products.forEach((p) => {
      const cid = p.category_id || "sem-categoria";
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(p);
    });
    return map;
  }, [products]);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    let list: CoreProduct[] = selectedCategoryId
      ? productsByCategory.get(selectedCategoryId) ?? []
      : products;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [products, productsByCategory, selectedCategoryId, searchQuery]);

  const resolveTrustedPhoto = (product: CoreProduct) =>
    getTrustedPhotoUrl(resolveProductImageUrl(product));

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

  const heroImage =
    products.map((product) => resolveTrustedPhoto(product)).find(Boolean) ||
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80";

  const todayStr = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: THEME.bg,
          color: THEME.textMuted,
          fontFamily: THEME.fontFamily,
        }}
      >
        A carregar...
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: THEME.bg,
          color: THEME.accent,
          fontFamily: THEME.fontFamily,
          padding: THEME.spaceLg,
        }}
      >
        {error}
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.bg,
        color: THEME.text,
        fontFamily: THEME.fontFamily,
      }}
    >
      {/* Barra de contacto (topo) */}
      <div
        style={{
          background: THEME.surface,
          borderBottom: `1px solid ${THEME.border}`,
          padding: "8px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px 24px",
          fontSize: 13,
          color: THEME.textMuted,
        }}
      >
        {restaurant.opening_hours_text && (
          <span>🕐 {restaurant.opening_hours_text}</span>
        )}
        {restaurant.address_text && <span>📍 {restaurant.address_text}</span>}
        <span>📞 Pedido por telefone</span>
      </div>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "rgba(10, 10, 10, 0.95)",
          borderBottom: `1px solid ${THEME.border}`,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RestaurantLogo
            logoUrl={restaurant.logo_url}
            name={restaurant.name}
            size={36}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontFamily: THEME.fontFamily,
            }}
          >
            {restaurant.name}
          </span>
        </div>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            style={{
              padding: "8px 12px 10px",
              background: "transparent",
              color: selectedCategoryId === null ? THEME.text : THEME.textMuted,
              border: "none",
              borderBottom:
                selectedCategoryId === null
                  ? `2px solid ${THEME.accent}`
                  : "2px solid transparent",
              borderRadius: 0,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Início
          </button>
          {sortedCategories.slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              style={{
                padding: "8px 12px 10px",
                background: "transparent",
                color:
                  selectedCategoryId === cat.id ? THEME.text : THEME.textMuted,
                border: "none",
                borderBottom:
                  selectedCategoryId === cat.id
                    ? `2px solid ${THEME.accent}`
                    : "2px solid transparent",
                borderRadius: 0,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {cat.name}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: THEME.textTertiary, fontSize: 18 }} aria-hidden>
            🔍
          </span>
          <button
            type="button"
            data-testid="sovereign-web-cart-toggle"
            onClick={() => setCartOpen(true)}
            style={{
              position: "relative",
              background: "none",
              border: "none",
              color: THEME.text,
              cursor: "pointer",
              padding: 8,
              fontSize: 20,
            }}
          >
            🛒
            {cart.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: THEME.accent,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
          <a
            href="/auth"
            style={{
              padding: "10px 20px",
              background: THEME.accent,
              color: "#fff",
              borderRadius: THEME.radiusSm,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Entrar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          position: "relative",
          padding: "48px 24px 56px",
          maxWidth: 1200,
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 50% at 70% 20%, rgba(255, 47, 48, 0.18), transparent), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(115, 115, 115, 0.1), transparent)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 48,
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: 20,
                fontFamily: THEME.fontFamily,
              }}
            >
              Entrega de comida fresca e{" "}
              <span
                style={{
                  color: THEME.accent,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                quente
              </span>{" "}
              em 40 minutos
            </h1>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
                marginBottom: 24,
                fontSize: 14,
                color: THEME.textMuted,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: THEME.text,
                    marginBottom: 2,
                  }}
                >
                  Horário de entrega
                </div>
                {restaurant.opening_hours_text || "10:00 – 00:00"}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: THEME.text,
                    marginBottom: 2,
                  }}
                >
                  Café mais próximo
                </div>
                {restaurant.address_text || "—"}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: THEME.text,
                    marginBottom: 2,
                  }}
                >
                  Pedido por telefone
                </div>
                8-800-100-30-30
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                style={{
                  padding: "14px 28px",
                  background: THEME.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: THEME.radius,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: THEME.fontFamily,
                }}
              >
                Pedir agora
              </button>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("menu-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                style={{
                  padding: "14px 28px",
                  background: "transparent",
                  color: THEME.text,
                  border: `2px solid ${THEME.accent}`,
                  borderRadius: THEME.radius,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: THEME.fontFamily,
                }}
              >
                Ver cardápio
              </button>
            </div>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: THEME.textMuted,
              }}
            >
              <span style={{ color: THEME.accent, fontWeight: 700 }}>★</span>
              <span>#1 Serviço Nacional</span>
              <span style={{ color: THEME.accent }}>
                2021 Best Service Award
              </span>
              <span>·</span>
              <span>12.5K avaliações</span>
            </div>
          </div>
          <div
            style={{
              borderRadius: THEME.radius,
              overflow: "hidden",
              aspectRatio: "4/3",
              maxHeight: 360,
              background: THEME.surface,
            }}
          >
            <img
              src={heroImage}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </section>

      {/* Alerts */}
      {orderSuccess && (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto 0",
            padding: "0 24px 16px",
          }}
        >
          <div
            style={{
              padding: 16,
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid #22c55e",
              borderRadius: THEME.radiusSm,
              color: "#86efac",
            }}
          >
            ✅ {orderSuccess}
          </div>
        </div>
      )}
      {error && (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto 0",
            padding: "0 24px 16px",
          }}
        >
          <div
            style={{
              padding: 16,
              background: "rgba(220, 38, 38, 0.15)",
              border: "1px solid " + THEME.accent,
              borderRadius: THEME.radiusSm,
              color: "#fca5a5",
            }}
          >
            ❌ {error}
          </div>
        </div>
      )}

      {/* Menu section */}
      <section
        id="menu-section"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 56px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 4,
                fontFamily: THEME.fontFamily,
              }}
            >
              {restaurant.name}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: THEME.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {todayStr}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
            }}
          >
            <select
              aria-label="Escolher pratos"
              value={selectedCategoryId ?? ""}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              style={{
                padding: "10px 14px",
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.radiusSm,
                color: THEME.text,
                fontSize: 14,
                fontFamily: THEME.fontFamily,
                cursor: "pointer",
              }}
            >
              <option value="">Escolher pratos</option>
              {sortedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Tipo de serviço"
              style={{
                padding: "10px 14px",
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.radiusSm,
                color: THEME.text,
                fontSize: 14,
                fontFamily: THEME.fontFamily,
                cursor: "pointer",
              }}
            >
              <option value="delivery">Entrega</option>
              <option value="dinein">Comer no local</option>
              <option value="takeaway">Takeaway</option>
            </select>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: THEME.textTertiary,
                  fontSize: 16,
                  pointerEvents: "none",
                }}
                aria-hidden
              >
                🔍
              </span>
              <input
                type="search"
                placeholder="Pesquisar pratos, café..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "12px 16px 12px 40px",
                  width: 260,
                  maxWidth: "100%",
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: THEME.radiusSm,
                  color: THEME.text,
                  fontSize: 14,
                  fontFamily: THEME.fontFamily,
                }}
              />
            </div>
          </div>
        </div>

        {/* Category tabs — sublinhado vermelho no ativo (ref. mockup) */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 32,
            overflowX: "auto",
            paddingBottom: 8,
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            style={{
              padding: "12px 16px 10px",
              background: "transparent",
              color: selectedCategoryId === null ? THEME.text : THEME.textMuted,
              border: "none",
              borderBottom:
                selectedCategoryId === null
                  ? `2px solid ${THEME.accent}`
                  : "2px solid transparent",
              borderRadius: 0,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: THEME.fontFamily,
            }}
          >
            Todos
          </button>
          {sortedCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              style={{
                padding: "12px 16px 10px",
                background: "transparent",
                color:
                  selectedCategoryId === cat.id ? THEME.text : THEME.textMuted,
                border: "none",
                borderBottom:
                  selectedCategoryId === cat.id
                    ? `2px solid ${THEME.accent}`
                    : "2px solid transparent",
                borderRadius: 0,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: THEME.fontFamily,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 24,
          }}
        >
          {filteredProducts.length === 0 ? (
            <p
              style={{
                gridColumn: "1 / -1",
                color: THEME.textMuted,
                textAlign: "center",
                padding: 48,
              }}
            >
              Nenhum prato encontrado
            </p>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: THEME.radius,
                  overflow: "hidden",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    overflow: "hidden",
                    marginBottom: 12,
                    background: THEME.surfaceElevated,
                  }}
                >
                  {(() => {
                    const photoUrl = resolveTrustedPhoto(product);
                    if (!photoUrl) return null;
                    return (
                      <img
                        src={photoUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    );
                  })() ?? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: THEME.textTertiary,
                        fontSize: 32,
                      }}
                    >
                      🍽️
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {product.name}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: THEME.accent,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {formatAmount(product.price_cents)}
                </div>
                {product.available === false ? (
                  <span style={{ fontSize: 12, color: THEME.textTertiary }}>
                    Indisponível
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: THEME.textMuted }}>
                    {10 + (filteredProducts.indexOf(product) % 11)} porções
                    disponíveis
                  </span>
                )}
                <button
                  type="button"
                  data-testid={`sovereign-web-add-product-${product.name.replace(/\s+/g, "-")}`}
                  onClick={() => addToCart(product)}
                  disabled={product.available === false}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: "10px",
                    background: THEME.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: THEME.radiusSm,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      product.available === false ? "not-allowed" : "pointer",
                    opacity: product.available === false ? 0.5 : 1,
                  }}
                >
                  Adicionar
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Promo: Business Lunch / Fast Delivery */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          <div
            style={{
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderRadius: THEME.radius,
              padding: 24,
              fontFamily: THEME.fontFamily,
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              Menu executivo
            </h3>
            <p
              style={{ fontSize: 14, color: THEME.textMuted, marginBottom: 12 }}
            >
              Peça antes das 12:00
            </p>
            <div
              style={{
                fontSize: 13,
                color: THEME.textMuted,
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 600, color: THEME.text, marginTop: 8 }}>
                PRIMEIRO:
              </div>
              <div>Sopa do dia, salada</div>
              <div style={{ fontWeight: 600, color: THEME.text, marginTop: 8 }}>
                SEGUNDO:
              </div>
              <div>Prato do dia, grelhado</div>
              <div style={{ fontWeight: 600, color: THEME.text, marginTop: 8 }}>
                SALADAS / BEBIDAS:
              </div>
              <div>Incluídas</div>
            </div>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("menu-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                padding: "12px 24px",
                background: THEME.accent,
                color: "#fff",
                border: "none",
                borderRadius: THEME.radiusSm,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Pedir agora
            </button>
          </div>
          <div
            style={{
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderRadius: THEME.radius,
              padding: 24,
              fontFamily: THEME.fontFamily,
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              Entrega rápida em 1 hora
            </h3>
            <p
              style={{ fontSize: 14, color: THEME.textMuted, marginBottom: 12 }}
            >
              Peça antes das 12:00
            </p>
            <p
              style={{
                fontSize: 13,
                color: THEME.textMuted,
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Pratos selecionados para entrega express. Entrega em até 1 hora.
            </p>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("menu-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                padding: "12px 24px",
                background: THEME.accent,
                color: "#fff",
                border: "none",
                borderRadius: THEME.radiusSm,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Pedir agora
            </button>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 56px",
        }}
      >
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
          Avaliações
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 24,
            overflowX: "auto",
            paddingBottom: 16,
          }}
        >
          {MOCK_REVIEWS.map((r, i) => (
            <div
              key={i}
              style={{
                flex: "0 0 320px",
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.radius,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <img
                  src={r.avatar}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    objectFit: "cover",
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {r.handle}
                  </div>
                  <div style={{ color: THEME.accent, fontSize: 14 }}>
                    {"★".repeat(r.stars)}
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: THEME.textMuted,
                  lineHeight: 1.6,
                  marginBottom: 12,
                }}
              >
                {r.text}
              </p>
              <div style={{ fontSize: 13, color: THEME.text }}>
                <strong>{r.name}</strong> · {r.title}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          {MOCK_REVIEWS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setReviewIndex(i)}
              aria-label={`Avaliação ${i + 1}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                background: reviewIndex === i ? THEME.accent : THEME.border,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${THEME.border}`,
          padding: "40px 24px",
          textAlign: "center",
          color: THEME.textMuted,
          fontSize: 14,
        }}
      >
        <h3
          style={{
            color: THEME.text,
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Contacte-nos
        </h3>
        {restaurant.address_text && (
          <p style={{ marginBottom: 8 }}>📍 {restaurant.address_text}</p>
        )}
        {restaurant.opening_hours_text && (
          <p style={{ marginBottom: 8 }}>🕐 {restaurant.opening_hours_text}</p>
        )}
        <p style={{ marginTop: 24, fontSize: 12, color: THEME.textTertiary }}>
          {restaurant.name} · Menu online
        </p>
      </footer>

      {/* Cart drawer */}
      {cartOpen && (
        <>
          <div
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 200,
            }}
            onClick={() => setCartOpen(false)}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "100%",
              maxWidth: 400,
              height: "100%",
              background: THEME.surface,
              borderLeft: `1px solid ${THEME.border}`,
              zIndex: 201,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: `1px solid ${THEME.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Carrinho</h3>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: THEME.textMuted,
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {cart.length === 0 ? (
                <p style={{ color: THEME.textMuted }}>Carrinho vazio</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: `1px solid ${THEME.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ fontSize: 14, color: THEME.textMuted }}>
                        {formatAmount(item.product.price_cents)} ×{" "}
                        {item.quantity}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity - 1)
                        }
                        style={{
                          width: 32,
                          height: 32,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: THEME.radiusSm,
                          background: THEME.surface,
                          color: THEME.text,
                          cursor: "pointer",
                          fontSize: 18,
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
                          width: 32,
                          height: 32,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: THEME.radiusSm,
                          background: THEME.surface,
                          color: THEME.text,
                          cursor: "pointer",
                          fontSize: 18,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div
                style={{
                  padding: 20,
                  borderTop: `1px solid ${THEME.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: THEME.accent }}>
                    {formatAmount(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="sovereign-web-submit-order"
                  onClick={handleCreateOrder}
                  disabled={creatingOrder}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: THEME.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: THEME.radius,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: creatingOrder ? "not-allowed" : "pointer",
                    opacity: creatingOrder ? 0.7 : 1,
                  }}
                >
                  {creatingOrder ? "A processar..." : "Finalizar pedido"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
