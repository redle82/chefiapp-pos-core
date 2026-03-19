/**
 * useExportBranding — Hook to derive PDFBranding from the restaurant identity.
 *
 * Used by ExportButtons and any page that needs to export reports.
 */

import { useMemo } from "react";
import { useRestaurantIdentity } from "../identity/useRestaurantIdentity";
import type { PDFBranding } from "./PDFGenerator";

/**
 * Returns PDFBranding derived from the current restaurant identity.
 */
export function useExportBranding(): PDFBranding {
  const { identity } = useRestaurantIdentity();

  return useMemo(
    (): PDFBranding => ({
      restaurantName: identity.name || "Restaurant",
      address: identity.address,
      phone: identity.phone,
      taxId: identity.taxId,
      logoUrl: identity.logoUrl,
    }),
    [
      identity.name,
      identity.address,
      identity.phone,
      identity.taxId,
      identity.logoUrl,
    ],
  );
}
