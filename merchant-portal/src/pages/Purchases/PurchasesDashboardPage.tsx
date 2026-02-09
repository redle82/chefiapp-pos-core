/**
 * PurchasesDashboardPage - Dashboard de Compras
 *
 * Mostra sugestões, pedidos e fornecedores
 */

import { useEffect, useState, useCallback } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { PurchaseOrdersList } from "../../components/Purchases/PurchaseOrdersList";
import { PurchaseSuggestions } from "../../components/Purchases/PurchaseSuggestions";
import { SuppliersList } from "../../components/Purchases/SuppliersList";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  purchaseEngine,
  type PurchaseOrder,
  type Supplier,
} from "../../core/purchases/PurchaseEngine";
import { GlobalLoadingView } from "../../ui/design-system/components";

/* ── Inline Forms ── */

function CreateSupplierForm({
  restaurantId,
  onCreated,
  onCancel,
}: {
  restaurantId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await purchaseEngine.createSupplier({
        restaurantId,
        name: name.trim(),
        contactName: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        leadTimeDays,
      });
      onCreated();
    } catch (err) {
      console.error("Error creating supplier:", err);
      alert("Erro ao criar fornecedor");
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "4px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "20px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        backgroundColor: "#f9fafb",
        marginBottom: "16px",
      }}
    >
      <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>
        Novo Fornecedor
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <label style={labelStyle}>Nome *</label>
          <input
            style={fieldStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do fornecedor"
            required
            autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Contato</label>
          <input
            style={fieldStyle}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Nome do contato"
          />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={fieldStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@fornecedor.com"
          />
        </div>
        <div>
          <label style={labelStyle}>Telefone</label>
          <input
            style={fieldStyle}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+351 912 345 678"
          />
        </div>
        <div>
          <label style={labelStyle}>Lead time (dias)</label>
          <input
            style={fieldStyle}
            type="number"
            min={1}
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10) || 1)}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          marginTop: "16px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          style={{
            padding: "8px 16px",
            backgroundColor: saving ? "#9ca3af" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {saving ? "Salvando..." : "Criar Fornecedor"}
        </button>
      </div>
    </form>
  );
}

function CreateOrderForm({
  restaurantId,
  suppliers,
  onCreated,
  onCancel,
}: {
  restaurantId: string;
  suppliers: Supplier[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    setSaving(true);
    try {
      await purchaseEngine.createPurchaseOrder({
        restaurantId,
        supplierId,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Erro ao criar pedido de compra");
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "4px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  };

  if (suppliers.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #fbbf24",
          borderRadius: "8px",
          backgroundColor: "#fffbeb",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, color: "#92400e" }}>
          Cadastre um fornecedor antes de criar um pedido de compra.
        </p>
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginTop: "12px",
            padding: "6px 14px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "20px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        backgroundColor: "#f9fafb",
        marginBottom: "16px",
      }}
    >
      <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>
        Novo Pedido de Compra
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <label style={labelStyle}>Fornecedor *</label>
          <select
            style={fieldStyle}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Notas</label>
          <input
            style={fieldStyle}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações opcionais"
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          marginTop: "16px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !supplierId}
          style={{
            padding: "8px 16px",
            backgroundColor: saving ? "#9ca3af" : "#667eea",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {saving ? "Salvando..." : "Criar Pedido"}
        </button>
      </div>
    </form>
  );
}

/* ── Main Page ── */

export function PurchasesDashboardPage() {
  const { runtime } = useRestaurantRuntime();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  const loadData = useCallback(async (id: string) => {
    try {
      const [ordersData, suppliersData] = await Promise.all([
        purchaseEngine.listPurchaseOrders(id, { limit: 10 }),
        purchaseEngine.listSuppliers(id),
      ]);

      setOrders(ordersData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading purchases data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (runtime.restaurant_id) {
      setRestaurantId(runtime.restaurant_id);
      loadData(runtime.restaurant_id);
    }
  }, [runtime.restaurant_id, loadData]);

  const handleGenerateSuggestions = async () => {
    if (!restaurantId) return;

    try {
      const count = await purchaseEngine.generateSuggestions(restaurantId);
      alert(`${count} sugestões geradas`);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Erro ao gerar sugestões");
    }
  };

  const handleCreated = () => {
    setShowCreateSupplier(false);
    setShowCreateOrder(false);
    loadData(restaurantId);
  };

  if (loading || runtime.loading || !restaurantId) {
    return (
      <GlobalLoadingView
        message="Carregando compras..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Compras</h1>
        <button
          onClick={handleGenerateSuggestions}
          style={{
            padding: "8px 16px",
            backgroundColor: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔍 Gerar Sugestões
        </button>
      </div>

      {/* Sugestões */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
          Sugestões de Compra
        </h2>
        <PurchaseSuggestions restaurantId={restaurantId} />
      </div>

      {/* Pedidos */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Pedidos de Compra
          </h2>
          <button
            onClick={() => setShowCreateOrder(!showCreateOrder)}
            style={{
              padding: "6px 14px",
              backgroundColor: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            + Novo Pedido
          </button>
        </div>
        {showCreateOrder && (
          <CreateOrderForm
            restaurantId={restaurantId}
            suppliers={suppliers}
            onCreated={handleCreated}
            onCancel={() => setShowCreateOrder(false)}
          />
        )}
        <PurchaseOrdersList orders={orders} />
      </div>

      {/* Fornecedores */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Fornecedores
          </h2>
          <button
            onClick={() => setShowCreateSupplier(!showCreateSupplier)}
            style={{
              padding: "6px 14px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            + Novo Fornecedor
          </button>
        </div>
        {showCreateSupplier && (
          <CreateSupplierForm
            restaurantId={restaurantId}
            onCreated={handleCreated}
            onCancel={() => setShowCreateSupplier(false)}
          />
        )}
        <SuppliersList suppliers={suppliers} />
      </div>
    </div>
  );
}
