/**
 * OnboardingAssistantPage -- Multi-step wizard that creates a REAL restaurant.
 *
 * Step 1: Restaurant name + type (cafe, restaurante, bar, fast food)
 * Step 2: Country selection (uses CountryConfig for timezone/currency/VAT)
 * Step 3: NIF/tax ID + phone + address
 * Step 4: Logo upload (optional)
 * Step 5: Review & create
 *
 * At the end, calls OnboardingService.createRestaurant() which:
 *   1. gm_organizations -- INSERT company
 *   2. gm_restaurants   -- INSERT restaurant with all config
 *   3. gm_restaurant_members -- INSERT owner membership
 *   4. gm_onboarding_state -- INSERT tracker
 *
 * Then redirects to /onboarding/ritual-open (ceremonial activation).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/useAuth";
import {
  COUNTRY_CONFIGS,
  getCountryConfig,
  inferCountry,
} from "../../core/config/CountryConfig";
import {
  createRestaurant,
  getOnboardingStatus,
  completeOnboarding,
  type CreateRestaurantData,
} from "../../core/onboarding/OnboardingService";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;

const RESTAURANT_TYPES = [
  { value: "restaurante", label: "Restaurante", icon: "🍽" },
  { value: "cafe", label: "Cafe", icon: "☕" },
  { value: "bar", label: "Bar", icon: "🍸" },
  { value: "fast_food", label: "Fast Food", icon: "🍔" },
  { value: "fast_casual", label: "Fast Casual", icon: "🥗" },
  { value: "outro", label: "Outro", icon: "🏪" },
] as const;

const COUNTRY_OPTIONS = Object.entries(COUNTRY_CONFIGS).map(([code, cfg]) => ({
  code,
  name: cfg.name,
  flag: getFlagEmoji(code),
  currency: cfg.currencySymbol,
}));

function getFlagEmoji(countryCode: string): string {
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #111111 40%, #1c1917 100%)",
    padding: "24px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 480,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#737373",
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#262626",
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#eab308",
    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  header: {
    marginBottom: 32,
  },
  stepNumber: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 600,
    color: "#eab308",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#fafafa",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#a3a3a3",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#a3a3a3",
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #333",
    borderRadius: 10,
    backgroundColor: "#141414",
    color: "#fafafa",
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  inputFocus: {
    borderColor: "#eab308",
  },
  select: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #333",
    borderRadius: 10,
    backgroundColor: "#141414",
    color: "#fafafa",
    cursor: "pointer",
    outline: "none",
    appearance: "none" as const,
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  typeCard: {
    padding: "14px 12px",
    border: "1px solid #333",
    borderRadius: 12,
    backgroundColor: "#141414",
    cursor: "pointer",
    textAlign: "center" as const,
    transition: "border-color 0.15s ease, background-color 0.15s ease",
  },
  typeCardActive: {
    borderColor: "#eab308",
    backgroundColor: "rgba(234, 179, 8, 0.08)",
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
    display: "block",
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#d4d4d4",
  },
  countryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  countryCard: {
    padding: "12px",
    border: "1px solid #333",
    borderRadius: 12,
    backgroundColor: "#141414",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    transition: "border-color 0.15s ease, background-color 0.15s ease",
  },
  countryCardActive: {
    borderColor: "#eab308",
    backgroundColor: "rgba(234, 179, 8, 0.08)",
  },
  countryFlag: {
    fontSize: 22,
  },
  countryInfo: {
    display: "flex",
    flexDirection: "column" as const,
  },
  countryName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#d4d4d4",
  },
  countryCurrency: {
    fontSize: 11,
    color: "#737373",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 24,
  },
  btnPrimary: {
    flex: 1,
    minHeight: 48,
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
    transition: "opacity 0.15s ease",
  },
  btnSecondary: {
    minHeight: 48,
    padding: "14px 20px",
    fontSize: 14,
    fontWeight: 500,
    border: "1px solid #404040",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#a3a3a3",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed" as const,
  },
  error: {
    padding: "10px 14px",
    borderRadius: 8,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.2)",
    color: "#f87171",
    fontSize: 13,
  },
  review: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  reviewCard: {
    padding: "16px",
    borderRadius: 12,
    border: "1px solid #262626",
    backgroundColor: "#141414",
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#737373",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 15,
    color: "#fafafa",
    fontWeight: 500,
  },
  skipText: {
    fontSize: 13,
    color: "#737373",
    textAlign: "center" as const,
    marginTop: 8,
  },
  logoUpload: {
    width: "100%",
    minHeight: 120,
    border: "2px dashed #333",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "#0d0d0d",
    transition: "border-color 0.15s ease",
    gap: 8,
  },
  logoUploadActive: {
    borderColor: "#eab308",
  },
  logoPreview: {
    width: 64,
    height: 64,
    objectFit: "cover" as const,
    borderRadius: 16,
  },
  success: {
    textAlign: "center" as const,
    padding: "40px 0",
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: "block",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fafafa",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#a3a3a3",
    lineHeight: 1.5,
  },
  loading: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#a3a3a3",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 14,
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid #333",
    borderTopColor: "#eab308",
    borderRadius: "50%",
    marginBottom: 12,
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingAssistantPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialCheck, setInitialCheck] = useState(true);

  // Form state
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantType, setRestaurantType] = useState("restaurante");
  const [country, setCountry] = useState(() => inferCountry());
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Success state
  const [created, setCreated] = useState(false);
  const [createdRestaurantId, setCreatedRestaurantId] = useState<string | null>(null);

  // Redirect if already has restaurant
  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate("/auth/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (status.hasRestaurant && status.isOnboardingComplete) {
          navigate("/admin/home", { replace: true });
          return;
        }
      } catch {
        // Continue to onboarding
      } finally {
        if (!cancelled) setInitialCheck(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [session, authLoading, navigate]);

  // Derived
  const countryConfig = getCountryConfig(country);
  const progress = Math.round((step / TOTAL_STEPS) * 100);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  }

  function handleNextStep1() {
    const name = restaurantName.trim();
    if (!name || name.length < 2) {
      setError("O nome do restaurante deve ter pelo menos 2 caracteres.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function handleNextStep2() {
    setError(null);
    setStep(3);
  }

  function handleNextStep3() {
    setError(null);
    setStep(4);
  }

  function handleNextStep4() {
    setError(null);
    setStep(5);
  }

  async function handleCreate() {
    setError(null);
    setSaving(true);

    const data: CreateRestaurantData = {
      name: restaurantName.trim(),
      country,
      restaurantType,
      taxId: taxId.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      logoUrl: logoUrl ?? undefined,
    };

    try {
      const result = await createRestaurant(data);
      setCreatedRestaurantId(result.restaurantId);
      completeOnboarding(result.restaurantId);
      setCreated(true);

      // Redirect to Ritual Open — the ceremonial "your restaurant is alive" moment
      setTimeout(() => {
        navigate("/onboarding/ritual-open", { replace: true });
      }, 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar restaurante. Tenta novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, create a local URL. In production this would upload to Supabase storage.
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
  }

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------

  if (authLoading || initialCheck) {
    return (
      <div style={S.loading}>
        <div style={S.spinner} />
        <p>A carregar...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (created) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <div style={S.success}>
            <span style={S.successIcon}>&#10003;</span>
            <h1 style={S.successTitle}>Restaurante criado!</h1>
            <p style={S.successSubtitle}>
              &laquo;{restaurantName}&raquo; esta pronto.
              <br />
              A redirecionar para o painel de controlo...
            </p>
          </div>
          {/* Progress complete */}
          <div style={S.progressContainer}>
            <div style={S.progressTrack}>
              <div style={{ ...S.progressFill, width: "100%" }} />
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Wizard
  // ---------------------------------------------------------------------------

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Progress */}
        <div style={S.progressContainer}>
          <div style={S.progressLabel}>
            <span>Passo {step} de {TOTAL_STEPS}</span>
            <span>{progress}%</span>
          </div>
          <div style={S.progressTrack}>
            <div style={{ ...S.progressFill, width: `${progress}%` }} />
          </div>
        </div>

        {/* ─── Step 1: Name + Type ──────────────────────────────── */}
        {step === 1 && (
          <>
            <div style={S.header}>
              <span style={S.stepNumber}>Passo 1</span>
              <h1 style={S.title}>Como se chama o teu restaurante?</h1>
              <p style={S.subtitle}>
                Escolhe o nome e o tipo de estabelecimento.
              </p>
            </div>

            <div style={S.form}>
              <div style={S.field}>
                <label style={S.label}>Nome do restaurante</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Ex: A Minha Tasca"
                  style={S.input}
                  autoFocus
                  maxLength={200}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>Tipo de estabelecimento</label>
                <div style={S.typeGrid}>
                  {RESTAURANT_TYPES.map((t) => (
                    <div
                      key={t.value}
                      style={{
                        ...S.typeCard,
                        ...(restaurantType === t.value
                          ? S.typeCardActive
                          : {}),
                      }}
                      onClick={() => setRestaurantType(t.value)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setRestaurantType(t.value);
                        }
                      }}
                    >
                      <span style={S.typeIcon}>{t.icon}</span>
                      <span style={S.typeLabel}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p style={S.error}>{error}</p>}

              <div style={S.actions}>
                <button
                  type="button"
                  style={S.btnPrimary}
                  onClick={handleNextStep1}
                >
                  Continuar
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── Step 2: Country ──────────────────────────────────── */}
        {step === 2 && (
          <>
            <div style={S.header}>
              <span style={S.stepNumber}>Passo 2</span>
              <h1 style={S.title}>Em que pais operas?</h1>
              <p style={S.subtitle}>
                Vamos configurar moeda, fuso horario e IVA automaticamente.
              </p>
            </div>

            <div style={S.form}>
              <div style={S.countryGrid}>
                {COUNTRY_OPTIONS.map((c) => (
                  <div
                    key={c.code}
                    style={{
                      ...S.countryCard,
                      ...(country === c.code ? S.countryCardActive : {}),
                    }}
                    onClick={() => setCountry(c.code)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setCountry(c.code);
                      }
                    }}
                  >
                    <span style={S.countryFlag}>{c.flag}</span>
                    <div style={S.countryInfo}>
                      <span style={S.countryName}>{c.name}</span>
                      <span style={S.countryCurrency}>{c.currency}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show derived config */}
              <div style={S.reviewCard}>
                <div style={S.reviewLabel}>Configuracao automatica</div>
                <div style={{ fontSize: 13, color: "#a3a3a3", lineHeight: 1.6 }}>
                  Moeda: <strong style={{ color: "#fafafa" }}>{countryConfig.currency} ({countryConfig.currencySymbol})</strong>
                  <br />
                  Fuso horario: <strong style={{ color: "#fafafa" }}>{countryConfig.timezone}</strong>
                  <br />
                  IVA: <strong style={{ color: "#fafafa" }}>{countryConfig.vatRates.join("%, ")}%</strong>
                  <br />
                  Sistema fiscal: <strong style={{ color: "#fafafa" }}>{countryConfig.fiscalSystem.toUpperCase()}</strong>
                </div>
              </div>

              {error && <p style={S.error}>{error}</p>}

              <div style={S.actions}>
                <button
                  type="button"
                  style={S.btnSecondary}
                  onClick={handleBack}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  style={S.btnPrimary}
                  onClick={handleNextStep2}
                >
                  Continuar
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── Step 3: Tax ID + Contact ─────────────────────────── */}
        {step === 3 && (
          <>
            <div style={S.header}>
              <span style={S.stepNumber}>Passo 3</span>
              <h1 style={S.title}>Dados fiscais e contacto</h1>
              <p style={S.subtitle}>
                Opcional agora -- podes completar depois nas definicoes.
              </p>
            </div>

            <div style={S.form}>
              <div style={S.field}>
                <label style={S.label}>
                  NIF / Tax ID{" "}
                  <span style={{ color: "#525252", fontWeight: 400 }}>
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder={
                    country === "PT"
                      ? "Ex: 123456789"
                      : country === "BR"
                        ? "Ex: 12.345.678/0001-90"
                        : "Tax ID"
                  }
                  style={S.input}
                  autoFocus
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>
                  Telefone{" "}
                  <span style={{ color: "#525252", fontWeight: 400 }}>
                    (opcional)
                  </span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={`${countryConfig.phonePrefix} ...`}
                  style={S.input}
                />
              </div>

              <div style={S.field}>
                <label style={S.label}>
                  Morada{" "}
                  <span style={{ color: "#525252", fontWeight: 400 }}>
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, numero..."
                  style={S.input}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ ...S.field, flex: 2 }}>
                  <label style={S.label}>Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                    style={S.input}
                  />
                </div>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>Cod. Postal</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder={country === "PT" ? "1000-001" : "00000"}
                    style={S.input}
                  />
                </div>
              </div>

              {error && <p style={S.error}>{error}</p>}

              <div style={S.actions}>
                <button
                  type="button"
                  style={S.btnSecondary}
                  onClick={handleBack}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  style={S.btnPrimary}
                  onClick={handleNextStep3}
                >
                  Continuar
                </button>
              </div>

              <p style={S.skipText}>
                Todos os campos sao opcionais neste passo.
              </p>
            </div>
          </>
        )}

        {/* ─── Step 4: Logo Upload ──────────────────────────────── */}
        {step === 4 && (
          <>
            <div style={S.header}>
              <span style={S.stepNumber}>Passo 4</span>
              <h1 style={S.title}>Logo do restaurante</h1>
              <p style={S.subtitle}>
                Adiciona o logo que aparecera nos recibos e no menu digital.
                Podes saltar este passo.
              </p>
            </div>

            <div style={S.form}>
              <label
                htmlFor="logo-upload"
                style={{
                  ...S.logoUpload,
                  ...(logoUrl ? S.logoUploadActive : {}),
                }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    style={S.logoPreview}
                  />
                ) : (
                  <>
                    <span style={{ fontSize: 32, color: "#525252" }}>+</span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#737373",
                      }}
                    >
                      Clica para carregar imagem
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#525252",
                      }}
                    >
                      PNG, JPG, SVG (max. 2MB)
                    </span>
                  </>
                )}
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoChange}
                style={{ display: "none" }}
              />

              {logoUrl && (
                <button
                  type="button"
                  style={{
                    ...S.btnSecondary,
                    fontSize: 12,
                    minHeight: 36,
                    padding: "8px 16px",
                    alignSelf: "center",
                  }}
                  onClick={() => setLogoUrl(null)}
                >
                  Remover logo
                </button>
              )}

              {error && <p style={S.error}>{error}</p>}

              <div style={S.actions}>
                <button
                  type="button"
                  style={S.btnSecondary}
                  onClick={handleBack}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  style={S.btnPrimary}
                  onClick={handleNextStep4}
                >
                  {logoUrl ? "Continuar" : "Saltar"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── Step 5: Review & Create ──────────────────────────── */}
        {step === 5 && (
          <>
            <div style={S.header}>
              <span style={S.stepNumber}>Passo 5</span>
              <h1 style={S.title}>Confirma e cria</h1>
              <p style={S.subtitle}>
                Revisa os dados antes de criar o restaurante.
                Podes alterar tudo depois.
              </p>
            </div>

            <div style={S.review}>
              {/* Restaurant info */}
              <div style={S.reviewCard}>
                <div style={S.reviewLabel}>Restaurante</div>
                <div style={S.reviewValue}>{restaurantName}</div>
                <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 4 }}>
                  {RESTAURANT_TYPES.find((t) => t.value === restaurantType)?.label ?? restaurantType}
                </div>
              </div>

              {/* Country + config */}
              <div style={S.reviewCard}>
                <div style={S.reviewLabel}>Pais e configuracao</div>
                <div style={S.reviewValue}>
                  {getFlagEmoji(country)}{" "}
                  {COUNTRY_CONFIGS[country]?.name ?? country}
                </div>
                <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 4 }}>
                  {countryConfig.currency} ({countryConfig.currencySymbol})
                  {" "}&middot;{" "}
                  {countryConfig.timezone}
                  {" "}&middot;{" "}
                  IVA {countryConfig.vatRates[0] ?? 0}%
                </div>
              </div>

              {/* Tax & Contact */}
              {(taxId || phone || address) && (
                <div style={S.reviewCard}>
                  <div style={S.reviewLabel}>Dados fiscais e contacto</div>
                  {taxId && (
                    <div style={{ fontSize: 13, color: "#d4d4d4" }}>
                      NIF: {taxId}
                    </div>
                  )}
                  {phone && (
                    <div style={{ fontSize: 13, color: "#d4d4d4" }}>
                      Tel: {phone}
                    </div>
                  )}
                  {address && (
                    <div style={{ fontSize: 13, color: "#d4d4d4" }}>
                      {address}
                      {city ? `, ${city}` : ""}
                      {postalCode ? ` ${postalCode}` : ""}
                    </div>
                  )}
                </div>
              )}

              {/* Logo */}
              {logoUrl && (
                <div style={S.reviewCard}>
                  <div style={S.reviewLabel}>Logo</div>
                  <img
                    src={logoUrl}
                    alt="Logo"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      objectFit: "cover",
                      marginTop: 4,
                    }}
                  />
                </div>
              )}

              {error && <p style={S.error}>{error}</p>}

              <div style={S.actions}>
                <button
                  type="button"
                  style={S.btnSecondary}
                  onClick={handleBack}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  style={{
                    ...S.btnPrimary,
                    ...(saving ? S.btnDisabled : {}),
                  }}
                  disabled={saving}
                  onClick={handleCreate}
                >
                  {saving ? "A criar..." : "Criar restaurante"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
