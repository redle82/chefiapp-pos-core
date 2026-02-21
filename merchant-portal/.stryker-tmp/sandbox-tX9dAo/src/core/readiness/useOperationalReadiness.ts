/**
 * useOperationalReadiness(surface) — Motor do ORE
 *
 * Uma única fonte de verdade para "este restaurante pode operar nesta superfície?"
 * Consolida Runtime, Shift, MenuState, módulos; devolve OperationalReadiness.
 * TPV/KDS bloqueiam quando MenuState !== LIVE (MENU_OPERATIONAL_STATE).
 *
 * @see docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 * @see docs/architecture/MENU_OPERATIONAL_STATE.md
 */function stryNS_9fa48() {
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
import { useContext, useMemo } from "react";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import { deriveRestaurantReadiness } from "../restaurant/deriveRestaurantReadiness";
import { runtimeToRestaurant } from "../restaurant/runtimeToRestaurant";
import { isBeforeOpenRitualComplete } from "../ritual/ritualBeforeOpenStorage";
import { ShiftContext } from "../shift/ShiftContext";
import { getKdsRestaurantId, getTpvRestaurantId } from "../storage/installedDeviceStorage";
import { getModulesEnabled } from "../storage/modulesConfigStorage";
import type { BlockingReason, OperationalReadiness, Surface, UiDirective } from "./types";
const DASHBOARD = stryMutAct_9fa48("1187") ? "" : (stryCov_9fa48("1187"), "/app/dashboard");
const CONFIG_MODULES = stryMutAct_9fa48("1188") ? "" : (stryCov_9fa48("1188"), "/admin/modules");
export interface UseOperationalReadinessResult extends OperationalReadiness {
  /** true enquanto runtime ou dependências ainda estão a carregar (mostrar loading). */
  loading?: boolean;
}
function uiDirectiveFor(surface: Surface, reason: BlockingReason): UiDirective {
  if (stryMutAct_9fa48("1189")) {
    {}
  } else {
    stryCov_9fa48("1189");
    if (stryMutAct_9fa48("1192") ? surface !== "DASHBOARD" : stryMutAct_9fa48("1191") ? false : stryMutAct_9fa48("1190") ? true : (stryCov_9fa48("1190", "1191", "1192"), surface === (stryMutAct_9fa48("1193") ? "" : (stryCov_9fa48("1193"), "DASHBOARD")))) {
      if (stryMutAct_9fa48("1194")) {
        {}
      } else {
        stryCov_9fa48("1194");
        if (stryMutAct_9fa48("1197") ? reason === "NO_OPEN_CASH_REGISTER" && reason === "SHIFT_NOT_STARTED" : stryMutAct_9fa48("1196") ? false : stryMutAct_9fa48("1195") ? true : (stryCov_9fa48("1195", "1196", "1197"), (stryMutAct_9fa48("1199") ? reason !== "NO_OPEN_CASH_REGISTER" : stryMutAct_9fa48("1198") ? false : (stryCov_9fa48("1198", "1199"), reason === (stryMutAct_9fa48("1200") ? "" : (stryCov_9fa48("1200"), "NO_OPEN_CASH_REGISTER")))) || (stryMutAct_9fa48("1202") ? reason !== "SHIFT_NOT_STARTED" : stryMutAct_9fa48("1201") ? false : (stryCov_9fa48("1201", "1202"), reason === (stryMutAct_9fa48("1203") ? "" : (stryCov_9fa48("1203"), "SHIFT_NOT_STARTED")))))) return stryMutAct_9fa48("1204") ? "" : (stryCov_9fa48("1204"), "SHOW_INFO_ONLY");
        if (stryMutAct_9fa48("1207") ? reason === "NOT_PUBLISHED" && reason === "CORE_OFFLINE" : stryMutAct_9fa48("1206") ? false : stryMutAct_9fa48("1205") ? true : (stryCov_9fa48("1205", "1206", "1207"), (stryMutAct_9fa48("1209") ? reason !== "NOT_PUBLISHED" : stryMutAct_9fa48("1208") ? false : (stryCov_9fa48("1208", "1209"), reason === (stryMutAct_9fa48("1210") ? "" : (stryCov_9fa48("1210"), "NOT_PUBLISHED")))) || (stryMutAct_9fa48("1212") ? reason !== "CORE_OFFLINE" : stryMutAct_9fa48("1211") ? false : (stryCov_9fa48("1211", "1212"), reason === (stryMutAct_9fa48("1213") ? "" : (stryCov_9fa48("1213"), "CORE_OFFLINE")))))) return stryMutAct_9fa48("1214") ? "" : (stryCov_9fa48("1214"), "RENDER_APP");
      }
    }
    if (stryMutAct_9fa48("1217") ? surface === "TPV" && surface === "KDS" : stryMutAct_9fa48("1216") ? false : stryMutAct_9fa48("1215") ? true : (stryCov_9fa48("1215", "1216", "1217"), (stryMutAct_9fa48("1219") ? surface !== "TPV" : stryMutAct_9fa48("1218") ? false : (stryCov_9fa48("1218", "1219"), surface === (stryMutAct_9fa48("1220") ? "" : (stryCov_9fa48("1220"), "TPV")))) || (stryMutAct_9fa48("1222") ? surface !== "KDS" : stryMutAct_9fa48("1221") ? false : (stryCov_9fa48("1221", "1222"), surface === (stryMutAct_9fa48("1223") ? "" : (stryCov_9fa48("1223"), "KDS")))))) {
      if (stryMutAct_9fa48("1224")) {
        {}
      } else {
        stryCov_9fa48("1224");
        if (stryMutAct_9fa48("1227") ? (reason === "BOOTSTRAP_INCOMPLETE" || reason === "PERMISSION_DENIED" || reason === "MODE_NOT_ALLOWED") && reason === "RESTAURANT_NOT_FOUND" : stryMutAct_9fa48("1226") ? false : stryMutAct_9fa48("1225") ? true : (stryCov_9fa48("1225", "1226", "1227"), (stryMutAct_9fa48("1229") ? (reason === "BOOTSTRAP_INCOMPLETE" || reason === "PERMISSION_DENIED") && reason === "MODE_NOT_ALLOWED" : stryMutAct_9fa48("1228") ? false : (stryCov_9fa48("1228", "1229"), (stryMutAct_9fa48("1231") ? reason === "BOOTSTRAP_INCOMPLETE" && reason === "PERMISSION_DENIED" : stryMutAct_9fa48("1230") ? false : (stryCov_9fa48("1230", "1231"), (stryMutAct_9fa48("1233") ? reason !== "BOOTSTRAP_INCOMPLETE" : stryMutAct_9fa48("1232") ? false : (stryCov_9fa48("1232", "1233"), reason === (stryMutAct_9fa48("1234") ? "" : (stryCov_9fa48("1234"), "BOOTSTRAP_INCOMPLETE")))) || (stryMutAct_9fa48("1236") ? reason !== "PERMISSION_DENIED" : stryMutAct_9fa48("1235") ? false : (stryCov_9fa48("1235", "1236"), reason === (stryMutAct_9fa48("1237") ? "" : (stryCov_9fa48("1237"), "PERMISSION_DENIED")))))) || (stryMutAct_9fa48("1239") ? reason !== "MODE_NOT_ALLOWED" : stryMutAct_9fa48("1238") ? false : (stryCov_9fa48("1238", "1239"), reason === (stryMutAct_9fa48("1240") ? "" : (stryCov_9fa48("1240"), "MODE_NOT_ALLOWED")))))) || (stryMutAct_9fa48("1242") ? reason !== "RESTAURANT_NOT_FOUND" : stryMutAct_9fa48("1241") ? false : (stryCov_9fa48("1241", "1242"), reason === (stryMutAct_9fa48("1243") ? "" : (stryCov_9fa48("1243"), "RESTAURANT_NOT_FOUND")))))) return stryMutAct_9fa48("1244") ? "" : (stryCov_9fa48("1244"), "REDIRECT");
        return stryMutAct_9fa48("1245") ? "" : (stryCov_9fa48("1245"), "SHOW_BLOCKING_SCREEN");
      }
    }
    if (stryMutAct_9fa48("1248") ? surface !== "WEB" : stryMutAct_9fa48("1247") ? false : stryMutAct_9fa48("1246") ? true : (stryCov_9fa48("1246", "1247", "1248"), surface === (stryMutAct_9fa48("1249") ? "" : (stryCov_9fa48("1249"), "WEB")))) {
      if (stryMutAct_9fa48("1250")) {
        {}
      } else {
        stryCov_9fa48("1250");
        if (stryMutAct_9fa48("1253") ? reason !== "RESTAURANT_NOT_FOUND" : stryMutAct_9fa48("1252") ? false : stryMutAct_9fa48("1251") ? true : (stryCov_9fa48("1251", "1252", "1253"), reason === (stryMutAct_9fa48("1254") ? "" : (stryCov_9fa48("1254"), "RESTAURANT_NOT_FOUND")))) return stryMutAct_9fa48("1255") ? "" : (stryCov_9fa48("1255"), "REDIRECT");
        return stryMutAct_9fa48("1256") ? "" : (stryCov_9fa48("1256"), "SHOW_BLOCKING_SCREEN");
      }
    }
    return stryMutAct_9fa48("1257") ? "" : (stryCov_9fa48("1257"), "SHOW_BLOCKING_SCREEN");
  }
}
const APPSTAFF_GERENTE = stryMutAct_9fa48("1258") ? "" : (stryCov_9fa48("1258"), "/garcom");
function redirectFor(surface: Surface, reason: BlockingReason): string | undefined {
  if (stryMutAct_9fa48("1259")) {
    {}
  } else {
    stryCov_9fa48("1259");
    if (stryMutAct_9fa48("1262") ? reason !== "BOOTSTRAP_INCOMPLETE" : stryMutAct_9fa48("1261") ? false : stryMutAct_9fa48("1260") ? true : (stryCov_9fa48("1260", "1261", "1262"), reason === (stryMutAct_9fa48("1263") ? "" : (stryCov_9fa48("1263"), "BOOTSTRAP_INCOMPLETE")))) return DASHBOARD;
    if (stryMutAct_9fa48("1266") ? reason !== "MANDATORY_RITUAL_INCOMPLETE" : stryMutAct_9fa48("1265") ? false : stryMutAct_9fa48("1264") ? true : (stryCov_9fa48("1264", "1265", "1266"), reason === (stryMutAct_9fa48("1267") ? "" : (stryCov_9fa48("1267"), "MANDATORY_RITUAL_INCOMPLETE")))) return APPSTAFF_GERENTE;
    if (stryMutAct_9fa48("1270") ? reason !== "MODULE_NOT_ENABLED" : stryMutAct_9fa48("1269") ? false : stryMutAct_9fa48("1268") ? true : (stryCov_9fa48("1268", "1269", "1270"), reason === (stryMutAct_9fa48("1271") ? "" : (stryCov_9fa48("1271"), "MODULE_NOT_ENABLED")))) return CONFIG_MODULES;
    if (stryMutAct_9fa48("1274") ? reason === "RESTAURANT_NOT_FOUND" || surface === "TPV" || surface === "KDS" : stryMutAct_9fa48("1273") ? false : stryMutAct_9fa48("1272") ? true : (stryCov_9fa48("1272", "1273", "1274"), (stryMutAct_9fa48("1276") ? reason !== "RESTAURANT_NOT_FOUND" : stryMutAct_9fa48("1275") ? true : (stryCov_9fa48("1275", "1276"), reason === (stryMutAct_9fa48("1277") ? "" : (stryCov_9fa48("1277"), "RESTAURANT_NOT_FOUND")))) && (stryMutAct_9fa48("1279") ? surface === "TPV" && surface === "KDS" : stryMutAct_9fa48("1278") ? true : (stryCov_9fa48("1278", "1279"), (stryMutAct_9fa48("1281") ? surface !== "TPV" : stryMutAct_9fa48("1280") ? false : (stryCov_9fa48("1280", "1281"), surface === (stryMutAct_9fa48("1282") ? "" : (stryCov_9fa48("1282"), "TPV")))) || (stryMutAct_9fa48("1284") ? surface !== "KDS" : stryMutAct_9fa48("1283") ? false : (stryCov_9fa48("1283", "1284"), surface === (stryMutAct_9fa48("1285") ? "" : (stryCov_9fa48("1285"), "KDS")))))))) return stryMutAct_9fa48("1286") ? "" : (stryCov_9fa48("1286"), "/admin/modules");
    if (stryMutAct_9fa48("1289") ? reason !== "RESTAURANT_NOT_FOUND" : stryMutAct_9fa48("1288") ? false : stryMutAct_9fa48("1287") ? true : (stryCov_9fa48("1287", "1288", "1289"), reason === (stryMutAct_9fa48("1290") ? "" : (stryCov_9fa48("1290"), "RESTAURANT_NOT_FOUND")))) return stryMutAct_9fa48("1291") ? "" : (stryCov_9fa48("1291"), "/");
    return undefined;
  }
}
export function useOperationalReadiness(surface: Surface): UseOperationalReadinessResult {
  if (stryMutAct_9fa48("1292")) {
    {}
  } else {
    stryCov_9fa48("1292");
    const {
      runtime
    } = useRestaurantRuntime();
    const shift = useContext(ShiftContext);
    const bootstrap = useBootstrapState();
    return useMemo((): UseOperationalReadinessResult => {
      if (stryMutAct_9fa48("1293")) {
        {}
      } else {
        stryCov_9fa48("1293");
        // Vertical slice brutal: ignora Turno, ORE, MenuState. TPV/KDS/Dashboard leem/escrevem direto no Core.
        if (stryMutAct_9fa48("1295") ? false : stryMutAct_9fa48("1294") ? true : (stryCov_9fa48("1294", "1295"), CONFIG.DEBUG_DIRECT_FLOW)) {
          if (stryMutAct_9fa48("1296")) {
            {}
          } else {
            stryCov_9fa48("1296");
            return stryMutAct_9fa48("1297") ? {} : (stryCov_9fa48("1297"), {
              ready: stryMutAct_9fa48("1298") ? false : (stryCov_9fa48("1298"), true),
              surface,
              uiDirective: stryMutAct_9fa48("1299") ? "" : (stryCov_9fa48("1299"), "RENDER_APP"),
              loading: stryMutAct_9fa48("1300") ? true : (stryCov_9fa48("1300"), false)
            });
          }
        }

        // Dispositivo instalado (TPV/KDS): identidade fixa; não depender de runtime/exploração/publicação.
        const installedTpvRestaurantId = (stryMutAct_9fa48("1303") ? surface !== "TPV" : stryMutAct_9fa48("1302") ? false : stryMutAct_9fa48("1301") ? true : (stryCov_9fa48("1301", "1302", "1303"), surface === (stryMutAct_9fa48("1304") ? "" : (stryCov_9fa48("1304"), "TPV")))) ? getTpvRestaurantId() : null;
        const installedKdsRestaurantId = (stryMutAct_9fa48("1307") ? surface !== "KDS" : stryMutAct_9fa48("1306") ? false : stryMutAct_9fa48("1305") ? true : (stryCov_9fa48("1305", "1306", "1307"), surface === (stryMutAct_9fa48("1308") ? "" : (stryCov_9fa48("1308"), "KDS")))) ? getKdsRestaurantId() : null;
        const hasInstalledDevice = stryMutAct_9fa48("1311") ? !!installedTpvRestaurantId && !!installedKdsRestaurantId : stryMutAct_9fa48("1310") ? false : stryMutAct_9fa48("1309") ? true : (stryCov_9fa48("1309", "1310", "1311"), (stryMutAct_9fa48("1312") ? !installedTpvRestaurantId : (stryCov_9fa48("1312"), !(stryMutAct_9fa48("1313") ? installedTpvRestaurantId : (stryCov_9fa48("1313"), !installedTpvRestaurantId)))) || (stryMutAct_9fa48("1314") ? !installedKdsRestaurantId : (stryCov_9fa48("1314"), !(stryMutAct_9fa48("1315") ? installedKdsRestaurantId : (stryCov_9fa48("1315"), !installedKdsRestaurantId)))));
        const effectiveRestaurantId = stryMutAct_9fa48("1316") ? (installedTpvRestaurantId ?? installedKdsRestaurantId) && runtime.restaurant_id : (stryCov_9fa48("1316"), (stryMutAct_9fa48("1317") ? installedTpvRestaurantId && installedKdsRestaurantId : (stryCov_9fa48("1317"), installedTpvRestaurantId ?? installedKdsRestaurantId)) ?? runtime.restaurant_id);
        const loading = hasInstalledDevice ? stryMutAct_9fa48("1318") ? true : (stryCov_9fa48("1318"), false) : runtime.loading;
        if (stryMutAct_9fa48("1320") ? false : stryMutAct_9fa48("1319") ? true : (stryCov_9fa48("1319", "1320"), loading)) {
          if (stryMutAct_9fa48("1321")) {
            {}
          } else {
            stryCov_9fa48("1321");
            return stryMutAct_9fa48("1322") ? {} : (stryCov_9fa48("1322"), {
              ready: stryMutAct_9fa48("1323") ? true : (stryCov_9fa48("1323"), false),
              surface,
              uiDirective: stryMutAct_9fa48("1324") ? "" : (stryCov_9fa48("1324"), "RENDER_APP"),
              loading: stryMutAct_9fa48("1325") ? false : (stryCov_9fa48("1325"), true)
            });
          }
        }
        const modules = getModulesEnabled(stryMutAct_9fa48("1326") ? effectiveRestaurantId && null : (stryCov_9fa48("1326"), effectiveRestaurantId ?? null));

        // Derivação canónica de readiness de configuração + operação.
        const restaurant = runtimeToRestaurant(stryMutAct_9fa48("1327") ? {} : (stryCov_9fa48("1327"), {
          runtime,
          ownerUserId: stryMutAct_9fa48("1328") ? "" : (stryCov_9fa48("1328"), "runtime-owner-unavailable"),
          ownerPhone: stryMutAct_9fa48("1329") ? "" : (stryCov_9fa48("1329"), "runtime-owner-phone-unavailable")
        }));
        const restaurantReadiness = deriveRestaurantReadiness(restaurant);

        // Ordem de avaliação (primeiro bloqueio ganha)
        let reason: BlockingReason | undefined;
        if (stryMutAct_9fa48("1332") ? !effectiveRestaurantId || surface === "TPV" || surface === "KDS" : stryMutAct_9fa48("1331") ? false : stryMutAct_9fa48("1330") ? true : (stryCov_9fa48("1330", "1331", "1332"), (stryMutAct_9fa48("1333") ? effectiveRestaurantId : (stryCov_9fa48("1333"), !effectiveRestaurantId)) && (stryMutAct_9fa48("1335") ? surface === "TPV" && surface === "KDS" : stryMutAct_9fa48("1334") ? true : (stryCov_9fa48("1334", "1335"), (stryMutAct_9fa48("1337") ? surface !== "TPV" : stryMutAct_9fa48("1336") ? false : (stryCov_9fa48("1336", "1337"), surface === (stryMutAct_9fa48("1338") ? "" : (stryCov_9fa48("1338"), "TPV")))) || (stryMutAct_9fa48("1340") ? surface !== "KDS" : stryMutAct_9fa48("1339") ? false : (stryCov_9fa48("1339", "1340"), surface === (stryMutAct_9fa48("1341") ? "" : (stryCov_9fa48("1341"), "KDS")))))))) {
          if (stryMutAct_9fa48("1342")) {
            {}
          } else {
            stryCov_9fa48("1342");
            reason = stryMutAct_9fa48("1343") ? "" : (stryCov_9fa48("1343"), "RESTAURANT_NOT_FOUND");
          }
        } else if (stryMutAct_9fa48("1346") ? runtime.coreMode !== "offline-erro" : stryMutAct_9fa48("1345") ? false : stryMutAct_9fa48("1344") ? true : (stryCov_9fa48("1344", "1345", "1346"), runtime.coreMode === (stryMutAct_9fa48("1347") ? "" : (stryCov_9fa48("1347"), "offline-erro")))) {
          if (stryMutAct_9fa48("1348")) {
            {}
          } else {
            stryCov_9fa48("1348");
            reason = stryMutAct_9fa48("1349") ? "" : (stryCov_9fa48("1349"), "CORE_OFFLINE");
          }
        } else if (stryMutAct_9fa48("1352") ? !hasInstalledDevice && (surface === "TPV" || surface === "KDS") || runtime.systemState === "SETUP" || bootstrap.operationMode === "exploracao" : stryMutAct_9fa48("1351") ? false : stryMutAct_9fa48("1350") ? true : (stryCov_9fa48("1350", "1351", "1352"), (stryMutAct_9fa48("1354") ? !hasInstalledDevice || surface === "TPV" || surface === "KDS" : stryMutAct_9fa48("1353") ? true : (stryCov_9fa48("1353", "1354"), (stryMutAct_9fa48("1355") ? hasInstalledDevice : (stryCov_9fa48("1355"), !hasInstalledDevice)) && (stryMutAct_9fa48("1357") ? surface === "TPV" && surface === "KDS" : stryMutAct_9fa48("1356") ? true : (stryCov_9fa48("1356", "1357"), (stryMutAct_9fa48("1359") ? surface !== "TPV" : stryMutAct_9fa48("1358") ? false : (stryCov_9fa48("1358", "1359"), surface === (stryMutAct_9fa48("1360") ? "" : (stryCov_9fa48("1360"), "TPV")))) || (stryMutAct_9fa48("1362") ? surface !== "KDS" : stryMutAct_9fa48("1361") ? false : (stryCov_9fa48("1361", "1362"), surface === (stryMutAct_9fa48("1363") ? "" : (stryCov_9fa48("1363"), "KDS")))))))) && (stryMutAct_9fa48("1365") ? runtime.systemState === "SETUP" && bootstrap.operationMode === "exploracao" : stryMutAct_9fa48("1364") ? true : (stryCov_9fa48("1364", "1365"), (stryMutAct_9fa48("1367") ? runtime.systemState !== "SETUP" : stryMutAct_9fa48("1366") ? false : (stryCov_9fa48("1366", "1367"), runtime.systemState === (stryMutAct_9fa48("1368") ? "" : (stryCov_9fa48("1368"), "SETUP")))) || (stryMutAct_9fa48("1370") ? bootstrap.operationMode !== "exploracao" : stryMutAct_9fa48("1369") ? false : (stryCov_9fa48("1369", "1370"), bootstrap.operationMode === (stryMutAct_9fa48("1371") ? "" : (stryCov_9fa48("1371"), "exploracao")))))))) {
          if (stryMutAct_9fa48("1372")) {
            {}
          } else {
            stryCov_9fa48("1372");
            reason = stryMutAct_9fa48("1373") ? "" : (stryCov_9fa48("1373"), "BOOTSTRAP_INCOMPLETE");
          }
        } else if (stryMutAct_9fa48("1376") ? !hasInstalledDevice && (surface === "TPV" || surface === "KDS") || restaurantReadiness.configStatus === "INCOMPLETE" : stryMutAct_9fa48("1375") ? false : stryMutAct_9fa48("1374") ? true : (stryCov_9fa48("1374", "1375", "1376"), (stryMutAct_9fa48("1378") ? !hasInstalledDevice || surface === "TPV" || surface === "KDS" : stryMutAct_9fa48("1377") ? true : (stryCov_9fa48("1377", "1378"), (stryMutAct_9fa48("1379") ? hasInstalledDevice : (stryCov_9fa48("1379"), !hasInstalledDevice)) && (stryMutAct_9fa48("1381") ? surface === "TPV" && surface === "KDS" : stryMutAct_9fa48("1380") ? true : (stryCov_9fa48("1380", "1381"), (stryMutAct_9fa48("1383") ? surface !== "TPV" : stryMutAct_9fa48("1382") ? false : (stryCov_9fa48("1382", "1383"), surface === (stryMutAct_9fa48("1384") ? "" : (stryCov_9fa48("1384"), "TPV")))) || (stryMutAct_9fa48("1386") ? surface !== "KDS" : stryMutAct_9fa48("1385") ? false : (stryCov_9fa48("1385", "1386"), surface === (stryMutAct_9fa48("1387") ? "" : (stryCov_9fa48("1387"), "KDS")))))))) && (stryMutAct_9fa48("1389") ? restaurantReadiness.configStatus !== "INCOMPLETE" : stryMutAct_9fa48("1388") ? true : (stryCov_9fa48("1388", "1389"), restaurantReadiness.configStatus === (stryMutAct_9fa48("1390") ? "" : (stryCov_9fa48("1390"), "INCOMPLETE")))))) {
          if (stryMutAct_9fa48("1391")) {
            {}
          } else {
            stryCov_9fa48("1391");
            // Configuração incompleta segundo o schema canónico (identity/local/menu/publication).
            reason = stryMutAct_9fa48("1392") ? "" : (stryCov_9fa48("1392"), "BOOTSTRAP_INCOMPLETE");
          }
        } else if (stryMutAct_9fa48("1395") ? (surface === "TPV" || surface === "KDS" || surface === "DASHBOARD") && bootstrap.operationMode === "operacao-real" && effectiveRestaurantId || !isBeforeOpenRitualComplete(effectiveRestaurantId, shift?.isShiftOpen) : stryMutAct_9fa48("1394") ? false : stryMutAct_9fa48("1393") ? true : (stryCov_9fa48("1393", "1394", "1395"), (stryMutAct_9fa48("1397") ? (surface === "TPV" || surface === "KDS" || surface === "DASHBOARD") && bootstrap.operationMode === "operacao-real" || effectiveRestaurantId : stryMutAct_9fa48("1396") ? true : (stryCov_9fa48("1396", "1397"), (stryMutAct_9fa48("1399") ? surface === "TPV" || surface === "KDS" || surface === "DASHBOARD" || bootstrap.operationMode === "operacao-real" : stryMutAct_9fa48("1398") ? true : (stryCov_9fa48("1398", "1399"), (stryMutAct_9fa48("1401") ? (surface === "TPV" || surface === "KDS") && surface === "DASHBOARD" : stryMutAct_9fa48("1400") ? true : (stryCov_9fa48("1400", "1401"), (stryMutAct_9fa48("1403") ? surface === "TPV" && surface === "KDS" : stryMutAct_9fa48("1402") ? false : (stryCov_9fa48("1402", "1403"), (stryMutAct_9fa48("1405") ? surface !== "TPV" : stryMutAct_9fa48("1404") ? false : (stryCov_9fa48("1404", "1405"), surface === (stryMutAct_9fa48("1406") ? "" : (stryCov_9fa48("1406"), "TPV")))) || (stryMutAct_9fa48("1408") ? surface !== "KDS" : stryMutAct_9fa48("1407") ? false : (stryCov_9fa48("1407", "1408"), surface === (stryMutAct_9fa48("1409") ? "" : (stryCov_9fa48("1409"), "KDS")))))) || (stryMutAct_9fa48("1411") ? surface !== "DASHBOARD" : stryMutAct_9fa48("1410") ? false : (stryCov_9fa48("1410", "1411"), surface === (stryMutAct_9fa48("1412") ? "" : (stryCov_9fa48("1412"), "DASHBOARD")))))) && (stryMutAct_9fa48("1414") ? bootstrap.operationMode !== "operacao-real" : stryMutAct_9fa48("1413") ? true : (stryCov_9fa48("1413", "1414"), bootstrap.operationMode === (stryMutAct_9fa48("1415") ? "" : (stryCov_9fa48("1415"), "operacao-real")))))) && effectiveRestaurantId)) && (stryMutAct_9fa48("1416") ? isBeforeOpenRitualComplete(effectiveRestaurantId, shift?.isShiftOpen) : (stryCov_9fa48("1416"), !isBeforeOpenRitualComplete(effectiveRestaurantId, stryMutAct_9fa48("1417") ? shift.isShiftOpen : (stryCov_9fa48("1417"), shift?.isShiftOpen)))))) {
          if (stryMutAct_9fa48("1418")) {
            {}
          } else {
            stryCov_9fa48("1418");
            reason = stryMutAct_9fa48("1419") ? "" : (stryCov_9fa48("1419"), "MANDATORY_RITUAL_INCOMPLETE");
          }
        } else if (stryMutAct_9fa48("1422") ? (surface === "TPV" || surface === "KDS") && bootstrap.operationMode === "operacao-real" && shift || !shift.isShiftOpen : stryMutAct_9fa48("1421") ? false : stryMutAct_9fa48("1420") ? true : (stryCov_9fa48("1420", "1421", "1422"), (stryMutAct_9fa48("1424") ? (surface === "TPV" || surface === "KDS") && bootstrap.operationMode === "operacao-real" || shift : stryMutAct_9fa48("1423") ? true : (stryCov_9fa48("1423", "1424"), (stryMutAct_9fa48("1426") ? surface === "TPV" || surface === "KDS" || bootstrap.operationMode === "operacao-real" : stryMutAct_9fa48("1425") ? true : (stryCov_9fa48("1425", "1426"), (stryMutAct_9fa48("1428") ? surface === "TPV" && surface === "KDS" : stryMutAct_9fa48("1427") ? true : (stryCov_9fa48("1427", "1428"), (stryMutAct_9fa48("1430") ? surface !== "TPV" : stryMutAct_9fa48("1429") ? false : (stryCov_9fa48("1429", "1430"), surface === (stryMutAct_9fa48("1431") ? "" : (stryCov_9fa48("1431"), "TPV")))) || (stryMutAct_9fa48("1433") ? surface !== "KDS" : stryMutAct_9fa48("1432") ? false : (stryCov_9fa48("1432", "1433"), surface === (stryMutAct_9fa48("1434") ? "" : (stryCov_9fa48("1434"), "KDS")))))) && (stryMutAct_9fa48("1436") ? bootstrap.operationMode !== "operacao-real" : stryMutAct_9fa48("1435") ? true : (stryCov_9fa48("1435", "1436"), bootstrap.operationMode === (stryMutAct_9fa48("1437") ? "" : (stryCov_9fa48("1437"), "operacao-real")))))) && shift)) && (stryMutAct_9fa48("1438") ? shift.isShiftOpen : (stryCov_9fa48("1438"), !shift.isShiftOpen)))) {
          if (stryMutAct_9fa48("1439")) {
            {}
          } else {
            stryCov_9fa48("1439");
            // Lei do Turno: não bloquear por turno enquanto o primeiro refresh está a correr (evita "turno fechado" em cache ao navegar para KDS)
            if (stryMutAct_9fa48("1441") ? false : stryMutAct_9fa48("1440") ? true : (stryCov_9fa48("1440", "1441"), shift.isChecking)) {
              if (stryMutAct_9fa48("1442")) {
                {}
              } else {
                stryCov_9fa48("1442");
                return stryMutAct_9fa48("1443") ? {} : (stryCov_9fa48("1443"), {
                  ready: stryMutAct_9fa48("1444") ? true : (stryCov_9fa48("1444"), false),
                  surface,
                  uiDirective: stryMutAct_9fa48("1445") ? "" : (stryCov_9fa48("1445"), "RENDER_APP"),
                  loading: stryMutAct_9fa48("1446") ? false : (stryCov_9fa48("1446"), true)
                });
              }
            }
            reason = stryMutAct_9fa48("1447") ? "" : (stryCov_9fa48("1447"), "NO_OPEN_CASH_REGISTER");
          }
        } else if (stryMutAct_9fa48("1450") ? surface === "TPV" || !modules.tpv : stryMutAct_9fa48("1449") ? false : stryMutAct_9fa48("1448") ? true : (stryCov_9fa48("1448", "1449", "1450"), (stryMutAct_9fa48("1452") ? surface !== "TPV" : stryMutAct_9fa48("1451") ? true : (stryCov_9fa48("1451", "1452"), surface === (stryMutAct_9fa48("1453") ? "" : (stryCov_9fa48("1453"), "TPV")))) && (stryMutAct_9fa48("1454") ? modules.tpv : (stryCov_9fa48("1454"), !modules.tpv)))) {
          if (stryMutAct_9fa48("1455")) {
            {}
          } else {
            stryCov_9fa48("1455");
            reason = stryMutAct_9fa48("1456") ? "" : (stryCov_9fa48("1456"), "MODULE_NOT_ENABLED");
          }
        } else if (stryMutAct_9fa48("1459") ? surface === "KDS" || !modules.kds : stryMutAct_9fa48("1458") ? false : stryMutAct_9fa48("1457") ? true : (stryCov_9fa48("1457", "1458", "1459"), (stryMutAct_9fa48("1461") ? surface !== "KDS" : stryMutAct_9fa48("1460") ? true : (stryCov_9fa48("1460", "1461"), surface === (stryMutAct_9fa48("1462") ? "" : (stryCov_9fa48("1462"), "KDS")))) && (stryMutAct_9fa48("1463") ? modules.kds : (stryCov_9fa48("1463"), !modules.kds)))) {
          if (stryMutAct_9fa48("1464")) {
            {}
          } else {
            stryCov_9fa48("1464");
            reason = stryMutAct_9fa48("1465") ? "" : (stryCov_9fa48("1465"), "MODULE_NOT_ENABLED");
          }
        } else if (stryMutAct_9fa48("1468") ? surface === "DASHBOARD" && bootstrap.operationMode === "operacao-real" && shift || !shift.isShiftOpen : stryMutAct_9fa48("1467") ? false : stryMutAct_9fa48("1466") ? true : (stryCov_9fa48("1466", "1467", "1468"), (stryMutAct_9fa48("1470") ? surface === "DASHBOARD" && bootstrap.operationMode === "operacao-real" || shift : stryMutAct_9fa48("1469") ? true : (stryCov_9fa48("1469", "1470"), (stryMutAct_9fa48("1472") ? surface === "DASHBOARD" || bootstrap.operationMode === "operacao-real" : stryMutAct_9fa48("1471") ? true : (stryCov_9fa48("1471", "1472"), (stryMutAct_9fa48("1474") ? surface !== "DASHBOARD" : stryMutAct_9fa48("1473") ? true : (stryCov_9fa48("1473", "1474"), surface === (stryMutAct_9fa48("1475") ? "" : (stryCov_9fa48("1475"), "DASHBOARD")))) && (stryMutAct_9fa48("1477") ? bootstrap.operationMode !== "operacao-real" : stryMutAct_9fa48("1476") ? true : (stryCov_9fa48("1476", "1477"), bootstrap.operationMode === (stryMutAct_9fa48("1478") ? "" : (stryCov_9fa48("1478"), "operacao-real")))))) && shift)) && (stryMutAct_9fa48("1479") ? shift.isShiftOpen : (stryCov_9fa48("1479"), !shift.isShiftOpen)))) {
          if (stryMutAct_9fa48("1480")) {
            {}
          } else {
            stryCov_9fa48("1480");
            if (stryMutAct_9fa48("1482") ? false : stryMutAct_9fa48("1481") ? true : (stryCov_9fa48("1481", "1482"), shift.isChecking)) {
              if (stryMutAct_9fa48("1483")) {
                {}
              } else {
                stryCov_9fa48("1483");
                return stryMutAct_9fa48("1484") ? {} : (stryCov_9fa48("1484"), {
                  ready: stryMutAct_9fa48("1485") ? true : (stryCov_9fa48("1485"), false),
                  surface,
                  uiDirective: stryMutAct_9fa48("1486") ? "" : (stryCov_9fa48("1486"), "RENDER_APP"),
                  loading: stryMutAct_9fa48("1487") ? false : (stryCov_9fa48("1487"), true)
                });
              }
            }
            reason = stryMutAct_9fa48("1488") ? "" : (stryCov_9fa48("1488"), "NO_OPEN_CASH_REGISTER");
          }
        }
        if (stryMutAct_9fa48("1490") ? false : stryMutAct_9fa48("1489") ? true : (stryCov_9fa48("1489", "1490"), reason)) {
          if (stryMutAct_9fa48("1491")) {
            {}
          } else {
            stryCov_9fa48("1491");
            const uiDirective = uiDirectiveFor(surface, reason);
            const redirectTo = redirectFor(surface, reason);
            return stryMutAct_9fa48("1492") ? {} : (stryCov_9fa48("1492"), {
              ready: stryMutAct_9fa48("1493") ? true : (stryCov_9fa48("1493"), false),
              blockingReason: reason,
              surface,
              uiDirective,
              redirectTo
            });
          }
        }
        return stryMutAct_9fa48("1494") ? {} : (stryCov_9fa48("1494"), {
          ready: stryMutAct_9fa48("1495") ? false : (stryCov_9fa48("1495"), true),
          surface,
          uiDirective: stryMutAct_9fa48("1496") ? "" : (stryCov_9fa48("1496"), "RENDER_APP")
        });
      }
    }, stryMutAct_9fa48("1497") ? [] : (stryCov_9fa48("1497"), [surface, runtime.loading, runtime.coreMode, runtime.systemState, runtime.restaurant_id, bootstrap.operationMode, stryMutAct_9fa48("1498") ? shift.isShiftOpen : (stryCov_9fa48("1498"), shift?.isShiftOpen), stryMutAct_9fa48("1499") ? shift.isChecking : (stryCov_9fa48("1499"), shift?.isChecking) // modules depend on restaurantId, inlined via getModulesEnabled(restaurantId)
    ]));
  }
}