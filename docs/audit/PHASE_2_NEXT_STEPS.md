# 🎯 FASE 2 — Próximos Passos Imediatos

**Data:** 2026-01-30  
**Status Atual:** 30% completo  
**Próximo:** Implementar modo demo no TPV e verificações

---

## 🔴 Pendências Críticas

### 1. Modo Demo no TPV.tsx

**Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`

**Funcionalidades:**
- Detectar parâmetro `?demo=true` na URL
- Ou state do router: `{ demo: true }`
- Dados pré-preenchidos:
  - Mesa 1 selecionada
  - 2-3 itens do menu no carrinho
- Banner "Modo Demo" visível no topo
- Botão "Processar Pagamento" fake (não cria pagamento real)
- Mostrar mensagem de sucesso após "pagamento"

**Implementação:**
```typescript
// No início do componente TPV
const location = useLocation();
const searchParams = new URLSearchParams(location.search);
const isDemo = searchParams.get('demo') === 'true' || location.state?.demo;

// Se demo, pré-preencher dados
useEffect(() => {
  if (isDemo) {
    // Selecionar mesa 1
    // Adicionar 2-3 itens ao carrinho
    // Mostrar banner demo
  }
}, [isDemo]);
```

**Tempo estimado:** 2-3 horas

---

### 2. Verificações de Menu e Venda

**Arquivo:** Criar `merchant-portal/src/hooks/useOnboardingStatus.ts` (NOVO)

**Funcionalidades:**
- Verificar se menu foi criado (contar itens em `gm_products`)
- Verificar se primeira venda foi feita (contar pedidos em `gm_orders`)
- Retornar status: `{ hasMenu: boolean, hasFirstSale: boolean }`

**Implementação:**
```typescript
export function useOnboardingStatus(restaurantId: string | null) {
  const [status, setStatus] = useState({
    hasMenu: false,
    hasFirstSale: false,
    loading: true,
  });

  useEffect(() => {
    if (!restaurantId) return;
    
    // Verificar menu
    const checkMenu = async () => {
      const { count } = await supabase
        .from('gm_products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId);
      
      return (count || 0) > 0;
    };
    
    // Verificar primeira venda
    const checkFirstSale = async () => {
      const { count } = await supabase
        .from('gm_orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'completed');
      
      return (count || 0) > 0;
    };
    
    // Executar verificações
    Promise.all([checkMenu(), checkFirstSale()]).then(([hasMenu, hasFirstSale]) => {
      setStatus({ hasMenu, hasFirstSale, loading: false });
    });
  }, [restaurantId]);
  
  return status;
}
```

**Tempo estimado:** 1 hora

---

### 3. Avisos no Dashboard

**Arquivo:** Criar `merchant-portal/src/components/OnboardingReminder.tsx` (NOVO)

**Funcionalidades:**
- Mostrar banner se menu não criado
- Mostrar banner se primeira venda não feita
- Botões para completar onboarding
- Não bloquear acesso (usuário pode voltar depois)

**Tempo estimado:** 1 hora

---

### 4. Integração MenuDemo com MenuBootstrapService

**Problema:** `MenuDemo.tsx` cria menu diretamente, mas `MenuBootstrapService` precisa de kernel.

**Solução A:** Criar Edge Function para criar menu
- **Arquivo:** `supabase/functions/create-example-menu/index.ts` (NOVO)
- **Tempo:** 2 horas

**Solução B:** Usar MenuBootstrapService sem kernel (simplificado)
- **Tempo:** 1 hora

**Recomendação:** Solução B (mais rápido)

---

## 🟡 Pendências Não-Bloqueadoras

### 5. Melhorias no Tutorial
- Screenshots ou ilustrações
- Animações entre passos
- Salvar progresso (localStorage)

### 6. Celebração após Primeira Venda
- Modal de celebração
- Atualizar status de onboarding
- Redirecionar para dashboard

---

## 📋 Ordem de Execução Recomendada

### Hoje (4-5 horas)
1. ✅ Criar MenuDemo.tsx
2. ✅ Criar FirstSaleGuide.tsx
3. ✅ Adicionar rotas
4. 🔴 Implementar modo demo no TPV.tsx (2-3h)
5. 🔴 Criar useOnboardingStatus.ts (1h)

### Amanhã (2-3 horas)
6. 🔴 Criar OnboardingReminder.tsx
7. 🔴 Integrar verificações no dashboard
8. 🔴 Ajustar MenuDemo para usar MenuBootstrapService

### Esta Semana (2-3 horas)
9. 🔴 Testar fluxo completo
10. 🔴 Medir tempo: Login → Primeira Venda
11. 🔴 Ajustes finais

---

## 🧪 Testes Necessários

### Teste 1: Fluxo Completo (<10 minutos)
- [ ] Criar novo usuário
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (trial)
- [ ] Criar menu de exemplo
- [ ] Ver tutorial de primeira venda
- [ ] Fazer primeira venda (demo)
- [ ] Medir tempo total (deve ser <10 minutos)

### Teste 2: Menu Manual
- [ ] Pular menu de exemplo
- [ ] Criar menu manualmente
- [ ] Verificar se tutorial aparece

### Teste 3: Pular Tutorial
- [ ] Pular tutorial
- [ ] Verificar se pode acessar TPV normalmente

---

## 📊 Progresso Esperado

**Hoje:** 30% → 60% (após modo demo e verificações)  
**Amanhã:** 60% → 85% (após avisos e integração)  
**Esta Semana:** 85% → 100% (após testes)

---

**Próximo passo imediato:** Implementar modo demo no TPV.tsx
