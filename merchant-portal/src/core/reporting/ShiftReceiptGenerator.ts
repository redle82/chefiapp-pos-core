/**
 * ShiftReceiptGenerator
 *
 * Utility to generate HTML receipts for Shift Closure (Fecho de Caixa).
 * Optimized for 80mm/58mm thermal printers.
 */

import { currencyService } from "@/core/currency/CurrencyService";
import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import i18n from "@/i18n";

export interface ShiftReceiptData {
  restaurantName: string;
  terminalId: string;
  operatorName: string;
  openedAt: Date;
  closedAt: Date;
  openingBalanceCents: number;
  closingBalanceCents: number;
  dailySalesCents: number;
  expectedBalanceCents: number;
  differenceCents: number;
  paymentMethods?: Record<string, number>; // method -> cents
  legalFooter?: string;
}

export const generateShiftReceiptHtml = (data: ShiftReceiptData): string => {
  const t = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key, options);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(getFormatLocale(), {
      style: "currency",
      currency: currencyService.getDefaultCurrency(),
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString(getFormatLocale(), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // calculate duration
  const durationMs = data.closedAt.getTime() - data.openedAt.getTime();
  const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMins = Math.floor(
    (durationMs % (1000 * 60 * 60)) / (1000 * 60),
  );

  // Base Styles for Thermal Printing
  const styles = `
        <style>
            @page { margin: 0; size: auto; }
            body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                width: 100%;
                max-width: 300px; /* ~80mm paper */
                color: #000;
            }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .center { text-align: center; }
        </style>
    `;

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${t("receipt:cashClosure")}</title>
            ${styles}
        </head>
        <body>
            <div class="header">
                <div class="title">${data.restaurantName}</div>
                <div>${t("receipt:cashClosureTitle")}</div>
            </div>

            <div class="row">
                <span>${t("shift:receipt.terminal")}</span>
                <span>${data.terminalId}</span>
            </div>
            <div class="row">
                <span>${t("shift:receipt.operator")}</span>
                <span>${data.operatorName}</span>
            </div>

            <div class="divider"></div>

            <div class="row">
                <span>${t("shift:receipt.opening")}</span>
                <span>${formatDate(data.openedAt)}</span>
            </div>
            <div class="row">
                <span>${t("shift:receipt.closing")}</span>
                <span>${formatDate(data.closedAt)}</span>
            </div>
            <div class="center" style="margin-bottom: 5px; font-size: 10px;">
                (${t(
                  "shift:receipt.duration",
                )} ${durationHrs}h ${durationMins}m)
            </div>

            <div class="divider"></div>

            <div class="row">
                <span>${t("shift:receipt.openingBalance")}</span>
                <span>${formatPrice(data.openingBalanceCents)}</span>
            </div>
            <div class="row bold">
                <span>${t("shift:receipt.sessionSales")}</span>
                <span>${formatPrice(data.dailySalesCents)}</span>
            </div>

            ${
              data.paymentMethods
                ? `
                <div style="margin-left: 10px; font-size: 10px; margin-bottom: 5px;">
                    ${Object.entries(data.paymentMethods)
                      .map(
                        ([method, amount]) => `
                        <div class="row" style="margin-bottom: 2px;">
                            <span>- ${method}:</span>
                            <span>${formatPrice(amount)}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `
                : ""
            }

            <div class="divider"></div>

            <div class="row">
                <span>${t("shift:receipt.expectedBalance")}</span>
                <span>${formatPrice(data.expectedBalanceCents)}</span>
            </div>
            <div class="row bold" style="font-size: 14px; margin-top: 5px;">
                <span>${t("shift:receipt.finalBalance")}</span>
                <span>${formatPrice(data.closingBalanceCents)}</span>
            </div>

            <div class="divider"></div>

            <div class="row bold">
                <span>${t("shift:receipt.difference")}</span>
                <span>${data.differenceCents > 0 ? "+" : ""}${formatPrice(
    data.differenceCents,
  )}</span>
            </div>

            <div class="footer">
                ${data.legalFooter ? `${data.legalFooter}<br>` : ""}
                ${t("shift:receipt.issuedAt")} ${formatDate(new Date())}<br>
                ${t("shift:receipt.software")}
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;
};
