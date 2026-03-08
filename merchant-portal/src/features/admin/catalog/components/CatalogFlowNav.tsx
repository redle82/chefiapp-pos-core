import { useLocation, useNavigate } from "react-router-dom";

type FlowLink = {
  to: string;
  label: string;
  hint: string;
};

const FLOW_LINKS: FlowLink[] = [
  {
    to: "/admin/catalog/setup",
    label: "Setup",
    hint: "Negócio, canais e base inicial.",
  },
  {
    to: "/admin/catalog/library",
    label: "Biblioteca",
    hint: "Itens canónicos, categorias e traduções.",
  },
  {
    to: "/admin/catalog/catalogs",
    label: "Catálogos",
    hint: "Estrutura comercial por marca e canal.",
  },
  {
    to: "/admin/catalog/publish",
    label: "Publicação",
    hint: "Preços, disponibilidade e destino.",
  },
  {
    to: "/admin/catalog/quality",
    label: "Qualidade",
    hint: "Validação, conflitos e faltas.",
  },
];

export function CatalogFlowNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Fluxo principal de catálogo"
      className="grid gap-2 md:grid-cols-5"
    >
      {FLOW_LINKS.map((link) => {
        const isActive = location.pathname.startsWith(link.to);
        return (
          <button
            key={link.to}
            type="button"
            onClick={() => navigate(link.to)}
            className={[
              "rounded-lg border px-3 py-2 text-left transition-colors",
              isActive
                ? "border-violet-400 bg-violet-50"
                : "border-gray-200 bg-white hover:bg-gray-50",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            <div
              className={[
                "text-sm font-semibold",
                isActive ? "text-violet-800" : "text-gray-800",
              ].join(" ")}
            >
              {link.label}
            </div>
            <div
              className={[
                "mt-1 text-xs",
                isActive ? "text-violet-700" : "text-gray-500",
              ].join(" ")}
            >
              {link.hint}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
