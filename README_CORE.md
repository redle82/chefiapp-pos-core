# ChefIApp Core - README

> Sistema Operacional de Restauração - Validado, Protegido e Soberano

---

## 🎯 VISÃO GERAL

O ChefIApp Core é um **sistema operacional de restauração** que governa operações, não apenas registra vendas. Foi completamente limpo, validado por simulação de 24 horas, e protegido por manifesto formal.

**Status:** ✅ Core Soberano (v1.0-core-sovereign)

---

## 🚀 QUICK START

### Para Entender o Sistema

1. Leia [`START_HERE.md`](./START_HERE.md) - Navegação rápida
2. Leia [`CORE_MANIFESTO.md`](./CORE_MANIFESTO.md) - Lei do sistema
3. Leia [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md) - Resumo executivo

### Para Validar o Core

```bash
cd docker-tests

# Validação rápida (1 min)
make simulate-failfast

# Validação completa (5 min)
make simulate-24h-small

# Assertions de integridade
make assertions
```

---

## 📚 DOCUMENTAÇÃO

### Documentos Principais

| Documento | Descrição |
|----------|-----------|
| [`START_HERE.md`](./START_HERE.md) | Ponto de entrada |
| [`CORE_MANIFESTO.md`](./CORE_MANIFESTO.md) | Lei do sistema |
| [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md) | Resumo executivo |
| [`HANDOFF.md`](./HANDOFF.md) | Documento de transição |
| [`NEXT_STEPS.md`](./NEXT_STEPS.md) | Checklist de próximos passos |

### Documentação Técnica

| Documento | Descrição |
|----------|-----------|
| [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md) | Estado atual |
| [`docs/CORE_ARCHITECTURE.md`](./docs/CORE_ARCHITECTURE.md) | Arquitetura |
| [`docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`](./docs/testing/MEGA_OPERATIONAL_SIMULATOR.md) | Simulador |
| [`docs/testing/FAIL_FAST_MODE.md`](./docs/testing/FAIL_FAST_MODE.md) | Fail-fast |

---

## ✅ VALIDAÇÃO

### Última Simulação Completa

- **Pedidos:** 964
- **Tarefas:** 210 criadas, 196 completadas
- **Escalações:** 89
- **Orphan Items:** 0
- **Orphan Print Jobs:** 0
- **Offline Synced:** 70/70 (100%)

### Comandos de Validação

```bash
# Validação rápida (1 min)
make simulate-failfast

# Validação completa (5 min)
make simulate-24h-small

# Validação com perfis grandes
make simulate-24h-large

# Validação com perfis gigantes
make simulate-24h-giant

# Assertions de integridade
make assertions
```

---

## 🏷️ MARCO HISTÓRICO

**Tag:** `v1.0-core-sovereign`  
**Branch:** `core/frozen-v1`  
**Data:** 2026-01-24

Este marco representa o momento em que o ChefIApp Core foi:
- ✅ Completamente limpo de código morto
- ✅ Validado por simulação de 24 horas
- ✅ Protegido por manifesto formal
- ✅ Tornado soberano (independente de UI)

---

## 📊 ESTADO ATUAL

| Aspecto | Status |
|---------|--------|
| Core Limpo | ✅ |
| Core Validado | ✅ |
| Core Protegido | ✅ |
| Core Testável | ✅ |
| Core Soberano | ✅ |

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

1. **Governança > Conveniência**
2. **Integridade > Velocidade**
3. **Offline é Estado Válido**
4. **UI é Descartável**
5. **Se o Simulador Não Exercita, Não é Core**

---

## 🔗 LINKS RÁPIDOS

- [Começar Aqui](./START_HERE.md)
- [Manifesto do Core](./CORE_MANIFESTO.md)
- [Resumo Executivo](./EXECUTIVE_SUMMARY.md)
- [Handoff](./HANDOFF.md)
- [Próximos Passos](./NEXT_STEPS.md)

---

## 💬 FRASE FINAL

> O ChefIApp Core não é flexível. Não é amigável. Não é permissivo.
> 
> É **correto**.
> 
> E ser correto é mais importante que ser conveniente.

---

*Última atualização: 2026-01-24*
