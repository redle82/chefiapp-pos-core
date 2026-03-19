/**
 * Página placeholder reutilizável para módulos em preparação.
 * Usar quando um botão em /admin/config/productos (ModulesPage) apontar para uma rota
 * que ainda não tem implementação completa.
 * Ref: plano auditoria botões e rotas (Passo 4).
 */

import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

export interface ModulePlaceholderPageProps {
  /** Nome do módulo para exibir (opcional). */
  moduleName?: string;
}

export function ModulePlaceholderPage({
  moduleName,
}: ModulePlaceholderPageProps) {
  return (
    <div
      style={{ width: "100%", maxWidth: 560, margin: "2rem auto", padding: 24 }}
    >
      <AdminPageHeader
        title="Módulo en preparación"
        subtitle={
          moduleName
            ? `El módulo "${moduleName}" está en desarrollo. Pronto podrás configurarlo desde aquí.`
            : "Este módulo está en desarrollo. Pronto podrás configurarlo desde aquí."
        }
      />
    </div>
  );
}
