/**
 * ReservationEngine Tests — Docker Core PostgREST persistence
 */
import { describe, expect, it, vi } from "vitest";

function createCoreMock() {
  const mockFrom = vi.fn((table: string) => ({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "uuid-res-001" },
          error: null,
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: "uuid-res-001",
                restaurant_id: "rest-1",
                customer_name: "Maria Silva",
                reservation_date: "2026-02-14",
                reservation_time: "19:30",
                party_size: 4,
                status: "pending",
                source: "online",
                is_overbooking: false,
                created_at: "2026-02-09T10:00:00Z",
                updated_at: "2026-02-09T10:00:00Z",
              },
            ],
            error: null,
          }),
        }),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "uuid-res-001",
            restaurant_id: "rest-1",
            customer_name: "Maria Silva",
            party_size: 4,
            reservation_date: "2026-02-14",
            reservation_time: "19:30",
            status: "pending",
          },
          error: null,
        }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));
  return mockFrom;
}

describe("ReservationEngine (Core-backed)", () => {
  it("should create a reservation via Core", async () => {
    vi.resetModules();
    const mockFrom = createCoreMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom }),
      }),
    );

    const mod = await import(
      "../../../merchant-portal/src/core/reservations/ReservationEngine"
    );
    const engine = new mod.ReservationEngine();
    const id = await engine.create({
      restaurantId: "rest-1",
      customerName: "Maria Silva",
      reservationDate: new Date("2026-02-14"),
      reservationTime: "19:30",
      partySize: 4,
      customerPhone: "+351912345678",
      source: "online" as const,
    });

    expect(id).toBe("uuid-res-001");
    expect(mockFrom).toHaveBeenCalledWith("gm_reservations");
  });

  it("should fall back to in-memory if Core fails", async () => {
    vi.resetModules();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => {
          throw new Error("Core unavailable");
        },
      }),
    );

    const mod = await import(
      "../../../merchant-portal/src/core/reservations/ReservationEngine"
    );
    const engine = new mod.ReservationEngine();
    const id = await engine.create({
      restaurantId: "rest-fallback",
      customerName: "Fallback Test",
      reservationDate: new Date("2026-03-01"),
      reservationTime: "20:00",
      partySize: 2,
    });

    expect(id).toMatch(/^reservation_/);
  });

  it("should update status via Core", async () => {
    vi.resetModules();
    const mockFrom = createCoreMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom }),
      }),
    );

    const mod = await import(
      "../../../merchant-portal/src/core/reservations/ReservationEngine"
    );
    const engine = new mod.ReservationEngine();
    await engine.updateStatus("uuid-res-001", "confirmed");
    expect(mockFrom).toHaveBeenCalledWith("gm_reservations");
  });

  it("should get overbooking config", async () => {
    vi.resetModules();
    const mockFrom = createCoreMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom }),
      }),
    );

    const mod = await import(
      "../../../merchant-portal/src/core/reservations/ReservationEngine"
    );
    const engine = new mod.ReservationEngine();
    const config = await engine.getOverbookingConfig("rest-1");
    expect(config).toBeNull();
  });

  it("should calculate inventory impact", async () => {
    vi.resetModules();
    const mockFrom = createCoreMock();
    vi.doMock(
      "../../../merchant-portal/src/core/infra/dockerCoreFetchClient",
      () => ({
        getDockerCoreFetchClient: () => ({ from: mockFrom }),
      }),
    );

    const mod = await import(
      "../../../merchant-portal/src/core/reservations/ReservationEngine"
    );
    const engine = new mod.ReservationEngine();
    const impact = await engine.calculateInventoryImpact("uuid-res-001");
    expect(impact.partySize).toBe(4);
    expect(impact.estimatedConsumption.beverage).toBe(8);
    expect(impact.estimatedConsumption.main_course).toBe(4);
  });
});
