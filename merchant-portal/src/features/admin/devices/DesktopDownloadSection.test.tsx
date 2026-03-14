/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopDownloadSection } from "./DesktopDownloadSection";

describe("DesktopDownloadSection", () => {
  beforeEach(() => {
    // Reset env vars before each test
    // @ts-expect-error tests podem mutar env
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE = "";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE = "ChefIApp-Desktop.dmg";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE =
      "ChefIApp-Desktop-Setup.exe";
    // @ts-expect-error
    import.meta.env.MODE = "development";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DEVTOOLS_ENABLED = "";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DEVTOOLS = "";
  });

  it("monta href correto quando VITE_DESKTOP_DOWNLOAD_BASE está definido", () => {
    // @ts-expect-error tests podem mutar env
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE =
      "https://example.com/releases/latest/download";

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const { container } = render(<DesktopDownloadSection />);

    const macButton = within(container).getByTestId("desktop-download-macos");
    expect(macButton).toBeTruthy();
    fireEvent.click(macButton);
    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/releases/latest/download/ChefIApp-Desktop.dmg",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });

  it("Regra 1: sem DOWNLOAD_BASE não mostra botões mortos, mostra 'não publicado'", () => {
    const { container } = render(<DesktopDownloadSection />);
    const scoped = within(container);

    const unpublished = scoped.getByTestId("desktop-download-unpublished-note");
    expect(unpublished).toBeTruthy();
    expect(unpublished.textContent).toContain("Desktop não publicado");

    expect(scoped.queryByTestId("desktop-download-macos")).toBeNull();
    expect(scoped.queryByTestId("desktop-download-windows")).toBeNull();
  });

  it("Regra 2 DEV: por padrão mantém UI de release (sem devtools)", () => {
    // @ts-expect-error
    import.meta.env.MODE = "development";

    const { container } = render(<DesktopDownloadSection />);
    const scoped = within(container);

    const prodCta = scoped.getByTestId("desktop-prod-publish-cta");
    expect(prodCta).toBeTruthy();
    expect(scoped.queryByTestId("desktop-dev-build-cta")).toBeNull();
  });

  it("Regra 2 DEVTOOLS: com flag explícita mostra CTA de build local", () => {
    // @ts-expect-error
    import.meta.env.MODE = "development";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DEVTOOLS_ENABLED = "true";

    const { container } = render(<DesktopDownloadSection />);

    const devCta = within(container).getByTestId("desktop-dev-build-cta");
    expect(devCta).toBeTruthy();
    expect(devCta.textContent).toContain("Modo DEV");
    expect(devCta.textContent).toContain("Gerar DMG local");
  });

  it("Regra 2 DEVTOOLS: toggle expande instruções de build", () => {
    // @ts-expect-error
    import.meta.env.MODE = "development";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DEVTOOLS_ENABLED = "true";

    const { container } = render(<DesktopDownloadSection />);
    const scoped = within(container);

    expect(scoped.queryByTestId("desktop-dev-build-steps")).toBeNull();

    const toggle = scoped.getByTestId("desktop-dev-build-toggle");
    fireEvent.click(toggle);

    const steps = scoped.getByTestId("desktop-dev-build-steps");
    expect(steps).toBeTruthy();
    expect(steps.textContent).toContain("pnpm build");
    expect(steps.textContent).toContain("/Applications");
  });

  it("Regra 2 PROD: mostra CTA de publicar release em modo production", () => {
    // @ts-expect-error
    import.meta.env.MODE = "production";

    const { container } = render(<DesktopDownloadSection />);

    const prodCta = within(container).getByTestId("desktop-prod-publish-cta");
    expect(prodCta).toBeTruthy();
    expect(prodCta.textContent).toContain("Release não publicada");
    expect(prodCta.textContent).toContain("VITE_DESKTOP_DOWNLOAD_BASE");
  });

  it("PROD com DOWNLOAD_BASE: mostra botões de download reais", () => {
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE =
      "https://example.com/releases/latest/download";
    // @ts-expect-error
    import.meta.env.MODE = "production";

    const { container } = render(<DesktopDownloadSection />);

    const macButtons = within(container).getAllByTestId("desktop-download-macos");
    expect(macButtons.length).toBeGreaterThanOrEqual(1);
    expect(macButtons[0]).toBeTruthy();
  });
});
