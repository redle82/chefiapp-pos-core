/**
 * DispositivosConfigPage - Gestión de dispositivos.
 * Rota: /admin/config/devices. Lista de dispositivos (estado + vínculo), só leitura.
 * Ref: admin_config_vs_reports_layout plan, CONFIGURATION_MAP_V1.md 2.8
 */

import { AdminDevicesPage } from "../../devices/AdminDevicesPage";

export function DispositivosConfigPage() {
  return <AdminDevicesPage />;
}
