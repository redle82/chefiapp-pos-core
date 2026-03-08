/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
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

    render(<DesktopDownloadSection />);

    const macLink = screen.getByTestId(
      "desktop-download-macos",
    ) as HTMLAnchorElement;
    expect(macLink).toBeTruthy();
    expect(macLink.href).toBe(
      "https://example.com/releases/latest/download/ChefIApp-Desktop.dmg",
    );
  });

  it("Regra 1: sem DOWNLOAD_BASE não mostra botões mortos, mostra 'não publicado'", () => {
    render(<DesktopDownloadSection />);

    const unpublished = screen.getByTestId("desktop-download-unpublished-note");
    expect(unpublished).toBeTruthy();
    expect(unpublished.textContent).toContain("Desktop não publicado");

    // No download cards should exist
    expect(screen.queryByTestId("desktop-download-macos")).toBeNull();
    expect(screen.queryByTestId("desktop-download-windows")).toBeNull();
  });

  it("Regra 2 DEV: por padrão mantém UI de release (sem devtools)", () => {
    // @ts-expect-error
    import.meta.env.MODE = "development";

    render(<DesktopDownloadSection />);

    const prodCta = screen.getByTestId("desktop-prod-publish-cta");
    expect(prodCta).toBeTruthy();
    expect(screen.queryByTestId("desktop-dev-build-cta")).toBeNull();
  });

  it("Regra 2 DEVTOOLS: com flag explícita mostra CTA de build local", () => {
    // @ts-expect-error
    import.meta.env.MODE = "development";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DEVTOOLS_ENABLED = "true";

    render(<DesktopDownloadSection />);

    const devCta = screen.getByTestId("desktop-dev-build-cta");
    expect(devCta).toBeTruthy();
    expect(devCta.textContent).toContain("Modo DEV");
    expect(devCta.textContent).toContain("Gerar DMG local");
  });

  it("Regra 2 DEVTOOLS: toggle expande instruções de build", () => {
    // @ts-expect-error
    import.meta.env.MODE = "development";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DEVTOOLS_ENABLED = "true";

    render(<DesktopDownloadSection />);

    // Steps should not be visible initially
    expect(screen.queryByTestId("desktop-dev-build-steps")).toBeNull();

    // Click toggle
    const toggle = screen.getByTestId("desktop-dev-build-toggle");
    fireEvent.click(toggle);

    // Now steps should be visible
    const steps = screen.getByTestId("desktop-dev-build-steps");
    expect(steps).toBeTruthy();
    expect(steps.textContent).toContain("pnpm build");
    expect(steps.textContent).toContain("/Applications");
  });

  it("Regra 2 PROD: mostra CTA de publicar release em modo production", () => {
    // @ts-expect-error
    import.meta.env.MODE = "production";

    render(<DesktopDownloadSection />);

    const prodCta = screen.getByTestId("desktop-prod-publish-cta");
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

    render(<DesktopDownloadSection />);

    const macLink = screen.getByTestId("desktop-download-macos");
    expect(macLink).toBeTruthy();

    // No unpublished state
    expect(
      screen.queryByTestId("desktop-download-unpublished-note"),
    ).toBeNull();
    expect(screen.queryByTestId("desktop-dev-build-cta")).toBeNull();
    expect(screen.queryByTestId("desktop-prod-publish-cta")).toBeNull();
  });
});
