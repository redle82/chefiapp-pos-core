# Implementação Docker-Only: Página Web + QR Codes

**Data:** 2026-01-25  
**Status:** ✅ Implementado  
**Ambiente:** Docker Core Exclusivo

---

## ✅ Garantias Docker-Only

### 1. Scripts Verificam Docker Core

**Arquivos:**
- `scripts/open-public-web.sh`
- `scripts/open-qr-mesa.sh`

**Validações:**
- ✅ Verifica se `chefiapp-core-postgres` está rodando
- ✅ Verifica se `chefiapp-core-postgrest` está rodando
- ✅ Falha com erro claro se Docker não estiver ativo
- ✅ Não cria serviços locais
- ✅ Não assume backend externo

### 2. URLs Sempre Apontam para Docker

**PostgREST (RPCs):**
- URL: `http://localhost:3001` (Docker Core)
- Configurado em: `merchant-portal/.env` → `VITE_SUPABASE_URL=http://localhost:3001`

**Realtime (WebSocket):**
- URL: `ws://localhost:4000` (Docker Core)
- Conecta automaticamente via Supabase client

**Postgres (Banco):**
- Porta: `54320` (Docker Core)
- Não acessado diretamente pela UI

**Frontend (Vite):**
- Porta: `5173` (local, mas conecta ao Docker Core)
- URLs públicas: `http://localhost:5173/public/{slug}/mesa/{n}`

### 3. Componentes Usam Docker Core

**TablePage.tsx:**
- ✅ Usa `supabase` client (configurado para Docker Core)
- ✅ Validações via PostgREST (`localhost:3001`)
- ✅ Não cria serviços locais

**WebOrderingService.ts:**
- ✅ Usa RPC `create_order_atomic` via PostgREST (Docker)
- ✅ Não faz inserts diretos (respeita Core)
- ✅ Trata erros de constraint do Docker Core

**QRCodeGenerator.tsx:**
- ✅ URLs sempre apontam para `localhost` (Docker)
- ✅ Helper `buildTableQRUrl` não gera URLs externas

### 4. Nenhuma Dependência Externa

**Não usa:**
- ❌ Supabase Cloud
- ❌ Serviços externos
- ❌ Mocks fora do Docker
- ❌ APIs externas (exceto QR code generation API, que é apenas visual)

**Usa apenas:**
- ✅ Docker Core (Postgres + PostgREST + Realtime)
- ✅ Frontend local (Vite) conectado ao Docker Core

---

## 🔧 Configuração Docker Core

### Variáveis de Ambiente

**`merchant-portal/.env`:**
```env
# Docker Core (PostgREST)
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

### Serviços Docker

**Portas:**
- Postgres: `54320`
- PostgREST: `3001`
- Realtime: `4000`

**Comandos:**
```bash
# Subir Docker Core
cd docker-core
docker compose -f docker-compose.core.yml up -d

# Verificar status
docker compose -f docker-compose.core.yml ps

# Ver logs
docker compose -f docker-compose.core.yml logs -f
```

---

## 📋 Checklist de Validação

### Antes de Testar

- [ ] Docker Core rodando (`docker ps | grep chefiapp-core`)
- [ ] PostgREST respondendo (`curl http://localhost:3001`)
- [ ] Realtime respondendo (`curl http://localhost:4000/health`)
- [ ] Frontend rodando (`npm run dev` no merchant-portal)
- [ ] `.env` configurado para Docker Core

### Testes

- [ ] Script `open-public-web.sh` verifica Docker antes de abrir
- [ ] Script `open-qr-mesa.sh` verifica Docker antes de abrir
- [ ] TablePage valida mesa via Docker Core
- [ ] Pedido criado via QR aparece no KDS
- [ ] Origem `QR_MESA` aparece no KDS
- [ ] Constraint `one_open_order_per_table` funciona

---

## 🚫 O Que NÃO Fazer

1. **NÃO criar serviços locais:**
   - Não subir Postgres local
   - Não subir PostgREST local
   - Não usar Supabase local fora do Docker

2. **NÃO usar URLs externas:**
   - Não apontar para Supabase Cloud
   - Não usar APIs externas (exceto QR visual)
   - Não criar mocks fora do Docker

3. **NÃO bypassar Core:**
   - Não fazer inserts diretos
   - Não ignorar constraints
   - Não criar novos conceitos

---

## ✅ Status Final

**Implementação:** ✅ Completa  
**Docker-Only:** ✅ Garantido  
**Core Respeitado:** ✅ Sim  
**Pronto para Testes:** ✅ Sim

---

**Tudo roda exclusivamente no Docker Core. Sem ambiguidade. Sem serviços externos.**
