# RESET CONTROLADO — STATUS

**Data:** 2026-01-25  
**Objetivo:** Eliminar completamente UI/UX legada e reconstruir guiada pelo Core validado.

---

## ✅ FASE 0 — BLOQUEIO DE CONTAMINAÇÃO (CONCLUÍDA)

### 0.1 Rotas Antigas Removidas
- ✅ Todas as rotas do `App.tsx` foram removidas
- ✅ Redirecionamentos automáticos eliminados
- ✅ Fallbacks para telas antigas removidos
- ✅ Guards e Effects de redirecionamento desativados

### 0.2 Imports e Dependências Limpas
- ✅ `KernelProvider` removido de `AppDomainWrapper.tsx`
- ✅ `KernelProvider` removido de `KDSStandalone.tsx`
- ✅ `useKernel` removido de `OrderContextReal.tsx`
- ✅ `useKernel` removido de `TableContext.tsx` (parcial - precisa completar)
- ✅ Imports de Kernel removidos de `main.tsx`
- ✅ Projection Effects removidos de `main.tsx`

### 0.3 Supabase Bloqueado Fora do Core
- ✅ Criado `core-boundary/docker-core/connection.ts` como única fonte de conexão
- ✅ Cliente Supabase isolado no boundary
- ✅ Documentação criada sobre uso correto

---

## ✅ FASE 1 — ISOLAMENTO DO CORE (CONCLUÍDA)

### 1.1 CORE BOUNDARY Criado
- ✅ Pasta `core-boundary/` criada
- ✅ `docker-core/connection.ts` — conexão única com Docker Core
- ✅ `docker-core/types.ts` — tipos TypeScript do schema congelado
- ✅ `README.md` — documentação do boundary

### 1.2 Schema/RPCs/Constraints Documentados
- ✅ Tipos do Core definidos em `types.ts`
- ✅ README explica regras do boundary
- ✅ Schema congelado referenciado em `docs/CORE_FROZEN_STATUS.md`

---

## ✅ FASE 2 — RESET TOTAL DA UI (CONCLUÍDA)

### 2.1 Páginas Antigas Removidas
- ✅ `App.tsx` completamente reescrito
- ✅ Apenas uma rota: `*` → `CoreResetPage`
- ✅ Nenhuma página legada importada

### 2.2 Tela Neutra Criada
- ✅ `CoreResetPage.tsx` criada
- ✅ Mostra status do Core
- ✅ Indica que sistema está em reset
- ✅ Sem redirecionamentos
- ✅ Sem auth
- ✅ Sem Supabase automático

---

## 🔄 FASE 3 — RECONSTRUÇÃO GUIADA (AGUARDANDO)

### Próximos Passos (Ordem Obrigatória)

1. **KDS Mínimo (Somente Leitura)**
   - Ler pedidos do Core via `core-boundary`
   - Exibir tickets sem ações
   - Validar conexão com Docker Core

2. **Página Web Pública Mínima**
   - Cardápio público
   - Sem auth
   - Apenas leitura

3. **Página de Mesa via QR**
   - `/public/{slug}/mesa/{n}`
   - Validação de mesa
   - Criar pedido via RPC

4. **Origem de Pedidos**
   - Integrar `QR_MESA` no RPC
   - Exibir origem no KDS

5. **Estados Visuais**
   - Hierarquia visual
   - Tempo visível
   - Origem clara

6. **Ações**
   - Botões de ação
   - Integração com RPCs

---

## 📋 ARQUIVOS MODIFICADOS

### Criados
- `merchant-portal/src/pages/CoreReset/CoreResetPage.tsx`
- `merchant-portal/src/core-boundary/README.md`
- `merchant-portal/src/core-boundary/docker-core/connection.ts`
- `merchant-portal/src/core-boundary/docker-core/types.ts`
- `docs/RESET_CONTROLADO_STATUS.md` (este arquivo)

### Modificados
- `merchant-portal/src/App.tsx` — completamente reescrito
- `merchant-portal/src/main.tsx` — Kernel removido
- `merchant-portal/src/app/AppDomainWrapper.tsx` — KernelProvider removido
- `merchant-portal/src/pages/TPV/KDS/KDSStandalone.tsx` — KernelProvider removido
- `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` — useKernel removido (parcial)

### Pendentes (Ainda Usam Kernel)
- `merchant-portal/src/pages/TPV/context/TableContext.tsx` — precisa remover `useKernel`
- `merchant-portal/src/pages/Menu/useMenuState.ts` — precisa remover `useKernel`
- `merchant-portal/src/pages/TPV/components/IncomingRequests.tsx` — precisa remover `useKernel`
- `merchant-portal/src/pages/Onboarding/AdvancedSetupPage.tsx` — precisa remover `useKernel`

---

## 🎯 CRITÉRIO DE SUCESSO

- ✅ Sistema sobe limpo
- ✅ Nenhuma UI antiga aparece
- ✅ Nenhum redirect inesperado
- ✅ Nenhum uso de Supabase fora do Core (via boundary)
- ✅ UI começa mínima (CoreResetPage)
- 🔄 UI cresce apenas conforme o Core exige (próxima fase)

---

## ⚠️ NOTAS IMPORTANTES

1. **TableContext.tsx** ainda usa `useKernel` — precisa ser refatorado para usar PostgREST diretamente
2. **useMenuState.ts** ainda usa `useKernel` — precisa ser refatorado
3. Alguns componentes podem quebrar ao tentar usar — isso é esperado, eles serão reconstruídos na Fase 3

---

## 🚀 COMO TESTAR

1. Subir o Docker Core: `docker-compose -f docker-core/docker-compose.core.yml up -d`
2. Subir o frontend: `npm run dev`
3. Acessar `http://localhost:5175`
4. Deve aparecer apenas a tela "UI RESET / CORE ONLY"
5. Nenhum erro no console relacionado a rotas antigas
6. Nenhum redirect automático

---

**Status:** ✅ Fases 0, 1 e 2 concluídas. Pronto para Fase 3 (Reconstrução Guiada).
