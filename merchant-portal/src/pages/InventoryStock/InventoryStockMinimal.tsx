/**
 * INVENTORY STOCK MINIMAL — Gestão de Inventário e Estoque
 *
 * Tela completa para gerenciar:
 * - Locais (onde as coisas existem)
 * - Equipamentos (inventário físico)
 * - Ingredientes (o que se mede)
 * - Estoque (quantidades e mínimos)
 * - Receitas (BOM: produtos -> ingredientes)
 */

import { useEffect, useState } from "react";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import {
  readEquipment,
  readIngredients,
  readLocations,
  readProductBOM,
  readStockLevels,
  type CoreEquipment,
  type CoreIngredient,
  type CoreLocation,
} from "../../core-boundary/readers/InventoryStockReader";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./InventoryStockMinimal.module.css";

type TabType = "locations" | "equipment" | "ingredients" | "stock" | "recipes";

export function InventoryStockMinimal() {
  const { identity } = useRestaurantIdentity();
  const restaurantId =
    identity?.restaurantId || "00000000-0000-0000-0000-000000000100"; // Fallback para dev

  const [activeTab, setActiveTab] = useState<TabType>("stock");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [locations, setLocations] = useState<CoreLocation[]>([]);
  const [equipment, setEquipment] = useState<CoreEquipment[]>([]);
  const [ingredients, setIngredients] = useState<CoreIngredient[]>([]);
  const [stockLevels, setStockLevels] = useState<any[]>([]);
  const [productBOM, setProductBOM] = useState<any[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  // FASE 2 Passo 2: form novo ingrediente
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientUnit, setNewIngredientUnit] =
    useState<CoreIngredient["unit"]>("unit");
  const [savingIngredient, setSavingIngredient] = useState(false);

  // FASE 2 Passo 3: form nova receita (BOM)
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [newRecipeProductId, setNewRecipeProductId] = useState("");
  const [newRecipeIngredientId, setNewRecipeIngredientId] = useState("");
  const [newRecipeQty, setNewRecipeQty] = useState("1");
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Load data
  useEffect(() => {
    loadAllData();
  }, [restaurantId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [locs, eq, ing, stock, bom, prods] = await Promise.all([
        readLocations(restaurantId).catch(() => []),
        readEquipment(restaurantId).catch(() => []),
        readIngredients(restaurantId).catch(() => []),
        readStockLevels(restaurantId).catch(() => []),
        readProductBOM(restaurantId).catch(() => []),
        dockerCoreClient
          .from("gm_products")
          .select("id,name")
          .eq("restaurant_id", restaurantId)
          .order("name", { ascending: true })
          .then((r) => (r.data || []) as { id: string; name: string }[])
          .catch(() => []),
      ]);

      setLocations(locs);
      setEquipment(eq);
      setIngredients(ing);
      setStockLevels(stock);
      setProductBOM(bom);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newIngredientName.trim();
    if (!name) return;
    setSavingIngredient(true);
    try {
      await dockerCoreClient
        .from("gm_ingredients")
        .insert({
          restaurant_id: restaurantId,
          name,
          unit: newIngredientUnit,
        })
        .select()
        .single();
      setNewIngredientName("");
      setNewIngredientUnit("unit");
      setShowNewIngredient(false);
      await loadAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar ingrediente",
      );
    } finally {
      setSavingIngredient(false);
    }
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeProductId || !newRecipeIngredientId) return;
    const qty = parseFloat(newRecipeQty.replace(",", "."));
    if (Number.isNaN(qty) || qty <= 0) return;
    setSavingRecipe(true);
    try {
      await dockerCoreClient
        .from("gm_product_bom")
        .insert({
          restaurant_id: restaurantId,
          product_id: newRecipeProductId,
          ingredient_id: newRecipeIngredientId,
          qty_per_unit: qty,
          station: "KITCHEN",
        })
        .select()
        .single();
      setNewRecipeProductId("");
      setNewRecipeIngredientId("");
      setNewRecipeQty("1");
      setShowNewRecipe(false);
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar receita");
    } finally {
      setSavingRecipe(false);
    }
  };

  // Quick actions
  const handleCreateDefaultLocations = async () => {
    try {
      const defaults = [
        { name: "Cozinha Principal", kind: "KITCHEN" },
        { name: "Bar", kind: "BAR" },
        { name: "Estoque Seco", kind: "STORAGE" },
      ];

      for (const loc of defaults) {
        await dockerCoreClient
          .from("gm_locations")
          .insert({
            restaurant_id: restaurantId,
            name: loc.name,
            kind: loc.kind,
          })
          .select()
          .single();
      }

      await loadAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar locais padrão",
      );
    }
  };

  if (loading) {
    return (
      <GlobalLoadingView
        message="Carregando inventário e estoque..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>📦 Inventário e Estoque</h1>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {(
          [
            "locations",
            "equipment",
            "ingredients",
            "stock",
            "recipes",
          ] as TabType[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tabButton} ${
              activeTab === tab ? styles.tabButtonActive : ""
            }`}
          >
            {tab === "locations" && "📍 Locais"}
            {tab === "equipment" && "🔧 Equipamentos"}
            {tab === "ingredients" && "🥘 Ingredientes"}
            {tab === "stock" && "📊 Estoque"}
            {tab === "recipes" && "📝 Receitas"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "locations" && (
        <div>
          <div className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>Locais</h2>
            <button
              onClick={handleCreateDefaultLocations}
              className={styles.actionButton}
            >
              + Criar Locais Padrão
            </button>
          </div>
          <div className={styles.gridList}>
            {locations.length === 0 ? (
              <p className={styles.emptyMessage}>
                Nenhum local criado. Clique em "Criar Locais Padrão" para
                começar.
              </p>
            ) : (
              locations.map((loc) => (
                <div key={loc.id} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div>
                      <h3 className={styles.cardTitle}>{loc.name}</h3>
                      <p className={styles.cardMeta}>Tipo: {loc.kind}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "equipment" && (
        <div>
          <h2 className={styles.sectionTitle}>Equipamentos</h2>
          <div className={styles.gridList}>
            {equipment.length === 0 ? (
              <p className={styles.emptyMessage}>
                Nenhum equipamento cadastrado.
              </p>
            ) : (
              equipment.map((eq) => (
                <div
                  key={eq.id}
                  className={`${styles.card} ${
                    !eq.is_active ? styles.cardInactive : ""
                  }`}
                >
                  <div className={styles.cardContent}>
                    <div>
                      <h3 className={styles.cardTitle}>{eq.name}</h3>
                      <p className={styles.cardMeta}>
                        Tipo: {eq.kind}{" "}
                        {eq.capacity_note && `• ${eq.capacity_note}`}
                      </p>
                      {!eq.is_active && (
                        <p className={styles.warningText}>⚠️ Inativo</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "ingredients" && (
        <div>
          <div className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>Ingredientes</h2>
            <button
              type="button"
              onClick={() => setShowNewIngredient((v) => !v)}
              className={styles.actionButton}
            >
              {showNewIngredient ? "Cancelar" : "+ Novo ingrediente"}
            </button>
          </div>
          {showNewIngredient && (
            <form
              onSubmit={handleCreateIngredient}
              className={styles.newItemForm}
            >
              <label className={styles.formLabel}>
                <span className={styles.formLabelText}>Nome</span>
                <input
                  type="text"
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  placeholder="ex: Tomate"
                  required
                  className={styles.formInput}
                />
              </label>
              <label className={styles.formLabel}>
                <span className={styles.formLabelText}>Unidade</span>
                <select
                  value={newIngredientUnit}
                  onChange={(e) =>
                    setNewIngredientUnit(
                      e.target.value as CoreIngredient["unit"],
                    )
                  }
                  className={styles.formSelect}
                >
                  <option value="unit">Unidade</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={savingIngredient}
                className={styles.submitButton}
              >
                {savingIngredient ? "A guardar..." : "Guardar"}
              </button>
            </form>
          )}
          <div className={styles.gridList}>
            {ingredients.length === 0 ? (
              <p className={styles.emptyMessage}>
                Nenhum ingrediente cadastrado. Clique em &quot;Novo
                ingrediente&quot; para criar.
              </p>
            ) : (
              ingredients.map((ing) => (
                <div key={ing.id} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div>
                      <h3 className={styles.cardTitle}>{ing.name}</h3>
                      <p className={styles.cardMeta}>Unidade: {ing.unit}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div>
          <h2 className={styles.sectionTitle}>Estoque</h2>
          <div className={styles.gridList}>
            {stockLevels.length === 0 ? (
              <p className={styles.emptyMessage}>
                Nenhum nível de estoque cadastrado.
              </p>
            ) : (
              stockLevels.map((stock) => {
                const isLow = stock.qty <= stock.min_qty;
                return (
                  <div
                    key={stock.id}
                    className={`${styles.stockCard} ${
                      isLow ? styles.stockCardLow : ""
                    }`}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.stockCardBody}>
                        <h3 className={styles.cardTitle}>
                          {stock.ingredient?.name || "Ingrediente"}
                          {isLow && (
                            <span className={styles.lowStockBadge}>
                              ⚠️ BAIXO
                            </span>
                          )}
                        </h3>
                        <p className={styles.stockLocation}>
                          Local: {stock.location?.name || "N/A"}
                        </p>
                        <div className={styles.stockStats}>
                          <span>
                            <strong>Atual:</strong> {stock.qty}{" "}
                            {stock.ingredient?.unit || ""}
                          </span>
                          <span>
                            <strong>Mínimo:</strong> {stock.min_qty}{" "}
                            {stock.ingredient?.unit || ""}
                          </span>
                          <span className={isLow ? styles.statusCritical : ""}>
                            <strong>Status:</strong> {isLow ? "CRÍTICO" : "OK"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "recipes" && (
        <div>
          <div className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>Receitas (BOM)</h2>
            <button
              type="button"
              onClick={() => setShowNewRecipe((v) => !v)}
              disabled={products.length === 0 || ingredients.length === 0}
              className={`${styles.actionButton} ${
                products.length === 0 || ingredients.length === 0
                  ? styles.actionButtonDisabled
                  : ""
              }`}
            >
              {showNewRecipe ? "Cancelar" : "+ Nova receita"}
            </button>
          </div>
          {showNewRecipe && (
            <form onSubmit={handleCreateBOM} className={styles.newItemForm}>
              <label className={styles.formLabel}>
                <span className={styles.formLabelText}>Produto</span>
                <select
                  value={newRecipeProductId}
                  onChange={(e) => setNewRecipeProductId(e.target.value)}
                  required
                  className={styles.formSelectWide}
                >
                  <option value="">— Escolher —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.formLabel}>
                <span className={styles.formLabelText}>Ingrediente</span>
                <select
                  value={newRecipeIngredientId}
                  onChange={(e) => setNewRecipeIngredientId(e.target.value)}
                  required
                  className={styles.formSelectWide}
                >
                  <option value="">— Escolher —</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.formLabel}>
                <span className={styles.formLabelText}>Qtd. por unidade</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newRecipeQty}
                  onChange={(e) => setNewRecipeQty(e.target.value)}
                  placeholder="1"
                  required
                  className={styles.formInputQty}
                />
              </label>
              <button
                type="submit"
                disabled={savingRecipe}
                className={styles.submitButton}
              >
                {savingRecipe ? "A guardar..." : "Guardar"}
              </button>
            </form>
          )}
          <div className={styles.gridList}>
            {productBOM.length === 0 ? (
              <p className={styles.emptyMessage}>
                Nenhuma receita cadastrada. Crie produtos e ingredientes
                primeiro, depois &quot;Nova receita&quot;.
              </p>
            ) : (
              productBOM.map((bom: any) => {
                const productName =
                  products.find((p) => p.id === bom.product_id)?.name ||
                  bom.product_id;
                const ingredientName =
                  bom.ingredient?.name || bom.ingredient_id;
                const unit = bom.ingredient?.unit || "";
                return (
                  <div key={bom.id} className={styles.card}>
                    <div className={styles.cardContent}>
                      <div>
                        <h3 className={styles.cardTitle}>
                          {productName} → {ingredientName}
                        </h3>
                        <p className={styles.cardMeta}>
                          {bom.qty_per_unit} {unit} por unidade vendida
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
