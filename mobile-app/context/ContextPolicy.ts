import { StaffRole, Maturity } from './AppStaffContext';

export type Permission =
    // Shift
    | 'shift:start'
    | 'shift:end'
    | 'shift:view_metrics' // View advanced metrics (sales, efficiency)
    | 'shift:view_gamification' // View XP, levels

    // Cash (Financial)
    | 'cash:handle' // Open/close cash drawer, see float amounts

    // Orders
    | 'order:create'
    | 'order:view_all' // View orders from other waiters
    | 'order:void' // Void an item/order
    | 'order:discount'
    | 'order:split'
    | 'order:transfer'

    // Tables
    | 'table:assign' // Assign table to self/others
    | 'table:merge'

    // Management
    | 'staff:manage' // Manage other staff (delegate tasks)
    | 'business:view_reports' // Owner view

    // Kitchen/Bar
    | 'kds:view'
    | 'kds:bump';

// Base permissions by Role (what they can do fundamentally)
const BASE_ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
    waiter: ['shift:start', 'shift:end', 'shift:view_gamification', 'order:create', 'cash:handle'],
    bartender: ['shift:start', 'shift:end', 'shift:view_gamification', 'kds:view', 'kds:bump'], // NO cash
    cook: ['shift:start', 'shift:end', 'shift:view_gamification', 'kds:view', 'kds:bump'], // NO cash
    chef: ['shift:start', 'shift:end', 'shift:view_gamification', 'kds:view', 'kds:bump', 'staff:manage', 'order:void'], // NO cash
    manager: ['shift:start', 'shift:end', 'shift:view_metrics', 'staff:manage', 'order:void', 'order:discount', 'order:view_all', 'table:assign', 'cash:handle'],
    owner: ['shift:view_metrics', 'business:view_reports', 'staff:manage', 'order:view_all', 'cash:handle'],
    cleaning: ['shift:start', 'shift:end', 'shift:view_gamification'], // NO cash
    ambulante: ['shift:start', 'shift:end', 'order:create', 'order:view_all', 'order:void', 'shift:view_metrics', 'cash:handle'], // Solo op needs cash
    vendor: ['shift:start', 'shift:end', 'order:create', 'order:view_all', 'order:void', 'shift:view_metrics', 'cash:handle'], // Solo op needs cash
    supervisor: ['shift:start', 'shift:end', 'staff:manage', 'order:void', 'order:discount', 'table:assign', 'shift:view_metrics', 'cash:handle'],
    cashier: ['shift:start', 'shift:end', 'order:view_all', 'order:discount', 'cash:handle'], // Explicitly handles cash
    delivery: ['order:view_all', 'shift:start', 'shift:end'], // NO cash
    admin: ['shift:start', 'shift:end', 'order:view_all', 'order:void', 'staff:manage', 'business:view_reports', 'cash:handle'], // Admin can handle cash for setup
};

// Maturity Modifiers (Unlock features as business grows)
const MATURITY_UNLOCKS: Record<Maturity, Permission[]> = {
    starter: [], // No extra unlocks
    growing: ['order:split', 'table:assign'], // Growing biz starts needing table management
    professional: ['order:void', 'order:discount', 'order:transfer', 'table:merge', 'shift:view_metrics'], // Professional needs full control
};

export function getContextPermissions(role: StaffRole, maturity: Maturity): Permission[] {
    const base = BASE_ROLE_PERMISSIONS[role] || [];
    const unlocks = MATURITY_UNLOCKS[maturity] || [];

    // Filter unlocks: Only unlock if the role is conceptually capable aka "Elevated" roles might get them automatically, 
    // but here we simply ADD them.
    // However, a 'waiter' shouldn't get 'business:view_reports' even if professional.
    // So Maturity unlocks should be *Role-Specific* or *Global Enhancements*?

    // Strategy: Maturity unlocks capabilities *for roles that handle them*.
    // Simple approach for MVP: Add unlocks to everyone, BUT 'business:view_reports' is never in maturity unlocks.
    // Better approach: Hardcode exceptions or refine.

    // For specific roles, we might extend base.
    let effectivePermissions = [...base];

    if (maturity === 'professional') {
        if (role === 'waiter') effectivePermissions.push('order:void', 'order:transfer', 'order:split');
        if (role === 'manager') effectivePermissions.push('business:view_reports'); // Managers in pro places see reports
    }

    if (maturity === 'growing') {
        if (role === 'waiter') effectivePermissions.push('order:split');
    }

    // Deduplicate
    return [...new Set(effectivePermissions)];
}
