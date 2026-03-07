import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminTopbar } from "./AdminTopbar";

const signOutMock = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}));

vi.mock("../../../../core/auth/authAdapter", () => ({
  getAuthActions: () => ({ signOut: signOutMock }),
}));

vi.mock("../../../../core/auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "test-user-1",
      email: "owner@test.local",
      user_metadata: { name: "Test Owner", role: "owner" },
    },
  }),
}));

vi.mock("../../../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: {
      name: "Sofia Gastrobar",
      logoUrl: null,
      environmentLabel: "TEST",
    },
  }),
}));

describe("AdminTopbar", () => {
  beforeEach(() => {
    signOutMock.mockReset();
  });

  it("uses readable fallback labels in dropdown when translation key is missing", () => {
    render(
      <MemoryRouter>
        <AdminTopbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /topbar\.userMenu/i }));

    expect(screen.getByText("Proprietário")).toBeTruthy();
    expect(screen.getByText("Minha conta")).toBeTruthy();
    expect(screen.getByText("Sair")).toBeTruthy();
  });
});
