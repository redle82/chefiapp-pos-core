export type DeviceType = "admin" | "pos" | "kds" | "staff";

export interface LaunchContext {
  userId: string;
  tenantId: string;
  role: string;
  billingStatus: string;
  lifecycleState: string;
  deviceType: DeviceType;
}
