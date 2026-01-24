# 🚀 AppStaff 2.0 - Próximos Passos

**Guia de implementação e testes**

---

## ✅ O Que Foi Completado

### 1. Arquitetura
- ✅ NOW ENGINE implementado
- ✅ Lógica de priorização completa
- ✅ Filtros por role funcionando
- ✅ Sincronização em tempo real (Supabase Realtime)

### 2. UI
- ✅ Tela única (NowActionCard)
- ✅ Estados visuais (crítico, urgente, atenção, silêncio)
- ✅ Integração com FinancialVault e QuickPayModal

### 3. Lógica de Ações
- ✅ `completeAction` implementado
- ✅ Processamento de pagamentos
- ✅ Processamento de entregas
- ✅ Atualização de status no Supabase

---

## 🔄 Próximos Passos

### 1. Testes de Integração

#### Teste 1: Ações Aparecem Corretamente
```bash
# 1. Iniciar app
# 2. Iniciar turno
# 3. Criar pedido no TPV
# 4. Verificar se ação aparece no AppStaff
```

**Validações:**
- [ ] Ação de "coletar pagamento" aparece quando pedido está pronto
- [ ] Ação de "entregar" aparece quando item está pronto
- [ ] Priorização está correta (crítico > urgente > atenção)

#### Teste 2: Filtros por Role
```bash
# 1. Mudar role para 'waiter'
# 2. Verificar que apenas ações de garçom aparecem
# 3. Mudar role para 'cook'
# 4. Verificar que apenas ações de cozinheiro aparecem
```

**Validações:**
- [ ] Garçom não vê ações de cozinheiro
- [ ] Cozinheiro não vê ações de garçom
- [ ] Gerente vê todas as ações críticas/urgentes

#### Teste 3: Completar Ações
```bash
# 1. Ação de pagamento aparece
# 2. Tocar botão "COBRAR"
# 3. QuickPayModal abre
# 4. Selecionar método e confirmar
# 5. Verificar que próxima ação aparece
```

**Validações:**
- [ ] Pagamento processa corretamente
- [ ] Status atualiza no Supabase
- [ ] Próxima ação aparece automaticamente
- [ ] Ação anterior não reaparece

#### Teste 4: Sincronização em Tempo Real
```bash
# 1. Abrir AppStaff em um dispositivo
# 2. Criar pedido no TPV (outro dispositivo)
# 3. Verificar que ação aparece automaticamente
```

**Validações:**
- [ ] Ações aparecem sem refresh
- [ ] Múltiplos dispositivos sincronizam
- [ ] Sem duplicação de ações

---

### 2. Melhorias de UX

#### A. Feedback Visual
- [ ] Adicionar animação ao completar ação
- [ ] Adicionar feedback háptico mais forte
- [ ] Adicionar som de confirmação (opcional)

#### B. Estados de Erro
- [ ] Tratar erros de rede
- [ ] Mostrar mensagem se ação falhar
- [ ] Permitir retry

#### C. Loading States
- [ ] Melhorar loading inicial
- [ ] Mostrar loading ao completar ação
- [ ] Evitar flicker ao recalcular

---

### 3. Otimizações

#### A. Performance
- [ ] Debounce em recalculations
- [ ] Cache de contexto operacional
- [ ] Otimizar queries do Supabase

#### B. Offline
- [ ] Queue de ações offline
- [ ] Sincronização quando voltar online
- [ ] Indicador de status offline

---

### 4. Remoção de Código Legado

#### A. Remover UI Antiga
- [ ] Remover lista de tarefas
- [ ] Remover XP bar
- [ ] Remover dashboards antigos
- [ ] Remover ShiftGate bloqueante

#### B. Limpar Context
- [ ] Remover tasks do AppStaffContext
- [ ] Remover gamificação visível
- [ ] Manter apenas IQO backend

---

### 5. Integração com TPV e KDS

#### A. Eventos do TPV
- [ ] Validar que eventos chegam no NOW ENGINE
- [ ] Testar criação de pedido
- [ ] Testar pagamento
- [ ] Testar cancelamento

#### B. Eventos do KDS
- [ ] Validar que eventos chegam no NOW ENGINE
- [ ] Testar item pronto
- [ ] Testar item cancelado
- [ ] Testar pressão de cozinha

---

## 🧪 Scripts de Teste

### Teste Manual Completo

```bash
# 1. Setup
- Iniciar app
- Iniciar turno como 'waiter'
- Abrir TPV em outro dispositivo

# 2. Teste de Pagamento
- Criar pedido no TPV
- Marcar como "pronto para pagar"
- Verificar ação no AppStaff
- Completar pagamento
- Verificar que mesa fica livre

# 3. Teste de Entrega
- Criar pedido no TPV
- Marcar item como "pronto" no KDS
- Verificar ação no AppStaff
- Completar entrega
- Verificar que item fica entregue

# 4. Teste de Priorização
- Criar múltiplos pedidos
- Verificar que ação mais urgente aparece
- Completar ação
- Verificar que próxima ação aparece
```

---

## 📊 Métricas de Sucesso

### Funcionais
- [ ] Funcionário novo entende em 3 segundos
- [ ] Funcionário velho não rejeita
- [ ] Gerente grita menos
- [ ] Restaurante sente falta se remover

### Técnicas
- [ ] Ações aparecem em < 1 segundo
- [ ] Zero ações duplicadas
- [ ] Zero ações perdidas
- [ ] Sincronização em tempo real funciona

---

## 🐛 Problemas Conhecidos

### 1. Ações Duplicadas
**Sintoma:** Mesma ação aparece múltiplas vezes  
**Causa:** Realtime pode disparar múltiplas vezes  
**Solução:** Adicionar debounce e tracking de ações recentes

### 2. Ações Não Aparecem
**Sintoma:** Ação deveria aparecer mas não aparece  
**Causa:** Filtro de role muito restritivo ou contexto não atualizado  
**Solução:** Validar filtros e adicionar logs de debug

### 3. Ações Não Completam
**Sintoma:** Ação não desaparece após completar  
**Causa:** Erro no Supabase ou realtime não atualiza  
**Solução:** Adicionar error handling e fallback para polling

---

## 🔧 Debug

### Logs Úteis

```typescript
// No NowEngine.ts
console.log('[NowEngine] Context:', context);
console.log('[NowEngine] All actions:', allActions);
console.log('[NowEngine] Filtered actions:', roleActions);
console.log('[NowEngine] Selected action:', action);

// No useNowEngine.ts
console.log('[useNowEngine] Action updated:', nowAction);
```

### Ferramentas

- Supabase Dashboard: Ver eventos em tempo real
- React Native Debugger: Ver estado do contexto
- Network Inspector: Ver queries do Supabase

---

## 📝 Checklist de Implementação

### Fase 1: Testes Básicos
- [ ] Ações aparecem
- [ ] Filtros funcionam
- [ ] Ações completam
- [ ] Sincronização funciona

### Fase 2: Melhorias
- [ ] UX melhorada
- [ ] Erros tratados
- [ ] Performance otimizada

### Fase 3: Limpeza
- [ ] Código legado removido
- [ ] Documentação atualizada
- [ ] Testes automatizados

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Pronto para Testes
