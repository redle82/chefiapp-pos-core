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
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}
      >
        📦 Inventário e Estoque
      </h1>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "2px solid #e5e7eb",
          marginBottom: "24px",
        }}
      >
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
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: activeTab === tab ? "bold" : "normal",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: activeTab === tab ? "#3b82f6" : "#6b7280",
            }}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Locais</h2>
            <button
              onClick={handleCreateDefaultLocations}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              + Criar Locais Padrão
            </button>
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            {locations.length === 0 ? (
              <p
                style={{ color: "#666", padding: "20px", textAlign: "center" }}
              >
                Nenhum local criado. Clique em "Criar Locais Padrão" para
                começar.
              </p>
            ) : (
              locations.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {loc.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "#666" }}>
                        Tipo: {loc.kind}
                      </p>
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
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            Equipamentos
          </h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {equipment.length === 0 ? (
              <p
                style={{ color: "#666", padding: "20px", textAlign: "center" }}
              >
                Nenhum equipamento cadastrado.
              </p>
            ) : (
              equipment.map((eq) => (
                <div
                  key={eq.id}
                  style={{
                    padding: "16px",
                    backgroundColor: eq.is_active ? "#f9fafb" : "#fee2e2",
                    border: `1px solid ${eq.is_active ? "#e5e7eb" : "#fca5a5"}`,
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {eq.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "#666" }}>
                        Tipo: {eq.kind}{" "}
                        {eq.capacity_note && `• ${eq.capacity_note}`}
                      </p>
                      {!eq.is_active && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#dc2626",
                            marginTop: "4px",
                          }}
                        >
                          ⚠️ Inativo
                        </p>
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>
              Ingredientes
            </h2>
            <button
              type="button"
              onClick={() => setShowNewIngredient((v) => !v)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {showNewIngredient ? "Cancelar" : "+ Novo ingrediente"}
            </button>
          </div>
          {showNewIngredient && (
            <form
              onSubmit={handleCreateIngredient}
              style={{
                padding: "16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
                marginBottom: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "flex-end",
              }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ fontSize: "13px", color: "#666" }}>Nome</span>
                <input
                  type="text"
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  placeholder="ex: Tomate"
                  required
                  style={{
                    padding: "8px 12px",
                    fontSize: "14px",
                    minWidth: 160,
                  }}
                />
              </label>
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ fontSize: "13px", color: "#666" }}>Unidade</span>
                <select
                  value={newIngredientUnit}
                  onChange={(e) =>
                    setNewIngredientUnit(
                      e.target.value as CoreIngredient["unit"],
                    )
                  }
                  style={{ padding: "8px 12px", fontSize: "14px" }}
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
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {savingIngredient ? "A guardar..." : "Guardar"}
              </button>
            </form>
          )}
          <div style={{ display: "grid", gap: "12px" }}>
            {ingredients.length === 0 ? (
              <p
                style={{ color: "#666", padding: "20px", textAlign: "center" }}
              >
                Nenhum ingrediente cadastrado. Clique em &quot;Novo
                ingrediente&quot; para criar.
              </p>
            ) : (
              ingredients.map((ing) => (
                <div
                  key={ing.id}
                  style={{
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {ing.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "#666" }}>
                        Unidade: {ing.unit}
                      </p>
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
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            Estoque
          </h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {stockLevels.length === 0 ? (
              <p
                style={{ color: "#666", padding: "20px", textAlign: "center" }}
              >
                Nenhum nível de estoque cadastrado.
              </p>
            ) : (
              stockLevels.map((stock) => {
                const isLow = stock.qty <= stock.min_qty;
                return (
                  <div
                    key={stock.id}
                    style={{
                      padding: "16px",
                      backgroundColor: isLow ? "#fef2f2" : "#f9fafb",
                      border: `2px solid ${isLow ? "#dc2626" : "#e5e7eb"}`,
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          {stock.ingredient?.name || "Ingrediente"}
                          {isLow && (
                            <span
                              style={{ color: "#dc2626", marginLeft: "8px" }}
                            >
                              ⚠️ BAIXO
                            </span>
                          )}
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginBottom: "8px",
                          }}
                        >
                          Local: {stock.location?.name || "N/A"}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            fontSize: "14px",
                          }}
                        >
                          <span>
                            <strong>Atual:</strong> {stock.qty}{" "}
                            {stock.ingredient?.unit || ""}
                          </span>
                          <span>
                            <strong>Mínimo:</strong> {stock.min_qty}{" "}
                            {stock.ingredient?.unit || ""}
                          </span>
                          <span style={{ color: isLow ? "#dc2626" : "#666" }}>
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>
              Receitas (BOM)
            </h2>
            <button
              type="button"
              onClick={() => setShowNewRecipe((v) => !v)}
              disabled={products.length === 0 || ingredients.length === 0}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  products.length && ingredients.length ? "#3b82f6" : "#9ca3af",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor:
                  products.length && ingredients.length
                    ? "pointer"
                    : "not-allowed",
                fontSize: "14px",
              }}
            >
              {showNewRecipe ? "Cancelar" : "+ Nova receita"}
            </button>
          </div>
          {showNewRecipe && (
            <form
              onSubmit={handleCreateBOM}
              style={{
                padding: "16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
                marginBottom: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "flex-end",
              }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ fontSize: "13px", color: "#666" }}>Produto</span>
                <select
                  value={newRecipeProductId}
                  onChange={(e) => setNewRecipeProductId(e.target.value)}
                  required
                  style={{
                    padding: "8px 12px",
                    fontSize: "14px",
                    minWidth: 180,
                  }}
                >
                  <option value="">— Escolher —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ fontSize: "13px", color: "#666" }}>
                  Ingrediente
                </span>
                <select
                  value={newRecipeIngredientId}
                  onChange={(e) => setNewRecipeIngredientId(e.target.value)}
                  required
                  style={{
                    padding: "8px 12px",
                    fontSize: "14px",
                    minWidth: 180,
                  }}
                >
                  <option value="">— Escolher —</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ fontSize: "13px", color: "#666" }}>
                  Qtd. por unidade
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newRecipeQty}
                  onChange={(e) => setNewRecipeQty(e.target.value)}
                  placeholder="1"
                  required
                  style={{ padding: "8px 12px", fontSize: "14px", width: 80 }}
                />
              </label>
              <button
                type="submit"
                disabled={savingRecipe}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {savingRecipe ? "A guardar..." : "Guardar"}
              </button>
            </form>
          )}
          <div style={{ display: "grid", gap: "12px" }}>
            {productBOM.length === 0 ? (
              <p
                style={{ color: "#666", padding: "20px", textAlign: "center" }}
              >
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
                  <div
                    key={bom.id}
                    style={{
                      padding: "16px",
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          {productName} → {ingredientName}
                        </h3>
                        <p style={{ fontSize: "12px", color: "#666" }}>
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
