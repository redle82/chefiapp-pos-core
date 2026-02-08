# 🚀 GUIA RÁPIDO DE USO — ChefIApp Core

**Versão:** 1.0.0  
**Data:** 2026-01-25  
**Status:** ✅ Sistema Funcional

---

## 🎯 INÍCIO RÁPIDO

### 1. Subir o Docker Core

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

**Aguarde até ver:**
```
chefiapp-core-postgres    | database system is ready to accept connections
```

### 2. Verificar Status

```bash
docker compose -f docker-compose.core.yml ps
```

**Deve mostrar:**
- `chefiapp-core-postgres` - healthy
- `chefiapp-core-postgrest` - running
- `chefiapp-core-realtime` - running

### 3. Subir o Frontend

```bash
cd merchant-portal
npm run dev
```

**Frontend estará em:** `http://localhost:5175`

---

## 📍 URLs PRINCIPAIS

### KDS (Kitchen Display System)
```
http://localhost:5175/kds-minimal
```
- Exibe pedidos ativos
- Origem, timer, estados visuais
- Ação de mudança de estado
- Realtime ativo (🟢)

### Página Web Pública
```
http://localhost:5175/public/restaurante-piloto
```
- Menu completo do restaurante
- Carrinho funcional
- Criação de pedidos (origem: WEB_PUBLIC)

### QR Mesa
```
http://localhost:5175/public/restaurante-piloto/mesa/1
```
- Menu por mesa
- Criação de pedidos associados à mesa
- Origem: QR_MESA

---

## 🧪 TESTES RÁPIDOS

### Testar Criação de Pedido via Web

1. Abra: `http://localhost:5175/public/restaurante-piloto`
2. Adicione produtos ao carrinho
3. Clique em "Finalizar Pedido"
4. Verifique no KDS: `http://localhost:5175/kds-minimal`
5. Pedido deve aparecer com badge "🌐 WEB"

### Testar Criação de Pedido via QR Mesa

1. Abra: `http://localhost:5175/public/restaurante-piloto/mesa/1`
2. Adicione produtos ao carrinho
3. Clique em "Finalizar Pedido"
4. Verifique no KDS
5. Pedido deve aparecer com badge "📋 QR MESA" e mostrar "Mesa: 1"

### Testar Mudança de Estado no KDS

1. Abra: `http://localhost:5175/kds-minimal`
2. Encontre um pedido com status "OPEN"
3. Clique em "Iniciar Preparo"
4. Status deve mudar para "IN_PREP"
5. Botão deve desaparecer

### Testar Realtime

1. Abra o KDS em uma aba
2. Crie um pedido via web em outra aba
3. Pedido deve aparecer automaticamente no KDS (sem refresh)
4. Indicador deve mostrar "🟢 Realtime Ativo"

---

## 🔧 COMANDOS ÚTEIS

### Docker Core

```bash
# Ver logs
docker compose -f docker-core/docker-compose.core.yml logs -f

# Reiniciar serviços
docker compose -f docker-core/docker-compose.core.yml restart

# Parar tudo
docker compose -f docker-core/docker-compose.core.yml down

# Reset total (remove volumes)
docker compose -f docker-core/docker-compose.core.yml down -v
docker compose -f docker-core/docker-compose.core.yml up -d
```

### Banco de Dados

```bash
# Conectar ao banco
docker exec -it chefiapp-core-postgres psql -U postgres -d chefiapp_core

# Ver pedidos ativos
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT id, status, origin, total_cents FROM gm_orders WHERE status IN ('OPEN', 'IN_PREP', 'READY') ORDER BY created_at DESC LIMIT 10;"

# Ver mesas
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT number, status FROM gm_tables ORDER BY number;"
```

### Testes Automatizados

```bash
# Executar todos os testes
./scripts/test-fase0-estado-zero.sh
./scripts/test-fase1-contrato-core.sh
./scripts/test-fase2-kds-minimal.sh
# ... etc
```

---

## 🐛 TROUBLESHOOTING

### KDS não mostra pedidos

1. Verificar se Docker Core está rodando:
   ```bash
   docker ps | grep chefiapp-core
   ```

2. Verificar se há pedidos no banco:
   ```bash
   docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
     "SELECT COUNT(*) FROM gm_orders WHERE status IN ('OPEN', 'IN_PREP', 'READY');"
   ```

3. Verificar logs do PostgREST:
   ```bash
   docker logs chefiapp-core-postgrest --tail 20
   ```

### Realtime não conecta

1. Verificar `wal_level`:
   ```bash
   docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SHOW wal_level;"
   # Deve retornar: logical
   ```

2. Verificar publicação:
   ```bash
   docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
     "SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';"
   ```

3. Verificar logs do Realtime:
   ```bash
   docker logs chefiapp-core-realtime --tail 20
   ```

4. Reiniciar Realtime:
   ```bash
   cd docker-core && docker compose -f docker-compose.core.yml restart realtime
   ```

### Erro 401 Unauthorized

1. Verificar se PostgREST não tem JWT:
   ```bash
   docker exec chefiapp-core-postgrest printenv | grep JWT
   # Não deve retornar nada
   ```

2. Reiniciar PostgREST:
   ```bash
   cd docker-core && docker compose -f docker-compose.core.yml restart postgrest
   ```

### Erro 404 Not Found

1. Verificar se está usando URL correta (sem `/rest/v1/`):
   - ✅ Correto: `http://localhost:3001/gm_orders`
   - ❌ Errado: `http://localhost:3001/rest/v1/gm_orders`

---

## 📊 ESTRUTURA DO PROJETO

```
chefiapp-pos-core/
├── docker-core/                    # Infraestrutura Docker
│   ├── docker-compose.core.yml     # Orquestração
│   └── schema/
│       ├── core_schema.sql         # Schema oficial
│       ├── seeds_dev.sql          # Dados de desenvolvimento
│       └── realtime_setup.sql     # Setup do Realtime
├── merchant-portal/                # Frontend React
│   └── src/
│       ├── core-boundary/          # Camada de separação Core-UI
│       │   ├── docker-core/        # Conexão e tipos
│       │   ├── readers/            # Leitura do Core
│       │   └── writers/            # Escrita no Core
│       └── pages/
│           ├── KDSMinimal/         # KDS mínimo
│           └── PublicWeb/          # Páginas públicas
├── scripts/                        # Scripts de teste
│   └── test-fase*.sh               # Testes automatizados
└── docs/                           # Documentação
    ├── RECONSTRUCAO_DISCIPLINADA_STATUS.md
    ├── RECONSTRUCAO_FINAL_SUMMARY.md
    └── REALTIME_SETUP.md
```

---

## 🎯 PRÓXIMOS PASSOS

### Imediato
1. ✅ Validar Realtime funcionando
2. ✅ Remover restaurant ID hardcoded
3. ✅ Testar fluxo completo

### Curto Prazo
1. Melhorar tratamento de erros
2. Adicionar loading states
3. Otimizar performance

### Médio Prazo
1. Testes E2E automatizados
2. Melhorias de UX/UI
3. Preparação para deploy

---

**Última atualização:** 2026-01-25
