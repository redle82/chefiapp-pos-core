// @ts-nocheck
import type { Customer } from "../types";
import { CustomerRow } from "./CustomerRow";

interface CustomersTableProps {
  customers: Customer[];
  loading?: boolean;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function CustomersTable({
  customers,
  loading,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
}: CustomersTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Clientes
        </h2>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nome, ID, e-mail, fonte..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            aria-label="Filtrar clientes"
          />
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              aria-label="Itens por página"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / página
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] table-fixed">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="py-3 pl-4 pr-2">Nome</th>
              <th className="py-3 px-2">Fuente</th>
              <th className="py-3 px-2">Última conta</th>
              <th className="py-3 px-2">Gasto total</th>
              <th className="py-3 px-2">Gasto médio</th>
              <th className="py-3 pr-4 pl-2">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  A carregar...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <CustomerRow key={c.id} customer={c} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-4">
          <div className="text-sm text-gray-600">
            {total} cliente{total !== 1 ? "s" : ""} no total
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              aria-label="Página anterior"
            >
              &lt;
            </button>
            <span className="flex items-center gap-1 px-2 text-sm text-gray-700">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`min-w-[2rem] rounded py-1 text-sm font-medium ${
                      p === page
                        ? "bg-violet-100 text-violet-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 7 && (
                <>
                  <span className="text-gray-400">…</span>
                  <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    className={`min-w-[2rem] rounded py-1 text-sm font-medium ${
                      page === totalPages
                        ? "bg-violet-100 text-violet-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              aria-label="Próxima página"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
