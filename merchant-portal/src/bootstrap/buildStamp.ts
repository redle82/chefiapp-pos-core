declare const __BUILD_TIMESTAMP__: string | undefined;

const BUILD_STAMP_STYLE = "color: #f59e0b; font-weight: bold";

function resolveBuildTimestamp(): string | undefined {
  return typeof __BUILD_TIMESTAMP__ === "undefined"
    ? undefined
    : __BUILD_TIMESTAMP__;
}

export function getBuildStamp(
  mode: string,
  buildTimestamp: string | undefined = resolveBuildTimestamp(),
): string {
  return `chefiapp-build:${mode}:${buildTimestamp ?? "dev"}`;
}

export function logBuildStamp(options: {
  mode: string;
  buildTimestamp?: string | undefined;
  log?: Pick<Console, "log">;
}): string {
  const { mode, buildTimestamp, log = console } = options;
  const stamp = getBuildStamp(mode, buildTimestamp);
  log.log(`%c[ChefIApp] ${stamp}`, BUILD_STAMP_STYLE);
  return stamp;
}
