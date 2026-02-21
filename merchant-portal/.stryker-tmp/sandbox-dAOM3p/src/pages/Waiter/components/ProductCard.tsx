/**
 * ProductCard — Last.app-inspired product tile
 * Supports two display modes:
 *   - "tile" (default): Photo on top, name + price below — for grid layouts
 *   - "list": Traditional card with text + optional thumbnail — for list layouts
 *
 * Press → opens QuantityPicker → CommentChips → Confirm.
 */
// @ts-nocheck


import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../ui/design-system/Button";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { spacing } from "../../../ui/design-system/tokens/spacing";
import { CommentChips } from "./CommentChips";
import { QuantityPicker } from "./QuantityPicker";

/** Active accent — purple from Last.app design */
const ACCENT = "#6366f1";

export interface Product {
  id: string;
  name: string;
  price: number; // em centavos
  currency?: string;
  description?: string;
  imageUrl?: string;
  trackStock?: boolean;
  stockQuantity?: number;
}

export interface ProductComment {
  id: string;
  label: string;
  icon?: string;
}

interface ProductCardProps {
  product: Product;
  comments?: ProductComment[];
  onAdd: (quantity: number, commentIds: string[]) => void;
  /** Display variant. "tile" = photo grid (default), "list" = text card */
  variant?: "tile" | "list";
}

export function ProductCard({
  product,
  comments = [],
  onAdd,
  variant = "tile",
}: ProductCardProps) {
  const [showQuantity, setShowQuantity] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showComments, setShowComments] = useState(false);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [pressed, setPressed] = useState(false);
  const { t, i18n } = useTranslation("waiter");

  const isOutOfStock =
    product.trackStock &&
    (product.stockQuantity === undefined || product.stockQuantity <= 0);

  const handleProductClick = () => {
    if (isOutOfStock) return;
    if (!showQuantity) {
      setShowQuantity(true);
      setSelectedQuantity(1);
    }
  };

  const handleQuantitySelect = (qty: number) => {
    if (
      product.trackStock &&
      product.stockQuantity !== undefined &&
      qty > product.stockQuantity
    ) {
      alert(t("productCard.stockLimitAlert", { count: product.stockQuantity }));
      setSelectedQuantity(product.stockQuantity);
    } else {
      setSelectedQuantity(qty);
    }
    setShowComments(true);
  };

  const handleCommentToggle = (commentId: string) => {
    setSelectedComments((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId],
    );
  };

  const handleAddToTable = () => {
    onAdd(selectedQuantity, selectedComments);
    setShowQuantity(false);
    setShowComments(false);
    setSelectedQuantity(1);
    setSelectedComments([]);

    const card = document.getElementById(`product-${product.id}`);
    if (card) {
      card.style.background = "#32d74b22";
      setTimeout(() => {
        card.style.background = "";
      }, 300);
    }
  };

  const priceFormatted = new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: product.currency || "EUR",
    minimumFractionDigits: 2,
  }).format(product.price / 100);

  // ───── Tile variant (Last.app photo grid) ─────
  if (variant === "tile") {
    return (
      <div
        id={`product-${product.id}`}
        style={{
          background: "#18181b",
          borderRadius: 12,
          overflow: "hidden",
          cursor: isOutOfStock ? "not-allowed" : "pointer",
          transition: "transform 0.1s ease",
          transform: pressed ? "scale(0.96)" : "scale(1)",
          opacity: isOutOfStock ? 0.5 : 1,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={handleProductClick}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        {/* Image area */}
        {!showQuantity && (
          <>
            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                background: "#27272a",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: isOutOfStock ? "grayscale(100%)" : "none",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    color: "#52525b",
                  }}
                >
                  🍽️
                </div>
              )}
              {isOutOfStock && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    left: 6,
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                  }}
                >
                  {t("productCard.outOfStock")}
                </div>
              )}
            </div>
            {/* Info */}
            <div style={{ padding: "8px 10px 10px" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#e4e4e7",
                  lineHeight: 1.3,
                  marginBottom: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {product.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {priceFormatted}
              </div>
            </div>
          </>
        )}

        {/* Quantity picker overlay */}
        {showQuantity && !showComments && (
          <div style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
            <Text
              size="sm"
              weight="bold"
              color="primary"
              style={{ marginBottom: 8 }}
            >
              {t("productCard.quantity")}
            </Text>
            <QuantityPicker
              max={6}
              selected={selectedQuantity}
              onSelect={handleQuantitySelect}
            />
          </div>
        )}

        {/* Comments overlay */}
        {showComments && (
          <div style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
            <Text
              size="sm"
              weight="bold"
              color="primary"
              style={{ marginBottom: 8 }}
            >
              {t("productCard.comments")}
            </Text>
            {comments.length > 0 && (
              <CommentChips
                comments={comments}
                selectedIds={selectedComments}
                onToggle={handleCommentToggle}
              />
            )}
            <button
              onClick={handleAddToTable}
              style={{
                width: "100%",
                height: 40,
                marginTop: 10,
                background: ACCENT,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("productCard.addTile", { count: selectedQuantity })}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ───── List variant (legacy layout) ─────
  return (
    <div
      id={`product-${product.id}`}
      style={{
        background: colors.surface.layer1,
        borderRadius: 12,
        padding: spacing[4],
        marginBottom: spacing[3],
        border: `1px solid ${colors.border.subtle}`,
        transition: "all 0.2s ease",
        opacity: isOutOfStock ? 0.6 : 1,
      }}
    >
      {!showQuantity && (
        <button
          onClick={handleProductClick}
          disabled={isOutOfStock}
          style={{
            width: "100%",
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: isOutOfStock ? "not-allowed" : "pointer",
            padding: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div style={{ flex: 1 }}>
              <Text
                size="lg"
                weight="bold"
                color={isOutOfStock ? "tertiary" : "primary"}
                style={{ marginBottom: spacing[1] }}
              >
                {product.name}
              </Text>
              {product.description && (
                <Text
                  size="sm"
                  color="secondary"
                  style={{ marginBottom: spacing[2] }}
                >
                  {product.description}
                </Text>
              )}
              {isOutOfStock ? (
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: colors.feedback.error,
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {t("productCard.outOfStockUpper")}
                </div>
              ) : (
                <Text size="lg" weight="bold" color="primary">
                  {priceFormatted}
                </Text>
              )}
            </div>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  objectFit: "cover",
                  marginLeft: spacing[3],
                  filter: isOutOfStock ? "grayscale(100%)" : "none",
                }}
              />
            )}
          </div>
        </button>
      )}

      {showQuantity && !showComments && (
        <div>
          <Text
            size="md"
            weight="bold"
            color="primary"
            style={{ marginBottom: spacing[3] }}
          >
            {t("productCard.quantity")}
          </Text>
          <QuantityPicker
            max={6}
            selected={selectedQuantity}
            onSelect={handleQuantitySelect}
          />
        </div>
      )}

      {showComments && (
        <div>
          <Text
            size="md"
            weight="bold"
            color="primary"
            style={{ marginBottom: spacing[3] }}
          >
            {t("productCard.comments")}
          </Text>
          {comments.length > 0 ? (
            <>
              <CommentChips
                comments={comments}
                selectedIds={selectedComments}
                onToggle={handleCommentToggle}
              />
              <Button
                tone="action"
                variant="solid"
                onClick={handleAddToTable}
                style={{
                  width: "100%",
                  height: 56,
                  marginTop: spacing[4],
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {t("productCard.addToTable", { count: selectedQuantity })}
              </Button>
            </>
          ) : (
            <Button
              tone="action"
              variant="solid"
              onClick={handleAddToTable}
              style={{
                width: "100%",
                height: 56,
                marginTop: spacing[3],
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {t("productCard.addToTable", { count: selectedQuantity })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
