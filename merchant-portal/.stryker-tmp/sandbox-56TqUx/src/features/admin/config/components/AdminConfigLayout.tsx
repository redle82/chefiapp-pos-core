/**
 * AdminConfigLayout - Conteúdo de /admin/config/* (sem submenu).
 *
 * O submenu de configuração (General, Productos, …) fica na AdminSidebar
 * quando a rota é /admin/config/* (estilo Last.app: a sidebar muda ao entrar em Configuración).
 * Ref: CONFIGURATION_MAP_V1.md
 */
// @ts-nocheck


import { Outlet } from "react-router-dom";

export function AdminConfigLayout() {
  return (
    <div style={{ width: "100%", minHeight: "100%", minWidth: 0 }}>
      <Outlet />
    </div>
  );
}
