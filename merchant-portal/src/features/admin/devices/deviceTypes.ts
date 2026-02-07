export type AdminDeviceType = "tpv" | "kds";

export type AdminDeviceStatus = "online" | "offline" | "unknown";

export interface AdminDevice {
  id: string;
  type: AdminDeviceType;
  name: string;
  assignedRole?: "waiter" | "kitchen" | "manager" | "owner" | "cleaning";
  currentApp?: import("../../pages/AppStaff/context/StaffCoreTypes").OperatorAppId;
  operatorSessionId?: string | null;
  lastHeartbeat?: string | null;
  notes?: string | null;
}

