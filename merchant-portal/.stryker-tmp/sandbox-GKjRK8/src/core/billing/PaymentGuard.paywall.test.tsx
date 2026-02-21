/**
 * Teste: PaymentGuard mostra paywall (GlobalBlockedView) quando trial expirado.
 * FASE 2 pós-vendável: garantir que "Período de trial terminado" e "Escolher plano" aparecem.
 */

import "../../i18n";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PaymentGuard } from "./PaymentGuard";

const mockGetBillingStatusWithTrial = vi.fn();
const mockGetTabIsolated = vi.fn();

vi.mock("./coreBillingApi", () => ({
  getBillingStatusWithTrial: (id: string) => mockGetBillingStatusWithTrial(id),
}));

vi.mock("../storage/TabIsolatedStorage", () => ({
  getTabIsolated: (key: string) => mockGetTabIsolated(key),
}));

describe("PaymentGuard — paywall trial expirado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra paywall 'Período de trial terminado' e ação 'Escolher plano' quando trial_expired", async () => {
    mockGetTabIsolated.mockReturnValue("00000000-0000-0000-0000-000000000001");
    mockGetBillingStatusWithTrial.mockResolvedValue({
      status: "trial",
      trial_ends_at: "2020-01-01T00:00:00Z",
      trial_expired: true,
    });

    render(
      <MemoryRouter initialEntries={["/app/staff/home"]}>
        <PaymentGuard>
          <div>Conteúdo protegido</div>
        </PaymentGuard>
      </MemoryRouter>,
    );

    const title = await screen.findByText("Período de trial terminado");
    expect(title).toBeTruthy();

    const action = screen.getByRole("link", { name: /escolher plano/i });
    expect(action).toBeTruthy();
    expect(action.getAttribute("href")).toContain("/app/billing");

    expect(screen.queryByText("Conteúdo protegido")).toBeNull();
  });
});
