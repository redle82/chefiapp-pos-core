import { describe, it, expect } from "vitest";
import { getKeycloakConfig, type KeycloakAuthState } from "./authKeycloak";

describe("authKeycloak", () => {
  describe("getKeycloakConfig", () => {
    it("returns config with baseUrl, realm and clientId", () => {
      const config = getKeycloakConfig();
      expect(config).toHaveProperty("baseUrl");
      expect(config).toHaveProperty("realm");
      expect(config).toHaveProperty("clientId");
      expect(typeof config.baseUrl).toBe("string");
      expect(typeof config.realm).toBe("string");
      expect(typeof config.clientId).toBe("string");
    });
  });

  describe("KeycloakAuthState", () => {
    it("is a valid type for session state", () => {
      const state: KeycloakAuthState = {
        session: { access_token: "token" },
        user: { id: "u1", email: "a@b.com" },
      };
      expect(state.session?.access_token).toBe("token");
      expect(state.user?.id).toBe("u1");
    });
  });
});
