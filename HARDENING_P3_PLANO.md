# 🛡️ Hardening P3 - Plano de Execução (Nice to Have)

**Data:** 18 Janeiro 2026  
**Status:** 🟡 **PLANEJADO**  
**Após:** Hardening P0, P1 e P2 completos

---

## 📊 Contexto

Após completar **Hardening P0** (5 problemas críticos), **Hardening P1** (4 problemas de alta prioridade) e **Hardening P2** (5 problemas de menor prioridade), agora focamos nos **P3s** - melhorias "nice to have" que podem ser implementadas quando houver tempo disponível.

**Nota:** P3s são melhorias opcionais que não bloqueiam produção, mas melhoram UX e funcionalidade.

---

## 🎯 P3s Identificados

### P3-1: Task Filtering (AppStaff) 🟢

**Arquivo:** `merchant-portal/src/pages/AppStaff/WorkerTaskStream.tsx`

**Problema:**
- Não há filtro para tarefas (pending/critical/all)
- Difícil encontrar tarefas específicas em listas grandes

**Solução:**
- Adicionar filtros: "Todas", "Pendentes", "Críticas", "Concluídas"
- UI simples com botões ou dropdown

**Esforço:** 1-2 horas

---

### P3-2: Task Search Functionality 🟢

**Arquivo:** `merchant-portal/src/pages/AppStaff/WorkerTaskStream.tsx`

**Problema:**
- Não há busca de tarefas
- Difícil encontrar tarefa específica em listas grandes

**Solução:**
- Adicionar campo de busca
- Filtrar por título, descrição, ou ID

**Esforço:** 1-2 horas

---

### P3-3: Keyboard Shortcuts 🟢

**Arquivo:** Vários (TPV, AppStaff, etc.)

**Problema:**
- Não há atalhos de teclado para ações comuns
- UX menos eficiente para usuários experientes

**Solução:**
- Implementar atalhos básicos:
  - `Ctrl/Cmd + N`: Novo pedido
  - `Ctrl/Cmd + P`: Pagamento
  - `Ctrl/Cmd + K`: Busca
  - `Esc`: Fechar modal/voltar

**Esforço:** 2-3 horas

---

### P3-4: Task Timer/Stopwatch 🟡

**Arquivo:** `merchant-portal/src/pages/AppStaff/WorkerTaskFocus.tsx`

**Problema:**
- Não há timer para tarefas em progresso
- Difícil rastrear tempo gasto em tarefas

**Solução:**
- Adicionar timer visual quando tarefa está "focused"
- Mostrar tempo decorrido
- Opcional: salvar tempo no metadata da tarefa

**Esforço:** 2-3 horas

---

### P3-5: Dark Mode for Night Shifts 🟡

**Arquivo:** Global (theme system)

**Problema:**
- Não há modo escuro
- Turnos noturnos podem ser cansativos visualmente

**Solução:**
- Implementar sistema de tema
- Toggle dark/light mode
- Persistir preferência

**Esforço:** 4-6 horas

---

### P3-6: Export Shift Reports as PDF 🟡

**Arquivo:** `merchant-portal/src/pages/AppStaff/ManagerDashboard.tsx`

**Problema:**
- Não há exportação de relatórios
- Difícil compartilhar dados de turno

**Solução:**
- Adicionar botão "Exportar PDF"
- Gerar PDF com métricas do turno
- Usar biblioteca como `jsPDF` ou `react-pdf`

**Esforço:** 3-4 horas

---

## 📋 Plano de Execução (Opcional)

### Priorização Recomendada

| P3 | Impacto | Esforço | Prioridade |
|----|---------|---------|------------|
| **P3-3** | 🟢 Alto | 2-3h | **1️⃣ PRIMEIRO** |
| **P3-1** | 🟢 Médio | 1-2h | **2️⃣ SEGUNDO** |
| **P3-2** | 🟢 Médio | 1-2h | **3️⃣ TERCEIRO** |
| **P3-4** | 🟡 Baixo | 2-3h | **4️⃣ QUARTO** |
| **P3-6** | 🟡 Baixo | 3-4h | **5️⃣ QUINTO** |
| **P3-5** | 🟡 Baixo | 4-6h | **6️⃣ SEXTO** |

**Total:** 13-20 horas (opcional)

---

## ⚠️ Recomendação

**P3s são opcionais** e não bloqueiam produção. Recomendação:

1. **Focar em validação** dos P0/P1/P2 implementados primeiro
2. **Implementar P3s apenas se:**
   - Tempo disponível
   - Feedback de usuários solicita
   - Melhora significativa de UX

3. **Priorizar P3-3 (Keyboard Shortcuts)** se decidir implementar, pois:
   - Alto impacto na produtividade
   - Esforço relativamente baixo
   - Melhora UX para usuários experientes

---

## ✅ Critérios de Aceite (Se Implementar)

### P3-1: Task Filtering
- [ ] Filtros funcionam corretamente
- [ ] UI clara e intuitiva
- [ ] Performance mantida

### P3-2: Task Search
- [ ] Busca funciona em tempo real
- [ ] Filtra por título, descrição, ID
- [ ] Performance mantida

### P3-3: Keyboard Shortcuts
- [ ] Atalhos funcionam
- [ ] Não conflitam com navegador
- [ ] Documentação disponível

### P3-4: Task Timer
- [ ] Timer funciona corretamente
- [ ] Visual claro
- [ ] Opcional: salvar tempo

### P3-5: Dark Mode
- [ ] Toggle funciona
- [ ] Todas as páginas suportam
- [ ] Preferência persiste

### P3-6: PDF Export
- [ ] PDF gerado corretamente
- [ ] Dados completos
- [ ] Formato profissional

---

## 📚 Referências

- **Fonte:** `docs/audit/APPSTAFF_OPERATIONAL_AUDIT.md`
- **Contexto:** Hardening P0, P1 e P2 completos

---

**Última atualização:** 18 Janeiro 2026  
**Status:** 🟡 **OPCIONAL** - Não bloqueia produção
