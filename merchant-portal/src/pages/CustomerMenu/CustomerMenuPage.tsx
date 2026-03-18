/**
 * CustomerMenuPage — Public customer self-service menu via QR code.
 *
 * Route: /order/:restaurantId
 * No auth required. Mobile-first, light theme.
 *
 * Features:
 * - Restaurant header with name
 * - Category tabs (horizontal scroll)
 * - Product grid with images, prices, and "Adicionar" button
 * - Cart summary bottom bar
 * - Cart drawer with quantity controls
 * - Order submission with confirmation
 */

import { useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  useCustomerOrder,
  type CartItem,
  type Product,
} from "./useCustomerOrder";

// ─── Constants ───

const ACCENT = "#f97316";
const ALL_CATEGORY = "__all__";

// ─── Styles ───

const PAGE: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  color: "#1a1a1a",
  fontFamily: "system-ui, -apple-system, sans-serif",
  paddingBottom: 80,
};

const HEADER: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  padding: "16px 20px 0",
};

const RESTAURANT_NAME: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const TABLE_BADGE: React.CSSProperties = {
  display: "inline-block",
  background: ACCENT,
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  padding: "2px 10px",
  borderRadius: 20,
  marginLeft: 10,
};

const CATEGORY_SCROLL: React.CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  paddingBottom: 12,
  paddingTop: 12,
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
};

const categoryTab = (active: boolean): React.CSSProperties => ({
  flexShrink: 0,
  padding: "8px 16px",
  borderRadius: 20,
  border: "none",
  background: active ? ACCENT : "#f3f4f6",
  color: active ? "#fff" : "#4b5563",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const PRODUCT_GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 12,
  padding: "16px 16px 0",
};

const PRODUCT_CARD: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const PRODUCT_IMG: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4/3",
  objectFit: "cover",
  background: "#f9fafb",
};

const PRODUCT_BODY: React.CSSProperties = {
  padding: "10px 12px 12px",
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const PRODUCT_NAME: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 4,
  lineHeight: 1.3,
};

const PRODUCT_DESC: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 8,
  lineHeight: 1.4,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const PRODUCT_FOOTER: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "auto",
};

const PRODUCT_PRICE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: ACCENT,
};

const ADD_BTN: React.CSSProperties = {
  minWidth: 48,
  minHeight: 48,
  borderRadius: "50%",
  border: "none",
  background: ACCENT,
  color: "#fff",
  fontSize: 24,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

// Cart bottom bar
const CART_BAR: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: ACCENT,
  color: "#fff",
  padding: "14px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 100,
  cursor: "pointer",
  boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
  minHeight: 56,
};

const CART_BADGE_STYLE: React.CSSProperties = {
  background: "#fff",
  color: ACCENT,
  fontWeight: 700,
  fontSize: 14,
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const CART_TEXT: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
};

const CART_TOTAL: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
};

// Cart drawer
const DRAWER_OVERLAY: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 200,
};

const DRAWER: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "#ffffff",
  borderRadius: "20px 20px 0 0",
  maxHeight: "85vh",
  overflowY: "auto",
  zIndex: 201,
  padding: "20px 20px 100px",
};

const DRAWER_HANDLE: React.CSSProperties = {
  width: 36,
  height: 4,
  background: "#d1d5db",
  borderRadius: 2,
  margin: "0 auto 16px",
};

const DRAWER_TITLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 16,
};

const CART_ITEM_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 0",
  borderBottom: "1px solid #f3f4f6",
};

const QTY_CONTROL: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const QTY_BTN: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontSize: 18,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

const REMOVE_BTN: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#ef4444",
  fontSize: 13,
  cursor: "pointer",
  padding: "4px 0",
  fontWeight: 500,
};

const SUBMIT_BTN: React.CSSProperties = {
  position: "fixed",
  bottom: 20,
  left: 20,
  right: 20,
  padding: "16px 24px",
  background: ACCENT,
  border: "none",
  borderRadius: 14,
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  zIndex: 202,
  boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
};

const TOTAL_ROW: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 0 8px",
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};

// Loading / Error / Success
const CENTER_MSG: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
  padding: 32,
  textAlign: "center",
};

const SUCCESS_ICON: React.CSSProperties = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "#dcfce7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 40,
  marginBottom: 20,
};

// ─── Helpers ───

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        style={{
          ...PRODUCT_IMG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#d1d5db",
          fontSize: 32,
        }}
      >
        &#127860;
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={PRODUCT_IMG}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Main Component ───

export function CustomerMenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const tableNumber = tableParam ? parseInt(tableParam, 10) : undefined;
  const mode = searchParams.get("mode");

  if (!restaurantId) {
    return (
      <div style={{ ...PAGE, ...CENTER_MSG }}>
        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Link invalido. Escaneie o QR code novamente.
        </p>
      </div>
    );
  }

  return (
    <CustomerMenuContent
      restaurantId={restaurantId}
      tableNumber={tableNumber}
      isTakeaway={mode === "takeaway"}
    />
  );
}

function CustomerMenuContent({
  restaurantId,
  tableNumber,
  isTakeaway,
}: {
  restaurantId: string;
  tableNumber?: number;
  isTakeaway: boolean;
}) {
  const {
    menu,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartItemCount,
    submitOrder,
    submitting,
    orderSubmitted,
    loading,
    error,
  } = useCustomerOrder(restaurantId, tableNumber);

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return menu.products;
    return menu.products.filter((p) => p.categoryId === activeCategory);
  }, [menu.products, activeCategory]);

  const handleSubmit = useCallback(async () => {
    const result = await submitOrder();
    if (result.success) {
      setDrawerOpen(false);
    }
  }, [submitOrder]);

  // ─── Order submitted confirmation ───
  if (orderSubmitted) {
    return (
      <div style={PAGE}>
        <div style={CENTER_MSG}>
          <div style={SUCCESS_ICON}>&#10003;</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Pedido enviado!
          </h2>
          <p style={{ color: "#6b7280", fontSize: 15, maxWidth: 300, lineHeight: 1.5 }}>
            {tableNumber
              ? `O seu pedido para a Mesa ${tableNumber} foi recebido. Aguarde a preparacao.`
              : "O seu pedido foi recebido. Aguarde a preparacao."}
          </p>
        </div>
      </div>
    );
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div style={PAGE}>
        <div style={CENTER_MSG}>
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid #e5e7eb`,
              borderTopColor: ACCENT,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#9ca3af", marginTop: 16, fontSize: 14 }}>
            A carregar menu...
          </p>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error && menu.products.length === 0) {
    return (
      <div style={PAGE}>
        <div style={CENTER_MSG}>
          <p style={{ color: "#ef4444", fontSize: 15 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={HEADER}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <h1 style={RESTAURANT_NAME}>Menu</h1>
          {tableNumber !== undefined && (
            <span style={TABLE_BADGE}>Mesa {tableNumber}</span>
          )}
          {isTakeaway && (
            <span style={{ ...TABLE_BADGE, background: "#6366f1" }}>
              Takeaway
            </span>
          )}
        </div>

        {/* Category tabs */}
        <div style={CATEGORY_SCROLL}>
          <button
            style={categoryTab(activeCategory === ALL_CATEGORY)}
            onClick={() => setActiveCategory(ALL_CATEGORY)}
          >
            Todos
          </button>
          {menu.categories.map((cat) => (
            <button
              key={cat.id}
              style={categoryTab(activeCategory === cat.id)}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div style={PRODUCT_GRID}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={() => addToCart(product)}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          Nenhum produto nesta categoria.
        </div>
      )}

      {/* Cart bottom bar */}
      {cartItemCount > 0 && !drawerOpen && (
        <div style={CART_BAR} onClick={() => setDrawerOpen(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={CART_BADGE_STYLE}>{cartItemCount}</div>
            <span style={CART_TEXT}>Ver Pedido</span>
          </div>
          <span style={CART_TOTAL}>{formatPrice(cartTotal)}</span>
        </div>
      )}

      {/* Cart drawer */}
      {drawerOpen && (
        <>
          <div style={DRAWER_OVERLAY} onClick={() => setDrawerOpen(false)} />
          <div style={DRAWER}>
            <div style={DRAWER_HANDLE} />
            <h2 style={DRAWER_TITLE}>O seu pedido</h2>

            {cart.map((ci) => (
              <CartItemRow
                key={ci.product.id}
                item={ci}
                onUpdateQuantity={(qty) => updateQuantity(ci.product.id, qty)}
                onRemove={() => removeFromCart(ci.product.id)}
              />
            ))}

            {cart.length === 0 && (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
                O seu carrinho esta vazio.
              </p>
            )}

            {cart.length > 0 && (
              <>
                <div style={TOTAL_ROW}>
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>

                {error && (
                  <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>
                    {error}
                  </p>
                )}

                <button
                  style={{
                    ...SUBMIT_BTN,
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "A enviar..." : `Enviar Pedido - ${formatPrice(cartTotal)}`}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  return (
    <div style={PRODUCT_CARD}>
      <ProductImage src={product.photoUrl} alt={product.name} />
      <div style={PRODUCT_BODY}>
        <div style={PRODUCT_NAME}>{product.name}</div>
        {product.description && (
          <div style={PRODUCT_DESC}>{product.description}</div>
        )}
        <div style={PRODUCT_FOOTER}>
          <span style={PRODUCT_PRICE}>{formatPrice(product.priceCents)}</span>
          <button style={ADD_BTN} onClick={onAdd} aria-label={`Adicionar ${product.name}`}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div style={CART_ITEM_ROW}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
          {item.product.name}
        </div>
        <div style={{ fontSize: 13, color: ACCENT, fontWeight: 600, marginTop: 2 }}>
          {formatPrice(item.product.priceCents * item.quantity)}
        </div>
      </div>

      <div style={QTY_CONTROL}>
        <button
          style={QTY_BTN}
          onClick={() => onUpdateQuantity(item.quantity - 1)}
        >
          -
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: "center" }}>
          {item.quantity}
        </span>
        <button
          style={QTY_BTN}
          onClick={() => onUpdateQuantity(item.quantity + 1)}
        >
          +
        </button>
      </div>

      <button style={REMOVE_BTN} onClick={onRemove}>
        Remover
      </button>
    </div>
  );
}
