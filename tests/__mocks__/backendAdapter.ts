/**
 * Mock for merchant-portal backendAdapter (avoids import.meta in Jest).
 */
export enum BackendType {
  docker = "docker",
  none = "none",
}

export function getBackendHealthCheckBaseUrl(): string {
  return "";
}

export function getBackendConfigured(): boolean {
  return false;
}

export function getBackendType(): BackendType {
  return BackendType.none;
}

export function isDockerBackend(): boolean {
  return false;
}

export function isBackendNone(): boolean {
  return true;
}
