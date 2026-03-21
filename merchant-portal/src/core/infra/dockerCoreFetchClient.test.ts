/**
 * dockerCoreFetchClient — negative paths & error handling
 *
 * Covers: fetch failure, 4xx/5xx, non-JSON response, JSON parse failure,
 * tableUnavailable short-circuit, rpc unavailable, single() no rows.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Ensure we can mock fetch and control responses before client is used
const originalFetch = globalThis.fetch;

describe("dockerCoreFetchClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("table operations — error paths", () => {
    it("returns error when fetch returns 4xx", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "Invalid request", code: "PGRST116" }),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(1);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Invalid request");
      expect(result.data).toBeNull();
    });

    it("returns error when fetch returns 5xx", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "Database error", code: "500" }),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(1);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Database error");
      expect(result.data).toBeNull();
    });

    it("returns BACKEND_UNAVAILABLE when response is not JSON", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "text/html" }),
        text: async () => "<html>Not found</html>",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(1);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("BACKEND_UNAVAILABLE");
      expect(result.data).toBeNull();
    });

    it("returns error when fetch throws", async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error("Network failure"));

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(1);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Network failure");
      expect(result.data).toBeNull();
    });

    it("returns error for single() when no rows", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "[]",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client
        .from("gm_orders")
        .select("id")
        .eq("id", "nonexistent")
        .single();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("No rows found");
      expect(result.data).toBeNull();
    });

    it("returns error when JSON body is invalid", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "invalid json {{{",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(1);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("BACKEND_UNAVAILABLE");
      expect(result.data).toBeNull();
    });

    it("maybeSingle returns null data when empty array", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "[]",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client
        .from("gm_orders")
        .select("id")
        .eq("id", "nonexistent")
        .maybeSingle();

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("maybeSingle returns error when backend returns non-ok response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 406,
        statusText: "Not Acceptable",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({
            message: "Multiple rows returned",
            code: "PGRST117",
          }),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").maybeSingle();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("PGRST117");
    });

    it("single() with multiple rows returns the first row", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify([{ id: "first-row" }, { id: "second-row" }]),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").single();

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({ id: "first-row" });
    });

    it("range() sends the Range header", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => JSON.stringify([]),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client.from("gm_orders").select("id").range(5, 10).limit(6);

      const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][1] as RequestInit;
      const headers = init.headers as Headers;
      expect(headers.get("Range")).toBe("5-10");
    });

    it("insert() returns BACKEND_UNAVAILABLE when JSON body is malformed", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "{ invalid-json",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client
        .from("gm_orders")
        .insert({ id: "x" })
        .select("id")
        .single();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("BACKEND_UNAVAILABLE");
    });

    it("returns BACKEND_UNAVAILABLE when Content-Type is missing and body is not empty", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => "not-json-without-content-type",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(1);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("BACKEND_UNAVAILABLE");
    });
  });

  describe("rpc — error paths", () => {
    it("rpc returns error when fetch returns 4xx", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "RPC failed", code: "ACTOR_REQUIRED" }),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.rpc("create_order_atomic", {
        p_restaurant_id: "r1",
        p_items: [],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("RPC failed");
      expect(result.data).toBeNull();
    });

    it("rpc returns BACKEND_UNAVAILABLE when response is not JSON", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "text/plain" }),
        text: async () => "not json",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.rpc("create_order_atomic", {
        p_restaurant_id: "r1",
        p_items: [],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("BACKEND_UNAVAILABLE");
      expect(result.data).toBeNull();
    });

    it("rpc returns error when fetch throws", async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.rpc("create_order_atomic", {
        p_restaurant_id: "r1",
        p_items: [],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Connection refused");
      expect(result.data).toBeNull();
    });

    it("rpc returns error when JSON parse fails on error response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "malformed",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.rpc("create_order_atomic", {
        p_restaurant_id: "r1",
        p_items: [],
      });

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });

    it("rpc returns BACKEND_UNAVAILABLE when response JSON is malformed", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "{ malformed",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.rpc("create_order_atomic", {
        p_restaurant_id: "r1",
        p_items: [],
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("BACKEND_UNAVAILABLE");
    });

    it("rpc returns success with null data on 204 response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => "",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.rpc("create_order_atomic", {
        p_restaurant_id: "r1",
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("rpc returns BACKEND_UNAVAILABLE when Content-Type is missing and body is non-empty", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => "plain-response",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.rpc("create_order_atomic", {
        p_restaurant_id: "r1",
      });

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("BACKEND_UNAVAILABLE");
    });
  });

  describe("filter builder — branches", () => {
    it("is(column, null) uses is.null", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "[]",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client
        .from("gm_orders")
        .select("id")
        .is("deleted_at", null)
        .limit(10);

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(url).toContain("deleted_at");
      expect(url).toContain("is.null");
    });

    it("order ascending false uses desc", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "[]",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client
        .from("gm_orders")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(5);

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(url).toContain("order");
      expect(url).toContain("desc");
    });

    it("is non-null, in, not, or e order default asc serializam filtros corretamente", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "[]",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client
        .from("gm_orders")
        .select("id, created_at")
        .is("status", "PAID")
        .in("id", ["o1", "o2"])
        .not("deleted_at", "is", null)
        .or("status.eq.PAID,total_cents.gt.100")
        .order("created_at")
        .limit(10);

      const rawUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as string;
      const parsed = new URL(rawUrl);

      expect(parsed.searchParams.get("select")).toBe("id,created_at");
      expect(parsed.searchParams.get("status")).toBe("eq.PAID");
      expect(parsed.searchParams.get("id")).toBe("in.(o1,o2)");
      expect(parsed.searchParams.get("deleted_at")).toBe("not.is.null");
      expect(parsed.searchParams.get("or")).toBe(
        "status.eq.PAID,total_cents.gt.100",
      );
      expect(parsed.searchParams.get("order")).toContain("created_at.asc");
    });

    it("upsert sem onConflict não adiciona resolution=merge-duplicates no Prefer", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => JSON.stringify([{ id: "row-no-conflict" }]),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client.from("gm_orders").upsert([{ id: "row-no-conflict" }]);

      const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][1] as RequestInit;
      const prefer = (init.headers as Headers).get("Prefer") || "";
      expect(prefer).toContain("return=representation");
      expect(prefer).not.toContain("resolution=merge-duplicates");
    });
  });

  describe("BLOCO 1 — HTTP error / tableUnavailable", () => {
    it("404 + JSON body 42P01 marks table, second request short-circuits", async () => {
      const table = "t_avail_404";
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "relation does not exist", code: "42P01" }),
      });

      globalThis.fetch = fetchMock;

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const r1 = await client.from(table).select("id").limit(1);
      expect(r1.error).not.toBeNull();
      expect(r1.error?.code).toBe("42P01");

      const r2 = await client.from(table).select("id").limit(1);
      expect(r2.error).not.toBeNull();
      expect(r2.error?.message).toContain("Table unavailable");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("500 + JSON Content-Type but invalid body uses text as error message", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "internal server error",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(1);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("internal server error");
      expect(result.data).toBeNull();
    });

    it("404 + HTML body marks table and returns BACKEND_UNAVAILABLE", async () => {
      const table = "t_avail_html";
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "Content-Type": "text/html" }),
        text: async () => "<!DOCTYPE html><html>404</html>",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const r1 = await client.from(table).select("id").limit(1);
      expect(r1.error?.code).toBe("BACKEND_UNAVAILABLE");

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "relation does not exist", code: "42P01" }),
      });

      const r2 = await client.from(table).select("id").limit(1);
      expect(r2.error?.message).toContain("Table unavailable");
    });
  });

  describe("BLOCO 2 — Success edge cases", () => {
    it("200 GET + empty body returns []", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client.from("gm_orders").select("id").limit(5);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it("DELETE success returns null data", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => "",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client
        .from("gm_order_items")
        .delete()
        .eq("id", "item-1");

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("409 Conflict + upsert onConflict treats as success", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "Conflict", code: "23505" }),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const result = await client
        .from("installed_modules")
        .upsert([{ module_id: "tpv", restaurant_id: "r1" }], {
          onConflict: "restaurant_id,module_id",
        });

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("update PATCH sends body", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => "[]",
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client
        .from("gm_order_items")
        .update({ quantity: 2 })
        .eq("id", "item-1");

      const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][1] as RequestInit;
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body as string)).toEqual({ quantity: 2 });
    });
  });

  describe("BLOCO 3 — RPC optional / short-circuit", () => {
    it("RPC 404 optional marks, second request short-circuits", async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "function does not exist", code: "42883" }),
      });

      globalThis.fetch = fetchMock;

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const r1 = await client.rpc("get_multiunit_overview", {});
      expect(r1.error).not.toBeNull();

      const r2 = await client.rpc("get_multiunit_overview", {});
      expect(r2.error?.code).toBe("FUNCTION_UNAVAILABLE");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("upsert with onConflict sets Prefer header", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => JSON.stringify([{ id: "new-row" }]),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client
        .from("installed_modules")
        .upsert([{ module_id: "kds" }], { onConflict: "module_id" });

      const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][1] as RequestInit;
      const prefer = (init.headers as Headers).get("Prefer");
      expect(prefer).toContain("resolution=merge-duplicates");
    });

    it("insert with select cols adds select to URL", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => JSON.stringify([{ id: "o1", total_cents: 1000 }]),
      });

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client
        .from("gm_orders")
        .insert({ restaurant_id: "r1" })
        .select("id,total_cents")
        .single();

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(url).toContain("select=id%2Ctotal_cents");
    });

    it("RPC 404 em função não-opcional não entra em short-circuit", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () =>
          JSON.stringify({ message: "function does not exist", code: "42883" }),
      });
      globalThis.fetch = fetchMock;

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      await client.rpc("totally_non_optional_rpc", {});
      await client.rpc("totally_non_optional_rpc", {});

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("channel noop e removeChannel tolera unsubscribe com erro", async () => {
      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const channel = client.channel("topic-a");
      const chained = channel.subscribe().on("*", {}, () => {});
      expect(chained).toBe(channel);

      const badChannel = {
        unsubscribe: vi.fn(() => {
          throw new Error("already removed");
        }),
      } as any;

      expect(() => client.removeChannel(badChannel)).not.toThrow();
      expect(badChannel.unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe("BLOCO 4 — optional tables probing", () => {
    it("probeOptionalTables não propaga erro quando Core está indisponível", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("core down"));

      const { probeOptionalTables } = await import("./dockerCoreFetchClient");

      await expect(probeOptionalTables()).resolves.toBeUndefined();
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it("probeOptionalTables marca tabela opcional indisponível após 404 e short-circuita a seguir", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: new Headers({ "Content-Type": "application/json" }),
          text: async () =>
            JSON.stringify({
              message: 'relation "gm_customers" does not exist',
              code: "42P01",
            }),
        })
        .mockResolvedValue({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          text: async () => "[]",
        });

      globalThis.fetch = fetchMock;

      const { getDockerCoreFetchClient } = await import(
        "./dockerCoreFetchClient"
      );
      const client = getDockerCoreFetchClient();

      const first = await client.from("gm_customers").select("id").limit(1);
      expect(first.error?.code).toBe("42P01");

      const second = await client.from("gm_customers").select("id").limit(1);
      expect(second.error?.message).toContain("Table unavailable");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
