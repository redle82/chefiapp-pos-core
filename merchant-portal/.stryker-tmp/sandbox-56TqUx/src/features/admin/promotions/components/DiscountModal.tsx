// @ts-nocheck
import { useEffect, useState } from "react";
import type { Discount, DiscountType, NewDiscountInput } from "../types";

interface DiscountModalProps {
  open: boolean;
  initial?: Discount | null;
  onClose: () => void;
  onSave: (input: NewDiscountInput) => Promise<void>;
}

const TYPES: DiscountType[] = ["PERCENTAGE", "FIXED"];

export function DiscountModal({
  open,
  initial,
  onClose,
  onSave,
}: DiscountModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState<string>("0");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setDescription(initial.description ?? "");
      setType(initial.type);
      setValue(String(initial.value));
      setActive(initial.active);
    } else {
      setName("");
      setDescription("");
      setType("PERCENTAGE");
      setValue("0");
      setActive(true);
    }
    setError(null);
    setSubmitting(false);
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || numericValue < 0) {
      setError("Informe um valor válido para o desconto.");
      return;
    }
    if (type === "PERCENTAGE" && numericValue > 100) {
      setError("Descontos percentuais não podem ser superiores a 100%.");
      return;
    }
    if (!name.trim()) {
      setError("O nome do desconto é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        id: initial?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        value: numericValue,
        active,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao guardar o desconto."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
          <h2
            id="discount-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            {initial ? "Editar desconto" : "Novo desconto"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="discount-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nome
            </label>
            <input
              id="discount-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="discount-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Descrição
            </label>
            <textarea
              id="discount-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Ex.: 10% em pedidos online acima de 30 €"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="discount-type"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Tipo
              </label>
              <select
                id="discount-type"
                value={type}
                onChange={(e) => setType(e.target.value as DiscountType)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "PERCENTAGE" ? "Percentual (%)" : "Valor fixo (€)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="discount-value"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Valor
              </label>
              <input
                id="discount-value"
                type="number"
                min={0}
                step={type === "PERCENTAGE" ? 0.1 : 0.01}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              Ativo
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

