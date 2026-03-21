export function DevBuildBanner() {
  const enabled =
    import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_BUILD_BANNER !== "false";

  if (!enabled) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 10000,
        padding: "4px 8px",
        borderRadius: 6,
        background: "#0f172a",
        color: "#f8fafc",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
      }}
      aria-label="Dev Build Banner"
    >
      DEV BUILD
    </div>
  );
}
