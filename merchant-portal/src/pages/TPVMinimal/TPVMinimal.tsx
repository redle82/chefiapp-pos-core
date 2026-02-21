/**
 * TPV MINIMAL — CRIADO DO ZERO
 *
 * UI mínima para criar pedidos (write-only).
 *
 * REGRAS:
 * - Criado do zero (sem reutilizar componentes antigos)
 * - Apenas criação de pedidos
 * - Sem estilo (HTML básico)
 * - Usa Docker Core diretamente via dockerCoreClient
 * - Usa RPC create_order_atomic
 * - NÃO usa Supabase antigo
 */

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CONFIG } from "../../config";
import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { isDockerBackend } from "../../core/infra/backendAdapter";
import {
  BlockingScreen,
  useOperationalReadiness,
  usePreflightOperational,
} from "../../core/readiness";
import { useShift } from "../../core/shift/ShiftContext";
import {
  getInstalledDevice,
  getTpvRestaurantId,
} from "../../core/storage/installedDeviceStorage";
import { MenuCache } from "../../core/sync/MenuCache";
import { TerminalEngine } from "../../core/terminal/TerminalEngine";
import { DevicePairingView } from "../../features/auth/connectByCode/DevicePairingView";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { getPilotProducts } from "../../infra/menuPilotFallback";
import { createMenuItem } from "../../infra/writers/MenuWriter";
import { createOrder } from "../../infra/writers/OrderWriter";
import { RestaurantLogo } from "../../ui/RestaurantLogo";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";
import {
  GlobalEmptyView,
  GlobalErrorView,
  GlobalLoadingView,
} from "../../ui/design-system/components";
import { toUserMessage } from "../../ui/errors";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  available: boolean;
  restaurant_id: string;
}

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number; // em centavos
}

/** B1 Onda 4: Venda para Balcão (sem mesa) ou para uma mesa. Uma escolha; sem configuração. */
type SaleContext = "balcao" | { table_id: string; table_number: number };

/** Seed do Core Docker; fallback quando backend é Docker. Caso contrário, Restaurante Alpha (legado). */
const DEFAULT_RESTAURANT_ID = isDockerBackend()
  ? "00000000-0000-0000-0000-000000000100"
  : "bbce08c7-63c0-473d-b693-ec2997f73a68";
const STORAGE_KEY = "chefiapp_tpv_draft_v1";

/** Preview onboarding: lista de exemplo fixa (moeda €) quando não há produtos do Core. */
function getPreviewExampleProducts(restaurantId: string): Product[] {
  return [
    {
      id: "preview-cafe",
      name: "Café",
      price_cents: 250,
      available: true,
      restaurant_id: restaurantId,
    },
    {
      id: "preview-agua",
      name: "Água",
      price_cents: 100,
      available: true,
      restaurant_id: restaurantId,
    },
  ];
}

interface TpvDraftState {
  cart: CartItem[];
  saleContext: SaleContext;
  paymentMethod: "cash" | "card" | "other";
}

function loadDraftState(): TpvDraftState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function TPVMinimal({
  mode = "live",
}: {
  /** preview = onboarding Tela 6: sem abrir turno, sem persistir vendas. */
  mode?: "preview" | "live";
} = {}) {
  const isPreview = mode === "preview";

  // --- HOOKS ---
  const readiness = useOperationalReadiness("TPV");
  const { identity } = useRestaurantIdentity();
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const bootstrap = useBootstrapState();
  const globalUI = useGlobalUIState();
  const preflight = usePreflightOperational({ healthAutoStart: !isPreview });
  const shift = useShift();
  const toast = useToast();

  // State initialization with Persistence
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(
    () => loadDraftState()?.cart || [],
  );
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  /** B1: mesa ou balcão — default Balcão (uma escolha; sem configuração). */
  const [saleContext, setSaleContext] = useState<SaleContext>(
    () => loadDraftState()?.saleContext || "balcao",
  );
  const [tables, setTables] = useState<{ id: string; number: number }[]>([]);

  /** B5 Onda 4: método de pagamento — 1 ação; método escolhido. */
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "other">(
    () => loadDraftState()?.paymentMethod || "cash",
  );

  /** Evita rajada de pedidos quando o Core está em baixo (fail-fast). */
  const [isCoreUnreachable, setIsCoreUnreachable] = useState(false);
  /** Abrir turno em progresso (evita duplo clique). */
  const [openingTurn, setOpeningTurn] = useState(false);

  // --- DERIVED STATE ---
  const installedRestaurantId = getTpvRestaurantId();
  const runtimeRestaurantId = runtime?.restaurant_id ?? null;
  const restaurantId =
    installedRestaurantId ??
    runtimeRestaurantId ??
    (CONFIG.DEBUG_DIRECT_FLOW ? DEFAULT_RESTAURANT_ID : null);

  const effectiveRestaurantId = restaurantId ?? DEFAULT_RESTAURANT_ID;

  const canCreateOrder =
    isPreview ||
    (readiness.ready &&
      bootstrap.coreStatus === "online" &&
      bootstrap.publishStatus === "publicado");

  // --- HELPER FUNCTIONS ---
  // Carregar produtos do cardápio via Docker Core; quando offline/unreachable tenta menu em cache (IndexedDB).
  const loadProducts = async (isCoreReachable: boolean | undefined) => {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (!isCoreReachable || isOffline) {
      const cached = await MenuCache.get(effectiveRestaurantId).catch(
        () => null,
      );
      const menuLike = cached as {
        fullCatalog?: Array<{
          products?: Array<{
            id: string;
            name: string;
            price_cents: number;
            available?: boolean;
          }>;
        }>;
      } | null;
      if (
        menuLike?.fullCatalog &&
        Array.isArray(menuLike.fullCatalog) &&
        menuLike.fullCatalog.length > 0
      ) {
        const list: Product[] = [];
        for (const cat of menuLike.fullCatalog) {
          for (const p of cat.products ?? []) {
            list.push({
              id: p.id,
              name: p.name,
              price_cents: p.price_cents,
              available: p.available ?? true,
              restaurant_id: effectiveRestaurantId,
            });
          }
        }
        if (list.length > 0) {
          setProducts(list);
          setIsCoreUnreachable(false);
          globalUI.setScreenEmpty(false);
          globalUI.setScreenLoading(false);
          return;
        }
      }
      setProducts([]);
      setIsCoreUnreachable(true);
      globalUI.setScreenEmpty(true);
      globalUI.setScreenLoading(false);
      return;
    }
    // Guardrail FK: quando Core está reachable, não usar pilot products (IDs podem não existir em gm_products)
    // CONFIG_RUNTIME_CONTRACT: só produtos com available=true e restaurant_id=X; Config Web é fonte de verdade (docs/contracts/CONFIG_RUNTIME_CONTRACT.md).
    try {
      globalUI.setScreenLoading(true);
      globalUI.setScreenError(null);

      const DOCKER_CORE_URL = CONFIG.CORE_URL;
      const DOCKER_CORE_ANON_KEY = CONFIG.CORE_ANON_KEY;
      // Determine base URL: if CORE_URL already ends with /rest, append /v1; else append /rest/v1
      const baseUrl = DOCKER_CORE_URL?.endsWith("/rest")
        ? `${DOCKER_CORE_URL}/v1`
        : `${DOCKER_CORE_URL || ""}/rest/v1`;

      const url = `${baseUrl}/gm_products?select=*&restaurant_id=eq.${effectiveRestaurantId}&available=eq.true&order=created_at.asc`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: DOCKER_CORE_ANON_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar produtos.");
      }

      const data = await response.json();
      const list = (data || []) as Product[];

      // Guardrail FK: quando Core está reachable e lista vazia, não usar pilot products (evitar 409)
      setProducts(list);
      globalUI.setScreenEmpty(list.length === 0);
      setIsCoreUnreachable(false);
    } catch (err) {
      const cached = await MenuCache.get(effectiveRestaurantId).catch(
        () => null,
      );
      const menuLike = cached as {
        fullCatalog?: Array<{
          products?: Array<{
            id: string;
            name: string;
            price_cents: number;
            available?: boolean;
          }>;
        }>;
      } | null;
      if (
        menuLike?.fullCatalog &&
        Array.isArray(menuLike.fullCatalog) &&
        menuLike.fullCatalog.length > 0
      ) {
        const list: Product[] = [];
        for (const cat of menuLike.fullCatalog) {
          for (const p of cat.products ?? []) {
            list.push({
              id: p.id,
              name: p.name,
              price_cents: p.price_cents,
              available: p.available ?? true,
              restaurant_id: effectiveRestaurantId,
            });
          }
        }
        if (list.length > 0) {
          setProducts(list);
          setIsCoreUnreachable(false);
          globalUI.setScreenEmpty(false);
          globalUI.setScreenError(null);
          globalUI.setScreenLoading(false);
          return;
        }
      }
      setIsCoreUnreachable(true);
      setProducts([]);
      globalUI.setScreenEmpty(true);
      globalUI.setScreenError(toUserMessage(err, "Erro ao carregar produtos."));
    } finally {
      globalUI.setScreenLoading(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (isPreview) {
      // Preview: nunca mostrar erros de Core; sempre mostrar produtos (reais ou exemplo com moeda €).
      const pilot = getPilotProducts(effectiveRestaurantId);
      const list =
        pilot.length > 0
          ? pilot.map((p) => ({
              id: p.id,
              name: p.name,
              price_cents: p.price_cents,
              available: p.available ?? true,
              restaurant_id: p.restaurant_id ?? effectiveRestaurantId,
            }))
          : getPreviewExampleProducts(effectiveRestaurantId);
      setProducts(list);
      globalUI.setScreenEmpty(false);
      globalUI.setScreenLoading(false);
      globalUI.setScreenError(null);
      return;
    }
    const shouldLoad =
      CONFIG.DEBUG_DIRECT_FLOW || bootstrap.coreStatus === "online";
    if (shouldLoad) {
      loadProducts(true);
    } else {
      // Offline / Core unreachable: try menu cache (loadProducts(false) tries cache)
      loadProducts(false);
    }
  }, [effectiveRestaurantId, bootstrap.coreStatus, isPreview]);

  // PERSISTENCE: Save state changes
  useEffect(() => {
    const draft: TpvDraftState = {
      cart,
      saleContext,
      paymentMethod,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [cart, saleContext, paymentMethod]);

  // B1 Onda 4: Carregar mesas (gm_tables) para escolha mesa ou balcão; só quando Core online
  useEffect(() => {
    if (bootstrap.coreStatus !== "online") {
      setTables([]);
      return;
    }
    const DOCKER_CORE_URL = CONFIG.CORE_URL;
    const DOCKER_CORE_ANON_KEY = CONFIG.CORE_ANON_KEY;
    // Determine base URL: if CORE_URL already ends with /rest, append /v1; else append /rest/v1
    const baseUrl = DOCKER_CORE_URL?.endsWith("/rest")
      ? `${DOCKER_CORE_URL}/v1`
      : `${DOCKER_CORE_URL || ""}/rest/v1`;
    const url = `${baseUrl}/gm_tables?select=id,number&restaurant_id=eq.${effectiveRestaurantId}&order=number.asc`;
    fetch(url, {
      method: "GET",
      headers: {
        apikey: DOCKER_CORE_ANON_KEY,
        "Content-Type": "application/json",
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: string; number: number }[]) => {
        setTables(Array.isArray(data) ? data : []);
      })
      .catch(() => setTables([]));
  }, [effectiveRestaurantId, bootstrap.coreStatus]);

  // TERMINAL_INSTALLATION_RITUAL: heartbeat para gm_terminals (dashboard mostra Online)
  useEffect(() => {
    const device = getInstalledDevice();
    if (!device || device.module_id !== "tpv") return;
    const send = () =>
      TerminalEngine.sendHeartbeat({
        restaurantId: device.restaurant_id,
        type: "TPV",
        name: device.device_name,
      });
    send();
    const interval = setInterval(send, 30_000);
    return () => clearInterval(interval);
  }, []);

  // --- EARLY RETURNS (Render Logic) ---
  // Vincular dispositivo (PIN) ou instalar no portal — CODE_AND_DEVICE_PAIRING_CONTRACT
  if (!restaurantId && !CONFIG.DEBUG_DIRECT_FLOW && !isPreview) {
    return (
      <>
        <DevicePairingView deviceType="tpv" />
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <Link
            to="/admin/modules"
            style={{
              fontSize: 14,
              color: "#a3a3a3",
              textDecoration: "underline",
            }}
          >
            Ou instalar TPV no portal
          </Link>
        </div>
      </>
    );
  }

  if (isCoreUnreachable && !isPreview) {
    return <BlockingScreen reason="CORE_OFFLINE" />;
  }

  if (readiness.loading && !isPreview) {
    return (
      <GlobalLoadingView
        message="Verificando estado operacional..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }
  if (
    !isPreview &&
    !readiness.ready &&
    readiness.uiDirective === "SHOW_BLOCKING_SCREEN"
  ) {
    return (
      <BlockingScreen
        reason={readiness.blockingReason}
        redirectTo={readiness.redirectTo}
      />
    );
  }
  if (
    !isPreview &&
    !readiness.ready &&
    readiness.uiDirective === "REDIRECT" &&
    readiness.redirectTo
  ) {
    return <Navigate to={readiness.redirectTo} replace />;
  }

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);

    if (existingItem) {
      // Incrementar quantidade
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      // Adicionar novo item
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.price_cents || 0,
        },
      ]);
    }
  };

  // Remover item do carrinho
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  // Atualizar quantidade no carrinho
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  // Calcular total do carrinho
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  // TENTEI IMPORTAR createMenuItem mas não está no escopo deste arquivo.
  // Vou usar fetch direto para upsert se necessário, ou melhor:
  // Como `createMenuItem` é exportado de ../../infra/writers/MenuWriter
  // precisamos importar no topo do arquivo. Vou adicionar o import via replace separado ou assumir que fiz.
  // Criar pedido via Docker Core RPC; guardrail bootstrap: não disparar sem estado válido
  const handleCreateOrder = async () => {
    if (cart.length === 0) return;
    if (!canCreateOrder) return;

    // Onboarding 5min Tela 6: preview — não persistir, só simular
    if (isPreview) {
      setCreating(true);
      setSuccess(null);
      setTimeout(() => {
        setSuccess("Preview — pedido simulado (não gravado)");
        setCart([]);
        setSaleContext("balcao");
        setPaymentMethod("cash");
        setCreating(false);
      }, 400);
      return;
    }

    if (
      bootstrap.coreStatus !== "online" ||
      bootstrap.publishStatus !== "publicado"
    )
      return;

    try {
      setCreating(true);
      globalUI.setScreenError(null);
      setSuccess(null);

      // FASE 2: Just-in-Time Sync (Sync de produtos locais antes da venda)
      // Se estamos ONLINE, precisamos garantir que produtos criados em Offline/Fallback
      // sejam criados no Core antes do pedido, senão dá FK Error (409 Conflict).
      if (bootstrap.coreStatus === "online" && !isCoreUnreachable) {
        const pilotProducts = getPilotProducts(effectiveRestaurantId);
        const cartProductIds = new Set(cart.map((c) => c.product_id));

        // Identificar produtos que estão no carrinho e precisam de sync
        // Otimização: Só tentamos sync se o produto estiver na lista "Local/Pilot".
        // Se o produto veio do Core (useProducts), ele não estará em getPilotProducts (idealmente).
        // Mas o fallback atual do Menu Builder adiciona a pilotProducts mesmo quando online (para resiliência).
        // Então, "tente criar se não existir".
        // Como não temos validação barata de "existe", tentamos createMenuItem passando o ID.
        // O MenuWriter foi alterado para aceitar ID opcional.
        // Se já existe, o createMenuItem pode falhar com Unique Constraint (409) no NOME ou ID.
        // Se falhar, assumimos que já existe e seguimos.

        for (const pid of cartProductIds) {
          const localDef = pilotProducts.find((p) => p.id === pid);
          if (localDef) {
            // Este produto tem definição local. Pode ser que não exista no servidor.
            // Tentar Sync "Best Effort"
            try {
              // Mapear CoreProduct -> MenuItemInput
              // PRECISÃO: O tipo localDef é CoreProduct (do reader). MenuItemInput é ligeiramente diferente.
              // MenuItemInput pede prep_time_minutes, CoreProduct tem seconds.
              await createMenuItem(effectiveRestaurantId, {
                id: localDef.id, // ID local mantido!
                name: localDef.name,
                price_cents: localDef.price_cents,
                station: (localDef.station as "BAR" | "KITCHEN") || "KITCHEN",
                prep_time_minutes: (localDef.prep_time_seconds || 300) / 60,
                prep_category: (localDef.prep_category as any) || "main",
                available: localDef.available ?? true,
                category_id: localDef.category_id || undefined,
              });
              console.log(
                `[TPV] JIT Sync: Produto ${localDef.name} sincronizado com sucesso.`,
              );
            } catch (syncErr: any) {
              // Se erro for conflito (já existe), tudo bem.
              // O MenuWriter joga erro se 409.
              const msg = syncErr.message || "";
              if (
                msg.includes("existe") ||
                msg.includes("409") ||
                msg.includes("duplicate") ||
                msg.includes("unique")
              ) {
                // Já existe, ignorar.
              } else {
                console.warn(
                  `[TPV] Falha no JIT Sync do produto ${pid}:`,
                  syncErr,
                );
                // Não bloqueamos a venda por falha de sync, tentamos a sorte.
                // Se falhar mesmo, o createOrder vai estourar e o usuário vê o erro.
              }
            }
          }
        }
      }

      // Preparar itens para o RPC — array obrigatório (Core espera jsonb_array_elements); contrato OrderItemInput; quantity >= 1
      const items = cart
        .filter((item) => item.quantity >= 1)
        .map((item) => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

      const tableId =
        typeof saleContext === "object" && saleContext?.table_id
          ? saleContext.table_id
          : null;

      const result = await createOrder(
        effectiveRestaurantId,
        items,
        "WEB",
        paymentMethod,
        tableId ? { table_id: tableId } : undefined,
      );

      // SUCESSO!
      // Se pagamento for Dinheiro/Cartão (Simulado no TPV), marcar pago.
      // Fluxo simplificado: se "cash" ou "card" -> tentar fechar a conta (mock ou rpc real)
      // O createOrder retorna o pedido criado.

      // Tentar registrar pagamento se RPC disponível e caixa aberto (Opcional, Bônus)
      // Aqui mantemos a lógica original de sucesso apenas limpando o carrinho.

      const DOCKER_CORE_URL = CONFIG.CORE_URL;
      const DOCKER_CORE_ANON_KEY = CONFIG.CORE_ANON_KEY;
      // Determine base URL: if CORE_URL already ends with /rest, append /v1; else append /rest/v1
      const baseUrl = DOCKER_CORE_URL?.endsWith("/rest")
        ? `${DOCKER_CORE_URL}/v1`
        : `${DOCKER_CORE_URL || ""}/rest/v1`;
      // RPC base: if CORE_URL ends with /rest, use parent; else use CORE_URL
      const rpcBaseUrl = DOCKER_CORE_URL?.endsWith("/rest")
        ? DOCKER_CORE_URL.slice(0, -5)
        : DOCKER_CORE_URL || "";
      const regUrl = `${baseUrl}/gm_cash_registers?restaurant_id=eq.${effectiveRestaurantId}&status=eq.open&limit=1`;
      const regRes = await fetch(regUrl, {
        method: "GET",
        headers: {
          apikey: DOCKER_CORE_ANON_KEY,
          "Content-Type": "application/json",
        },
      });
      const registers = regRes.ok ? await regRes.json() : [];
      const cashRegisterId = registers?.[0]?.id;
      if (cashRegisterId) {
        const payRes = await fetch(`${rpcBaseUrl}/rpc/process_order_payment`, {
          method: "POST",
          headers: {
            apikey: DOCKER_CORE_ANON_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_restaurant_id: effectiveRestaurantId,
            p_order_id: result.id,
            p_cash_register_id: cashRegisterId,
            p_operator_id: null,
            p_amount_cents: result.total_cents,
            p_method: paymentMethod,
            p_idempotency_key: `${result.id}-${Date.now()}`,
          }),
        });
        const payData = payRes.ok ? await payRes.json() : null;
        if (payData?.success) {
          setSuccess(
            `Pedido #${result.id.slice(
              0,
              8,
            )} pago (${paymentMethod}). Total: € ${(
              result.total_cents / 100
            ).toFixed(2)}`,
          );
        } else {
          setSuccess(
            `Pedido #${result.id.slice(0, 8)} criado. Total: € ${(
              result.total_cents / 100
            ).toFixed(2)} (caixa fechado: pagar no TPV)`,
          );
        }
      } else {
        setSuccess(
          `Pedido #${result.id.slice(0, 8)} criado. Total: € ${(
            result.total_cents / 100
          ).toFixed(2)} (abrir caixa para registar pagamento)`,
        );
      }
      setCart([]);
      setSaleContext("balcao"); // Reset properties to default
      setPaymentMethod("cash");
      localStorage.removeItem(STORAGE_KEY); // Clear draft
    } catch (err) {
      globalUI.setScreenError(
        toUserMessage(
          err,
          `Não foi possível registar o pedido: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
    } finally {
      setCreating(false);
    }
  };

  if (globalUI.isLoadingCritical) {
    return (
      <GlobalLoadingView
        message="Carregando produtos..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  // DEBUG_DIRECT_FLOW: mostrar TPV e carregar produtos sem operacao-real/coreStatus.
  if (
    !CONFIG.DEBUG_DIRECT_FLOW &&
    bootstrap.operationMode !== "operacao-real"
  ) {
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, color: "#fafafa" }}>TPV Mínimo</h1>
        <p style={{ color: "#a3a3a3", textAlign: "center", maxWidth: 400 }}>
          Complete o bootstrap e tenha o Core online para criar pedidos.
        </p>
        <Link
          to="/bootstrap"
          style={{
            color: "#22c55e",
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          Ir ao Bootstrap
        </Link>
      </div>
    );
  }

  if (!CONFIG.DEBUG_DIRECT_FLOW && bootstrap.coreStatus !== "online") {
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, color: "#fafafa" }}>TPV Mínimo</h1>
        <p style={{ color: "#a3a3a3", textAlign: "center", maxWidth: 400 }}>
          Sistema em preparação. Complete o bootstrap e tenha o Core online para
          criar pedidos.
        </p>
        <Link
          to="/bootstrap"
          style={{
            color: "#22c55e",
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          Ir para Bootstrap
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
      }}
    >
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      {!isPreview && globalUI.isBlockedByShift && (
        <div
          style={{
            padding: "16px",
            marginBottom: "20px",
            backgroundColor: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#b91c1c",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <strong>Caixa Fechado:</strong> Para realizar vendas reais, você
            precisa abrir o turno.
          </div>
          <button
            type="button"
            disabled={openingTurn}
            onClick={async () => {
              if (
                preflight.coreStatus !== "UP" &&
                preflight.coreStatus !== "DEGRADED"
              ) {
                toast.warning(
                  "Core offline — não é possível abrir turno agora.",
                );
                return;
              }
              if (!effectiveRestaurantId) {
                toast.error("Restaurante não identificado.");
                return;
              }
              setOpeningTurn(true);
              try {
                const { data, error: rpcError } = await dockerCoreClient.rpc(
                  "open_cash_register_atomic",
                  {
                    p_restaurant_id: effectiveRestaurantId,
                    p_name: "Caixa Principal",
                    p_opened_by: "Operador TPV",
                    p_opening_balance_cents: 0,
                  },
                );
                if (rpcError) {
                  if (
                    rpcError.message?.includes("CASH_REGISTER_ALREADY_OPEN")
                  ) {
                    // Backend diz que já está aberto: alinhar UI e informar, sem erro.
                    shift?.markShiftOpen?.();
                    await shift?.refreshShiftStatus?.();
                    toast.success("Caixa já estava aberto. Pode vender.");
                    return;
                  }
                  toast.error(rpcError.message || "Erro ao abrir turno.");
                  return;
                }
                const rpcData = data as { id?: string } | null;
                if (rpcData?.id) {
                  await shift?.refreshShiftStatus?.();
                  toast.success("Turno aberto. Pode vender.");
                } else {
                  toast.error("Erro ao abrir turno. Tente de novo.");
                }
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ? err.message : "Erro ao abrir turno.";
                toast.error(msg);
              } finally {
                setOpeningTurn(false);
              }
            }}
            style={{
              backgroundColor: "#b91c1c",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: openingTurn ? "wait" : "pointer",
              fontWeight: "bold",
            }}
          >
            {openingTurn ? "A abrir…" : "Abrir Turno"}
          </button>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <RestaurantLogo
          logoUrl={identity.logoUrl}
          name={identity.name || "Restaurante"}
          size={44}
        />
        <h1 style={{ margin: 0, color: "#fafafa" }}>
          TPV Mínimo — {identity.name || "Criar Pedido"}
        </h1>
      </div>
      <div
        style={{ fontSize: "0.9rem", color: "#a3a3a3", marginBottom: "20px" }}
      >
        Ligação: {import.meta.env.VITE_CORE_URL ? "Ativa" : "Não configurada"}
      </div>

      {!isPreview && globalUI.isError && globalUI.errorMessage && (
        <div style={{ marginBottom: "10px" }}>
          <GlobalErrorView
            message={globalUI.errorMessage}
            title="Erro"
            layout="operational"
            variant="inline"
          />
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#14532d",
            color: "#dcfce7",
            marginBottom: "10px",
            borderRadius: "4px",
          }}
        >
          {success}
        </div>
      )}

      {/* B1 Onda 4: Escolha mesa ou balcão — uma escolha; sem configuração */}
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
          Venda para:
        </span>
        <button
          type="button"
          onClick={() => setSaleContext("balcao")}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #404040",
            backgroundColor:
              saleContext === "balcao" ? "#262626" : "transparent",
            color: "#fafafa",
            cursor: "pointer",
            fontWeight: saleContext === "balcao" ? 600 : 400,
          }}
        >
          Balcão
        </button>
        {tables.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() =>
              setSaleContext({ table_id: t.id, table_number: t.number })
            }
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #404040",
              backgroundColor:
                saleContext !== "balcao" && saleContext.table_id === t.id
                  ? "#262626"
                  : "transparent",
              color: "#fafafa",
              cursor: "pointer",
              fontWeight:
                saleContext !== "balcao" && saleContext.table_id === t.id
                  ? 600
                  : 400,
            }}
          >
            Mesa {t.number}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >
        {/* Lista de Produtos */}
        <div>
          <h2 style={{ margin: "0 0 12px 0", color: "#fafafa" }}>
            Produtos Disponíveis
          </h2>
          {!isPreview && !preflight.canLoadProducts ? (
            <div
              style={{
                padding: "16px",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#e5e7eb",
                fontSize: "14px",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                Core offline. Sem catálogo carregado.
              </div>
              <p style={{ margin: "0 0 12px 0", color: "#9ca3af" }}>
                Inicie o Core para operar.
              </p>
              <Link
                to="/app/runbook-core"
                style={{
                  color: "#60a5fa",
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
              >
                Ver instruções
              </Link>
            </div>
          ) : !isPreview && globalUI.isEmpty ? (
            <div
              style={{
                padding: "16px",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#e5e7eb",
                fontSize: "14px",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                Nenhum produto disponível
              </div>
              <p style={{ margin: "0 0 12px 0", color: "#9ca3af" }}>
                Adicione produtos no Menu Builder.
              </p>
              <Link
                to="/menu-builder"
                style={{
                  color: "#60a5fa",
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
              >
                Menu Builder
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    border: "1px solid #262626",
                    backgroundColor: "#141414",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "#fafafa",
                  }}
                  onClick={() => addToCart(product)}
                >
                  <div style={{ fontWeight: "bold" }}>{product.name}</div>
                  <div style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
                    € {((product.price_cents || 0) / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carrinho */}
        <div>
          <h2 style={{ margin: "0 0 12px 0", color: "#fafafa" }}>Carrinho</h2>
          {cart.length === 0 ? (
            <GlobalEmptyView
              title="Carrinho vazio"
              description="Adicione produtos ao carrinho para criar um pedido."
              layout="operational"
              variant="inline"
            />
          ) : (
            <>
              <div style={{ marginBottom: "10px" }}>
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      border: "1px solid #262626",
                      backgroundColor: "#141414",
                      marginBottom: "5px",
                      borderRadius: "8px",
                      color: "#fafafa",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold" }}>{item.name}</div>
                      <div style={{ fontSize: "0.9rem", color: "#a3a3a3" }}>
                        € {(item.unit_price / 100).toFixed(2)} x {item.quantity}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                        style={{
                          marginRight: "5px",
                          padding: "4px 8px",
                          backgroundColor: "#262626",
                          color: "#fafafa",
                          border: "1px solid #404040",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        -
                      </button>
                      <span style={{ margin: "0 10px" }}>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                        style={{
                          marginLeft: "5px",
                          padding: "4px 8px",
                          backgroundColor: "#262626",
                          color: "#fafafa",
                          border: "1px solid #404040",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        style={{
                          marginLeft: "10px",
                          padding: "4px 8px",
                          backgroundColor: "#7f1d1d",
                          color: "#fca5a5",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* B5 Onda 4: Escolha método de pagamento — 1 ação; método escolhido */}
              <div
                style={{
                  marginBottom: "10px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
                  Pagamento:
                </span>
                {(["cash", "card", "other"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #404040",
                      backgroundColor:
                        paymentMethod === method ? "#262626" : "transparent",
                      color: "#fafafa",
                      cursor: "pointer",
                      fontWeight: paymentMethod === method ? 600 : 400,
                    }}
                  >
                    {method === "cash"
                      ? "Dinheiro"
                      : method === "card"
                      ? "Cartão"
                      : "Outro"}
                  </button>
                ))}
              </div>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#262626",
                  borderRadius: "8px",
                  marginBottom: "10px",
                  color: "#fafafa",
                }}
              >
                <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  Total: € {(cartTotal / 100).toFixed(2)}
                </div>
              </div>
              <button
                onClick={handleCreateOrder}
                disabled={
                  creating ||
                  cart.length === 0 ||
                  (!isPreview &&
                    (globalUI.isBlockedByShift ||
                      bootstrap.coreStatus !== "online" ||
                      bootstrap.publishStatus !== "publicado" ||
                      !canCreateOrder))
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor:
                    creating || cart.length === 0
                      ? "#ccc"
                      : isPreview
                      ? "#22c55e"
                      : globalUI.isBlockedByShift ||
                        bootstrap.coreStatus !== "online" ||
                        bootstrap.publishStatus !== "publicado" ||
                        !canCreateOrder
                      ? "#ccc"
                      : "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    creating || cart.length === 0 ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {isPreview
                  ? creating
                    ? "A simular..."
                    : "Simular venda"
                  : creating
                  ? "Criando Pedido..."
                  : globalUI.isBlockedByShift
                  ? "Caixa Fechado"
                  : bootstrap.coreStatus !== "online" ||
                    bootstrap.publishStatus !== "publicado" ||
                    !canCreateOrder
                  ? "Publicação ou Core em falta"
                  : "Criar Pedido"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
