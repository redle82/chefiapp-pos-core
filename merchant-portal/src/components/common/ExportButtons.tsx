/**
 * ExportButtons — Reusable PDF + Excel + CSV download buttons.
 *
 * Accepts report data and branding; handles loading state during generation.
 * Designed to be dropped into any report/dashboard page.
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  ExportDataset,
  ExportFormat,
  ExportReportOptions,
} from "../../core/export/ExportService";
import { exportReport } from "../../core/export/ExportService";
import type { PDFBranding } from "../../core/export/PDFGenerator";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ExportButtonsProps {
  /** Report title (shown in PDF header) */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Human-readable date range (e.g. "01/03/2026 - 19/03/2026") */
  dateRange?: string;
  /** Base filename without extension */
  filename: string;
  /** Restaurant branding for PDF header */
  branding: PDFBranding;
  /** Data to export */
  datasets: ExportDataset[];
  /** Disable buttons (e.g. when data is empty) */
  disabled?: boolean;
  /** Page orientation for PDF */
  orientation?: "portrait" | "landscape";
  /** Which formats to show. Defaults to all three. */
  formats?: ExportFormat[];
  /** Additional CSS class for the container */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 14px",
  borderRadius: "8px",
  border: "1px solid #404040",
  background: "#262626",
  color: "#d4d4d4",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap" as const,
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.4,
  cursor: "not-allowed",
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ExportButtons({
  title,
  subtitle,
  dateRange,
  filename,
  branding,
  datasets,
  disabled = false,
  orientation,
  formats = ["pdf", "excel", "csv"],
  className,
}: ExportButtonsProps) {
  const { t } = useTranslation("operational");
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (disabled || loadingFormat) return;

      setLoadingFormat(format);
      try {
        const options: ExportReportOptions = {
          title,
          subtitle,
          dateRange,
          filename,
          branding,
          datasets,
          orientation,
        };
        await exportReport(format, options);
      } catch (err) {
        console.error(`[ExportButtons] Export ${format} failed:`, err);
      } finally {
        setLoadingFormat(null);
      }
    },
    [
      disabled,
      loadingFormat,
      title,
      subtitle,
      dateRange,
      filename,
      branding,
      datasets,
      orientation,
    ],
  );

  const isDisabled = disabled || loadingFormat != null;

  const formatConfig: Record<
    ExportFormat,
    { label: string; icon: string }
  > = {
    pdf: { label: "PDF", icon: "\u{1F4C4}" },
    excel: { label: "Excel", icon: "\u{1F4CA}" },
    csv: { label: "CSV", icon: "\u{1F4CB}" },
  };

  return (
    <div className={className} style={containerStyle}>
      {formats.map((format) => {
        const config = formatConfig[format];
        const isLoading = loadingFormat === format;

        return (
          <button
            key={format}
            type="button"
            onClick={() => handleExport(format)}
            disabled={isDisabled}
            style={{
              ...btnBase,
              ...(isDisabled ? btnDisabled : {}),
            }}
            title={
              isLoading
                ? t("export.generating", { defaultValue: "Generating..." })
                : t("export.downloadAs", {
                    format: config.label,
                    defaultValue: `Download as ${config.label}`,
                  })
            }
          >
            <span>{config.icon}</span>
            <span>
              {isLoading
                ? t("export.generating", { defaultValue: "Generating..." })
                : config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
