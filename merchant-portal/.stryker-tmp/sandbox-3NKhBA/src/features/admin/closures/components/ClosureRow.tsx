// @ts-nocheck
import type { CierreTemporal, CierreType } from "../types";
import { CIERRE_TYPE_LABELS, CIERRE_STATUS_LABELS } from "../types";

const DATE_FORMAT = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function scopeLabels(scope: CierreTemporal["scope"]): string[] {
  const out: string[] = [];
  if (scope.reservations) out.push("Reservas");
  if (scope.pos) out.push("TPV");
  if (scope.delivery) out.push("Delivery");
  if (scope.qr) out.push("QR");
  return out.length ? out : ["—"];
}

const TYPE_BADGE_CLASS: Record<CierreType, string> = {
  TOTAL: "bg-red-100 text-red-800",
  PARCIAL: "bg-amber-100 text-amber-800",
  OPERACIONAL: "bg-purple-100 text-purple-800",
  TECNICO: "bg-blue-100 text-blue-800",
  EMERGENCIA: "bg-orange-100 text-orange-800",
};

const STATUS_CLASS: Record<CierreTemporal["status"], string> = {
  ACTIVE: "text-green-600 font-medium",
  SCHEDULED: "text-gray-600",
  EXPIRED: "text-gray-400",
};

interface ClosureRowProps {
  closure: CierreTemporal;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ClosureRow({
  closure,
  onEdit,
  onDuplicate,
  onCancel,
}: ClosureRowProps) {
  const start = DATE_FORMAT.format(new Date(closure.startAt));
  const end = DATE_FORMAT.format(new Date(closure.endAt));
  const scopeText = scopeLabels(closure.scope).join(", ");

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="py-3 pl-4 pr-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_CLASS[closure.type]}`}
        >
          {CIERRE_TYPE_LABELS[closure.type]}
        </span>
      </td>
      <td className="py-3 px-2 text-sm text-gray-600">
        {start} — {end}
      </td>
      <td className="py-3 px-2 text-sm text-gray-600">{scopeText}</td>
      <td className={`py-3 px-2 text-sm ${STATUS_CLASS[closure.status]}`}>
        {CIERRE_STATUS_LABELS[closure.status]}
      </td>
      <td className="py-3 pr-4 pl-2">
        <div className="flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(closure.id)}
              className="text-xs font-medium text-violet-600 hover:underline"
            >
              Editar
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(closure.id)}
              className="text-xs font-medium text-gray-600 hover:underline"
            >
              Duplicar
            </button>
          )}
          {onCancel && closure.status !== "EXPIRED" && (
            <button
              type="button"
              onClick={() => onCancel(closure.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Cancelar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
