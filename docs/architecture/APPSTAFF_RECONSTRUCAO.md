# 🔨 AppStaff 2.0 - Plano de Reconstrução

**Desconstruir e reconstruir com novo paradigma**

---

## 🎯 Decisão Estratégica

**O AppStaff ATUAL NÃO DEVE SER "REFATORADO".**

Ele deve ser **DESCONSTRUÍDO E RECONSTRUÍDO** com outro paradigma.

---

## 🔄 O Que Evoluir (Transformar)

### 1. Ritual de Início de Turno

**Evoluir para:**
- Início automático (sem bloqueio)
- Avisos não bloqueantes
- Confirmação opcional

**Razão:**
- Fricção desnecessária removida
- Funcionário chega e trabalha imediatamente
- Sistema detecta atividade automaticamente

**Framing:**
- ✅ "Início automático e inteligente"
- ❌ "Removemos início de turno"

---

### 2. Lista de Tarefas

**Evoluir para:**
- Tarefas automáticas e invisíveis
- Sistema decide o que fazer
- Funcionário vê apenas 1 ação por vez

**Razão:**
- Tarefas não competem com trabalho real
- Foco total na ação prioritária
- Funcionário trabalha, não gerencia

**Framing:**
- ✅ "Tarefas automáticas e invisíveis"
- ❌ "Removemos lista de tarefas"

---

### 3. XP e Gamificação Visível

**Evoluir para:**
- IQO implícito (mede silenciosamente)
- Métricas estratégicas para gestão
- Sem distração operacional

**Razão:**
- Gamificação não distrai do trabalho
- Qualidade medida automaticamente
- Insights estratégicos para gestão

**Framing:**
- ✅ "IQO implícito, métricas estratégicas"
- ❌ "Removemos gamificação"

**Manter (Backend):**
- IQO silencioso (mede, não exibe)
- `recordQualityEvent()` (para gerente/dono)

---

### 4. Avisos Bloqueantes

**Evoluir para:**
- Avisos não bloqueantes
- Avisos críticos viram ações do NOW ENGINE
- Sistema guia, não bloqueia

**Razão:**
- Não bloqueia trabalho rápido
- Avisos orbitam, não bloqueiam
- Sistema prioriza automaticamente

**Framing:**
- ✅ "Avisos contextuais e não bloqueantes"
- ❌ "Removemos avisos"

**Manter (Não Bloqueante):**
- Avisos podem aparecer como ações do NOW ENGINE (se críticos)
- Mas nunca bloqueiam início

---

### 5. Múltiplas Telas

**Evoluir para:**
- 1 tela única adaptativa
- Interface muda por role automaticamente
- Sem navegação, sem escolhas

**Razão:**
- AppStaff é 1 tela única
- Sistema adapta interface ao papel
- Zero decisões para o usuário

**Framing:**
- ✅ "Interface única adaptativa por role"
- ❌ "Removemos múltiplas telas"

---

## ✅ O Que Criar (Reconstruir)

### 1. NOW ENGINE

**Criar:**
- `services/NowEngine.ts` - Motor de decisão
- `hooks/useNowEngine.ts` - Hook para AppStaff
- Regras de priorização
- Contexto agregado

**Razão:**
- Sistema decide, não funcionário
- 1 ação única por vez
- Priorização inteligente

---

### 2. Tela Única

**Criar:**
- `components/NowActionCard.tsx` - UI única
- 1 tela, 1 ação, 1 botão
- Estados: crítico, urgente, atenção, silêncio

**Razão:**
- Funcionário vê 1 coisa
- Sem sobrecarga cognitiva
- Visual, não textual

---

### 3. Sincronização em Tempo Real

**Criar:**
- Canal Supabase para eventos
- Polling de fallback
- Offline-first

**Razão:**
- AppStaff sempre atualizado
- Reage imediatamente a eventos
- Funciona offline

---

## 🔄 Plano de Migração

### Fase 1: Criar NOW ENGINE (Sem Quebrar App Atual)

**Ações:**
1. Criar `services/NowEngine.ts`
2. Criar `hooks/useNowEngine.ts`
3. Implementar regras de priorização
4. Testar isoladamente

**Resultado:**
- NOW ENGINE funciona
- App atual continua funcionando
- Zero breaking changes

---

### Fase 2: Criar Tela Única (Paralelo)

**Ações:**
1. Criar `components/NowActionCard.tsx`
2. Criar `screens/AppStaffSingle.tsx`
3. Implementar estados (crítico, urgente, atenção, silêncio)
4. Testar isoladamente

**Resultado:**
- Tela única funciona
- App atual continua funcionando
- Zero breaking changes

---

### Fase 3: Integrar NOW ENGINE + Tela Única

**Ações:**
1. Conectar `useNowEngine` com `NowActionCard`
2. Testar fluxo completo
3. Validar sincronização

**Resultado:**
- AppStaff 2.0 funciona
- App atual ainda disponível (feature flag)

---

### Fase 4: Remover Código Antigo

**Ações:**
1. Remover `ShiftGate.tsx`
2. Remover lista de tarefas
3. Remover XP visível
4. Remover avisos bloqueantes
5. Remover múltiplas telas

**Resultado:**
- AppStaff 2.0 é único
- Código limpo
- Zero legacy

---

## 📁 Nova Estrutura de Arquivos

### Antes (AppStaff 1.0)

```
mobile-app/
├── app/(tabs)/staff.tsx          # Lista de tarefas
├── components/
│   ├── ShiftGate.tsx            # Bloqueio
│   └── ...
├── context/
│   └── AppStaffContext.tsx      # Lógica complexa
└── ...
```

### Depois (AppStaff 2.0)

```
mobile-app/
├── app/(tabs)/staff.tsx          # Tela única
├── services/
│   └── NowEngine.ts             # Motor de decisão
├── hooks/
│   └── useNowEngine.ts          # Hook para UI
├── components/
│   └── NowActionCard.tsx         # UI única
└── context/
    └── AppStaffContext.tsx      # Apenas estado (role, shift)
```

---

## 🎯 Critérios de Sucesso

### Funcionário Novo Entende em 3 Segundos

- ✅ Tela mostra 1 coisa
- ✅ Título claro (2 palavras)
- ✅ Botão único
- ✅ Sem leitura longa

### Funcionário Velho Não Rejeita

- ✅ Não pede configuração
- ✅ Não pede aprendizado
- ✅ Apenas mostra ação
- ✅ Funciona offline

### Gerente Grita Menos

- ✅ Sistema guia funcionário
- ✅ Prioridades são claras
- ✅ Ações críticas aparecem primeiro
- ✅ Não há ruído

### Restaurante Sente Falta se Remover

- ✅ Sistema é essencial
- ✅ Substitui WhatsApp
- ✅ Substitui gritos
- ✅ Melhora operação

---

## 🚀 Próximos Passos Imediatos

### 1. Implementar NOW ENGINE

**Arquivo:** `mobile-app/services/NowEngine.ts`

**Tarefas:**
- [ ] Criar classe `NowEngine`
- [ ] Implementar `gatherContext()`
- [ ] Implementar `calculateNowAction()`
- [ ] Implementar regras de priorização
- [ ] Implementar sincronização (Realtime + Polling)
- [ ] Testar isoladamente

---

### 2. Implementar Hook

**Arquivo:** `mobile-app/hooks/useNowEngine.ts`

**Tarefas:**
- [ ] Criar hook `useNowEngine()`
- [ ] Conectar com `NowEngine` service
- [ ] Expor `nowAction` e `completeAction()`
- [ ] Testar isoladamente

---

### 3. Implementar Tela Única

**Arquivo:** `mobile-app/components/NowActionCard.tsx`

**Tarefas:**
- [ ] Criar componente `NowActionCard`
- [ ] Implementar estados (crítico, urgente, atenção, silêncio)
- [ ] Implementar UI mínima
- [ ] Implementar transições
- [ ] Testar isoladamente

---

### 4. Integrar no AppStaff

**Arquivo:** `mobile-app/app/(tabs)/staff.tsx`

**Tarefas:**
- [ ] Substituir lista de tarefas por `NowActionCard`
- [ ] Remover `ShiftGate` (ou tornar não-bloqueante)
- [ ] Remover XP bar
- [ ] Remover avisos bloqueantes
- [ ] Testar fluxo completo

---

## 🔒 Garantias

### 1. Zero Breaking Changes Durante Migração

- App atual continua funcionando
- Feature flag para AppStaff 2.0
- Migração gradual

### 2. Backward Compatible

- Dados antigos continuam funcionando
- Migração de dados automática
- Sem perda de informação

### 3. Offline-First

- Funciona offline
- Sincroniza quando online
- Não perde ações

---

## 📊 Métricas de Sucesso

### Antes (AppStaff 1.0)

- Nota: 2.5/10
- Funcionário novo: Não entende
- Funcionário velho: Rejeita
- Gerente: Ainda grita
- Restaurante: Não sentiria falta

### Depois (AppStaff 2.0)

- Nota: 8+/10 (meta)
- Funcionário novo: Entende em 3s
- Funcionário velho: Não rejeita
- Gerente: Grita menos
- Restaurante: Sentiria falta

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Plano Definido
