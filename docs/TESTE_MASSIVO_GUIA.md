# 🧪 Guia: Teste Massivo Integrado

**Data:** 2026-01-26  
**Objetivo:** Validar TODO o sistema de pedidos rodando 100% no Docker Core

---

## 🎯 Objetivo

Executar um **TESTE MASSIVO e INTEGRADO** de TODO o sistema de pedidos do ChefIApp, rodando 100% dentro do Docker, validando fluxo técnico + visual + humano antes de qualquer refatoração.

> **⚠️ NOTA:** Este é um **TESTE INTEGRADO PRÉ-MASSIVO**. Para teste realmente massivo (múltiplos autores, mesma mesa, carga simultânea), execute também `teste-massivo-cenario-completo.sh`.

---

## 📋 Escopo Obrigatório

### 1. ORIGENS DE PEDIDO

- [ ] QR Mesa (múltiplos dispositivos, mesma mesa)
- [ ] Página Web Pública
- [ ] TPV Caixa
- [ ] AppStaff (waiter)
- [ ] AppStaff (manager – fallback)
- [ ] AppStaff (owner – excepcional)

### 2. INTERFACES A SEREM ABERTAS SIMULTANEAMENTE

- [ ] Página pública Web
- [ ] Página de Mesa via QR
- [ ] TPV
- [ ] Mini TPV (waiter)
- [ ] Mini TPV (manager)
- [ ] Mini TPV (owner)
- [ ] KDS Completo
- [ ] Mini KDS (waiter / manager / owner)

### 3. CENÁRIOS DE TESTE

- [ ] Múltiplos pedidos na mesma mesa (itens de autores diferentes)
- [ ] Divisão de conta por autoria
- [ ] Pedido criado em todos os canais acima
- [ ] Todos os pedidos aparecem:
  - [ ] no KDS
  - [ ] no Mini KDS correto
- [ ] Origem correta exibida (APPSTAFF, APPSTAFF_MANAGER, APPSTAFF_OWNER, QR_MESA, WEB, TPV)
- [ ] Status atualizando corretamente
- [ ] Realtime ativo + polling fallback funcionando

### 4. TESTES DE CARGA FUNCIONAL

- [ ] Criar pedidos simultâneos
- [ ] Criar pedidos sequenciais
- [ ] Criar pedidos com QR em paralelo com AppStaff
- [ ] Confirmar constraint: 1 pedido aberto por mesa
- [ ] Confirmar autoria correta por item

### 5. TESTES VISUAIS

- [ ] Verificar:
  - [ ] hierarquia correta no KDS
  - [ ] Mini KDS sem excesso de informação
  - [ ] Cliente vendo apenas Customer Status View
  - [ ] Cozinha nunca vendo UI de cliente

---

## 🚀 Como Executar

### Passo 1: Preparar Ambiente

```bash
# 1. Verificar Docker Core está rodando
cd docker-core
docker-compose -f docker-compose.core.yml up -d

# 2. Verificar Merchant Portal está rodando
cd merchant-portal
npm run dev
```

### Passo 2: Executar Teste Automatizado

```bash
# Executar script de teste massivo
./scripts/teste-massivo-integrado.sh
```

Este script irá:
- ✅ Verificar pré-requisitos (Docker Core, PostgREST, Realtime)
- ✅ Executar testes automatizados
- ✅ Gerar checklist
- ✅ Gerar relatório inicial

### Passo 3: Abrir Todas as Interfaces

```bash
# Abrir todas as interfaces simultaneamente
./scripts/abrir-interfaces-teste.sh
```

### Passo 4: Criar Pedidos de Todas as Origens

```bash
# Criar pedidos programaticamente
./scripts/criar-pedidos-todas-origens.sh
```

### Passo 4b: Teste Massivo Real (Opcional - Recomendado)

```bash
# Teste massivo: múltiplos autores, mesma mesa, cenário completo
./scripts/teste-massivo-cenario-completo.sh
```

Este script testa:
- ✅ Múltiplos dispositivos QR na mesma mesa
- ✅ Itens de autores diferentes no mesmo pedido
- ✅ Garçom + Gerente + Clientes juntos
- ✅ Divisão de conta por autoria

### Passo 5: Validar Autoria e Divisão

```bash
# Validar autoria e divisão de conta
./scripts/validar-autoria-divisao.sh
```

### Passo 6: Preencher Checklist Manual

1. Abra o arquivo de checklist gerado: `test-results/checklist-YYYYMMDD_HHMMSS.md`
2. Teste cada item manualmente
3. Marque como ✅ ou ❌
4. Tire prints das telas quando necessário

### Passo 7: Gerar Relatório Final

O relatório será gerado automaticamente em: `test-results/relatorio-final-YYYYMMDD_HHMMSS.md`

Preencha o status final: **PASSOU** ou **FALHOU**

---

## 📊 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `teste-massivo-integrado.sh` | Script principal - executa testes automatizados e gera checklist/relatório |
| `teste-massivo-cenario-completo.sh` | **Teste massivo real** - múltiplos autores, mesma mesa, cenário completo |
| `abrir-interfaces-teste.sh` | Abre todas as interfaces necessárias para teste visual |
| `criar-pedidos-todas-origens.sh` | Cria pedidos programaticamente de todas as origens |
| `validar-autoria-divisao.sh` | Valida autoria nos itens e divisão de conta |

### ⚠️ Limitações Conhecidas

- **Validação visual:** 100% manual (requer checklist preenchido)
- **Realtime completo:** Requer teste visual no KDS (script apenas verifica acessibilidade)
- **Teste massivo real:** Execute `teste-massivo-cenario-completo.sh` para cenário completo

---

## ✅ Critérios de Aprovação

- [ ] Todos os fluxos funcionam
- [ ] Nenhuma origem incorreta
- [ ] Nenhuma UI errada visível
- [ ] Nenhuma duplicação
- [ ] Nenhum bypass do Core

---

## 🔍 Comandos Úteis

### Ver Pedidos Criados

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    id, 
    origin, 
    status, 
    table_number,
    created_at
FROM gm_orders 
WHERE sync_metadata->>'test' = 'true' 
ORDER BY created_at DESC;
"
```

### Ver Itens com Autoria

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    oi.name_snapshot,
    oi.created_by_role,
    oi.created_by_user_id,
    oi.device_id,
    o.origin,
    oi.subtotal_cents / 100.0 as valor_reais
FROM gm_order_items oi
JOIN gm_orders o ON oi.order_id = o.id
WHERE o.sync_metadata->>'test' = 'true'
ORDER BY oi.created_at;
"
```

### Ver Divisão de Conta por Pedido

```bash
# Substituir <ORDER_ID> pelo ID do pedido
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    oi.created_by_role,
    oi.created_by_user_id,
    oi.device_id,
    COUNT(*) as item_count,
    SUM(oi.subtotal_cents) / 100.0 as total_reais
FROM gm_order_items oi
WHERE oi.order_id = '<ORDER_ID>'
GROUP BY oi.created_by_role, oi.created_by_user_id, oi.device_id
ORDER BY total_reais DESC;
"
```

### Verificar Constraint (1 pedido por mesa)

```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    table_number,
    COUNT(*) as open_orders
FROM gm_orders
WHERE status = 'OPEN' 
  AND table_number IS NOT NULL
GROUP BY table_number
HAVING COUNT(*) > 1;
"
```

---

## 📝 Checklist de Validação Visual

### Interfaces Públicas (Cliente)

- [ ] **Página Web Pública**
  - [ ] Abre corretamente
  - [ ] Mostra apenas Customer Status View
  - [ ] Não mostra KDS ou Mini KDS
  - [ ] Permite criar pedido

- [ ] **Página de Mesa via QR**
  - [ ] Abre corretamente
  - [ ] Mostra apenas Customer Status View
  - [ ] Permite criar pedido
  - [ ] device_id único por dispositivo

### Interfaces Operacionais

- [ ] **TPV**
  - [ ] Abre corretamente
  - [ ] Permite criar pedido
  - [ ] Mostra pedidos ativos
  - [ ] Origem correta (TPV/CAIXA)

- [ ] **AppStaff (waiter)**
  - [ ] Abre MiniPOS corretamente
  - [ ] Permite criar pedido
  - [ ] Origem correta (APPSTAFF)
  - [ ] Autoria correta (waiter)

- [ ] **AppStaff (manager)**
  - [ ] Abre MiniPOS corretamente
  - [ ] Permite criar pedido
  - [ ] Origem correta (APPSTAFF_MANAGER)
  - [ ] Autoria correta (manager)

- [ ] **AppStaff (owner)**
  - [ ] Abre MiniPOS corretamente
  - [ ] Permite criar pedido
  - [ ] Origem correta (APPSTAFF_OWNER)
  - [ ] Autoria correta (owner)

### KDS

- [ ] **KDS Completo**
  - [ ] Abre corretamente
  - [ ] Mostra todos os pedidos
  - [ ] Mostra origem correta (badges)
  - [ ] Permite atualizar status
  - [ ] Realtime funcionando

- [ ] **Mini KDS**
  - [ ] Abre corretamente
  - [ ] Mostra pedidos simplificados
  - [ ] Não mostra excesso de informação
  - [ ] Permite acompanhamento

---

## 🎯 Validações Técnicas

### Autoria nos Itens

- [ ] Todos os itens têm `created_by_user_id`
- [ ] Todos os itens têm `created_by_role`
- [ ] QR Mesa tem `device_id` único
- [ ] Query de divisão funciona corretamente

### Constraint

- [ ] Constraint `idx_one_open_order_per_table` respeitada
- [ ] Tentativa de criar segundo pedido na mesma mesa falha
- [ ] Mensagem de erro clara
- [ ] Pedido existente não é afetado

### Origem dos Pedidos

- [ ] APPSTAFF → badge correto
- [ ] APPSTAFF_MANAGER → badge correto
- [ ] APPSTAFF_OWNER → badge correto
- [ ] QR_MESA → badge correto
- [ ] WEB → badge correto
- [ ] TPV → badge correto

### Realtime

- [ ] Realtime ativo
- [ ] Polling fallback funcionando
- [ ] Status sincronizado entre interfaces
- [ ] Pedidos aparecem imediatamente no KDS

---

## 📄 Artefatos Gerados

Após executar o teste, os seguintes arquivos serão gerados em `test-results/`:

1. **`teste-massivo-YYYYMMDD_HHMMSS.log`** - Log completo do teste
2. **`checklist-YYYYMMDD_HHMMSS.md`** - Checklist para preenchimento manual
3. **`relatorio-final-YYYYMMDD_HHMMSS.md`** - Relatório final com resultados

---

## ⚠️ Regras Importantes

- ❌ **NÃO alterar código durante o teste**
- ❌ **NÃO refatorar nada**
- ✅ **APENAS registrar resultados**
- ✅ **Tudo deve rodar com Docker Core ativo**

---

## 🎯 Status Final

Após completar todos os testes, marque o status final no relatório:

- ⬜ **PASSOU** - Todos os critérios atendidos
- ⬜ **FALHOU** - Um ou mais critérios não atendidos

---

**Documentação criada em:** 2026-01-26
