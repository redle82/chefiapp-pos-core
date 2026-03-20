import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketComparisonPage } from "./MarketComparisonPage";

const trackMock = vi.fn();

vi.mock("../../analytics/track", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

describe("MarketComparisonPage analytics", () => {
  beforeEach(() => {
    trackMock.mockReset();
  });

  it("tracks CTA clicks on compare page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MarketComparisonPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("link", { name: /Ver funcionalidades/i }),
    );
    await user.click(screen.getByRole("link", { name: /Falar com equipa/i }));
    await user.click(screen.getByRole("link", { name: /Ver planos/i }));
    await user.click(screen.getByRole("link", { name: /Testar agora/i }));

    expect(trackMock).toHaveBeenCalledWith(
      "marketing_compare_cta_click",
      expect.objectContaining({
        page: "compare",
        cta: "features",
        destination: "/features",
      }),
    );

    expect(trackMock).toHaveBeenCalledWith(
      "marketing_compare_cta_click",
      expect.objectContaining({
        page: "compare",
        cta: "contact_team",
        destination: "/landing",
      }),
    );

    expect(trackMock).toHaveBeenCalledWith(
      "marketing_compare_cta_click",
      expect.objectContaining({
        page: "compare",
        cta: "pricing",
        destination: "/pricing",
      }),
    );

    expect(trackMock).toHaveBeenCalledWith(
      "marketing_compare_cta_click",
      expect.objectContaining({
        page: "compare",
        cta: "try_now",
        destination: "/auth/email",
      }),
    );
  });
});
