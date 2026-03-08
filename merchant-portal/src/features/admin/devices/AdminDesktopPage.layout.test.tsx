/**
 * @vitest-environment jsdom
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDesktopPage } from "./AdminDesktopPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../core/desktop/useDesktopHealth", () => ({
  useDesktopHealth: () => ({
    status: "detected",
    health: { version: "1.2.3" },
    recheck: vi.fn(),
  }),
}));

vi.mock("../dashboard/components/AdminPageHeader", () => ({
  AdminPageHeader: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}));

vi.mock("./DesktopDownloadSection", () => ({
  DesktopDownloadSection: () => <div>desktop-download-section</div>,
}));

describe("AdminDesktopPage layout", () => {
  it("uses the operational workspace layout with a hero banner, main tools, and supporting side panels", () => {
    render(<AdminDesktopPage />);

    const layout = screen.getByTestId("admin-surface-layout");
    expect(layout.getAttribute("data-variant")).toBe("operational");

    const hero = screen.getByTestId("admin-surface-hero");
    const main = screen.getByTestId("admin-surface-main");
    const aside = screen.getByTestId("admin-surface-aside");

    expect(within(hero).getByText(/desktop detectado/i)).toBeTruthy();
    expect(within(main).getByText("desktop-download-section")).toBeTruthy();
    expect(within(aside).getByText("Política de distribuição")).toBeTruthy();
    expect(within(aside).getByText("Ajuda rápida")).toBeTruthy();
  });
});
