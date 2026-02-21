// @ts-nocheck
import { useLocation, useNavigate } from "react-router-dom";

const LINKS = [
  { to: "/admin/catalog/list", label: "Catálogos" },
  { to: "/admin/catalog/assignments", label: "Atribuições" },
  { to: "/admin/catalog/products", label: "Produtos" },
  { to: "/admin/catalog/modifiers", label: "Modificadores" },
  { to: "/admin/catalog/combos", label: "Combos" },
  { to: "/admin/catalog/translations", label: "Traduções" },
];

export function CatalogSubnav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="flex items-center gap-2 border-b border-gray-200 pb-2"
      aria-label="Subsecções do catálogo"
    >
      {LINKS.map((link) => {
        const isActive = location.pathname === link.to;
        return (
          <button
            key={link.to}
            type="button"
            onClick={() => navigate(link.to)}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
              isActive
                ? "bg-violet-100 text-violet-800"
                : "text-gray-600 hover:bg-gray-100",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </button>
        );
      })}
    </nav>
  );
}
