/**
 * SystemTreeContext - Contexto da System Tree
 *
 * Gerencia o estado da árvore do sistema operacional do restaurante.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRestaurantIdentity } from "../core/identity/useRestaurantIdentity";
import { useTenant } from "../core/tenant/TenantContext";
import { dockerCoreClient } from "../infra/docker-core/connection";
import {
  RestaurantRuntimeContext,
  type SetupStatus,
} from "./RestaurantRuntimeContext";

export type NodeStatus =
  | "active"
  | "inactive"
  | "installed"
  | "not_installed"
  | "complete"
  | "incomplete"
  | "locked"
  | "dormant"
  | "observing";

export interface SystemNode {
  id: string;
  label: string;
  icon: string;
  type:
    | "core"
    | "domain"
    | "module"
    | "config"
    | "operation"
    | "permission"
    | "data"
    | "roadmap";
  status: NodeStatus;
  description?: string;
  children?: SystemNode[];
  dependencies?: string[];
  events?: string[];
  dataConsumed?: string[];
  dataProduced?: string[];
  installable?: boolean;
  actionable?: boolean;
  locked?: boolean;
  lockedReason?: string;
  metadata?: Record<string, any>;
}

/** Nível de consciência da árvore: Executivo (resumido) → Operacional → Arquitetural (nerd) */
export type SystemTreeViewLevel = "executive" | "operational" | "architectural";

export interface SystemTreeState {
  nodes: SystemNode[];
  selectedNode: SystemNode | null;
  expandedNodes: Set<string>;
  restaurantId: string | null;
  restaurantStatus: "draft" | "active" | "paused" | null;
  loading: boolean;
  /** Modo de leitura: executive (default), operational, architectural */
  viewLevel: SystemTreeViewLevel;
}

interface SystemTreeContextValue extends SystemTreeState {
  selectNode: (node: SystemNode) => void;
  toggleExpand: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setViewLevel: (level: SystemTreeViewLevel) => void;
  refresh: () => Promise<void>;
}

const SystemTreeContext = createContext<SystemTreeContextValue | null>(null);

export function SystemTreeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const runtimeContext = useContext(RestaurantRuntimeContext);
  const { identity } = useRestaurantIdentity();
  const { tenantId } = useTenant();
  const restaurantIdFromRuntime =
    runtimeContext?.runtime?.restaurant_id ?? null;
  const runtimeLoaded = runtimeContext
    ? !runtimeContext.runtime.loading
    : false;

  const [state, setState] = useState<SystemTreeState>({
    nodes: [],
    selectedNode: null,
    expandedNodes: new Set(["root"]),
    restaurantId: null,
    restaurantStatus: null,
    loading: true,
    viewLevel: "executive",
  });

  const setViewLevel = useCallback((viewLevel: SystemTreeViewLevel) => {
    setState((prev) => ({ ...prev, viewLevel }));
  }, []);

  const selectNode = useCallback((node: SystemNode) => {
    setState((prev) => ({ ...prev, selectedNode: node }));
  }, []);

  const toggleExpand = useCallback((nodeId: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedNodes);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return { ...prev, expandedNodes: newExpanded };
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = collectAllNodeIds(state.nodes);
    setState((prev) => ({ ...prev, expandedNodes: new Set(allIds) }));
  }, [state.nodes]);

  const collapseAll = useCallback(() => {
    setState((prev) => ({ ...prev, expandedNodes: new Set(["root"]) }));
  }, []);

  // Quando o nível de visão muda, ajusta automaticamente a expansão da árvore
  const { viewLevel, nodes } = state;

  useEffect(() => {
    setState((prev) => {
      let expandedNodes: Set<string>;

      if (viewLevel === "executive") {
        // Visão executiva: árvore colapsada, foco em mapa resumido
        expandedNodes = new Set(["root"]);
      } else if (viewLevel === "operational") {
        // Visão operacional: núcleos principais visíveis
        expandedNodes = new Set([
          "root",
          "core",
          "domains",
          "modules",
          "operation",
          "permissions",
        ]);
      } else {
        // Visão arquitetural: tudo expandido
        expandedNodes = new Set(collectAllNodeIds(prev.nodes));
      }

      return {
        ...prev,
        expandedNodes,
        // Em visão executiva limpamos a seleção para o resumo
        selectedNode: viewLevel === "executive" ? null : prev.selectedNode,
      };
    });
  }, [viewLevel, nodes]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const restaurantId = restaurantIdFromRuntime || identity.id || tenantId;

    if (!restaurantId) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Módulos e setup_status vindos do Runtime (fonte única de verdade)
      const runtimeInstalledModules =
        runtimeContext?.runtime?.installed_modules ?? [];
      const runtimeSetupStatus: SetupStatus =
        runtimeContext?.runtime?.setup_status ?? {};

      // Status do restaurante derivado do runtime.mode
      const runtimeMode = runtimeContext?.runtime?.mode ?? "onboarding";
      const restaurantStatus: "draft" | "active" | "paused" =
        runtimeMode === "active"
          ? "active"
          : runtimeMode === "paused"
          ? "paused"
          : "draft";

      const installedModules = runtimeInstalledModules.map((id) => ({
        module_id: id,
        status: "installed",
      }));

      // Buscar terminais (Heartbeat)
      const { data: terminals } = await dockerCoreClient
        .from("gm_terminals")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("last_heartbeat_at", { ascending: false });

      // Construir árvore
      const nodes = await buildSystemTree({
        restaurantId,
        restaurantStatus,
        installedModules: installedModules || [],
        setupStatus: runtimeSetupStatus,
        terminals: terminals || [],
      });

      setState((prev) => ({
        ...prev,
        nodes,
        restaurantId,
        restaurantStatus,
        loading: false,
      }));
    } catch (error) {
      console.error("Error refreshing system tree:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [
    restaurantIdFromRuntime,
    identity.id,
    runtimeContext?.runtime?.mode,
    runtimeContext?.runtime?.installed_modules,
    runtimeContext?.runtime?.setup_status,
  ]);

  useEffect(() => {
    if (restaurantIdFromRuntime || (!identity.loading && identity.id)) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    restaurantIdFromRuntime,
    runtimeLoaded,
    identity.id,
    identity.loading,
    runtimeContext?.runtime?.installed_modules,
    runtimeContext?.runtime?.setup_status,
  ]);

  return (
    <SystemTreeContext.Provider
      value={{
        ...state,
        selectNode,
        toggleExpand,
        expandAll,
        collapseAll,
        setViewLevel,
        refresh,
      }}
    >
      {children}
    </SystemTreeContext.Provider>
  );
}

export function useSystemTree() {
  const context = useContext(SystemTreeContext);
  if (!context) {
    throw new Error("useSystemTree must be used within SystemTreeProvider");
  }
  return context;
}

function collectAllNodeIds(nodes: SystemNode[]): string[] {
  const ids: string[] = [];
  function traverse(nodes: SystemNode[]) {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  traverse(nodes);
  return ids;
}

async function buildSystemTree(params: {
  restaurantId: string;
  restaurantStatus: "draft" | "active" | "paused";
  installedModules: Array<{ module_id: string; status: string }>;
  setupStatus: SetupStatus;
  terminals: any[];
}): Promise<SystemNode[]> {
  const { restaurantStatus, installedModules, setupStatus, terminals } = params;

  const installedModuleIds = new Set(installedModules.map((m) => m.module_id));
  const isPublished = restaurantStatus === "active";

  return [
    {
      id: "root",
      label: "Restaurant OS",
      icon: "🏗️",
      type: "core",
      status: "active",
      description: "Sistema Operacional do Restaurante",
      children: [
        // Core
        {
          id: "core",
          label: "Core",
          icon: "⚙️",
          type: "core",
          status: "active",
          description: "Engines centrais do sistema",
          children: [
            {
              id: "core-event",
              label: "Event Engine",
              icon: "📡",
              type: "core",
              status: "active",
              description: "Motor de eventos do sistema",
              events: [
                "order_created",
                "payment_processed",
                "inventory_updated",
              ],
            },
            {
              id: "core-task",
              label: "Task Engine",
              icon: "✅",
              type: "core",
              status: "active",
              description: "Motor de tarefas e automações",
            },
            {
              id: "core-sla",
              label: "SLA Engine",
              icon: "⏱️",
              type: "core",
              status: "active",
              description: "Motor de SLA e performance",
            },
            {
              id: "core-inventory",
              label: "Inventory Engine",
              icon: "📦",
              type: "core",
              status: "active",
              description: "Motor de estoque e inventário",
            },
            {
              id: "core-permissions",
              label: "Permissions Engine",
              icon: "🔐",
              type: "core",
              status: "active",
              description: "Motor de permissões e acesso",
            },
            {
              id: "core-mentor",
              label: "Mentor IA",
              icon: "🧠",
              type: "core",
              status: "dormant",
              description: "IA mentora do sistema",
              metadata: { state: "dormant" },
            },
          ],
        },
        // Domains
        {
          id: "domains",
          label: "Domains",
          icon: "🌐",
          type: "domain",
          status: "active",
          description: "Domínios operacionais",
          children: [
            {
              id: "domain-restaurant",
              label: "Restaurant",
              icon: "🍽️",
              type: "domain",
              status: isPublished ? "active" : "inactive",
              description: "Domínio de restaurante",
              children: [
                {
                  id: "domain-restaurant-tables",
                  label: "Tables",
                  icon: "🪑",
                  type: "domain",
                  status: isPublished ? "active" : "inactive",
                },
                {
                  id: "domain-restaurant-orders",
                  label: "Orders",
                  icon: "📋",
                  type: "domain",
                  status: isPublished ? "active" : "inactive",
                },
                {
                  id: "domain-restaurant-kds",
                  label: "KDS",
                  icon: "👨‍🍳",
                  type: "domain",
                  status: installedModuleIds.has("kds") ? "active" : "inactive",
                },
                {
                  id: "domain-restaurant-menu",
                  label: "Menu",
                  icon: "📖",
                  type: "domain",
                  status: setupStatus.menu ? "complete" : "incomplete",
                  description: "Cardápio do restaurante",
                },
              ],
            },
            {
              id: "domain-hotel",
              label: "Hotel",
              icon: "🏨",
              type: "domain",
              status: "locked",
              locked: true,
              lockedReason: "Módulo não instalado",
            },
            {
              id: "domain-delivery",
              label: "Delivery",
              icon: "🚚",
              type: "domain",
              status: "locked",
              locked: true,
              lockedReason: "Módulo não instalado",
            },
          ],
        },
        // Installed Modules
        {
          id: "modules",
          label: "Installed Modules",
          icon: "🧩",
          type: "module",
          status: "active",
          description: "Módulos instalados no sistema",
          children: [
            {
              id: "module-tpv",
              label: "TPV",
              icon: "💳",
              type: "module",
              status: installedModuleIds.has("tpv")
                ? "installed"
                : "not_installed",
              description: "Point of Sale - Sistema de vendas",
              installable: true,
              dependencies: ["domain-restaurant"],
            },
            {
              id: "module-kds",
              label: "KDS",
              icon: "👨‍🍳",
              type: "module",
              status: installedModuleIds.has("kds")
                ? "installed"
                : "not_installed",
              description: "Kitchen Display System",
              installable: true,
              dependencies: ["domain-restaurant"],
            },
            {
              id: "module-reservations",
              label: "Reservations",
              icon: "📅",
              type: "module",
              status: installedModuleIds.has("reservations")
                ? "installed"
                : "not_installed",
              description: "Sistema de reservas",
              installable: true,
            },
            {
              id: "module-financial",
              label: "Financial",
              icon: "💰",
              type: "module",
              status: installedModuleIds.has("financial")
                ? "installed"
                : "not_installed",
              description:
                "Módulo financeiro (fluxo de caixa, visão econômica)",
              installable: true,
            },
            {
              id: "module-bank-hours",
              label: "Bank of Hours",
              icon: "⏰",
              type: "module",
              status: installedModuleIds.has("bank_hours")
                ? "installed"
                : "not_installed",
              description: "Banco de horas",
              installable: true,
            },
            {
              id: "module-purchases",
              label: "Purchases",
              icon: "🛒",
              type: "module",
              status: installedModuleIds.has("purchases")
                ? "installed"
                : "not_installed",
              description: "Compras automáticas",
              installable: true,
            },
            {
              id: "module-stock-automation",
              label: "Stock Automation",
              icon: "🤖",
              type: "module",
              status: installedModuleIds.has("stock_automation")
                ? "installed"
                : "not_installed",
              description: "Automação de estoque",
              installable: true,
            },
            {
              id: "module-groups",
              label: "Multi-Unit",
              icon: "🏢",
              type: "module",
              status: installedModuleIds.has("groups")
                ? "installed"
                : "not_installed",
              description: "Gestão multi-unidade, grupos e benchmarks",
              installable: true,
            },
            {
              id: "module-restaurant-web",
              label: "Restaurant Web",
              icon: "🌐",
              type: "module",
              status: installedModuleIds.has("restaurant-web")
                ? "installed"
                : "not_installed",
              description:
                "Página pública do restaurante (menu, presença online, pedidos).",
              installable: false,
              dependencies: ["domain-restaurant-menu"],
              metadata: {
                publicInterface: true,
                dockerTrialRoute: "/public/:slug",
                kind: "public",
                phase: "pilot",
              },
            },
            {
              id: "module-restaurant-web-table",
              label: "Restaurant Web — QR Mesa",
              icon: "🪑",
              type: "module",
              status: "not_installed",
              description:
                "Página pública por mesa (QR_MESA) ligada ao domínio de mesas e pedidos.",
              installable: false,
              dependencies: [
                "domain-restaurant-tables",
                "domain-restaurant-orders",
              ],
              metadata: {
                publicInterface: true,
                dockerTrialRoute: "/public/:slug/mesa/:number",
              },
            },
            {
              id: "module-restaurant-web-status",
              label: "Restaurant Web — Status Pedido",
              icon: "📦",
              type: "module",
              status: "not_installed",
              description:
                "Página pública de status individual do pedido para o cliente final.",
              installable: false,
              dependencies: ["domain-restaurant-orders"],
              metadata: {
                publicInterface: true,
                dockerTrialRoute: "/public/:slug/order/:orderId",
              },
            },
            {
              id: "module-restaurant-public-kds",
              label: "Restaurant Web — KDS Público",
              icon: "📺",
              type: "module",
              status: "not_installed",
              description:
                "Painel público de pedidos prontos (READY) para clientes.",
              installable: false,
              dependencies: [
                "domain-restaurant-orders",
                "domain-restaurant-kds",
              ],
              metadata: {
                publicInterface: true,
                dockerTrialRoute: "/public/:slug/kds",
              },
            },
            {
              id: "module-appstaff",
              label: "AppStaff",
              icon: "🧑‍🍳",
              type: "module",
              status: installedModuleIds.has("appstaff")
                ? "installed"
                : "not_installed",
              description:
                "Sistema operacional do staff (garçom / salão) conectado a pedidos e mesas.",
              installable: true,
              dependencies: [
                "domain-restaurant-tables",
                "domain-restaurant-orders",
                "core-task",
              ],
            },
          ],
        },
        // Configuration
        {
          id: "config",
          label: "Configuration",
          icon: "⚙️",
          type: "config",
          status: "active",
          description: "Configuração do restaurante",
          children: [
            {
              id: "config-identity",
              label: "Identity",
              icon: "🏢",
              type: "config",
              status: setupStatus.identity ? "complete" : "incomplete",
              description: "Identidade do restaurante",
              actionable: true,
            },
            {
              id: "config-location",
              label: "Location",
              icon: "📍",
              type: "config",
              status: setupStatus.location ? "complete" : "incomplete",
              description: "Localização e mesas",
              actionable: true,
            },
            {
              id: "config-schedule",
              label: "Schedule",
              icon: "⏰",
              type: "config",
              status: setupStatus.schedule ? "complete" : "incomplete",
              description: "Horários e turnos",
            },
            {
              id: "config-menu",
              label: "Menu",
              icon: "🍽️",
              type: "config",
              status: setupStatus.menu ? "complete" : "incomplete",
              description: "Cardápio",
            },
            {
              id: "config-people",
              label: "People",
              icon: "👥",
              type: "config",
              status: setupStatus.people ? "complete" : "incomplete",
              description: "Pessoas e funcionários",
            },
            {
              id: "config-payments",
              label: "Payments",
              icon: "💳",
              type: "config",
              status: setupStatus.payments ? "complete" : "incomplete",
              description: "Pagamentos",
            },
            {
              id: "config-integrations",
              label: "Integrations",
              icon: "🔌",
              type: "config",
              status: "complete", // TODO: Buscar do onboarding
              description: "Integrações",
            },
          ],
        },
        // Operation (somente se publicado)
        ...(isPublished
          ? [
              {
                id: "operation",
                label: "Operation",
                icon: "🚀",
                type: "operation",
                status: "active",
                description: "Operação ao vivo",
                children: [
                  {
                    id: "operation-dashboard",
                    label: "Dashboard",
                    icon: "📊",
                    type: "operation",
                    status: "active",
                  },
                  {
                    id: "operation-orders",
                    label: "Live Orders",
                    icon: "📋",
                    type: "operation",
                    status: "active",
                  },
                  {
                    id: "operation-kds",
                    label: "KDS Live",
                    icon: "👨‍🍳",
                    type: "operation",
                    status: installedModuleIds.has("kds")
                      ? "active"
                      : "inactive",
                  },
                  {
                    id: "operation-alerts",
                    label: "Alerts",
                    icon: "⚠️",
                    type: "operation",
                    status: "active",
                  },
                ],
              },
            ]
          : []),
        // Permissions
        {
          id: "permissions",
          label: "Permissions",
          icon: "🔐",
          type: "permission",
          status: "active",
          description: "Permissões e papéis",
          children: [
            {
              id: "permission-owner",
              label: "Owner",
              icon: "👑",
              type: "permission",
              status: "active",
            },
            {
              id: "permission-manager",
              label: "Manager",
              icon: "👔",
              type: "permission",
              status: "active",
            },
            {
              id: "permission-employee",
              label: "Employee",
              icon: "👤",
              type: "permission",
              status: "active",
            },
          ],
        },
        // Data & State
        {
          id: "data",
          label: "Data & State",
          icon: "💾",
          type: "data",
          status: "active",
          description: "Estado e dados do sistema",
          children: [
            {
              id: "data-status",
              label: "Restaurant Status",
              icon: "📊",
              type: "data",
              status: restaurantStatus === "active" ? "active" : "inactive",
              metadata: { value: restaurantStatus },
            },
            {
              id: "data-capabilities",
              label: "Installed Capabilities",
              icon: "🧩",
              type: "data",
              status: "active",
              metadata: { count: installedModuleIds.size },
            },
            {
              id: "data-health",
              label: "Health Score",
              icon: "❤️",
              type: "data",
              status: "active",
              metadata: { score: 85 }, // TODO: Calcular real
            },
            {
              id: "data-events",
              label: "Last Events",
              icon: "📡",
              type: "data",
              status: "active",
            },
            {
              id: "data-terminals",
              label: "Live Terminals",
              icon: "📱",
              type: "data" as const,
              status: (terminals.length > 0
                ? "active"
                : "inactive") as NodeStatus,
              description: "Terminais e dispositivos conectados agora",
              children: terminals.map((t) => {
                const lastPulse = new Date(t.last_heartbeat_at).getTime();
                const now = Date.now();
                const isOnline = now - lastPulse < 60000; // 1 minuto de tolerância

                return {
                  id: `terminal-${t.id}`,
                  label: `${t.name} (${t.type})`,
                  icon: isOnline ? "🟢" : "🔴",
                  type: "data" as const,
                  status: (isOnline ? "active" : "inactive") as NodeStatus,
                  description: `ID: ${t.id} | Ping: ${new Date(
                    t.last_heartbeat_at,
                  ).toLocaleTimeString()}`,
                  metadata: {
                    type: t.type,
                    lastHeartbeat: t.last_heartbeat_at,
                    device: t.metadata?.userAgent,
                  },
                };
              }),
            },
          ],
        },
        // Roadmap / Suggestions
        {
          id: "roadmap",
          label: "Roadmap / Suggestions",
          icon: "🗺️",
          type: "roadmap",
          status: "active",
          description: "Sugestões e próximos passos",
          children: [
            {
              id: "roadmap-next",
              label: "Recommended Next Module",
              icon: "⭐",
              type: "roadmap",
              status: "active",
              metadata: { suggestion: "TPV" }, // TODO: IA sugerir
            },
            {
              id: "roadmap-missing",
              label: "Missing Capabilities",
              icon: "⚠️",
              type: "roadmap",
              status: "active",
            },
            {
              id: "roadmap-optimization",
              label: "Optimization Opportunities",
              icon: "🚀",
              type: "roadmap",
              status: "active",
            },
          ],
        },
      ],
    },
  ];
}
