/**
 * ProductosConfigPage - "Mis productos" (módulos) dentro de Configuración.
 * Igual ao Last.app: Configuración > Productos = ativar/desativar módulos (TPV, QR, Reservas, etc.).
 * Catálogo de produtos para venda fica em /admin/products (sidebar Catálogo).
 */

import { ModulesPage } from "../../modules/pages/ModulesPage";

export function ProductosConfigPage() {
  return <ModulesPage />;
}
