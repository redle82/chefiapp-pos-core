import { getDockerCoreFetchClient } from "../../../../merchant-portal/src/core/infra/dockerCoreFetchClient";

jest.mock("../../../../merchant-portal/src/config", () => ({
  CONFIG: {
    CORE_URL: "",
    CORE_ANON_KEY: "test-key",
    API_BASE: "",
    INSFORGE_URL: "",
    INSFORGE_ANON_KEY: "",
    STRIPE_PUBLIC_KEY: "",
    STRIPE_PRICE_ID: "",
    LLM_VISION_ENDPOINT: "",
    AI_GATEWAY_ENDPOINT: "",
    IS_DEV: false,
    IS_PROD: false,
    MODE: "test",
    DEBUG_DIRECT_FLOW: false,
    UI_MODE: "OPERATIONAL_OS",
    TERMINAL_INSTALLATION_TRACK: false,
    ALLOW_STAFF_ROLE_QUERY: false,
    SUPPORT_WHATSAPP_NUMBER: "",
  },
}));

describe("Docker Core fetch client filters", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => "[]",
    });
  });

  it("adds gte filters to query params", async () => {
    const client = getDockerCoreFetchClient();

    await client
      .from("gm_audit_logs")
      .select("id")
      .eq("restaurant_id", "rest-1")
      .gte("created_at", "2026-02-01T00:00:00.000Z")
      .order("created_at", { ascending: false })
      .limit(10);

    const fetchCall = (global as any).fetch.mock.calls[0];
    const url = new URL(String(fetchCall[0]));

    expect(url.searchParams.get("created_at")).toBe(
      "gte.2026-02-01T00:00:00.000Z",
    );
    expect(url.searchParams.get("restaurant_id")).toBe("eq.rest-1");
    expect(url.searchParams.get("order")).toBe("created_at.desc");
    expect(url.searchParams.get("limit")).toBe("10");
  });
});
