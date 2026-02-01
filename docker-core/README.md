# ChefIApp Core - Docker Infrastructure

**Banco limpo, schema oficial, zero resíduos.**

Este é o Core oficial do ChefIApp rodando em Docker, desacoplado do Supabase.

---

## 🎯 Objetivo

Criar um ambiente limpo onde:
- ✅ Postgres puro (sem abstrações Supabase)
- ✅ Schema oficial do Core (sem resíduos)
- ✅ RPCs reais (`create_order_atomic`)
- ✅ Constraints constitucionais ativas
- ✅ Zero dados legacy

---

## 🚀 Quick Start

### 1. Subir o Core

**Na raiz do repositório:**
```bash
npm run docker:core:up
```

**Ou dentro de `docker-core`:**
```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

**Aguarde até ver:**
```
chefiapp-core-postgres    | database system is ready to accept connections
```

**Se na consola do browser aparecer `net::ERR_CONNECTION_REFUSED` em `localhost:3001`:** o frontend está em modo backend "docker" mas o Core não está a correr. Subir o Core com os comandos acima e recarregar a página.

### 2. Verificar Status

```bash
docker compose -f docker-compose.core.yml ps
```

**Deve mostrar:**
- `chefiapp-core-postgres` - healthy
- `chefiapp-core-postgrest` - running
- `chefiapp-core-realtime` - running

### 3. Conectar ao Banco

```bash
docker compose -f docker-core/docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core
```

---

## 📊 Endpoints

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Postgres** | `localhost:54320` | Banco de dados |
| **PostgREST** | `http://localhost:3001` | REST API (RPCs) |
| **Realtime** | `ws://localhost:4000` | WebSocket (KDS sync) |

---

## 🔧 Configuração da UI

### Merchant Portal

Atualize `merchant-portal/.env`:

```env
# Core Docker (novo)
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long

# Ou use PostgREST diretamente
VITE_API_BASE=http://localhost:3000
```

**Nota:** A UI não precisa saber que mudou de Supabase para Docker. Ela só precisa da URL correta.

---

## 📦 Migrations

O `core_schema.sql` é aplicado apenas no primeiro `up` (initdb). Migrations adicionais em `schema/migrations/` devem ser aplicadas manualmente após o Core estar rodando.

**Exemplo — coluna `product_mode` (persistência demo/pilot/live):**

```bash
cd docker-core
make migrate-product-mode
```

Isso adiciona `gm_restaurants.product_mode` (demo | pilot | live). Sem essa migration, o modo continua só em sessão na UI.

---

## 🧹 Reset Total

Para limpar tudo e começar do zero:

```bash
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d
```

Isso:
- Remove todos os volumes
- Recria o banco do zero
- Aplica o schema limpo
- Insere seeds mínimas

---

## 📁 Estrutura

```
docker-core/
├── docker-compose.core.yml    # Orquestração
├── schema/
│   ├── core_schema.sql        # Schema oficial do Core
│   └── seeds_dev.sql          # Seeds para desenvolvimento
└── README.md                  # Este arquivo
```

---

## ✅ Validação

Após subir, valide:

```bash
# 1. Verificar se RPC existe
docker compose -f docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "\df create_order_atomic"

# 2. Verificar constraint
docker compose -f docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "\d+ idx_one_open_order_per_table"

# 3. Testar RPC
docker compose -f docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "SELECT create_order_atomic('00000000-0000-0000-0000-000000000100', '[{\"product_id\":\"00000000-0000-0000-0000-000000000001\",\"name\":\"Teste\",\"quantity\":1,\"unit_price\":1000}]'::jsonb);"
```

---

## 🔄 Migração do Supabase

**Fase A (Agora):**
- ✅ Core Docker rodando
- ✅ UI aponta para Docker
- ✅ Supabase congelado (não usado)

**Fase B (Futuro - sem pressa):**
- Decidir se quer Supabase Cloud
- Ou RDS
- Ou bare metal
- Ou Kubernetes

👉 **Isso é decisão de infra, não de produto.**

---

## 🚨 Troubleshooting

### Postgres não sobe
```bash
docker compose -f docker-compose.core.yml logs postgres
```

### PostgREST não conecta
```bash
docker compose -f docker-compose.core.yml logs postgrest
```

### Realtime não funciona
```bash
docker compose -f docker-compose.core.yml logs realtime
```

---

*"Banco novo para sistema novo. Sempre."*
