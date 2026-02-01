# Teste Massivo Nível 4 — End-to-End + Scale

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Objetivo

Validar **end-to-end** todo o sistema ChefIApp rodando **100% local via Docker**, testando:

- ✅ Menu Builder (criação com tempo + estação obrigatório)
- ✅ Inventário + Estoque + Alertas + Lista de Compras
- ✅ Task Engine (tarefas automáticas + tarefas quando não há pedidos)
- ✅ Pedidos multi-origem: QR_MESA, WEB_PUBLIC, TPV, APPSTAFF, MANAGER, OWNER
- ✅ KDS Minimal + KDS "Grande"
- ✅ MiniKDS no AppStaff + MiniTPV no AppStaff
- ✅ Multi-restaurante, multi-mesas, multi-usuários, multi-dispositivos
- ✅ Realtime (Supabase Realtime) + fallback (polling)

---

## 📊 Cenários Evolutivos

### S — Ambulante
- 1 restaurante
- 1 mesa
- 1 estação
- 10 produtos
- 15 ingredientes
- 5 pedidos
- 10 ações paralelas

### M — Restaurante Médio
- 1 restaurante
- 15 mesas
- 2 estações
- 3 garçons
- 30 produtos
- 40 ingredientes
- 50 pedidos
- 50 ações paralelas

### L — Grupo Multi-restaurantes
- 4 restaurantes
- 60 mesas (15 por restaurante)
- 8 garçons (2 por restaurante)
- 2 gerentes
- 1 dono
- 200 produtos (50 por restaurante)
- 240 ingredientes (60 por restaurante)
- 400 pedidos (100 por restaurante)
- 100 ações paralelas

### XL — McDonald's Mode
- 10 restaurantes
- 200 mesas (20 por restaurante)
- 50 garçons (5 por restaurante)
- 20 gerentes (2 por restaurante)
- 10 donos
- 800 produtos (80 por restaurante)
- 1000 ingredientes (100 por restaurante)
- 5000 pedidos (500 por restaurante)
- 200 ações paralelas

---

## 🔄 Fases do Teste

### FASE 0 — Pré-flight
- ✅ Valida containers, endpoints, schema mínimo
- ✅ Gera run_id e pasta de resultados
- ✅ Valida RPCs críticos
- ✅ Valida configuração Realtime

### FASE 1 — Setup Evolutivo
- ✅ Cria datasets para S/M/L/XL
- ✅ Restaurantes, mesas, usuários, categorias, produtos
- ✅ Inventário/estoque inicial coerente por restaurante
- ✅ Menu via MenuBuilder (com tempo + estação)

### FASE 2 — Pedidos Multi-origem (E2E)
- ✅ Cria pedidos via todas as origens:
  - QR_MESA
  - WEB_PUBLIC
  - TPV (CAIXA)
  - APPSTAFF (GARÇOM)
  - APPSTAFF_MANAGER
  - APPSTAFF_OWNER
- ✅ Valida que aparecem no KDS e MiniKDS

### FASE 3 — Produção por Estação
- ✅ Valida tabs e agrupamentos (Cozinha/Bar)
- ✅ Valida timers por item usando prep_time_seconds
- ✅ Gera atrasos artificiais
- ✅ Confirma que tarefas de atraso são geradas

### FASE 4 — Estoque + Consumo + Lista de Compras
- ✅ Simula consumo (após itens preparados/entregues)
- ✅ Força ruptura (produz até ficar abaixo do mínimo)
- ✅ Valida alertas de estoque baixo
- ✅ Valida lista de compras (déficit + sugestão + prioridade)

### FASE 5 — Task Engine Completo
- ✅ Gera tarefas de atraso, estoque baixo, rotina
- ✅ Valida filtragem por estação, prioridade, status
- ✅ Valida que tarefas fecham quando condição some

### FASE 6 — Multi-dispositivo / Concorrência
- ✅ Simula simultaneidade (50–200 ações paralelas)
- ✅ Múltiplos garçons criando itens no mesmo pedido
- ✅ Múltiplos clientes QR na mesma mesa
- ✅ Valida integridade (sem race conditions, sem dados perdidos)

### FASE 7 — Realtime vs Polling
- ✅ Valida Realtime via assinaturas
- ✅ Simula falha e confirma consistência por polling

### FASE 8 — Relatório Final
- ✅ Gera RELATORIO_FINAL_NIVEL_4.md
- ✅ Gera MATRIZ_COBERTURA.md
- ✅ Gera MATRIZ_FALHAS.md
- ✅ Gera PERF.md
- ✅ Gera CHECKLIST_VISUAL.md

---

## 🚀 Como Executar

### Pré-requisitos

1. Docker Core rodando:
   ```bash
   docker compose -f docker-core/docker-compose.core.yml up -d
   ```

2. PostgREST acessível em `http://localhost:3001`

3. Dependências instaladas:
   ```bash
   npm install
   ```

### Executar Teste

```bash
# Cenário padrão (M)
./scripts/teste-massivo-nivel-4.sh

# Cenário específico
./scripts/teste-massivo-nivel-4.sh S  # Ambulante
./scripts/teste-massivo-nivel-4.sh M  # Médio
./scripts/teste-massivo-nivel-4.sh L  # Grande
./scripts/teste-massivo-nivel-4.sh XL # McDonald's Mode
```

### Abrir Interfaces para Validação Visual

```bash
./scripts/abrir-interfaces-teste-nivel-4.sh
```

---

## 📁 Estrutura de Resultados

```
test-results/NIVEL_4/
├── run_info.json              # Metadados do run
├── RELATORIO_FINAL_NIVEL_4.md # Relatório executivo
├── MATRIZ_COBERTURA.md        # Features x Cenários
├── MATRIZ_FALHAS.md           # Falhas e mitigação
├── PERF.md                    # Performance e tempos
├── CHECKLIST_VISUAL.md        # Checklist para validação visual
└── logs/
    ├── test-n4-fase-0-*.log
    ├── test-n4-fase-1-*.log
    └── ...
```

---

## 🔒 Regras Críticas (Invariantes)

1. **Isolamento total por restaurante**: Nenhum pedido/tarefa/estoque cruza restaurante
2. **1 pedido aberto por mesa**: Respeitar constraint — quando precisar testar múltiplas origens na mesma mesa, usar itens multi-origem dentro do MESMO pedido
3. **Cliente nunca vê produção**: CustomerOrderStatusView só mostra status simples
4. **Autoria 100%**: Todo item deve ter `created_by_role` e `created_by_user_id` quando aplicável
5. **Estoque**: Consumo reduz estoque; quando abaixo do mínimo → gera alerta + entra na Lista de Compras
6. **Lista de compras**: Calcula déficit + buffer e retorna prioridade (alto/médio/crítico)
7. **Task Engine**: Gera tarefas por atraso, baixo estoque, previsão de ruptura, fechamento/abertura de turno
8. **Realtime**: Validar que mudanças aparecem via realtime quando disponível; polling mantém consistência quando realtime falhar

---

## ✅ Validações

### Automáticas (via script)
- ✅ Isolamento por restaurante
- ✅ Autoria preservada
- ✅ Tarefas coerentes
- ✅ Estoque consistente
- ✅ Realtime funcional + fallback

### Manuais (via checklist visual)
- ✅ KDS mostra pedidos agrupados por estação
- ✅ Task System mostra tarefas abertas
- ✅ Shopping List mostra itens abaixo do mínimo
- ✅ Menu Builder mostra tempo + estação em produtos

---

## 🧪 Idempotência

Testes são **idempotentes**:
- Dados marcados com `sync_metadata.test = 'nivel4'`
- Dados marcados com `sync_metadata.run_id = <uuid>`
- Limpeza opcional via FASE 0 (fecha pedidos antigos, limpa tarefas)

---

## 📊 Métricas Coletadas

- Restaurantes criados
- Mesas criadas
- Pedidos criados (por origem)
- Itens criados
- Tarefas geradas (por tipo)
- Estoque baixo
- Tempos por fase
- Pedidos/segundo
- Tarefas geradas/segundo

---

## 🎯 Próximos Passos

Após execução bem-sucedida:
1. Revisar relatórios em `test-results/NIVEL_4/`
2. Validar visualmente usando checklist
3. Corrigir erros encontrados
4. Re-executar se necessário

---

**Conclusão:** Teste Massivo Nível 4 valida o sistema end-to-end em escala, garantindo que todas as features funcionam corretamente em cenários reais de uso.
