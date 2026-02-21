/**
 * ShiftCloseReport — Z-Report / Fecho de Turno
 *
 * Displays the shift close report (Z-Report) when closing a cash register.
 * Uses the close_cash_register_atomic RPC which generates the report atomically.
 *
 * Props:
 *   - cashRegisterId: UUID of the open cash register
 *   - restaurantId: UUID of the restaurant
 *   - onClose: callback after successful close
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { invokeRpc } from "../../core/infra/coreRpc";
import { Logger } from "../../core/logger";

interface PaymentBreakdown {
  method: string;
  count: number;
  total_cents: number;
}

interface TaxBreakdown {
  tax_rate_bps: number;
  tax_rate_pct: number;
  subtotal_cents: number;
  tax_cents: number;
}

interface ZReportData {
  cash_register_id: string;
  restaurant_id: string;
  period_start: string;
  period_end: string;
  opening_balance_cents: number;
  total_orders: number;
  cancelled_orders: number;
  total_gross_cents: number;
  total_net_cents: number;
  total_tax_cents: number;
  total_discount_cents: number;
  avg_ticket_cents: number;
  payment_breakdown: PaymentBreakdown[];
  tax_breakdown: TaxBreakdown[];
  closing_balance_cents: number;
  expected_cash_cents: number;
  declared_cash_cents: number | null;
  difference_cents: number;
  closed_by: string;
  closed_at: string;
}

interface ShiftCloseReportProps {
  cashRegisterId: string;
  restaurantId: string;
  operatorName: string;
  onClose?: () => void;
  onCancel?: () => void;
}

function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatTime(iso: string, locale = "pt-PT"): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string, locale = "pt-PT"): string {
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAYMENT_METHOD_KEYS: Record<string, string> = {
  cash: "paymentMethod.cash",
  card: "paymentMethod.card",
  mbway: "paymentMethod.mbway",
  multibanco: "paymentMethod.multibanco",
  transfer: "paymentMethod.transfer",
};

export function ShiftCloseReport({
  cashRegisterId,
  restaurantId,
  operatorName,
  onClose,
  onCancel,
}: ShiftCloseReportProps) {
  const { t, i18n } = useTranslation("shift");
  const [step, setStep] = useState<"input" | "confirm" | "done">("input");
  const [declaredCents, setDeclaredCents] = useState<string>("");
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ZReportData | null>(null);

  const handleClose = useCallback(async () => {
    setClosing(true);
    setError(null);

    try {
      const declaredValue = declaredCents
        ? Math.round(parseFloat(declaredCents) * 100)
        : null;

      const { data, error: rpcError } = await invokeRpc(
        "close_cash_register_atomic",
        {
          p_cash_register_id: cashRegisterId,
          p_closed_by: operatorName,
          p_declared_closing_cents: declaredValue,
        },
      );

      if (rpcError) {
        Logger.error("SHIFT_CLOSE_FAILED", rpcError, { cashRegisterId });
        const msg = rpcError.message || t("error.closeFailed");
        if (msg.includes("CASH_REGISTER_ALREADY_CLOSED")) {
          setError(t("error.alreadyClosed"));
        } else if (msg.includes("CASH_REGISTER_NOT_FOUND")) {
          setError(t("error.notFound"));
        } else {
          setError(msg);
        }
        return;
      }

      setReport(data as ZReportData);
      setStep("done");
    } catch (err) {
      Logger.error("SHIFT_CLOSE_EXCEPTION", err, { cashRegisterId });
      setError(t("error.unexpected"));
    } finally {
      setClosing(false);
    }
  }, [cashRegisterId, declaredCents, operatorName]);

  // Step 1: Input declared cash amount
  if (step === "input") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {t("close.title")}
        </h2>
        <p className="text-sm text-gray-500 mb-6">{t("close.description")}</p>

        <div className="mb-6">
          <label
            htmlFor="declared-cash"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("close.declaredLabel")}
          </label>
          <input
            id="declared-cash"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={declaredCents}
            onChange={(e) => setDeclaredCents(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-400">
            {t("close.declaredHint")}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("confirm")}
            disabled={closing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {t("close.continue")}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={closing}
              className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {t("close.cancel")}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Confirm close
  if (step === "confirm") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {t("close.confirmTitle")}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {t("close.irreversibleWarning")}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("close.declaredValue")}</span>
            <span className="font-mono font-semibold">
              {declaredCents
                ? `€${parseFloat(declaredCents).toFixed(2)}`
                : t("close.notInformed")}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">{t("close.operator")}</span>
            <span className="font-medium">{operatorName}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={closing}
            className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {closing ? t("close.closing") : t("close.confirmButton")}
          </button>
          <button
            onClick={() => {
              setStep("input");
              setError(null);
            }}
            disabled={closing}
            className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t("close.back")}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Done — Show Z-Report
  if (!report) return null;

  const diff = report.difference_cents;
  const diffColor =
    diff === 0
      ? "text-green-700 bg-green-50"
      : Math.abs(diff) <= 100
      ? "text-yellow-700 bg-yellow-50"
      : "text-red-700 bg-red-50";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("report.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateTime(report.period_start, i18n.language)} →{" "}
          {formatDateTime(report.period_end, i18n.language)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {report.total_orders}
          </div>
          <div className="text-xs text-blue-600">{t("report.orders")}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">
            {formatCents(report.total_gross_cents)}
          </div>
          <div className="text-xs text-green-600">{t("report.grossTotal")}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {formatCents(report.avg_ticket_cents)}
          </div>
          <div className="text-xs text-purple-600">{t("report.avgTicket")}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-700">
            {report.cancelled_orders}
          </div>
          <div className="text-xs text-orange-600">{t("report.cancelled")}</div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {t("report.financialSummary")}
        </h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t("report.grossWithVat")}</span>
          <span className="font-mono">
            {formatCents(report.total_gross_cents)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t("report.taxBase")}</span>
          <span className="font-mono">
            {formatCents(report.total_net_cents)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t("report.totalVat")}</span>
          <span className="font-mono">
            {formatCents(report.total_tax_cents)}
          </span>
        </div>
        {report.total_discount_cents > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("report.discounts")}</span>
            <span className="font-mono text-red-600">
              -{formatCents(report.total_discount_cents)}
            </span>
          </div>
        )}
      </div>

      {/* Tax Breakdown */}
      {report.tax_breakdown && report.tax_breakdown.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {t("report.vatByRate")}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="text-left py-1">{t("report.rate")}</th>
                <th className="text-right py-1">{t("report.base")}</th>
                <th className="text-right py-1">{t("report.vat")}</th>
              </tr>
            </thead>
            <tbody>
              {report.tax_breakdown.map((tb) => (
                <tr key={tb.tax_rate_bps} className="border-b border-gray-100">
                  <td className="py-1">{tb.tax_rate_pct}%</td>
                  <td className="text-right font-mono py-1">
                    {formatCents(tb.subtotal_cents)}
                  </td>
                  <td className="text-right font-mono py-1">
                    {formatCents(tb.tax_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Breakdown */}
      {report.payment_breakdown && report.payment_breakdown.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {t("report.paymentMethods")}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="text-left py-1">{t("report.method")}</th>
                <th className="text-right py-1">{t("report.qty")}</th>
                <th className="text-right py-1">{t("report.total")}</th>
              </tr>
            </thead>
            <tbody>
              {report.payment_breakdown.map((pb) => (
                <tr key={pb.method} className="border-b border-gray-100">
                  <td className="py-1">
                    {PAYMENT_METHOD_KEYS[pb.method]
                      ? t(PAYMENT_METHOD_KEYS[pb.method])
                      : pb.method}
                  </td>
                  <td className="text-right py-1">{pb.count}</td>
                  <td className="text-right font-mono py-1">
                    {formatCents(pb.total_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cash Reconciliation */}
      <div className={`rounded-lg p-4 mb-6 ${diffColor}`}>
        <h3 className="text-sm font-semibold mb-3">
          {t("close.reconciliation")}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{t("report.openingBalance")}</span>
            <span className="font-mono">
              {formatCents(report.opening_balance_cents)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("report.expectedInDrawer")}</span>
            <span className="font-mono">
              {formatCents(report.expected_cash_cents)}
            </span>
          </div>
          {report.declared_cash_cents !== null && (
            <>
              <div className="flex justify-between">
                <span>{t("report.declared")}</span>
                <span className="font-mono">
                  {formatCents(report.declared_cash_cents)}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-current/20">
                <span>{t("report.difference")}</span>
                <span className="font-mono">
                  {diff > 0 ? "+" : ""}
                  {formatCents(diff)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 mb-4">
        {t("report.closedBy")} <strong>{report.closed_by}</strong>{" "}
        {t("report.at")} {formatTime(report.closed_at, i18n.language)}
      </div>

      <button
        onClick={onClose}
        className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        {t("report.finish")}
      </button>
    </div>
  );
}
