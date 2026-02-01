# Migração Core → Docker: Guia Completo

**Data:** 2026-01-25  
**Objetivo:** Desacoplar Core do Supabase, criar banco limpo em Docker

---

## 🎯 Decisão Arquitetural

**Problema Identificado:**
- Supabase local contaminado com dados/resoluções antigas
- Schema com resíduos de decisões passadas
- Banco "cheira a passado"

**Solução:**
- ✅ Criar banco novo, limpo, em Docker
- ✅ Schema oficial do Core (sem resíduos)
- ✅ Postgres puro (sem abstrações Supabase)
- ✅ Supabase vira opção futura (não agora)

---

## 📁 Estrutura Criada

```
docker-core/
├── docker-compose.core.yml    # Orquestração Docker
├── schema/
│   ├── core_schema.sql        # Schema oficial limpo
│   └── seeds_dev.sql          # Seeds mínimas
└── README.md                  # Documentação
```

---

## 🔧 Como Usar

### 1. Subir Core Docker

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

### 2. Configurar UI para Apontar ao Docker

**Merchant Portal `.env`:**

```env
# Antes (Supabase local)
# VITE_SUPABASE_URL=http://127.0.0.1:54321

# Agora (Core Docker)
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

**Ou usar PostgREST diretamente:**

```env
VITE_API_BASE=http://localhost:3000
```

### 3. Validar Funcionamento

```bash
# Verificar RPC
docker compose -f docker-core/docker-compose.core.yml exec postgres \
  psql -U postgres -d chefiapp_core \
  -c "\df create_order_atomic"

# Verificar constraint
docker compose -f docker-core/docker-compose.core.yml exec postgres \
  psql -U postgres -d chefiapp_core \
  -c "\d+ idx_one_open_order_per_table"
```

---

## 🔄 Fluxo de Migração

### Fase A: Desacoplar (Agora)

1. ✅ Core Docker criado
2. ✅ Schema oficial extraído
3. ✅ RPCs preservados
4. ✅ Constraints ativas

**Ação:**
- UI aponta para Docker
- Supabase congelado (não usado)
- Testes validam funcionamento

### Fase B: Validar (Próximo)

1. TPV cria pedidos via Docker
2. KDS recebe via Realtime Docker
3. Dashboard mostra estado
4. Constraints funcionam

**Ação:**
- Validar fluxo completo
- Documentar diferenças (se houver)
- Ajustar UI se necessário

### Fase C: Decidir Futuro (Sem Pressa)

**Opções:**
- Supabase Cloud (se quiser abstrações)
- RDS (se quiser AWS)
- Bare Metal (se quiser controle total)
- Kubernetes (se quiser escala)

👉 **Isso é decisão de infra, não de produto.**

---

## ✅ Vantagens do Docker Core

### 1. Banco Limpo
- Zero dados legacy
- Zero decisões antigas
- Schema oficial apenas

### 2. Controle Total
- Postgres puro
- Sem abstrações
- Logs claros

### 3. Reset Fácil
```bash
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up -d
```

### 4. Portabilidade
- Roda em qualquer lugar
- Não depende de Supabase
- Fácil de migrar

---

## 🚨 O Que NÃO Mudou

### Core Permanece Íntegro
- ✅ Constraints ativas
- ✅ RPCs funcionando
- ✅ Regras constitucionais preservadas

### UI Permanece Compatível
- ✅ Mesmos contratos (RPCs)
- ✅ Mesmos eventos (Realtime)
- ✅ Mesma interface

### Testes Permanecem Válidos
- ✅ Simulador funciona
- ✅ Asserts validam
- ✅ Métricas corretas

---

## 📊 Comparação

| Aspecto | Supabase Local | Docker Core |
|--------|----------------|-------------|
| **Banco** | Contaminado | Limpo |
| **Schema** | Resíduos antigos | Oficial apenas |
| **Dados** | Legacy + novos | Apenas novos |
| **Reset** | Complexo | `down -v` |
| **Portabilidade** | Supabase-specific | Universal |
| **Controle** | Abstrações | Total |

---

## 🎯 Próximos Passos

1. **Subir Docker Core:**
   ```bash
   cd docker-core
   docker compose -f docker-compose.core.yml up -d
   ```

2. **Atualizar UI:**
   - Modificar `.env` para apontar ao Docker
   - Testar TPV → KDS → Dashboard

3. **Validar:**
   - Criar pedido
   - Ver constraint funcionar
   - Ver Realtime funcionar

4. **Congelar Supabase:**
   - Não usar mais
   - Manter como backup
   - Migrar dados se necessário (futuro)

---

## 💬 Perguntas Frequentes

### "Perco dados do Supabase?"
Não. Supabase continua lá. Você só para de usar. Pode migrar dados depois se quiser.

### "UI precisa mudar?"
Não. UI só precisa de URL diferente. Contratos (RPCs) são os mesmos.

### "Testes precisam mudar?"
Não. Testes validam Core, não infraestrutura específica.

### "Posso voltar ao Supabase?"
Sim. É só trocar URL de volta. Core é independente de infraestrutura.

---

*"Banco novo para sistema novo. Sempre."*

*"O Core merece um banco à altura dele."*
