/**
 * useSchedule — Hook para gestão de escalas semanais.
 *
 * MVP: dados em memória (localStorage), pronto para migrar a Supabase.
 * Expõe: weekSchedule, templates, CRUD de entries, navegação de semana.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStaff } from "../context/StaffContext";
import type {
  DayCoverage,
  DayOfWeek,
  RoleSlot,
  ScheduleConflict,
  ScheduleEntry,
  ScheduleStatus,
  ShiftTemplate,
  WeekDay,
  WeekSchedule,
} from "../context/ScheduleTypes";
import type { StaffRole } from "../context/StaffCoreTypes";

// ── Defaults ─────────────────────────────────────────────────────

const DEFAULT_TEMPLATES: ShiftTemplate[] = [
  {
    id: "tpl-morning",
    restaurant_id: "",
    name: "Manhã",
    color: "#F59E0B",
    start_time: "08:00",
    end_time: "16:00",
    break_minutes: 30,
    roles_needed: [
      { role: "manager", count: 1 },
      { role: "waiter", count: 2 },
      { role: "kitchen", count: 2 },
      { role: "cleaning", count: 1 },
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tpl-afternoon",
    restaurant_id: "",
    name: "Tarde",
    color: "#3B82F6",
    start_time: "16:00",
    end_time: "00:00",
    break_minutes: 30,
    roles_needed: [
      { role: "manager", count: 1 },
      { role: "waiter", count: 3 },
      { role: "kitchen", count: 2 },
      { role: "cleaning", count: 1 },
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tpl-double",
    restaurant_id: "",
    name: "Duplo",
    color: "#8B5CF6",
    start_time: "08:00",
    end_time: "00:00",
    break_minutes: 60,
    roles_needed: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ── Storage keys ─────────────────────────────────────────────────

const STORAGE_KEY_ENTRIES = "chefi_schedule_entries";
const STORAGE_KEY_TEMPLATES = "chefi_schedule_templates";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full — ignore
  }
}

// ── Date helpers ─────────────────────────────────────────────────

const DAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function buildWeekDays(monday: Date): WeekDay[] {
  const today = formatDate(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    const dow = d.getDay() as DayOfWeek;
    return {
      date: formatDate(d),
      dayOfWeek: dow,
      label: `${DAY_LABELS_PT[dow]} ${d.getDate()}`,
      isToday: formatDate(d) === today,
    };
  });
}

// ── Conflict detection ───────────────────────────────────────────

function detectConflicts(entries: ScheduleEntry[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // Group by employee+date
  const byEmployeeDate = new Map<string, ScheduleEntry[]>();
  for (const e of entries) {
    const key = `${e.employee_id}::${e.date}`;
    const list = byEmployeeDate.get(key) ?? [];
    list.push(e);
    byEmployeeDate.set(key, list);
  }

  for (const [, group] of byEmployeeDate) {
    if (group.length > 1) {
      conflicts.push({
        type: "double_booking",
        message: `${group[0].employee_name} tem ${group.length} turnos em ${group[0].date}`,
        severity: "error",
        entry_ids: group.map((e) => e.id),
      });
    }
  }

  return conflicts;
}

// ── Coverage calculation ─────────────────────────────────────────

function calculateCoverage(
  days: WeekDay[],
  entries: ScheduleEntry[],
  templates: ShiftTemplate[],
): DayCoverage[] {
  return days.map((day) => {
    const dayEntries = entries.filter((e) => e.date === day.date);
    // Aggregate roles assigned
    const roleCount = new Map<StaffRole, number>();
    for (const e of dayEntries) {
      roleCount.set(e.employee_role, (roleCount.get(e.employee_role) ?? 0) + 1);
    }
    const assignedSlots: RoleSlot[] = Array.from(roleCount.entries()).map(
      ([role, count]) => ({ role, count }),
    );

    // Sum needed from active templates (simplified: assume all templates apply to all days)
    const needed = new Map<StaffRole, number>();
    for (const t of templates.filter((t) => t.is_active)) {
      for (const rs of t.roles_needed) {
        needed.set(rs.role, Math.max(needed.get(rs.role) ?? 0, rs.count));
      }
    }
    const templateSlots: RoleSlot[] = Array.from(needed.entries()).map(
      ([role, count]) => ({ role, count }),
    );

    const isCovered = templateSlots.every((ts) => {
      const assigned = assignedSlots.find((a) => a.role === ts.role);
      return assigned ? assigned.count >= ts.count : false;
    });

    return { date: day.date, templateSlots, assignedSlots, isCovered };
  });
}

// ── Mock employees for dev/trial ─────────────────────────────────

const IS_DEV = import.meta.env.DEV;

const MOCK_EMPLOYEES: import("../context/StaffCoreTypes").Employee[] = [
  { id: "mock-1", name: "Ana Ferreira", role: "waiter", position: "waiter", active: true, restaurant_id: "mock" },
  { id: "mock-2", name: "Rui Oliveira", role: "kitchen", position: "kitchen", active: true, restaurant_id: "mock" },
  { id: "mock-3", name: "João Costa", role: "manager", position: "manager", active: true, restaurant_id: "mock" },
  { id: "mock-4", name: "Sofia Martins", role: "cleaning", position: "cleaning", active: true, restaurant_id: "mock" },
  { id: "mock-5", name: "Pedro Silva", role: "waiter", position: "waiter", active: true, restaurant_id: "mock" },
  { id: "mock-6", name: "Maria Santos", role: "kitchen", position: "kitchen", active: true, restaurant_id: "mock" },
];

// ── Hook ─────────────────────────────────────────────────────────

export function useSchedule() {
  const { employees: realEmployees } = useStaff();

  // Use mock employees in dev when no real ones exist
  const employees = realEmployees.length > 0 ? realEmployees : (IS_DEV ? MOCK_EMPLOYEES : []);

  // Current week offset (0 = this week, +1 = next, -1 = last)
  const [weekOffset, setWeekOffset] = useState(0);

  // Data
  const [entries, setEntries] = useState<ScheduleEntry[]>(() =>
    loadFromStorage(STORAGE_KEY_ENTRIES, []),
  );
  const [templates, setTemplates] = useState<ShiftTemplate[]>(() =>
    loadFromStorage(STORAGE_KEY_TEMPLATES, DEFAULT_TEMPLATES),
  );

  // Persist on change
  useEffect(() => {
    saveToStorage(STORAGE_KEY_ENTRIES, entries);
  }, [entries]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_TEMPLATES, templates);
  }, [templates]);

  // Week navigation
  const monday = useMemo(() => {
    const now = new Date();
    const m = getMonday(now);
    return addDays(m, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(() => buildWeekDays(monday), [monday]);

  const weekEntries = useMemo(
    () =>
      entries.filter((e) => {
        return days.some((d) => d.date === e.date);
      }),
    [entries, days],
  );

  const conflicts = useMemo(() => detectConflicts(weekEntries), [weekEntries]);

  const coverage = useMemo(
    () => calculateCoverage(days, weekEntries, templates),
    [days, weekEntries, templates],
  );

  const weekSchedule: WeekSchedule = useMemo(
    () => ({
      weekStart: days[0]?.date ?? "",
      weekEnd: days[6]?.date ?? "",
      days,
      entries: weekEntries,
      conflicts,
      coverage,
    }),
    [days, weekEntries, conflicts, coverage],
  );

  // ── CRUD ─────────────────────────────────────────────────────

  const addEntry = useCallback(
    (params: {
      employee_id: string;
      date: string;
      template_id?: string;
      start_time?: string;
      end_time?: string;
      notes?: string;
    }) => {
      const emp = employees.find((e) => e.id === params.employee_id);
      if (!emp) return;

      const template = params.template_id
        ? templates.find((t) => t.id === params.template_id)
        : null;

      const entry: ScheduleEntry = {
        id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        restaurant_id: emp.restaurant_id,
        employee_id: emp.id,
        employee_name: emp.name,
        employee_role: emp.role,
        template_id: template?.id ?? null,
        template_name: template?.name ?? null,
        template_color: template?.color ?? "#6B7280",
        date: params.date,
        start_time: params.start_time ?? template?.start_time ?? "08:00",
        end_time: params.end_time ?? template?.end_time ?? "16:00",
        break_minutes: template?.break_minutes ?? 0,
        status: "draft" as ScheduleStatus,
        notes: params.notes ?? "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setEntries((prev) => [...prev, entry]);
      return entry;
    },
    [employees, templates],
  );

  const removeEntry = useCallback((entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const updateEntryStatus = useCallback(
    (entryId: string, status: ScheduleStatus) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, status, updated_at: new Date().toISOString() }
            : e,
        ),
      );
    },
    [],
  );

  const publishWeek = useCallback(() => {
    const weekDates = new Set(days.map((d) => d.date));
    setEntries((prev) =>
      prev.map((e) =>
        weekDates.has(e.date) && e.status === "draft"
          ? { ...e, status: "published" as ScheduleStatus, updated_at: new Date().toISOString() }
          : e,
      ),
    );
  }, [days]);

  const goNextWeek = useCallback(() => setWeekOffset((w) => w + 1), []);
  const goPrevWeek = useCallback(() => setWeekOffset((w) => w - 1), []);
  const goThisWeek = useCallback(() => setWeekOffset(0), []);

  return {
    weekSchedule,
    templates,
    employees,
    weekOffset,
    // Navigation
    goNextWeek,
    goPrevWeek,
    goThisWeek,
    // CRUD
    addEntry,
    removeEntry,
    updateEntryStatus,
    publishWeek,
  };
}
