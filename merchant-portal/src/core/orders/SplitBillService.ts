/**
 * SplitBillService — Logic for splitting an order total among multiple people.
 *
 * Three modes:
 * - splitEqual: divide total equally, last person absorbs rounding remainder
 * - splitByItems: each person pays for assigned items
 * - splitCustom: arbitrary amounts that must sum to the order total
 *
 * All amounts are in cents (integer). Rounding is always handled so that
 * the sum of all parts equals the order total exactly.
 */

import type { OrderSummaryItem } from "../../pages/TPVMinimal/components/OrderSummaryPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SplitPaymentStatus = "pending" | "paid";

export interface SplitBillPart {
  /** Zero-based index of this split part. */
  partIndex: number;
  /** Label for display: "Person 1", "Person 2", etc. */
  label: string;
  /** Items assigned to this person (only populated for splitByItems). */
  items: SplitPartItem[];
  /** Subtotal before tax (cents). */
  subtotalCents: number;
  /** Tax portion (cents). */
  taxCents: number;
  /** Final total for this part (cents). */
  totalCents: number;
  /** Payment status tracking. */
  paymentStatus: SplitPaymentStatus;
  /** Payment method used (set when paid). */
  paymentMethod?: "cash" | "card" | "pix";
}

export interface SplitPartItem {
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface ItemAssignment {
  /** product_id from OrderSummaryItem */
  itemId: string;
  /** Zero-based person index */
  personIndex: number;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function assertPositiveTotal(totalCents: number): void {
  if (totalCents <= 0) {
    throw new Error("Order total must be greater than zero.");
  }
}

function assertValidSplitCount(count: number): void {
  if (!Number.isInteger(count) || count < 2 || count > 20) {
    throw new Error("Split count must be an integer between 2 and 20.");
  }
}

/** Calculate item total including modifier deltas. */
function itemEffectiveTotal(item: OrderSummaryItem): number {
  const modDelta = (item.modifiers ?? []).reduce(
    (sum, m) => sum + m.priceDeltaCents,
    0,
  );
  return (item.unit_price + modDelta) * item.quantity;
}

// ---------------------------------------------------------------------------
// splitEqual
// ---------------------------------------------------------------------------

/**
 * Divide the order total equally among `numberOfPeople`.
 * Each person pays `floor(total / n)` cents; the last person pays
 * the remainder so the sum is exact.
 */
export function splitEqual(
  totalCents: number,
  taxCents: number,
  numberOfPeople: number,
): SplitBillPart[] {
  assertPositiveTotal(totalCents);
  assertValidSplitCount(numberOfPeople);

  const baseCents = Math.floor(totalCents / numberOfPeople);
  const baseTax = Math.floor(taxCents / numberOfPeople);
  const parts: SplitBillPart[] = [];

  let assignedTotal = 0;
  let assignedTax = 0;

  for (let i = 0; i < numberOfPeople; i++) {
    const isLast = i === numberOfPeople - 1;
    const partTotal = isLast ? totalCents - assignedTotal : baseCents;
    const partTax = isLast ? taxCents - assignedTax : baseTax;
    const partSubtotal = partTotal - partTax;

    parts.push({
      partIndex: i,
      label: `Person ${i + 1}`,
      items: [],
      subtotalCents: partSubtotal,
      taxCents: partTax,
      totalCents: partTotal,
      paymentStatus: "pending",
    });

    assignedTotal += partTotal;
    assignedTax += partTax;
  }

  return parts;
}

// ---------------------------------------------------------------------------
// splitByItems
// ---------------------------------------------------------------------------

/**
 * Each person pays for their assigned items.
 * `assignments` maps each item to a person index.
 * Tax is distributed proportionally to each person's subtotal share.
 *
 * All items must be assigned (throws if any unassigned).
 */
export function splitByItems(
  items: OrderSummaryItem[],
  assignments: ItemAssignment[],
  totalCents: number,
  taxCents: number,
): SplitBillPart[] {
  assertPositiveTotal(totalCents);

  if (items.length === 0) {
    throw new Error("No items to split.");
  }

  // Validate all items are assigned
  const assignedIds = new Set(assignments.map((a) => a.itemId));
  const unassigned = items.filter((i) => !assignedIds.has(i.product_id));
  if (unassigned.length > 0) {
    throw new Error(
      `Unassigned items: ${unassigned.map((i) => i.name).join(", ")}`,
    );
  }

  // Group assignments by person
  const personMap = new Map<number, ItemAssignment[]>();
  for (const a of assignments) {
    const list = personMap.get(a.personIndex) ?? [];
    list.push(a);
    personMap.set(a.personIndex, list);
  }

  const personIndices = Array.from(personMap.keys()).sort((a, b) => a - b);
  if (personIndices.length < 2) {
    throw new Error("At least 2 people are required to split by items.");
  }

  // Build lookup for items
  const itemMap = new Map<string, OrderSummaryItem>();
  for (const item of items) {
    itemMap.set(item.product_id, item);
  }

  // Compute subtotal for each person
  const subtotals: number[] = [];
  const personItems: SplitPartItem[][] = [];

  for (const idx of personIndices) {
    const assigned = personMap.get(idx) ?? [];
    let personSubtotal = 0;
    const pItems: SplitPartItem[] = [];

    for (const a of assigned) {
      const item = itemMap.get(a.itemId);
      if (!item) continue;
      const lineTotal = itemEffectiveTotal(item);
      personSubtotal += lineTotal;
      pItems.push({
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unit_price,
        lineTotalCents: lineTotal,
      });
    }

    subtotals.push(personSubtotal);
    personItems.push(pItems);
  }

  const rawSubtotal = subtotals.reduce((a, b) => a + b, 0);

  // Distribute tax proportionally
  const parts: SplitBillPart[] = [];
  let assignedTax = 0;

  for (let i = 0; i < personIndices.length; i++) {
    const isLast = i === personIndices.length - 1;
    const proportion = rawSubtotal > 0 ? subtotals[i] / rawSubtotal : 0;
    const partTax = isLast
      ? taxCents - assignedTax
      : Math.round(taxCents * proportion);
    const partTotal = subtotals[i] + partTax;

    parts.push({
      partIndex: personIndices[i],
      label: `Person ${personIndices[i] + 1}`,
      items: personItems[i],
      subtotalCents: subtotals[i],
      taxCents: partTax,
      totalCents: partTotal,
      paymentStatus: "pending",
    });

    assignedTax += partTax;
  }

  return parts;
}

// ---------------------------------------------------------------------------
// splitCustom
// ---------------------------------------------------------------------------

/**
 * Custom amounts per person. The sum must equal the order total exactly.
 * Tax is distributed proportionally.
 */
export function splitCustom(
  amounts: number[],
  totalCents: number,
  taxCents: number,
): SplitBillPart[] {
  assertPositiveTotal(totalCents);

  if (amounts.length < 2) {
    throw new Error("At least 2 amounts are required for custom split.");
  }

  // Validate no negative amounts
  if (amounts.some((a) => a < 0)) {
    throw new Error("Amounts cannot be negative.");
  }

  // Validate sum equals total
  const sum = amounts.reduce((a, b) => a + b, 0);
  if (sum !== totalCents) {
    throw new Error(
      `Amounts sum (${sum}) does not equal order total (${totalCents}). Difference: ${totalCents - sum} cents.`,
    );
  }

  const parts: SplitBillPart[] = [];
  let assignedTax = 0;

  for (let i = 0; i < amounts.length; i++) {
    const isLast = i === amounts.length - 1;
    const proportion = totalCents > 0 ? amounts[i] / totalCents : 0;
    const partTax = isLast
      ? taxCents - assignedTax
      : Math.round(taxCents * proportion);
    const partSubtotal = amounts[i] - partTax;

    parts.push({
      partIndex: i,
      label: `Person ${i + 1}`,
      items: [],
      subtotalCents: partSubtotal,
      taxCents: partTax,
      totalCents: amounts[i],
      paymentStatus: "pending",
    });

    assignedTax += partTax;
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Utility: validate parts sum
// ---------------------------------------------------------------------------

/**
 * Verify that the sum of all part totals equals the expected order total.
 * Returns true if valid, false otherwise.
 */
export function validateSplitSum(
  parts: SplitBillPart[],
  expectedTotal: number,
): boolean {
  const sum = parts.reduce((acc, p) => acc + p.totalCents, 0);
  return sum === expectedTotal;
}
