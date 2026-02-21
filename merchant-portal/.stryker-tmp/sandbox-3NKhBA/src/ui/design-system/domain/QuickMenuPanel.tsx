// @ts-nocheck
import React, { memo, useMemo, useState } from "react";
import { TPVStateDisplay } from "../../../pages/TPV/components/TPVStateDisplay";
import { Badge } from "../primitives/Badge";
import { Card } from "../Card";
import { Text } from "../primitives/Text";
import { colors } from "../tokens/colors";
import { spacing } from "../tokens/spacing";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  trackStock?: boolean;
  stockQuantity?: number;
  imageUrl?: string;
  modifierGroupIds?: string[];
}

interface QuickMenuPanelProps {
  items: MenuItem[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onAddItem: (item: MenuItem) => void;
  currentOrderItems?: { productId: string; quantity: number }[];
}

// FASE 5: Memoizar componente pesado para melhorar performance
export const QuickMenuPanel: React.FC<QuickMenuPanelProps> = memo(
  ({
    items,
    onAddItem,
    loading = false,
    error = null,
    onRetry,
    currentOrderItems = [],
  }) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter items by search query
    const filteredItems = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (q.length < 2) return items;
      return items.filter((item) => item.name.toLowerCase().includes(q));
    }, [items, searchQuery]);

    // Group items by category
    const groupedItems = filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // Order items logic
    const itemQuantities = useMemo(() => {
      const quantities: Record<string, number> = {};
      currentOrderItems.forEach((orderItem) => {
        const productId = orderItem.productId;
        quantities[productId] =
          (quantities[productId] || 0) + orderItem.quantity;
      });
      return quantities;
    }, [currentOrderItems]);

    // Scroll to category function
    const scrollToCategory = (category: string) => {
      const element = document.getElementById(`category-${category}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header - More prominent */}
        <div
          style={{
            padding: 16,
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          <Text
            size="xl"
            weight="black"
            color="primary"
            style={{ letterSpacing: "-0.02em" }}
          >
            MENU RÁPIDO
          </Text>
        </div>

        {/* Product Search */}
        <div
          style={{
            padding: "8px 16px",
            borderBottom: `1px solid ${colors.border.subtle}`,
            backgroundColor: colors.surface.layer2,
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Pesquisar produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: 36,
                borderRadius: 8,
                border: `1px solid ${colors.border.subtle}`,
                background: colors.surface.layer3,
                color: colors.text.primary,
                fontSize: 13,
                padding: "0 10px 0 32px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: colors.text.tertiary,
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  border: "none",
                  background: colors.surface.highlight,
                  color: colors.text.tertiary,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Bar (Sticky) */}
        {items.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              gap: 8,
              overflowX: "auto",
              whiteSpace: "nowrap",
              borderBottom: `1px solid ${colors.border.subtle}`,
              backgroundColor: colors.surface.layer2,
              scrollbarWidth: "none",
            }}
          >
            <style>
              {`
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        `}
            </style>
            {Object.keys(groupedItems).map((category) => (
              <button
                key={category}
                onClick={() => scrollToCategory(category)}
                style={{
                  appearance: "none",
                  background: colors.surface.layer3,
                  border: "none",
                  borderRadius: 20,
                  padding: "8px 16px",
                  color: colors.text.secondary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            padding: 20,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            flex: 1,
          }}
        >
          {error ? (
            <TPVStateDisplay
              type="error"
              title="Erro ao Carregar Menu"
              description="Não foi possível sincronizar os produtos com o servidor."
              onRetry={onRetry}
              compact
            />
          ) : loading ? (
            <TPVStateDisplay
              type="generic"
              title="Carregando..."
              description="Sincronizando produtos do Core..."
              compact
            />
          ) : items.length === 0 ? (
            <TPVStateDisplay
              type="empty_search"
              title="Menu Vazio"
              description="Nenhum item configurado ou encontrado para os filtros atuais."
              compact
            />
          ) : filteredItems.length === 0 ? (
            <TPVStateDisplay
              type="empty_search"
              title="Sem Resultados"
              description={`Nenhum produto encontrado para "${searchQuery}"`}
              compact
            />
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} id={`category-${category}`}>
                {/* Category Header */}
                <div
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 16,
                      backgroundColor: colors.action.base,
                      borderRadius: 2,
                    }}
                  ></div>
                  <Text
                    size="sm"
                    weight="bold"
                    color="secondary"
                    style={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {category}
                  </Text>
                </div>

                {/* Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: spacing[3],
                  }}
                >
                  {categoryItems.map((item) => {
                    const quantity = itemQuantities[item.id] || 0;
                    const hasQuantity = quantity > 0;
                    const isOutOfStock =
                      item.trackStock &&
                      (item.stockQuantity === undefined ||
                        item.stockQuantity <= 0);

                    return (
                      <Card
                        key={item.id}
                        data-testid="product-card"
                        data-product-name={item.name}
                        surface={
                          isOutOfStock
                            ? "base"
                            : hasQuantity
                            ? "layer1"
                            : "layer2"
                        }
                        padding="none"
                        hoverable={!isOutOfStock}
                        onClick={() => !isOutOfStock && onAddItem(item)}
                        style={{
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                          border: hasQuantity
                            ? `2px solid ${colors.action.base}`
                            : "1px solid transparent",
                          boxShadow: hasQuantity
                            ? `0 0 0 1px ${colors.action.base}`
                            : "none",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          opacity: isOutOfStock ? 0.6 : 1,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          transform: hasQuantity ? "translateY(-2px)" : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                          }}
                        >
                          {/* Image Area */}
                          {item.imageUrl ? (
                            <div
                              style={{
                                height: "110px",
                                width: "100%",
                                backgroundImage: `url(${item.imageUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundColor: colors.surface.highlight,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: "70px",
                                backgroundColor: colors.surface.layer3,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                size="xs"
                                color="tertiary"
                                weight="bold"
                                style={{ opacity: 0.5 }}
                              >
                                NO IMAGE
                              </Text>
                            </div>
                          )}

                          {/* Content Area */}
                          <div
                            style={{
                              padding: spacing[3],
                              display: "flex",
                              flexDirection: "column",
                              flex: 1,
                              gap: spacing[1],
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: spacing[1],
                              }}
                            >
                              <Text
                                size="sm"
                                weight="bold"
                                color={isOutOfStock ? "tertiary" : "primary"}
                                style={{ flex: 1, lineHeight: 1.25 }}
                              >
                                {item.name}
                              </Text>
                              {hasQuantity && !isOutOfStock && (
                                <div style={{ flexShrink: 0 }}>
                                  <Badge
                                    status="ready"
                                    label={quantity.toString()}
                                    variant="solid"
                                    size="sm"
                                  />
                                </div>
                              )}
                            </div>

                            <div style={{ marginTop: "auto", paddingTop: 4 }}>
                              {isOutOfStock ? (
                                <Text size="xs" color="error" weight="black">
                                  ESGOTADO
                                </Text>
                              ) : (
                                <Text size="sm" color="secondary" weight="bold">
                                  €{item.price.toFixed(2)}
                                </Text>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.items.length === nextProps.items.length &&
      prevProps.loading === nextProps.loading &&
      prevProps.error === nextProps.error &&
      prevProps.currentOrderItems?.length ===
        nextProps.currentOrderItems?.length &&
      prevProps.items.every((item, idx) => item.id === nextProps.items[idx]?.id)
    );
  },
);
