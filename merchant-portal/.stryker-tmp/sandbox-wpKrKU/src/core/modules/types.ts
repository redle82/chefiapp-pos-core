/**
 * Types for Module System
 */

export interface ModuleInterface {
  install(restaurantId: string, config?: ModuleConfig): Promise<InstallResult>;
  uninstall(restaurantId: string): Promise<UninstallResult>;
  health(restaurantId: string): Promise<HealthStatus>;
  configure(restaurantId: string, config: ModuleConfig): Promise<void>;
  status(restaurantId: string): Promise<ModuleStatus>;
}

export interface ModuleConfig {
  [key: string]: any;
}

export interface InstallResult {
  success: boolean;
  moduleId: string;
  message: string;
  warnings?: string[];
}

export interface UninstallResult {
  success: boolean;
  message: string;
}

export interface HealthStatus {
  installed: boolean;
  status: 'active' | 'inactive' | 'error' | 'not_installed';
  health: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: boolean;
  };
}

export interface ModuleStatus {
  installed: boolean;
  version?: string;
  installedAt?: Date;
  status?: string;
}
