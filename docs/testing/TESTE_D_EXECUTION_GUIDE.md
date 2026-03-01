# TESTE D — Guia de Execução Rápida

**Objetivo:** Executar TESTE D e obter resultados confiáveis.

---

## ⚡ Execução Rápida (5 minutos)

### 1. Verificar Pré-requisitos

```bash
# Docker Core rodando?
cd docker-core
docker compose -f docker-compose.core.yml ps

# Deve mostrar:
# - postgres: Up
# - postgrest: Up  
# - realtime: Up (ou Restarting - ok para teste)
```

### 2. Executar Teste

```bash
# Voltar para raiz do projeto
cd ..

# Executar teste
./scripts/run-realtime-kds-test.sh --orders=5
```

### 3. Observar Resultados

O script mostrará:
- ✅ Pedidos criados
- ✅ Pedidos recebidos via Realtime
- ✅ Duplicações (deve ser 0)
- ✅ Latência média/máxima
- ✅ Status final (PASS/FAIL)

---

## 👀 Observação Visual (Opcional mas Recomendado)

Enquanto o teste roda, abra o KDS no navegador:

```
http://localhost:5175/app/kds?demo=true
```

**O que observar:**
1. Pedidos aparecem **uma única vez**
2. Aparecem na **ordem correta** (mais antigo primeiro)
3. **Sem flicker** ou re-render desnecessário
4. **Latência perceptiva** aceitável (<300ms)

---

## 📊 Interpretação dos Resultados

### ✅ PASS (Tudo OK)

```
Orders Created: 5
Orders Received: 5
Duplicates: 0 (expected: 0)
Missing: 0 (expected: 0)
Avg Latency: 150ms (expected: <500ms)
Order Correct: ✅
Status: ✅ PASS
```

**Significado:** Realtime funcionando corretamente. KDS pode confiar nos eventos.

### ❌ FAIL (Problema Detectado)

**Cenário 1: Pedidos não aparecem**
```
Orders Created: 5
Orders Received: 0
Missing: 5
```

**Ação:** Verificar Realtime (ver troubleshooting)

**Cenário 2: Duplicações**
```
Orders Created: 5
Orders Received: 7
Duplicates: 2
```

**Ação:** Verificar múltiplas subscriptions (ver troubleshooting)

**Cenário 3: Latência alta**
```
Avg Latency: 800ms
```

**Ação:** Verificar network e Realtime performance

---

## 🔍 Troubleshooting Rápido

### Problema: "No test restaurants found"

**Solução:**
```bash
npx ts-node scripts/seed-massive-test-docker.ts --restaurants=1
```

### Problema: "Realtime is not running"

**Solução:**
```bash
cd docker-core
docker compose -f docker-compose.core.yml logs realtime
# Verificar erro específico
```

### Problema: "CHANNEL_ERROR" no console

**Solução:**
- Verificar que Realtime está na porta 4000
- Verificar que PostgREST está na porta 3001
- Verificar variáveis de ambiente

---

## 📝 Checklist Pós-Execução

Após executar o teste, verificar:

- [ ] Resultado JSON salvo em `test-results/realtime-kds-test-*.json`
- [ ] Duplicações = 0
- [ ] Missing = 0
- [ ] Latência < 500ms
- [ ] Status = PASS

Se tudo ✅ → **Realtime validado. Pronto para TESTE C.**

---

## 🎯 Próximo Passo

Se TESTE D passar:
- ✅ Realtime validado
- ✅ KDS pode confiar nos eventos
- ✅ Próximo: TESTE C (Concorrência + Tempo)

Se TESTE D falhar:
- 🔍 Diagnosticar problema específico
- 🔧 Corrigir
- 🔄 Re-executar

---

_Guia prático para execução rápida do TESTE D._
