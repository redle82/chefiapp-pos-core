/**
 * Processes pending print jobs when online (called after SyncEngine processes order queue).
 * Print jobs with orderId are only processed after the order exists in Core (order sync confirmed).
 */

import { orderExistsInCore } from "../infra/CoreOrdersApi";
import { FiscalPrinter } from "../fiscal/FiscalPrinter";
import { requestPrint } from "./CorePrintApi";
import { PrintQueue } from "./PrintQueue";
import type { PrintQueueJob } from "./PrintQueueTypes";

export async function processPrintQueue(): Promise<void> {
  const pending = await PrintQueue.getPending();
  if (pending.length === 0) return;

  const printer = new FiscalPrinter({ printerType: "browser" });

  for (const job of pending) {
    try {
      // Dependência: jobs com orderId só processam após o pedido existir no Core
      if (job.orderId) {
        const exists = await orderExistsInCore(job.orderId);
        if (!exists) continue; // Deixa em pending para a próxima rodada
      }

      const coreType: "kitchen_ticket" | "receipt" | "z_report" =
        job.type === "fiscal" ? "receipt" : job.type;
      const { data, error: rpcError } = await requestPrint({
        restaurantId: job.restaurantId,
        type: coreType,
        orderId: job.orderId,
        payload: job.payload as Record<string, unknown>,
      });

      if (rpcError) {
        await PrintQueue.updateStatus(job.id, "failed", rpcError.message);
        continue;
      }

      if (data?.status === "sent" && job.type === "kitchen_ticket") {
        try {
          await printer.printKitchenTicket(
            (job.payload as { id?: string; tableNumber?: string; items?: unknown[] }) || {}
          );
        } catch (e) {
          await PrintQueue.updateStatus(
            job.id,
            "failed",
            e instanceof Error ? e.message : String(e)
          );
          continue;
        }
      }

      await PrintQueue.updateStatus(job.id, "sent");
    } catch (e) {
      await PrintQueue.updateStatus(
        job.id,
        "failed",
        e instanceof Error ? e.message : String(e)
      );
    }
  }
}
