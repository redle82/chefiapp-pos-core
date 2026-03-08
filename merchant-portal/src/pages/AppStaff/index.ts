/**
 * AppStaff module — entrypoint real para rotas /app/staff.
 * Arquitectura: AppStaffWrapper (Route element) → StaffModule → StaffAppGate → StaffAppShellLayout → páginas.
 * Launcher visível em /app/staff/home: StaffLauncherPage → AppStaffHome.
 */
export { AppStaffWrapper } from './AppStaffWrapper';
export { AppStaffHome } from './AppStaffHome';
export { default as StaffModule } from './StaffModule';
