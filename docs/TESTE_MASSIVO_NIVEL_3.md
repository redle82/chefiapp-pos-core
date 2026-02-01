# Teste Massivo Nível 3 - ChefIApp POS Core

**Data:** 2026-01-26  
**Objetivo:** Validar TODO o sistema integrado antes de congelar arquitetura.

---

## 🎯 Regras Absolutas

1. Tudo roda dentro do Docker Core (Postgres + PostgREST + Realtime)
2. Nenhum Supabase SDK direto nas UIs — só dockerCoreClient
3. Nenhuma feature nova. Apenas TESTE, LOG, RELATÓRIO
4. Cada falha deve ser: classificada, reproduzível, documentada
5. Se algo não for testável automaticamente, gerar checklist manual

---

## 📋 Escopo Total do Teste

Testar simultaneamente:

- ✅ Multi-restaurante
- ✅ Multi-mesa
- ✅ Multi-cliente (QR / Web)
- ✅ Multi-staff (garçom, gerente, dono)
- ✅ KDS interno
- ✅ Mini KDS
- ✅ KDS público
- ✅ Status individual do cliente
- ✅ Divisão de conta (multi-autor)
- ✅ Menu (tempo + estação)
- ✅ Estoque (ingredientes)
- ✅ Inventário (equipamentos + locais)
- ✅ Task Engine (automática)
- ✅ Realtime + fallback
- ✅ Ondas temporais (T0, T+5, T+15, T+30)

---

## 🚀 Fases do Teste

### FASE 0 — Limpeza ✅

1. Fechar todos os pedidos abertos antigos
2. Limpar tarefas abertas de testes anteriores
3. Resetar estoque para valores conhecidos
4. Garantir banco limpo (sem lixo histórico)

**Entregável:** `test-results/RESET_LOG.md`

---

### FASE 1 — Setup Massivo

Criar via script:

- **Restaurantes:** 4
  - Alpha (bar pequeno) - 5 mesas
  - Beta (restaurante médio) - 10 mesas
  - Gamma (bar + cozinha) - 15 mesas
  - Delta (operação grande) - 30 mesas

- **Locais:** Cozinha, Bar, Estoque seco, Câmara fria
- **Equipamentos:** Geladeira, Freezer, Chapa, Chopeira, Máquina de gelo
- **Ingredientes:** Carne, Pão, Queijo, Limão, Gelo, Cerveja, Água
- **Estoque inicial:** Valores diferentes por restaurante, alguns próximos do mínimo
- **Menu:** 12 produtos por restaurante, BAR e COZINHA misturados, tempos variados (2–15 min), cada produto com BOM completo

**Validar:**
- ✅ Produtos aparecem em QR / TPV / AppStaff / KDS
- ✅ Tempos e estações corretos

---

### FASE 2 — Onda de Pedidos (T0)

Para CADA restaurante:

1. **Mesa 1:**
   - Cliente A (QR)
   - Cliente B (QR)
   - Garçom
   - Gerente (fallback)

2. **Mesa 2:**
   - Cliente Web
   - Garçom

3. **Mesa 3:**
   - TPV direto

**Criar pedidos:**
- ✅ Origem: QR_MESA, WEB, APPSTAFF, MANAGER, TPV
- ✅ Todos no mesmo pedido por mesa
- ✅ Autoria por item preservada

**Validar:**
- ✅ Constraint 1 pedido por mesa
- ✅ Divisão de conta correta
- ✅ Ledger de estoque criado
- ✅ Consumo aplicado

---

### FASE 3 — Task Engine (Reação)

Durante os pedidos:

1. Criar atrasos artificiais
2. Criar consumo abaixo do mínimo
3. Simular pico de pedidos

**Esperado:**
- ✅ Task: ESTOQUE_CRITICO
- ✅ Task: ATRASO_PRODUCAO
- ✅ Task: ACUMULO_DE_PEDIDOS
- ✅ Tasks atribuídas por estação e cargo

**Validar:**
- ✅ Quem vê cada tarefa
- ✅ Se tarefas NÃO aparecem para cliente
- ✅ Se aparecem no AppStaff correto

---

### FASE 4 — Visibilidade

Abrir simultaneamente:

- `/kds-minimal` (cozinha)
- `/garcom` (Mini KDS)
- `/public/:slug/kds` (KDS público)
- `/public/:slug/order/:orderId` (cliente)

**Validar:**
- ✅ Cliente vê só status dele
- ✅ KDS público só READY
- ✅ KDS interno vê tudo
- ✅ Nenhum vazamento de info

---

### FASE 5 — Onda Temporal

**T+5 minutos:**
- Adicionar itens aos pedidos existentes
- Criar novos pedidos em mesas diferentes

**T+15 minutos:**
- Entregar parcialmente pedidos
- Marcar itens READY / DELIVERED

**T+30 minutos:**
- Fechar pedidos
- Verificar tarefas remanescentes
- Verificar estoque final

---

### FASE 6 — Rede / Realtime

1. Derrubar websocket temporariamente
2. Confirmar fallback por polling
3. Restaurar realtime
4. Verificar re-sincronização

---

### FASE 7 — Auditoria Final

Gerar automaticamente:

1. `RELATORIO_FINAL_NIVEL_3.md`
2. `MATRIZ_DE_FALHAS.md`
3. `MATRIZ_DE_COBERTURA.md`
4. `CHECKLIST_VISUAL.md`
5. `logs/` (logs completos)

**Relatório deve responder:**
- Quantos restaurantes
- Quantas mesas
- Quantos pedidos
- Quantos autores
- Quantas tarefas criadas
- Quantos alertas de estoque
- Quantos atrasos detectados
- Quantas falhas reais

---

## ✅ Critério de Aprovação

- ✅ Nenhum vazamento entre restaurantes
- ✅ Nenhum cliente vê produção
- ✅ Autoria 100% preservada
- ✅ Divisão de conta correta
- ✅ Estoque consistente
- ✅ Tasks coerentes
- ✅ Sistema estável no tempo

**Se PASSAR:**
→ Marcar sistema como: **"CORE OPERACIONAL CONGELADO"**

---

## 📁 Entregáveis

- `scripts/teste-massivo-nivel-3.ts`
- `test-results/*`
- `docs/TESTE_MASSIVO_NIVEL_3.md`
- `docs/CORE_CONGELADO.md` (se passar)

---

## 🚀 Execução

```bash
# Executar teste completo
npx ts-node scripts/teste-massivo-nivel-3.ts

# Ver logs
tail -f test-results/logs/test-massivo-nivel-3-*.log

# Ver relatório final
cat test-results/RELATORIO_FINAL_NIVEL_3.md
```

---

*"Teste massivo para validar arquitetura antes de congelar."*
