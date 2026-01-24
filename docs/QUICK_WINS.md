# ⚡ Quick Wins - Próximas Melhorias Fáceis

**Melhorias de alto impacto e baixo esforço para próximas iterações**

---

## 🎯 Critérios de Quick Win

- **Esforço:** < 1 dia de trabalho
- **Impacto:** Alto ou médio
- **Dependências:** Mínimas
- **Risco:** Baixo

---

## 🥇 Prioridade Alta (Fazer Primeiro)

### 1. Auto-detecção de Método de Pagamento
**Esforço:** 2-3 horas  
**Impacto:** 🔥 Alto  
**Arquivo:** `mobile-app/components/FastPayButton.tsx`

**Problema Atual:**
Fast Pay usa cash como padrão fixo.

**Solução:**
```typescript
// Buscar histórico de pagamentos do restaurante
const getDefaultMethod = async (): Promise<PaymentMethod> => {
  const { data } = await supabase
    .from('gm_payments')
    .select('method')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);
  
  // Contar métodos
  const counts = data?.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + 1;
    return acc;
  }, {});
  
  // Retornar mais usado
  return Object.keys(counts).reduce((a, b) => 
    counts[a] > counts[b] ? a : b
  ) as PaymentMethod || 'cash';
};
```

**Benefício:**
- Melhor UX (método correto automaticamente)
- Menos toques
- Mais rápido

**Issue:** `docs/GITHUB_ISSUES.md` #5

---

### 2. Notificação Push para Mesas Urgentes
**Esforço:** 3-4 horas  
**Impacto:** 🔥 Alto  
**Arquivo:** `mobile-app/app/(tabs)/tables.tsx`

**Problema Atual:**
Garçom precisa estar olhando o mapa para ver mesas urgentes.

**Solução:**
```typescript
// Quando mesa fica vermelha (> 30min)
useEffect(() => {
  if (elapsedMinutes > 30 && !notified) {
    // Enviar notificação push
    Notifications.scheduleNotificationAsync({
      content: {
        title: `Mesa ${table.number} Urgente!`,
        body: `Ocupada há ${elapsedMinutes} minutos`,
      },
      trigger: null,
    });
    setNotified(true);
  }
}, [elapsedMinutes]);
```

**Benefício:**
- Garçom não precisa ficar olhando mapa
- Resposta mais rápida a urgências
- Melhor experiência

---

### 3. Histórico de Tempo Médio por Mesa
**Esforço:** 2-3 horas  
**Impacto:** 🟡 Médio  
**Arquivo:** `mobile-app/app/(tabs)/tables.tsx`

**Problema Atual:**
Não há histórico para comparar performance.

**Solução:**
```typescript
// Salvar tempo de ocupação quando mesa fecha
const saveTableTime = async (tableId: string, duration: number) => {
  await PersistenceService.saveTableHistory({
    tableId,
    duration,
    date: new Date().toISOString(),
  });
};

// Mostrar média na mesa
const avgTime = tableHistory.reduce((sum, h) => sum + h.duration, 0) / tableHistory.length;
```

**Benefício:**
- Dono vê tendências
- Identifica mesas problemáticas
- Dados para otimização

---

## 🥈 Prioridade Média (Fazer Depois)

### 4. Persistência Waitlist em Supabase
**Esforço:** 4-6 horas  
**Impacto:** 🟡 Médio  
**Arquivo:** `mobile-app/components/WaitlistBoard.tsx`

**Problema Atual:**
Lista de espera só persiste localmente.

**Solução:**
1. Criar tabela `gm_waitlist` no Supabase
2. Sincronizar com realtime
3. Manter fallback local

**Benefício:**
- Sincroniza entre dispositivos
- Não perde dados
- Melhor experiência multi-usuário

**Issue:** `docs/GITHUB_ISSUES.md` #6

---

### 5. Sugestão Automática de Pratos Rápidos
**Esforço:** 3-4 horas  
**Impacto:** 🟡 Médio  
**Arquivo:** `mobile-app/app/(tabs)/index.tsx`

**Problema Atual:**
Menu esconde pratos lentos, mas não sugere alternativas.

**Solução:**
```typescript
// Quando cozinha saturada, mostrar banner com sugestões
{pressure === 'high' && (
  <View style={styles.suggestions}>
    <Text>Sugestão: Pratos rápidos disponíveis</Text>
    {quickItems.map(item => (
      <QuickSuggestionItem key={item.id} item={item} />
    ))}
  </View>
)}
```

**Benefício:**
- Guia ativo (não só esconde)
- Aumenta vendas de itens rápidos
- Melhor experiência

---

### 6. Previsão de Tempo de Espera
**Esforço:** 4-5 horas  
**Impacto:** 🟡 Médio  
**Arquivo:** `mobile-app/components/WaitlistBoard.tsx`

**Problema Atual:**
Cliente não sabe quanto vai esperar.

**Solução:**
```typescript
// Calcular baseado em histórico
const estimateWaitTime = (position: number) => {
  const avgTableTime = 45; // minutos (do histórico)
  const availableTables = tables.filter(t => t.status === 'free').length;
  const estimatedMinutes = (position / availableTables) * avgTableTime;
  return estimatedMinutes;
};
```

**Benefício:**
- Cliente sabe quando vai sentar
- Reduz desistências
- Melhor experiência

---

## 🥉 Prioridade Baixa (Nice to Have)

### 7. Otimização de Performance dos Timers
**Esforço:** 2-3 horas  
**Impacto:** 🟢 Baixo (já otimizado)  
**Arquivo:** `mobile-app/app/(tabs)/tables.tsx`

**Melhoria:**
- Usar `requestAnimationFrame` ao invés de `setInterval`
- Pausar quando tela não visível
- Agrupar atualizações

**Benefício:**
- Menos uso de bateria
- Performance melhor

**Issue:** `docs/GITHUB_ISSUES.md` #7

---

### 8. Histórico de Reservas
**Esforço:** 3-4 horas  
**Impacto:** 🟢 Baixo  
**Arquivo:** `mobile-app/components/WaitlistBoard.tsx`

**Melhoria:**
- Salvar histórico de reservas
- Mostrar estatísticas
- Identificar clientes frequentes

**Benefício:**
- Dados para análise
- Melhor relacionamento com clientes

---

## 📊 Matriz de Priorização

```
Alto Impacto
    │
    │  [1] Auto-detecção método
    │  [2] Notificação urgente
    │
    │  [3] Histórico tempo mesa
    │  [4] Waitlist Supabase
    │  [5] Sugestão pratos
    │  [6] Previsão espera
    │
    │  [7] Otimização timers
    │  [8] Histórico reservas
    │
    └───────────────────────────────→
        Baixo Esforço          Alto Esforço
```

---

## 🎯 Recomendação de Ordem

### Sprint 1 (Esta Semana)
1. Auto-detecção de método (#1)
2. Notificação push urgente (#2)

### Sprint 2 (Próxima Semana)
3. Histórico de tempo mesa (#3)
4. Persistência waitlist Supabase (#4)

### Sprint 3 (Depois)
5. Sugestão automática (#5)
6. Previsão de espera (#6)

### Backlog
7. Otimização timers (#7)
8. Histórico reservas (#8)

---

## 💡 Ideias Futuras (Não Quick Wins)

### Machine Learning
- Prever saturação da cozinha
- Sugerir pratos baseado em histórico
- Otimizar turnos

### Integrações
- Delivery (sem complexidade)
- Pagamentos online
- Reservas externas

### Analytics Avançado
- Dashboard preditivo
- Recomendações automáticas
- Otimização de menu

---

## 📝 Como Implementar

### Processo
1. Escolher quick win
2. Criar branch: `feature/quick-win-[nome]`
3. Implementar
4. Testar localmente
5. Validar: `./scripts/validate-system.sh`
6. Atualizar `CHANGELOG.md`
7. Criar PR
8. Deploy

### Checklist
- [ ] Código segue padrões
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] CHANGELOG atualizado
- [ ] Validação passando

---

**Última atualização:** 2026-01-24  
**Versão:** 1.0.0
