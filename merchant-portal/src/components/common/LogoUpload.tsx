/**
 * LogoUpload — Reusable restaurant logo upload component.
 *
 * Features:
 * - File input accepting PNG, JPG, SVG, WebP (max 2MB)
 * - Circular preview with RestaurantLogo fallback
 * - Converts uploaded files to base64 data URL
 * - "Remove logo" button
 * - Dark theme (neutral-900 bg, amber accents)
 * - Optional URL input fallback (collapsible)
 */

import { useCallback, useRef, useState } from "react";
import { RestaurantLogo } from "../../ui/RestaurantLogo";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max file size for logo upload (2MB). */
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.svg,.webp";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogoUploadProps {
  /** Current logo URL (can be a data URL or external URL). */
  logoUrl: string | null | undefined;
  /** Restaurant name — used for fallback circle letter. */
  name: string;
  /** Called when the logo changes (new data URL or empty string for removal). */
  onChange: (dataUrl: string) => void;
  /** Preview size in px. Default 72. */
  size?: number;
  /** Whether the component is disabled. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LogoUpload({
  logoUrl,
  name,
  onChange,
  size = 72,
  disabled = false,
}: LogoUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError("Formato invalido. Use PNG, JPG, SVG ou WebP.");
        return;
      }
      if (file.size > MAX_LOGO_SIZE) {
        setError(
          `Ficheiro demasiado grande (max ${Math.round(MAX_LOGO_SIZE / (1024 * 1024))}MB).`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
      };
      reader.onerror = () => setError("Erro ao ler o ficheiro.");
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const handleRemove = useCallback(() => {
    onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onChange]);

  const hasLogo = !!logoUrl && logoUrl.trim().length > 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 12,
        borderRadius: 10,
        border: "1px dashed rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Circular preview */}
      <RestaurantLogo
        logoUrl={logoUrl ?? null}
        name={name || "R"}
        size={size}
        style={{
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={disabled}
        />

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "transparent",
              fontSize: 12,
              fontWeight: 600,
              cursor: disabled ? "not-allowed" : "pointer",
              color: "#f5f5f5",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {hasLogo ? "Alterar imagem" : "Carregar imagem"}
          </button>
          {hasLogo && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.3)",
                backgroundColor: "transparent",
                fontSize: 12,
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                color: "#ef4444",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              Remover
            </button>
          )}
        </div>

        {/* File constraints hint */}
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          PNG, JPG, SVG ou WebP. Max 2MB.
        </span>

        {/* URL input fallback (collapsible) */}
        <details style={{ marginTop: 2 }}>
          <summary
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            Ou colar URL da imagem
          </summary>
          <input
            type="url"
            value={
              logoUrl && !logoUrl.startsWith("data:") ? logoUrl : ""
            }
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... (URL da imagem)"
            disabled={disabled}
            style={{
              width: "100%",
              padding: "6px 10px",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              fontSize: 11,
              marginTop: 4,
              backgroundColor: "transparent",
              color: "#f5f5f5",
            }}
          />
        </details>

        {/* Error message */}
        {error && (
          <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 500 }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
