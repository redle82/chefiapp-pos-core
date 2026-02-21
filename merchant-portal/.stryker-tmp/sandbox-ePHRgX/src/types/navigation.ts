/**
 * Navigation Types - ChefIApp
 * 
 * Tipos para navegação e perfis de usuário
 */
// @ts-nocheck


export type UserRole = 'employee' | 'manager' | 'owner';

export type EmployeeRole = 'waiter' | 'kitchen' | 'bar' | 'cleaning';

export interface NavigationRoute {
  path: string;
  label: string;
  icon?: string;
  requiresRole?: UserRole[];
}

export interface BottomTab {
  id: string;
  label: string;
  icon: string;
  path: string;
  role: UserRole;
}

/**
 * Bottom Tabs por Perfil
 */
export const EMPLOYEE_TABS: BottomTab[] = [
  { id: 'home', label: 'Início', icon: 'home', path: '/employee/home', role: 'employee' },
  { id: 'tasks', label: 'Tarefas', icon: 'tasks', path: '/employee/tasks', role: 'employee' },
  { id: 'operation', label: 'Operação', icon: 'operation', path: '/employee/operation', role: 'employee' },
  { id: 'mentor', label: 'Mentor IA', icon: 'mentor', path: '/employee/mentor', role: 'employee' },
  { id: 'profile', label: 'Perfil', icon: 'profile', path: '/employee/profile', role: 'employee' },
];

export const MANAGER_TABS: BottomTab[] = [
  { id: 'dashboard', label: 'Painel', icon: 'dashboard', path: '/manager/dashboard', role: 'manager' },
  { id: 'schedule', label: 'Escala', icon: 'schedule', path: '/manager/schedule', role: 'manager' },
  { id: 'reservations', label: 'Reservas', icon: 'reservations', path: '/manager/reservations', role: 'manager' },
  { id: 'operation', label: 'Operação', icon: 'operation', path: '/manager/operation', role: 'manager' },
  { id: 'central', label: 'Central', icon: 'central', path: '/manager/central', role: 'manager' },
];

export const OWNER_TABS: BottomTab[] = [
  { id: 'vision', label: 'Visão', icon: 'vision', path: '/owner/vision', role: 'owner' },
  { id: 'central', label: 'Central', icon: 'central', path: '/owner/central', role: 'owner' },
  { id: 'people', label: 'Pessoas', icon: 'people', path: '/owner/people', role: 'owner' },
  { id: 'purchases', label: 'Compras', icon: 'purchases', path: '/owner/purchases', role: 'owner' },
  { id: 'config', label: 'Config', icon: 'config', path: '/owner/config', role: 'owner' },
];
