import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/admin/catalogs", label: "Catálogos" },
  { to: "/admin/catalog-assignments", label: "Atribuições" },
  { to: "/admin/products", label: "Produtos" },
  { to: "/admin/modifiers", label: "Modificadores" },
  { to: "/admin/combos", label: "Combos" },
  { to: "/admin/translations", label: "Traduções" },
];

export function CatalogSubnav() {
  return (
    <nav className="flex items-center gap-2 border-b border-gray-200 pb-2">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            [
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              isActive
                ? "bg-violet-100 text-violet-800"
                : "text-gray-600 hover:bg-gray-100",
            ].join(" ")
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
