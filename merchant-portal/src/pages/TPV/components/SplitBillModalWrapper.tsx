/**
 * SplitBillModalWrapper — Bridge between TPVPOSView and the full SplitBillModal.
 *
 * Accepts the simpler props interface from TPVPOSView and adapts them
 * for the full SplitBillModal with 3-tab support (equal, by-items, custom).
 */

import React from "react";
import { SplitBillModal } from "../../TPVMinimal/components/SplitBillModal";
import type { OrderSummaryItem } from "../../TPVMinimal/components/OrderSummaryPanel";

export interface SplitBillModalWrapperProps {
  orderId: string;
  restaurantId: string;
  orderTotal: number;
  taxCents: number;
  items: OrderSummaryItem[];
  onPayPartial: (
    amountCents: number,
    method: "cash" | "card" | "pix",
  ) => Promise<void> | void;
  onAllPaid: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SplitBillModalWrapper: React.FC<SplitBillModalWrapperProps> = ({
  orderId,
  orderTotal,
  taxCents,
  items,
  onPayPartial,
  onAllPaid,
  onCancel,
  loading,
}) => {
  return (
    <SplitBillModal
      orderId={orderId}
      orderTotal={orderTotal}
      taxCents={taxCents}
      items={items}
      onPayPart={async (amountCents, method, _partIndex) => {
        await onPayPartial(amountCents, method);
      }}
      onAllPaid={onAllPaid}
      onCancel={onCancel}
      loading={loading}
    />
  );
};
