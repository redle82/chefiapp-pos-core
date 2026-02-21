// @ts-nocheck
import type { CierreTemporal } from "../types";
import { ClosureRow } from "./ClosureRow";

interface ClosuresListProps {
  closures: CierreTemporal[];
  loading?: boolean;
  onNewClosure: () => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ClosuresList({
  closures,
  loading,
  onNewClosure,
  onEdit,
  onDuplicate,
  onCancel,
}: ClosuresListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Cierres temporales
        </h2>
        <button
          type="button"
          onClick={onNewClosure}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          + Novo cierre temporal
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-fixed">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="py-3 pl-4 pr-2">Tipo</th>
              <th className="py-3 px-2">Período</th>
              <th className="py-3 px-2">Escopo</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 pr-4 pl-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                  A carregar...
                </td>
              </tr>
            ) : closures.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                  Nenhum fechamento.
                </td>
              </tr>
            ) : (
              closures.map((c) => (
                <ClosureRow
                  key={c.id}
                  closure={c}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onCancel={onCancel}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
