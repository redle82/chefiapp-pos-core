# 🎯 PROMPT PARA OPUS / ANTIGRÁFICO — Construir Matriz de Representação

**Data:** 2026-01-24  
**Status:** 📝 **PROMPT CANÔNICO**

---

## 🎯 MISSÃO

Você é o Auditor de Soberania do ChefIApp OS. Sua missão é construir a **Matriz de Representação Total** que cruza Backend → DB → Frontend → Audit.

---

## 📋 CONTEXTO

O ChefIApp segue a **Lei da Representação Total**:

> Todo poder existente no sistema deve ser:
> 1. Invocável
> 2. Rastreável
> 3. Representado no frontend
> ou explicitamente declarado como não-exposto

---

## 🗺️ OS 3 MAPAS QUE VOCÊ PRECISA

### 1. Mapa de Poder do Backend

**Arquivo:** `docs/sovereignty/backend-power-map.json`

**O que fazer:**
1. Ler `server/web-module-api-server.ts`
2. Extrair todos os endpoints HTTP (GET, POST, PUT, DELETE, PATCH)
3. Agrupar por domínio (orders, payments, fiscal, etc.)
4. Listar funções críticas que mudam estado

**Output esperado:**
```json
{
  "domains": {
    "orders": [
      { "method": "POST", "route": "/api/orders" },
      { "method": "GET", "route": "/api/orders/:id" },
      { "method": "PATCH", "route": "/api/orders/:id" }
    ],
    "payments": [...]
  },
  "functions": [
    { "name": "createOrder", "file": "..." }
  ]
}
```

---

### 2. Mapa de Rotas do Frontend

**Arquivo:** `docs/sovereignty/frontend-routes-map.json`

**O que fazer:**
1. Ler `merchant-portal/src/App.tsx`
2. Extrair todas as rotas `/app/*`
3. Para cada rota, identificar ações possíveis:
   - Botões
   - Formulários
   - Gestos
   - Fluxos

**Output esperado:**
```json
{
  "routes": [
    "/app/tpv",
    "/app/kds",
    "/app/orders"
  ],
  "actions": {
    "/app/tpv": [
      "criar_pedido",
      "adicionar_item",
      "remover_item",
      "pagar",
      "cancelar"
    ]
  }
}
```

---

### 3. Mapa de Estados do Banco

**Arquivo:** `docs/sovereignty/database-states-map.json`

**O que fazer:**
1. Ler `supabase/migrations/*.sql`
2. Extrair enums de status
3. Extrair CHECK constraints com status
4. Mapear transições possíveis (baseado em triggers)

**Output esperado:**
```json
{
  "states": {
    "gm_orders_status": [
      "pending",
      "preparing",
      "ready",
      "delivered",
      "canceled"
    ]
  },
  "transitions": {
    "gm_orders": {
      "from": {
        "pending": ["preparing", "canceled"],
        "preparing": ["ready", "canceled"]
      }
    }
  }
}
```

---

## 🔐 CONSTRUIR A MATRIZ

**Arquivo:** `docs/canon/REPRESENTATION_MATRIX.md`

### Estrutura da Matriz

| Backend Action | DB Change | UI Route | UI Action | Audit | Status |
|----------------|-----------|----------|-----------|-------|--------|
| `POST /api/orders` | `INSERT gm_orders` | `/app/tpv` | Botão "Criar Pedido" | ✔ | ✅ |
| `PATCH /api/orders/:id/status` → `ready` | `UPDATE status = 'ready'` | `/app/kds` | Marcar "Pronto" | ✔ | ✅ |

### Processo

1. **Para cada endpoint do backend:**
   - Qual mudança no DB ele causa?
   - Qual rota do frontend dispara isso?
   - Qual ação UI (botão, gesto, fluxo)?
   - Tem audit log?

2. **Para cada rota do frontend:**
   - Quais ações ela permite?
   - Cada ação tem endpoint correspondente?
   - Cada ação tem feedback visual?
   - Cada ação tem audit?

3. **Para cada estado do banco:**
   - É alcançável via UI?
   - Se não, é estado interno (OK) ou gap (PROBLEMA)?

---

## 🚨 IDENTIFICAR GAPS

### Tipo 1: Backend sem UI
- Endpoint existe, mas não há botão/tela que chama
- **Ação:** Marcar como gap ou documentar como interno

### Tipo 2: UI sem Backend Real
- Botão existe, mas chama mock ou estado local
- **Ação:** Implementar endpoint real ou remover UI

### Tipo 3: Banco com Estado Inalcançável
- Estado existe, mas nunca ocorre via fluxo real
- **Ação:** Remover estado ou criar fluxo que o alcança

---

## ✅ CRITÉRIO DE CONCLUSÃO

A matriz está completa quando:

- ✅ Todo endpoint do backend tem linha na matriz
- ✅ Toda ação do frontend tem linha na matriz (ou está marcada como mock)
- ✅ Todo estado do banco é alcançável via UI (ou está marcado como interno)
- ✅ Nenhum gap crítico permanece

---

## 📊 OUTPUT ESPERADO

1. **3 arquivos JSON** com os mapas
2. **1 arquivo Markdown** com a matriz completa
3. **1 relatório** com gaps identificados

---

## 🛠️ FERRAMENTAS DISPONÍVEIS

- `scripts/generate-sovereignty-maps.js` - Gera mapas automaticamente (base)
- `scripts/validate-representation.sh` - Valida gaps
- `LEI_REPRESENTACAO_TOTAL.md` - Lei imutável de referência

---

## 🎯 COMEÇAR AGORA

1. Execute: `node scripts/generate-sovereignty-maps.js`
2. Revise os mapas gerados
3. Preencha a matriz manualmente (ou use IA para ajudar)
4. Execute: `./scripts/validate-representation.sh`
5. Corrija gaps encontrados

---

**Última atualização:** 2026-01-24  
**Status:** 📝 **PROMPT CANÔNICO**
