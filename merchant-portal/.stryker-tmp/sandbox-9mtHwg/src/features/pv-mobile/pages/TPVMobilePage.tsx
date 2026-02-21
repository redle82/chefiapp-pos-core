/**
 * TPVMobilePage — MobileTPV for AppStaff
 *
 * Route: /app/staff/pv
 *
 * Features:
 * - Bottom tab navigation (POS, Mesas, Pedidos, Reservas)
 * - 2-column product grid (POS tab)
 * - Mobile table map (Tables tab)
 * - Active orders list (Orders tab)
 * - Reservations (only for owner/manager)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { useStaff } from "../../../pages/AppStaff/context/StaffContext";
import {
  KDSMobileGrid,
  KDSMobileHeader,
  KDSStatusTabs,
} from "../../kds-mobile/components";
import { useMobileKDS } from "../../kds-mobile/hooks/useMobileKDS";
import "../../kds-mobile/styles/kds-mobile.css";
import {
  CartBottomSheet,
  CategoryScroller,
  MobileHeader,
  MobileProductGrid,
  OrderTypeTabs,
  SearchModal,
  TableSelectionModal,
  type MobileCategory,
  type MobileProduct,
} from "../components";
import type { SelectedModifier } from "../components/ModifiersModal";
import {
  TPVMobileBottomNav,
  type TPVMobileTab,
} from "../components/TPVMobileBottomNav";
import { TPVMobileOrdersView } from "../components/TPVMobileOrdersView";
import { TPVMobileReservationsView } from "../components/TPVMobileReservationsView";
import { TPVMobileTablesView } from "../components/TPVMobileTablesView";
import { useMobileCart } from "../hooks/useMobileCart";
import "../styles/pv-mobile.css";
import "../styles/tpvm-complete.css";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export default function TPVMobilePage() {
  const navigate = useNavigate();
  const { restaurantId, shiftState, activeRole } = useStaff();

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TPVMobileTab>("pos");
  const [showTableModal, setShowTableModal] = useState(false);
  const [pendingOrderCount] = useState(0); // TODO: fetch from orders
  const [occupiedTableCount] = useState(0); // TODO: fetch from tables

  // POS state
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Role-based access
  const canViewReservations =
    activeRole === "owner" || activeRole === "manager";

  // Cart hook
  const {
    cart,
    itemCount,
    subtotal,
    tax,
    total,
    orderMode,
    isSending,
    selectedTable,
    paymentMethod,
    setOrderMode: setCartOrderMode,
    setTable,
    clearTable,
    addProduct,
    updateQuantity,
    updateItemModifiers,
    setPaymentMethod,
    clearCart,
    sendToKitchen,
  } = useMobileCart(restaurantId ?? "");

  // Handle order mode change — enforce table selection for Dine In
  const handleOrderModeChange = useCallback(
    (mode: "take_away" | "dine_in" | "delivery") => {
      setCartOrderMode(mode);
      if (mode === "dine_in" && !selectedTable) {
        setShowTableModal(true);
      } else if (mode !== "dine_in") {
        clearTable();
      }
    },
    [setCartOrderMode, selectedTable, clearTable],
  );

  // Redirect if no restaurant or shift
  useEffect(() => {
    if (!restaurantId) {
      navigate("/app/staff/home");
    }
  }, [restaurantId, navigate]);

  // Fetch products and categories
  useEffect(() => {
    if (!restaurantId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch categories
      const { data: catData, error: catError } = await dockerCoreClient
        .from("gm_menu_categories")
        .select("id, name, sort_order")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true });

      if (catError) {
        console.warn("[TPVMobilePage] Falha ao carregar categorias:", catError);
      }

      if (catData && Array.isArray(catData)) {
        setCategories(catData as Category[]);
      }

      const categoryNameById = new Map<string, string>(
        ((catData as Category[]) ?? []).map((category) => [
          category.id,
          category.name,
        ]),
      );

      // Fetch products with category join
      const { data: prodData, error: prodError } = await dockerCoreClient
        .from("gm_products")
        .select(
          `
          id,
          name,
          price_cents,
          photo_url,
          category_id
        `,
        )
        .eq("restaurant_id", restaurantId)
        .eq("available", true);

      if (prodError) {
        console.warn("[TPVMobilePage] Falha ao carregar produtos:", prodError);
      }

      if (prodData && Array.isArray(prodData)) {
        const mapped: MobileProduct[] = prodData.map((p) => ({
          id: p.id as string,
          name: p.name as string,
          price_cents: p.price_cents as number,
          image_url: (p.photo_url as string) ?? null,
          category_id: p.category_id as string,
          category_name: categoryNameById.get(p.category_id as string),
        }));
        setProducts(mapped);
      }

      setLoading(false);
    };

    fetchData();
  }, [restaurantId]);

  // Convert MobileProduct[] to MobileCartProduct[] for CartBottomSheet
  // Note: Keep modifiers as empty array since FloatingModifierBar needs ModifierGroup[]
  // which requires fetching from database - for now, inline editing is disabled
  const cartProducts = useMemo(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price_cents: p.price_cents,
      image_url: p.image_url,
      category_name: p.category_name,
      modifiers: [], // Empty array - inline modifier editing needs proper ModifierGroup[] fetching
    }));
  }, [products]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  // Map categories to mobile format
  const mobileCategories: MobileCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // Restaurant name fallback (used for titles)
  const _restaurantName = "ChefApp TPV"; // kept for future use

  // Tab title mapping
  const tabTitles: Record<TPVMobileTab, string> = {
    pos: "ChefApp TPV",
    kds: "ChefApp KDS",
    tables: "Mesas",
    orders: "Pedidos",
    reservations: "Reservas",
  };

  // Handle add product to cart
  const handleAddProduct = (
    product: MobileProduct,
    modifiers?: SelectedModifier[],
  ) => {
    // Build modifiers array for cart add
    const cartModifiers = modifiers?.map((mod) => ({
      groupId: mod.groupId,
      groupName: mod.groupName,
      modifierId: mod.modifierId,
      name: mod.name,
      priceDeltaCents: mod.priceDeltaCents,
    }));

    addProduct({
      id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image_url: product.image_url,
      category_name: product.category_name,
      modifiers: cartModifiers,
    });
  };

  // Handle table selection (from Tables tab or from modal)
  const handleSelectTable = useCallback(
    (tableId: string, tableNumber?: number) => {
      setTable({ id: tableId, number: tableNumber ?? 0 });
      setShowTableModal(false);
      // Switch to POS mode with the selected table
      setActiveTab("pos");
    },
    [setTable],
  );

  // Handle order selection
  const handleSelectOrder = useCallback((orderId: string) => {
    // TODO: Open order detail modal or navigate to order
    console.log("Selected order:", orderId);
  }, []);

  if (loading && activeTab === "pos") {
    return (
      <div className="pvm-page">
        <div className="pvm-loading-state">
          <p>A carregar produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pvm-page">
      <MobileHeader
        restaurantName={tabTitles[activeTab]}
        shiftActive={shiftState === "active"}
        onSearchClick={
          activeTab === "pos" ? () => setIsSearchOpen(true) : undefined
        }
        showBack
      />

      {/* POS Tab */}
      {activeTab === "pos" && (
        <>
          <OrderTypeTabs
            activeMode={orderMode}
            onModeChange={handleOrderModeChange}
            selectedTable={selectedTable}
            onTableClick={() => setShowTableModal(true)}
          />

          <CategoryScroller
            categories={mobileCategories}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />

          <MobileProductGrid
            products={filteredProducts}
            onAddProduct={handleAddProduct}
            cartItems={cart}
          />

          <CartBottomSheet
            items={cart}
            itemCount={itemCount}
            subtotal={subtotal}
            tax={tax}
            total={total}
            isSending={isSending}
            orderMode={orderMode}
            selectedPaymentMethod={paymentMethod}
            onUpdateQuantity={updateQuantity}
            onClear={clearCart}
            onSendToKitchen={sendToKitchen}
            onPaymentMethodChange={setPaymentMethod}
            onUpdateItemModifiers={updateItemModifiers}
            availableProducts={cartProducts}
          />
        </>
      )}

      {/* KDS Tab (Kitchen Display System) */}
      {activeTab === "kds" && restaurantId && (
        <KDSTabContent restaurantId={restaurantId} />
      )}

      {/* Tables Tab */}
      {activeTab === "tables" && restaurantId && (
        <TPVMobileTablesView
          restaurantId={restaurantId}
          onSelectTable={handleSelectTable}
        />
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && restaurantId && (
        <TPVMobileOrdersView
          restaurantId={restaurantId}
          onSelectOrder={handleSelectOrder}
        />
      )}

      {/* Reservations Tab (owner/manager only) */}
      {activeTab === "reservations" && restaurantId && canViewReservations && (
        <TPVMobileReservationsView restaurantId={restaurantId} />
      )}

      {/* Bottom Navigation */}
      <TPVMobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showReservations={canViewReservations}
        ordersCount={pendingOrderCount}
        tablesOccupied={occupiedTableCount}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={handleAddProduct}
      />

      {/* Table Selection Modal (Dine In) */}
      {restaurantId && (
        <TableSelectionModal
          isOpen={showTableModal}
          restaurantId={restaurantId}
          onClose={() => {
            setShowTableModal(false);
            // If closing without selecting and no table, revert to take_away
            if (!selectedTable && orderMode === "dine_in") {
              setCartOrderMode("take_away");
            }
          }}
          onSelectTable={handleSelectTable}
        />
      )}
    </div>
  );
}

// KDS Tab Content Component
function KDSTabContent({ restaurantId }: { restaurantId: string }) {
  const {
    tickets,
    counts,
    activeTab,
    isLoading,
    setActiveTab,
    startPreparing,
    markReady,
    refresh,
  } = useMobileKDS(restaurantId);

  const filteredTickets = tickets.filter((t) => t.status === activeTab);

  return (
    <div className="kdsm-page">
      <KDSMobileHeader
        restaurantName="ChefApp KDS"
        onRefresh={refresh}
        isRefreshing={isLoading}
        showBack={false}
      />

      <KDSStatusTabs
        activeTab={activeTab}
        counts={counts}
        onTabChange={setActiveTab}
      />

      <KDSMobileGrid
        tickets={filteredTickets}
        onStartPreparing={startPreparing}
        onMarkReady={markReady}
      />
    </div>
  );
}
