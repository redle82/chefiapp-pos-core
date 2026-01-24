# ✅ Checklist de Go-Live - Primeiro Restaurante

**Versão:** 1.0  
**Data:** 2026-01-24  
**Restaurante:** Sofia Gastrobar  
**Status:** 🔴 **PRÉ-GO-LIVE**

---

## 🎯 OBJETIVO

Validar que o sistema está pronto para operação real em produção com o primeiro restaurante. Este checklist deve ser executado **ANTES** de marcar o sistema como "Go-Live Controlado".

---

## 📋 CHECKLIST COMPLETO

### 1. VALIDAÇÕES TÉCNICAS

#### 1.1 Infraestrutura e Deploy
- [ ] **App mobile publicado** (Expo EAS)
  - [ ] Versão de produção no EAS
  - [ ] Build testado em dispositivo físico
  - [ ] Notificações push funcionando
  - [ ] Deep links funcionando
  - [ ] Versão documentada: `v________`

- [ ] **Merchant Portal deployado**
  - [ ] Deploy em produção (Vercel/Netlify)
  - [ ] Domínio configurado e SSL válido
  - [ ] Variáveis de ambiente configuradas
  - [ ] Teste de acesso público funcionando

- [ ] **Supabase configurado**
  - [ ] Projeto em produção
  - [ ] Database migrations aplicadas
  - [ ] RLS policies ativas (se aplicável)
  - [ ] Edge Functions deployadas
  - [ ] Storage buckets configurados
  - [ ] Backup automático configurado

#### 1.2 Monitoramento e Observabilidade
- [ ] **Sentry configurado e funcionando**
  - [ ] DSN configurado em produção
  - [ ] Error tracking ativo
  - [ ] Breadcrumbs funcionando
  - [ ] Release tracking configurado
  - [ ] Teste: forçar erro e validar captura

- [ ] **Health checks funcionando**
  - [ ] Endpoint `/health-check` respondendo
  - [ ] Monitoramento externo configurado (UptimeRobot)
  - [ ] Alertas configurados e testados
  - [ ] Dashboard de status acessível

- [ ] **Logs acessíveis**
  - [ ] Logs do Supabase acessíveis
  - [ ] Logs do app acessíveis (Sentry)
  - [ ] Processo de acesso documentado
  - [ ] Equipe sabe acessar logs

#### 1.3 Performance
- [ ] **Queries otimizadas**
  - [ ] Queries críticas com p95 < 500ms
  - [ ] Índices criados em colunas críticas
  - [ ] EXPLAIN ANALYZE executado em queries principais
  - [ ] N+1 queries eliminadas

- [ ] **App responsivo**
  - [ ] Tempo de carregamento inicial < 3s
  - [ ] Navegação fluida (60 FPS)
  - [ ] Offline mode funcionando
  - [ ] Sincronização offline testada

---

### 2. VALIDAÇÕES OPERACIONAIS

#### 2.1 Processos Críticos
- [ ] **Rollback testado**
  - [ ] Script de rollback de migration testado
  - [ ] Processo de rollback de app documentado
  - [ ] Equipe sabe executar rollback em < 15 min
  - [ ] Teste de rollback em staging validado

- [ ] **Backup e Recovery**
  - [ ] Backup automático configurado
  - [ ] Processo de restore testado
  - [ ] RTO (Recovery Time Objective) definido: `____ horas`
  - [ ] RPO (Recovery Point Objective) definido: `____ horas`

- [ ] **Suporte básico**
  - [ ] Canal de suporte definido (email/Slack/WhatsApp)
  - [ ] Processo de escalação documentado
  - [ ] Equipe de suporte treinada
  - [ ] SLA básico definido: `____ horas de resposta`

#### 2.2 Dados e Configuração
- [ ] **Restaurante configurado**
  - [ ] Dados do restaurante cadastrados
  - [ ] Menu completo cadastrado
  - [ ] Mesas configuradas
  - [ ] Usuários criados e roles atribuídos
  - [ ] Turnos configurados

- [ ] **Integrações funcionando**
  - [ ] Impressoras configuradas (se aplicável)
  - [ ] Pagamentos configurados (se aplicável)
  - [ ] Notificações push testadas
  - [ ] Webhooks funcionando (se aplicável)

---

### 3. VALIDAÇÕES DE SEGURANÇA

#### 3.1 Autenticação e Autorização
- [ ] **Autenticação funcionando**
  - [ ] Login/logout funcionando
  - [ ] Recuperação de senha funcionando
  - [ ] Sessões expiram corretamente
  - [ ] Tokens JWT válidos

- [ ] **Autorização funcionando**
  - [ ] Roles funcionando (owner, manager, waiter, kitchen)
  - [ ] Permissões por role validadas
  - [ ] Acesso negado para usuários não autorizados
  - [ ] RLS policies ativas (se aplicável)

#### 3.2 Dados Sensíveis
- [ ] **Secrets protegidos**
  - [ ] Variáveis de ambiente não expostas
  - [ ] API keys em variáveis de ambiente
  - [ ] Secrets não commitados no código
  - [ ] Rotação de secrets planejada

- [ ] **Dados pessoais**
  - [ ] LGPD/GDPR compliance básico
  - [ ] Dados sensíveis criptografados
  - [ ] Política de privacidade disponível
  - [ ] Consentimento coletado (se aplicável)

---

### 4. VALIDAÇÕES DE UX

#### 4.1 Fluxos Críticos
- [ ] **Fluxo de pedidos**
  - [ ] Cliente cria pedido via web
  - [ ] Garçom recebe notificação
  - [ ] Cozinha recebe pedido no KDS
  - [ ] Status atualiza em tempo real
  - [ ] Cliente vê status do pedido

- [ ] **Fluxo de pagamento**
  - [ ] Pagamento processado corretamente
  - [ ] Confirmação visual clara
  - [ ] Recibo gerado (se aplicável)
  - [ ] Erros tratados graciosamente

- [ ] **Fluxo de cozinha**
  - [ ] Pedidos aparecem no KDS
  - [ ] Status atualiza corretamente
  - [ ] Notificações funcionando
  - [ ] Tempo de preparo rastreado

#### 4.2 Human Experience Score
- [ ] **Score coletado**
  - [ ] Métricas de UX coletadas
  - [ ] Human Experience Score ≥ 8.0
  - [ ] Feedback de usuários coletado
  - [ ] Erros críticos de UX corrigidos

- [ ] **Feedback validado**
  - [ ] Teste com usuários reais realizado
  - [ ] Feedback positivo dos usuários
  - [ ] Fricções identificadas e documentadas
  - [ ] Plano de correção para fricções

---

### 5. VALIDAÇÕES DE DOCUMENTAÇÃO

#### 5.1 Documentação Técnica
- [ ] **Documentação operacional**
  - [ ] Processo de rollback documentado
  - [ ] Processo de monitoramento documentado
  - [ ] Processo de suporte documentado
  - [ ] Troubleshooting básico documentado

- [ ] **Documentação de arquitetura**
  - [ ] Arquitetura documentada
  - [ ] Decisões arquiteturais documentadas (ADRs)
  - [ ] Diagramas atualizados
  - [ ] Onboarding técnico documentado

#### 5.2 Documentação de Usuário
- [ ] **Guias de usuário**
  - [ ] Guia básico para garçons
  - [ ] Guia básico para cozinha
  - [ ] Guia básico para gerentes
  - [ ] FAQ básico

- [ ] **Treinamento**
  - [ ] Equipe treinada no sistema
  - [ ] Sessão de treinamento realizada
  - [ ] Dúvidas respondidas
  - [ ] Contato de suporte disponível

---

### 6. VALIDAÇÕES DE TESTE

#### 6.1 Testes Funcionais
- [ ] **Testes end-to-end**
  - [ ] Fluxo completo de pedido testado
  - [ ] Fluxo de pagamento testado
  - [ ] Fluxo de cozinha testado
  - [ ] Fluxo de gestão testado

- [ ] **Testes de regressão**
  - [ ] Funcionalidades críticas testadas
  - [ ] Bugs conhecidos corrigidos
  - [ ] Testes automatizados passando (se houver)

#### 6.2 Testes de Carga
- [ ] **Carga básica testada**
  - [ ] Sistema suporta carga esperada
  - [ ] Performance estável sob carga
  - [ ] Degradação graciosa identificada
  - [ ] Limites conhecidos documentados

---

### 7. VALIDAÇÕES DE NEGÓCIO

#### 7.1 Contratos e Acordos
- [ ] **SLA definido**
  - [ ] SLA básico definido com restaurante
  - [ ] Uptime esperado: `____%`
  - [ ] Tempo de resposta esperado: `____ horas`
  - [ ] Processo de escalação definido

- [ ] **Expectativas alinhadas**
  - [ ] Funcionalidades acordadas documentadas
  - [ ] Limitações conhecidas comunicadas
  - [ ] Roadmap futuro alinhado
  - [ ] Feedback loop estabelecido

#### 7.2 Go-Live Preparado
- [ ] **Data de Go-Live definida**
  - [ ] Data: `____/____/____`
  - [ ] Horário: `____:____`
  - [ ] Equipe de suporte disponível
  - [ ] Plano de comunicação definido

- [ ] **Comunicação**
  - [ ] Restaurante informado sobre Go-Live
  - [ ] Equipe técnica em standby
  - [ ] Canal de comunicação estabelecido
  - [ ] Plano de rollback comunicado

---

## 🚨 CRITÉRIOS DE BLOQUEIO

**NÃO fazer Go-Live se:**
- ❌ Rollback não testado
- ❌ Monitoramento não funcionando
- ❌ Erros críticos não corrigidos
- ❌ Backup não configurado
- ❌ Equipe não treinada
- ❌ Human Experience Score < 7.0

---

## ✅ CRITÉRIOS DE APROVAÇÃO

**Go-Live aprovado quando:**
- ✅ Todas as validações técnicas concluídas
- ✅ Todas as validações operacionais concluídas
- ✅ Todas as validações de segurança concluídas
- ✅ Human Experience Score ≥ 8.0
- ✅ Rollback testado e documentado
- ✅ Equipe treinada e suporte disponível
- ✅ Documentação completa

---

## 📝 ASSINATURAS

### Aprovação Técnica
- [ ] **Dev Lead:** _________________ Data: `____/____/____`
- [ ] **Dev:** _________________ Data: `____/____/____`

### Aprovação Operacional
- [ ] **Owner/Product:** _________________ Data: `____/____/____`
- [ ] **Manager:** _________________ Data: `____/____/____`

### Aprovação do Cliente
- [ ] **Restaurante (Sofia):** _________________ Data: `____/____/____`

---

## 🎯 PÓS-GO-LIVE

### Primeiras 24 Horas
- [ ] Monitoramento ativo (check a cada 2 horas)
- [ ] Equipe de suporte em standby
- [ ] Feedback coletado
- [ ] Incidentes documentados

### Primeira Semana
- [ ] Revisão diária de métricas
- [ ] Feedback de usuários coletado
- [ ] Ajustes rápidos aplicados (se necessário)
- [ ] Human Experience Score coletado

### Primeiro Mês
- [ ] Revisão completa de operação
- [ ] Métricas de sucesso validadas
- [ ] Plano de melhorias definido
- [ ] Decisão: **PRONTO PARA FASE 1** ou **AJUSTES NECESSÁRIOS**

---

## 📊 MÉTRICAS DE SUCESSO

### Técnicas
- **Uptime:** ≥ 99.5%
- **Tempo de resposta (p95):** < 500ms
- **Erros críticos:** 0
- **Rollback time:** < 15 minutos

### Operacionais
- **Tempo de resposta ao suporte:** < 2 horas
- **Taxa de resolução de incidentes:** > 90%
- **Satisfação do cliente:** ≥ 8.0/10

### UX
- **Human Experience Score:** ≥ 8.0
- **Taxa de conclusão de pedidos:** > 95%
- **Feedback positivo:** > 80%

---

## 🔄 REVISÃO E ATUALIZAÇÃO

Este checklist deve ser revisado e atualizado após cada Go-Live para incorporar aprendizados.

**Última revisão:** `____/____/____`  
**Próxima revisão:** `____/____/____`

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ **PRONTO PARA USO**
