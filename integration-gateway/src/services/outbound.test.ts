import { OutboundWebhookService } from "./outbound";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

const { createClient } = jest.requireMock("@supabase/supabase-js") as {
  createClient: jest.Mock;
};

describe("OutboundWebhookService.getPendingDeliveries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("treats missing get_pending_deliveries RPC (PGRST202) as non-fatal compatibility warning", async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function public.get_pending_deliveries",
      },
    });

    createClient.mockReturnValue({ rpc });

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const service = new OutboundWebhookService();
    const result = await service.getPendingDeliveries(25);

    expect(result).toEqual([]);
    expect(rpc).toHaveBeenCalledWith("get_pending_deliveries", { p_limit: 25 });
    expect(warnSpy).toHaveBeenCalledWith(
      "[OutboundWebhook] get_pending_deliveries RPC unavailable (PGRST202). Outbound worker will stay idle until migrations are applied.",
    );
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
