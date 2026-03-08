/**
 * MenuAvailability — Indicadores de disponibilidade em tempo real
 *
 * Mostra:
 * - Badge "Esgotado" para produtos indisponíveis
 * - Horários especiais (ex: "Disponível após 19h")
 * - Filtro para mostrar apenas disponíveis
 * - Opção de "Me avise" quando voltar
 */

export interface AvailabilityStatus {
  isAvailable: boolean;
  reason?: string; // "out_of_stock", "not_yet_available", "sold_out"
  availableAt?: string; // ISO date string
  willBeAvailableAt?: string; // "HH:MM" format
}

import { getFormatLocale } from "../../../core/i18n/regionLocaleConfig";

export interface MenuAvailabilityProps {
  status: AvailabilityStatus;
  displaySize?: "compact" | "full";
  onNotifyClick?: () => void;
}

function formatTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(getFormatLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function MenuAvailability({
  status,
  displaySize = "compact",
  onNotifyClick,
}: MenuAvailabilityProps) {
  if (status.isAvailable) {
    return null;
  }

  if (displaySize === "compact") {
    return (
      <div className="absolute top-2 right-2 flex gap-2">
        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          <span>⚠️</span>
          <span>Esgotado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
      <div className="flex items-start gap-2">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-bold text-red-900 text-sm">
            {status.reason === "out_of_stock"
              ? "Produto esgotado"
              : status.reason === "not_yet_available"
              ? "Ainda não disponível"
              : "Temporariamente indisponível"}
          </h3>

          {status.willBeAvailableAt && (
            <p className="text-sm text-red-700 mt-1">
              Disponível a partir das{" "}
              <strong>{status.willBeAvailableAt}</strong>
            </p>
          )}

          {status.availableAt && (
            <p className="text-xs text-red-600 mt-1 opacity-75">
              Volta {formatTime(status.availableAt)}
            </p>
          )}

          {onNotifyClick && (
            <button
              onClick={onNotifyClick}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-700 underline"
            >
              🔔 Me avise quando voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MenuAvailabilityFilter() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-l-4 border-blue-500">
      <input
        type="checkbox"
        id="show-available-only"
        defaultChecked={false}
        className="w-4 h-4 text-blue-600 rounded"
      />
      <label
        htmlFor="show-available-only"
        className="text-sm font-medium text-blue-900 cursor-pointer flex-1"
      >
        Mostrar apenas produtos disponíveis
      </label>
    </div>
  );
}

export function DisabledProductOverlay() {
  return (
    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-white text-xs font-bold mt-1">Indisponível</p>
      </div>
    </div>
  );
}
