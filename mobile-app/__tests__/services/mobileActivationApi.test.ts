jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-constants", () => ({
  expoConfig: { version: "1.0.0", name: "ChefiApp" },
  deviceName: "Test Device",
}));

// Keys used by mobileActivationApi (for getActivationSession / clear tests)
const ACCESS_TOKEN_KEY = "mobile_activation_access_token";
const REFRESH_TOKEN_KEY = "mobile_activation_refresh_token";
const PRINCIPAL_KEY = "mobile_activation_principal";

import * as SecureStore from "expo-secure-store";
import {
  getOrCreateInstallId,
  activateWithQrPin,
  getActivationSession,
  clearActivationSession,
} from "../../services/mobileActivationApi";

describe("mobileActivationApi storage boot safety", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns existing install id when present", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("iid_existing");

    const result = await getOrCreateInstallId();

    expect(result).toBe("iid_existing");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("creates install id even when SecureStore read/write fail", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
      new Error("read failed"),
    );
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
      new Error("write failed"),
    );

    const result = await getOrCreateInstallId();

    expect(result.startsWith("iid_")).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });
});

// ─── Fase 3 / C4.1: role from backend (contract: role never from token/QR/PIN) ───
describe("Fase 3 / C4.1: role from backend", () => {
  const mockPrincipal = {
    roles: ["waiter"],
    modulesEnabled: ["orders"],
    permissions: ["read:orders"],
  };
  const mockResponse = {
    status: "activated",
    restaurantId: "rest-1",
    staffMemberId: "staff-1",
    session: {
      accessToken: "at",
      refreshToken: "rt",
      expiresIn: 3600,
    },
    principal: mockPrincipal,
    bootstrap: {
      featureFlags: { deliveryModule: false, offlineOutbox: false },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    }) as jest.Mock;
  });

  it("returns principal.roles from backend response, not from token or PIN", async () => {
    const activationToken = "token-xyz-no-role-here";
    const pin = "123456";

    const result = await activateWithQrPin({ activationToken, pin });

    expect(result.principal.roles).toEqual(["waiter"]);
    expect(result.principal).toEqual(mockPrincipal);
    expect(activationToken).not.toContain("waiter");
    expect(pin).not.toContain("waiter");
  });

  it("persists principal to SecureStore (PRINCIPAL_KEY) after activation", async () => {
    await activateWithQrPin({ activationToken: "t", pin: "123456" });

    const setCalls = (SecureStore.setItemAsync as jest.Mock).mock.calls;
    const principalCall = setCalls.find(
      (call: [string, string]) =>
        call[0] === PRINCIPAL_KEY || call[1].includes('"roles":["waiter"]'),
    );
    expect(principalCall).toBeDefined();
    expect(JSON.parse(principalCall[1])).toEqual(mockPrincipal);
  });
});

// ─── Recovery / reinstall (clear session, corrupted principal) ───
describe("recovery / reinstall", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clearActivationSession removes session; getActivationSession returns null when no accessToken", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

    await clearActivationSession();
    const session = await getActivationSession();

    expect(session).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("getActivationSession returns principal when store has valid session", async () => {
    const principal = { roles: ["manager"], modulesEnabled: [], permissions: [] };
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === ACCESS_TOKEN_KEY) return Promise.resolve("at");
      if (key === REFRESH_TOKEN_KEY) return Promise.resolve("rt");
      if (key === PRINCIPAL_KEY) return Promise.resolve(JSON.stringify(principal));
      return Promise.resolve(null);
    });

    const session = await getActivationSession();

    expect(session).not.toBeNull();
    expect(session!.principal).toEqual(principal);
    expect(session!.accessToken).toBe("at");
  });

  it("getActivationSession returns principal null when PRINCIPAL_KEY is corrupted JSON", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === ACCESS_TOKEN_KEY) return Promise.resolve("at");
      if (key === REFRESH_TOKEN_KEY) return Promise.resolve("rt");
      if (key === PRINCIPAL_KEY) return Promise.resolve("invalid-json");
      return Promise.resolve(null);
    });

    const session = await getActivationSession();

    expect(session).not.toBeNull();
    expect(session!.principal).toBeNull();
    expect(session!.accessToken).toBe("at");
  });
});

// ─── Activation flow (integration: activate → persist → read; clear → null) ───
describe("activation flow (integration)", () => {
  const mockResponse = {
    status: "activated",
    restaurantId: "r1",
    staffMemberId: "s1",
    session: { accessToken: "at", refreshToken: "rt", expiresIn: 3600 },
    principal: { roles: ["waiter"], modulesEnabled: [], permissions: [] },
    bootstrap: { featureFlags: { deliveryModule: false, offlineOutbox: false } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    }) as jest.Mock;
  });

  it("activateWithQrPin then getActivationSession returns persisted principal (flow evidence)", async () => {
    await activateWithQrPin({ activationToken: "t", pin: "123456" });

    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === ACCESS_TOKEN_KEY) return Promise.resolve("at");
      if (key === REFRESH_TOKEN_KEY) return Promise.resolve("rt");
      if (key === PRINCIPAL_KEY)
        return Promise.resolve(JSON.stringify(mockResponse.principal));
      return Promise.resolve(null);
    });

    const session = await getActivationSession();

    expect(session).not.toBeNull();
    expect(session!.principal).toEqual(mockResponse.principal);
  });

  it("clearActivationSession then getActivationSession returns null (reinstall evidence)", async () => {
    await clearActivationSession();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const session = await getActivationSession();

    expect(session).toBeNull();
  });
});
