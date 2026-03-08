/**
 * @vitest-environment jsdom
 *
 * DesktopInstallModal — unit tests
 * Validates that the modal shows correct content for TPV/KDS,
 * has the download / retry / navigate actions.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DesktopInstallModal } from "./DesktopInstallModal";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock platformDetection
vi.mock("../../../../core/operational/platformDetection", () => ({
  buildDeepLink: vi.fn(
    (app: string, params: Record<string, string>) =>
      `chefiapp://open?app=${app}&restaurant=${params.restaurant}`,
  ),
  getDesktopOS: vi.fn(() => "macos"),
}));

const BASE_PROPS = {
  moduleId: "tpv" as const,
  restaurantId: "rest-123",
  onDismiss: vi.fn(),
};

describe("DesktopInstallModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<DesktopInstallModal {...BASE_PROPS} />);
    expect(screen.getByText("Aplicación de escritorio necesaria")).toBeTruthy();
  });

  it("mentions the TPV module by name", () => {
    render(<DesktopInstallModal {...BASE_PROPS} />);
    expect(screen.getByText("TPV")).toBeTruthy();
  });

  it("mentions KDS for KDS module", () => {
    render(<DesktopInstallModal {...BASE_PROPS} moduleId="kds" />);
    expect(screen.getByText("KDS")).toBeTruthy();
  });

  it("shows 'en desarrollo' notice when RELEASES_AVAILABLE=false", () => {
    render(<DesktopInstallModal {...BASE_PROPS} />);
    expect(
      screen.getByText(/aplicación de escritorio está en desarrollo/),
    ).toBeTruthy();
  });

  it("shows early access mailto link", () => {
    render(<DesktopInstallModal {...BASE_PROPS} />);
    const link = screen.getByText(/Solicitar acceso anticipado/);
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).href).toContain("mailto:");
  });

  it("has a retry button", () => {
    render(<DesktopInstallModal {...BASE_PROPS} />);
    expect(screen.getByText(/reintentar/i)).toBeTruthy();
  });

  it("has a 'Ir a Dispositivos' button", () => {
    render(<DesktopInstallModal {...BASE_PROPS} />);
    expect(screen.getByText("Ir a Dispositivos")).toBeTruthy();
  });

  it("has a close button", () => {
    render(<DesktopInstallModal {...BASE_PROPS} />);
    expect(screen.getByText("Cerrar")).toBeTruthy();
  });
});
