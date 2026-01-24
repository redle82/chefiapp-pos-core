# 🎫 Tickets Fase 0 - Go-Live Controlado

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ **PRONTOS PARA GITHUB/NOTION**

---

## 📋 EPIC: F0-E1 - Estabilização RC1

**Objetivo:** Garantir operação estável em produção para 1 restaurante  
**Métricas de Sucesso:** 
- ✅ 7 dias sem incidentes críticos
- ✅ Human Experience Score ≥ 8.0  
**Dependências:** Nenhuma  
**Risco:** Médio

---

## 🎫 TICKET [F0-001] Setup de Monitoramento Básico

**Tipo:** infra  
**Prioridade:** P0  
**Dono:** dev  
**Fase:** F0  
**Estimativa:** M (4-8h)

### Descrição
Implementar logging estruturado e captura de erros básica usando Sentry para React Native. Garantir que erros críticos sejam capturados, alertados e acessíveis para debugging.

### Checklist Técnico
- [ ] Criar branch: `git checkout -b phase-0-monitoring`
- [ ] Instalar Sentry: `cd mobile-app && npx expo install @sentry/react-native`
- [ ] Configurar DSN em variáveis de ambiente (`.env` ou Expo config)
- [ ] Criar `mobile-app/services/logging.ts` com:
  - Função `logError(error, context)`
  - Função `logEvent(event, metadata)`
  - Função `setUserContext(userId, restaurantId)`
- [ ] Integrar em pontos críticos:
  - `mobile-app/context/OrderContext.tsx` (erros de fetch, mutations)
  - `mobile-app/services/NowEngine.ts` (erros de cálculo, lógica)
  - `mobile-app/app/(tabs)/staff.tsx` (erros de pagamento)
- [ ] Adicionar ErrorBoundary em `mobile-app/app/_layout.tsx`
- [ ] Criar dashboard básico no Supabase (queries lentas, erros)
- [ ] Documentar processo de acesso a logs em `docs/ops/monitoring.md`

### Critério de Aceite
- [ ] Erros críticos são capturados e alertados (Sentry dashboard)
- [ ] Logs são acessíveis para debugging (Sentry + Supabase)
- [ ] Dashboard básico mostra métricas essenciais (erros, performance)
- [ ] Breadcrumbs funcionando (últimas ações antes do erro)
- [ ] Teste manual: forçar erro e validar captura

### Arquivos/Pastas
- `mobile-app/services/logging.ts` (NOVO)
- `mobile-app/app/_layout.tsx` (modificar - adicionar ErrorBoundary)
- `mobile-app/context/OrderContext.tsx` (modificar - adicionar logging)
- `mobile-app/services/NowEngine.ts` (modificar - adicionar logging)
- `mobile-app/app/(tabs)/staff.tsx` (modificar - adicionar logging em pagamentos)
- `docs/ops/monitoring.md` (NOVO)

### Configuração Necessária
- [ ] Variável de ambiente: `EXPO_PUBLIC_SENTRY_DSN`
- [ ] Serviço externo: Sentry (criar projeto em sentry.io)
- [ ] Permissões: Acesso ao Sentry dashboard

### Dependências
Nenhuma

### Notas
- Sentry DSN precisa ser configurado em variáveis de ambiente
- Considerar usar `@sentry/react-native` com Expo
- Para produção, configurar releases e source maps
- Breadcrumbs são essenciais para debugging em produção

---

## 🎫 TICKET [F0-002] Processo de Rollback Documentado

**Tipo:** ops  
**Prioridade:** P0  
**Dono:** owner  
**Fase:** F0  
**Estimativa:** S (2-4h)

### Descrição
Documentar e testar processo de rollback de versões (app e database migrations). Garantir que equipe sabe executar rollback em < 15 minutos em caso de incidente crítico.

### Checklist Técnico
- [ ] Documentar processo de rollback de app (Expo EAS):
  - Como listar releases
  - Como fazer rollback para versão anterior
  - Como validar rollback
- [ ] Criar script `scripts/rollback-migration.sh`:
  - Validar que Supabase CLI está instalado
  - Listar migrations disponíveis
  - Executar rollback de migration específica
  - Validar rollback
- [ ] Documentar processo de rollback de migration em `docs/ops/rollback-procedure.md`
- [ ] Testar rollback em ambiente de staging:
  - Deploy de migration de teste
  - Executar rollback
  - Validar que dados estão corretos
- [ ] Criar checklist de rollback rápido (1 página)

### Critério de Aceite
- [ ] Processo documentado e testado
- [ ] Script de rollback funcional (`scripts/rollback-migration.sh`)
- [ ] Equipe sabe executar rollback em < 15 min
- [ ] Checklist de rollback rápido disponível
- [ ] Teste em staging validado

### Scripts/Comandos
```bash
# Rollback de migration
./scripts/rollback-migration.sh [version]

# Rollback de app (Expo EAS)
eas update:rollback --channel production
```

### Documentação
- [ ] Documentar em: `docs/ops/rollback-procedure.md`
- [ ] Criar checklist rápido: `docs/ops/rollback-checklist.md`

### Arquivos/Pastas
- `docs/ops/rollback-procedure.md` (NOVO)
- `docs/ops/rollback-checklist.md` (NOVO)
- `scripts/rollback-migration.sh` (NOVO - já existe, validar)

### Dependências
Nenhuma

### Notas
- Rollback é crítico para operação - não pular esta task
- Testar em staging antes de produção
- Documentar casos de uso específicos (rollback parcial, rollback completo)

---

## 🎫 TICKET [F0-003] Health Checks Básicos

**Tipo:** infra  
**Prioridade:** P1  
**Dono:** dev  
**Fase:** F0  
**Estimativa:** S (2-4h)

### Descrição
Implementar health checks para app e backend. Garantir que sistema pode ser monitorado externamente e alertas são enviados em caso de falha.

### Checklist Técnico
- [ ] Criar Edge Function `supabase/functions/health-check/index.ts`:
  - Verificar conexão com database
  - Verificar autenticação
  - Retornar status 200 se saudável, 500 se não
  - Incluir timestamp e versão
- [ ] Adicionar health check no app (`mobile-app/services/healthCheck.ts`):
  - Verificar conexão Supabase
  - Verificar autenticação
  - Retornar status (online/offline)
- [ ] Criar dashboard básico de status (página simples ou componente)
- [ ] Configurar alertas básicos:
  - UptimeRobot ou similar
  - Ping a cada 5 minutos
  - Alerta se falhar 3 vezes consecutivas
- [ ] Documentar endpoints de health check

### Critério de Aceite
- [ ] Health checks funcionando (app e backend)
- [ ] Alertas configurados (UptimeRobot ou similar)
- [ ] Dashboard mostra status em tempo real
- [ ] Endpoints documentados
- [ ] Teste manual: simular falha e validar alerta

### Arquivos/Pastas
- `supabase/functions/health-check/index.ts` (NOVO)
- `mobile-app/services/healthCheck.ts` (NOVO)
- `merchant-portal/src/pages/Admin/HealthStatusPage.tsx` (NOVO - opcional)
- `docs/ops/health-checks.md` (NOVO)

### Configuração Necessária
- [ ] Serviço externo: UptimeRobot ou similar (criar conta)
- [ ] Permissões: Acesso ao dashboard de monitoramento

### Dependências
Nenhuma

### Notas
- Health checks são essenciais para operação
- Considerar adicionar métricas de performance (tempo de resposta)
- Para produção, configurar múltiplos pontos de verificação

---

## 🎫 TICKET [F0-004] Correções UX Baixas Restantes (Opcional)

**Tipo:** feature  
**Prioridade:** P3  
**Dono:** dev  
**Fase:** F0  
**Estimativa:** M (4-8h)

### Descrição
Revisar `docs/audit/HUMAN_TEST_REPORT.md` e corrigir 4 erros UX baixos restantes se aplicáveis. Validar que correções não violam princípios de design (single-screen UI, simplicidade operacional).

### Checklist Técnico
- [ ] Revisar `docs/audit/HUMAN_TEST_REPORT.md`
- [ ] Identificar erros baixos aplicáveis (não violam single-screen UI)
- [ ] Priorizar erros por impacto
- [ ] Implementar correções:
  - Microcopy melhorado
  - Feedback visual
  - Badges informativos
  - Estados explícitos
- [ ] Validar com usuários (teste rápido)
- [ ] Documentar correções aplicadas

### Critério de Aceite
- [ ] Erros baixos aplicáveis corrigidos
- [ ] Validação com usuários positiva
- [ ] Princípios de design mantidos (single-screen UI)
- [ ] Documentação atualizada

### Arquivos/Pastas
- Conforme erros identificados em `docs/audit/HUMAN_TEST_REPORT.md`
- `docs/audit/UX_FIXES_PHASE_0.md` (NOVO - documentar correções)

### Dependências
- [ ] [F0-001] Setup de Monitoramento Básico (para capturar feedback)

### Notas
- Esta task é opcional - focar em estabilização primeiro
- Não violar princípios de design (single-screen UI, simplicidade)
- Validar com usuários reais antes de considerar completa

---

## 📊 RESUMO DA FASE 0

### Tickets
- **Total:** 4 tickets
- **Prioridade P0:** 2 tickets
- **Prioridade P1:** 1 ticket
- **Prioridade P3:** 1 ticket (opcional)

### Estimativas
- **Total:** 12-20 horas (1.5-2.5 dias)
- **Crítico (P0):** 6-12 horas
- **Importante (P1):** 2-4 horas
- **Opcional (P3):** 4-8 horas

### Ordem de Execução Recomendada
1. **[F0-001]** Setup de Monitoramento Básico (P0) - **COMEÇAR AQUI**
2. **[F0-002]** Processo de Rollback Documentado (P0)
3. **[F0-003]** Health Checks Básicos (P1)
4. **[F0-004]** Correções UX Baixas Restantes (P3 - opcional)

### Critério de Conclusão da Fase 0
- [ ] Todos os tickets P0 e P1 concluídos
- [ ] 7 dias de operação estável sem incidentes críticos
- [ ] Métricas de UX coletadas (Human Experience Score ≥ 8.0)
- [ ] Processo de suporte básico funcionando
- [ ] Documentação operacional completa

---

## 🚀 PRÓXIMOS PASSOS

1. **Criar tickets no GitHub/Notion:**
   - Copiar cada ticket acima
   - Criar issue/ticket no sistema de gestão
   - Atribuir a pessoa responsável
   - Adicionar à sprint/backlog

2. **Começar execução:**
   - Começar por [F0-001] (Setup de Monitoramento)
   - Seguir ordem recomendada
   - Validar critérios de aceite antes de fechar
   - **Usar [F0_001_AUDIT_TEMPLATE.md](./F0_001_AUDIT_TEMPLATE.md) para auditoria antes de fechar**

3. **Validar Fase 0:**
   - Após todos os tickets concluídos
   - Executar checklist de validação
   - Preparar para Fase 1

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ **PRONTOS PARA GITHUB/NOTION**
