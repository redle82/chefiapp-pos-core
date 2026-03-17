/**
 * ConfigPerceptionPage - Percepção Operacional e Segurança Assistida
 *
 * Link da câmera, ver ao vivo e análise com IA. Visual: VPC (escuro, surface, botões grandes).
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

const ZONE_OPTION_KEYS = ["kitchen", "floor", "storage", "cash", "entrance", "other"] as const;

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
  const { t } = useTranslation("config");
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
      setAnalysisError(t("perception.errorNoLink"));
      return;
    }
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
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
      setAnalysisError(e instanceof Error ? e.message : t("perception.errorApi"));
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
          {t("perception.title")}
        </h1>
        <p
          style={{
            fontSize: VPC.fontSizeBase,
            color: VPC.textMuted,
            margin: "0 0 8px 0",
          }}
        >
          {t("perception.subtitle")}
        </p>
        <p
          style={{
            fontSize: VPC.fontSizeBase,
            color: VPC.accent,
            margin: 0,
            fontWeight: 500,
          }}
        >
          {t("perception.instruction")}
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
        <label
          style={{
            display: "block",
            fontSize: VPC.fontSizeBase,
            fontWeight: 600,
            marginBottom: 8,
            color: VPC.text,
          }}
        >
          {t("perception.cameraLinkLabel")}
        </label>
        <input
          type="url"
          value={cameraUrl}
          onChange={(e) => setCameraUrl(e.target.value)}
          placeholder={t("perception.cameraLinkPlaceholder")}
          style={inputStyle}
        />
        <label
          style={{
            display: "block",
            fontSize: VPC.fontSizeBase,
            fontWeight: 600,
            marginBottom: 8,
            color: VPC.text,
          }}
        >
          {t("perception.cameraZoneLabel")}
        </label>
        <p style={{ fontSize: 12, color: VPC.textMuted, margin: "0 0 8px 0" }}>
          {t("perception.cameraZoneDesc")}
        </p>
        <select
          value={cameraZone}
          onChange={(e) => setCameraZone(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        >
          <option value="">{t("perception.selectZone")}</option>
          {ZONE_OPTION_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`perception.zone.${key}`)}
            </option>
          ))}
        </select>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
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
            {t("perception.saveLink")}
          </button>
          {saved && (
            <span
              style={{
                fontSize: VPC.fontSizeBase,
                color: VPC.accent,
                fontWeight: 500,
              }}
            >
              {t("perception.saved")}
            </span>
          )}
          <button
            type="button"
            onClick={previewUrl ? handleHideLive : handleShowLive}
            disabled={!!(cameraUrl.trim() && isIcSeeShareUrl(cameraUrl))}
            title={
              cameraUrl.trim() && isIcSeeShareUrl(cameraUrl)
                ? t("perception.icseeTooltip")
                : undefined
            }
            style={{
              minHeight: VPC.btnMinHeight,
              padding: "12px 24px",
              fontSize: VPC.fontSizeBase,
              fontWeight: 600,
              color:
                cameraUrl.trim() && isIcSeeShareUrl(cameraUrl)
                  ? VPC.textMuted
                  : VPC.text,
              backgroundColor:
                cameraUrl.trim() && isIcSeeShareUrl(cameraUrl)
                  ? "transparent"
                  : VPC.surface,
              border: `1px solid ${VPC.border}`,
              borderRadius: VPC.radius,
              cursor:
                cameraUrl.trim() && isIcSeeShareUrl(cameraUrl)
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {previewUrl ? t("perception.hideLive") : t("perception.showLive")}
          </button>
        </div>
      </div>

      {/* Camera check */}
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
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 8px 0",
            color: VPC.text,
          }}
        >
          {t("perception.cameraCheck")}
        </h2>
        <p style={{ fontSize: 13, color: VPC.textMuted, margin: "0 0 16px 0" }}>
          {t("perception.cameraCheckDesc")}
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
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#93c5fd",
                marginBottom: 6,
              }}
            >
              {t("perception.icseeShareTitle")}
            </div>
            <p
              style={{
                fontSize: 13,
                color: VPC.textMuted,
                margin: "0 0 12px 0",
              }}
            >
              {t("perception.icseeShareDesc")}
            </p>
            <button
              type="button"
              onClick={() =>
                window.open(cameraUrl.trim(), "_blank", "noopener,noreferrer")
              }
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
              {t("perception.openCameraNewWindow")}
            </button>
          </div>
        )}
        {cameraUrl.trim() && isIcSeeShareUrl(cameraUrl) ? (
          <p style={{ fontSize: 13, color: VPC.textMuted, margin: 0 }}>
            {t("perception.icseeHint")}
          </p>
        ) : !previewUrl ? (
          <p style={{ fontSize: 13, color: VPC.textMuted, margin: 0 }}>
            {t("perception.saveAndWatch")}
          </p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {streamStatus === "loading" && (
                <span style={{ fontSize: 14, color: VPC.accent }}>
                  {t("perception.streamLoading")}
                </span>
              )}
              {streamStatus === "live" && (
                <>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: VPC.accent,
                    }}
                  />
                  <span
                    style={{ fontSize: 14, color: VPC.accent, fontWeight: 600 }}
                  >
                    {t("perception.streamLive")}
                  </span>
                </>
              )}
              {streamStatus === "error" && (
                <>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "#f87171",
                    }}
                  />
                  <span
                    style={{ fontSize: 14, color: "#f87171", fontWeight: 600 }}
                  >
                    {t("perception.streamError")}
                  </span>
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
                alt={t("perception.streamAlt")}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onLoad={() => setStreamStatus("live")}
                onError={() => setStreamStatus("error")}
              />
            </div>
            <p
              style={{
                fontSize: 12,
                color: VPC.textMuted,
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              {t("perception.streamHint")}
            </p>
          </>
        )}
      </div>

      {/* Observation (basic patterns) */}
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
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 8px 0",
            color: VPC.text,
          }}
        >
          {t("perception.observationTitle")}
        </h2>
        <p style={{ fontSize: 13, color: VPC.textMuted, margin: "0 0 12px 0" }}>
          {t("perception.observationDesc")}
        </p>
        <button
          type="button"
          disabled
          title={t("perception.observationComingSoon")}
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
          {t("perception.generateObservation")}
        </button>
        <p
          style={{
            fontSize: 12,
            color: VPC.textMuted,
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          {t("perception.observationComingSoon")}
        </p>
      </div>

      {/* Analyze with LLM */}
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
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 8px 0",
            color: VPC.text,
          }}
        >
          {t("perception.analyzeTitle")}
        </h2>
        <p style={{ fontSize: 13, color: VPC.textMuted, marginBottom: 12 }}>
          {t("perception.analyzeDesc")}
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
          {analyzing ? t("perception.analyzing") : t("perception.analyzeWithAI")}
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
