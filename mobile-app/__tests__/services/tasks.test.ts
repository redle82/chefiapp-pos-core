import { fetchActiveTasks } from "../../services/tasks";

describe("fetchActiveTasks", () => {
  it("returns empty list when restaurantId is missing", async () => {
    const mockClient = { from: jest.fn() } as any;
    const result = await fetchActiveTasks(mockClient, "");
    expect(result).toEqual([]);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("queries gm_tasks scoped to restaurant and maps data", async () => {
    const eq = jest.fn(() => builder);
    const neq = jest.fn(() => builder);
    const order = jest.fn(() =>
      Promise.resolve({
        data: [
          {
            id: "task-1",
            title: "Repor gelo",
            priority: "urgent",
            status: "OPEN",
            assigned_roles: ["bartender"],
            category: "bar",
            created_at: "2024-01-01T10:00:00.000Z",
          },
        ],
        error: null,
      }),
    );

    const builder = {
      select: jest.fn(() => builder),
      eq,
      neq,
      order,
    } as any;

    const mockClient = {
      from: jest.fn(() => builder),
    } as any;

    const result = await fetchActiveTasks(mockClient, "rest-123");
    expect(mockClient.from).toHaveBeenCalledWith("gm_tasks");
    expect(builder.select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("restaurant_id", "rest-123");
    expect(neq).toHaveBeenCalledWith("status", "done");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual([
      {
        id: "task-1",
        title: "Repor gelo",
        priority: "urgent",
        status: "OPEN",
        assignedRoles: ["bartender"],
        category: "bar",
        createdAt: new Date("2024-01-01T10:00:00.000Z").getTime(),
      },
    ]);
  });
});
