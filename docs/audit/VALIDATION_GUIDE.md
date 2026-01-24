# 🧪 Guia de Validação - PLANO DE GUERRA

**Data:** 2026-01-30  
**Status:** ✅ Pronto para Validação  
**Local:** Restaurante Sofia

---

## 🎯 OBJETIVO

Validar todas as melhorias implementadas no PLANO DE GUERRA em ambiente real, coletando feedback e métricas para ajustes finais.

---

## ⏱️ TEMPO ESTIMADO

- **Testes no Simulador:** 2-3 horas
- **Validação no Sofia (1 turno):** 4-6 horas
- **Coleta de Feedback:** 30 minutos
- **Total:** ~1 dia

---

## 📋 CHECKLIST PRÉ-VALIDAÇÃO

### Antes de Começar
- [ ] App instalado e atualizado no dispositivo
- [ ] Conta de teste configurada
- [ ] Restaurante Sofia configurado no sistema
- [ ] Mesas cadastradas (mínimo 4 zonas)
- [ ] Produtos cadastrados
- [ ] Impressora configurada (se aplicável)
- [ ] Conexão com internet estável

### Ambiente
- [ ] Dispositivo com bateria carregada
- [ ] Backup de dados realizado
- [ ] Equipe informada sobre os testes
- [ ] Horário de baixo movimento (se possível)

---

## 🧪 TESTES POR ISSUE

### Issue #1: Pagamento Duplo (ERRO-004)

**Objetivo:** Validar proteção contra pagamento duplo

**Testes:**
1. [ ] Criar pedido de teste (valor: €50)
2. [ ] Tentar pagar rapidamente 2x (duplo clique)
3. [ ] Verificar que apenas 1 pagamento foi processado
4. [ ] Verificar confirmação para valores > €100
5. [ ] Verificar feedback visual durante processamento

**Critério de Sucesso:**
- ✅ 0 casos de pagamento duplo
- ✅ Confirmação aparece para valores > €100
- ✅ Feedback visual claro

**KPI Sofia:**
- 0 pagamentos duplos / semana

---

### Issue #2: Badge de Origem (ERRO-002)

**Objetivo:** Validar visibilidade da origem do pedido

**Testes:**
1. [ ] Criar pedido via WEB (cliente)
2. [ ] Criar pedido via GARÇOM (mobile)
3. [ ] Criar pedido via CAIXA (TPV)
4. [ ] Verificar badge em cada pedido:
   - [ ] Badge visível em `orders.tsx`
   - [ ] Badge visível em `NowActionCard`
   - [ ] Badge visível em `KDSTicket`
5. [ ] Verificar cores distintas por origem

**Critério de Sucesso:**
- ✅ 100% dos pedidos com badge visível
- ✅ Cores distintas por origem
- ✅ Identificação em < 2 segundos

**KPI Sofia:**
- 100% dos pedidos com badge visível

---

### Issue #3: Clarificar Acknowledge (ERRO-003)

**Objetivo:** Validar clareza da ação "acknowledge"

**Testes:**
1. [ ] Receber novo pedido (WEB/GARÇOM/CAIXA)
2. [ ] Verificar mensagem do Now Engine:
   - [ ] Mensagem clara e específica
   - [ ] Explicação do que acontece ao clicar
3. [ ] Clicar em "acknowledge"
4. [ ] Verificar feedback haptic
5. [ ] Verificar próxima ação automática

**Critério de Sucesso:**
- ✅ Mensagem clara em 100% dos casos
- ✅ ≥ 70% de ações aceitas sem explicação adicional
- ✅ Feedback haptic funciona

**KPI Sofia:**
- ≥ 70% de ações aceitas sem explicação

---

### Issue #4: Confirmação KDS (ERRO-015)

**Objetivo:** Validar proteção contra mudanças acidentais

**Testes:**
1. [ ] Abrir tela de cozinha/bar
2. [ ] Ver pedido pendente
3. [ ] Toque único: verificar feedback visual (borda piscando)
4. [ ] Verificar texto "TOQUE NOVAMENTE PARA CONFIRMAR"
5. [ ] Toque duplo (dentro de 500ms): verificar mudança de status
6. [ ] Toque único + espera > 500ms: verificar que não muda status

**Critério de Sucesso:**
- ✅ 0 mudanças acidentais
- ✅ Feedback visual claro no primeiro toque
- ✅ Toque duplo funciona corretamente

**KPI Sofia:**
- 0 mudanças acidentais / semana

---

### Issue #5: Contador de Ações (ERRO-008)

**Objetivo:** Validar visibilidade do contador

**Testes:**
1. [ ] Criar múltiplas ações pendentes (5+)
2. [ ] Verificar contador no `NowActionCard`:
   - [ ] Contador visível quando > 0
   - [ ] Atualização a cada 10s
   - [ ] Cores por urgência (normal/crítico/muitas)
3. [ ] Completar ações e verificar contador diminui
4. [ ] Verificar contador desaparece quando = 0

**Critério de Sucesso:**
- ✅ Contador sempre visível quando há ações
- ✅ Atualização em tempo real
- ✅ Cores indicam urgência

**KPI Sofia:**
- Contador visível em 100% dos casos

---

### Issue #6: Banner Offline

**Objetivo:** Validar feedback de status offline

**Testes:**
1. [ ] Desligar WiFi/dados móveis
2. [ ] Verificar banner aparece no topo:
   - [ ] Cor laranja (#ff9500)
   - [ ] Texto "Offline"
   - [ ] Contador de itens pendentes
3. [ ] Criar ação offline (pedido, pagamento)
4. [ ] Verificar contador aumenta
5. [ ] Ligar WiFi/dados móveis
6. [ ] Verificar banner muda para "Sincronizando..."
7. [ ] Verificar banner desaparece quando sincronizado

**Critério de Sucesso:**
- ✅ Banner sempre visível quando offline
- ✅ Contador de itens pendentes correto
- ✅ Estados visuais distintos

**KPI Sofia:**
- Banner visível em 100% dos casos offline

---

### Issue #7: Mapa Visual MVP

**Objetivo:** Validar mapa visual por zonas

**Testes:**
1. [ ] Abrir tela de mesas
2. [ ] Verificar grid por zonas:
   - [ ] Salão 1 (mesas 1-4)
   - [ ] Bar (mesas 5-8)
   - [ ] Terraço (mesas 9-12)
   - [ ] Salão 2 (mesas 13+)
3. [ ] Verificar cores de urgência:
   - [ ] Normal (verde) - < 10 min
   - [ ] Warning (amarelo) - 10-20 min
   - [ ] Critical (vermelho) - > 20 min
4. [ ] Criar pedido em mesa específica
5. [ ] Verificar atualização em tempo real
6. [ ] Verificar identificação de zona em < 2s

**Critério de Sucesso:**
- ✅ Grid por zonas funcional
- ✅ Cores de urgência corretas
- ✅ Identificação de zona em < 2s (80% dos casos)

**KPI Sofia:**
- Identificação de zona em < 2s (80% dos casos)

---

### Issue #8: Identidade Visual

**Objetivo:** Validar consistência visual

**Testes:**
1. [ ] Verificar cores em todos os componentes:
   - [ ] Critical: #ff3b30
   - [ ] Warning: #ffd60a
   - [ ] Normal: #32d74b
   - [ ] Info: #0a84ff
2. [ ] Verificar aplicação em:
   - [ ] `NowActionCard`
   - [ ] `TableCard`
   - [ ] `OrderCard`
3. [ ] Verificar identificação de urgência em < 1s

**Critério de Sucesso:**
- ✅ Cores consistentes em 100% dos componentes
- ✅ Identificação de urgência em < 1s (90% dos casos)

**KPI Sofia:**
- Identificação de urgência em < 1s (90% dos casos)

---

### Issue #9: Explicação do "Porquê" (ERRO-009)

**Objetivo:** Validar explicações nas ações

**Testes:**
1. [ ] Criar diferentes tipos de ações:
   - [ ] Pagamento pendente
   - [ ] Pedido pronto
   - [ ] Mesa aguardando
   - [ ] Ação crítica
2. [ ] Verificar campo `reason` em cada ação:
   - [ ] Explicação clara e específica
   - [ ] Linguagem operacional
   - [ ] Contexto relevante
3. [ ] Verificar exibição no `NowActionCard`
4. [ ] Verificar ≥ 80% das ações com `reason`

**Critério de Sucesso:**
- ✅ ≥ 80% das ações com explicação
- ✅ Explicações claras e específicas
- ✅ Linguagem operacional

**KPI Sofia:**
- ≥ 80% das ações com explicação

---

### Issue #10: Ritual de Turno

**Objetivo:** Validar checklist de abertura/fechamento

**Testes de Abertura:**
1. [ ] Abrir `ShiftGate`
2. [ ] Verificar checklist:
   - [ ] "Ler avisos pendentes"
   - [ ] "Definir caixa inicial"
   - [ ] "Confirmar turno ativo"
3. [ ] Verificar botão "Iniciar Turno" desabilitado
4. [ ] Marcar todos os itens
5. [ ] Verificar botão habilitado
6. [ ] Iniciar turno

**Testes de Fechamento:**
1. [ ] Abrir `CashManagementModal`
2. [ ] Verificar checklist:
   - [ ] "Verificar ações pendentes"
   - [ ] "Contar dinheiro físico"
   - [ ] "Confirmar fechamento"
3. [ ] Verificar botão "Encerrar Turno" desabilitado
4. [ ] Marcar todos os itens
5. [ ] Verificar botão habilitado
6. [ ] Encerrar turno

**Critério de Sucesso:**
- ✅ Checklist obrigatório em 100% dos turnos
- ✅ Botão desabilitado até checklist completo
- ✅ Validações automáticas funcionam

**KPI Sofia:**
- 100% dos turnos com checklist completo

---

## 📊 COLETA DE MÉTRICAS

### Durante o Turno
- [ ] Anotar tempo de identificação de zona (mapa)
- [ ] Anotar tempo de identificação de urgência
- [ ] Contar ações aceitas sem explicação adicional
- [ ] Contar mudanças acidentais no KDS
- [ ] Contar pagamentos duplos (deve ser 0)

### Após o Turno
- [ ] Coletar feedback dos garçons:
  - [ ] O que funcionou bem?
  - [ ] O que foi confuso?
  - [ ] O que falta?
- [ ] Coletar feedback do gerente:
  - [ ] Sistema mais claro?
  - [ ] Menos erros?
  - [ ] Mais eficiência?

---

## 🎯 CRITÉRIOS DE SUCESSO GLOBAL

### Técnico
- ✅ 0 pagamentos duplos
- ✅ 0 mudanças acidentais no KDS
- ✅ 100% dos pedidos com badge visível
- ✅ Banner offline funcional

### Operacional
- ✅ Identificação de zona em < 2s (80% dos casos)
- ✅ Identificação de urgência em < 1s (90% dos casos)
- ✅ ≥ 70% de ações aceitas sem explicação
- ✅ 100% dos turnos com checklist completo

### Estratégico
- ✅ Sistema mais claro e eficiente
- ✅ Menos erros operacionais
- ✅ Feedback positivo da equipe

---

## 📝 TEMPLATE DE RELATÓRIO

### Resultados do Turno
- **Data:** [DATA]
- **Duração:** [TEMPO]
- **Pedidos processados:** [NÚMERO]
- **Pagamentos:** [NÚMERO]
- **Erros:** [NÚMERO] (detalhar)

### Métricas
- **Tempo médio identificação zona:** [TEMPO]
- **Tempo médio identificação urgência:** [TEMPO]
- **Ações aceitas sem explicação:** [%]
- **Mudanças acidentais KDS:** [NÚMERO]
- **Pagamentos duplos:** [NÚMERO]

### Feedback
- **O que funcionou bem:**
  - [ITEM 1]
  - [ITEM 2]
- **O que foi confuso:**
  - [ITEM 1]
  - [ITEM 2]
- **O que falta:**
  - [ITEM 1]
  - [ITEM 2]

### Próximos Passos
- [ ] Ajustar [ITEM 1]
- [ ] Melhorar [ITEM 2]
- [ ] Adicionar [ITEM 3]

---

## 🚨 PROBLEMAS CONHECIDOS

Se encontrar problemas durante a validação:

1. **Documentar imediatamente:**
   - Screenshot (se possível)
   - Passos para reproduzir
   - Comportamento esperado vs. real

2. **Priorizar:**
   - 🔴 Crítico: Bloqueia operação
   - 🟡 Alto: Impacta significativamente
   - 🟢 Médio: Impacta levemente

3. **Reportar:**
   - Criar issue no GitHub
   - Adicionar label `[VALIDATION]`
   - Referenciar issue original

---

## ✅ CONCLUSÃO

Após completar todos os testes:

1. [ ] Revisar todas as métricas coletadas
2. [ ] Comparar com KPIs definidos
3. [ ] Identificar ajustes necessários
4. [ ] Criar plano de ajustes
5. [ ] Documentar resultados em `VALIDATION_RESULTS.md`

---

**Status:** ✅ Pronto para Validação  
**Data:** 2026-01-30  
**Próximo Passo:** Executar testes no simulador
