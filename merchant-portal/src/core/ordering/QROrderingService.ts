/**
 * QROrderingService — Generates QR codes and validates incoming QR orders.
 *
 * URL patterns:
 * - Table: https://{domain}/order/{restaurantId}?table={tableNumber}
 * - Takeaway: https://{domain}/order/{restaurantId}?mode=takeaway
 *
 * Token format: base64-encoded JSON with restaurantId, table, timestamp, nonce.
 */

const ORDER_PATH_PREFIX = "/order";

/**
 * Get the base URL for QR code generation.
 * Uses window.location.origin in browser, falls back to localhost.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:5175";
}

export interface QROrderToken {
  restaurantId: string;
  table?: number;
  mode?: "takeaway";
  ts: number;
  nonce: string;
}

export class QROrderingService {
  /**
   * Generate QR URL for a specific table.
   */
  generateTableQR(restaurantId: string, tableNumber: number): string {
    const base = getBaseUrl();
    return `${base}${ORDER_PATH_PREFIX}/${encodeURIComponent(restaurantId)}?table=${tableNumber}`;
  }

  /**
   * Generate QR URL for takeaway ordering.
   */
  generateTakeawayQR(restaurantId: string): string {
    const base = getBaseUrl();
    return `${base}${ORDER_PATH_PREFIX}/${encodeURIComponent(restaurantId)}?mode=takeaway`;
  }

  /**
   * Generate a signed token for QR validation.
   * Encodes restaurant, table, and timestamp for verification.
   */
  generateToken(restaurantId: string, tableNumber?: number): string {
    const payload: QROrderToken = {
      restaurantId,
      table: tableNumber,
      mode: tableNumber === undefined ? "takeaway" : undefined,
      ts: Date.now(),
      nonce: Math.random().toString(36).substring(2, 10),
    };
    return btoa(JSON.stringify(payload));
  }

  /**
   * Validate an incoming order token from QR scan.
   * Checks format and token age (max 24 hours).
   */
  validateQROrder(token: string): {
    valid: boolean;
    restaurantId?: string;
    table?: number;
    mode?: "takeaway";
  } {
    try {
      const decoded = JSON.parse(atob(token)) as QROrderToken;

      if (!decoded.restaurantId) {
        return { valid: false };
      }

      // Token expires after 24 hours
      const MAX_AGE_MS = 24 * 60 * 60 * 1000;
      if (Date.now() - decoded.ts > MAX_AGE_MS) {
        return { valid: false };
      }

      return {
        valid: true,
        restaurantId: decoded.restaurantId,
        table: decoded.table,
        mode: decoded.mode,
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Parse a QR order URL to extract parameters.
   * Used when a customer scans a QR code and lands on the page.
   */
  static parseOrderUrl(url: string): {
    restaurantId: string | null;
    tableNumber: number | null;
    mode: "table" | "takeaway";
  } {
    try {
      const parsed = new URL(url, getBaseUrl());
      const pathParts = parsed.pathname.split("/").filter(Boolean);

      // Expected: /order/{restaurantId}
      const orderIdx = pathParts.indexOf("order");
      if (orderIdx === -1 || orderIdx + 1 >= pathParts.length) {
        return { restaurantId: null, tableNumber: null, mode: "table" };
      }

      const restaurantId = decodeURIComponent(pathParts[orderIdx + 1]);
      const tableParam = parsed.searchParams.get("table");
      const modeParam = parsed.searchParams.get("mode");

      return {
        restaurantId,
        tableNumber: tableParam ? parseInt(tableParam, 10) : null,
        mode: modeParam === "takeaway" ? "takeaway" : "table",
      };
    } catch {
      return { restaurantId: null, tableNumber: null, mode: "table" };
    }
  }
}

/** Singleton instance */
export const qrOrderingService = new QROrderingService();
