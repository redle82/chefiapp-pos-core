# Infraestrutura Docker - ChefIApp

**Data:** 2026-01-25
**Status:** ✅ Configurado e Funcional

---

## 🎯 Visão Geral

Toda a infraestrutura do ChefIApp está rodando em Docker, incluindo:

- ✅ Banco de dados (PostgreSQL)
- ✅ API REST (PostgREST)
- ✅ Sincronização em tempo real (Realtime)
- ✅ Periféricos configurados

---

## 🐳 Containers Docker Core

### 1. PostgreSQL (Banco de Dados)

**Container:** `chefiapp-core-postgres`
**Imagem:** `postgres:15-alpine`
**Porta:** `54320:5432`
**Status:** ✅ Healthy

**Configuração:**

- Database: `chefiapp_core`
- Usuário: `postgres`
- Senha: `postgres`
- Volume: `postgres-core-data`

**Schema:**

- Arquivo: `docker-core/schema/core_schema.sql`
- Seeds: `docker-core/schema/seeds_dev.sql`

**Acesso:**

```bash
# Via Docker exec
docker exec -it chefiapp-core-postgres psql -U postgres -d chefiapp_core

# Via psql local
psql -h localhost -p 54320 -U postgres -d chefiapp_core
```

---

### 2. PostgREST (API REST)

**Container:** `chefiapp-core-postgrest`
**Imagem:** `postgrest/postgrest:v12.0.2`
**Porta:** `3001:3000`
**Status:** ✅ Running

**Configuração:**

- URL: `http://localhost:3001`
- Schema: `public`
- JWT Secret: `chefiapp-core-secret-key-min-32-chars-long`

**Endpoints:**

- REST API: `http://localhost:3001/{table}`
- RPC: `http://localhost:3001/rpc/{function_name}`

**Exemplo:**

```bash
# Listar restaurantes
curl http://localhost:3001/gm_restaurants

# Chamar RPC
curl -X POST http://localhost:3001/rpc/create_order_atomic \
  -H "Content-Type: application/json" \
  -d '{"p_restaurant_id": "...", "p_items": [...]}'
```

---

### 3. Realtime (WebSocket)

**Container:** `chefiapp-core-realtime`
**Imagem:** `supabase/realtime:v2.34.47`
**Porta:** `4000:4000`
**Status:** ✅ Running

**Configuração:**

- WebSocket: `ws://localhost:4000`
- Schema: `_realtime`
- APP_NAME: `realtime`

**Funcionalidade:**

- Sincronização em tempo real para KDS
- Atualizações automáticas de pedidos
- WebSocket para TPV

**Validação:**

```bash
# Ver logs
docker logs chefiapp-core-realtime -f

# Verificar status
curl http://localhost:4000/
```

---

## 📦 Estrutura de Arquivos

```
docker-core/
├── docker-compose.core.yml    # Orquestração dos serviços
├── schema/
│   ├── core_schema.sql        # Schema principal do banco
│   └── seeds_dev.sql          # Dados de desenvolvimento
├── README.md                   # Documentação do Docker Core
└── show-everything.sh          # Script de validação
```

---

## 🔌 Periféricos Configurados

### 1. Impressoras

**Status:** ✅ Configurado e Funcional
**Tipos Suportados:**

- **Impressoras Térmicas** (ESC/POS, 80mm)
- **Impressão via Browser** (padrão, funciona em qualquer dispositivo)
- **Impressoras de Rede** (TCP/IP, porta 9100)

**Funcionalidades:**

- ✅ Impressão de comandas de pedidos
- ✅ Impressão de recibos fiscais
- ✅ Impressão de QR codes
- ✅ Suporte a múltiplas impressoras (KITCHEN/COUNTER)
- ✅ Formatação ESC/POS

**Configuração:**

- Browser Print: Automático via `window.print()`
- Impressoras Térmicas: Configuração manual via IP/porta (mobile app)
- Porta padrão: `9100` (TCP/IP)

**Arquivos relacionados:**

- `merchant-portal/src/core/fiscal/FiscalPrinter.ts`
- `merchant-portal/src/pages/TPV/components/FiscalPrintButton.tsx`
- `mobile-app/services/PrinterService.ts`
- `docs/audit/PRINTING_GUIDE.md`

---

### 2. Displays (KDS)

**Status:** ✅ Configurado e Funcional
**Tipo:** Kitchen Display System (KDS)

**Configuração:**

- Acessível via: `http://localhost:5173/app/kds`
- Atualização em tempo real via Realtime
- Suporte a múltiplas estações (KITCHEN, BAR, etc.)

**Funcionalidades:**

- ✅ Exibição de pedidos em tempo real
- ✅ Hierarquia visual (NOVO, EM PREPARO, ATRASADO)
- ✅ Origem clara (TPV, WEB, QR_MESA, GARÇOM)
- ✅ Timer visível com cores
- ✅ Ação óbvia (botões claros)
- ✅ Layout limpo (zero ruído)

**Arquivos relacionados:**

- `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx`
- `merchant-portal/src/pages/TPV/KDS/OrderTimer.tsx`
- `merchant-portal/src/pages/TPV/KDS/components/OriginBadge.tsx`

---

### 3. Scanners/Leitores QR Code

**Status:** ✅ Configurado e Funcional
**Tipo:** QR Code scanners (via câmera do dispositivo)

**Uso:**

- Leitura de QR codes nas mesas
- Acesso direto à página da mesa
- Rota: `/public/{slug}/mesa/{n}`

**Funcionalidades:**

- ✅ Geração de QR codes para mesas
- ✅ Validação de mesa e restaurante
- ✅ Criação de pedidos via QR
- ✅ Origem `QR_MESA` no KDS

**Componentes:**

- `merchant-portal/src/components/QRCodeGenerator.tsx`
- `merchant-portal/src/pages/Web/QRCodeManager.tsx`
- `merchant-portal/src/pages/Public/TablePage.tsx`

---

### 4. Terminais de Pagamento

**Status:** ✅ Configurado
**Tipo:** Integração com gateways de pagamento

**Funcionalidades:**

- ✅ Processamento de pagamentos
- ✅ Múltiplos métodos (dinheiro, cartão, PIX, etc.)
- ✅ Integração com Stripe (configurável)

**Arquivos relacionados:**

- `merchant-portal/src/pages/TPV/components/PaymentModal.tsx`
- `merchant-portal/src/pages/TPV/components/CheckoutModal.tsx`

---

### 5. Dispositivos Móveis (Tablets/Smartphones)

**Status:** ✅ Configurado
**Tipo:** App Mobile (React Native) e Web Responsivo

**Funcionalidades:**

- ✅ TPV mobile
- ✅ App Staff (garçom)
- ✅ Configuração de periféricos
- ✅ Scanner de QR codes

**Arquivos relacionados:**

- `mobile-app/` (React Native)
- `merchant-portal/src/pages/AppStaff/` (Web)

---

### Displays

**Status:** Configurado
**Tipo:** KDS (Kitchen Display System)

**Configuração:**

- Acessível via: `http://localhost:5173/app/kds`
- Atualização em tempo real via Realtime
- Suporte a múltiplas estações

**Funcionalidades:**

- Exibição de pedidos em tempo real
- Hierarquia visual (NOVO, EM PREPARO, ATRASADO)
- Origem clara (TPV, WEB, QR_MESA, GARÇOM)
- Timer visível com cores
- Ação óbvia (botões claros)

---

### Scanners/Leitores

**Status:** Configurado
**Tipo:** QR Code scanners

**Uso:**

- Leitura de QR codes nas mesas
- Acesso direto à página da mesa
- Rota: `/public/{slug}/mesa/{n}`

**Componentes:**

- `merchant-portal/src/components/QRCodeGenerator.tsx`
- `merchant-portal/src/pages/Web/QRCodeManager.tsx`

---

## 🚀 Comandos Úteis

### Gerenciamento dos Containers

```bash
# Subir todos os serviços
cd docker-core
docker compose -f docker-compose.core.yml up -d

# Parar todos os serviços
docker compose -f docker-compose.core.yml down

# Ver status
docker compose -f docker-compose.core.yml ps

# Ver logs
docker compose -f docker-compose.core.yml logs -f

# Reiniciar um serviço específico
docker compose -f docker-compose.core.yml restart realtime
```

### Reset Completo

```bash
# Parar e remover volumes (limpa tudo)
cd docker-core
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d
```

### Validação

```bash
# Validar Realtime
./scripts/validate-realtime.sh

# Validar Web/QR Mesa
./scripts/validate-web-qr-mesa.sh

# Mostrar tudo
cd docker-core
./show-everything.sh
```

---

## 📊 Status dos Serviços

| Serviço       | Container                 | Porta   | Status     | Saúde   |
| ------------- | ------------------------- | ------- | ---------- | ------- |
| **Postgres**  | `chefiapp-core-postgres`  | `54320` | ✅ Running | Healthy |
| **PostgREST** | `chefiapp-core-postgrest` | `3001`  | ✅ Running | -       |
| **Realtime**  | `chefiapp-core-realtime`  | `4000`  | ✅ Running | -       |

---

## 🔗 Conexões

### Frontend → Backend

**Configuração:** `merchant-portal/.env`

```env
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

**Fluxo:**

1. Frontend conecta ao PostgREST (`http://localhost:3001`)
2. PostgREST expõe RPCs e tabelas
3. Realtime sincroniza mudanças via WebSocket (`ws://localhost:4000`)

---

## 🧪 Testes

### Verificar Conectividade

```bash
# Postgres
docker exec chefiapp-core-postgres pg_isready -U postgres

# PostgREST
curl http://localhost:3001

# Realtime
curl http://localhost:4000/
```

### Verificar Dados

```bash
# Restaurantes
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT id, name, slug FROM gm_restaurants;"

# Mesas
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT id, number, status FROM gm_tables LIMIT 10;"

# Pedidos
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core \
  -c "SELECT id, status, table_number, origin FROM gm_orders ORDER BY created_at DESC LIMIT 5;"
```

---

## 📝 Notas Importantes

### Volumes Docker

Os dados são persistidos em volumes Docker:

- `postgres-core-data` - Dados do PostgreSQL

**Localização física:** Gerenciada pelo Docker (normalmente `~/.docker/volumes/`)

### Rede

Todos os containers estão na mesma rede:

- `chefiapp-core-net` (bridge)

Isso permite comunicação interna entre containers.

### Portas

Portas externas mapeadas:

- `54320` → Postgres (interno: 5432)
- `3001` → PostgREST (interno: 3000)
- `4000` → Realtime (interno: 4000)

**Nota:** Portas escolhidas para evitar conflitos com Supabase local (54322, 54321, etc.)

---

## ✅ Checklist de Validação

- [x] Postgres rodando e saudável
- [x] PostgREST respondendo
- [x] Realtime conectado
- [x] Schema aplicado
- [x] Seeds carregadas
- [x] RPCs funcionando
- [x] Constraints ativas
- [x] Frontend conectado
- [x] Periféricos configurados

---

**Última atualização:** 2026-01-25
