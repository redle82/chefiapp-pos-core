import {
  navigateToModule,
  type NavigateToModuleOptions,
  type OperationalModuleId,
} from "./navigateToModule";

export const TPV_WINDOW_NAME = "ChefIApp_TPV";
export const KDS_WINDOW_NAME = "ChefIApp_KDS";
export const APPSTAFF_WINDOW_NAME = "ChefIApp_AppStaff";

export type OpenOperationalOptions = Omit<
  NavigateToModuleOptions,
  "searchParams"
>;

export function openTpvInNewWindow(
  searchParams?: string,
  options: OpenOperationalOptions = {},
): void {
  navigateToModule("tpv", {
    ...options,
    searchParams,
  });
}

export function openKdsInNewWindow(options: OpenOperationalOptions = {}): void {
  navigateToModule("kds", options);
}

export function openAppStaffInNewWindow(
  options: OpenOperationalOptions = {},
): void {
  navigateToModule("appstaff", options);
}

export function openOperationalInNewWindow(
  moduleId: OperationalModuleId,
  options: OpenOperationalOptions = {},
): void {
  navigateToModule(moduleId, options);
}
