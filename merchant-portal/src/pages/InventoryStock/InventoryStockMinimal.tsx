/**
 * INVENTORY STOCK MINIMAL — Gestão de Inventário e Estoque
 *
 * Tela completa para gerenciar:
 * - Locais (onde as coisas existem)
 * - Equipamentos (inventário físico)
 * - Ingredientes (o que se mede)
 * - Estoque (quantidades e mínimos)
 * - Receitas (BOM: produtos -> ingredientes)
 *
 * Usa o Design System Sovereign (Card, Button, Input, Select, Badge,
 * GlobalEmptyView, GlobalLoadingView).
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import {
  addIngredientToEquipment,
  associateBarcode,
  createEquipment,
  deleteEquipment,
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_KIND_LABELS,
  getEquipmentKindOptions,
  importIngredientPack,
  INGREDIENT_CATEGORY_LABELS,
  listIngredientPacks,
  lookupIngredientByBarcode,
  readEquipment,
  readEquipmentIngredients,
  readIngredients,
  readLocations,
  readProductBOM,
  readStockLevels,
  removeIngredientFromEquipment,
  updateEquipment,
  type BarcodeLookupResult,
  type CoreEquipment,
  type CoreIngredient,
  type CoreLocation,
  type EquipmentCategory,
  type EquipmentIngredientRow,
  type EquipmentInput,
  type EquipmentKind,
  type IngredientCategory,
  type PresetPack,
} from "../../infra/readers/InventoryStockReader";
import {
  GlobalEmptyView,
  GlobalLoadingView,
} from "../../ui/design-system/components";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
} from "../../ui/design-system/primitives";
import styles from "./InventoryStockMinimal.module.css";

type TabType =
  | "locations"
  | "equipment"
  | "ingredients"
  | "stock"
  | "recipes"
  | "movements"
  | "scan";

type StockMovementAction = "IN" | "OUT" | "ADJUST" | "TRANSFER";

const TAB_LABELS: Record<TabType, { icon: string; label: string }> = {
  locations: { icon: "📍", label: "Locais" },
  equipment: { icon: "🔧", label: "Equipamentos" },
  ingredients: { icon: "🥘", label: "Ingredientes" },
  stock: { icon: "📊", label: "Estoque" },
  recipes: { icon: "📝", label: "Receitas" },
  movements: { icon: "🔁", label: "Movimentos" },
  scan: { icon: "📷", label: "Scan" },
};

const MOVEMENT_ACTIONS: { value: StockMovementAction; label: string }[] = [
  { value: "IN", label: "Entrada" },
  { value: "OUT", label: "Saida" },
  { value: "ADJUST", label: "Ajuste" },
  { value: "TRANSFER", label: "Transferencia" },
];

const UNIT_OPTIONS = [
  { value: "unit", label: "Unidade" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
];

export function InventoryStockMinimal() {
  const navigate = useNavigate();
  const { identity } = useRestaurantIdentity();
  const restaurantId =
    identity?.restaurantId || "00000000-0000-0000-0000-000000000100";

  const [activeTab, setActiveTab] = useState<TabType>("locations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [locations, setLocations] = useState<CoreLocation[]>([]);
  const [equipment, setEquipment] = useState<CoreEquipment[]>([]);
  const [ingredients, setIngredients] = useState<CoreIngredient[]>([]);
  const [stockLevels, setStockLevels] = useState<any[]>([]);
  const [productBOM, setProductBOM] = useState<any[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [equipmentIngredients, setEquipmentIngredients] = useState<
    EquipmentIngredientRow[]
  >([]);

  // Form: novo ingrediente
  const [showNewIngredient, setShowNewIngredient] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientUnit, setNewIngredientUnit] =
    useState<CoreIngredient["unit"]>("unit");
  const [savingIngredient, setSavingIngredient] = useState(false);

  // Form: nova receita (BOM)
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [newRecipeProductId, setNewRecipeProductId] = useState("");
  const [newRecipeIngredientId, setNewRecipeIngredientId] = useState("");
  const [newRecipeQty, setNewRecipeQty] = useState("1");
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Form: movimento de estoque
  const [movementAction, setMovementAction] =
    useState<StockMovementAction>("IN");
  const [movementIngredientId, setMovementIngredientId] = useState("");
  const [movementLocationId, setMovementLocationId] = useState("");
  const [movementTargetLocationId, setMovementTargetLocationId] = useState("");
  const [movementQty, setMovementQty] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [savingMovement, setSavingMovement] = useState(false);

  // Form: novo/editar equipamento
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(
    null,
  );
  const [eqName, setEqName] = useState("");
  const [eqKind, setEqKind] = useState<EquipmentKind>("OTHER");
  const [eqCategory, setEqCategory] = useState<EquipmentCategory>("OTHER");
  const [eqLocationId, setEqLocationId] = useState("");
  const [eqDescription, setEqDescription] = useState("");
  const [eqCapacityNote, setEqCapacityNote] = useState("");
  const [eqTempMin, setEqTempMin] = useState("");
  const [eqTempMax, setEqTempMax] = useState("");
  const [eqBrand, setEqBrand] = useState("");
  const [eqModel, setEqModel] = useState("");
  const [savingEquipment, setSavingEquipment] = useState(false);

  // Equipment detail view
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(
    null,
  );
  const [addingIngredientToEq, setAddingIngredientToEq] = useState(false);
  const [eqIngredientId, setEqIngredientId] = useState("");
  const [eqIngredientNotes, setEqIngredientNotes] = useState("");

  // Filter
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState<
    EquipmentCategory | "ALL"
  >("ALL");

  // Scan tab state
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanResult, setScanResult] = useState<BarcodeLookupResult | null>(
    null,
  );
  const [scanQty, setScanQty] = useState("1");
  const [scanLocationId, setScanLocationId] = useState("");
  const [scanCounter, setScanCounter] = useState(0);
  const [scanAssociateIngredientId, setScanAssociateIngredientId] =
    useState("");
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scanLastMessage, setScanLastMessage] = useState("");

  // Cost field for movements
  const [movementUnitCost, setMovementUnitCost] = useState("");

  // Import pack state
  const [availablePacks, setAvailablePacks] = useState<PresetPack[]>([]);
  const [importingPack, setImportingPack] = useState(false);
  const [importPackMessage, setImportPackMessage] = useState("");

  useEffect(() => {
    loadAllData();
  }, [restaurantId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [locs, eq, ing, stock, bom, prods, eqIng] = await Promise.all([
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
        readEquipmentIngredients(restaurantId).catch(() => []),
      ]);

      setLocations(locs);
      setEquipment(eq);
      setIngredients(ing);
      setStockLevels(stock);
      setProductBOM(bom);
      setProducts(prods);
      setEquipmentIngredients(eqIng);
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
        .insert({ restaurant_id: restaurantId, name, unit: newIngredientUnit })
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

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!movementIngredientId || !movementLocationId) return;
    if (movementAction === "TRANSFER" && !movementTargetLocationId) return;

    const qty = parseFloat(movementQty.replace(",", "."));
    if (Number.isNaN(qty) || qty <= 0) return;

    setSavingMovement(true);
    try {
      const unitCostVal = movementUnitCost
        ? parseFloat(movementUnitCost.replace(",", "."))
        : null;
      const { error: rpcError } = await dockerCoreClient.rpc(
        "apply_stock_movement",
        {
          p_restaurant_id: restaurantId,
          p_action: movementAction,
          p_ingredient_id: movementIngredientId,
          p_location_id: movementLocationId,
          p_qty: qty,
          p_reason: movementReason.trim() || null,
          p_target_location_id:
            movementAction === "TRANSFER" ? movementTargetLocationId : null,
          p_unit_cost:
            movementAction === "IN" && unitCostVal && !Number.isNaN(unitCostVal)
              ? unitCostVal
              : null,
        },
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setMovementIngredientId("");
      setMovementLocationId("");
      setMovementTargetLocationId("");
      setMovementQty("");
      setMovementReason("");
      setMovementAction("IN");
      setMovementUnitCost("");
      await loadAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao registrar movimento",
      );
    } finally {
      setSavingMovement(false);
    }
  };

  // ─── Equipment form helpers ───

  const kindOptions = getEquipmentKindOptions();

  const resetEquipmentForm = useCallback(() => {
    setEqName("");
    setEqKind("OTHER");
    setEqCategory("OTHER");
    setEqLocationId("");
    setEqDescription("");
    setEqCapacityNote("");
    setEqTempMin("");
    setEqTempMax("");
    setEqBrand("");
    setEqModel("");
    setEditingEquipmentId(null);
    setShowEquipmentForm(false);
  }, []);

  const openNewEquipmentForm = () => {
    resetEquipmentForm();
    setShowEquipmentForm(true);
  };

  const openEditEquipmentForm = (eq: CoreEquipment) => {
    setEditingEquipmentId(eq.id);
    setEqName(eq.name);
    setEqKind(eq.kind);
    setEqCategory(eq.category || "OTHER");
    setEqLocationId(eq.location_id || "");
    setEqDescription(eq.description || "");
    setEqCapacityNote(eq.capacity_note || "");
    setEqTempMin(eq.ideal_temp_min != null ? String(eq.ideal_temp_min) : "");
    setEqTempMax(eq.ideal_temp_max != null ? String(eq.ideal_temp_max) : "");
    setEqBrand(eq.brand || "");
    setEqModel(eq.model || "");
    setShowEquipmentForm(true);
    setSelectedEquipmentId(null);
  };

  // Auto-set category when kind changes
  const handleKindChange = (kind: EquipmentKind) => {
    setEqKind(kind);
    const opt = kindOptions.find((o) => o.value === kind);
    if (opt) setEqCategory(opt.category);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = eqName.trim();
    if (!name) return;
    setSavingEquipment(true);

    const input: EquipmentInput = {
      restaurant_id: restaurantId,
      name,
      kind: eqKind,
      category: eqCategory,
      location_id: eqLocationId || null,
      description: eqDescription.trim() || null,
      capacity_note: eqCapacityNote.trim() || null,
      ideal_temp_min: eqTempMin ? parseFloat(eqTempMin) : null,
      ideal_temp_max: eqTempMax ? parseFloat(eqTempMax) : null,
      brand: eqBrand.trim() || null,
      model: eqModel.trim() || null,
    };

    try {
      if (editingEquipmentId) {
        const { restaurant_id: _, ...updates } = input;
        await updateEquipment(editingEquipmentId, updates);
      } else {
        await createEquipment(input);
      }
      resetEquipmentForm();
      await loadAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao guardar equipamento",
      );
    } finally {
      setSavingEquipment(false);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!window.confirm("Tem certeza que quer remover este equipamento?"))
      return;
    try {
      await deleteEquipment(id);
      setSelectedEquipmentId(null);
      await loadAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover equipamento",
      );
    }
  };

  // ─── Equipment ↔ Ingredient mapping ───

  const handleAddIngredientToEquipment = async (equipmentId: string) => {
    if (!eqIngredientId) return;
    setAddingIngredientToEq(true);
    try {
      await addIngredientToEquipment(
        restaurantId,
        equipmentId,
        eqIngredientId,
        eqIngredientNotes.trim() || undefined,
      );
      setEqIngredientId("");
      setEqIngredientNotes("");
      await loadAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao associar ingrediente",
      );
    } finally {
      setAddingIngredientToEq(false);
    }
  };

  const handleRemoveIngredientFromEquipment = async (mappingId: string) => {
    try {
      await removeIngredientFromEquipment(mappingId);
      await loadAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover associação",
      );
    }
  };

  // ─── Scan handlers ───

  const handleScanSubmit = async (barcodeValue?: string) => {
    const code = (barcodeValue ?? scanBarcode).trim();
    if (!code) return;
    setScanProcessing(true);
    setScanLastMessage("");
    try {
      const result = await lookupIngredientByBarcode(restaurantId, code);
      setScanResult(result);
      if (result.found) {
        setScanLastMessage(`✅ Encontrado: ${result.name} (${result.unit})`);
      } else {
        setScanLastMessage(
          `❓ Barcode "${code}" não associado. Selecione um ingrediente abaixo para associar.`,
        );
      }
    } catch (err) {
      setScanLastMessage("Erro ao procurar barcode.");
    } finally {
      setScanProcessing(false);
    }
  };

  const handleScanQuickMovement = async () => {
    if (!scanResult?.found || !scanResult.ingredient_id || !scanLocationId)
      return;
    const qty = parseFloat(scanQty.replace(",", "."));
    if (Number.isNaN(qty) || qty <= 0) return;
    setScanProcessing(true);
    try {
      const { error: rpcError } = await dockerCoreClient.rpc(
        "apply_stock_movement",
        {
          p_restaurant_id: restaurantId,
          p_action: "IN",
          p_ingredient_id: scanResult.ingredient_id,
          p_location_id: scanLocationId,
          p_qty: qty,
          p_reason: "Scan barcode",
          p_target_location_id: null,
        },
      );
      if (rpcError) throw new Error(rpcError.message);
      setScanCounter((c) => c + 1);
      setScanLastMessage(
        `✅ +${qty} ${scanResult.unit || ""} de ${
          scanResult.name
        } registado (total: ${scanCounter + 1})`,
      );
      setScanBarcode("");
      setScanResult(null);
      setScanQty("1");
      await loadAllData();
    } catch (err) {
      setScanLastMessage(
        err instanceof Error ? err.message : "Erro ao registrar movimento",
      );
    } finally {
      setScanProcessing(false);
    }
  };

  const handleScanAssociate = async () => {
    const code = scanBarcode.trim();
    if (!code || !scanAssociateIngredientId) return;
    setScanProcessing(true);
    try {
      const ok = await associateBarcode(scanAssociateIngredientId, code);
      if (ok) {
        const ing = ingredients.find((i) => i.id === scanAssociateIngredientId);
        setScanLastMessage(
          `✅ Barcode "${code}" associado a "${ing?.name || "ingrediente"}"`,
        );
        setScanAssociateIngredientId("");
        setScanBarcode("");
        setScanResult(null);
        await loadAllData();
      } else {
        setScanLastMessage("Erro ao associar barcode.");
      }
    } catch (err) {
      setScanLastMessage("Erro ao associar barcode.");
    } finally {
      setScanProcessing(false);
    }
  };

  /** Handle HID scanner Enter key */
  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScanSubmit();
    }
  };

  // ─── Import pack handler ───

  const handleLoadPacks = async () => {
    const packs = await listIngredientPacks();
    setAvailablePacks(packs);
  };

  const handleImportPack = async (pack: string) => {
    setImportingPack(true);
    setImportPackMessage("");
    try {
      const result = await importIngredientPack(restaurantId, pack);
      if (result) {
        setImportPackMessage(
          `✅ Pack "${pack}": ${result.imported} importados, ${result.skipped} existentes (${result.total_in_pack} total)`,
        );
        await loadAllData();
      } else {
        setImportPackMessage("Erro ao importar pack.");
      }
    } catch (err) {
      setImportPackMessage("Erro ao importar pack.");
    } finally {
      setImportingPack(false);
    }
  };

  // ─── Derived data ───

  /** Ingredients already assigned to a given equipment */
  const getIngredientsForEquipment = (equipmentId: string) =>
    equipmentIngredients.filter((ei) => ei.equipment_id === equipmentId);

  /** Equipment filtered by category */
  const filteredEquipment =
    equipmentCategoryFilter === "ALL"
      ? equipment
      : equipment.filter((eq) => eq.category === equipmentCategoryFilter);

  /** Location name by ID */
  const locationName = (id: string | null | undefined) =>
    id ? locations.find((l) => l.id === id)?.name || "—" : "—";

  /** Temperature display */
  const tempDisplay = (
    min: number | null | undefined,
    max: number | null | undefined,
  ) => {
    if (min == null && max == null) return null;
    if (min != null && max != null) return `${min}°C a ${max}°C`;
    if (min != null) return `≥ ${min}°C`;
    return `≤ ${max}°C`;
  };

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
          .upsert(
            {
              restaurant_id: restaurantId,
              name: loc.name,
              kind: loc.kind,
            },
            { onConflict: "restaurant_id,name" },
          )
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

  // ─── Loading ───
  if (loading) {
    return (
      <GlobalLoadingView
        message="Carregando inventário e estoque..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  const isTransfer = movementAction === "TRANSFER";
  const movementQtyValue = parseFloat(movementQty.replace(",", "."));
  const hasMovementPrereqs = ingredients.length > 0 && locations.length > 0;
  const canSubmitMovement =
    hasMovementPrereqs &&
    !!movementIngredientId &&
    !!movementLocationId &&
    (!isTransfer || !!movementTargetLocationId) &&
    !Number.isNaN(movementQtyValue) &&
    movementQtyValue > 0;

  // ─── Render ───
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/modules")}
        >
          ← Voltar
        </Button>
        <h1 className={styles.pageTitle}>📦 Inventário e Estoque</h1>
      </header>

      {/* Error banner */}
      {error && (
        <Card padding="sm" elevated style={{ marginBottom: 16 }}>
          <p className={styles.errorText}>{error}</p>
        </Card>
      )}

      {/* Tabs */}
      <nav className={styles.tabs}>
        {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab} ${
              activeTab === tab ? styles.tabActive : ""
            } ${tab === "scan" ? styles.tabScan : ""}`}
          >
            <span className={styles.tabIcon}>{TAB_LABELS[tab].icon}</span>
            <span className={styles.tabLabel}>{TAB_LABELS[tab].label}</span>
          </button>
        ))}
      </nav>

      {/* Quick-Scan Bar — always visible when not on Scan tab */}
      {activeTab !== "scan" && (
        <div
          className={styles.quickScanBar}
          onClick={() => setActiveTab("scan")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("scan")}
        >
          <span className={styles.quickScanIcon}>📷</span>
          <div className={styles.quickScanText}>
            <p className={styles.quickScanTitle}>
              Barcode Scanner (NETUM C750)
            </p>
            <p className={styles.quickScanHint}>
              Clique aqui ou use o tab "Scan" para ler códigos de barras
            </p>
          </div>
          <span className={styles.quickScanBadge}>SCAN</span>
        </div>
      )}

      {/* ═══ LOCAIS ═══ */}
      {activeTab === "locations" && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Locais</h2>
            <Button
              variant="constructive"
              size="sm"
              onClick={handleCreateDefaultLocations}
            >
              + Criar Locais Padrão
            </Button>
          </div>

          {locations.length === 0 ? (
            <GlobalEmptyView
              title="Nenhum local criado"
              description='Clique em "Criar Locais Padrão" para começar.'
              layout="operational"
              variant="inline"
              action={{
                label: "Criar Locais Padrão",
                onClick: handleCreateDefaultLocations,
              }}
            />
          ) : (
            <div className={styles.grid}>
              {locations.map((loc) => {
                const stockAtLocation = stockLevels.filter(
                  (s) => s.location_id === loc.id,
                );
                const eqAtLocation = equipment.filter(
                  (e) => e.location_id === loc.id,
                );
                return (
                  <Card
                    key={loc.id}
                    padding="md"
                    hoverable
                    onClick={() => {
                      setMovementLocationId(loc.id);
                      setActiveTab("stock");
                    }}
                  >
                    <div className={styles.cardRow}>
                      <h3 className={styles.cardTitle}>{loc.name}</h3>
                      <Badge
                        status="neutral"
                        variant="outline"
                        label={loc.kind}
                        size="sm"
                      />
                    </div>
                    <div className={styles.stockStats}>
                      <span>
                        📦 <strong>{stockAtLocation.length}</strong> items
                      </span>
                      <span>
                        🔧 <strong>{eqAtLocation.length}</strong> equip.
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══ EQUIPAMENTOS (Full CRUD + Ingredient Mapping) ═══ */}
      {activeTab === "equipment" && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Equipamentos</h2>
            <Button
              variant={showEquipmentForm ? "ghost" : "constructive"}
              size="sm"
              onClick={() =>
                showEquipmentForm
                  ? resetEquipmentForm()
                  : openNewEquipmentForm()
              }
            >
              {showEquipmentForm ? "Cancelar" : "+ Novo Equipamento"}
            </Button>
          </div>

          {/* ── Category filter ── */}
          {equipment.length > 0 &&
            !showEquipmentForm &&
            !selectedEquipmentId && (
              <div className={styles.filterRow}>
                <button
                  type="button"
                  className={`${styles.filterChip} ${
                    equipmentCategoryFilter === "ALL"
                      ? styles.filterChipActive
                      : ""
                  }`}
                  onClick={() => setEquipmentCategoryFilter("ALL")}
                >
                  Todos ({equipment.length})
                </button>
                {(
                  Object.keys(EQUIPMENT_CATEGORY_LABELS) as EquipmentCategory[]
                ).map((cat) => {
                  const count = equipment.filter(
                    (e) => e.category === cat,
                  ).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`${styles.filterChip} ${
                        equipmentCategoryFilter === cat
                          ? styles.filterChipActive
                          : ""
                      }`}
                      onClick={() => setEquipmentCategoryFilter(cat)}
                    >
                      {EQUIPMENT_CATEGORY_LABELS[cat]} ({count})
                    </button>
                  );
                })}
              </div>
            )}

          {/* ── Equipment create/edit form ── */}
          {showEquipmentForm && (
            <Card padding="lg" style={{ marginBottom: 24 }}>
              <h3 className={`${styles.cardTitle} ${styles.formHeader}`}>
                {editingEquipmentId
                  ? "✏️ Editar Equipamento"
                  : "➕ Novo Equipamento"}
              </h3>
              <form onSubmit={handleSaveEquipment} className={styles.form}>
                <div className={styles.formRow}>
                  <Input
                    label="Nome *"
                    type="text"
                    value={eqName}
                    onChange={(e) => setEqName(e.target.value)}
                    placeholder="ex: Congelador Principal"
                    required
                    fullWidth
                  />
                  <Select
                    label="Tipo *"
                    value={eqKind}
                    onChange={(e) =>
                      handleKindChange(e.target.value as EquipmentKind)
                    }
                    required
                    fullWidth
                  >
                    {(
                      Object.keys(
                        EQUIPMENT_CATEGORY_LABELS,
                      ) as EquipmentCategory[]
                    ).map((cat) => (
                      <optgroup
                        key={cat}
                        label={EQUIPMENT_CATEGORY_LABELS[cat]}
                      >
                        {kindOptions
                          .filter((o) => o.category === cat)
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </Select>
                </div>

                <div className={styles.formRow}>
                  <Select
                    label="Local"
                    value={eqLocationId}
                    onChange={(e) => setEqLocationId(e.target.value)}
                    fullWidth
                  >
                    <option value="">— Sem local —</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Descrição"
                    type="text"
                    value={eqDescription}
                    onChange={(e) => setEqDescription(e.target.value)}
                    placeholder="ex: Congelador para massas e pães"
                    fullWidth
                  />
                </div>

                <div className={styles.formRow}>
                  <Input
                    label="Temp. Mínima (°C)"
                    type="number"
                    value={eqTempMin}
                    onChange={(e) => setEqTempMin(e.target.value)}
                    placeholder="ex: -22"
                  />
                  <Input
                    label="Temp. Máxima (°C)"
                    type="number"
                    value={eqTempMax}
                    onChange={(e) => setEqTempMax(e.target.value)}
                    placeholder="ex: -16"
                  />
                  <Input
                    label="Capacidade"
                    type="text"
                    value={eqCapacityNote}
                    onChange={(e) => setEqCapacityNote(e.target.value)}
                    placeholder="ex: 500L"
                  />
                </div>

                <div className={styles.formRow}>
                  <Input
                    label="Marca"
                    type="text"
                    value={eqBrand}
                    onChange={(e) => setEqBrand(e.target.value)}
                    placeholder="ex: Electrolux"
                  />
                  <Input
                    label="Modelo"
                    type="text"
                    value={eqModel}
                    onChange={(e) => setEqModel(e.target.value)}
                    placeholder="ex: FE26"
                  />
                </div>

                <div className={styles.formActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetEquipmentForm}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="constructive"
                    type="submit"
                    isLoading={savingEquipment}
                    disabled={savingEquipment || !eqName.trim()}
                  >
                    {savingEquipment
                      ? "A guardar..."
                      : editingEquipmentId
                      ? "Atualizar"
                      : "Criar"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── Equipment detail/expanded view ── */}
          {selectedEquipmentId &&
            (() => {
              const eq = equipment.find((e) => e.id === selectedEquipmentId);
              if (!eq) return null;
              const eqIngs = getIngredientsForEquipment(eq.id);
              const temp = tempDisplay(eq.ideal_temp_min, eq.ideal_temp_max);
              const assignedIngredientIds = new Set(
                eqIngs.map((ei) => ei.ingredient_id),
              );
              const availableIngredients = ingredients.filter(
                (i) => !assignedIngredientIds.has(i.id),
              );

              return (
                <Card padding="lg" elevated style={{ marginBottom: 24 }}>
                  <div className={`${styles.cardRow} ${styles.detailHeader}`}>
                    <div>
                      <h3 className={styles.cardTitle}>{eq.name}</h3>
                      <p className={styles.cardMeta}>
                        {EQUIPMENT_KIND_LABELS[eq.kind]}
                        {eq.category &&
                          ` · ${
                            EQUIPMENT_CATEGORY_LABELS[
                              eq.category as EquipmentCategory
                            ]
                          }`}
                      </p>
                    </div>
                    <div className={styles.detailActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditEquipmentForm(eq)}
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEquipment(eq.id)}
                      >
                        🗑️ Remover
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEquipmentId(null)}
                      >
                        ✕ Fechar
                      </Button>
                    </div>
                  </div>

                  {/* Equipment details */}
                  <div className={styles.detailGrid}>
                    {eq.description && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>📝 Descrição</span>
                        <span className={styles.detailValue}>
                          {eq.description}
                        </span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>📍 Local</span>
                      <span className={styles.detailValue}>
                        {locationName(eq.location_id)}
                      </span>
                    </div>
                    {temp && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>
                          🌡️ Temperatura
                        </span>
                        <span className={styles.detailValue}>{temp}</span>
                      </div>
                    )}
                    {eq.capacity_note && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>
                          📦 Capacidade
                        </span>
                        <span className={styles.detailValue}>
                          {eq.capacity_note}
                        </span>
                      </div>
                    )}
                    {(eq.brand || eq.model) && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>
                          🏷️ Marca/Modelo
                        </span>
                        <span className={styles.detailValue}>
                          {[eq.brand, eq.model].filter(Boolean).join(" ")}
                        </span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>⚡ Estado</span>
                      <Badge
                        status={eq.is_active ? "success" : "error"}
                        variant="outline"
                        label={eq.is_active ? "Ativo" : "Inativo"}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Stored ingredients section */}
                  <div className={styles.storedSection}>
                    <h4
                      className={`${styles.sectionTitle} ${styles.storedTitle}`}
                    >
                      🧊 Ingredientes armazenados neste equipamento
                    </h4>

                    {eqIngs.length === 0 ? (
                      <p className={`${styles.cardMeta} ${styles.storedEmpty}`}>
                        Nenhum ingrediente associado.
                      </p>
                    ) : (
                      <div className={styles.ingredientChipList}>
                        {eqIngs.map((ei) => {
                          const ingName =
                            ingredients.find((i) => i.id === ei.ingredient_id)
                              ?.name || ei.ingredient_id;
                          return (
                            <div key={ei.id} className={styles.ingredientChip}>
                              <span>{ingName}</span>
                              {ei.notes && (
                                <span className={styles.chipNotes}>
                                  {ei.notes}
                                </span>
                              )}
                              <button
                                type="button"
                                className={styles.chipRemove}
                                title="Remover"
                                onClick={() =>
                                  handleRemoveIngredientFromEquipment(ei.id)
                                }
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add ingredient form */}
                    {availableIngredients.length > 0 && (
                      <div
                        className={`${styles.formRow} ${styles.addIngredientRow}`}
                      >
                        <Select
                          label="Adicionar ingrediente"
                          value={eqIngredientId}
                          onChange={(e) => setEqIngredientId(e.target.value)}
                          fullWidth
                        >
                          <option value="">— Escolher —</option>
                          {availableIngredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.unit})
                            </option>
                          ))}
                        </Select>
                        <Input
                          label="Notas"
                          type="text"
                          value={eqIngredientNotes}
                          onChange={(e) => setEqIngredientNotes(e.target.value)}
                          placeholder="ex: Prateleira de cima"
                        />
                        <Button
                          variant="constructive"
                          size="sm"
                          onClick={() => handleAddIngredientToEquipment(eq.id)}
                          disabled={!eqIngredientId || addingIngredientToEq}
                          isLoading={addingIngredientToEq}
                          className={styles.addIngredientBtn}
                        >
                          + Associar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })()}

          {/* ── Equipment list (cards) ── */}
          {!showEquipmentForm && !selectedEquipmentId && (
            <>
              {filteredEquipment.length === 0 ? (
                <GlobalEmptyView
                  title={
                    equipmentCategoryFilter === "ALL"
                      ? "Nenhum equipamento cadastrado"
                      : `Nenhum equipamento na categoria ${EQUIPMENT_CATEGORY_LABELS[equipmentCategoryFilter]}`
                  }
                  description='Clique em "+ Novo Equipamento" para registar o primeiro.'
                  layout="operational"
                  variant="inline"
                  action={{
                    label: "Novo Equipamento",
                    onClick: openNewEquipmentForm,
                  }}
                />
              ) : (
                <div className={styles.grid}>
                  {filteredEquipment.map((eq) => {
                    const temp = tempDisplay(
                      eq.ideal_temp_min,
                      eq.ideal_temp_max,
                    );
                    const eqIngs = getIngredientsForEquipment(eq.id);
                    return (
                      <Card
                        key={eq.id}
                        padding="md"
                        hoverable
                        onClick={() => setSelectedEquipmentId(eq.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className={styles.cardRow}>
                          <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>{eq.name}</h3>
                            <p className={styles.cardMeta}>
                              {EQUIPMENT_KIND_LABELS[eq.kind]}
                              {eq.location_id &&
                                ` · 📍 ${locationName(eq.location_id)}`}
                            </p>
                            {temp && (
                              <p className={styles.cardMeta}>🌡️ {temp}</p>
                            )}
                            {eq.description && (
                              <p
                                className={`${styles.cardMeta} ${styles.cardDescription}`}
                              >
                                {eq.description}
                              </p>
                            )}
                            {eqIngs.length > 0 && (
                              <p className={styles.cardMeta}>
                                🧊 {eqIngs.length} ingrediente
                                {eqIngs.length !== 1 ? "s" : ""} armazenado
                                {eqIngs.length !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                          <div className={styles.cardBadges}>
                            <Badge
                              status={eq.is_active ? "success" : "error"}
                              variant="outline"
                              label={eq.is_active ? "Ativo" : "Inativo"}
                              size="sm"
                            />
                            {eq.category && (
                              <Badge
                                status="info"
                                variant="outline"
                                label={
                                  EQUIPMENT_CATEGORY_LABELS[
                                    eq.category as EquipmentCategory
                                  ] || eq.category
                                }
                                size="sm"
                              />
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ═══ INGREDIENTES ═══ */}
      {activeTab === "ingredients" && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Ingredientes</h2>
            <div className={styles.headerButtons}>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await handleLoadPacks();
                }}
              >
                📦 Importar Pack
              </Button>
              <Button
                variant={showNewIngredient ? "ghost" : "constructive"}
                size="sm"
                onClick={() => setShowNewIngredient((v) => !v)}
              >
                {showNewIngredient ? "Cancelar" : "+ Novo ingrediente"}
              </Button>
            </div>
          </div>

          {/* Import pack dialog */}
          {availablePacks.length > 0 && (
            <Card padding="lg" style={{ marginBottom: 24 }}>
              <h3 className={styles.sectionTitle}>
                Packs de Ingredientes Pré-configurados
              </h3>
              <p className={`${styles.cardMeta} ${styles.mb12}`}>
                Importe ingredientes com um clique. Ingredientes existentes não
                são duplicados.
              </p>
              <div className={styles.packGrid}>
                {availablePacks.map((pack) => (
                  <Button
                    key={pack.pack}
                    variant="constructive"
                    size="sm"
                    isLoading={importingPack}
                    disabled={importingPack}
                    onClick={() => handleImportPack(pack.pack)}
                  >
                    {pack.pack.replace(/_/g, " ")} ({pack.count})
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvailablePacks([])}
                >
                  Fechar
                </Button>
              </div>
              {importPackMessage && (
                <p className={`${styles.cardMeta} ${styles.mt8}`}>
                  {importPackMessage}
                </p>
              )}
            </Card>
          )}

          {showNewIngredient && (
            <Card padding="lg" style={{ marginBottom: 24 }}>
              <form onSubmit={handleCreateIngredient} className={styles.form}>
                <div className={styles.formRow}>
                  <Input
                    label="Nome"
                    type="text"
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                    placeholder="ex: Tomate"
                    required
                    fullWidth
                  />
                  <Select
                    label="Unidade"
                    value={newIngredientUnit}
                    onChange={(e) =>
                      setNewIngredientUnit(
                        e.target.value as CoreIngredient["unit"],
                      )
                    }
                    options={UNIT_OPTIONS}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="constructive"
                    type="submit"
                    isLoading={savingIngredient}
                    disabled={savingIngredient}
                  >
                    {savingIngredient ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {ingredients.length === 0 && !showNewIngredient ? (
            <GlobalEmptyView
              title="Nenhum ingrediente cadastrado"
              description="Importe um pack de ingredientes pré-configurados ou crie ingredientes manualmente."
              layout="operational"
              variant="inline"
              action={{
                label: "📦 Importar Pack de Ingredientes",
                onClick: async () => {
                  await handleLoadPacks();
                },
              }}
            />
          ) : (
            <div className={styles.grid}>
              {ingredients.map((ing) => (
                <Card key={ing.id} padding="md" hoverable>
                  <div className={styles.cardRow}>
                    <h3 className={styles.cardTitle}>{ing.name}</h3>
                    <Badge
                      status="info"
                      variant="outline"
                      label={ing.unit}
                      size="sm"
                    />
                  </div>
                  <div className={styles.cardRowSnug}>
                    {ing.category && (
                      <Badge
                        status="neutral"
                        variant="subtle"
                        label={
                          INGREDIENT_CATEGORY_LABELS[ing.category] ??
                          ing.category
                        }
                        size="sm"
                      />
                    )}
                    {ing.barcode && (
                      <Badge
                        status="neutral"
                        variant="outline"
                        label={`🔖 ${ing.barcode}`}
                        size="sm"
                      />
                    )}
                  </div>
                  {(ing.cost_per_unit ?? 0) > 0 && (
                    <p className={styles.cardMeta}>
                      Custo: €{(ing.cost_per_unit ?? 0).toFixed(2)} / {ing.unit}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══ ESTOQUE ═══ */}
      {activeTab === "stock" && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Estoque</h2>
          </div>

          {stockLevels.length === 0 ? (
            <GlobalEmptyView
              title="Nenhum nível de estoque cadastrado"
              description="Configure ingredientes e locais primeiro."
              layout="operational"
              variant="inline"
            />
          ) : (
            <div className={styles.grid}>
              {stockLevels.map((stock) => {
                const isLow = stock.qty <= stock.min_qty;
                return (
                  <Card key={stock.id} padding="md" elevated={isLow}>
                    <div className={styles.cardRow}>
                      <h3 className={styles.cardTitle}>
                        {stock.ingredient?.name || "Ingrediente"}
                      </h3>
                      {isLow ? (
                        <Badge
                          status="error"
                          variant="solid"
                          label="⚠️ BAIXO"
                          size="sm"
                        />
                      ) : (
                        <Badge
                          status="success"
                          variant="outline"
                          label="OK"
                          size="sm"
                        />
                      )}
                    </div>
                    <p className={styles.cardMeta}>
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
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══ MOVIMENTOS ═══ */}
      {activeTab === "movements" && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Movimentos</h2>
          </div>

          {!hasMovementPrereqs ? (
            <GlobalEmptyView
              title="Configure ingredientes e locais"
              description="Crie ingredientes e locais para registrar movimentos de estoque."
              layout="operational"
              variant="inline"
              action={{
                label: "Abrir ingredientes",
                onClick: () => setActiveTab("ingredients"),
              }}
            />
          ) : (
            <Card padding="lg" elevated>
              <form onSubmit={handleCreateMovement}>
                <div className={styles.formRow}>
                  <Select
                    label="Tipo"
                    value={movementAction}
                    onChange={(e) => {
                      const next = e.target.value as StockMovementAction;
                      setMovementAction(next);
                      if (next !== "TRANSFER") {
                        setMovementTargetLocationId("");
                      }
                    }}
                    aria-label="Tipo de movimento"
                    options={MOVEMENT_ACTIONS}
                  />

                  <Select
                    label="Ingrediente"
                    value={movementIngredientId}
                    onChange={(e) => setMovementIngredientId(e.target.value)}
                    aria-label="Ingrediente"
                  >
                    <option value="">Selecione...</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Local"
                    value={movementLocationId}
                    onChange={(e) => setMovementLocationId(e.target.value)}
                    aria-label="Local"
                  >
                    <option value="">Selecione...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {isTransfer && (
                  <div className={styles.formRow}>
                    <Select
                      label="Local destino"
                      value={movementTargetLocationId}
                      onChange={(e) =>
                        setMovementTargetLocationId(e.target.value)
                      }
                      aria-label="Local destino"
                    >
                      <option value="">Selecione...</option>
                      {locations
                        .filter((loc) => loc.id !== movementLocationId)
                        .map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                )}

                <div className={styles.formRow}>
                  <Input
                    label="Quantidade"
                    type="number"
                    min="0"
                    step="0.01"
                    value={movementQty}
                    onChange={(e) => setMovementQty(e.target.value)}
                    placeholder="ex: 5"
                  />
                  <Input
                    label="Motivo"
                    type="text"
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    placeholder="ex: Compra, ajuste, perda"
                  />
                  {movementAction === "IN" && (
                    <Input
                      label="Custo unitário (€)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={movementUnitCost}
                      onChange={(e) => setMovementUnitCost(e.target.value)}
                      placeholder="ex: 2.50"
                    />
                  )}
                </div>

                <div className={styles.formActions}>
                  <Button
                    variant="constructive"
                    type="submit"
                    isLoading={savingMovement}
                    disabled={savingMovement || !canSubmitMovement}
                  >
                    {savingMovement ? "A registar..." : "Registrar movimento"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </section>
      )}

      {/* ═══ RECEITAS (BOM) ═══ */}
      {activeTab === "recipes" && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Receitas (BOM)</h2>
            <Button
              variant={showNewRecipe ? "ghost" : "constructive"}
              size="sm"
              onClick={() => setShowNewRecipe((v) => !v)}
              disabled={products.length === 0 || ingredients.length === 0}
            >
              {showNewRecipe ? "Cancelar" : "+ Nova receita"}
            </Button>
          </div>

          {showNewRecipe && (
            <Card padding="lg" style={{ marginBottom: 24 }}>
              <form onSubmit={handleCreateBOM} className={styles.form}>
                <div className={styles.formRow}>
                  <Select
                    label="Produto"
                    value={newRecipeProductId}
                    onChange={(e) => setNewRecipeProductId(e.target.value)}
                    required
                    fullWidth
                  >
                    <option value="">— Escolher —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Ingrediente"
                    value={newRecipeIngredientId}
                    onChange={(e) => setNewRecipeIngredientId(e.target.value)}
                    required
                    fullWidth
                  >
                    <option value="">— Escolher —</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit})
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Qtd. por unidade"
                    type="text"
                    inputMode="decimal"
                    value={newRecipeQty}
                    onChange={(e) => setNewRecipeQty(e.target.value)}
                    placeholder="1"
                    required
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="constructive"
                    type="submit"
                    isLoading={savingRecipe}
                    disabled={savingRecipe}
                  >
                    {savingRecipe ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {productBOM.length === 0 && !showNewRecipe ? (
            <GlobalEmptyView
              title="Nenhuma receita cadastrada"
              description='Crie produtos e ingredientes primeiro, depois "Nova receita".'
              layout="operational"
              variant="inline"
            />
          ) : (
            <div className={styles.grid}>
              {productBOM.map((bom: any) => {
                const productName =
                  products.find((p) => p.id === bom.product_id)?.name ||
                  bom.product_id;
                const ingredientName =
                  bom.ingredient?.name || bom.ingredient_id;
                const unit = bom.ingredient?.unit || "";
                return (
                  <Card key={bom.id} padding="md" hoverable>
                    <h3 className={styles.cardTitle}>
                      {productName} → {ingredientName}
                    </h3>
                    <p className={styles.cardMeta}>
                      {bom.qty_per_unit} {unit} por unidade vendida
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══ SCAN (Barcode) ═══ */}
      {activeTab === "scan" && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📷 Scan Rápido</h2>
            {scanCounter > 0 && (
              <Badge
                status="success"
                variant="solid"
                label={`${scanCounter} movimentos`}
                size="sm"
              />
            )}
          </div>

          {!hasMovementPrereqs ? (
            <GlobalEmptyView
              title="Configure ingredientes e locais"
              description="Crie ingredientes e locais antes de usar o scan."
              layout="operational"
              variant="inline"
              action={{
                label: "Abrir ingredientes",
                onClick: () => setActiveTab("ingredients"),
              }}
            />
          ) : (
            <>
              {/* Barcode input — captures HID scanner (NETUM C750) */}
              <Card padding="lg" elevated style={{ marginBottom: 16 }}>
                <div className={styles.formRow}>
                  <Input
                    label="Código de barras"
                    type="text"
                    value={scanBarcode}
                    onChange={(e) => setScanBarcode(e.target.value)}
                    onKeyDown={handleScanKeyDown}
                    placeholder="Leia com o scanner ou digite o código..."
                    autoFocus
                    fullWidth
                  />
                  <Select
                    label="Local de entrada"
                    value={scanLocationId}
                    onChange={(e) => setScanLocationId(e.target.value)}
                    aria-label="Local de entrada"
                  >
                    <option value="">Selecione...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="constructive"
                    onClick={() => handleScanSubmit()}
                    isLoading={scanProcessing}
                    disabled={scanProcessing || !scanBarcode.trim()}
                  >
                    🔍 Procurar
                  </Button>
                </div>
              </Card>

              {/* Status message */}
              {scanLastMessage && (
                <Card padding="sm" style={{ marginBottom: 16 }}>
                  <p className={styles.cardMeta}>{scanLastMessage}</p>
                </Card>
              )}

              {/* Found — quick IN movement */}
              {scanResult?.found && (
                <Card padding="lg" style={{ marginBottom: 16 }}>
                  <h3 className={styles.sectionTitle}>✅ {scanResult.name}</h3>
                  <p className={styles.cardMeta}>
                    {scanResult.unit}
                    {scanResult.category
                      ? ` · ${
                          INGREDIENT_CATEGORY_LABELS[
                            scanResult.category as IngredientCategory
                          ] ?? scanResult.category
                        }`
                      : ""}
                    {(scanResult.cost_per_unit ?? 0) > 0
                      ? ` · €${(scanResult.cost_per_unit ?? 0).toFixed(2)}`
                      : ""}
                  </p>
                  <div className={`${styles.formRow} ${styles.mt12}`}>
                    <Input
                      label="Quantidade"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={scanQty}
                      onChange={(e) => setScanQty(e.target.value)}
                      placeholder="1"
                    />
                    <Button
                      variant="constructive"
                      onClick={handleScanQuickMovement}
                      isLoading={scanProcessing}
                      disabled={scanProcessing || !scanLocationId || !scanQty}
                    >
                      📥 Entrada rápida
                    </Button>
                  </div>
                </Card>
              )}

              {/* Not found — associate barcode */}
              {scanResult && !scanResult.found && (
                <Card padding="lg" style={{ marginBottom: 16 }}>
                  <h3 className={styles.sectionTitle}>Barcode não associado</h3>
                  <p className={`${styles.cardMeta} ${styles.mb12}`}>
                    Selecione um ingrediente para associar este código de
                    barras.
                  </p>
                  <div className={styles.formRow}>
                    <Select
                      label="Ingrediente"
                      value={scanAssociateIngredientId}
                      onChange={(e) =>
                        setScanAssociateIngredientId(e.target.value)
                      }
                      fullWidth
                    >
                      <option value="">Selecione...</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="constructive"
                      onClick={handleScanAssociate}
                      isLoading={scanProcessing}
                      disabled={scanProcessing || !scanAssociateIngredientId}
                    >
                      🔖 Associar
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
