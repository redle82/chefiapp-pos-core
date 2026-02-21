/**
 * SAF-T export helpers (browser-safe, no Node crypto).
 * Mirrors fiscal-modules/pt/saft/saftUtils for buildInvoiceNumber/buildAtcud only.
 */

const DEFAULT_SEQUENCE_WIDTH = 6;

function formatSequence(
  sequence: number,
  width: number = DEFAULT_SEQUENCE_WIDTH,
): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    return String(1).padStart(width, "0");
  }
  return String(sequence).padStart(width, "0");
}

export function buildInvoiceNumber(
  series: string,
  sequence: number,
  width: number = DEFAULT_SEQUENCE_WIDTH,
): string {
  return `${series}-${formatSequence(sequence, width)}`;
}

export function buildAtcud(
  series: string,
  sequence: number,
  width: number = DEFAULT_SEQUENCE_WIDTH,
): string {
  return `${series}-${formatSequence(sequence, width)}`;
}
