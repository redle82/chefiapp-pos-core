/**
 * Tests for core/ritual/ritualBeforeOpenStorage.ts
 *
 * Covers: loadStored, saveStored, seedIfEmpty, getBeforeOpenRitualTasks,
 * markRitualTaskDone, isBeforeOpenRitualComplete — localStorage-backed.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getBeforeOpenRitualTasks,
  isBeforeOpenRitualComplete,
  markRitualTaskDone,
} from "./ritualBeforeOpenStorage";
import { BEFORE_OPEN_TASK_KEYS } from "./ritualTaskTypes";

const RID = "restaurant-test-001";
const STORAGE_KEY = `chefiapp_ritual_tasks_${RID}`;

describe("ritualBeforeOpenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── getBeforeOpenRitualTasks ──────────────────────────────────────
  describe("getBeforeOpenRitualTasks", () => {
    it("returns empty array for empty restaurantId", () => {
      expect(getBeforeOpenRitualTasks("")).toEqual([]);
    });

    it("seeds and returns 2 tasks when localStorage is empty", () => {
      const tasks = getBeforeOpenRitualTasks(RID);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].key).toBe(BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO);
      expect(tasks[1].key).toBe(BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO);
      expect(tasks[0].status).toBe("pending");
      expect(tasks[1].status).toBe("pending");
    });

    it("reads persisted state from localStorage", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO]: "done",
          [BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO]: "pending",
        }),
      );
      const tasks = getBeforeOpenRitualTasks(RID);
      expect(tasks[0].status).toBe("done");
      expect(tasks[1].status).toBe("pending");
    });

    it("overrides abrir_turno to 'done' when isShiftOpen is true", () => {
      const tasks = getBeforeOpenRitualTasks(RID, true);
      expect(tasks[1].key).toBe(BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO);
      expect(tasks[1].status).toBe("done");
    });

    it("keeps abrir_turno pending when isShiftOpen is false", () => {
      const tasks = getBeforeOpenRitualTasks(RID, false);
      expect(tasks[1].status).toBe("pending");
    });

    it("handles corrupt JSON in localStorage gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "not valid json{{{");
      const tasks = getBeforeOpenRitualTasks(RID);
      // Should fallback to empty, then seed
      expect(tasks).toHaveLength(2);
      expect(tasks[0].status).toBe("pending");
    });

    it("handles non-object JSON in localStorage", () => {
      localStorage.setItem(STORAGE_KEY, '"just a string"');
      const tasks = getBeforeOpenRitualTasks(RID);
      expect(tasks).toHaveLength(2);
    });

    it("handles null JSON in localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "null");
      const tasks = getBeforeOpenRitualTasks(RID);
      expect(tasks).toHaveLength(2);
    });

    it("returns tasks with correct structure", () => {
      const tasks = getBeforeOpenRitualTasks(RID);
      for (const task of tasks) {
        expect(task.id).toMatch(/^ritual-before_open-/);
        expect(task.role).toBe("manager");
        expect(task.moment).toBe("before_open");
        expect(task.type).toBe("mandatory");
        expect(task.label).toBeTruthy();
      }
    });
  });

  // ── markRitualTaskDone ──────────────────────────────────────────
  describe("markRitualTaskDone", () => {
    it("marks a specific task as done", () => {
      getBeforeOpenRitualTasks(RID); // seed
      markRitualTaskDone(RID, BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO);
      const tasks = getBeforeOpenRitualTasks(RID);
      expect(tasks[0].status).toBe("done");
    });

    it("does nothing with empty restaurantId", () => {
      markRitualTaskDone("", BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO);
      // No error thrown
    });

    it("does nothing with empty key", () => {
      markRitualTaskDone(RID, "");
      // No error thrown
    });
  });

  // ── isBeforeOpenRitualComplete ──────────────────────────────────
  describe("isBeforeOpenRitualComplete", () => {
    it("returns false for empty restaurantId", () => {
      expect(isBeforeOpenRitualComplete("")).toBe(false);
    });

    it("returns false when no tasks are done", () => {
      expect(isBeforeOpenRitualComplete(RID)).toBe(false);
    });

    it("returns false when only one task is done", () => {
      markRitualTaskDone(RID, BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO);
      expect(isBeforeOpenRitualComplete(RID)).toBe(false);
    });

    it("returns true when all tasks are done", () => {
      getBeforeOpenRitualTasks(RID); // seed
      markRitualTaskDone(RID, BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO);
      markRitualTaskDone(RID, BEFORE_OPEN_TASK_KEYS.ABRIR_TURNO);
      expect(isBeforeOpenRitualComplete(RID)).toBe(true);
    });

    it("returns true when validar done AND shift is open", () => {
      markRitualTaskDone(RID, BEFORE_OPEN_TASK_KEYS.VALIDAR_PRONTO);
      expect(isBeforeOpenRitualComplete(RID, true)).toBe(true);
    });

    it("returns false when only shift is open but validar not done", () => {
      expect(isBeforeOpenRitualComplete(RID, true)).toBe(false);
    });
  });
});
