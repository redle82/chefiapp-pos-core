export async function probeOptionalCoreTables(options?: {
  loadProbeClient?: () => Promise<{
    probeOptionalTables(): Promise<void>;
  }>;
}): Promise<void> {
  const loadProbeClient =
    options?.loadProbeClient ??
    (async () =>
      import("../core/infra/dockerCoreFetchClient") as Promise<{
        probeOptionalTables(): Promise<void>;
      }>);

  try {
    const { probeOptionalTables } = await loadProbeClient();
    await probeOptionalTables();
  } catch {
    // Non-fatal: Core may be down or tables may exist
  }
}

export async function exposeInsforgeValidationDevHelper(options: {
  isDev: boolean;
  windowObj?: Window & typeof globalThis;
  info?: Pick<Console, "info">;
  loadValidator?: () => Promise<{
    runValidation: unknown;
  }>;
}): Promise<void> {
  const {
    isDev,
    windowObj = globalThis.window,
    info = console,
    loadValidator = async () => import("../core/infra/validateInsforgeSetup"),
  } = options;

  if (!isDev || typeof windowObj === "undefined") return;

  const module = await loadValidator();
  (
    windowObj as Window & typeof globalThis & { validateInsforge?: unknown }
  ).validateInsforge = module.runValidation;
  info.info(
    "💡 InsForge validation available: Type 'validateInsforge()' in console",
  );
}
