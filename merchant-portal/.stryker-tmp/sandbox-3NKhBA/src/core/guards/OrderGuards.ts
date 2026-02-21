// @ts-nocheck
// FASE 3.3: Isolado - core não depende de páginas
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
import type { Order } from '../contracts';
export type ValidationResult = {
  allowed: boolean;
  reason?: string;
  code?: 'EMPTY_ORDER' | 'ALREADY_SENT' | 'PAYMENT_PENDING' | 'ALREADY_PAID';
};
export const canSendToKitchen = (order: Order): ValidationResult => {
  if (stryMutAct_9fa48("832")) {
    {}
  } else {
    stryCov_9fa48("832");
    if (stryMutAct_9fa48("835") ? false : stryMutAct_9fa48("834") ? true : stryMutAct_9fa48("833") ? order : (stryCov_9fa48("833", "834", "835"), !order)) return stryMutAct_9fa48("836") ? {} : (stryCov_9fa48("836"), {
      allowed: stryMutAct_9fa48("837") ? true : (stryCov_9fa48("837"), false),
      reason: stryMutAct_9fa48("838") ? "" : (stryCov_9fa48("838"), 'Pedido inválido')
    });
    if (stryMutAct_9fa48("841") ? order.items.length !== 0 : stryMutAct_9fa48("840") ? false : stryMutAct_9fa48("839") ? true : (stryCov_9fa48("839", "840", "841"), order.items.length === 0)) {
      if (stryMutAct_9fa48("842")) {
        {}
      } else {
        stryCov_9fa48("842");
        return stryMutAct_9fa48("843") ? {} : (stryCov_9fa48("843"), {
          allowed: stryMutAct_9fa48("844") ? true : (stryCov_9fa48("844"), false),
          reason: stryMutAct_9fa48("845") ? "" : (stryCov_9fa48("845"), 'Pedido vazio'),
          code: stryMutAct_9fa48("846") ? "" : (stryCov_9fa48("846"), 'EMPTY_ORDER')
        });
      }
    }
    if (stryMutAct_9fa48("849") ? order.status === 'new' : stryMutAct_9fa48("848") ? false : stryMutAct_9fa48("847") ? true : (stryCov_9fa48("847", "848", "849"), order.status !== (stryMutAct_9fa48("850") ? "" : (stryCov_9fa48("850"), 'new')))) {
      if (stryMutAct_9fa48("851")) {
        {}
      } else {
        stryCov_9fa48("851");
        return stryMutAct_9fa48("852") ? {} : (stryCov_9fa48("852"), {
          allowed: stryMutAct_9fa48("853") ? true : (stryCov_9fa48("853"), false),
          reason: stryMutAct_9fa48("854") ? "" : (stryCov_9fa48("854"), 'Pedido já enviado para cozinha'),
          code: stryMutAct_9fa48("855") ? "" : (stryCov_9fa48("855"), 'ALREADY_SENT')
        });
      }
    }
    return stryMutAct_9fa48("856") ? {} : (stryCov_9fa48("856"), {
      allowed: stryMutAct_9fa48("857") ? false : (stryCov_9fa48("857"), true)
    });
  }
};
export const canStartCheckout = (order: Order): ValidationResult => {
  if (stryMutAct_9fa48("858")) {
    {}
  } else {
    stryCov_9fa48("858");
    if (stryMutAct_9fa48("861") ? false : stryMutAct_9fa48("860") ? true : stryMutAct_9fa48("859") ? order : (stryCov_9fa48("859", "860", "861"), !order)) return stryMutAct_9fa48("862") ? {} : (stryCov_9fa48("862"), {
      allowed: stryMutAct_9fa48("863") ? true : (stryCov_9fa48("863"), false),
      reason: stryMutAct_9fa48("864") ? "" : (stryCov_9fa48("864"), 'Pedido inválido')
    });
    if (stryMutAct_9fa48("867") ? order.items.length !== 0 : stryMutAct_9fa48("866") ? false : stryMutAct_9fa48("865") ? true : (stryCov_9fa48("865", "866", "867"), order.items.length === 0)) {
      if (stryMutAct_9fa48("868")) {
        {}
      } else {
        stryCov_9fa48("868");
        return stryMutAct_9fa48("869") ? {} : (stryCov_9fa48("869"), {
          allowed: stryMutAct_9fa48("870") ? true : (stryCov_9fa48("870"), false),
          reason: stryMutAct_9fa48("871") ? "" : (stryCov_9fa48("871"), 'Pedido vazio'),
          code: stryMutAct_9fa48("872") ? "" : (stryCov_9fa48("872"), 'EMPTY_ORDER')
        });
      }
    }

    // In H2, we might allow checking out 'new' orders (skipping kitchen for drinks?)
    // But usually we expect flow: new -> kitchen -> served -> paid.
    // For now, permissive but sanity checked.

    if (stryMutAct_9fa48("875") ? order.status === 'served' && order.status === 'paid' : stryMutAct_9fa48("874") ? false : stryMutAct_9fa48("873") ? true : (stryCov_9fa48("873", "874", "875"), (stryMutAct_9fa48("877") ? order.status !== 'served' : stryMutAct_9fa48("876") ? false : (stryCov_9fa48("876", "877"), order.status === (stryMutAct_9fa48("878") ? "" : (stryCov_9fa48("878"), 'served')))) || (stryMutAct_9fa48("880") ? order.status !== 'paid' : stryMutAct_9fa48("879") ? false : (stryCov_9fa48("879", "880"), order.status === (stryMutAct_9fa48("881") ? "" : (stryCov_9fa48("881"), 'paid')))))) {
      if (stryMutAct_9fa48("882")) {
        {}
      } else {
        stryCov_9fa48("882");
        // assuming 'paid' exists or will exist
        return stryMutAct_9fa48("883") ? {} : (stryCov_9fa48("883"), {
          allowed: stryMutAct_9fa48("884") ? true : (stryCov_9fa48("884"), false),
          reason: stryMutAct_9fa48("885") ? "" : (stryCov_9fa48("885"), 'Pedido já finalizado'),
          code: stryMutAct_9fa48("886") ? "" : (stryCov_9fa48("886"), 'ALREADY_PAID')
        });
      }
    }
    return stryMutAct_9fa48("887") ? {} : (stryCov_9fa48("887"), {
      allowed: stryMutAct_9fa48("888") ? false : (stryCov_9fa48("888"), true)
    });
  }
};
export const canCloseTable = (order: Order): ValidationResult => {
  if (stryMutAct_9fa48("889")) {
    {}
  } else {
    stryCov_9fa48("889");
    // Alias for checkout completion
    if (stryMutAct_9fa48("892") ? order.status !== 'served' : stryMutAct_9fa48("891") ? false : stryMutAct_9fa48("890") ? true : (stryCov_9fa48("890", "891", "892"), order.status === (stryMutAct_9fa48("893") ? "" : (stryCov_9fa48("893"), 'served')))) return stryMutAct_9fa48("894") ? {} : (stryCov_9fa48("894"), {
      allowed: stryMutAct_9fa48("895") ? true : (stryCov_9fa48("895"), false),
      reason: stryMutAct_9fa48("896") ? "" : (stryCov_9fa48("896"), 'Já fechada')
    });
    return stryMutAct_9fa48("897") ? {} : (stryCov_9fa48("897"), {
      allowed: stryMutAct_9fa48("898") ? false : (stryCov_9fa48("898"), true)
    });
  }
};