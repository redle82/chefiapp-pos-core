export type DeviceRole = 'owner_device' | 'manager_terminal' | 'kds_screen';
export type OperationMode = 'mobile_only' | 'hybrid' | 'full';

export type ToolId = 'dashboard' | 'tpv' | 'kds' | 'menu' | 'orders' | 'staff';

type PermissionRule = {
    allow: boolean;
    reason?: string;
};

// The Matriz Lógica from FOE_ACTIVATION_OPERATION.md
const PERMISSION_MATRIX: Record<DeviceRole, Record<ToolId, boolean>> = {
    owner_device: {
        dashboard: true,
        tpv: false, // ❌ Mobile Owner cannot open heavy TPV
        kds: false, // ❌ Mobile Owner doesn't run kitchen
        menu: true,
        orders: true, // Monitoring only
        staff: true
    },
    manager_terminal: {
        dashboard: true,
        tpv: true, // ✅ Manager runs the show
        kds: false, // Managers don't cook usually (but could allowed if hybrid?)
        menu: true,
        orders: true,
        staff: true
    },
    kds_screen: {
        dashboard: false,
        tpv: false,
        kds: true, // ✅ KDS Only
        menu: false,
        orders: false,
        staff: false
    }
};

export const checkDevicePermission = (role: string, tool: ToolId): PermissionRule => {
    // Default to strict if unknown
    const safeRole = (role as DeviceRole) || 'owner_device';
    const allowed = PERMISSION_MATRIX[safeRole]?.[tool] ?? false;

    if (!allowed) {
        return {
            allow: false,
            reason: `Role '${safeRole}' cannot access '${tool}'. Use a compatible device.`
        };
    }

    return { allow: true };
};
