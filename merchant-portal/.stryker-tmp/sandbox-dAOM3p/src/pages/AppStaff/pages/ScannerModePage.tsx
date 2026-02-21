/**
 * ScannerModePage — Full-screen barcode scanner mode for AppStaff.
 *
 * Supports:
 * - Camera-based barcode scanning (BarcodeDetector Web API + getUserMedia)
 * - Manual typed barcode entry
 * - Lookup ingredient by barcode → quick IN movement
 * - Associate unknown barcode to existing ingredient
 *
 * Visible to: owner, manager (via staffModeConfig "scanner")
 */
// @ts-nocheck


import React, { useCallback, useEffect, useRef, useState } from "react";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import {
  type BarcodeLookupResult,
  type CoreIngredient,
  associateBarcode,
  lookupIngredientByBarcode,
  readIngredients,
} from "../../../infra/readers/InventoryStockReader";
import { Badge } from "../../../ui/design-system/primitives/Badge";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

// ─── Types ───

interface LocationRow {
  id: string;
  name: string;
  kind: string;
}

// ─── Component ───

export function ScannerModePage() {
  const { coreRestaurantId } = useStaff();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // State
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [counter, setCounter] = useState(0);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [cameraHint, setCameraHint] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");

  // Quick movement
  const [qty, setQty] = useState("1");
  const [locationId, setLocationId] = useState("");

  // Associate
  const [associateIngredientId, setAssociateIngredientId] = useState("");

  // Data
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [ingredients, setIngredients] = useState<CoreIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Movement history (session)
  const [history, setHistory] = useState<
    { name: string; qty: number; time: string }[]
  >([]);

  const restaurantId = coreRestaurantId ?? "";

  // ─── Load data ───

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [ingList, { data: locData }] = await Promise.all([
        readIngredients(restaurantId),
        dockerCoreClient
          .from("gm_locations")
          .select("id, name, kind")
          .eq("restaurant_id", restaurantId)
          .order("name"),
      ]);
      setIngredients(ingList);
      const locs = (locData ?? []) as unknown as LocationRow[];
      setLocations(locs);
      // Auto-select first location
      if (!locationId && locs.length > 0) {
        setLocationId(locs[0].id);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [restaurantId, locationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Handlers ───

  const handleLookup = useCallback(
    async (barcodeValue?: string) => {
      const code = (barcodeValue ?? barcode).trim();
      if (!code || !restaurantId) return;
      setProcessing(true);
      setMessage("");
      try {
        const res = await lookupIngredientByBarcode(restaurantId, code);
        setResult(res);
        if (res.found) {
          setMessage(`✅ ${res.name} (${res.unit})`);
        } else {
          setMessage(
            `❓ Barcode "${code}" não associado. Associe a um ingrediente abaixo.`,
          );
        }
      } catch {
        setMessage("❌ Erro ao procurar barcode.");
      } finally {
        setProcessing(false);
      }
    },
    [barcode, restaurantId],
  );

  // ─── Camera scanning ───

  const startScanning = useCallback(() => {
    console.log("[Scanner] Checking for BarcodeDetector...");
    if (!("BarcodeDetector" in window)) {
      console.warn("[Scanner] BarcodeDetector not available in this browser");
      return;
    }

    console.log("[Scanner] Creating BarcodeDetector instance...");
    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "qr_code", "upc_a", "upc_e"],
      });
      console.log("[Scanner] BarcodeDetector created successfully");

      scanIntervalRef.current = window.setInterval(async () => {
        try {
          if (!videoRef.current || !canvasRef.current || processing) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          // Check if video is ready
          if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            if (video.videoWidth === 0 || video.videoHeight === 0) {
              console.warn(
                "[Scanner] Video dimensions still 0: ",
                video.videoWidth,
                video.videoHeight,
              );
            }
            return;
          }

          // Check if video has dimensions
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.warn(
              "[Scanner] Invalid video dimensions: ",
              video.videoWidth,
              "x",
              video.videoHeight,
            );
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.warn("[Scanner] Could not get canvas context");
            return;
          }

          // Draw video frame to canvas
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          } catch (drawErr) {
            console.warn("[Scanner] drawImage error:", drawErr);
            return;
          }

          // Detect barcodes
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            console.log("[Scanner] Barcode detected:", code);
            if (code && code !== barcode) {
              setBarcode(code);
              handleLookup(code);
            }
          }
        } catch (scanErr) {
          console.warn("[Scanner] Scan error:", scanErr);
          // Continue scanning on error
        }
      }, 500); // Scan every 500ms
      console.log("[Scanner] Scanning started");
    } catch (detectorErr) {
      console.error("[Scanner] Failed to create BarcodeDetector:", detectorErr);
      setCameraError("Falha ao inicializar detetor de barcodes.");
    }
  }, [processing, barcode, handleLookup]);

  const stopCamera = useCallback(() => {
    console.log("[Scanner] Stopping camera");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      console.log("[Scanner] ========== Starting camera ==========");
      console.log("[Scanner] videoRef.current exists?", !!videoRef.current);

      // Check if getUserMedia is available
      if (!navigator.mediaDevices) {
        console.error("[Scanner] ❌ navigator.mediaDevices is NOT available");
        const insecureContext =
          typeof window !== "undefined" && !window.isSecureContext;
        const onLocalhost =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1");

        if (insecureContext && !onLocalhost) {
          throw new Error(
            "Câmera indisponível em HTTP neste iPhone. Abra em HTTPS (ou localhost).",
          );
        }

        throw new Error("mediaDevices não disponível");
      }
      console.log("[Scanner] ✅ navigator.mediaDevices available");

      if (!navigator.mediaDevices.getUserMedia) {
        console.error("[Scanner] ❌ getUserMedia is NOT available");
        throw new Error("getUserMedia não suportado neste browser");
      }
      console.log("[Scanner] ✅ getUserMedia available");

      // Try with simple constraints first (better iOS compatibility)
      const constraints = {
        video: { facingMode: "environment" },
        audio: false,
      };

      console.log(
        "[Scanner] Requesting camera with constraints:",
        JSON.stringify(constraints),
      );
      console.log("[Scanner] About to call getUserMedia...");

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[Scanner] ✅ Camera stream obtained", stream);
      console.log(
        "[Scanner] Stream active?",
        stream.active,
        "Tracks:",
        stream.getTracks().length,
      );

      if (!videoRef.current) {
        console.error("[Scanner] ❌ videoRef.current is NULL!");
        throw new Error("Video element not available");
      }
      console.log("[Scanner] ✅ videoRef.current exists, assigning stream...");

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      console.log("[Scanner] ✅ Stream assigned to videoRef.srcObject");

      // iOS Safari video autoplay handling
      console.log("[Scanner] Setting up video playback...");

      // Wait a tiny bit for video to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const playPromise = videoRef.current.play();
      console.log("[Scanner] play() called, promise returned:", !!playPromise);

      if (playPromise !== undefined) {
        try {
          await playPromise;
          console.log("[Scanner] ✅ Video playing successfully");
        } catch (playErr) {
          console.warn(
            "[Scanner] ⚠️ Play error (may be normal on iOS):",
            playErr,
          );
          // On iOS, video might get autoplay after touch - continue anyway
        }
      }

      setCameraActive(true);
      setCameraInitialized(true);
      setCameraError("");
      setCameraHint("");
      console.log("[Scanner] ✅ Camera active, stream ready");

      // Only start scanning if BarcodeDetector available
      if ("BarcodeDetector" in window) {
        console.log("[Scanner] ✅ BarcodeDetector available, starting scan");
        startScanning();
      } else {
        console.warn("[Scanner] ⚠️ BarcodeDetector not available");
        setCameraError(
          "Detecção de barcodes não suportada. Use modo manual para digitar códigos.",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao aceder à câmera.";
      const errorName = err instanceof DOMException ? err.name : "Unknown";
      console.error("[Scanner] ❌ Camera error:", {
        message: errorMsg,
        name: errorName,
        stack: err instanceof Error ? err.stack : undefined,
        fullError: err,
      });

      // Provide user-friendly iOS-specific error messages
      let userMessage = errorMsg;

      if (
        errorName === "NotAllowedError" ||
        errorMsg.includes("Permission denied")
      ) {
        userMessage =
          "📱 Permissão negada. Vai para Definições > Safari > Câmera e ativa.";
      } else if (errorName === "NotFoundError" || errorMsg.includes("camera")) {
        userMessage = "📱 Câmera não encontrada. Ou já está em uso?";
      } else if (errorName === "NotSupportedError") {
        userMessage = "📱 getUserMedia não suportado neste browser.";
      } else if (errorMsg.includes("getUserMedia")) {
        userMessage = "📱 Câmera indisponível. Tenta modo manual.";
      } else if (
        errorMsg.includes("HTTP neste iPhone") ||
        errorMsg.includes("mediaDevices não disponível")
      ) {
        userMessage =
          "📱 No iPhone, a câmara só funciona em HTTPS. Abre este AppStaff com HTTPS (não http://192.168...).";
        setCameraHint(
          "Dica: usa o endereço HTTPS local configurado (mkcert) ou abre pelo localhost do próprio dispositivo.",
        );
      }

      setCameraError(userMessage);
      setCameraInitialized(true);
      console.log(
        "[Scanner] Camera initialization failed, staying in camera mode to show error",
      );
    }
  }, [startScanning]);

  // Retry camera handler
  const retryCamera = useCallback(() => {
    console.log("[Scanner] User clicked retry, resetting camera error");
    setCameraError("");
    setCameraHint("");
    setCameraInitialized(false);
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (scanMode === "camera" && !cameraError && !cameraInitialized) {
      // Only try to start camera if no error is showing
      startCamera();
    } else if (scanMode === "manual" || cameraError) {
      stopCamera();
      if (scanMode === "manual") {
        setCameraInitialized(false);
      }
    }
    return () => stopCamera();
  }, [scanMode, startCamera, stopCamera, cameraError, cameraInitialized]);

  const handleQuickEntry = useCallback(async () => {
    if (!result?.found || !result.ingredient_id || !locationId) return;
    const q = parseFloat(qty.replace(",", "."));
    if (Number.isNaN(q) || q <= 0) return;
    setProcessing(true);
    try {
      const { error: rpcError } = await dockerCoreClient.rpc(
        "apply_stock_movement",
        {
          p_restaurant_id: restaurantId,
          p_action: "IN",
          p_ingredient_id: result.ingredient_id,
          p_location_id: locationId,
          p_qty: q,
          p_reason: "Scan barcode (Staff App)",
          p_target_location_id: null,
        },
      );
      if (rpcError) throw new Error(rpcError.message);
      const newCount = counter + 1;
      setCounter(newCount);
      setHistory((prev) => [
        {
          name: result.name ?? "?",
          qty: q,
          time: new Date().toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...prev.slice(0, 19),
      ]);
      setMessage(
        `✅ +${q} ${result.unit || ""} de ${
          result.name
        } registado (${newCount} movimentos)`,
      );
      setBarcode("");
      setResult(null);
      setQty("1");
    } catch (err) {
      setMessage(
        err instanceof Error ? `❌ ${err.message}` : "❌ Erro ao registar.",
      );
    } finally {
      setProcessing(false);
    }
  }, [result, locationId, qty, restaurantId, counter]);

  const handleAssociate = useCallback(async () => {
    const code = barcode.trim();
    if (!code || !associateIngredientId) return;
    setProcessing(true);
    try {
      const ok = await associateBarcode(associateIngredientId, code);
      if (ok) {
        const ing = ingredients.find((i) => i.id === associateIngredientId);
        setMessage(
          `✅ Barcode "${code}" associado a "${ing?.name || "ingrediente"}"`,
        );
        setAssociateIngredientId("");
        setBarcode("");
        setResult(null);
        await loadData();
      } else {
        setMessage("❌ Erro ao associar barcode.");
      }
    } catch {
      setMessage("❌ Erro ao associar barcode.");
    } finally {
      setProcessing(false);
    }
  }, [barcode, associateIngredientId, ingredients, loadData]);

  // ─── Render ───

  if (!restaurantId) {
    return (
      <div
        style={{ ...pageStyle, justifyContent: "center", alignItems: "center" }}
      >
        <p style={{ color: colors.text.secondary, fontSize: 14 }}>
          Nenhum restaurante ativo.
        </p>
      </div>
    );
  }

  const hasPrereqs = locations.length > 0 && ingredients.length > 0;

  return (
    <div style={pageStyle}>
      {/* ── Header with counter ── */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>📷</span>
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: colors.text.primary,
              }}
            >
              Scanner de Inventário
            </h1>
            <p
              style={{ fontSize: 12, color: colors.text.secondary, margin: 0 }}
            >
              {loading
                ? "A carregar..."
                : `${ingredients.length} ingredientes · ${locations.length} locais`}
            </p>
          </div>
        </div>
        {counter > 0 && (
          <Badge
            status="success"
            variant="solid"
            label={`${counter} mov.`}
            size="sm"
          />
        )}
      </div>

      {!hasPrereqs && !loading ? (
        <div style={emptyStyle}>
          <span style={{ fontSize: 48, marginBottom: 12 }}>📦</span>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: colors.text.primary,
            }}
          >
            Configure ingredientes e locais primeiro
          </p>
          <p
            style={{
              fontSize: 13,
              color: colors.text.secondary,
              textAlign: "center",
            }}
          >
            Vá a Gestão → Inventário para criar ingredientes e locais.
          </p>
        </div>
      ) : (
        <div style={contentStyle}>
          {/* ── Scan Mode Toggle ── */}
          <div style={cardStyle}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setScanMode("camera")}
                style={{
                  ...btnStyle,
                  flex: 1,
                  backgroundColor:
                    scanMode === "camera" ? "#3b82f6" : colors.surface.layer2,
                  color: scanMode === "camera" ? "#fff" : colors.text.primary,
                  fontWeight: 600,
                }}
              >
                📷 Câmera
              </button>
              <button
                type="button"
                onClick={() => setScanMode("manual")}
                style={{
                  ...btnStyle,
                  flex: 1,
                  backgroundColor:
                    scanMode === "manual" ? "#3b82f6" : colors.surface.layer2,
                  color: scanMode === "manual" ? "#fff" : colors.text.primary,
                  fontWeight: 600,
                }}
              >
                ⌨️ Manual
              </button>
            </div>

            {/* Location selector */}
            <div>
              <label
                htmlFor="scan-location"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.text.tertiary,
                }}
              >
                Local de entrada
              </label>
              <select
                id="scan-location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.kind})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Camera View ── */}
          {scanMode === "camera" && (
            <div style={cardStyle}>
              {cameraError ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: colors.text.secondary,
                  }}
                >
                  <p style={{ fontSize: 14, margin: "0 0 8px" }}>
                    ❌ {cameraError}
                  </p>
                  {cameraHint ? (
                    <p
                      style={{
                        fontSize: 12,
                        margin: "0 0 12px",
                        color: colors.text.secondary,
                      }}
                    >
                      {cameraHint}
                    </p>
                  ) : null}

                  {/* Debug info - visible when error */}
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      backgroundColor: colors.surface.layer2,
                      borderRadius: 6,
                      fontSize: 11,
                      textAlign: "left",
                      color: colors.text.tertiary,
                      fontFamily: "monospace",
                    }}
                  >
                    <p style={{ margin: "0 0 4px" }}>
                      📱 Browser:{" "}
                      {typeof window !== "undefined" ? "Disponível" : "N/A"}
                    </p>
                    <p style={{ margin: "0 0 4px" }}>
                      📷 getUserMedia: {navigator.mediaDevices ? "Sim" : "Não"}
                    </p>
                    <p style={{ margin: "0 0 4px" }}>
                      🔍 BarcodeDetector:{" "}
                      {"BarcodeDetector" in window ? "Sim" : "Não"}
                    </p>
                    <p style={{ margin: 0 }}>
                      🔐 HTTPS:{" "}
                      {window.location.protocol === "https:"
                        ? "Sim"
                        : "Não (localhost OK)"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setScanMode("manual")}
                    style={{
                      ...btnStyle,
                      backgroundColor: colors.surface.layer2,
                      color: colors.text.primary,
                      margin: "0 auto",
                      marginBottom: 8,
                    }}
                  >
                    Usar modo manual
                  </button>
                  <button
                    type="button"
                    onClick={() => retryCamera()}
                    style={{
                      ...btnStyle,
                      backgroundColor: colors.surface.layer2,
                      color: colors.text.primary,
                      margin: "0 auto",
                      display: "block",
                      fontSize: 12,
                    }}
                  >
                    🔄 Tentar novamente
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 8,
                      backgroundColor: "#000",
                      display: "block",
                      objectFit: "cover",
                    }}
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  {cameraActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        padding: "6px 10px",
                        borderRadius: 6,
                        backgroundColor: "rgba(34, 197, 94, 0.9)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      🎥 A escanear...
                    </div>
                  )}
                  {barcode && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        right: 12,
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {barcode}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Manual Input ── */}
          {scanMode === "manual" && (
            <div style={cardStyle}>
              <label
                htmlFor="scan-barcode"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.text.secondary,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                }}
              >
                Código de barras
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  id="scan-barcode"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLookup();
                    }
                  }}
                  placeholder="Digite o código de barras..."
                  autoFocus
                  autoComplete="off"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => handleLookup()}
                  disabled={processing || !barcode.trim()}
                  style={{
                    ...btnStyle,
                    backgroundColor: processing
                      ? colors.surface.layer2
                      : "#3b82f6",
                    color: "#fff",
                    opacity: processing || !barcode.trim() ? 0.5 : 1,
                  }}
                >
                  {processing ? "..." : "🔍"}
                </button>
              </div>
            </div>
          )}

          {/* ── Status message ── */}
          {message && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                backgroundColor: message.startsWith("✅")
                  ? "rgba(34, 197, 94, 0.10)"
                  : message.startsWith("❌")
                  ? "rgba(239, 68, 68, 0.10)"
                  : "rgba(245, 158, 11, 0.10)",
                fontSize: 14,
                color: colors.text.primary,
                fontWeight: 500,
              }}
            >
              {message}
            </div>
          )}

          {/* ── Found — Quick IN movement ── */}
          {result?.found && (
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      margin: 0,
                      color: colors.text.primary,
                    }}
                  >
                    {result.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: colors.text.secondary,
                      margin: 0,
                    }}
                  >
                    {result.unit}
                    {result.category ? ` · ${result.category}` : ""}
                    {(result.cost_per_unit ?? 0) > 0
                      ? ` · €${(result.cost_per_unit ?? 0).toFixed(2)}`
                      : ""}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="scan-qty"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.text.tertiary,
                    }}
                  >
                    Quantidade
                  </label>
                  <input
                    id="scan-qty"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    style={{ ...inputStyle, marginTop: 4 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickEntry}
                  disabled={processing || !locationId || !qty}
                  style={{
                    ...btnStyle,
                    backgroundColor: "#22c55e",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "10px 18px",
                    opacity: processing || !locationId || !qty ? 0.5 : 1,
                  }}
                >
                  📥 Entrada
                </button>
              </div>
            </div>
          )}

          {/* ── Not found — Associate barcode ── */}
          {result && !result.found && (
            <div style={cardStyle}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  margin: "0 0 6px",
                  color: colors.text.primary,
                }}
              >
                Barcode não associado
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: colors.text.secondary,
                  margin: "0 0 10px",
                }}
              >
                Selecione um ingrediente para associar este código.
              </p>
              <select
                title="Selecione ingrediente"
                value={associateIngredientId}
                onChange={(e) => setAssociateIngredientId(e.target.value)}
                style={{ ...inputStyle, marginBottom: 8 }}
              >
                <option value="">Selecione ingrediente...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssociate}
                disabled={processing || !associateIngredientId}
                style={{
                  ...btnStyle,
                  backgroundColor: "#f59e0b",
                  color: "#000",
                  fontWeight: 700,
                  width: "100%",
                  opacity: processing || !associateIngredientId ? 0.5 : 1,
                }}
              >
                🔖 Associar barcode
              </button>
            </div>
          )}

          {/* ── Session history ── */}
          {history.length > 0 && (
            <div style={cardStyle}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.text.tertiary,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  margin: "0 0 8px",
                }}
              >
                Histórico da sessão
              </p>
              {history.map((h, i) => (
                <div
                  key={`${h.time}-${h.name}-${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom:
                      i < history.length - 1
                        ? `1px solid ${colors.border.subtle}`
                        : "none",
                  }}
                >
                  <span style={{ fontSize: 13, color: colors.text.primary }}>
                    +{h.qty} {h.name}
                  </span>
                  <span style={{ fontSize: 11, color: colors.text.tertiary }}>
                    {h.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───

const pageStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  backgroundColor: colors.surface.base,
  overflow: "auto",
  paddingBottom: 80, // space for bottom nav
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 16px 12px",
  borderBottom: `1px solid ${colors.border.subtle}`,
  backgroundColor: colors.surface.layer1,
  flexShrink: 0,
};

const contentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  padding: 32,
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: colors.surface.layer1,
  border: `1px solid ${colors.border.subtle}`,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${colors.border.subtle}`,
  backgroundColor: colors.surface.layer2,
  color: colors.text.primary,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
};

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 16,
  flexShrink: 0,
};
