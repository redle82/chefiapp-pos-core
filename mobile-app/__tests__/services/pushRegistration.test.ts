import { PushNotifications } from "../../lib/pushNotifications";
import { registerPushTokenForUser } from "../../services/pushRegistration";

jest.mock("../../lib/pushNotifications", () => ({
  PushNotifications: {
    registerForPushNotifications: jest.fn(),
    savePushToken: jest.fn(),
  },
}));

describe("registerPushTokenForUser", () => {
  const mockPush = PushNotifications as jest.Mocked<typeof PushNotifications>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when userId is missing", async () => {
    const result = await registerPushTokenForUser("");
    expect(result).toBeNull();
    expect(mockPush.registerForPushNotifications).not.toHaveBeenCalled();
  });

  it("registers and saves token for a user", async () => {
    mockPush.registerForPushNotifications.mockResolvedValue({
      token: "expo-token",
      platform: "ios",
    });

    const result = await registerPushTokenForUser("user-123");

    expect(mockPush.registerForPushNotifications).toHaveBeenCalled();
    expect(mockPush.savePushToken).toHaveBeenCalledWith(
      "user-123",
      "expo-token",
    );
    expect(result).toEqual({ token: "expo-token", platform: "ios" });
  });

  it("does not save when registration returns null", async () => {
    mockPush.registerForPushNotifications.mockResolvedValue(null);

    const result = await registerPushTokenForUser("user-123");

    expect(mockPush.savePushToken).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
