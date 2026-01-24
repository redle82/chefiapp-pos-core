# HANDOFF - ChefIApp Core

> Documento de transição para continuidade do trabalho no ChefIApp Core.
> Data: 2026-01-24

---

## 🎯 CONTEXTO

O ChefIApp Core foi completamente limpo, validado e protegido. Este documento facilita a transição para a próxima fase de desenvolvimento.

---

## ✅ O QUE FOI FEITO

### Limpeza Total

- **25 arquivos removidos** (código morto, stubs, exemplos)
- **11 diretórios removidos** (vazios ou duplicados)
- **8 edge functions removidas** (não configuradas, não referenciadas)
- **~5,500 linhas removidas**
- **0 regressões funcionais**

### Validação Completa

- **Simulação 24h** validada (964 pedidos, 210 tarefas, 89 escalações)
- **Integridade garantida** (0 orphans, 0 duplicatas)
- **Governança validada** (SLA, escalonamento, hard-blocking)
- **Offline validado** (70/70 pedidos sincronizados - 100%)

### Proteção Formal

- **CORE_MANIFESTO.md** ratificado (lei do sistema)
- **Fail-fast mode** implementado (validação rápida)
- **Simulador** como juiz supremo

---

## 📚 DOCUMENTAÇÃO DISPONÍVEL

### Para Começar

1. **`START_HERE.md`** - Ponto de entrada, navegação rápida
2. **`CORE_MANIFESTO.md`** - Lei do sistema (leia primeiro)
3. **`EXECUTIVE_SUMMARY.md`** - Resumo executivo consolidado

### Para Desenvolver

- **`docs/PROJECT_STATUS.md`** - Estado atual, comandos, métricas
- **`docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`** - Simulador completo
- **`docs/testing/FAIL_FAST_MODE.md`** - Validação rápida
- **`NEXT_STEPS.md`** - Checklist de próximos passos

### Para Referência

- **`docs/refactor/CLEANUP_REPORT.md`** - Relatório de limpeza
- **`docs/refactor/LEGACY_INVENTORY.md`** - Inventário de legacy
- **`SESSION_COMPLETE.md`** - Resumo da sessão

---

## 🚀 COMANDOS ESSENCIAIS

### Validação

```bash
cd docker-tests

# Validação rápida (1 min) - Use durante desenvolvimento
make simulate-failfast

# Validação completa (5 min) - Use antes de commits importantes
make simulate-24h-small

# Assertions de integridade
make assertions
```

### Desenvolvimento

```bash
# Limpar dados
cd docker-tests && make clean

# Iniciar serviços (KDS, Print)
cd docker-tests && make kds-start
```

---

## 🏷️ MARCO HISTÓRICO

**Tag:** `v1.0-core-sovereign`  
**Branch:** `core/frozen-v1`  
**Commits principais:**
- `7ed7483` - Core frozen and ratified
- `11da15e` - Fail-fast mode added
- `43cf7fb` - Executive summary added

**Para continuar:**
```bash
git checkout core/frozen-v1
# ou
git checkout v1.0-core-sovereign
```

---

## ⚠️ REGRAS ABSOLUTAS

### O Core NUNCA Pode

1. **Violar o CORE_MANIFESTO.md**
   - Qualquer violação é regressão arquitetural
   - Deve ser revertida imediatamente

2. **Aceitar código não testado pelo simulador**
   - Se o simulador não exercita, não é Core
   - Código morto = remover

3. **Depender de UI**
   - O Core funciona sem UI
   - UI é consumidor, não fonte de verdade

4. **Ser permissivo**
   - Governança > Conveniência
   - Hard-blocking é feature, não bug

### O Core SEMPRE Deve

1. **Ser validado pelo simulador**
   - Fail-fast durante desenvolvimento
   - Simulação completa antes de merge

2. **Manter integridade**
   - 0 orphans
   - 0 duplicatas
   - 100% de reconciliação

3. **Respeitar o manifesto**
   - Decisões são verificadas, não debatidas
   - Exceções requerem justificativa formal

---

## 🔧 ARQUITETURA ATUAL

### Core (Soberano)

```
docker-tests/simulators/
├── simulate-24h.js          # Simulação completa (24h)
├── simulate-failfast.js     # Validação rápida (1h)
├── kds-kitchen.js           # Consumidor KDS cozinha
├── kds-bar.js               # Consumidor KDS bar
└── print-emulator.js        # Emulador de impressão

docker-tests/task-engine/
├── policies/                # Políticas de governança
│   ├── opening.json
│   ├── closing.json
│   └── cleaning.json
└── escalation-engine.js     # Motor de escalonamento

docker-tests/seeds/
└── profiles/                # Perfis de restaurante
    ├── ambulante.json
    ├── pequeno.json
    ├── medio.json
    ├── grande.json
    └── gigante.json
```

### Princípios Arquiteturais

1. **Event-Driven**
   - Ação → Evento → Reação
   - Eventos são imutáveis, auditáveis, reproduzíveis

2. **Offline-First**
   - Funciona sem conexão
   - Fila local + idempotency keys
   - Reconciliação automática

3. **Governança por SLA**
   - Tarefa criada → SLA definido → Monitoramento → Escalonamento

4. **Fonte Única de Verdade**
   - Pedidos: `gm_orders`
   - Tarefas: `gm_tasks`
   - Eventos: `gm_events`
   - Governança: `task-engine/policies/*.json`

---

## 📊 MÉTRICAS DE VALIDAÇÃO

### Última Simulação Completa

| Métrica | Valor |
|---------|-------|
| Pedidos | 964 |
| Print Jobs | 2,171 |
| Eventos | 994 |
| Tarefas Criadas | 210 |
| Tarefas Completadas | 196 |
| Escalações | 89 |
| Bloqueios de Turno | 45 |
| Orphan Items | 0 |
| Orphan Print Jobs | 0 |
| Offline Synced | 70/70 (100%) |

### Critérios de Sucesso

- ✅ **0 orphans** (items ou print jobs)
- ✅ **0 duplicatas** (reconciliação offline)
- ✅ **100% sincronização** (offline → online)
- ✅ **Governança funcionando** (SLA, escalonamento, hard-blocking)

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Imediato

1. **Push para remote**
   ```bash
   git push -u origin core/frozen-v1
   git push origin v1.0-core-sovereign
   ```

2. **Revisar documentação**
   - Ler `START_HERE.md`
   - Revisar `CORE_MANIFESTO.md`
   - Validar `EXECUTIVE_SUMMARY.md`

### Curto Prazo

1. **Integrar fail-fast no CI/CD**
   - Adicionar step no pipeline
   - Bloquear merge se falhar

2. **Adicionar gate de PRs**
   - Requisito: `make simulate-24h-small` deve passar
   - Documentar em `CONTRIBUTING.md`

3. **Documentar workflow**
   - Como fazer mudanças no Core
   - Quando usar fail-fast vs completo

### Médio Prazo

1. **Retornar à UI** (Core protegido)
2. **Testes com restaurante real**
3. **Piloto pequeno** (1-3 restaurantes)

---

## ⚠️ AVISOS IMPORTANTES

### Não Fazer

- ❌ Adicionar código não testado pelo simulador
- ❌ Violar o CORE_MANIFESTO.md
- ❌ Tornar o Core dependente de UI
- ❌ Remover validações do simulador
- ❌ Aceitar regressões "por conveniência"

### Sempre Fazer

- ✅ Validar com `make simulate-failfast` durante desenvolvimento
- ✅ Validar com `make simulate-24h-small` antes de merge
- ✅ Verificar `make assertions` após mudanças
- ✅ Respeitar o CORE_MANIFESTO.md
- ✅ Documentar decisões importantes

---

## 🆘 TROUBLESHOOTING

### Simulador Falha

1. Verificar integridade: `make assertions`
2. Verificar logs do simulador
3. Verificar dados no banco
4. Revisar mudanças recentes
5. Consultar `docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`

### Violação do Manifesto

1. Revisar `CORE_MANIFESTO.md`
2. Identificar violação específica
3. Decidir: corrigir ou justificar exceção
4. Se exceção: documentar formalmente

### Regressão Detectada

1. Reverter mudança imediatamente
2. Investigar causa raiz
3. Adicionar teste ao simulador
4. Re-aplicar mudança com validação

---

## 📞 CONTATO E SUPORTE

### Documentação

- **Navegação:** `START_HERE.md`
- **Princípios:** `CORE_MANIFESTO.md`
- **Estado:** `docs/PROJECT_STATUS.md`
- **Próximos passos:** `NEXT_STEPS.md`

### Comandos

- **Validação rápida:** `make simulate-failfast`
- **Validação completa:** `make simulate-24h-small`
- **Assertions:** `make assertions`

---

## 🎓 LIÇÕES APRENDIDAS

1. **Limpeza é possível sem regressão** quando há validação automática
2. **Manifesto protege contra feature creep** e decisões ruins
3. **Simulador é juiz supremo** - se passa, está correto
4. **Core soberano** permite evoluir UI sem risco
5. **Fail-fast** acelera desenvolvimento iterativo

---

## 💬 FRASE FINAL

> O ChefIApp Core não é flexível. Não é amigável. Não é permissivo.
> 
> É **correto**.
> 
> E ser correto é mais importante que ser conveniente.

---

*Este documento deve ser atualizado conforme o projeto evolui.*
