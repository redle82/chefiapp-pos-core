/**
 * SchedulePage — Calendário Semanal de Escalas (Sprint 2 MVP).
 *
 * Grid: empregados (linhas) × dias da semana (colunas).
 * Clicar numa célula abre picker de template.
 * Coverage row mostra se o dia está coberto.
 */

import { useState, useCallback } from "react";
import { useSchedule } from "../hooks/useSchedule";
import type { ShiftTemplate } from "../context/ScheduleTypes";
import type { Employee } from "../context/StaffCoreTypes";
import styles from "./SchedulePage.module.css";

// ── Role labels ──────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: "Dono",
  manager: "Gerente",
  waiter: "Garçom",
  kitchen: "Cozinha",
  cleaning: "Limpeza",
  worker: "Staff",
};

// ── Component ────────────────────────────────────────────────────

export function SchedulePage() {
  const {
    weekSchedule,
    templates,
    employees,
    weekOffset,
    goNextWeek,
    goPrevWeek,
    goThisWeek,
    addEntry,
    removeEntry,
    publishWeek,
  } = useSchedule();

  const { days, entries, conflicts, coverage } = weekSchedule;

  // Modal state
  const [picker, setPicker] = useState<{
    employeeId: string;
    date: string;
  } | null>(null);

  const handleCellClick = useCallback(
    (employeeId: string, date: string) => {
      // Se já tem entrada neste dia, não abre picker
      const existing = entries.find(
        (e) => e.employee_id === employeeId && e.date === date,
      );
      if (existing) return;
      setPicker({ employeeId, date });
    },
    [entries],
  );

  const handleSelectTemplate = useCallback(
    (template: ShiftTemplate) => {
      if (!picker) return;
      addEntry({
        employee_id: picker.employeeId,
        date: picker.date,
        template_id: template.id,
      });
      setPicker(null);
    },
    [picker, addEntry],
  );

  const activeEmployees = employees.filter((e) => e.active);

  // Draft count
  const draftCount = entries.filter((e) => e.status === "draft").length;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Escalas</h2>
          <span className={styles.weekLabel}>
            {days[0]?.date.slice(5)} — {days[6]?.date.slice(5)}
          </span>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.navBtn} onClick={goPrevWeek}>
            ◀
          </button>
          {weekOffset !== 0 && (
            <button className={styles.todayBtn} onClick={goThisWeek}>
              Hoje
            </button>
          )}
          <button className={styles.navBtn} onClick={goNextWeek}>
            ▶
          </button>
          {draftCount > 0 && (
            <button className={styles.publishBtn} onClick={publishWeek}>
              Publicar ({draftCount})
            </button>
          )}
        </div>
      </div>

      {/* Conflicts banner */}
      {conflicts.length > 0 && (
        <div className={styles.conflictsBanner}>
          ⚠️ {conflicts.length} conflito{conflicts.length !== 1 ? "s" : ""}:{" "}
          {conflicts[0]?.message}
          {conflicts.length > 1 && ` (+${conflicts.length - 1} mais)`}
        </div>
      )}

      {/* Empty state */}
      {activeEmployees.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>Sem colaboradores</div>
          <div className={styles.emptyHint}>
            Adicione colaboradores em Definições → Equipa para começar a criar
            escalas.
          </div>
        </div>
      ) : (
        /* Calendar grid */
        <div className={styles.grid}>
          {/* Corner */}
          <div className={styles.cornerCell}>Equipa</div>

          {/* Day headers */}
          {days.map((day) => (
            <div
              key={day.date}
              className={
                day.isToday ? styles.dayHeaderToday : styles.dayHeader
              }
            >
              {day.label}
            </div>
          ))}

          {/* Employee rows */}
          {activeEmployees.map((emp) => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              days={days}
              entries={entries.filter((e) => e.employee_id === emp.id)}
              onCellClick={handleCellClick}
              onRemoveEntry={removeEntry}
            />
          ))}

          {/* Coverage row */}
          <div className={styles.coverageLabel}>Cobertura</div>
          {coverage.map((c) => {
            const total = c.templateSlots.reduce((s, r) => s + r.count, 0);
            const filled = c.assignedSlots.reduce((s, r) => s + r.count, 0);
            const cls =
              total === 0
                ? styles.coverageCell
                : c.isCovered
                  ? styles.coverageFull
                  : filled > 0
                    ? styles.coveragePartial
                    : styles.coverageEmpty;
            return (
              <div key={c.date} className={cls}>
                {filled}/{total}
              </div>
            );
          })}
        </div>
      )}

      {/* Template picker modal */}
      {picker && (
        <TemplatePicker
          templates={templates.filter((t) => t.is_active)}
          employeeName={
            employees.find((e) => e.id === picker.employeeId)?.name ?? ""
          }
          date={picker.date}
          onSelect={handleSelectTemplate}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

// ── Employee Row ─────────────────────────────────────────────────

function EmployeeRow({
  employee,
  days,
  entries,
  onCellClick,
  onRemoveEntry,
}: {
  employee: Employee;
  days: typeof WeekDayArray;
  entries: ReturnType<typeof useSchedule>["weekSchedule"]["entries"];
  onCellClick: (empId: string, date: string) => void;
  onRemoveEntry: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.employeeLabel}>
        <span className={styles.employeeName}>{employee.name}</span>
        <span className={styles.employeeRole}>
          {ROLE_LABELS[employee.role] ?? employee.role}
        </span>
      </div>

      {days.map((day) => {
        const entry = entries.find((e) => e.date === day.date);
        return (
          <div
            key={day.date}
            className={day.isToday ? styles.dayCellToday : styles.dayCell}
            onClick={() => onCellClick(employee.id, day.date)}
          >
            {entry ? (
              <div
                className={
                  entry.status === "draft"
                    ? styles.statusDraft
                    : styles.statusPublished
                }
                style={{ backgroundColor: `${entry.template_color}22`, borderColor: entry.template_color }}
              >
                <span style={{ color: entry.template_color ?? "#fff" }}>
                  {entry.template_name ?? "Custom"}
                </span>
                <span className={styles.shiftChipTime}>
                  {entry.start_time}–{entry.end_time}
                </span>
                <button
                  className={styles.shiftChipRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveEntry(entry.id);
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <span className={styles.addHint}>+</span>
            )}
          </div>
        );
      })}
    </>
  );
}

// Type helper for days prop
type WeekDayArray = ReturnType<typeof useSchedule>["weekSchedule"]["days"];

// ── Template Picker Modal ────────────────────────────────────────

function TemplatePicker({
  templates,
  employeeName,
  date,
  onSelect,
  onClose,
}: {
  templates: ShiftTemplate[];
  employeeName: string;
  date: string;
  onSelect: (t: ShiftTemplate) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Adicionar turno</h3>
        <p className={styles.modalSub}>
          {employeeName} — {date.slice(5).replace("-", "/")}
        </p>

        {templates.map((t) => (
          <button
            key={t.id}
            className={styles.templateOption}
            onClick={() => onSelect(t)}
          >
            <div
              className={styles.templateDot}
              style={{ backgroundColor: t.color }}
            />
            <div>
              <div className={styles.templateName}>{t.name}</div>
              <div className={styles.templateTime}>
                {t.start_time} – {t.end_time}
                {t.break_minutes > 0 && ` (${t.break_minutes}min pausa)`}
              </div>
            </div>
          </button>
        ))}

        <button className={styles.modalCancel} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
