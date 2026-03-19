import { useEffect, useRef, useState } from "react";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import type { UserRole } from "../../../core/context/ContextTypes";

export interface RosterEntry {
  staffId: string;
  name: string;
  role: UserRole;
  startTime: string; // ISO timestamp when they checked in
}

/** Roles allowed to operate the TPV central. */
const TPV_ELIGIBLE_ROLES = new Set<string>([
  "owner",
  "manager",
  "waiter",
]);

/**
 * Polls `shift_logs` (status='active') joined with `gm_staff` to build a
 * roster of staff currently on shift who are eligible to operate the TPV.
 *
 * Polls every 30 seconds. Returns an empty array on error (the roster is
 * an optional enhancement — never blocks the lock screen).
 */
export function useActiveRoster(restaurantId: string) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function fetchRoster() {
      try {
        const { data: shifts } = await dockerCoreClient
          .from("shift_logs")
          .select("employee_id, role, start_time")
          .eq("restaurant_id", restaurantId)
          .eq("status", "active")
          .order("start_time", { ascending: false });

        if (!mountedRef.current) return;

        if (!shifts || shifts.length === 0) {
          setRoster([]);
          setLoading(false);
          return;
        }

        // Gather unique employee ids
        const employeeIds = [
          ...new Set(
            (shifts as Array<{ employee_id: string }>).map(
              (s) => s.employee_id,
            ),
          ),
        ];

        const { data: staffRows } = await dockerCoreClient
          .from("gm_staff")
          .select("id, name, role")
          .in("id", employeeIds);

        if (!mountedRef.current) return;

        const staffMap = new Map<string, { name: string; role: string }>();
        if (staffRows) {
          for (const row of staffRows as Array<{
            id: string;
            name: string;
            role: string;
          }>) {
            staffMap.set(row.id, { name: row.name, role: row.role });
          }
        }

        const entries: RosterEntry[] = [];
        const seen = new Set<string>();

        for (const shift of shifts as Array<{
          employee_id: string;
          role: string;
          start_time: string;
        }>) {
          if (seen.has(shift.employee_id)) continue;
          seen.add(shift.employee_id);

          const staff = staffMap.get(shift.employee_id);
          const role = (staff?.role ?? shift.role) as UserRole;

          if (!TPV_ELIGIBLE_ROLES.has(role)) continue;

          entries.push({
            staffId: shift.employee_id,
            name: staff?.name ?? "Operador",
            role,
            startTime: shift.start_time,
          });
        }

        setRoster(entries);
      } catch {
        // Silently fail — roster is an optional enhancement
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    fetchRoster();

    // Poll every 30 seconds for roster changes
    timer = setInterval(fetchRoster, 30_000);

    return () => {
      mountedRef.current = false;
      if (timer) clearInterval(timer);
    };
  }, [restaurantId]);

  return { roster, loading };
}
