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
import { toUserMessage } from "../../ui/errors";
import styles from "./MenuBuilderCore.module.css";
import { formatMoney, parseMoneyInput } from "./utils/moneyInput";

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
    <div className={styles.container} data-variant={variant}>
      <div>
        <h1 className={styles.title}>Menu Builder — Contrato Operacional</h1>
        <p className={styles.subtitle}>
          Menu não é só catálogo. É contrato operacional. Criar menu completo: ≤
          20 minutos.
        </p>

        {usedBackendFallback && runtime.coreMode === "offline-erro" && (
          <p className={styles.fallbackWarn}>
            Core não responde na porta 3001. Inicie o Docker Core para guardar
            no servidor.
          </p>
        )}
        {usedBackendFallback && runtime.coreMode === "offline-intencional" && (
          <p className={styles.fallbackInfo}>
            A editar menu localmente. Os dados serão sincronizados quando o Core
            estiver ativo.
          </p>
        )}

        {isEmpty && (
          <div className={styles.emptyWrap}>
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
          <div className={styles.presetWrap}>
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
          <div className={styles.errorWrap}>
            <GlobalErrorView
              message={globalUI.errorMessage}
              title="Erro"
              layout="portal"
              variant="inline"
            />
          </div>
        )}

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        {/* Tabs: Manual, Foto, PDF, Link, IA (FASE 3 — 5 formas de criar menu) */}
        <div className={styles.tabsRow}>
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
              data-active={activeTab === id}
              className={styles.tabBtn}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "manual" && (
          <>
            {/* Preset: dentro da tab Manual */}
            <Card padding="lg" style={{ marginBottom: 24 }}>
              <h2 className={styles.presetTitle}></h2>
              <p className={styles.presetDesc}>
                Escolha o tipo para aplicar um menu base com preços sugeridos.
                Tudo é editável e apagável.
              </p>
              <div className={styles.chipsRow}>
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
                    data-active={businessType === type}
                    className={styles.chipBtn}
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
              <h2 className={styles.formTitle}>
                {editingProduct ? "Editar Item" : "Criar Novo Item"}
              </h2>

              <div className={styles.formGrid}>
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

              <div className={styles.formGrid}>
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
                  <label className={styles.fieldLabel}>Tempo (min) *</label>
                  <div className={styles.timeChipsRow}>
                    {[2, 3, 5, 8, 12].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, prep_time_minutes: mins })
                        }
                        data-active={formData.prep_time_minutes === mins}
                        className={styles.timeChipBtn}
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

              <div className={styles.formGrid}>
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

              <div className={styles.checkboxRow}>
                <label className={styles.availableLabel}>
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

              <div className={styles.actionRow}>
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
            <p className={styles.inactiveDesc}>
              {activeTab === "foto" && "Envie uma foto do seu menu (PNG/JPG)."}
              {activeTab === "pdf" && "Envie um PDF do seu menu."}
              {activeTab === "link" && "Cole o link do seu menu."}
              {activeTab === "ia" &&
                "Descreva o seu menu e deixe a IA sugerir itens."}
            </p>
            <p className={styles.inactiveHint}>
              Funcionalidade não ativa. Use a tab Manual para criar ou editar
              itens.
            </p>
          </Card>
        )}

        {/* Lista */}
        <div>
          <h2 className={styles.listTitle}>
            Itens do Menu ({products.length})
          </h2>
          {products.length === 0 ? (
            <p className={styles.emptyText}>
              Nenhum item no menu. Crie o primeiro item acima.
            </p>
          ) : (
            <div className={styles.productList}>
              {products.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productHeader}>
                    <div className={styles.productInfo}>
                      <div className={styles.productNameRow}>
                        <h3 className={styles.productName}>{product.name}</h3>
                        <span
                          className={styles.stationBadge}
                          data-station={product.station}
                        >
                          {product.station === "BAR" ? "🍺 BAR" : "🍳 COZ"}
                        </span>
                        {!product.available && (
                          <span className={styles.unavailableTag}>
                            (Indisponível)
                          </span>
                        )}
                      </div>
                      <div className={styles.productPrice}>
                        € {(product.price_cents / 100).toFixed(2)}
                      </div>
                      <div className={styles.productMeta}>
                        ⏱️{" "}
                        {product.prep_time_seconds
                          ? Math.round(product.prep_time_seconds / 60)
                          : "N/A"}{" "}
                        min
                        {product.prep_category && ` • ${product.prep_category}`}
                      </div>
                    </div>
                    <div className={styles.productActions}>
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
