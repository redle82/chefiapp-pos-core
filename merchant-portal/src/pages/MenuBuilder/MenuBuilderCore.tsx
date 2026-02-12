/**
 * MenuBuilderCore — Núcleo do Menu Builder (form + lista).
 *
 * FLUXO PRINCIPAL
 * 1. Carrega: readProductsByRestaurant(restaurantId) + readMenuCategories(restaurantId) no mount (useEffect [restaurantId]).
 * 2. Tabs: manual | foto | pdf | link | ia; só "manual" tem form + lista ativos; outras mostram "Funcionalidade não ativa".
 * 3. Manual: preset por businessType (getMenuPresetByBusinessType) → handleUseExampleMenu; form criar/editar (MenuItemInput) → createMenuItem/updateMenuItem/deleteMenuItem (MenuWriter).
 * 4. Validação: validateMenuItemInput(payload) antes de escrever; preço via parseMoneyInput(priceInput).
 * 5. Após criar/editar/apagar: readProductsByRestaurant de novo e setProducts; em fallback, addPilotProduct/getPilotProducts e lista local.
 *
 * GUARDS CRÍTICOS
 * - restaurantId obrigatório (props); sem ele não há carga.
 * - isBackendUnavailable(err): em loadData → pilot fallback (getPilotProducts, setProducts local); em handleCreate/handleSaveEdit/handleDelete → addPilotProduct ou atualizar localStorage e setProducts; mensagem "guardado localmente".
 * - Validação: parseMoneyInput + validateMenuItemInput antes de create/update; erro em globalUI.setScreenError.
 *
 * DEPENDÊNCIAS REAIS
 * - ProductReader: readProductsByRestaurant(restaurantId).
 * - RestaurantReader: readMenuCategories(restaurantId).
 * - MenuWriter: createMenuItem, updateMenuItem, deleteMenuItem (Core).
 * - menuPilotFallback: getPilotProducts, addPilotProduct, pilotMenuKey, isBackendUnavailable (localStorage quando Core não responde).
 * - Menu contract: MenuItemInput, validateMenuItemInput (core/contracts/Menu).
 * - useBootstrapState, useRestaurantRuntime (runtime.coreMode para mensagens offline-intencional vs offline-erro).
 */

import { useEffect, useState } from "react";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  addPilotProduct,
  getPilotProducts,
  isBackendUnavailable,
  pilotMenuKey,
} from "../../core-boundary/menuPilotFallback";
import {
  BUSINESS_TYPE_LABELS,
  getMenuPresetByBusinessType,
  type BusinessType,
} from "../../core-boundary/readers/MenuPresetReader";
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
import {
  GlobalEmptyView,
  GlobalErrorView,
  GlobalLoadingView,
} from "../../ui/design-system/components";
import { Button, Card, Input, Select } from "../../ui/design-system/primitives";
import { Spacing } from "../../ui/design-system/tokens";
import { radius } from "../../ui/design-system/tokens/radius";
import { toUserMessage } from "../../ui/errors";
import { formatMoney, parseMoneyInput } from "./utils/moneyInput";

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

/** Estado inicial do form criar/editar item (evita duplicação). */
const EMPTY_MENU_ITEM_FORM: MenuItemInput = {
  name: "",
  description: "",
  price_cents: 0,
  category_id: null,
  station: "KITCHEN",
  prep_time_minutes: 5,
  prep_category: "main",
  available: true,
};

/** Pure: converte lista pilot para CoreProductWithCategory (gm_menu_categories null). */
function mapPilotToWithCategory(
  pilot: Array<{
    id: string;
    name: string;
    price_cents: number;
    [key: string]: unknown;
  }>,
): CoreProductWithCategory[] {
  return pilot.map((p) => ({
    ...p,
    gm_menu_categories: null as { name: string } | null,
  })) as CoreProductWithCategory[];
}

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
  const { runtime } = useRestaurantRuntime();

  const [products, setProducts] = useState<CoreProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CoreMenuCategory[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [usedBackendFallback, setUsedBackendFallback] = useState(false);

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
  /** Valor do preço como string (digitação livre, sem setas); sincronizado em edit/reset. */
  const [priceInput, setPriceInput] = useState("");
  /** Tipo de negócio para preset (dentro da tab Manual). */
  const [businessType, setBusinessType] = useState<BusinessType>("cafe_bar");
  type MenuBuilderTab = "manual" | "foto" | "pdf" | "link" | "ia";
  const [activeTab, setActiveTab] = useState<MenuBuilderTab>("manual");

  useEffect(() => {
    const loadData = async () => {
      try {
        globalUI.setScreenLoading(true);
        globalUI.setScreenError(null);
        const [productsData, categoriesData] = await Promise.all([
          readProductsByRestaurant(restaurantId, true, false),
          readMenuCategories(restaurantId),
        ]);
        setUsedBackendFallback(false);
        setProducts(productsData);
        setCategories(categoriesData);
        globalUI.setScreenEmpty(productsData.length === 0);
      } catch (err) {
        // B1 48h + API_ERROR_CONTRACT: fallback quando Core não responde ou devolve HTML
        if (isBackendUnavailable(err)) {
          setUsedBackendFallback(true);
          setCategories([]);
          const pilot = getPilotProducts(restaurantId);
          setProducts(mapPilotToWithCategory(pilot));
          globalUI.setScreenError(null);
          globalUI.setScreenEmpty(pilot.length === 0);
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
    let payload: MenuItemInput | undefined;
    try {
      setCreating(true);
      globalUI.setScreenError(null);
      setSuccessMessage(null);
      const parsed = parseMoneyInput(priceInput);
      if (parsed.valueNumber === null || parsed.valueNumber < 0) {
        globalUI.setScreenError("Preço inválido. Use ex.: 2,50 ou 0,09");
        return;
      }
      payload = {
        ...formData,
        price_cents: Math.round(parsed.valueNumber * 100),
      };
      const validation = validateMenuItemInput(payload);
      if (!validation.valid) {
        globalUI.setScreenError(
          `Validação falhou: ${validation.errors.join(", ")}`,
        );
        return;
      }
      await createMenuItem(restaurantId, payload);

      // B1 Pilot Fallback: Persist locally if saving works or fails (for 48h resilience)
      addPilotProduct(restaurantId, {
        id: crypto.randomUUID(),
        restaurant_id: restaurantId,
        name: payload.name,
        price_cents: payload.price_cents,
        available: true,
        station: formData.station as "BAR" | "KITCHEN",
        prep_time_seconds: (payload.prep_time_minutes || 5) * 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const productsData = await readProductsByRestaurant(restaurantId, true);
      setProducts(productsData);
      setFormData(EMPTY_MENU_ITEM_FORM);
      setPriceInput("");
      setSuccessMessage("Produto criado");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // P0: quando Core devolve HTML / rede falha, guardar em fallback local e mostrar produto na lista
      if (isBackendUnavailable(err)) {
        setUsedBackendFallback(true);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        addPilotProduct(restaurantId, {
          id,
          restaurant_id: restaurantId,
          name: payload!.name,
          price_cents: payload!.price_cents,
          available: payload!.available !== false,
          station: payload!.station as "BAR" | "KITCHEN",
          prep_time_seconds: (payload!.prep_time_minutes || 5) * 60,
          created_at: now,
          updated_at: now,
        });
        const pilotAfterCreate = getPilotProducts(restaurantId);
        setProducts(mapPilotToWithCategory(pilotAfterCreate));
        setFormData(EMPTY_MENU_ITEM_FORM);
        setPriceInput("");
        globalUI.setScreenError(null);
        setSuccessMessage(
          "Produto guardado localmente (servidor indisponível).",
        );
        setTimeout(() => setSuccessMessage(null), 4000);
        return;
      }
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
    setPriceInput(formatMoney(product.price_cents / 100));
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setCreating(true);
      globalUI.setScreenError(null);
      const parsed = parseMoneyInput(priceInput);
      if (parsed.valueNumber === null || parsed.valueNumber < 0) {
        globalUI.setScreenError("Preço inválido. Use ex.: 2,50 ou 0,09");
        return;
      }
      const payload: MenuItemInput = {
        ...formData,
        price_cents: Math.round(parsed.valueNumber * 100),
      };
      const validation = validateMenuItemInput(payload);
      if (!validation.valid) {
        globalUI.setScreenError(
          `Validação falhou: ${validation.errors.join(", ")}`,
        );
        return;
      }
      await updateMenuItem(editingProduct, restaurantId, payload);
      const productsData = await readProductsByRestaurant(
        restaurantId,
        true,
        false,
      );
      setProducts(productsData);
      globalUI.setScreenError(null);
      setEditingProduct(null);
      setFormData(EMPTY_MENU_ITEM_FORM);
      setPriceInput("");
    } catch (err) {
      if (isBackendUnavailable(err)) {
        const parsed = parseMoneyInput(priceInput);
        const editPayload: MenuItemInput = {
          ...formData,
          price_cents:
            parsed.valueNumber !== null && parsed.valueNumber >= 0
              ? Math.round(parsed.valueNumber * 100)
              : formData.price_cents,
        };
        setUsedBackendFallback(true);
        const pilot = getPilotProducts(restaurantId);
        const now = new Date().toISOString();
        const updated = pilot.map((p) =>
          p.id === editingProduct
            ? {
                ...p,
                name: editPayload.name,
                price_cents: editPayload.price_cents,
                station: editPayload.station as "BAR" | "KITCHEN",
                prep_time_seconds: (editPayload.prep_time_minutes || 5) * 60,
                available: editPayload.available !== false,
                updated_at: now,
              }
            : p,
        );
        localStorage.setItem(
          pilotMenuKey(restaurantId),
          JSON.stringify(updated),
        );
        setProducts(mapPilotToWithCategory(updated));
        setEditingProduct(null);
        setFormData(EMPTY_MENU_ITEM_FORM);
        setPriceInput("");
        globalUI.setScreenError(null);
        setSuccessMessage(
          "Item atualizado localmente (servidor indisponível).",
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        globalUI.setScreenError(
          toUserMessage(err, "Erro ao atualizar item. Tente novamente."),
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUseExampleMenu = async () => {
    if (
      products.length > 0 &&
      !confirm(
        "Já existem itens no menu. Deseja adicionar os itens do preset na mesma?",
      )
    )
      return;
    try {
      setLoadingExample(true);
      globalUI.setScreenError(null);
      const examples = getMenuPresetByBusinessType(businessType);
      for (const item of examples) {
        const pilotItem = {
          id: crypto.randomUUID(),
          restaurant_id: restaurantId,
          name: item.name,
          price_cents: item.price_cents,
          available: true,
          station: item.station as "BAR" | "KITCHEN",
          prep_time_seconds: (item.prep_time_minutes || 5) * 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        try {
          await createMenuItem(restaurantId, item);
          addPilotProduct(restaurantId, pilotItem);
        } catch (e) {
          if (isBackendUnavailable(e)) {
            setUsedBackendFallback(true);
            addPilotProduct(restaurantId, pilotItem);
          } else throw e;
        }
      }
      const productsData = await readProductsByRestaurant(
        restaurantId,
        true,
        false,
      );
      setProducts(productsData);
      globalUI.setScreenError(null);
    } catch (err) {
      if (usedBackendFallback) {
        const pilot = getPilotProducts(restaurantId);
        setProducts(mapPilotToWithCategory(pilot));
        globalUI.setScreenError(null);
      } else {
        globalUI.setScreenError(
          toUserMessage(err, "Erro ao aplicar preset. Tente novamente."),
        );
      }
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
      if (isBackendUnavailable(err)) {
        setUsedBackendFallback(true);
        const pilot = getPilotProducts(restaurantId).filter(
          (p) => p.id !== productId,
        );
        localStorage.setItem(pilotMenuKey(restaurantId), JSON.stringify(pilot));
        setProducts(mapPilotToWithCategory(pilot));
        globalUI.setScreenError(null);
      } else {
        globalUI.setScreenError(
          toUserMessage(err, "Erro ao deletar item. Tente novamente."),
        );
      }
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

        {usedBackendFallback && runtime.coreMode === "offline-erro" && (
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: 13,
              color: theme.textMuted,
              backgroundColor:
                variant === "panel" ? "rgba(234,179,8,0.1)" : "#fef9c3",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${
                variant === "panel" ? "#854d0e" : "#eab308"
              }`,
            }}
          >
            Core não responde na porta 3001. Inicie o Docker Core para guardar
            no servidor.
          </p>
        )}
        {usedBackendFallback && runtime.coreMode === "offline-intencional" && (
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: 13,
              color: theme.textMuted,
              backgroundColor:
                variant === "panel" ? "rgba(59,130,246,0.1)" : "#eff6ff",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid ${
                variant === "panel" ? "#1e40af" : "#93c5fd"
              }`,
            }}
          >
            A editar menu localmente. Os dados serão sincronizados quando o Core
            estiver ativo.
          </p>
        )}

        {isEmpty && (
          <div style={{ marginBottom: 24 }}>
            <GlobalEmptyView
              title="Ainda não há itens no menu."
              description="Use o preset ou crie itens manualmente na tab Manual para começar."
              layout={variant === "panel" ? "operational" : "portal"}
              variant="inline"
              action={{
                label: "📋 Aplicar preset",
                onClick: handleUseExampleMenu,
              }}
              actionLoading={loadingExample}
            />
          </div>
        )}

        {!isEmpty && (
          <div style={{ marginBottom: Spacing.lg }}>
            <Button
              tone="success"
              variant="outline"
              onClick={handleUseExampleMenu}
              disabled={loadingExample}
              isLoading={loadingExample}
            >
              {loadingExample ? "A aplicar..." : "📋 Aplicar preset"}
            </Button>
          </div>
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

        {/* Tabs: Manual, Foto, PDF, Link, IA (FASE 3 — 5 formas de criar menu) */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              { id: "manual" as const, label: "Manual" },
              { id: "foto" as const, label: "Foto" },
              { id: "pdf" as const, label: "PDF" },
              { id: "link" as const, label: "Link" },
              { id: "ia" as const, label: "IA" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              style={{
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === id ? "#fff" : theme.text,
                backgroundColor:
                  activeTab === id ? theme.primary : theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: radius.lg,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "manual" && (
          <>
            {/* Preset: dentro da tab Manual */}
            <Card padding="lg" style={{ marginBottom: 24 }}>
              <h2
                style={{
                  marginBottom: Spacing.lg,
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.text,
                }}
              >
                Qual tipo de negócio?
              </h2>
              <p
                style={{
                  marginBottom: Spacing.lg,
                  color: theme.textMuted,
                  fontSize: 14,
                }}
              >
                Escolha o tipo para aplicar um menu base com preços sugeridos.
                Tudo é editável e apagável.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: Spacing.lg,
                }}
              >
                {(
                  [
                    "cafe_bar",
                    "restaurante",
                    "fast_food",
                    "pizzaria",
                    "bar_noturno",
                    "padaria",
                    "outro",
                  ] as BusinessType[]
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusinessType(type)}
                    style={{
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: businessType === type ? 600 : 500,
                      color: businessType === type ? "#fff" : theme.text,
                      backgroundColor:
                        businessType === type ? theme.primary : theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: radius.lg,
                      cursor: "pointer",
                    }}
                  >
                    {BUSINESS_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <Button
                tone="success"
                variant="solid"
                onClick={handleUseExampleMenu}
                disabled={loadingExample}
                isLoading={loadingExample}
              >
                {loadingExample ? "A aplicar..." : "Aplicar preset"}
              </Button>
            </Card>

            {/* Formulário criar/editar item */}
            <Card padding="lg" style={{ marginBottom: 24 }}>
              <h2
                style={{
                  marginBottom: Spacing.lg,
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
                  gap: Spacing.lg,
                  marginBottom: Spacing.lg,
                }}
              >
                <Input
                  label="Nome *"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Hambúrguer Artesanal"
                  fullWidth
                />
                <Input
                  label="Preço (€) *"
                  type="text"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={(e) =>
                    setPriceInput(parseMoneyInput(e.target.value).rawSanitized)
                  }
                  placeholder="ex: 2,50"
                  fullWidth
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: Spacing.lg,
                  marginBottom: Spacing.lg,
                }}
              >
                <Select
                  label="Estação *"
                  value={formData.station}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      station: e.target.value as "BAR" | "KITCHEN",
                    })
                  }
                  options={[
                    { value: "KITCHEN", label: "🍳 Cozinha" },
                    { value: "BAR", label: "🍺 Bar" },
                  ]}
                  fullWidth
                />
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
                  <Input
                    type="number"
                    min={0.5}
                    max={60}
                    step={0.5}
                    value={String(formData.prep_time_minutes)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prep_time_minutes: parseFloat(e.target.value) || 0,
                      })
                    }
                    fullWidth
                    style={{ marginBottom: 0 }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: Spacing.lg,
                  marginBottom: Spacing.lg,
                }}
              >
                <Select
                  label="Categoria"
                  value={formData.category_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category_id: e.target.value || null,
                    })
                  }
                  options={[
                    { value: "", label: "Sem categoria" },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                  fullWidth
                />
                <Select
                  label="Tipo"
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
                  options={[
                    { value: "drink", label: "Bebida" },
                    { value: "starter", label: "Entrada" },
                    { value: "main", label: "Principal" },
                    { value: "dessert", label: "Sobremesa" },
                  ]}
                  fullWidth
                />
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

              <div style={{ display: "flex", gap: Spacing.sm }}>
                {editingProduct ? (
                  <>
                    <Button
                      tone="action"
                      variant="solid"
                      onClick={handleSaveEdit}
                      disabled={creating}
                      isLoading={creating}
                    >
                      {creating ? "A guardar..." : "Guardar"}
                    </Button>
                    <Button
                      tone="neutral"
                      variant="outline"
                      onClick={() => {
                        setEditingProduct(null);
                        setFormData(EMPTY_MENU_ITEM_FORM);
                        setPriceInput("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    tone="success"
                    variant="solid"
                    onClick={handleCreate}
                    disabled={creating}
                    isLoading={creating}
                  >
                    {creating ? "A criar..." : "Criar Item"}
                  </Button>
                )}
              </div>
            </Card>
          </>
        )}

        {(activeTab === "foto" ||
          activeTab === "pdf" ||
          activeTab === "link" ||
          activeTab === "ia") && (
          <Card padding="lg" style={{ marginBottom: 24 }}>
            <p style={{ margin: 0, color: theme.textMuted, fontSize: 14 }}>
              {activeTab === "foto" && "Envie uma foto do seu menu (PNG/JPG)."}
              {activeTab === "pdf" && "Envie um PDF do seu menu."}
              {activeTab === "link" && "Cole o link do seu menu."}
              {activeTab === "ia" &&
                "Descreva o seu menu e deixe a IA sugerir itens."}
            </p>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: 13,
                color: theme.textMuted,
              }}
            >
              Funcionalidade não ativa. Use a tab Manual para criar ou editar
              itens.
            </p>
          </Card>
        )}

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
                    borderRadius: radius.lg,
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
                    <div style={{ display: "flex", gap: Spacing.sm }}>
                      <Button
                        size="sm"
                        tone="action"
                        variant="solid"
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        tone="destructive"
                        variant="solid"
                        onClick={() => handleDelete(product.id)}
                      >
                        Deletar
                      </Button>
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
