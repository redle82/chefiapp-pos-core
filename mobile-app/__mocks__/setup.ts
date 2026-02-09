/**
 * Mock setup for mobile-app tests.
 * Stubs native modules that don't exist in Node.
 */

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// react-native-tcp-socket mock
jest.mock("react-native-tcp-socket", () => ({
  __esModule: true,
  default: {
    createConnection: jest.fn(() => ({
      on: jest.fn(),
      write: jest.fn(),
      destroy: jest.fn(),
      end: jest.fn(),
    })),
  },
}));

// react-native Alert mock
jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: "ios" },
}));

// expo-network mock
jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
}));

// esc-pos-encoder mock
jest.mock("esc-pos-encoder", () => {
  class MockEncoder {
    private _result: number[] = [];
    initialize() {
      return this;
    }
    align(_pos: string) {
      return this;
    }
    bold(_on: boolean) {
      return this;
    }
    line(_text: string) {
      return this;
    }
    text(_text: string) {
      return this;
    }
    newline() {
      return this;
    }
    cut() {
      return this;
    }
    encode() {
      return new Uint8Array(this._result);
    }
  }
  return { __esModule: true, default: MockEncoder };
});

// Supabase mock
jest.mock("../services/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        eq: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null }),
      ),
    },
  },
}));
