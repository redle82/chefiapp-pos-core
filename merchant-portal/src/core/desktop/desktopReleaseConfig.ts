const DEFAULT_MAC_FILE = "ChefIApp-Desktop.dmg";
const DEFAULT_WINDOWS_FILE = "ChefIApp-Desktop-Setup.exe";

export interface DesktopReleaseConfig {
  base: string;
  macFile: string;
  windowsFile: string;
  mode: string;
  isDevLike: boolean;
  hasAnyExplicitPlatformFile: boolean;
  hasPublishedRelease: boolean;
  /** Versão da release (ex.: "1.2.0"). Definir VITE_DESKTOP_RELEASE_VERSION para mostrar na tela TPV. */
  releaseVersion: string;
}

function trimValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getDesktopReleaseConfig(): DesktopReleaseConfig {
  const base = trimValue(import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE);
  const explicitMacFile = trimValue(
    import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE,
  );
  const explicitWindowsFile = trimValue(
    import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE,
  );
  const macFile = explicitMacFile || DEFAULT_MAC_FILE;
  const windowsFile = explicitWindowsFile || DEFAULT_WINDOWS_FILE;
  const mode = trimValue(import.meta.env.MODE) || "development";
  const isDevLike = /^(development|dev|local)$/i.test(mode);
  const hasAnyExplicitPlatformFile = Boolean(
    explicitMacFile || explicitWindowsFile,
  );

  // Download links must be absolute URLs on a different origin; same-origin would load the SPA and redirect to reports.
  // Treat localhost and 127.0.0.1 as the same origin so we never show download buttons that open the app itself.
  const isAbsoluteBase = /^https?:\/\//i.test(base);
  let isExternalBase = false;
  try {
    if (typeof window !== "undefined" && base) {
      const baseOrigin = new URL(base).origin;
      const pageOrigin = window.location.origin;
      const norm = (o: string) =>
        o.replace(/^https?:\/\/127\.0\.0\.1(:\d+)?$/i, "http://localhost$1");
      isExternalBase = norm(baseOrigin) !== norm(pageOrigin);
    } else {
      isExternalBase = isAbsoluteBase;
    }
  } catch {
    isExternalBase = false;
  }
  const hasPublishedRelease = Boolean(
    base && isAbsoluteBase && isExternalBase && hasAnyExplicitPlatformFile,
  );
  const releaseVersion = trimValue(import.meta.env.VITE_DESKTOP_RELEASE_VERSION);

  return {
    base,
    macFile,
    windowsFile,
    mode,
    isDevLike,
    hasAnyExplicitPlatformFile,
    hasPublishedRelease,
    releaseVersion,
  };
}

export function buildDesktopDownloadHref(
  base: string,
  file: string,
): string | null {
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanFile = file.startsWith("/") ? file.slice(1) : file;
  if (!cleanBase || !cleanFile || !/^https?:\/\//i.test(cleanBase))
    return null;
  return `${cleanBase}/${cleanFile}`;
}
