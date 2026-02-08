# Teste Massivo Nível 5 — Stress de Realidade Extrema

**Status:** 🚧 EM DESENVOLVIMENTO

---

## 🎯 Objetivo

Descobrir onde o motor começa a dobrar, ranger ou revelar potenciais ocultos quando empurrado além do normal.

**Este teste:**
- Nenhum cliente faria
- Nenhum concorrente testa
- Nenhuma demo mostra
- **Define o limite real do sistema**

---

## 📊 Escala

- **1.000 restaurantes** (400 ambulantes, 350 pequenos, 200 grandes, 50 enterprise)
- **~27.850 mesas**
- **~12.000 pessoas** (identidades simuladas)
- **~500.000 pedidos** (em 7 dias simulados)
- **Multi-dispositivo** (tablet, celular, TPV, QR, Web)
- **Multi-tempo** (simular 7 dias em minutos)

---

## 🚀 Como Executar

### Pré-requisitos

1. Docker Core rodando:
   ```bash
   cd docker-core
   docker-compose up -d
   ```

2. Dependências instaladas:
   ```bash
   npm install
   ```

### Executar Teste

```bash
./scripts/teste-massivo-nivel-5/teste-massivo-nivel-5.sh
```

**⚠️ ATENÇÃO:** Este teste é EXTREMO e pode levar horas.

---

## 📁 Estrutura

```
scripts/teste-massivo-nivel-5/
├── types.ts                    # Tipos e interfaces
├── db.ts                       # Conexão com banco
├── logger.ts                   # Sistema de logging
├── restaurant-profiles.ts      # Perfis de restaurantes
├── fase-0-preflight.ts         # Validação pré-teste
├── fase-1-setup-massivo.ts     # Setup de 1.000 restaurantes
├── fase-2-pedidos-caos.ts       # Pedidos em caos controlado
├── fase-3-kds-stress.ts         # Stress de KDS
├── fase-4-task-extreme.ts      # Task Engine em extremo
├── fase-5-estoque-cascata.ts   # Estoque em cascata
├── fase-6-multi-dispositivo.ts # Multi-dispositivo/concorrência
├── fase-7-time-warp.ts         # Simulação de 7 dias
├── fase-8-relatorio-final.ts   # Relatório final
├── index.ts                    # Orquestrador principal
├── teste-massivo-nivel-5.sh    # Script de execução
└── PROMPT_CURSOR.md            # Prompt completo para implementação
```

---

## 📊 Relatórios Esperados

Após execução, relatórios serão gerados em `test-results/NIVEL_5/<run_id>/`:

### Relatórios Principais (Ler Nesta Ordem)

1. **`MAPA_POTENCIAL.md`** - Onde o sistema brilha
2. **`MAPA_RISCO.md`** - Onde o sistema pode quebrar
3. **`LISTA_UI_CRITICA.md`** - O que a UI PRECISA mostrar
4. **`LISTA_UI_RUIDO.md`** - O que NUNCA deve ser mostrado

**Esses quatro documentos são o DNA do produto visual.**

### Relatórios Complementares

- `RELATORIO_FINAL_NIVEL_5.md` - Resumo executivo
- `METRICAS_TECNICAS.md` - Latência, erros, estado
- `METRICAS_OPERACIONAIS.md` - Tarefas, alertas
- `METRICAS_PRODUTO.md` - Onde fica inteligente/chato/surpreende

---

## 🚨 Regra de Ouro

**Nenhuma UI nova.**  
**Nenhum ajuste cosmético.**  
**Nenhuma feature nova.**

**Somente:**
- Observar
- Medir
- Aprender

**⚠️ IMPORTANTE:** Consulte `REGRA_DE_OURO.md` para regras detalhadas durante e após o teste.

---

## 📋 Status de Implementação

- [x] Estrutura base (types, db, logger)
- [x] FASE 0: Preflight
- [x] FASE 1: Setup Massivo (1.000 restaurantes)
- [x] FASE 2: Pedidos Caos (~500.000 pedidos)
- [x] FASE 3: KDS Stress (produção realista + gargalos)
- [x] FASE 4: Task Extreme (validação completa de tarefas)
- [x] FASE 5: Estoque Cascata (consumo + quebra + compras)
- [x] FASE 6: Multi-Dispositivo (concorrência + validação de estado)
- [x] FASE 7: Time Warp (7 dias simulados + validação de drift)
- [x] FASE 8: Relatório Final (métricas + 8 relatórios)
- [ ] FASE 8: Relatório Final
- [ ] Utilitários (scenario-generator, people-simulator, etc.)

---

**Para implementar as fases restantes, consulte `PROMPT_CURSOR.md`.**

---

## 🎯 Estratégia Pós-Teste

**Após executar o teste:**

1. **Ler os 4 relatórios principais** (nesta ordem)
2. **Congelar o motor** (não mexer mais em Core/Task Engine)
3. **Decidir:** Qual é a menor UI possível que respeita tudo que o sistema já faz bem?

**Consulte `../docs/ESTRATEGIA_POS_TESTE_NIVEL_5.md` para estratégia completa.**
