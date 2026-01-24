# ROADMAP - ChefIApp Core

> Roadmap visual dos próximos níveis após limpeza, validação e ratificação do Core.
> Data: 2026-01-24

---

## 🎯 ESTADO ATUAL

```
✅ Core Soberano (v1.0-core-sovereign)
✅ Engenharia de Core: 🟢 Elite
✅ Governança: 🟢 Raríssimo
✅ Testabilidade: 🟢 Excepcional
🔴 UX/UI: Ainda não é foco
🔴 Go-to-market: Ainda não iniciado
```

**Status:** Core congelado, protegido e documentado.

---

## 🗺️ ROADMAP VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 1: PROTEÇÃO E AUTOMAÇÃO ✅ CONCLUÍDO               │
│  ─────────────────────────────────────────────────────────  │
│  🎯 Objetivo: Proteger o Core com automação                │
│                                                             │
│  ✅ Push para remote                                       │
│  ✅ Integrar fail-fast no CI/CD                            │
│  ✅ Adicionar gates de PR                                  │
│  ✅ Documentar workflow                                    │
│                                                             │
│  Resultado: Core blindado contra regressão ✅              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 2: INTERIOR DO CARRO (Este Mês)                     │
│  ─────────────────────────────────────────────────────────  │
│  🎯 Objetivo: UX sem tocar no motor                        │
│                                                             │
│  ✅ Retornar à UI com calma                                │
│  ✅ Focar em melhorias de UX                               │
│  ✅ Manter Core intacto                                    │
│                                                             │
│  Resultado: UX melhorada, Core intacto                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 3: VALIDAÇÃO REAL (Próximos 2 Meses)               │
│  ─────────────────────────────────────────────────────────  │
│  🎯 Objetivo: Validar Core em operação real                │
│                                                             │
│  ✅ Testes com restaurante piloto                           │
│  ✅ Piloto pequeno (1-3 restaurantes)                      │
│  ✅ Iteração baseada em dados                              │
│                                                             │
│  Resultado: Core validado em produção real                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 4: GO-TO-MARKET (Próximos 3-6 Meses)                │
│  ─────────────────────────────────────────────────────────  │
│  🎯 Objetivo: Entrada no mercado                           │
│                                                             │
│  ✅ Narrativa de produto                                   │
│  ✅ Posicionamento competitivo                             │
│  ✅ Estratégia de entrada                                  │
│                                                             │
│  Resultado: Produto pronto para mercado                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 NÍVEL 1: PROTEÇÃO E AUTOMAÇÃO ✅ CONCLUÍDO

### Objetivo
Proteger o Core com automação, garantindo que nenhuma regressão passe despercebida.

### Tarefas

- [x] **Push para remote** ✅
  ```bash
  git push -u origin core/frozen-v1
  git push origin v1.0-core-sovereign
  ```

- [x] **Integrar fail-fast no CI/CD** ✅
  - Adicionar step no GitHub Actions / GitLab CI
  - Executar `make simulate-failfast` em cada PR
  - Bloquear merge se falhar

- [x] **Adicionar gates de PR** ✅
  - Requisito: `make simulate-24h-small` deve passar
  - Requisito: `make assertions` deve passar
  - Documentar no `CONTRIBUTING.md`

- [x] **Documentar workflow de desenvolvimento** ✅
  - Como fazer mudanças no Core
  - Quando usar fail-fast vs simulação completa
  - Processo de validação antes de commit

### Critérios de Sucesso

- ✅ Todos os PRs validados automaticamente
- ✅ Zero regressões passando pelos gates
- ✅ Workflow claro e documentado

### Status: ✅ CONCLUÍDO (2026-01-24)

**Arquivos criados:**
- `.github/workflows/core-validation.yml` - Workflow de CI/CD
- `docs/LEVEL_1_IMPLEMENTATION.md` - Documentação da implementação

**Arquivos atualizados:**
- `CONTRIBUTING.md` - Seção "Core Development Workflow" adicionada

---

## 🎨 NÍVEL 2: INTERIOR DO CARRO

### Objetivo
Melhorar UX sem tocar no motor (Core).

### Princípios

- ✅ UI consome Core (não governa)
- ✅ UI pode ser reescrita (Core permanece)
- ✅ Nenhuma lógica crítica na UI
- ✅ Validação sempre via simulador

### Tarefas

- [ ] **Auditoria de UI atual**
  - Identificar pontos de fricção
  - Mapear fluxos críticos
  - Priorizar melhorias

- [ ] **Melhorias incrementais**
  - Focar em UX, não em features
  - Manter Core intacto
  - Validar mudanças via simulador

- [ ] **Testes de usabilidade**
  - Validar melhorias com usuários
  - Coletar feedback estruturado
  - Iterar baseado em dados

### Critérios de Sucesso

- ✅ UX melhorada mensuravelmente
- ✅ Core permanece intacto
- ✅ Zero violações do manifesto

---

## 🏪 NÍVEL 3: VALIDAÇÃO REAL

### Objetivo
Validar Core em operação real com restaurantes.

### Tarefas

- [ ] **Identificar restaurante piloto**
  - Critérios: pequeno/médio, aberto a inovação
  - Alinhar expectativas
  - Definir métricas de sucesso

- [ ] **Deploy em produção**
  - Setup inicial
  - Treinamento básico
  - Suporte próximo

- [ ] **Coleta de dados**
  - Métricas operacionais
  - Feedback estruturado
  - Comparação: simulado vs real

- [ ] **Piloto pequeno (1-3 restaurantes)**
  - Expandir validação
  - Refinar baseado em feedback
  - Preparar para escala

### Critérios de Sucesso

- ✅ Core validado em operação real
- ✅ Métricas alinhadas com simulação
- ✅ Feedback incorporado

---

## 🚀 NÍVEL 4: GO-TO-MARKET

### Objetivo
Preparar produto para entrada no mercado.

### Tarefas

- [ ] **Narrativa de produto**
  - Diferencial competitivo claro
  - Casos de uso validados
  - Prova de valor mensurável

- [ ] **Posicionamento**
  - "Sistema operacional de restauração"
  - Não "mais um POS"
  - Governança como diferencial

- [ ] **Estratégia de entrada**
  - Segmento inicial (pequenos/médios)
  - Proposta de valor clara
  - Métricas de sucesso definidas

- [ ] **Preparação comercial**
  - Material de vendas
  - Casos de sucesso
  - Preços e pacotes

### Critérios de Sucesso

- ✅ Narrativa clara e diferenciada
- ✅ Produto pronto para mercado
- ✅ Estratégia de entrada definida

---

## ⚠️ PRINCÍPIO ABSOLUTO

**Em TODOS os níveis:**

```
✅ Core permanece soberano
✅ Manifesto não é violado
✅ Simulador sempre valida
✅ UI nunca governa
✅ Integridade sempre mantida
```

---

## 📊 MÉTRICAS DE PROGRESSO

### Nível 1 ✅ CONCLUÍDO
- [x] CI/CD configurado
- [x] Gates de PR ativos
- [x] Workflow documentado

### Nível 2
- [ ] UX melhorada (métricas)
- [ ] Core intacto (validação)
- [ ] Zero violações do manifesto

### Nível 3
- [ ] 1+ restaurante em produção
- [ ] Métricas validadas
- [ ] Feedback incorporado

### Nível 4
- [ ] Narrativa definida
- [ ] Estratégia de entrada pronta
- [ ] Produto market-ready

---

## 🔗 LINKS RELACIONADOS

- [NEXT_STEPS.md](./NEXT_STEPS.md) - Checklist detalhado
- [HANDOFF.md](./HANDOFF.md) - Documento de transição
- [CORE_MANIFESTO.md](./CORE_MANIFESTO.md) - Lei do sistema
- [START_HERE.md](./START_HERE.md) - Ponto de entrada

---

## 💬 NOTAS

- **Ordem é importante:** Nível 1 → 2 → 3 → 4
- **Core sempre protegido:** Nenhum nível viola o manifesto
- **Validação contínua:** Simulador sempre valida mudanças
- **Iteração baseada em dados:** Feedback real guia evolução

---

*Este roadmap deve ser revisado e atualizado conforme o progresso.*
