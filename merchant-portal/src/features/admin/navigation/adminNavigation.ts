export type SidebarLeaf = {
  kind: "link";
  label: string;
  to: string;
  end?: boolean;
  icon?: string;
};

export type SidebarSection = {
  kind: "section";
  label: string;
};

export type SidebarNode = SidebarLeaf | SidebarSection;

export type SidebarGroup = {
  id: string;
  title: string;
  icon: string;
  items: SidebarNode[];
};

export const ADMIN_PRIMARY_NAV_GROUPS: SidebarGroup[] = [
  {
    id: "financas",
    title: "Finanças",
    icon: "💰",
    items: [
      { kind: "link", label: "Transações", to: "/admin/payments", icon: "💳" },
      {
        kind: "link",
        label: "Reembolsos",
        to: "/admin/payments/refunds",
        icon: "↩",
      },
      { kind: "link", label: "Fechos", to: "/admin/closures", icon: "🧾" },
    ],
  },
  {
    id: "operacao",
    title: "Operação",
    icon: "🍽",
    items: [
      {
        kind: "link",
        label: "Reservas",
        to: "/admin/reservations",
        icon: "📅",
      },
      { kind: "link", label: "Promoções", to: "/admin/promotions", icon: "🎯" },
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: "👥",
    items: [
      { kind: "link", label: "Diretório", to: "/admin/customers", icon: "🪪" },
    ],
  },
  {
    id: "produto",
    title: "Produto",
    icon: "📦",
    items: [
      { kind: "link", label: "Catálogo", to: "/admin/catalog", icon: "📚" },
    ],
  },
  {
    id: "inteligencia",
    title: "Inteligência",
    icon: "📊",
    items: [
      { kind: "link", label: "Relatórios", to: "/admin/reports", icon: "📈" },
    ],
  },
  {
    id: "sistema",
    title: "Sistema",
    icon: "⚙️",
    items: [
      { kind: "section", label: "Capacidades" },
      {
        kind: "link",
        label: "Módulos",
        to: "/admin/modules",
        end: true,
        icon: "🧩",
      },

      { kind: "section", label: "Negócio" },
      {
        kind: "link",
        label: "Perfil do restaurante",
        to: "/admin/config/general",
      },
      {
        kind: "link",
        label: "Plano e faturação",
        to: "/admin/config/suscripcion",
      },
      { kind: "link", label: "Marcas", to: "/admin/config/marcas" },
      {
        kind: "link",
        label: "Entidades legais",
        to: "/admin/config/entidades-legales",
      },
      { kind: "link", label: "Localizações", to: "/admin/config/ubicaciones" },

      { kind: "section", label: "Operação" },
      {
        kind: "link",
        label: "Configuração do TPV",
        to: "/admin/config/software-tpv",
        icon: "🖥️",
      },
      {
        kind: "link",
        label: "Reservas",
        to: "/admin/config/reservas",
        icon: "📅",
      },
      {
        kind: "link",
        label: "Delivery",
        to: "/admin/config/delivery",
        icon: "🚚",
      },
      {
        kind: "link",
        label: "Etiquetas",
        to: "/admin/config/etiquetas",
        icon: "🏷️",
      },
      {
        kind: "link",
        label: "Impressoras",
        to: "/admin/config/impresoras",
        icon: "🖨️",
      },
      {
        kind: "link",
        label: "Equipa e turnos",
        to: "/admin/config/empleados",
        icon: "👥",
      },

      { kind: "section", label: "Canais" },
      {
        kind: "link",
        label: "Página web",
        to: "/admin/config/tienda-online",
        icon: "🌐",
      },
      {
        kind: "link",
        label: "Integrações",
        to: "/admin/config/integrations",
        icon: "🔗",
      },

      { kind: "section", label: "Sistema" },
      {
        kind: "link",
        label: "Permissões e administradores",
        to: "/admin/config/usuarios",
        icon: "🛡️",
      },
      {
        kind: "link",
        label: "Parâmetros de dispositivos",
        to: "/admin/config/dispositivos",
      },
      {
        kind: "link",
        label: "AppStaff",
        to: "/admin/devices",
        end: true,
        icon: "📟",
      },
      {
        kind: "link",
        label: "Desktop",
        to: "/admin/desktop",
        end: true,
        icon: "💻",
      },
      {
        kind: "link",
        label: "Observabilidade",
        to: "/admin/observability",
        end: true,
        icon: "📡",
      },
    ],
  },
];

export function findActiveAdminGroupId(pathname: string): string | null {
  for (const group of ADMIN_PRIMARY_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.kind !== "link") continue;
      if (pathname.startsWith(item.to)) return group.id;
    }
  }
  return null;
}
