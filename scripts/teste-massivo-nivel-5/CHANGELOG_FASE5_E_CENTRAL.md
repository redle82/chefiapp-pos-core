# 📝 CHANGELOG — FASE 5 e Central de Comando

## ✅ Implementações Concluídas

### 1️⃣ FASE 5: Modo Controlado (Reposição Automática)

**Arquivo:** `fase-5-estoque-cascata.ts`

**Mudanças:**
- Adicionado suporte a dois modos via variável de ambiente `FASE_5_MODE`:
  - `cascata` (padrão): Estoque pode chegar a zero → FAIL CORRETO
  - `controlled`: Reposição automática → PASS

**Como usar:**
```bash
# Modo Cascata (padrão - pode falhar corretamente)
npx tsx scripts/teste-massivo-nivel-5/index.ts

# Modo Controlado (reposição automática - passa)
FASE_5_MODE=controlled npx tsx scripts/teste-massivo-nivel-5/index.ts
```

**O que faz:**
- **Modo Controlado:** Executa o **ciclo completo de compras**:
  1. Reduz estoque para níveis críticos (simula consumo real)
  2. Gera lista de compras via `generate_shopping_list` (sistema real)
  3. Simula latência de fornecedor (2-5 segundos por item)
  4. Confirma compras via `confirm_purchase` (sistema real)
  5. Valida que tarefas foram fechadas automaticamente
  
  **Ciclo fechado:** Estoque ↓ → Alerta → Task → Lista de Compras → Compra → Reposição → Estoque ↑
  
- **Modo Cascata:** Comportamento original (pode chegar a zero, sem ciclo de compras)

**Progress Bus:**
- Emite eventos de progresso para `Consumo simulado` e `Reposição automática`

---

### 2️⃣ Central de Comando: Filtro por run_id

**Arquivos:**
- `central-comando/collectors/tasks.ts`
- `central-comando/index.ts`

**Mudanças:**
- `collectTaskEngineMetrics()` agora aceita `runId` opcional
- Queries de SLA e criação de tasks filtram por:
  1. Tasks criadas a partir de pedidos com `metadata->>'run_id' = $1`
  2. Fallback: Tasks de restaurantes do teste (`name LIKE '%n5%' OR slug LIKE '%-n5'`)

**O que faz:**
- Central de Comando agora mostra apenas tasks/SLA do run atual
- Não mistura tasks de runs anteriores
- Mantém histórico (não apaga), apenas filtra visualmente

**Nota:** O filtro funciona melhor quando tasks são criadas a partir de pedidos que têm `run_id` no metadata. Se tasks são criadas diretamente (sem pedido), o fallback usa restaurantes do teste.

---

## 🎯 Resultado Final

### FASE 5
- ✅ Pode passar em modo controlado (reposição automática)
- ✅ Pode falhar corretamente em modo cascata (limite físico)
- ✅ Não trai o Core (ambos os modos respeitam regras de negócio)

### Central de Comando
- ✅ Filtra tasks/SLA por run_id atual
- ✅ Não mistura dados de runs anteriores
- ✅ Mantém histórico (não apaga, apenas filtra)

---

## 📋 Próximos Passos (Opcional)

1. **Melhorar filtro de tasks:**
   - Adicionar `run_id` diretamente nas tasks quando criadas
   - Ou melhorar join com pedidos para filtrar mais precisamente

2. **Encerramento semântico de run:**
   - Marcar tasks não resolvidas como `expired_by_test` no final do run
   - Congelar SLA (parar de contar) sem apagar histórico

3. **UI do Central:**
   - Adicionar toggle "Mostrar apenas run atual" vs "Mostrar histórico"
   - Adicionar indicador visual de qual run está sendo exibido

---

*Changelog gerado em: 26/01/2026*
