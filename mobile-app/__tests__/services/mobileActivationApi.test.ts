jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  expoConfig: { version: "1.0.0", name: "ChefiApp" },
  deviceName: "Test Device",
}));

import * as SecureStore from "expo-secure-store";
import { getOrCreateInstallId } from "../../services/mobileActivationApi";

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
