# 🔄 TAB ISOLATION - PLANO DE CONTINUAÇÃO

**Data:** 12 Janeiro 2026  
**Status Atual:** 1/71 completo (1.4%)  
**Meta:** 100% refatorado

---

## 📊 SITUAÇÃO ATUAL

### **Ocorrências Restantes:**
- **localStorage direto:** ~11 ocorrências em 7 arquivos
- **Arquivos já migrados:** Muitos (ver FASE3_REFATORACAO_COMPLETA.md)
- **TabIsolatedStorage:** Implementado e funcionando

### **Arquivos com localStorage direto:**
1. `merchant-portal/src/core/tenant/TenantContext.tsx` - 1 ocorrência
2. `merchant-portal/src/pages/TPV/KDS/KDSStandalone.tsx` - 1 ocorrência
3. `merchant-portal/src/core/storage/TabIsolatedStorage.ts` - 3 ocorrências (OK - é o próprio helper)
4. `merchant-portal/src/pages/TPV/context/OrderContextReal.test.tsx` - 2 ocorrências (OK - testes)
5. `merchant-portal/src/doc/architecture/DEVICE_ROLES.md` - 1 ocorrência (OK - documentação)
6. `merchant-portal/src/tests/canon.spec.ts` - 2 ocorrências (OK - testes)
7. `merchant-portal/src/core/README.md` - 1 ocorrência (OK - documentação)

---

## 🎯 ARQUIVOS PARA REFATORAR

### **Prioridade 1 (Críticos):**
1. ✅ `TenantContext.tsx` - 1 ocorrência
2. ✅ `KDSStandalone.tsx` - 1 ocorrência

### **Prioridade 2 (Testes - OK manter):**
- `OrderContextReal.test.tsx` - 2 ocorrências (testes podem usar localStorage)
- `canon.spec.ts` - 2 ocorrências (testes podem usar localStorage)

### **Prioridade 3 (Documentação - OK manter):**
- `DEVICE_ROLES.md` - 1 ocorrência (documentação)
- `README.md` - 1 ocorrência (documentação)

---

## 📋 PLANO DE EXECUÇÃO

### **Fase 1: Arquivos Críticos (30 min)**

#### **1. TenantContext.tsx**
```typescript
// ANTES
const restaurantId = localStorage.getItem('chefiapp_restaurant_id');

// DEPOIS
import { getTabIsolated } from '@/core/storage/TabIsolatedStorage';
const restaurantId = getTabIsolated('chefiapp_restaurant_id');
```

#### **2. KDSStandalone.tsx**
```typescript
// ANTES
localStorage.setItem('kds_restaurant_id', restaurantId);

// DEPOIS
import { setTabIsolated } from '@/core/storage/TabIsolatedStorage';
setTabIsolated('kds_restaurant_id', restaurantId);
```

---

## ✅ CHECKLIST

- [ ] Refatorar `TenantContext.tsx`
- [ ] Refatorar `KDSStandalone.tsx`
- [ ] Executar testes
- [ ] Validar que não quebrou nada
- [ ] Commit

---

## 📊 MÉTRICAS

| Métrica | Antes | Depois | Status |
|---------|-------|--------|--------|
| **localStorage direto (código)** | 2 | 0 | ⏳ |
| **localStorage em testes** | 4 | 4 | ✅ OK |
| **localStorage em docs** | 2 | 2 | ✅ OK |
| **TabIsolatedStorage** | ✅ | ✅ | ✅ |

---

## 🚀 EXECUÇÃO

**Tempo estimado:** 30 minutos  
**Prioridade:** Média (não bloqueia soft launch)  
**Risco:** Baixo (apenas 2 arquivos)

---

**Última atualização:** 12 Janeiro 2026
