import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useAuth } from "../../core/auth/useAuth";
import type { WebsiteQuickConfig } from "../../core/website/websiteConfigService";
import {
  clearLocalDraft,
  fetchWebsiteConfig,
  publishWebsiteConfig,
  saveLocalDraft,
  saveWebsiteDraft,
} from "../../core/website/websiteConfigService";
import { useToast } from "../../ui/design-system/Toast";
import {
  GlobalBlockedView,
  GlobalLoadingView,
} from "../../ui/design-system/components";

function createEmptyConfig(): WebsiteQuickConfig {
  return {
    hero: {
      title: "Bem-vindo ao seu restaurante",
      subtitle: "Atualize este texto no editor rápido.",
      imageUrl: null,
      ctaLabel: "Ver menu",
      ctaLink: "",
    },
    schedule: [
      { day: "monday", open: "12:00", close: "23:00", closed: false },
      { day: "tuesday", open: "12:00", close: "23:00", closed: false },
      { day: "wednesday", open: "12:00", close: "23:00", closed: false },
      { day: "thursday", open: "12:00", close: "23:00", closed: false },
      { day: "friday", open: "12:00", close: "00:00", closed: false },
      { day: "saturday", open: "12:00", close: "00:00", closed: false },
      { day: "sunday", open: "12:00", close: "22:00", closed: false },
    ],
    contacts: {
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
    },
    highlights: [
      {
        id: "highlight-1",
        title: "Entrega rápida",
        description: "Pedido online preparado e enviado em minutos.",
        icon: "bolt",
      },
      {
        id: "highlight-2",
        title: "Qualidade constante",
        description: "Pratos preparados com padrão de cozinha profissional.",
        icon: "star",
      },
      {
        id: "highlight-3",
        title: "Reservas fáceis",
        description: "Clientes reservam mesa em segundos, sem chamadas.",
        icon: "calendar",
      },
    ],
    status: {
      mode: "open",
      message: "",
    },
  };
}

const DAYS_LABEL: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

export function TPVWebEditorPage() {
  const { runtime } = useRestaurantRuntime();
  const { user } = useAuth();
  const toast = useToast();

  const restaurantId = runtime.restaurant_id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WebsiteQuickConfig | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setError(
        "Restaurante ainda não está inicializado. Conclua o setup antes de editar a página web.",
      );
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const doc = await fetchWebsiteConfig(restaurantId, runtime);
        if (cancelled) return;
        if (doc?.draft) {
          setConfig(doc.draft);
        } else if (doc?.published) {
          setConfig(doc.published);
        } else {
          const base = createEmptyConfig();
          const local = saveLocalDraftAndReturn(restaurantId, base);
          setConfig(local);
        }
        setLastPublishedAt(doc?.updatedAt ?? null);
        setOffline(
          !runtime.coreReachable || runtime.coreMode === "offline-erro",
        );
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Erro ao carregar configuração";
        setError(message);
        const draft = saveLocalDraftAndReturn(
          restaurantId,
          createEmptyConfig(),
        );
        setConfig(draft);
        setOffline(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, runtime]);

  const actorEmail = user?.email ?? null;

  const handleFieldChange = <K extends keyof WebsiteQuickConfig>(
    key: K,
    value: WebsiteQuickConfig[K],
  ) => {
    setConfig((prev) => {
      const next: WebsiteQuickConfig = {
        ...(prev ?? createEmptyConfig()),
        [key]: value,
      };
      if (restaurantId) {
        saveLocalDraft(restaurantId, next);
      }
      return next;
    });
  };

  const handleSaveDraft = async () => {
    if (!restaurantId || !config) return;
    try {
      setSaving(true);
      setError(null);
      await saveWebsiteDraft({
        restaurantId,
        draft: config,
        actorEmail,
        runtime,
      });
      toast.show({
        type: "success",
        title: "Rascunho guardado",
        description:
          "As alterações foram guardadas. Pode continuar a editar antes de publicar.",
      });
      setOffline(
        !runtime.coreReachable || runtime.coreMode === "offline-erro",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao guardar rascunho";
      setError(message);
      toast.show({
        type: "warning",
        title: "Rascunho guardado apenas localmente",
        description:
          "O Core está offline ou indisponível. As alterações ficaram armazenadas neste dispositivo.",
      });
      setOffline(true);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!restaurantId || !config) return;
    const confirmed = window.confirm(
      "Publicar alterações na Página Web? Isto atualiza imediatamente a página pública.",
    );
    if (!confirmed) return;
    try {
      setPublishing(true);
      setError(null);
      await publishWebsiteConfig({
        restaurantId,
        draft: config,
        actorEmail,
        runtime,
      });
      clearLocalDraft(restaurantId);
      setLastPublishedAt(new Date().toISOString());
      toast.show({
        type: "success",
        title: "Página publicada",
        description: "A Página Web foi atualizada com sucesso.",
      });
      setOffline(
        !runtime.coreReachable || runtime.coreMode === "offline-erro",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao publicar alterações";
      setError(message);
      toast.show({
        type: "error",
        title: "Não foi possível publicar",
        description: message,
      });
    } finally {
      setPublishing(false);
    }
  };

  const hasConfig = !!config;

  const statusLabel = useMemo(() => {
    if (!config) return "";
    switch (config.status.mode) {
      case "open":
        return "Aberto";
      case "closed":
        return "Fechado";
      case "paused":
        return "Em pausa";
      default:
        return "";
    }
  }, [config]);

  if (loading && !hasConfig) {
    return <GlobalLoadingView title="A carregar editor da Página Web…" />;
  }

  if (!restaurantId) {
    return (
      <GlobalBlockedView
        title="Restaurante não inicializado"
        description="Conclua o setup do restaurante no Admin antes de editar a Página Web."
      />
    );
  }

  if (!config) {
    return (
      <GlobalBlockedView
        title="Editor indisponível"
        description={
          error ??
          "Não foi possível carregar a configuração da Página Web. Tente novamente mais tarde."
        }
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        padding: 16,
        gap: 16,
        backgroundColor: "#050505",
        color: "#fafafa",
        overflow: "hidden",
      }}
      data-testid="tpv-web-editor-page"
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 96,
          right: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              color: "#a3a3a3",
            }}
          >
            Editor rápido da Página Web
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#737373",
            }}
          >
            Ajuste apenas texto, horários e contactos — sem HTML livre.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {offline && (
            <span
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: "rgba(234,179,8,0.15)",
                color: "#eab308",
              }}
              data-testid="tpv-web-editor-offline-badge"
            >
              Offline — a guardar localmente
            </span>
          )}
          {lastPublishedAt && (
            <span
              style={{
                fontSize: 11,
                color: "#737373",
              }}
            >
              Última publicação:{" "}
              {new Date(lastPublishedAt).toLocaleString("pt-PT")}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          paddingTop: 56,
          paddingRight: 8,
          overflow: "auto",
        }}
      >
        <section
          style={{
            backgroundColor: "#111827",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Hero
          </h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>Título</span>
            <input
              type="text"
              value={config.hero.title}
              onChange={(e) =>
                handleFieldChange("hero", {
                  ...config.hero,
                  title: e.target.value,
                })
              }
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>Subtítulo</span>
            <textarea
              value={config.hero.subtitle ?? ""}
              onChange={(e) =>
                handleFieldChange("hero", {
                  ...config.hero,
                  subtitle: e.target.value,
                })
              }
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>
              URL da imagem (opcional)
            </span>
            <input
              type="url"
              value={config.hero.imageUrl ?? ""}
              onChange={(e) =>
                handleFieldChange("hero", {
                  ...config.hero,
                  imageUrl: e.target.value || null,
                })
              }
              style={inputStyle}
            />
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.4fr",
              gap: 8,
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ fontSize: 12, color: "#e5e5e5" }}>
                Texto do botão
              </span>
              <input
                type="text"
                value={config.hero.ctaLabel ?? ""}
                onChange={(e) =>
                  handleFieldChange("hero", {
                    ...config.hero,
                    ctaLabel: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </label>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ fontSize: 12, color: "#e5e5e5" }}>
                Link do botão
              </span>
              <input
                type="url"
                value={config.hero.ctaLink ?? ""}
                onChange={(e) =>
                  handleFieldChange("hero", {
                    ...config.hero,
                    ctaLink: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        <section
          style={{
            backgroundColor: "#111827",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Horários
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {config.schedule.map((entry, idx) => (
              <div
                key={entry.day}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.9fr 0.7fr 0.7fr 0.7fr",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#e5e5e5",
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  {DAYS_LABEL[entry.day] ?? entry.day}
                </span>
                <input
                  type="time"
                  disabled={entry.closed}
                  value={entry.open}
                  onChange={(e) => {
                    const next = [...config.schedule];
                    next[idx] = { ...entry, open: e.target.value };
                    handleFieldChange("schedule", next);
                  }}
                  style={inputStyle}
                />
                <input
                  type="time"
                  disabled={entry.closed}
                  value={entry.close}
                  onChange={(e) => {
                    const next = [...config.schedule];
                    next[idx] = { ...entry, close: e.target.value };
                    handleFieldChange("schedule", next);
                  }}
                  style={inputStyle}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "#d4d4d4",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={entry.closed}
                    onChange={(e) => {
                      const next = [...config.schedule];
                      next[idx] = { ...entry, closed: e.target.checked };
                      handleFieldChange("schedule", next);
                    }}
                  />
                  Fechado
                </label>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: "#111827",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Contactos
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ fontSize: 12, color: "#e5e5e5" }}>Telefone</span>
              <input
                type="tel"
                value={config.contacts.phone ?? ""}
                onChange={(e) =>
                  handleFieldChange("contacts", {
                    ...config.contacts,
                    phone: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </label>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ fontSize: 12, color: "#e5e5e5" }}>WhatsApp</span>
              <input
                type="tel"
                value={config.contacts.whatsapp ?? ""}
                onChange={(e) =>
                  handleFieldChange("contacts", {
                    ...config.contacts,
                    whatsapp: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>Email</span>
            <input
              type="email"
              value={config.contacts.email ?? ""}
              onChange={(e) =>
                handleFieldChange("contacts", {
                  ...config.contacts,
                  email: e.target.value,
                })
              }
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>Endereço</span>
            <textarea
              value={config.contacts.address ?? ""}
              onChange={(e) =>
                handleFieldChange("contacts", {
                  ...config.contacts,
                  address: e.target.value,
                })
              }
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
            />
          </label>
        </section>

        <section
          style={{
            backgroundColor: "#111827",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Destaques
          </h2>
          <span
            style={{
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Até 3 cartões rápidos. Texto curto e direto — sem HTML.
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {config.highlights.map((card, idx) => (
              <div
                key={card.id}
                style={{
                  borderRadius: 12,
                  backgroundColor: "#020617",
                  border: "1px solid rgba(148,163,184,0.35)",
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{ fontSize: 12, color: "#e5e5e5" }}
                    >{`Título ${idx + 1}`}</span>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const next = [...config.highlights];
                        next[idx] = { ...card, title: e.target.value };
                        handleFieldChange("highlights", next);
                      }}
                      style={inputStyle}
                    />
                  </label>
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      width: 96,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#e5e5e5" }}>
                      Ícone (nome)
                    </span>
                    <input
                      type="text"
                      value={card.icon ?? ""}
                      onChange={(e) => {
                        const next = [...config.highlights];
                        next[idx] = { ...card, icon: e.target.value };
                        handleFieldChange("highlights", next);
                      }}
                      style={inputStyle}
                    />
                  </label>
                </div>
                <label
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <span style={{ fontSize: 12, color: "#e5e5e5" }}>
                    Texto curto
                  </span>
                  <textarea
                    value={card.description ?? ""}
                    onChange={(e) => {
                      const next = [...config.highlights];
                      next[idx] = { ...card, description: e.target.value };
                      handleFieldChange("highlights", next);
                    }}
                    style={{ ...inputStyle, minHeight: 40, resize: "vertical" }}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: "#111827",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Status rápido
          </h2>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {(["open", "closed", "paused"] as const).map((mode) => {
              const active = config.status.mode === mode;
              const label =
                mode === "open"
                  ? "Aberto"
                  : mode === "closed"
                  ? "Fechado"
                  : "Em pausa";
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    handleFieldChange("status", {
                      ...config.status,
                      mode,
                    })
                  }
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.35)",
                    fontSize: 11,
                    fontWeight: 500,
                    backgroundColor: active ? "#22c55e1a" : "#020617",
                    color: active ? "#4ade80" : "#e5e5e5",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>
              Mensagem (ex.: &ldquo;Cozinha fecha às 23h&rdquo;)
            </span>
            <textarea
              value={config.status.message ?? ""}
              onChange={(e) =>
                handleFieldChange("status", {
                  ...config.status,
                  message: e.target.value,
                })
              }
              style={{ ...inputStyle, minHeight: 40, resize: "vertical" }}
            />
          </label>
        </section>

        {error && (
          <div
            style={{
              marginTop: 4,
              padding: 10,
              borderRadius: 10,
              backgroundColor: "rgba(248,113,113,0.09)",
              border: "1px solid rgba(248,113,113,0.5)",
              fontSize: 12,
              color: "#fecaca",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              backgroundColor: "#020617",
              color: "#e5e5e5",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {saving ? "A guardar rascunho…" : "Guardar rascunho"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || saving}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg, #22c55e, #4ade80, #22c55e, #16a34a)",
              color: "#020617",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 0 0 1px rgba(22,163,74,0.5)",
            }}
          >
            {publishing ? "A publicar…" : "Publicar alterações"}
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1.2,
          borderRadius: 20,
          background:
            "radial-gradient(circle at top left, #1f2937 0, #020617 55%, #000000 100%)",
          border: "1px solid rgba(31,41,55,0.9)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "auto",
        }}
        data-testid="tpv-web-editor-preview"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "999px",
                border: "2px solid rgba(248,250,252,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              C
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Página Web — Preview
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Esta é uma pré-visualização local. O cliente vê a versão
                publicada.
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.4)",
              color: "#e5e5e5",
            }}
          >
            Status: {statusLabel || "—"}
          </span>
        </div>

        <section
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            minHeight: 180,
            background:
              "linear-gradient(135deg, #f97316 0%, #ef4444 38%, #0f172a 100%)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {config.hero.imageUrl && (
            <img
              src={config.hero.imageUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.25,
                filter: "grayscale(0.1)",
              }}
            />
          )}
          <div
            style={{
              position: "relative",
              maxWidth: 420,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <h1
              style={{
                fontSize: 24,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {config.hero.title}
            </h1>
            {config.hero.subtitle && (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#fee2e2",
                }}
              >
                {config.hero.subtitle}
              </p>
            )}
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 12,
            }}
          >
            <button
              type="button"
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                backgroundColor: "#0f172a",
                color: "#fefce8",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 10px 25px rgba(15,23,42,0.6)",
              }}
            >
              {config.hero.ctaLabel || "Ver menu"}
            </button>
            {config.status.message && (
              <div
                style={{
                  maxWidth: 260,
                  padding: "8px 10px",
                  borderRadius: 10,
                  backgroundColor: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(254,249,195,0.4)",
                  fontSize: 11,
                  color: "#fefce8",
                }}
              >
                {config.status.message}
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1.2fr",
            gap: 16,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              backgroundColor: "#020617",
              border: "1px solid rgba(31,41,55,0.85)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Horário de hoje
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 11,
                color: "#e5e5e5",
              }}
            >
              {config.schedule.map((entry) => (
                <div
                  key={entry.day}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    opacity: entry.closed ? 0.5 : 1,
                  }}
                >
                  <span>{DAYS_LABEL[entry.day] ?? entry.day}</span>
                  <span>
                    {entry.closed ? "Fechado" : `${entry.open} – ${entry.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              borderRadius: 16,
              backgroundColor: "#020617",
              border: "1px solid rgba(31,41,55,0.85)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Contactos
            </h3>
            {config.contacts.phone && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>Telefone</span>
                <span>{config.contacts.phone}</span>
              </div>
            )}
            {config.contacts.whatsapp && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>WhatsApp</span>
                <span>{config.contacts.whatsapp}</span>
              </div>
            )}
            {config.contacts.email && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>Email</span>
                <span>{config.contacts.email}</span>
              </div>
            )}
            {config.contacts.address && (
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "1px dashed rgba(55,65,81,0.9)",
                  color: "#e5e5e5",
                  fontSize: 11,
                  whiteSpace: "pre-wrap",
                }}
              >
                {config.contacts.address}
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            borderRadius: 16,
            backgroundColor: "#020617",
            border: "1px solid rgba(31,41,55,0.85)",
            padding: 14,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            gap: 10,
          }}
        >
          {config.highlights.map((card) => (
            <div
              key={card.id}
              style={{
                borderRadius: 12,
                background:
                  "radial-gradient(circle at top left, #1f2937 0, #020617 65%)",
                border: "1px solid rgba(55,65,81,0.9)",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                  color: "#9ca3af",
                }}
              >
                {card.icon || "destaque"}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {card.title}
              </span>
              {card.description && (
                <p
                  style={{
                    margin: 0,
                    color: "#9ca3af",
                  }}
                >
                  {card.description}
                </p>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function saveLocalDraftAndReturn(
  restaurantId: string,
  value: WebsiteQuickConfig,
): WebsiteQuickConfig {
  saveLocalDraft(restaurantId, value);
  return value;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid rgba(148,163,184,0.5)",
  backgroundColor: "#020617",
  color: "#e5e5e5",
  fontSize: 12,
  outline: "none",
};

