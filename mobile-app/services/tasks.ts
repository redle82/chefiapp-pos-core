import type { Task } from "@/context/AppStaffContext";

interface SupabaseLike {
  from: (table: string) => {
    select: (columns: string) => any;
  };
}

export async function fetchActiveTasks(
  client: SupabaseLike,
  restaurantId: string,
): Promise<Task[]> {
  if (!restaurantId) return [];

  const { data, error } = await client
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .neq("status", "done")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((task: any) => ({
    id: task.id,
    title: task.title,
    priority: task.priority as Task["priority"],
    status: task.status as Task["status"],
    assignedRoles: task.assigned_roles || [],
    category: task.category,
    createdAt: new Date(task.created_at).getTime(),
  }));
}
