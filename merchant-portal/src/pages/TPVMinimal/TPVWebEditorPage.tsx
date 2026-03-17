import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useAuth } from "../../core/auth/useAuth";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
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

export function TPVWebEditorPage() {
  const { t } = useTranslation("tpv");
  const { runtime } = useRestaurantRuntime();
  const { user } = useAuth();
  const { identity } = useRestaurantIdentity();
  const toast = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [previewMode, setPreviewMode] = useState<"preview" | "published">(
    "preview",
  );

  const restaurantId = runtime.restaurant_id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WebsiteQuickConfig | null>(null);
  const [publishedConfig, setPublishedConfig] =
    useState<WebsiteQuickConfig | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setError(
        t("webEditor.errorRestaurantNotInitialized"),
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
        if (doc?.published) {
          setPublishedConfig(doc.published);
        }
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
          err instanceof Error ? err.message : t("webEditor.errorLoadConfig");
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
        title: t("webEditor.draftSavedTitle"),
        description: t("webEditor.draftSavedDescription"),
      });
      setOffline(
        !runtime.coreReachable || runtime.coreMode === "offline-erro",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("webEditor.errorSaveDraft");
      setError(message);
      toast.show({
        type: "warning",
        title: t("webEditor.draftSavedLocalTitle"),
        description: t("webEditor.draftSavedLocalDescription"),
      });
      setOffline(true);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!restaurantId || !config) return;
    const confirmed = window.confirm(
      t("webEditor.confirmPublish"),
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
      setPublishedConfig(config);
      setLastPublishedAt(new Date().toISOString());
      // Reload iframe to show freshly published content
      setIframeKey((k) => k + 1);
      toast.show({
        type: "success",
        title: t("webEditor.publishedTitle"),
        description: t("webEditor.publishedDescription"),
      });
      setOffline(
        !runtime.coreReachable || runtime.coreMode === "offline-erro",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("webEditor.errorPublish");
      setError(message);
      toast.show({
        type: "error",
        title: t("webEditor.publishFailedTitle"),
        description: message,
      });
    } finally {
      setPublishing(false);
    }
  };

  const hasConfig = !!config;

  const publicPageUrl = useMemo(() => {
    const slug = identity.slug;
    if (!slug) return null;
    return `/public/${encodeURIComponent(slug)}`;
  }, [identity.slug]);

  const hasUnpublishedChanges = useMemo(() => {
    if (!config) return false;
    if (!publishedConfig) return true;
    return JSON.stringify(config) !== JSON.stringify(publishedConfig);
  }, [config, publishedConfig]);

  const handleDiscard = () => {
    if (!publishedConfig) return;
    const confirmed = window.confirm(
      t("webEditor.confirmDiscard"),
    );
    if (!confirmed) return;
    setConfig(publishedConfig);
    if (restaurantId) {
      clearLocalDraft(restaurantId);
    }
    toast.show({
      type: "info",
      title: t("webEditor.discardedTitle"),
      description: t("webEditor.discardedDescription"),
    });
  };

  if (loading && !hasConfig) {
    return <GlobalLoadingView title={t("webEditor.loading")} />;
  }

  if (!restaurantId) {
    return (
      <GlobalBlockedView
        title={t("webEditor.restaurantNotInitialized")}
        description={t("webEditor.restaurantNotInitializedHint")}
      />
    );
  }

  if (!config) {
    return (
      <GlobalBlockedView
        title={t("webEditor.editorUnavailable")}
        description={
          error ??
          t("webEditor.editorUnavailableHint")
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
            {t("webEditor.headerTitle")}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#737373",
            }}
          >
            {t("webEditor.headerSubtitle")}
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
              {t("webEditor.offlineBadge")}
            </span>
          )}
          {lastPublishedAt && (
            <span
              style={{
                fontSize: 11,
                color: "#737373",
              }}
            >
              {t("webEditor.lastPublished")}{" "}
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
          paddingTop: 56,
          overflow: "hidden",
        }}
      >
        {/* Scrollable editor form */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
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
            {t("webEditor.sectionHero")}
          </h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>{t("webEditor.labelTitle")}</span>
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
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>{t("webEditor.labelSubtitle")}</span>
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
              {t("webEditor.labelImageUrl")}
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
                {t("webEditor.labelCtaLabel")}
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
                {t("webEditor.labelCtaLink")}
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
            {t("webEditor.sectionSchedule")}
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
                  {t(`webEditor.day.${entry.day}`)}
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
                  {t("webEditor.closed")}
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
            {t("webEditor.sectionContacts")}
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
              <span style={{ fontSize: 12, color: "#e5e5e5" }}>{t("webEditor.labelPhone")}</span>
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
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>{t("webEditor.labelEmail")}</span>
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
            <span style={{ fontSize: 12, color: "#e5e5e5" }}>{t("webEditor.labelAddress")}</span>
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
            {t("webEditor.sectionHighlights")}
          </h2>
          <span
            style={{
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            {t("webEditor.highlightsHint")}
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
                    >{t("webEditor.highlightTitle", { n: idx + 1 })}</span>
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
                      {t("webEditor.labelIcon")}
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
                    {t("webEditor.labelShortText")}
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
            {t("webEditor.sectionStatus")}
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
                  ? t("webEditor.statusOpen")
                  : mode === "closed"
                  ? t("webEditor.statusClosed")
                  : t("webEditor.statusPaused");
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
              {t("webEditor.statusMessageLabel")}
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

        </div>

        {/* Action buttons — sticky at bottom */}
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 12,
            paddingBottom: 8,
            paddingRight: 8,
            flexWrap: "wrap",
            borderTop: "1px solid rgba(148,163,184,0.1)",
            flexShrink: 0,
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
            {saving ? t("webEditor.savingDraft") : t("webEditor.saveDraft")}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || saving || !hasUnpublishedChanges}
            title={t("webEditor.publish")}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              background: hasUnpublishedChanges
                ? "linear-gradient(135deg, #22c55e, #4ade80, #22c55e, #16a34a)"
                : "rgba(34,197,94,0.2)",
              color: hasUnpublishedChanges ? "#020617" : "#6ee7b7",
              fontSize: 13,
              fontWeight: 600,
              cursor: hasUnpublishedChanges ? "pointer" : "default",
              boxShadow: hasUnpublishedChanges
                ? "0 0 0 1px rgba(22,163,74,0.5)"
                : "none",
            }}
          >
            {publishing ? t("webEditor.publishing") : t("webEditor.publish")}
          </button>
          {hasUnpublishedChanges && publishedConfig && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving || publishing}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(248,113,113,0.4)",
                backgroundColor: "transparent",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("webEditor.discard")}
            </button>
          )}
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
          overflow: "hidden",
        }}
        data-testid="tpv-web-editor-preview"
      >
        {/* Preview header with toggle + publish state */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ fontSize: 14, fontWeight: 600, color: "#fafafa" }}
              >
                {t("webEditor.previewTitle")}
              </span>
              {/* Toggle: Preview / Publicada */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.25)",
                  overflow: "hidden",
                }}
              >
                {(["preview", "published"] as const).map((mode) => {
                  const active = previewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreviewMode(mode)}
                      style={{
                        padding: "3px 10px",
                        border: "none",
                        fontSize: 11,
                        fontWeight: active ? 600 : 400,
                        backgroundColor: active
                          ? "rgba(148,163,184,0.2)"
                          : "transparent",
                        color: active ? "#fafafa" : "#6b7280",
                        cursor: "pointer",
                      }}
                    >
                      {mode === "preview" ? t("webEditor.previewTab") : t("webEditor.publishedTab")}
                    </button>
                  );
                })}
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              {previewMode === "preview"
                ? hasUnpublishedChanges
                  ? t("webEditor.previewDescUnpublished")
                  : t("webEditor.previewDescUpToDate")
                : t("webEditor.previewDescPublished")}
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: `1px solid ${hasUnpublishedChanges ? "rgba(234,179,8,0.5)" : "rgba(34,197,94,0.5)"}`,
              backgroundColor: hasUnpublishedChanges
                ? "rgba(234,179,8,0.1)"
                : "rgba(34,197,94,0.1)",
              color: hasUnpublishedChanges ? "#eab308" : "#4ade80",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {hasUnpublishedChanges ? t("webEditor.statusDraft") : t("webEditor.statusPublished")}
          </span>
        </div>

        {/* Live iframe preview — renders the REAL public page */}
        {publicPageUrl ? (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={publicPageUrl}
            title={t("webEditor.iframeTitle")}
            style={{
              flex: 1,
              width: "100%",
              border: "none",
              borderRadius: 12,
              backgroundColor: "#0a0a0a",
            }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#737373",
              fontSize: 13,
              textAlign: "center",
              padding: 24,
            }}
          >
            {identity.loading
              ? t("webEditor.loadingPreview")
              : t("webEditor.previewUnavailable")}
          </div>
        )}
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

