/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import {
  isAdminRoute,
  shouldEnablePwaInstallability,
  syncManifestLinkForRoute,
} from "./installabilityPolicy";

describe("installabilityPolicy", () => {
  it("detects admin route boundaries", () => {
    expect(isAdminRoute("/admin")).toBe(true);
    expect(isAdminRoute("/admin/desktop")).toBe(true);
    expect(isAdminRoute("/admin/devices")).toBe(true);
    expect(isAdminRoute("/app/staff/home")).toBe(false);
    expect(isAdminRoute("/dashboard")).toBe(false);
  });

  it("enables installability only on AppStaff routes", () => {
    expect(shouldEnablePwaInstallability("/app/staff")).toBe(false);
    expect(shouldEnablePwaInstallability("/app/staff/home")).toBe(false);
    expect(shouldEnablePwaInstallability("/admin/modules")).toBe(false);
  });

  it("removes manifest on admin and staff routes", () => {
    document.head.innerHTML =
      '<link rel="manifest" href="/manifest.webmanifest" />';

    syncManifestLinkForRoute("/admin/modules");
    expect(document.head.querySelector('link[rel="manifest"]')).toBeNull();

    document.head.innerHTML =
      '<link rel="manifest" href="/manifest.webmanifest" />';
    syncManifestLinkForRoute("/app/staff/home");
    expect(document.head.querySelector('link[rel="manifest"]')).toBeNull();
  });
});
