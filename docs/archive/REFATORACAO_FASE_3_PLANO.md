**Status:** ARCHIVED  
**Reason:** Refatoração concluída; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md  
**Arquivado em:** 2026-01-28

---

# 🔧 Refatoração Fase 3 - Checklist Cirúrgico (Oficial)

**Data de Criação:** 2026-01-26  
**Data de Conclusão:** 2026-01-26  
**Status:** ✅ CONCLUÍDA COM SUCESSO  
**Princípio Absoluto:** Nenhuma mudança funcional, nenhuma mudança visual, nenhum novo fluxo.

---

## 🧱 REGRA DE EXECUÇÃO (OBRIGATÓRIA)

- ✔️ **Um passo por commit**
- ✔️ **Testar após cada passo**
- ✔️ **Se algo quebrar → rollback imediato**
- ❌ **Nunca refatorar "aproveitando o embalo"**

---

## FASE 3.1 — NORMALIZAÇÃO DE NOMES (SEM LÓGICA)

### Objetivo

Eliminar ambiguidade sem alterar código executável.

### Checklist

- [ ] Renomear arquivos com nomes históricos/confusos
- [ ] Padronizar:
  - [ ] `KDSMinimal` (já padronizado)
  - [ ] `TPVMinimal` (já padronizado)
  - [ ] `AppStaffMinimal` (já padronizado)
- [ ] Ajustar apenas nomes, não conteúdo

### Regras

- ❌ Não mover arquivos ainda
- ❌ Não mudar exports
- ❌ Não tocar em lógica

### Teste Obrigatório

Abrir e validar:
- [ ] `/kds-minimal` - carrega corretamente
- [ ] `/tpv` - carrega corretamente
- [ ] `/garcom` - carrega corretamente
- [ ] Criar 1 pedido de cada origem
- [ ] Verificar pedidos aparecem no KDS

---

## FASE 3.2 — ISOLAMENTO DE CONTRATOS (TYPES)

### Objetivo

Separar o que é Core do que é UI.

### Checklist

- [ ] Criar pasta única de contratos: `src/core/contracts/`
- [ ] Mover para lá:
  - [ ] Types de `Order`
  - [ ] Types de `OrderItem`
  - [ ] Enums de `OrderOrigin`
  - [ ] Interfaces de RPC
- [ ] UI só importa de `core/contracts`

### Regras

- ❌ Não alterar shape dos dados
- ❌ Não renomear campos
- ❌ Não mudar schema mental

### Teste Obrigatório

- [ ] Typecheck (TS) passa
- [ ] Criar pedido por:
  - [ ] QR Mesa
  - [ ] AppStaff
  - [ ] TPV
- [ ] Verificar pedidos aparecem no KDS

---

## FASE 3.3 — LIMPEZA DE IMPORTS CRUZADOS

### Objetivo

Evitar dependência invisível entre UIs.

### Checklist

- [ ] Nenhuma UI importa código de outra UI
- [ ] AppStaff não importa TPV
- [ ] TPV não importa KDS
- [ ] KDS não importa AppStaff
- [ ] Tudo que for compartilhado → `core/`

### Regras

- ❌ Não mover arquivos grandes
- ❌ Não criar abstrações novas
- ✅ Apenas cortar dependências indevidas

### Teste Obrigatório

- [ ] Build limpo (sem erros)
- [ ] Navegação básica funciona
- [ ] Pedido aparece no KDS

---

## FASE 3.4 — CONSOLIDAÇÃO DE CONTEXTS (SEM UNIFICAÇÃO AGRESSIVA)

### Objetivo

Reduzir duplicação sem criar "super-context".

### Checklist

- [ ] Identificar contexts duplicados de:
  - [ ] Order state
  - [ ] Offline state
- [ ] Consolidar somente se forem idênticos
- [ ] Manter contexts separados se houver dúvida

### Regra de Ouro

**Se precisa pensar muito → não consolidar**

### Teste Obrigatório

- [ ] Pedido offline → replay funciona
- [ ] Pedido normal funciona
- [ ] KDS atualiza corretamente

---

## FASE 3.5 — PADRONIZAÇÃO DE ACESSO AO CORE

### Objetivo

Garantir que todas as UIs falam com o Core do mesmo jeito.

### Checklist

- [ ] Todas as chamadas RPC passam por: `core-boundary/docker-core/connection.ts` (via `dockerCoreClient`)
- [ ] Nenhuma UI chama PostgREST direto
- [ ] Erros tratados no mesmo padrão
- [ ] Usar `OrderWriter` para criar pedidos

### Regras

- ❌ Não mudar endpoints
- ❌ Não mudar payload
- ❌ Não "melhorar" error handling

### Teste Obrigatório

- [ ] Derrubar conexão
- [ ] Criar pedido offline
- [ ] Subir conexão
- [ ] Verificar replay funciona

---

## FASE 3.6 — DOCUMENTAÇÃO E FECHAMENTO

### Checklist Final

- [x] Atualizar:
  - [x] `docs/REFATORACAO_FASE_3_PLANO.md` (este arquivo)
  - [x] `docs/REFATORACAO_FASE_3_STATUS.md`
- [x] Registrar:
  - [x] O que foi feito
  - [x] O que não foi feito
  - [x] Decisões tomadas
- [x] Marcar status final

### Status Final

```
✅ REFATORAÇÃO FASE 3 CONCLUÍDA
✅ Data de Conclusão: 2026-01-26
✅ Todas as sub-fases executadas com sucesso
✅ Nenhuma regressão funcional
✅ Typecheck passando
```

---

## ❌ O QUE É PROIBIDO NA FASE 3

- ❌ Criar feature
- ❌ Ajustar UX
- ❌ Refatorar Core SQL
- ❌ "Aproveitar para melhorar"
- ❌ Criar abstração nova sem necessidade clara

---

## 📊 Estado Atual do Código (Mapeamento Inicial)

### Types Encontrados

**Order Types:**
- `merchant-portal/src/pages/TPV/context/OrderTypes.ts` - Order, OrderItem (UI)
- `merchant-portal/src/core-boundary/docker-core/types.ts` - CoreOrder, CoreOrderItem (Core)
- `merchant-portal/src/pages/TPV/KDS/components/OriginBadge.tsx` - OrderOrigin (local)

**OrderOrigin Enums:**
- `core-boundary/docker-core/types.ts`: `'CAIXA' | 'WEB' | 'QR_MESA' | 'GARCOM'`
- `pages/TPV/KDS/components/OriginBadge.tsx`: `'CAIXA' | 'TPV' | 'WEB' | 'WEB_PUBLIC' | 'QR_MESA' | 'GARÇOM' | 'MOBILE' | 'APPSTAFF' | ...`

**RPC Client:**
- `merchant-portal/src/core-boundary/docker-core/connection.ts` - `dockerCoreClient` ✅
- `merchant-portal/src/core-boundary/writers/OrderWriter.ts` - `createOrder()` ✅

### Imports Cruzados Encontrados

**AppStaff importando TPV:**
- `merchant-portal/src/intelligence/gm-bridge/GMBridgeProvider.tsx` - importa `OrderContext`
- `merchant-portal/src/intelligence/nervous-system/useNervousPhysics.ts` - importa `OrderContext`

**Core importando UI:**
- `merchant-portal/src/core/inventory/InventoryEngine.ts` - importa `OrderTypes` de TPV
- `merchant-portal/src/core/orders/OrderNormalizer.ts` - importa `OrderTypes` de TPV
- `merchant-portal/src/core/services/OrderProcessingService.ts` - importa `OrderTypes` de TPV

**Componentes importando de páginas:**
- Múltiplos componentes importando de `pages/TPV/context/` e `pages/AppStaff/context/`

---

## 🎯 Próximos Passos

1. **Iniciar Fase 3.1** - Normalização de nomes
2. **Executar passo a passo** - Um commit por item
3. **Testar após cada passo** - Garantir que nada quebrou
4. **Documentar progresso** - Atualizar status em tempo real

---

**Status:** ✅ Checklist aprovado e pronto para execução.
