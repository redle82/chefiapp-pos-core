// @ts-nocheck
import { useState, useEffect } from 'react';
import { checkDevicePermission, type ToolId, type DeviceRole } from './DeviceMatrix';
import { getTabIsolated } from '../storage/TabIsolatedStorage';

export function useDevicePermissions() {
    const [role, setRole] = useState<DeviceRole>('owner_device');

    useEffect(() => {
        const storedRole = getTabIsolated('chefiapp_device_role') as DeviceRole;
        if (storedRole) {
            setRole(storedRole);
        }
    }, []);

    const canAccess = (tool: ToolId) => {
        return checkDevicePermission(role, tool);
    };

    return {
        role,
        canAccess
    };
}
