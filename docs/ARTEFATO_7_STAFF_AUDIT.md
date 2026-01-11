# ARTEFATO 7 — Staff App Audit Profundo

Data: 2026-01-04
Escopo: Carga cognitiva, gamificação, erros silenciosos, UX operacional
Foco: Worker, Manager, Owner views

---

## 0) Resumo executivo

O Staff App possui uma arquitetura de 6 camadas bem desenhada, mas carece de elementos de gamificação e feedback positivo. Erros são tratados de forma básica e não há loop de engajamento para funcionários.

**Veredito**: Funcional para go-live, mas com débito de UX significativo em retenção de staff.

---

## 1) Arquitetura de estados (6 camadas)

```
1. THE DOOR      → AppStaffLanding (sem contrato)
2. THE IDENTITY  → WorkerCheckInView (sem worker ativo)
3. THE CORTEX    → ManagerDashboard (role = manager)
4. THE CONSCIOUSNESS → OwnerDashboard (role = owner)
5. DOMINANT STATE → Tool-specific (order/production/check)
6. THE STREAM    → WorkerTaskStream/Focus (fluxo padrão)
```

**Avaliação**: ✅ Arquitetura sólida, roteamento claro.

---

## 2) Carga cognitiva por view

### 2.1 WorkerCheckInView (Check-in)
| Métrica | Valor | Status |
|---|---|---|
| Campos visíveis | 1 (nome) | ✅ Mínimo |
| Botões de ação | 1 (Entrar) | ✅ Claro |
| Informações auxiliares | 0 | ✅ Sem ruído |
| Tempo até ação | <5s | ✅ Rápido |

**Carga**: BAIXA ✅

### 2.2 WorkerTaskStream (Tarefas)
| Métrica | Valor | Status |
|---|---|---|
| Cards por tela | Variável (pode ser 10+) | ⚠️ Sem paginação |
| Info por card | 4 (badge, título, desc, status) | ✅ Adequado |
| Actions | 2 (tap task, encerrar turno) | ✅ Claro |
| Empty state | Sim ("Tudo em dia") | ✅ Presente |

**Carga**: MÉDIA ⚠️ (pode crescer sem controle)

### 2.3 WorkerTaskFocus (Foco)
| Métrica | Valor | Status |
|---|---|---|
| Tools | 5 tipos (portioning, production, check, counter, confirm) | ✅ Separados |
| Actions principais | 1-2 por tool | ✅ Focado |
| Long-press mechanic | Sim (prevent accidents) | ✅ Seguro |
| Escape hatch | Não visível | ⚠️ User pode ficar preso |

**Carga**: BAIXA-MÉDIA ✅

### 2.4 ManagerDashboard (Gerente)
| Métrica | Valor | Status |
|---|---|---|
| Seções visíveis | 4 (pulse, hunger, intelligence, interventions) | ⚠️ Pode sobrecarregar |
| Metrics | 2 (risk level, pulse) | ✅ Key metrics |
| Actions | 1 (sign out) | ⚠️ Falta ação direta |
| Mock data | Sim (alertas fixos) | ⚠️ Não é real |

**Carga**: MÉDIA-ALTA ⚠️

### 2.5 OwnerDashboard (Proprietário)
| Métrica | Valor | Status |
|---|---|---|
| Metrics | 2 (vendas hoje, pedidos ativos) | ✅ Essencial |
| Actions | 1 (ABRIR TPV) | ✅ Claro |
| Loading state | Sim | ✅ Presente |
| Real data | Sim (orders reais) | ✅ |

**Carga**: BAIXA ✅

---

## 3) Gamificação / Dopamina

### 3.1 Elementos encontrados

| Elemento | Presente | Local |
|---|---|---|
| Pontos / XP | ❌ Não | - |
| Streaks | ❌ Não | - |
| Level up | ❌ Não | - |
| Badges de conquista | ❌ Não | - |
| Confetti/celebração | ❌ Não | - |
| Vibração háptica | ❌ Não | - |
| Som de sucesso | ❌ Não | - |
| Progress bar (tasks) | ⚠️ Parcial | LongPressButton |
| Feedback toast | ⚠️ Parcial | PortioningTaskView |

### 3.2 Análise

**Estado atual**: Staff App é 100% utilitário, 0% gamificado.

**Impacto**:
- Workers não têm incentivo para completar tarefas rapidamente
- Sem feedback positivo após completar tasks críticas
- Sem histórico de performance individual
- Manager não vê performance comparativa da equipe

### 3.3 Oportunidades quick-win (P1)

1. **Toast de sucesso ao completar task**: "Ótimo trabalho! 3 tarefas hoje."
2. **Badge de velocidade**: Se task completada em <50% do tempo médio
3. **Streak visual**: "🔥 5 tarefas seguidas sem pausa"
4. **Confetti no fim do turno**: Se todas tarefas completadas

---

## 4) Erros silenciosos / Edge cases

### 4.1 Mapa de erros

| Cenário | Tratamento | Status |
|---|---|---|
| Código inválido no join | ❌ "Erro desconhecido" | P1 - genérico |
| Check-in com nome vazio | ✅ Botão disabled | OK |
| Check-in com rede offline | ❌ Não detectado | P1 |
| Task list vazio | ✅ Empty state | OK |
| Task sem tool compatível | ✅ Falls to ConfirmTool | OK |
| Long-press interrupted | ✅ Progress reset | OK |
| Supabase undefined | ⚠️ Check exists, mas improvánel | P2 |
| Owner sem orders | ✅ Mostra 0 / R$0,00 | OK |

### 4.2 Erros silenciosos identificados

1. **joinRemoteOperation falha**: Mostra "Erro desconhecido" se `!result.success` sem mensagem
2. **ManagerDashboard mock data**: `setAlerts` usa dados hardcoded, não reflete realidade
3. **TaskWhyBadge**: `console.error` no catch, mas UI não mostra nada ao usuário

### 4.3 Recomendações

| # | Issue | Fix | Prioridade |
|---|---|---|---|
| 1 | Erro genérico no join | Mapear erros específicos (código expirado, operação não encontrada) | P1 |
| 2 | Manager mock data | Remover ou flag clara de "modo demo" | P1 |
| 3 | TaskWhyBadge silent fail | Mostrar "?" se falha ao carregar | P2 |
| 4 | Offline no check-in | Detectar e mostrar aviso | P1 |

---

## 5) UX operacional (micro-interações)

### 5.1 Positivos

- **LongPressButton**: Excelente mecânica para prevenir taps acidentais
- **Empty states**: Presentes em todas views críticas
- **Loading states**: Presentes na maioria
- **Role-based routing**: Funciona sem bugs

### 5.2 Gaps

| Gap | Impacto | Fix |
|---|---|---|
| Sem vibração háptica | Feedback fraco em mobile | `navigator.vibrate(50)` |
| Sem som de confirmação | Usuário não sabe se ação completou | Opcional audio |
| Delay artificial 600ms no boot | Percepção de lentidão | Remover ou reduzir |
| Botão "Voltar" invisível em WorkerTaskFocus | User fica preso | Adicionar botão |
| Counter tool não persiste valor | Sempre mostra "12" fixo | Hook de estado |

---

## 6) Comparativo com referências

### 6.1 vs. Toast Tab (referência de mercado)
| Feature | Toast | ChefIApp Staff |
|---|---|---|
| Check-in PIN | ✅ | ❌ (nome livre) |
| Task assignments | ✅ | ✅ |
| Gamification | ❌ | ❌ |
| Break timer | ✅ | ❌ |
| Shift history | ✅ | ❌ |

### 6.2 vs. 7shifts (app de staff)
| Feature | 7shifts | ChefIApp Staff |
|---|---|---|
| Schedule view | ✅ | ❌ |
| Time clock | ✅ | ⚠️ Básico |
| Team chat | ✅ | ❌ |
| Shift swap | ✅ | ❌ |
| Manager approvals | ✅ | ❌ |

**Conclusão**: ChefIApp Staff é mais focado em tarefas operacionais que em gestão de pessoal.

---

## 7) Resumo por prioridade

### P0 — Bloqueiam operação
Nenhum. ✅

### P1 — Fricção significativa
| # | Issue | Impacto | Esforço |
|---|---|---|---|
| 1 | Erro genérico no join | Confusão do usuário | Baixo |
| 2 | Mock data no Manager | Dados irreais | Médio |
| 3 | Sem feedback de sucesso | Falta de motivação | Baixo |
| 4 | Offline não detectado | Ação perdida | Médio |
| 5 | Escape hatch em TaskFocus | User preso | Baixo |

### P2 — Débito técnico / UX
| # | Issue | Quando |
|---|---|---|
| 1 | Gamificação completa | V2 |
| 2 | Vibração háptica | V1.1 |
| 3 | Counter tool funcional | V1.1 |
| 4 | Delay 600ms | Opcional |
| 5 | Histórico de turnos | V2 |

---

## 8) Decisão

**Veredito**: Staff App está **GO para produção** com os P1 listados como backlog imediato.

**Riscos aceitos**:
- Sem gamificação (não bloqueia operação, mas reduz engajamento)
- Mock data em Manager (usuário pode confundir com dados reais)

**Ação imediata recomendada**:
1. PR-UX-Errors: Melhorar mensagens de erro no join
2. Flag "DEMO" clara no ManagerDashboard se usar mock
3. Toast de sucesso ao completar task

---

## 9) Próximos passos

- [ ] ARTEFATO 8: Comparação Last.app
- [ ] Plano 7/30/90
