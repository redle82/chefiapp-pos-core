/**
 * FirstProductPage — Onda 4 A3: Primeiro produto (nome, preço)
 *
 * Fluxo mínimo: um item no menu visível no TPV.
 * Após criar restaurante (bootstrap), utilizador é redirecionado aqui.
 * Um produto criado aqui aparece no TPV (mesma BD).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DbWriteGate } from "../../core/governance/DbWriteGate";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";

export function FirstProductPage() {
  const navigate = useNavigate();
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");
  const [name, setName] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome do produto é obrigatório.");
      return;
    }
    const eur = parseFloat(priceEur.replace(",", "."));
    if (Number.isNaN(eur) || eur < 0) {
      setError("Preço deve ser um número ≥ 0 (ex: 2.50).");
      return;
    }
    const price_cents = Math.round(eur * 100);

    if (!restaurantId) {
      setError("Restaurante não encontrado. Volte ao início.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: insertError } = await DbWriteGate.insert(
        "OnboardingQuick",
        "gm_products",
        {
          restaurant_id: restaurantId,
          name: trimmedName,
          price_cents,
          available: true,
          station: "KITCHEN",
          prep_time_seconds: 300,
        },
        { tenantId: restaurantId },
      );
      if (insertError) throw insertError;
      if (!data?.id) throw new Error("Produto não foi criado.");
      navigate("/op/tpv", { replace: true });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Erro ao criar produto.");
    }
  };

  if (!restaurantId) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#a3a3a3" }}>
        <p>Restaurante não encontrado.</p>
        <button
          type="button"
          onClick={() => navigate("/bootstrap")}
          style={{
            marginTop: 16,
            padding: "12px 20px",
            background: "#32d74b",
            color: "#000",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0b0b0c",
        minHeight: "100vh",
        color: "#f5f5f7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 400, width: "100%" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Primeiro produto</h1>
        <p style={{ color: "#a3a3a3", marginBottom: 24, fontSize: 14 }}>
          Nome e preço. O item ficará visível no TPV.
        </p>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            textAlign: "left",
          }}
        >
          <div>
            <label
              htmlFor="product-name"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#a3a3a3",
                marginBottom: 6,
              }}
            >
              Nome do produto *
            </label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Café"
              required
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                fontSize: 15,
                border: "1px solid #404040",
                borderRadius: 8,
                backgroundColor: "#171717",
                color: "#fafafa",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="product-price"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#a3a3a3",
                marginBottom: 6,
              }}
            >
              Preço (€) *
            </label>
            <input
              id="product-price"
              type="text"
              inputMode="decimal"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              placeholder="ex: 2.50"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                fontSize: 15,
                border: "1px solid #404040",
                borderRadius: 8,
                backgroundColor: "#171717",
                color: "#fafafa",
              }}
            />
          </div>
          {error && (
            <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              backgroundColor: "#32d74b",
              color: "#000",
            }}
          >
            {loading ? "A criar..." : "Criar e abrir TPV"}
          </button>
        </form>
        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "#737373",
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/app/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "#a3a3a3",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Ir para o dashboard
          </button>
        </p>
      </div>
    </div>
  );
}
