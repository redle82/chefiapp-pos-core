import { useState } from "react";
import type {
  CierreScope,
  CierreTemporal,
  CierreType,
} from "../types";
import { CIERRE_TYPE_LABELS } from "../types";

const TYPES: CierreType[] = [
  "TOTAL",
  "PARCIAL",
  "OPERACIONAL",
  "TECNICO",
  "EMERGENCIA",
];

const defaultScope: CierreScope = {
  reservations: false,
  pos: false,
  delivery: false,
  qr: false,
};

interface CreateClosureModalProps {
  locationId: string;
  onClose: () => void;
  onCreated: (closure: CierreTemporal) => void;
  createClosure: (input: {
    type: CierreType;
    scope: CierreScope;
    startAt: string;
    endAt: string;
    locationId: string;
    reason?: string;
    notifyClients?: boolean;
  }) => Promise<CierreTemporal>;
}

export function CreateClosureModal({
  locationId,
  onClose,
  onCreated,
  createClosure,
}: CreateClosureModalProps) {
  const [type, setType] = useState<CierreType>("TOTAL");
  const [scope, setScope] = useState<CierreScope>({ ...defaultScope });
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [notifyClients, setNotifyClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleScope = (key: keyof CierreScope) => {
    setScope((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const startAt = startDate && startTime ? `${startDate}T${startTime}:00` : "";
    const endAt = endDate && endTime ? `${endDate}T${endTime}:00` : "";
    if (!startAt || !endAt) {
      setError("Indique data e hora de início e fim.");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError("A data/hora de fim deve ser posterior ao início.");
      return;
    }
    setSubmitting(true);
    try {
      const closure = await createClosure({
        type,
        scope,
        startAt,
        endAt,
        locationId,
        reason: reason.trim() || undefined,
        notifyClients,
      });
      onCreated(closure);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cierre.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-closure-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
          <h2
            id="create-closure-title"
            className="text-lg font-semibold text-gray-900"
          >
            Novo cierre temporal
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              htmlFor="closure-type"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Tipo de cierre
            </label>
            <select
              id="closure-type"
              value={type}
              onChange={(e) => setType(e.target.value as CierreType)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {CIERRE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start-date"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Data início
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="start-time"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Hora início
              </label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="end-date"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Data fim
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="end-time"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Hora fim
              </label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                required
              />
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Escopo
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={scope.reservations}
                  onChange={() => toggleScope("reservations")}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                Reservas
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={scope.pos}
                  onChange={() => toggleScope("pos")}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                TPV
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={scope.delivery}
                  onChange={() => toggleScope("delivery")}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                Delivery
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={scope.qr}
                  onChange={() => toggleScope("qr")}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                QR
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="closure-reason"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Observação interna
            </label>
            <textarea
              id="closure-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: Cerrado por Vacaciones"
              rows={2}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifyClients}
                onChange={(e) => setNotifyClients(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              Notificar clientes
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
