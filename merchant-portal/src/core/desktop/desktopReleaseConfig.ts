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

  // Canonical publication signal: base URL + at least one explicitly configured file.
  // This avoids false positives when filenames come only from local defaults.
  const hasPublishedRelease = Boolean(base && hasAnyExplicitPlatformFile);

  return {
    base,
    macFile,
    windowsFile,
    mode,
    isDevLike,
    hasAnyExplicitPlatformFile,
    hasPublishedRelease,
  };
}

export function buildDesktopDownloadHref(
  base: string,
  file: string,
): string | null {
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanFile = file.startsWith("/") ? file.slice(1) : file;

  if (!cleanBase || !cleanFile) return null;
  return `${cleanBase}/${cleanFile}`;
}
