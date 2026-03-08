import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  clearTabIsolated,
  getAllTabIsolatedKeys,
  getTabIsolated,
  removeTabIsolated,
  setTabIsolated,
} from "./TabIsolatedStorage";

/**
 * Simple in-memory mock for Web Storage API
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
    Object.keys(this).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (this as Record<string, unknown>)[key];
    });
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
    Object.defineProperty(this, key, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var sessionStorage: Storage | undefined;
  // eslint-disable-next-line no-var
  var localStorage: Storage | undefined;
}

describe("TabIsolatedStorage", () => {
  let sessionMock: MemoryStorage;
  let localMock: MemoryStorage;

  beforeEach(() => {
    sessionMock = new MemoryStorage();
    localMock = new MemoryStorage();

    // @ts-expect-error jsdom globals override
    global.sessionStorage = sessionMock;
    // @ts-expect-error jsdom globals override
    global.localStorage = localMock;

    vi.restoreAllMocks();
  });

  it("migra valores de localStorage para sessionStorage no primeiro get", () => {
    localMock.setItem("chefiapp_restaurant_id", "rest-1");

    const value = getTabIsolated("chefiapp_restaurant_id");

    expect(value).toBe("rest-1");
    expect(sessionMock.getItem("chefiapp_restaurant_id")).toBe("rest-1");
    // Flag de migração deve ser marcada
    expect(sessionMock.getItem("chefiapp_storage_migrated_v1")).toBe("true");
  });

  it("devolve sempre o valor de sessionStorage quando existir", () => {
    sessionMock.setItem("chefiapp_storage_migrated_v1", "true");
    sessionMock.setItem("chefiapp_restaurant_id", "from-session");
    localMock.setItem("chefiapp_restaurant_id", "from-local");

    const value = getTabIsolated("chefiapp_restaurant_id");

    expect(value).toBe("from-session");
  });

  it("faz fallback a localStorage quando não existe em sessionStorage e volta a migrar", () => {
    sessionMock.setItem("chefiapp_storage_migrated_v1", "true");
    localMock.setItem("chefiapp_active_order_id", "order-123");

    const value = getTabIsolated("chefiapp_active_order_id");

    expect(value).toBe("order-123");
    expect(sessionMock.getItem("chefiapp_active_order_id")).toBe("order-123");
  });

  it("setTabIsolated escreve em sessionStorage e tenta escrever em localStorage", () => {
    setTabIsolated("chefiapp_active_tenant", "tenant-1");

    expect(sessionMock.getItem("chefiapp_active_tenant")).toBe("tenant-1");
    expect(localMock.getItem("chefiapp_active_tenant")).toBe("tenant-1");
  });

  it("setTabIsolated continua a funcionar mesmo se localStorage falhar", () => {
    const failingLocal = new MemoryStorage();
    failingLocal.setItem = vi.fn(() => {
      throw new Error("quota exceeded");
    });

    // @ts-expect-error override
    global.localStorage = failingLocal;

    setTabIsolated("chefiapp_trial_mode", "true");

    expect(sessionMock.getItem("chefiapp_trial_mode")).toBe("true");
    expect(failingLocal.setItem).toHaveBeenCalled();
  });

  it("removeTabIsolated remove da sessionStorage e da localStorage", () => {
    sessionMock.setItem("chefiapp_country", "br");
    localMock.setItem("chefiapp_country", "br");

    removeTabIsolated("chefiapp_country");

    expect(sessionMock.getItem("chefiapp_country")).toBeNull();
    expect(localMock.getItem("chefiapp_country")).toBeNull();
  });

  it("clearTabIsolated remove apenas chaves com prefixo chefiapp_", () => {
    sessionMock.setItem("chefiapp_storage_migrated_v1", "true");
    sessionMock.setItem("chefiapp_restaurant_id", "rest-1");
    sessionMock.setItem("chefiapp_other", "x");
    sessionMock.setItem("unrelated_key", "keep-me");

    clearTabIsolated();

    expect(sessionMock.getItem("chefiapp_restaurant_id")).toBeNull();
    expect(sessionMock.getItem("chefiapp_other")).toBeNull();
    expect(sessionMock.getItem("chefiapp_storage_migrated_v1")).toBeNull();
    expect(sessionMock.getItem("unrelated_key")).toBe("keep-me");
  });

  it("getAllTabIsolatedKeys devolve apenas chaves com prefixo chefiapp_", () => {
    sessionMock.setItem("chefiapp_storage_migrated_v1", "true");
    sessionMock.setItem("chefiapp_restaurant_id", "rest-1");
    sessionMock.setItem("chefiapp_active_order_id", "order-1");
    sessionMock.setItem("other_key", "ignore");

    const keys = getAllTabIsolatedKeys().sort();

    expect(keys).toEqual(
      ["chefiapp_storage_migrated_v1", "chefiapp_restaurant_id", "chefiapp_active_order_id"].sort(),
    );
  });
});

