# 🎯 GitHub Issues - PLANO DE GUERRA

**Fonte:** `docs/audit/PRODUCT_STRATEGY_AUDIT.md` - FASE 2.5  
**Objetivo:** Transformar auditoria em tarefas executáveis  
**Meta:** Elevar ChefIApp de 6.5 → 8.0 em 30 dias

---

## 📋 SPRINT 48H (BLOQUEADORES)

---

### Issue #1: [UX] Proteger contra pagamento duplo (ERRO-004)

**Título:** `[UX] Proteger contra pagamento duplo - ERRO-004`

**Contexto:**
Se garçom clicar rápido demais no botão de pagamento, pode processar pagamento duas vezes, causando duplicação financeira e confusão operacional.

**Referência:** ERRO-004 (Crítico) - `docs/audit/HUMAN_TEST_REPORT.md`

**Critério de Pronto:**
- ✅ Botão desabilitado imediatamente após primeiro clique
- ✅ Estado de loading visível durante processamento
- ✅ Debounce de 500ms mínimo entre cliques
- ✅ Confirmação contextual se valor > €100 ou múltiplos pagamentos recentes
- ✅ Teste: 10 tentativas de duplo clique rápido = 0 duplicações

**Arquivos a Modificar:**
- `mobile-app/components/QuickPayModal.tsx` (adicionar lock state)
- `mobile-app/app/(tabs)/staff.tsx` (isProcessingPayment já existe, validar)
- `mobile-app/components/FastPayButton.tsx` (adicionar debounce)

**Riscos:**
- Usuário pode pensar que botão está quebrado se não houver feedback visual
- Rollback: Remover debounce, manter apenas lock state

**Testes Manuais (Simulador):**
1. Abrir pedido entregue no AppStaff
2. Clicar rapidamente 5x no botão "Cobrar"
3. **Esperado:** Apenas 1 pagamento processado, botão desabilita após primeiro clique
4. Verificar no banco: apenas 1 registro de pagamento
5. Testar com valor > €100: deve pedir confirmação

**KPI Sofia:**
- 0 casos de pagamento duplo / semana
- Tempo médio de processamento < 2s

---

### Issue #2: [UX] Badge de origem do pedido (ERRO-002)

**Título:** `[UX] Badge de origem do pedido - ERRO-002`

**Contexto:**
Garçom não sabe se pedido veio da web, do garçom ou do caixa. Isso causa confusão na entrega e dificulta priorização.

**Referência:** ERRO-002 (Crítico) - `docs/audit/HUMAN_TEST_REPORT.md`

**Critério de Pronto:**
- ✅ Badge fixo visível em todos os pedidos (WEB / GARÇOM / CAIXA)
- ✅ Cor distinta por origem (WEB: azul, GARÇOM: verde, CAIXA: amarelo)
- ✅ Ícone por canal (🌐 WEB, 👤 GARÇOM, 💳 CAIXA)
- ✅ Badge visível em: NowActionCard, OrderCard, KDSTicket
- ✅ Teste: 100% dos pedidos com badge visível

**Arquivos a Modificar:**
- `mobile-app/services/NowEngine.ts` (já tem `orderOrigin`, validar uso)
- `mobile-app/components/NowActionCard.tsx` (adicionar badge)
- `mobile-app/app/(tabs)/orders.tsx` (adicionar badge no OrderCard)
- `mobile-app/components/KDSTicket.tsx` (adicionar badge)
- `mobile-app/context/OrderContext.tsx` (garantir que `origin` está sendo setado)

**Riscos:**
- Badge pode poluir UI se muito grande
- Rollback: Remover badge, manter apenas cor de fundo sutil

**Testes Manuais (Simulador):**
1. Criar pedido via web (página pública)
2. Verificar badge "WEB" no AppStaff
3. Criar pedido via garçom (AppStaff)
4. Verificar badge "GARÇOM" no AppStaff
5. Criar pedido via TPV (merchant portal)
6. Verificar badge "CAIXA" no AppStaff
7. Verificar badge no KDS (cozinha/bar)

**KPI Sofia:**
- 100% dos pedidos com badge de origem visível
- 0 casos de confusão de origem / semana

---

### Issue #3: [UX] Clarificar ação "acknowledge" (ERRO-003)

**Título:** `[UX] Clarificar ação "acknowledge" - ERRO-003`

**Contexto:**
Ação "acknowledge" não é clara. Garçom não entende o que significa "confirmar" e não sabe o que acontece após clicar.

**Referência:** ERRO-003 (Crítico) - `docs/audit/HUMAN_TEST_REPORT.md`

**Critério de Pronto:**
- ✅ Renomear ação de "acknowledge" para "VER PEDIDO" ou "ACEITAR PEDIDO"
- ✅ Mensagem explicativa: "Novo pedido da Mesa X - Toque para ver detalhes"
- ✅ Feedback visual após ação: "Pedido aceito ✓"
- ✅ Próximo passo claro: ação seguinte aparece automaticamente
- ✅ Teste: 70% dos garçons entendem ação sem explicação

**Arquivos a Modificar:**
- `mobile-app/services/NowEngine.ts` (linha 621: mudar mensagem)
- `mobile-app/components/NowActionCard.tsx` (renomear botão, adicionar feedback)
- `mobile-app/app/(tabs)/staff.tsx` (adicionar feedback após completeAction)

**Riscos:**
- Mudança de linguagem pode quebrar testes existentes
- Rollback: Reverter para "acknowledge", manter apenas feedback

**Testes Manuais (Simulador):**
1. Criar pedido novo (web ou garçom)
2. Verificar ação no AppStaff: deve dizer "VER PEDIDO" ou "ACEITAR PEDIDO"
3. Verificar mensagem: deve explicar "Novo pedido da Mesa X"
4. Clicar na ação
5. **Esperado:** Feedback "Pedido aceito ✓" aparece
6. **Esperado:** Próxima ação aparece automaticamente (ou "Tudo em ordem")

**KPI Sofia:**
- ≥ 70% de ações "aceitas" sem explicação adicional do gerente
- Tempo médio de ação < 3s

---

### Issue #4: [UX] Confirmação leve no KDS (ERRO-015)

**Título:** `[UX] Confirmação leve no KDS para evitar mudança acidental - ERRO-015`

**Contexto:**
Cozinheiro pode mudar status do pedido por toque acidental, causando confusão operacional.

**Referência:** ERRO-015 (Médio) - `docs/audit/HUMAN_TEST_REPORT.md`

**Critério de Pronto:**
- ✅ Toque duplo (dentro de 500ms) para mudar status
- ✅ OU segurar 400ms para mudar status
- ✅ Feedback visual no primeiro toque (borda piscando ou cor mudando)
- ✅ Teste: 0 mudanças acidentais em 50 tentativas

**Arquivos a Modificar:**
- `mobile-app/app/(tabs)/kitchen.tsx` (linha 105-125: já tem toque duplo, validar)
- `mobile-app/components/kitchen/KitchenOrderCard.tsx` (adicionar feedback visual)
- `mobile-app/app/(tabs)/bar.tsx` (aplicar mesma lógica)

**Riscos:**
- Toque duplo pode ser frustrante se muito rápido
- Rollback: Remover confirmação, manter apenas feedback visual

**Testes Manuais (Simulador):**
1. Abrir KDS (cozinha)
2. Ver pedido em "A FAZER"
3. Toque simples: **Esperado:** Feedback visual (borda piscando), status não muda
4. Toque duplo rápido (< 500ms): **Esperado:** Status muda para "PREPARANDO"
5. Testar 10x: 0 mudanças acidentais

**KPI Sofia:**
- 0 mudanças acidentais de status / semana
- Tempo médio de mudança de status < 1s

---

## 📋 SPRINT 7 DIAS (VALOR PERCEPTÍVEL)

---

### Issue #5: [NOW] Contador de ações pendentes (ERRO-008)

**Título:** `[NOW] Contador de ações pendentes no AppStaff - ERRO-008`

**Contexto:**
Garçom não sabe quantas ações pendentes existem além da ação atual. Isso dificulta priorização e causa ansiedade.

**Referência:** ERRO-008 (Alto) - `docs/audit/HUMAN_TEST_REPORT.md`

**Critério de Pronto:**
- ✅ Contador discreto visível no AppStaff (ex: "3 ações pendentes")
- ✅ Contador atualiza em tempo real
- ✅ Posicionamento: canto superior direito ou abaixo do NowActionCard
- ✅ Cor muda conforme urgência (verde: 1-2, amarelo: 3-5, vermelho: 6+)
- ✅ Teste: Contador sempre sincronizado com ações reais

**Arquivos a Modificar:**
- `mobile-app/services/NowEngine.ts` (linha 963: método `getPendingActionsCount` já existe, validar)
- `mobile-app/hooks/useNowEngine.ts` (expor `pendingCount`)
- `mobile-app/app/(tabs)/staff.tsx` (linha 28: já usa `pendingCount`, validar exibição)
- `mobile-app/components/NowActionCard.tsx` (adicionar contador visual)

**Riscos:**
- Contador pode causar ansiedade se sempre alto
- Rollback: Ocultar contador, manter apenas ação atual

**Testes Manuais (Simulador):**
1. Criar 3 pedidos novos
2. Verificar contador: deve mostrar "3 ações pendentes"
3. Completar 1 ação
4. Verificar contador: deve mostrar "2 ações pendentes"
5. Completar todas as ações
6. Verificar contador: deve desaparecer ou mostrar "0"

**KPI Sofia:**
- Contador sempre sincronizado (0 casos de desincronização / semana)
- Garçons relatam menos ansiedade sobre "o que fazer"

---

### Issue #6: [UX] Banner persistente de modo offline

**Título:** `[UX] Banner persistente de modo offline + status de sync`

**Contexto:**
Usuário não sabe quando está offline ou quando está sincronizando. Isso causa confusão e perda de dados.

**Referência:** FASE 3 - Análise de UX Operacional

**Critério de Pronto:**
- ✅ Banner fixo no topo quando offline (cor vermelha/laranja)
- ✅ Banner mostra "Sincronizando..." quando sync ativo
- ✅ Contador de itens pendentes: "3 pedidos pendentes"
- ✅ Banner desaparece quando online e sincronizado
- ✅ Teste: Banner sempre visível quando offline

**Arquivos a Modificar:**
- `mobile-app/services/OfflineQueueService.ts` (expor estado de sync)
- `mobile-app/hooks/useOfflineSync.ts` (já existe, validar uso)
- `mobile-app/app/_layout.tsx` (adicionar banner global)
- `mobile-app/components/OfflineBanner.tsx` (criar componente)

**Riscos:**
- Banner pode poluir UI se muito grande
- Rollback: Ocultar banner, manter apenas indicador discreto

**Testes Manuais (Simulador):**
1. Desligar WiFi
2. Criar pedido
3. **Esperado:** Banner "Offline - 1 pedido pendente" aparece
4. Ligar WiFi
5. **Esperado:** Banner muda para "Sincronizando..."
6. Após sync: **Esperado:** Banner desaparece

**KPI Sofia:**
- 0 casos de perda de dados por desconhecimento de modo offline
- Usuários sempre sabem quando estão offline

---

### Issue #7: [MAP] Mapa Visual MVP (quase-mapa por zonas)

**Título:** `[MAP] Mapa Visual MVP - Grid por zonas (Bar / Terraço / Salão 1 / Salão 2)`

**Contexto:**
Falta visão espacial do restaurante. Garçom não vê layout, dificultando gestão do salão.

**Referência:** FASE 4 - Auditoria de Conceito, Gap crítico vs Last.app

**Critério de Pronto:**
- ✅ Grid visual com zonas (Bar / Terraço / Salão 1 / Salão 2)
- ✅ Mesas agrupadas por zona
- ✅ Cores de urgência por mesa (verde: OK, amarelo: atenção, vermelho: urgente)
- ✅ Indicadores visuais: "quer pagar" 💰, "esperando bebida" 🍹
- ✅ Timer por mesa visível
- ✅ Teste: Garçom identifica zona da mesa em < 2s

**Arquivos a Modificar:**
- `mobile-app/app/(tabs)/tables.tsx` (refatorar de lista para grid)
- `mobile-app/components/TableCard.tsx` (já existe, adicionar layout de grid)
- `mobile-app/context/OrderContext.tsx` (adicionar agrupamento por zona)
- `mobile-app/services/supabase.ts` (adicionar campo `zone` em `gm_tables` se não existir)

**Riscos:**
- Grid pode ser confuso se muitas mesas
- Rollback: Reverter para lista, manter apenas cores de urgência

**Testes Manuais (Simulador):**
1. Abrir tela "Mesas"
2. **Esperado:** Grid visual com zonas visíveis
3. Verificar cores: mesa ocupada há 30min = vermelho
4. Verificar indicadores: mesa quer pagar = 💰
5. Toque em mesa: **Esperado:** Abre detalhes
6. Testar com 20+ mesas: deve ser navegável

**KPI Sofia:**
- Garçom identifica zona da mesa em < 2s (80% dos casos)
- 0 casos de "não encontrei a mesa" / semana

---

## 📋 SPRINT 30 DIAS (QUASE EMPATE COM LAST.APP)

---

### Issue #8: [UX] Identidade visual operacional (urgência, cores, linguagem)

**Título:** `[UX] Identidade visual operacional - Urgência, cores, linguagem e rituais`

**Contexto:**
Falta coesão visual e conceitual. Sistema não comunica claramente "TPV que pensa".

**Referência:** FASE 4 - Auditoria de Conceito, Decisão Estratégica Obrigatória

**Critério de Pronto:**
- ✅ Paleta de cores consistente (urgência: vermelho, atenção: amarelo, OK: verde)
- ✅ Linguagem unificada ("TPV que pensa" ou "Sistema Operacional")
- ✅ Rituais visuais claros (abertura/fechamento de turno)
- ✅ Feedback visual consistente em todas as ações
- ✅ Teste: Usuário identifica urgência em < 1s

**Arquivos a Modificar:**
- `mobile-app/constants/colors.ts` (criar paleta de urgência)
- `mobile-app/components/NowActionCard.tsx` (aplicar cores de urgência)
- `mobile-app/components/ShiftGate.tsx` (ritual visual de abertura)
- `mobile-app/components/CashManagementModal.tsx` (ritual visual de fechamento)
- `mobile-app/app/(tabs)/tables.tsx` (aplicar cores de urgência)

**Riscos:**
- Mudança visual pode confundir usuários existentes
- Rollback: Reverter cores, manter apenas linguagem

**Testes Manuais (Simulador):**
1. Abrir AppStaff
2. Verificar cores: ação crítica = vermelho, urgente = amarelo, atenção = azul
3. Verificar linguagem: todas as ações usam linguagem clara
4. Verificar rituais: abertura/fechamento têm checklist visual
5. Teste de urgência: identificar ação mais urgente em < 1s

**KPI Sofia:**
- Usuário identifica urgência em < 1s (90% dos casos)
- Linguagem unificada em 100% das telas

---

### Issue #9: [NOW] Explicação do "porquê" nas ações do Now Engine

**Título:** `[NOW] Adicionar explicação do "porquê" nas ações do Now Engine`

**Contexto:**
Ações do Now Engine não explicam o motivo. Garçom não entende por que a ação foi sugerida.

**Referência:** FASE 5 - Onde ChefIApp pode ser imbatível, FASE 3 - Análise de UX

**Critério de Pronto:**
- ✅ 1 linha explicando o motivo da ação (ex: "Item pronto há 3+ min")
- ✅ Explicação visível abaixo do título da ação
- ✅ Linguagem clara e específica (não genérica)
- ✅ Teste: 80% dos garçons entendem o motivo sem explicação adicional

**Arquivos a Modificar:**
- `mobile-app/services/NowEngine.ts` (linha 352-632: adicionar campo `reason` em `NowAction`)
- `mobile-app/components/NowActionCard.tsx` (exibir `reason` abaixo do título)
- `mobile-app/hooks/useNowEngine.ts` (garantir que `reason` é exposto)

**Riscos:**
- Explicação pode ser muito longa e poluir UI
- Rollback: Ocultar explicação, manter apenas título

**Testes Manuais (Simulador):**
1. Criar pedido e marcar como pronto
2. Aguardar 3+ minutos
3. Verificar ação no AppStaff
4. **Esperado:** Título "Mesa 5" + Explicação "Item pronto há 3+ min"
5. Testar com diferentes ações: todas devem ter explicação clara

**KPI Sofia:**
- ≥ 80% de ações com explicação clara
- Garçons entendem motivo em < 2s (70% dos casos)

---

### Issue #10: [UX] Ritual de turno com checklist visual

**Título:** `[UX] Ritual de turno - Checklist visual de abertura/fechamento`

**Contexto:**
Ritual de abertura/fechamento não é claro. Falta checklist visual e confirmação.

**Referência:** FASE 4 - Auditoria de Conceito, FASE 1 - Módulo 1

**Critério de Pronto:**
- ✅ Checklist visual de abertura (caixa inicial, avisos lidos, turno ativo)
- ✅ Checklist visual de fechamento (ações pendentes, caixa final, confirmação)
- ✅ Validações automáticas (não pode fechar com ações críticas pendentes)
- ✅ Confirmação visual de turno ativo
- ✅ Teste: 100% dos turnos com checklist completo

**Arquivos a Modificar:**
- `mobile-app/components/ShiftGate.tsx` (adicionar checklist visual)
- `mobile-app/components/CashManagementModal.tsx` (adicionar checklist de fechamento)
- `mobile-app/context/AppStaffContext.tsx` (adicionar validações)

**Riscos:**
- Checklist pode ser muito longo e frustrante
- Rollback: Simplificar checklist, manter apenas validações críticas

**Testes Manuais (Simulador):**
1. Abrir AppStaff (turno fechado)
2. Clicar "Iniciar Turno"
3. **Esperado:** Checklist aparece:
   - [ ] Ler avisos pendentes
   - [ ] Definir caixa inicial
   - [ ] Confirmar turno ativo
4. Completar checklist
5. **Esperado:** Turno inicia, confirmação visual aparece
6. Fechar turno: **Esperado:** Checklist de fechamento aparece

**KPI Sofia:**
- 100% dos turnos com checklist completo
- 0 casos de erro de abertura/fechamento / semana

---

## 📊 RESUMO DAS ISSUES

| # | Título | Sprint | Prioridade | Tempo Estimado |
|---|--------|--------|------------|----------------|
| 1 | Pagamento duplo | 48h | 🔴 Crítica | 2h |
| 2 | Badge origem pedido | 48h | 🔴 Crítica | 4h |
| 3 | Clarificar acknowledge | 48h | 🔴 Crítica | 3h |
| 4 | Confirmação KDS | 48h | 🟡 Alta | 2h |
| 5 | Contador ações | 7 dias | 🟡 Alta | 4h |
| 6 | Banner offline | 7 dias | 🟡 Alta | 3h |
| 7 | Mapa Visual MVP | 7 dias | 🟡 Alta | 16h |
| 8 | Identidade visual | 30 dias | 🟢 Média | 8h |
| 9 | Now Engine "porquê" | 30 dias | 🟢 Média | 6h |
| 10 | Ritual de turno | 30 dias | 🟢 Média | 8h |

**Total estimado:** 56 horas (7 dias úteis)

---

## ✅ CHECKLIST DE QA (SIMULADOR)

Para cada issue, validar:

- [ ] Funcionalidade funciona conforme critério de pronto
- [ ] Testes manuais passam
- [ ] KPI Sofia é mensurável
- [ ] Rollback é possível
- [ ] Não quebra funcionalidades existentes
- [ ] Performance não degrada
- [ ] Acessibilidade mantida (cores, tamanhos)

---

## 📈 MÉTRICAS DE SUCESSO (SOFIA)

**Meta em 30 dias:** ChefIApp de 6.5 → 8.0

**KPIs principais:**
- Pagamento: 0 casos de pagamento duplo / semana
- Origem: 100% dos pedidos com badge visível
- Now Engine: ≥ 70% de ações aceitas sem explicação
- KDS: 0 mudanças acidentais / semana
- Mapa: Garçom identifica zona em < 2s (80% dos casos)
- Ritual: 100% dos turnos com checklist completo

---

**Fim do Plano de Guerra**
