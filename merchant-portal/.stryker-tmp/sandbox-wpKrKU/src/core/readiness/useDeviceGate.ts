/**
 * useDeviceGate(restaurantId) — Device Gate para TPV/KDS
 *
 * Valida que o dispositivo instalado localmente está autorizado e ativo na Config (gm_equipment).
 * CONFIG_RUNTIME_CONTRACT: "Se desligar aqui → morre lá." docs/contracts/CONFIG_RUNTIME_CONTRACT.md §2.2, §2.3.
 *
 * Ordem: depois de sabermos restaurantId e readiness; antes do layout operacional.
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
import { useEffect, useState } from "react";
import { CONFIG } from "../../config";
import { listEquipmentByRestaurant } from "../../infra/readers/EquipmentReader";
import { getInstalledDevice } from "../storage/installedDeviceStorage";
export type DeviceBlockedReason = "DEVICE_NOT_INSTALLED" | "DEVICE_RESTAURANT_MISMATCH" | "DEVICE_NOT_IN_CONFIG" | "DEVICE_DISABLED";
export interface UseDeviceGateResult {
  /** true enquanto a verificação contra a Config está a correr */
  loading: boolean;
  /** true se o dispositivo pode operar (instalado, restaurante correto, presente na Config, is_active) */
  allowed: boolean;
  /** Preenchido quando allowed === false */
  reason?: DeviceBlockedReason;
}

/**
 * Verifica se o dispositivo instalado (installedDeviceStorage) está ativo na Config (gm_equipment).
 * Bypass: DEBUG_DIRECT_FLOW (vertical slice) ou !TERMINAL_INSTALLATION_TRACK (trilho desligado).
 */
export function useDeviceGate(restaurantId: string | null): UseDeviceGateResult {
  if (stryMutAct_9fa48("1103")) {
    {}
  } else {
    stryCov_9fa48("1103");
    const [state, setState] = useState<UseDeviceGateResult>(stryMutAct_9fa48("1104") ? {} : (stryCov_9fa48("1104"), {
      loading: stryMutAct_9fa48("1105") ? false : (stryCov_9fa48("1105"), true),
      allowed: stryMutAct_9fa48("1106") ? true : (stryCov_9fa48("1106"), false)
    }));
    useEffect(() => {
      if (stryMutAct_9fa48("1107")) {
        {}
      } else {
        stryCov_9fa48("1107");
        if (stryMutAct_9fa48("1110") ? false : stryMutAct_9fa48("1109") ? true : stryMutAct_9fa48("1108") ? restaurantId : (stryCov_9fa48("1108", "1109", "1110"), !restaurantId)) {
          if (stryMutAct_9fa48("1111")) {
            {}
          } else {
            stryCov_9fa48("1111");
            setState(stryMutAct_9fa48("1112") ? {} : (stryCov_9fa48("1112"), {
              loading: stryMutAct_9fa48("1113") ? true : (stryCov_9fa48("1113"), false),
              allowed: stryMutAct_9fa48("1114") ? true : (stryCov_9fa48("1114"), false),
              reason: stryMutAct_9fa48("1115") ? "" : (stryCov_9fa48("1115"), "DEVICE_RESTAURANT_MISMATCH")
            }));
            return;
          }
        }
        if (stryMutAct_9fa48("1117") ? false : stryMutAct_9fa48("1116") ? true : (stryCov_9fa48("1116", "1117"), CONFIG.DEBUG_DIRECT_FLOW)) {
          if (stryMutAct_9fa48("1118")) {
            {}
          } else {
            stryCov_9fa48("1118");
            setState(stryMutAct_9fa48("1119") ? {} : (stryCov_9fa48("1119"), {
              loading: stryMutAct_9fa48("1120") ? true : (stryCov_9fa48("1120"), false),
              allowed: stryMutAct_9fa48("1121") ? false : (stryCov_9fa48("1121"), true)
            }));
            return;
          }
        }
        if (stryMutAct_9fa48("1124") ? false : stryMutAct_9fa48("1123") ? true : stryMutAct_9fa48("1122") ? CONFIG.TERMINAL_INSTALLATION_TRACK : (stryCov_9fa48("1122", "1123", "1124"), !CONFIG.TERMINAL_INSTALLATION_TRACK)) {
          if (stryMutAct_9fa48("1125")) {
            {}
          } else {
            stryCov_9fa48("1125");
            setState(stryMutAct_9fa48("1126") ? {} : (stryCov_9fa48("1126"), {
              loading: stryMutAct_9fa48("1127") ? true : (stryCov_9fa48("1127"), false),
              allowed: stryMutAct_9fa48("1128") ? false : (stryCov_9fa48("1128"), true)
            }));
            return;
          }
        }
        const device = getInstalledDevice();
        if (stryMutAct_9fa48("1131") ? false : stryMutAct_9fa48("1130") ? true : stryMutAct_9fa48("1129") ? device : (stryCov_9fa48("1129", "1130", "1131"), !device)) {
          if (stryMutAct_9fa48("1132")) {
            {}
          } else {
            stryCov_9fa48("1132");
            setState(stryMutAct_9fa48("1133") ? {} : (stryCov_9fa48("1133"), {
              loading: stryMutAct_9fa48("1134") ? true : (stryCov_9fa48("1134"), false),
              allowed: stryMutAct_9fa48("1135") ? true : (stryCov_9fa48("1135"), false),
              reason: stryMutAct_9fa48("1136") ? "" : (stryCov_9fa48("1136"), "DEVICE_NOT_INSTALLED")
            }));
            return;
          }
        }
        if (stryMutAct_9fa48("1139") ? device.restaurant_id === restaurantId : stryMutAct_9fa48("1138") ? false : stryMutAct_9fa48("1137") ? true : (stryCov_9fa48("1137", "1138", "1139"), device.restaurant_id !== restaurantId)) {
          if (stryMutAct_9fa48("1140")) {
            {}
          } else {
            stryCov_9fa48("1140");
            setState(stryMutAct_9fa48("1141") ? {} : (stryCov_9fa48("1141"), {
              loading: stryMutAct_9fa48("1142") ? true : (stryCov_9fa48("1142"), false),
              allowed: stryMutAct_9fa48("1143") ? true : (stryCov_9fa48("1143"), false),
              reason: stryMutAct_9fa48("1144") ? "" : (stryCov_9fa48("1144"), "DEVICE_RESTAURANT_MISMATCH")
            }));
            return;
          }
        }
        let cancelled = stryMutAct_9fa48("1145") ? true : (stryCov_9fa48("1145"), false);
        setState(stryMutAct_9fa48("1146") ? () => undefined : (stryCov_9fa48("1146"), s => stryMutAct_9fa48("1147") ? {} : (stryCov_9fa48("1147"), {
          ...s,
          loading: stryMutAct_9fa48("1148") ? false : (stryCov_9fa48("1148"), true)
        })));
        listEquipmentByRestaurant(restaurantId).then(equipment => {
          if (stryMutAct_9fa48("1149")) {
            {}
          } else {
            stryCov_9fa48("1149");
            if (stryMutAct_9fa48("1151") ? false : stryMutAct_9fa48("1150") ? true : (stryCov_9fa48("1150", "1151"), cancelled)) return;
            const row = equipment.find(stryMutAct_9fa48("1152") ? () => undefined : (stryCov_9fa48("1152"), e => stryMutAct_9fa48("1155") ? e.id !== device.device_id : stryMutAct_9fa48("1154") ? false : stryMutAct_9fa48("1153") ? true : (stryCov_9fa48("1153", "1154", "1155"), e.id === device.device_id)));
            if (stryMutAct_9fa48("1158") ? false : stryMutAct_9fa48("1157") ? true : stryMutAct_9fa48("1156") ? row : (stryCov_9fa48("1156", "1157", "1158"), !row)) {
              if (stryMutAct_9fa48("1159")) {
                {}
              } else {
                stryCov_9fa48("1159");
                setState(stryMutAct_9fa48("1160") ? {} : (stryCov_9fa48("1160"), {
                  loading: stryMutAct_9fa48("1161") ? true : (stryCov_9fa48("1161"), false),
                  allowed: stryMutAct_9fa48("1162") ? true : (stryCov_9fa48("1162"), false),
                  reason: stryMutAct_9fa48("1163") ? "" : (stryCov_9fa48("1163"), "DEVICE_NOT_IN_CONFIG")
                }));
                return;
              }
            }
            if (stryMutAct_9fa48("1166") ? false : stryMutAct_9fa48("1165") ? true : stryMutAct_9fa48("1164") ? row.is_active : (stryCov_9fa48("1164", "1165", "1166"), !row.is_active)) {
              if (stryMutAct_9fa48("1167")) {
                {}
              } else {
                stryCov_9fa48("1167");
                setState(stryMutAct_9fa48("1168") ? {} : (stryCov_9fa48("1168"), {
                  loading: stryMutAct_9fa48("1169") ? true : (stryCov_9fa48("1169"), false),
                  allowed: stryMutAct_9fa48("1170") ? true : (stryCov_9fa48("1170"), false),
                  reason: stryMutAct_9fa48("1171") ? "" : (stryCov_9fa48("1171"), "DEVICE_DISABLED")
                }));
                return;
              }
            }
            setState(stryMutAct_9fa48("1172") ? {} : (stryCov_9fa48("1172"), {
              loading: stryMutAct_9fa48("1173") ? true : (stryCov_9fa48("1173"), false),
              allowed: stryMutAct_9fa48("1174") ? false : (stryCov_9fa48("1174"), true)
            }));
          }
        }).catch(() => {
          if (stryMutAct_9fa48("1175")) {
            {}
          } else {
            stryCov_9fa48("1175");
            if (stryMutAct_9fa48("1178") ? false : stryMutAct_9fa48("1177") ? true : stryMutAct_9fa48("1176") ? cancelled : (stryCov_9fa48("1176", "1177", "1178"), !cancelled)) {
              if (stryMutAct_9fa48("1179")) {
                {}
              } else {
                stryCov_9fa48("1179");
                setState(stryMutAct_9fa48("1180") ? {} : (stryCov_9fa48("1180"), {
                  loading: stryMutAct_9fa48("1181") ? true : (stryCov_9fa48("1181"), false),
                  allowed: stryMutAct_9fa48("1182") ? true : (stryCov_9fa48("1182"), false),
                  reason: stryMutAct_9fa48("1183") ? "" : (stryCov_9fa48("1183"), "DEVICE_NOT_IN_CONFIG")
                }));
              }
            }
          }
        });
        return () => {
          if (stryMutAct_9fa48("1184")) {
            {}
          } else {
            stryCov_9fa48("1184");
            cancelled = stryMutAct_9fa48("1185") ? false : (stryCov_9fa48("1185"), true);
          }
        };
      }
    }, stryMutAct_9fa48("1186") ? [] : (stryCov_9fa48("1186"), [restaurantId]));
    return state;
  }
}