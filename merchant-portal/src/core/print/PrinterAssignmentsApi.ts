import { invokeRpc } from "../infra/coreRpc";

export type PrintFunction = "kitchen" | "receipt" | "labels";
export type PrintTransport = "spooler" | "tcp9100";

export type PrinterAssignment = {
  id: string;
  restaurant_id: string;
  station_id?: string | null;
  print_function: PrintFunction;
  transport: PrintTransport;
  target: string;
  display_name?: string | null;
  is_enabled: boolean;
  metadata?: Record<string, unknown>;
  updated_at: string;
};

export type UpsertPrinterAssignmentInput = {
  restaurantId: string;
  stationId?: string | null;
  printFunction: PrintFunction;
  transport: PrintTransport;
  target: string;
  displayName?: string | null;
  isEnabled?: boolean;
  metadata?: Record<string, unknown>;
};

export async function listPrinterAssignments(input: {
  restaurantId: string;
  stationId?: string | null;
}): Promise<{
  data: PrinterAssignment[];
  error: { message: string } | null;
}> {
  const { data, error } = await invokeRpc<PrinterAssignment[]>(
    "list_printer_assignments",
    {
      p_restaurant_id: input.restaurantId,
      p_station_id: input.stationId ?? null,
    },
  );

  return { data: data ?? [], error };
}

export async function upsertPrinterAssignment(
  input: UpsertPrinterAssignmentInput,
): Promise<{
  data: { id: string } | null;
  error: { message: string } | null;
}> {
  const { data, error } = await invokeRpc<{ id: string }>(
    "upsert_printer_assignment",
    {
      p_restaurant_id: input.restaurantId,
      p_station_id: input.stationId ?? null,
      p_print_function: input.printFunction,
      p_transport: input.transport,
      p_target: input.target,
      p_display_name: input.displayName ?? null,
      p_is_enabled: input.isEnabled ?? true,
      p_metadata: input.metadata ?? {},
    },
  );

  return { data: data ?? null, error };
}

export async function resolvePrinterAssignment(input: {
  restaurantId: string;
  printFunction: PrintFunction;
  stationId?: string | null;
}): Promise<{
  data:
    | {
        found: true;
        assignment: PrinterAssignment;
      }
    | {
        found: false;
        print_function: PrintFunction;
      }
    | null;
  error: { message: string } | null;
}> {
  const { data, error } = await invokeRpc<
    | {
        found: true;
        assignment: PrinterAssignment;
      }
    | {
        found: false;
        print_function: PrintFunction;
      }
  >("resolve_printer_assignment", {
    p_restaurant_id: input.restaurantId,
    p_print_function: input.printFunction,
    p_station_id: input.stationId ?? null,
  });

  return { data: data ?? null, error };
}
