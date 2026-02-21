function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CONFIG } from "../../config";
import { useLifecycleStateContext } from "../../context/LifecycleStateContext";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useAuth } from "../auth/useAuth";
import { getRestaurantStatus } from "../billing/coreBillingApi";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { getTableClient } from "../infra/coreRpc";
import type { RestaurantLifecycleState } from "../lifecycle/LifecycleState";
import { deriveLifecycleState, deriveSystemState, getCanonicalDestination, isPathAllowedForState } from "../lifecycle/LifecycleState";
import { INVALID_OR_SEED_RESTAURANT_IDS, SOFIA_RESTAURANT_ID, TRIAL_RESTAURANT_ID, hasOperationalRestaurant } from "../readiness/operationalRestaurant";
import { isTrial } from "../runtime";
import { isDebugEnabled, isDevStableMode } from "../runtime/devStableMode";
import { getTabIsolated, setTabIsolated } from "../storage/TabIsolatedStorage";
import { clearActiveTenant, getActiveTenant, isTenantSealed, setActiveTenant } from "../tenant/TenantResolver";
import type { UserState } from "./CoreFlow";
import { resolveNextRoute } from "./CoreFlow";

/**
 * FlowGate - O Executor do Contrato (DB-First Edition + Multi-Tenant)
 *
 * 🔒 ARQUITETURA LOCKED (E2E_FLOW = LOCKED)
 */

const TENANT_EXEMPT_ROUTES = stryMutAct_9fa48("303") ? [] : (stryCov_9fa48("303"), [stryMutAct_9fa48("304") ? "" : (stryCov_9fa48("304"), "/app/select-tenant"), stryMutAct_9fa48("305") ? "" : (stryCov_9fa48("305"), "/app/access-denied")]);
const UUID_REGEX = stryMutAct_9fa48("317") ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[^0-9a-f]{12}$/i : stryMutAct_9fa48("316") ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]$/i : stryMutAct_9fa48("315") ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[^0-9a-f]{4}-[0-9a-f]{12}$/i : stryMutAct_9fa48("314") ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]-[0-9a-f]{12}$/i : stryMutAct_9fa48("313") ? /^[0-9a-f]{8}-[0-9a-f]{4}-[^0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : stryMutAct_9fa48("312") ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]-[0-9a-f]{4}-[0-9a-f]{12}$/i : stryMutAct_9fa48("311") ? /^[0-9a-f]{8}-[^0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : stryMutAct_9fa48("310") ? /^[0-9a-f]{8}-[0-9a-f]-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : stryMutAct_9fa48("309") ? /^[^0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : stryMutAct_9fa48("308") ? /^[0-9a-f]-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : stryMutAct_9fa48("307") ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i : stryMutAct_9fa48("306") ? /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : (stryCov_9fa48("306", "307", "308", "309", "310", "311", "312", "313", "314", "315", "316", "317"), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
export function FlowGate({
  children
}: {
  children: ReactNode;
}) {
  if (stryMutAct_9fa48("318")) {
    {}
  } else {
    stryCov_9fa48("318");
    const {
      session,
      loading: sessionLoading
    } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const {
      setLifecycleState
    } = useLifecycleStateContext();
    const [isChecking, setIsChecking] = useState(stryMutAct_9fa48("319") ? false : (stryCov_9fa48("319"), true));
    const lastCheckRef = useRef<{
      key: string;
      ts: number;
    }>(stryMutAct_9fa48("320") ? {} : (stryCov_9fa48("320"), {
      key: stryMutAct_9fa48("321") ? "Stryker was here!" : (stryCov_9fa48("321"), ""),
      ts: 0
    }));
    const lastNavigateRef = useRef<{
      to: string;
      ts: number;
    }>(stryMutAct_9fa48("322") ? {} : (stryCov_9fa48("322"), {
      to: stryMutAct_9fa48("323") ? "Stryker was here!" : (stryCov_9fa48("323"), ""),
      ts: 0
    }));
    const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDocker = stryMutAct_9fa48("326") ? getBackendType() !== BackendType.docker : stryMutAct_9fa48("325") ? false : stryMutAct_9fa48("324") ? true : (stryCov_9fa48("324", "325", "326"), getBackendType() === BackendType.docker);
    const LOADING_TIMEOUT_MS = isDocker ? 5000 : 15000;
    useEffect(() => {
      if (stryMutAct_9fa48("327")) {
        {}
      } else {
        stryCov_9fa48("327");
        let mounted = stryMutAct_9fa48("328") ? false : (stryCov_9fa48("328"), true);
        loadingTimeoutRef.current = setTimeout(() => {
          if (stryMutAct_9fa48("329")) {
            {}
          } else {
            stryCov_9fa48("329");
            if (stryMutAct_9fa48("331") ? false : stryMutAct_9fa48("330") ? true : (stryCov_9fa48("330", "331"), mounted)) {
              if (stryMutAct_9fa48("332")) {
                {}
              } else {
                stryCov_9fa48("332");
                clearLoadingTimeout();
                setIsChecking(stryMutAct_9fa48("333") ? true : (stryCov_9fa48("333"), false));
              }
            }
          }
        }, LOADING_TIMEOUT_MS);
        const clearLoadingTimeout = () => {
          if (stryMutAct_9fa48("334")) {
            {}
          } else {
            stryCov_9fa48("334");
            if (stryMutAct_9fa48("336") ? false : stryMutAct_9fa48("335") ? true : (stryCov_9fa48("335", "336"), loadingTimeoutRef.current)) {
              if (stryMutAct_9fa48("337")) {
                {}
              } else {
                stryCov_9fa48("337");
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
            }
          }
        };
        const checkFlow = async () => {
          if (stryMutAct_9fa48("338")) {
            {}
          } else {
            stryCov_9fa48("338");
            const pathname = location.pathname;
            const sealed = isTenantSealed();
            const localRestaurantId = stryMutAct_9fa48("341") ? getTabIsolated("chefiapp_restaurant_id") && (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null) : stryMutAct_9fa48("340") ? false : stryMutAct_9fa48("339") ? true : (stryCov_9fa48("339", "340", "341"), getTabIsolated(stryMutAct_9fa48("342") ? "" : (stryCov_9fa48("342"), "chefiapp_restaurant_id")) || ((stryMutAct_9fa48("345") ? typeof window === "undefined" : stryMutAct_9fa48("344") ? false : stryMutAct_9fa48("343") ? true : (stryCov_9fa48("343", "344", "345"), typeof window !== (stryMutAct_9fa48("346") ? "" : (stryCov_9fa48("346"), "undefined")))) ? window.localStorage.getItem(stryMutAct_9fa48("347") ? "" : (stryCov_9fa48("347"), "chefiapp_restaurant_id")) : null));
            const hasLocalOrg = stryMutAct_9fa48("350") ? sealed && hasOperationalRestaurant({
              restaurant_id: localRestaurantId
            }) : stryMutAct_9fa48("349") ? false : stryMutAct_9fa48("348") ? true : (stryCov_9fa48("348", "349", "350"), sealed || hasOperationalRestaurant(stryMutAct_9fa48("351") ? {} : (stryCov_9fa48("351"), {
              restaurant_id: localRestaurantId
            })));
            const safeNavigate = (to: string) => {
              if (stryMutAct_9fa48("352")) {
                {}
              } else {
                stryCov_9fa48("352");
                if (stryMutAct_9fa48("355") ? pathname !== to : stryMutAct_9fa48("354") ? false : stryMutAct_9fa48("353") ? true : (stryCov_9fa48("353", "354", "355"), pathname === to)) return;
                const now = Date.now();
                if (stryMutAct_9fa48("358") ? lastNavigateRef.current.to === to || now - lastNavigateRef.current.ts < 1500 : stryMutAct_9fa48("357") ? false : stryMutAct_9fa48("356") ? true : (stryCov_9fa48("356", "357", "358"), (stryMutAct_9fa48("360") ? lastNavigateRef.current.to !== to : stryMutAct_9fa48("359") ? true : (stryCov_9fa48("359", "360"), lastNavigateRef.current.to === to)) && (stryMutAct_9fa48("363") ? now - lastNavigateRef.current.ts >= 1500 : stryMutAct_9fa48("362") ? now - lastNavigateRef.current.ts <= 1500 : stryMutAct_9fa48("361") ? true : (stryCov_9fa48("361", "362", "363"), (stryMutAct_9fa48("364") ? now + lastNavigateRef.current.ts : (stryCov_9fa48("364"), now - lastNavigateRef.current.ts)) < 1500)))) return;
                lastNavigateRef.current = stryMutAct_9fa48("365") ? {} : (stryCov_9fa48("365"), {
                  to,
                  ts: now
                });
                navigate(to, stryMutAct_9fa48("366") ? {} : (stryCov_9fa48("366"), {
                  replace: stryMutAct_9fa48("367") ? false : (stryCov_9fa48("367"), true)
                }));
              }
            };

            // Public Void Protocol: /public/* is customer-facing — never block or redirect.
            if (stryMutAct_9fa48("370") ? pathname.endsWith("/public") : stryMutAct_9fa48("369") ? false : stryMutAct_9fa48("368") ? true : (stryCov_9fa48("368", "369", "370"), pathname.startsWith(stryMutAct_9fa48("371") ? "" : (stryCov_9fa48("371"), "/public")))) {
              if (stryMutAct_9fa48("372")) {
                {}
              } else {
                stryCov_9fa48("372");
                if (stryMutAct_9fa48("374") ? false : stryMutAct_9fa48("373") ? true : (stryCov_9fa48("373", "374"), mounted)) {
                  if (stryMutAct_9fa48("375")) {
                    {}
                  } else {
                    stryCov_9fa48("375");
                    clearLoadingTimeout();
                    setIsChecking(stryMutAct_9fa48("376") ? true : (stryCov_9fa48("376"), false));
                  }
                }
                return;
              }
            }

            // OPERATIONAL_NAVIGATION_SOVEREIGNTY: em OPERATIONAL_OS nunca redirect para "/"; destino canónico é /app/dashboard.
            const resolveDestination = (state: RestaurantLifecycleState): string => {
              if (stryMutAct_9fa48("377")) {
                {}
              } else {
                stryCov_9fa48("377");
                const d = getCanonicalDestination(state);
                if (stryMutAct_9fa48("380") ? CONFIG.UI_MODE === "OPERATIONAL_OS" || d === "/" : stryMutAct_9fa48("379") ? false : stryMutAct_9fa48("378") ? true : (stryCov_9fa48("378", "379", "380"), (stryMutAct_9fa48("382") ? CONFIG.UI_MODE !== "OPERATIONAL_OS" : stryMutAct_9fa48("381") ? true : (stryCov_9fa48("381", "382"), CONFIG.UI_MODE === (stryMutAct_9fa48("383") ? "" : (stryCov_9fa48("383"), "OPERATIONAL_OS")))) && (stryMutAct_9fa48("385") ? d !== "/" : stryMutAct_9fa48("384") ? true : (stryCov_9fa48("384", "385"), d === (stryMutAct_9fa48("386") ? "" : (stryCov_9fa48("386"), "/")))))) return stryMutAct_9fa48("387") ? "" : (stryCov_9fa48("387"), "/app/dashboard");
                return d;
              }
            };

            // P0: Rotas operacionais / app que não exigem revalidação para landing (dashboard, config, menu-builder, /app/install, /app/staff, /admin/*).
            // Em TRIAL/PILOT com restaurant_id válido → nunca bloquear. Sem exceções.
            // /app/staff: STAFF_SESSION_LOCATION_CONTRACT — Staff usa Location (localStorage); não exige Core ativo.
            const isOperationalAppPath = stryMutAct_9fa48("390") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder" || pathname === "/app/install" || pathname === "/app/staff" || pathname.startsWith("/app/staff/") || pathname === "/operacao" || pathname.startsWith("/op/") || pathname === "/task-system" || pathname === "/inventory-stock") && pathname === "/shopping-list" : stryMutAct_9fa48("389") ? false : stryMutAct_9fa48("388") ? true : (stryCov_9fa48("388", "389", "390"), (stryMutAct_9fa48("392") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder" || pathname === "/app/install" || pathname === "/app/staff" || pathname.startsWith("/app/staff/") || pathname === "/operacao" || pathname.startsWith("/op/") || pathname === "/task-system") && pathname === "/inventory-stock" : stryMutAct_9fa48("391") ? false : (stryCov_9fa48("391", "392"), (stryMutAct_9fa48("394") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder" || pathname === "/app/install" || pathname === "/app/staff" || pathname.startsWith("/app/staff/") || pathname === "/operacao" || pathname.startsWith("/op/")) && pathname === "/task-system" : stryMutAct_9fa48("393") ? false : (stryCov_9fa48("393", "394"), (stryMutAct_9fa48("396") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder" || pathname === "/app/install" || pathname === "/app/staff" || pathname.startsWith("/app/staff/") || pathname === "/operacao") && pathname.startsWith("/op/") : stryMutAct_9fa48("395") ? false : (stryCov_9fa48("395", "396"), (stryMutAct_9fa48("398") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder" || pathname === "/app/install" || pathname === "/app/staff" || pathname.startsWith("/app/staff/")) && pathname === "/operacao" : stryMutAct_9fa48("397") ? false : (stryCov_9fa48("397", "398"), (stryMutAct_9fa48("400") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder" || pathname === "/app/install" || pathname === "/app/staff") && pathname.startsWith("/app/staff/") : stryMutAct_9fa48("399") ? false : (stryCov_9fa48("399", "400"), (stryMutAct_9fa48("402") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder" || pathname === "/app/install") && pathname === "/app/staff" : stryMutAct_9fa48("401") ? false : (stryCov_9fa48("401", "402"), (stryMutAct_9fa48("404") ? (pathname === "/dashboard" || pathname.startsWith("/admin/") || pathname === "/menu-builder") && pathname === "/app/install" : stryMutAct_9fa48("403") ? false : (stryCov_9fa48("403", "404"), (stryMutAct_9fa48("406") ? (pathname === "/dashboard" || pathname.startsWith("/admin/")) && pathname === "/menu-builder" : stryMutAct_9fa48("405") ? false : (stryCov_9fa48("405", "406"), (stryMutAct_9fa48("408") ? pathname === "/dashboard" && pathname.startsWith("/admin/") : stryMutAct_9fa48("407") ? false : (stryCov_9fa48("407", "408"), (stryMutAct_9fa48("410") ? pathname !== "/dashboard" : stryMutAct_9fa48("409") ? false : (stryCov_9fa48("409", "410"), pathname === (stryMutAct_9fa48("411") ? "" : (stryCov_9fa48("411"), "/dashboard")))) || (stryMutAct_9fa48("412") ? pathname.endsWith("/admin/") : (stryCov_9fa48("412"), pathname.startsWith(stryMutAct_9fa48("413") ? "" : (stryCov_9fa48("413"), "/admin/")))))) || (stryMutAct_9fa48("415") ? pathname !== "/menu-builder" : stryMutAct_9fa48("414") ? false : (stryCov_9fa48("414", "415"), pathname === (stryMutAct_9fa48("416") ? "" : (stryCov_9fa48("416"), "/menu-builder")))))) || (stryMutAct_9fa48("418") ? pathname !== "/app/install" : stryMutAct_9fa48("417") ? false : (stryCov_9fa48("417", "418"), pathname === (stryMutAct_9fa48("419") ? "" : (stryCov_9fa48("419"), "/app/install")))))) || (stryMutAct_9fa48("421") ? pathname !== "/app/staff" : stryMutAct_9fa48("420") ? false : (stryCov_9fa48("420", "421"), pathname === (stryMutAct_9fa48("422") ? "" : (stryCov_9fa48("422"), "/app/staff")))))) || (stryMutAct_9fa48("423") ? pathname.endsWith("/app/staff/") : (stryCov_9fa48("423"), pathname.startsWith(stryMutAct_9fa48("424") ? "" : (stryCov_9fa48("424"), "/app/staff/")))))) || (stryMutAct_9fa48("426") ? pathname !== "/operacao" : stryMutAct_9fa48("425") ? false : (stryCov_9fa48("425", "426"), pathname === (stryMutAct_9fa48("427") ? "" : (stryCov_9fa48("427"), "/operacao")))))) || (stryMutAct_9fa48("428") ? pathname.endsWith("/op/") : (stryCov_9fa48("428"), pathname.startsWith(stryMutAct_9fa48("429") ? "" : (stryCov_9fa48("429"), "/op/")))))) || (stryMutAct_9fa48("431") ? pathname !== "/task-system" : stryMutAct_9fa48("430") ? false : (stryCov_9fa48("430", "431"), pathname === (stryMutAct_9fa48("432") ? "" : (stryCov_9fa48("432"), "/task-system")))))) || (stryMutAct_9fa48("434") ? pathname !== "/inventory-stock" : stryMutAct_9fa48("433") ? false : (stryCov_9fa48("433", "434"), pathname === (stryMutAct_9fa48("435") ? "" : (stryCov_9fa48("435"), "/inventory-stock")))))) || (stryMutAct_9fa48("437") ? pathname !== "/shopping-list" : stryMutAct_9fa48("436") ? false : (stryCov_9fa48("436", "437"), pathname === (stryMutAct_9fa48("438") ? "" : (stryCov_9fa48("438"), "/shopping-list")))));
            const isPilot = stryMutAct_9fa48("441") ? typeof window !== "undefined" || window.localStorage.getItem("chefiapp_pilot_mode") === "true" : stryMutAct_9fa48("440") ? false : stryMutAct_9fa48("439") ? true : (stryCov_9fa48("439", "440", "441"), (stryMutAct_9fa48("443") ? typeof window === "undefined" : stryMutAct_9fa48("442") ? true : (stryCov_9fa48("442", "443"), typeof window !== (stryMutAct_9fa48("444") ? "" : (stryCov_9fa48("444"), "undefined")))) && (stryMutAct_9fa48("446") ? window.localStorage.getItem("chefiapp_pilot_mode") !== "true" : stryMutAct_9fa48("445") ? true : (stryCov_9fa48("445", "446"), window.localStorage.getItem(stryMutAct_9fa48("447") ? "" : (stryCov_9fa48("447"), "chefiapp_pilot_mode")) === (stryMutAct_9fa48("448") ? "" : (stryCov_9fa48("448"), "true")))));
            const isTrialOrPilot = stryMutAct_9fa48("451") ? (isDocker || isTrial) && isPilot : stryMutAct_9fa48("450") ? false : stryMutAct_9fa48("449") ? true : (stryCov_9fa48("449", "450", "451"), (stryMutAct_9fa48("453") ? isDocker && isTrial : stryMutAct_9fa48("452") ? false : (stryCov_9fa48("452", "453"), isDocker || isTrial)) || isPilot);
            if (stryMutAct_9fa48("456") ? isOperationalAppPath && hasLocalOrg || isTrialOrPilot : stryMutAct_9fa48("455") ? false : stryMutAct_9fa48("454") ? true : (stryCov_9fa48("454", "455", "456"), (stryMutAct_9fa48("458") ? isOperationalAppPath || hasLocalOrg : stryMutAct_9fa48("457") ? true : (stryCov_9fa48("457", "458"), isOperationalAppPath && hasLocalOrg)) && isTrialOrPilot)) {
              if (stryMutAct_9fa48("459")) {
                {}
              } else {
                stryCov_9fa48("459");
                setLifecycleState(deriveLifecycleState(stryMutAct_9fa48("460") ? {} : (stryCov_9fa48("460"), {
                  pathname,
                  isAuthenticated: stryMutAct_9fa48("461") ? !session?.user?.id : (stryCov_9fa48("461"), !(stryMutAct_9fa48("462") ? session?.user?.id : (stryCov_9fa48("462"), !(stryMutAct_9fa48("464") ? session.user?.id : stryMutAct_9fa48("463") ? session?.user.id : (stryCov_9fa48("463", "464"), session?.user?.id))))),
                  hasOrganization: stryMutAct_9fa48("465") ? false : (stryCov_9fa48("465"), true)
                })));
                if (stryMutAct_9fa48("467") ? false : stryMutAct_9fa48("466") ? true : (stryCov_9fa48("466", "467"), mounted)) {
                  if (stryMutAct_9fa48("468")) {
                    {}
                  } else {
                    stryCov_9fa48("468");
                    clearLoadingTimeout();
                    setIsChecking(stryMutAct_9fa48("469") ? true : (stryCov_9fa48("469"), false));
                  }
                }
                return;
              }
            }
            if (stryMutAct_9fa48("472") ? pathname === "/app/select-tenant" || !sealed : stryMutAct_9fa48("471") ? false : stryMutAct_9fa48("470") ? true : (stryCov_9fa48("470", "471", "472"), (stryMutAct_9fa48("474") ? pathname !== "/app/select-tenant" : stryMutAct_9fa48("473") ? true : (stryCov_9fa48("473", "474"), pathname === (stryMutAct_9fa48("475") ? "" : (stryCov_9fa48("475"), "/app/select-tenant")))) && (stryMutAct_9fa48("476") ? sealed : (stryCov_9fa48("476"), !sealed)))) {
              if (stryMutAct_9fa48("477")) {
                {}
              } else {
                stryCov_9fa48("477");
                if (stryMutAct_9fa48("479") ? false : stryMutAct_9fa48("478") ? true : (stryCov_9fa48("478", "479"), mounted)) {
                  if (stryMutAct_9fa48("480")) {
                    {}
                  } else {
                    stryCov_9fa48("480");
                    clearLoadingTimeout();
                    setIsChecking(stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481"), false));
                  }
                }
                return;
              }
            }
            if (stryMutAct_9fa48("484") ? sealed && pathname.startsWith("/app/") || pathname !== "/app/select-tenant" : stryMutAct_9fa48("483") ? false : stryMutAct_9fa48("482") ? true : (stryCov_9fa48("482", "483", "484"), (stryMutAct_9fa48("486") ? sealed || pathname.startsWith("/app/") : stryMutAct_9fa48("485") ? true : (stryCov_9fa48("485", "486"), sealed && (stryMutAct_9fa48("487") ? pathname.endsWith("/app/") : (stryCov_9fa48("487"), pathname.startsWith(stryMutAct_9fa48("488") ? "" : (stryCov_9fa48("488"), "/app/")))))) && (stryMutAct_9fa48("490") ? pathname === "/app/select-tenant" : stryMutAct_9fa48("489") ? true : (stryCov_9fa48("489", "490"), pathname !== (stryMutAct_9fa48("491") ? "" : (stryCov_9fa48("491"), "/app/select-tenant")))))) {
              if (stryMutAct_9fa48("492")) {
                {}
              } else {
                stryCov_9fa48("492");
                // Em Docker/local (TRIAL/PILOT), permitir navegação mesmo sem sessão.
                // O tenant selado já define o “mundo” e evita loops de auth.
                if (stryMutAct_9fa48("494") ? false : stryMutAct_9fa48("493") ? true : (stryCov_9fa48("493", "494"), isDocker)) {
                  if (stryMutAct_9fa48("495")) {
                    {}
                  } else {
                    stryCov_9fa48("495");
                    if (stryMutAct_9fa48("497") ? false : stryMutAct_9fa48("496") ? true : (stryCov_9fa48("496", "497"), mounted)) {
                      if (stryMutAct_9fa48("498")) {
                        {}
                      } else {
                        stryCov_9fa48("498");
                        clearLoadingTimeout();
                        setIsChecking(stryMutAct_9fa48("499") ? true : (stryCov_9fa48("499"), false));
                      }
                    }
                    return;
                  }
                }

                // Em prod, /app/* exige sessão.
                if (stryMutAct_9fa48("503") ? session.user?.id : stryMutAct_9fa48("502") ? session?.user.id : stryMutAct_9fa48("501") ? false : stryMutAct_9fa48("500") ? true : (stryCov_9fa48("500", "501", "502", "503"), session?.user?.id)) {
                  if (stryMutAct_9fa48("504")) {
                    {}
                  } else {
                    stryCov_9fa48("504");
                    if (stryMutAct_9fa48("506") ? false : stryMutAct_9fa48("505") ? true : (stryCov_9fa48("505", "506"), mounted)) {
                      if (stryMutAct_9fa48("507")) {
                        {}
                      } else {
                        stryCov_9fa48("507");
                        clearLoadingTimeout();
                        setIsChecking(stryMutAct_9fa48("508") ? true : (stryCov_9fa48("508"), false));
                      }
                    }
                    return;
                  }
                }
              }
            }

            // Bootstrap: temos tenant em storage — não recomeçar se já houver organização.
            if (stryMutAct_9fa48("511") ? pathname === "/bootstrap" || sealed || (() => {
              const id = getTabIsolated("chefiapp_restaurant_id") || (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null);
              return !!id && !INVALID_OR_SEED_RESTAURANT_IDS.has(id);
            })() : stryMutAct_9fa48("510") ? false : stryMutAct_9fa48("509") ? true : (stryCov_9fa48("509", "510", "511"), (stryMutAct_9fa48("513") ? pathname !== "/bootstrap" : stryMutAct_9fa48("512") ? true : (stryCov_9fa48("512", "513"), pathname === (stryMutAct_9fa48("514") ? "" : (stryCov_9fa48("514"), "/bootstrap")))) && (stryMutAct_9fa48("516") ? sealed && (() => {
              const id = getTabIsolated("chefiapp_restaurant_id") || (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null);
              return !!id && !INVALID_OR_SEED_RESTAURANT_IDS.has(id);
            })() : stryMutAct_9fa48("515") ? true : (stryCov_9fa48("515", "516"), sealed || (() => {
              if (stryMutAct_9fa48("517")) {
                {}
              } else {
                stryCov_9fa48("517");
                const id = stryMutAct_9fa48("520") ? getTabIsolated("chefiapp_restaurant_id") && (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null) : stryMutAct_9fa48("519") ? false : stryMutAct_9fa48("518") ? true : (stryCov_9fa48("518", "519", "520"), getTabIsolated(stryMutAct_9fa48("521") ? "" : (stryCov_9fa48("521"), "chefiapp_restaurant_id")) || ((stryMutAct_9fa48("524") ? typeof window === "undefined" : stryMutAct_9fa48("523") ? false : stryMutAct_9fa48("522") ? true : (stryCov_9fa48("522", "523", "524"), typeof window !== (stryMutAct_9fa48("525") ? "" : (stryCov_9fa48("525"), "undefined")))) ? window.localStorage.getItem(stryMutAct_9fa48("526") ? "" : (stryCov_9fa48("526"), "chefiapp_restaurant_id")) : null));
                return stryMutAct_9fa48("529") ? !!id || !INVALID_OR_SEED_RESTAURANT_IDS.has(id) : stryMutAct_9fa48("528") ? false : stryMutAct_9fa48("527") ? true : (stryCov_9fa48("527", "528", "529"), (stryMutAct_9fa48("530") ? !id : (stryCov_9fa48("530"), !(stryMutAct_9fa48("531") ? id : (stryCov_9fa48("531"), !id)))) && (stryMutAct_9fa48("532") ? INVALID_OR_SEED_RESTAURANT_IDS.has(id) : (stryCov_9fa48("532"), !INVALID_OR_SEED_RESTAURANT_IDS.has(id))));
              }
            })())))) {
              if (stryMutAct_9fa48("533")) {
                {}
              } else {
                stryCov_9fa48("533");
                setLifecycleState(deriveLifecycleState(stryMutAct_9fa48("534") ? {} : (stryCov_9fa48("534"), {
                  pathname,
                  isAuthenticated: stryMutAct_9fa48("535") ? !session?.user?.id : (stryCov_9fa48("535"), !(stryMutAct_9fa48("536") ? session?.user?.id : (stryCov_9fa48("536"), !(stryMutAct_9fa48("538") ? session.user?.id : stryMutAct_9fa48("537") ? session?.user.id : (stryCov_9fa48("537", "538"), session?.user?.id))))),
                  hasOrganization: stryMutAct_9fa48("539") ? false : (stryCov_9fa48("539"), true)
                })));
                if (stryMutAct_9fa48("541") ? false : stryMutAct_9fa48("540") ? true : (stryCov_9fa48("540", "541"), mounted)) {
                  if (stryMutAct_9fa48("542")) {
                    {}
                  } else {
                    stryCov_9fa48("542");
                    clearLoadingTimeout();
                    setIsChecking(stryMutAct_9fa48("543") ? true : (stryCov_9fa48("543"), false));
                  }
                }
                return;
              }
            }
            const devStable = isDevStableMode();
            const debug = isDebugEnabled();
            const shouldLog = stryMutAct_9fa48("546") ? !devStable && debug : stryMutAct_9fa48("545") ? false : stryMutAct_9fa48("544") ? true : (stryCov_9fa48("544", "545", "546"), (stryMutAct_9fa48("547") ? devStable : (stryCov_9fa48("547"), !devStable)) || debug);
            const userId = stryMutAct_9fa48("549") ? session.user?.id : stryMutAct_9fa48("548") ? session?.user.id : (stryCov_9fa48("548", "549"), session?.user?.id);
            const fuseKey = stryMutAct_9fa48("550") ? `` : (stryCov_9fa48("550"), `${stryMutAct_9fa48("551") ? userId && "anon" : (stryCov_9fa48("551"), userId ?? (stryMutAct_9fa48("552") ? "" : (stryCov_9fa48("552"), "anon")))}::${pathname}`);
            const now = Date.now();
            if (stryMutAct_9fa48("555") ? lastCheckRef.current?.key === fuseKey || now - lastCheckRef.current.ts < 1200 : stryMutAct_9fa48("554") ? false : stryMutAct_9fa48("553") ? true : (stryCov_9fa48("553", "554", "555"), (stryMutAct_9fa48("557") ? lastCheckRef.current?.key !== fuseKey : stryMutAct_9fa48("556") ? true : (stryCov_9fa48("556", "557"), (stryMutAct_9fa48("558") ? lastCheckRef.current.key : (stryCov_9fa48("558"), lastCheckRef.current?.key)) === fuseKey)) && (stryMutAct_9fa48("561") ? now - lastCheckRef.current.ts >= 1200 : stryMutAct_9fa48("560") ? now - lastCheckRef.current.ts <= 1200 : stryMutAct_9fa48("559") ? true : (stryCov_9fa48("559", "560", "561"), (stryMutAct_9fa48("562") ? now + lastCheckRef.current.ts : (stryCov_9fa48("562"), now - lastCheckRef.current.ts)) < 1200)))) return;
            lastCheckRef.current = stryMutAct_9fa48("563") ? {} : (stryCov_9fa48("563"), {
              key: fuseKey,
              ts: now
            });
            if (stryMutAct_9fa48("566") ? !session || !sessionLoading : stryMutAct_9fa48("565") ? false : stryMutAct_9fa48("564") ? true : (stryCov_9fa48("564", "565", "566"), (stryMutAct_9fa48("567") ? session : (stryCov_9fa48("567"), !session)) && (stryMutAct_9fa48("568") ? sessionLoading : (stryCov_9fa48("568"), !sessionLoading)))) {
              if (stryMutAct_9fa48("569")) {
                {}
              } else {
                stryCov_9fa48("569");
                // Sem sessão: ainda podemos ter org local (bootstrap/pilot) — não entrar em loop.
                const lifecycleState = deriveLifecycleState(stryMutAct_9fa48("570") ? {} : (stryCov_9fa48("570"), {
                  pathname,
                  isAuthenticated: stryMutAct_9fa48("571") ? true : (stryCov_9fa48("571"), false),
                  hasOrganization: hasLocalOrg
                }));
                setLifecycleState(lifecycleState);
                if (stryMutAct_9fa48("574") ? false : stryMutAct_9fa48("573") ? true : stryMutAct_9fa48("572") ? isPathAllowedForState(pathname, lifecycleState) : (stryCov_9fa48("572", "573", "574"), !isPathAllowedForState(pathname, lifecycleState))) {
                  if (stryMutAct_9fa48("575")) {
                    {}
                  } else {
                    stryCov_9fa48("575");
                    safeNavigate(resolveDestination(lifecycleState));
                  }
                }
                if (stryMutAct_9fa48("577") ? false : stryMutAct_9fa48("576") ? true : (stryCov_9fa48("576", "577"), mounted)) {
                  if (stryMutAct_9fa48("578")) {
                    {}
                  } else {
                    stryCov_9fa48("578");
                    clearLoadingTimeout();
                    setIsChecking(stryMutAct_9fa48("579") ? true : (stryCov_9fa48("579"), false));
                  }
                }
                return;
              }
            }
            try {
              if (stryMutAct_9fa48("580")) {
                {}
              } else {
                stryCov_9fa48("580");
                if (stryMutAct_9fa48("583") ? false : stryMutAct_9fa48("582") ? true : stryMutAct_9fa48("581") ? session?.user?.id : (stryCov_9fa48("581", "582", "583"), !(stryMutAct_9fa48("585") ? session.user?.id : stryMutAct_9fa48("584") ? session?.user.id : (stryCov_9fa48("584", "585"), session?.user?.id)))) {
                  if (stryMutAct_9fa48("586")) {
                    {}
                  } else {
                    stryCov_9fa48("586");
                    if (stryMutAct_9fa48("588") ? false : stryMutAct_9fa48("587") ? true : (stryCov_9fa48("587", "588"), mounted)) {
                      if (stryMutAct_9fa48("589")) {
                        {}
                      } else {
                        stryCov_9fa48("589");
                        clearLoadingTimeout();
                        setIsChecking(stryMutAct_9fa48("590") ? true : (stryCov_9fa48("590"), false));
                      }
                    }
                    return;
                  }
                }
                let hasOrg = stryMutAct_9fa48("591") ? true : (stryCov_9fa48("591"), false);
                let restaurantId: string | null = null;
                let currentBillingStatus: string | null = null;
                let isBootstrapComplete = stryMutAct_9fa48("592") ? true : (stryCov_9fa48("592"), false);
                let activated = stryMutAct_9fa48("593") ? true : (stryCov_9fa48("593"), false);
                if (stryMutAct_9fa48("595") ? false : stryMutAct_9fa48("594") ? true : (stryCov_9fa48("594", "595"), isDocker)) {
                  if (stryMutAct_9fa48("596")) {
                    {}
                  } else {
                    stryCov_9fa48("596");
                    const sealedTenantId = getActiveTenant();
                    let localRestaurantId: string | null = (stryMutAct_9fa48("599") ? typeof window === "undefined" : stryMutAct_9fa48("598") ? false : stryMutAct_9fa48("597") ? true : (stryCov_9fa48("597", "598", "599"), typeof window !== (stryMutAct_9fa48("600") ? "" : (stryCov_9fa48("600"), "undefined")))) ? stryMutAct_9fa48("603") ? getTabIsolated("chefiapp_restaurant_id") && window.localStorage.getItem("chefiapp_restaurant_id") : stryMutAct_9fa48("602") ? false : stryMutAct_9fa48("601") ? true : (stryCov_9fa48("601", "602", "603"), getTabIsolated(stryMutAct_9fa48("604") ? "" : (stryCov_9fa48("604"), "chefiapp_restaurant_id")) || window.localStorage.getItem(stryMutAct_9fa48("605") ? "" : (stryCov_9fa48("605"), "chefiapp_restaurant_id"))) : null;
                    // Em Docker: Sofia (100) e trial (099) existem no Core; não limpar
                    if (stryMutAct_9fa48("608") ? localRestaurantId && INVALID_OR_SEED_RESTAURANT_IDS.has(localRestaurantId) || localRestaurantId !== SOFIA_RESTAURANT_ID : stryMutAct_9fa48("607") ? false : stryMutAct_9fa48("606") ? true : (stryCov_9fa48("606", "607", "608"), (stryMutAct_9fa48("610") ? localRestaurantId || INVALID_OR_SEED_RESTAURANT_IDS.has(localRestaurantId) : stryMutAct_9fa48("609") ? true : (stryCov_9fa48("609", "610"), localRestaurantId && INVALID_OR_SEED_RESTAURANT_IDS.has(localRestaurantId))) && (stryMutAct_9fa48("612") ? localRestaurantId === SOFIA_RESTAURANT_ID : stryMutAct_9fa48("611") ? true : (stryCov_9fa48("611", "612"), localRestaurantId !== SOFIA_RESTAURANT_ID)))) {
                      if (stryMutAct_9fa48("613")) {
                        {}
                      } else {
                        stryCov_9fa48("613");
                        clearActiveTenant();
                        localRestaurantId = null;
                      }
                    }
                    // Migrar ID antigo mock-* para o UUID do pilot mock (evita 400/404 em installed_modules, caixa, etc.)
                    if (stryMutAct_9fa48("616") ? localRestaurantId && localRestaurantId.startsWith("mock-") || typeof window !== "undefined" : stryMutAct_9fa48("615") ? false : stryMutAct_9fa48("614") ? true : (stryCov_9fa48("614", "615", "616"), (stryMutAct_9fa48("618") ? localRestaurantId || localRestaurantId.startsWith("mock-") : stryMutAct_9fa48("617") ? true : (stryCov_9fa48("617", "618"), localRestaurantId && (stryMutAct_9fa48("619") ? localRestaurantId.endsWith("mock-") : (stryCov_9fa48("619"), localRestaurantId.startsWith(stryMutAct_9fa48("620") ? "" : (stryCov_9fa48("620"), "mock-")))))) && (stryMutAct_9fa48("622") ? typeof window === "undefined" : stryMutAct_9fa48("621") ? true : (stryCov_9fa48("621", "622"), typeof window !== (stryMutAct_9fa48("623") ? "" : (stryCov_9fa48("623"), "undefined")))))) {
                      if (stryMutAct_9fa48("624")) {
                        {}
                      } else {
                        stryCov_9fa48("624");
                        try {
                          if (stryMutAct_9fa48("625")) {
                            {}
                          } else {
                            stryCov_9fa48("625");
                            const pilotMock = window.localStorage.getItem(stryMutAct_9fa48("626") ? "" : (stryCov_9fa48("626"), "chefiapp_pilot_mock_restaurant"));
                            if (stryMutAct_9fa48("628") ? false : stryMutAct_9fa48("627") ? true : (stryCov_9fa48("627", "628"), pilotMock)) {
                              if (stryMutAct_9fa48("629")) {
                                {}
                              } else {
                                stryCov_9fa48("629");
                                const row = JSON.parse(pilotMock) as {
                                  id?: string;
                                };
                                if (stryMutAct_9fa48("632") ? row.id || UUID_REGEX.test(row.id) : stryMutAct_9fa48("631") ? false : stryMutAct_9fa48("630") ? true : (stryCov_9fa48("630", "631", "632"), row.id && UUID_REGEX.test(row.id))) {
                                  if (stryMutAct_9fa48("633")) {
                                    {}
                                  } else {
                                    stryCov_9fa48("633");
                                    setTabIsolated(stryMutAct_9fa48("634") ? "" : (stryCov_9fa48("634"), "chefiapp_restaurant_id"), row.id);
                                    window.localStorage.setItem(stryMutAct_9fa48("635") ? "" : (stryCov_9fa48("635"), "chefiapp_restaurant_id"), row.id);
                                    localRestaurantId = row.id;
                                  }
                                } else {
                                  if (stryMutAct_9fa48("636")) {
                                    {}
                                  } else {
                                    stryCov_9fa48("636");
                                    clearActiveTenant();
                                    localRestaurantId = null;
                                  }
                                }
                              }
                            } else {
                              if (stryMutAct_9fa48("637")) {
                                {}
                              } else {
                                stryCov_9fa48("637");
                                clearActiveTenant();
                                localRestaurantId = null;
                              }
                            }
                          }
                        } catch {
                          if (stryMutAct_9fa48("638")) {
                            {}
                          } else {
                            stryCov_9fa48("638");
                            clearActiveTenant();
                            localRestaurantId = null;
                          }
                        }
                      }
                    }
                    // Docker + trial/pilot sem tenant: trial → "Seu restaurante" (099), senão → Sofia (100)
                    if (stryMutAct_9fa48("641") ? !sealedTenantId && !localRestaurantId && isTrialOrPilot || typeof window !== "undefined" : stryMutAct_9fa48("640") ? false : stryMutAct_9fa48("639") ? true : (stryCov_9fa48("639", "640", "641"), (stryMutAct_9fa48("643") ? !sealedTenantId && !localRestaurantId || isTrialOrPilot : stryMutAct_9fa48("642") ? true : (stryCov_9fa48("642", "643"), (stryMutAct_9fa48("645") ? !sealedTenantId || !localRestaurantId : stryMutAct_9fa48("644") ? true : (stryCov_9fa48("644", "645"), (stryMutAct_9fa48("646") ? sealedTenantId : (stryCov_9fa48("646"), !sealedTenantId)) && (stryMutAct_9fa48("647") ? localRestaurantId : (stryCov_9fa48("647"), !localRestaurantId)))) && isTrialOrPilot)) && (stryMutAct_9fa48("649") ? typeof window === "undefined" : stryMutAct_9fa48("648") ? true : (stryCov_9fa48("648", "649"), typeof window !== (stryMutAct_9fa48("650") ? "" : (stryCov_9fa48("650"), "undefined")))))) {
                      if (stryMutAct_9fa48("651")) {
                        {}
                      } else {
                        stryCov_9fa48("651");
                        const isTrial = stryMutAct_9fa48("654") ? getTabIsolated("chefiapp_trial_mode") === "true" && window.localStorage?.getItem("chefiapp_trial_mode") === "true" : stryMutAct_9fa48("653") ? false : stryMutAct_9fa48("652") ? true : (stryCov_9fa48("652", "653", "654"), (stryMutAct_9fa48("656") ? getTabIsolated("chefiapp_trial_mode") !== "true" : stryMutAct_9fa48("655") ? false : (stryCov_9fa48("655", "656"), getTabIsolated(stryMutAct_9fa48("657") ? "" : (stryCov_9fa48("657"), "chefiapp_trial_mode")) === (stryMutAct_9fa48("658") ? "" : (stryCov_9fa48("658"), "true")))) || (stryMutAct_9fa48("660") ? window.localStorage?.getItem("chefiapp_trial_mode") !== "true" : stryMutAct_9fa48("659") ? false : (stryCov_9fa48("659", "660"), (stryMutAct_9fa48("661") ? window.localStorage.getItem("chefiapp_trial_mode") : (stryCov_9fa48("661"), window.localStorage?.getItem(stryMutAct_9fa48("662") ? "" : (stryCov_9fa48("662"), "chefiapp_trial_mode")))) === (stryMutAct_9fa48("663") ? "" : (stryCov_9fa48("663"), "true")))));
                        const defaultRestaurantId = isTrial ? TRIAL_RESTAURANT_ID : SOFIA_RESTAURANT_ID;
                        setTabIsolated(stryMutAct_9fa48("664") ? "" : (stryCov_9fa48("664"), "chefiapp_restaurant_id"), defaultRestaurantId);
                        window.localStorage.setItem(stryMutAct_9fa48("665") ? "" : (stryCov_9fa48("665"), "chefiapp_restaurant_id"), defaultRestaurantId);
                        setActiveTenant(defaultRestaurantId);
                        localRestaurantId = defaultRestaurantId;
                      }
                    }
                    hasOrg = stryMutAct_9fa48("668") ? !!sealedTenantId && !!localRestaurantId : stryMutAct_9fa48("667") ? false : stryMutAct_9fa48("666") ? true : (stryCov_9fa48("666", "667", "668"), (stryMutAct_9fa48("669") ? !sealedTenantId : (stryCov_9fa48("669"), !(stryMutAct_9fa48("670") ? sealedTenantId : (stryCov_9fa48("670"), !sealedTenantId)))) || (stryMutAct_9fa48("671") ? !localRestaurantId : (stryCov_9fa48("671"), !(stryMutAct_9fa48("672") ? localRestaurantId : (stryCov_9fa48("672"), !localRestaurantId)))));
                    restaurantId = stryMutAct_9fa48("675") ? sealedTenantId && localRestaurantId : stryMutAct_9fa48("674") ? false : stryMutAct_9fa48("673") ? true : (stryCov_9fa48("673", "674", "675"), sealedTenantId || localRestaurantId);
                  }
                } else {
                  if (stryMutAct_9fa48("676")) {
                    {}
                  } else {
                    stryCov_9fa48("676");
                    const client = await getTableClient();
                    if (stryMutAct_9fa48("678") ? false : stryMutAct_9fa48("677") ? true : (stryCov_9fa48("677", "678"), debug)) console.log(stryMutAct_9fa48("679") ? "" : (stryCov_9fa48("679"), "[FlowGate] Fetching membership for"), session.user.id);
                    const {
                      data: members,
                      error: memberError
                    } = await client.from(stryMutAct_9fa48("680") ? "" : (stryCov_9fa48("680"), "gm_restaurant_members")).select(stryMutAct_9fa48("681") ? "" : (stryCov_9fa48("681"), "restaurant_id, role")).eq(stryMutAct_9fa48("682") ? "" : (stryCov_9fa48("682"), "user_id"), session.user.id);
                    if (stryMutAct_9fa48("684") ? false : stryMutAct_9fa48("683") ? true : (stryCov_9fa48("683", "684"), memberError)) {
                      if (stryMutAct_9fa48("685")) {
                        {}
                      } else {
                        stryCov_9fa48("685");
                        // FASE E: falha de RPC não derruba sessão — derivar de tenant/localStorage
                        if (stryMutAct_9fa48("687") ? false : stryMutAct_9fa48("686") ? true : (stryCov_9fa48("686", "687"), debug)) console.warn(stryMutAct_9fa48("688") ? "" : (stryCov_9fa48("688"), "[FlowGate] Member check error (fallback):"), memberError);
                        const fallbackId = stryMutAct_9fa48("691") ? getActiveTenant() && (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null) : stryMutAct_9fa48("690") ? false : stryMutAct_9fa48("689") ? true : (stryCov_9fa48("689", "690", "691"), getActiveTenant() || ((stryMutAct_9fa48("694") ? typeof window === "undefined" : stryMutAct_9fa48("693") ? false : stryMutAct_9fa48("692") ? true : (stryCov_9fa48("692", "693", "694"), typeof window !== (stryMutAct_9fa48("695") ? "" : (stryCov_9fa48("695"), "undefined")))) ? window.localStorage.getItem(stryMutAct_9fa48("696") ? "" : (stryCov_9fa48("696"), "chefiapp_restaurant_id")) : null));
                        hasOrg = stryMutAct_9fa48("699") ? !!isTenantSealed() && !!fallbackId : stryMutAct_9fa48("698") ? false : stryMutAct_9fa48("697") ? true : (stryCov_9fa48("697", "698", "699"), (stryMutAct_9fa48("700") ? !isTenantSealed() : (stryCov_9fa48("700"), !(stryMutAct_9fa48("701") ? isTenantSealed() : (stryCov_9fa48("701"), !isTenantSealed())))) || (stryMutAct_9fa48("702") ? !fallbackId : (stryCov_9fa48("702"), !(stryMutAct_9fa48("703") ? fallbackId : (stryCov_9fa48("703"), !fallbackId)))));
                        restaurantId = fallbackId;
                      }
                    } else {
                      if (stryMutAct_9fa48("704")) {
                        {}
                      } else {
                        stryCov_9fa48("704");
                        const membersArray = Array.isArray(members) ? members : members ? stryMutAct_9fa48("705") ? [] : (stryCov_9fa48("705"), [members]) : stryMutAct_9fa48("706") ? ["Stryker was here"] : (stryCov_9fa48("706"), []);
                        hasOrg = stryMutAct_9fa48("710") ? membersArray.length <= 0 : stryMutAct_9fa48("709") ? membersArray.length >= 0 : stryMutAct_9fa48("708") ? false : stryMutAct_9fa48("707") ? true : (stryCov_9fa48("707", "708", "709", "710"), membersArray.length > 0);
                        if (stryMutAct_9fa48("713") ? membersArray.length !== 1 : stryMutAct_9fa48("712") ? false : stryMutAct_9fa48("711") ? true : (stryCov_9fa48("711", "712", "713"), membersArray.length === 1)) {
                          if (stryMutAct_9fa48("714")) {
                            {}
                          } else {
                            stryCov_9fa48("714");
                            restaurantId = membersArray[0].restaurant_id;
                          }
                        } else if (stryMutAct_9fa48("718") ? membersArray.length <= 0 : stryMutAct_9fa48("717") ? membersArray.length >= 0 : stryMutAct_9fa48("716") ? false : stryMutAct_9fa48("715") ? true : (stryCov_9fa48("715", "716", "717", "718"), membersArray.length > 0)) {
                          if (stryMutAct_9fa48("719")) {
                            {}
                          } else {
                            stryCov_9fa48("719");
                            restaurantId = stryMutAct_9fa48("722") ? getActiveTenant() && membersArray[0].restaurant_id : stryMutAct_9fa48("721") ? false : stryMutAct_9fa48("720") ? true : (stryCov_9fa48("720", "721", "722"), getActiveTenant() || membersArray[0].restaurant_id);
                          }
                        }
                      }
                    }
                  }
                }
                if (stryMutAct_9fa48("725") ? false : stryMutAct_9fa48("724") ? true : stryMutAct_9fa48("723") ? hasOrg : (stryCov_9fa48("723", "724", "725"), !hasOrg)) {
                  if (stryMutAct_9fa48("726")) {
                    {}
                  } else {
                    stryCov_9fa48("726");
                    const lifecycleState = deriveLifecycleState(stryMutAct_9fa48("727") ? {} : (stryCov_9fa48("727"), {
                      pathname,
                      isAuthenticated: stryMutAct_9fa48("728") ? false : (stryCov_9fa48("728"), true),
                      hasOrganization: stryMutAct_9fa48("729") ? true : (stryCov_9fa48("729"), false)
                    }));
                    setLifecycleState(lifecycleState);
                    if (stryMutAct_9fa48("732") ? false : stryMutAct_9fa48("731") ? true : stryMutAct_9fa48("730") ? isPathAllowedForState(pathname, lifecycleState) : (stryCov_9fa48("730", "731", "732"), !isPathAllowedForState(pathname, lifecycleState))) {
                      if (stryMutAct_9fa48("733")) {
                        {}
                      } else {
                        stryCov_9fa48("733");
                        safeNavigate(resolveDestination(lifecycleState));
                      }
                    }
                    if (stryMutAct_9fa48("735") ? false : stryMutAct_9fa48("734") ? true : (stryCov_9fa48("734", "735"), mounted)) {
                      if (stryMutAct_9fa48("736")) {
                        {}
                      } else {
                        stryCov_9fa48("736");
                        clearLoadingTimeout();
                        setIsChecking(stryMutAct_9fa48("737") ? true : (stryCov_9fa48("737"), false));
                      }
                    }
                    return;
                  }
                }
                if (stryMutAct_9fa48("739") ? false : stryMutAct_9fa48("738") ? true : (stryCov_9fa48("738", "739"), restaurantId)) {
                  if (stryMutAct_9fa48("740")) {
                    {}
                  } else {
                    stryCov_9fa48("740");
                    try {
                      if (stryMutAct_9fa48("741")) {
                        {}
                      } else {
                        stryCov_9fa48("741");
                        const restaurant = await getRestaurantStatus(restaurantId);
                        if (stryMutAct_9fa48("743") ? false : stryMutAct_9fa48("742") ? true : (stryCov_9fa48("742", "743"), restaurant)) {
                          if (stryMutAct_9fa48("744")) {
                            {}
                          } else {
                            stryCov_9fa48("744");
                            currentBillingStatus = restaurant.billing_status;
                            // Consideramos bootstrap completo quando o restaurante está ativo
                            // ou publicado no Core (sem depender de onboarding_completed_at).
                            isBootstrapComplete = stryMutAct_9fa48("747") ? restaurant.status !== "active" : stryMutAct_9fa48("746") ? false : stryMutAct_9fa48("745") ? true : (stryCov_9fa48("745", "746", "747"), restaurant.status === (stryMutAct_9fa48("748") ? "" : (stryCov_9fa48("748"), "active")));
                            activated = stryMutAct_9fa48("749") ? !restaurant.onboarding_completed_at : (stryCov_9fa48("749"), !(stryMutAct_9fa48("750") ? restaurant.onboarding_completed_at : (stryCov_9fa48("750"), !restaurant.onboarding_completed_at)));
                          }
                        } else {
                          if (stryMutAct_9fa48("751")) {
                            {}
                          } else {
                            stryCov_9fa48("751");
                            // 404 ou restaurante inexistente: limpar id inválido para evitar loop e 404 repetidos
                            if (stryMutAct_9fa48("754") ? isDocker || typeof window !== "undefined" : stryMutAct_9fa48("753") ? false : stryMutAct_9fa48("752") ? true : (stryCov_9fa48("752", "753", "754"), isDocker && (stryMutAct_9fa48("756") ? typeof window === "undefined" : stryMutAct_9fa48("755") ? true : (stryCov_9fa48("755", "756"), typeof window !== (stryMutAct_9fa48("757") ? "" : (stryCov_9fa48("757"), "undefined")))))) {
                              if (stryMutAct_9fa48("758")) {
                                {}
                              } else {
                                stryCov_9fa48("758");
                                if (stryMutAct_9fa48("760") ? false : stryMutAct_9fa48("759") ? true : (stryCov_9fa48("759", "760"), debug)) console.warn(stryMutAct_9fa48("761") ? "" : (stryCov_9fa48("761"), "[FlowGate] Restaurant not found (404), clearing invalid id:"), restaurantId);
                                clearActiveTenant();
                                hasOrg = stryMutAct_9fa48("762") ? true : (stryCov_9fa48("762"), false);
                                const lifecycleStateNoOrg = deriveLifecycleState(stryMutAct_9fa48("763") ? {} : (stryCov_9fa48("763"), {
                                  pathname,
                                  isAuthenticated: stryMutAct_9fa48("764") ? !session : (stryCov_9fa48("764"), !(stryMutAct_9fa48("765") ? session : (stryCov_9fa48("765"), !session))),
                                  hasOrganization: stryMutAct_9fa48("766") ? true : (stryCov_9fa48("766"), false)
                                }));
                                setLifecycleState(lifecycleStateNoOrg);
                                if (stryMutAct_9fa48("769") ? false : stryMutAct_9fa48("768") ? true : stryMutAct_9fa48("767") ? isPathAllowedForState(pathname, lifecycleStateNoOrg) : (stryCov_9fa48("767", "768", "769"), !isPathAllowedForState(pathname, lifecycleStateNoOrg))) {
                                  if (stryMutAct_9fa48("770")) {
                                    {}
                                  } else {
                                    stryCov_9fa48("770");
                                    safeNavigate(resolveDestination(lifecycleStateNoOrg));
                                  }
                                }
                                if (stryMutAct_9fa48("772") ? false : stryMutAct_9fa48("771") ? true : (stryCov_9fa48("771", "772"), mounted)) {
                                  if (stryMutAct_9fa48("773")) {
                                    {}
                                  } else {
                                    stryCov_9fa48("773");
                                    clearLoadingTimeout();
                                    setIsChecking(stryMutAct_9fa48("774") ? true : (stryCov_9fa48("774"), false));
                                  }
                                }
                                return;
                              }
                            }
                          }
                        }
                      }
                    } catch {
                      // Falha de RPC não derruba sessão (FASE E)
                    }
                  }
                }
                const lifecycleState = deriveLifecycleState(stryMutAct_9fa48("775") ? {} : (stryCov_9fa48("775"), {
                  pathname,
                  isAuthenticated: stryMutAct_9fa48("776") ? !session : (stryCov_9fa48("776"), !(stryMutAct_9fa48("777") ? session : (stryCov_9fa48("777"), !session))),
                  hasOrganization: hasOrg
                }));
                setLifecycleState(lifecycleState);
                if (stryMutAct_9fa48("780") ? lifecycleState !== "READY_TO_OPERATE" || !isPathAllowedForState(pathname, lifecycleState) : stryMutAct_9fa48("779") ? false : stryMutAct_9fa48("778") ? true : (stryCov_9fa48("778", "779", "780"), (stryMutAct_9fa48("782") ? lifecycleState === "READY_TO_OPERATE" : stryMutAct_9fa48("781") ? true : (stryCov_9fa48("781", "782"), lifecycleState !== (stryMutAct_9fa48("783") ? "" : (stryCov_9fa48("783"), "READY_TO_OPERATE")))) && (stryMutAct_9fa48("784") ? isPathAllowedForState(pathname, lifecycleState) : (stryCov_9fa48("784"), !isPathAllowedForState(pathname, lifecycleState))))) {
                  if (stryMutAct_9fa48("785")) {
                    {}
                  } else {
                    stryCov_9fa48("785");
                    safeNavigate(resolveDestination(lifecycleState));
                    if (stryMutAct_9fa48("787") ? false : stryMutAct_9fa48("786") ? true : (stryCov_9fa48("786", "787"), mounted)) {
                      if (stryMutAct_9fa48("788")) {
                        {}
                      } else {
                        stryCov_9fa48("788");
                        clearLoadingTimeout();
                        setIsChecking(stryMutAct_9fa48("789") ? true : (stryCov_9fa48("789"), false));
                      }
                    }
                    return;
                  }
                }
                const systemState = deriveSystemState(stryMutAct_9fa48("790") ? {} : (stryCov_9fa48("790"), {
                  hasOrganization: hasOrg,
                  billingStatus: currentBillingStatus,
                  isBootstrapComplete
                }));
                let lastRoute: string | null = null;
                try {
                  if (stryMutAct_9fa48("791")) {
                    {}
                  } else {
                    stryCov_9fa48("791");
                    if (stryMutAct_9fa48("794") ? typeof window === "undefined" : stryMutAct_9fa48("793") ? false : stryMutAct_9fa48("792") ? true : (stryCov_9fa48("792", "793", "794"), typeof window !== (stryMutAct_9fa48("795") ? "" : (stryCov_9fa48("795"), "undefined")))) {
                      if (stryMutAct_9fa48("796")) {
                        {}
                      } else {
                        stryCov_9fa48("796");
                        const stored = stryMutAct_9fa48("799") ? sessionStorage.getItem("chefiapp_lastRoute") && window.localStorage.getItem("chefiapp_lastRoute") : stryMutAct_9fa48("798") ? false : stryMutAct_9fa48("797") ? true : (stryCov_9fa48("797", "798", "799"), sessionStorage.getItem(stryMutAct_9fa48("800") ? "" : (stryCov_9fa48("800"), "chefiapp_lastRoute")) || window.localStorage.getItem(stryMutAct_9fa48("801") ? "" : (stryCov_9fa48("801"), "chefiapp_lastRoute")));
                        if (stryMutAct_9fa48("803") ? false : stryMutAct_9fa48("802") ? true : (stryCov_9fa48("802", "803"), stored)) lastRoute = stored;
                      }
                    }
                  }
                } catch {
                  // ignore
                }
                const state: UserState = stryMutAct_9fa48("804") ? {} : (stryCov_9fa48("804"), {
                  isAuthenticated: stryMutAct_9fa48("805") ? !session : (stryCov_9fa48("805"), !(stryMutAct_9fa48("806") ? session : (stryCov_9fa48("806"), !session))),
                  hasOrganization: hasOrg,
                  hasRestaurant: hasOrg,
                  currentPath: pathname,
                  systemState,
                  activated,
                  lastRoute,
                  currentSearch: location.search
                });
                const decision = resolveNextRoute(state);
                if (stryMutAct_9fa48("809") ? decision.type !== "REDIRECT" : stryMutAct_9fa48("808") ? false : stryMutAct_9fa48("807") ? true : (stryCov_9fa48("807", "808", "809"), decision.type === (stryMutAct_9fa48("810") ? "" : (stryCov_9fa48("810"), "REDIRECT")))) {
                  if (stryMutAct_9fa48("811")) {
                    {}
                  } else {
                    stryCov_9fa48("811");
                    safeNavigate(decision.to);
                  }
                }
                if (stryMutAct_9fa48("813") ? false : stryMutAct_9fa48("812") ? true : (stryCov_9fa48("812", "813"), mounted)) {
                  if (stryMutAct_9fa48("814")) {
                    {}
                  } else {
                    stryCov_9fa48("814");
                    clearLoadingTimeout();
                    setIsChecking(stryMutAct_9fa48("815") ? true : (stryCov_9fa48("815"), false));
                  }
                }
              }
            } catch (err) {
              if (stryMutAct_9fa48("816")) {
                {}
              } else {
                stryCov_9fa48("816");
                console.error(stryMutAct_9fa48("817") ? "" : (stryCov_9fa48("817"), "[FlowGate] Error:"), err);
                if (stryMutAct_9fa48("819") ? false : stryMutAct_9fa48("818") ? true : (stryCov_9fa48("818", "819"), mounted)) {
                  if (stryMutAct_9fa48("820")) {
                    {}
                  } else {
                    stryCov_9fa48("820");
                    clearLoadingTimeout();
                    setIsChecking(stryMutAct_9fa48("821") ? true : (stryCov_9fa48("821"), false));
                  }
                }
              }
            }
          }
        };
        checkFlow();
        return () => {
          if (stryMutAct_9fa48("822")) {
            {}
          } else {
            stryCov_9fa48("822");
            mounted = stryMutAct_9fa48("823") ? true : (stryCov_9fa48("823"), false);
            if (stryMutAct_9fa48("825") ? false : stryMutAct_9fa48("824") ? true : (stryCov_9fa48("824", "825"), loadingTimeoutRef.current)) clearTimeout(loadingTimeoutRef.current);
          }
        };
        // Depender de session?.user?.id evita loop "Maximum update depth exceeded":
        // session é um objeto; nova referência a cada render faz o effect re-correr e setLifecycleState de novo.
      }
    }, stryMutAct_9fa48("826") ? [] : (stryCov_9fa48("826"), [stryMutAct_9fa48("828") ? session.user?.id : stryMutAct_9fa48("827") ? session?.user.id : (stryCov_9fa48("827", "828"), session?.user?.id), sessionLoading, location.pathname]));

    // Contrato ORE: apenas LOADING ou READY (children). Timeout não bloqueia — deixa páginas (ORE) decidir.
    if (stryMutAct_9fa48("830") ? false : stryMutAct_9fa48("829") ? true : (stryCov_9fa48("829", "830"), isChecking)) {
      if (stryMutAct_9fa48("831")) {
        {}
      } else {
        stryCov_9fa48("831");
        return <GlobalLoadingView message="Verificando acesso..." />;
      }
    }
    return <>{children}</>;
  }
}