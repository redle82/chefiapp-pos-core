/**
 * StaffMiniKDS — Mobile-optimized KDS wrapper for AppStaff.
 *
 * The central KitchenDisplay is already a full-featured KDS (ticket cards, station filters, offline handling).
 * This wrapper adds mobile-responsive CSS overrides to make the 2-column layout single-column on mobile.
 *
 * Design:
 * - On mobile (< 768px): Single column, vertical scroll
 * - On tablet/desktop: Original 2-column layout
 *
 * Uses existing KitchenDisplay — no logic duplication.
 */

import KitchenDisplay from "../../TPV/KDS/KitchenDisplay";

// CSS-in-JS media query approach using a style element for mobile overrides
const mobileStylesId = "staff-mini-kds-mobile-styles";

const mobileStyles = `
  @media (max-width: 768px) {
    /* Make KDS grid single column on mobile */
    #staff-mini-kds-container main > div > div[style*="grid-template-columns: 1fr 1fr"],
    #staff-mini-kds-container main > div > div[style*="gridTemplateColumns"] {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    /* Reduce header padding on mobile */
    #staff-mini-kds-container header {
      padding: 12px 16px !important;
    }

    /* Make station filter scrollable horizontally */
    #staff-mini-kds-container header > div {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }

    /* Reduce main content padding */
    #staff-mini-kds-container main {
      padding: 12px !important;
    }

    /* Ensure ticket cards are full width */
    #staff-mini-kds-container [data-ticket-card] {
      width: 100% !important;
    }

    /* Hide lane headers on small screens (use tabs instead) */
    #staff-mini-kds-container h2[style*="text-transform: uppercase"] {
      font-size: 12px !important;
      margin-bottom: 8px !important;
    }
  }
`;

function injectMobileStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(mobileStylesId)) return;

  const style = document.createElement("style");
  style.id = mobileStylesId;
  style.textContent = mobileStyles;
  document.head.appendChild(style);
}

export function StaffMiniKDS() {
  // Inject mobile styles on mount
  if (typeof window !== "undefined") {
    injectMobileStyles();
  }

  return (
    <div
      id="staff-mini-kds-container"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <KitchenDisplay />
    </div>
  );
}

export default StaffMiniKDS;
