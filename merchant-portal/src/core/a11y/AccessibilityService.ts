/**
 * AccessibilityService — WCAG 2.1 utilities for the POS system.
 *
 * Provides:
 * - Screen reader announcements via ARIA live regions
 * - Focus trapping for modals/dialogs
 * - Focus restoration when modals close
 * - WCAG contrast ratio calculations (AA / AAA compliance)
 */

// ---------------------------------------------------------------------------
// Screen reader announcements
// ---------------------------------------------------------------------------

let liveRegionElement: HTMLElement | null = null;

/**
 * Get or create the global ARIA live region element.
 * The element is visually hidden but announced by screen readers.
 */
function getOrCreateLiveRegion(): HTMLElement {
  if (liveRegionElement && document.body.contains(liveRegionElement)) {
    return liveRegionElement;
  }

  const el = document.createElement("div");
  el.id = "chefiapp-a11y-live-region";
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "true");
  el.setAttribute("role", "status");
  Object.assign(el.style, {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: "0",
  });
  document.body.appendChild(el);
  liveRegionElement = el;
  return el;
}

/**
 * Announce a message to screen readers via an ARIA live region.
 *
 * @param message - Text to announce
 * @param priority - "polite" waits for idle; "assertive" interrupts immediately
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  if (typeof document === "undefined") return;

  const el = getOrCreateLiveRegion();
  el.setAttribute("aria-live", priority);
  el.setAttribute("role", priority === "assertive" ? "alert" : "status");

  // Clear first so repeated identical messages are re-announced
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

// ---------------------------------------------------------------------------
// Focus management
// ---------------------------------------------------------------------------

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(", ");

/**
 * Get all focusable elements within a container.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((el) => el.offsetParent !== null); // Exclude invisible elements
}

/**
 * Trap focus within a container element (for modals/dialogs).
 * Returns a cleanup function that removes the trap.
 *
 * @param containerElement - The modal/dialog element to trap focus within
 * @returns Cleanup function to remove the focus trap
 */
export function trapFocus(containerElement: HTMLElement): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusable = getFocusableElements(containerElement);
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  containerElement.addEventListener("keydown", handleKeyDown);

  // Focus the first focusable element (or the container itself)
  const focusable = getFocusableElements(containerElement);
  if (focusable.length > 0) {
    focusable[0].focus();
  } else {
    containerElement.setAttribute("tabindex", "-1");
    containerElement.focus();
  }

  return () => {
    containerElement.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element.
 * Typically called when a modal closes.
 *
 * @param previousElement - The element that had focus before the modal opened
 */
export function restoreFocus(previousElement: Element | null): void {
  if (previousElement instanceof HTMLElement) {
    requestAnimationFrame(() => {
      previousElement.focus();
    });
  }
}

// ---------------------------------------------------------------------------
// Color contrast utilities (WCAG 2.1)
// ---------------------------------------------------------------------------

/**
 * Parse a hex color string to RGB components.
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

/**
 * Calculate relative luminance of an sRGB color per WCAG 2.1.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate the WCAG contrast ratio between two hex colors.
 * Returns a value between 1 (no contrast) and 21 (max contrast).
 *
 * @param fg - Foreground color as hex string (e.g., "#ffffff")
 * @param bg - Background color as hex string (e.g., "#000000")
 * @returns Contrast ratio (e.g., 4.5 for AA normal text compliance)
 */
export function getContrastRatio(fg: string, bg: string): number {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);

  if (!fgRgb || !bgRgb) return 1;

  const l1 = relativeLuminance(...fgRgb);
  const l2 = relativeLuminance(...bgRgb);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether a foreground/background color pair meets WCAG contrast requirements.
 *
 * WCAG 2.1 requirements:
 * - AA normal text (< 18pt): 4.5:1
 * - AA large text (>= 18pt or >= 14pt bold): 3:1
 * - AAA normal text: 7:1
 * - AAA large text: 4.5:1
 *
 * @param fg - Foreground color as hex string
 * @param bg - Background color as hex string
 * @param level - "AA" or "AAA" compliance level
 * @param largeText - Whether the text is large (>= 18pt or >= 14pt bold)
 * @returns True if the contrast meets the specified requirement
 */
export function meetsContrastRequirement(
  fg: string,
  bg: string,
  level: "AA" | "AAA" = "AA",
  largeText = false,
): boolean {
  const ratio = getContrastRatio(fg, bg);

  if (level === "AA") {
    return largeText ? ratio >= 3 : ratio >= 4.5;
  }
  // AAA
  return largeText ? ratio >= 4.5 : ratio >= 7;
}
