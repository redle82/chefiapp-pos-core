/**
 * ReceiptHistoryPage — Admin page for browsing, searching and reprinting receipts.
 *
 * Lists all receipts from gm_receipt_log with filters (date range, payment method,
 * order ID search). Click a row to expand the full receipt details (items, VAT breakdown).
 * Reprint button triggers the ESC/POS print service.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExportButtons } from "../../../../components/common/ExportButtons";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { centsToDecimalStr } from "../../../../core/export/ExportService";
import { useExportBranding } from "../../../../core/export/useExportBranding";
import { useFormatLocale } from "../../../../core/i18n/useFormatLocale";
import { usePrinter } from "../../../../core/printing/usePrinter";
import {
  listReceipts,
  markReceiptPrinted,
} from "../../../../core/receipt/ReceiptHistoryService";
import type {
  ListReceiptsFilters,
  ReceiptLogRow,
} from "../../../../core/receipt/ReceiptHistoryService";
import { mapReceiptForPrint } from "../../../../pages/TPVMinimal/types/ReceiptData";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCents(cents: number, locale: string): string {
  return (cents / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentLabel(method: string): string {
  switch (method) {
    case "cash":
      return "Dinheiro";
    case "card":
      return "Cartao";
    case "pix":
      return "MB Way";
    default:
      return method;
  }
}

function tableOrMode(receipt: ReceiptLogRow["receipt_data"]): string {
  if (receipt.table) return `Mesa ${receipt.table}`;
  if (receipt.orderMode === "take_away") return "Take-away";
  if (receipt.orderMode === "delivery") return "Delivery";
  return "Balcao";
}

/* ------------------------------------------------------------------ */
/*  Filters Bar                                                        */
/* ------------------------------------------------------------------ */

interface FiltersBarProps {
  filters: ListReceiptsFilters;
  onChange: (f: ListReceiptsFilters) => void;
  loading: boolean;
}

function FiltersBar({ filters, onChange, loading }: FiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.orderIdSearch ?? "");

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onChange({ ...filters, orderIdSearch: localSearch || undefined, offset: 0 });
    },
    [filters, localSearch, onChange],
  );

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="flex flex-wrap items-end gap-3"
    >
      {/* Date from */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-400">De</label>
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) =>
            onChange({ ...filters, dateFrom: e.target.value || undefined, offset: 0 })
          }
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-400">Ate</label>
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) =>
            onChange({ ...filters, dateTo: e.target.value || undefined, offset: 0 })
          }
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        />
      </div>

      {/* Payment method */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-400">
          Pagamento
        </label>
        <select
          value={filters.paymentMethod ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              paymentMethod: e.target.value || undefined,
              offset: 0,
            })
          }
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        >
          <option value="">Todos</option>
          <option value="cash">Dinheiro</option>
          <option value="card">Cartao</option>
          <option value="pix">MB Way</option>
        </select>
      </div>

      {/* Order ID search */}
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-xs font-medium text-neutral-400">
          Pedido
        </label>
        <input
          type="search"
          placeholder="Buscar por ID do pedido..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "A carregar..." : "Filtrar"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded Row Detail                                                */
/* ------------------------------------------------------------------ */

interface ReceiptDetailProps {
  row: ReceiptLogRow;
  locale: string;
  onReprint: (row: ReceiptLogRow) => void;
  reprinting: boolean;
}

function ReceiptDetail({ row, locale, onReprint, reprinting }: ReceiptDetailProps) {
  const r = row.receipt_data;

  return (
    <tr>
      <td colSpan={8} className="px-4 py-4 bg-neutral-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-200 mb-2">
              Itens
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-neutral-500">
                  <th className="text-left pb-1">Item</th>
                  <th className="text-right pb-1">Qtd</th>
                  <th className="text-right pb-1">Unit.</th>
                  <th className="text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {r.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-0.5">
                      {item.name}
                      {item.modifiers?.map((m, mi) => (
                        <span
                          key={mi}
                          className="block text-neutral-500 pl-2 text-[11px]"
                        >
                          + {m.name}{" "}
                          {m.priceDeltaCents > 0 &&
                            `(+${formatCents(m.priceDeltaCents, locale)})`}
                        </span>
                      ))}
                    </td>
                    <td className="text-right py-0.5">{item.quantity}</td>
                    <td className="text-right py-0.5">
                      {formatCents(item.unit_price, locale)}
                    </td>
                    <td className="text-right py-0.5">
                      {formatCents(item.line_total, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VAT + Totals */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-200 mb-2">
              Resumo fiscal
            </h4>
            <div className="space-y-1 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCents(r.subtotalCents, locale)}</span>
              </div>
              {r.discountCents > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>
                    Desconto{r.discountReason ? ` (${r.discountReason})` : ""}
                  </span>
                  <span>-{formatCents(r.discountCents, locale)}</span>
                </div>
              )}

              {/* VAT breakdown */}
              {r.taxBreakdown.length > 0 && (
                <div className="border-t border-neutral-700 pt-1 mt-1">
                  <span className="text-neutral-500 text-[11px]">IVA:</span>
                  {r.taxBreakdown.map((tax, ti) => (
                    <div key={ti} className="flex justify-between pl-2">
                      <span>
                        {tax.rateLabel} (base:{" "}
                        {formatCents(tax.baseAmount, locale)})
                      </span>
                      <span>{formatCents(tax.taxAmount, locale)}</span>
                    </div>
                  ))}
                </div>
              )}

              {r.tipCents > 0 && (
                <div className="flex justify-between">
                  <span>Gorjeta</span>
                  <span>{formatCents(r.tipCents, locale)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-neutral-100 border-t border-neutral-700 pt-1 mt-1">
                <span>Total</span>
                <span>{formatCents(r.grandTotalCents, locale)}</span>
              </div>
            </div>

            {/* Fiscal info */}
            {r.fiscal && (
              <div className="mt-3 text-[11px] text-neutral-500 space-y-0.5">
                <div>Doc: {r.fiscal.documentNumber}</div>
                <div>ATCUD: {r.fiscal.atcud}</div>
                <div>Hash: {r.fiscal.hashControl}</div>
              </div>
            )}

            {/* Reprint button */}
            <button
              type="button"
              onClick={() => onReprint(row)}
              disabled={reprinting}
              className="mt-4 rounded-lg bg-neutral-700 px-4 py-2 text-xs font-medium text-neutral-100 hover:bg-neutral-600 disabled:opacity-50 transition-colors"
            >
              {reprinting ? "A imprimir..." : "Reimprimir recibo"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 50;

export function ReceiptHistoryPage() {
  const locale = useFormatLocale();
  const { runtime } = useRestaurantRuntime();
  const branding = useExportBranding();
  const printer = usePrinter();

  const [rows, setRows] = useState<ReceiptLogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ListReceiptsFilters>({
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reprinting, setReprinting] = useState(false);

  const load = useCallback(
    async (appliedFilters: ListReceiptsFilters) => {
      if (!runtime.restaurant_id) return;
      setLoading(true);
      try {
        const result = await listReceipts(
          runtime.restaurant_id,
          appliedFilters,
        );
        setRows(result.rows);
        setTotalCount(result.totalCount);
      } finally {
        setLoading(false);
      }
    },
    [runtime.restaurant_id],
  );

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const handleFiltersChange = useCallback((f: ListReceiptsFilters) => {
    setFilters(f);
  }, []);

  const toggleRow = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleReprint = useCallback(
    async (row: ReceiptLogRow) => {
      if (!printer.isConnected) {
        try {
          await printer.connect();
        } catch {
          return;
        }
      }

      setReprinting(true);
      try {
        const { order, restaurant, paymentMethodLabel, options } =
          mapReceiptForPrint(row.receipt_data);
        await printer.printReceipt(order, restaurant, paymentMethodLabel);
        // Suppress unused variable — options used only when PrintService supports it
        void options;
        await markReceiptPrinted(row.id);
        // Refresh to show updated printed_at
        await load(filters);
      } catch {
        // Error displayed via printer.lastError
      } finally {
        setReprinting(false);
      }
    },
    [printer, load, filters],
  );

  // Pagination
  const currentPage = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const goToPage = useCallback(
    (page: number) => {
      setFilters((prev) => ({
        ...prev,
        offset: (page - 1) * PAGE_SIZE,
      }));
    },
    [],
  );

  // Empty state
  const isEmpty = rows.length === 0 && !loading;

  return (
    <section className="page-enter admin-content-page flex flex-col gap-6">
      <AdminPageHeader
        title="Historico de recibos"
        subtitle="Consulte, pesquise e reimprima recibos emitidos pelo sistema."
        actions={
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {printer.isConnected ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                {printer.deviceName ?? "Impressora"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => printer.connect()}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Ligar impressora
              </button>
            )}
          </div>
        }
      />

      {/* Printer error */}
      {printer.lastError && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-2 text-xs text-red-300">
          {printer.lastError}
        </div>
      )}

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        loading={loading}
      />

      {/* Export */}
      {rows.length > 0 && (
        <ExportButtons
          title="Historico de recibos"
          subtitle="Recibos emitidos pelo sistema"
          dateRange={
            filters.dateFrom || filters.dateTo
              ? `${filters.dateFrom ?? "..."} - ${filters.dateTo ?? "..."}`
              : undefined
          }
          filename={`recibos-${new Date().toISOString().slice(0, 10)}`}
          branding={branding}
          formats={["pdf", "excel", "csv"]}
          orientation="landscape"
          datasets={[
            {
              name: "Recibos",
              columns: [
                { header: "Data/Hora" },
                { header: "Pedido" },
                { header: "Mesa/Modo" },
                { header: "Itens", align: "right", format: "number" },
                { header: "Total", align: "right", format: "currency" },
                { header: "Pagamento" },
                { header: "Impresso" },
              ],
              rows: rows.map((row) => [
                formatDateTime(row.created_at, locale),
                row.receipt_data.orderIdShort,
                tableOrMode(row.receipt_data),
                row.receipt_data.items.length,
                centsToDecimalStr(row.receipt_data.grandTotalCents),
                paymentLabel(row.receipt_data.paymentMethod),
                row.printed_at ? "Sim" : "Nao",
              ]),
            },
          ]}
        />
      )}

      {/* No restaurant selected */}
      {!runtime.restaurant_id && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-12 text-center text-neutral-500">
          Selecione um restaurante para ver os recibos.
        </div>
      )}

      {/* Empty state */}
      {isEmpty && runtime.restaurant_id && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-12 text-center text-neutral-500">
          Nenhum recibo encontrado para os filtros selecionados.
        </div>
      )}

      {/* Table */}
      {(rows.length > 0 || loading) && (
        <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900">
          <table className="min-w-full divide-y divide-neutral-800 text-sm">
            <thead className="bg-neutral-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell">
                  Mesa/Modo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">
                  Itens
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider hidden lg:table-cell">
                  Pagamento
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">
                  Impresso
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-neutral-500"
                  >
                    A carregar recibos...
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const r = row.receipt_data;
                const isExpanded = expandedId === row.id;

                return (
                  <ReceiptRow
                    key={row.id}
                    row={row}
                    locale={locale}
                    isExpanded={isExpanded}
                    onToggle={() => toggleRow(row.id)}
                    onReprint={handleReprint}
                    reprinting={reprinting && expandedId === row.id}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>
            {totalCount} recibo{totalCount !== 1 ? "s" : ""} encontrado
            {totalCount !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="rounded px-2 py-1 hover:bg-neutral-800 disabled:opacity-30 transition-colors"
            >
              Anterior
            </button>
            <span className="px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="rounded px-2 py-1 hover:bg-neutral-800 disabled:opacity-30 transition-colors"
            >
              Seguinte
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Row (extracted for expand/collapse)                          */
/* ------------------------------------------------------------------ */

interface ReceiptRowProps {
  row: ReceiptLogRow;
  locale: string;
  isExpanded: boolean;
  onToggle: () => void;
  onReprint: (row: ReceiptLogRow) => void;
  reprinting: boolean;
}

function ReceiptRow({
  row,
  locale,
  isExpanded,
  onToggle,
  onReprint,
  reprinting,
}: ReceiptRowProps) {
  const r = row.receipt_data;

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-neutral-800/40 transition-colors"
      >
        <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">
          {formatDateTime(row.created_at, locale)}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-amber-400">
          {r.orderIdShort}
        </td>
        <td className="px-4 py-3 text-neutral-400 hidden sm:table-cell">
          {tableOrMode(r)}
        </td>
        <td className="px-4 py-3 text-right text-neutral-400 hidden md:table-cell">
          {r.items.length}
        </td>
        <td className="px-4 py-3 text-right font-medium text-neutral-100">
          {formatCents(r.grandTotalCents, locale)}
        </td>
        <td className="px-4 py-3 text-neutral-400 hidden lg:table-cell">
          {paymentLabel(r.paymentMethod)}
        </td>
        <td className="px-4 py-3 text-center hidden md:table-cell">
          {row.printed_at ? (
            <span className="inline-flex items-center gap-1 text-green-500 text-xs">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              Sim
            </span>
          ) : (
            <span className="text-neutral-600 text-xs">Nao</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReprint(row);
            }}
            disabled={reprinting}
            className="rounded bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-amber-400 disabled:opacity-50 transition-colors"
            title="Reimprimir"
          >
            Reimprimir
          </button>
        </td>
      </tr>
      {isExpanded && (
        <ReceiptDetail
          row={row}
          locale={locale}
          onReprint={onReprint}
          reprinting={reprinting}
        />
      )}
    </>
  );
}
