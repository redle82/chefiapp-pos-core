import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/admin/catalog/list", label: "Catálogos" },
  { to: "/admin/catalog/assignments", label: "Atribuições" },
  { to: "/admin/catalog/products", label: "Produtos" },
  { to: "/admin/catalog/modifiers", label: "Modificadores" },
  { to: "/admin/catalog/combos", label: "Combos" },
  { to: "/admin/catalog/translations", label: "Traduções" },
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
