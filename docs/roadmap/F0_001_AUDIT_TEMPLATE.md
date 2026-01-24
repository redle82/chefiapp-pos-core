# 🔍 Auditoria [F0-001] - Setup de Monitoramento Básico

**Ticket:** [F0-001] Setup de Monitoramento Básico  
**Tipo:** infra  
**Prioridade:** P0  
**Estimativa:** M (4-8h)  
**Data da Auditoria:** `____/____/____`  
**Auditor:** `_________________`

---

## ✅ CHECKLIST DE VALIDAÇÃO

### 1. INSTALAÇÃO E CONFIGURAÇÃO

#### 1.1 Sentry Instalado
- [ ] **Sentry instalado no projeto**
  - [ ] `@sentry/react-native` instalado via `npx expo install`
  - [ ] Versão: `________`
  - [ ] Dependências instaladas sem erros
  - [ ] `package.json` atualizado

- [ ] **DSN configurado**
  - [ ] DSN configurado em variáveis de ambiente
  - [ ] Variável: `EXPO_PUBLIC_SENTRY_DSN`
  - [ ] DSN válido (testado no Sentry dashboard)
  - [ ] DSN não exposto no código (apenas em `.env`)

#### 1.2 Serviço de Logging Criado
- [ ] **Arquivo `mobile-app/services/logging.ts` criado**
  - [ ] Arquivo existe
  - [ ] Função `logError(error, context)` implementada
  - [ ] Função `logEvent(event, metadata)` implementada
  - [ ] Função `setUserContext(userId, restaurantId)` implementada
  - [ ] Exportações corretas

- [ ] **Integração com Sentry**
  - [ ] Sentry inicializado corretamente
  - [ ] Breadcrumbs configurados
  - [ ] Release tracking configurado (se aplicável)
  - [ ] Source maps configurados (se aplicável)

---

### 2. INTEGRAÇÃO EM PONTOS CRÍTICOS

#### 2.1 OrderContext
- [ ] **Logging em `mobile-app/context/OrderContext.tsx`**
  - [ ] Erros de fetch capturados
  - [ ] Erros de mutations capturados
  - [ ] Contexto incluído (orderId, restaurantId, userId)
  - [ ] Teste manual: forçar erro e validar captura

#### 2.2 NowEngine
- [ ] **Logging em `mobile-app/services/NowEngine.ts`**
  - [ ] Erros de cálculo capturados
  - [ ] Erros de lógica capturados
  - [ ] Contexto incluído (action, state)
  - [ ] Teste manual: forçar erro e validar captura

#### 2.3 Pagamentos
- [ ] **Logging em `mobile-app/app/(tabs)/staff.tsx`**
  - [ ] Erros de pagamento capturados
  - [ ] Contexto incluído (orderId, amount, method)
  - [ ] Teste manual: forçar erro e validar captura

#### 2.4 ErrorBoundary
- [ ] **ErrorBoundary em `mobile-app/app/_layout.tsx`**
  - [ ] ErrorBoundary implementado
  - [ ] Erros não tratados capturados
  - [ ] UI de fallback exibida
  - [ ] Erro enviado para Sentry
  - [ ] Teste manual: forçar crash e validar captura

---

### 3. VALIDAÇÃO FUNCIONAL

#### 3.1 Captura de Erros
- [ ] **Erros são capturados**
  - [ ] Erro de rede capturado (teste: desligar internet)
  - [ ] Erro de autenticação capturado (teste: token inválido)
  - [ ] Erro de validação capturado (teste: dados inválidos)
  - [ ] Erro não tratado capturado (teste: throw Error)

- [ ] **Breadcrumbs funcionando**
  - [ ] Últimas ações antes do erro registradas
  - [ ] Breadcrumbs visíveis no Sentry dashboard
  - [ ] Contexto suficiente para debugging

#### 3.2 Dashboard Sentry
- [ ] **Sentry dashboard acessível**
  - [ ] Projeto criado no Sentry
  - [ ] Erros aparecem no dashboard
  - [ ] Detalhes do erro visíveis
  - [ ] Stack trace completo
  - [ ] Contexto do usuário visível

#### 3.3 Logs Estruturados
- [ ] **Logs são estruturados**
  - [ ] Logs incluem timestamp
  - [ ] Logs incluem nível (error, warning, info)
  - [ ] Logs incluem contexto relevante
  - [ ] Logs são pesquisáveis no Sentry

---

### 4. DASHBOARD SUPABASE (OPCIONAL)

#### 4.1 Queries Lentas
- [ ] **Dashboard de queries lentas criado**
  - [ ] Queries com tempo > 500ms identificadas
  - [ ] Dashboard mostra top 10 queries lentas
  - [ ] Queries podem ser analisadas

#### 4.2 Erros do Backend
- [ ] **Dashboard de erros criado**
  - [ ] Erros do Supabase capturados
  - [ ] Dashboard mostra erros recentes
  - [ ] Erros podem ser analisados

---

### 5. DOCUMENTAÇÃO

#### 5.1 Processo Documentado
- [ ] **Documentação criada**
  - [ ] `docs/ops/monitoring.md` criado
  - [ ] Processo de acesso a logs documentado
  - [ ] Processo de análise de erros documentado
  - [ ] Exemplos de uso documentados

#### 5.2 Equipe Treinada
- [ ] **Equipe sabe usar**
  - [ ] Equipe sabe acessar Sentry dashboard
  - [ ] Equipe sabe interpretar erros
  - [ ] Equipe sabe usar breadcrumbs
  - [ ] Processo de escalação documentado

---

### 6. TESTES MANUAIS

#### 6.1 Teste de Erro Simples
- [ ] **Forçar erro simples**
  - [ ] Ação: `throw new Error('Test error')`
  - [ ] Erro aparece no Sentry em < 1 minuto
  - [ ] Detalhes completos visíveis
  - [ ] Breadcrumbs presentes

#### 6.2 Teste de Erro em Produção
- [ ] **Teste em ambiente de staging/produção**
  - [ ] Erro forçado em ambiente real
  - [ ] Erro capturado corretamente
  - [ ] Contexto correto (userId, restaurantId)
  - [ ] Não impacta experiência do usuário

#### 6.3 Teste de Performance
- [ ] **Impacto no app**
  - [ ] App não fica mais lento
  - [ ] Sem aumento significativo de uso de bateria
  - [ ] Sem aumento significativo de uso de dados
  - [ ] Experiência do usuário não impactada

---

## 🚨 CRITÉRIOS DE BLOQUEIO

**NÃO fechar ticket se:**
- ❌ Sentry não instalado ou configurado
- ❌ Erros não são capturados
- ❌ Breadcrumbs não funcionam
- ❌ Dashboard não acessível
- ❌ Documentação não criada
- ❌ Testes manuais não passaram

---

## ✅ CRITÉRIOS DE APROVAÇÃO

**Ticket aprovado quando:**
- ✅ Sentry instalado e configurado
- ✅ Serviço de logging criado e funcional
- ✅ Integração em pontos críticos completa
- ✅ Erros são capturados e visíveis no Sentry
- ✅ Breadcrumbs funcionando
- ✅ Documentação criada
- ✅ Testes manuais passaram
- ✅ Equipe treinada (ou treinamento agendado)

---

## 📊 MÉTRICAS DE SUCESSO

### Técnicas
- **Taxa de captura de erros:** > 95%
- **Tempo de aparecimento no Sentry:** < 1 minuto
- **Breadcrumbs por erro:** ≥ 5 eventos
- **Impacto no app:** < 5% de degradação de performance

### Operacionais
- **Documentação completa:** 100%
- **Equipe treinada:** 100%
- **Dashboard acessível:** 100%

---

## 🔍 CHECKLIST DE REVISÃO DE CÓDIGO

### Código
- [ ] Código segue padrões do projeto
- [ ] Sem console.logs desnecessários
- [ ] Tratamento de erros adequado
- [ ] TypeScript sem erros
- [ ] Linter sem erros críticos

### Segurança
- [ ] DSN não exposto no código
- [ ] Dados sensíveis não logados
- [ ] PII (dados pessoais) não logados
- [ ] Conformidade com LGPD/GDPR

### Performance
- [ ] Logging não bloqueia thread principal
- [ ] Logs não excessivos (spam)
- [ ] Rate limiting implementado (se necessário)

---

## 📝 NOTAS DA AUDITORIA

### Pontos Fortes
```
[Anotar pontos fortes da implementação]
```

### Pontos de Melhoria
```
[Anotar pontos que podem ser melhorados]
```

### Bugs Encontrados
```
[Anotar bugs encontrados durante auditoria]
```

### Recomendações
```
[Anotar recomendações para próximas iterações]
```

---

## ✅ ASSINATURA DE APROVAÇÃO

### Desenvolvedor
- [ ] **Desenvolvedor:** `_________________` Data: `____/____/____`
  - [ ] Código revisado
  - [ ] Testes passando
  - [ ] Documentação atualizada

### Auditor/Reviewer
- [ ] **Auditor:** `_________________` Data: `____/____/____`
  - [ ] Checklist completo validado
  - [ ] Critérios de aprovação atendidos
  - [ ] Ticket aprovado para fechamento

---

## 🎯 PRÓXIMOS PASSOS

Após aprovação:
1. ✅ Fechar ticket [F0-001]
2. ✅ Mover para [F0-002] (Processo de Rollback)
3. ✅ Atualizar documentação do projeto
4. ✅ Comunicar conclusão à equipe

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ **PRONTO PARA USO**
