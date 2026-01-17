# Plano: Refatoração de Produto - Separar Painel Cliente de Admin Interno

## Objetivo

Refatorar o menu do Painel de Comando para separar claramente:
- **Painel do Cliente (Restaurante)**: Apenas o que o restaurante precisa para operar
- **Admin Interno**: Roadmap, Status MVP, observação, loja (apenas para founders/admins)

## Problema Identificado

Itens de meta-produto e comercial estão vazando para a UI de produção:
- Roadmap / Status MVP aparecem como funcionalidades operacionais
- Loja TPV (Amazon/kits) misturada com estado do sistema
- Conceitos internos (MVP, observação) visíveis para clientes
- Narrativa de produto confundindo usuários finais

## Solução: Admin Interno Separado

### Estratégia

1. **Remover completamente** "PRODUTO" e "COMERCIAL" do menu padrão
2. **Criar detecção de admin/founder** para mostrar admin interno
3. **Mover Loja TPV** para admin interno
4. **Limpar narrativa** removendo conceitos internos

## Implementação

### Fase 1: Criar Hook useAdminAccess

**Arquivo:** `merchant-portal/src/core/auth/useAdminAccess.ts` (novo)

**Função:** Detectar se usuário é admin interno (founder, developer, ou email específico)

**Lógica:**
- Verificar `sovereign_level === 'founder'` (do FlowGate/TabIsolatedStorage)
- Verificar email em lista de admins (env var `VITE_ADMIN_EMAILS` ou config)
- Verificar `isDevStableMode()` + email específico
- Retornar `{ isAdmin: boolean, isLoading: boolean }`

**Código base:**
```typescript
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { getTabIsolated } from '../storage/TabIsolatedStorage';
import { isDevStableMode } from '../runtime/devStableMode';

export function useAdminAccess() {
  const { user } = useSupabaseAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // 1. Verificar sovereign_level
    const sovereignLevel = getTabIsolated('chefiapp_sovereign_level');
    if (sovereignLevel === 'founder') {
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    // 2. Verificar email em lista de admins
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    if (user.email && adminEmails.includes(user.email)) {
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    // 3. Verificar DEV_STABLE_MODE + email específico
    if (isDevStableMode() && user.email && adminEmails.includes(user.email)) {
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    setIsAdmin(false);
    setIsLoading(false);
  }, [user]);

  return { isAdmin, isLoading };
}
```

### Fase 2: Remover Itens do Menu Padrão

**Arquivo:** `merchant-portal/src/ui/design-system/domain/AdminSidebar.tsx`

**Mudanças:**
1. Remover grupo "Produto" do array `GROUPS` padrão
2. Remover grupo "Comercial" do array `GROUPS` padrão
3. Criar array separado `ADMIN_GROUPS` com itens de admin interno
4. Importar e usar `useAdminAccess()`
5. Renderizar `ADMIN_GROUPS` apenas se `isAdmin === true`
6. Remover estados de "Produto" e "Comercial" do `expandedGroups`

**Estrutura:**
```typescript
const GROUPS = [
  { title: 'Comando', items: [...] },
  { title: 'Operar', items: [...] },
  { title: 'Analisar', items: [...] },
  { title: 'Governar', items: [...] },
  { title: 'Conectar', items: [...] },
  // SEM Produto, SEM Comercial
];

const ADMIN_GROUPS = [
  {
    title: 'Admin Interno',
    collapsible: true,
    items: [
      { label: 'Roadmap', id: '/app/admin/roadmap', icon: '🚀' },
      { label: 'Status MVP', id: '/app/admin/status', icon: '🏗️' },
      { label: 'Loja TPV', id: '/app/admin/store', icon: '🛍️' },
    ]
  }
];
```

### Fase 3: Criar AdminRouteGuard

**Arquivo:** `merchant-portal/src/core/admin/AdminRouteGuard.tsx` (novo)

**Função:** Componente guard que protege rotas `/app/admin/*`

**Comportamento:**
- Se não é admin → redirecionar para `/app/dashboard` com mensagem
- Se é admin → renderizar children
- Mostrar loading enquanto verifica

**Código:**
```typescript
import { Navigate } from 'react-router-dom';
import { useAdminAccess } from '../auth/useAdminAccess';

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminAccess();

  if (isLoading) {
    return <div>Verificando acesso...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
```

### Fase 4: Atualizar Rotas no App.tsx

**Arquivo:** `merchant-portal/src/App.tsx`

**Mudanças:**
1. Importar `AdminRouteGuard`
2. Criar rota `/app/admin` protegida
3. Adicionar sub-rotas: roadmap, status, store
4. Manter rota antiga `/app/store/tpv-kits` com redirecionamento (compatibilidade)

**Rotas:**
```typescript
<Route path="admin" element={<AdminRouteGuard />}>
  <Route path="roadmap" element={<Navigate to="/app/coming-soon?module=product_roadmap" replace />} />
  <Route path="status" element={<Navigate to="/app/coming-soon?module=product_status" replace />} />
  <Route path="store" element={<TPVKitsPage />} />
</Route>

// Compatibilidade: redirecionar rota antiga
<Route path="store/tpv-kits" element={<Navigate to="/app/admin/store" replace />} />
```

### Fase 5: Atualizar Estados de Grupos

**Arquivo:** `merchant-portal/src/ui/design-system/domain/AdminSidebar.tsx`

**Mudanças:**
- Remover `'Produto': false` e `'Comercial': false` do estado inicial
- Adicionar `'Admin Interno': false` apenas se `isAdmin`

## Estrutura Final do Menu

### Menu do Cliente (Sempre Visível)
```
COMANDO
├── Comando Central
└── Ajustes do Núcleo

OPERAR
├── TPV (Caixa)
├── KDS (Cozinha)
├── Cardápio
├── Pedidos
└── Operação Hub [experimental]

ANALISAR
├── Fecho Diário
├── Finanças
├── Clientes (CRM)
└── Fidelidade

GOVERNAR
├── Equipa
├── Controlo de Acesso
├── Página Web
└── Segurança Alimentar [locked]

CONECTAR
├── Conectores [experimental]
└── Reputação Hub [locked]
```

### Menu Admin Interno (Apenas para Admins)
```
ADMIN INTERNO (colapsado)
├── Roadmap
├── Status MVP
└── Loja TPV
```

## Detecção de Admin

### Critérios (OR - qualquer um ativa)

1. **Sovereign Level = Founder**
   - `getTabIsolated('chefiapp_sovereign_level') === 'founder'`

2. **Email em Lista de Admins**
   - Variável: `VITE_ADMIN_EMAILS` (comma-separated)
   - Exemplo: `VITE_ADMIN_EMAILS=admin@chefiapp.com,founder@chefiapp.com`

3. **DEV_STABLE_MODE + Email Específico**
   - Se `isDevStableMode()` e email está na lista

### Configuração

**Arquivo:** `.env` ou `.env.local`

```bash
# Lista de emails com acesso admin (separados por vírgula)
VITE_ADMIN_EMAILS=admin@chefiapp.com,founder@chefiapp.com
```

## Migração de Loja TPV

### Estratégia

1. **Nova rota admin**: `/app/admin/store` → `TPVKitsPage`
2. **Rota antiga (compatibilidade)**: `/app/store/tpv-kits` → redireciona para `/app/admin/store`
3. **Menu**: Remover de menu cliente, adicionar em admin interno
4. **Referências**: Atualizar links internos se necessário

## Limpeza de Narrativa

### Remover do Cliente

- ❌ "Status MVP"
- ❌ "Fase de Observação"
- ❌ "Roadmap"
- ❌ "Evoluir"
- ❌ "Produto" (grupo)
- ❌ "Comercial" (grupo)

### Manter Apenas em Admin

- ✅ Roadmap completo
- ✅ Status MVP detalhado
- ✅ Loja TPV
- ✅ Observação e telemetria (futuro)

## Validação

Após implementação:

1. ✅ Cliente normal não vê "Produto" ou "Comercial"
2. ✅ Admin vê grupo "Admin Interno" no final
3. ✅ Loja TPV só aparece para admin
4. ✅ Rotas `/app/admin/*` protegidas
5. ✅ Menu cliente limpo e focado
6. ✅ Narrativa interna não vaza para produção
7. ✅ Rota antiga `/app/store/tpv-kits` redireciona corretamente

## Arquivos a Criar

1. `merchant-portal/src/core/auth/useAdminAccess.ts` - Hook de detecção
2. `merchant-portal/src/core/admin/AdminRouteGuard.tsx` - Guard de rotas

## Arquivos a Modificar

1. `merchant-portal/src/ui/design-system/domain/AdminSidebar.tsx` - Remover grupos, adicionar admin
2. `merchant-portal/src/App.tsx` - Adicionar rotas admin, redirecionamento loja
3. `docs/canon/ROUTE_MANIFEST.md` - Documentar rotas admin

## Resultado Esperado

**Menu do Cliente:**
- Limpo, focado em operação
- Sem ruídos de meta-produto
- Sem loja/comercial
- Apenas o essencial para operar

**Menu do Admin:**
- Grupo separado no final
- Acesso a roadmap, status, loja
- Visível apenas para admins
- Não confunde clientes

**Sistema:**
- Separação clara de responsabilidades
- Narrativa limpa
- Produto profissional
- Admin interno funcional
