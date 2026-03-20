import crypto from "crypto";

const DEFAULT_SEQUENCE_WIDTH = 6;

const normalizePrevHash = (prevHash?: string | null): string =>
  prevHash && prevHash.trim().length > 0 ? prevHash : "GENESIS";

export const formatSequence = (
  sequence: number,
  width: number = DEFAULT_SEQUENCE_WIDTH,
): string => {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error("Sequence must be a positive integer");
  }

  return String(sequence).padStart(width, "0");
};

export const buildInvoiceNumber = (
  series: string,
  sequence: number,
  width: number = DEFAULT_SEQUENCE_WIDTH,
): string => `${series}-${formatSequence(sequence, width)}`;

export const buildAtcud = (
  series: string,
  sequence: number,
  width: number = DEFAULT_SEQUENCE_WIDTH,
): string => `${series}-${formatSequence(sequence, width)}`;

export const computeHashChain = (prevHash: string, content: string): string => {
  const base = normalizePrevHash(prevHash);
  const hash = crypto.createHash("sha256");
  hash.update(`${base}|${content}`);
  return hash.digest("hex");
};
