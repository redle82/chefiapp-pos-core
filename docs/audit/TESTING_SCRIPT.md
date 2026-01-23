# 🎬 Script de Testes - PLANO DE GUERRA

**Data:** 2026-01-30  
**Duração Estimada:** 2-3 horas  
**Ambiente:** Simulador + Restaurante Sofia

---

## 🎯 CENÁRIO 1: Pagamento Seguro

**Objetivo:** Validar proteção contra pagamento duplo

**Passos:**
1. Abrir app mobile
2. Navegar para tela de pedidos
3. Selecionar pedido existente (valor: €50)
4. Clicar em "Pagar" rapidamente 2x (duplo clique)
5. **Esperado:** Apenas 1 pagamento processado, feedback visual durante processamento

**Validação:**
- [ ] Apenas 1 pagamento foi processado
- [ ] Feedback visual apareceu durante processamento
- [ ] Confirmação apareceu para valores > €100 (testar com €150)

**Tempo:** 5 minutos

---

## 🎯 CENÁRIO 2: Origem do Pedido

**Objetivo:** Validar badges de origem em todos os pontos

**Passos:**
1. Criar pedido via WEB (cliente)
2. Criar pedido via GARÇOM (mobile app)
3. Criar pedido via CAIXA (TPV)
4. Verificar badges em:
   - Tela de pedidos (`orders.tsx`)
   - Card do Now Engine (`NowActionCard`)
   - Ticket do KDS (`KDSTicket`)

**Validação:**
- [ ] Badge WEB visível (azul)
- [ ] Badge GARÇOM visível (verde)
- [ ] Badge CAIXA visível (roxo)
- [ ] Cores distintas e consistentes

**Tempo:** 10 minutos

---

## 🎯 CENÁRIO 3: Ação "Acknowledge"

**Objetivo:** Validar clareza da ação

**Passos:**
1. Criar novo pedido (qualquer origem)
2. Verificar mensagem do Now Engine:
   - "Novo pedido [origem] recebido. Toque para ver detalhes e confirmar recebimento."
3. Clicar em "acknowledge"
4. Verificar feedback haptic
5. Verificar próxima ação automática

**Validação:**
- [ ] Mensagem clara e específica
- [ ] Feedback haptic funciona
- [ ] Próxima ação aparece automaticamente

**Tempo:** 5 minutos

---

## 🎯 CENÁRIO 4: KDS Seguro

**Objetivo:** Validar proteção contra mudanças acidentais

**Passos:**
1. Abrir tela de cozinha (`kitchen.tsx`)
2. Ver pedido pendente
3. **Toque único:**
   - Verificar borda piscando (azul)
   - Verificar texto "TOQUE NOVAMENTE PARA CONFIRMAR"
4. **Toque duplo (dentro de 500ms):**
   - Verificar mudança de status
   - Verificar feedback haptic
5. **Toque único + espera > 500ms:**
   - Verificar que não muda status

**Validação:**
- [ ] Feedback visual no primeiro toque
- [ ] Toque duplo funciona corretamente
- [ ] Toque único não muda status

**Tempo:** 10 minutos

---

## 🎯 CENÁRIO 5: Contador de Ações

**Objetivo:** Validar visibilidade e atualização

**Passos:**
1. Criar múltiplas ações pendentes (5+):
   - Pagamentos pendentes
   - Pedidos prontos
   - Mesas aguardando
2. Verificar contador no `NowActionCard`:
   - Contador visível quando > 0
   - Cores por urgência (normal/crítico/muitas)
3. Completar ações e verificar contador diminui
4. Verificar contador desaparece quando = 0

**Validação:**
- [ ] Contador sempre visível quando há ações
- [ ] Atualização a cada 10s
- [ ] Cores indicam urgência corretamente

**Tempo:** 15 minutos

---

## 🎯 CENÁRIO 6: Banner Offline

**Objetivo:** Validar feedback de status offline

**Passos:**
1. **Desligar WiFi/dados móveis**
2. Verificar banner aparece no topo:
   - Cor laranja (#ff9500)
   - Texto "Offline"
   - Contador de itens pendentes
3. Criar ação offline (pedido, pagamento)
4. Verificar contador aumenta
5. **Ligar WiFi/dados móveis**
6. Verificar banner muda para "Sincronizando..." (azul)
7. Verificar banner desaparece quando sincronizado

**Validação:**
- [ ] Banner sempre visível quando offline
- [ ] Contador de itens pendentes correto
- [ ] Estados visuais distintos (offline/sincronizando/online)

**Tempo:** 10 minutos

---

## 🎯 CENÁRIO 7: Mapa Visual

**Objetivo:** Validar mapa visual por zonas

**Passos:**
1. Abrir tela de mesas (`tables.tsx`)
2. Verificar grid por zonas:
   - Salão 1 (mesas 1-4)
   - Bar (mesas 5-8)
   - Terraço (mesas 9-12)
   - Salão 2 (mesas 13+)
3. Verificar cores de urgência:
   - Normal (verde) - < 10 min
   - Warning (amarelo) - 10-20 min
   - Critical (vermelho) - > 20 min
4. Criar pedido em mesa específica
5. Verificar atualização em tempo real
6. Medir tempo de identificação de zona (< 2s)

**Validação:**
- [ ] Grid por zonas funcional
- [ ] Cores de urgência corretas
- [ ] Identificação de zona em < 2s (80% dos casos)
- [ ] Atualização em tempo real funciona

**Tempo:** 20 minutos

---

## 🎯 CENÁRIO 8: Identidade Visual

**Objetivo:** Validar consistência visual

**Passos:**
1. Verificar cores em todos os componentes:
   - Critical: #ff3b30
   - Warning: #ffd60a
   - Normal: #32d74b
   - Info: #0a84ff
2. Verificar aplicação em:
   - `NowActionCard`
   - `TableCard`
   - `OrderCard`
3. Medir tempo de identificação de urgência (< 1s)

**Validação:**
- [ ] Cores consistentes em 100% dos componentes
- [ ] Identificação de urgência em < 1s (90% dos casos)

**Tempo:** 15 minutos

---

## 🎯 CENÁRIO 9: Explicação do "Porquê"

**Objetivo:** Validar explicações nas ações

**Passos:**
1. Criar diferentes tipos de ações:
   - Pagamento pendente (há X minutos)
   - Pedido pronto (aguardando retirada)
   - Mesa aguardando (há X minutos)
   - Ação crítica (prioridade máxima)
2. Verificar campo `reason` em cada ação:
   - Explicação clara e específica
   - Linguagem operacional
   - Contexto relevante
3. Verificar exibição no `NowActionCard`
4. Contar % de ações com `reason` (≥ 80%)

**Validação:**
- [ ] ≥ 80% das ações com explicação
- [ ] Explicações claras e específicas
- [ ] Linguagem operacional

**Tempo:** 20 minutos

---

## 🎯 CENÁRIO 10: Ritual de Turno

**Objetivo:** Validar checklist de abertura/fechamento

### Abertura
**Passos:**
1. Abrir `ShiftGate`
2. Verificar checklist:
   - "Ler avisos pendentes"
   - "Definir caixa inicial"
   - "Confirmar turno ativo"
3. Verificar botão "Iniciar Turno" desabilitado
4. Marcar todos os itens
5. Verificar botão habilitado
6. Iniciar turno

**Validação:**
- [ ] Checklist obrigatório
- [ ] Botão desabilitado até checklist completo
- [ ] Validações automáticas funcionam

### Fechamento
**Passos:**
1. Abrir `CashManagementModal`
2. Verificar checklist:
   - "Verificar ações pendentes"
   - "Contar dinheiro físico"
   - "Confirmar fechamento"
3. Verificar botão "Encerrar Turno" desabilitado
4. Marcar todos os itens
5. Verificar botão habilitado
6. Encerrar turno

**Validação:**
- [ ] Checklist obrigatório
- [ ] Botão desabilitado até checklist completo
- [ ] Validações automáticas funcionam

**Tempo:** 15 minutos

---

## 📊 COLETA DE MÉTRICAS

### Durante os Testes
- [ ] Anotar tempo de identificação de zona (mapa)
- [ ] Anotar tempo de identificação de urgência
- [ ] Contar ações aceitas sem explicação adicional
- [ ] Contar mudanças acidentais no KDS (deve ser 0)
- [ ] Contar pagamentos duplos (deve ser 0)

### Após os Testes
- [ ] Preencher `VALIDATION_CHECKLIST.md`
- [ ] Documentar resultados em `VALIDATION_RESULTS.md`
- [ ] Identificar ajustes necessários

---

## ✅ CRITÉRIOS DE SUCESSO

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

---

## 🚨 PROBLEMAS CONHECIDOS

Se encontrar problemas:

1. **Documentar:**
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

**Tempo Total Estimado:** 2-3 horas  
**Status:** ✅ Pronto para Execução  
**Data:** 2026-01-30
