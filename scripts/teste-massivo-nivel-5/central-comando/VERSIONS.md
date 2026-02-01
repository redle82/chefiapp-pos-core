# 📦 VERSÕES E DEPENDÊNCIAS - Central de Comando

**Data do Snapshot:** 2026-01-27  
**Status:** ✅ Validado e Funcional

---

## 🔧 DEPENDÊNCIAS NODE.JS

### Runtime
- **Node.js:** v24.12.0 (ou superior compatível)
- **tsx:** Versão via npx (última estável)
- **pg:** ^8.x (PostgreSQL client)

### Instalação
```bash
npm install pg
# tsx é usado via npx (não precisa instalar globalmente)
```

---

## 🐳 DEPENDÊNCIAS DOCKER

### Docker CLI
- **Versão mínima:** 20.10+
- **Comandos usados:**
  - `docker ps` - Listar containers
  - `docker stats` - Métricas em tempo real
  - `docker inspect` - Detalhes de containers
  - `docker events` - Stream de eventos

### Verificação
```bash
docker --version
# Deve retornar: Docker version 20.10.x ou superior
```

---

## 🗄️ DEPENDÊNCIAS BANCO DE DADOS

### PostgreSQL
- **Versão:** 14+ (recomendado 15+)
- **Extensões opcionais:**
  - `pg_stat_statements` - Para métricas avançadas de queries

### Conexão
- **Host:** localhost (ou configurado via `getDbPool()`)
- **Porta:** 5432 (padrão)
- **Database:** chefiapp_core
- **Usuário:** chefiapp (ou configurado)

### Verificação
```bash
psql -h localhost -U chefiapp -d chefiapp_core -c "SELECT version();"
```

---

## 📋 ESTRUTURA DE TABELAS NECESSÁRIAS

O Central de Comando consulta as seguintes tabelas:

### Obrigatórias
- `public.gm_restaurants`
- `public.gm_orders`
- `public.gm_order_items`
- `public.gm_tasks`
- `public.gm_stock`
- `public.gm_users`
- `public.gm_devices`

### Opcionais (para métricas avançadas)
- `public.gm_events` (se Event System estiver ativo)
- Views do `pg_stat_statements` (se extensão habilitada)

---

## 🌐 NAVEGADORES SUPORTADOS

### Mínimos
- **Chrome/Edge:** 90+
- **Firefox:** 88+
- **Safari:** 14+

### Funcionalidades Requeridas
- **EventSource API** (SSE)
- **Fetch API**
- **ES6+ JavaScript**

### Verificação
```javascript
// No console do navegador (F12)
console.log('EventSource:', typeof EventSource !== 'undefined');
console.log('Fetch:', typeof fetch !== 'undefined');
```

---

## ⚙️ VARIÁVEIS DE AMBIENTE

### Opcionais (RBAC)
```bash
CENTRAL_TOKEN_ENGINEERING=<token>
CENTRAL_TOKEN_OWNER=<token>
CENTRAL_TOKEN_AUDIT=<token>
```

### Configuração do Banco (via getDbPool)
Verificar em `../db.ts` para configuração de conexão.

---

## 🔄 COMPATIBILIDADE

### Testado e Validado
- ✅ macOS (darwin 25.2.0)
- ✅ Node.js v24.12.0
- ✅ Docker 24.x
- ✅ PostgreSQL 15.x

### Não Testado (mas deve funcionar)
- Linux (qualquer distribuição moderna)
- Windows (com WSL2 ou Docker Desktop)
- Node.js 18+ (LTS)

---

## 📝 NOTAS DE ATUALIZAÇÃO

### Mudanças Futuras que Podem Quebrar

1. **Mudança na estrutura de `progress.ndjson`**
   - Impacta: `test-progress.ts`
   - Solução: Atualizar parser em `getPhaseStatus()`

2. **Mudança nas tabelas do banco**
   - Impacta: Todos os collectors
   - Solução: Atualizar queries SQL

3. **Mudança na API do Docker**
   - Impacta: `collectors/infrastructure.ts`
   - Solução: Atualizar comandos Docker

4. **Mudança no formato de eventos SSE**
   - Impacta: JavaScript inline em `html.ts`
   - Solução: Atualizar handlers de EventSource

---

## 🚨 ALERTAS DE VERSÃO

### Node.js
- **⚠️ Node.js < 18:** Não suportado (ESM requerido)
- **✅ Node.js 18+:** Suportado
- **✅ Node.js 20+:** Recomendado

### PostgreSQL
- **⚠️ PostgreSQL < 14:** Pode ter problemas com algumas queries
- **✅ PostgreSQL 14+:** Suportado
- **✅ PostgreSQL 15+:** Recomendado

### Docker
- **⚠️ Docker < 20.10:** Comandos podem falhar
- **✅ Docker 20.10+:** Suportado

---

## 🔗 REFERÊNCIAS

- [Node.js Releases](https://nodejs.org/en/about/releases/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

---

**Última atualização:** 2026-01-27
