/**
 * IntegrationsInstagramPage — Instagram Business integration.
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md
 *
 * Connect Instagram Business, view posts, enable auto-posting.
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
import { IntegrationRegistry } from "../../../../../integrations";
import {
  createInstagramAdapter,
  INSTAGRAM_ADAPTER_ID,
  InstagramAPI,
  type InstagramConfig,
  type InstagramPost,
  type InstagramProfile,
} from "../../../../../integrations/adapters/instagram/InstagramAdapter";
import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export function IntegrationsInstagramPage() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoConfig, setAutoConfig] = useState<
    Pick<InstagramConfig, "autoPostNewDishes" | "autoPostPromotions">
  >({
    autoPostNewDishes: false,
    autoPostPromotions: false,
  });

  const registerAdapter = useCallback(
    (enabled: boolean) => {
      const adapter = createInstagramAdapter({ enabled, ...autoConfig });
      IntegrationRegistry.register(adapter).catch(() => {});
    },
    [autoConfig],
  );

  useEffect(() => {
    registerAdapter(status === "connected");
    return () => {
      IntegrationRegistry.unregister(INSTAGRAM_ADAPTER_ID).catch(() => {});
    };
  }, [registerAdapter, status]);

  const handleConnect = async () => {
    setStatus("connecting");
    setError(null);
    try {
      const p = await InstagramAPI.connect();
      setProfile(p);
      setStatus("connected");
      setLoadingPosts(true);
      const r = await InstagramAPI.getRecentPosts();
      setPosts(r);
      setLoadingPosts(false);
    } catch (err) {
      console.error("[InstagramPage] connect error:", err);
      setError("Não foi possível conectar ao Instagram. Tente novamente.");
      setStatus("error");
    }
  };

  const handleDisconnect = async () => {
    try {
      await InstagramAPI.disconnect();
    } catch {
      // ignore
    }
    setProfile(null);
    setPosts([]);
    setStatus("disconnected");
  };

  const statusLabel: Record<ConnectionStatus, string> = {
    disconnected: "Desligado",
    connecting: "A conectar…",
    connected: "Conectado",
    error: "Erro",
  };

  const statusColor: Record<ConnectionStatus, string> = {
    disconnected: "var(--text-secondary)",
    connecting: "var(--color-warning)",
    connected: "var(--color-success)",
    error: "var(--color-error)",
  };

  const statusBg: Record<ConnectionStatus, string> = {
    disconnected: "var(--card-bg-on-dark)",
    connecting: "var(--status-warning-bg)",
    connected: "var(--status-success-bg)",
    error: "var(--status-error-bg)",
  };

  return (
    <>
      <AdminPageHeader
        title="Instagram"
        subtitle="Conecte a conta Instagram do restaurante para publicação automática e análise de engagement."
      />

      {/* ── Connection Card ── */}
      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: 24,
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: "0 0 4px 0",
                  color: "var(--text-primary)",
                }}
              >
                Instagram Business
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "var(--text-secondary)",
                }}
              >
                Publique novos pratos e promoções automaticamente. Acompanhe
                engagement.
              </p>
            </div>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: statusBg[status],
                color: statusColor[status],
              }}
            >
              {statusLabel[status]}
            </span>
          </div>

          {error && (
            <p
              style={{
                color: "var(--color-error)",
                fontSize: 13,
                margin: "0 0 12px 0",
              }}
            >
              {error}
            </p>
          )}

          {status === "disconnected" || status === "error" ? (
            <button
              onClick={handleConnect}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background:
                  "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Conectar Instagram
            </button>
          ) : status === "connecting" ? (
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              A conectar via Facebook Login…
            </p>
          ) : (
            <button
              onClick={handleDisconnect}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "1px solid var(--surface-border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Desconectar
            </button>
          )}
        </div>
      </section>

      {/* ── Profile Card ── */}
      {profile && status === "connected" && (
        <section style={{ marginBottom: 24 }}>
          <div
            style={{
              padding: 24,
              border: "1px solid var(--surface-border)",
              borderRadius: 12,
              backgroundColor: "var(--card-bg-on-dark)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: "0 0 16px 0",
                color: "var(--text-primary)",
              }}
            >
              @{profile.username}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                textAlign: "center",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.followersCount.toLocaleString()}
                </p>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Seguidores
                </span>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.mediaCount}
                </p>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Publicações
                </span>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.followsCount}
                </p>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  A seguir
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Auto-posting config ── */}
      {status === "connected" && (
        <section style={{ marginBottom: 24 }}>
          <div
            style={{
              padding: 24,
              border: "1px solid var(--surface-border)",
              borderRadius: 12,
              backgroundColor: "var(--card-bg-on-dark)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: "0 0 16px 0",
                color: "var(--text-primary)",
              }}
            >
              Publicação automática
            </h2>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                color: "var(--text-secondary)",
              }}
            >
              Quando ativado, o ChefIApp publica automaticamente no Instagram
              quando adicionas novos pratos ou promoções.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={autoConfig.autoPostNewDishes}
                  onChange={(e) =>
                    setAutoConfig((prev) => ({
                      ...prev,
                      autoPostNewDishes: e.target.checked,
                    }))
                  }
                  style={{ marginTop: 2 }}
                />
                <span>
                  <span style={{ fontWeight: 500 }}>
                    Publicar novos pratos automaticamente
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Gera um post quando um novo prato entra no menu.
                  </span>
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={autoConfig.autoPostPromotions}
                  onChange={(e) =>
                    setAutoConfig((prev) => ({
                      ...prev,
                      autoPostPromotions: e.target.checked,
                    }))
                  }
                  style={{ marginTop: 2 }}
                />
                <span>
                  <span style={{ fontWeight: 500 }}>
                    Publicar promoções automaticamente
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Publica quando uma promoção é criada ou ativada.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* ── Recent posts ── */}
      {status === "connected" && (
        <section>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 12px 0",
              color: "var(--text-primary)",
            }}
          >
            Últimas publicações
          </h2>
          {loadingPosts ? (
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              A carregar…
            </p>
          ) : posts.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Sem publicações.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: 360,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {posts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 16,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 10,
                    backgroundColor: "var(--card-bg-on-dark)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "var(--status-primary-bg)",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                      }}
                    >
                      {p.mediaType === "CAROUSEL_ALBUM"
                        ? "Carrossel"
                        : p.mediaType === "VIDEO"
                        ? "Vídeo"
                        : "Imagem"}
                    </span>
                    <span
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      {new Date(p.timestamp).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {p.caption}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>❤️ {p.likeCount}</span>
                    <span>💬 {p.commentsCount}</span>
                    <a
                      href={p.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--color-primary)",
                        textDecoration: "none",
                      }}
                    >
                      Ver no Instagram →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
