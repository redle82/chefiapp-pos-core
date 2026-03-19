/**
 * DeliveryOrderActions — Action buttons and status flow for delivery orders.
 *
 * Renders contextual action buttons (accept, reject, ready, picked up) based on
 * the current order status, along with a visual status pipeline and elapsed timer.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  acceptOrder,
  isValidTransition,
  markCompleted,
  markPreparing,
  markReady,
  rejectOrder,
  type DeliveryOrderStatus,
  type RejectReason,
} from "./DeliveryStatusService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeliveryOrder {
  id: string;
  external_id: string;
  source: string;
  reference: string;
  status: string;
  customer_name: string;
  total_cents: number;
  received_at: string;
  raw_payload: any;
  error_log?: any;
}

interface DeliveryOrderActionsProps {
  order: DeliveryOrder;
  onStatusChange: (orderId: string, newStatus: DeliveryOrderStatus) => void;
  formatCurrency: (cents: number) => string;
}

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    dotColor: "bg-amber-400",
  },
  accepted: {
    label: "Accepted",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    dotColor: "bg-blue-400",
  },
  preparing: {
    label: "Preparing",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    dotColor: "bg-orange-400",
  },
  ready: {
    label: "Ready",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
    dotColor: "bg-green-500",
  },
  completed: {
    label: "Picked Up",
    color: "text-gray-500",
    bgColor: "bg-gray-50 border-gray-200",
    dotColor: "bg-gray-400",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    dotColor: "bg-red-400",
  },
};

const PIPELINE_STEPS: DeliveryOrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
];

const REJECT_REASONS: { value: RejectReason; label: string }[] = [
  { value: "out_of_stock", label: "Out of stock" },
  { value: "too_busy", label: "Too busy" },
  { value: "closing_soon", label: "Closing soon" },
  { value: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Elapsed timer hook
// ---------------------------------------------------------------------------

function useElapsedTime(since: string): string {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diffMs = Date.now() - new Date(since).getTime();
      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        setElapsed(`${hours}h ${remainingMinutes}m`);
      } else {
        setElapsed(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [since]);

  return elapsed;
}

// ---------------------------------------------------------------------------
// StatusPipeline — Visual progress indicator
// ---------------------------------------------------------------------------

const StatusPipeline: React.FC<{ currentStatus: string }> = ({
  currentStatus,
}) => {
  const currentIndex = PIPELINE_STEPS.indexOf(
    currentStatus as DeliveryOrderStatus,
  );
  const isRejected = currentStatus === "rejected";

  return (
    <div className="flex items-center gap-1 py-2">
      {PIPELINE_STEPS.map((step, index) => {
        const config = STATUS_CONFIG[step];
        const isActive = step === currentStatus;
        const isPast = currentIndex >= 0 && index < currentIndex;
        const isFuture = !isActive && !isPast;

        return (
          <React.Fragment key={step}>
            {index > 0 && (
              <div
                className={`h-0.5 w-4 sm:w-6 ${
                  isPast ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isActive
                    ? `${config.dotColor} border-current ring-2 ring-offset-1 ring-current`
                    : isPast
                      ? "bg-green-400 border-green-400"
                      : isRejected
                        ? "bg-gray-200 border-gray-300"
                        : "bg-gray-200 border-gray-300"
                }`}
              />
              <span
                className={`text-[10px] leading-none ${
                  isActive
                    ? `font-bold ${config.color}`
                    : isFuture
                      ? "text-gray-300"
                      : "text-gray-400"
                }`}
              >
                {config.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}

      {isRejected && (
        <>
          <div className="h-0.5 w-4 sm:w-6 bg-red-300" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-red-400 ring-2 ring-offset-1 ring-red-400" />
            <span className="text-[10px] leading-none font-bold text-red-700">
              Rejected
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// RejectModal — Reason selection for rejecting orders
// ---------------------------------------------------------------------------

const RejectModal: React.FC<{
  onConfirm: (reason: RejectReason, notes?: string) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ onConfirm, onCancel, loading }) => {
  const [selectedReason, setSelectedReason] =
    useState<RejectReason>("out_of_stock");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Reject Order</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select a reason for rejecting this order. This will be sent to the
            delivery platform.
          </p>
        </div>

        <div className="p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Reason
          </label>
          <div className="space-y-2">
            {REJECT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedReason === reason.value
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={() => setSelectedReason(reason.value)}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-900">{reason.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedReason, notes || undefined)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Reject Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PrepTimeModal — Estimated preparation time for accepting orders
// ---------------------------------------------------------------------------

const PrepTimeModal: React.FC<{
  onConfirm: (minutes: number) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ onConfirm, onCancel, loading }) => {
  const [minutes, setMinutes] = useState(15);
  const presets = [10, 15, 20, 30, 45, 60];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Accept Order</h3>
          <p className="text-sm text-gray-500 mt-1">
            Set estimated preparation time
          </p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setMinutes(preset)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  minutes === preset
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {preset} min
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Custom:</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) =>
                setMinutes(Math.max(1, parseInt(e.target.value) || 1))
              }
              min={1}
              max={120}
              className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(minutes)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Accept ({minutes}min)
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// DeliveryOrderCard — Full order card with actions
// ---------------------------------------------------------------------------

export const DeliveryOrderCard: React.FC<DeliveryOrderActionsProps> = ({
  order,
  onStatusChange,
  formatCurrency,
}) => {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elapsed = useElapsedTime(order.received_at);

  const status = order.status as DeliveryOrderStatus;

  const canAccept = isValidTransition(status, "accepted");
  const canReject = isValidTransition(status, "rejected");
  const canPrepare = isValidTransition(status, "preparing");
  const canReady = isValidTransition(status, "ready");
  const canComplete = isValidTransition(status, "completed");

  const isTerminal = status === "completed" || status === "rejected";

  const handleAccept = useCallback(
    async (minutes: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await acceptOrder(
          order.id,
          order.external_id,
          order.source,
          minutes,
        );
        if (result.success) {
          onStatusChange(order.id, result.newStatus);
          setShowAcceptModal(false);
        } else {
          setError(result.error || "Failed to accept order");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [order, onStatusChange],
  );

  const handleReject = useCallback(
    async (reason: RejectReason, notes?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await rejectOrder(
          order.id,
          order.external_id,
          order.source,
          reason,
          notes,
        );
        if (result.success) {
          onStatusChange(order.id, result.newStatus);
          setShowRejectModal(false);
        } else {
          setError(result.error || "Failed to reject order");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [order, onStatusChange],
  );

  const handlePreparing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await markPreparing(
        order.id,
        order.external_id,
        order.source,
      );
      if (result.success) {
        onStatusChange(order.id, result.newStatus);
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [order, onStatusChange]);

  const handleReady = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await markReady(
        order.id,
        order.external_id,
        order.source,
      );
      if (result.success) {
        onStatusChange(order.id, result.newStatus);
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [order, onStatusChange]);

  const handleCompleted = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await markCompleted(
        order.id,
        order.external_id,
        order.source,
      );
      if (result.success) {
        onStatusChange(order.id, result.newStatus);
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [order, onStatusChange]);

  // Pulsing border for pending orders to draw attention
  const borderClass = useMemo(() => {
    if (status === "pending") return "border-amber-300 ring-1 ring-amber-200";
    if (status === "rejected") return "border-red-200";
    if (status === "completed") return "border-gray-200 opacity-75";
    return "border-gray-200";
  }, [status]);

  return (
    <>
      <div
        className={`bg-white rounded-lg border shadow-sm p-4 transition-all ${borderClass}`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">
                #{order.reference}
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  order.source === "glovo"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {order.source}
              </span>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{order.customer_name}</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(order.total_cents)}
              </span>
            </div>
          </div>

          {/* Elapsed timer */}
          <div className="text-right shrink-0">
            <div
              className={`text-sm font-mono font-bold ${
                status === "pending" ? "text-amber-600" : "text-gray-400"
              }`}
            >
              {elapsed}
            </div>
            <div className="text-[10px] text-gray-400">
              {new Date(order.received_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Status pipeline */}
        <StatusPipeline currentStatus={status} />

        {/* Error display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Action buttons */}
        {!isTerminal && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {canAccept && (
              <button
                onClick={() => setShowAcceptModal(true)}
                disabled={loading}
                className="flex-1 min-w-[100px] px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Accept
              </button>
            )}

            {canPrepare && (
              <button
                onClick={handlePreparing}
                disabled={loading}
                className="flex-1 min-w-[100px] px-3 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                Start Preparing
              </button>
            )}

            {canReady && (
              <button
                onClick={handleReady}
                disabled={loading}
                className="flex-1 min-w-[100px] px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Ready for Pickup
              </button>
            )}

            {canComplete && (
              <button
                onClick={handleCompleted}
                disabled={loading}
                className="flex-1 min-w-[100px] px-3 py-2 text-sm font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Picked Up
              </button>
            )}

            {canReject && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            )}

            {loading && (
              <span className="flex items-center text-xs text-gray-400">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-1" />
                Updating...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAcceptModal && (
        <PrepTimeModal
          onConfirm={handleAccept}
          onCancel={() => setShowAcceptModal(false)}
          loading={loading}
        />
      )}

      {showRejectModal && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          loading={loading}
        />
      )}
    </>
  );
};

export { StatusBadge, StatusPipeline };
