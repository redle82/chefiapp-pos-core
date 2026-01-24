# START HERE - ChefIApp Core

> Ponto de entrada para entender o estado atual do ChefIApp Core.

---

## 🎯 QUICK START

### Para Entender o Sistema

1. **Leia primeiro:** [`CORE_MANIFESTO.md`](./CORE_MANIFESTO.md)
   - Define o que o Core É e NUNCA SERÁ
   - Princípios não negociáveis
   - Regras para o futuro

2. **Resumo executivo:** [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md)
   - Visão consolidada de tudo que foi alcançado
   - Diferencial competitivo
   - Capacidades validadas

3. **Estado atual:** [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md)
   - Arquitetura atual
   - Comandos disponíveis
   - Métricas de validação

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

## 📚 DOCUMENTAÇÃO COMPLETA

### Documentos Estratégicos

| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [`CORE_MANIFESTO.md`](./CORE_MANIFESTO.md) | Lei do sistema | **Primeiro** |
| [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md) | Resumo executivo | Apresentações |
| [`SESSION_COMPLETE.md`](./SESSION_COMPLETE.md) | Resumo da sessão | Handoff |
| [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md) | Estado atual | Referência |

### Documentação Técnica

| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [`docs/CORE_ARCHITECTURE.md`](./docs/CORE_ARCHITECTURE.md) | Arquitetura do Core | Desenvolvimento |
| [`docs/CORE_VALIDATION_CERTIFICATE.md`](./docs/CORE_VALIDATION_CERTIFICATE.md) | Certificado de validação | Validação |
| [`docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`](./docs/testing/MEGA_OPERATIONAL_SIMULATOR.md) | Simulador completo | Testes |
| [`docs/testing/FAIL_FAST_MODE.md`](./docs/testing/FAIL_FAST_MODE.md) | Modo fail-fast | Desenvolvimento |

### Documentação de Refatoração

| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [`docs/refactor/CLEANUP_REPORT.md`](./docs/refactor/CLEANUP_REPORT.md) | Relatório de limpeza | Histórico |
| [`docs/refactor/LEGACY_INVENTORY.md`](./docs/refactor/LEGACY_INVENTORY.md) | Inventário de legacy | Referência |

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

## 🚀 COMANDOS ESSENCIAIS

### Validação

```bash
cd docker-tests

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

# Relatório da última simulação
make report-24h
```

### Desenvolvimento

```bash
# Limpar dados
cd docker-tests && make clean

# Iniciar serviços (KDS, Print)
cd docker-tests && make kds-start
```

---

## 📊 ESTADO ATUAL

| Aspecto | Status |
|---------|--------|
| Core Limpo | ✅ |
| Core Validado | ✅ |
| Core Protegido | ✅ |
| Core Testável | ✅ |
| Core Soberano | ✅ |

**Última validação:**
- Pedidos: 964
- Tarefas: 210 criadas, 196 completadas
- Escalações: 89
- Orphan Items: 0
- Orphan Print Jobs: 0

---

## 🎯 PRÓXIMOS PASSOS

### Imediato

```bash
# Push para remote
git push -u origin core/frozen-v1
git push origin v1.0-core-sovereign
```

### Curto Prazo

- [ ] Integrar fail-fast no CI/CD
- [ ] Adicionar gate de PRs (simulador obrigatório)
- [ ] Documentar workflow de desenvolvimento

### Médio Prazo

- [ ] Retornar à UI com calma (Core protegido)
- [ ] Testes com restaurante real
- [ ] Piloto pequeno

---

## 💡 PRINCÍPIOS FUNDAMENTAIS

1. **Governança > Conveniência**
2. **Integridade > Velocidade**
3. **Offline é Estado Válido**
4. **UI é Descartável**
5. **Se o Simulador Não Exercita, Não é Core**

---

## 🔗 LINKS RÁPIDOS

- [Manifesto do Core](./CORE_MANIFESTO.md)
- [Resumo Executivo](./EXECUTIVE_SUMMARY.md)
- [Estado do Projeto](./docs/PROJECT_STATUS.md)
- [Simulador](./docs/testing/MEGA_OPERATIONAL_SIMULATOR.md)
- [Fail-Fast Mode](./docs/testing/FAIL_FAST_MODE.md)

---

## 📞 CONTATO

Para dúvidas sobre o Core, consulte:
- `CORE_MANIFESTO.md` para princípios
- `docs/PROJECT_STATUS.md` para estado atual
- `docs/testing/MEGA_OPERATIONAL_SIMULATOR.md` para validação

---

*Última atualização: 2026-01-24*
