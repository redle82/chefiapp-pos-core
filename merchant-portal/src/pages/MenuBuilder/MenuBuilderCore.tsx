/**
 * MenuBuilderCore — Núcleo do Menu Builder (form + lista)
 *
 * Não define layout de página (sem maxWidth, minHeight:100vh, fundo global).
 * Recebe restaurantId e variant (panel = VPC escuro, page = claro).
 * Estado default útil: se menu vazio → CTA "Criar menu"; se existir → mostra itens.
 */

import { useEffect, useState } from "react";
import {
  addPilotProduct,
  getPilotProducts,
  isNetworkError,
} from "../../core-boundary/menuPilotFallback";
import type {
  CoreProduct,
  CoreProductWithCategory,
} from "../../core-boundary/readers/ProductReader";
import { readProductsByRestaurant } from "../../core-boundary/readers/ProductReader";
import type { CoreMenuCategory } from "../../core-boundary/readers/RestaurantReader";
import { readMenuCategories } from "../../core-boundary/readers/RestaurantReader";
import {
  createMenuItem,
  deleteMenuItem,
  updateMenuItem,
} from "../../core-boundary/writers/MenuWriter";
import type { MenuItemInput } from "../../core/contracts/Menu";
import { validateMenuItemInput } from "../../core/contracts/Menu";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import {
  GlobalEmptyView,
  GlobalErrorView,
  GlobalLoadingView,
} from "../../ui/design-system/components";
import { toUserMessage } from "../../ui/errors";

const VPC_PANEL = {
  text: "#fafafa",
  textMuted: "#a3a3a3",
  surface: "#141414",
  border: "#262626",
  errorBg: "#7f1d1d",
  errorBorder: "#991b1b",
  inputBg: "#262626",
  inputBorder: "#404040",
  accent: "#22c55e",
  primary: "#3b82f6",
  radius: 8,
} as const;

const VPC_PAGE = {
  text: "#111827",
  textMuted: "#6b7280",
  surface: "#f9fafb",
  border: "#e5e7eb",
  errorBg: "#fee2e2",
  errorBorder: "#dc2626",
  inputBg: "#fff",
  inputBorder: "#d1d5db",
  accent: "#22c55e",
  primary: "#3b82f6",
  radius: 8,
} as const;

export interface MenuBuilderCoreProps {
  restaurantId: string;
  /** panel = dentro do OS (VPC escuro); page = rota própria (claro). */
  variant: "panel" | "page";
}

export function MenuBuilderCore({
  restaurantId,
  variant,
}: MenuBuilderCoreProps) {
  const theme = variant === "panel" ? VPC_PANEL : VPC_PAGE;
  const globalUI = useGlobalUIState();

  const [products, setProducts] = useState<CoreProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CoreMenuCategory[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);

  const [formData, setFormData] = useState<MenuItemInput>({
    name: "",
    description: "",
    price_cents: 0,
    category_id: "", // Usar empty string em vez de null para inputs controlados
    station: "KITCHEN",
    prep_time_minutes: 5,
    prep_category: "main",
    available: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        globalUI.setScreenLoading(true);
        globalUI.setScreenError(null);
        const [productsData, categoriesData] = await Promise.all([
          readProductsByRestaurant(restaurantId, true, false),
          readMenuCategories(restaurantId),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        globalUI.setScreenEmpty(productsData.length === 0);
      } catch (err) {
        // B1 48h: fallback quando Core não responde (docs/product/B1_MENU_CONTENCAO.md)
        if (isNetworkError(err)) {
          setCategories([]);
          const pilot = getPilotProducts(restaurantId);
          const pilotWithCategory = pilot.map((p) => ({
            ...p,
            gm_menu_categories: null as { name: string } | null,
          })) as CoreProductWithCategory[];
          setProducts(pilotWithCategory);
          globalUI.setScreenError(null);
          globalUI.setScreenEmpty(pilotWithCategory.length === 0);
        } else {
          globalUI.setScreenError(toUserMessage(err, "Erro ao carregar menu"));
        }
      } finally {
        globalUI.setScreenLoading(false);
      }
    };
    loadData();
  }, [restaurantId]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      globalUI.setScreenError(null);
      setSuccessMessage(null);
      const validation = validateMenuItemInput(formData);
      if (!validation.valid) {
        globalUI.setScreenError(`Validação falhou: ${validation.errors.join(", ")}`);
        return;
      }
      await createMenuItem(restaurantId, formData);

      // B1 Pilot Fallback: Persist locally if saving works or fails (for 48h resilience)
      addPilotProduct(restaurantId, {
        id: crypto.randomUUID(),
        restaurant_id: restaurantId,
        name: formData.name,
        price_cents: formData.price_cents,
        available: true,
        station: formData.station as "BAR" | "KITCHEN",
        prep_time_seconds: (formData.prep_time_minutes || 5) * 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const productsData = await readProductsByRestaurant(restaurantId, true);
      setProducts(productsData);
      setFormData({
        name: "",
        description: "",
        price_cents: 0,
        category_id: null,
        station: "KITCHEN",
        prep_time_minutes: 5,
        prep_category: "main",
        available: true,
      });
      setSuccessMessage("Produto criado");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      globalUI.setScreenError(
        toUserMessage(err, "Não foi possível guardar. Tente novamente."),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (product: CoreProduct) => {
    setEditingProduct(product.id);
    setFormData({
      name: product.name,
      description: null,
      price_cents: product.price_cents,
      category_id: product.category_id || "",
      station: (product.station as "BAR" | "KITCHEN") || "KITCHEN",
      prep_time_minutes: product.prep_time_seconds
        ? Math.round(product.prep_time_seconds / 60)
        : 5,
      prep_category: product.prep_category || "main",
      available: product.available,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setCreating(true);
      globalUI.setScreenError(null);
      const validation = validateMenuItemInput(formData);
      if (!validation.valid) {
        globalUI.setScreenError(`Validação falhou: ${validation.errors.join(", ")}`);
        return;
      }
      await updateMenuItem(editingProduct, restaurantId, formData);
      const productsData = await readProductsByRestaurant(
        restaurantId,
        true,
        false,
      );
      setProducts(productsData);
      globalUI.setScreenError(null);
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price_cents: 0,
        category_id: null,
        station: "KITCHEN",
        prep_time_minutes: 5,
        prep_category: "main",
        available: true,
      });
    } catch (err) {
      globalUI.setScreenError(err instanceof Error ? err.message : "Erro ao atualizar item");
    } finally {
      setCreating(false);
    }
  };

  const handleUseExampleMenu = async () => {
    if (
      products.length > 0 &&
      !confirm(
        "Já existem itens no menu. Deseja adicionar os itens de exemplo na mesma?",
      )
    )
      return;
    try {
      setLoadingExample(true);
      globalUI.setScreenError(null);
      const examples: MenuItemInput[] = [
        {
          name: "Café",
          description: null,
          price_cents: 150,
          category_id: null,
          station: "BAR",
          prep_time_minutes: 2,
          prep_category: "main",
          available: true,
        },
        {
          name: "Água",
          description: null,
          price_cents: 200,
          category_id: null,
          station: "BAR",
          prep_time_minutes: 1,
          prep_category: "main",
          available: true,
        },
        {
          name: "Sanduíche",
          description: null,
          price_cents: 850,
          category_id: null,
          station: "KITCHEN",
          prep_time_minutes: 8,
          prep_category: "main",
          available: true,
        },
        {
          name: "Sumo natural",
          description: null,
          price_cents: 450,
          category_id: null,
          station: "BAR",
          prep_time_minutes: 3,
          prep_category: "main",
          available: true,
        },
      ];
      for (const item of examples) {
        await createMenuItem(restaurantId, item);
        addPilotProduct(restaurantId, {
          id: crypto.randomUUID(),
          restaurant_id: restaurantId,
          name: item.name,
          price_cents: item.price_cents,
          available: true,
          station: item.station as "BAR" | "KITCHEN",
          prep_time_seconds: (item.prep_time_minutes || 5) * 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      const productsData = await readProductsByRestaurant(
        restaurantId,
        true,
        false,
      );
      setProducts(productsData);
      globalUI.setScreenError(null);
    } catch (err) {
      globalUI.setScreenError(
        err instanceof Error ? err.message : "Erro ao carregar menu de exemplo",
      );
    } finally {
      setLoadingExample(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Tem certeza que deseja deletar este item?")) return;
    try {
      await deleteMenuItem(productId, restaurantId);
      const productsData = await readProductsByRestaurant(restaurantId, true);
      setProducts(productsData);
      globalUI.setScreenError(null);
    } catch (err) {
      globalUI.setScreenError(err instanceof Error ? err.message : "Erro ao deletar item");
    }
  };

  useEffect(() => {
    globalUI.setScreenEmpty(products.length === 0);
  }, [products.length, globalUI.setScreenEmpty]);

  if (globalUI.isLoadingCritical) {
    return (
      <GlobalLoadingView
        message="A carregar menu..."
        layout="portal"
        variant="inline"
      />
    );
  }

  const isEmpty = globalUI.isEmpty;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: 20,
            fontWeight: 700,
            color: theme.text,
          }}
        >
          Menu Builder — Contrato Operacional
        </h1>
        <p
          style={{ color: theme.textMuted, margin: "0 0 16px 0", fontSize: 14 }}
        >
          Menu não é só catálogo. É contrato operacional. Criar menu completo: ≤
          20 minutos.
        </p>

        {isEmpty && (
          <div style={{ marginBottom: 24 }}>
            <GlobalEmptyView
              title="Ainda não há itens no menu."
              description="Crie o primeiro item abaixo ou use o menu de exemplo para começar rápido."
              layout={variant === "panel" ? "operational" : "portal"}
              variant="inline"
              action={{
                label: "📋 Usar menu de exemplo",
                onClick: handleUseExampleMenu,
              }}
              actionLoading={loadingExample}
            />
          </div>
        )}

        {!isEmpty && (
          <button
            type="button"
            onClick={handleUseExampleMenu}
            disabled={loadingExample}
            style={{
              marginBottom: 16,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: variant === "panel" ? theme.accent : "#166534",
              backgroundColor: variant === "panel" ? "transparent" : "#dcfce7",
              border: `1px solid ${
                variant === "panel" ? theme.border : "#86efac"
              }`,
              borderRadius: theme.radius,
              cursor: loadingExample ? "not-allowed" : "pointer",
              opacity: loadingExample ? 0.7 : 1,
            }}
          >
            {loadingExample ? "A carregar..." : "📋 Usar menu de exemplo"}
          </button>
        )}

        {globalUI.isError && globalUI.errorMessage && (
          <div style={{ marginBottom: 16 }}>
            <GlobalErrorView
              message={globalUI.errorMessage}
              title="Erro"
              layout="portal"
              variant="inline"
            />
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: 12,
              backgroundColor: variant === "panel" ? "#14532d" : "#dcfce7",
              color: variant === "panel" ? "#86efac" : "#166534",
              borderRadius: 4,
              marginBottom: 16,
              border: `1px solid ${theme.accent}`,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Form */}
        <div
          style={{
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            padding: 24,
            marginBottom: 24,
            backgroundColor: theme.surface,
          }}
        >
          <h2
            style={{
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 600,
              color: theme.text,
            }}
          >
            {editingProduct ? "Editar Item" : "Criar Novo Item"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  color: theme.text,
                  fontSize: 14,
                }}
              >
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: 4,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                }}
                placeholder="Ex: Hambúrguer Artesanal"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  color: theme.text,
                  fontSize: 14,
                }}
              >
                Preço (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={(formData.price_cents / 100).toFixed(2)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_cents: Math.round(parseFloat(e.target.value) * 100),
                  })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: 4,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                }}
                placeholder="25.00"
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  color: theme.text,
                  fontSize: 14,
                }}
              >
                Estação *
              </label>
              <select
                value={formData.station}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    station: e.target.value as "BAR" | "KITCHEN",
                  })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: 4,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                }}
              >
                <option value="KITCHEN">🍳 Cozinha</option>
                <option value="BAR">🍺 Bar</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  color: theme.text,
                  fontSize: 14,
                }}
              >
                Tempo (min) *
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                {[2, 3, 5, 8, 12].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, prep_time_minutes: mins })
                    }
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      backgroundColor:
                        formData.prep_time_minutes === mins
                          ? theme.primary
                          : variant === "panel"
                          ? theme.surface
                          : "#f3f4f6",
                      color:
                        formData.prep_time_minutes === mins
                          ? "#fff"
                          : theme.text,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0.5}
                max={60}
                step={0.5}
                value={formData.prep_time_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prep_time_minutes: parseFloat(e.target.value) || 0,
                  })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: 4,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  color: theme.text,
                  fontSize: 14,
                }}
              >
                Categoria
              </label>
              <select
                value={formData.category_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: e.target.value || null,
                  })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: 4,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                }}
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  color: theme.text,
                  fontSize: 14,
                }}
              >
                Tipo
              </label>
              <select
                value={formData.prep_category || "main"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prep_category: e.target.value as
                      | "drink"
                      | "starter"
                      | "main"
                      | "dessert",
                  })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: 4,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                }}
              >
                <option value="drink">Bebida</option>
                <option value="starter">Entrada</option>
                <option value="main">Principal</option>
                <option value="dessert">Sobremesa</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: theme.text,
              }}
            >
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) =>
                  setFormData({ ...formData, available: e.target.checked })
                }
              />
              <span>Disponível</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {editingProduct ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={creating}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: theme.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: creating ? "wait" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {creating ? "A guardar..." : "Guardar"}
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      name: "",
                      description: "",
                      price_cents: 0,
                      category_id: null,
                      station: "KITCHEN",
                      prep_time_minutes: 5,
                      prep_category: "main",
                      available: true,
                    });
                  }}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: theme.textMuted,
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  padding: "10px 18px",
                  backgroundColor: theme.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: creating ? "wait" : "pointer",
                  fontWeight: 600,
                }}
              >
                {creating ? "A criar..." : "Criar Item"}
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div>
          <h2
            style={{
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 600,
              color: theme.text,
            }}
          >
            Itens do Menu ({products.length})
          </h2>
          {products.length === 0 ? (
            <p style={{ color: theme.textMuted, fontSize: 14 }}>
              Nenhum item no menu. Crie o primeiro item acima.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: theme.radius,
                    padding: 16,
                    backgroundColor: theme.surface,
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <h3
                          style={{ margin: 0, fontSize: 16, color: theme.text }}
                        >
                          {product.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 4,
                            backgroundColor:
                              product.station === "BAR" ? "#1e40af" : "#7c2d12",
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        >
                          {product.station === "BAR" ? "🍺 BAR" : "🍳 COZ"}
                        </span>
                        {!product.available && (
                          <span style={{ fontSize: 12, color: "#ef4444" }}>
                            (Indisponível)
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: theme.textMuted,
                          marginBottom: 4,
                        }}
                      >
                        € {(product.price_cents / 100).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>
                        ⏱️{" "}
                        {product.prep_time_seconds
                          ? Math.round(product.prep_time_seconds / 60)
                          : "N/A"}{" "}
                        min
                        {product.prep_category && ` • ${product.prep_category}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          padding: "6px 12px",
                          fontSize: 12,
                          backgroundColor: theme.primary,
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{
                          padding: "6px 12px",
                          fontSize: 12,
                          backgroundColor: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
