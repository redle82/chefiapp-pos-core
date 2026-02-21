// @ts-nocheck
const needsLocalStorageShim =
  !globalThis.localStorage ||
  typeof globalThis.localStorage.getItem !== "function" ||
  typeof globalThis.localStorage.setItem !== "function";

if (needsLocalStorageShim) {
  const store: Record<string, string> = {};

  globalThis.localStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}
