/**
 * EmpleadosConfigPage - Configuração de empleados (pessoas).
 * Conteúdo migrado de ConfigPeoplePage; rotas sob /admin/config/employees.
 * Ref: CONFIGURATION_MAP_V1.md 2.12
 */

import { useLocation, useNavigate } from "react-router-dom";
import { RestaurantPeopleSection } from "../../../../pages/Config/RestaurantPeopleSection";
import { RolesSummarySection } from "../../../../pages/Config/RolesSummarySection";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

const BASE = "/admin/config/employees";

export function EmpleadosConfigPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEmployeesTab =
    location.pathname === `${BASE}/employees` || location.pathname === BASE;
  const isRolesTab = location.pathname === `${BASE}/roles`;

  return (
    <div className="page-enter admin-content-page" style={{ maxWidth: 820 }}>
      <AdminPageHeader
        title="Empleados"
        subtitle="Funcionários, papéis e escalas."
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`${BASE}/employees`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isEmployeesTab
              ? "2px solid var(--color-primary)"
              : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isEmployeesTab ? 600 : 400,
            color: isEmployeesTab
              ? "var(--color-primary)"
              : "var(--text-secondary)",
          }}
        >
          Funcionários
        </button>
        <button
          type="button"
          onClick={() => navigate(`${BASE}/roles`)}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: isRolesTab
              ? "2px solid var(--color-primary)"
              : "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: isRolesTab ? 600 : 400,
            color: isRolesTab
              ? "var(--color-primary)"
              : "var(--text-secondary)",
          }}
        >
          Papéis
        </button>
        <button
          type="button"
          onClick={() => navigate("/manager/schedule")}
          style={{
            padding: "12px 16px",
            border: "none",
            borderBottom: "2px solid transparent",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontWeight: 400,
            color: "var(--text-secondary)",
          }}
        >
          Escalas →
        </button>
      </div>
      {isEmployeesTab && <RestaurantPeopleSection />}
      {isRolesTab && <RolesSummarySection />}
    </div>
  );
}
