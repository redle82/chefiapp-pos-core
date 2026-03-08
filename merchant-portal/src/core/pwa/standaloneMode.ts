export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  const hasMatchMedia = typeof window.matchMedia === "function";
  const displayModeStandalone = hasMatchMedia
    ? window.matchMedia("(display-mode: standalone)").matches
    : false;

  const iosStandalone =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const androidReferrerStandalone =
    typeof document !== "undefined" &&
    typeof document.referrer === "string" &&
    document.referrer.startsWith("android-app://");

  return displayModeStandalone || iosStandalone || androidReferrerStandalone;
}
