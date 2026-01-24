# 📋 PROTOCOLO DE INCIDENTES REAIS — Primeira Semana

**Data:** 2026-01-24  
**Status:** 📝 **PROTOCOLO OPERACIONAL**  
**Contexto:** Sistema em produção real (1 restaurante)

---

## 🎯 OBJETIVO

Este protocolo define como **observar, registrar e responder** a incidentes reais durante a primeira semana de operação em produção.

---

## 📊 O QUE OBSERVAR

### 1. Logs do Sistema

**Onde:**
- Console do browser (F12)
- Network tab
- `app_logs` no banco

**O que registrar:**
- Erros JavaScript
- Requisições falhadas (4xx, 5xx)
- Loops de requisição
- Warnings recorrentes

**Formato:**
```
[INCIDENT] 2026-01-24 14:30:00
Tipo: JavaScript Error
Mensagem: "Cannot read property 'id' of null"
Rota: /app/tpv
Ação: Criar pedido
Severidade: HIGH
```

---

### 2. Comportamento Humano

**O que observar:**
- Hesitações do usuário
- Ações repetidas (indica confusão)
- Uso fora do script esperado
- Tempo de execução de tarefas

**Formato:**
```
[OBSERVAÇÃO] 2026-01-24 15:00:00
Tipo: Comportamento Humano
Descrição: "Usuário tentou pagar pedido 3 vezes antes de conseguir"
Contexto: Pedido estava em status 'locked'
Severidade: MEDIUM
```

---

### 3. Dados Inconsistentes

**O que verificar:**
- Pedidos duplicados
- Valores incorretos
- Estados impossíveis
- Vazamento entre tenants

**Formato:**
```
[INCIDENT] 2026-01-24 16:00:00
Tipo: Dados Inconsistentes
Descrição: "Pedido #123 aparece com total = 0 mas tem 3 itens"
Pedido ID: abc-123
Severidade: CRITICAL
```

---

### 4. Performance

**O que medir:**
- Tempo de carregamento de páginas
- Tempo de resposta de ações
- Lags na UI
- Uso de memória/CPU

**Formato:**
```
[INCIDENT] 2026-01-24 17:00:00
Tipo: Performance
Descrição: "Dashboard leva 8s para carregar"
Rota: /app/dashboard
Severidade: MEDIUM
```

---

## 🚨 CLASSIFICAÇÃO DE INCIDENTES

### 🔴 CRITICAL
- Sistema não funciona (não sobe, não carrega)
- Dados são perdidos
- Dinheiro some ou duplica
- Vazamento de dados entre tenants

**Ação:** Parar operação imediatamente

---

### 🟠 HIGH
- Funcionalidade crítica não funciona (pagamento, fiscal)
- Erros recorrentes que impedem uso
- Dados inconsistentes

**Ação:** Documentar e corrigir em 24h

---

### 🟡 MEDIUM
- Funcionalidade secundária não funciona
- Performance degradada
- UX confusa

**Ação:** Documentar e corrigir em 1 semana

---

### 🔵 LOW
- Melhorias de UX
- Warnings não-críticos
- Sugestões de melhoria

**Ação:** Documentar para backlog

---

## 📝 TEMPLATE DE REGISTRO

```markdown
# INCIDENT #001

**Data/Hora:** 2026-01-24 14:30:00
**Severidade:** HIGH
**Tipo:** JavaScript Error

## Descrição
[Descrição clara do que aconteceu]

## Contexto
- Rota: /app/tpv
- Ação: Criar pedido
- Usuário: [nome/email]
- Tenant: [restaurant_id]

## Evidências
- Screenshot: [link]
- Console logs: [logs]
- Network requests: [requests]
- DB state: [query results]

## Impacto
- Usuários afetados: X
- Pedidos afetados: Y
- Tempo de indisponibilidade: Z minutos

## Ação Tomada
- [O que foi feito imediatamente]

## Resolução
- [Como foi resolvido]
- [Tempo para resolução]

## Prevenção
- [Como prevenir no futuro]
```

---

## 🔄 FLUXO DE RESPOSTA

### 1. Detecção
- Sistema detecta erro automaticamente
- Usuário reporta problema
- Observação manual durante uso

### 2. Registro
- Criar incident no formato acima
- Adicionar ao `INCIDENTES_REAIS.md`
- Classificar severidade

### 3. Análise
- Reproduzir problema
- Identificar causa raiz
- Verificar se é bug ou uso incorreto

### 4. Resolução
- Corrigir bug (se aplicável)
- Documentar workaround (se necessário)
- Atualizar protocolo (se necessário)

### 5. Prevenção
- Adicionar teste automatizado
- Melhorar validações
- Documentar edge case

---

## 📊 MÉTRICAS A COLETAR

### Diárias
- Número de incidentes por dia
- Tempo médio de resolução
- Taxa de sucesso de ações críticas

### Semanais
- Tendência de incidentes
- Padrões recorrentes
- Áreas mais problemáticas

---

## 🎯 CRITÉRIO DE ESTABILIDADE

O sistema está estável quando:

- ✅ 0 incidentes CRITICAL em 7 dias
- ✅ < 3 incidentes HIGH em 7 dias
- ✅ Taxa de sucesso > 99% em ações críticas
- ✅ Tempo médio de resolução < 2h

---

## 📚 DOCUMENTOS RELACIONADOS

- **[AUDITORIA_REPRESENTACAO_COMPLETA.md](./docs/sovereignty/AUDITORIA_REPRESENTACAO_COMPLETA.md)** - Auditoria estrutural
- **[PROMPT_ANTIGRAFICO_E2E_HUMANO.md](./PROMPT_ANTIGRAFICO_E2E_HUMANO.md)** - Teste E2E humano

---

**Última atualização:** 2026-01-24  
**Status:** 📝 **PROTOCOLO OPERACIONAL**
