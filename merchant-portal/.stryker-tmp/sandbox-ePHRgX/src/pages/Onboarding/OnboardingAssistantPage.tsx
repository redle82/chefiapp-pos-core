/**
 * Onboarding Assistente — Ponte (camada de Ativação).
 *
 * Não é só formulário de restaurante. Coleta 7 respostas:
 * 1. Nome do restaurante, 2. País, 3. Tipo, 4. Nº mesas,
 * 5. Usa impressora?, 6. Vai usar KDS?, 7. Quantos usuários (estimativa).
 * No final: redireciona para Centro de Ativação (/app/activation).
 * Se ainda não tiver restaurante, envia para /setup/restaurant-minimal
 * com successNextPath=/app/activation.
 *
 * Ref: docs/contracts/FUNIL_VIDA_CLIENTE.md#arquitetura-de-jornada-em-3-camadas
 */
// @ts-nocheck


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { fetchSetupStatus } from "../../infra/readers/RuntimeReader";
import {
  updateRestaurantProfile,
  upsertSetupStatus,
} from "../../infra/writers/RuntimeWriter";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #171717 50%, #1c1917 100%)",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: { marginBottom: 28, textAlign: "center" as const },
  title: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 8,
    color: "#fafafa",
    letterSpacing: "-0.02em",
  },
  subtitle: { fontSize: 14, color: "#a3a3a3", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column" as const, gap: 20 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#a3a3a3",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #404040",
    borderRadius: 8,
    backgroundColor: "#171717",
    color: "#fafafa",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #404040",
    borderRadius: 8,
    backgroundColor: "#171717",
    color: "#fafafa",
    cursor: "pointer",
  },
  row: { display: "flex", alignItems: "center", gap: 12 },
  checkbox: { width: 20, height: 20, cursor: "pointer" },
  submit: {
    marginTop: 16,
    minHeight: 48,
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 600,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
  },
};

const TIPOS = [
  "Bar",
  "Restaurante",
  "Café",
  "Fast Casual",
  "Catering",
  "Outro",
] as const;

const PAISES = [
  { value: "PT", label: "Portugal" },
  { value: "BR", label: "Brasil" },
  { value: "ES", label: "Espanha" },
  { value: "FR", label: "França" },
  { value: "DE", label: "Alemanha" },
  { value: "UK", label: "Reino Unido" },
  { value: "US", label: "EUA" },
  { value: "OTHER", label: "Outro" },
];

export function OnboardingAssistantPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [pais, setPais] = useState("PT");
  const [tipo, setTipo] = useState<string>("Restaurante");
  const [numMesas, setNumMesas] = useState("");
  const [usaImpressora, setUsaImpressora] = useState(false);
  const [usaKDS, setUsaKDS] = useState(false);
  const [numUsuarios, setNumUsuarios] = useState("");

  const hasRestaurantId =
    !!getTabIsolated("chefiapp_restaurant_id") ||
    (typeof window !== "undefined" &&
      !!window.localStorage?.getItem("chefiapp_restaurant_id"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      sessionStorage.setItem(
        "chefiapp_onboarding_answers",
        JSON.stringify({
          nome,
          pais,
          tipo,
          numMesas: numMesas ? parseInt(numMesas, 10) : undefined,
          usaImpressora,
          usaKDS,
          numUsuarios: numUsuarios ? parseInt(numUsuarios, 10) : undefined,
        }),
      );
    } catch {
      // ignore
    }
    if (hasRestaurantId) {
      const restaurantId =
        getTabIsolated("chefiapp_restaurant_id") ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("chefiapp_restaurant_id")
          : null);
      if (restaurantId) {
        try {
          const current = await fetchSetupStatus(restaurantId);
          await upsertSetupStatus(restaurantId, { ...current, identity: true });
          await updateRestaurantProfile(restaurantId, {
            name: nome || undefined,
            country: pais || undefined,
            type: tipo || undefined,
          });
        } catch {
          // ignore
        }
      }
      navigate("/app/activation", { replace: true });
      return;
    }
    navigate("/bootstrap", {
      replace: true,
      state: { successNextPath: "/app/activation", fromOnboarding: true },
    });
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Configuração guiada</h1>
        <p style={styles.subtitle}>
          Responde às perguntas abaixo. No fim vais ao Centro de Ativação para
          completar menu, mesas e primeiro pedido.
        </p>
      </header>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div>
          <label style={styles.label}>1. Nome do restaurante</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: A Minha Tasca"
            style={styles.input}
            required
          />
        </div>
        <div>
          <label style={styles.label}>2. País (ativa fiscal)</label>
          <select
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            style={styles.select}
          >
            {PAISES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={styles.label}>3. Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={styles.select}
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={styles.label}>4. Número de mesas (estimativa)</label>
          <input
            type="number"
            min={0}
            value={numMesas}
            onChange={(e) => setNumMesas(e.target.value)}
            placeholder="Ex: 10"
            style={styles.input}
          />
        </div>
        <div style={styles.row}>
          <input
            type="checkbox"
            id="impressora"
            checked={usaImpressora}
            onChange={(e) => setUsaImpressora(e.target.checked)}
            style={styles.checkbox}
          />
          <label style={styles.label} htmlFor="impressora">
            5. Usa impressora?
          </label>
        </div>
        <div style={styles.row}>
          <input
            type="checkbox"
            id="kds"
            checked={usaKDS}
            onChange={(e) => setUsaKDS(e.target.checked)}
            style={styles.checkbox}
          />
          <label style={styles.label} htmlFor="kds">
            6. Vai usar KDS (ecrã cozinha)?
          </label>
        </div>
        <div>
          <label style={styles.label}>7. Quantos usuários (estimativa)?</label>
          <input
            type="number"
            min={1}
            value={numUsuarios}
            onChange={(e) => setNumUsuarios(e.target.value)}
            placeholder="Ex: 3"
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.submit}>
          Continuar para Centro de Ativação
        </button>
      </form>
    </div>
  );
}
