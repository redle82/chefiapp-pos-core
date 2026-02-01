# KDS Perfeito — Design e Especificação

**Data:** 2026-01-25  
**Status:** 🎨 Design  
**Objetivo:** Criar o KDS perfeito para experiência de cozinha

---

## 🎯 Princípios Fundamentais

O KDS perfeito é onde:
- **O sistema "vira verdade"**
- **A confiança nasce ou morre**
- **O humano interage sob pressão**

**Se o KDS for perfeito:**
- O garçom confia
- O cozinheiro não reclama
- O dono dorme

---

## 📐 Hierarquia Visual Absoluta

### Estados Visuais

| Estado | Cor | Tamanho | Posição | Animação |
|--------|-----|---------|---------|----------|
| **NOVO** | Dourado (#FFC107) | Maior | Topo | Pulsação suave |
| **EM PREPARO** | Azul (#3B82F6) | Médio | Meio | Estático |
| **ATRASADO** | Vermelho (#EF4444) | Maior | Topo | Pulsação rápida |

**Regra:** A diferença visual deve ser **impossível de ignorar**.

---

## 🏷️ Origem Clara

### Badges de Origem

Cada pedido deve mostrar **claramente** de onde veio:

| Origem | Badge | Cor | Ícone |
|--------|-------|-----|-------|
| **TPV** | "CAIXA" | Verde (#22C55E) | 💰 |
| **Web** | "WEB" | Laranja (#F59E0B) | 🌐 |
| **Mobile** | "GARÇOM" | Azul (#3B82F6) | 📱 |

**Regra:** Badge sempre visível, nunca escondido.

---

## ⏱️ Tempo Visível

### Timer de Pedido

**Exibição:**
- Formato: `MM:SS` (até 1h) ou `H:MM:SS` (acima de 1h)
- Fonte: Monospace, bold
- Atualização: A cada segundo

**Cores por Tempo:**
- **< 5min:** Verde (#22C55E) — Normal
- **5-15min:** Amarelo (#F59E0B) — Atenção
- **> 15min:** Vermelho (#EF4444) — Crítico

**Posição:** Canto superior direito do ticket, sempre visível.

---

## 🎯 Ação Óbvia

### Botões de Ação

**Hierarquia:**
1. **Botão Principal** (maior, mais visível)
   - Novo → "INICIAR PREPARO"
   - Em Preparo → "MARCAR PRONTO"

2. **Botão Secundário** (menor, menos proeminente)
   - Cancelar / Pausar (se aplicável)

**Regras:**
- Um botão por vez (não confundir)
- Texto claro e direto
- Feedback imediato (loading, sucesso, erro)

---

## 🚫 Zero Ruído

### O Que NÃO Mostrar

- ❌ Informações irrelevantes para cozinha
- ❌ Animações desnecessárias
- ❌ Textos longos
- ❌ Múltiplas ações simultâneas
- ❌ Estados intermediários confusos

### O Que Mostrar

- ✅ Mesa (número)
- ✅ Itens (nome, quantidade)
- ✅ Tempo (timer)
- ✅ Origem (badge)
- ✅ Ação (botão claro)
- ✅ Status (visual, não texto)

---

## 🎨 Especificação Visual

### Layout do Ticket

```
┌─────────────────────────────────────┐
│ [NOVO] #12  [WEB]  [05:23] ⚠️      │ ← Header (origem + tempo)
├─────────────────────────────────────┤
│ 2x Pizza Margherita                  │
│ 1x Coca-Cola                         │ ← Itens
│ Nota: Sem cebola                     │
├─────────────────────────────────────┤
│ [INICIAR PREPARO]                    │ ← Ação
└─────────────────────────────────────┘
```

### Hierarquia de Informação

1. **Nível 1 (Crítico):**
   - Status (NOVO / EM PREPARO / ATRASADO)
   - Tempo (timer)
   - Origem (badge)

2. **Nível 2 (Importante):**
   - Mesa (número)
   - Itens (lista)

3. **Nível 3 (Contextual):**
   - Notas
   - Modificações

---

## 🔄 Fluxo de Estados

### Transições

```
NOVO → [INICIAR PREPARO] → EM PREPARO → [MARCAR PRONTO] → PRONTO
```

**Regras:**
- Transição visual clara (animação suave)
- Feedback imediato (loading, sucesso)
- Erro visível (banner, não toast)

---

## 📱 Responsividade

### Tablet/TV (KDS Principal)

- **Layout:** Grid de 2-3 colunas
- **Tamanho mínimo:** 1024px
- **Fonte:** Grande (legível a 2m)

### Mobile (Garçom)

- **Layout:** Lista vertical
- **Tamanho mínimo:** 320px
- **Fonte:** Média (legível a 30cm)

---

## 🎯 Critérios de Sucesso

### Para o Cozinheiro

- ✅ **Vê imediatamente** qual pedido é novo
- ✅ **Sabe de onde veio** (TPV/Web/Mobile)
- ✅ **Vê o tempo** sem precisar calcular
- ✅ **Sabe o que fazer** (botão claro)
- ✅ **Não se distrai** (zero ruído)

### Para o Sistema

- ✅ **Hierarquia visual** funciona
- ✅ **Origem** sempre visível
- ✅ **Tempo** sempre atualizado
- ✅ **Ação** sempre clara
- ✅ **Zero ruído** mantido

---

## 🚀 Implementação

### Fase 1: Hierarquia Visual

1. Refatorar `TicketCard` para estados visuais distintos
2. Implementar cores e tamanhos por estado
3. Adicionar animações sutis

### Fase 2: Origem Clara

1. Extrair origem do pedido (`origin` field)
2. Criar componente `OriginBadge`
3. Integrar no `TicketCard`

### Fase 3: Tempo Visível

1. Melhorar `OrderTimer` (já existe)
2. Adicionar indicador visual de "atrasado"
3. Destacar timer em pedidos críticos

### Fase 4: Ação Óbvia

1. Simplificar botões (um por vez)
2. Adicionar feedback visual imediato
3. Melhorar mensagens de erro

### Fase 5: Zero Ruído

1. Remover informações desnecessárias
2. Simplificar layout
3. Otimizar animações

---

## 📝 Checklist de Validação

### Visual

- [ ] Hierarquia visual clara (novo ≠ preparo ≠ atrasado)
- [ ] Origem sempre visível (badge)
- [ ] Tempo sempre visível (timer)
- [ ] Ação sempre clara (botão)
- [ ] Zero ruído (sem informações desnecessárias)

### Funcional

- [ ] Transições funcionam
- [ ] Feedback imediato
- [ ] Erros visíveis
- [ ] Offline tratado
- [ ] Performance aceitável

### UX

- [ ] Cozinheiro entende imediatamente
- [ ] Não precisa pensar
- [ ] Não se distrai
- [ ] Confia no sistema

---

## 🎯 Próximos Passos

1. **Revisar implementação atual**
2. **Criar mockups visuais**
3. **Implementar hierarquia visual**
4. **Adicionar origem clara**
5. **Melhorar tempo visível**
6. **Simplificar ações**
7. **Remover ruído**

---

**KDS Perfeito — Design pronto para implementação.**

_Design: 2026-01-25_
