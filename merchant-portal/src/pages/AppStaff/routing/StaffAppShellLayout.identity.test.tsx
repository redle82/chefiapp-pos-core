import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffAppShellLayout } from "./StaffAppShellLayout";

let mockedStaff = {
  activeRole: "owner",
  activeWorkerId: "00000000-0000-0000-0000-000000000100",
  shiftState: "active",
  activeLocation: { id: "loc-1", name: "Sala" },
  specDrifts: [],
  tasks: [],
  roleSource: "login",
};

let mockedIdentity = {
  name: "Sofia Gastrobar",
  logoUrl: null,
};

vi.mock("../context/StaffContext", () => ({
  useStaff: () => mockedStaff,
}));

vi.mock("../../../core/health/useCoreHealth", () => ({
  useCoreHealth: () => ({ status: "UP" }),
}));

vi.mock("../../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: mockedIdentity,
  }),
}));

vi.mock("../../../ui/OfflineIndicator", () => ({
  OfflineIndicator: () => null,
}));

vi.mock("../AppStaffBootScreen", () => ({
  AppStaffBootScreen: () => <div>boot</div>,
}));

describe("StaffAppShellLayout identity", () => {
  beforeEach(() => {
    sessionStorage.setItem("chefiapp_staff_boot_shown", "1");
    mockedStaff = {
      activeRole: "owner",
      activeWorkerId: "00000000-0000-0000-0000-000000000100",
      shiftState: "active",
      activeLocation: { id: "loc-1", name: "Sala" },
      specDrifts: [],
      tasks: [],
      roleSource: "login",
    };
    mockedIdentity = {
      name: "Sofia Gastrobar",
      logoUrl: null,
    };
  });

  it("renders shell header and home role label", () => {
    render(
      <MemoryRouter initialEntries={["/app/staff/home/owner"]}>
        <StaffAppShellLayout>
          <div>content</div>
        </StaffAppShellLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: "Sofia Gastrobar" })).toBeTruthy();
    expect(screen.getByText(/Staff/i)).toBeTruthy();
  });

  it("uses operator profile fallback when role source is invite worker", () => {
    mockedStaff = {
      ...mockedStaff,
      activeRole: "worker",
      roleSource: "invite",
    };

    render(
      <MemoryRouter initialEntries={["/app/staff/home/worker"]}>
        <StaffAppShellLayout>
          <div>content</div>
        </StaffAppShellLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Staff/i)).toBeTruthy();
    expect(screen.getByText("Início")).toBeTruthy();
  });

  it("does not crash when role is outside bottom-nav map", () => {
    mockedStaff = {
      ...mockedStaff,
      activeRole: "delivery",
      roleSource: "invite",
    };

    render(
      <MemoryRouter initialEntries={["/app/staff/home/delivery/orders"]}>
        <StaffAppShellLayout>
          <div>content</div>
        </StaffAppShellLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.getByText("Mais")).toBeTruthy();
  });
});
