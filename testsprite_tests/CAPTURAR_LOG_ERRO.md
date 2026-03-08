# 📋 Protocolo: Capturar Log do Erro 500
**Data:** 2026-01-13  
**Objetivo:** Capturar log exato do erro para diagnóstico final

---

## ✅ Estado Atual Confirmado

- ✅ Health endpoint: OK
- ✅ Contrato: Correto
- ✅ Produto de teste: Criado
- ✅ Migration: Aplicada
- ✅ Código: Corrigido
- ✅ Processo antigo: Encerrado

---

## 🎯 Protocolo Final (Execute Nesta Ordem)

### 1️⃣ Terminal 1: Iniciar Servidor

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
npm run dev
```

**Aguardar até ver:**
- Build completo
- Servidor rodando na porta 4320
- Mensagens de startup

**Manter este terminal aberto para ver os logs.**

---

### 2️⃣ Terminal 2: Executar Teste Manual

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
./scripts/test-order-creation-manual.sh
```

**Este script irá:**
- Autenticar (Magic Link)
- Criar pedido
- Mostrar resposta HTTP

---

### 3️⃣ Capturar Log do Servidor

**No Terminal 1 (onde o servidor está rodando), procure por:**

```
[API] /api/orders POST failed:
```

**Cole aqui EXATAMENTE:**
- A linha completa com `[API] /api/orders POST failed:`
- As linhas seguintes (stack trace, mensagem de erro, etc.)
- **Mínimo 3-10 linhas após a mensagem de erro**

---

### 4️⃣ Capturar Resposta HTTP

**No Terminal 2 (onde executou o script), copie:**

- Status HTTP (ex: `❌ ERRO: HTTP 500`)
- Body completo da resposta (JSON)

---

## 📋 Exemplo do Que Preciso

**Log do Servidor:**
```
[API] /api/orders POST failed: Error: function public.create_order_atomic(uuid, jsonb, text) does not exist
    at Pool.query (...)
    at createOrder (...)
    ...
```

**Resposta HTTP:**
```
Status: 500
Body: {
  "error": "ORDER_CREATION_FAILED",
  "message": "function public.create_order_atomic(uuid, jsonb, text) does not exist",
  "details": "..."
}
```

---

## ⚠️ Importante

- **Não resuma**
- **Não interprete**
- **Cole cru** - exatamente como aparece

Com isso, identifico a causa exata em minutos.

---

**Status:** Aguardando log do servidor e resposta HTTP
