/**
 * Unit: SelectTenantPage — 0 / 1 / N tenants
 * Contrato: TENANT_SELECTION_CONTRACT
 * Cenários: loading, 0 → /bootstrap, 1 → auto-select + /dashboard, >1 → lista + escolha
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SelectTenantPage } from "./SelectTenantPage";

const mockSwitchTenant = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../core/tenant/TenantContext", () => ({
  useTenant: () => mockUseTenantReturn,
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockUseTenantReturn: {
  memberships: {
    restaurant_id: string;
    restaurant_name?: string;
    role: string;
  }[];
  isLoading: boolean;
  switchTenant: (id: string) => void;
  tenantId: string | null;
  isMultiTenant?: boolean;
  getCurrentTenantName?: () => string | null;
} = {
  memberships: [],
  isLoading: true,
  switchTenant: vi.fn(),
  tenantId: null,
};

const BootstrapPlaceholder = () => <div>Bootstrap</div>;
const DashboardPlaceholder = () => <div>Dashboard</div>;

describe("SelectTenantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading when isLoading is true", () => {
    mockUseTenantReturn = {
      memberships: [],
      isLoading: true,
      switchTenant: mockSwitchTenant,
      tenantId: null,
    };
    render(
      <MemoryRouter initialEntries={["/app/select-tenant"]}>
        <Routes>
          <Route path="/app/select-tenant" element={<SelectTenantPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/A carregar|Loading|common:selectTenant.loading/i),
    ).toBeTruthy();
  });

  it("redirects to /bootstrap when memberships.length === 0", async () => {
    mockUseTenantReturn = {
      memberships: [],
      isLoading: false,
      switchTenant: mockSwitchTenant,
      tenantId: null,
    };
    render(
      <MemoryRouter initialEntries={["/app/select-tenant"]}>
        <Routes>
          <Route path="/app/select-tenant" element={<SelectTenantPage />} />
          <Route path="/bootstrap" element={<BootstrapPlaceholder />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Bootstrap")).toBeTruthy();
    });
  });

  it("calls switchTenant and navigates to /dashboard when memberships.length === 1", async () => {
    const restaurantId = "rest-1";
    mockUseTenantReturn = {
      memberships: [
        {
          restaurant_id: restaurantId,
          restaurant_name: "Rest 1",
          role: "owner",
        },
      ],
      isLoading: false,
      switchTenant: mockSwitchTenant,
      tenantId: null,
    };
    render(
      <MemoryRouter initialEntries={["/app/select-tenant"]}>
        <Routes>
          <Route path="/app/select-tenant" element={<SelectTenantPage />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(mockSwitchTenant).toHaveBeenCalledWith(restaurantId);
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      });
    });
  });

  it("renders TenantSelector (Seus Restaurantes) when memberships.length > 1", () => {
    mockUseTenantReturn = {
      memberships: [
        { restaurant_id: "r1", restaurant_name: "Rest 1", role: "owner" },
        { restaurant_id: "r2", restaurant_name: "Rest 2", role: "manager" },
      ],
      isLoading: false,
      switchTenant: mockSwitchTenant,
      tenantId: null,
      isMultiTenant: true,
      getCurrentTenantName: () => null,
    };
    render(
      <MemoryRouter initialEntries={["/app/select-tenant"]}>
        <Routes>
          <Route path="/app/select-tenant" element={<SelectTenantPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Seus Restaurantes")).toBeTruthy();
  });
});
