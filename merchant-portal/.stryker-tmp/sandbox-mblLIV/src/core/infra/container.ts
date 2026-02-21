export interface IDatabase {
  from(table: string): any;
  rpc?(fnName: string, params?: Record<string, unknown>): Promise<any>;
}

export interface IDatabaseFactory {
  create(): IDatabase;
}

export function createSupabaseFactory(client: any): IDatabaseFactory {
  return { create: () => client };
}

export function createDockerCoreFactory(client: any): IDatabaseFactory {
  return { create: () => client };
}

export interface ILoggerPort {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, error?: any, data?: Record<string, any>): void;
  critical(message: string, error?: any, data?: Record<string, any>): void;
}

export interface IAlertPort {
  sendCritical(message: string, context?: Record<string, unknown>): void;
}

export interface ServiceDependencies {
  db: IDatabase;
  logger: ILoggerPort;
  alerts?: IAlertPort;
}

let _deps: ServiceDependencies | null = null;

export function configureDependencies(deps: ServiceDependencies): void {
  _deps = deps;
}

export function getDependencies(): ServiceDependencies {
  if (!_deps) {
    throw new Error("[DI] Dependencies not configured. Call configureDependencies() at app startup.");
  }
  return _deps;
}

export function resetDependencies(): void {
  _deps = null;
}
