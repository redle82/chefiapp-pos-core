/**
 * ConfigPerceptionPage - Percepção Operacional e Segurança Assistida
 *
 * Link da câmera, ver ao vivo e análise com IA. Visual: VPC (escuro, surface, botões grandes).
 */

import { useEffect, useRef, useState } from "react";
import { infer } from "../../core/ai/aiGateway";

const VPC = {
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  radius: 8,
  space: 24,
  btnMinHeight: 48,
  fontSizeBase: 14,
  fontSizeLarge: 20,
} as const;

const STORAGE_KEY_CAMERA_URL = "chefiapp_perception_camera_url";
const STORAGE_KEY_CAMERA_ZONE = "chefiapp_perception_camera_zone";

const ZONE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "kitchen", label: "Cozinha" },
  { value: "floor", label: "Salão" },
  { value: "storage", label: "Estoque" },
  { value: "cash", label: "Caixa" },
  { value: "entrance", label: "Entrada" },
  { value: "other", label: "Outro" },
];

/** Links de partilha iCSee (d.jfapp.net, etc.) são páginas, não stream direto. */
function isIcSeeShareUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return (
    u.includes("jfapp.net") ||
    u.includes("icsee") ||
    u.includes("com.xm.csee") ||
    (u.includes("share=jf") && u.includes("code="))
  );
}

type StreamStatus = "idle" | "loading" | "live" | "error";

export function ConfigPerceptionPage() {
  const [cameraUrl, setCameraUrl] = useState("");
  const [cameraZone, setCameraZone] = useState("");
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    const storedUrl = localStorage.getItem(STORAGE_KEY_CAMERA_URL);
    const storedZone = localStorage.getItem(STORAGE_KEY_CAMERA_ZONE);
    if (storedUrl) setCameraUrl(storedUrl);
    if (storedZone) setCameraZone(storedZone);
  }, []);

  const handleSave = () => {
    if (cameraUrl.trim()) {
      localStorage.setItem(STORAGE_KEY_CAMERA_URL, cameraUrl.trim());
    }
    if (cameraZone) {
      localStorage.setItem(STORAGE_KEY_CAMERA_ZONE, cameraZone);
    }
    if (cameraUrl.trim() || cameraZone) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleShowLive = () => {
    const url = cameraUrl.trim();
    if (!url) {
      setStreamStatus("idle");
      setPreviewUrl(null);
      return;
    }
    // Partilhas iCSee são páginas web, não stream — não tentar incorporar (evita "Sem sinal" + caixa preta)
    if (isIcSeeShareUrl(url)) {
      setPreviewUrl(null);
      setStreamStatus("idle");
      return;
    }
    setPreviewUrl(url);
    setStreamStatus("loading");
    setAnalysisError(null);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    const isLikelySnapshot =
      /\.(jpg|jpeg|png|gif)(\?|$)/i.test(url) ||
      url.includes("snapshot") ||
      url.includes("capture");
    if (isLikelySnapshot) {
      refreshIntervalRef.current = setInterval(() => {
        setPreviewUrl((prev) =>
          prev ? `${prev.replace(/\?.*$/, "")}?t=${Date.now()}` : null,
        );
      }, 3000);
    }
  };

  const handleHideLive = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    setPreviewUrl(null);
    setStreamStatus("idle");
  };

  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  const handleAnalyze = async () => {
    const urlToUse = cameraUrl.trim();
    if (!urlToUse) {
      setAnalysisError("Coloque o link da câmera acima e guarde.");
      return;
    }
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      // AI Gateway: um intent, um contexto (ver docs/CHEFIAPP_AI_GATEWAY_SPEC.md)
      const context: Record<string, unknown> = {
        zone: cameraZone || "other",
        cameraUrl: urlToUse,
        movement: "unknown",
        duration_minutes: 0,
        active_orders: 0,
      };
      const result = await infer("perception_explanation", context);
      const text = result.suggestion
        ? `${result.explanation}\n\n→ ${result.suggestion}`
        : result.explanation;
      setAnalysisResult(text);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Erro ao chamar API.");
    } finally {
      setAnalyzing(false);
    }
  };

  const inputStyle = {
    width: "100%" as const,
    padding: 12,
    fontSize: VPC.fontSizeBase,
    border: `1px solid ${VPC.border}`,
    borderRadius: VPC.radius,
    marginBottom: 12,
    backgroundColor: VPC.surface,
    color: VPC.text,
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ marginBottom: VPC.space }}>
        <h1
          style={{
            fontSize: VPC.fontSizeLarge,
            fontWeight: 700,
            margin: "0 0 8px 0",
            color: VPC.text,
            letterSpacing: "-0.02em",
          }}
        >
          Percepção Operacional
        </h1>
        <p
          style={{
            fontSize: VPC.fontSizeBase,
            color: VPC.textMuted,
            margin: "0 0 8px 0",
          }}
        >
          Link da câmera (stream ou partilha) e análise de cena com IA. Sem identificar pessoas.
        </p>
        <p
          style={{
            fontSize: VPC.fontSizeBase,
            color: VPC.accent,
            margin: 0,
            fontWeight: 500,
          }}
        >
          Cole o link da câmera abaixo, guarde e use «Analisar com IA» para obter uma descrição da cena.
        </p>
      </header>

      <div
        style={{
          maxWidth: 640,
          padding: VPC.space,
          backgroundColor: VPC.surface,
          borderRadius: VPC.radius,
          border: `1px solid ${VPC.border}`,
        }}
      >
        <label style={{ display: "block", fontSize: VPC.fontSizeBase, fontWeight: 600, marginBottom: 8, color: VPC.text }}>
          Link da câmera
        </label>
        <input
          type="url"
          value={cameraUrl}
          onChange={(e) => setCameraUrl(e.target.value)}
          placeholder="https://... (ex.: partilha iCSee d.jfapp.net, ou URL de stream)"
          style={inputStyle}
        />
        <label style={{ display: "block", fontSize: VPC.fontSizeBase, fontWeight: 600, marginBottom: 8, color: VPC.text }}>
          Zona da câmera
        </label>
        <p style={{ fontSize: 12, color: VPC.textMuted, margin: "0 0 8px 0" }}>
          Onde esta câmera está (cozinha, salão, estoque, etc.). Necessário para interpretar eventos.
        </p>
        <select
          value={cameraZone}
          onChange={(e) => setCameraZone(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        >
          <option value="">— Escolher zona —</option>
          {ZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              minHeight: VPC.btnMinHeight,
              padding: "12px 24px",
              fontSize: VPC.fontSizeBase,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: VPC.accent,
              border: "none",
              borderRadius: VPC.radius,
              cursor: "pointer",
            }}
          >
            Guardar link
          </button>
          {saved && <span style={{ fontSize: VPC.fontSizeBase, color: VPC.accent, fontWeight: 500 }}>Guardado.</span>}
          <button
            type="button"
            onClick={previewUrl ? handleHideLive : handleShowLive}
            disabled={!!(cameraUrl.trim() && isIcSeeShareUrl(cameraUrl))}
            title={cameraUrl.trim() && isIcSeeShareUrl(cameraUrl) ? "Para links iCSee use «Abrir câmera noutra janela» na secção abaixo" : undefined}
            style={{
              minHeight: VPC.btnMinHeight,
              padding: "12px 24px",
              fontSize: VPC.fontSizeBase,
              fontWeight: 600,
              color: cameraUrl.trim() && isIcSeeShareUrl(cameraUrl) ? VPC.textMuted : VPC.text,
              backgroundColor: cameraUrl.trim() && isIcSeeShareUrl(cameraUrl) ? "transparent" : VPC.surface,
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              cursor: cameraUrl.trim() && isIcSeeShareUrl(cameraUrl) ? "not-allowed" : "pointer",
            }}
          >
            {previewUrl ? "Ocultar transmissão" : "Ver ao vivo"}
          </button>
        </div>
      </div>

      {/* Confirmação — Câmera ligada? */}
      <div
        style={{
          maxWidth: 640,
          marginTop: VPC.space,
          padding: VPC.space,
          backgroundColor: VPC.surface,
          borderRadius: VPC.radius,
          border: `1px solid ${VPC.border}`,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0", color: VPC.text }}>
          Confirmação — Câmera ligada?
        </h2>
        <p style={{ fontSize: 13, color: VPC.textMuted, margin: "0 0 16px 0" }}>
          Use «Ver ao vivo» para confirmar se a câmera está acesa e a enviar sinal.
        </p>
        {cameraUrl.trim() && isIcSeeShareUrl(cameraUrl) && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "#93c5fd", marginBottom: 6 }}>
              Link iCSee (partilha)
            </div>
            <p style={{ fontSize: 13, color: VPC.textMuted, margin: "0 0 12px 0" }}>
              Este link abre a página da iCSee. Use o botão abaixo para abrir noutra janela.
            </p>
            <button
              type="button"
              onClick={() => window.open(cameraUrl.trim(), "_blank", "noopener,noreferrer")}
              style={{
                minHeight: VPC.btnMinHeight,
                padding: "12px 24px",
                fontSize: VPC.fontSizeBase,
                fontWeight: 600,
                color: VPC.text,
                backgroundColor: "transparent",
                border: `1px solid ${VPC.border}`,
                borderRadius: VPC.radius,
                cursor: "pointer",
              }}
            >
              Abrir câmera noutra janela
            </button>
          </div>
        )}
        {cameraUrl.trim() && isIcSeeShareUrl(cameraUrl) ? (
          <p style={{ fontSize: 13, color: VPC.textMuted, margin: 0 }}>
            Para partilhas iCSee use o botão <strong>Abrir câmera noutra janela</strong> acima.
          </p>
        ) : !previewUrl ? (
          <p style={{ fontSize: 13, color: VPC.textMuted, margin: 0 }}>
            Guarde o link acima e clique em <strong>Ver ao vivo</strong>.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {streamStatus === "loading" && <span style={{ fontSize: 14, color: VPC.accent }}>A carregar…</span>}
              {streamStatus === "live" && (
                <>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: VPC.accent }} />
                  <span style={{ fontSize: 14, color: VPC.accent, fontWeight: 600 }}>Câmera ligada — a receber sinal</span>
                </>
              )}
              {streamStatus === "error" && (
                <>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#f87171" }} />
                  <span style={{ fontSize: 14, color: "#f87171", fontWeight: 600 }}>Sem sinal — verifique o link</span>
                </>
              )}
            </div>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16/10",
                maxHeight: 360,
                backgroundColor: "#0a0a0a",
                borderRadius: VPC.radius,
                overflow: "hidden",
              }}
            >
              <img
                src={previewUrl}
                alt="Transmissão ao vivo da câmera"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onLoad={() => setStreamStatus("live")}
                onError={() => setStreamStatus("error")}
              />
            </div>
            <p style={{ fontSize: 12, color: VPC.textMuted, marginTop: 8, marginBottom: 0 }}>
              Se não vir imagem, o link pode ser uma página (ex.: iCSee). Use um link de stream ou snapshot.
            </p>
          </>
        )}
      </div>

      {/* Observação (padrões básicos) */}
      <div
        style={{
          maxWidth: 640,
          marginTop: VPC.space,
          padding: VPC.space,
          backgroundColor: VPC.surface,
          borderRadius: VPC.radius,
          border: `1px solid ${VPC.border}`,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0", color: VPC.text }}>
          Observação (padrões básicos)
        </h2>
        <p style={{ fontSize: 13, color: VPC.textMuted, margin: "0 0 12px 0" }}>
          Deteta movimento vs. ausência de movimento, duração por zona. Gera eventos estruturados.
        </p>
        <button
          type="button"
          disabled
          title="Em breve: deteção de padrões por zona."
          style={{
            minHeight: VPC.btnMinHeight,
            padding: "12px 24px",
            fontSize: VPC.fontSizeBase,
            fontWeight: 600,
            color: VPC.textMuted,
            backgroundColor: "transparent",
            border: `1px solid ${VPC.border}`,
            borderRadius: VPC.radius,
            cursor: "not-allowed",
          }}
        >
          Gerar observação
        </button>
        <p style={{ fontSize: 12, color: VPC.textMuted, marginTop: 8, marginBottom: 0 }}>
          Em breve: deteção de padrões por zona.
        </p>
      </div>

      {/* Analisar com LLM */}
      <div
        style={{
          maxWidth: 640,
          marginTop: VPC.space,
          padding: VPC.space,
          backgroundColor: VPC.surface,
          borderRadius: VPC.radius,
          border: `1px solid ${VPC.border}`,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0", color: VPC.text }}>
          Analisar com LLM
        </h2>
        <p style={{ fontSize: 13, color: VPC.textMuted, marginBottom: 12 }}>
          Usa o link e a zona guardados. O AI Gateway devolve explicação e sugestão. Opcional: VITE_AI_GATEWAY_ENDPOINT.
        </p>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{
            minHeight: VPC.btnMinHeight,
            padding: "12px 24px",
            fontSize: VPC.fontSizeBase,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: analyzing ? VPC.textMuted : VPC.accent,
            border: "none",
            borderRadius: VPC.radius,
            cursor: analyzing ? "not-allowed" : "pointer",
          }}
        >
          {analyzing ? "A analisar…" : "Analisar com IA"}
        </button>
        {analysisError && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: "rgba(185, 28, 28, 0.12)",
              color: "#f87171",
              borderRadius: VPC.radius,
              fontSize: VPC.fontSizeBase,
              border: `1px solid ${VPC.border}`,
            }}
          >
            {analysisError}
          </div>
        )}
        {analysisResult && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: "#0a0a0a",
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              fontSize: VPC.fontSizeBase,
              color: VPC.text,
              whiteSpace: "pre-wrap",
            }}
          >
            {analysisResult}
          </div>
        )}
      </div>
    </div>
  );
}
