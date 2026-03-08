type CatalogFeatureFlags = {
  menuV2Shell: boolean;
  menuV2QuickBuild: boolean;
  menuV2CatalogModel: boolean;
  menuV2Publication: boolean;
  menuV2Quality: boolean;
  menuV2ImportAI: boolean;
};

type EnvLike = {
  [key: string]: string | boolean | undefined;
};

declare const __VITE_ENV__: EnvLike | undefined;

const ENV: EnvLike =
  typeof __VITE_ENV__ !== "undefined"
    ? __VITE_ENV__
    : typeof process !== "undefined" && process.env
    ? (process.env as EnvLike)
    : {};

const getEnvBool = (key: string, fallback: boolean): boolean => {
  const value = ENV[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return fallback;
};

const DEFAULT_FLAGS: CatalogFeatureFlags = {
  menuV2Shell: true,
  menuV2QuickBuild: true,
  menuV2CatalogModel: false,
  menuV2Publication: false,
  menuV2Quality: false,
  menuV2ImportAI: false,
};

let runtimeFlags: CatalogFeatureFlags = {
  ...DEFAULT_FLAGS,
  menuV2Shell: getEnvBool("VITE_MENU_V2_SHELL", DEFAULT_FLAGS.menuV2Shell),
  menuV2QuickBuild: getEnvBool(
    "VITE_MENU_V2_QUICK_BUILD",
    DEFAULT_FLAGS.menuV2QuickBuild,
  ),
  menuV2CatalogModel: getEnvBool(
    "VITE_MENU_V2_CATALOG_MODEL",
    DEFAULT_FLAGS.menuV2CatalogModel,
  ),
  menuV2Publication: getEnvBool(
    "VITE_MENU_V2_PUBLICATION",
    DEFAULT_FLAGS.menuV2Publication,
  ),
  menuV2Quality: getEnvBool(
    "VITE_MENU_V2_QUALITY",
    DEFAULT_FLAGS.menuV2Quality,
  ),
  menuV2ImportAI: getEnvBool(
    "VITE_MENU_V2_IMPORT_AI",
    DEFAULT_FLAGS.menuV2ImportAI,
  ),
};

export function getCatalogFeatureFlags(): Readonly<CatalogFeatureFlags> {
  return { ...runtimeFlags };
}

export function isMenuV2ShellEnabled(): boolean {
  return runtimeFlags.menuV2Shell;
}

export function isMenuV2QuickBuildEnabled(): boolean {
  return runtimeFlags.menuV2QuickBuild;
}

export function setCatalogFeatureFlagsForTests(
  overrides: Partial<CatalogFeatureFlags>,
): void {
  runtimeFlags = {
    ...runtimeFlags,
    ...overrides,
  };
}
