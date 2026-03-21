import path from "node:path";

const INVALID_ARGV1_VALUES = new Set(["", ".", "./", "path-to-app"]);

const isLikelyElectronBinary = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return (
    normalized.endsWith("/electron") || normalized.endsWith("\\electron.exe")
  );
};

const normalizeCandidate = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (INVALID_ARGV1_VALUES.has(trimmed.toLowerCase())) {
    return null;
  }

  if (isLikelyElectronBinary(trimmed)) {
    return null;
  }

  return path.resolve(trimmed);
};

export const resolveProtocolAppEntryArg = (params: {
  appPath: string;
  argv1?: string;
}): string => {
  const fromAppPath = normalizeCandidate(params.appPath);
  if (fromAppPath) {
    return fromAppPath;
  }

  const fromArgv = normalizeCandidate(params.argv1);
  if (fromArgv) {
    return fromArgv;
  }

  return path.resolve(process.cwd());
};
